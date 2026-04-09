import * as THREE from 'three'
import { finalizeIndexedGeometry } from './shared'

function buildMarquiseRing(
  halfLength: number,
  halfWidth: number,
  y: number,
  count: number,
  power = 0.72
) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2
    const cosine = Math.cos(angle)
    const sine = Math.sin(angle)
    const x = Math.sign(cosine) * Math.pow(Math.abs(cosine), power) * halfLength
    const z = sine * halfWidth
    return new THREE.Vector3(x, y, z)
  })
}

export function buildMarquiseCutGeometry(): THREE.BufferGeometry {
  const vertices: THREE.Vector3[] = []
  const indices: number[] = []

  const addVertex = (vertex: THREE.Vector3) => {
    vertices.push(vertex)
    return vertices.length - 1
  }

  const addRing = (halfLength: number, halfWidth: number, y: number, count: number, power?: number) =>
    buildMarquiseRing(halfLength, halfWidth, y, count, power).map(addVertex)

  const addTri = (a: number, b: number, c: number) => {
    indices.push(a, b, c)
  }

  // FacetDiagrams.org 03.028 "Marquise for GGG"
  // L/W = 1.980, H/W = 0.694.
  const halfLength = 0.99
  const halfWidth = 0.50
  const totalDepth = 0.694
  const girdleTop = 0.01
  const girdleBottom = -0.01
  const crownHeight = 0.17
  const pavilionDepth = totalDepth - (girdleTop - girdleBottom) - crownHeight

  const table = addRing(halfLength * 0.54, halfWidth * 0.34, girdleTop + crownHeight, 8, 0.78)
  const crown = addRing(halfLength * 0.78, halfWidth * 0.42, girdleTop + crownHeight * 0.46, 8, 0.76)
  const girdleUpper = addRing(halfLength, halfWidth, girdleTop, 16, 0.72)
  const girdleLower = addRing(halfLength * 0.995, halfWidth * 0.995, girdleBottom, 16, 0.72)
  const pavilion = addRing(halfLength * 0.50, halfWidth * 0.22, girdleBottom - pavilionDepth * 0.58, 16, 0.80)
  const culet = addVertex(new THREE.Vector3(0, girdleBottom - pavilionDepth, 0))
  const topCenter = addVertex(new THREE.Vector3(0, girdleTop + crownHeight, 0))

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

  return finalizeIndexedGeometry(vertices, indices)
}
