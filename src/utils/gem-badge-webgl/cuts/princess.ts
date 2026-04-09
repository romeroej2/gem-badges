import * as THREE from 'three'
import { finalizeIndexedGeometry } from './shared'

export function buildPrincessCut(): THREE.BufferGeometry {
  const vertices: THREE.Vector3[] = []
  const indices: number[] = []

  const addVertex = (vertex: THREE.Vector3) => {
    vertices.push(vertex)
    return vertices.length - 1
  }

  const addTri = (a: number, b: number, c: number) => {
    indices.push(a, b, c)
  }

  const halfW = 0.50
  const halfD = 0.50

  // FacetDiagrams.org 07.149 "Emerald Square Princess"
  // H/W = 0.634, 53+8 facets, with crown angles 45.0 / 29.5 / 26.8 / 30.6 / 12.7
  // and pavilion angles 43.5 / 38.0 / 37.5 / 40.5 deg.
  // We keep the existing simplified princess topology, but tune its depth and
  // break positions to better match the published cut character.
  const totalDepth = 0.634
  const girdleTop = 0.01
  const girdleBottom = -0.01
  const crownHeight = 0.192
  const pavilionDepth = totalDepth - (girdleTop - girdleBottom) - crownHeight

  const tableHalf = halfW * 0.38
  const crownDHalf = halfW * 0.54
  const crownStarHalf = halfW * 0.64
  const crownBHalf = halfW * 0.78
  const crownAHalf = halfW * 0.92

  const crownT = girdleTop + crownHeight
  const crownD = girdleTop + crownHeight * 0.72
  const crownStar = girdleTop + crownHeight * 0.49
  const crownB = girdleTop + crownHeight * 0.20
  const crownA = girdleTop + crownHeight * 0.06

  const pavilion1 = girdleBottom - pavilionDepth * 0.26
  const pavilion2 = girdleBottom - pavilionDepth * 0.49
  const pavilion3 = girdleBottom - pavilionDepth * 0.70
  const pavilion4 = girdleBottom - pavilionDepth * 0.87
  const pavilion5 = girdleBottom - pavilionDepth

  const tableV = [
    addVertex(new THREE.Vector3(0, crownT, 0)),
    addVertex(new THREE.Vector3(tableHalf, crownT, tableHalf)),
    addVertex(new THREE.Vector3(tableHalf, crownT, -tableHalf)),
    addVertex(new THREE.Vector3(-tableHalf, crownT, -tableHalf)),
    addVertex(new THREE.Vector3(-tableHalf, crownT, tableHalf)),
  ]

  const crownD0 = addVertex(new THREE.Vector3(crownDHalf, crownD, crownDHalf))
  const crownD1 = addVertex(new THREE.Vector3(crownDHalf, crownD, -crownDHalf))
  const crownD2 = addVertex(new THREE.Vector3(-crownDHalf, crownD, -crownDHalf))
  const crownD3 = addVertex(new THREE.Vector3(-crownDHalf, crownD, crownDHalf))

  const crownStar0 = addVertex(new THREE.Vector3(crownStarHalf, crownStar, crownStarHalf))
  const crownStar1 = addVertex(new THREE.Vector3(crownStarHalf, crownStar, -crownStarHalf))
  const crownStar2 = addVertex(new THREE.Vector3(-crownStarHalf, crownStar, -crownStarHalf))
  const crownStar3 = addVertex(new THREE.Vector3(-crownStarHalf, crownStar, crownStarHalf))

  const crownB0 = addVertex(new THREE.Vector3(crownBHalf, crownB, crownBHalf))
  const crownB1 = addVertex(new THREE.Vector3(crownBHalf, crownB, -crownBHalf))
  const crownB2 = addVertex(new THREE.Vector3(-crownBHalf, crownB, -crownBHalf))
  const crownB3 = addVertex(new THREE.Vector3(-crownBHalf, crownB, crownBHalf))

  const crownA0 = addVertex(new THREE.Vector3(crownAHalf, crownA, crownAHalf))
  const crownA1 = addVertex(new THREE.Vector3(crownAHalf, crownA, -crownAHalf))
  const crownA2 = addVertex(new THREE.Vector3(-crownAHalf, crownA, -crownAHalf))
  const crownA3 = addVertex(new THREE.Vector3(-crownAHalf, crownA, crownAHalf))

  const girdle0 = addVertex(new THREE.Vector3(halfW, girdleBottom, halfD))
  const girdle1 = addVertex(new THREE.Vector3(halfW, girdleBottom, -halfD))
  const girdle2 = addVertex(new THREE.Vector3(-halfW, girdleBottom, -halfD))
  const girdle3 = addVertex(new THREE.Vector3(-halfW, girdleBottom, halfD))

  const p1_0 = addVertex(new THREE.Vector3(halfW * 0.90, pavilion1, halfD * 0.90))
  const p1_1 = addVertex(new THREE.Vector3(halfW * 0.90, pavilion1, -halfD * 0.90))
  const p1_2 = addVertex(new THREE.Vector3(-halfW * 0.90, pavilion1, -halfD * 0.90))
  const p1_3 = addVertex(new THREE.Vector3(-halfW * 0.90, pavilion1, halfD * 0.90))

  const p2_0 = addVertex(new THREE.Vector3(halfW * 0.74, pavilion2, halfD * 0.74))
  const p2_1 = addVertex(new THREE.Vector3(halfW * 0.74, pavilion2, -halfD * 0.74))
  const p2_2 = addVertex(new THREE.Vector3(-halfW * 0.74, pavilion2, -halfD * 0.74))
  const p2_3 = addVertex(new THREE.Vector3(-halfW * 0.74, pavilion2, halfD * 0.74))

  const p3_0 = addVertex(new THREE.Vector3(halfW * 0.54, pavilion3, halfD * 0.54))
  const p3_1 = addVertex(new THREE.Vector3(halfW * 0.54, pavilion3, -halfD * 0.54))
  const p3_2 = addVertex(new THREE.Vector3(-halfW * 0.54, pavilion3, -halfD * 0.54))
  const p3_3 = addVertex(new THREE.Vector3(-halfW * 0.54, pavilion3, halfD * 0.54))

  const p4_0 = addVertex(new THREE.Vector3(halfW * 0.30, pavilion4, halfD * 0.30))
  const p4_1 = addVertex(new THREE.Vector3(halfW * 0.30, pavilion4, -halfD * 0.30))
  const p4_2 = addVertex(new THREE.Vector3(-halfW * 0.30, pavilion4, -halfD * 0.30))
  const p4_3 = addVertex(new THREE.Vector3(-halfW * 0.30, pavilion4, halfD * 0.30))

  const p5_0 = addVertex(new THREE.Vector3(halfW * 0.07, pavilion5, halfD * 0.07))
  const p5_1 = addVertex(new THREE.Vector3(halfW * 0.07, pavilion5, -halfD * 0.07))
  const p5_2 = addVertex(new THREE.Vector3(-halfW * 0.07, pavilion5, -halfD * 0.07))
  const p5_3 = addVertex(new THREE.Vector3(-halfW * 0.07, pavilion5, halfD * 0.07))

  addTri(tableV[0], tableV[1], tableV[2])
  addTri(tableV[0], tableV[2], tableV[3])
  addTri(tableV[0], tableV[3], tableV[4])
  addTri(tableV[0], tableV[4], tableV[1])

  addTri(tableV[1], crownD0, tableV[2])
  addTri(tableV[2], crownD1, tableV[3])
  addTri(tableV[3], crownD2, tableV[4])
  addTri(tableV[4], crownD3, tableV[1])

  addTri(tableV[1], crownD1, crownD0)
  addTri(tableV[2], crownD2, crownD1)
  addTri(tableV[3], crownD3, crownD2)
  addTri(tableV[4], crownD0, crownD3)

  addTri(crownD0, crownStar0, crownD1)
  addTri(crownD1, crownStar1, crownD2)
  addTri(crownD2, crownStar2, crownD3)
  addTri(crownD3, crownStar3, crownD0)

  addTri(crownStar0, crownB0, crownStar1)
  addTri(crownStar1, crownB1, crownStar2)
  addTri(crownStar2, crownB2, crownStar3)
  addTri(crownStar3, crownB3, crownStar0)

  addTri(crownB0, crownA0, crownB1)
  addTri(crownB1, crownA1, crownB2)
  addTri(crownB2, crownA2, crownB3)
  addTri(crownB3, crownA3, crownB0)

  addTri(crownA0, girdle0, crownA1)
  addTri(crownA1, girdle1, crownA2)
  addTri(crownA2, girdle2, crownA3)
  addTri(crownA3, girdle3, crownA0)

  addTri(girdle0, p1_0, girdle1)
  addTri(girdle1, p1_1, girdle2)
  addTri(girdle2, p1_2, girdle3)
  addTri(girdle3, p1_3, girdle0)

  addTri(p1_0, p2_0, p1_1)
  addTri(p1_1, p2_1, p1_2)
  addTri(p1_2, p2_2, p1_3)
  addTri(p1_3, p2_3, p1_0)

  addTri(p2_0, p3_0, p2_1)
  addTri(p2_1, p3_1, p2_2)
  addTri(p2_2, p3_2, p2_3)
  addTri(p2_3, p3_3, p2_0)

  addTri(p3_0, p4_0, p3_1)
  addTri(p3_1, p4_1, p3_2)
  addTri(p3_2, p4_2, p3_3)
  addTri(p3_3, p4_3, p3_0)

  addTri(p4_0, p5_0, p4_1)
  addTri(p4_1, p5_1, p4_2)
  addTri(p4_2, p5_2, p4_3)
  addTri(p4_3, p5_3, p4_0)

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
