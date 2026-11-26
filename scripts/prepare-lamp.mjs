import { readFile, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { gzipSync } from 'node:zlib'
import * as THREE from 'three'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import { Accessor, Document, NodeIO } from '@gltf-transform/core'
import { EXTMeshoptCompression } from '@gltf-transform/extensions'
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer'

function rimGeometry(geometry) {
  const segments = 360
  const radii = new Float32Array(segments)
  const positions = geometry.getAttribute('position')
  for (let vertex = 0; vertex < positions.count; vertex++) {
    const height = positions.getY(vertex)
    if (height < 1.55) continue
    const horizontal = positions.getX(vertex)
    const depth = positions.getZ(vertex)
    const angle = (Math.atan2(depth, horizontal) + Math.PI * 2) % (Math.PI * 2)
    const segment = Math.floor(angle / (Math.PI * 2) * segments)
    const radius = Math.hypot(horizontal, depth)
    if (radius > radii[segment]) radii[segment] = radius
  }
  const radiusAt = (segment) => {
    const index = (segment + segments) % segments
    if (radii[index]) return radii[index]
    for (let distance = 1; distance < segments; distance++) {
      const before = radii[(index - distance + segments) % segments]
      const after = radii[(index + distance) % segments]
      if (before && after) return (before + after) / 2
      if (before || after) return before || after
    }
    return 2
  }
  return Array.from({ length: segments }, (_, segment) => {
    let radius = 0
    let weightSum = 0
    for (let neighbor = -4; neighbor <= 4; neighbor++) {
      const weight = 5 - Math.abs(neighbor)
      radius += radiusAt(segment + neighbor) * weight
      weightSum += weight
    }
    radius /= weightSum
    const angle = (segment + 0.5) / segments * Math.PI * 2
    return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]
  })
}

const started = performance.now()
const source = await readFile(new URL('../Full lamp.stl', import.meta.url))
const geometry = new STLLoader().parse(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength))
geometry.computeBoundingBox()
const bounds = geometry.boundingBox
const center = bounds.getCenter(new THREE.Vector3())
const scale = 3.2 / (bounds.max.z - bounds.min.z)
geometry.translate(-center.x, -center.y, -bounds.min.z)
geometry.rotateX(-Math.PI / 2)
geometry.scale(scale, scale, scale)

const positions = geometry.getAttribute('position')
const normals = geometry.getAttribute('normal')
const positionBits = new Uint32Array(positions.array.buffer, positions.array.byteOffset, positions.array.length)
const normalBits = new Uint32Array(normals.array.buffer, normals.array.byteOffset, normals.array.length)
const uniquePositions = new Float32Array(positions.array.length)
const uniqueNormals = new Float32Array(normals.array.length)
const indices = new Uint32Array(positions.count)
const originalVertices = new Uint32Array(positions.count)
const vertices = new Map()
let vertexCount = 0
let indexCount = 0
let removedTriangles = 0
let removedShadeFragments = 0
let removedRimTabs = 0
let preservedBaseTriangles = 0
let preservedShadeShellTriangles = 0
const retainedFaces = []
const faceComponents = []
const connectedVertices = new Map()
const parents = []
const componentRoot = (id) => {
  while (parents[id] !== id) {
    parents[id] = parents[parents[id]]
    id = parents[id]
  }
  return id
}
const connectVertex = (index) => {
  const key = `${positions.getX(index).toFixed(5)},${positions.getY(index).toFixed(5)},${positions.getZ(index).toFixed(5)}`
  let id = connectedVertices.get(key)
  if (id === undefined) {
    id = parents.length
    parents.push(id)
    connectedVertices.set(key, id)
  }
  return id
}

for (let vertex = 0; vertex < positions.count; vertex += 3) {
  let inBand = true
  let narrowX = true
  let narrowZ = true
  let centerX = 0
  let centerZ = 0
  let maximumRadius = 0
  for (let corner = 0; corner < 3; corner++) {
    const index = vertex + corner
    const horizontal = positions.getX(index)
    const height = positions.getY(index)
    const depth = positions.getZ(index)
    centerX += horizontal
    centerZ += depth
    maximumRadius = Math.max(maximumRadius, Math.hypot(horizontal, depth))
    inBand &&= height >= 1.5999 && height <= 1.665
    narrowX &&= Math.abs(horizontal) <= 0.084
    narrowZ &&= Math.abs(depth) <= 0.084
  }
  const radius = Math.hypot(centerX / 3, centerZ / 3)
  if (inBand && (narrowX || narrowZ) && radius > 0.9 && radius < 1.88) {
    removedTriangles++
    continue
  }
  if (inBand && (narrowX || narrowZ) && radius >= 1.88 && maximumRadius < 1.96) {
    removedRimTabs++
    continue
  }
  const corners = [0, 1, 2].map((corner) => connectVertex(vertex + corner))
  for (const corner of corners.slice(1)) parents[componentRoot(corner)] = componentRoot(corners[0])
  retainedFaces.push(vertex)
  faceComponents.push(corners[0])
}

const components = new Map()
for (let face = 0; face < retainedFaces.length; face++) {
  const root = componentRoot(faceComponents[face])
  let component = components.get(root)
  if (!component) {
    component = { minHeight: Infinity, maxHeight: -Infinity, maxRadius: 0 }
    components.set(root, component)
  }
  for (let corner = 0; corner < 3; corner++) {
    const index = retainedFaces[face] + corner
    component.minHeight = Math.min(component.minHeight, positions.getY(index))
    component.maxHeight = Math.max(component.maxHeight, positions.getY(index))
    component.maxRadius = Math.max(component.maxRadius, Math.hypot(positions.getX(index), positions.getZ(index)))
  }
}

for (let face = 0; face < retainedFaces.length; face++) {
  const component = components.get(componentRoot(faceComponents[face]))
  if (component.minHeight >= 1.5999 && component.maxHeight <= 1.665 && component.maxRadius < 1) {
    removedShadeFragments++
    continue
  }
  const vertex = retainedFaces[face]
  if (component.minHeight < 1.5999) preservedBaseTriangles++
  else preservedShadeShellTriangles++
  for (let corner = 0; corner < 3; corner++) {
    const original = vertex + corner
    const offset = original * 3
    const key = `${positionBits[offset]},${positionBits[offset + 1]},${positionBits[offset + 2]},${normalBits[offset]},${normalBits[offset + 1]},${normalBits[offset + 2]}`
    let retained = vertices.get(key)
    if (retained === undefined) {
      retained = vertexCount++
      vertices.set(key, retained)
      uniquePositions.set(positions.array.subarray(offset, offset + 3), retained * 3)
      uniqueNormals.set(normals.array.subarray(offset, offset + 3), retained * 3)
    }
    indices[indexCount] = retained
    originalVertices[indexCount++] = original
  }
}

assert.equal(removedTriangles, 8877)
assert.equal(removedShadeFragments, 32896)
assert.equal(removedRimTabs, 350)
assert.equal(preservedBaseTriangles, 274938)
assert.equal(preservedShadeShellTriangles + removedRimTabs, 83231)
const document = new Document()
const buffer = document.createBuffer()
const position = document.createAccessor('positions').setType(Accessor.Type.VEC3).setArray(uniquePositions.slice(0, vertexCount * 3)).setBuffer(buffer)
const normal = document.createAccessor('normals').setType(Accessor.Type.VEC3).setArray(uniqueNormals.slice(0, vertexCount * 3)).setBuffer(buffer)
const index = document.createAccessor('indices').setType(Accessor.Type.SCALAR).setArray(indices.slice(0, indexCount)).setBuffer(buffer)
const rim = rimGeometry(geometry)
const primitive = document.createPrimitive().setAttribute('POSITION', position).setAttribute('NORMAL', normal).setIndices(index).setExtras({ kamanRim: rim })
const mesh = document.createMesh('Kaman').addPrimitive(primitive)
const node = document.createNode('Kaman').setMesh(mesh)
document.createScene('Kaman').addChild(node)
document.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE })
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready])
const io = new NodeIO().registerExtensions([EXTMeshoptCompression]).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder })
const optimized = await io.writeBinary(document)
const decoded = await io.readBinary(optimized)
const decodedPrimitive = decoded.getRoot().listMeshes()[0].listPrimitives()[0]
const decodedPositions = decodedPrimitive.getAttribute('POSITION').getArray()
const decodedNormals = decodedPrimitive.getAttribute('NORMAL').getArray()
const decodedIndices = decodedPrimitive.getIndices().getArray()
const decodedPositionBits = new Uint32Array(decodedPositions.buffer, decodedPositions.byteOffset, decodedPositions.length)
const decodedNormalBits = new Uint32Array(decodedNormals.buffer, decodedNormals.byteOffset, decodedNormals.length)
assert.deepEqual(decodedPrimitive.getExtras().kamanRim, rim)
assert.equal(decodedIndices.length, indexCount)
assert.deepEqual(decodedPositions, position.getArray())
assert.deepEqual(decodedNormals, normal.getArray())
for (let index = 0; index < indexCount; index += 3) {
  let rotation = 0
  while (rotation < 3 && [0, 1, 2].some((corner) => indices[index + (corner + rotation) % 3] !== decodedIndices[index + corner])) rotation++
  assert.ok(rotation < 3)
  for (let corner = 0; corner < 3; corner++) {
    const original = originalVertices[index + (corner + rotation) % 3] * 3
    const retained = decodedIndices[index + corner] * 3
    for (let axis = 0; axis < 3; axis++) {
      assert.equal(decodedPositionBits[retained + axis], positionBits[original + axis])
      assert.equal(decodedNormalBits[retained + axis], normalBits[original + axis])
    }
  }
}
const compressed = gzipSync(optimized, { level: 9 })
await writeFile(new URL('../src/assets/lamp-optimized.bin', import.meta.url), compressed)
console.log(JSON.stringify({ sourceBytes: source.byteLength, runtimeBytes: compressed.byteLength, decodedBytes: optimized.byteLength, originalVertices: positions.count, runtimeVertices: vertexCount, retainedTriangles: indexCount / 3, removedTriangles, removedShadeFragments, removedRimTabs, preservedBaseTriangles, preservedShadeShellTriangles, losslessVerified: true, preparationMs: Math.round(performance.now() - started) }))