import * as THREE from 'three'
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js'

export function prepareTrimPaths(geometry: LineSegmentsGeometry, anchors: THREE.Vector3[]) {
  const start = geometry.getAttribute('instanceStart')
  const end = geometry.getAttribute('instanceEnd')
  const points: THREE.Vector3[] = []
  const ids = new Map<string, number>()
  const identify = (point: THREE.Vector3) => {
    const key = `${point.x.toFixed(5)},${point.y.toFixed(5)},${point.z.toFixed(5)}`
    let id = ids.get(key)
    if (id === undefined) { id = points.length; ids.set(key, id); points.push(point.clone()) }
    return id
  }
  const edges: [number, number][] = []
  for (let index = 0; index < start.count; index++) {
    const first = identify(new THREE.Vector3(start.getX(index), start.getY(index), start.getZ(index)))
    const second = identify(new THREE.Vector3(end.getX(index), end.getY(index), end.getZ(index)))
    if (first !== second) edges.push([first, second])
  }
  const seeds = new Set<number>()
  for (const anchor of anchors) {
    let closest = Infinity
    let candidate = anchor
    for (const [first, second] of edges) {
      const point = new THREE.Line3(points[first], points[second]).closestPointToPoint(anchor, true, new THREE.Vector3())
      const distance = point.distanceToSquared(anchor)
      if (distance < closest) { closest = distance; candidate = point }
    }
    seeds.add(identify(candidate))
  }
  const links: { target: number; length: number }[][] = points.map(() => [])
  const segments: number[] = []
  const splitEdges: [number, number, number][] = []
  const direction = new THREE.Vector3()
  const delta = new THREE.Vector3()
  for (const [first, second] of edges) {
    direction.subVectors(points[second], points[first])
    const squared = direction.lengthSq()
    const splits: { id: number; travel: number }[] = []
    points.forEach((point, id) => {
      delta.subVectors(point, points[first])
      const travel = delta.dot(direction) / squared
      if (travel < -0.00001 || travel > 1.00001) return
      if (delta.addScaledVector(direction, -travel).lengthSq() < 1e-9) splits.push({ id, travel: THREE.MathUtils.clamp(travel, 0, 1) })
    })
    splits.sort((left, right) => left.travel - right.travel)
    for (let index = 1; index < splits.length; index++) {
      const from = splits[index - 1].id, to = splits[index].id
      const length = points[from].distanceTo(points[to])
      if (length < 0.000001) continue
      links[from].push({ target: to, length })
      links[to].push({ target: from, length })
      splitEdges.push([from, to, length])
      segments.push(...points[from].toArray(), ...points[to].toArray())
    }
  }
  const visited = new Set<number>()
  points.forEach((_, origin) => {
    if (visited.has(origin) || !links[origin].length) return
    const component = [origin]
    visited.add(origin)
    for (let index = 0; index < component.length; index++) {
      for (const link of links[component[index]]) if (!visited.has(link.target)) { visited.add(link.target); component.push(link.target) }
    }
    if (component.some((id) => seeds.has(id))) return
    let closest = component[0], distance = Infinity
    for (const id of component) for (const anchor of anchors) {
      const candidate = points[id].distanceToSquared(anchor)
      if (candidate < distance) { distance = candidate; closest = id }
    }
    seeds.add(closest)
  })
  const distances = points.map((_, id) => seeds.has(id) ? 0 : Infinity)
  const pending = new Set(points.map((_, id) => id))
  while (pending.size) {
    let next = -1, distance = Infinity
    for (const id of pending) if (distances[id] < distance) { distance = distances[id]; next = id }
    if (next < 0) break
    pending.delete(next)
    for (const link of links[next]) distances[link.target] = Math.min(distances[link.target], distance + link.length)
  }
  const trimStart: number[] = [], trimEnd: number[] = [], lengths: number[] = []
  let maximum = 0
  for (const [first, second, length] of splitEdges) {
    trimStart.push(distances[first])
    trimEnd.push(distances[second])
    lengths.push(length)
    maximum = Math.max(maximum, (distances[first] + distances[second] + length) / 2)
  }
  LineSegmentsGeometry.prototype.setPositions.call(geometry, segments)
  geometry.setAttribute('instanceTrimStart', new THREE.InstancedBufferAttribute(new Float32Array(trimStart), 1))
  geometry.setAttribute('instanceTrimEnd', new THREE.InstancedBufferAttribute(new Float32Array(trimEnd), 1))
  geometry.setAttribute('instanceTrimLength', new THREE.InstancedBufferAttribute(new Float32Array(lengths), 1))
  geometry.userData.trimAnchors = anchors.map((point) => point.toArray())
  return maximum
}