# Kaman / Bagru Experience

## Sources And Direction
- [x] Inspect supplied Figma landing, motif, typefaces, packaging, and specifications.
- [x] Download the original Figma vectors locally; use Unbounded, Space Grotesk, and Platypi.
- [x] Replace the previous paper/graphite/red direction with white and Figma indigo #02144C.
- [x] Use the supplied Full lamp.stl rather than an approximate procedural lamp.
- [x] Remove speculative finishes, placeholder enquiry flow, FAQ, and unrelated copy.

## Opening And Transition
- [x] Replace the pattern loader with Figma frame 8:1956 as the immediate first screen.
- [x] Use the original solid arch and white motifs, with the centered white title.
- [x] Match the KAMAN / BAGRU title hierarchy and original studio mark.
- [x] Remove loading overlays, intro files, and body-scroll locking.
- [x] Coordinate the title exit, shrinking arch, controlled 45-degree turn, and outline reveal without ghosted overlaps.
- [x] Rebalance the opening with one poem/title lockup, softer pattern, and title glyphs fully on indigo.
- [x] Use a gentle 2.4-second opening handoff and a 45-degree outline pose aligned with the later spin direction.
- [x] Support immediate navigation and a static opening under reduced motion.
- [x] Automatically transition into the story without a page break or scroll jump.
- [x] Replace separate vector segments with one rounded continuous contour matching the STL perimeter.
- [x] Keep the contour planar and uniformly scaled; verify zero self-intersections.
- [x] Render the opening fill and outline on one persistent SVG-derived mesh, without a moving element swap or fade gap.
- [x] Morph that same surface toward the STL rim during the tilt; use camera projection for continuous sizing.
- [x] Keep navigation in the same fixed 960 px maximum container from the opening onward.
- [x] Keep the canvas viewport stable instead of resizing it during the transition.

## Scroll And Light
- [x] Build three concise centered story chapters with the model above the text.
- [x] Add eased wheel, touch, keyboard, and chapter-control scroll checkpoints, including reverse travel.
- [x] Use exactly three story stops: outline, completed shade, and completed illuminated lamp with final copy.
- [x] Run printing travel at half its previous speed while keeping opening and Back to top responsive.
- [x] Tilt the flat contour into the shade's actual 3D bottom rim.
- [x] Print the shade upward before revealing any of the blue base.
- [x] Reveal the blue base only once the shade is complete.
- [x] Light the finished lamp automatically at the final chapter.
- [x] Keep the final light checkpoint white with indigo text, retaining warm ground illumination and bloom.
- [x] Remove the light switch; retain automatic illumination and chapter navigation.
- [x] Keep the guide attached to the first printed layers and fade it only once solid geometry is visible, with no empty handoff.
- [x] Precompile shaders before scene readiness and make printing travel respond promptly without shortening the full animation.
- [x] Rotate the lamp 180 degrees around its upright axis during printing, with a small zoom.
- [x] Add another 180-degree upright rotation during assembly, synchronized with shrink/drop and reversible without changing the final cable orientation.
- [x] Trace the active layer with a model-profiled filament and finish the strand at completion.
- [x] Keep a white filament looping around the shade's top at the second stop; remove filament entirely during base assembly.
- [x] Enlarge the shade-only pose, then start the base drop and shade shrink/lift simultaneously on one easing curve; keep the base independently floor-aligned.
- [x] Trigger brighter illumination only when the base reaches the floor.
- [x] Spawn the blue base inside the shade, conceal its hidden portion, and accelerate it straight down without fading in; light the lamp and floor immediately at contact.
- [x] Introduce a broad faint shadow ahead of assembly, then tighten it gradually with same-frame shadow updates.
- [x] Center all three story stages, with the graphic or lamp above the text.
- [x] Finish the half-turn with the cable notch facing the rear.
- [x] Preserve the full-width first screen and 960 px post-opening maximum.
- [x] Use a native smooth final-story exit with a 650 ms input guard, without per-frame scroll writes, style updates, or lamp redraws; preserve touch and return navigation.
- [x] Reduce mobile model scale, keep model-to-text clearance, and match the intended higher opening arch/title with cropped side steps across phone aspect ratios.
- [x] Remove timed opening autoplay; keep the first screen stationary until scrolling or tapping the arrow, including after returning to the top.
- [x] Fade the cast shadow before canvas edges rather than clipping it.
- [x] Restore the opening on reverse scrolling and provide a header Back to top control.
- [x] Add studio key, fill, rim lighting, and grounded contact shadows.
- [x] Use source-provided product copy and technical specifications.
- [x] Rewrite the hero, three chapters, specifications introduction, footer, metadata, and utility copy from the original product facts.
- [x] Make a second, more direct copy pass while preserving the original Rajasthani-arch and Bagru context.
- [x] Add an Indian-reference-led copy pass with gentle wit, everyday chai/conversation context, factual supporting text, and checked phone typography.
- [x] Add 48 px desktop / 36 px phone spacing between opening subtext and title.
- [x] Read lighting-brand references and copywriting/editing guidance; document sources and keep the wording original.
- [x] Distinguish Bagru block-printing inspiration from the lamp's 3D-printed PLA construction.
- [x] Use Shop now as the sole right-side header action, aligned to the 960 px container edge.
- [x] Give the specifications band an indigo background with white text and line artwork.

## Verification
- [x] Stop idle/hidden/off-screen rendering, cap the visible filament loop, cache shadows, and avoid duplicated STL buffers.
- [x] Pass production TypeScript/Vite build and lint.
- [x] Inspect desktop and mobile opening, handoff, tilt, print midpoint, and lit end screenshots.
- [x] Verify nonblank canvas pixels, scroll-driven formation, and illumination changes.
- [x] Verify local assets, no horizontal overflow, controls, and reduced motion.
- [x] Update README and leave the local server running.

Verified at 1440 x 1000 and 390 x 844 in Chromium. Pixel checks distinguish the
unfinished model from the complete shade and confirm warm illumination changes.
Reduced-motion model geometry remains stationary across scrolling. The new
opening never locks scrolling; chapter buttons work at both sizes. No runtime
errors or failed asset responses were observed. Preview: http://localhost:5173/.

Continuous-transition revision: the opening stays stationary until user input,
with one canvas and no separate hero/story outline elements.
Desktop and mobile pixel checks find zero blue-base pixels at partial and
completed shade-only phases, followed by visible blue pixels in the base phase.
Automatic light and chapter navigation remain functional; the camera fits both viewport sizes.

New-opening revision: compared 1440 x 931 and 390 x 844 captures against the new
Figma frame. Original solid and motif assets load locally; there is no loader
element, body lock, overflow, or failed request. A geometry check of 720 contour
samples confirms a planar centerline and zero self-intersections. The title and
story are hidden during the shrinking-arch midpoint to avoid visual overlaps.

Completion revision: desktop story, canvas, details, and footer measure exactly
960 px maximum; phone width is 390 px without overflow. Completed text is centered
below the enlarged lamp and above the footer. Pixel checks find no dark shadow
pixels at either canvas edge. Rotation reaches 3.1416 radians, and the filament
is active during assembly but absent at completion. Lit-surface checks retain
warm detail without clipping into the white page. Reverse wheel and Back to top
restore the opening at desktop and mobile sizes; the light switch is absent.

The original STL remains approximately 19 MB. A lighter production model is a
future bandwidth optimization, not a change to the supplied geometry here.

Guided-motion and night revision: wheel and keyboard inputs reach each checkpoint;
mobile touch gestures reach form, print, assembly, and final light. Reverse
gestures and Back to top restore the opening. A tiny reverse trackpad delta does
not interrupt a forward transition. Hinge math is monotonic with zero roll. The
final backdrop stays white on desktop and phone, with visible warm ground
pixels. Navigation remains exactly 960 px wide on desktop at the opening.

## Delegation
- STL agent: actual geometry, print shader, lighting, and WebGL fallback.
- Asset research agent: Figma inventory and existing asset suitability.
- Original intro agent: initial loader, subsequently removed for the new opening.
- Main agent: Figma sourcing, page integration, styling, and end-to-end verification.