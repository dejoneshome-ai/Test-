import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  random,
  staticFile,
  Easing,
} from "remotion";

// Self-hosted so rendering needs no network (proxy CA isn't trusted by the
// headless browser). TTFs live in public/fonts.
const fontFamily = "Cinzel";
const FontFaces: React.FC = () => (
  <style>{`
    @font-face {
      font-family: 'Cinzel';
      font-style: normal;
      font-weight: 400;
      font-display: block;
      src: url(${staticFile("fonts/Cinzel-400.ttf")}) format('truetype');
    }
    @font-face {
      font-family: 'Cinzel';
      font-style: normal;
      font-weight: 700;
      font-display: block;
      src: url(${staticFile("fonts/Cinzel-700.ttf")}) format('truetype');
    }
  `}</style>
);

type Props = {
  title: string;
  subtitle: string;
};

// Smooth bell curve (0..1) peaking at `center`, with given `width` in frames.
const bell = (frame: number, center: number, width: number) =>
  Math.exp(-((frame - center) ** 2) / (2 * width ** 2));

const Starfield: React.FC<{ count: number; w: number; h: number }> = ({
  count,
  w,
  h,
}) => {
  const frame = useCurrentFrame();
  const stars = new Array(count).fill(0).map((_, i) => {
    const x = random(`x${i}`) * w;
    const y = random(`y${i}`) * h;
    const size = 1 + random(`s${i}`) * 3;
    const phase = random(`p${i}`) * Math.PI * 2;
    const twinkle = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(frame * 0.12 + phase));
    return { x, y, size, twinkle };
  });
  return (
    <AbsoluteFill>
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: "#fff",
            opacity: s.twinkle * 0.9,
            boxShadow: `0 0 ${s.size * 2}px rgba(255,255,255,0.8)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

export const Main: React.FC<Props> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  const cx = width / 2;
  const cy = height * 0.46;
  const R = height * 0.2; // sun radius

  // Moon slides in from the left, reaches totality near frame 75, then drifts
  // only slightly so the corona stays visible behind the title.
  const moonX = interpolate(
    frame,
    [0, 75, durationInFrames],
    [cx - R * 2.8, cx, cx + R * 0.35],
    { easing: Easing.inOut(Easing.cubic), extrapolateRight: "clamp" }
  );
  const moonY = cy + R * 0.04;
  const moonR = R * 1.02; // slightly larger -> total eclipse

  // Coverage: how much the sun's disc is occluded (0..1), drives the dimming.
  const dist = Math.abs(moonX - cx);
  const coverage = interpolate(dist, [0, R * 1.4], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Totality window — corona + ring of fire bloom.
  const totality = bell(frame, 80, 16);

  // Diamond-ring flash just before the disc is fully covered (2nd contact).
  const diamond = bell(frame, 66, 4) * (1 - coverage * 0.2);

  // Daylight that drains out of the sky as the moon bites into the sun.
  const sky = interpolate(coverage, [0, 1], [0.18, 0.02]);
  const sunGlow = interpolate(coverage, [0, 0.85, 1], [1, 0.5, 0], {
    extrapolateRight: "clamp",
  });

  // Title timing.
  const titleStart = 82;
  const tProg = spring({
    frame: frame - titleStart,
    fps,
    config: { damping: 200, mass: 1, stiffness: 90 },
    durationInFrames: 30,
  });
  const titleOpacity = interpolate(frame, [titleStart, titleStart + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleTracking = interpolate(tProg, [0, 1], [0.6, 0.16]);
  const titleScale = interpolate(tProg, [0, 1], [1.08, 1]);

  const subStart = titleStart + 10;
  const subOpacity = interpolate(frame, [subStart, subStart + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subTracking = interpolate(
    spring({
      frame: frame - subStart,
      fps,
      config: { damping: 200, stiffness: 80 },
      durationInFrames: 30,
    }),
    [0, 1],
    [1.0, 0.5]
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#01010a" }}>
      <FontFaces />
      {/* deep-space gradient */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 90% at 50% 30%, rgba(20,24,60,${sky}) 0%, rgba(2,3,12,1) 70%)`,
        }}
      />

      <Starfield count={220} w={width} h={height} />

      {/* ---- Eclipse group ---- */}
      <AbsoluteFill>
        {/* Sun halo + corona drawn in SVG so the large soft gradients don't
            tile-seam on the GPU at 4K. R == 100 svg units; box centered. */}
        <svg
          width={R * 8}
          height={R * 8}
          viewBox="0 0 800 800"
          style={{ position: "absolute", left: cx - R * 4, top: cy - R * 4 }}
        >
          <defs>
            <radialGradient id="sunHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgb(255,196,110)" stopOpacity={0.9 * sunGlow} />
              <stop offset="36%" stopColor="rgb(255,160,80)" stopOpacity={0.32 * sunGlow} />
              <stop offset="70%" stopColor="rgb(255,140,70)" stopOpacity={0} />
            </radialGradient>
            <radialGradient id="coronaOuter" cx="50%" cy="50%" r="50%">
              <stop offset="28%" stopColor="rgb(255,246,224)" stopOpacity={0.55 * totality} />
              <stop offset="44%" stopColor="rgb(255,214,158)" stopOpacity={0.24 * totality} />
              <stop offset="68%" stopColor="rgb(200,214,255)" stopOpacity={0.06 * totality} />
              <stop offset="100%" stopColor="rgb(180,200,255)" stopOpacity={0} />
            </radialGradient>
            <radialGradient id="coronaRing" cx="50%" cy="50%" r="50%">
              <stop offset="50%" stopColor="rgb(255,255,255)" stopOpacity={0} />
              <stop offset="62%" stopColor="rgb(255,248,232)" stopOpacity={0.5 * totality} />
              <stop offset="72%" stopColor="rgb(255,226,180)" stopOpacity={0.22 * totality} />
              <stop offset="95%" stopColor="rgb(255,220,180)" stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx="400" cy="400" r="240" fill="url(#sunHalo)" />
          <circle cx="400" cy="400" r="330" fill="url(#coronaOuter)" />
          <circle cx="400" cy="400" r="200" fill="url(#coronaRing)" />
        </svg>

        {/* The Sun: bright photosphere disc (gets occluded by the moon). */}
        <div
          style={{
            position: "absolute",
            left: cx - R,
            top: cy - R,
            width: R * 2,
            height: R * 2,
            borderRadius: "50%",
            background: `radial-gradient(circle closest-side, #fff7e6 0%, #ffd27a 60%, #ff9a3c 88%, #ff8a30 100%)`,
            opacity: 0.15 + 0.85 * sunGlow,
          }}
        />

        {/* The Moon: opaque dark disc that creates the eclipse */}
        <div
          style={{
            position: "absolute",
            left: moonX - moonR,
            top: moonY - moonR,
            width: moonR * 2,
            height: moonR * 2,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 42% 40%, #0a0a12 0%, #050509 70%, #000 100%)",
            boxShadow: `inset 0 0 ${R * 0.4}px rgba(60,70,110,0.5)`,
          }}
        />

        {/* Ring of fire — thin chromosphere rim at totality */}
        <div
          style={{
            position: "absolute",
            left: cx - moonR,
            top: moonY - moonR,
            width: moonR * 2,
            height: moonR * 2,
            borderRadius: "50%",
            boxShadow: `0 0 ${R * 0.5}px ${R * 0.06}px rgba(255,235,200,${
              0.9 * totality
            }), inset 0 0 ${R * 0.1}px rgba(255,210,150,${totality})`,
            border: `${Math.max(2, R * 0.012)}px solid rgba(255,240,210,${
              0.85 * totality
            })`,
          }}
        />

        {/* Diamond-ring flash */}
        <div
          style={{
            position: "absolute",
            left: moonX + moonR * 0.62 - R * 0.12,
            top: moonY - moonR * 0.62 - R * 0.12,
            width: R * 0.24,
            height: R * 0.24,
            borderRadius: "50%",
            background: "#ffffff",
            opacity: diamond,
            boxShadow: `0 0 ${R * 0.8}px ${R * 0.3}px rgba(255,255,255,${diamond}), 0 0 ${
              R * 0.2
            }px ${R * 0.1}px #fff`,
          }}
        />
      </AbsoluteFill>

      {/* ---- Title ---- */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: height * 0.12,
        }}
      >
        <div
          style={{
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily,
              fontWeight: 700,
              fontSize: height * 0.14,
              color: "#f6efe2",
              letterSpacing: `${titleTracking}em`,
              textShadow: "0 0 40px rgba(255,220,170,0.45)",
              lineHeight: 1,
              paddingLeft: `${titleTracking}em`,
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: height * 0.03,
              fontFamily,
              fontWeight: 400,
              fontSize: height * 0.028,
              color: "#c9c2b4",
              letterSpacing: `${subTracking}em`,
              paddingLeft: `${subTracking}em`,
              opacity: subOpacity,
            }}
          >
            {subtitle}
          </div>
        </div>
      </AbsoluteFill>

      {/* Cinematic vignette that deepens at totality */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 100% at 50% 42%, rgba(0,0,0,0) 45%, rgba(0,0,0,${
            0.55 + 0.25 * coverage
          }) 100%)`,
          pointerEvents: "none",
        }}
      />
      {/* Letterbox bars for a cinematic feel */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: height * 0.06,
            background: "#000",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: height * 0.06,
            background: "#000",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
