export type HowItWorksStep = {
  step: string;
  title: string;
  text: string;
};

export type DialogCard = {
  eyebrow: string;
  title: string;
  text: string;
};

export const modeGuides: DialogCard[] = [
  {
    eyebrow: "Local",
    title: "Same setup",
    text: "Best for OBS, a projector, a second monitor, screen recording, or an in-person lesson.",
  },
  {
    eyebrow: "Remote",
    title: "Shared runtime",
    text: "Use only when this website is configured to reach a deployed runtime target.",
  },
];

export const howItWorksSteps: HowItWorksStep[] = [
  {
    step: "01",
    title: "Connect your DDJ-FLX6.",
    text: "Plug the controller into the computer that will host the session.",
  },
  {
    step: "02",
    title: "Start a room.",
    text: "Open the host page from this site on the controller computer.",
  },
  {
    step: "03",
    title: "Share it.",
    text: "Give viewers the public room key, or the private invite link from the host page.",
  },
  {
    step: "04",
    title: "Watch the board live.",
    text: "Students, viewers, or a second screen follow the visual board without controlling the hardware.",
  },
];

export const teachingStory = [
  {
    title: "Lessons feel easier to follow.",
    text: "The board gives beginners a clear view of what is changing on the DDJ-FLX6.",
  },
  {
    title: "Streams and second screens stay focused.",
    text: "Viewers can watch the set unfold without needing the controller in front of them.",
  },
  {
    title: "The deeper tools stay out of the way.",
    text: "The debugger is still there for inspection, but the first experience is the live board.",
  },
];
