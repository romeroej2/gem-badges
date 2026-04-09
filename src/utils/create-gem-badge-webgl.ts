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
  const halfWidth = 0.50
  const tableHalf = 0.27
  const crownHeight = 0.10
  const pavilionDepth = 0.62

  const vertices = new Float32Array([
    -tableHalf, crownHeight, -tableHalf,   tableHalf, crownHeight, -tableHalf,   tableHalf, crownHeight, tableHalf,   -tableHalf, crownHeight, tableHalf,
    -halfWidth, 0, -halfWidth,   halfWidth, 0, -halfWidth,   halfWidth, 0, halfWidth,   -halfWidth, 0, halfWidth,
    0, 0, -halfWidth,   halfWidth, 0, 0,   0, 0, halfWidth,   -halfWidth, 0, 0,
    0, -pavilionDepth, 0,
    0, crownHeight, -tableHalf,   tableHalf, crownHeight, 0,   0, crownHeight, tableHalf,   -tableHalf, crownHeight, 0,
  ])

  const indices = [
    0, 3, 2, 0, 2, 1,
    0, 13, 8, 0, 8, 4, 13, 1, 5, 13, 5, 8,
    1, 14, 9, 1, 9, 5, 14, 2, 6, 14, 6, 9,
    3, 15, 10, 3, 10, 7, 15, 2, 6, 15, 6, 10,
    3, 16, 11, 3, 11, 7, 16, 0, 4, 16, 4, 11,
    4, 8, 12, 8, 5, 12,
    5, 9, 12, 9, 6, 12,
    6, 10, 12, 10, 7, 12,
    7, 11, 12, 11, 4, 12,
  ]

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
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

function buildEmeraldCutGeometry() {
  const geometry = new THREE.BoxGeometry(1.18, 0.52, 0.84, 1, 1, 1).toNonIndexed()
  const position = geometry.getAttribute('position')

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index)
    const y = position.getY(index)
    const z = position.getZ(index)

    const bevelX = Math.sign(x) * 0.10 * (1 - Math.min(1, Math.abs(z) / 0.42))
    const bevelZ = Math.sign(z) * 0.10 * (1 - Math.min(1, Math.abs(x) / 0.59))
    const taper = y < 0 ? 0.76 : 0.88

    position.setXYZ(index, (x - bevelX) * taper, y, (z - bevelZ) * taper)
  }

  position.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

function buildHeartCutGeometry() {
  const shape = new THREE.Shape()
  shape.moveTo(0, -0.60)
  shape.bezierCurveTo(-0.72, -0.18, -0.88, 0.36, -0.24, 0.78)
  shape.bezierCurveTo(-0.02, 0.92, 0, 0.96, 0, 0.88)
  shape.bezierCurveTo(0, 0.96, 0.02, 0.92, 0.24, 0.78)
  shape.bezierCurveTo(0.88, 0.36, 0.72, -0.18, 0, -0.60)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelSize: 0.10,
    bevelThickness: 0.16,
    bevelSegments: 1,
    steps: 1,
  }).toNonIndexed()

  geometry.center()
  geometry.rotateX(Math.PI / 2)
  geometry.scale(0.72, 0.72, 0.72)
  geometry.computeVertexNormals()
  return geometry
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
        [0.07, -0.74],
        [0.40, -0.08],
        [0.48, 0.02],
        [0.40, 0.18],
        [0.22, 0.34],
        [0, 0.40],
      ], 10, [1.24, 1, 0.92])
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

  const activate = () => {
    if (webglCleanup || outerDisposed) return

    // Create a fresh canvas element — reusing a canvas after loseContext() is not possible
    webglCanvas = makeOverlayCanvas()
    container.appendChild(webglCanvas)

    const onContextLost = () => {
      // Browser lost the context (e.g. hit the WebGL context limit while scrolling).
      // Run the full outer cleanup: disconnects observers, removes the blank WebGL
      // canvas, and restores the 2D fallback so the badge doesn't appear broken.
      const savedCleanup = webglCleanup
      webglCleanup = null  // clear first to prevent deactivate() double-running
      savedCleanup?.()
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
      // WebGL unavailable on this device — remove the failed canvas and keep 2D
      webglCanvas.remove()
      webglCanvas = null
    }
  }

  const deactivate = () => {
    if (!webglCleanup) return
    webglCleanup()
    webglCleanup = null
  }

  if (typeof IntersectionObserver === 'undefined') {
    activate()
    return () => {
      outerDisposed = true
      webglCleanup?.()
      fallbackCanvas.remove()
    }
  }

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => (e.isIntersecting ? activate() : deactivate())),
    { threshold: 0.01 }
  )
  observer.observe(container)

  return () => {
    outerDisposed = true
    observer.disconnect()
    webglCleanup?.()
    fallbackCanvas.remove()
  }
}
