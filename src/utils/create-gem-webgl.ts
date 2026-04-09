interface GemWebGLOptions {
  gradientTop: string
  gradientMid: string
  gradientBottom: string
  glowClose: string
  facetHighlight: string
  pulse: boolean
  glow: boolean
  disabled?: boolean
}

type Vec3 = [number, number, number]

const VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform vec2 uRotation;
uniform float uScale;

varying vec3 vNormal;
varying vec3 vPosition;

vec3 rotateX(vec3 point, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return vec3(
    point.x,
    point.y * c - point.z * s,
    point.y * s + point.z * c
  );
}

vec3 rotateY(vec3 point, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return vec3(
    point.x * c + point.z * s,
    point.y,
    -point.x * s + point.z * c
  );
}

void main() {
  vec3 position = rotateY(rotateX(aPosition * uScale, uRotation.x), uRotation.y);
  vec3 normal = normalize(rotateY(rotateX(aNormal, uRotation.x), uRotation.y));

  float perspective = 1.9 / (2.35 - position.z);

  vNormal = normal;
  vPosition = position;
  gl_Position = vec4(position.xy * perspective, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision mediump float;

uniform vec3 uTopColor;
uniform vec3 uMidColor;
uniform vec3 uBottomColor;
uniform vec3 uGlowColor;
uniform vec3 uHighlightColor;
uniform float uTime;
uniform float uHover;
uniform float uGlowStrength;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vec3(0.0, 0.0, 1.8) - vPosition);

  vec3 lightA = normalize(vec3(-0.5, 0.8, 1.2));
  vec3 lightB = normalize(vec3(0.8, -0.3, 1.0));
  vec3 lightC = normalize(vec3(0.0, 0.3, 1.5));

  float diffA = max(dot(normal, lightA), 0.0);
  float diffB = max(dot(normal, lightB), 0.0);
  float diffC = max(dot(normal, lightC), 0.0);
  float diffuse = diffA * 0.55 + diffB * 0.25 + diffC * 0.45;

  vec3 reflectedA = reflect(-lightA, normal);
  vec3 reflectedB = reflect(-lightB, normal);
  float specA = pow(max(dot(reflectedA, viewDir), 0.0), 26.0);
  float specB = pow(max(dot(reflectedB, viewDir), 0.0), 36.0);
  float specular = specA + specB * 0.7;

  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.8);

  float depthMix = smoothstep(-0.72, 0.24, vPosition.z);
  vec3 baseColor = mix(uBottomColor, uMidColor, smoothstep(-0.22, 0.12, vPosition.z));
  baseColor = mix(baseColor, uTopColor, depthMix);

  float facetBands = sin((vPosition.x - vPosition.y) * 16.0 + uTime * 1.2) * 0.5 + 0.5;
  float sparkleMask = smoothstep(0.72, 1.0, facetBands) * (0.3 + uHover * 0.7);

  vec3 color = baseColor * (0.38 + diffuse * 0.78);
  color += uHighlightColor * specular * (0.55 + uHover * 0.35);
  color += uGlowColor * fresnel * (0.35 + uGlowStrength * 0.7);
  color += uHighlightColor * sparkleMask * 0.15;

  float alpha = 0.92 + fresnel * 0.08;
  gl_FragColor = vec4(color, alpha);
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

function parseColor(color: string): Vec3 {
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

  const match = normalized.match(/rgba?\(([^)]+)\)/i)
  if (!match) {
    return [1, 1, 1]
  }

  const channels = match[1]
    .split(',')
    .slice(0, 3)
    .map((part) => Number.parseFloat(part.trim()) / 255)

  return [
    channels[0] ?? 1,
    channels[1] ?? 1,
    channels[2] ?? 1,
  ]
}

function normalize(vector: Vec3): Vec3 {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1
  return [vector[0] / length, vector[1] / length, vector[2] / length]
}

function subtract(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

function makeRing(radius: number, z: number, count: number, offset = 0): Vec3[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + offset
    return [Math.cos(angle) * radius, Math.sin(angle) * radius, z]
  })
}

function pushTriangle(
  positions: number[],
  normals: number[],
  a: Vec3,
  b: Vec3,
  c: Vec3
) {
  const normal = normalize(cross(subtract(b, a), subtract(c, a)))

  positions.push(...a, ...b, ...c)
  normals.push(...normal, ...normal, ...normal)
}

function createGemGeometry(): { positions: Float32Array; normals: Float32Array; count: number } {
  const positions: number[] = []
  const normals: number[] = []

  const topCenter: Vec3 = [0, 0, 0.36]
  const table = makeRing(0.28, 0.24, 8, Math.PI / 8)
  const crown = makeRing(0.46, 0.10, 8)
  const girdle = makeRing(0.62, 0.0, 8, Math.PI / 8)
  const pavilion = makeRing(0.26, -0.36, 8)
  const culet: Vec3 = [0, 0, -0.72]

  for (let index = 0; index < 8; index += 1) {
    const next = (index + 1) % 8
    pushTriangle(positions, normals, topCenter, table[index], table[next])
  }

  for (let index = 0; index < 8; index += 1) {
    const next = (index + 1) % 8
    pushTriangle(positions, normals, table[index], crown[index], table[next])
    pushTriangle(positions, normals, table[next], crown[index], crown[next])
    pushTriangle(positions, normals, crown[index], girdle[index], crown[next])
    pushTriangle(positions, normals, crown[next], girdle[index], girdle[next])
  }

  for (let index = 0; index < 8; index += 1) {
    const next = (index + 1) % 8
    pushTriangle(positions, normals, girdle[index], pavilion[index], girdle[next])
    pushTriangle(positions, normals, girdle[next], pavilion[index], pavilion[next])
    pushTriangle(positions, normals, pavilion[index], culet, pavilion[next])
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    count: positions.length / 3,
  }
}

function drawFallback(canvas: HTMLCanvasElement, options: GemWebGLOptions) {
  const context = canvas.getContext('2d')
  if (!context) return

  const width = canvas.width
  const height = canvas.height
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) * 0.34

  context.clearRect(0, 0, width, height)

  const gradient = context.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius)
  gradient.addColorStop(0, options.gradientTop)
  gradient.addColorStop(0.48, options.gradientMid)
  gradient.addColorStop(1, options.gradientBottom)

  context.beginPath()
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2 - Math.PI / 2
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius
    if (index === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  }
  context.closePath()
  context.fillStyle = gradient
  context.fill()
}

export function mountGemWebGL(
  canvas: HTMLCanvasElement,
  options: GemWebGLOptions
): () => void {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
  })

  if (!gl) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.max(1, Math.round(rect.width * ratio))
    canvas.height = Math.max(1, Math.round(rect.height * ratio))
    drawFallback(canvas, options)
    return () => {}
  }

  const program = createProgram(gl)
  const geometry = createGemGeometry()

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
  const uRotation = gl.getUniformLocation(program, 'uRotation')
  const uScale = gl.getUniformLocation(program, 'uScale')
  const uTopColor = gl.getUniformLocation(program, 'uTopColor')
  const uMidColor = gl.getUniformLocation(program, 'uMidColor')
  const uBottomColor = gl.getUniformLocation(program, 'uBottomColor')
  const uGlowColor = gl.getUniformLocation(program, 'uGlowColor')
  const uHighlightColor = gl.getUniformLocation(program, 'uHighlightColor')
  const uTime = gl.getUniformLocation(program, 'uTime')
  const uHover = gl.getUniformLocation(program, 'uHover')
  const uGlowStrength = gl.getUniformLocation(program, 'uGlowStrength')

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.enableVertexAttribArray(aPosition)
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
  gl.enableVertexAttribArray(aNormal)
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0)

  const topColor = parseColor(options.gradientTop)
  const midColor = parseColor(options.gradientMid)
  const bottomColor = parseColor(options.gradientBottom)
  const glowColor = parseColor(options.glowClose)
  const highlightColor = parseColor(options.facetHighlight)

  gl.uniform3fv(uTopColor, topColor)
  gl.uniform3fv(uMidColor, midColor)
  gl.uniform3fv(uBottomColor, bottomColor)
  gl.uniform3fv(uGlowColor, glowColor)
  gl.uniform3fv(uHighlightColor, highlightColor)
  gl.uniform1f(uScale, 0.9)

  gl.clearColor(0, 0, 0, 0)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.enable(gl.DEPTH_TEST)

  let hover = 0
  let hoverTarget = 0
  let rafId = 0
  let disposed = false

  const parent = canvas.closest('button')
  const onEnter = () => {
    hoverTarget = 1
  }
  const onLeave = () => {
    hoverTarget = 0
  }

  parent?.addEventListener('mouseenter', onEnter)
  parent?.addEventListener('mouseleave', onLeave)
  parent?.addEventListener('focus', onEnter)
  parent?.addEventListener('blur', onLeave)

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const rect = canvas.getBoundingClientRect()
    const width = Math.max(1, Math.round(rect.width * ratio))
    const height = Math.max(1, Math.round(rect.height * ratio))

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    gl.viewport(0, 0, width, height)
  }

  const render = (now: number) => {
    if (disposed) return

    resize()

    const time = now * 0.001
    hover += (hoverTarget - hover) * 0.08

    const pulseWave = options.pulse ? (Math.sin(time * 2.8) * 0.5 + 0.5) : 0
    const glowStrength = options.disabled
      ? 0.12
      : options.glow
        ? 0.55 + hover * 0.35 + pulseWave * 0.18
        : 0.14 + hover * 0.08

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.uniform2f(
      uRotation,
      -0.48 + Math.sin(time * 0.8) * 0.16 + hover * 0.06,
      time * 0.92 + hover * 0.22
    )
    gl.uniform1f(uTime, time)
    gl.uniform1f(uHover, hover)
    gl.uniform1f(uGlowStrength, glowStrength)
    gl.drawArrays(gl.TRIANGLES, 0, geometry.count)

    rafId = window.requestAnimationFrame(render)
  }

  rafId = window.requestAnimationFrame(render)

  return () => {
    disposed = true
    window.cancelAnimationFrame(rafId)
    parent?.removeEventListener('mouseenter', onEnter)
    parent?.removeEventListener('mouseleave', onLeave)
    parent?.removeEventListener('focus', onEnter)
    parent?.removeEventListener('blur', onLeave)
    gl.deleteBuffer(positionBuffer)
    gl.deleteBuffer(normalBuffer)
    gl.deleteProgram(program)
  }
}
