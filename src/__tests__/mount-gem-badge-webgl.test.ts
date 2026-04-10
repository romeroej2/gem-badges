import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  drawFallbackMock,
  getPreparedGeometryMock,
  mountWebGLCoreMock,
} = vi.hoisted(() => ({
  drawFallbackMock: vi.fn(),
  getPreparedGeometryMock: vi.fn(),
  mountWebGLCoreMock: vi.fn(),
}))

vi.mock('../utils/gem-badge-webgl/fallback', () => ({
  drawFallback: drawFallbackMock,
}))

vi.mock('../utils/gem-badge-webgl/geometry', () => ({
  getPreparedGeometry: getPreparedGeometryMock,
}))

vi.mock('../utils/gem-badge-webgl/webgl-core', async () => {
  const actual = await vi.importActual('../utils/gem-badge-webgl/webgl-core')
  return {
    ...actual,
    mountWebGLCore: mountWebGLCoreMock,
  }
})

import { mountGemBadgeWebGL } from '../utils/gem-badge-webgl/mount'

describe('mountGemBadgeWebGL', () => {
  beforeEach(() => {
    vi.useRealTimers()
    drawFallbackMock.mockReset()
    getPreparedGeometryMock.mockReset()
    mountWebGLCoreMock.mockReset()
  })

  it('keeps the fallback canvas when forced into 2D mode', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 90,
      height: 70,
      top: 0,
      left: 0,
      right: 90,
      bottom: 70,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    const controller = mountGemBadgeWebGL(container, {
      material: 'diamond',
      cut: 'round',
      glow: true,
      glowIntensity: 1,
      animate: false,
      view: 'top',
      rotation: 0,
      force2d: true,
    })

    expect(drawFallbackMock).toHaveBeenCalledTimes(1)
    expect(container.querySelectorAll('canvas')).toHaveLength(1)
    expect(mountWebGLCoreMock).not.toHaveBeenCalled()

    controller.cleanup()

    expect(container.querySelectorAll('canvas')).toHaveLength(0)
  })

  it('activates WebGL immediately when IntersectionObserver is unavailable', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const previousObserver = globalThis.IntersectionObserver

    getPreparedGeometryMock.mockReturnValue({ ok: true })

    const dispose = vi.fn()
    const setRotation = vi.fn()
    mountWebGLCoreMock.mockReturnValue({ dispose, setRotation })

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 96,
      height: 96,
      top: 0,
      left: 0,
      right: 96,
      bottom: 96,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    // @ts-expect-error test override
    delete globalThis.IntersectionObserver

    try {
      const controller = mountGemBadgeWebGL(container, {
        material: 'ruby',
        cut: 'heart',
        glow: true,
        glowIntensity: 1.4,
        animate: true,
        view: 'front',
        rotation: 45,
      })

      const canvases = container.querySelectorAll('canvas')
      expect(canvases).toHaveLength(2)
      expect(mountWebGLCoreMock).toHaveBeenCalledTimes(1)
      expect(canvases[0].style.opacity).toBe('0')

      controller.setRotation(180)
      expect(setRotation).toHaveBeenCalledWith(180)

      controller.cleanup()
      expect(dispose).toHaveBeenCalledTimes(1)
      expect(container.querySelectorAll('canvas')).toHaveLength(0)
    } finally {
      globalThis.IntersectionObserver = previousObserver
    }
  })

  it('waits for intersection before activating WebGL and disconnects on cleanup', () => {
    vi.useFakeTimers()

    const container = document.createElement('div')
    document.body.appendChild(container)
    const callbacks: Array<(entries: Array<{ isIntersecting: boolean }>) => void> = []
    const disconnect = vi.fn()

    class FakeIntersectionObserver {
      constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
        callbacks.push(callback)
      }

      observe() {}

      disconnect() {
        disconnect()
      }
    }

    // @ts-expect-error test double
    globalThis.IntersectionObserver = FakeIntersectionObserver

    getPreparedGeometryMock.mockReturnValue({ ok: true })
    mountWebGLCoreMock.mockReturnValue({
      dispose: vi.fn(),
      setRotation: vi.fn(),
    })

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 80,
      height: 80,
      top: 0,
      left: 0,
      right: 80,
      bottom: 80,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    const controller = mountGemBadgeWebGL(container, {
      material: 'emerald',
      cut: 'emerald',
      glow: true,
      glowIntensity: 1,
      animate: false,
      view: 'top',
      rotation: 0,
    })

    expect(mountWebGLCoreMock).not.toHaveBeenCalled()

    callbacks[0]([{ isIntersecting: true }])
    vi.advanceTimersByTime(100)

    expect(mountWebGLCoreMock).toHaveBeenCalledTimes(1)

    controller.cleanup()

    expect(disconnect).toHaveBeenCalledTimes(1)
  })
})
