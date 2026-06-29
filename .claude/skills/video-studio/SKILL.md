---
name: video-studio
description: >-
  Create, edit, and polish professional videos programmatically. Use this skill
  whenever the user wants to make a video, animation, motion graphic, explainer,
  product demo, social clip (Reels/Shorts/TikTok), title sequence, slideshow,
  data-driven animation, or wants to edit/trim/concatenate/caption/color-grade/
  add-audio-to existing video files. Generation is code-driven with Remotion
  (React), editing and final mastering use FFmpeg. Triggers include: "make a
  video", "create an animation", "edit this clip", "add captions", "add music",
  "render in 4K", "make it vertical for TikTok", "professional intro".
---

# Video Studio

A code-first pipeline for producing broadcast-quality video. Two engines:

1. **Remotion** — render video *from code*. React components become frames; you
   get pixel-perfect motion graphics, data-driven animation, text, transitions,
   and audio, all version-controllable and re-renderable at any resolution.
2. **FFmpeg** — edit and master *existing footage*. Trim, concatenate, overlay,
   transition, color-grade, mix audio, burn captions, transcode, and compress.

Use Remotion when the content is generated (titles, explainers, motion graphics,
animated data, kinetic typography). Use FFmpeg when the source is real footage or
when finishing/combining anything. They compose: render scenes in Remotion, then
assemble and master with FFmpeg.

## When to use which

| Goal | Engine |
|------|--------|
| Animated intro / title sequence / lower-thirds | Remotion |
| Explainer or product demo with motion graphics | Remotion |
| Kinetic typography, captions-as-design, data viz animation | Remotion |
| Slideshow from images with Ken Burns + music | Remotion (or FFmpeg) |
| Trim / cut / splice real footage | FFmpeg |
| Concatenate clips, crossfades between real clips | FFmpeg |
| Color grade, stabilize, denoise, speed ramp | FFmpeg |
| Burn in subtitles from an `.srt` | FFmpeg |
| Mix/duck background music under voiceover | FFmpeg |
| Transcode, compress, make platform-specific exports | FFmpeg |
| Generated scenes + real footage in one timeline | Remotion → FFmpeg |

## Workflow

Always follow this order. Do not skip the brief — it determines every later
choice (aspect ratio, duration, codec).

1. **Brief.** Establish: purpose, platform/aspect ratio, target duration, style
   tone, whether assets (footage, logo, music, script) exist, and where the
   output should go. If the user hasn't said, infer sensible defaults from the
   platform table below and state them. Don't over-interrogate — one round of
   clarifying at most.
2. **Check tooling.** Run `scripts/check_env.sh`. It reports Node, npm, FFmpeg,
   and fonts, and tells you what to install. Don't assume tools exist.
3. **Pick the engine** using the table above.
4. **Scaffold (Remotion path).** Run `scripts/scaffold_remotion.sh <project-dir>`
   to create a ready-to-render Remotion project with a sensible composition,
   then edit the React components. See `reference/remotion.md`.
5. **Edit / master (FFmpeg path).** Build the command from
   `reference/ffmpeg.md`. Prefer the recipes there over inventing flags.
6. **Apply professional polish.** Pull from `reference/professional.md`:
   easing, timing, type, color, audio levels, safe areas. This is what makes
   output look *professional* rather than just "made".
7. **Render at draft quality first** (low res / low CRF-speed) to verify timing
   and layout, then render final. Never burn a long final render before the
   user has seen a draft of the timing.
8. **Master & export** per platform with `reference/export.md` settings.
9. **Show the result.** Use `SendUserFile` to deliver the rendered file (and a
   poster frame for long renders). Report exact path, resolution, duration, and
   file size.

## Reference files (read on demand — don't load all up front)

- `reference/remotion.md` — Remotion project structure, compositions, animation
  primitives (`interpolate`, `spring`), sequencing, transitions, audio, fonts,
  data-driven video, and rendering commands.
- `reference/ffmpeg.md` — copy-paste FFmpeg recipes for every common edit:
  trim, concat, crossfade, overlay/PiP, crop/scale for aspect ratios, captions,
  audio mixing/ducking, speed, color, screenshots, GIFs.
- `reference/professional.md` — the craft layer: easing curves, the 12-frame
  rule, type hierarchy, color grading intent, audio loudness targets (LUFS),
  title/action safe areas, pacing. Read this before finalizing anything.
- `reference/export.md` — platform-specific master settings (YouTube, TikTok/
  Reels/Shorts, Instagram feed, X, LinkedIn, web/H.264, ProRes) with exact
  resolutions, codecs, bitrates, and FFmpeg/Remotion flags.

## Scripts

- `scripts/check_env.sh` — verify Node/npm/FFmpeg/fonts; prints install hints.
- `scripts/scaffold_remotion.sh <dir>` — create a working Remotion project
  (package.json, Root, a Title + Scene composition, render npm scripts).
- `scripts/render.sh <dir> [--draft]` — render a Remotion project to MP4;
  `--draft` does fast low-res for timing checks.

## Defaults & platform presets

If the user doesn't specify, use these.

| Platform | Aspect | Resolution | FPS | Max length cue |
|----------|--------|-----------|-----|----------------|
| YouTube (landscape) | 16:9 | 1920×1080 (or 3840×2160) | 30 | any |
| TikTok / Reels / Shorts | 9:16 | 1080×1920 | 30 | ≤ 60–90 s |
| Instagram feed | 1:1 or 4:5 | 1080×1080 / 1080×1350 | 30 | ≤ 60 s |
| X / Twitter | 16:9 | 1280×720 | 30 | ≤ 140 s |
| Web hero / loop | 16:9 | 1920×1080 | 30 | short loop |

Default codec for delivery: **H.264 (yuv420p), `-crf 18`, `-preset slow`,
`+faststart`, AAC 320k audio**. Use this unless a platform table or the user
says otherwise. For editing intermediates, use a lossless/visually-lossless
intermediate (ProRes or `-crf 12`) to avoid generation loss.

## Hard rules

- **Verify before claiming done.** After every render, run `ffprobe` (recipe in
  `reference/ffmpeg.md`) and confirm duration, resolution, and that audio/video
  streams exist. Report the real numbers, not intended ones.
- **Draft before final.** Show timing at low quality before committing to a long
  final render.
- **yuv420p for delivery.** Many players (QuickTime, browsers, social) reject
  other pixel formats. Always `-pix_fmt yuv420p` on final H.264 exports.
- **Respect aspect ratio.** Never stretch. Crop or pad (letterbox/pillarbox)
  with the recipes provided.
- **Audio levels matter.** Normalize to the platform's LUFS target
  (`reference/professional.md`) — a "professional" video is as much about sound.
- **Don't fabricate footage you don't have.** If the user references source
  files, confirm they exist before scripting against them.
- **Licensing.** If you fetch music/stock, only use clearly licensed/royalty-free
  sources and tell the user the license. Never assume rights.
