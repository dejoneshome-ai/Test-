# FFmpeg recipes

Copy-paste, parameterize, run. Prefer these over inventing flags. All assume
`input.mp4` etc.; swap names. For delivery always end with `-pix_fmt yuv420p`.

## Inspect first (always)

```bash
# human summary
ffprobe -hide_banner input.mp4

# machine-readable: duration, resolution, codecs, fps
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,codec_name \
  -show_entries format=duration,bit_rate -of default=noprint_wrappers=1 input.mp4
```

Use this to **verify** every output (duration/resolution/streams) before saying
done.

## Trim / cut

```bash
# fast, no re-encode (cuts at nearest keyframe — may be slightly off)
ffmpeg -ss 00:00:05 -to 00:00:12 -i input.mp4 -c copy out.mp4

# frame-accurate (re-encodes; put -ss AFTER -i for accuracy)
ffmpeg -i input.mp4 -ss 00:00:05 -to 00:00:12 \
  -c:v libx264 -crf 18 -preset slow -c:a aac -b:a 320k -pix_fmt yuv420p out.mp4
```

## Concatenate

Same codec/resolution/fps → concat demuxer (fast, no re-encode):

```bash
printf "file '%s'\n" clip1.mp4 clip2.mp4 clip3.mp4 > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy out.mp4
```

Different sources → normalize then concat with the filter (re-encodes):

```bash
ffmpeg -i a.mp4 -i b.mp4 -filter_complex \
  "[0:v]scale=1920:1080,setsar=1,fps=30[v0];[1:v]scale=1920:1080,setsar=1,fps=30[v1];\
   [v0][0:a][v1][1:a]concat=n=2:v=1:a=1[v][a]" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p out.mp4
```

## Crossfade between two clips (video + audio)

```bash
# 1s crossfade starting at t=4s of the first clip
ffmpeg -i a.mp4 -i b.mp4 -filter_complex \
  "[0:v][1:v]xfade=transition=fade:duration=1:offset=4[v];\
   [0:a][1:a]acrossfade=d=1[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p out.mp4
```

`xfade` transitions include: `fade`, `wipeleft/right/up/down`, `slideleft`,
`circleopen`, `dissolve`, `pixelize`, `radial`. Keep `duration` ≤ 1s.

## Aspect-ratio conversion (no stretching)

```bash
# 16:9 → 9:16 by cropping center (fill the frame)
ffmpeg -i input.mp4 -vf "scale=-1:1920,crop=1080:1920" -c:a copy -pix_fmt yuv420p vertical.mp4

# 16:9 → 9:16 with blurred-fill background (keeps whole frame, fills bars)
ffmpeg -i input.mp4 -filter_complex \
  "[0:v]scale=1080:1920,boxblur=40:20[bg];\
   [0:v]scale=1080:-1[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[v]" \
  -map "[v]" -map 0:a -c:v libx264 -crf 18 -pix_fmt yuv420p vertical_blur.mp4

# letterbox to exact size without crop (pad)
ffmpeg -i input.mp4 -vf \
  "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -c:a copy -pix_fmt yuv420p padded.mp4
```

## Overlay / picture-in-picture / logo / watermark

```bash
# logo top-right with 20px margin
ffmpeg -i input.mp4 -i logo.png -filter_complex \
  "[1:v]scale=160:-1[wm];[0:v][wm]overlay=W-w-20:20" \
  -c:a copy -pix_fmt yuv420p out.mp4

# webcam PiP bottom-right, rounded scale to 320px wide
ffmpeg -i screen.mp4 -i cam.mp4 -filter_complex \
  "[1:v]scale=320:-1[pip];[0:v][pip]overlay=W-w-30:H-h-30" \
  -c:v libx264 -crf 18 -pix_fmt yuv420p out.mp4
```

## Captions / subtitles

```bash
# burn-in (hardcoded, styled) from an .srt
ffmpeg -i input.mp4 -vf "subtitles=subs.srt:force_style=\
'Fontname=Inter,Fontsize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,\
BorderStyle=3,Outline=2,Shadow=0,MarginV=60'" \
  -c:a copy -pix_fmt yuv420p out.mp4

# soft subtitle track (toggleable, mp4)
ffmpeg -i input.mp4 -i subs.srt -c copy -c:s mov_text out.mp4

# simple drawtext title
ffmpeg -i input.mp4 -vf "drawtext=text='Title':fontcolor=white:fontsize=64:\
x=(w-text_w)/2:y=80:box=1:boxcolor=black@0.4:boxborderw=20" \
  -c:a copy -pix_fmt yuv420p out.mp4
```

## Audio

```bash
# add/replace background music, loop to video length, fade out last 2s
ffmpeg -i video.mp4 -stream_loop -1 -i music.mp3 -filter_complex \
  "[1:a]volume=0.3,afade=t=out:st=DUR-2:d=2[a]" \
  -map 0:v -map "[a]" -shortest -c:v copy -c:a aac -b:a 320k out.mp4

# mix voiceover over music with sidechain DUCKING (music dips under voice)
ffmpeg -i video.mp4 -i music.mp3 -i voice.mp3 -filter_complex \
  "[1:a]volume=0.6[m];[2:a]volume=1.0[v];\
   [m][v]sidechaincompress=threshold=0.05:ratio=8:attack=20:release=300[mducked];\
   [mducked][v]amix=inputs=2:duration=longest[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 320k out.mp4

# loudness normalize to broadcast/social target (-14 LUFS)
ffmpeg -i input.mp4 -af loudnorm=I=-14:TP=-1.5:LRA=11 \
  -c:v copy -c:a aac -b:a 320k out.mp4

# strip / extract audio
ffmpeg -i input.mp4 -an out_noaudio.mp4
ffmpeg -i input.mp4 -vn -acodec libmp3lame -q:a 2 audio.mp3
```

## Speed / time

```bash
# 2x faster (video+audio); atempo valid 0.5–2.0, chain for more
ffmpeg -i input.mp4 -filter_complex "[0:v]setpts=0.5*PTS[v];[0:a]atempo=2.0[a]" \
  -map "[v]" -map "[a]" -pix_fmt yuv420p fast.mp4

# slow motion to 50% (assumes enough source fps; interpolate for smoothness)
ffmpeg -i input.mp4 -filter:v "setpts=2.0*PTS,minterpolate=fps=60" -an slow.mp4

# change fps
ffmpeg -i input.mp4 -filter:v fps=30 -c:a copy out.mp4
```

## Color & cleanup

```bash
# quick grade: contrast/saturation/brightness/gamma
ffmpeg -i input.mp4 -vf "eq=contrast=1.08:saturation=1.12:brightness=0.02:gamma=1.02" \
  -c:a copy -pix_fmt yuv420p graded.mp4

# apply a LUT (.cube)
ffmpeg -i input.mp4 -vf "lut3d=look.cube" -c:a copy -pix_fmt yuv420p out.mp4

# stabilize (two-pass)
ffmpeg -i input.mp4 -vf vidstabdetect=shakiness=5:result=tf.trf -f null -
ffmpeg -i input.mp4 -vf "vidstabtransform=input=tf.trf:smoothing=30,unsharp" \
  -c:a copy -pix_fmt yuv420p stable.mp4

# denoise
ffmpeg -i input.mp4 -vf hqdn3d=4:3:6:4 -c:a copy out.mp4
```

## Stills, thumbnails, GIFs

```bash
# poster frame at 3s
ffmpeg -ss 00:00:03 -i input.mp4 -frames:v 1 -q:v 2 poster.jpg

# high-quality GIF (two-pass palette)
ffmpeg -i input.mp4 -vf "fps=15,scale=640:-1:flags=lanczos,palettegen" palette.png
ffmpeg -i input.mp4 -i palette.png -lc filter_complex \
  "fps=15,scale=640:-1:flags=lanczos[x];[x][1:v]paletteuse" out.gif
```

## Images → video (slideshow / Ken Burns)

```bash
# slideshow, 3s per image, with crossfades is easier in Remotion; simple version:
ffmpeg -framerate 1/3 -pattern_type glob -i 'img/*.jpg' \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,\
pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30" \
  -c:v libx264 -crf 18 -pix_fmt yuv420p slideshow.mp4
```

## Compress / transcode for delivery

```bash
# H.264 visually-lossless web master
ffmpeg -i input.mov -c:v libx264 -crf 18 -preset slow \
  -c:a aac -b:a 320k -movflags +faststart -pix_fmt yuv420p out.mp4

# smaller file, target ~ size: lower bitrate / higher crf
ffmpeg -i input.mp4 -c:v libx264 -crf 24 -preset slow \
  -c:a aac -b:a 128k -movflags +faststart -pix_fmt yuv420p small.mp4

# H.265 (HEVC) for ~half size at same quality
ffmpeg -i input.mp4 -c:v libx265 -crf 24 -preset slow -tag:v hvc1 \
  -c:a aac -b:a 192k -movflags +faststart out_hevc.mp4
```

`-movflags +faststart` moves the moov atom to the front so web players can start
before fully downloading. Always include it for web/social delivery.
