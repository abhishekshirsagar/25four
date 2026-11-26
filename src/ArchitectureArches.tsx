import { useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { SVGResult } from 'three/addons/loaders/SVGLoader.js'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import { Line2 } from 'three/addons/lines/Line2.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js'
import { archCurlEnd, archCurlStart, architectureDetailOpacity, architectureLayout, centralWindowLayout } from './architectureLayout'
import { cuspedWindowPoints, palaceDomePoints, vectorArchWindowPoints } from './architectureProfiles'
import { prepareTrimPaths } from './architectureTrim'

const architectureEnd = archCurlEnd
const archOrder = [3, 0, 1, 2]
const lineWidth = 1.5
const mobileLineWidth = 1
export const vectorLineWidth = 2.2

function archCurves(svg: SVGResult) {
  const shape = svg.paths.flatMap((path) => SVGLoader.createShapes(path))[0]
  const perimeter = shape.getSpacedPoints(720).slice(0, 720)
  const corners = [[553.974, 553.974], [1370.03, 553.974], [1370.03, 1370.03], [553.974, 1370.03]]
  const anchors = corners.map(([horizontal, vertical]) => {
    let closest = 0
    let distance = Infinity
    perimeter.forEach((point, index) => {
      const candidate = Math.hypot(point.x - horizontal, point.y - vertical)
      if (candidate < distance) { closest = index; distance = candidate }
    })
    return closest
  })
  return archOrder.map((part) => {
    const start = anchors[part]
    const end = anchors[(part + 1) % 4]
    const count = (end - start + perimeter.length) % perimeter.length
    const first = perimeter[start]
    const last = perimeter[end]
    const pivot = new THREE.Vector3(((first.x + last.x) / 2 - 962) / 481, 0, ((first.y + last.y) / 2 - 962) / 481)
    const positions: number[] = []
    for (let sample = 0; sample <= count; sample++) {
      const point = perimeter[(start + sample) % perimeter.length]
      positions.push((point.x - 962) / 481 - pivot.x, 0, (point.y - 962) / 481 - pivot.z)
    }
    const orientation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), part * Math.PI / 2)
    const bounds = new THREE.Box3()
    for (let sample = 0; sample < positions.length; sample += 3) bounds.expandByPoint(new THREE.Vector3(positions[sample], positions[sample + 1], positions[sample + 2]).applyQuaternion(orientation))
    return { part, pivot, positions, width: bounds.max.x - bounds.min.x, height: bounds.max.z - bounds.min.z, horizontalOffset: (bounds.min.x + bounds.max.x) / 2, orientation }
  })
}

function lineMaterial(trimmed = false) {
  const material = new LineMaterial({ color: '#02144c', linewidth: lineWidth, transparent: true, opacity: 0, depthTest: false, depthWrite: false, alphaToCoverage: true })
  const trim = { trimProgress: { value: 0 }, trimMaximum: { value: 1 } }
  material.userData.trim = trim
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replaceAll('alpha = 1.0 - smoothstep', 'alpha *= 1.0 - smoothstep')
    if (!trimmed) return
    Object.assign(shader.uniforms, trim)
    shader.vertexShader = `attribute float instanceTrimStart; attribute float instanceTrimEnd; attribute float instanceTrimLength; attribute float instanceTrimReverse; varying vec3 trimDistances; varying float trimCoordinate; varying float trimReverse;\n` + shader.vertexShader.replace('void main() {', 'void main() { trimDistances = vec3(instanceTrimStart, instanceTrimEnd, instanceTrimLength); trimCoordinate = position.y; trimReverse = instanceTrimReverse;')
    shader.fragmentShader = `uniform float trimProgress; uniform float trimMaximum; varying vec3 trimDistances; varying float trimCoordinate; varying float trimReverse;\n` + shader.fragmentShader.replace('float alpha = opacity;', `float alpha = opacity;
      float travel = clamp(trimCoordinate, 0.0, 1.0);
      float pathDistance = min(trimDistances.x + travel * trimDistances.z, trimDistances.y + (1.0 - travel) * trimDistances.z);
      if (trimReverse > 0.5) {
        float localMaximum = max((trimDistances.x + trimDistances.y + trimDistances.z) * 0.5, 0.00001);
        pathDistance = (1.0 - pathDistance / localMaximum) * trimMaximum;
      }
      if (trimProgress > 0.0) {
        float boundary = trimProgress * (trimMaximum + 0.0001);
        float feather = max(fwidth(pathDistance), 0.00001);
        if (pathDistance < boundary - feather) discard;
        alpha *= smoothstep(boundary - feather, boundary + feather, pathDistance);
      }`)
  }
  material.customProgramCacheKey = () => trimmed ? 'kaman-published-trim-local-arch-reverse-v5' : 'kaman-standard-line-opacity-v1'
  return material
}

export default function ArchitectureArches({ svg, motif, vector, progress, entrance, reducedMotion }: {
  svg: SVGResult
  motif: THREE.Texture
  vector: RefObject<THREE.Group | null>
  progress: number
  entrance: number
  reducedMotion: boolean
}) {
  const [curves] = useState(() => archCurves(svg))
  const root = useRef<THREE.Group>(null)
  const panels = useRef<Line2[]>([])
  const building = useRef<LineSegments2>(null)
  const roof = useRef<Line2>(null)
  const windowBacking = useRef<THREE.Mesh<THREE.ShapeGeometry, THREE.ShaderMaterial>>(null)
  const windowOutline = useRef<Line2>(null)
  const windowLayout = useRef('')
  const layout = useRef('')
  const [curlPose] = useState(() => ({ flatOrientation: new THREE.Quaternion(), rotation: new THREE.Quaternion(), flatCenter: new THREE.Vector3(), center: new THREE.Vector3(), turn: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4) }))
  const [measure] = useState(() => ({ center: new THREE.Vector3(), right: new THREE.Vector3(), point: new THREE.Vector3(), focus: new THREE.Vector3(), closeFocus: new THREE.Vector3(), finishFocus: new THREE.Vector3(), parentInverse: new THREE.Matrix4(), hinge: new THREE.Vector3(), joint: new THREE.Vector3(), end: new THREE.Vector3(), packed: Array.from({ length: 4 }, () => new THREE.Vector3()), ink: new THREE.Color('#02144c'), white: new THREE.Color('#ffffff'), startOrientation: new THREE.Quaternion(), front: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2) }))

  useLayoutEffect(() => {
    const parent = root.current!
    const resources = curves.map((curve) => {
      const line = new Line2(new LineGeometry().setPositions(curve.positions), lineMaterial())
      line.name = `kaman-architecture-arch-${curve.part}`
      line.visible = false
      line.frustumCulled = false
      line.renderOrder = 4
      return line
    })
    const elevation = new LineSegments2(new LineSegmentsGeometry(), lineMaterial(true))
    elevation.name = 'kaman-architecture-elevation'
    elevation.visible = false
    elevation.frustumCulled = false
    elevation.renderOrder = 3
    const dome = new Line2(new LineGeometry().setPositions(palaceDomePoints().flatMap((point) => point.toArray())), lineMaterial(true))
    dome.material.userData.trim.trimMaximum.value = prepareTrimPaths(dome.geometry, [new THREE.Vector3(-1.6, 0, 0), new THREE.Vector3(1.6, 0, 0), new THREE.Vector3(0, 0, -2)])
    dome.name = 'kaman-architecture-ghumat'
    dome.visible = false
    dome.frustumCulled = false
    dome.renderOrder = 4
    const backing = new THREE.Mesh(new THREE.ShapeGeometry(), new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { motifTexture: { value: motif }, windowInk: { value: new THREE.Color('#02144c') }, tileSize: { value: 1 }, opacity: { value: 1 } },
      vertexShader: 'varying vec2 windowPosition; void main() { windowPosition = vec2(position.x, -position.y); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform sampler2D motifTexture;
        uniform vec3 windowInk;
        uniform float tileSize;
        uniform float opacity;
        varying vec2 windowPosition;
        float motifAt(vec2 tile) {
          vec2 coordinates = (tile - 0.5) / (50.1632 / 67.5) + 0.5;
          float withinTile = step(0.0, coordinates.x) * step(coordinates.x, 1.0) * step(0.0, coordinates.y) * step(coordinates.y, 1.0);
          return texture2D(motifTexture, coordinates).a * withinTile;
        }
        void main() {
          vec2 tile = fract(windowPosition / tileSize);
          float motif = max(motifAt(tile), motifAt(fract(tile + 0.5)));
          vec3 displayInk = linearToOutputTexel(vec4(windowInk, 1.0)).rgb;
          vec3 color = sRGBTransferEOTF(vec4(mix(displayInk, vec3(1.0), motif * 0.1), 1.0)).rgb;
          gl_FragColor = vec4(color, opacity);
          #include <colorspace_fragment>
        }`,
    }))
    backing.name = 'kaman-central-window-texture'
    backing.frustumCulled = false
    backing.renderOrder = 2
    const outline = new Line2(new LineGeometry().setPositions([0, 0, 0, 0, 0, 0]), lineMaterial(true))
    outline.name = 'kaman-central-window-outline'
    outline.frustumCulled = false
    outline.renderOrder = 4
    parent.add(backing, outline, elevation, dome, ...resources)
    panels.current = resources
    building.current = elevation
    roof.current = dome
    windowBacking.current = backing
    windowOutline.current = outline
    windowLayout.current = ''
    layout.current = ''
    return () => {
      panels.current = []
      building.current = null
      roof.current = null
      windowBacking.current = null
      windowOutline.current = null
      parent.remove(backing, outline, elevation, dome, ...resources)
      backing.geometry.dispose()
      backing.material.dispose()
      for (const line of [outline, elevation, dome, ...resources]) {
        line.geometry.dispose()
        line.material.dispose()
      }
    }
  }, [curves, svg, motif])

  useFrame((state) => {
    const target = vector.current
    const elevation = building.current
    const dome = roof.current
    const backing = windowBacking.current
    const centralOutline = windowOutline.current
    const parent = root.current
    if (!target || !elevation || !dome || !backing || !centralOutline || !parent) return
    if (!elevation.material.userData.trim || !dome.material.userData.trim || !centralOutline.material.userData.trim) return
    const travel = THREE.MathUtils.clamp((progress - 0.075) / (0.125 - 0.075), 0, 1)
    const buildingOpacity = architectureDetailOpacity(progress)
    const facadeReveal = THREE.MathUtils.smootherstep(entrance, 0.7, 0.98)
    const facadePresence = buildingOpacity * facadeReveal
    const gather = THREE.MathUtils.smootherstep(travel, 0.36, 0.66)
    const curl = THREE.MathUtils.smootherstep(progress, archCurlStart, archCurlEnd)
    const handoff = Number(progress >= architectureEnd)
    const opacity = reducedMotion && entrance >= 1 ? 0 : 1 - handoff
    if (opacity <= 0.001) {
      parent.scale.setScalar(1)
      parent.position.set(0, 0, 0)
      elevation.visible = false
      dome.visible = false
      backing.visible = false
      centralOutline.visible = false
      panels.current.forEach((panel) => { panel.visible = false })
      return
    }
    const { width: viewportWidth, height } = state.size
    const mobile = viewportWidth <= 650
    const facadeLineWidth = mobile ? mobileLineWidth : lineWidth
    measure.center.set(0, 1.6, 0).project(state.camera)
    measure.right.setFromMatrixColumn(state.camera.matrixWorld, 0)
    measure.point.set(0, 1.6, 0).add(measure.right).project(state.camera)
    const pixelsPerUnit = Math.abs(measure.point.x - measure.center.x) * viewportWidth / 2
    const { drawingWidth: width, ledgeOverhang, top, arcadeHeight, bandHeight, roofBase, roofWidth, fitScale, fitOffset } = architectureLayout(viewportWidth, height)
    const window = centralWindowLayout(viewportWidth, height)
    const zoomTravel = reducedMotion ? Number(entrance >= 1) : THREE.MathUtils.smootherstep(entrance, 0, 1)
    const zoom = THREE.MathUtils.lerp(window.closeZoom, fitScale, zoomTravel)
    measure.focus.set(0, 1 - (window.windowTop + window.windowHeight / 2) / height * 2, measure.center.z).unproject(state.camera)
    measure.finishFocus.set(0, 1 - ((window.windowTop + window.windowHeight / 2) * fitScale + fitOffset) / height * 2, measure.center.z).unproject(state.camera)
    measure.closeFocus.set(0, 1 - window.closeCenter / height * 2, measure.center.z).unproject(state.camera).lerp(measure.finishFocus, zoomTravel)
    parent.scale.setScalar(zoom)
    parent.position.copy(measure.closeFocus).addScaledVector(measure.focus, -zoom)
    parent.updateMatrixWorld(true)
    measure.parentInverse.copy(parent.matrixWorld).invert()
    const flatWidth = Math.min(globalThis.innerWidth * 0.78, 610, height * 0.74)
    const flatScale = flatWidth / (4 * pixelsPerUnit)
    curlPose.flatOrientation.copy(state.camera.quaternion).multiply(measure.front).multiply(curlPose.turn)
    curlPose.flatCenter.set(0, 1.6, 0).applyMatrix4(measure.parentInverse)
    const inkTravel = THREE.MathUtils.smoothstep(entrance, 0.1, 0.65)
    elevation.material.color.copy(measure.white).lerp(measure.ink, inkTravel)
    dome.material.color.copy(elevation.material.color)
    panels.current.forEach((panel) => panel.material.color.copy(elevation.material.color))
    const windowKey = `${window.windowWidth}:${window.windowHeight}`
    if (windowLayout.current !== windowKey) {
      const points = vectorArchWindowPoints(window.windowWidth, window.windowHeight)
      const shape = new THREE.Shape(points.map((point) => new THREE.Vector2(point.x, -point.y)))
      backing.geometry.dispose()
      backing.geometry = new THREE.ShapeGeometry(shape)
      centralOutline.geometry.setPositions([...points, points[0]].flatMap((point) => [point.x, -point.y, 0]))
      centralOutline.material.userData.trim.trimMaximum.value = prepareTrimPaths(centralOutline.geometry, [new THREE.Vector3(points[0].x, -points[0].y, 0), new THREE.Vector3(points[points.length - 3].x, -points[points.length - 3].y, 0)])
      windowLayout.current = windowKey
    }
    backing.position.set(0, 1 - window.windowTop / height * 2, measure.center.z).unproject(state.camera)
    backing.quaternion.copy(state.camera.quaternion)
    backing.scale.setScalar(1 / pixelsPerUnit)
    const backingOpacity = buildingOpacity * (1 - THREE.MathUtils.smootherstep(entrance, 0.68, 0.92))
    backing.visible = backingOpacity > 0.001
    backing.material.uniforms.opacity.value = backingOpacity
    backing.material.uniforms.tileSize.value = 48 / window.closeZoom
    centralOutline.position.copy(backing.position)
    centralOutline.quaternion.copy(backing.quaternion)
    centralOutline.scale.copy(backing.scale)
    centralOutline.visible = buildingOpacity > 0.001
    centralOutline.material.opacity = 1
    centralOutline.material.linewidth = THREE.MathUtils.lerp(lineWidth, facadeLineWidth, facadeReveal)
    centralOutline.material.userData.trim.trimProgress.value = 1 - buildingOpacity
    centralOutline.material.color.copy(measure.white).lerp(measure.ink, 1 - backingOpacity)
    centralOutline.material.resolution.set(viewportWidth, height)
    const arrivalOffset = 0
    const galleryTier = Math.min(94, Math.max(70, arcadeHeight * 0.36)) + 8
    const bayWidth = width / 4
    const pierSpan = mobile ? Math.min(bayWidth * 0.4, Math.max(18 / fitScale, bayWidth * 0.14)) : Math.min(38, bayWidth * 0.14)
    const bayClearWidth = bayWidth - pierSpan
    const archInset = Math.max(10, bayClearWidth * 0.1)
    const curveWidth = Math.max(...curves.map((curve) => curve.width))
    const desiredArchScale = Math.min((bayClearWidth - archInset * 2) / 1.16 / curveWidth, arcadeHeight * 0.44 / curves[0].height) / pixelsPerUnit
    const crown = top + galleryTier + 18 + curves[0].height * desiredArchScale * pixelsPerUnit * 0.16
    const archScale = Math.min(desiredArchScale, Math.max(16, top + bandHeight - 22 - crown) / curves[0].height / pixelsPerUnit)
    const archBaseline = crown + curves[0].height * archScale * pixelsPerUnit
    const floor = top + bandHeight - 12
    const columnStrokeInset = 2 / fitScale
    const key = `${width}:${height}:${pixelsPerUnit}`
    if (layout.current !== key) {
      const segments: number[] = []
      const seen = new Set<string>()
      const addSegment = (fromX: number, fromY: number, toX: number, toY: number) => {
        if (Math.hypot(toX - fromX, toY - fromY) < 0.000001) return
        const first = [Number(fromX.toFixed(6)), Number(fromY.toFixed(6))]
        const second = [Number(toX.toFixed(6)), Number(toY.toFixed(6))]
        const identity = JSON.stringify(first[0] < second[0] || first[0] === second[0] && first[1] < second[1] ? [first, second] : [second, first])
        if (seen.has(identity)) return
        seen.add(identity)
        segments.push((fromX - width / 2) / pixelsPerUnit, -fromY / pixelsPerUnit, 0, (toX - width / 2) / pixelsPerUnit, -toY / pixelsPerUnit, 0)
      }
      const segment = (fromX: number, fromY: number, toX: number, toY: number) => {
        const middle = width / 2
        if (fromX > middle && toX > middle) return
        if (fromX > middle) {
          fromY += (toY - fromY) * (middle - fromX) / (toX - fromX)
          fromX = middle
        } else if (toX > middle) {
          toY = fromY + (toY - fromY) * (middle - fromX) / (toX - fromX)
          toX = middle
        }
        addSegment(fromX, fromY, toX, toY)
        if (fromX !== middle || toX !== middle) addSegment(width - fromX, fromY, width - toX, toY)
      }
      const curveLine = (fromX: number, fromY: number, controlX: number, controlY: number, toX: number, toY: number) => {
        const points = new THREE.QuadraticBezierCurve(new THREE.Vector2(fromX, fromY), new THREE.Vector2(controlX, controlY), new THREE.Vector2(toX, toY)).getPoints(12)
        for (let sample = 0; sample < points.length - 1; sample++) segment(points[sample].x, points[sample].y, points[sample + 1].x, points[sample + 1].y)
      }
      const balcony = (center: number, balconyWidth: number, vertical: number) => {
        const half = balconyWidth / 2
        segment(center - half - 5, vertical, center + half + 5, vertical)
        segment(center - half - 5, vertical, center - half, vertical + 5)
        segment(center + half + 5, vertical, center + half, vertical + 5)
        segment(center - half, vertical + 5, center + half, vertical + 5)
        segment(center - half, vertical + 5, center - half + 5, vertical + 12)
        segment(center + half, vertical + 5, center + half - 5, vertical + 12)
        segment(center - half + 5, vertical + 12, center + half - 5, vertical + 12)
        const bracketEdge = Math.max(1, half - 5)
        for (const side of [-1, 1]) curveLine(center + side * bracketEdge * 0.8, vertical + 12, center + side * bracketEdge * 0.65, vertical + 21, center + side * bracketEdge * 0.35, vertical + 12)
      }
      const cuspedArch = (center: number, vertical: number, openingWidth: number, openingHeight: number) => {
        const points = cuspedWindowPoints(openingWidth, openingHeight)
        for (let index = 0; index < points.length; index++) {
          const from = points[index], to = points[(index + 1) % points.length]
          segment(center + from.x, vertical + from.y, center + to.x, vertical + to.y)
        }
      }
      const vectorWindow = (center: number, vertical: number, openingWidth: number, openingHeight: number) => {
        const points = vectorArchWindowPoints(openingWidth, openingHeight)
        for (let index = 0; index < points.length; index++) {
          const from = points[index], to = points[(index + 1) % points.length]
          segment(center + from.x, vertical + from.y, center + to.x, vertical + to.y)
        }
      }
      const lattice = (center: number, vertical: number, latticeWidth: number, latticeHeight: number) => {
        const columns = Math.max(3, Math.min(9, Math.floor(latticeWidth / 10)))
        const cell = latticeWidth / columns
        segment(center - latticeWidth / 2, vertical, center + latticeWidth / 2, vertical)
        segment(center - latticeWidth / 2, vertical + latticeHeight, center + latticeWidth / 2, vertical + latticeHeight)
        for (let column = 0; column < columns; column++) {
          const left = center - latticeWidth / 2 + column * cell, middle = left + cell / 2
          segment(left, vertical + latticeHeight / 2, middle, vertical)
          segment(middle, vertical, left + cell, vertical + latticeHeight / 2)
          segment(left + cell, vertical + latticeHeight / 2, middle, vertical + latticeHeight)
          segment(middle, vertical + latticeHeight, left, vertical + latticeHeight / 2)
        }
      }
      segment(-ledgeOverhang, top + 12, width + ledgeOverhang, top + 12)
      segment(-ledgeOverhang, top + 22, width + ledgeOverhang, top + 22)
      segment(-ledgeOverhang, top + 12, -ledgeOverhang, top + 22)
      segment(width + ledgeOverhang, top + 12, width + ledgeOverhang, top + 22)
      segment(0, top + galleryTier, width, top + galleryTier)
      segment(0, top + galleryTier + 6, width, top + galleryTier + 6)
      segment(0, top + 22, 0, floor + 24)
      segment(width, top + 22, width, floor + 24)
      segment(width / 2 - roofWidth * 0.42, roofBase + 2, width / 2 + roofWidth * 0.42, roofBase + 2)
      segment(width / 2 - roofWidth * 0.42, roofBase + 2, width / 2 - roofWidth * 0.53, roofBase + 11)
      segment(width / 2 + roofWidth * 0.42, roofBase + 2, width / 2 + roofWidth * 0.53, roofBase + 11)
      segment(width / 2 - roofWidth * 0.53, roofBase + 11, width / 2 + roofWidth * 0.53, roofBase + 11)
      const apex = roofBase - roofWidth / 2
      segment(width / 2, apex, width / 2, apex - 12)
      const domeBase = roofBase + 15
      const domeHalfWidth = roofWidth * 0.45
      segment(width / 2 - domeHalfWidth, domeBase, width / 2 + domeHalfWidth, domeBase)
      segment(width / 2 - domeHalfWidth, domeBase + 5, width / 2 + domeHalfWidth, domeBase + 5)
      segment(width / 2 - domeHalfWidth, domeBase, width / 2 - domeHalfWidth, domeBase + 5)
      segment(width / 2 + domeHalfWidth, domeBase, width / 2 + domeHalfWidth, domeBase + 5)
      for (const side of [-1, 1]) {
        for (const flute of [0.1, 0.23, 0.35]) {
          const rib = new THREE.CubicBezierCurve(
            new THREE.Vector2(width / 2, apex),
            new THREE.Vector2(width / 2 + side * roofWidth * flute * 0.9, apex + roofWidth * 0.15),
            new THREE.Vector2(width / 2 + side * roofWidth * flute * 1.18, roofBase - roofWidth * 0.05),
            new THREE.Vector2(width / 2 + side * roofWidth * flute, roofBase),
          ).getPoints(16)
          for (let sample = 0; sample < rib.length - 1; sample++) segment(rib[sample].x, rib[sample].y, rib[sample + 1].x, rib[sample + 1].y)
        }
      }
      const pavilionBay = domeHalfWidth * 2 / 3
      const pavilionHeight = top - domeBase - 34
      if (pavilionHeight >= 12) {
        for (const bay of [-1, 1]) vectorWindow(width / 2 + bay * pavilionBay, window.windowTop, window.windowWidth, window.windowHeight)
        for (let pillar = 0; pillar <= 3; pillar++) {
          const horizontal = width / 2 - domeHalfWidth + pillar * pavilionBay
          segment(horizontal - columnStrokeInset, domeBase + 5, horizontal - columnStrokeInset, top - 8)
          segment(horizontal + columnStrokeInset, domeBase + 5, horizontal + columnStrokeInset, top - 8)
        }
        lattice(width / 2, top - 20, domeHalfWidth * 2, 12)
      }
      balcony(width / 2, roofWidth * 1.08, top - 8)
      for (const side of [-1, 1]) {
        const support = width / 2 + side * (roofWidth * 0.54 - 5)
        segment(support, top + 4, support, top + 12)
        segment(support - side * 5, top + 4, support - side * 5, top + 12)
      }
      const archWidth = curves[0].width * archScale * pixelsPerUnit
      const towerWidth = pierSpan / 0.8
      const pillarInnerInset = towerWidth * 0.4 - (mobile ? 2.5 : 4) / fitScale
      for (const center of [width * 0.25, width * 0.75]) {
        const domeBottom = top - towerWidth * 0.28 - 20
        const domeTop = domeBottom - towerWidth * 0.57
        for (const side of [-1, 1]) {
          curveLine(center + side * towerWidth * 0.48, domeBottom, center + side * towerWidth * 0.65, domeTop + towerWidth * 0.24, center, domeTop)
          for (const rib of mobile ? [0.25] : [0.15, 0.3]) curveLine(center, domeTop, center + side * towerWidth * rib, domeTop + towerWidth * 0.1, center + side * towerWidth * rib, domeBottom)
        }
        segment(center, domeTop, center, domeTop - 9)
        segment(center - towerWidth * 0.49, domeBottom, center + towerWidth * 0.49, domeBottom)
        segment(center - towerWidth * 0.49, domeBottom, center - towerWidth * 0.6, domeBottom + 7)
        segment(center + towerWidth * 0.49, domeBottom, center + towerWidth * 0.6, domeBottom + 7)
        segment(center - towerWidth * 0.6, domeBottom + 7, center + towerWidth * 0.6, domeBottom + 7)
        for (const pillar of mobile ? [-0.32, 0.32] : [-0.32, 0, 0.32]) {
          const horizontal = center + towerWidth * pillar
          segment(horizontal - columnStrokeInset, domeBottom + 7, horizontal - columnStrokeInset, top - 2)
          segment(horizontal + columnStrokeInset, domeBottom + 7, horizontal + columnStrokeInset, top - 2)
        }
        balcony(center, towerWidth, top - 2)
        for (const side of [-1, 1]) {
          segment(center + side * pillarInnerInset, top + 22, center + side * pillarInnerInset, floor)
          segment(center + side * towerWidth * 0.4, top + 22, center + side * towerWidth * 0.4, floor)
        }
        const nicheHeight = Math.min(36, bandHeight * 0.18)
        for (const vertical of [top + 38, floor - nicheHeight - 18]) cuspedArch(center, vertical, towerWidth * 0.36, nicheHeight)
        balcony(center, towerWidth * 0.8, top + bandHeight * 0.55)
        balcony(center, towerWidth, floor)
      }
      const centerPierWidth = towerWidth
      for (const side of [-1, 1]) {
        segment(width / 2 + side * pillarInnerInset, top + 22, width / 2 + side * pillarInnerInset, floor)
        segment(width / 2 + side * centerPierWidth * 0.4, top + 22, width / 2 + side * centerPierWidth * 0.4, floor)
      }
      const centerNicheHeight = Math.min(36, bandHeight * 0.18)
      for (const vertical of [top + 38, floor - centerNicheHeight - 18]) cuspedArch(width / 2, vertical, centerPierWidth * 0.36, centerNicheHeight)
      balcony(width / 2, centerPierWidth * 0.8, top + bandHeight * 0.55)
      balcony(width / 2, centerPierWidth, floor)
      for (const edge of [pierSpan / 2, width - pierSpan / 2]) segment(edge, top + 22, edge, floor + 24)
      segment(-ledgeOverhang, floor + 24, width + ledgeOverhang, floor + 24)
      segment(-ledgeOverhang, floor + 32, width + ledgeOverhang, floor + 32)
      segment(-ledgeOverhang, floor + 24, -ledgeOverhang, floor + 32)
      segment(width + ledgeOverhang, floor + 24, width + ledgeOverhang, floor + 32)
      curves.forEach((curve, part) => {
        const center = width * (part + 0.5) / 4
        const galleryHeight = Math.max(12, Math.min(40, galleryTier - 63))
        const openings = !mobile ? [-1, 1] : [0]
        const galleryWidth = Math.min(archWidth * 0.28, width / 4 * 0.16)
        const gallerySpacing = !mobile ? archWidth * 0.3 : 0
        for (const opening of openings) {
          const horizontal = center + opening * gallerySpacing
          vectorWindow(horizontal, top + 34, galleryWidth, galleryHeight)
          lattice(horizontal, top + 34 + galleryHeight - 8, galleryWidth, 6)
        }
        const gallerySpan = galleryWidth + gallerySpacing * 2
        for (const side of [-1, 1]) segment(center + side * (gallerySpan / 2 + 5), top + 32, center + side * (gallerySpan / 2 + 5), top + 34 + galleryHeight)
        segment(center - gallerySpan / 2 - 5, top + 32, center + gallerySpan / 2 + 5, top + 32)
        balcony(center, gallerySpan + 10, top + 34 + galleryHeight)
        const halfWidth = curve.width * archScale * pixelsPerUnit / 2
        segment(center - halfWidth, archBaseline, center - halfWidth, floor)
        segment(center + halfWidth, archBaseline, center + halfWidth, floor)
        const surroundScale = archScale * pixelsPerUnit * 1.16
        const divisions = 10
        for (let division = 0; division < divisions; division++) {
          const vertices = curve.positions.length / 3 - 1
          const sample = Math.floor(vertices * division / divisions) * 3
          const next = Math.floor(vertices * (division + 1) / divisions) * 3
          measure.point.set(curve.positions[sample], 0, curve.positions[sample + 2]).applyQuaternion(curve.orientation)
          measure.end.set(curve.positions[next], 0, curve.positions[next + 2]).applyQuaternion(curve.orientation)
          measure.point.x -= curve.horizontalOffset || 0
          measure.end.x -= curve.horizontalOffset || 0
          const middleX = (measure.point.x + measure.end.x) / 2, middleY = (measure.point.z + measure.end.z) / 2
          const outward = Math.min(5, width / 4 * 0.025) / Math.max(0.001, Math.hypot(middleX, middleY))
          curveLine(center + measure.point.x * surroundScale, archBaseline + measure.point.z * surroundScale, center + middleX * (surroundScale + outward), archBaseline + middleY * (surroundScale + outward), center + measure.end.x * surroundScale, archBaseline + measure.end.z * surroundScale)
        }
        segment(center - halfWidth * 1.16, archBaseline, center - halfWidth * 1.16, floor + 24)
        segment(center + halfWidth * 1.16, archBaseline, center + halfWidth * 1.16, floor + 24)
        lattice(center, floor - 17, curve.width * archScale * pixelsPerUnit, 12)
        balcony(center, Math.min(curve.width * archScale * pixelsPerUnit + 14, width / 4 - towerWidth - 20), floor)
      })
      elevation.geometry.setPositions(segments)
      const anchors: THREE.Vector3[] = []
      curves.forEach((curve, part) => {
        const center = width * (part + 0.5) / 4
        for (const vertex of [0, curve.positions.length - 3]) {
          const point = new THREE.Vector3(curve.positions[vertex], 0, curve.positions[vertex + 2]).applyQuaternion(curve.orientation)
          anchors.push(new THREE.Vector3((center + (point.x - (curve.horizontalOffset || 0)) * archScale * pixelsPerUnit - width / 2) / pixelsPerUnit, -(archBaseline + point.z * archScale * pixelsPerUnit) / pixelsPerUnit, 0))
        }
      })
      anchors.push(new THREE.Vector3(-width / 2 / pixelsPerUnit, -(top + 12) / pixelsPerUnit, 0), new THREE.Vector3(width / 2 / pixelsPerUnit, -(top + 12) / pixelsPerUnit, 0), new THREE.Vector3(0, -apex / pixelsPerUnit, 0))
      elevation.material.userData.trim.trimMaximum.value = prepareTrimPaths(elevation.geometry, anchors, 8)
      layout.current = key
    }
    target.updateMatrixWorld(true)
    elevation.visible = facadePresence > 0.001
    elevation.position.set(0, 1 - arrivalOffset / height * 2, measure.center.z).unproject(state.camera)
    elevation.quaternion.copy(state.camera.quaternion)
    elevation.material.opacity = 1
    elevation.material.linewidth = facadeLineWidth
    elevation.material.userData.trim.trimProgress.value = 1 - facadePresence
    elevation.material.resolution.set(viewportWidth, height)
    const roofArrival = 1
    dome.visible = facadePresence > 0.001 && roofArrival > 0.001
    dome.position.set(0, 1 - (roofBase + arrivalOffset) / height * 2, measure.center.z).unproject(state.camera)
    dome.quaternion.copy(state.camera.quaternion).multiply(measure.front)
    dome.scale.setScalar(roofWidth / 4 / pixelsPerUnit)
    dome.material.opacity = 1
    dome.material.linewidth = facadeLineWidth
    dome.material.userData.trim.trimProgress.value = 1 - facadePresence
    dome.material.resolution.set(viewportWidth, height)
    panels.current.forEach((panel, part) => {
      const curve = curves[part]
      panel.visible = facadeReveal > 0.001
      measure.point.set(((part + 0.5) / 4 - 0.5) * width / viewportWidth * 2, 1 - (archBaseline + arrivalOffset) / height * 2, measure.center.z).unproject(state.camera)
      measure.point.addScaledVector(measure.right, -(curve.horizontalOffset || 0) * archScale)
      panel.position.copy(measure.point)
      measure.startOrientation.copy(state.camera.quaternion).multiply(measure.front).multiply(curve.orientation)
      panel.quaternion.copy(measure.startOrientation).slerp(curlPose.flatOrientation, curl)
      panel.scale.setScalar(THREE.MathUtils.lerp(archScale, flatScale / zoom, curl))
      panel.material.opacity = opacity * facadeReveal
      panel.material.linewidth = THREE.MathUtils.lerp(facadeLineWidth, vectorLineWidth, curl)
      panel.material.resolution.set(viewportWidth, height)
    })
    const middleEnd = panels.current[1].geometry.getAttribute('instanceEnd')
    measure.end.set(middleEnd.getX(middleEnd.count - 1), middleEnd.getY(middleEnd.count - 1), middleEnd.getZ(middleEnd.count - 1))
      .add(curves[1].pivot).multiplyScalar(flatScale / zoom).applyQuaternion(curlPose.flatOrientation).add(curlPose.flatCenter)
    measure.hinge.set(0, 1 - (archBaseline + arrivalOffset) / height * 2, measure.center.z).unproject(state.camera).lerp(measure.end, curl)
    for (const part of [1, 2, 0, 3]) {
      const panel = panels.current[part]
      if (part === 1 || part === 2) measure.joint.copy(measure.hinge)
      else {
        const neighbor = panels.current[part === 0 ? 1 : 2]
        const joint = neighbor.geometry.getAttribute(part === 0 ? 'instanceStart' : 'instanceEnd')
        const vertex = part === 0 ? 0 : joint.count - 1
        measure.joint.set(joint.getX(vertex), joint.getY(vertex), joint.getZ(vertex)).multiplyScalar(neighbor.scale.x).applyQuaternion(neighbor.quaternion)
          .add(measure.packed[part === 0 ? 1 : 2])
      }
      const endpoint = panel.geometry.getAttribute(part === 0 || part === 1 ? 'instanceEnd' : 'instanceStart')
      const vertex = part === 0 || part === 1 ? endpoint.count - 1 : 0
      measure.point.set(endpoint.getX(vertex), endpoint.getY(vertex), endpoint.getZ(vertex)).multiplyScalar(panel.scale.x).applyQuaternion(panel.quaternion)
      measure.packed[part].copy(measure.joint).sub(measure.point)
    }
    curlPose.rotation.copy(curlPose.flatOrientation).invert().premultiply(target.quaternion)
    curlPose.center.copy(target.position).applyMatrix4(measure.parentInverse)
    panels.current.forEach((panel, part) => {
      panel.position.lerp(measure.packed[part], gather)
      if (progress >= archCurlStart) {
        const scale = target.scale.x / flatScale
        panel.position.sub(curlPose.flatCenter).multiplyScalar(scale).applyQuaternion(curlPose.rotation).add(curlPose.center)
        panel.quaternion.premultiply(curlPose.rotation)
        panel.scale.multiplyScalar(scale)
      }
    })
  })

  return <group ref={root} />
}