export const vectorArchPath = 'M553.976 553.974C553.976 470.714 550.459 381.354 580.091 305.562C609.722 229.77 672.5 167.545 741.167 117.75C797.972 76.557 858.807 43.8707 922.067 16.4888L962.002 0L999.026 15.234C1063.31 42.8621 1125.12 75.9039 1182.8 117.722C1251.46 167.513 1314.27 229.746 1343.91 305.545C1373.55 381.344 1370.03 470.708 1370.03 553.975'
export const archCurlStart = 0.108
export const archCurlEnd = 0.14
export const vectorTiltEnd = 0.18

export function architectureDetailOpacity(progress: number) {
  const fade = Math.max(0, Math.min(1, (progress - 0.075) / ((0.125 - 0.075) * 0.3)))
  return 1 - fade ** 3 * (fade * (fade * 6 - 15) + 10)
}

export function architectureLayout(width: number, height: number) {
  const contentWidth = Math.min(960, Math.max(272, width - 48))
  const referenceWidth = 1036
  const referenceHeight = 698
  const ledgeOverhang = 10
  const drawingWidth = referenceWidth - ledgeOverhang * 2
  const top = 320
  const roofBase = top - 128
  const roofWidth = 240
  const bandHeight = referenceHeight - (top - roofBase) - roofWidth / 2 - 32
  const arcadeHeight = bandHeight - 48
  const textAnchor = height * (width <= 650 ? height <= 700 ? 0.56 : 0.63 : 0.66)
  const drawingTop = roofBase - roofWidth / 2 - 12
  const drawingBottom = top + bandHeight + 20
  const clearTop = width <= 650 ? 122 : height * 0.122 + 52
  const availableHeight = Math.max(1, textAnchor - 20 - clearTop)
  const fitScale = Math.min(contentWidth / referenceWidth, availableHeight / referenceHeight)
  const fitOffset = clearTop - drawingTop * fitScale + (availableHeight - (drawingBottom - drawingTop) * fitScale) / 2
  return { drawingWidth, ledgeOverhang, top, arcadeHeight, bandHeight, roofBase, roofWidth, fitScale, fitOffset }
}

export function centralWindowLayout(width: number, height: number) {
  const layout = architectureLayout(width, height)
  const windowWidth = layout.roofWidth * 0.216
  const windowHeight = layout.top - layout.roofBase - 49
  const windowTop = layout.roofBase + 23
  const closeZoom = Math.max(width * (width <= 650 ? 2.4 : 1.05) / windowWidth, height * 1.1 / windowHeight)
  return { windowWidth, windowHeight, windowTop, closeZoom, closeCenter: height * 0.18 + windowHeight * closeZoom / 2 }
}

type WindowPattern = { key: string; sourceHeight: number; tile: number; columns: number; rows: number; originX: number; edgeStroke: number; insetInk: string; shadowLength: number; shadowInk: string; shadowOpacity: number; maskWidth: number; maskHeight: number; mask: Uint8Array; maskUrl: string; shadowUrl: string; motifs: { x: number; y: number; size: number }[] }
let windowPattern: WindowPattern | undefined

export function centralWindowPattern(width: number, height: number, closeZoom: number) {
  const key = `${width}:${height}:${closeZoom}`
  if (windowPattern?.key === key) return windowPattern
  const sourceWidth = 1370.03 - 553.976
  const sourceHeight = height * sourceWidth / width
  const tile = 48 / closeZoom * sourceWidth / width
  const columns = Math.ceil(sourceWidth / tile / 2) * 2 + 1
  const rows = Math.ceil(sourceHeight / tile * 2)
  const originX = 962.003 - columns * tile / 2
  const edgeStroke = 48 / closeZoom * sourceWidth / width
  const shadowLength = 48 / closeZoom * sourceWidth / width
  const maskWidth = 512
  const maskHeight = Math.ceil(maskWidth * sourceHeight / sourceWidth)
  const mask = new Uint8Array(maskWidth * maskHeight * 2)
  const motifs: WindowPattern['motifs'] = []
  windowPattern = { key, sourceHeight, tile, columns, rows, originX, edgeStroke, insetInk: '#061b56', shadowLength, shadowInk: '#010b30', shadowOpacity: 0.55, maskWidth, maskHeight, mask, maskUrl: '', shadowUrl: '', motifs }
  const canvas = document.createElement('canvas')
  canvas.width = maskWidth
  canvas.height = maskHeight
  const context = canvas.getContext('2d')
  if (!context) return windowPattern
  const path = new Path2D(`${vectorArchPath}L1370.03 ${sourceHeight}L553.976 ${sourceHeight}Z`)
  const scale = maskWidth / sourceWidth
  context.setTransform(scale, 0, 0, scale, -553.976 * scale, 0)
  context.fillStyle = '#fff'
  context.fill(path)
  context.lineJoin = 'round'
  for (let layer = 48; layer >= 0; layer--) {
    const travel = layer / 48
    const shade = Math.round(travel ** 2 * (3 - 2 * travel) * 255)
    context.strokeStyle = `rgb(${shade}, ${shade}, ${shade})`
    context.lineWidth = edgeStroke + shadowLength * 2 * travel
    context.stroke(path)
  }
  const gradient = context.getImageData(0, 0, maskWidth, maskHeight).data
  context.globalCompositeOperation = 'copy'
  context.fill(path)
  context.globalCompositeOperation = 'source-over'
  context.strokeStyle = '#000'
  context.lineWidth = edgeStroke
  context.stroke(path)
  const image = context.getImageData(0, 0, maskWidth, maskHeight)
  for (let index = 0; index < maskWidth * maskHeight; index++) {
    mask[index * 2] = image.data[index * 4]
    mask[index * 2 + 1] = Math.round((1 - gradient[index * 4] / 255) * mask[index * 2])
    image.data[index * 4] = 255
    image.data[index * 4 + 1] = 255
    image.data[index * 4 + 2] = 255
    image.data[index * 4 + 3] = mask[index * 2]
  }
  context.putImageData(image, 0, 0)
  windowPattern.maskUrl = canvas.toDataURL()
  for (let index = 0; index < maskWidth * maskHeight; index++) image.data[index * 4 + 3] = mask[index * 2 + 1]
  context.putImageData(image, 0, 0)
  windowPattern.shadowUrl = canvas.toDataURL()
  const size = tile * 50.1632 / 67.5
  for (let row = 0; row < rows; row++) {
    const vertical = (row * 0.5 + 0.5) * tile
    for (let column = 0; column < columns; column++) {
      const horizontal = originX + (column + 0.5 + (row % 2) * 0.5) * tile
      motifs.push({ x: horizontal - size / 2, y: vertical - size / 2, size })
    }
  }
  return windowPattern
}
