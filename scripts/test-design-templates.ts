// Fills every fluid-email-designer template with demo copy and generated placeholder images, so the
// skill's own assemble.py + render_preview.py can check them (fold, offer, edges, product blocks,
// leftover placeholders). Output → out/design-test/. Usage: npm run brain:design:test
// Then: python brain/design/fluid-email-designer/scripts/assemble.py ... (see the printed commands)

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const SKILL = "brain/design/fluid-email-designer";
const OUT = resolve("out/design-test");

const photo = (label: string, a: string, b: string, w = 1200, h = 900) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${w * 0.7}" cy="${h * 0.35}" r="${h * 0.28}" fill="#ffffff" opacity=".12"/><text x="50%" y="88%" font-family="Arial" font-size="${w / 26}" fill="#fff" opacity=".7" text-anchor="middle">${label}</text></svg>`;
const cutout = (label: string, color: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="800"><rect x="130" y="40" width="240" height="90" rx="20" fill="#222"/><rect x="70" y="120" width="360" height="640" rx="60" fill="${color}"/><text x="250" y="470" font-family="Arial Black,Arial" font-weight="900" font-size="64" fill="#fff" text-anchor="middle">${label}</text></svg>`;
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><circle cx="64" cy="64" r="40" fill="none" stroke="#fff" stroke-width="10"/><path d="M44 66l14 14 28-32" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/></svg>`;
const logo = (fill: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="620" height="120"><text x="310" y="88" font-family="Arial" font-weight="700" font-size="64" letter-spacing="4" fill="${fill}" text-anchor="middle">NIGHT SHIFT</text></svg>`;

// Copy by placeholder name, sized like real Fluid copy so the fold check is meaningful.
function copy(key: string): string {
  const k = key.toUpperCase();
  if (k === "HEADLINE" || k.startsWith("HEADLINE_WITH")) return k.includes("OFFER") ? "Here is 15% to finish it" : "Finish gearing up";
  if (k.startsWith("SUBHEADLINE")) return k.includes("OFFER") || k.includes("CODE") || k.includes("DEADLINE") ? "Code <b>FINISH15</b>. Good for 48 hours." : "Everything is still sitting there. Same size, same color.";
  if (k === "EXCLUSION_LINE") return "Gift cards are excluded.";
  if (k === "CODE_LABEL") return "Use code";
  if (k === "CODE") return "FINISH15";
  if (k === "OFFER_NUMBER") return "15%";
  if (k.endsWith("BUTTON") || k.endsWith("BUTTON_2")) return ["Back to the product", "Return to checkout", "Talk to us", "Shop the range", "Use my 15%"][k.length % 5];
  if (k.endsWith("_LABEL") && k.startsWith("GUIDE")) return ["Cleats", "Gloves", "Pads"][Number(k.match(/\d/)?.[0] ?? 1) - 1] ?? "Gear";
  if (k.endsWith("_LABEL")) return "Free shipping $50+";
  if (k.endsWith("_LEAD")) return "Break them in first.";
  if (k.endsWith("TITLE") || k.endsWith("_NAME") && !k.startsWith("REVIEW")) return ["In your cart", "Why it stands out", "What players say", "Something holding you up?", "The fine print, plainly"][k.length % 5];
  if (k.startsWith("REVIEW") && k.endsWith("NAME")) return "Marcus D.";
  if (k.endsWith("QUOTE")) return "Fit was true to size and they held up all season. Ordering a second pair.";
  if (k.startsWith("FEATURE") || k.startsWith("USP") || k.startsWith("OPTION") || k.startsWith("BADGE")) return "Free returns within 90 days";
  if (k.includes("NOTE")) return "Pull image, product name, variant, quantity and current price. Suppress the Order Protection SKU.";
  if (k === "LEGAL_LINE") return "Night Shift Athletics, 123 Example St, Austin TX";
  if (k === "TAGLINE") return "Built for the late session";
  if (k === "SIGN_OFF") return "The Night Shift Team";
  if (k === "OPENING" || k === "GREETING") return "Order is in. Your confirmation is already in your inbox, so this is not that.";
  if (k.includes("LINK")) return "nightshift.example/help";
  if (k.startsWith("PARAGRAPH") || k.startsWith("STORY") || k.includes("TEXT") || k.includes("LINE") || k.includes("INVITE") || k.includes("ASK") || k.includes("TIP"))
    return "You picked gear that has to hold up when the pace goes up. If anything about it does not, tell us and a real person will sort it out.";
  return "Sample copy";
}

async function main() {
  await mkdir(`${OUT}/assets`, { recursive: true });
  await mkdir(`${OUT}/work`, { recursive: true });
  const asset = async (name: string, svg: string) => {
    const p = `${OUT}/assets/${name}.png`;
    await sharp(Buffer.from(svg)).png().toFile(p);
    return p;
  };
  const photos = [
    await asset("photo-1", photo("lifestyle photo", "#1f2a44", "#5a2a6e")),
    await asset("photo-2", photo("field photo", "#13361f", "#2f6b3a")),
    await asset("photo-3", photo("product scene", "#3a1d12", "#8a4a22")),
    await asset("photo-4", photo("texture", "#222222", "#555555")),
  ];
  const cut = [await asset("cutout-1", cutout("ONE", "#ff3d7f")), await asset("cutout-2", cutout("TWO", "#2a8cff"))];
  const ic = await asset("icon", icon);
  await asset("logo-light", logo("#ffffff"));
  await asset("logo-dark", logo("#17112e"));

  const brand = {
    name: "Night Shift Athletics (demo)",
    logo: `${OUT}/assets/logo-light.png`, logo_dark: `${OUT}/assets/logo-dark.png`, logo_footer: `${OUT}/assets/logo-light.png`,
    colors: { bg: "#ffffff", bg_alt: "#f1ecff", ink: "#17112e", ink_alt: "#17112e", muted: "#5a5375", accent: "#ff3d7f", accent_ink: "#ffffff", highlight: "#ffcc33", hero_ink: "#ffffff", card: "#17112e", card_ink: "#ffffff", footer_bg: "#0d0a1c", footer_ink: "#ffffff" },
    fonts: { display: { family: "Anton", google: true, weights: [400] }, body: { family: "DM Sans", google: true, weights: [400, 700] } },
    headline_case: "uppercase", headline_tracking: "0.01em", button_radius: "999px", card_radius: "22px",
  };
  await writeFile(`${OUT}/work/brand.json`, JSON.stringify(brand, null, 2));

  const flows: Record<string, string[]> = {};
  for (const flow of (await readdir(`${SKILL}/templates`, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
    for (const file of (await readdir(`${SKILL}/templates/${flow}`)).filter((f) => f.endsWith(".html")).sort()) {
      let n = 0;
      const html = (await readFile(`${SKILL}/templates/${flow}/${file}`, "utf8")).replace(/\{\{([A-Z0-9_]+)\}\}/g, (m, key: string) => {
        if (/^LOGO/.test(key) || key === "BRAND_NAME") return m; // filled by assemble.py
        if (/ICON$/.test(key)) return ic;
        if (/CUTOUT$/.test(key)) return cut[n++ % cut.length];
        if (/(IMAGE|PHOTO|^BADGE_\d)$/.test(key)) return photos[n++ % photos.length];
        return copy(key);
      });
      const out = `${OUT}/work/${flow}--${file}`;
      await writeFile(out, html);
      (flows[flow] ??= []).push(`${file.replace(/\.html$/, "")}=${out}`);
    }
  }
  const args = Object.entries(flows).map(([f, items]) => `--flow "${f}" ${items.map((i) => `"${i}"`).join(" ")}`).join(" \\\n  ");
  await writeFile(`${OUT}/assemble-args.txt`, args);
  console.log(`Filled ${Object.values(flows).flat().length} templates in ${Object.keys(flows).length} flows → ${OUT}/work`);
}

main();
