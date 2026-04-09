export const MAX_FACETS = 128
export const MAX_BOUNCES = 6

export const VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform float uScale;
uniform int uView;
uniform float uRotation;

varying vec3 vPosition;
varying vec3 vNormal;

mat3 rotateY(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat3(
    c, 0.0, -s,
    0.0, 1.0, 0.0,
    s, 0.0, c
  );
}

void main() {
  float angle = uRotation * 3.14159265 / 180.0;
  vec3 rotatedPos = rotateY(angle) * aPosition;
  vec3 rotatedNormal = rotateY(angle) * aNormal;

  vec3 position = rotatedPos * uScale;
  vPosition = position;
  vNormal = normalize(rotatedNormal);

  if (uView == 0) {
    gl_Position = vec4(position.x, -position.z, 0.0, 1.0);
  } else {
    gl_Position = vec4(position.x, position.y, 0.0, 1.0);
  }
}
`

export const FRAGMENT_SHADER = `
precision highp float;

uniform int uFacetCount;
uniform vec3 uFacetNormals[${MAX_FACETS}];
uniform vec3 uFacetPoints[${MAX_FACETS}];

uniform vec3 uAbsorption;
uniform vec3 uIor;
uniform vec3 uBaseColor;
uniform vec3 uGlowColor;
uniform vec3 uHaloColor;
uniform vec3 uHighlightColor;
uniform vec3 uShadowColor;
uniform float uGlowStrength;
uniform float uHover;
uniform float uTime;

varying vec3 vPosition;
varying vec3 vNormal;

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

float environmentMono(vec3 direction) {
  direction = normalize(direction);

  float monoX = 0.4 + 0.6 * abs(cos(6.0 * (direction.x + 0.1)));
  float monoZ = 0.5 * cos(7.0 * (direction.z + 0.5 * direction.x + 0.1));
  float monoY = 0.5 * cos(5.0 * (direction.y + 0.3));
  float pureMono = monoX + monoZ + monoY;

  float value = mix(0.7, pureMono, smoothstep(-1.0, 0.2, direction.y));
  value = 1.2 * clamp(value, 0.7, 1.5);

  float headShadow = max(0.2, step(direction.y, 0.16));
  return headShadow * value;
}

vec3 environmentColor(vec3 direction) {
  direction = normalize(direction);
  float mono = environmentMono(direction);

  vec3 upper = vec3(0.78, 0.88, 1.0);
  vec3 lower = vec3(0.19, 0.21, 0.25);
  vec3 horizonWarm = vec3(1.0, 0.93, 0.80);
  float up = smoothstep(-0.35, 0.85, direction.y);
  float horizon = 1.0 - abs(direction.y);

  vec3 sky = mix(lower, upper, up);
  sky = mix(sky, horizonWarm, pow(saturate(horizon), 6.0) * 0.28);
  return sky * mono;
}

float fresnelCoefficient(
  vec3 incidentDirection,
  vec3 boundaryNormal,
  vec3 transmittedDirection,
  float ior,
  float critical
) {
  float cosineIncident = abs(dot(boundaryNormal, incidentDirection));

  if (cosineIncident < critical) {
    return 1.0;
  }

  float cosineTransmitted = abs(dot(boundaryNormal, transmittedDirection));
  float iorCosineTransmitted = ior * cosineTransmitted;
  float iorCosineIncident = ior * cosineIncident;

  float a = (cosineIncident - iorCosineTransmitted) / (cosineIncident + iorCosineTransmitted);
  float b = (iorCosineIncident - cosineTransmitted) / (iorCosineIncident + cosineTransmitted);
  return 0.5 * (a * a + b * b);
}

float intersectClosest(vec3 origin, vec3 direction, out vec3 hitNormal) {
  float nearest = 100000.0;
  hitNormal = vec3(0.0, 1.0, 0.0);

  for (int index = 0; index < ${MAX_FACETS}; index += 1) {
    if (index >= uFacetCount) {
      break;
    }

    vec3 normal = uFacetNormals[index];
    float denominator = dot(direction, normal);

    if (denominator > 0.0001) {
      float distance = dot(uFacetPoints[index] - origin, normal) / denominator;
      if (distance > 0.0001 && distance < nearest) {
        nearest = distance;
        hitNormal = normal;
      }
    }
  }

  return nearest;
}

float traceMonochromeChannel(
  vec3 origin,
  vec3 direction,
  vec3 boundaryNormal,
  float ior,
  float absorption
) {
  float critical = sqrt(max(0.0, 1.0 - 1.0 / (ior * ior)));
  float transmittedLight = 0.0;
  float reflection = 1.0;
  float traveled = 0.0;

  for (int bounce = 0; bounce < ${MAX_BOUNCES}; bounce += 1) {
    vec3 hitNormal;
    float distance = intersectClosest(origin, direction, hitNormal);

    if (distance > 99999.0) {
      transmittedLight += reflection * environmentMono(direction) * exp(-absorption * traveled);
      return transmittedLight;
    }

    vec3 refracted = refract(direction, -hitNormal, ior);
    float fresnel = fresnelCoefficient(direction, -hitNormal, refracted, ior, critical);

    traveled += distance;
    transmittedLight += reflection * (1.0 - fresnel) * environmentMono(refracted) * exp(-absorption * traveled);
    reflection *= fresnel;

    if (reflection < 0.001) {
      return transmittedLight;
    }

    origin += distance * direction;
    direction = reflect(direction, -hitNormal);
    origin += direction * 0.0008;
    boundaryNormal = hitNormal;
  }

  transmittedLight += reflection * 0.5 * environmentMono(direction) * exp(-absorption * traveled);
  return transmittedLight;
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 incident = vec3(0.0, -1.0, 0.0);

  vec3 insideRed = refract(incident, normal, 1.0 / uIor.r);
  vec3 insideGreen = refract(incident, normal, 1.0 / uIor.g);
  vec3 insideBlue = refract(incident, normal, 1.0 / uIor.b);

  vec3 transmitted = vec3(
    traceMonochromeChannel(vPosition, insideRed, normal, uIor.r, uAbsorption.r),
    traceMonochromeChannel(vPosition, insideGreen, normal, uIor.g, uAbsorption.g),
    traceMonochromeChannel(vPosition, insideBlue, normal, uIor.b, uAbsorption.b)
  );

  vec3 reflectedDirection = reflect(incident, normal);
  vec3 reflected = environmentColor(reflectedDirection);

  float fresnelRed = fresnelCoefficient(incident, normal, insideRed, 1.0 / uIor.r, 0.0);
  float fresnelGreen = fresnelCoefficient(incident, normal, insideGreen, 1.0 / uIor.g, 0.0);
  float fresnelBlue = fresnelCoefficient(incident, normal, insideBlue, 1.0 / uIor.b, 0.0);

  vec3 fresnel = vec3(fresnelRed, fresnelGreen, fresnelBlue);
  vec3 color = mix(transmitted, reflected, fresnel * 0.88);

  float crownLight = pow(max(dot(normal, normalize(vec3(-0.4, 1.0, 0.5))), 0.0), 16.0);
  float rim = pow(1.0 - abs(dot(normal, vec3(0.0, 1.0, 0.0))), 2.2);
  float angle = atan(vPosition.z, vPosition.x);
  float radius = length(vPosition.xz);
  float sparkle = pow(max(cos(angle * 8.0 + radius * 12.0 + uTime * 0.8), 0.0), 18.0)
    * (0.02 + uHover * 0.08)
    * smoothstep(0.10, 0.75, radius);

  color = mix(color, color * uBaseColor, 0.28);
  color = mix(color, uShadowColor, smoothstep(0.0, -0.45, vPosition.y) * 0.24);
  color += uHighlightColor * crownLight * (0.18 + uHover * 0.12);
  color += uHaloColor * rim * (0.10 + uGlowStrength * 0.12);
  color += uGlowColor * sparkle;

  gl_FragColor = vec4(color, 1.0);
}
`
