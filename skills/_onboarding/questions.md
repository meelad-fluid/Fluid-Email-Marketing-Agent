# Client onboarding questionnaire

The questions now live in code: **`lib/onboarding/questions.ts`**. That one file drives the onboarding form, what's stored in Supabase (`profile_answers`, keyed by each question's `id`) and what the agent reads about a brand.

- Fluid's 15 original questions are kept word for word (`fluid: true`).
- Added questions fill gaps the flows and templates depend on: business address (legal footer), sender name, founder story, the 3 reasons people buy (pop-up answers → welcome email 1 versions), objections, shipping and returns (checkout and post-purchase emails), reorder days (replenishment and win-back timing), approvers and report recipients.
- Every question records `usedFor` (strategy, copy, design, implementation, reporting, compliance).
- Ids are permanent: reword labels freely, never rename an id.
