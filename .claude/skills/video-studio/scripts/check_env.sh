#!/usr/bin/env bash
# Verify the toolchain needed by the video-studio skill.
# Exit 0 always; prints status and install hints. Parse the OK/MISSING lines.
set -uo pipefail

ok()   { printf "OK      %s (%s)\n" "$1" "$2"; }
miss() { printf "MISSING %s — %s\n" "$1" "$2"; }

echo "== video-studio environment check =="

if command -v node >/dev/null 2>&1; then ok "node" "$(node --version)"; else
  miss "node" "install Node 18+ (https://nodejs.org) — required for Remotion"; fi

if command -v npm >/dev/null 2>&1; then ok "npm" "$(npm --version)"; else
  miss "npm" "comes with Node"; fi

if command -v ffmpeg >/dev/null 2>&1; then
  ok "ffmpeg" "$(ffmpeg -version 2>/dev/null | head -1 | cut -d' ' -f3)"; else
  miss "ffmpeg" "apt-get install ffmpeg / brew install ffmpeg — required for editing"; fi

if command -v ffprobe >/dev/null 2>&1; then ok "ffprobe" "present"; else
  miss "ffprobe" "ships with ffmpeg"; fi

# Browser for Remotion rendering (Chromium). In the web env it's pre-installed.
if command -v chromium >/dev/null 2>&1; then ok "chromium" "$(command -v chromium)";
elif command -v chromium-browser >/dev/null 2>&1; then ok "chromium" "$(command -v chromium-browser)";
elif command -v google-chrome >/dev/null 2>&1; then ok "chrome" "$(command -v google-chrome)";
else miss "chromium/chrome" "Remotion will try to download one on first render"; fi

# Optional: list a few common fonts so text rendering choices are informed.
if command -v fc-list >/dev/null 2>&1; then
  cnt=$(fc-list 2>/dev/null | wc -l | tr -d ' ')
  ok "fonts" "$cnt families via fontconfig"
else
  miss "fc-list" "optional; for system font discovery (fontconfig)"
fi

echo "== done =="
