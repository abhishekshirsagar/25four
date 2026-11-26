# Kaman / 25.Four

A full-width product experience for Kaman, the Bagru edition by 25.four. Built with React, TypeScript, Vite, Three.js, and React Three Fiber. Based on the supplied Figma screens, original vector artwork, packaging copy, and actual lamp STL.

## Development

Use Node.js 22.12+ or 24+.

```sh
npm ci
npm run dev
```

Vite prints the local preview URL, normally http://localhost:5173/.

Development and production builds automatically run `scripts/prepare-lamp.mjs`.
It derives the ignored `src/assets/lamp-optimized.bin` from the unchanged STL,
verifies exact geometry and rim data, and compresses it for browser delivery.
No external model tooling or checked-in generated binary is required.

```sh
npm run build
npm run lint
npm run preview
```

## Editing

- `src/App.tsx`: reversible landing-to-story timeline, two story sections, centered completion layout, next-section navigation, and product specifications.
- `src/LampScene.tsx`: compressed STL-derived geometry, rounded contour, flat-to-3D transformation, shade-first print shader, scroll-driven rotation, and internal illumination.
- `src/ArchitectureArches.tsx`: sparse front-elevation line drawing with four exact source-vector arch curves that turn and join without deformation.
- `src/architectureLayout.ts`: responsive castle fitting, shared window profiles, and the central-window zoom anchor.
- `src/architectureProfiles.ts`: lazy Three.js curve builders using the shared source arch path; the loading poster stays dependency-free.
- `src/architectureTrim.ts`: cached line-graph distances for multi-point trim paths, junctions, and disconnected ornaments.
- `src/index.css`: locally bundled typography, palette, and global styles.
- `src/product.css`: page layout and responsive styles.
- `Full lamp.stl`: the supplied source model; preserved on disk and no longer shipped to browsers.
- `scripts/prepare-lamp.mjs`: build-time normalization, existing support filtering, exact vertex deduplication, rim preparation, Meshopt/gzip compression, and round-trip verification.
- `public/`: original downloaded Figma motifs, studio mark, and lamp drawing.
- `CHECKLIST.md`: implementation progress and verification results.

The first screen is a close-up of the central pavilion window, with the original staggered indigo-and-white motif texture at 10% opacity and the white KAMAN / BAGRU title. It reads "Rooted in Rajasthan. / Arches. Indigo. Warmth." The poem and title remain one balanced lockup. A matching static window poster appears while local assets load. The opening stays stationary until scrolling or tapping the down arrow; there is no timed autoplay. The 2.4-second opening transition zooms out the same architectural group around that window to reveal the complete castle. One persistent window outline and backing use the same vertex points and transform throughout; neither is replaced at the second section. Its texture scales with the window, rather than remaining fixed to the screen, then fades away before the complete facade appears. The previous shape-to-roof morph is removed. A full-width white header band keeps the drawing clear of navigation during the zoom.

Only the central window texture and outline are visible in the stationary
opening. Other facade lines stay hidden until the late zoom-out, where cached
trim paths redraw the detail; reverse zoom hides it again before the opening.
The header's full-width white band starts at the presentation top and mirrors
the navigation's upper spacing below its controls. Facade fitting and cached
lamp-camera fitting reserve that full band so neither drawing is clipped.

The facade uses fixed 1036 x 698 reference dimensions, close to the corrected
elevation's 1.48 width-to-height ratio, with its shorter pavilion and wider arcade.
It scales uniformly within the existing
960px maximum content width and 24px side padding; viewport height never changes
its tier or window proportions. Compact screens fit the complete drawing
between the header and story copy. Folding
transforms compensate for that parent scale so the final vector remains exact.
Upper pavilion and gallery windows share the original lamp-vector arch crown;
their straight jambs can extend without stretching the crown. Side chhatris
connect through their pedestals into continuous facade columns.

The facade's elevation strokes, arch curves, and ghumat share one 1.5px line weight.
During curling, the four retained arches smoothly strengthen to 2.2px for the
joined upright vector. The same fixed-pixel LineMaterial stroke continues through
the vector-to-rim morph, instead of crossfading to a thinner mesh outline.
Non-folding architectural lines retract along their paths before the arches move,
with full stroke opacity rather than a fade. Trim fronts start at the retained
arch endpoints, roof apex, and upper cornice corners; disconnected ornaments
use their nearest endpoint. Junctions and distances are prepared only when the
layout changes, and shader uniforms drive forward trimming and reverse drawing.
The arches then gather horizontally into a connected row, without rotating.
They then curl around shared endpoint hinges, keeping their three joins closed.
The center bays become the vector's upper-left and upper-right arches; the outer
bays become the lower pair. Curve coordinates stay unchanged throughout.

The static elevation is composed as a connected palace facade: a paired upper
jharokha gallery, larger cusped lower arcade, projecting balcony bases and jaali
railings, fluted pavilion towers, and a full-height matching center pier.
An independent ribbed onion dome crowns an open three-bay pavilion; its shape
is not constrained by the old opening silhouette. Clear bands separate its
pedestal, cornice, gallery, and lower arcade. Two plinth lines sit below the
balcony bases to make the structure feel elevated. Small screens use fewer
details and fitted balcony projections to avoid collisions. The indigo window
backing is opening-only; the complete illustration has unfilled windows. The
line drawing clears before the fold.

Static facade detail is generated from a canonical left half and mirrored, with
duplicate center seams removed. Balcony bracket endpoints lie on their supporting
ledges. Arch placement uses the curve bounds for centering without deformation.
The four usable bay widths are equal: internal piers share one width, and the
outer bays reserve matching half-piers. Arch surrounds have consistent side insets,
while the original folding curves keep their coordinates and uniform scale.
Long pillar pairs are separated by 4px on desktop and 2.5px on mobile; upper
pavilion-column pairs use 4px separation. Compact piers reserve sufficient width
for the two strokes and niche instead of merging into a thick edge.
The top windows retain their height and shape; a separate grille band begins
6px below their bottoms and connects to its lowered pedestal.

The user's supplied palace-elevation, jharokha, cusped-arcade, and ribbed-chhatri
references guide the composition and proportions. It is an original reinterpretation;
none of the supplied stock images or their vector paths are embedded or traced.

Additional architectural research: [Rajasthan Tourism's Hawa Mahal reference](https://www.tourism.rajasthan.gov.in/hawa-mahal.html),
including its official photograph and description of domed canopies, fluted
pillars, arches, and jharokhas. This is an original simplified elevation, not a
replica or tracing; no reference photograph is bundled into the application.

After the opening, scrolling has two story stops: Making at the architectural elevation and Vibe at the complete illuminated lamp. Its four folding arches are exact quarters of the original outline. A dedicated 4-second sequence slowly trims away the non-arch lines first, then gathers the arches horizontally, then curls the connected strip with uniform scale and closed endpoint joints. Architecture progress uses a steady driver so each visual stage is eased only once. The arches remain stationary until the detail clear-out finishes. Standard LineMaterial alpha-to-coverage rendering is retained, including its opacity-aware anti-aliased caps; architectural detail stays fully opaque while its visible length changes. The outline retains its 1.2-second tilt into the shade rim, followed by the existing printing curve with distance-proportional timing. Printing, the enlarged shade pose, and assembly remain one continuous journey without another checkpoint. The Making copy remains until the lamp lights, then switches to Vibe. A single down arrow advances from Making to Vibe, then to specifications. Wheel, touch, Page Up/Down, and arrows use the same destinations. The opening retains its 2.4-second zoom. Upward travel reverses the elevation, outline, and lamp with responsive initial velocity and smooth settling. Tiny trackpad reversals are ignored; deliberate reverse gestures remain available. Native scrolling resumes below the product experience. Reduced motion skips the architectural motion and uses immediate checkpoint changes.

On reverse travel, Vibe copy stays through disassembly, reverse printing, and
uncurling. Making returns only once the architectural paths begin redrawing,
using the same path-presence calculation as the drawing. The light switch and next-arrow
destination still follow the actual scene stage, independently of the retained
copy. Reduced-motion checkpoints keep immediate copy changes.

Reverse uncurling and horizontal spreading use a dedicated 2.4-second budget,
proportional for partial reversals. This targets only moving arches, not the
building reveal. Reverse printing and opening zoom retain their original pace;
forward travel is unchanged.

Guided motion publishes scene progress directly from its animation-frame driver,
without waiting for scroll events and another measurement frame. Local Metal GPU
checks at 1440x1000 and 390x844 improved the curl's median frame interval from
50ms to about 16.7ms, retaining its timing, rigid curves, and closed joins.
Native scrolling still measures progress when no guided transition is running.

Once the 3D view is ready, each vertical touch gesture advances one story stop.
Gesture ownership lasts until touch end or cancellation, even when the finger
remains down after the transition. New gestures during a transition are consumed
without advancing again. Horizontal panning and pinch zoom remain available.
On phones, specifications occupy at least one viewport; swiping upward from their
top returns to the lit lamp, while longer specification content scrolls normally.

The flat outline rests at 45 degrees, then turns an additional 45 degrees during the controlled hinge into the shade's bottom rim. Its target vertices compensate for the combined turn so the final rim aligns point-for-point with the actual lamp. Printing starts while the guide is still visible; the guide follows the same scale, position, and rotation as the first layers and fades only after solid geometry is present. This avoids an empty handoff or a detached lower rim. From printing through floor contact, the lamp makes one continuous 225-degree turn around its upright axis. The shade enlarges as the print-height shader reveals each layer; there is no moving filament strand or tip. The internal support column and its shadow are excluded during printing; the cross-brace spans are filtered from the rendered geometry in every stage, retaining mount and shell junctions. Without stopping, the base drops and the shade shrinks and lifts simultaneously, sharing one continuous easing value. The base starts inside the shade, concealed above its lower edge, and remains at its final size and floor-relative position independently of the shade's scale. It emerges at full color without fading in or intersecting through the shade's sides; the shadow shader uses the same concealment. A faint, broad ground shadow is already present beneath the shade; it tightens and strengthens as the base approaches the floor, avoiding a sudden shadow pop. Floor contact leaves the lamp off while its toggle grows; automatic switch-on then lights the lamp and ground together and triggers the Vibe copy. On return, switch-off and toggle shrink finish before disassembly begins.

The handoff uses the actual shade rim at model height `1.6`, separate from the
material split at `1.55`. The guide and first printed layer share this plane.
Visible guide pixels use biased depth ordering to avoid overlap flicker, while
transparent interiors are discarded. The guide fades as soon as enough printed
geometry exists, avoiding a lingering doubled rim.

Printing and assembly share one smooth 225-degree upright rotation from progress
`0.18` through floor contact at `0.9`. One smootherstep curve accelerates and then
decelerates across the whole journey, without restarting at shade-print completion.
The direction, final rear-facing cable notch, zoom, and reverse travel are unchanged.
Shade shrink and base drop keep their existing synchronized assembly easing.

Layer reveal stops at the actual model height, with no overshoot that makes the
shade appear complete before assembly begins. Layer growth retains its nonzero
finishing velocity, while the continuous rotation passes through shade completion
without slowing to a stop or beginning a separate assembly turn.

The base begins fully concealed at the enlarged shade's clipping plane. As it
descends, its exposed edge grows continuously rather than switching on as an
already-visible block. Color and shadow passes share the same reveal boundary.
The resting outline is sized from 78vw, capped at 610px and 74% of the scene
height, with additional framing for short desktop viewports.

The finished lamp has an On/Off switch between the model and its copy. At assembly
completion, it grows from scale 0 to 1 in 180ms while off, holds for 40ms, then
automatically switches on with a 120ms thumb transition. Before reverse motion,
it switches off, holds for 140ms, and shrinks over 140ms; disassembly waits for
the scale transition to finish, with a timer fallback. Early reversal cancels
pending automatic lighting. Reduced motion uses immediate completed states.
It retains the user's choice while visiting specifications and controls material
glow, point lights, the bulb, bloom, and the floor pool together. It is hidden
and inert during Making and unavailable while entering or exiting. The switch supports keyboard
activation and uses a 56 x 44px touch target; compact layouts preserve clearance.
Its track is borderless, without a visible On/Off label. Color and thumb position
indicate state; `aria-checked` retains screen-reader feedback and keyboard focus
remains visible.

Making and Vibe share the same text anchor and typography at each viewport size.
The copy sits 32px lower on roomy desktops, 24px lower on taller phones, and 20px
lower on compact phones with enough clearance. Tight viewports retain the original
position so the down arrow is not clipped. Camera fitting subtracts this copy
offset, keeping the lamp fixed; the switch moves by half the offset, with a small
optical adjustment to center it between the painted lamp edge and heading letters.
Framing still interpolates during assembly;
toggling illumination does not change that framing or scroll position.

The vector's tilt and 45-degree turn use their own relaxed 1.2-second segment;
the following print journey retains its established easing and proportional pace.
Small scroll gestures are accepted promptly, with a short trackpad-tail guard.
Returning upward begins moving immediately and slows smoothly at its destination.

Both story sections use a centered graphic or lamp above centered text. Its starting orientation is offset so the continuous printing-to-assembly rotation finishes with the cable notch at the rear. At the final light checkpoint, the background stays white with the original indigo text and navigation, while the lamp illuminates with internal light falloff, bloom, and a restrained, softly warm pool of light on the ground. The shade retains its detail, and the floor pool has reduced yellow saturation and intensity. The pool fades before its plane edges. The finished-lamp switch lets the user inspect both illuminated and unlit states without changing the assembly pose.

The opening artwork remains full-width. Navigation uses the same fixed 960 px maximum container from the opening onward, with Shop now aligned to its right edge. The separate header up-arrow is removed; the studio mark and footer arrow still return to the top. Shop now currently opens the local product specifications, not a checkout. The model composition, story, specifications, and footer also have a 960 px maximum width. The specifications form a full-width indigo band with white text, soft blue labels, and white line artwork. The canvas remains viewport-wide throughout, avoiding resize-induced camera jumps and leaving room for bloom. Scrolling upward reverses the story and restores the stationary opening.

On phones, model zoom is reduced and the story has more model-to-text clearance.
Compact viewports use tighter typography without a forced oversized sticky height.
The opening arch begins at 18% of the viewport height and is at least 2.4 times
the phone width, keeping its side steps outside the screen at different aspect
ratios. The title lockup is centered at 62% of the height. The loading poster and
animated surface share the same dimensions and alignment.

The landing and story share one sticky viewport and one persistent Three.js canvas. A single mesh, sampled from the original Figma SVG through SVGLoader, renders both fill and edge. Its planar vertices morph toward the STL perimeter during the 3D tilt rather than swapping graphics. Actual camera projection determines screen position and scale in the stable viewport. The white backdrop is rendered as a linear compositor pass before bloom and output conversion. The source SVG and STL assets are unchanged.

The 3D scene is lazy-loaded separately. Models, fonts, and graphic motifs are local; no remote image, HDR, or model service is required. Reduced-motion preferences disable rotation and zoom; entering the story displays the complete, centered, stationary lamp. A static illustration with retry is available if WebGL fails.

## Hosting

Public preview: https://abhishekshirsagar.github.io/25four/

The published preview includes the architecture animation and browser title
"Kaman Bagru | 25.four". The illustration is original, using the existing
vector's unchanged arch curves; the stock reference artwork is not embedded
or reproduced. Keep future experiments local unless publication is explicitly
requested.

The repository and preview are public. Pushes to `main` build and deploy through
[GitHub Actions](.github/workflows/pages.yml). The workflow sets
`VITE_BASE_PATH=/25four/`; local development keeps the default `/` base path.

## Light Sources

Coordinates are local to the normalized lamp, with its floor at `y=0` and total
height `3.2`. The bulb mesh and main point light are centered at `[0, 2.05, 0]`,
inside the shade above the base. A secondary spill light is lower, at
`[0, 1.35, 0.2]`. The shade's material adds simulated transmission around the
bulb, and the floor pool is a separate shader. These activate at floor contact;
the lighting is a visualization rather than a physical simulation. An additional
surface-transmission term brightens the middle and lower shade, fading out before
the top opening. Bulb intensity and the floor-pool settings remain unchanged.

## Runtime Performance

- Vector-only stages skip zero-opacity ground planes and empty shadow-map updates. The gather/curl frame uses four draws rather than seven in the previous invisible-ground setup; a local same-frame comparison confirms identical pixels. Shadows and floor illumination still appear at their original reveal points.
- Vector-only poses request no 1.4-second settling loop; the existing settling window remains for the lit 3D scene. Layout/geometry caches and exact curve coordinates remain unchanged.
- The canvas renders on demand rather than continuously. After lighting settles, the completed lamp stops requesting frames.
- The lit-lamp-to-details handoff uses browser-native smooth scrolling with a 650 ms guided-input guard. The completed presentation and memoized scene stay fixed while leaving the story, with no per-frame scroll writes or style updates. The sticky presentation uses a compositor layer; canvas scroll-position measurements are disabled, but element-size observation remains enabled.
- Guided transitions retain wheel, touch, and keyboard ownership until completion, preventing native scrolling from fighting the final exit. Native scrolling resumes afterward.
- Lamp shaders are precompiled once before scene readiness, keeping cold shader setup out of the first printing interaction. The opening poster remains available while that completes.
- Hidden tabs and off-screen scenes pause rendering; there is no filament-specific continuous loop.
- Shadow maps update in the same render frame as visible model changes, then stay cached while idle; vector-only motion does not dirty them.
- The lightweight illustration stage uses pixel ratio up to 2 with analytic line anti-aliasing; printing and the dense lamp stage retain the 1.25 cap. The renderer does not force a high-performance GPU preference.
- Architectural curves are vector geometry rendered into a WebGL canvas, not native SVG on screen. The earlier 1.25 cap limited Retina stroke resolution; the higher illustration-only cap improves edges without increasing the dense lamp stage's pixel workload.
- Standard material shading avoids unnecessary clearcoat and sheen calculations. Internal glow and bloom remain.
- Camera fitting caches its 64 projection samples per viewport size rather than repeating them every frame. Animated zoom and assembly framing still interpolate as before; unchanged projections are not rewritten.
- The runtime model is 4,058,933 bytes, down from the 19,997,184-byte STL (79.7% smaller). Meshopt and gzip compression use no geometry quantization or simplification. Build verification checks every retained triangle's winding and exact position/normal bits, plus the unchanged rim contour.
- Exact position-and-normal deduplication reduces vertices from 1,199,826 to 584,876. Vertex/index payload drops from 33.49 MB to 18.73 MB (44.1% smaller); this is buffer data, not a measurement of total browser memory.
- STL parsing, normalization, support filtering, and the full vertex scan for the rim now happen only at build time. The browser loads the prepared mesh and its 360-point rim. Native asynchronous gzip decompression is preferred; a small compatibility fallback is downloaded only when needed.
- Unused Drei, DM Sans, and IBM Plex Mono dependencies are removed. All visible fonts, scripts, artwork, lighting, and controls remain.
- The rendered index excludes 8,877 cross-brace triangles, while preserving the base and outer shell. The original STL still contains its full 399,942 triangles.

A local render-counter check recorded zero new frames over 1.1 seconds for the
settled final lamp and for a hidden tab after its in-flight frame completed.
These are rendering checks, not a cross-device CPU/battery benchmark. The
391,065 retained triangles remain the main active-draw cost. They have not been
decimated, so the supplied form and surface detail are preserved.

## Copy Direction And References

The copy is original. Its factual anchors are the supplied description: Kaman is
named after arches in Rajasthani architecture; four identical arch forms are
repeated radially to make the shade; the Bagru edition's indigo and white are
inspired by traditional Bagru block printing. The lamp itself is 3D printed in
PLA. The page makes no claim that it is hand-block-printed or traditionally handmade.

The selected story copy pairs "Old arches. New ways." with "Cool by day. Warm by
night." Making combines the Rajasthani-arch inspiration and the contemporary PLA
printing process. Vibe connects Bagru-inspired indigo and white with an unhurried
evening. The user's selected wording is preserved. Specifications remain factual,
and utility labels describe their actions.

References read for approach, not copied wording:
- [Nicobar](https://www.nicobar.com/): warm occasion-led language and understated social asides.
- [The Burlap People](https://www.theburlappeople.com/): personable product names and a friendly, unceremonious voice; its handmade and sustainability claims are not transferred to this lamp.
- [ORVI](https://www.orvi.com/): discussing traditional influences alongside contemporary processes without confusing inspiration with manufacture.
- [Gantri Maskor](https://www.gantri.com/products/10036/maskor-table-light-by-muka-design-lab): connect a distinctive form and its origin to how light feels at home.
- [Audo Copenhagen](https://audocph.com/): domestic context and a restrained editorial tone.
- [Copywriting skill](https://skills.sh/coreyhaines31/marketingskills/copywriting) and [copy-editing skill](https://skills.sh/coreyhaines31/marketingskills/copy-editing): specificity, honest claims, voice consistency, and focused editing passes. Guidance was read; no skill package was installed.
- [Nielsen Norman Group](https://www.nngroup.com/articles/concise-scannable-and-objective-how-to-write-for-the-web/): concise, scannable, factual web writing.

## Before Launch

Product specifications are transcribed from the supplied Figma packaging: 160 mm high, 200 mm wide, PLA, 3000K, and 220-240V AC / 50Hz. Verify these against the production lamp before launch. The rendered materials and illumination are a visualization, not an electrical simulation.

Add the official purchase destination for Shop now before launch. No price,
availability, delivery promise, warranty, or checkout has been invented here.

The supplied STL contains 399,942 triangles and remains unchanged. Vite
fingerprints the separately generated 4.06 MB runtime model instead. No checkout,
speculative finishes, or placeholder contact destination is included.