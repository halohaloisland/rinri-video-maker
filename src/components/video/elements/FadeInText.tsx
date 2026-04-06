import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

type Props = {
  text: string;
  fontSize?: number;
  color?: string;
  delay?: number;
  fontWeight?: number;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
};

export function FadeInText({
  text,
  fontSize = 48,
  color = "#ffffff",
  delay = 0,
  fontWeight = 700,
  textAlign = "center",
  lineHeight = 1.6,
}: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame - delay, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  const y = interpolate(translateY, [0, 1], [30, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        fontSize,
        color,
        fontWeight,
        textAlign,
        lineHeight,
        whiteSpace: "pre-wrap",
        wordBreak: "keep-all",
        overflowWrap: "break-word",
      }}
    >
      {text}
    </div>
  );
}
