import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ArrowDown, ArrowUp, ArrowUpRight } from 'lucide-react'
import './product.css'

const LampScene = lazy(() => import('./LampScene'))
const scrollCheckpoints = [0, 0.075, 0.98]
const finalCheckpoint = scrollCheckpoints[scrollCheckpoints.length - 1]
const openingTransitionMs = 2400
const vectorTransitionMs = 1200
const detailsTransitionMs = 650
const assetBase = import.meta.env.BASE_URL

function easeOpening(value: number) {
  return value ** 3 * (value * (value * 6 - 15) + 10)
}

function easePrinting(value: number) {
  return value * (0.8 + value * (1.4 - 1.2 * value))
}

function easeReturning(value: number) {
  return value * (1.2 + value * (0.6 - 0.8 * value))
}

const chapters = [
  { label: 'MAKING', title: <>Old arches.<br />New ways.</>, body: 'Named after Rajasthani arches, Kaman brings four identical forms together around one centre. The lamp is 3D printed in PLA, a contemporary process for an architectural form.' },
  { label: 'VIBE', title: <>Cool by day.<br />Warm by night.</>, body: 'Indigo and white, inspired by Bagru block printing. Warm light for the part of the evening you don\'t need to hurry.' },
]

function Wordmark({ onHome }: { onHome?: () => void }) {
  return <a className="wordmark" href="#home" onClick={(event) => { if (onHome) { event.preventDefault(); onHome() } }} aria-label="25.four home"><i className="wordmark-symbol" aria-hidden="true"><img src={`${assetBase}studio-mark.svg`} alt="" /></i><span>25.<b>four</b></span></a>
}

function HeroArtwork({ ready }: { ready: boolean }) {
  return (
    <div className="hero-graphic" aria-hidden="true" style={{ visibility: ready ? 'hidden' : 'visible' }}>
      <svg className="hero-motifs" viewBox="0 0 1924 1924" style={{ opacity: 0.10 }}>
        <defs>
          <pattern id="bagru-textile" width="67.5" height="67.5" patternUnits="userSpaceOnUse">
            <image href={`${assetBase}kaman-motif-white.svg`} x="8.6684" y="8.6684" width="50.1632" height="50.1632" />
            <image href={`${assetBase}kaman-motif-white.svg`} x="42.4184" y="42.4184" width="50.1632" height="50.1632" />
            <image href={`${assetBase}kaman-motif-white.svg`} x="-25.0816" y="42.4184" width="50.1632" height="50.1632" />
            <image href={`${assetBase}kaman-motif-white.svg`} x="42.4184" y="-25.0816" width="50.1632" height="50.1632" />
            <image href={`${assetBase}kaman-motif-white.svg`} x="-25.0816" y="-25.0816" width="50.1632" height="50.1632" />
          </pattern>
        </defs>
        <rect width="1924" height="1924" fill="url(#bagru-textile)" />
      </svg>
    </div>
  )
}

function App() {
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [modelReady, setModelReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [lampEnabled, setLampEnabled] = useState(true)
  const handleModelReady = useCallback(() => setModelReady(true), [])
  const checkpointNavigation = useRef<(top: number) => void>((top) => window.scrollTo({ top, behavior: 'instant' }))
  const story = useRef<HTMLElement>(null)
  const entrance = reducedMotion ? Number(progress > 0.004) : Math.min(1, progress / 0.06)
  const heroOpacity = Math.max(0, 1 - entrance / 0.3)
  const storyOpacity = Math.max(0, Math.min(1, (entrance - 0.93) / 0.07))
  const activeChapter = progress < 0.9 ? 0 : 1
  const lightOn = progress >= 0.9 && lampEnabled
  const complete = progress >= 0.9 || (reducedMotion && entrance >= 1)
  const centered = entrance >= 0.65
  const nextSectionLabel = activeChapter < chapters.length - 1 ? 'Continue to warm light' : 'View specifications'

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
    const animateTo = (destination: number) => {
      cancelAnimationFrame(motionFrame)
      clearTimeout(motionTimer)
      clearTimeout(settleTimer)
      const start = scrollY
      const target = Math.max(0, Math.min(destination, document.documentElement.scrollHeight - innerHeight))
      direction = Math.sign(target - start)
      if (reducedMotion || Math.abs(target - start) < 2) {
        window.scrollTo({ top: target, behavior: 'instant' })
        moving = false
        finishedAt = performance.now()
        return
      }
      moving = true
      motionStart = performance.now()
      const section = bounds()
      const startProgress = (start - section.origin) / section.span
      const targetProgress = (target - section.origin) / section.span
      const openingTravel = Math.max(startProgress, targetProgress) <= scrollCheckpoints[1] + 0.001
      const detailsTravel = Math.min(startProgress, targetProgress) >= finalCheckpoint - 0.001 && Math.max(startProgress, targetProgress) > 1.001
      const printingTravel = !openingTravel && targetProgress > 0.06 && Math.min(startProgress, targetProgress) < 0.84 && Math.max(startProgress, targetProgress) > 0.24 && Math.max(startProgress, targetProgress) <= 1.001
      const baseDuration = Math.max(900, Math.min(1700, Math.abs(target - start) * 0.75)) / 0.75
      const regularDuration = openingTravel ? openingTransitionMs : detailsTravel ? detailsTransitionMs : baseDuration * (printingTravel ? 2 : 1)
      const vectorTravel = printingTravel && direction > 0 && startProgress < 0.18 && targetProgress > 0.18
      const vectorTarget = section.origin + section.span * 0.18
      const vectorDuration = vectorTravel ? vectorTransitionMs * Math.min(1, (0.18 - startProgress) / (0.18 - scrollCheckpoints[1])) : 0
      const remainingDuration = vectorTravel ? regularDuration * (target - vectorTarget) / (target - start) : regularDuration
      const duration = vectorDuration + remainingDuration
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
      const advance = (now: number) => {
        const elapsedTime = now - motionStart
        const elapsed = Math.min(1, elapsedTime / duration)
        const eased = reverse ? easeReturning(elapsed) : easeTravel(elapsed)
        const position = vectorTravel
          ? elapsedTime < vectorDuration
            ? start + (vectorTarget - start) * easeOpening(elapsedTime / vectorDuration)
            : vectorTarget + (target - vectorTarget) * easePrinting(Math.min(1, (elapsedTime - vectorDuration) / remainingDuration))
          : start + (target - start) * eased
        window.scrollTo({ top: position, behavior: 'instant' })
        if (elapsed < 1) motionFrame = requestAnimationFrame(advance)
        else { moving = false; finishedAt = now }
      }
      motionFrame = requestAnimationFrame(advance)
    }
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
      setProgress(Math.min(next, finalCheckpoint))
    }
    const schedule = () => {
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
    }
  }, [modelReady, reducedMotion])

  function goToChapter(index: number) {
    if (!story.current) return
    const bounds = story.current.getBoundingClientRect()
    const position = scrollCheckpoints[index + 1]
    checkpointNavigation.current(scrollY + bounds.top + (bounds.height - innerHeight) * position)
  }

  function advanceStory() {
    if (activeChapter < chapters.length - 1) goToChapter(activeChapter + 1)
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
            <header className="site-header"><Wordmark onHome={restartPresentation} /><a className="header-link" href="#details">Shop now <ArrowUpRight size={15} /></a></header>
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
              <div className={`narrative ${activeChapter === chapters.length - 1 ? 'narrative--with-switch' : ''}`}>
                {activeChapter === chapters.length - 1 && <div className="lamp-controls"><button className="lamp-switch" type="button" role="switch" aria-label="Lamp light" aria-checked={lampEnabled} title={lampEnabled ? 'Turn lamp off' : 'Turn lamp on'} disabled={!modelReady} onClick={() => setLampEnabled((enabled) => !enabled)}><span className="lamp-switch-track" aria-hidden="true"><span className="lamp-switch-thumb" /></span></button><span className="lamp-switch-status" aria-hidden="true">{lampEnabled ? 'On' : 'Off'}</span></div>}
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
          <div className="details-content"><p>160 mm tall. 200 mm wide. Four arches, all the way around.</p><dl><div><dt>Edition</dt><dd>Bagru</dd></div><div><dt>Dimensions</dt><dd>160 (H) × 200 (W) mm</dd></div><div><dt>Material</dt><dd>Polylactic Acid (PLA)</dd></div><div><dt>Production</dt><dd>3D printed</dd></div><div><dt>Light colour</dt><dd>3000K / warm white</dd></div><div><dt>Power supply</dt><dd>220–240V AC, 50Hz</dd></div></dl><a className="return-link" href="#making" onClick={(event) => { event.preventDefault(); setLampEnabled(true); goToChapter(1) }}>See Kaman lit <ArrowUpRight size={20} /></a></div>
          </div>
        </section>
      </main>
      <footer className="site-footer"><Wordmark onHome={restartPresentation} /><span>KAMAN / THE BAGRU EDITION</span><a href="#home" onClick={(event) => { event.preventDefault(); restartPresentation() }} aria-label="Back to top" title="Back to top"><ArrowUp size={21} /></a></footer>
    </>
  )
}

export default App
