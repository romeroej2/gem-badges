import * as THREE from 'three'
import { finalizeIndexedGeometry } from './shared'

const HEART_OUTLINE: ReadonlyArray<readonly [number, number]> = [
  [0.00, 0.37],
  [0.15, 0.49],
  [0.36, 0.42],
  [0.50, 0.18],
  [0.44, -0.10],
  [0.22, -0.34],
  [0.00, -0.515],
  [-0.22, -0.34],
  [-0.44, -0.10],
  [-0.50, 0.18],
  [-0.36, 0.42],
  [-0.15, 0.49],
]

interface HeartRingSpec {
  y: number
  xScale: number
  zScale: number
  zBias: number
}

export function traceHeartPath(context: CanvasRenderingContext2D, radius: number) {
  const scale = radius * 2

  context.beginPath()
  HEART_OUTLINE.forEach(([x, z], index) => {
    const pathX = x * scale
    const pathY = -z * scale

    if (index === 0) {
      context.moveTo(pathX, pathY)
      return
    }

    context.lineTo(pathX, pathY)
  })
  context.closePath()
}

export function buildHeartCutGeometry(): THREE.BufferGeometry {
  const vertices: THREE.Vector3[] = []
  const indices: number[] = []

  const addVertex = (vertex: THREE.Vector3) => {
    vertices.push(vertex)
    return vertices.length - 1
  }

  const interiorPoint = new THREE.Vector3(0, -0.10, -0.02)
  const faceAB = new THREE.Vector3()
  const faceAC = new THREE.Vector3()
  const faceNormal = new THREE.Vector3()
  const faceCentroid = new THREE.Vector3()
  const toInterior = new THREE.Vector3()

  const addTri = (a: number, b: number, c: number) => {
    const va = vertices[a]
    const vb = vertices[b]
    const vc = vertices[c]

    faceAB.subVectors(vb, va)
    faceAC.subVectors(vc, va)
    faceNormal.crossVectors(faceAB, faceAC)
    faceCentroid.copy(va).add(vb).add(vc).multiplyScalar(1 / 3)
    toInterior.subVectors(interiorPoint, faceCentroid)

    if (faceNormal.dot(toInterior) > 0) {
      indices.push(a, c, b)
      return
    }

    indices.push(a, b, c)
  }

  const addRing = ({ y, xScale, zScale, zBias }: HeartRingSpec) => HEART_OUTLINE.map(([x, z]) => (
    addVertex(new THREE.Vector3(x * xScale, y, z * zScale + zBias))
  ))

  const bridgeRings = (upper: number[], lower: number[]) => {
    const segments = upper.length

    for (let index = 0; index < segments; index += 1) {
      const next = (index + 1) % segments
      addTri(upper[index], lower[index], lower[next])
      addTri(upper[index], lower[next], upper[next])
    }
  }

  const fillRing = (center: number, ring: number[]) => {
    for (let index = 0; index < ring.length; index += 1) {
      const next = (index + 1) % ring.length
      addTri(center, ring[index], ring[next])
    }
  }

  const tableCenter = addVertex(new THREE.Vector3(0, 0.185, 0.09))
  const tableRing = addRing({ y: 0.185, xScale: 0.36, zScale: 0.36, zBias: 0.09 })
  const crownRing = addRing({ y: 0.085, xScale: 0.74, zScale: 0.74, zBias: 0.03 })
  const girdleTopRing = addRing({ y: 0.01, xScale: 1.0, zScale: 1.0, zBias: 0.0 })
  const girdleBottomRing = addRing({ y: -0.01, xScale: 1.0, zScale: 1.0, zBias: 0.0 })
  const pavilionRing = addRing({ y: -0.24, xScale: 0.42, zScale: 0.48, zBias: -0.10 })
  const culet = addVertex(new THREE.Vector3(0, -0.446, -0.18))

  fillRing(tableCenter, tableRing)
  bridgeRings(tableRing, crownRing)
  bridgeRings(crownRing, girdleTopRing)
  bridgeRings(girdleTopRing, girdleBottomRing)
  bridgeRings(girdleBottomRing, pavilionRing)

  for (let index = 0; index < pavilionRing.length; index += 1) {
    const next = (index + 1) % pavilionRing.length
    addTri(pavilionRing[index], culet, pavilionRing[next])
  }

  return finalizeIndexedGeometry(vertices, indices)
}
