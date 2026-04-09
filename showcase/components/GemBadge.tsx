'use client'

import { useRef, useMemo, useState, type CSSProperties } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'

export type DiamondCut =
  | 'round'
  | 'princess'
  | 'oval'
  | 'emerald'
  | 'heart'
  | 'marquise'

const DIAMOND_SPARKLES = [
  { width: '3.8%', top: '28%', left: '42%', delay: 0.1, duration: 2.8 },
  { width: '2.8%', top: '40%', left: '36%', delay: 0.6, duration: 2.4 },
  { width: '2.4%', top: '47%', left: '49%', delay: 1.0, duration: 2.2 },
  { width: '2.1%', top: '34%', left: '56%', delay: 1.4, duration: 2.6 },
  { width: '2.9%', top: '56%', left: '62%', delay: 0.9, duration: 3.0 },
  { width: '2.0%', top: '62%', left: '28%', delay: 1.8, duration: 2.5 },
]

interface DiamondCutConfig {
  label: string
  maskImage: string
  facetOverlay: string
  sheenOverlay: string
  coreInset: string
  mainGlow: CSSProperties
  topHighlight: CSSProperties
  bottomFlare: CSSProperties
  sideGlow: CSSProperties
}

interface CutGemPalette {
  shellBase: string
  shellEdge: string
  shellGlow: string
  flare: string
  sparkle: string
  facet: string
  facetSoft: string
  shadow: string
}

function makeSvgMask(shapeMarkup: string, viewBox = '0 0 100 100'): string {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${shapeMarkup}</svg>`
  )
  return `url("data:image/svg+xml,${svg}")`
}

function makeMaskStyles(maskImage: string): CSSProperties {
  return {
    WebkitMaskImage: maskImage,
    maskImage,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
  }
}

function makeConicFacetGradient(
  colors: string[],
  rotation = 0,
  origin = '50% 50%'
): string {
  const step = 360 / colors.length
  const stops = colors.map((color, index) => {
    const start = (index * step).toFixed(2)
    const end = ((index + 1) * step).toFixed(2)
    return `${color} ${start}deg ${end}deg`
  })

  return `conic-gradient(from ${rotation}deg at ${origin}, ${stops.join(', ')})`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  }
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function mixHex(a: string, b: string, amount: number): string {
  const rgbA = hexToRgb(a)
  const rgbB = hexToRgb(b)
  const mix = (x: number, y: number) => Math.round(x + (y - x) * amount)
  return `rgb(${mix(rgbA.r, rgbB.r)}, ${mix(rgbA.g, rgbB.g)}, ${mix(rgbA.b, rgbB.b)})`
}

function makeCutGemPalette(cfg: StoneConfig, stone: GemBadgeStone): CutGemPalette {
  const primary = cfg.gemColor
  const glow = cfg.glowColor
  const facet = cfg.halos[0]?.col ?? cfg.gemColor
  const facetSoft = cfg.halos[1]?.col ?? cfg.gemColor
  const sparkleBase = stone === 'diamond' ? '#ffffff' : mixHex(primary, '#ffffff', 0.82)

  return {
    shellBase: mixHex(cfg.coreColor, primary, stone === 'diamond' ? 0.30 : 0.42),
    shellEdge: mixHex(cfg.coreColor, primary, stone === 'diamond' ? 0.62 : 0.76),
    shellGlow: glow,
    flare: mixHex(glow, '#aefcff', stone === 'diamond' ? 0.45 : 0.14),
    sparkle: sparkleBase,
    facet,
    facetSoft,
    shadow: cfg.coreColor,
  }
}

const ROUND_TABLE_MASK = makeSvgMask(
  '<polygon fill="white" points="50,8 78,22 92,50 78,78 50,92 22,78 8,50 22,22" />'
)

const DIAMOND_CUTS: Record<DiamondCut, DiamondCutConfig> = {
  round: {
    label: 'Round',
    maskImage: makeSvgMask('<circle cx="50" cy="50" r="46" fill="white" />'),
    facetOverlay: [
      'conic-gradient(from 202deg, transparent 0deg, rgba(236,244,255,0.18) 30deg, transparent 54deg, rgba(122,136,160,0.12) 92deg, transparent 132deg, rgba(255,255,255,0.18) 172deg, transparent 214deg, rgba(215,228,244,0.12) 268deg, transparent 316deg, rgba(255,238,214,0.12) 340deg, transparent 360deg)',
      'radial-gradient(circle at 50% 50%, transparent 0 24%, rgba(255,255,255,0.10) 24% 26%, transparent 26% 64%, rgba(214,228,245,0.10) 64% 66%, transparent 66%)',
    ].join(', '),
    sheenOverlay: 'conic-gradient(from 212deg, rgba(255,255,255,0.00), rgba(196,214,236,0.16), rgba(255,255,255,0.00), rgba(255,232,208,0.14), rgba(255,255,255,0.00), rgba(188,236,255,0.12), rgba(255,255,255,0.00))',
    coreInset: '18%',
    mainGlow: { inset: '-8%' },
    topHighlight: { width: '38%', height: '38%', top: '10%', left: '18%' },
    bottomFlare: { width: '26%', height: '26%', right: '8%', bottom: '9%' },
    sideGlow: { width: '16%', height: '16%', left: '18%', bottom: '20%' },
  },
  princess: {
    label: 'Princess',
    maskImage: makeSvgMask('<path fill="white" d="M28 6 H72 L94 28 V72 L72 94 H28 L6 72 V28 Z" />'),
    facetOverlay: [
      'linear-gradient(45deg, transparent 34%, rgba(232,242,255,0.18) 50%, transparent 66%)',
      'linear-gradient(-45deg, transparent 34%, rgba(232,242,255,0.18) 50%, transparent 66%)',
      'linear-gradient(90deg, transparent 47%, rgba(110,166,255,0.14) 50%, transparent 53%)',
      'linear-gradient(0deg, transparent 47%, rgba(110,166,255,0.14) 50%, transparent 53%)',
    ].join(', '),
    sheenOverlay: 'linear-gradient(135deg, transparent 24%, rgba(176,214,255,0.18) 40%, transparent 56%), linear-gradient(-35deg, transparent 46%, rgba(98,235,255,0.16) 56%, transparent 66%)',
    coreInset: '16%',
    mainGlow: { inset: '-12%' },
    topHighlight: { width: '46%', height: '40%', top: '7%', left: '14%' },
    bottomFlare: { width: '28%', height: '28%', right: '8%', bottom: '6%' },
    sideGlow: { width: '16%', height: '16%', left: '20%', bottom: '18%' },
  },
  oval: {
    label: 'Oval',
    maskImage: makeSvgMask('<ellipse cx="50" cy="50" rx="36" ry="46" fill="white" />'),
    facetOverlay: [
      'conic-gradient(from 200deg, transparent 0deg, rgba(232,242,255,0.18) 40deg, transparent 76deg, rgba(102,152,255,0.12) 168deg, transparent 208deg, rgba(255,255,255,0.14) 300deg, transparent 340deg)',
      'linear-gradient(90deg, transparent 43%, rgba(170,214,255,0.10) 50%, transparent 57%)',
    ].join(', '),
    sheenOverlay: 'conic-gradient(from 240deg, rgba(255,255,255,0.00), rgba(152,196,255,0.16), rgba(255,255,255,0.00), rgba(88,230,255,0.14), rgba(255,255,255,0.00))',
    coreInset: '13%',
    mainGlow: { inset: '-12% -8%' },
    topHighlight: { width: '40%', height: '42%', top: '8%', left: '17%' },
    bottomFlare: { width: '28%', height: '30%', right: '9%', bottom: '7%' },
    sideGlow: { width: '16%', height: '18%', left: '19%', bottom: '18%' },
  },
  emerald: {
    label: 'Emerald',
    maskImage: makeSvgMask('<path fill="white" d="M22 6 H78 L94 22 V78 L78 94 H22 L6 78 V22 Z" />'),
    facetOverlay: [
      'linear-gradient(90deg, transparent 24%, rgba(212,234,255,0.16) 26%, transparent 28%, transparent 72%, rgba(212,234,255,0.16) 74%, transparent 76%)',
      'linear-gradient(0deg, transparent 24%, rgba(212,234,255,0.16) 26%, transparent 28%, transparent 72%, rgba(212,234,255,0.16) 74%, transparent 76%)',
      'linear-gradient(45deg, transparent 39%, rgba(122,170,255,0.10) 50%, transparent 61%)',
      'linear-gradient(-45deg, transparent 39%, rgba(122,170,255,0.10) 50%, transparent 61%)',
    ].join(', '),
    sheenOverlay: 'linear-gradient(90deg, transparent 30%, rgba(170,210,255,0.16) 50%, transparent 70%), linear-gradient(0deg, transparent 30%, rgba(98,235,255,0.12) 50%, transparent 70%)',
    coreInset: '18%',
    mainGlow: { inset: '-11%' },
    topHighlight: { width: '40%', height: '36%', top: '10%', left: '18%' },
    bottomFlare: { width: '26%', height: '26%', right: '10%', bottom: '8%' },
    sideGlow: { width: '14%', height: '14%', left: '20%', bottom: '18%' },
  },
  heart: {
    label: 'Heart',
    maskImage: makeSvgMask('<path fill="white" d="M50 92 C23 75 6 56 6 33 C6 18 18 8 31 8 C41 8 48 15 50 22 C52 15 59 8 69 8 C82 8 94 18 94 33 C94 56 77 75 50 92 Z" />'),
    facetOverlay: [
      'linear-gradient(135deg, transparent 34%, rgba(236,244,255,0.16) 48%, transparent 62%)',
      'linear-gradient(-135deg, transparent 34%, rgba(236,244,255,0.16) 48%, transparent 62%)',
      'linear-gradient(0deg, transparent 44%, rgba(122,170,255,0.12) 50%, transparent 58%)',
    ].join(', '),
    sheenOverlay: 'conic-gradient(from 260deg, rgba(255,255,255,0.00), rgba(160,200,255,0.16), rgba(255,255,255,0.00), rgba(98,235,255,0.14), rgba(255,255,255,0.00))',
    coreInset: '15%',
    mainGlow: { inset: '-12% -10% -8% -10%' },
    topHighlight: { width: '44%', height: '38%', top: '12%', left: '14%' },
    bottomFlare: { width: '28%', height: '28%', right: '8%', bottom: '10%' },
    sideGlow: { width: '16%', height: '16%', left: '21%', bottom: '20%' },
  },
  marquise: {
    label: 'Marquise',
    maskImage: makeSvgMask('<path fill="white" d="M50 4 C72 16 88 32 96 50 C88 68 72 84 50 96 C28 84 12 68 4 50 C12 32 28 16 50 4 Z" />'),
    facetOverlay: [
      'linear-gradient(45deg, transparent 38%, rgba(236,244,255,0.16) 50%, transparent 62%)',
      'linear-gradient(-45deg, transparent 38%, rgba(236,244,255,0.16) 50%, transparent 62%)',
      'linear-gradient(90deg, transparent 44%, rgba(112,164,255,0.10) 50%, transparent 56%)',
    ].join(', '),
    sheenOverlay: 'conic-gradient(from 240deg, rgba(255,255,255,0.00), rgba(170,206,255,0.16), rgba(255,255,255,0.00), rgba(90,230,255,0.14), rgba(255,255,255,0.00))',
    coreInset: '15%',
    mainGlow: { inset: '-12% -6%' },
    topHighlight: { width: '40%', height: '38%', top: '9%', left: '16%' },
    bottomFlare: { width: '28%', height: '28%', right: '8%', bottom: '8%' },
    sideGlow: { width: '15%', height: '15%', left: '20%', bottom: '19%' },
  },
}

// ─── STONE CONFIGS ────────────────────────────────────────────────────────────

interface StoneConfig {
  gemColor:  string
  glowColor: string
  halos:     { col: string }[]
  coreColor: string
  keyLight:  string
  fillLight: string
  rimLight:  string
  bgColor:   string
  ringColor: string   // rgba prefix, e.g. 'rgba(70,130,255,'
  envPreset: 'dawn' | 'night' | 'sunset' | 'forest' | 'city' | 'lobby' | 'park' | 'studio' | 'warehouse'
}

export const STONE_CONFIGS: Record<string, StoneConfig> = {
  diamond: {
    gemColor:  '#f5f9ff',
    glowColor: '#dce9f8',
    halos:     [{ col: '#f6fbff' }, { col: '#dfe9f7' }, { col: '#bccbdd' }, { col: '#95a6bf' }],
    coreColor: '#313847',
    keyLight:  '#ffffff',
    fillLight: '#e7eefb',
    rimLight:  '#fff1d8',
    bgColor:   '#06101e',
    ringColor: 'rgba(70,130,255,',
    envPreset: 'dawn',
  },
  ruby: {
    gemColor:  '#ff5555',
    glowColor: '#ff1122',
    halos:     [{ col: '#ff4444' }, { col: '#dd2222' }, { col: '#bb1111' }, { col: '#991100' }],
    coreColor: '#2a0408',
    keyLight:  '#ffffff',
    fillLight: '#ff3333',
    rimLight:  '#ffaaaa',
    bgColor:   '#1e0608',
    ringColor: 'rgba(255,55,55,',
    envPreset: 'sunset',
  },
  emerald: {
    gemColor:  '#44ff88',
    glowColor: '#00cc44',
    halos:     [{ col: '#33ee66' }, { col: '#22cc44' }, { col: '#11aa33' }, { col: '#008822' }],
    coreColor: '#04190d',
    keyLight:  '#ffffff',
    fillLight: '#00ff55',
    rimLight:  '#aaffcc',
    bgColor:   '#041a0d',
    ringColor: 'rgba(40,200,90,',
    envPreset: 'forest',
  },
  sapphire: {
    gemColor:  '#4488ff',
    glowColor: '#0033ff',
    halos:     [{ col: '#3366ff' }, { col: '#2244dd' }, { col: '#1133bb' }, { col: '#002299' }],
    coreColor: '#06112a',
    keyLight:  '#ffffff',
    fillLight: '#0055ff',
    rimLight:  '#88aaff',
    bgColor:   '#040a1e',
    ringColor: 'rgba(50,100,255,',
    envPreset: 'dawn',
  },
  amethyst: {
    gemColor:  '#cc66ff',
    glowColor: '#aa11ff',
    halos:     [{ col: '#bb44ff' }, { col: '#9922ee' }, { col: '#7711cc' }, { col: '#5500aa' }],
    coreColor: '#180522',
    keyLight:  '#ffffff',
    fillLight: '#cc33ff',
    rimLight:  '#ddaaff',
    bgColor:   '#100618',
    ringColor: 'rgba(180,60,255,',
    envPreset: 'lobby',
  },
  topaz: {
    gemColor:  '#ffcc44',
    glowColor: '#ffaa00',
    halos:     [{ col: '#ffbb33' }, { col: '#ee9911' }, { col: '#cc7700' }, { col: '#aa5500' }],
    coreColor: '#241303',
    keyLight:  '#ffffff',
    fillLight: '#ffcc00',
    rimLight:  '#ffeeaa',
    bgColor:   '#1a1002',
    ringColor: 'rgba(255,180,30,',
    envPreset: 'sunset',
  },
}

// ─── PRINCESS CUT GEOMETRY ────────────────────────────────────────────────────

function buildPrincessCut(): THREE.BufferGeometry {
  const W  = 0.50
  const T  = 0.27   // half-width of table (54% of girdle)
  const CH = 0.10   // crown height
  const PH = 0.62   // pavilion depth

  /* prettier-ignore */
  const verts = new Float32Array([
    // 0–3: table corners
    -T, CH, -T,   T, CH, -T,   T, CH,  T,  -T, CH,  T,
    // 4–7: girdle corners
    -W,  0, -W,   W,  0, -W,   W,  0,  W,  -W,  0,  W,
    // 8–11: girdle edge midpoints (chevron pavilion + crown star)
     0,  0, -W,   W,  0,  0,   0,  0,  W,  -W,  0,  0,
    // 12: culet
     0, -PH, 0,
    // 13–16: TABLE edge midpoints — create the star bezel crown pattern
     0, CH, -T,   T, CH,  0,   0, CH,  T,  -T, CH,  0,
  ])

  /* prettier-ignore */
  const idx = [
    // TABLE
    0, 3, 2,    0, 2, 1,

    // CROWN front
    0, 13,  8,    0,  8,  4,   13,  1,  5,   13,  5,  8,
    // CROWN right
    1, 14,  9,    1,  9,  5,   14,  2,  6,   14,  6,  9,
    // CROWN back
    3, 15, 10,    3, 10,  7,   15,  2,  6,   15,  6, 10,
    // CROWN left
    3, 16, 11,    3, 11,  7,   16,  0,  4,   16,  4, 11,

    // PAVILION — 2 chevron triangles per side
    4,  8, 12,    8,  5, 12,
    5,  9, 12,    9,  6, 12,
    6, 10, 12,   10,  7, 12,
    7, 11, 12,   11,  4, 12,
  ]

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
  geo.setIndex(idx)
  const flat = geo.toNonIndexed()
  flat.computeVertexNormals()
  return flat
}

function buildFacetRing(
  radius: number,
  y: number,
  count: number,
  angleOffset = 0,
  xScale = 1,
  zScale = 1
): THREE.Vector3[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + angleOffset
    return new THREE.Vector3(
      Math.cos(angle) * radius * xScale,
      y,
      Math.sin(angle) * radius * zScale
    )
  })
}

function buildRoundBrilliantCut(): THREE.BufferGeometry {
  const vertices: THREE.Vector3[] = []
  const indices: number[] = []

  const addVertex = (vertex: THREE.Vector3) => {
    vertices.push(vertex)
    return vertices.length - 1
  }

  const addRing = (
    radius: number,
    y: number,
    count: number,
    angleOffset = 0,
    xScale = 1,
    zScale = 1
  ) => buildFacetRing(radius, y, count, angleOffset, xScale, zScale).map(addVertex)

  const addTri = (a: number, b: number, c: number) => {
    indices.push(a, b, c)
  }

  const topCenter = addVertex(new THREE.Vector3(0, 0.26, 0))
  const table = addRing(0.30, 0.26, 8, 0, 0.98, 1)
  const crown = addRing(0.46, 0.15, 8, Math.PI / 8, 0.99, 1)
  const girdleUpper = addRing(0.64, 0.03, 16, 0, 1, 1.01)
  const girdleLower = addRing(0.62, -0.035, 16, 0, 0.99, 1)
  const pavilion = addRing(0.24, -0.34, 16, Math.PI / 16, 0.97, 1)
  const culet = addVertex(new THREE.Vector3(0, -0.82, 0))

  for (let index = 0; index < 8; index += 1) {
    const next = (index + 1) % 8
    addTri(topCenter, table[index], table[next])
  }

  for (let index = 0; index < 8; index += 1) {
    const next = (index + 1) % 8
    const girdleIndex = index * 2
    const g0 = girdleUpper[girdleIndex]
    const g1 = girdleUpper[(girdleIndex + 1) % 16]
    const g2 = girdleUpper[(girdleIndex + 2) % 16]

    addTri(table[index], crown[index], table[next])
    addTri(table[index], g0, crown[index])
    addTri(crown[index], g0, g1)
    addTri(table[next], crown[index], g2)
    addTri(crown[index], g1, g2)
  }

  for (let index = 0; index < 16; index += 1) {
    const next = (index + 1) % 16
    addTri(girdleUpper[index], girdleUpper[next], girdleLower[index])
    addTri(girdleUpper[next], girdleLower[next], girdleLower[index])
  }

  for (let index = 0; index < 16; index += 1) {
    const next = (index + 1) % 16
    addTri(girdleLower[index], girdleLower[next], pavilion[index])
    addTri(girdleLower[next], pavilion[next], pavilion[index])
    addTri(pavilion[index], pavilion[next], culet)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setFromPoints(vertices)
  geometry.setIndex(indices)

  const faceted = geometry.toNonIndexed()
  faceted.computeVertexNormals()
  faceted.scale(1, 1.04, 1)
  return faceted
}

function DiamondOrb({
  hovered,
  cfg,
  glowAmount,
}: {
  hovered: boolean
  cfg: StoneConfig
  glowAmount: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const shellRef = useRef<THREE.Mesh>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const wispRefs = useRef<THREE.Mesh[]>([])
  const glowRef = useRef<THREE.PointLight>(null)

  const gemCol = useMemo(() => new THREE.Color(cfg.gemColor), [cfg.gemColor])
  const glowCol = useMemo(() => new THREE.Color(cfg.glowColor), [cfg.glowColor])
  const coreCol = useMemo(() => new THREE.Color(cfg.coreColor), [cfg.coreColor])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const hoverLift = hovered ? 1 : 0

    if (groupRef.current) {
      groupRef.current.rotation.z = t * 0.18
      groupRef.current.rotation.y = Math.sin(t * 0.22) * 0.14
      groupRef.current.scale.setScalar(hovered ? 1.05 : 1)
    }

    if (shellRef.current) {
      shellRef.current.rotation.y = -t * 0.14
      shellRef.current.rotation.x = Math.sin(t * 0.3) * 0.08
    }

    if (coreRef.current) {
      coreRef.current.position.x = Math.sin(t * 0.5) * 0.05
      coreRef.current.position.y = Math.cos(t * 0.35) * 0.04
      coreRef.current.scale.setScalar(0.56 + hoverLift * 0.03)
    }

    wispRefs.current.forEach((mesh, index) => {
      if (!mesh) return
      const speed = 0.4 + index * 0.17
      const radius = 0.16 + index * 0.035
      mesh.position.x = Math.cos(t * speed + index) * radius
      mesh.position.y = Math.sin(t * (speed + 0.08) + index * 1.4) * radius * 0.72
      mesh.position.z = Math.sin(t * (speed + 0.22) + index) * 0.08
      mesh.rotation.z = t * (0.25 + index * 0.08)
    })

    if (glowRef.current) {
      glowRef.current.intensity = (hovered ? 18 : 13) * glowAmount
    }
  })

  return (
    <>
      <ambientLight intensity={0.18} color="#7ca4ff" />
      <directionalLight position={[0, 2.8, 2.2]} intensity={1.8} color={cfg.keyLight} />
      <directionalLight position={[-1.8, 1.2, 1.8]} intensity={1.1} color={cfg.fillLight} />
      <directionalLight position={[1.6, -1.5, 1.2]} intensity={0.8} color={cfg.rimLight} />
      <pointLight
        ref={glowRef}
        position={[0, 0, 0.55]}
        distance={3.4}
        decay={2}
        intensity={13}
        color={glowCol}
      />

      <group ref={groupRef}>
        <mesh scale={1.12}>
          <sphereGeometry args={[0.62, 48, 48]} />
          <meshBasicMaterial
            color={cfg.halos[0].col}
            transparent
            opacity={(hovered ? 0.08 : 0.05) * glowAmount}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>

        <mesh scale={1.01}>
          <sphereGeometry args={[0.57, 56, 56]} />
          <meshBasicMaterial
            color="#4f86ff"
            transparent
            opacity={0.08 + glowAmount * 0.10}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>

        <mesh ref={shellRef}>
          <sphereGeometry args={[0.56, 64, 64]} />
          <meshStandardMaterial
            color="#08111f"
            emissive={glowCol}
            emissiveIntensity={0.06 + (hovered ? 0.10 : 0.06) * glowAmount}
            roughness={0.34}
            metalness={0.04}
          />
        </mesh>

        <mesh scale={[0.88, 0.9, 0.88]} position={[0.01, 0.03, 0.02]}>
          <sphereGeometry args={[0.36, 36, 36]} />
          <meshBasicMaterial
            color="#2a74ff"
            transparent
            opacity={0.15 + glowAmount * 0.05}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <mesh scale={[0.68, 0.52, 0.68]} position={[-0.02, 0.06, 0.08]}>
          <sphereGeometry args={[0.18, 24, 24]} />
          <meshBasicMaterial
            color="#79a7ff"
            transparent
            opacity={0.20}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <mesh position={[0.12, 0.14, 0.36]}>
          <sphereGeometry args={[0.18, 24, 24]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.16 + glowAmount * (hovered ? 0.08 : 0.03)}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <mesh ref={coreRef} position={[0.02, -0.02, -0.04]}>
          <sphereGeometry args={[0.24, 40, 40]} />
          <meshStandardMaterial
            color={coreCol}
            emissive={coreCol}
            emissiveIntensity={0.18}
            roughness={0.82}
            metalness={0.1}
            transparent
            opacity={0.72}
          />
        </mesh>

        {cfg.halos.map(({ col }, index) => (
          <mesh
            key={col}
            ref={(node) => {
              if (node) wispRefs.current[index] = node
            }}
            scale={[1.2, 0.7, 1]}
          >
            <sphereGeometry args={[0.12 - index * 0.012, 20, 20]} />
            <meshBasicMaterial
              color={col}
              transparent
              opacity={(0.14 - index * 0.02) + ((hovered ? 0.06 : 0.03) * glowAmount)}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </>
  )
}

// ─── SCENE ────────────────────────────────────────────────────────────────────

function GemScene({
  hovered,
  cfg,
  glowAmount,
}: {
  hovered: boolean
  cfg: StoneConfig
  glowAmount: number
}) {
  if (cfg === STONE_CONFIGS.diamond) {
    return <DiamondOrb hovered={hovered} cfg={cfg} glowAmount={glowAmount} />
  }

  const gemRef  = useRef<THREE.Mesh>(null)
  const geo     = useMemo(() => buildPrincessCut(), [])
  const glwCol  = useMemo(() => new THREE.Color(cfg.glowColor), [cfg.glowColor])
  const gemCol  = useMemo(() => new THREE.Color(cfg.gemColor),  [cfg.gemColor])

  useFrame(({ clock }) => {
    if (!gemRef.current) return
    const t = clock.getElapsedTime()
    gemRef.current.rotation.y = t * (hovered ? 0.60 : 0.28)
    gemRef.current.rotation.x = Math.sin(t * 0.20) * 0.18 - 0.20
  })

  const eI = (hovered ? 1.20 : 0.75) * glowAmount

  return (
    <>
      <Environment preset={cfg.envPreset} />

      <ambientLight intensity={0.15} color="#99bbff" />
      {/* Main key: above-front-right */}
      <directionalLight position={[ 3,  5,  4]} intensity={2.8} color={cfg.keyLight} />
      {/* Tinted fill from the left */}
      <directionalLight position={[-3,  1,  2]} intensity={2.0} color={cfg.fillLight} />
      {/* Cool rim from below-back */}
      <directionalLight position={[ 0, -4, -3]} intensity={1.4} color={cfg.rimLight} />
      {/* Secondary sparkle */}
      <directionalLight position={[-2,  4, -3]} intensity={1.2} color={cfg.keyLight} />
      {/* Inner gem glow */}
      <pointLight position={[0, 0.15, 0.25]} distance={3} decay={2}
                  intensity={15 * glowAmount} color={glwCol} />

      {/* ── Main gem mesh ── */}
      <mesh ref={gemRef} geometry={geo}>
        <meshPhysicalMaterial
          color={gemCol}
          metalness={0.05}
          roughness={0.06}
          clearcoat={1.0}
          clearcoatRoughness={0.0}
          emissive={glwCol}
          emissiveIntensity={eI}
          flatShading
          envMapIntensity={2.5}
        />
      </mesh>

      {/* ── Layered inner glow — four shells ── */}
      {cfg.halos.map(({ col }, i) => {
        const scales = [0.82, 1.10, 1.55, 2.20]
        const baseOps = [0.32, 0.18, 0.09, 0.04]
        const hovOps  = [0.50, 0.28, 0.15, 0.08]
        return (
          <mesh key={i} scale={scales[i]}>
            <sphereGeometry args={[0.62, 14, 10]} />
            <meshBasicMaterial
              color={col}
              transparent
              opacity={(hovered ? hovOps[i] : baseOps[i]) * glowAmount}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={i > 1 ? THREE.BackSide : THREE.FrontSide}
            />
          </mesh>
        )
      })}
    </>
  )
}

// ─── PUBLIC COMPONENT ─────────────────────────────────────────────────────────

export type GemBadgeStone = keyof typeof STONE_CONFIGS

export interface GemBadgeProps {
  /** Stone type — controls color + lighting */
  stone?: GemBadgeStone
  /** Diamond cut to use when stone is diamond */
  cut?: DiamondCut
  /** Diameter in pixels */
  size?: number
  /** Turns the outer glow and bloom on/off */
  glow?: boolean
  /** Multiplies the glow strength when glow is enabled */
  glowIntensity?: number
  onClick?: () => void
  'aria-label'?: string
  className?: string
  style?: React.CSSProperties
}

function DiamondDomOrb({
  glowAmount,
  hovered,
  cut,
}: {
  glowAmount: number
  hovered: boolean
  cut: DiamondCut
}) {
  const cutConfig = DIAMOND_CUTS[cut]
  const maskStyles = makeMaskStyles(cutConfig.maskImage)
  const rimGlow = 0.08 + glowAmount * (hovered ? 0.24 : 0.16)
  const halo = 0.10 + glowAmount * (hovered ? 0.34 : 0.18)
  const shellScale = hovered ? 1.02 : 1

  return (
    <motion.div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
      animate={{
        scale: shellScale,
        rotate: hovered ? 2 : 0,
      }}
      transition={{
        scale: { duration: 0.22, ease: 'easeOut' },
        rotate: { duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
      }}
    >
      <motion.div
        style={{
          position: 'absolute',
          ...cutConfig.mainGlow,
          ...maskStyles,
          background: [
            `radial-gradient(circle at 34% 34%, rgba(120,175,255,${(halo * 0.72).toFixed(2)}) 0%, rgba(120,175,255,${(halo * 0.32).toFixed(2)}) 26%, transparent 58%)`,
            `radial-gradient(circle at 74% 74%, rgba(78,228,255,${(halo * 0.88).toFixed(2)}) 0%, rgba(78,228,255,${(halo * 0.24).toFixed(2)}) 16%, transparent 44%)`,
            `radial-gradient(circle, rgba(70,120,255,${(halo * 0.54).toFixed(2)}) 0%, transparent 70%)`,
          ].join(', '),
          filter: 'blur(12px)',
        }}
        animate={{
          scale: [1, 1.06, 1],
          opacity: [0.92, 1, 0.9],
        }}
        transition={{
          duration: 4.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          ...maskStyles,
          background: [
            'radial-gradient(circle at 28% 24%, rgba(202,228,255,0.95) 0%, rgba(118,164,255,0.56) 14%, rgba(18,34,74,0.18) 28%, transparent 38%)',
            'radial-gradient(circle at 74% 76%, rgba(78,238,255,0.98) 0%, rgba(78,238,255,0.68) 10%, rgba(65,128,255,0.30) 18%, transparent 30%)',
            'radial-gradient(circle at 42% 34%, rgba(96,156,255,0.30) 0%, rgba(26,58,138,0.24) 26%, rgba(3,8,20,0.00) 48%)',
            'radial-gradient(circle at 34% 28%, rgba(88,134,255,0.14) 0%, rgba(18,34,86,0.12) 24%, rgba(2,8,20,0.92) 72%)',
            'radial-gradient(circle at 50% 50%, rgba(7,20,48,0.00) 0%, rgba(7,20,48,0.00) 54%, rgba(96,145,255,0.28) 72%, rgba(8,19,52,0.92) 86%, rgba(3,6,16,1.00) 100%)',
          ].join(', '),
          boxShadow: [
            'inset 0 1px 1px rgba(255,255,255,0.12)',
            'inset 0 -8px 16px rgba(0,0,0,0.42)',
            `0 0 0 1px rgba(150,190,255,0.10)`,
            `0 0 20px rgba(76,122,255,${rimGlow.toFixed(2)})`,
          ].join(', '),
          overflow: 'hidden',
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            inset: cutConfig.coreInset,
            ...maskStyles,
            background: [
              'radial-gradient(circle at 34% 30%, rgba(92,142,255,0.32) 0%, rgba(40,82,190,0.22) 18%, rgba(6,16,44,0.00) 38%)',
              'radial-gradient(circle at 60% 62%, rgba(12,34,86,0.00) 0%, rgba(12,34,86,0.00) 44%, rgba(2,6,20,0.72) 100%)',
            ].join(', '),
            filter: 'blur(4px)',
          }}
          animate={{
            rotate: [0, 20, -12, 0],
            scale: [1, 1.05, 0.98, 1],
            x: ['0%', '2%', '-1%', '0%'],
            y: ['0%', '-2%', '1%', '0%'],
          }}
          transition={{
            duration: 8.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          style={{
            position: 'absolute',
            ...cutConfig.topHighlight,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 42%, rgba(255,255,255,0.96) 0%, rgba(215,232,255,0.64) 18%, rgba(215,232,255,0.10) 48%, transparent 70%)',
            filter: 'blur(3px)',
          }}
          animate={{
            x: ['0%', '4%', '1%', '0%'],
            y: ['0%', '2%', '-2%', '0%'],
            scale: [1, 1.08, 0.96, 1],
            opacity: [0.82, 1, 0.84, 0.82],
          }}
          transition={{
            duration: 5.6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          style={{
            position: 'absolute',
            ...cutConfig.bottomFlare,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 36% 38%, rgba(118,255,255,0.98) 0%, rgba(96,230,255,0.74) 20%, rgba(96,180,255,0.22) 42%, transparent 64%)',
            filter: 'blur(4px)',
            mixBlendMode: 'screen',
          }}
          animate={{
            x: ['0%', '-5%', '3%', '0%'],
            y: ['0%', '-6%', '4%', '0%'],
            scale: [1, 1.18, 0.92, 1],
            opacity: [0.82, 1, 0.74, 0.82],
          }}
          transition={{
            duration: 4.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          style={{
            position: 'absolute',
            ...cutConfig.sideGlow,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(84,126,255,0.88) 0%, rgba(84,126,255,0.18) 56%, transparent 74%)',
            opacity: 0.72,
          }}
          animate={{
            x: ['0%', '10%', '0%'],
            y: ['0%', '-8%', '0%'],
            opacity: [0.44, 0.78, 0.44],
          }}
          transition={{
            duration: 4.1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          style={{
            position: 'absolute',
            inset: '7%',
            ...maskStyles,
            background: cutConfig.sheenOverlay,
            mixBlendMode: 'screen',
            filter: 'blur(1px)',
          }}
          animate={{
            rotate: [0, 360],
            opacity: [0.2, 0.34, 0.2],
          }}
          transition={{
            rotate: { duration: 14, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 4.8, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            ...maskStyles,
            background: [
              'radial-gradient(circle at 30% 22%, rgba(255,255,255,0.95) 0 1.8%, transparent 3%)',
              'radial-gradient(circle at 40% 34%, rgba(190,225,255,0.86) 0 1.2%, transparent 2.3%)',
              'radial-gradient(circle at 49% 45%, rgba(168,212,255,0.82) 0 1.1%, transparent 2.1%)',
              'radial-gradient(circle at 57% 38%, rgba(200,232,255,0.76) 0 1.4%, transparent 2.4%)',
              'radial-gradient(circle at 63% 50%, rgba(182,226,255,0.72) 0 1.0%, transparent 2.1%)',
              'radial-gradient(circle at 36% 58%, rgba(160,210,255,0.65) 0 1.1%, transparent 2.2%)',
              'radial-gradient(circle at 48% 60%, rgba(175,220,255,0.70) 0 0.9%, transparent 2%)',
              'radial-gradient(circle at 58% 70%, rgba(186,228,255,0.82) 0 1.3%, transparent 2.4%)',
              'radial-gradient(circle at 24% 70%, rgba(160,205,255,0.62) 0 1.1%, transparent 2.1%)',
            ].join(', '),
            opacity: 0.78,
          }}
        />

        <motion.div
          style={{
            position: 'absolute',
            inset: '6%',
            ...maskStyles,
            background: cutConfig.facetOverlay,
            mixBlendMode: 'screen',
            opacity: 0.62,
          }}
          animate={{
            rotate: [0, 8, -5, 0],
            opacity: [0.42, 0.68, 0.5, 0.42],
          }}
          transition={{
            duration: 6.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {DIAMOND_SPARKLES.map((sparkle, index) => (
          <motion.div
            key={`${sparkle.top}-${sparkle.left}`}
            style={{
              position: 'absolute',
              width: sparkle.width,
              aspectRatio: '1 / 1',
              top: sparkle.top,
              left: sparkle.left,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(242,248,255,0.98) 0%, rgba(180,220,255,0.72) 32%, rgba(180,220,255,0.06) 70%, transparent 100%)',
              filter: 'blur(0.3px)',
            }}
            animate={{
              scale: [0.7, 1.15, 0.78, 1],
              opacity: [0.35, 0.95, 0.28, 0.72],
            }}
            transition={{
              duration: sparkle.duration,
              delay: sparkle.delay + index * 0.05,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        <div
          style={{
            position: 'absolute',
            inset: '8%',
            ...maskStyles,
            border: '1px solid rgba(214,234,255,0.14)',
            opacity: 0.8,
          }}
        />
      </div>
    </motion.div>
  )
}

function CutGemOrb({
  glowAmount,
  hovered,
  cut,
  cfg,
  stone,
}: {
  glowAmount: number
  hovered: boolean
  cut: DiamondCut
  cfg: StoneConfig
  stone: GemBadgeStone
}) {
  const cutConfig = DIAMOND_CUTS[cut]
  const maskStyles = makeMaskStyles(cutConfig.maskImage)
  const palette = makeCutGemPalette(cfg, stone)
  const roundTableMaskStyles = makeMaskStyles(ROUND_TABLE_MASK)
  const rimGlow = 0.08 + glowAmount * (hovered ? 0.24 : 0.16)
  const halo = 0.10 + glowAmount * (hovered ? 0.34 : 0.18)
  const isRoundDiamond = stone === 'diamond' && cut === 'round'
  const shellBackground = isRoundDiamond
    ? [
        'radial-gradient(circle at 28% 22%, rgba(255,255,255,0.98) 0%, rgba(248,250,255,0.94) 11%, rgba(220,229,240,0.42) 22%, transparent 36%)',
        'radial-gradient(circle at 78% 24%, rgba(255,238,214,0.38) 0%, rgba(255,238,214,0.18) 8%, transparent 19%)',
        'radial-gradient(circle at 22% 82%, rgba(195,232,255,0.34) 0%, rgba(195,232,255,0.14) 9%, transparent 21%)',
        'radial-gradient(circle at 72% 78%, rgba(255,214,232,0.28) 0%, rgba(255,214,232,0.12) 8%, transparent 18%)',
        'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(248,250,255,0.08) 30%, rgba(78,86,98,0.18) 56%, rgba(240,245,252,0.22) 72%, rgba(182,194,209,0.52) 88%, rgba(196,208,223,0.78) 100%)',
      ].join(', ')
    : [
        `radial-gradient(circle at 28% 24%, ${rgba(palette.sparkle, 0.95)} 0%, ${rgba(palette.facetSoft, 0.56)} 14%, ${rgba(palette.shellEdge, 0.18)} 28%, transparent 38%)`,
        `radial-gradient(circle at 74% 76%, ${rgba(palette.flare, 0.98)} 0%, ${rgba(palette.flare, 0.68)} 10%, ${rgba(palette.shellGlow, 0.30)} 18%, transparent 30%)`,
        `radial-gradient(circle at 42% 34%, ${rgba(palette.facet, 0.30)} 0%, ${rgba(palette.facet, 0.24)} 26%, rgba(3,8,20,0.00) 48%)`,
        `radial-gradient(circle at 62% 22%, ${rgba(palette.facetSoft, 0.22)} 0%, ${rgba(palette.facetSoft, 0.08)} 16%, transparent 34%)`,
        `radial-gradient(circle at 34% 28%, ${rgba(palette.facetSoft, 0.14)} 0%, ${rgba(palette.shellEdge, 0.12)} 24%, ${rgba(palette.shadow, 0.92)} 72%)`,
        `radial-gradient(circle at 50% 50%, rgba(7,20,48,0.00) 0%, rgba(7,20,48,0.00) 54%, ${rgba(palette.shellGlow, 0.28)} 72%, ${rgba(palette.shadow, 0.92)} 86%, ${rgba(palette.shadow, 1)} 100%)`,
      ].join(', ')
  const coreBackground = isRoundDiamond
    ? [
        'radial-gradient(circle at 48% 44%, rgba(255,255,255,0.82) 0%, rgba(234,240,248,0.38) 18%, transparent 34%)',
        'radial-gradient(circle at 50% 54%, rgba(24,28,36,0.00) 0%, rgba(24,28,36,0.18) 38%, rgba(24,28,36,0.54) 100%)',
      ].join(', ')
    : [
        `radial-gradient(circle at 34% 30%, ${rgba(palette.facet, 0.32)} 0%, ${rgba(palette.facetSoft, 0.22)} 18%, rgba(6,16,44,0.00) 38%)`,
        `radial-gradient(circle at 60% 62%, rgba(12,34,86,0.00) 0%, rgba(12,34,86,0.00) 44%, ${rgba(palette.shadow, 0.72)} 100%)`,
      ].join(', ')
  const topHighlightBackground = isRoundDiamond
    ? 'radial-gradient(circle at 38% 38%, rgba(255,255,255,0.98) 0%, rgba(252,253,255,0.82) 20%, rgba(225,233,243,0.16) 50%, transparent 72%)'
    : `radial-gradient(circle at 40% 42%, ${rgba(palette.sparkle, 0.96)} 0%, ${rgba(palette.sparkle, 0.64)} 18%, ${rgba(palette.sparkle, 0.10)} 48%, transparent 70%)`
  const bottomFlareBackground = isRoundDiamond
    ? 'radial-gradient(circle at 34% 36%, rgba(255,242,222,0.94) 0%, rgba(210,238,255,0.68) 22%, rgba(185,214,244,0.16) 46%, transparent 68%)'
    : `radial-gradient(circle at 36% 38%, ${rgba(palette.flare, 0.98)} 0%, ${rgba(palette.flare, 0.74)} 20%, ${rgba(palette.flare, 0.22)} 42%, transparent 64%)`
  const sideGlowBackground = isRoundDiamond
    ? 'radial-gradient(circle, rgba(210,226,244,0.92) 0%, rgba(210,226,244,0.22) 56%, transparent 74%)'
    : `radial-gradient(circle, ${rgba(palette.facet, 0.88)} 0%, ${rgba(palette.facet, 0.18)} 56%, transparent 74%)`
  const roundOuterFacetBackground = isRoundDiamond
    ? [
        makeConicFacetGradient([
          'rgba(255,255,255,0.96)',
          'rgba(92,98,110,0.92)',
          'rgba(244,247,251,0.96)',
          'rgba(132,140,154,0.88)',
          'rgba(255,255,255,0.92)',
          'rgba(66,72,84,0.94)',
          'rgba(238,243,249,0.96)',
          'rgba(108,116,132,0.90)',
        ], -12),
        'radial-gradient(circle at 50% 50%, transparent 0 34%, rgba(255,255,255,0.00) 34% 58%, rgba(255,255,255,0.14) 58% 60%, rgba(196,208,222,0.12) 72%, transparent 82%)',
      ].join(', ')
    : ''
  const roundStarFacetBackground = isRoundDiamond
    ? [
        makeConicFacetGradient([
          'rgba(34,38,48,0.86)',
          'rgba(248,250,252,0.88)',
          'rgba(106,114,128,0.84)',
          'rgba(255,255,255,0.90)',
          'rgba(58,64,76,0.88)',
          'rgba(244,246,250,0.88)',
          'rgba(94,102,118,0.82)',
          'rgba(255,255,255,0.92)',
          'rgba(40,44,54,0.84)',
          'rgba(246,249,252,0.90)',
          'rgba(118,126,140,0.82)',
          'rgba(255,255,255,0.94)',
          'rgba(52,58,68,0.88)',
          'rgba(240,244,249,0.88)',
          'rgba(98,106,120,0.84)',
          'rgba(255,255,255,0.92)',
        ], -11.25),
        'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.16) 0 6%, rgba(255,255,255,0.00) 6% 18%, rgba(255,255,255,0.08) 18% 20%, transparent 20%)',
      ].join(', ')
    : ''
  const roundTableBackground = isRoundDiamond
    ? [
        'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(230,237,246,0.82) 44%, rgba(138,148,164,0.64) 52%, rgba(244,247,251,0.90) 62%, rgba(255,255,255,0.96))',
        'radial-gradient(circle at 44% 34%, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.22) 36%, transparent 64%)',
      ].join(', ')
    : ''
  const facetOverlayOpacity = isRoundDiamond ? 0.40 : 0.62
  const patternOverlayOpacity = isRoundDiamond
    ? [0.16, 0.24, 0.18, 0.16]
    : stone === 'diamond'
      ? [0.24, 0.38, 0.26, 0.24]
      : [0.34, 0.50, 0.38, 0.34]
  const sparkleOpacityKeyframes = isRoundDiamond
    ? [0.18, 0.58, 0.14, 0.30]
    : [0.35, 0.95, 0.28, 0.72]

  return (
    <motion.div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
      animate={{
        scale: hovered ? 1.02 : 1,
        rotate: hovered ? 2 : 0,
      }}
      transition={{
        scale: { duration: 0.22, ease: 'easeOut' },
        rotate: { duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
      }}
    >
      <motion.div
        style={{
          position: 'absolute',
          ...cutConfig.mainGlow,
          ...maskStyles,
          background: [
            `radial-gradient(circle at 34% 34%, ${rgba(palette.facetSoft, halo * 0.72)} 0%, ${rgba(palette.facetSoft, halo * 0.32)} 26%, transparent 58%)`,
            `radial-gradient(circle at 74% 74%, ${rgba(palette.flare, halo * 0.88)} 0%, ${rgba(palette.flare, halo * 0.24)} 16%, transparent 44%)`,
            `radial-gradient(circle, ${rgba(palette.shellGlow, halo * 0.54)} 0%, transparent 70%)`,
          ].join(', '),
          filter: 'blur(12px)',
        }}
        animate={{
          scale: [1, 1.06, 1],
          opacity: [0.92, 1, 0.9],
        }}
        transition={{
          duration: 4.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          ...maskStyles,
          background: shellBackground,
          boxShadow: [
            isRoundDiamond ? 'inset 0 1px 1px rgba(255,255,255,0.42)' : `inset 0 1px 1px ${rgba(palette.sparkle, 0.12)}`,
            isRoundDiamond ? 'inset 0 -10px 18px rgba(32,36,42,0.22)' : 'inset 0 -8px 16px rgba(0,0,0,0.42)',
            isRoundDiamond ? '0 0 0 1px rgba(235,242,250,0.32)' : `0 0 0 1px ${rgba(palette.facetSoft, 0.10)}`,
            isRoundDiamond ? `0 0 18px rgba(220,233,246,${(rimGlow * 0.82).toFixed(2)})` : `0 0 20px ${rgba(palette.shellGlow, rimGlow)}`,
          ].join(', '),
          overflow: 'hidden',
        }}
      >
        {isRoundDiamond && (
          <>
            <motion.div
              style={{
                position: 'absolute',
                inset: '4.5%',
                ...maskStyles,
                background: roundOuterFacetBackground,
                opacity: 0.78,
              }}
              animate={{
                rotate: [0, 3, -2, 0],
                opacity: [0.72, 0.84, 0.76, 0.72],
              }}
              transition={{
                duration: 9.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <motion.div
              style={{
                position: 'absolute',
                inset: '19%',
                ...maskStyles,
                background: roundStarFacetBackground,
                opacity: 0.90,
              }}
              animate={{
                rotate: [0, -4, 3, 0],
                scale: [1, 1.02, 0.99, 1],
              }}
              transition={{
                duration: 8.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <motion.div
              style={{
                position: 'absolute',
                inset: '32%',
                ...roundTableMaskStyles,
                background: roundTableBackground,
                boxShadow: '0 0 0 1px rgba(255,255,255,0.36)',
                opacity: 0.96,
              }}
              animate={{
                scale: [1, 1.03, 1],
                opacity: [0.90, 0.98, 0.92, 0.90],
              }}
              transition={{
                duration: 6.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </>
        )}

        <motion.div
          style={{
            position: 'absolute',
            inset: cutConfig.coreInset,
            ...maskStyles,
            background: coreBackground,
            filter: isRoundDiamond ? 'blur(2px)' : 'blur(4px)',
          }}
          animate={{
            rotate: [0, 20, -12, 0],
            scale: [1, 1.05, 0.98, 1],
            x: ['0%', '2%', '-1%', '0%'],
            y: ['0%', '-2%', '1%', '0%'],
          }}
          transition={{
            duration: 8.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          style={{
            position: 'absolute',
            ...cutConfig.topHighlight,
            borderRadius: '50%',
            background: topHighlightBackground,
            filter: isRoundDiamond ? 'blur(2px)' : 'blur(3px)',
          }}
          animate={{
            x: ['0%', '4%', '1%', '0%'],
            y: ['0%', '2%', '-2%', '0%'],
            scale: [1, 1.08, 0.96, 1],
            opacity: [0.82, 1, 0.84, 0.82],
          }}
          transition={{
            duration: 5.6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          style={{
            position: 'absolute',
            ...cutConfig.bottomFlare,
            borderRadius: '50%',
            background: bottomFlareBackground,
            filter: isRoundDiamond ? 'blur(3px)' : 'blur(4px)',
            mixBlendMode: 'screen',
          }}
          animate={{
            x: ['0%', '-5%', '3%', '0%'],
            y: ['0%', '-6%', '4%', '0%'],
            scale: [1, 1.18, 0.92, 1],
            opacity: [0.82, 1, 0.74, 0.82],
          }}
          transition={{
            duration: 4.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          style={{
            position: 'absolute',
            ...cutConfig.sideGlow,
            borderRadius: '50%',
            background: sideGlowBackground,
            opacity: isRoundDiamond ? 0.44 : 0.72,
          }}
          animate={{
            x: ['0%', '10%', '0%'],
            y: ['0%', '-8%', '0%'],
            opacity: [0.44, 0.78, 0.44],
          }}
          transition={{
            duration: 4.1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          style={{
            position: 'absolute',
            inset: '7%',
            ...maskStyles,
            background: cutConfig.sheenOverlay,
            mixBlendMode: 'screen',
            filter: 'blur(1px)',
          }}
          animate={{
            rotate: [0, 360],
            opacity: [0.2, 0.34, 0.2],
          }}
          transition={{
            rotate: { duration: 14, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 4.8, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            ...maskStyles,
            background: [
              `radial-gradient(circle at 30% 22%, ${rgba(palette.sparkle, 0.95)} 0 1.8%, transparent 3%)`,
              `radial-gradient(circle at 40% 34%, ${rgba(palette.sparkle, 0.86)} 0 1.2%, transparent 2.3%)`,
              `radial-gradient(circle at 49% 45%, ${rgba(palette.sparkle, 0.82)} 0 1.1%, transparent 2.1%)`,
              `radial-gradient(circle at 57% 38%, ${rgba(palette.sparkle, 0.76)} 0 1.4%, transparent 2.4%)`,
              `radial-gradient(circle at 63% 50%, ${rgba(palette.sparkle, 0.72)} 0 1.0%, transparent 2.1%)`,
              `radial-gradient(circle at 36% 58%, ${rgba(palette.sparkle, 0.65)} 0 1.1%, transparent 2.2%)`,
              `radial-gradient(circle at 48% 60%, ${rgba(palette.sparkle, 0.70)} 0 0.9%, transparent 2%)`,
              `radial-gradient(circle at 58% 70%, ${rgba(palette.sparkle, 0.82)} 0 1.3%, transparent 2.4%)`,
              `radial-gradient(circle at 24% 70%, ${rgba(palette.sparkle, 0.62)} 0 1.1%, transparent 2.1%)`,
            ].join(', '),
            opacity: 0.78,
          }}
        />

        <motion.div
          style={{
            position: 'absolute',
            inset: '6%',
            ...maskStyles,
            background: cutConfig.facetOverlay,
            mixBlendMode: 'screen',
            opacity: facetOverlayOpacity,
          }}
          animate={{
            rotate: [0, 8, -5, 0],
            opacity: [0.42, 0.68, 0.5, 0.42],
          }}
          transition={{
            duration: 6.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          style={{
            position: 'absolute',
            inset: '5%',
            ...maskStyles,
            background: [
              `repeating-conic-gradient(from 0deg, ${rgba(palette.sparkle, 0.16)} 0deg 7deg, transparent 7deg 18deg)`,
              `repeating-linear-gradient(135deg, transparent 0 9%, ${rgba(palette.facetSoft, 0.10)} 9% 10.5%, transparent 10.5% 21%)`,
              `repeating-linear-gradient(-135deg, transparent 0 10%, ${rgba(palette.facet, 0.08)} 10% 11.4%, transparent 11.4% 22%)`,
            ].join(', '),
            mixBlendMode: 'screen',
            opacity: patternOverlayOpacity[0],
          }}
          animate={{
            rotate: [0, -6, 4, 0],
            opacity: patternOverlayOpacity,
          }}
          transition={{
            duration: 7.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {DIAMOND_SPARKLES.map((sparkle, index) => (
          <motion.div
            key={`${stone}-${sparkle.top}-${sparkle.left}`}
            style={{
              position: 'absolute',
              width: sparkle.width,
              aspectRatio: '1 / 1',
              top: sparkle.top,
              left: sparkle.left,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${rgba(palette.sparkle, 0.98)} 0%, ${rgba(palette.sparkle, 0.72)} 32%, ${rgba(palette.sparkle, 0.06)} 70%, transparent 100%)`,
              filter: 'blur(0.3px)',
            }}
            animate={{
              scale: [0.7, 1.15, 0.78, 1],
              opacity: sparkleOpacityKeyframes,
            }}
            transition={{
              duration: sparkle.duration,
              delay: sparkle.delay + index * 0.05,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        <div
          style={{
            position: 'absolute',
            inset: '8%',
            ...maskStyles,
            border: isRoundDiamond ? '1px solid rgba(255,255,255,0.24)' : `1px solid ${rgba(palette.sparkle, 0.14)}`,
            opacity: 0.8,
          }}
        />
      </div>
    </motion.div>
  )
}

function pointsToString(points: ReadonlyArray<readonly [number, number]>) {
  return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
}

function RoundGemFacetRender() {
  const facets = useMemo(() => {
    const geometry = buildRoundBrilliantCut()
    const position = geometry.getAttribute('position')
    const keyLight = new THREE.Vector3(0.24, 0.95, -0.18).normalize()
    const fillLight = new THREE.Vector3(-0.68, 0.58, 0.24).normalize()
    const rimLight = new THREE.Vector3(0.46, 0.42, 0.78).normalize()

    const clamp = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value))

    const project = (vertex: THREE.Vector3) => [50 + vertex.x * 71, 50 + vertex.z * 71] as const

    const toColor = (normal: THREE.Vector3, centroid: THREE.Vector3) => {
      const radial = clamp(Math.hypot(centroid.x, centroid.z) / 0.68, 0, 1)
      const angle = Math.atan2(centroid.z, centroid.x)
      const pavilion = normal.y < -0.08

      const direct = Math.max(0, normal.dot(keyLight))
      const fill = Math.max(0, normal.dot(fillLight))
      const rim = Math.max(0, normal.dot(rimLight))
      const ringWave = Math.cos(angle * 16 - radial * 5)
      const starWave = Math.cos(angle * 8 + radial * 9)

      let value = 0

      if (pavilion) {
        value = 44 + Math.abs(normal.y) * 48 + (1 - radial) * 20 + starWave * 18
      } else if (radial < 0.22) {
        value = 194 + direct * 28 + Math.cos(angle * 4 - 0.8) * 18
      } else if (radial < 0.54) {
        value = 92 + direct * 54 + fill * 18 + starWave * 72
      } else {
        value = 176 + direct * 32 + fill * 16 + rim * 14 + ringWave * 46
      }

      value = clamp(value, 34, 255)

      let r = value
      let g = value + 4
      let b = value + 8

      if (!pavilion && radial > 0.72) {
        if (Math.cos(angle * 4) > 0.78) {
          r += 20
          g += 10
        }

        if (Math.sin(angle * 4) > 0.78) {
          g += 10
          b += 20
        }
      }

      return `rgb(${clamp(Math.round(r), 0, 255)}, ${clamp(Math.round(g), 0, 255)}, ${clamp(Math.round(b), 0, 255)})`
    }

    const list: Array<{
      points: string
      fill: string
      opacity: number
      stroke: string
      order: number
    }> = []

    for (let index = 0; index < position.count; index += 3) {
      const a = new THREE.Vector3(position.getX(index), position.getY(index), position.getZ(index))
      const b = new THREE.Vector3(position.getX(index + 1), position.getY(index + 1), position.getZ(index + 1))
      const c = new THREE.Vector3(position.getX(index + 2), position.getY(index + 2), position.getZ(index + 2))

      const normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize()
      const centroid = a.clone().add(b).add(c).multiplyScalar(1 / 3)
      const pavilion = normal.y < -0.08

      list.push({
        points: pointsToString([project(a), project(b), project(c)]),
        fill: toColor(normal, centroid),
        opacity: pavilion ? 0.40 : clamp(0.66 + normal.y * 0.24, 0.66, 0.98),
        stroke: pavilion ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.18)',
        order: (pavilion ? 0 : 100) + centroid.y,
      })
    }

    return list.sort((a, b) => a.order - b.order)
  }, [])

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <defs>
        <clipPath id="round-diamond-clip">
          <circle cx="50" cy="50" r="47.6" />
        </clipPath>
        <filter id="round-diamond-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.8" />
        </filter>
        <radialGradient id="round-diamond-shell" cx="36%" cy="28%" r="74%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="38%" stopColor="#fafcff" />
          <stop offset="76%" stopColor="#ebeff4" />
          <stop offset="100%" stopColor="#d8e0e8" />
        </radialGradient>
        <radialGradient id="round-diamond-core" cx="50%" cy="50%" r="54%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      <ellipse
        cx="50"
        cy="54"
        rx="30"
        ry="28"
        fill="rgba(198,207,218,0.22)"
        filter="url(#round-diamond-shadow)"
      />

      <circle cx="50" cy="50" r="47.8" fill="url(#round-diamond-shell)" />

      <g clipPath="url(#round-diamond-clip)">
        {facets.map((facet, index) => (
          <polygon
            key={`round-facet-${index}`}
            points={facet.points}
            fill={facet.fill}
            opacity={facet.opacity}
            stroke={facet.stroke}
            strokeWidth="0.42"
          />
        ))}

        <circle cx="50" cy="50" r="18" fill="url(#round-diamond-core)" />
      </g>

      <circle
        cx="50"
        cy="50"
        r="47.8"
        fill="none"
        stroke="rgba(255,255,255,0.84)"
        strokeWidth="0.9"
      />
      <circle
        cx="50"
        cy="50"
        r="47.2"
        fill="none"
        stroke="rgba(176,186,198,0.24)"
        strokeWidth="1.2"
      />
    </svg>
  )
}

function RealisticRoundGemOrb({
  glowAmount,
  hovered,
  cfg,
  stone,
}: {
  glowAmount: number
  hovered: boolean
  cfg: StoneConfig
  stone: GemBadgeStone
}) {
  const haloStrength = 0.08 + glowAmount * (hovered ? 0.10 : 0.06)
  const tintOpacity = stone === 'diamond' ? 0 : 0.94
  const tintBackground = [
    `radial-gradient(circle at 28% 24%, ${rgba(cfg.keyLight, 0.28)} 0%, ${rgba(cfg.keyLight, 0.18)} 10%, ${rgba(cfg.gemColor, 0.12)} 24%, transparent 40%)`,
    `radial-gradient(circle at 74% 76%, ${rgba(cfg.glowColor, 0.52)} 0%, ${rgba(cfg.glowColor, 0.20)} 12%, transparent 30%)`,
    `radial-gradient(circle at 24% 78%, ${rgba(cfg.fillLight, 0.20)} 0%, ${rgba(cfg.fillLight, 0.08)} 12%, transparent 28%)`,
    `radial-gradient(circle at 50% 52%, ${rgba(cfg.gemColor, 0.28)} 0%, ${rgba(cfg.gemColor, 0.40)} 56%, ${rgba(cfg.coreColor, 0.86)} 100%)`,
  ].join(', ')
  const tintSheen = [
    `conic-gradient(from 210deg, transparent 0deg, ${rgba(cfg.rimLight, 0.18)} 34deg, transparent 78deg, ${rgba(cfg.fillLight, 0.14)} 138deg, transparent 208deg, ${rgba(cfg.keyLight, 0.18)} 282deg, transparent 334deg, ${rgba(cfg.rimLight, 0.12)} 360deg)`,
    `radial-gradient(circle at 48% 42%, ${rgba(cfg.keyLight, 0.18)} 0%, transparent 42%)`,
  ].join(', ')

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        isolation: 'isolate',
        overflow: 'visible',
        filter: `drop-shadow(0 10px 18px ${rgba(stone === 'diamond' ? '#d2dce8' : cfg.glowColor, haloStrength)})`,
      }}
    >
      <RoundGemFacetRender />

      {stone !== 'diamond' && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: '2.2%',
              borderRadius: '50%',
              background: tintBackground,
              mixBlendMode: 'color',
              opacity: tintOpacity,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '2.2%',
              borderRadius: '50%',
              background: tintSheen,
              mixBlendMode: 'screen',
              opacity: 0.62,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '4%',
              borderRadius: '50%',
              border: `1px solid ${rgba(cfg.rimLight, 0.28)}`,
              boxShadow: `0 0 18px ${rgba(cfg.glowColor, haloStrength * 0.75)}`,
              opacity: 0.88,
              pointerEvents: 'none',
            }}
          />
        </>
      )}
    </div>
  )
}

export function GemBadge({
  stone      = 'diamond',
  cut        = 'round',
  size       = 72,
  glow       = true,
  glowIntensity = 1,
  onClick,
  className,
  style,
  'aria-label': ariaLabel,
}: GemBadgeProps) {
  const [hovered, setHovered] = useState(false)
  const cfg = STONE_CONFIGS[stone] ?? STONE_CONFIGS.diamond
  const isRealisticRoundGem = cut === 'round'
  const label = ariaLabel ?? (
    `${DIAMOND_CUTS[cut].label} ${stone} gem`
  )
  const glowAmount = glow ? Math.max(0, glowIntensity) : 0

  return (
    <motion.button
      type="button"
      aria-label={label}
      className={className}
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.10 }}
      whileTap={{ scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 360, damping: 20 }}
      style={{
        position:     'relative',
        width:        size,
        height:       size,
        padding:      0,
        border:       'none',
        borderRadius: '0',
        cursor:       'pointer',
        overflow:     'visible',
        display:      'block',
        background:   'transparent',
        ...style,
      }}
    >
      {isRealisticRoundGem ? (
        <RealisticRoundGemOrb
          glowAmount={glowAmount}
          hovered={hovered}
          cfg={cfg}
          stone={stone}
        />
      ) : (
        <CutGemOrb
          glowAmount={glowAmount}
          hovered={hovered}
          cut={cut}
          cfg={cfg}
          stone={stone}
        />
      )}
    </motion.button>
  )
}

// ─── CONVENIENCE ALIAS (backwards compat) ─────────────────────────────────────

export interface DiamondPrincessBadgeProps {
  size?: number
  glowColor?: string
  bgColor?: string
  ringColor?: string
  onClick?: () => void
  'aria-label'?: string
  className?: string
  style?: React.CSSProperties
}

/** @deprecated Use <GemBadge stone="diamond" /> instead */
export function DiamondPrincessBadge(props: DiamondPrincessBadgeProps) {
  return <GemBadge stone="diamond" cut="princess" {...props} />
}
