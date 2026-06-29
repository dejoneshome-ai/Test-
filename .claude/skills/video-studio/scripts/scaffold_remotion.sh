#!/usr/bin/env bash
# Scaffold a ready-to-render Remotion project with a real, professional-looking
# example composition (spring entrance, eased motion, staggered text, audio-ready).
# Usage: scaffold_remotion.sh <target-dir>
set -euo pipefail

DIR="${1:?usage: scaffold_remotion.sh <target-dir>}"
if [ -e "$DIR" ] && [ -n "$(ls -A "$DIR" 2>/dev/null)" ]; then
  echo "ERROR: $DIR exists and is not empty. Pick an empty/new dir." >&2; exit 1
fi
mkdir -p "$DIR/src" "$DIR/public"

cat > "$DIR/package.json" <<'JSON'
{
  "name": "video-studio-project",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "studio": "remotion studio",
    "render": "remotion render Main out/video.mp4 --codec=h264 --crf=18 --pixel-format=yuv420p",
    "render:draft": "remotion render Main out/draft.mp4 --scale=0.5 --crf=28 --pixel-format=yuv420p",
    "still": "remotion still Main out/poster.png --frame=30"
  },
  "dependencies": {
    "@remotion/cli": "^4.0.0",
    "@remotion/transitions": "^4.0.0",
    "@remotion/google-fonts": "^4.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "remotion": "^4.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "typescript": "^5.4.0"
  }
}
JSON

cat > "$DIR/tsconfig.json" <<'JSON'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "lib": ["ES2020", "DOM"]
  }
}
JSON

cat > "$DIR/remotion.config.ts" <<'TS'
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setPixelFormat("yuv420p"); // delivery-safe for all players
Config.setCrf(18);
TS

cat > "$DIR/src/index.ts" <<'TS'
import { registerRoot } from "remotion";
import { Root } from "./Root";
registerRoot(Root);
TS

cat > "$DIR/src/Root.tsx" <<'TSX'
import { Composition } from "remotion";
import { Main } from "./Main";

// Edit dimensions for your target: 1920x1080 (16:9) or 1080x1920 (9:16 vertical).
const FPS = 30;
const DURATION_SECONDS = 8;

export const Root: React.FC = () => (
  <>
    <Composition
      id="Main"
      component={Main}
      durationInFrames={FPS * DURATION_SECONDS}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{
        title: "Your Title Here",
        subtitle: "A professional, code-rendered video",
      }}
    />
  </>
);
TSX

cat > "$DIR/src/Main.tsx" <<'TSX'
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  Sequence,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

type Props = { title: string; subtitle: string };

// A gradient background that slowly drifts — subtle motion reads as premium.
const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = interpolate(frame, [0, 240], [0, 30]);
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${120 + shift}deg, #0b1026 0%, #1a1140 50%, #2a1a55 100%)`,
      }}
    />
  );
};

export const Main: React.FC<Props> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring entrance for the title (ease-out feel, slight settle).
  const titleProgress = spring({ frame, fps, config: { damping: 18, mass: 1, stiffness: 110 } });
  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);
  const titleOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  // Subtitle enters staggered (starts ~10 frames later via Sequence) and eased.
  const subOpacity = interpolate(frame, [10, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Accent underline wipes in.
  const lineWidth = interpolate(frame, [18, 40], [0, 320], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "0 8%", // ~title-safe margins
        }}
      >
        <Sequence from={0}>
          <h1
            style={{
              fontSize: 96,
              fontWeight: 800,
              color: "white",
              letterSpacing: "-0.02em",
              margin: 0,
              transform: `translateY(${titleY}px)`,
              opacity: titleOpacity,
              textShadow: "0 8px 40px rgba(0,0,0,0.45)",
            }}
          >
            {title}
          </h1>
        </Sequence>

        <div
          style={{
            height: 5,
            width: lineWidth,
            background: "#7c9cff",
            borderRadius: 4,
            margin: "28px 0",
          }}
        />

        <p
          style={{
            fontSize: 36,
            fontWeight: 400,
            color: "rgba(231,233,243,0.85)",
            margin: 0,
            opacity: subOpacity,
          }}
        >
          {subtitle}
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
TSX

cat > "$DIR/.gitignore" <<'GI'
node_modules
out
.remotion
GI

cat > "$DIR/README.md" <<'MD'
# Video Studio project

Generated by the `video-studio` skill.

```bash
npm install
npm run studio        # live preview at http://localhost:3000
npm run render:draft  # fast half-res render to check timing
npm run render        # final 1080p H.264 (yuv420p) -> out/video.mp4
npm run still         # poster frame -> out/poster.png
```

Edit `src/Main.tsx` for content and `src/Root.tsx` for size/fps/duration.
Put fonts, images, audio in `public/` and load with `staticFile()`.
For vertical (TikTok/Reels) set width 1080, height 1920 in `Root.tsx`.
MD

echo "Scaffolded Remotion project at: $DIR"
echo "Next: cd '$DIR' && npm install && npm run studio"
