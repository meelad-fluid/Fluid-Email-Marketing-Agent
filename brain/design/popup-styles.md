# Pop-up styles (Alia)

Fluid builds clients' sign-up pop-ups in **Alia** (it has its own API; the integration comes later). Every client picks one of three styles at onboarding on the "Choose your pop-up style" page (`/fluid popups` gives the link; it's also posted with the email style options at the end of onboarding). The page shows playable examples in the client's brand; nothing there connects to Alia.

| Style | How it works | Notes |
|---|---|---|
| **Plinko game** | The visitor drops a ball; it lands in one of 5 prize buckets → email → phone → code | Highest submit rates (recommend first) |
| **Pick 3 cards** | The visitor flips 3 of 6 cards; the best card is their offer → email → phone → code | Highest submit rates (recommend first) |
| **Classic 4-step** | Step 1 "Want X% off?" + one question with 3 answers (saved to their profile) → Step 2 email → Step 3 SMS → Step 4 confirmation | The question feeds segmentation and the welcome flow's personalization |

The choice is saved as the line `Pop-up style: <name> (chosen by …)` in `brand/direction.md` and a dated memory.md line. Prizes are never above the client's max discount, and every prize needs a matching code (Shopify discount) and welcome flow email #1 version.
