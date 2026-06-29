# Flow Field — Generative Art Playground

An interactive, real-time generative-art toy built as a **single self-contained HTML file**.
No build step, no dependencies, no network — just open `index.html` in any modern browser.

![status](https://img.shields.io/badge/dependencies-none-brightgreen)
![status](https://img.shields.io/badge/build-not%20required-blue)

## What it does

Thousands of particles drift through an invisible vector field whose direction is
driven by **Perlin noise** (implemented from scratch in ~30 lines). The result is
the smooth, organic, flowing motion you see in classic creative-coding sketches —
running live at 60fps on the HTML5 canvas.

## Features

- **Real-time controls** — tune particle count, flow scale, speed, trail length, and curl on the fly
- **Five hand-picked palettes** — Aurora, Ember, Forest, Mono, Candy
- **Mouse interaction** — move to push the flow apart, click to pull it together
- **Additive color blending** for glowing, layered trails
- **Save PNG** — export your favorite frame as a wallpaper
- **Keyboard shortcuts** — `Space` to pause, `H` to hide the panel
- **Touch support** and a live FPS meter
- Re-seeds the noise field on every load, so no two sessions look alike

## Run it

```bash
# just open the file — that's the whole setup
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

Or serve it locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## How it works

| Piece | Idea |
|-------|------|
| **Vector field** | Each point in space maps to an angle via `Perlin(x·scale, y·scale + z)`. The slowly-advancing `z` makes the whole field breathe over time. |
| **Particles** | Lightweight points that sample the field at their position, step along it, and respawn when they leave the screen or age out. |
| **Trails** | Instead of clearing the canvas each frame, it's painted with a translucent black — older strokes fade gradually. |
| **Glow** | Strokes use the `lighter` composite mode so overlapping paths accumulate brightness. |

Everything lives in `index.html`: the Perlin implementation, the simulation, and
the UI are all in one ~400-line file with no external assets.
