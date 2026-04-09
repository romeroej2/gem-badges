import * as THREE from 'three'
import { buildFacetRing, finalizeIndexedGeometry } from './shared'

export function buildRoundBrilliantCut(): THREE.BufferGeometry {
  const vertices: THREE.Vector3[] = []
  const indices: number[] = []
  const degToRad = THREE.MathUtils.degToRad

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

  // FacetDiagrams.org 01.006 "Standard Brilliant":
  // H/W = 0.588 with crown/pavilion angles at 35.0 / 19.8 / 42.3 / 42.1 / 41.0 deg.
  const radius = 0.5
  const totalDepth = 0.588
  const girdleThickness = 0.02
  const girdleTopY = girdleThickness * 0.5
  const girdleBottomY = -girdleThickness * 0.5
  const culetRadius = 0.03
  const pavilionDepth = (radius - culetRadius) * Math.tan(degToRad(41.0))
  const crownHeight = totalDepth - girdleThickness - pavilionDepth
  const tableRadius = radius - crownHeight / Math.tan(degToRad(35.0))
  const tableY = girdleTopY + crownHeight

  // This builder keeps the existing 8/16/16 topology so the prepared
  // WebGL facet set stays under budget, but the proportions are re-tuned
  // to the Standard Brilliant depth and angle profile.
  const crownRadius = radius * 0.82
  const crownY = girdleTopY + crownHeight * 0.48
  const pavilionRadius = radius * 0.46
  const pavilionY = girdleBottomY - pavilionDepth * 0.56

  const topCenter = addVertex(new THREE.Vector3(0, tableY, 0))
  const table = addRing(tableRadius, tableY, 8)
  const crown = addRing(crownRadius, crownY, 8, Math.PI / 8)
  const girdleUpper = addRing(radius, girdleTopY, 16)
  const girdleLower = addRing(radius * 0.992, girdleBottomY, 16)
  const pavilion = addRing(pavilionRadius, pavilionY, 16, Math.PI / 16)
  const culet = addVertex(new THREE.Vector3(0, girdleBottomY - pavilionDepth, 0))

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

  for (let index = 0; index < indices.length; index += 3) {
    const a = vertices[indices[index]]
    const b = vertices[indices[index + 1]]
    const c = vertices[indices[index + 2]]
    const normal = b.clone().sub(a).cross(c.clone().sub(a))
    const centroid = a.clone().add(b).add(c).multiplyScalar(1 / 3)

    if (normal.dot(centroid) < 0) {
      const temp = indices[index + 1]
      indices[index + 1] = indices[index + 2]
      indices[index + 2] = temp
    }
  }

  return finalizeIndexedGeometry(vertices, indices, (geometry) => {
    geometry.scale(1, 1.02, 1)
  })
}
