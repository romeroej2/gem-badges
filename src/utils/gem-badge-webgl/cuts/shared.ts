import * as THREE from 'three'

export function finalizeIndexedGeometry(
  vertices: THREE.Vector3[],
  indices: number[],
  onFinalize?: (geometry: THREE.BufferGeometry) => void
) {
  const geometry = new THREE.BufferGeometry()
  geometry.setFromPoints(vertices)
  geometry.setIndex(indices)

  const faceted = geometry.toNonIndexed()
  faceted.computeVertexNormals()
  onFinalize?.(faceted)
  return faceted
}

export function buildFacetRing(
  radius: number,
  y: number,
  count: number,
  angleOffset = 0,
  xScale = 1,
  zScale = 1
): THREE.Vector3[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + angleOffset
    return new THREE.Vector3(
      Math.cos(angle) * radius * xScale,
      y,
      Math.sin(angle) * radius * zScale
    )
  })
}

export function buildLatheCut(
  points: Array<[number, number]>,
  segments: number,
  scale?: [number, number, number]
) {
  const geometry = new THREE.LatheGeometry(
    points.map(([x, y]) => new THREE.Vector2(x, y)),
    segments
  )

  if (scale) {
    geometry.applyMatrix4(new THREE.Matrix4().makeScale(...scale))
  }

  const faceted = geometry.toNonIndexed()
  faceted.computeVertexNormals()
  return faceted
}
