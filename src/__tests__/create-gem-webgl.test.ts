import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountGemWebGL } from '../utils/create-gem-webgl'

function create2dContext() {
  const gradient = {
    addColorStop: vi.fn(),
  }

  return {
    clearRect: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    set fillStyle(_value: unknown) {},
  }
}

function createWebGLContext() {
  const shader = { kind: 'shader' } as unknown as WebGLShader
  const program = { kind: 'program' } as unknown as WebGLProgram
  const positionBuffer = { kind: 'position-buffer' } as unknown as WebGLBuffer
  const normalBuffer = { kind: 'normal-buffer' } as unknown as WebGLBuffer

  return {
    COMPILE_STATUS: 1,
    LINK_STATUS: 2,
    VERTEX_SHADER: 3,
    FRAGMENT_SHADER: 4,
    ARRAY_BUFFER: 5,
    STATIC_DRAW: 6,
    FLOAT: 7,
    BLEND: 8,
    SRC_ALPHA: 9,
    ONE_MINUS_SRC_ALPHA: 10,
    DEPTH_TEST: 11,
    COLOR_BUFFER_BIT: 12,
    DEPTH_BUFFER_BIT: 13,
    TRIANGLES: 14,
    createShader: vi.fn(() => shader),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ''),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => program),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ''),
    deleteProgram: vi.fn(),
    createBuffer: vi
      .fn()
      .mockReturnValueOnce(positionBuffer)
      .mockReturnValueOnce(normalBuffer),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    useProgram: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    getUniformLocation: vi.fn(() => ({ kind: 'uniform' })),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    uniform3fv: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    clearColor: vi.fn(),
    enable: vi.fn(),
    blendFunc: vi.fn(),
    viewport: vi.fn(),
    clear: vi.fn(),
    drawArrays: vi.fn(),
    deleteBuffer: vi.fn(),
  } as unknown as WebGLRenderingContext
}

describe('mountGemWebGL', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('falls back to a 2D gem drawing when WebGL is unavailable', () => {
    const canvas = document.createElement('canvas')
    const context2d = create2dContext()

    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      width: 120,
      height: 80,
      top: 0,
      left: 0,
      right: 120,
      bottom: 80,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    vi.spyOn(canvas, 'getContext').mockImplementation((type: string) => {
      if (type === 'webgl') return null
      if (type === '2d') return context2d as unknown as RenderingContext
      return null
    })

    const cleanup = mountGemWebGL(canvas, {
      gradientTop: '#123456',
      gradientMid: '#abcdef',
      gradientBottom: '#654321',
      glowClose: '#ffffff',
      facetHighlight: '#ffeedd',
      pulse: false,
      glow: true,
    })

    expect(canvas.width).toBe(120)
    expect(canvas.height).toBe(80)
    expect(context2d.clearRect).toHaveBeenCalledWith(0, 0, 120, 80)
    expect(context2d.createLinearGradient).toHaveBeenCalled()
    expect(context2d.fill).toHaveBeenCalledTimes(1)

    expect(cleanup).not.toThrow()
  })

  it('initializes WebGL, renders a frame, and disposes resources on cleanup', () => {
    const button = document.createElement('button')
    const canvas = document.createElement('canvas')
    button.appendChild(canvas)

    const gl = createWebGLContext()
    let rafCallback: FrameRequestCallback | null = null

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      rafCallback = callback
      return 7
    })
    const cancelAnimationFrameSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {})

    vi.spyOn(canvas, 'closest').mockImplementation((selector: string) => {
      return selector === 'button' ? button : null
    })
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      width: 64,
      height: 64,
      top: 0,
      left: 0,
      right: 64,
      bottom: 64,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    vi.spyOn(canvas, 'getContext').mockImplementation((type: string) => {
      if (type === 'webgl') return gl as unknown as RenderingContext
      return null
    })

    const cleanup = mountGemWebGL(canvas, {
      gradientTop: '#123456',
      gradientMid: '#abcdef',
      gradientBottom: '#654321',
      glowClose: '#ffffff',
      facetHighlight: '#ffeedd',
      pulse: true,
      glow: true,
      disabled: false,
    })

    button.dispatchEvent(new Event('mouseenter'))
    rafCallback?.(1000)

    expect(gl.useProgram).toHaveBeenCalled()
    expect(gl.viewport).toHaveBeenCalledWith(0, 0, 64, 64)
    expect(gl.uniform2f).toHaveBeenCalled()
    expect(gl.uniform1f).toHaveBeenCalled()
    expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLES, 0, expect.any(Number))

    cleanup()

    expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(7)
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(2)
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1)
  })
})
