'use client'

import React from 'react'
import {
  GemBadge as LibraryGemBadge,
  type GemBadgeProps as LibraryGemBadgeProps,
  type GemBadgeRenderMode,
  type GemCut,
  type GemMaterial,
  type GemView,
} from '../../src'

export type DiamondCut = GemCut
export type GemBadgeStone = GemMaterial
export type { GemBadgeRenderMode, GemView }

export interface GemBadgeProps extends Omit<LibraryGemBadgeProps, 'config'> {
  stone?: GemBadgeStone
  cut?: DiamondCut
  size?: number
  glow?: boolean
  glowIntensity?: number
  renderMode?: GemBadgeRenderMode
  animate?: boolean
  view?: GemView
  rotation?: number
}

export function GemBadge({
  stone = 'diamond',
  cut = 'round',
  size = 72,
  glow = true,
  glowIntensity = 1,
  renderMode = 'auto',
  animate = false,
  view = 'top',
  rotation = 0,
  ...rest
}: GemBadgeProps) {
  return (
    <LibraryGemBadge
      config={{
        material: stone,
        cut,
        size,
        glow,
        glowIntensity,
        renderMode,
        animate,
        view,
        rotation,
      }}
      {...rest}
    />
  )
}
