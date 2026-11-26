import * as THREE from 'three'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import { vectorArchPath } from './architectureLayout'

let archSamples: THREE.Vector2[] | undefined

export function palaceDomePoints() {
  const apex = new THREE.Vector3(0, 0, -2.2)
  const left = new THREE.CubicBezierCurve3(new THREE.Vector3(-1.6, 0, 0), new THREE.Vector3(-2.6, 0, -0.35), new THREE.Vector3(-1.5, 0, -1.5), apex).getPoints(64)
  const right = new THREE.CubicBezierCurve3(apex, new THREE.Vector3(1.5, 0, -1.5), new THREE.Vector3(2.6, 0, -0.35), new THREE.Vector3(1.6, 0, 0)).getPoints(64)
  const points = [...left, ...right.slice(1)]
  const halfWidth = Math.max(...points.map((point) => Math.abs(point.x)))
  return points.map((point) => point.set(point.x * 2 / halfWidth, 0, point.z * 2 / 2.2))
}

export function vectorArchWindowPoints(openingWidth: number, openingHeight: number) {
  archSamples ??= new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${vectorArchPath}" /></svg>`).paths[0].subPaths[0].getSpacedPoints(96)
  const scale = openingWidth / (1370.03 - 553.976)
  const points = archSamples.map((point) => new THREE.Vector2((point.x - 962.003) * scale, point.y * scale))
  const height = Math.max(openingHeight, 553.975 * scale)
  points.push(new THREE.Vector2(openingWidth / 2, height), new THREE.Vector2(-openingWidth / 2, height))
  return points
}

export function cuspedWindowPoints(openingWidth: number, openingHeight: number) {
  const shoulder = openingHeight * 0.42
  const anchors = [new THREE.Vector2(-openingWidth / 2, shoulder), new THREE.Vector2(-openingWidth * 0.44, openingHeight * 0.24), new THREE.Vector2(-openingWidth * 0.27, openingHeight * 0.13), new THREE.Vector2(0, 0), new THREE.Vector2(openingWidth * 0.27, openingHeight * 0.13), new THREE.Vector2(openingWidth * 0.44, openingHeight * 0.24), new THREE.Vector2(openingWidth / 2, shoulder)]
  const points: THREE.Vector2[] = []
  for (let index = 0; index < anchors.length - 1; index++) {
    const from = anchors[index], to = anchors[index + 1]
    const middle = from.clone().lerp(to, 0.5)
    middle.x += (middle.x < 0 ? -1 : 1) * openingWidth * 0.06
    middle.y -= openingHeight * 0.055
    const curve = new THREE.QuadraticBezierCurve(from, middle, to).getPoints(12)
    points.push(...(index ? curve.slice(1) : curve))
  }
  points.push(new THREE.Vector2(openingWidth / 2, openingHeight), new THREE.Vector2(-openingWidth / 2, openingHeight))
  return points
}