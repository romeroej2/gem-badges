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

  const crownT = 0.14
  const crownD = 0.10
  const crownStar = 0.06
  const crownB = 0.02
  const girdle = -0.06
  const pavilion1 = -0.24
  const pavilion2 = -0.42
  const pavilion3 = -0.56
  const pavilion4 = -0.66
  const pavilion5 = -0.70

  const tableV = [
    addVertex(new THREE.Vector3(0, crownT, 0)),
    addVertex(new THREE.Vector3(halfW * 0.50, crownT, halfD * 0.50)),
    addVertex(new THREE.Vector3(halfW * 0.50, crownT, -halfD * 0.50)),
    addVertex(new THREE.Vector3(-halfW * 0.50, crownT, -halfD * 0.50)),
    addVertex(new THREE.Vector3(-halfW * 0.50, crownT, halfD * 0.50)),
  ]

  const crownD0 = addVertex(new THREE.Vector3(halfW * 0.56, crownD, halfD * 0.56))
  const crownD1 = addVertex(new THREE.Vector3(halfW * 0.56, crownD, -halfD * 0.56))
  const crownD2 = addVertex(new THREE.Vector3(-halfW * 0.56, crownD, -halfD * 0.56))
  const crownD3 = addVertex(new THREE.Vector3(-halfW * 0.56, crownD, halfD * 0.56))

  const crownStar0 = addVertex(new THREE.Vector3(halfW * 0.64, crownStar, halfD * 0.64))
  const crownStar1 = addVertex(new THREE.Vector3(halfW * 0.64, crownStar, -halfD * 0.64))
  const crownStar2 = addVertex(new THREE.Vector3(-halfW * 0.64, crownStar, -halfD * 0.64))
  const crownStar3 = addVertex(new THREE.Vector3(-halfW * 0.64, crownStar, halfD * 0.64))

  const crownB0 = addVertex(new THREE.Vector3(halfW * 0.80, crownB, halfD * 0.80))
  const crownB1 = addVertex(new THREE.Vector3(halfW * 0.80, crownB, -halfD * 0.80))
  const crownB2 = addVertex(new THREE.Vector3(-halfW * 0.80, crownB, -halfD * 0.80))
  const crownB3 = addVertex(new THREE.Vector3(-halfW * 0.80, crownB, halfD * 0.80))

  const crownA0 = addVertex(new THREE.Vector3(halfW * 0.90, crownB, halfD * 0.90))
  const crownA1 = addVertex(new THREE.Vector3(halfW * 0.90, crownB, -halfD * 0.90))
  const crownA2 = addVertex(new THREE.Vector3(-halfW * 0.90, crownB, -halfD * 0.90))
  const crownA3 = addVertex(new THREE.Vector3(-halfW * 0.90, crownB, halfD * 0.90))

  const girdle0 = addVertex(new THREE.Vector3(halfW, girdle, halfD))
  const girdle1 = addVertex(new THREE.Vector3(halfW, girdle, -halfD))
  const girdle2 = addVertex(new THREE.Vector3(-halfW, girdle, -halfD))
  const girdle3 = addVertex(new THREE.Vector3(-halfW, girdle, halfD))

  const p1_0 = addVertex(new THREE.Vector3(halfW * 0.88, pavilion1, halfD * 0.88))
  const p1_1 = addVertex(new THREE.Vector3(halfW * 0.88, pavilion1, -halfD * 0.88))
  const p1_2 = addVertex(new THREE.Vector3(-halfW * 0.88, pavilion1, -halfD * 0.88))
  const p1_3 = addVertex(new THREE.Vector3(-halfW * 0.88, pavilion1, halfD * 0.88))

  const p2_0 = addVertex(new THREE.Vector3(halfW * 0.70, pavilion2, halfD * 0.70))
  const p2_1 = addVertex(new THREE.Vector3(halfW * 0.70, pavilion2, -halfD * 0.70))
  const p2_2 = addVertex(new THREE.Vector3(-halfW * 0.70, pavilion2, -halfD * 0.70))
  const p2_3 = addVertex(new THREE.Vector3(-halfW * 0.70, pavilion2, halfD * 0.70))

  const p3_0 = addVertex(new THREE.Vector3(halfW * 0.48, pavilion3, halfD * 0.48))
  const p3_1 = addVertex(new THREE.Vector3(halfW * 0.48, pavilion3, -halfD * 0.48))
  const p3_2 = addVertex(new THREE.Vector3(-halfW * 0.48, pavilion3, -halfD * 0.48))
  const p3_3 = addVertex(new THREE.Vector3(-halfW * 0.48, pavilion3, halfD * 0.48))

  const p4_0 = addVertex(new THREE.Vector3(halfW * 0.26, pavilion4, halfD * 0.26))
  const p4_1 = addVertex(new THREE.Vector3(halfW * 0.26, pavilion4, -halfD * 0.26))
  const p4_2 = addVertex(new THREE.Vector3(-halfW * 0.26, pavilion4, -halfD * 0.26))
  const p4_3 = addVertex(new THREE.Vector3(-halfW * 0.26, pavilion4, halfD * 0.26))

  const p5_0 = addVertex(new THREE.Vector3(halfW * 0.06, pavilion5, halfD * 0.06))
  const p5_1 = addVertex(new THREE.Vector3(halfW * 0.06, pavilion5, -halfD * 0.06))
  const p5_2 = addVertex(new THREE.Vector3(-halfW * 0.06, pavilion5, -halfD * 0.06))
  const p5_3 = addVertex(new THREE.Vector3(-halfW * 0.06, pavilion5, halfD * 0.06))

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

  return finalizeIndexedGeometry(vertices, indices)
}
