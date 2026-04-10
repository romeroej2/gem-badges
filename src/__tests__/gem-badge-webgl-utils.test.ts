import { describe, expect, it, vi } from 'vitest'
import { drawFallback } from '../utils/gem-badge-webgl/fallback'
import { createProgram, parseColor } from '../utils/gem-badge-webgl/program'

function createCanvas2dContext() {
  const gradient = {
    addColorStop: vi.fn(),
  }

  return {
    clearRect: vi.fn(),
    save: vi.fn(),
    translate: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    bezierCurveTo: vi.fn(),
    createRadialGradient: vi.fn(() => gradient),
    fill: vi.fn(),
    stroke: vi.fn(),
    restore: vi.fn(),
    set fillStyle(_value: unknown) {},
    set lineWidth(_value: unknown) {},
    set strokeStyle(_value: unknown) {},
    set globalAlpha(_value: unknown) {},
  }
}

function createProgramGl() {
  const vertexShader = { id: 'vertex' } as unknown as WebGLShader
  const fragmentShader = { id: 'fragment' } as unknown as WebGLShader
  const program = { id: 'program' } as unknown as WebGLProgram

  return {
    COMPILE_STATUS: 1,
    LINK_STATUS: 2,
    VERTEX_SHADER: 3,
    FRAGMENT_SHADER: 4,
    createShader: vi
      .fn()
      .mockReturnValueOnce(vertexShader)
      .mockReturnValueOnce(fragmentShader),
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
  } as unknown as WebGLRenderingContext
}

describe('gem badge webgl helpers', () => {
  it('draws round and heart fallbacks with the expected canvas operations', () => {
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 80
    const context = createCanvas2dContext()

    vi.spyOn(canvas, 'getContext').mockImplementation((type: string) => {
      if (type === '2d') return context as unknown as RenderingContext
      return null
    })

    drawFallback(canvas, {
      material: 'diamond',
      cut: 'round',
      animate: false,
      glow: true,
      glowIntensity: 1,
      rotation: 0,
      view: 'top',
    })
    drawFallback(canvas, {
      material: 'ruby',
      cut: 'heart',
      animate: false,
      glow: true,
      glowIntensity: 1,
      rotation: 0,
      view: 'top',
    })

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 100, 80)
    expect(context.arc).toHaveBeenCalled()
    expect(context.lineTo).toHaveBeenCalled()
    expect(context.fill).toHaveBeenCalledTimes(2)
    expect(context.stroke).toHaveBeenCalledTimes(2)
  })

  it('parses colors and creates a linked WebGL program', () => {
    const gl = createProgramGl()

    expect(parseColor('#0f8')).toEqual([0, 1, 136 / 255])
    expect(parseColor('not-a-color')).toEqual([1, 1, 1])

    const program = createProgram(gl)

    expect(program).toBeTruthy()
    expect(gl.attachShader).toHaveBeenCalledTimes(2)
    expect(gl.linkProgram).toHaveBeenCalledTimes(1)
    expect(gl.deleteShader).toHaveBeenCalledTimes(2)
  })
})
