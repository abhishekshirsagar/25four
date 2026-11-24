# Kaman / 25.Four

A full-width product experience for Kaman, the Bagru edition by 25.four. Built with React, TypeScript, Vite, Three.js, and React Three Fiber. Based on the supplied Figma screens, original vector artwork, packaging copy, and actual lamp STL.

## Development

Use Node.js 22.12+ or 24+.

```sh
npm ci
npm run dev
```

Vite prints the local preview URL, normally http://localhost:5173/.

```sh
npm run build
npm run lint
npm run preview
```

## Editing

- `src/App.tsx`: reversible landing-to-story timeline, three scroll chapters, centered completion layout, chapter navigation, and product specifications.
- `src/LampScene.tsx`: actual STL geometry, rounded contour, flat-to-3D transformation, shade-first print shader, scroll-driven half-turn, active-layer filament, and internal illumination.
- `src/index.css`: locally bundled typography, palette, and global styles.
- `src/product.css`: page layout and responsive styles.
- `Full lamp.stl`: the supplied source model, bundled as a local asset by Vite.
- `public/`: original downloaded Figma motifs, studio mark, and lamp drawing.
- `CHECKLIST.md`: implementation progress and verification results.

The first screen follows Figma frame 8:1956: a solid indigo arch, a subtle field of original white motifs, and a centered white KAMAN / BAGRU title. The opening reads "Rooted in Rajasthan. / Arches. Indigo. Warmth." The poem and title form one balanced lockup, with a quieter pattern and more space below the navigation. A matching static poster appears immediately while local assets load; it is hidden before any animation begins. The opening remains stationary until the user scrolls or taps the down-arrow; there is no timed autoplay. The user-triggered opening transition runs over 2.4 seconds with gentle acceleration and deceleration. One SVG-derived surface owns the filled form and its outline throughout the motion. The title clears first; the same surface shrinks and turns 45 degrees, its fill and pattern recede while its edge stays visible, and the story appears after the graphic clears its text area.

After the opening, scrolling has two story stops: Making at the outline and Vibe at the complete illuminated lamp. Printing, the enlarged shade pose, and assembly run as one continuous journey without a completed-shade checkpoint. The Making copy remains until the lamp lights, then switches to Vibe. A single down arrow replaces numbered chapter controls: it advances from Making to Vibe, then to specifications. Wheel, touch, Page Up/Down, and arrows use the same destinations. Printing travel keeps its eased duration of approximately 2.4-4.53 seconds; the opening handoff uses its own gentle 2.4-second curve and Back to top is not slowed. Upward travel mirrors the easing curve so it retraces the forward motion in time. Tiny trackpad reversals are ignored; deliberate reverse gestures remain available. Native scrolling resumes below the product experience. Reduced motion uses immediate checkpoint changes.

The flat outline rests at 45 degrees, then turns an additional 45 degrees during the controlled hinge into the shade's bottom rim. Its target vertices compensate for the combined turn so the final rim aligns point-for-point with the actual lamp. Printing starts while the guide is still visible; the guide follows the same scale, position, and rotation as the first layers and fades only after solid geometry is present. This avoids an empty handoff or a detached lower rim. While printing, the lamp turns 180 degrees around its upright axis. The shade enlarges during printing, with a white filament tracing its top edge. The internal support column and its shadow are excluded during printing; the cross-brace spans are filtered from the rendered geometry in every stage, retaining mount and shell junctions. Without stopping, the base drops and the shade shrinks and lifts simultaneously, sharing one continuous easing value. The base starts inside the shade, concealed above its lower edge, and remains at its final size and floor-relative position independently of the shade's scale. It emerges at full color without fading in or intersecting through the shade's sides; the shadow shader uses the same concealment. A faint, broad ground shadow is already present beneath the shade; it tightens and strengthens as the base approaches the floor, avoiding a sudden shadow pop. The filament stops as the base emerges. Floor contact switches on the lamp and ground illumination in the same frame and triggers the Vibe copy, with no delayed light ramp. The same sequence reverses when scrolling upward.

Printing includes a 180-degree upright rotation, followed by a slower 45-degree
assembly turn in the same selected direction. Assembly begins at shade-print
completion with a modest initial velocity, avoiding a hold between the phases.
It shares its easing with the shade shrink and base drop, reverses with scrolling,
lights at floor contact, and retains the finished rear-facing cable notch.

Printing travel responds with a small initial velocity rather than a long
stationary ease-in, while retaining the existing overall duration. Small scroll
gestures are accepted sooner, with a shorter trackpad-tail guard. The separate
opening transition keeps its gentle 2.4-second easing.

Both story sections use a centered graphic or lamp above centered text. Its starting orientation is offset so the printing and assembly rotations finish with the cable notch at the rear. At the final light checkpoint, the background stays white with the original indigo text and navigation, while the lamp illuminates with internal light falloff, bloom, and a restrained, softly warm pool of light on the ground. The shade retains its detail, and the floor pool has reduced yellow saturation and intensity. The pool fades before its plane edges. There is no light switch.

The opening artwork remains full-width. Navigation uses the same fixed 960 px maximum container from the opening onward, with Shop now aligned to its right edge. The separate header up-arrow is removed; the studio mark and footer arrow still return to the top. Shop now currently opens the local product specifications, not a checkout. The model composition, story, specifications, and footer also have a 960 px maximum width. The specifications form a full-width indigo band with white text, soft blue labels, and white line artwork. The canvas remains viewport-wide throughout, avoiding resize-induced camera jumps and leaving room for bloom. Scrolling upward reverses the story and restores the stationary opening.

On phones, model zoom is reduced and the story has more model-to-text clearance.
Compact viewports use tighter typography without a forced oversized sticky height.
The opening arch begins at 18% of the viewport height and is at least 2.4 times
the phone width, keeping its side steps outside the screen at different aspect
ratios. The title lockup is centered at 62% of the height. The loading poster and
animated surface share the same dimensions and alignment.

The landing and story share one sticky viewport and one persistent Three.js canvas. A single mesh, sampled from the original Figma SVG through SVGLoader, renders both fill and edge. Its planar vertices morph toward the STL perimeter during the 3D tilt rather than swapping graphics. Actual camera projection determines screen position and scale in the stable viewport. The white backdrop is rendered as a linear compositor pass before bloom and output conversion. The source SVG and STL assets are unchanged.

The 3D scene is lazy-loaded separately. Models, fonts, and graphic motifs are local; no remote image, HDR, or model service is required. Reduced-motion preferences disable rotation, zoom, and moving filament; entering the story displays the complete, centered, stationary lamp. A static illustration with retry is available if WebGL fails.

## Hosting

Public preview: https://abhishekshirsagar.github.io/25four/

The repository and preview are public. Pushes to `main` build and deploy through
[GitHub Actions](.github/workflows/pages.yml). The workflow sets
`VITE_BASE_PATH=/25four/`; local development keeps the default `/` base path.

## Light Sources

Coordinates are local to the normalized lamp, with its floor at `y=0` and total
height `3.2`. The bulb mesh and main point light are centered at `[0, 2.05, 0]`,
inside the shade above the base. A secondary spill light is lower, at
`[0, 1.35, 0.2]`. The shade's material adds simulated transmission around the
bulb, and the floor pool is a separate shader. These activate at floor contact;
the lighting is a visualization rather than a physical simulation.

## Runtime Performance

- The canvas renders on demand rather than continuously. After lighting settles, the completed lamp stops requesting frames.
- The lit-lamp-to-details handoff uses browser-native smooth scrolling with a 650 ms guided-input guard. The completed presentation and memoized scene stay fixed while leaving the story, with no per-frame scroll writes or style updates. The sticky presentation uses a compositor layer; canvas scroll-position measurements are disabled, but element-size observation remains enabled.
- Guided transitions retain wheel, touch, and keyboard ownership until completion, preventing native scrolling from fighting the final exit. Native scrolling resumes afterward.
- Lamp shaders are precompiled once before scene readiness, keeping cold shader setup out of the first printing interaction. The opening poster remains available while that completes.
- The white shade filament is capped at 24 requested frames per second while visible; hidden tabs and off-screen scenes pause rendering.
- Shadow maps update in the same render frame as model changes, then stay cached during the idle filament loop.
- Pixel ratio is capped at 1.25, and the renderer no longer forces a high-performance GPU preference.
- Standard material shading avoids unnecessary clearcoat and sheen calculations. Internal glow and bloom remain.
- The parsed STL is normalized once in place, avoiding a duplicate copy of its vertex buffers. The original source file on disk is unchanged.
- The rendered index excludes 8,877 cross-brace triangles, while preserving the base and outer shell. The original STL still contains its full 399,942 triangles.

A local render-counter check recorded zero new frames over 1.1 seconds for the
settled final lamp and for a hidden tab after its in-flight frame completed.
The filament loop resumed when visible. These are rendering checks, not a
cross-device CPU/battery benchmark. The original approximately 20 MB STL and its
399,942 triangles remain the main first-load/active-draw cost; offline geometry
decimation or compression is still a possible follow-up.

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

The supplied STL is approximately 19 MB and contains 399,942 triangles. Vite fingerprints it as a separate asset. A production-optimized model could reduce first-load bandwidth; the original is preserved here. No checkout, speculative finishes, or placeholder contact destination is included.