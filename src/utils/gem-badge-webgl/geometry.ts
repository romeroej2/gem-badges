import * as THREE from 'three'
import type { GemCut, PreparedGeometry } from './types'
import { MAX_FACETS } from './shaders'
import { buildEmeraldCutGeometry } from './cuts/emerald'
import { buildHeartCutGeometry } from './cuts/heart'
import { buildMarquiseCutGeometry } from './cuts/marquise'
import { buildPrincessCut } from './cuts/princess'
import { buildRoundBrilliantCut } from './cuts/round'
import { buildLatheCut } from './cuts/shared'

function buildCutGeometry(cut: GemCut) {
  const geometry = (() => {
    switch (cut) {
    case 'round':
      return buildRoundBrilliantCut()
    case 'princess':
      return buildPrincessCut()
    case 'oval':
      return buildLatheCut([
        [0, -0.86],
        [0.06, -0.74],
        [0.38, -0.12],
        [0.50, 0.02],
        [0.44, 0.18],
        [0.24, 0.34],
        [0, 0.42],
      ], 16, [1.36, 1, 0.88])
    case 'emerald':
      return buildEmeraldCutGeometry()
    case 'heart':
      return buildHeartCutGeometry()
    case 'marquise':
      return buildMarquiseCutGeometry()
    default:
      return buildPrincessCut()
    }
  })()

  geometry.center()
  geometry.computeVertexNormals()

  const box = new THREE.Box3().setFromBufferAttribute(geometry.getAttribute('position') as THREE.BufferAttribute)
  const extent = Math.max(
    Math.abs(box.min.x),
    Math.abs(box.max.x),
    Math.abs(box.min.z),
    Math.abs(box.max.z)
  ) || 1

  geometry.scale(0.82 / extent, 0.82 / extent, 0.82 / extent)
  geometry.computeVertexNormals()
  return geometry
}

function prepareGeometry(cut: GemCut): PreparedGeometry | null {
  const geometry = buildCutGeometry(cut)
  const position = geometry.getAttribute('position')
  const normal = geometry.getAttribute('normal')

  const facetMap = new Map<string, { normal: THREE.Vector3; point: THREE.Vector3; count: number }>()

  for (let index = 0; index < position.count; index += 3) {
    const a = new THREE.Vector3(position.getX(index), position.getY(index), position.getZ(index))
    const b = new THREE.Vector3(position.getX(index + 1), position.getY(index + 1), position.getZ(index + 1))
    const c = new THREE.Vector3(position.getX(index + 2), position.getY(index + 2), position.getZ(index + 2))

    const faceNormal = b.clone().sub(a).cross(c.clone().sub(a)).normalize()
    const centroid = a.clone().add(b).add(c).multiplyScalar(1 / 3)

    if (faceNormal.dot(centroid) < 0) {
      faceNormal.negate()
    }

    const planeDistance = faceNormal.dot(centroid)
    const key = [
      Math.round(faceNormal.x * 1000),
      Math.round(faceNormal.y * 1000),
      Math.round(faceNormal.z * 1000),
      Math.round(planeDistance * 1000),
    ].join(':')

    const existing = facetMap.get(key)
    if (existing) {
      existing.normal.add(faceNormal)
      existing.point.add(centroid)
      existing.count += 1
    } else {
      facetMap.set(key, {
        normal: faceNormal.clone(),
        point: centroid.clone(),
        count: 1,
      })
    }
  }

  const facets = Array.from(facetMap.values())
    .map((facet) => ({
      normal: facet.normal.multiplyScalar(1 / facet.count).normalize(),
      point: facet.point.multiplyScalar(1 / facet.count),
    }))
    .sort((a, b) => b.point.y - a.point.y)

  if (facets.length > MAX_FACETS) {
    geometry.dispose()
    return null
  }

  const facetNormals = new Float32Array(MAX_FACETS * 3)
  const facetPoints = new Float32Array(MAX_FACETS * 3)

  facets.forEach((facet, index) => {
    const offset = index * 3
    facetNormals[offset] = facet.normal.x
    facetNormals[offset + 1] = facet.normal.y
    facetNormals[offset + 2] = facet.normal.z

    facetPoints[offset] = facet.point.x
    facetPoints[offset + 1] = facet.point.y
    facetPoints[offset + 2] = facet.point.z
  })

  const prepared = {
    positions: new Float32Array(position.array as ArrayLike<number>),
    normals: new Float32Array(normal.array as ArrayLike<number>),
    count: position.count,
    facetCount: facets.length,
    facetNormals,
    facetPoints,
  }

  geometry.dispose()
  return prepared
}

const PREPARED_GEOMETRIES = new Map<GemCut, PreparedGeometry | null>()

export function getPreparedGeometry(cut: GemCut) {
  if (!PREPARED_GEOMETRIES.has(cut)) {
    PREPARED_GEOMETRIES.set(cut, prepareGeometry(cut))
  }

  return PREPARED_GEOMETRIES.get(cut) ?? null
}
