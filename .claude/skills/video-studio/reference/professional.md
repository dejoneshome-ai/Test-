# The craft layer — what makes video look professional

Tools render frames; *these choices* are the difference between "made a video" and
"this looks professional". Read before finalizing. The fastest amateur tells are:
linear fades, mid-frame chaos, weak type hierarchy, clipped/uneven audio, and
elements touching the edges. Fix those first.

## Motion & timing

- **Never animate linearly.** Real things accelerate and decelerate. Use easing
  (`Easing.out(Easing.cubic)` in Remotion) or `spring`. Linear motion is the #1
  amateur tell.
- **Ease-out for entrances, ease-in for exits.** Things arrive fast then settle;
  leave slow then accelerate away.
- **The ~12–20 frame rule.** Most UI/title entrances feel right around
  0.4–0.7s (12–20 frames at 30fps). Faster feels snappy/modern; slower feels
  cinematic. Avoid 2s+ entrances unless deliberately luxurious.
- **Stagger, don't synchronize.** When multiple elements enter, offset each by
  2–4 frames. Simultaneous = mechanical; staggered = alive.
- **Overshoot sparingly.** A small spring overshoot (damping ~12–18) adds energy
  to logos/CTAs. Overuse looks gimmicky; for body content use high damping (200).
- **Hold before cut.** Let a finished state breathe for ≥0.5s before the next
  scene. Cutting on the exact frame motion ends feels rushed.
- **Match cut rhythm to music.** Cut on beats. Even rough beat-syncing reads as
  intentional and professional.

## Typography

- **Hierarchy: 3 levels max.** Title / subtitle / caption. Distinguish by size
  and weight, not many fonts. One or two font families total.
- **Big and bold for video.** Video text is read at a glance, often on phones.
  Title type ~6–10% of frame height. Thin weights vanish on motion/compression.
- **Tracking & leading.** Tighten letter-spacing slightly on large display type
  (-0.01 to -0.02em); generous line-height (1.1–1.3) on multi-line.
- **Contrast & legibility over imagery.** Put a scrim (semi-transparent gradient/
  box) or subtle shadow behind text on footage. Never white text on a busy bright
  background with no separation.
- **Kinetic typography:** animate by word or line, not character-by-character for
  long text (too slow). Mask/clip reveals look more premium than opacity fades.

## Color

- **Have an intent.** Warm = friendly/energetic; cool/desaturated = serious/tech;
  high-contrast punchy = sports/hype. Pick one and grade toward it.
- **Consistency across clips.** When concatenating real footage, grade each clip
  toward a shared look (white balance + contrast) so cuts aren't jarring.
- **Subtle is professional.** A gentle `eq` (contrast 1.05–1.1, saturation
  1.05–1.15) or a LUT at reduced strength beats a heavy filter.
- **Limited palette for graphics.** 1 accent + 1–2 neutrals + background. Reuse
  the brand accent for emphasis and CTAs.
- **Protect skin tones & whites.** Don't oversaturate faces; don't clip
  highlights to pure white.

## Audio (half the perceived quality)

- **Loudness targets (integrated LUFS):** YouTube/Spotify ≈ **-14**, broadcast
  -23, podcast -16, TikTok/IG roughly -14. Normalize with `loudnorm` (recipe in
  ffmpeg.md). Inconsistent loudness is the audio version of unstable color.
- **True peak ≤ -1 dBTP** to avoid clipping on lossy playback.
- **Duck music under voice** (sidechain recipe). Music bed typically sits
  15–25 dB below voice; ~-20 to -30 LUFS for the bed alone.
- **Fade in/out.** Always fade music in (~0.5s) and out (~1–2s). Hard starts/stops
  sound broken.
- **No dead air, no abrupt ends.** End on a held note or clean fade, not a cut.

## Composition & safe areas

- **Title-safe = inner 90%, action-safe = inner 93%.** Keep text and logos within
  the inner 90% so nothing gets cropped by device chrome.
- **Vertical (9:16) UI-safe zones.** TikTok/Reels overlay buttons on the right and
  captions/handle at the bottom. Keep key content in the **center**, away from the
  bottom ~15% and right ~12%.
- **Rule of thirds / breathing room.** Don't center everything; don't crowd edges.
  Negative space reads as premium.
- **Consistent margins.** Pick one margin unit (e.g. 6% of width) and reuse it for
  every overlay/lower-third.

## Pacing & structure

- **Hook in the first 1–2 seconds**, especially for social. State the payoff or
  show the most interesting frame immediately.
- **One idea per scene.** If a viewer can't summarize a shot in one phrase, split
  it.
- **Shorter than you think.** Trim every pause. Most amateur videos are 30% too
  long. Cut, then cut again.
- **Consistent transition vocabulary.** Pick 1–2 transition types and reuse them.
  Mixing many transition styles looks chaotic.

## Pre-delivery checklist

- [ ] Resolution & aspect ratio match the target platform (no stretching).
- [ ] `-pix_fmt yuv420p` on final H.264 export.
- [ ] Audio normalized to target LUFS; peaks ≤ -1 dBTP; fades present.
- [ ] All text within title-safe; nothing under social UI zones.
- [ ] No linear fades on hero motion; entrances eased/sprung and staggered.
- [ ] Color consistent across all cuts.
- [ ] First 2 seconds hook.
- [ ] `ffprobe` confirms duration/streams; `+faststart` set for web.
- [ ] Filename and resolution reported accurately to the user.
