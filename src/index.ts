export { GemBadge } from './components/GemBadge'
export { GemButton } from './components/GemButton'
export type {
  GemBadgeConfig,
  GemBadgeProps,
  GemBadgeRenderMode,
  GemButtonProps,
  GemCut,
  GemMaterial,
  GemType,
  GemSize,
  GemView,
} from './types'

import React from 'react'
import { GemButton } from './components/GemButton'
import type { GemButtonProps, GemType } from './types'

type OmitGem = Omit<GemButtonProps, 'gem'>

function makeGemButton(gemType: GemType, displayName: string) {
  const Btn = (props: OmitGem) =>
    React.createElement(GemButton, { gem: gemType, ...props })
  Btn.displayName = displayName
  return Btn
}

export const DiamondButton  = makeGemButton('diamond',  'DiamondButton')
export const RubyButton     = makeGemButton('ruby',     'RubyButton')
export const EmeraldButton  = makeGemButton('emerald',  'EmeraldButton')
export const SapphireButton = makeGemButton('sapphire', 'SapphireButton')
export const AmethystButton = makeGemButton('amethyst', 'AmethystButton')
export const TopazButton    = makeGemButton('topaz',    'TopazButton')
