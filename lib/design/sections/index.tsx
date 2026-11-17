import type { BrandKit } from "../brand-kit";
import type { Section, SectionOf } from "../spec";
import { Button, CodeChip, Edge, Headline, Icon, Img, Stars, Title } from "./primitives";

// One component per section type in skills/design/section-library.
// Styling comes from the brand kit via CSS variables (see ../html.tsx), never hard-coded.

type Props<T extends Section["type"]> = { s: SectionOf<T>; kit: BrandKit };

function Hero({ s, kit }: Props<"hero">) {
  return (
    <>
      <div className="logo">
        {kit.logo.src ? <img src={kit.logo.src} alt={kit.name} /> : <span className="wordmark">{kit.logo.wordmark}</span>}
      </div>
      {s.announcement && <div className="announcement">{s.announcement}</div>}
      <div className="pad hero-copy">
        <Headline text={s.headline} highlight={s.highlight} />
        {s.subheadline && <p className="sub">{s.subheadline}</p>}
        {s.offer?.code && <CodeChip code={s.offer.code} />}
        {s.offer?.deadline && <div className="deadline">{s.offer.deadline}</div>}
        <Button {...s.cta} primary />
      </div>
      {s.image && <Img {...s.image} className="hero-img" />}
    </>
  );
}

function IconRow({ s }: Props<"icon-row">) {
  return (
    <div className="pad">
      {s.title && <Title>{s.title}</Title>}
      <div className="icon-row">
        {s.items.map((it) => (
          <div className="icon-item" key={it.label}>
            <Icon name={it.icon} />
            <div className="icon-label">{it.label}</div>
            {it.detail && <div className="icon-detail">{it.detail}</div>}
          </div>
        ))}
      </div>
      <Button {...s.cta} />
    </div>
  );
}

function TextBlock({ s }: Props<"text-block">) {
  return (
    <div className="pad">
      {s.title && <Title>{s.title}</Title>}
      {s.paragraphs.map((p, i) => (
        <p className={i === 0 ? "body lead" : "body"} key={i}>
          {p}
        </p>
      ))}
      <Button {...s.cta} />
    </div>
  );
}

function ProductGrid({ s }: Props<"product-grid">) {
  return (
    <div className="pad">
      {s.title && <Title>{s.title}</Title>}
      <div className={`products n${s.products.length}`}>
        {s.products.map((p) => (
          <div className="product-card" key={p.name}>
            <Img {...p.image} className="product-img" />
            <div className="product-name">{p.name}</div>
            <div className="product-blurb">{p.blurb}</div>
            {p.price && <div className="product-price">{p.price}</div>}
            <Button {...p.cta} />
          </div>
        ))}
      </div>
      {s.cta && <Button {...s.cta} />}
    </div>
  );
}

function Reviews({ s }: Props<"reviews">) {
  return (
    <div className="pad">
      {s.title && <Title>{s.title}</Title>}
      {s.reviews.map((r) => (
        <div className="review" key={r.name}>
          <span className="quote-mark">“</span>
          <Stars n={r.stars} />
          <p className="review-quote">{r.quote}</p>
          <div className="review-name">{r.name}</div>
        </div>
      ))}
      <Button {...s.cta} />
    </div>
  );
}

function Comparison({ s }: Props<"comparison">) {
  return (
    <div className="pad">
      <Title>{s.title}</Title>
      <table className="compare">
        <thead>
          <tr>
            <th />
            <th className="us">{s.us}</th>
            <th>{s.them}</th>
          </tr>
        </thead>
        <tbody>
          {s.rows.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              <td className="us">{r.us ? "✓" : "✕"}</td>
              <td className="them">{r.them ? "✓" : "✕"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button {...s.cta} />
    </div>
  );
}

function Steps({ s }: Props<"steps">) {
  return (
    <div className="pad">
      <Title>{s.title}</Title>
      <div className="steps">
        {s.steps.map((st, i) => (
          <div className="step" key={st.title}>
            <div className="step-num">{i + 1}</div>
            <div>
              <div className="step-title">{st.title}</div>
              <div className="step-detail">{st.detail}</div>
            </div>
          </div>
        ))}
      </div>
      <Button {...s.cta} />
    </div>
  );
}

function OfferRecap({ s }: Props<"offer-recap">) {
  return (
    <div className="pad offer-recap">
      <h2 className="recap-headline">{s.headline}</h2>
      {s.code && <CodeChip code={s.code} />}
      {s.deadline && <div className="deadline">{s.deadline}</div>}
      <Button {...s.cta} />
    </div>
  );
}

function Footer({ kit }: Props<"footer">) {
  const f = kit.footer;
  return (
    <div className="pad footer">
      <div className="wordmark footer-mark">{kit.logo.wordmark}</div>
      {f.trustBadges.length > 0 && (
        <div className="badges">
          {f.trustBadges.map((b) => (
            <span className="badge" key={b}>{b}</span>
          ))}
        </div>
      )}
      {f.socials.length > 0 && (
        <div className="socials">
          {f.socials.map((s) => (
            <span className="social" key={s}>{s[0].toUpperCase()}</span>
          ))}
        </div>
      )}
    </div>
  );
}

const RENDERERS: { [T in Section["type"]]: (p: Props<T>) => React.ReactNode } = {
  hero: Hero,
  "icon-row": IconRow,
  "text-block": TextBlock,
  "product-grid": ProductGrid,
  reviews: Reviews,
  comparison: Comparison,
  steps: Steps,
  "offer-recap": OfferRecap,
  footer: Footer,
};

export function SectionView({ s, kit, nextColor }: { s: Section; kit: BrandKit; nextColor: string | null }) {
  const Render = RENDERERS[s.type] as (p: Props<typeof s.type>) => React.ReactNode;
  return (
    <section className={`section bg-${s.bg} t-${s.type}`} data-section={s.id} data-type={s.type}>
      <Render s={s as never} kit={kit} />
      {nextColor && <Edge kind={s.edge} color={nextColor} />}
    </section>
  );
}
