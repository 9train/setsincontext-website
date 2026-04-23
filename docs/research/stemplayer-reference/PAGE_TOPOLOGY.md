# Stem 2 Page Topology

## Scope note

- The live `stem2` URL is embedded inside a larger Stem application shell, so the DOM includes persistent navigation and player controls in addition to the product-story sections.
- For the DDJ redesign, the useful reference is the product-story rhythm and section treatment, not the full Stem app feature set.

## Top-to-bottom structure

1. Fixed top chrome
   - Sparse navigation, minimal iconography, very light visual weight.
   - Interaction model: persistent and fixed.

2. Hardware-first hero field
   - Large warm background with floating product objects and enormous whitespace.
   - Interaction model: mostly static framing, with hover polish on some items.

3. Hero title and supporting product media
   - CSS references show a dedicated `stem-2-hero` layer with centered heading and a vignette over media.
   - Interaction model: largely visual, centered, and immediate.

4. Scroll-sequence material section
   - `scroll-sequence__fixed` drives a full-screen sticky/fixed product walkthrough.
   - Short uppercase copy is paired with centered imagery.
   - Interaction model: scroll-driven.

5. Full-width video sections
   - Edge-to-edge autoplay media with top or bottom text overlays.
   - Interaction model: time-driven media with scroll placement.

6. Listening-mode card section
   - Three-card style row with in-view fade-up behavior and soft hover scaling.
   - Interaction model: in-view reveal plus hover.

7. Additional product-story sections
   - The CSS references closer-to-music, orbit, and powered-by demo layouts.
   - Interaction model: a mix of centered media, scroll framing, and restrained reveal animation.

8. Specifications accordion
   - Full-width section with centered section heading and staggered row reveals.
   - Interaction model: click-driven accordion plus in-view stagger.

9. FAQ accordion
   - Matches the specs section structure and pacing.
   - Interaction model: click-driven accordion plus in-view stagger.

10. Closing section
   - Minimal closing copy, another media block, and a fixed bottom CTA.
   - Interaction model: fixed CTA plus closing text reveal.

11. Persistent app player
   - Bottom-fixed audio controls from the broader product shell.
   - Interaction model: application-level persistence. Not suitable for this DDJ site.

## Layout patterns worth translating

- Warm neutral page field with the product treated as the darkest, heaviest object.
- Very short headlines and supporting paragraphs.
- Strong separation between hero, product logic, and dense factual sections.
- Specs and FAQ treated as premium information sections rather than generic FAQ cards.
- Rounded surfaces with soft shadows instead of hard dashboard boxes.

## Layout patterns to avoid copying literally

- Stem product photos and floating accessories.
- Stem player controls, buy flows, pricing treatment, and branded icon set.
- Embedded audio-player chrome and subscription messaging.
- Exact section names, exact copy cadence, or exact CTA positioning.

## Translation plan for the DDJ-FLX6 site

1. Replace the floating Stem hardware field with the actual DDJ-FLX6 board SVG centered in a large tactile stage.
2. Keep the top chrome sparse and fixed, but make it product-accurate for host, viewer, debugger, and specs anchors.
3. Translate the "four stems" product logic into the real FLX6 event chain:
   - raw MIDI
   - normalized target
   - board target
   - mode context
4. Turn the dense product sections into FLX6-specific host/viewer, debugger, mapping safety, roadmap, specs, and FAQ sections.
5. Keep claims bounded to what the repo already supports and label any local runtime paths as documentation, not hosted features.
