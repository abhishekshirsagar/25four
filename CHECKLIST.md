# Kaman / Bagru Experience

## Local Architecture Experiment
- [x] Keep all new work local, with no push, upload, or deployment.
- [x] Set the browser title to Kaman Bagru | 25.four.
- [x] Fit the front-elevation drawing inside the existing 960px content container, with responsive side padding and compact-height fitting.
- [x] Fix facade proportions to the corrected 1036 x 698 reference, with a shorter pavilion and wider arcade; uniformly fit tall/short desktop and phone viewports and verify constant projected aspect ratio and header/copy clearance.
- [x] Overlap the retiring opening graphic and arriving facade in one canvas, without a blank interval.
- [x] Build the elevation arches from exact quarters of the existing outline; animate only translation, rotation, and uniform scale so their shapes stay unchanged.
- [x] Match structure, arch, and ghumat strokes at 1.5px on desktop and 1px on mobile, preserving the opening stroke and later 2.2px vector/print guide.
- [x] Recompose the facade around a connected jharokha gallery, larger lower arcade, central ceremonial entrance, and responsive balcony spacing using the supplied architectural references.
- [x] Add restrained arch surrounds, pier profiles, cornice joints, and roof ribs without fills or changes to the folding curves.
- [x] Start inside the central pavilion window with its indigo texture, then zoom out the same architectural group without a shape-to-roof morph.
- [x] Hide non-window facade geometry in the stationary opening, redraw it late in the zoom, and verify reverse return restores the same window with no extra lines or idle draws.
- [x] Extend the full-width header white band from the top with equal padding below its controls, and reserve its complete height in facade and cached lamp-camera fitting; verify desktop/phone clearance.
- [x] Match upper window crowns to the original vector arch profile and join side chhatri supports continuously to the facade.
- [x] Keep one unchanged central window and outline through the zoom, restore the half-tile-staggered pattern at 10%, and remove the blue backing from the complete illustration.
- [x] Separate the pavilion, cornice, gallery and arch crowns; add two raised-plinth lines beneath the window bases.
- [x] Fold the center two bays into the upper vector arches and the outer bays into the lower arches.
- [x] Smoothly strengthen the four retained arch strokes from their facade weight to 2.2px during curling, then keep that fixed-pixel stroke through the vector-to-rim morph without a thinning crossfade; verify desktop/phone widths and geometry.
- [x] Trim all non-arch paths before movement, then gather for 0.93 seconds and curl for 1.47 seconds, matching full-return reverse timing; preserve clear-out timing and use an approximately 3.92-second pre-print budget with an 80ms rim morph.
- [x] Preserve the published multi-point trim behavior and reverse only segments touching the eight retained arch endpoints; slow these local strokes across the full trim interval so they finish with the last sketch detail, while other paths keep their original schedule.
- [x] Restore published distances, roof/cornice anchors, disconnected-piece starts, and independent roof/window timing; remove the global inward/random-pacing changes and verify rendered differences are confined to the arch-adjacent region.
- [x] Retain standard vector rendering and full detail opacity while changing visible path length; keep opacity-aware anti-aliased line caps for the existing outline handoff.
- [x] Cache trim distances per layout and verify desktop/mobile forward/reverse travel, stationary rigid arches during trimming, and recovery from missing hot-refresh uniforms.
- [x] Index trim-splitting candidates and use a deterministic shortest-path heap; verify exact geometry/distance/reversal parity and reduced preparation CPU on the current facade.
- [x] Reuse shadows after completed assembly; verify identical settled pixels, approximately halved final-stage triangle submissions, zero idle redraws, and refresh on resize and reverse disassembly.
- [x] Publish guided progress directly from the animation driver; verify approximately 60fps curl on local desktop/phone viewports, closed joins, reverse travel, held-touch locking, light controls, reduced motion, and zero idle draws.
- [x] Keep Vibe copy on reverse until the building reappears, without changing switch or next-arrow behavior.
- [x] Give reverse uncurling and spreading a dedicated 2.4-second budget, preserving building reveal, reverse printing, opening zoom, and forward travel.
- [x] Separate paired pillar strokes in screen pixels while retaining equal bay widths and readable compact piers.
- [x] Skip invisible ground draws and empty shadow updates in vector stages; verify four versus seven draws with identical pixels and no redundant vector settling frames.
- [x] Generate static facade detail from one mirrored half, center arch profiles by their bounds, and anchor balcony brackets to their ledges.
- [x] Equalize all four usable bays with identical piers and matching edge half-piers; provide consistent breathing room around the arch windows.
- [x] Improve illustration stroke anti-aliasing and Retina resolution while retaining the dense lamp stage's DPR 1.25 cap.
- [x] Separate top-window bottoms from the grille with a 6px gap without changing window height or profile.
- [x] Replace competing opening motions with one central-window zoom that keeps the texture attached to the architecture.
- [x] Consult Rajasthan Tourism's Hawa Mahal photograph and description, then add original chhatri, jharokha, lattice, fluted-pier and chhajja-bracket details without bundling the photograph.
- [x] Verify desktop/mobile pixel handoffs, forward/reverse navigation, held-touch locking, light switching, no autoplay, and reduced motion.

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
- [x] Use the selected Making and Vibe copy in two centered story chapters with the model above the text.
- [x] Add eased wheel, touch, keyboard, and next-arrow scroll checkpoints, including reverse travel.
- [x] Keep each touch gesture to one story stop, block transition reentry, capture through release, and preserve readable specification scrolling and pinch zoom.
- [x] Replace numbered chapter controls with a single 44 px down arrow that advances to Vibe, then specifications.
- [x] Use exactly two story stops: Making at the outline and Vibe at the illuminated lamp, with no completed-shade checkpoint.
- [x] Reverse the scene on upward travel with responsive initial velocity and smooth settling, avoiding the slow start of a mirrored ease-in.
- [x] Run printing travel at half its previous speed while keeping opening and Back to top responsive.
- [x] Tilt the flat contour into the shade's actual 3D bottom rim.
- [x] Turn the vector directly toward the model's rim orientation without a compensating profile twist; verify monotonic projected-edge motion, unchanged polar angles, and exact guide/model rotation during printing.
- [x] Match forward gathering/curling to the reverse spreading/uncurling durations using a shared 2.4-second moving-arch budget; keep curl/rotation synchronized, shorten the separate rim morph to 80ms, preserve printing pace, and verify partial resumes.
- [x] Update the camera and moving guide before arch hinges; verify current-frame handoff alignment, closed joins, desktop/mobile overlap and cadence, mid-motion reversal, and reduced motion.
- [x] Calculate curling in one fixed plane and apply a common fixed-path 3D turn without a vertical bob; verify finite scales, monotonic forward/reverse rotation, shared lobe normals, unchanged curves, and closed joins.
- [x] Print the shade upward before revealing any of the blue base.
- [x] Reveal the blue base only once the shade is complete.
- [x] Light the finished lamp automatically at the final chapter.
- [x] Keep the final light checkpoint white with indigo text, retaining warm ground illumination and bloom.
- [x] Add an accessible On/Off switch between the finished model and text; preserve automatic illumination by default and user choice while scrolling.
- [x] Grow the off-state switch after completed assembly, automatically light after 220ms, and finish switch-off/shrink before reverse disassembly; verify actual scale completion, manual keyboard switching, early-reversal cancellation, and reduced motion.
- [x] Remove its track border and visible state label, optically center the switch, and retain keyboard focus, screen-reader state, and its touch target.
- [x] Align Making/Vibe text height and center the toggle between the lamp and heading, with independent final-camera framing and no toggle-induced movement.
- [x] Lower mobile story copy a further 16px on tall phones and 8px on shorter layouts, preserve tight-screen safeguards and the lamp's camera framing, and center the switch in the enlarged gap; verify Making/Vibe and arrow clearance.
- [x] Keep the guide attached to the first printed layers and fade it only once solid geometry is visible, with no empty handoff.
- [x] Align the guide and print start to the actual shade rim, use stable visible-edge depth ordering, and shorten overlap to avoid a doubled rim.
- [x] Remove the detached internal shade-ring remnant from the generated runtime model; protect every outer-shade/base triangle and retained position/normal bit, and keep the source STL and rim contour unchanged.
- [x] Remove the attached brace-end rim tabs left by the first cutoff, preserving wall-reaching triangles; verify the marked back-left tab in enlarged early-print before/after captures and guard the exact 350-triangle removal.
- [x] Remove cross-brace spans from rendered geometry and shadows without changing the base, outer shell, or source STL; retain the small attachment junctions.
- [x] Precompile shaders before scene readiness and make printing travel respond promptly without shortening the full animation.
- [x] Use one smooth 225-degree upright rotation from printing through floor contact, retaining direction, zoom, reverse travel, and the final cable orientation.
- [x] Keep angular velocity continuous through shade-print completion without a separate assembly acceleration phase.
- [x] Start assembly immediately at shade-print completion with a modest initial velocity, removing the post-print hold.
- [x] End layer reveal at the real model top and retain printing velocity into assembly, avoiding an early fully-visible shade and near-zero-motion interval.
- [x] Start the base fully concealed at the shade's clipping plane and reveal its emerging edge progressively in both color and shadow passes.
- [x] Enlarge the resting outline on phone and desktop while preserving text clearance and the aligned print handoff.
- [x] Remove the filament strand, tip, profile calculation and continuous loop while preserving layer-by-layer shader printing.
- [x] Increase transmission through the middle/lower shade surfaces without increasing bulb intensity or the floor pool.
- [x] Enlarge the shade-only pose, then start the base drop and shade shrink/lift simultaneously on one easing curve; keep the base independently floor-aligned.
- [x] Trigger brighter illumination only when the base reaches the floor.
- [x] Spawn the blue base inside the shade, conceal its hidden portion, and accelerate it straight down without fading in; grow the toggle at floor contact, then automatically light the lamp and floor together.
- [x] Introduce a broad faint shadow ahead of assembly, then tighten it gradually with same-frame shadow updates.
- [x] Center both story sections, with the graphic or lamp above the text.
- [x] Finish the continuous rotation with the cable notch facing the rear.
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
- [x] Enlarge Shop now to 16px with a 44px-high target; reserve the taller header band in facade fitting and verify model/header clearance.
- [x] Match the Platypi Specifications heading to story heading sizes at every breakpoint, retaining rows at 16px desktop/15px mobile; remove the dimensions intro, product-code label, and See Kaman lit link while retaining the full table.
- [x] Use uppercase Unbounded KAMAN at weight 200 and BAGRU at weight 400, matching the opening title, with the first Specifications baseline aligned on desktop; verify stacked mobile layout, drawing clearance, and preserved dimension values.
- [x] Set the footer caption to LAMP / KAMAN BAGRU at 12px desktop/11px mobile, and refer to the lamp rather than Kaman in both story paragraphs; verify narrow-screen wrapping and navigation clearance.
- [x] Give the specifications band an indigo background with white text and line artwork.

## Verification
- [x] Stop idle/hidden/off-screen rendering, remove the filament loop, cache shadows, and avoid duplicated STL buffers.
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
pixels at either canvas edge. The filament overlay is removed while the shader
still builds the shade layer by layer. Lit-surface checks retain
warm detail without clipping into the white page. Reverse wheel and Back to top
restore the opening at desktop and mobile sizes; the light switch is confined to the finished-lamp section.

The original STL remains unchanged. Its generated runtime asset is now 4.06 MB,
using lossless compression and exact position/normal deduplication without
geometry decimation.

## Performance Optimization
- [x] Preserve the original STL and verify retained positions, normals, triangle winding, and rim coordinates after compression.
- [x] Replace the 20.0 MB browser STL with a generated 4.06 MB Meshopt/gzip model.
- [x] Move normalization, support filtering, vertex deduplication, and rim sampling to the build pipeline.
- [x] Reduce vertex/index data from 33.49 MB to 18.73 MB without removing visible triangles.
- [x] Cache viewport-dependent camera fitting and skip unchanged projection updates.
- [x] Remove unused Drei and unused font dependencies; defer the gzip compatibility fallback.
- [x] Verify the final production base path, desktop/mobile interactions, fallback decoding, and build/lint gates.

Optimization verification: the `/25four/` production build passes TypeScript and
lint. Chromium checks at 1440 x 1000 and 390 x 844 confirm nonblank lit/unlit
canvas pixels, unchanged typography and framing, keyboard switching, held-touch
single-section navigation, specifications, and reverse travel without runtime
errors or failed assets. Native decoding and the compatibility decoder both
work. An injected model-fetch failure recovers through the pointer-accessible
retry button; reduced-motion geometry retains its stationary final rotation.

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