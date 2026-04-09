import { GEM_BADGE_MATERIALS } from '../../gem-badge-configs'
import { traceHeartPath } from './cuts/heart'
import type { GemBadgeWebGLOptions } from './types'

export function drawFallback(canvas: HTMLCanvasElement, options: GemBadgeWebGLOptions) {
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
    traceHeartPath(context, radius)
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
