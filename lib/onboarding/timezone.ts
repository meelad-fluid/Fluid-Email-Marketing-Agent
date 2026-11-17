import type { AnswerValue } from "./questions";

// The client's onboarding timezone answer as an IANA zone (dates in the internal view use it).
const ZONES: Record<string, string> = {
  "Eastern (ET)": "America/New_York",
  "Central (CT)": "America/Chicago",
  "Mountain (MT)": "America/Denver",
  "Pacific (PT)": "America/Los_Angeles",
};
export const clientTimeZone = (answer: AnswerValue | undefined) => ZONES[String(answer ?? "")] ?? "America/New_York";
