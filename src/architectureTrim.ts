import * as THREE from 'three'
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js'

export function prepareTrimPaths(geometry: LineSegmentsGeometry, anchors: THREE.Vector3[], reversedAnchorCount = 0) {
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
  const reversedSeeds = new Set<number>()
  for (const [anchorIndex, anchor] of anchors.entries()) {
    let closest = Infinity
    let candidate = anchor
    for (const [first, second] of edges) {
      const point = new THREE.Line3(points[first], points[second]).closestPointToPoint(anchor, true, new THREE.Vector3())
      const distance = point.distanceToSquared(anchor)
      if (distance < closest) { closest = distance; candidate = point }
    }
    const id = identify(candidate)
    seeds.add(id)
    if (anchorIndex < reversedAnchorCount) reversedSeeds.add(id)
  }
  const links: { target: number; length: number }[][] = points.map(() => [])
  const segments: number[] = []
  const splitEdges: [number, number, number][] = []
  const direction = new THREE.Vector3()
  const delta = new THREE.Vector3()
  const orderPoints = (axis: 'x' | 'y' | 'z') => points.map((_, id) => id).sort((left, right) => points[left][axis] - points[right][axis] || left - right)
  const pointOrder = { x: orderPoints('x'), y: orderPoints('y'), z: orderPoints('z') }
  const lowerBound = (order: number[], axis: 'x' | 'y' | 'z', value: number) => {
    let lower = 0, upper = order.length
    while (lower < upper) {
      const middle = (lower + upper) >>> 1
      if (points[order[middle]][axis] < value) lower = middle + 1
      else upper = middle
    }
    return lower
  }
  for (const [first, second] of edges) {
    direction.subVectors(points[second], points[first])
    const squared = direction.lengthSq()
    const splits: { id: number; travel: number }[] = []
    const axis = Math.abs(direction.x) >= Math.abs(direction.y) && Math.abs(direction.x) >= Math.abs(direction.z) ? 'x' : Math.abs(direction.y) >= Math.abs(direction.z) ? 'y' : 'z'
    const order = pointOrder[axis]
    const padding = Math.abs(direction[axis]) * 0.00001 + 0.000032
    const minimum = Math.min(points[first][axis], points[second][axis]) - padding
    const maximum = Math.max(points[first][axis], points[second][axis]) + padding
    for (let candidate = lowerBound(order, axis, minimum); candidate < order.length && points[order[candidate]][axis] <= maximum; candidate++) {
      const id = order[candidate], point = points[id]
      delta.subVectors(point, points[first])
      const travel = delta.dot(direction) / squared
      if (travel < -0.00001 || travel > 1.00001) continue
      if (delta.addScaledVector(direction, -travel).lengthSq() < 1e-9) splits.push({ id, travel: THREE.MathUtils.clamp(travel, 0, 1) })
    }
    splits.sort((left, right) => left.travel - right.travel || left.id - right.id)
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
  const pending: { id: number; distance: number }[] = []
  const precedes = (left: { id: number; distance: number }, right: { id: number; distance: number }) => left.distance < right.distance || left.distance === right.distance && left.id < right.id
  const enqueue = (entry: { id: number; distance: number }) => {
    let index = pending.length
    pending.push(entry)
    while (index > 0) {
      const parent = (index - 1) >>> 1
      if (!precedes(entry, pending[parent])) break
      pending[index] = pending[parent]
      index = parent
    }
    pending[index] = entry
  }
  for (const id of seeds) enqueue({ id, distance: 0 })
  while (pending.length) {
    const next = pending[0], last = pending.pop()!
    if (pending.length) {
      let index = 0
      while (index * 2 + 1 < pending.length) {
        let child = index * 2 + 1
        if (child + 1 < pending.length && precedes(pending[child + 1], pending[child])) child++
        if (!precedes(pending[child], last)) break
        pending[index] = pending[child]
        index = child
      }
      pending[index] = last
    }
    if (next.distance !== distances[next.id]) continue
    for (const link of links[next.id]) {
      const distance = next.distance + link.length
      if (distance >= distances[link.target]) continue
      distances[link.target] = distance
      enqueue({ id: link.target, distance })
    }
  }
  const trimStart: number[] = [], trimEnd: number[] = [], lengths: number[] = [], reverse: number[] = []
  let maximum = 0
  for (const [first, second, length] of splitEdges) {
    trimStart.push(distances[first])
    trimEnd.push(distances[second])
    lengths.push(length)
    reverse.push(Number(reversedSeeds.has(first) || reversedSeeds.has(second)))
    maximum = Math.max(maximum, (distances[first] + distances[second] + length) / 2)
  }
  LineSegmentsGeometry.prototype.setPositions.call(geometry, segments)
  geometry.setAttribute('instanceTrimStart', new THREE.InstancedBufferAttribute(new Float32Array(trimStart), 1))
  geometry.setAttribute('instanceTrimEnd', new THREE.InstancedBufferAttribute(new Float32Array(trimEnd), 1))
  geometry.setAttribute('instanceTrimLength', new THREE.InstancedBufferAttribute(new Float32Array(lengths), 1))
  geometry.setAttribute('instanceTrimReverse', new THREE.InstancedBufferAttribute(new Float32Array(reverse), 1))
  geometry.userData.trimAnchors = anchors.map((point) => point.toArray())
  return maximum
}