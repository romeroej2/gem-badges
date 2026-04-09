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

  const lW = 1.25
  const w = lW / 2
  const d = 0.80 / 2

  const crownA = 0.52
  const crownB = 0.44
  const crownC = 0.36
  const crownD = 0.28
  const girdle = 0.02
  const pavilion1 = -0.18
  const pavilion2 = -0.42
  const pavilion3 = -0.60
  const culet = -0.76

  const tableV = [
    addVertex(new THREE.Vector3(0, crownA, 0)),
    addVertex(new THREE.Vector3(w * 0.5, crownA, d * 0.5)),
    addVertex(new THREE.Vector3(w * 0.5, crownA, -d * 0.5)),
    addVertex(new THREE.Vector3(-w * 0.5, crownA, -d * 0.5)),
    addVertex(new THREE.Vector3(-w * 0.5, crownA, d * 0.5)),
  ]

  const crownA0 = addVertex(new THREE.Vector3(w * 0.56, crownA, d * 0.56))
  const crownA1 = addVertex(new THREE.Vector3(w * 0.56, crownA, -d * 0.56))
  const crownA2 = addVertex(new THREE.Vector3(-w * 0.56, crownA, -d * 0.56))
  const crownA3 = addVertex(new THREE.Vector3(-w * 0.56, crownA, d * 0.56))

  const crownB0 = addVertex(new THREE.Vector3(w * 0.72, crownB, d * 0.72))
  const crownB1 = addVertex(new THREE.Vector3(w * 0.72, crownB, -d * 0.72))
  const crownB2 = addVertex(new THREE.Vector3(-w * 0.72, crownB, -d * 0.72))
  const crownB3 = addVertex(new THREE.Vector3(-w * 0.72, crownB, d * 0.72))

  const crownC0 = addVertex(new THREE.Vector3(w * 0.86, crownC, d * 0.86))
  const crownC1 = addVertex(new THREE.Vector3(w * 0.86, crownC, -d * 0.86))
  const crownC2 = addVertex(new THREE.Vector3(-w * 0.86, crownC, -d * 0.86))
  const crownC3 = addVertex(new THREE.Vector3(-w * 0.86, crownC, d * 0.86))

  const crownD0 = addVertex(new THREE.Vector3(w, crownD, d))
  const crownD1 = addVertex(new THREE.Vector3(w, crownD, -d))
  const crownD2 = addVertex(new THREE.Vector3(-w, crownD, -d))
  const crownD3 = addVertex(new THREE.Vector3(-w, crownD, d))

  const girdle0 = addVertex(new THREE.Vector3(w * 1.02, girdle, d * 1.02))
  const girdle1 = addVertex(new THREE.Vector3(w * 1.02, girdle, -d * 1.02))
  const girdle2 = addVertex(new THREE.Vector3(-w * 1.02, girdle, -d * 1.02))
  const girdle3 = addVertex(new THREE.Vector3(-w * 1.02, girdle, d * 1.02))

  const p1_0 = addVertex(new THREE.Vector3(w * 0.94, pavilion1, d * 0.94))
  const p1_1 = addVertex(new THREE.Vector3(w * 0.94, pavilion1, -d * 0.94))
  const p1_2 = addVertex(new THREE.Vector3(-w * 0.94, pavilion1, -d * 0.94))
  const p1_3 = addVertex(new THREE.Vector3(-w * 0.94, pavilion1, d * 0.94))

  const p2_0 = addVertex(new THREE.Vector3(w * 0.68, pavilion2, d * 0.68))
  const p2_1 = addVertex(new THREE.Vector3(w * 0.68, pavilion2, -d * 0.68))
  const p2_2 = addVertex(new THREE.Vector3(-w * 0.68, pavilion2, -d * 0.68))
  const p2_3 = addVertex(new THREE.Vector3(-w * 0.68, pavilion2, d * 0.68))

  const p3_0 = addVertex(new THREE.Vector3(w * 0.38, pavilion3, d * 0.38))
  const p3_1 = addVertex(new THREE.Vector3(w * 0.38, pavilion3, -d * 0.38))
  const p3_2 = addVertex(new THREE.Vector3(-w * 0.38, pavilion3, -d * 0.38))
  const p3_3 = addVertex(new THREE.Vector3(-w * 0.38, pavilion3, d * 0.38))

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
  addTri(tableV[1], crownA3, crownA3)
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

  return finalizeIndexedGeometry(vertices, indices)
}
