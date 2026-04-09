import type React from 'react'

export type GemType =
  | 'diamond'
  | 'ruby'
  | 'emerald'
  | 'sapphire'
  | 'amethyst'
  | 'topaz'

export type GemSize = 'sm' | 'md' | 'lg' | 'xl'

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
