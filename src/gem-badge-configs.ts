import type { GemCut, GemMaterial } from './types'

export interface GemBadgeMaterialConfig {
  baseColor: string
  glowColor: string
  absorption: readonly [number, number, number]
  refractiveIndex: number
  dispersion: number
  haloColor: string
  highlightColor: string
  shadowColor: string
}

export interface GemCutSupport {
  webgl: boolean
}

export const GEM_BADGE_MATERIALS: Record<GemMaterial, GemBadgeMaterialConfig> = {
  diamond: {
    baseColor: '#f5f9ff',
    glowColor: '#dce9f8',
    absorption: [0.08, 0.06, 0.05],
    refractiveIndex: 2.42,
    dispersion: 0.028,
    haloColor: '#edf5ff',
    highlightColor: '#ffffff',
    shadowColor: '#3a4456',
  },
  ruby: {
    baseColor: '#ff5a6c',
    glowColor: '#ff3f54',
    absorption: [0.18, 1.35, 1.7],
    refractiveIndex: 1.77,
    dispersion: 0.010,
    haloColor: '#ff9aa4',
    highlightColor: '#fff0f2',
    shadowColor: '#401017',
  },
  emerald: {
    baseColor: '#3fe08a',
    glowColor: '#2ddc79',
    absorption: [1.1, 0.2, 1.0],
    refractiveIndex: 1.58,
    dispersion: 0.008,
    haloColor: '#8ff4bc',
    highlightColor: '#f2fff8',
    shadowColor: '#123322',
  },
  sapphire: {
    baseColor: '#4f8dff',
    glowColor: '#3f78ff',
    absorption: [1.0, 0.45, 0.16],
    refractiveIndex: 1.77,
    dispersion: 0.011,
    haloColor: '#a9c8ff',
    highlightColor: '#f4f8ff',
    shadowColor: '#13284a',
  },
  amethyst: {
    baseColor: '#b874ff',
    glowColor: '#aa63ff',
    absorption: [0.55, 1.0, 0.18],
    refractiveIndex: 1.55,
    dispersion: 0.009,
    haloColor: '#e0beff',
    highlightColor: '#faf4ff',
    shadowColor: '#2f1640',
  },
  topaz: {
    baseColor: '#ffcb58',
    glowColor: '#ffb72f',
    absorption: [0.08, 0.32, 1.1],
    refractiveIndex: 1.62,
    dispersion: 0.012,
    haloColor: '#ffe4a7',
    highlightColor: '#fff9ec',
    shadowColor: '#4b3210',
  },
}

export const GEM_CUT_SUPPORT: Record<GemCut, GemCutSupport> = {
  round: { webgl: true },
  princess: { webgl: true },
  oval: { webgl: true },
  emerald: { webgl: true },
  heart: { webgl: true },
  marquise: { webgl: true },
}
