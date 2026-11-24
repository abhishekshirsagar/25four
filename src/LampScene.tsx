import { Component, memo, Suspense, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import type { SVGResult } from 'three/addons/loaders/SVGLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { Line2 } from 'three/addons/lines/Line2.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import lampUrl from '../Full lamp.stl?url'

export type LampSceneProps = {
  progress: number
  entrance?: number
  lightOn: boolean
  reducedMotion: boolean
  onReady?: () => void
}

const modelHeight = 3.2
const shadeStart = 1.55
const internalColumnRadius = 0.9
const internalColumnTop = 1.9
const normalizedModels = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>()
const rimOutlines = new WeakMap<THREE.BufferGeometry, THREE.Vector3[]>()
const filamentProfiles = new WeakMap<THREE.BufferGeometry, Float32Array>()
const baseColor = new THREE.Color('#02144c')
const shadeColor = new THREE.Color('#f6f5f0')
const warmColor = new THREE.Color('#ffbf75')
const lampStartRotation = Math.PI - 0.24
const assetBase = import.meta.env.BASE_URL

function assemblyMotion(progress: number, reducedMotion: boolean) {
  if (reducedMotion) return { base: 1, shade: 1 }
  const drop = THREE.MathUtils.smootherstep(progress, 0.7, 0.78)
  return { base: drop, shade: drop }
}

function formation(progress: number, reducedMotion: boolean) {
  return {
    shade: reducedMotion ? 1 : THREE.MathUtils.smoothstep(progress, 0.18, 0.68),
    base: assemblyMotion(progress, reducedMotion).base,
  }
}

function printMotion(progress: number, reducedMotion: boolean) {
  const movement = reducedMotion ? 0 : Math.sin(THREE.MathUtils.smoothstep(progress, 0.18, 0.72) * Math.PI)
  return { rotationY: (reducedMotion ? 1 : THREE.MathUtils.smoothstep(progress, 0.18, 0.68)) * Math.PI, zoom: 1 + movement * 0.08 }
}

function shadePose(progress: number, reducedMotion: boolean, width: number) {
  const focus = reducedMotion ? 0 : THREE.MathUtils.smootherstep(progress, 0.24, 0.48) * (1 - assemblyMotion(progress, false).shade)
  const scale = 1 + focus * (width <= 650 ? 0.12 : 0.48)
  return { scale, offsetY: (shadeStart + modelHeight) / 2 * (1 - scale) - focus * 0.28 }
}

function baseHeight(progress: number, reducedMotion: boolean, width: number) {
  const shade = shadePose(0.7, reducedMotion, width)
  return (shadeStart * shade.scale + shade.offsetY) * (1 - formation(progress, reducedMotion).base)
}

function graphicRotation(camera: THREE.Quaternion, tilt: number, rotation: THREE.Euler) {
  rotation.setFromQuaternion(camera, 'YXZ')
  return rotation.set(
    THREE.MathUtils.lerp(rotation.x + Math.PI / 2, 0, tilt),
    THREE.MathUtils.lerp(rotation.y, lampStartRotation - Math.PI, tilt),
    0, 'YXZ')
}

function normalizedGeometry(source: THREE.BufferGeometry) {
  const cached = normalizedModels.get(source)
  if (cached) return cached
  if (source.userData.kamanNormalized) return source

  source.computeBoundingBox()
  const bounds = source.boundingBox!
  const center = bounds.getCenter(new THREE.Vector3())
  const scale = modelHeight / (bounds.max.z - bounds.min.z)
  const geometry = source
  geometry.translate(-center.x, -center.y, -bounds.min.z)
  geometry.rotateX(-Math.PI / 2)
  geometry.scale(scale, scale, scale)
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  geometry.userData.kamanNormalized = true
  normalizedModels.set(source, geometry)
  return geometry
}

function rimGeometry(geometry: THREE.BufferGeometry) {
  const cached = rimOutlines.get(geometry)
  if (cached) return cached
  const segments = 360
  const radii = new Float32Array(segments)
  const positions = geometry.getAttribute('position')
  for (let vertex = 0; vertex < positions.count; vertex++) {
    const height = positions.getY(vertex)
    if (height < shadeStart) continue
    const horizontal = positions.getX(vertex)
    const depth = positions.getZ(vertex)
    const angle = (Math.atan2(depth, horizontal) + Math.PI * 2) % (Math.PI * 2)
    const segment = Math.floor(angle / (Math.PI * 2) * segments)
    const radius = Math.hypot(horizontal, depth)
    if (radius > radii[segment]) {
      radii[segment] = radius
    }
  }
  const radiusAt = (segment: number) => {
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
  const perimeter = Array.from({ length: segments }, (_, segment) => {
    let radius = 0
    let weightSum = 0
    for (let neighbor = -4; neighbor <= 4; neighbor++) {
      const weight = 5 - Math.abs(neighbor)
      radius += radiusAt(segment + neighbor) * weight
      weightSum += weight
    }
    radius /= weightSum
    const angle = (segment + 0.5) / segments * Math.PI * 2
    return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
  })
  rimOutlines.set(geometry, perimeter)
  return perimeter
}

function graphicGeometry(svg: SVGResult, model: THREE.BufferGeometry) {
  const shape = svg.paths.flatMap((path) => SVGLoader.createShapes(path))[0]
  const perimeter = shape.getSpacedPoints(720).slice(0, 720)
  const rim = rimGeometry(model)
  const positions = [0, 0, 0]
  const targetPositions = [0, 0, 0]
  const radii = [0]
  const coordinates = [0.5, 0.5]
  const indices: number[] = []
  for (let index = 0; index < perimeter.length; index++) {
    const point = perimeter[index]
    const horizontal = (point.x - 962) / 481
    const depth = (point.y - 962) / 481
    const angle = (Math.atan2(depth, horizontal) + Math.PI * 2) % (Math.PI * 2)
    const segment = angle / (Math.PI * 2) * rim.length
    const before = rim[Math.floor(segment) % rim.length]
    const after = rim[(Math.floor(segment) + 1) % rim.length]
    const radius = THREE.MathUtils.lerp(Math.hypot(before.x, before.z), Math.hypot(after.x, after.z), segment % 1)
    positions.push(horizontal, 0, depth)
    targetPositions.push(Math.cos(angle - Math.PI / 4) * radius, 0, Math.sin(angle - Math.PI / 4) * radius)
    radii.push(1)
    coordinates.push(point.x / 1924, point.y / 1924)
    indices.push(0, index + 1, (index + 1) % perimeter.length + 1)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('rimPosition', new THREE.Float32BufferAttribute(targetPositions, 3))
  geometry.setAttribute('edgeRadius', new THREE.Float32BufferAttribute(radii, 1))
  geometry.setAttribute('graphicUv', new THREE.Float32BufferAttribute(coordinates, 2))
  geometry.setIndex(indices)
  geometry.computeBoundingSphere()
  return geometry
}

function createGraphicMaterial(pattern: THREE.Texture) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      graphicEntrance: { value: 0 },
      graphicTilt: { value: 0 },
      graphicOpacity: { value: 1 },
      graphicInk: { value: new THREE.Color('#02144c') },
      motifTexture: { value: pattern },
    },
    vertexShader: `
      attribute vec3 rimPosition;
      attribute float edgeRadius;
      attribute vec2 graphicUv;
      uniform float graphicTilt;
      varying float vEdgeRadius;
      varying vec2 vGraphicUv;
      void main() {
        vEdgeRadius = edgeRadius;
        vGraphicUv = graphicUv;
        vec3 surface = mix(position, rimPosition, graphicTilt);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(surface, 1.0);
      }`,
    fragmentShader: `
      uniform float graphicEntrance;
      uniform float graphicOpacity;
      uniform vec3 graphicInk;
      uniform sampler2D motifTexture;
      varying float vEdgeRadius;
      varying vec2 vGraphicUv;
      float motifAt(vec2 tile) {
        vec2 motifUv = (tile - 0.5) / (50.1632 / 67.5) + 0.5;
        float withinTile = step(0.0, motifUv.x) * step(motifUv.x, 1.0) * step(0.0, motifUv.y) * step(motifUv.y, 1.0);
        return texture2D(motifTexture, motifUv).a * withinTile;
      }
      void main() {
        float edgeWidth = max(fwidth(vEdgeRadius) * 2.2, 0.00001);
        float outline = smoothstep(1.0 - edgeWidth, 1.0 - edgeWidth * 0.35, vEdgeRadius);
        float fill = 1.0 - smoothstep(0.48, 0.94, graphicEntrance);
        vec2 tile = fract(vGraphicUv * (1924.0 / 67.5));
        float motif = max(motifAt(tile), motifAt(fract(tile + 0.5))) * 0.10 * fill;
        vec3 displayInk = linearToOutputTexel(vec4(graphicInk, 1.0)).rgb;
        vec3 motifInk = mix(displayInk, vec3(1.0), motif);
        vec3 ink = sRGBTransferEOTF(vec4(motifInk, 1.0)).rgb;
        gl_FragColor = vec4(ink, max(outline, fill) * graphicOpacity);
        #include <colorspace_fragment>
      }`,
  })
}

function createPrintMaterial() {
  const uniforms = {
    printHeight: { value: -0.02 },
    printReveal: { value: 0 },
    baseReveal: { value: 0 },
    baseHeight: { value: shadeStart },
    shadeScale: { value: 1 },
    shadeOffsetY: { value: 0 },
    lampLight: { value: 0 },
    lampBase: { value: baseColor },
    lampShade: { value: shadeColor },
    lampWarm: { value: warmColor },
  }
  const material = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.64,
    metalness: 0,
    side: THREE.DoubleSide,
    forceSinglePass: true,
  })
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLampPosition;\nuniform float baseHeight;\nuniform float shadeScale;\nuniform float shadeOffsetY;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vLampPosition = position;
        if (position.y < ${shadeStart}) {
          transformed /= shadeScale;
          transformed.y += (baseHeight - shadeOffsetY) / shadeScale;
        }`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vLampPosition;
        uniform float printHeight;
        uniform float printReveal;
        uniform float baseReveal;
        uniform float baseHeight;
        uniform float shadeScale;
        uniform float shadeOffsetY;
        uniform float lampLight;
        uniform vec3 lampBase;
        uniform vec3 lampShade;
        uniform vec3 lampWarm;`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        if (vLampPosition.y >= ${shadeStart}) {
          if (baseReveal < 0.999 && vLampPosition.y < ${internalColumnTop} && length(vLampPosition.xz) < ${internalColumnRadius}) discard;
          if (printReveal < 0.001 || vLampPosition.y > printHeight) discard;
        } else {
          if (baseReveal < 0.001 || vLampPosition.y + baseHeight >= ${shadeStart} * shadeScale + shadeOffsetY) discard;
        }
        float shadeMask = smoothstep(${shadeStart - 0.025}, ${shadeStart + 0.025}, vLampPosition.y);
        float layerWave = 0.5 + 0.5 * cos(vLampPosition.y * 523.5988);
        float layerTint = mix(0.974, 1.0, layerWave);
        float printEdge = (1.0 - smoothstep(0.002, 0.022, printHeight - vLampPosition.y))
          * step(0.001, printReveal) * (1.0 - step(0.999, printReveal));`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 porcelain = mix(lampShade, lampWarm, lampLight * 0.12);
        diffuseColor.rgb *= mix(lampBase, porcelain, shadeMask) * layerTint;`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(0.48, 0.68, shadeMask);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float distanceFromBulb = length((vLampPosition - vec3(0.0, 2.05, 0.0)) * vec3(1.0, 0.7, 1.0));
        float transmittedLight = exp(-distanceFromBulb * 1.05);
        vec3 transmittedColor = mix(vec3(1.0, 0.43, 0.12), vec3(1.0, 0.93, 0.75), transmittedLight);
        totalEmissiveRadiance += transmittedColor * lampLight * shadeMask * (0.16 + transmittedLight * transmittedLight * 6.8);
        totalEmissiveRadiance += lampWarm * printEdge * 0.12;`)
      .replace('#include <opaque_fragment>', `
        vec3 glowingSurface = outgoingLight / (vec3(1.0) + outgoingLight * 0.60);
        outgoingLight = mix(outgoingLight, glowingSurface, lampLight * shadeMask);
        #include <opaque_fragment>`)
  }
  material.customProgramCacheKey = () => '25four-assembly-v11'

  const depthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    side: THREE.DoubleSide,
  })
  depthMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.printHeight = uniforms.printHeight
    shader.uniforms.printReveal = uniforms.printReveal
    shader.uniforms.baseReveal = uniforms.baseReveal
    shader.uniforms.baseHeight = uniforms.baseHeight
    shader.uniforms.shadeScale = uniforms.shadeScale
    shader.uniforms.shadeOffsetY = uniforms.shadeOffsetY
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vPrintY;\nvarying float vPrintRadius;\nuniform float baseHeight;\nuniform float shadeScale;\nuniform float shadeOffsetY;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vPrintY = position.y;
        vPrintRadius = length(position.xz);
        if (position.y < ${shadeStart}) {
          transformed /= shadeScale;
          transformed.y += (baseHeight - shadeOffsetY) / shadeScale;
        }`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vPrintY;\nvarying float vPrintRadius;\nuniform float printHeight;\nuniform float printReveal;\nuniform float baseReveal;\nuniform float baseHeight;\nuniform float shadeScale;\nuniform float shadeOffsetY;')
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        if (vPrintY >= ${shadeStart}) {
          if (baseReveal < 0.999 && vPrintY < ${internalColumnTop} && vPrintRadius < ${internalColumnRadius}) discard;
          if (printReveal < 0.001 || vPrintY > printHeight) discard;
        } else {
          if (baseReveal < 0.001 || vPrintY + baseHeight >= ${shadeStart} * shadeScale + shadeOffsetY) discard;
        }`)
  }
  depthMaterial.customProgramCacheKey = () => '25four-assembly-depth-v10'
  return { material, depthMaterial, uniforms }
}

function filamentProfile(geometry: THREE.BufferGeometry) {
  const cached = filamentProfiles.get(geometry)
  if (cached) return cached
  const levels = 80
  const angles = 180
  const profile = new Float32Array(levels * angles)
  const positions = geometry.getAttribute('position')
  for (let vertex = 0; vertex < positions.count; vertex++) {
    const horizontal = positions.getX(vertex)
    const depth = positions.getZ(vertex)
    const level = Math.min(levels - 1, Math.max(0, Math.floor(positions.getY(vertex) / modelHeight * levels)))
    const angle = Math.floor(((Math.atan2(depth, horizontal) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * angles)
    const index = level * angles + angle
    profile[index] = Math.max(profile[index], Math.hypot(horizontal, depth))
  }
  const filled = profile.slice()
  for (let level = 0; level < levels; level++) {
    for (let angle = 0; angle < angles; angle++) {
      let radius = 0
      for (let quarter = 0; quarter < 4; quarter++) radius = Math.max(radius, profile[level * angles + (angle + quarter * angles / 4) % angles])
      if (!radius) {
        for (let distance = 1; distance < levels; distance++) {
          const below = profile[Math.max(0, level - distance) * angles + angle]
          const above = profile[Math.min(levels - 1, level + distance) * angles + angle]
          if (below || above) { radius = below && above ? (below + above) / 2 : below || above; break }
        }
      }
      filled[level * angles + angle] = radius || 0.3
    }
  }
  filamentProfiles.set(geometry, filled)
  return filled
}

function Filament({ geometry, printing, reducedMotion, progress }: {
  geometry: THREE.BufferGeometry
  printing: RefObject<ReturnType<typeof createPrintMaterial> | null>
  reducedMotion: boolean
  progress: number
}) {
  const root = useRef<THREE.Group>(null)
  const strand = useRef<Line2>(null)
  const tip = useRef<THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>>(null)
  const profile = filamentProfile(geometry)
  const [points] = useState(() => Array.from({ length: 97 }, () => new THREE.Vector3()))
  useLayoutEffect(() => {
    if (!root.current) return
    const lineGeometry = new LineGeometry()
    lineGeometry.setPositions(new Float32Array(points.length * 3))
    const material = new LineMaterial({ color: '#ffffff', linewidth: 2.4, transparent: true, opacity: 0.9 })
    const line = new Line2(lineGeometry, material)
    line.frustumCulled = false
    root.current.add(line)
    strand.current = line
    const owner = root.current
    return () => { owner.remove(line); strand.current = null; lineGeometry.dispose(); material.dispose() }
  }, [points])
  useFrame((state) => {
    if (!root.current || !strand.current || !printing.current) return
    const uniforms = printing.current.uniforms
    const reveal = uniforms.printReveal.value
    root.current.visible = !reducedMotion && progress > 0.18 && formation(progress, false).base < 0.001 && reveal > 0.003
    if (!root.current.visible) return
    strand.current.material.color.set('#ffffff')
    const height = Math.min(modelHeight - 0.01, uniforms.printHeight.value)
    const level = Math.max(0, Math.min(79, height / modelHeight * 79))
    const lower = Math.floor(level)
    const upper = Math.min(79, lower + 1)
    const radiusAt = (angle: number) => {
      const position = ((angle / (Math.PI * 2) % 1 + 1) % 1) * 180
      const before = Math.floor(position)
      const after = (before + 1) % 180
      const sample = (layer: number) => THREE.MathUtils.lerp(profile[layer * 180 + before], profile[layer * 180 + after], position - before)
      return THREE.MathUtils.lerp(sample(lower), sample(upper), level - lower) + 0.012
    }
    const headAngle = reveal * Math.PI * 44 + state.clock.elapsedTime * 1.8
    for (let segment = 0; segment <= 64; segment++) {
      const fraction = segment / 64
      const angle = headAngle - (1 - fraction) * 0.95
      const radius = radiusAt(angle)
      points[segment].set(Math.cos(angle) * radius, height + 0.008 - (1 - fraction) * 0.008, Math.sin(angle) * radius)
    }
    const head = points[64]
    if (tip.current) {
      tip.current.position.copy(head)
      tip.current.material.color.set('#ffffff')
    }
    for (let segment = 65; segment < points.length; segment++) {
      const fraction = (segment - 64) / 32
      const feedHeight = reveal >= 0.995 ? 0.25 : 0.5
      points[segment].set(head.x + 0.14 * Math.sin(fraction * Math.PI / 2), head.y + fraction * feedHeight, head.z - 0.09 * fraction)
    }
    const start = strand.current.geometry.getAttribute('instanceStart')
    const end = strand.current.geometry.getAttribute('instanceEnd')
    for (let segment = 0; segment < points.length - 1; segment++) {
      start.setXYZ(segment, points[segment].x, points[segment].y, points[segment].z)
      end.setXYZ(segment, points[segment + 1].x, points[segment + 1].y, points[segment + 1].z)
    }
    start.needsUpdate = true
    end.needsUpdate = true
    strand.current.material.resolution.set(state.size.width, state.size.height)
  })
  return <group ref={root} visible={false}>
    <mesh ref={tip}>
      <sphereGeometry args={[0.022, 12, 8]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  </group>
}

function StudioCamera({ progress, reducedMotion }: Pick<LampSceneProps, 'progress' | 'reducedMotion'>) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return
    const mobile = size.width <= 650
    const aspect = Math.min(size.width, 960) * (mobile ? 0.92 : 0.56) / Math.max(1, size.height * (mobile ? 0.44 : 0.77))
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2)
    const distance = Math.max(3.6, 4.5 / aspect) / (2 * Math.tan(halfFov)) * 1.12 / (mobile ? 0.44 : 0.77)
    camera.position.set(distance * 0.23, 1.5 + distance * 0.18, distance * 0.957)
    camera.lookAt(0, 1.5, 0)
    camera.setViewOffset(size.width, size.height, 0, size.height * 0.10, size.width, size.height)
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height])
  useFrame((state) => {
    const activeCamera = state.camera
    if (!(activeCamera instanceof THREE.PerspectiveCamera)) return
    const mobile = state.size.width <= 650
    const compact = mobile && state.size.height <= 700
    const zoom = printMotion(progress, reducedMotion).zoom * (compact ? 1.05 : mobile ? 1.15 : 1.28)
    activeCamera.zoom = zoom
    activeCamera.setViewOffset(state.size.width, state.size.height,
      0, state.size.height * (compact ? 0.15 : 0.10),
      state.size.width, state.size.height)
  })
  return null
}

function StudioLights({ lightOn, reducedMotion }: Pick<LampSceneProps, 'lightOn' | 'reducedMotion'>) {
  const hemisphere = useRef<THREE.HemisphereLight>(null)
  const key = useRef<THREE.DirectionalLight>(null)
  const fill = useRef<THREE.DirectionalLight>(null)
  const rim = useRef<THREE.DirectionalLight>(null)
  useFrame((_, frameDelta) => {
    const delta = Math.min(frameDelta, 0.1)
    for (const [light, target] of [[hemisphere.current, lightOn ? 0.55 : 1.5], [key.current, lightOn ? 1.05 : 3], [fill.current, lightOn ? 0.45 : 1.8], [rim.current, lightOn ? 0.9 : 2.5]] as const) {
      if (light) light.intensity = reducedMotion ? target : THREE.MathUtils.damp(light.intensity, target, 4, delta)
    }
  })
  return <>
    <hemisphereLight ref={hemisphere} args={['#fffaf1', '#c4ccd9', 1.5]} />
    <directionalLight ref={key} position={[-1.8, 9, 3.5]} color="#fff7e8" intensity={3} castShadow
      shadow-mapSize={[512, 512]} shadow-camera-left={-4} shadow-camera-right={4}
      shadow-camera-top={5} shadow-camera-bottom={-3} shadow-camera-near={0.5}
            shadow-camera-far={18} shadow-bias={-0.0002} shadow-normalBias={0.015} shadow-radius={7} shadow-blurSamples={12} />
    <directionalLight ref={fill} position={[4, 3, 2]} color="#dce7ff" intensity={1.8} />
    <directionalLight ref={rim} position={[1, 5, -4]} color="#ffffff" intensity={2.5} />
  </>
}

function LampBloom() {
  const { gl, scene, camera, size } = useThree()
  const composer = useRef<EffectComposer>(null)
  const [background] = useState(() => new THREE.Color('#ffffff'))
  useLayoutEffect(() => {
    const previousColor = gl.getClearColor(new THREE.Color())
    const previousAlpha = gl.getClearAlpha()
    const previousToneMapping = gl.toneMapping
    gl.setClearColor('#ffffff', 1)
    Object.assign(gl, { toneMapping: THREE.NoToneMapping })
    const effects = new EffectComposer(gl)
    const backdrop = new ShaderPass({
      uniforms: { backgroundColor: { value: background } },
      vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: 'uniform vec3 backgroundColor; void main() { gl_FragColor = vec4(backgroundColor, 1.0); }',
    })
    backdrop.uniforms.backgroundColor.value = background
    backdrop.clear = true
    backdrop.material.depthWrite = false
    backdrop.material.depthTest = false
    const renderScene = new RenderPass(scene, camera)
    renderScene.clear = false
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.45, 1.05)
    const output = new OutputPass()
    effects.addPass(backdrop)
    effects.addPass(renderScene)
    effects.addPass(bloom)
    effects.addPass(output)
    effects.setPixelRatio(gl.getPixelRatio())
    composer.current = effects
    return () => {
      composer.current = null
      effects.dispose()
      backdrop.dispose()
      bloom.dispose()
      output.dispose()
      gl.setClearColor(previousColor, previousAlpha)
      Object.assign(gl, { toneMapping: previousToneMapping })
    }
  }, [gl, scene, camera, background])
  useLayoutEffect(() => { composer.current?.setSize(size.width, size.height) }, [size.width, size.height])
  useFrame((state, delta) => {
    state.gl.setClearColor(background, 1)
    if (composer.current) composer.current.render(delta)
    else state.gl.render(state.scene, state.camera)
  }, 1)
  return null
}

function PrintedLamp({ progress, entrance = 1, lightOn, reducedMotion, onReady }: LampSceneProps) {
  const getScene = useThree((state) => state.get)
  const source = useLoader(STLLoader, lampUrl)
  const svg = useLoader(SVGLoader, `${assetBase}kaman-hero-solid.svg`)
  const motif = useLoader(THREE.TextureLoader, `${assetBase}kaman-motif-white.svg`)
  const geometry = normalizedGeometry(source)
  const [surfaceGeometry] = useState(() => graphicGeometry(svg, geometry))
  const group = useRef<THREE.Group>(null)
  const mesh = useRef<THREE.Mesh>(null)
  const outline = useRef<THREE.Group>(null)
  const surface = useRef<THREE.Mesh>(null)
  const outlineMaterial = useRef<THREE.ShaderMaterial>(null)
  const pointLight = useRef<THREE.PointLight>(null)
  const spillLight = useRef<THREE.PointLight>(null)
  const printing = useRef<ReturnType<typeof createPrintMaterial> | null>(null)
  const warmup = useRef<Promise<unknown> | null>(null)
  const [shadersReady, setShadersReady] = useState(false)
  const [warmupError, setWarmupError] = useState<unknown>(null)
  const notifyReady = useEffectEvent(() => onReady?.())
  const reveal = formation(progress, reducedMotion)
  const [pose] = useState(() => ({
    center: new THREE.Vector3(0, shadeStart, 0),
    projected: new THREE.Vector3(),
    measure: new THREE.Vector3(),
    right: new THREE.Vector3(),
    offset: new THREE.Vector3(),
    orientation: new THREE.Euler(0, 0, 0, 'YXZ'),
    turn: new THREE.Quaternion(),
    upright: new THREE.Vector3(0, 1, 0),
  }))

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      const state = getScene()
      const compilation = state.gl.compileAsync(state.scene, state.camera)
      warmup.current = compilation
      compilation.then(() => {
        if (cancelled) return
        setShadersReady(true)
        notifyReady()
      }, (error: unknown) => { if (!cancelled) setWarmupError(error) })
    }, 0)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [getScene, geometry])

  useFrame((state) => {
    if (!printing.current) return
    const { uniforms } = printing.current
    const shade = shadePose(progress, reducedMotion, state.size.width)
    uniforms.printReveal.value = reveal.shade
    uniforms.baseReveal.value = reveal.base
    uniforms.baseHeight.value = baseHeight(progress, reducedMotion, state.size.width)
    uniforms.shadeScale.value = shade.scale
    uniforms.shadeOffsetY.value = shade.offsetY
    uniforms.printHeight.value = THREE.MathUtils.lerp(shadeStart, modelHeight + 0.02, uniforms.printReveal.value)
    uniforms.lampLight.value = Number(lightOn)
    if (group.current) {
      group.current.scale.setScalar(shade.scale)
      group.current.position.y = shade.offsetY
      group.current.rotation.z = 0
      const rotation = lampStartRotation + printMotion(progress, reducedMotion).rotationY
      group.current.rotation.y = rotation
    }
    if (mesh.current) mesh.current.visible = shadersReady && entrance >= 0.999 && (reducedMotion || progress > 0.18)
    if (outline.current && outlineMaterial.current) {
      const tilt = reducedMotion ? Number(entrance >= 1) : THREE.MathUtils.smootherstep(progress, 0.06, 0.18)
      pose.projected.copy(pose.center).project(state.camera)
      pose.right.setFromMatrixColumn(state.camera.matrixWorld, 0)
      pose.measure.copy(pose.center).add(pose.right).project(state.camera)
      const pixelsPerUnit = Math.abs(pose.measure.x - pose.projected.x) * state.size.width / 2
      const startWidth = Math.max(window.innerWidth * 1.05, state.size.height * 1.10)
      const startHorizontal = 0.5
      const startVertical = state.size.width <= 650 ? 1 : 0.18 + startWidth / state.size.height / 2
      const startScale = startWidth / (4 * pixelsPerUnit)
      pose.offset.set(startHorizontal * 2 - 1, 1 - startVertical * 2, pose.projected.z).unproject(state.camera).sub(pose.center)
      outline.current.position.copy(pose.center).addScaledVector(pose.offset, 1 - entrance)
      outline.current.position.y += Math.sin(tilt * Math.PI) * 0.08
      const flatWidth = Math.min(window.innerWidth * 0.56, 500)
      const flatScale = flatWidth / (4 * pixelsPerUnit)
      const scale = THREE.MathUtils.lerp(startScale, THREE.MathUtils.lerp(flatScale, 1, tilt), entrance)
      outline.current.scale.setScalar(scale)
      outline.current.quaternion.setFromEuler(graphicRotation(state.camera.quaternion, tilt, pose.orientation))
      pose.turn.setFromAxisAngle(pose.upright, Math.PI / 4 * THREE.MathUtils.smootherstep(entrance, 0.08, 0.9))
      outline.current.quaternion.multiply(pose.turn)
      if (!reducedMotion && progress >= 0.18) {
        const shade = shadePose(progress, false, state.size.width)
        outline.current.position.set(0, shadeStart * shade.scale + shade.offsetY, 0)
        outline.current.scale.setScalar(shade.scale)
        outline.current.quaternion.setFromAxisAngle(pose.upright, lampStartRotation + printMotion(progress, false).rotationY + Math.PI / 4)
      }
      const graphic = outlineMaterial.current.uniforms
      const handoff = !shadersReady ? 0 : reducedMotion ? Number(entrance >= 1) : THREE.MathUtils.smoothstep(reveal.shade, 0.015, 0.12)
      graphic.graphicEntrance.value = entrance
      graphic.graphicTilt.value = tilt
      graphic.graphicOpacity.value = 1 - handoff
      graphic.graphicInk.value.copy(baseColor).lerp(shadeColor, handoff)
      outline.current.visible = graphic.graphicOpacity.value > 0.001 && !(reducedMotion && entrance >= 1)
    }
    if (pointLight.current) pointLight.current.intensity = uniforms.lampLight.value * 7
    if (spillLight.current) spillLight.current.intensity = uniforms.lampLight.value * 9
  })

  useLayoutEffect(() => {
    if (!mesh.current || !surface.current) return
    const resources = createPrintMaterial()
    const graphic = createGraphicMaterial(motif)
    mesh.current.material = resources.material
    mesh.current.customDepthMaterial = resources.depthMaterial
    surface.current.material = graphic
    outlineMaterial.current = graphic
    printing.current = resources
    return () => {
      printing.current = null
      const release = () => {
        resources.material.dispose()
        resources.depthMaterial.dispose()
        graphic.dispose()
      }
      if (warmup.current) void warmup.current.then(release, release)
      else release()
      outlineMaterial.current = null
    }
  }, [motif])

  if (warmupError) throw warmupError

  return (
    <>
      <group ref={outline} position={[0, shadeStart, 0]}>
        <mesh ref={surface} geometry={surfaceGeometry} dispose={null} renderOrder={2} />
      </group>
      <group ref={group} rotation={[0, lampStartRotation, 0]}>
        <mesh ref={mesh} geometry={geometry} visible={false} castShadow receiveShadow dispose={null} />
        <Filament geometry={geometry} printing={printing} reducedMotion={reducedMotion} progress={progress} />
        <mesh position={[0, 2.05, 0]} visible={lightOn && entrance >= 1}>
          <sphereGeometry args={[0.13, 24, 16]} />
          <meshStandardMaterial color="#fff5da" emissive="#fff0c4" emissiveIntensity={1.8} />
        </mesh>
        <pointLight ref={pointLight} position={[0, 2.05, 0]} color="#ffca8a" intensity={0} distance={6} decay={2} />
        <pointLight ref={spillLight} position={[0, 1.35, 0.2]} color="#ffd5a1" intensity={0} distance={5} decay={2} />
      </group>
    </>
  )
}

function Ground({ progress, reducedMotion, lightOn }: Pick<LampSceneProps, 'progress' | 'reducedMotion' | 'lightOn'>) {
  const base = formation(progress, reducedMotion).base
  const presence = reducedMotion ? 1 : THREE.MathUtils.smootherstep(progress, 0.6, 0.7)
  const contact = presence * (0.25 + 0.75 * base)
  const spread = 1.45 - 0.45 * base
  const illumination = useRef<THREE.ShaderMaterial>(null)
  const [lightUniforms] = useState(() => ({ lampLight: { value: 0 } }))
  const [shadowViewport] = useState(() => new THREE.Vector2())
  useFrame((state) => {
    shadowViewport.set(state.size.width * state.gl.getPixelRatio(), state.size.height * state.gl.getPixelRatio())
    if (!illumination.current) return
    const light = illumination.current.uniforms.lampLight
    light.value = Number(lightOn)
  })
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial transparent opacity={0.12 * base * base} depthWrite={false} onBeforeCompile={(shader) => {
          shader.uniforms.shadowViewport = { value: shadowViewport }
          shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec2 shadowViewport;')
            .replace('#include <tonemapping_fragment>', 'vec2 shadowEdge = gl_FragCoord.xy / max(shadowViewport, vec2(1.0));\ngl_FragColor.a *= smoothstep(0.0, 0.12, shadowEdge.x) * smoothstep(0.0, 0.12, 1.0 - shadowEdge.x);\n#include <tonemapping_fragment>')
        }} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, 0]}>
        <planeGeometry args={[8, 8]} />
        <shaderMaterial ref={illumination} transparent depthWrite={false} uniforms={lightUniforms}
          vertexShader="varying vec2 vLightUv; void main() { vLightUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
          fragmentShader="varying vec2 vLightUv; uniform float lampLight; void main() { vec2 distanceFromLamp = (vLightUv - 0.5) * vec2(1.0, 1.15); float pool = exp(-dot(distanceFromLamp, distanceFromLamp) * 14.0); float edge = max(abs(vLightUv.x - 0.5), abs(vLightUv.y - 0.5)); pool *= 1.0 - smoothstep(0.32, 0.49, edge); vec3 warmth = mix(vec3(1.0, 0.62, 0.25), vec3(1.0, 0.88, 0.68), pool); gl_FragColor = vec4(warmth, pool * lampLight * 0.55); }" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} scale={[spread, spread, 1]}>
        <planeGeometry args={[3.5, 3.5]} />
        <shaderMaterial transparent depthWrite={false}
          uniforms={{ contactOpacity: { value: contact } }}
          vertexShader="varying vec2 vGroundUv; void main() { vGroundUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
          fragmentShader="varying vec2 vGroundUv; uniform float contactOpacity; void main() { float radius = length((vGroundUv - 0.5) * 2.0); float shadow = exp(-radius * radius * 9.0) * (1.0 - smoothstep(0.65, 1.0, radius)); gl_FragColor = vec4(0.06, 0.075, 0.11, shadow * 0.2 * contactOpacity); }" />
      </mesh>
    </group>
  )
}

class PreviewBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}

function PreviewFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: '9% 0 38%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#fff' }}>
      <svg viewBox="0 0 240 240" width="200" height="200" role="img" aria-label="Kaman table lamp with a white shade and indigo base">
        <ellipse cx="120" cy="221" rx="60" ry="7" fill="#06164f" opacity="0.08" />
        <path d="M108 127 L132 127 L153 211 Q120 228 87 211 Z" fill="#06164f" />
        <path d="M106 35 Q120 29 134 35 Q150 90 207 131 Q174 149 151 139 Q120 153 89 139 Q66 149 33 131 Q90 90 106 35Z" fill="#f2f1eb" stroke="#deded8" />
        <ellipse cx="120" cy="35" rx="14" ry="4" fill="#e6e5dd" />
      </svg>
      <p role="status" style={{ margin: 0, color: '#59616b', fontSize: 13 }}>The 3D view couldn't load.</p>
      <button type="button" onClick={onRetry} style={{ border: '1px solid #d5d9df', borderRadius: 4, padding: '8px 12px', background: '#fff', color: '#06164f', font: 'inherit', fontSize: 13, cursor: 'pointer' }}>Try 3D again</button>
    </div>
  )
}

function supportsWebGL() {
  if (typeof document === 'undefined') return false
  try {
    const context = document.createElement('canvas').getContext('webgl2')
    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

function SceneFrames({ active, ready, progress, entrance, lightOn, reducedMotion }: LampSceneProps & { active: boolean; ready: boolean }) {
  const invalidate = useThree((state) => state.invalidate)
  const renderer = useThree((state) => state.gl)
  const previousFrame = useRef({ progress: NaN, entrance: NaN, ready: false, width: 0, height: 0 })
  useFrame((state) => {
    const previous = previousFrame.current
    if (previous.progress === progress && previous.entrance === entrance && previous.ready === ready && previous.width === state.size.width && previous.height === state.size.height) return
    previousFrame.current = { progress, entrance: entrance ?? 1, ready, width: state.size.width, height: state.size.height }
    Object.assign(state.gl.shadowMap, { needsUpdate: true })
  })
  useEffect(() => {
    const previous = renderer.shadowMap.autoUpdate
    Object.assign(renderer.shadowMap, { autoUpdate: false })
    return () => { Object.assign(renderer.shadowMap, { autoUpdate: previous }) }
  }, [renderer])
  useEffect(() => {
    if (!active) return
    const looping = !reducedMotion && progress > 0.18 && formation(progress, false).base < 0.001
    const settleUntil = performance.now() + (reducedMotion ? 0 : 1400)
    let timer = 0
    const draw = () => {
      invalidate()
      if (looping || performance.now() < settleUntil) timer = window.setTimeout(draw, 1000 / (looping ? 24 : 30))
    }
    draw()
    return () => clearTimeout(timer)
  }, [active, ready, progress, entrance, lightOn, reducedMotion, renderer, invalidate])
  return null
}

export default memo(function LampScene({ progress, entrance = 1, lightOn, reducedMotion, onReady }: LampSceneProps) {
  const container = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(() => !document.hidden)
  const [ready, setReady] = useState(false)
  const [webglAvailable, setWebglAvailable] = useState(supportsWebGL)
  const [unavailable, setUnavailable] = useState(!webglAvailable)
  const [attempt, setAttempt] = useState(0)
  const notified = useRef(false)
  const safeProgress = Number.isFinite(progress) ? THREE.MathUtils.clamp(progress, 0, 1) : 0

  useEffect(() => {
    if (!container.current) return
    let visible = true
    const update = () => setActive(visible && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update() })
    observer.observe(container.current)
    document.addEventListener('visibilitychange', update)
    update()
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update) }
  }, [])

  useEffect(() => {
    if (!ready || notified.current || !onReady) return
    notified.current = true
    onReady()
  }, [ready, onReady])

  return (
    <div ref={container} data-lamp-progress={safeProgress.toFixed(4)} data-lamp-loaded={ready}
      data-render-active={active}
      data-outline-owner="single-svg-surface" data-entrance={entrance.toFixed(4)}
      data-graphic-fill={(1 - THREE.MathUtils.smoothstep(entrance, 0.48, 0.94)).toFixed(4)}
      data-lamp-state={unavailable ? 'unavailable' : ready ? 'ready' : 'loading'}
      data-lamp-reveal={formation(safeProgress, reducedMotion).shade.toFixed(4)}
      data-shade-reveal={formation(safeProgress, reducedMotion).shade.toFixed(4)}
      data-base-reveal={formation(safeProgress, reducedMotion).base.toFixed(4)}
      data-base-height={baseHeight(safeProgress, reducedMotion, window.innerWidth).toFixed(4)}
      data-print-rotation={printMotion(safeProgress, reducedMotion).rotationY.toFixed(4)}
      data-print-axis="upright"
      data-filament-active={!reducedMotion && safeProgress > 0.18 && formation(safeProgress, false).base < 0.001}
      data-print-zoom={printMotion(safeProgress, reducedMotion).zoom.toFixed(4)}
      data-lamp-light={lightOn ? 'on' : 'off'}
      style={{ position: 'relative', width: '100%', height: '100%', minHeight: 200 }}>
      {webglAvailable && <PreviewBoundary key={attempt} onError={() => setUnavailable(true)}>
        <Canvas aria-hidden="true" frameloop={active ? 'demand' : 'never'} resize={{ scroll: false }} shadows={{ type: THREE.VSMShadowMap }} dpr={[1, 1.25]}
          style={{ position: 'absolute', top: 0, left: '50%', width: '100vw', height: '100%', transform: 'translateX(-50%)' }}
          camera={{ position: [2, 3, 8], fov: 32, near: 0.1, far: 80 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0)
            gl.domElement.setAttribute('aria-hidden', 'true')
            gl.domElement.addEventListener('webglcontextlost', (event) => {
              event.preventDefault()
              setUnavailable(true)
            }, { once: true })
          }}>
          <StudioCamera progress={safeProgress} reducedMotion={reducedMotion} />
          <SceneFrames active={active} ready={ready} progress={safeProgress} entrance={entrance} lightOn={lightOn} reducedMotion={reducedMotion} />
          <StudioLights lightOn={lightOn} reducedMotion={reducedMotion} />
          <Suspense fallback={null}>
            <PrintedLamp progress={safeProgress} entrance={entrance} lightOn={lightOn} reducedMotion={reducedMotion} onReady={() => setReady(true)} />
          </Suspense>
          <Ground progress={safeProgress} reducedMotion={reducedMotion} lightOn={lightOn} />
          {lightOn && <LampBloom />}
        </Canvas>
      </PreviewBoundary>}
      {unavailable && <PreviewFallback onRetry={() => {
        const supported = supportsWebGL()
        useLoader.clear(STLLoader, lampUrl)
        setReady(false)
        setUnavailable(!supported)
        setWebglAvailable(supported)
        notified.current = false
        setAttempt((value) => value + 1)
      }} />}
      {!ready && !unavailable && <div role="status" style={{ position: 'absolute', left: 0, right: 0, bottom: '12%', textAlign: 'center', color: '#747b84', fontSize: 12, pointerEvents: 'none' }}>Loading 3D model...</div>}
    </div>
  )
})