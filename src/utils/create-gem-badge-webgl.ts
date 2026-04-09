import * as THREE from 'three'
import { GEM_BADGE_MATERIALS } from '../gem-badge-configs'
import type { GemBadgeConfig, GemCut, GemMaterial } from '../types'

interface GemBadgeWebGLOptions extends Required<Pick<GemBadgeConfig, 'animate' | 'cut' | 'glow' | 'glowIntensity'>> {
  material: GemMaterial
  disabled?: boolean
  force2d?: boolean
  targetElement?: HTMLElement | null
  onContextLost?: () => void
}

interface PreparedGeometry {
  positions: Float32Array
  normals: Float32Array
  count: number
  facetCount: number
  facetNormals: Float32Array
  facetPoints: Float32Array
}

const MAX_FACETS = 128
const MAX_BOUNCES = 6

const VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform float uScale;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  vec3 position = aPosition * uScale;
  vPosition = position;
  vNormal = normalize(aNormal);
  gl_Position = vec4(position.x, -position.z, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
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

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type)

  if (!shader) {
    throw new Error('Unable to create shader')
  }

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? 'Unknown shader compile error'
    gl.deleteShader(shader)
    throw new Error(info)
  }

  return shader
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const program = gl.createProgram()

  if (!program) {
    throw new Error('Unable to create WebGL program')
  }

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) ?? 'Unknown program link error'
    gl.deleteProgram(program)
    throw new Error(info)
  }

  return program
}

function parseColor(color: string): [number, number, number] {
  const normalized = color.trim()

  if (normalized.startsWith('#')) {
    const hex = normalized.slice(1)
    const value = hex.length === 3
      ? hex.split('').map((char) => char + char).join('')
      : hex

    return [
      parseInt(value.slice(0, 2), 16) / 255,
      parseInt(value.slice(2, 4), 16) / 255,
      parseInt(value.slice(4, 6), 16) / 255,
    ]
  }

  return [1, 1, 1]
}

function buildPrincessCut(): THREE.BufferGeometry {
  const vertices: THREE.Vector3[] = []
  const indices: number[] = []

  const addVertex = (vertex: THREE.Vector3) => {
    vertices.push(vertex)
    return vertices.length - 1
  }

  const addTri = (a: number, b: number, c: number) => {
    indices.push(a, b, c)
  }

  const halfW = 0.50
  const halfD = 0.50

  const crownT = 0.14
  const crownD = 0.10
  const crownStar = 0.06
  const crownB = 0.02
  const girdle = -0.06
  const pavilion1 = -0.24
  const pavilion2 = -0.42
  const pavilion3 = -0.56
  const pavilion4 = -0.66
  const pavilion5 = -0.70

  const tableV = [
    addVertex(new THREE.Vector3(0, crownT, 0)),
    addVertex(new THREE.Vector3(halfW * 0.50, crownT, halfD * 0.50)),
    addVertex(new THREE.Vector3(halfW * 0.50, crownT, -halfD * 0.50)),
    addVertex(new THREE.Vector3(-halfW * 0.50, crownT, -halfD * 0.50)),
    addVertex(new THREE.Vector3(-halfW * 0.50, crownT, halfD * 0.50)),
  ]

  const crownD0 = addVertex(new THREE.Vector3(halfW * 0.56, crownD, halfD * 0.56))
  const crownD1 = addVertex(new THREE.Vector3(halfW * 0.56, crownD, -halfD * 0.56))
  const crownD2 = addVertex(new THREE.Vector3(-halfW * 0.56, crownD, -halfD * 0.56))
  const crownD3 = addVertex(new THREE.Vector3(-halfW * 0.56, crownD, halfD * 0.56))

  const crownStar0 = addVertex(new THREE.Vector3(halfW * 0.64, crownStar, halfD * 0.64))
  const crownStar1 = addVertex(new THREE.Vector3(halfW * 0.64, crownStar, -halfD * 0.64))
  const crownStar2 = addVertex(new THREE.Vector3(-halfW * 0.64, crownStar, -halfD * 0.64))
  const crownStar3 = addVertex(new THREE.Vector3(-halfW * 0.64, crownStar, halfD * 0.64))

  const crownB0 = addVertex(new THREE.Vector3(halfW * 0.80, crownB, halfD * 0.80))
  const crownB1 = addVertex(new THREE.Vector3(halfW * 0.80, crownB, -halfD * 0.80))
  const crownB2 = addVertex(new THREE.Vector3(-halfW * 0.80, crownB, -halfD * 0.80))
  const crownB3 = addVertex(new THREE.Vector3(-halfW * 0.80, crownB, halfD * 0.80))

  const crownA0 = addVertex(new THREE.Vector3(halfW * 0.90, crownB, halfD * 0.90))
  const crownA1 = addVertex(new THREE.Vector3(halfW * 0.90, crownB, -halfD * 0.90))
  const crownA2 = addVertex(new THREE.Vector3(-halfW * 0.90, crownB, -halfD * 0.90))
  const crownA3 = addVertex(new THREE.Vector3(-halfW * 0.90, crownB, halfD * 0.90))

  const girdle0 = addVertex(new THREE.Vector3(halfW, girdle, halfD))
  const girdle1 = addVertex(new THREE.Vector3(halfW, girdle, -halfD))
  const girdle2 = addVertex(new THREE.Vector3(-halfW, girdle, -halfD))
  const girdle3 = addVertex(new THREE.Vector3(-halfW, girdle, halfD))

  const p1_0 = addVertex(new THREE.Vector3(halfW * 0.88, pavilion1, halfD * 0.88))
  const p1_1 = addVertex(new THREE.Vector3(halfW * 0.88, pavilion1, -halfD * 0.88))
  const p1_2 = addVertex(new THREE.Vector3(-halfW * 0.88, pavilion1, -halfD * 0.88))
  const p1_3 = addVertex(new THREE.Vector3(-halfW * 0.88, pavilion1, halfD * 0.88))

  const p2_0 = addVertex(new THREE.Vector3(halfW * 0.70, pavilion2, halfD * 0.70))
  const p2_1 = addVertex(new THREE.Vector3(halfW * 0.70, pavilion2, -halfD * 0.70))
  const p2_2 = addVertex(new THREE.Vector3(-halfW * 0.70, pavilion2, -halfD * 0.70))
  const p2_3 = addVertex(new THREE.Vector3(-halfW * 0.70, pavilion2, halfD * 0.70))

  const p3_0 = addVertex(new THREE.Vector3(halfW * 0.48, pavilion3, halfD * 0.48))
  const p3_1 = addVertex(new THREE.Vector3(halfW * 0.48, pavilion3, -halfD * 0.48))
  const p3_2 = addVertex(new THREE.Vector3(-halfW * 0.48, pavilion3, -halfD * 0.48))
  const p3_3 = addVertex(new THREE.Vector3(-halfW * 0.48, pavilion3, halfD * 0.48))

  const p4_0 = addVertex(new THREE.Vector3(halfW * 0.26, pavilion4, halfD * 0.26))
  const p4_1 = addVertex(new THREE.Vector3(halfW * 0.26, pavilion4, -halfD * 0.26))
  const p4_2 = addVertex(new THREE.Vector3(-halfW * 0.26, pavilion4, -halfD * 0.26))
  const p4_3 = addVertex(new THREE.Vector3(-halfW * 0.26, pavilion4, halfD * 0.26))

  const p5_0 = addVertex(new THREE.Vector3(halfW * 0.06, pavilion5, halfD * 0.06))
  const p5_1 = addVertex(new THREE.Vector3(halfW * 0.06, pavilion5, -halfD * 0.06))
  const p5_2 = addVertex(new THREE.Vector3(-halfW * 0.06, pavilion5, -halfD * 0.06))
  const p5_3 = addVertex(new THREE.Vector3(-halfW * 0.06, pavilion5, halfD * 0.06))

  addTri(tableV[0], tableV[1], tableV[2])
  addTri(tableV[0], tableV[2], tableV[3])
  addTri(tableV[0], tableV[3], tableV[4])
  addTri(tableV[0], tableV[4], tableV[1])

  addTri(tableV[1], crownD0, tableV[2])
  addTri(tableV[2], crownD1, tableV[3])
  addTri(tableV[3], crownD2, tableV[4])
  addTri(tableV[4], crownD3, tableV[1])

  addTri(tableV[1], crownD1, crownD0)
  addTri(tableV[2], crownD2, crownD1)
  addTri(tableV[3], crownD3, crownD2)
  addTri(tableV[4], crownD0, crownD3)

  addTri(crownD0, crownStar0, crownD1)
  addTri(crownD1, crownStar1, crownD2)
  addTri(crownD2, crownStar2, crownD3)
  addTri(crownD3, crownStar3, crownD0)

  addTri(crownStar0, crownB0, crownStar1)
  addTri(crownStar1, crownB1, crownStar2)
  addTri(crownStar2, crownB2, crownStar3)
  addTri(crownStar3, crownB3, crownStar0)

  addTri(crownB0, crownA0, crownB1)
  addTri(crownB1, crownA1, crownB2)
  addTri(crownB2, crownA2, crownB3)
  addTri(crownB3, crownA3, crownB0)

  addTri(crownA0, girdle0, crownA1)
  addTri(crownA1, girdle1, crownA2)
  addTri(crownA2, girdle2, crownA3)
  addTri(crownA3, girdle3, crownA0)

  addTri(girdle0, p1_0, girdle1)
  addTri(girdle1, p1_1, girdle2)
  addTri(girdle2, p1_2, girdle3)
  addTri(girdle3, p1_3, girdle0)

  addTri(p1_0, p2_0, p1_1)
  addTri(p1_1, p2_1, p1_2)
  addTri(p1_2, p2_2, p1_3)
  addTri(p1_3, p2_3, p1_0)

  addTri(p2_0, p3_0, p2_1)
  addTri(p2_1, p3_1, p2_2)
  addTri(p2_2, p3_2, p2_3)
  addTri(p2_3, p3_3, p2_0)

  addTri(p3_0, p4_0, p3_1)
  addTri(p3_1, p4_1, p3_2)
  addTri(p3_2, p4_2, p3_3)
  addTri(p3_3, p4_3, p3_0)

  addTri(p4_0, p5_0, p4_1)
  addTri(p4_1, p5_1, p4_2)
  addTri(p4_2, p5_2, p4_3)
  addTri(p4_3, p5_3, p4_0)

  const geometry = new THREE.BufferGeometry()
  geometry.setFromPoints(vertices)
  geometry.setIndex(indices)

  const faceted = geometry.toNonIndexed()
  faceted.computeVertexNormals()
  return faceted
}

function buildFacetRing(
  radius: number,
  y: number,
  count: number,
  angleOffset = 0,
  xScale = 1,
  zScale = 1
): THREE.Vector3[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + angleOffset
    return new THREE.Vector3(
      Math.cos(angle) * radius * xScale,
      y,
      Math.sin(angle) * radius * zScale
    )
  })
}

function buildRoundBrilliantCut(): THREE.BufferGeometry {
  const vertices: THREE.Vector3[] = []
  const indices: number[] = []

  const addVertex = (vertex: THREE.Vector3) => {
    vertices.push(vertex)
    return vertices.length - 1
  }

  const addRing = (
    radius: number,
    y: number,
    count: number,
    angleOffset = 0,
    xScale = 1,
    zScale = 1
  ) => buildFacetRing(radius, y, count, angleOffset, xScale, zScale).map(addVertex)

  const addTri = (a: number, b: number, c: number) => {
    indices.push(a, b, c)
  }

  const topCenter = addVertex(new THREE.Vector3(0, 0.26, 0))
  const table = addRing(0.30, 0.26, 8, 0, 0.98, 1)
  const crown = addRing(0.46, 0.15, 8, Math.PI / 8, 0.99, 1)
  const girdleUpper = addRing(0.64, 0.03, 16, 0, 1, 1.01)
  const girdleLower = addRing(0.62, -0.035, 16, 0, 0.99, 1)
  const pavilion = addRing(0.24, -0.34, 16, Math.PI / 16, 0.97, 1)
  const culet = addVertex(new THREE.Vector3(0, -0.82, 0))

  for (let index = 0; index < 8; index += 1) {
    const next = (index + 1) % 8
    addTri(topCenter, table[index], table[next])
  }

  for (let index = 0; index < 8; index += 1) {
    const next = (index + 1) % 8
    const girdleIndex = index * 2
    const g0 = girdleUpper[girdleIndex]
    const g1 = girdleUpper[(girdleIndex + 1) % 16]
    const g2 = girdleUpper[(girdleIndex + 2) % 16]

    addTri(table[index], crown[index], table[next])
    addTri(table[index], g0, crown[index])
    addTri(crown[index], g0, g1)
    addTri(table[next], crown[index], g2)
    addTri(crown[index], g1, g2)
  }

  for (let index = 0; index < 16; index += 1) {
    const next = (index + 1) % 16
    addTri(girdleUpper[index], girdleUpper[next], girdleLower[index])
    addTri(girdleUpper[next], girdleLower[next], girdleLower[index])
  }

  for (let index = 0; index < 16; index += 1) {
    const next = (index + 1) % 16
    addTri(girdleLower[index], girdleLower[next], pavilion[index])
    addTri(girdleLower[next], pavilion[next], pavilion[index])
    addTri(pavilion[index], pavilion[next], culet)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setFromPoints(vertices)
  geometry.setIndex(indices)

  const faceted = geometry.toNonIndexed()
  faceted.computeVertexNormals()
  faceted.scale(1, 1.04, 1)
  return faceted
}

function buildLatheCut(points: Array<[number, number]>, segments: number, scale?: [number, number, number]) {
  const geometry = new THREE.LatheGeometry(
    points.map(([x, y]) => new THREE.Vector2(x, y)),
    segments
  )

  if (scale) {
    geometry.applyMatrix4(new THREE.Matrix4().makeScale(...scale))
  }

  const faceted = geometry.toNonIndexed()
  faceted.computeVertexNormals()
  return faceted
}

function buildEmeraldCutGeometry(): THREE.BufferGeometry {
  const vertices: THREE.Vector3[] = []
  const indices: number[] = []

  const addVertex = (vertex: THREE.Vector3) => {
    vertices.push(vertex)
    return vertices.length - 1
  }

  const addTri = (a: number, b: number, c: number) => {
    indices.push(a, b, c)
  }

  const lW = 1.25
  const w = lW / 2
  const d = 0.80 / 2

  const crownA = 0.52
  const crownB = 0.44
  const crownC = 0.36
  const crownD = 0.28
  const girdle = 0.02
  const pavilion1 = -0.18
  const pavilion2 = -0.42
  const pavilion3 = -0.60
  const culet = -0.76

  const tableV = [
    addVertex(new THREE.Vector3(0, crownA, 0)),
    addVertex(new THREE.Vector3(w * 0.5, crownA, d * 0.5)),
    addVertex(new THREE.Vector3(w * 0.5, crownA, -d * 0.5)),
    addVertex(new THREE.Vector3(-w * 0.5, crownA, -d * 0.5)),
    addVertex(new THREE.Vector3(-w * 0.5, crownA, d * 0.5)),
  ]

  const crownA0 = addVertex(new THREE.Vector3(w * 0.56, crownA, d * 0.56))
  const crownA1 = addVertex(new THREE.Vector3(w * 0.56, crownA, -d * 0.56))
  const crownA2 = addVertex(new THREE.Vector3(-w * 0.56, crownA, -d * 0.56))
  const crownA3 = addVertex(new THREE.Vector3(-w * 0.56, crownA, d * 0.56))

  const crownB0 = addVertex(new THREE.Vector3(w * 0.72, crownB, d * 0.72))
  const crownB1 = addVertex(new THREE.Vector3(w * 0.72, crownB, -d * 0.72))
  const crownB2 = addVertex(new THREE.Vector3(-w * 0.72, crownB, -d * 0.72))
  const crownB3 = addVertex(new THREE.Vector3(-w * 0.72, crownB, d * 0.72))

  const crownC0 = addVertex(new THREE.Vector3(w * 0.86, crownC, d * 0.86))
  const crownC1 = addVertex(new THREE.Vector3(w * 0.86, crownC, -d * 0.86))
  const crownC2 = addVertex(new THREE.Vector3(-w * 0.86, crownC, -d * 0.86))
  const crownC3 = addVertex(new THREE.Vector3(-w * 0.86, crownC, d * 0.86))

  const crownD0 = addVertex(new THREE.Vector3(w, crownD, d))
  const crownD1 = addVertex(new THREE.Vector3(w, crownD, -d))
  const crownD2 = addVertex(new THREE.Vector3(-w, crownD, -d))
  const crownD3 = addVertex(new THREE.Vector3(-w, crownD, d))

  const girdle0 = addVertex(new THREE.Vector3(w * 1.02, girdle, d * 1.02))
  const girdle1 = addVertex(new THREE.Vector3(w * 1.02, girdle, -d * 1.02))
  const girdle2 = addVertex(new THREE.Vector3(-w * 1.02, girdle, -d * 1.02))
  const girdle3 = addVertex(new THREE.Vector3(-w * 1.02, girdle, d * 1.02))

  const p1_0 = addVertex(new THREE.Vector3(w * 0.94, pavilion1, d * 0.94))
  const p1_1 = addVertex(new THREE.Vector3(w * 0.94, pavilion1, -d * 0.94))
  const p1_2 = addVertex(new THREE.Vector3(-w * 0.94, pavilion1, -d * 0.94))
  const p1_3 = addVertex(new THREE.Vector3(-w * 0.94, pavilion1, d * 0.94))

  const p2_0 = addVertex(new THREE.Vector3(w * 0.68, pavilion2, d * 0.68))
  const p2_1 = addVertex(new THREE.Vector3(w * 0.68, pavilion2, -d * 0.68))
  const p2_2 = addVertex(new THREE.Vector3(-w * 0.68, pavilion2, -d * 0.68))
  const p2_3 = addVertex(new THREE.Vector3(-w * 0.68, pavilion2, d * 0.68))

  const p3_0 = addVertex(new THREE.Vector3(w * 0.38, pavilion3, d * 0.38))
  const p3_1 = addVertex(new THREE.Vector3(w * 0.38, pavilion3, -d * 0.38))
  const p3_2 = addVertex(new THREE.Vector3(-w * 0.38, pavilion3, -d * 0.38))
  const p3_3 = addVertex(new THREE.Vector3(-w * 0.38, pavilion3, d * 0.38))

  const culetV = addVertex(new THREE.Vector3(0, culet, 0))

  addTri(tableV[0], tableV[1], tableV[2])
  addTri(tableV[0], tableV[2], tableV[3])
  addTri(tableV[0], tableV[3], tableV[4])
  addTri(tableV[0], tableV[4], tableV[1])

  addTri(tableV[1], crownA0, tableV[2])
  addTri(tableV[2], crownA1, tableV[3])
  addTri(tableV[3], crownA2, tableV[4])
  addTri(tableV[4], crownA3, tableV[1])

  addTri(tableV[1], crownA1, crownA0)
  addTri(tableV[1], crownA3, crownA3)
  addTri(tableV[2], crownA1, crownA0)
  addTri(tableV[2], crownA2, crownA1)
  addTri(tableV[3], crownA2, crownA1)
  addTri(tableV[3], crownA3, crownA2)
  addTri(tableV[4], crownA3, crownA0)
  addTri(tableV[4], crownA0, crownA3)

  addTri(crownA0, crownB0, crownA1)
  addTri(crownA1, crownB1, crownA2)
  addTri(crownA2, crownB2, crownA3)
  addTri(crownA3, crownB3, crownA0)

  addTri(crownB0, crownC0, crownB1)
  addTri(crownB1, crownC1, crownB2)
  addTri(crownB2, crownC2, crownB3)
  addTri(crownB3, crownC3, crownB0)

  addTri(crownC0, crownD0, crownC1)
  addTri(crownC1, crownD1, crownC2)
  addTri(crownC2, crownD2, crownC3)
  addTri(crownC3, crownD3, crownC0)

  addTri(crownD0, girdle0, crownD1)
  addTri(crownD1, girdle1, crownD2)
  addTri(crownD2, girdle2, crownD3)
  addTri(crownD3, girdle3, crownD0)

  addTri(girdle0, p1_0, girdle1)
  addTri(girdle1, p1_1, girdle2)
  addTri(girdle2, p1_2, girdle3)
  addTri(girdle3, p1_3, girdle0)

  addTri(p1_0, p2_0, p1_1)
  addTri(p1_1, p2_1, p1_2)
  addTri(p1_2, p2_2, p1_3)
  addTri(p1_3, p2_3, p1_0)

  addTri(p2_0, p3_0, p2_1)
  addTri(p2_1, p3_1, p2_2)
  addTri(p2_2, p3_2, p2_3)
  addTri(p2_3, p3_3, p2_0)

  addTri(p3_0, culetV, p3_1)
  addTri(p3_1, culetV, p3_2)
  addTri(p3_2, culetV, p3_3)
  addTri(p3_3, culetV, p3_0)

  const geometry = new THREE.BufferGeometry()
  geometry.setFromPoints(vertices)
  geometry.setIndex(indices)

  const faceted = geometry.toNonIndexed()
  faceted.computeVertexNormals()
  return faceted
}

function buildHeartCutGeometry(): THREE.BufferGeometry {
  const vertices: THREE.Vector3[] = []
  const indices: number[] = []

  const addVertex = (vertex: THREE.Vector3) => {
    vertices.push(vertex)
    return vertices.length - 1
  }

  const addTri = (a: number, b: number, c: number) => {
    indices.push(a, b, c)
  }

  const crownT = 0.56
  const crownUpper = 0.48
  const crownMid = 0.38
  const crownLower = 0.26
  const girdle = 0.02
  const pavilion1 = -0.20
  const pavilion2 = -0.40
  const pavilion3 = -0.56
  const pavilion4 = -0.68
  const culet = -0.72

  const table = addVertex(new THREE.Vector3(0, crownT, 0))

  const tableL = addVertex(new THREE.Vector3(-0.10, crownT, 0.12))
  const tableR = addVertex(new THREE.Vector3(0.10, crownT, 0.12))

  const crownUpperL1 = addVertex(new THREE.Vector3(-0.18, crownUpper, 0.20))
  const crownUpperL2 = addVertex(new THREE.Vector3(-0.06, crownUpper, 0.26))
  const crownUpperR1 = addVertex(new THREE.Vector3(0.06, crownUpper, 0.26))
  const crownUpperR2 = addVertex(new THREE.Vector3(0.18, crownUpper, 0.20))

  const crownMidL1 = addVertex(new THREE.Vector3(-0.30, crownMid, 0.28))
  const crownMidL2 = addVertex(new THREE.Vector3(-0.14, crownMid, 0.38))
  const crownMidR1 = addVertex(new THREE.Vector3(0.14, crownMid, 0.38))
  const crownMidR2 = addVertex(new THREE.Vector3(0.30, crownMid, 0.28))

  const crownLowerL1 = addVertex(new THREE.Vector3(-0.42, crownLower, 0.32))
  const crownLowerL2 = addVertex(new THREE.Vector3(-0.22, crownLower, 0.46))
  const crownLowerR1 = addVertex(new THREE.Vector3(0.22, crownLower, 0.46))
  const crownLowerR2 = addVertex(new THREE.Vector3(0.42, crownLower, 0.32))

  const girdleL1 = addVertex(new THREE.Vector3(-0.50, girdle, 0.34))
  const girdleL2 = addVertex(new THREE.Vector3(-0.30, girdle, 0.52))
  const girdleR1 = addVertex(new THREE.Vector3(0.30, girdle, 0.52))
  const girdleR2 = addVertex(new THREE.Vector3(0.50, girdle, 0.34))
  const girdleBottom = addVertex(new THREE.Vector3(0, girdle, -0.56))

  const p1L1 = addVertex(new THREE.Vector3(-0.46, pavilion1, 0.30))
  const p1L2 = addVertex(new THREE.Vector3(-0.28, pavilion1, 0.46))
  const p1R1 = addVertex(new THREE.Vector3(0.28, pavilion1, 0.46))
  const p1R2 = addVertex(new THREE.Vector3(0.46, pavilion1, 0.30))
  const p1Bottom = addVertex(new THREE.Vector3(0, pavilion1, -0.50))

  const p2L1 = addVertex(new THREE.Vector3(-0.38, pavilion2, 0.24))
  const p2L2 = addVertex(new THREE.Vector3(-0.22, pavilion2, 0.38))
  const p2R1 = addVertex(new THREE.Vector3(0.22, pavilion2, 0.38))
  const p2R2 = addVertex(new THREE.Vector3(0.38, pavilion2, 0.24))
  const p2Bottom = addVertex(new THREE.Vector3(0, pavilion2, -0.42))

  const p3L1 = addVertex(new THREE.Vector3(-0.28, pavilion3, 0.18))
  const p3L2 = addVertex(new THREE.Vector3(-0.16, pavilion3, 0.28))
  const p3R1 = addVertex(new THREE.Vector3(0.16, pavilion3, 0.28))
  const p3R2 = addVertex(new THREE.Vector3(0.28, pavilion3, 0.18))
  const p3Bottom = addVertex(new THREE.Vector3(0, pavilion3, -0.32))

  const p4L1 = addVertex(new THREE.Vector3(-0.18, pavilion4, 0.12))
  const p4L2 = addVertex(new THREE.Vector3(-0.10, pavilion4, 0.18))
  const p4R1 = addVertex(new THREE.Vector3(0.10, pavilion4, 0.18))
  const p4R2 = addVertex(new THREE.Vector3(0.18, pavilion4, 0.12))
  const p4Bottom = addVertex(new THREE.Vector3(0, pavilion4, -0.20))

  const culetV = addVertex(new THREE.Vector3(0, culet, 0))

  addTri(table, tableL, tableR)

  addTri(tableL, crownUpperL1, tableR)
  addTri(tableR, crownUpperR1, crownUpperR2)
  addTri(tableR, crownUpperR2, crownUpperL2)
  addTri(tableL, crownUpperL2, crownUpperL1)

  addTri(crownUpperL1, crownMidL1, crownUpperL2)
  addTri(crownUpperL2, crownMidL2, crownUpperR1)
  addTri(crownUpperR1, crownMidR1, crownUpperR2)
  addTri(crownUpperR2, crownMidR2, crownUpperL1)

  addTri(crownMidL1, crownLowerL1, crownMidL2)
  addTri(crownMidL2, crownLowerL2, crownMidR1)
  addTri(crownMidR1, crownLowerR1, crownMidR2)
  addTri(crownMidR2, crownLowerR2, crownMidL1)

  addTri(crownLowerL1, girdleL1, crownLowerL2)
  addTri(crownLowerL2, girdleL2, crownLowerR1)
  addTri(crownLowerR1, girdleR1, crownLowerR2)
  addTri(crownLowerR2, girdleR2, crownLowerL1)

  addTri(girdleL1, p1L1, girdleL2)
  addTri(girdleL2, p1L2, girdleR1)
  addTri(girdleR1, p1R1, girdleR2)
  addTri(girdleR2, p1R2, girdleL1)
  addTri(girdleBottom, p1Bottom, girdleL1)
  addTri(girdleR2, p1Bottom, girdleBottom)

  addTri(p1L1, p2L1, p1L2)
  addTri(p1L2, p2L2, p1R1)
  addTri(p1R1, p2R1, p1R2)
  addTri(p1R2, p2R2, p1L1)
  addTri(p1Bottom, p2Bottom, p1L1)
  addTri(p1R2, p2Bottom, p1Bottom)

  addTri(p2L1, p3L1, p2L2)
  addTri(p2L2, p3L2, p2R1)
  addTri(p2R1, p3R1, p2R2)
  addTri(p2R2, p3R2, p2L1)
  addTri(p2Bottom, p3Bottom, p2L1)
  addTri(p2R2, p3Bottom, p2Bottom)

  addTri(p3L1, p4L1, p3L2)
  addTri(p3L2, p4L2, p3R1)
  addTri(p3R1, p4R1, p3R2)
  addTri(p3R2, p4R2, p3L1)
  addTri(p3Bottom, p4Bottom, p3L1)
  addTri(p3R2, p4Bottom, p3Bottom)

  addTri(p4L1, culetV, p4L2)
  addTri(p4L2, culetV, p4R1)
  addTri(p4R1, culetV, p4R2)
  addTri(p4R2, culetV, p4L1)
  addTri(p4Bottom, culetV, p4L1)
  addTri(p4R2, culetV, p4Bottom)

  const geometry = new THREE.BufferGeometry()
  geometry.setFromPoints(vertices)
  geometry.setIndex(indices)

  const faceted = geometry.toNonIndexed()
  faceted.computeVertexNormals()
  return faceted
}

function buildCutGeometry(cut: GemCut) {
  const geometry = (() => {
    switch (cut) {
    case 'round':
      return buildRoundBrilliantCut()
    case 'princess':
      return buildPrincessCut()
    case 'oval':
      return buildLatheCut([
        [0, -0.86],
        [0.06, -0.74],
        [0.38, -0.12],
        [0.50, 0.02],
        [0.44, 0.18],
        [0.24, 0.34],
        [0, 0.42],
      ], 16, [1.36, 1, 0.88])
    case 'emerald':
      return buildEmeraldCutGeometry()
    case 'heart':
      return buildHeartCutGeometry()
    case 'marquise':
      return buildLatheCut([
        [0, -0.92],
        [0.06, -0.78],
        [0.32, -0.08],
        [0.46, 0.06],
        [0.30, 0.34],
        [0.10, 0.62],
        [0, 0.78],
      ], 8, [1.05, 1, 0.72])
    default:
      return buildPrincessCut()
    }
  })()

  geometry.center()
  geometry.computeVertexNormals()

  const box = new THREE.Box3().setFromBufferAttribute(geometry.getAttribute('position') as THREE.BufferAttribute)
  const extent = Math.max(
    Math.abs(box.min.x),
    Math.abs(box.max.x),
    Math.abs(box.min.z),
    Math.abs(box.max.z)
  ) || 1

  geometry.scale(0.82 / extent, 0.82 / extent, 0.82 / extent)
  geometry.computeVertexNormals()
  return geometry
}

function prepareGeometry(cut: GemCut): PreparedGeometry | null {
  const geometry = buildCutGeometry(cut)
  const position = geometry.getAttribute('position')
  const normal = geometry.getAttribute('normal')

  const facetMap = new Map<string, { normal: THREE.Vector3; point: THREE.Vector3; count: number }>()

  for (let index = 0; index < position.count; index += 3) {
    const a = new THREE.Vector3(position.getX(index), position.getY(index), position.getZ(index))
    const b = new THREE.Vector3(position.getX(index + 1), position.getY(index + 1), position.getZ(index + 1))
    const c = new THREE.Vector3(position.getX(index + 2), position.getY(index + 2), position.getZ(index + 2))

    const faceNormal = b.clone().sub(a).cross(c.clone().sub(a)).normalize()
    const centroid = a.clone().add(b).add(c).multiplyScalar(1 / 3)

    if (faceNormal.dot(centroid) < 0) {
      faceNormal.negate()
    }

    const planeDistance = faceNormal.dot(centroid)
    const key = [
      Math.round(faceNormal.x * 1000),
      Math.round(faceNormal.y * 1000),
      Math.round(faceNormal.z * 1000),
      Math.round(planeDistance * 1000),
    ].join(':')

    const existing = facetMap.get(key)
    if (existing) {
      existing.normal.add(faceNormal)
      existing.point.add(centroid)
      existing.count += 1
    } else {
      facetMap.set(key, {
        normal: faceNormal.clone(),
        point: centroid.clone(),
        count: 1,
      })
    }
  }

  const facets = Array.from(facetMap.values())
    .map((facet) => ({
      normal: facet.normal.multiplyScalar(1 / facet.count).normalize(),
      point: facet.point.multiplyScalar(1 / facet.count),
    }))
    .sort((a, b) => b.point.y - a.point.y)

  if (facets.length > MAX_FACETS) {
    geometry.dispose()
    return null
  }

  const facetNormals = new Float32Array(MAX_FACETS * 3)
  const facetPoints = new Float32Array(MAX_FACETS * 3)

  facets.forEach((facet, index) => {
    const offset = index * 3
    facetNormals[offset] = facet.normal.x
    facetNormals[offset + 1] = facet.normal.y
    facetNormals[offset + 2] = facet.normal.z

    facetPoints[offset] = facet.point.x
    facetPoints[offset + 1] = facet.point.y
    facetPoints[offset + 2] = facet.point.z
  })

  const prepared = {
    positions: new Float32Array(position.array as ArrayLike<number>),
    normals: new Float32Array(normal.array as ArrayLike<number>),
    count: position.count,
    facetCount: facets.length,
    facetNormals,
    facetPoints,
  }

  geometry.dispose()
  return prepared
}

const PREPARED_GEOMETRIES = new Map<GemCut, PreparedGeometry | null>()

function getPreparedGeometry(cut: GemCut) {
  if (!PREPARED_GEOMETRIES.has(cut)) {
    PREPARED_GEOMETRIES.set(cut, prepareGeometry(cut))
  }

  return PREPARED_GEOMETRIES.get(cut) ?? null
}

function drawFallback(canvas: HTMLCanvasElement, options: GemBadgeWebGLOptions) {
  const context = canvas.getContext('2d')
  if (!context) return

  const material = GEM_BADGE_MATERIALS[options.material]
  const width = canvas.width
  const height = canvas.height
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) * 0.38

  context.clearRect(0, 0, width, height)
  context.save()
  context.translate(centerX, centerY)

  switch (options.cut) {
  case 'round':
    context.beginPath()
    context.arc(0, 0, radius, 0, Math.PI * 2)
    break
  case 'oval':
    context.beginPath()
    context.ellipse(0, 0, radius * 0.84, radius, 0, 0, Math.PI * 2)
    break
  case 'princess':
    context.beginPath()
    context.moveTo(-radius * 0.62, -radius)
    context.lineTo(radius * 0.62, -radius)
    context.lineTo(radius, -radius * 0.62)
    context.lineTo(radius, radius * 0.62)
    context.lineTo(radius * 0.62, radius)
    context.lineTo(-radius * 0.62, radius)
    context.lineTo(-radius, radius * 0.62)
    context.lineTo(-radius, -radius * 0.62)
    context.closePath()
    break
  case 'emerald':
    context.beginPath()
    context.moveTo(-radius * 0.72, -radius)
    context.lineTo(radius * 0.72, -radius)
    context.lineTo(radius, -radius * 0.72)
    context.lineTo(radius, radius * 0.72)
    context.lineTo(radius * 0.72, radius)
    context.lineTo(-radius * 0.72, radius)
    context.lineTo(-radius, radius * 0.72)
    context.lineTo(-radius, -radius * 0.72)
    context.closePath()
    break
  case 'heart':
    context.beginPath()
    context.moveTo(0, radius)
    context.bezierCurveTo(-radius * 1.1, radius * 0.42, -radius * 1.15, -radius * 0.30, -radius * 0.35, -radius * 0.76)
    context.bezierCurveTo(-radius * 0.08, -radius * 0.94, 0, -radius * 0.82, 0, -radius * 0.62)
    context.bezierCurveTo(0, -radius * 0.82, radius * 0.08, -radius * 0.94, radius * 0.35, -radius * 0.76)
    context.bezierCurveTo(radius * 1.15, -radius * 0.30, radius * 1.1, radius * 0.42, 0, radius)
    context.closePath()
    break
  case 'marquise':
    context.beginPath()
    context.moveTo(0, -radius)
    context.bezierCurveTo(radius * 0.9, -radius * 0.5, radius * 1.05, radius * 0.18, 0, radius)
    context.bezierCurveTo(-radius * 1.05, radius * 0.18, -radius * 0.9, -radius * 0.5, 0, -radius)
    context.closePath()
    break
  }

  const fill = context.createRadialGradient(-radius * 0.24, -radius * 0.30, radius * 0.12, 0, 0, radius)
  fill.addColorStop(0, material.highlightColor)
  fill.addColorStop(0.38, material.baseColor)
  fill.addColorStop(1, material.shadowColor)

  context.fillStyle = fill
  context.fill()
  context.lineWidth = Math.max(2, radius * 0.08)
  context.strokeStyle = material.haloColor
  context.globalAlpha = 0.85
  context.stroke()
  context.restore()
}

function mountWebGLCore(
  canvas: HTMLCanvasElement,
  options: GemBadgeWebGLOptions
): (() => void) | null {
  const geometry = getPreparedGeometry(options.cut)
  const gl = geometry
    ? canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
    })
    : null

  if (!gl || !geometry) {
    return null
  }

  const material = GEM_BADGE_MATERIALS[options.material]
  const program = createProgram(gl)

  const positionBuffer = gl.createBuffer()
  const normalBuffer = gl.createBuffer()

  if (!positionBuffer || !normalBuffer) {
    gl.deleteProgram(program)
    throw new Error('Unable to create WebGL buffers')
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW)

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW)

  gl.useProgram(program)

  const aPosition = gl.getAttribLocation(program, 'aPosition')
  const aNormal = gl.getAttribLocation(program, 'aNormal')
  const uScale = gl.getUniformLocation(program, 'uScale')
  const uFacetCount = gl.getUniformLocation(program, 'uFacetCount')
  const uFacetNormals = gl.getUniformLocation(program, 'uFacetNormals[0]')
  const uFacetPoints = gl.getUniformLocation(program, 'uFacetPoints[0]')
  const uAbsorption = gl.getUniformLocation(program, 'uAbsorption')
  const uIor = gl.getUniformLocation(program, 'uIor')
  const uBaseColor = gl.getUniformLocation(program, 'uBaseColor')
  const uGlowColor = gl.getUniformLocation(program, 'uGlowColor')
  const uHaloColor = gl.getUniformLocation(program, 'uHaloColor')
  const uHighlightColor = gl.getUniformLocation(program, 'uHighlightColor')
  const uShadowColor = gl.getUniformLocation(program, 'uShadowColor')
  const uGlowStrength = gl.getUniformLocation(program, 'uGlowStrength')
  const uHover = gl.getUniformLocation(program, 'uHover')
  const uTime = gl.getUniformLocation(program, 'uTime')

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.enableVertexAttribArray(aPosition)
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
  gl.enableVertexAttribArray(aNormal)
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0)

  gl.uniform1f(uScale, 1)
  gl.uniform1i(uFacetCount, geometry.facetCount)
  gl.uniform3fv(uFacetNormals, geometry.facetNormals)
  gl.uniform3fv(uFacetPoints, geometry.facetPoints)
  gl.uniform3fv(uAbsorption, new Float32Array(material.absorption))
  gl.uniform3fv(uBaseColor, new Float32Array(parseColor(material.baseColor)))
  gl.uniform3fv(uGlowColor, new Float32Array(parseColor(material.glowColor)))
  gl.uniform3fv(uHaloColor, new Float32Array(parseColor(material.haloColor)))
  gl.uniform3fv(uHighlightColor, new Float32Array(parseColor(material.highlightColor)))
  gl.uniform3fv(uShadowColor, new Float32Array(parseColor(material.shadowColor)))

  const ior = material.refractiveIndex
  const dispersion = material.dispersion
  gl.uniform3fv(uIor, new Float32Array([
    ior + dispersion,
    ior,
    Math.max(1.01, ior - dispersion),
  ]))

  gl.clearColor(0, 0, 0, 0)
  gl.disable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)

  let hover = 0
  let hoverTarget = 0
  let rafId = 0
  let disposed = false
  let needsRender = true

  const target = options.targetElement ?? canvas.parentElement

  const onEnter = () => {
    hoverTarget = 1
    needsRender = true
  }

  const onLeave = () => {
    hoverTarget = 0
    needsRender = true
  }

  target?.addEventListener('mouseenter', onEnter)
  target?.addEventListener('mouseleave', onLeave)
  target?.addEventListener('focus', onEnter)
  target?.addEventListener('blur', onLeave)

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const rect = canvas.getBoundingClientRect()
    const width = Math.max(1, Math.round(rect.width * ratio))
    const height = Math.max(1, Math.round(rect.height * ratio))

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      needsRender = true
    }

    gl.viewport(0, 0, width, height)
  }

  const render = (now: number) => {
    if (disposed) return

    resize()

    const nextHover = hoverTarget
    hover += (nextHover - hover) * 0.14

    const shouldAnimate = options.animate || hover > 0.001 || hoverTarget > 0.001
    if (!needsRender && !shouldAnimate) {
      rafId = window.requestAnimationFrame(render)
      return
    }

    const time = now * 0.001
    const glowStrength = options.disabled
      ? 0.08
      : options.glow
        ? Math.max(0, options.glowIntensity) * (0.30 + hover * 0.18)
        : 0.02

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.uniform1f(uTime, time)
    gl.uniform1f(uHover, hover)
    gl.uniform1f(uGlowStrength, glowStrength)
    gl.drawArrays(gl.TRIANGLES, 0, geometry.count)

    needsRender = hoverTarget !== 0 || options.animate
    rafId = window.requestAnimationFrame(render)
  }

  const resizeObserver = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => {
      needsRender = true
      resize()
    })
    : null

  const onContextLost = (event: Event) => {
    event.preventDefault()
    disposed = true
    window.cancelAnimationFrame(rafId)
    // Notify the outer function so it can restore the 2D fallback and reset state
    options.onContextLost?.()
  }

  canvas.addEventListener('webglcontextlost', onContextLost)

  resizeObserver?.observe(canvas)
  window.addEventListener('resize', resize)

  rafId = window.requestAnimationFrame(render)

  return () => {
    disposed = true
    window.cancelAnimationFrame(rafId)
    canvas.removeEventListener('webglcontextlost', onContextLost)
    resizeObserver?.disconnect()
    window.removeEventListener('resize', resize)
    target?.removeEventListener('mouseenter', onEnter)
    target?.removeEventListener('mouseleave', onLeave)
    target?.removeEventListener('focus', onEnter)
    target?.removeEventListener('blur', onLeave)
    gl.deleteBuffer(positionBuffer)
    gl.deleteBuffer(normalBuffer)
    gl.deleteProgram(program)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}

function makeOverlayCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    display: 'block',
    pointerEvents: 'none',
  })
  return canvas
}

export function mountGemBadgeWebGL(
  container: HTMLElement,
  options: GemBadgeWebGLOptions
): () => void {
  // Create a 2D fallback canvas that is always present in the container
  const fallbackCanvas = makeOverlayCanvas()
  container.appendChild(fallbackCanvas)

  const drawFallbackNow = () => {
    const ratio = Math.min(window.devicePixelRatio ?? 1, 2)
    const rect = container.getBoundingClientRect()
    fallbackCanvas.width = Math.max(1, Math.round(rect.width * ratio))
    fallbackCanvas.height = Math.max(1, Math.round(rect.height * ratio))
    drawFallback(fallbackCanvas, options)
  }

  drawFallbackNow()

  // DOM mode or unsupported cut: 2D only
  if (options.force2d || !getPreparedGeometry(options.cut)) {
    return () => {
      fallbackCanvas.remove()
    }
  }

  let outerDisposed = false
  let webglCanvas: HTMLCanvasElement | null = null
  let webglCleanup: (() => void) | null = null
  let webglFailed = false
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  const activate = () => {
    if (webglCleanup || outerDisposed) return
    if (webglFailed && !retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null
        webglFailed = false
        activate()
      }, 2000)
      return
    }
    if (webglFailed) return

    webglCanvas = makeOverlayCanvas()
    container.appendChild(webglCanvas)

    const onContextLost = () => {
      if (webglCleanup) {
        webglCleanup()
        webglCleanup = null
      }
      if (webglCanvas) {
        webglCanvas.remove()
        webglCanvas = null
      }
      fallbackCanvas.style.opacity = '1'
      webglFailed = true
    }

    const cleanup = mountWebGLCore(webglCanvas, { ...options, targetElement: container, onContextLost })
    if (cleanup) {
      fallbackCanvas.style.opacity = '0'
      webglCleanup = () => {
        cleanup()
        webglCanvas?.remove()
        webglCanvas = null
        fallbackCanvas.style.opacity = '1'
      }
    } else {
      webglCanvas.remove()
      webglCanvas = null
      webglFailed = true
    }
  }

  const deactivate = () => {
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const debouncedToggle = (shouldActivate: boolean) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      if (shouldActivate) {
        activate()
      }
    }, 100)
  }

  if (typeof IntersectionObserver === 'undefined') {
    activate()
    return () => {
      outerDisposed = true
      if (debounceTimer) clearTimeout(debounceTimer)
      webglCleanup?.()
      fallbackCanvas.remove()
    }
  }

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => debouncedToggle(e.isIntersecting)),
    { threshold: 0.01 }
  )
  observer.observe(container)

  return () => {
    outerDisposed = true
    if (debounceTimer) clearTimeout(debounceTimer)
    if (retryTimer) clearTimeout(retryTimer)
    observer.disconnect()
    webglCleanup?.()
    fallbackCanvas.remove()
  }
}
