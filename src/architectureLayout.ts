export const vectorArchPath = 'M553.976 553.974C553.976 470.714 550.459 381.354 580.091 305.562C609.722 229.77 672.5 167.545 741.167 117.75C797.972 76.557 858.807 43.8707 922.067 16.4888L962.002 0L999.026 15.234C1063.31 42.8621 1125.12 75.9039 1182.8 117.722C1251.46 167.513 1314.27 229.746 1343.91 305.545C1373.55 381.344 1370.03 470.708 1370.03 553.975'

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
  const clearTop = width <= 650 ? 100 : height * 0.122 + 32
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
