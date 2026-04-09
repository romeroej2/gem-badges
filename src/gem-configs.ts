import type { GemType } from './types'

export interface GemConfig {
  /** Top stop of the primary gradient (bright facet) */
  gradientTop: string
  /** Mid stop of the primary gradient (base color) */
  gradientMid: string
  /** Bottom stop of the primary gradient (deep shadow facet) */
  gradientBottom: string
  /** CSS border color */
  border: string
  /** Inner top-left specular highlight (inset box-shadow) */
  facetHighlight: string
  /** Inner bottom-right shadow facet (inset box-shadow) */
  facetShadow: string
  /** Close outer glow color */
  glowClose: string
  /** Diffuse outer glow (lower opacity) */
  glowDiffuse: string
  /** Button text color */
  textColor: string
  /** Shimmer stripe color for the ::after hover effect */
  shimmer: string
  /** CSS custom property value for ::before facet overlay */
  facetOverlay: string
}

export const GEM_CONFIGS: Record<GemType, GemConfig> = {
  diamond: {
    gradientTop:     'rgba(225,242,255,0.98)',
    gradientMid:     'rgba(173,216,255,0.88)',
    gradientBottom:  'rgba(100,165,240,0.95)',
    border:          '1px solid rgba(210,235,255,0.85)',
    facetHighlight:  'rgba(255,255,255,0.95)',
    facetShadow:     'rgba(80,130,220,0.45)',
    glowClose:       'rgba(173,216,255,0.85)',
    glowDiffuse:     'rgba(150,200,255,0.30)',
    textColor:       '#0d2550',
    shimmer:         'rgba(255,255,255,0.55)',
    facetOverlay:    'rgba(255,255,255,0.40)',
  },
  ruby: {
    gradientTop:     'rgba(255,85,110,0.97)',
    gradientMid:     'rgba(210,10,40,0.92)',
    gradientBottom:  'rgba(120,0,18,0.97)',
    border:          '1px solid rgba(255,100,120,0.65)',
    facetHighlight:  'rgba(255,170,180,0.75)',
    facetShadow:     'rgba(80,0,12,0.65)',
    glowClose:       'rgba(255,20,50,0.85)',
    glowDiffuse:     'rgba(220,0,40,0.30)',
    textColor:       '#ffffff',
    shimmer:         'rgba(255,200,200,0.45)',
    facetOverlay:    'rgba(255,160,170,0.25)',
  },
  emerald: {
    gradientTop:     'rgba(0,235,105,0.97)',
    gradientMid:     'rgba(0,175,65,0.90)',
    gradientBottom:  'rgba(0,88,32,0.97)',
    border:          '1px solid rgba(0,225,95,0.65)',
    facetHighlight:  'rgba(110,255,165,0.65)',
    facetShadow:     'rgba(0,38,15,0.65)',
    glowClose:       'rgba(0,225,85,0.80)',
    glowDiffuse:     'rgba(0,200,75,0.28)',
    textColor:       '#ffffff',
    shimmer:         'rgba(160,255,190,0.45)',
    facetOverlay:    'rgba(100,255,160,0.20)',
  },
  sapphire: {
    gradientTop:     'rgba(75,145,255,0.97)',
    gradientMid:     'rgba(22,72,225,0.92)',
    gradientBottom:  'rgba(0,28,145,0.97)',
    border:          '1px solid rgba(85,165,255,0.65)',
    facetHighlight:  'rgba(145,195,255,0.72)',
    facetShadow:     'rgba(0,12,82,0.65)',
    glowClose:       'rgba(30,85,255,0.85)',
    glowDiffuse:     'rgba(20,65,245,0.30)',
    textColor:       '#ffffff',
    shimmer:         'rgba(170,210,255,0.45)',
    facetOverlay:    'rgba(130,185,255,0.22)',
  },
  amethyst: {
    gradientTop:     'rgba(195,75,255,0.97)',
    gradientMid:     'rgba(145,18,228,0.90)',
    gradientBottom:  'rgba(78,0,165,0.97)',
    border:          '1px solid rgba(205,105,255,0.65)',
    facetHighlight:  'rgba(225,155,255,0.72)',
    facetShadow:     'rgba(42,0,95,0.65)',
    glowClose:       'rgba(165,22,255,0.85)',
    glowDiffuse:     'rgba(145,12,235,0.30)',
    textColor:       '#ffffff',
    shimmer:         'rgba(225,170,255,0.45)',
    facetOverlay:    'rgba(210,145,255,0.22)',
  },
  topaz: {
    gradientTop:     'rgba(255,222,55,0.97)',
    gradientMid:     'rgba(245,165,5,0.92)',
    gradientBottom:  'rgba(182,92,0,0.97)',
    border:          '1px solid rgba(255,225,105,0.75)',
    facetHighlight:  'rgba(255,252,165,0.85)',
    facetShadow:     'rgba(102,46,0,0.52)',
    glowClose:       'rgba(255,195,0,0.85)',
    glowDiffuse:     'rgba(245,165,0,0.30)',
    textColor:       '#2a1500',
    shimmer:         'rgba(255,248,165,0.55)',
    facetOverlay:    'rgba(255,242,130,0.30)',
  },
}
