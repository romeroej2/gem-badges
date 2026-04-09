import type { GemBadgeConfig, GemCut, GemMaterial } from '../../types'

export interface GemBadgeWebGLOptions extends Required<Pick<GemBadgeConfig, 'animate' | 'cut' | 'glow' | 'glowIntensity' | 'view' | 'rotation'>> {
  material: GemMaterial
  disabled?: boolean
  force2d?: boolean
  targetElement?: HTMLElement | null
  onContextLost?: () => void
}

export interface WebGLCoreController {
  dispose: () => void
  setRotation: (rotation: number) => void
}

export interface GemBadgeWebGLController {
  cleanup: () => void
  setRotation: (rotation: number) => void
}

export interface PreparedGeometry {
  positions: Float32Array
  normals: Float32Array
  count: number
  facetCount: number
  facetNormals: Float32Array
  facetPoints: Float32Array
}

export type { GemCut }
