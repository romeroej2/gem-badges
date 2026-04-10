import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { traceHeartPath } from '../utils/gem-badge-webgl/cuts/heart'
import {
  buildFacetRing,
  buildLatheCut,
  finalizeIndexedGeometry,
} from '../utils/gem-badge-webgl/cuts/shared'
import { getPreparedGeometry } from '../utils/gem-badge-webgl/geometry'

describe('gem badge geometry helpers', () => {
  it('buildFacetRing creates a scaled circular ring of points', () => {
    const ring = buildFacetRing(2, 1.5, 4, 0, 1.25, 0.5)

    expect(ring).toHaveLength(4)
    expect(ring[0]).toEqual(new THREE.Vector3(2.5, 1.5, 0))
    expect(ring[1]?.x).toBeCloseTo(0)
    expect(ring[1]?.y).toBeCloseTo(1.5)
    expect(ring[1]?.z).toBeCloseTo(1)
  })

  it('finalizeIndexedGeometry expands indexed faces and allows final transforms', () => {
    const vertices = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
    ]
    const indices = [0, 1, 2]

    const geometry = finalizeIndexedGeometry(vertices, indices, (faceted) => {
      faceted.rotateZ(Math.PI / 2)
    })

    expect(geometry.index).toBeNull()
    expect(geometry.getAttribute('position').count).toBe(3)
    expect(geometry.getAttribute('normal').count).toBe(3)
  })

  it('buildLatheCut returns faceted geometry and honors scaling', () => {
    const geometry = buildLatheCut(
      [
        [0, -1],
        [0.4, -0.4],
        [0.55, 0.2],
        [0, 0.6],
      ],
      12,
      [1.5, 0.75, 0.5],
    )

    geometry.computeBoundingBox()

    expect(geometry.index).toBeNull()
    expect(geometry.getAttribute('position').count).toBeGreaterThan(0)
    expect(geometry.boundingBox?.max.x).toBeGreaterThan(0.7)
    expect(geometry.boundingBox?.max.y).toBeLessThan(0.5)
  })

  it.each([
    'round',
    'princess',
    'oval',
    'emerald',
    'heart',
    'marquise',
  ] as const)('prepares %s cut geometry for shader upload', (cut) => {
    const prepared = getPreparedGeometry(cut)

    expect(prepared).not.toBeNull()
    expect(prepared?.count).toBeGreaterThan(0)
    expect(prepared?.facetCount).toBeGreaterThan(0)
    expect(prepared?.positions.length).toBe(prepared?.normals.length)
    expect(prepared?.facetNormals.length).toBeGreaterThanOrEqual(prepared?.facetCount ?? 0)
    expect(prepared?.facetPoints.length).toBeGreaterThanOrEqual(prepared?.facetCount ?? 0)
  })

  it('caches prepared geometry per cut', () => {
    expect(getPreparedGeometry('round')).toBe(getPreparedGeometry('round'))
  })

  it('traces the heart outline in a 2D canvas path', () => {
    const context = {
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
    } as unknown as CanvasRenderingContext2D

    traceHeartPath(context, 24)

    expect(context.beginPath).toHaveBeenCalledTimes(1)
    expect(context.moveTo).toHaveBeenCalledTimes(1)
    expect(context.lineTo).toHaveBeenCalledTimes(11)
    expect(context.closePath).toHaveBeenCalledTimes(1)
  })
})
