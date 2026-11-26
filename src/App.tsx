import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ArrowDown, ArrowUp, ArrowUpRight } from 'lucide-react'
import './product.css'
import { archCurlEnd, archCurlStart, architectureDetailOpacity, centralWindowLayout, vectorArchPath, vectorTiltEnd } from './architectureLayout'

const LampScene = lazy(() => import('./LampScene'))
const scrollCheckpoints = [0, 0.075, 0.98]
const finalCheckpoint = scrollCheckpoints[scrollCheckpoints.length - 1]
const openingTransitionMs = 2400
const architectureTransitionMs = 4000
const movingArchTransitionMs = 2400
const archGatherTransitionMs = 929
const archCurlTransitionMs = movingArchTransitionMs - archGatherTransitionMs
const architectureGatherSpeed = architectureTransitionMs * (archCurlStart - 0.093) / (0.125 - scrollCheckpoints[1]) / archGatherTransitionMs
const rimMorphTransitionMs = 80
const detailsTransitionMs = 650
const toggleGrowMs = 180
const toggleOnDelayMs = 40
const toggleSwitchMs = 120
const toggleOffMs = toggleSwitchMs + 20
const toggleShrinkMs = 140
const assetBase = import.meta.env.BASE_URL
type TogglePhase = 'hidden' | 'growing' | 'ready' | 'turning-off' | 'shrinking'

function easeOpening(value: number) {
  return value ** 3 * (value * (value * 6 - 15) + 10)
}

function easePrinting(value: number) {
  return value * (0.8 + value * (1.4 - 1.2 * value))
}

function easeReturning(value: number) {
  return value * (1.2 + value * (0.6 - 0.8 * value))
}

function returningTimeFor(distance: number) {
  let lower = 0
  let upper = 1
  for (let sample = 0; sample < 28; sample++) {
    const middle = (lower + upper) / 2
    if (easeReturning(middle) < distance) lower = middle
    else upper = middle
  }
  return (lower + upper) / 2
}

const chapters = [
  { label: 'MAKING', title: <>Old arches.<br />New ways.</>, body: 'Named after Rajasthani arches, the lamp brings four identical forms together around one centre. The lamp is 3D printed in PLA, a contemporary process for an architectural form.' },
  { label: 'VIBE', title: <>Cool by day.<br />Warm by night.</>, body: 'Indigo and white, inspired by Bagru block printing, give the lamp its quiet daytime character. By night, warm light glows through the shade, bringing a softer rhythm to the room.' },
]

function Wordmark({ onHome }: { onHome?: () => void }) {
  return <a className="wordmark" href="#home" onClick={(event) => { if (onHome) { event.preventDefault(); onHome() } }} aria-label="25.four home"><i className="wordmark-symbol" aria-hidden="true"><img src={`${assetBase}studio-mark.svg`} alt="" /></i><span>25.<b>four</b></span></a>
}

function HeroArtwork({ ready }: { ready: boolean }) {
  const opening = centralWindowLayout(window.innerWidth, window.innerHeight)
  const sourceHeight = opening.windowHeight * (1370.03 - 553.976) / opening.windowWidth
  const path = `${vectorArchPath}L1370.03 ${sourceHeight}L553.976 ${sourceHeight}Z`
  const tile = 48 / opening.closeZoom * (1370.03 - 553.976) / opening.windowWidth
  return (
    <div className="hero-graphic" aria-hidden="true" style={{ visibility: ready ? 'hidden' : 'visible', top: '18%', width: opening.windowWidth * opening.closeZoom, height: opening.windowHeight * opening.closeZoom, aspectRatio: 'auto', background: 'none' }}>
      <svg className="hero-motifs" viewBox={`553.976 0 ${1370.03 - 553.976} ${sourceHeight}`} style={{ mask: 'none' }}>
        <defs>
          <pattern id="bagru-textile" width={tile} height={tile} patternUnits="userSpaceOnUse">
            <image href={`${assetBase}kaman-motif-white.svg`} x={tile * 8.6684 / 67.5} y={tile * 8.6684 / 67.5} width={tile * 50.1632 / 67.5} height={tile * 50.1632 / 67.5} />
            <image href={`${assetBase}kaman-motif-white.svg`} x={tile * 42.4184 / 67.5} y={tile * 42.4184 / 67.5} width={tile * 50.1632 / 67.5} height={tile * 50.1632 / 67.5} />
            <image href={`${assetBase}kaman-motif-white.svg`} x={tile * -25.0816 / 67.5} y={tile * 42.4184 / 67.5} width={tile * 50.1632 / 67.5} height={tile * 50.1632 / 67.5} />
            <image href={`${assetBase}kaman-motif-white.svg`} x={tile * 42.4184 / 67.5} y={tile * -25.0816 / 67.5} width={tile * 50.1632 / 67.5} height={tile * 50.1632 / 67.5} />
            <image href={`${assetBase}kaman-motif-white.svg`} x={tile * -25.0816 / 67.5} y={tile * -25.0816 / 67.5} width={tile * 50.1632 / 67.5} height={tile * 50.1632 / 67.5} />
          </pattern>
        </defs>
        <path d={path} fill="#02144c" />
        <path d={path} fill="url(#bagru-textile)" opacity="0.1" />
      </svg>
    </div>
  )
}

function App() {
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [modelReady, setModelReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeChapter, setActiveChapter] = useState(0)
  const [lampEnabled, setLampEnabled] = useState(false)
  const [togglePhase, setTogglePhase] = useState<TogglePhase>('hidden')
  const togglePhaseRef = useRef<TogglePhase>('hidden')
  const toggleExit = useRef<() => void>(() => {})
  const handleModelReady = useCallback(() => setModelReady(true), [])
  const checkpointNavigation = useRef<(top: number) => void>((top) => window.scrollTo({ top, behavior: 'instant' }))
  const story = useRef<HTMLElement>(null)
  const entrance = reducedMotion ? Number(progress > 0.004) : Math.min(1, progress / scrollCheckpoints[1])
  const heroOpacity = Math.max(0, 1 - entrance / 0.3)
  const storyOpacity = Math.max(0, Math.min(1, (entrance - 0.93) / 0.07))
  const showLampControls = progress >= 0.9
  const lightOn = progress >= 0.9 && lampEnabled
  const complete = progress >= 0.9 || (reducedMotion && entrance >= 1)
  const centered = entrance >= 0.65
  const nextSectionLabel = showLampControls ? 'View specifications' : 'Continue to warm light'

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(preference.matches)
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    let frame = 0
    let motionFrame = 0
    let motionTimer = 0
    let settleTimer = 0
    let lightTimer = 0
    let exitingControls = false
    let exitDestination = 0
    let moving = false
    let direction = 0
    let motionStart = 0
    let lastWheel = 0
    let finishedAt = 0
    let wheelDistance = 0
    let touchStart = 0
    let touchHorizontal = 0
    let touchHandled = false
    let touchEligible = false
    let touchCaptured = false
    let touchAtDetails = false
    const bounds = () => {
      const section = story.current!
      const origin = section.getBoundingClientRect().top + scrollY
      const span = section.offsetHeight - innerHeight
      return { origin, span, end: origin + span, positions: [...scrollCheckpoints.map((value) => origin + span * value), origin + section.offsetHeight] }
    }
    const inside = () => { const section = bounds(); return scrollY >= section.origin - 2 && scrollY <= section.end + 2 }
    const changeTogglePhase = (phase: TogglePhase) => {
      togglePhaseRef.current = phase
      setTogglePhase(phase)
    }
    const hideControls = () => {
      clearTimeout(lightTimer)
      lightTimer = 0
      setLampEnabled(false)
      changeTogglePhase('hidden')
    }
    const revealControls = () => {
      clearTimeout(lightTimer)
      setLampEnabled(false)
      changeTogglePhase('growing')
      const activate = () => {
        lightTimer = 0
        setLampEnabled(true)
        changeTogglePhase('ready')
        setActiveChapter(1)
      }
      if (reducedMotion) activate()
      else lightTimer = window.setTimeout(activate, toggleGrowMs + toggleOnDelayMs)
    }
    const updateProgress = (next: number) => {
      setProgress(Math.min(Math.max(0, next), finalCheckpoint))
      if (next < 0.9) {
        exitingControls = false
        if (togglePhaseRef.current !== 'hidden') hideControls()
      } else if (modelReady && !exitingControls && (togglePhaseRef.current === 'hidden' || togglePhaseRef.current === 'turning-off' || togglePhaseRef.current === 'shrinking' || togglePhaseRef.current === 'growing' && !lightTimer)) revealControls()
      setActiveChapter((current) => reducedMotion ? Number(next >= 0.9) : architectureDetailOpacity(next) > 0.001 ? 0 : current)
    }
    const animateTo = (destination: number) => {
      const section = bounds()
      const target = Math.max(0, Math.min(destination, document.documentElement.scrollHeight - innerHeight))
      const targetProgress = (target - section.origin) / section.span
      if (exitingControls && !reducedMotion && targetProgress < 0.9 && (togglePhaseRef.current === 'turning-off' || togglePhaseRef.current === 'shrinking')) {
        exitDestination = target
        return
      }
      cancelAnimationFrame(motionFrame)
      clearTimeout(motionTimer)
      clearTimeout(settleTimer)
      const start = scrollY
      const startProgress = (start - section.origin) / section.span
      direction = Math.sign(target - start)
      if (targetProgress >= 0.9) {
        exitingControls = false
        if (togglePhaseRef.current === 'turning-off' || togglePhaseRef.current === 'shrinking') {
          clearTimeout(lightTimer)
          lightTimer = 0
          updateProgress(startProgress)
        }
      }
      if (reducedMotion || Math.abs(target - start) < 2) {
        window.scrollTo({ top: target, behavior: 'instant' })
        updateProgress(targetProgress)
        moving = false
        finishedAt = performance.now()
        return
      }
      moving = true
      motionStart = performance.now()
      if (startProgress >= 0.9 && targetProgress < 0.9 && togglePhaseRef.current !== 'hidden') {
        exitingControls = true
        exitDestination = target
        clearTimeout(lightTimer)
        setLampEnabled(false)
        changeTogglePhase('turning-off')
        if (document.activeElement instanceof HTMLElement && document.activeElement.closest('.lamp-controls')) document.activeElement.blur()
        lightTimer = window.setTimeout(() => {
          lightTimer = 0
          changeTogglePhase('shrinking')
        }, toggleOffMs)
        motionTimer = window.setTimeout(finishControlsExit, toggleOffMs + toggleShrinkMs + 100)
        return
      }
      const openingTravel = Math.max(startProgress, targetProgress) <= scrollCheckpoints[1] + 0.001
      const detailsTravel = Math.min(startProgress, targetProgress) >= finalCheckpoint - 0.001 && Math.max(startProgress, targetProgress) > 1.001
      const printingTravel = !openingTravel && targetProgress > 0.06 && Math.min(startProgress, targetProgress) < 0.84 && Math.max(startProgress, targetProgress) > 0.24 && Math.max(startProgress, targetProgress) <= 1.001
      const baseDuration = Math.max(900, Math.min(1700, Math.abs(target - start) * 0.75)) / 0.75
      const regularDuration = openingTravel ? openingTransitionMs : detailsTravel ? detailsTransitionMs : baseDuration * (printingTravel ? 2 : 1)
      const vectorTravel = printingTravel && direction > 0 && startProgress < 0.18 && targetProgress > 0.18
      const architectureTravel = vectorTravel && startProgress < archCurlStart
      const architectureTarget = section.origin + section.span * archCurlStart
      const architectureOriginalDuration = architectureTravel ? architectureTransitionMs * Math.max(0, archCurlStart - startProgress) / (0.125 - scrollCheckpoints[1]) : 0
      const gatherLeadDuration = architectureTravel ? architectureTransitionMs * Math.max(0, 0.093 - startProgress) / (0.125 - scrollCheckpoints[1]) : 0
      const architectureDuration = gatherLeadDuration + (architectureOriginalDuration - gatherLeadDuration) / architectureGatherSpeed
      const curlTarget = section.origin + section.span * archCurlEnd
      const curlDuration = vectorTravel ? archCurlTransitionMs * Math.max(0, Math.min(1, (archCurlEnd - Math.max(startProgress, archCurlStart)) / (archCurlEnd - archCurlStart))) : 0
      const vectorTarget = section.origin + section.span * vectorTiltEnd
      const profileDuration = vectorTravel ? rimMorphTransitionMs * Math.max(0, Math.min(1, (vectorTiltEnd - Math.max(startProgress, archCurlEnd)) / (vectorTiltEnd - archCurlEnd))) : 0
      const vectorDuration = curlDuration + profileDuration
      const remainingDuration = vectorTravel ? regularDuration * (target - vectorTarget) / (target - start) : regularDuration
      const duration = architectureDuration + vectorDuration + remainingDuration
      if (detailsTravel) {
        window.scrollTo({ top: target, behavior: 'smooth' })
        motionTimer = window.setTimeout(() => {
          moving = false
          finishedAt = performance.now()
        }, detailsTransitionMs)
        return
      }
      const easeTravel = openingTravel ? easeOpening : printingTravel ? easePrinting : (value: number) => value * value * (3 - 2 * value)
      const reverse = target < start
      const reverseArches = reverse && !openingTravel && startProgress > 0.093 && targetProgress < archCurlEnd
      const archEntry = section.origin + section.span * Math.min(startProgress, archCurlEnd)
      const archExit = section.origin + section.span * Math.max(targetProgress, 0.093)
      const archStartTime = reverseArches ? returningTimeFor((start - archEntry) / (start - target)) * duration : 0
      const archEndTime = reverseArches ? returningTimeFor((start - archExit) / (start - target)) * duration : 0
      const archTime = archEndTime - archStartTime
      const reverseArchDuration = reverseArches ? Math.max(archTime * 2, movingArchTransitionMs * (archEntry - archExit) / (section.span * (archCurlEnd - 0.093))) : 0
      const extraArchTime = reverseArchDuration - archTime
      const advance = (now: number) => {
        const elapsedTime = now - motionStart
        let sourceTime = elapsedTime
        if (reverseArches && elapsedTime > archStartTime) {
          const travel = Math.min(1, (elapsedTime - archStartTime) / reverseArchDuration)
          sourceTime = elapsedTime < archEndTime + extraArchTime
            ? archStartTime + archTime * travel
            : elapsedTime - extraArchTime
        }
        const elapsed = Math.min(1, sourceTime / duration)
        const eased = reverse ? easeReturning(elapsed) : easeTravel(elapsed)
        const position = vectorTravel
          ? elapsedTime < architectureDuration
            ? start + (architectureTarget - start) * ((elapsedTime <= gatherLeadDuration ? elapsedTime : gatherLeadDuration + (elapsedTime - gatherLeadDuration) * architectureGatherSpeed) / architectureOriginalDuration)
            : elapsedTime < architectureDuration + curlDuration
              ? (architectureTravel ? architectureTarget : start) + (curlTarget - (architectureTravel ? architectureTarget : start)) * ((elapsedTime - architectureDuration) / curlDuration)
              : elapsedTime < architectureDuration + vectorDuration
                ? Math.max(start, curlTarget) + (vectorTarget - Math.max(start, curlTarget)) * ((elapsedTime - architectureDuration - curlDuration) / profileDuration)
                : vectorTarget + (target - vectorTarget) * easePrinting(Math.min(1, (elapsedTime - architectureDuration - vectorDuration) / remainingDuration))
          : start + (target - start) * eased
        window.scrollTo({ top: position, behavior: 'instant' })
        updateProgress((position - section.origin) / section.span)
        if (elapsed < 1) motionFrame = requestAnimationFrame(advance)
        else { moving = false; finishedAt = now }
      }
      motionFrame = requestAnimationFrame(advance)
    }
    function finishControlsExit() {
      if (togglePhaseRef.current !== 'shrinking') return
      clearTimeout(motionTimer)
      changeTogglePhase('hidden')
      animateTo(exitDestination)
    }
    toggleExit.current = finishControlsExit
    checkpointNavigation.current = animateTo
    const step = (nextDirection: number) => {
      const positions = bounds().positions
      const target = nextDirection > 0 ? positions.find((position) => position > scrollY + 3) : positions.findLast((position) => position < scrollY - 3)
      if (target !== undefined) animateTo(target)
    }
    const measure = () => {
      frame = 0
      if (!story.current) return
      const section = bounds()
      const next = Math.max(0, Math.min(1, (scrollY - section.origin) / section.span))
      updateProgress(next)
    }
    const schedule = () => {
      if (moving) return
      if (!frame) frame = requestAnimationFrame(measure)
      clearTimeout(settleTimer)
      settleTimer = window.setTimeout(() => {
        if (moving || !inside()) return
        const target = bounds().positions.reduce((closest, position) => Math.abs(position - scrollY) < Math.abs(closest - scrollY) ? position : closest)
        if (Math.abs(target - scrollY) > 3) animateTo(target)
      }, 180)
    }
    const wheel = (event: WheelEvent) => {
      if (!modelReady || event.ctrlKey || Math.abs(event.deltaY) < 0.5 || Math.abs(event.deltaX) > Math.abs(event.deltaY) || (!inside() && !moving)) return
      if (event.target instanceof HTMLElement && event.target.closest('dialog,input,textarea,select,[contenteditable="true"]')) return
      event.preventDefault()
      const now = performance.now()
      const gap = now - lastWheel
      lastWheel = now
      const nextDirection = Math.sign(event.deltaY)
      if (moving) {
        if (nextDirection !== direction && Math.abs(event.deltaY) >= 12 && now - motionStart > 180) step(nextDirection)
        return
      }
      if (gap < 140 && now - finishedAt < 220 && Math.abs(event.deltaY) < 48) return
      wheelDistance = gap > 180 ? event.deltaY : wheelDistance + event.deltaY
      if (Math.abs(wheelDistance) >= 12) { step(Math.sign(wheelDistance)); wheelDistance = 0 }
    }
    const startTouch = (event: TouchEvent) => {
      touchStart = event.touches[0]?.clientY ?? 0
      touchHorizontal = event.touches[0]?.clientX ?? 0
      const section = bounds()
      touchAtDetails = Math.abs(scrollY - section.positions[section.positions.length - 1]) <= 2
      touchEligible = modelReady && event.touches.length === 1 && (inside() || moving || touchAtDetails)
      touchCaptured = false
      touchHandled = moving || performance.now() - finishedAt < 220
    }
    const moveTouch = (event: TouchEvent) => {
      if (!touchEligible || event.touches.length !== 1) return
      const vertical = touchStart - event.touches[0].clientY
      if (!touchCaptured) {
        if (Math.abs(event.touches[0].clientX - touchHorizontal) > Math.abs(vertical)) return
        if (touchAtDetails && !moving && vertical > 0) return
        if (Math.abs(vertical) <= 24) return
        touchCaptured = true
      }
      event.preventDefault()
      if (!touchHandled && Math.abs(vertical) > 24) { touchHandled = true; step(Math.sign(vertical)) }
    }
    const endTouch = () => { touchEligible = false; touchCaptured = false; touchHandled = false }
    const keyboard = (event: KeyboardEvent) => {
      if (!modelReady || (!inside() && !moving) || event.ctrlKey || event.metaKey || event.altKey) return
      if (event.target instanceof HTMLElement && event.target.closest('button,a,input,textarea,select,[contenteditable="true"]')) return
      if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(event.key)) return
      event.preventDefault()
      if (event.key === 'Home') animateTo(0)
      else if (event.key === 'End') animateTo(document.documentElement.scrollHeight - innerHeight)
      else step(['ArrowUp', 'PageUp'].includes(event.key) || event.key === ' ' && event.shiftKey ? -1 : 1)
    }
    addEventListener('scroll', schedule, { passive: true })
    addEventListener('resize', schedule)
    addEventListener('wheel', wheel, { passive: false })
    addEventListener('touchstart', startTouch, { passive: true })
    addEventListener('touchmove', moveTouch, { passive: false })
    addEventListener('touchend', endTouch, { passive: true })
    addEventListener('touchcancel', endTouch, { passive: true })
    addEventListener('keydown', keyboard)
    measure()
    return () => {
      removeEventListener('scroll', schedule)
      removeEventListener('resize', schedule)
      removeEventListener('wheel', wheel)
      removeEventListener('touchstart', startTouch)
      removeEventListener('touchmove', moveTouch)
      removeEventListener('touchend', endTouch)
      removeEventListener('touchcancel', endTouch)
      removeEventListener('keydown', keyboard)
      cancelAnimationFrame(frame)
      cancelAnimationFrame(motionFrame)
      clearTimeout(motionTimer)
      clearTimeout(settleTimer)
      clearTimeout(lightTimer)
    }
  }, [modelReady, reducedMotion])

  function goToChapter(index: number) {
    if (!story.current) return
    const bounds = story.current.getBoundingClientRect()
    const position = scrollCheckpoints[index + 1]
    checkpointNavigation.current(scrollY + bounds.top + (bounds.height - innerHeight) * position)
  }

  function advanceStory() {
    if (!showLampControls) goToChapter(1)
    else if (story.current) checkpointNavigation.current(scrollY + story.current.getBoundingClientRect().bottom)
  }

  function restartPresentation() {
    checkpointNavigation.current(0)
  }

  return (
    <>
      <a className="skip-link" href="#details">Skip to specifications</a>
      <main>
        <section className="experience" id="home" ref={story} data-guided={modelReady} aria-label="Kaman, the Bagru edition">
          <div className="experience-sticky" data-chapter={activeChapter + 1} data-presentation={entrance.toFixed(4)} data-view={entrance >= 0.99 ? 'story' : 'opening'} data-complete={complete} data-centered={centered} data-lit={lightOn} style={{ '--entrance': entrance } as CSSProperties}>
            <header className="site-header"><Wordmark onHome={restartPresentation} /><a className="header-link" href="#details">Shop now <ArrowUpRight size={18} /></a></header>
            <section className="landing" aria-labelledby="product-title" inert={entrance > 0.6} style={{ visibility: entrance < 1 ? 'visible' : 'hidden' }}>
              <HeroArtwork ready={modelReady} />
              <div className="hero-type" style={{ opacity: heroOpacity }}>
                <div className="hero-lockup">
                  <p className="hero-poem"><span>Rooted in Rajasthan.</span><span>Arches. Indigo. Warmth.</span></p>
                  <h1 className="product-title" id="product-title"><span>KAMAN</span><strong>BAGRU</strong></h1>
                </div>
                <div className="landing-bottom"><a className="discover-link" href="#making" title="Discover Kaman" aria-label="Discover Kaman" onClick={(event) => { event.preventDefault(); goToChapter(0) }}><ArrowDown size={22} /></a></div>
              </div>
            </section>
            <section className="story-presentation" id="making" aria-label="The story of Kaman" inert={entrance < 0.6} style={{ opacity: storyOpacity, visibility: storyOpacity > 0 ? 'visible' : 'hidden' }}>
              <div className={`narrative ${showLampControls ? 'narrative--with-switch' : ''}`}>
                <div className="lamp-controls" data-phase={togglePhase} inert={togglePhase !== 'ready'} style={{ '--toggle-grow': `${toggleGrowMs}ms`, '--toggle-shrink': `${toggleShrinkMs}ms`, '--toggle-switch': `${toggleSwitchMs}ms` } as CSSProperties}><button className="lamp-switch" type="button" role="switch" aria-label="Lamp light" aria-checked={lightOn} title={lightOn ? 'Turn lamp off' : 'Turn lamp on'} disabled={!modelReady} onClick={() => { if (togglePhase === 'ready') setLampEnabled((enabled) => !enabled) }} onTransitionEnd={(event) => { if (event.target === event.currentTarget && event.propertyName === 'transform' && togglePhase === 'shrinking') toggleExit.current() }}><span className="lamp-switch-track" aria-hidden="true"><span className="lamp-switch-thumb" /></span></button></div>
                <div className="chapter-label"><span>0{activeChapter + 1}</span><span>{chapters[activeChapter].label}</span></div>
                <div className="chapter-copy" key={activeChapter}>
                  <h2>{chapters[activeChapter].title}</h2>
                  <p>{chapters[activeChapter].body}</p>
                </div>
                <nav className="chapter-nav" aria-label="Continue the product story"><button type="button" onClick={advanceStory} aria-label={nextSectionLabel} title={nextSectionLabel}><ArrowDown size={22} /></button></nav>
              </div>
            </section>
            <div className={`model-stage ${lightOn ? 'is-lit' : ''}`} role="img" aria-label={`Kaman Bagru table lamp, ${complete ? 'fully formed' : 'forming layer by layer'}, light ${lightOn ? 'on' : 'off'}`}>
              <Suspense fallback={null}><LampScene progress={Math.min(progress, finalCheckpoint)} entrance={entrance} lightOn={lightOn} reducedMotion={reducedMotion} onReady={handleModelReady} /></Suspense>
            </div>
          </div>
        </section>

        <section className="details-section" id="details" aria-labelledby="details-title">
          <div className="details-inner">
          <div className="details-heading"><span className="eyebrow">SPECIFICATIONS / 25F-KAM-01</span><h2 id="details-title">The finer<br />print.</h2><div className="technical-drawing"><img src={`${assetBase}lamp-drawing.svg`} alt="Kaman table lamp, in outline" /></div></div>
          <div className="details-content"><p>160 mm tall. 200 mm wide. Four arches, all the way around.</p><dl><div><dt>Edition</dt><dd>Bagru</dd></div><div><dt>Dimensions</dt><dd>160 (H) × 200 (W) mm</dd></div><div><dt>Material</dt><dd>Polylactic Acid (PLA)</dd></div><div><dt>Production</dt><dd>3D printed</dd></div><div><dt>Light colour</dt><dd>3000K / warm white</dd></div><div><dt>Power supply</dt><dd>220–240V AC, 50Hz</dd></div></dl></div>
          </div>
        </section>
      </main>
      <footer className="site-footer"><Wordmark onHome={restartPresentation} /><span>LAMP / KAMAN BAGRU</span><a href="#home" onClick={(event) => { event.preventDefault(); restartPresentation() }} aria-label="Back to top" title="Back to top"><ArrowUp size={21} /></a></footer>
    </>
  )
}

export default App
