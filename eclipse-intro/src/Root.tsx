import { Composition } from "remotion";
import { Main } from "./Main";

// Eclipse documentary intro — 4K (3840x2160, 16:9), 5 seconds.
const FPS = 30;
const DURATION_SECONDS = 5;

export const Root: React.FC = () => (
  <>
    <Composition
      id="Main"
      component={Main}
      durationInFrames={FPS * DURATION_SECONDS}
      fps={FPS}
      width={3840}
      height={2160}
      defaultProps={{
        title: "ECLIPSE",
        subtitle: "A DOCUMENTARY",
      }}
    />
  </>
);
