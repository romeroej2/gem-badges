import * as THREE from 'three'
import { buildFacetRing, finalizeIndexedGeometry } from './shared'

export function buildRoundBrilliantCut(): THREE.BufferGeometry {
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

  return finalizeIndexedGeometry(vertices, indices, (geometry) => {
    geometry.scale(1, 1.04, 1)
  })
}
