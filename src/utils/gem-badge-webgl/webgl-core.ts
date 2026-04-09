import { GEM_BADGE_MATERIALS } from '../../gem-badge-configs'
import { getPreparedGeometry } from './geometry'
import { createProgram, parseColor } from './program'
import type { GemBadgeWebGLOptions, WebGLCoreController } from './types'

export function mountWebGLCore(
  canvas: HTMLCanvasElement,
  options: GemBadgeWebGLOptions
): WebGLCoreController | null {
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
  const uView = gl.getUniformLocation(program, 'uView')
  const uRotation = gl.getUniformLocation(program, 'uRotation')

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
    gl.uniform1i(uView, options.view === 'front' ? 1 : 0)
    gl.uniform1f(uRotation, options.rotation)
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
    options.onContextLost?.()
  }

  canvas.addEventListener('webglcontextlost', onContextLost)

  resizeObserver?.observe(canvas)
  window.addEventListener('resize', resize)

  rafId = window.requestAnimationFrame(render)

  return {
    dispose: () => {
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
    },
    setRotation: (rotation: number) => {
      options.rotation = rotation
      needsRender = true
    },
  }
}

export function makeOverlayCanvas(): HTMLCanvasElement {
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
