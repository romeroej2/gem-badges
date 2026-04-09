import type React from 'react'

export type GemType =
  | 'diamond'
  | 'ruby'
  | 'emerald'
  | 'sapphire'
  | 'amethyst'
  | 'topaz'

export type GemSize = 'sm' | 'md' | 'lg' | 'xl'

export type GemMaterial = GemType

export type GemCut =
  | 'round'
  | 'princess'
  | 'oval'
  | 'emerald'
  | 'heart'
  | 'marquise'

export type GemBadgeRenderMode = 'auto' | 'webgl' | 'dom'

export type GemView = 'top' | 'front'

export interface GemBadgeConfig {
  /** Badge size in CSS pixels */
  size?: number
  /** Material / stone preset */
  material?: GemMaterial
  /** Gem cut preset */
  cut?: GemCut
  /** Preferred renderer */
  renderMode?: GemBadgeRenderMode
  /** View angle: top or front */
  view?: GemView
  /** Rotation angle in degrees (multiples of 45) */
  rotation?: number
  /** Enables the outer glow */
  glow?: boolean
  /** Multiplies the glow intensity */
  glowIntensity?: number
  /** Enables subtle internal animation */
  animate?: boolean
}

export interface GemBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Single config object for badge appearance */
  config?: GemBadgeConfig
}

export interface GemButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The precious stone visual theme */
  gem: GemType
  /** Button size preset */
  size?: GemSize
  /** Show animated outer glow. Defaults to true */
  glow?: boolean
  /** Continuously pulse the glow animation */
  pulse?: boolean
  children?: React.ReactNode
}
