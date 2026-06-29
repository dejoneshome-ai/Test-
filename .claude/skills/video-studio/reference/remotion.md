# Remotion reference

Remotion renders video from React. Each frame is a render of your component at a
given `frame` number. You animate by reading `useCurrentFrame()` and mapping it
to styles. Deterministic input → deterministic frames → re-renderable at any
resolution.

Docs: https://www.remotion.dev/docs

## Install / scaffold

Use `scripts/scaffold_remotion.sh <dir>` to generate a working project. To do it
manually:

```bash
npm create video@latest my-video -- --blank   # interactive avoided with --blank
cd my-video && npm install
```

Core deps: `remotion`, `@remotion/cli`, `react`, `react-dom`. Useful add-ons:
`@remotion/transitions`, `@remotion/google-fonts`, `@remotion/media-utils`,
`@remotion/shapes`, `@remotion/lottie`, `@remotion/captions`, `@remotion/gif`.

## Project shape

```
src/
  index.ts          # registerRoot(Root)
  Root.tsx          # <Composition/> registrations (the "timeline catalog")
  MyVideo.tsx       # a composition component
remotion.config.ts  # render config (codec, image format, concurrency)
```

`Root.tsx` declares each renderable composition with its dimensions/fps/duration:

```tsx
import { Composition } from "remotion";
import { MyVideo } from "./MyVideo";

export const Root = () => (
  <>
    <Composition
      id="MyVideo"
      component={MyVideo}
      durationInFrames={30 * 10}   // 10s at 30fps
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ title: "Hello" }}
    />
  </>
);
```

`durationInFrames = seconds * fps`. Vertical: `width={1080} height={1920}`.

## Animation primitives

### useCurrentFrame + interpolate

`interpolate(frame, inputRange, outputRange, options)` maps a frame to any value.
**Always clamp** unless you want extrapolation.

```tsx
import { useCurrentFrame, interpolate, Easing } from "remotion";

const frame = useCurrentFrame();
const opacity = interpolate(frame, [0, 20], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.out(Easing.cubic),
});
```

### spring — the professional default for entrances

Natural, physically-based motion. Prefer this over linear fades for anything that
"enters" (titles, cards, logos).

```tsx
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

const frame = useCurrentFrame();
const { fps } = useVideoConfig();
const scale = spring({
  frame,
  fps,
  config: { damping: 200, mass: 1, stiffness: 100 }, // damping↑ = less bounce
  durationInFrames: 30,
});
// apply: transform: `scale(${scale})`
```

Tunable feel: punchy entrance → lower `damping` (e.g. 12) for overshoot; smooth
settle → high `damping` (200). See `reference/professional.md` for which to use.

## Sequencing & timing

`<Sequence>` shifts the timeline for its children so each scene animates from its
own frame 0.

```tsx
import { Sequence, Series } from "remotion";

// manual placement
<Sequence from={0} durationInFrames={90}><Intro /></Sequence>
<Sequence from={90} durationInFrames={120}><Body /></Sequence>

// or sequential auto-placement
<Series>
  <Series.Sequence durationInFrames={90}><Intro /></Series.Sequence>
  <Series.Sequence durationInFrames={120}><Body /></Series.Sequence>
</Series>
```

`<AbsoluteFill>` is a full-frame absolutely-positioned div — the standard layer
container. Stack them for background/midground/foreground.

## Transitions

```tsx
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}><SceneA /></TransitionSeries.Sequence>
  <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
  <TransitionSeries.Sequence durationInFrames={60}><SceneB /></TransitionSeries.Sequence>
</TransitionSeries>
```

Available presentations: `fade`, `slide`, `wipe`, `flip`, `clockWipe`, `none`.
Keep transitions short (10–20 frames). Long transitions read as amateur.

## Media: video, image, audio

```tsx
import { Video, Img, Audio, staticFile, Series } from "remotion";

<Img src={staticFile("logo.png")} />
<Video src={staticFile("clip.mp4")} startFrom={30} endAt={120} volume={0.6} />
<Audio src={staticFile("music.mp3")} volume={(f) =>
  interpolate(f, [0, 30], [0, 1], { extrapolateRight: "clamp" })} />  // fade-in
```

Put files in `public/`, reference with `staticFile()`. For audio waveform/length
use `@remotion/media-utils` (`getAudioData`, `visualizeAudio` for music bars).

## Fonts

```tsx
import { loadFont } from "@remotion/google-fonts/Inter";
const { fontFamily } = loadFont();
// style={{ fontFamily }}
```

Or self-host: put a `.woff2` in `public/`, inject `@font-face` via `<style>`.

## Data-driven video

Pass `defaultProps` and override per-render with `--props`. This is how you make
one template produce many videos (personalized intros, reports, batches).

```bash
npx remotion render MyVideo out/v1.mp4 --props='{"title":"Q3 Results","value":42}'
# or from a file:
npx remotion render MyVideo out/v2.mp4 --props=./data/run.json
```

Animate numbers counting up:

```tsx
const value = Math.round(interpolate(frame, [0, 60], [0, target],
  { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
```

## Rendering

```bash
# studio (live preview in browser)
npx remotion studio

# render to mp4
npx remotion render <CompositionId> out/video.mp4

# common flags
--codec=h264                 # default; also h265, vp8, vp9, prores, gif
--crf=18                     # quality (lower=better, 18 is visually lossless-ish)
--scale=0.5                  # DRAFT: half-res fast preview
--frames=0-60                # render a subset to test
--concurrency=4              # parallelism
--pixel-format=yuv420p       # delivery-safe (config below sets it too)
--props='{"k":"v"}'          # data-driven
--still <Comp> out/poster.png --frame=30   # poster/thumbnail
```

Prefer `scripts/render.sh <dir> [--draft]` which wires draft vs final for you.

## remotion.config.ts (delivery-safe defaults)

```ts
import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");   // critical for player compatibility
Config.setCrf(18);
Config.setConcurrency(null);        // auto
```

## Gotchas

- Animation must be a pure function of `frame` — no `setTimeout`, `Date.now()`,
  or unseeded `Math.random()` (use `random()` from remotion for determinism).
- Set `durationInFrames` to cover your whole timeline or the tail gets cut.
- Test layout with `--frames=0-1` and a `--still` before a full render.
- Chrome download happens on first render; in this environment Chromium is
  pre-installed — Remotion may need `--browser-executable=$(which chromium)` if
  it tries to download.
