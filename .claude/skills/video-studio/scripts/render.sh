#!/usr/bin/env bash
# Render a scaffolded Remotion project. Draft = fast/low-res for timing checks.
# Usage: render.sh <project-dir> [--draft]
set -euo pipefail

DIR="${1:?usage: render.sh <project-dir> [--draft]}"
MODE="${2:-final}"
cd "$DIR"

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

# Help Remotion find the pre-installed browser if present (web env / CI).
BROWSER_FLAG=""
for b in chromium chromium-browser google-chrome; do
  if command -v "$b" >/dev/null 2>&1; then
    BROWSER_FLAG="--browser-executable=$(command -v "$b")"
    break
  fi
done

mkdir -p out
if [ "$MODE" = "--draft" ] || [ "$MODE" = "draft" ]; then
  echo "Rendering DRAFT (half-res, fast)..."
  npx remotion render Main out/draft.mp4 --scale=0.5 --crf=28 \
    --pixel-format=yuv420p $BROWSER_FLAG
  echo "Draft -> $DIR/out/draft.mp4"
else
  echo "Rendering FINAL (1080p, crf 18)..."
  npx remotion render Main out/video.mp4 --codec=h264 --crf=18 \
    --pixel-format=yuv420p $BROWSER_FLAG
  echo "Final -> $DIR/out/video.mp4"
  # Verify the output.
  if command -v ffprobe >/dev/null 2>&1; then
    echo "== ffprobe =="
    ffprobe -v error -select_streams v:0 \
      -show_entries stream=width,height,r_frame_rate,codec_name \
      -show_entries format=duration -of default=noprint_wrappers=1 out/video.mp4
  fi
fi
