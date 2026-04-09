import { drawFallback } from './fallback'
import { getPreparedGeometry } from './geometry'
import type { GemBadgeWebGLController, GemBadgeWebGLOptions, WebGLCoreController } from './types'
import { makeOverlayCanvas, mountWebGLCore } from './webgl-core'

export function mountGemBadgeWebGL(
  container: HTMLElement,
  options: GemBadgeWebGLOptions
): GemBadgeWebGLController {
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

  if (options.force2d || !getPreparedGeometry(options.cut)) {
    return {
      cleanup: () => {
        fallbackCanvas.remove()
      },
      setRotation: () => {},
    }
  }

  let outerDisposed = false
  let webglCanvas: HTMLCanvasElement | null = null
  let webglCleanup: (() => void) | null = null
  let webglCoreRef: WebGLCoreController | null = null
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

    const core = mountWebGLCore(webglCanvas, { ...options, targetElement: container, onContextLost })
    if (core) {
      fallbackCanvas.style.opacity = '0'
      webglCleanup = () => {
        core.dispose()
        webglCanvas?.remove()
        webglCanvas = null
        fallbackCanvas.style.opacity = '1'
      }
      webglCoreRef = core
    } else {
      webglCanvas.remove()
      webglCanvas = null
      webglFailed = true
    }
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
    return {
      cleanup: () => {
        outerDisposed = true
        if (debounceTimer) clearTimeout(debounceTimer)
        webglCleanup?.()
        fallbackCanvas.remove()
      },
      setRotation: (rotation: number) => {
        options.rotation = rotation
        webglCoreRef?.setRotation(rotation)
      },
    }
  }

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => debouncedToggle(entry.isIntersecting)),
    { threshold: 0.01 }
  )
  observer.observe(container)

  return {
    cleanup: () => {
      outerDisposed = true
      if (debounceTimer) clearTimeout(debounceTimer)
      if (retryTimer) clearTimeout(retryTimer)
      observer.disconnect()
      webglCleanup?.()
      fallbackCanvas.remove()
    },
    setRotation: (rotation: number) => {
      options.rotation = rotation
      webglCoreRef?.setRotation(rotation)
    },
  }
}
