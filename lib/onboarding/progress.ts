import type { Answers, Asset, Connection } from "../store/types";
import { QUESTION_BY_ID, SECTIONS, isAnswered, type AnswerValue, type Question } from "./questions";

// Onboarding completion, and validation of answers coming in from the form.

export type Progress = {
  answered: number;
  total: number;
  percent: number;
  requiredMissing: { id: string; label: string; section: string }[];
  sections: { id: string; title: string; answered: number; total: number }[];
};

export function onboardingProgress(answers: Answers, assets: Asset[], connections: Connection[]): Progress {
  const assetCount = (q: Question) => assets.filter((a) => a.question_id === q.id).length;
  // A connection counts as handled once it works, or once the client has asked Fluid to help set it up.
  const help = String(answers.connection_help ?? "");
  const helpRequested = (q: Question) => help === "Help me connect both" || help.toLowerCase() === `help me connect ${q.provider}`;
  const connected = (q: Question) => connections.some((c) => c.provider === q.provider && c.status === "connected") || helpRequested(q);
  const done = (q: Question) => isAnswered(q, answers[q.id], { assetCount: assetCount(q), connected: connected(q) });

  const sections = SECTIONS.map((s) => ({ id: s.id, title: s.title, answered: s.questions.filter(done).length, total: s.questions.length }));
  const answered = sections.reduce((n, s) => n + s.answered, 0);
  const total = sections.reduce((n, s) => n + s.total, 0);
  return {
    answered,
    total,
    percent: Math.round((answered / total) * 100),
    requiredMissing: SECTIONS.flatMap((s) => s.questions.filter((q) => q.required && !done(q)).map((q) => ({ id: q.id, label: q.label, section: s.title }))),
    sections,
  };
}

const MAX_TEXT = 5000;

/** Cleans an incoming answer for its question, or returns an error message. */
export function validateAnswer(questionId: string, raw: unknown): { ok: true; value: AnswerValue } | { ok: false; error: string } {
  const q = QUESTION_BY_ID.get(questionId);
  if (!q) return { ok: false, error: "Unknown question" };
  if (q.type === "files" || q.type === "connection") return { ok: false, error: "This question isn't answered with text" };
  if (raw === null || raw === "") return { ok: true, value: null };

  switch (q.type) {
    case "list": {
      if (!Array.isArray(raw)) return { ok: false, error: "Expected a list" };
      const items = raw.map((v) => String(v ?? "").slice(0, 500));
      if (items.length > (q.max ?? 10)) return { ok: false, error: `At most ${q.max} entries` };
      return { ok: true, value: items };
    }
    case "percent":
    case "number": {
      const n = Number(String(raw).replace(/[%\s,]/g, ""));
      if (!Number.isFinite(n) || n < 0) return { ok: false, error: "Enter a number" };
      if (q.type === "percent" && n > 100) return { ok: false, error: "Enter a percentage from 0 to 100" };
      return { ok: true, value: n };
    }
    case "choice": {
      const v = String(raw);
      return q.options?.includes(v) ? { ok: true, value: v } : { ok: false, error: "Pick one of the options" };
    }
    case "email": {
      const v = String(raw).trim().slice(0, 320);
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? { ok: true, value: v } : { ok: false, error: "Enter a valid email address" };
    }
    case "url": {
      let v = String(raw).trim().slice(0, 2000);
      if (v && !/^https?:\/\//i.test(v)) v = `https://${v}`;
      try {
        new URL(v);
        return { ok: true, value: v };
      } catch {
        return { ok: false, error: "Enter a valid link" };
      }
    }
    default:
      return { ok: true, value: String(raw).slice(0, MAX_TEXT) };
  }
}

// What clients may upload: images, PDFs and font files, up to 25 MB each.
export const UPLOAD_MAX_BYTES = 25 * 1024 * 1024;
const UPLOAD_TYPES = /^(image\/(png|jpe?g|webp|gif|svg\+xml|avif)|application\/pdf|font\/(woff2?|otf|ttf)|application\/(x-font-ttf|x-font-otf|font-woff|vnd\.ms-opentype|octet-stream))$/;
const UPLOAD_EXT = /\.(png|jpe?g|webp|gif|svg|avif|pdf|woff2?|otf|ttf)$/i;

export function validateUpload(fileName: string, contentType: string, bytes: number): string | null {
  if (!UPLOAD_EXT.test(fileName)) return "Upload images (PNG, JPG, SVG, WebP), PDFs or font files.";
  if (!UPLOAD_TYPES.test(contentType || "application/octet-stream")) return "That file type isn't supported.";
  if (bytes > UPLOAD_MAX_BYTES) return "Files can be up to 25 MB. For bigger files, share a folder link instead.";
  if (bytes <= 0) return "That file is empty.";
  return null;
}
