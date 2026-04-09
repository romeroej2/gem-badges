import * as THREE from 'three'
import { finalizeIndexedGeometry } from './shared'

export function buildEmeraldCutGeometry(): THREE.BufferGeometry {
  const vertices: THREE.Vector3[] = []
  const indices: number[] = []

  const addVertex = (vertex: THREE.Vector3) => {
    vertices.push(vertex)
    return vertices.length - 1
  }

  const addTri = (a: number, b: number, c: number) => {
    indices.push(a, b, c)
  }

  // FacetDiagrams.org 04.040 "Super Emerald"
  // L/W = 1.400, H/W = 0.908, 43+8 facets.
  const halfLength = 0.70
  const halfWidth = 0.50
  const totalDepth = 0.908
  const girdleTop = 0.01
  const girdleBottom = -0.01
  const crownHeight = 0.22
  const pavilionDepth = totalDepth - (girdleTop - girdleBottom) - crownHeight

  const tableLength = halfLength * 0.52
  const tableWidth = halfWidth * 0.52
  const crownALength = halfLength * 0.60
  const crownAWidth = halfWidth * 0.60
  const crownBLength = halfLength * 0.76
  const crownBWidth = halfWidth * 0.76
  const crownCLength = halfLength * 0.90
  const crownCWidth = halfWidth * 0.90
  const crownDLength = halfLength * 0.98
  const crownDWidth = halfWidth * 0.98

  const crownA = girdleTop + crownHeight
  const crownB = girdleTop + crownHeight * 0.72
  const crownC = girdleTop + crownHeight * 0.46
  const crownD = girdleTop + crownHeight * 0.20

  const pavilion1 = girdleBottom - pavilionDepth * 0.28
  const pavilion2 = girdleBottom - pavilionDepth * 0.57
  const pavilion3 = girdleBottom - pavilionDepth * 0.82
  const culet = girdleBottom - pavilionDepth

  const tableV = [
    addVertex(new THREE.Vector3(0, crownA, 0)),
    addVertex(new THREE.Vector3(tableLength, crownA, tableWidth)),
    addVertex(new THREE.Vector3(tableLength, crownA, -tableWidth)),
    addVertex(new THREE.Vector3(-tableLength, crownA, -tableWidth)),
    addVertex(new THREE.Vector3(-tableLength, crownA, tableWidth)),
  ]

  const crownA0 = addVertex(new THREE.Vector3(crownALength, crownA, crownAWidth))
  const crownA1 = addVertex(new THREE.Vector3(crownALength, crownA, -crownAWidth))
  const crownA2 = addVertex(new THREE.Vector3(-crownALength, crownA, -crownAWidth))
  const crownA3 = addVertex(new THREE.Vector3(-crownALength, crownA, crownAWidth))

  const crownB0 = addVertex(new THREE.Vector3(crownBLength, crownB, crownBWidth))
  const crownB1 = addVertex(new THREE.Vector3(crownBLength, crownB, -crownBWidth))
  const crownB2 = addVertex(new THREE.Vector3(-crownBLength, crownB, -crownBWidth))
  const crownB3 = addVertex(new THREE.Vector3(-crownBLength, crownB, crownBWidth))

  const crownC0 = addVertex(new THREE.Vector3(crownCLength, crownC, crownCWidth))
  const crownC1 = addVertex(new THREE.Vector3(crownCLength, crownC, -crownCWidth))
  const crownC2 = addVertex(new THREE.Vector3(-crownCLength, crownC, -crownCWidth))
  const crownC3 = addVertex(new THREE.Vector3(-crownCLength, crownC, crownCWidth))

  const crownD0 = addVertex(new THREE.Vector3(crownDLength, crownD, crownDWidth))
  const crownD1 = addVertex(new THREE.Vector3(crownDLength, crownD, -crownDWidth))
  const crownD2 = addVertex(new THREE.Vector3(-crownDLength, crownD, -crownDWidth))
  const crownD3 = addVertex(new THREE.Vector3(-crownDLength, crownD, crownDWidth))

  const girdle0 = addVertex(new THREE.Vector3(halfLength, girdleBottom, halfWidth))
  const girdle1 = addVertex(new THREE.Vector3(halfLength, girdleBottom, -halfWidth))
  const girdle2 = addVertex(new THREE.Vector3(-halfLength, girdleBottom, -halfWidth))
  const girdle3 = addVertex(new THREE.Vector3(-halfLength, girdleBottom, halfWidth))

  const p1_0 = addVertex(new THREE.Vector3(halfLength * 0.92, pavilion1, halfWidth * 0.92))
  const p1_1 = addVertex(new THREE.Vector3(halfLength * 0.92, pavilion1, -halfWidth * 0.92))
  const p1_2 = addVertex(new THREE.Vector3(-halfLength * 0.92, pavilion1, -halfWidth * 0.92))
  const p1_3 = addVertex(new THREE.Vector3(-halfLength * 0.92, pavilion1, halfWidth * 0.92))

  const p2_0 = addVertex(new THREE.Vector3(halfLength * 0.70, pavilion2, halfWidth * 0.70))
  const p2_1 = addVertex(new THREE.Vector3(halfLength * 0.70, pavilion2, -halfWidth * 0.70))
  const p2_2 = addVertex(new THREE.Vector3(-halfLength * 0.70, pavilion2, -halfWidth * 0.70))
  const p2_3 = addVertex(new THREE.Vector3(-halfLength * 0.70, pavilion2, halfWidth * 0.70))

  const p3_0 = addVertex(new THREE.Vector3(halfLength * 0.40, pavilion3, halfWidth * 0.40))
  const p3_1 = addVertex(new THREE.Vector3(halfLength * 0.40, pavilion3, -halfWidth * 0.40))
  const p3_2 = addVertex(new THREE.Vector3(-halfLength * 0.40, pavilion3, -halfWidth * 0.40))
  const p3_3 = addVertex(new THREE.Vector3(-halfLength * 0.40, pavilion3, halfWidth * 0.40))

  const culetV = addVertex(new THREE.Vector3(0, culet, 0))

  addTri(tableV[0], tableV[1], tableV[2])
  addTri(tableV[0], tableV[2], tableV[3])
  addTri(tableV[0], tableV[3], tableV[4])
  addTri(tableV[0], tableV[4], tableV[1])

  addTri(tableV[1], crownA0, tableV[2])
  addTri(tableV[2], crownA1, tableV[3])
  addTri(tableV[3], crownA2, tableV[4])
  addTri(tableV[4], crownA3, tableV[1])

  addTri(tableV[1], crownA1, crownA0)
  addTri(tableV[1], crownA0, crownA3)
  addTri(tableV[2], crownA1, crownA0)
  addTri(tableV[2], crownA2, crownA1)
  addTri(tableV[3], crownA2, crownA1)
  addTri(tableV[3], crownA3, crownA2)
  addTri(tableV[4], crownA3, crownA0)
  addTri(tableV[4], crownA0, crownA3)

  addTri(crownA0, crownB0, crownA1)
  addTri(crownA1, crownB1, crownA2)
  addTri(crownA2, crownB2, crownA3)
  addTri(crownA3, crownB3, crownA0)

  addTri(crownB0, crownC0, crownB1)
  addTri(crownB1, crownC1, crownB2)
  addTri(crownB2, crownC2, crownB3)
  addTri(crownB3, crownC3, crownB0)

  addTri(crownC0, crownD0, crownC1)
  addTri(crownC1, crownD1, crownC2)
  addTri(crownC2, crownD2, crownC3)
  addTri(crownC3, crownD3, crownC0)

  addTri(crownD0, girdle0, crownD1)
  addTri(crownD1, girdle1, crownD2)
  addTri(crownD2, girdle2, crownD3)
  addTri(crownD3, girdle3, crownD0)

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

  addTri(p3_0, culetV, p3_1)
  addTri(p3_1, culetV, p3_2)
  addTri(p3_2, culetV, p3_3)
  addTri(p3_3, culetV, p3_0)

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
