import { Composition } from "remotion";
import { QuoteCard } from "@/components/video/templates/QuoteCard";
import { KineticText } from "@/components/video/templates/KineticText";
import { GradientFadeIn } from "@/components/video/templates/GradientFadeIn";
import { MinimalZen } from "@/components/video/templates/MinimalZen";
import { StorySlides } from "@/components/video/templates/StorySlides";
import type { TemplateProps } from "@/lib/types";

const defaultProps: TemplateProps = {
  quoteText: "",
  speakerName: "",
  contextLine: "",
  backgroundImage: null,
  primaryColor: "#1e3a5f",
  accentColor: "#e8b04a",
};

export function RemotionRoot() {
  return (
    <>
      <Composition id="quote-card" component={QuoteCard} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={defaultProps} />
      <Composition id="kinetic-text" component={KineticText} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={defaultProps} />
      <Composition id="gradient-fadein" component={GradientFadeIn} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={defaultProps} />
      <Composition id="minimal-zen" component={MinimalZen} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={defaultProps} />
      <Composition id="story-slides" component={StorySlides} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={defaultProps} />
    </>
  );
}
