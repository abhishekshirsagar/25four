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

The first screen follows Figma frame 8:1956: a solid indigo arch, a subtle field of original white motifs, and a centered white KAMAN / BAGRU title. The poem and title form one balanced lockup, with a quieter pattern and more space below the navigation. A matching static poster appears immediately while local assets load; it is hidden before any animation begins. After the model is ready, the opening holds for 2.2 seconds and transitions over 2.4 seconds with gentle acceleration and deceleration. One SVG-derived surface owns the filled form and its outline throughout the motion. The title clears first; the same surface shrinks and turns 45 degrees in the later spin direction, its fill and pattern recede while its edge stays visible, and the story appears after the graphic clears its text area. The down-arrow uses the same 2.4-second duration and easing.

After the opening, scrolling has three story stops: the outline, the fully printed shade with no base, and the complete illuminated lamp with final copy. There is no separate assembled-but-unlit stop. Wheel, touch, Page Up/Down, arrows, and chapter controls use the same destinations. Printing travel runs at half its previous speed, with eased durations of approximately 2.4-4.53 seconds; the opening handoff uses its own gentle 2.4-second curve and Back to top is not slowed. Tiny trackpad reversals are ignored; deliberate reverse gestures remain available. Native scrolling resumes below the product experience. Reduced motion uses immediate checkpoint changes.

The flat outline rests at 45 degrees, then follows a controlled hinge into the shade's bottom rim. Its target vertices compensate for the flat turn so the final rim remains aligned with the actual lamp. Printing starts while the guide is still visible; the guide follows the same scale, position, and rotation as the first layers and fades only after solid geometry is present. This avoids an empty handoff or a detached lower rim. While printing, the lamp turns 180 degrees around its upright axis. At the second stop, the shade is enlarged and lowered into the available space, with a white filament looping around its top edge. The internal support column and its shadow are excluded during printing. On the next scroll, the base drops and the shade shrinks and lifts simultaneously, sharing one continuous easing value with no intermediate pause. The base starts inside the shade, concealed above its lower edge, and remains at its final size and floor-relative position independently of the shade's scale. It emerges at full color without fading in or intersecting through the shade's sides; the shadow shader uses the same concealment. A faint, broad ground shadow is already present beneath the shade; it tightens and strengthens as the base approaches the floor, avoiding a sudden shadow pop. The filament stops as the base emerges. Floor contact switches on the lamp and ground illumination in the same frame and triggers the final copy, with no delayed light ramp. The same sequence reverses when scrolling upward.

Printing travel responds with a small initial velocity rather than a long
stationary ease-in, while retaining the existing overall duration. Small scroll
gestures are accepted sooner, with a shorter trackpad-tail guard. The separate
opening transition keeps its gentle 2.4-second easing.

All three story stages use a centered graphic or lamp above centered text. Its starting orientation is offset so the preserved 180-degree print rotation ends with the cable notch at the rear. At the final light checkpoint, the background stays white with the original indigo text and navigation, while the lamp illuminates with internal light falloff, bloom, and a restrained, softly warm pool of light on the ground. The shade retains its detail, and the floor pool has reduced yellow saturation and intensity. The pool fades before its plane edges. There is no light switch.

The opening artwork remains full-width. Navigation uses the same fixed 960 px maximum container from the opening onward, with Shop now aligned to its right edge. The separate header up-arrow is removed; the studio mark and footer arrow still return to the top. Shop now currently opens the local product specifications, not a checkout. The model composition, story, specifications, and footer also have a 960 px maximum width. The specifications form a full-width indigo band with white text, soft blue labels, and white line artwork. The canvas remains viewport-wide throughout, avoiding resize-induced camera jumps and leaving room for bloom. Scrolling upward reverses the story and restores the opening without restarting autoplay immediately.

On phones, model zoom is reduced and the story has more model-to-text clearance.
Compact viewports use tighter typography without a forced oversized sticky height.
The opening arch's midpoint sits at the viewport's bottom edge, leaving its lower
half off-screen; the loading poster and the animated surface share that alignment.

The landing and story share one sticky viewport and one persistent Three.js canvas. A single mesh, sampled from the original Figma SVG through SVGLoader, renders both fill and edge. Its planar vertices morph toward the STL perimeter during the 3D tilt rather than swapping graphics. Actual camera projection determines screen position and scale in the stable viewport. The white backdrop is rendered as a linear compositor pass before bloom and output conversion. The source SVG and STL assets are unchanged.

The 3D scene is lazy-loaded separately. Models, fonts, and graphic motifs are local; no remote image, HDR, or model service is required. Reduced-motion preferences disable autoplay, rotation, zoom, and moving filament; entering the story displays the complete, centered, stationary lamp. A static illustration with retry is available if WebGL fails.

## Hosting

Public preview: https://abhishekshirsagar.github.io/25four/

The repository and preview are public. Pushes to `main` build and deploy through
[GitHub Actions](.github/workflows/pages.yml). The workflow sets
`VITE_BASE_PATH=/25four/`; local development keeps the default `/` base path.

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

The second writing pass moves from an arch at table-lamp scale, to curves built
layer by layer, to an unhurried evening. The opening is intentionally brief;
body text supplies the architectural, manufacturing, and Bagru context.
Specifications remain factual, and utility labels describe their actions.

References read for approach, not copied wording:
- [Gantri Maskor](https://www.gantri.com/products/10036/maskor-table-light-by-muka-design-lab): connect a distinctive form and its origin to how light feels at home.
- [Audo Copenhagen](https://audocph.com/): domestic context and a restrained editorial tone.
- [Copywriting skill](https://skills.sh/coreyhaines31/marketingskills/copywriting) and [copy-editing skill](https://skills.sh/coreyhaines31/marketingskills/copy-editing): specificity, honest claims, voice consistency, and focused editing passes. Guidance was read; no skill package was installed.
- [Nielsen Norman Group](https://www.nngroup.com/articles/concise-scannable-and-objective-how-to-write-for-the-web/): concise, scannable, factual web writing.

## Before Launch

Product specifications are transcribed from the supplied Figma packaging: 160 mm high, 200 mm wide, PLA, 3000K, and 220-240V AC / 50Hz. Verify these against the production lamp before launch. The rendered materials and illumination are a visualization, not an electrical simulation.

Add the official purchase destination for Shop now before launch. No price,
availability, delivery promise, warranty, or checkout has been invented here.

The supplied STL is approximately 19 MB and contains 399,942 triangles. Vite fingerprints it as a separate asset. A production-optimized model could reduce first-load bandwidth; the original is preserved here. No checkout, speculative finishes, or placeholder contact destination is included.