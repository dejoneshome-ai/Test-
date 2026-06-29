# Export presets

Final master settings per platform. All H.264 unless noted; always include
`-pix_fmt yuv420p` and (for web/social) `-movflags +faststart`.

## Universal H.264 web/social master

```bash
ffmpeg -i in.mp4 -c:v libx264 -profile:v high -level 4.2 -crf 18 -preset slow \
  -c:a aac -b:a 320k -ar 48000 -movflags +faststart -pix_fmt yuv420p out.mp4
```

`-crf 18` ≈ visually lossless. Use 20–23 for smaller files. Lower preset
(`slower`/`veryslow`) = smaller file, longer encode.

## Platform table

| Platform | Resolution | Aspect | FPS | Codec | Notes |
|----------|-----------|--------|-----|-------|-------|
| YouTube 1080p | 1920×1080 | 16:9 | 24/30/60 | H.264 crf 18 | bitrate ~8–12 Mbps if CBR |
| YouTube 4K | 3840×2160 | 16:9 | 30/60 | H.264/H.265 | ~35–45 Mbps |
| TikTok | 1080×1920 | 9:16 | 30 | H.264 crf 20 | ≤ 60–180s; keep content center-safe |
| Instagram Reels | 1080×1920 | 9:16 | 30 | H.264 crf 20 | ≤ 90s |
| YouTube Shorts | 1080×1920 | 9:16 | 30/60 | H.264 | ≤ 60s |
| Instagram feed | 1080×1350 | 4:5 | 30 | H.264 | 4:5 maximizes feed real estate |
| Instagram square | 1080×1080 | 1:1 | 30 | H.264 | |
| X / Twitter | 1280×720 | 16:9 | 30 | H.264 | ≤ 140s, ≤ 512MB |
| LinkedIn | 1920×1080 | 16:9 | 30 | H.264 | captions recommended (muted autoplay) |
| Web hero/loop | 1920×1080 | 16:9 | 30 | H.264 + H.265/VP9 | mute, loop, small file |

## Editing intermediate (avoid generation loss)

When you'll re-encode again later, render to a high-quality intermediate, not a
delivery codec:

```bash
# ProRes 422 HQ (large, edit-friendly)
ffmpeg -i in.mov -c:v prores_ks -profile:v 3 -c:a pcm_s16le intermediate.mov

# or visually-lossless H.264
ffmpeg -i in.mov -c:v libx264 -crf 12 -preset medium -c:a aac -b:a 320k inter.mp4
```

## Remotion render flags by target

```bash
# YouTube 1080p
npx remotion render Main out/yt1080.mp4 --codec=h264 --crf=18 --pixel-format=yuv420p

# TikTok/Reels (composition itself must be 1080×1920)
npx remotion render Vertical out/tiktok.mp4 --codec=h264 --crf=20 --pixel-format=yuv420p

# 4K (composition 3840×2160, or render at scale=2 from a 1080 comp)
npx remotion render Main out/yt4k.mp4 --codec=h264 --crf=18 --scale=2 --pixel-format=yuv420p

# transparent overlay (alpha) — for compositing over footage later
npx remotion render LowerThird out/lt.mov --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le

# animated GIF / WebM for web
npx remotion render Loop out/loop.webm --codec=vp9
npx remotion render Loop out/loop.gif --codec=gif --every-nth-frame=2
```

## Web embedding tips

- Provide H.264 MP4 as the baseline; optionally add VP9/AV1 WebM for smaller
  size in supporting browsers via multiple `<source>` tags.
- For background/hero loops: `muted loop playsinline autoplay`, keep < ~3MB,
  short loop (5–10s), `+faststart`.
- Always offer captions (burned-in or `.vtt`) — most social autoplay is muted.
