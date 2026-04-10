import { describe, expect, it } from 'vitest'
import { GEM_BADGE_MATERIALS, GEM_CUT_SUPPORT } from '../gem-badge-configs'
import { GEM_CONFIGS } from '../gem-configs'

const gemTypes = [
  'diamond',
  'ruby',
  'emerald',
  'sapphire',
  'amethyst',
  'topaz',
] as const

const gemCuts = [
  'round',
  'princess',
  'oval',
  'emerald',
  'heart',
  'marquise',
] as const

describe('configuration tables', () => {
  it('define button visuals for every supported gem type', () => {
    expect(Object.keys(GEM_CONFIGS).sort()).toEqual([...gemTypes].sort())

    for (const gemType of gemTypes) {
      expect(GEM_CONFIGS[gemType]).toEqual(
        expect.objectContaining({
          gradientTop: expect.any(String),
          gradientMid: expect.any(String),
          gradientBottom: expect.any(String),
          textColor: expect.any(String),
        }),
      )
    }
  })

  it('define badge materials for every supported gem type', () => {
    expect(Object.keys(GEM_BADGE_MATERIALS).sort()).toEqual([...gemTypes].sort())

    for (const gemType of gemTypes) {
      expect(GEM_BADGE_MATERIALS[gemType]).toEqual(
        expect.objectContaining({
          baseColor: expect.any(String),
          glowColor: expect.any(String),
          refractiveIndex: expect.any(Number),
          dispersion: expect.any(Number),
        }),
      )
    }
  })

  it('marks every supported cut as WebGL-capable', () => {
    expect(Object.keys(GEM_CUT_SUPPORT).sort()).toEqual([...gemCuts].sort())

    for (const gemCut of gemCuts) {
      expect(GEM_CUT_SUPPORT[gemCut]).toEqual({ webgl: true })
    }
  })
})
