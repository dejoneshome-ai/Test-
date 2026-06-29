# video-studio skill

A Claude Code skill for creating, editing, and mastering **professional video**
programmatically — inspired by Anthropic's Remotion skill, extended with a full
FFmpeg editing/mastering pipeline and a "craft layer" of professional practices.

## What it does

- **Create** motion graphics, titles, explainers, kinetic typography, data-driven
  and social videos with **Remotion** (React → video).
- **Edit** real footage with **FFmpeg**: trim, concat, crossfade, overlay/PiP,
  aspect-ratio conversion, captions, audio mixing/ducking, color, speed, GIFs.
- **Polish** to a professional finish: easing/timing, type hierarchy, color
  intent, audio loudness (LUFS), safe areas, pacing.
- **Export** with correct per-platform settings (YouTube, TikTok/Reels/Shorts,
  Instagram, X, LinkedIn, web).

## Layout

```
SKILL.md                     entry point + workflow (Claude reads this first)
reference/remotion.md        Remotion patterns & rendering
reference/ffmpeg.md          copy-paste editing recipes
reference/professional.md    the craft layer (read before finalizing)
reference/export.md          platform export presets
scripts/check_env.sh         verify Node/npm/FFmpeg/fonts
scripts/scaffold_remotion.sh create a working Remotion project
scripts/render.sh            render (draft or final) with verification
```

## Usage

Just ask in natural language — the skill auto-triggers:

> "Make me a 10-second animated intro for my channel, 16:9."
> "Trim this clip to 5–12s, add captions from subs.srt, and music."
> "Turn this landscape video into a vertical TikTok with a blurred background."
> "Render the explainer in 4K with my logo in the corner."

## Requirements

- Node 18+ and npm (Remotion)
- FFmpeg + ffprobe (editing/mastering) — `apt-get install ffmpeg` / `brew install ffmpeg`
- A Chromium/Chrome (Remotion rendering; auto-downloaded if absent)
