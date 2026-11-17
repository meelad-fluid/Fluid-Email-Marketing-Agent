import { readdir } from "node:fs/promises";
import { join } from "node:path";

// Dev home: every example spec × brand kit, linked to its live preview.
// Replaced by the client workspace screens in Phase 0.

const names = async (dir: string) =>
  (await readdir(join(process.cwd(), "examples", dir))).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));

export default async function Home() {
  const [specs, kits] = await Promise.all([names("specs"), names("brand-kits")]);
  return (
    <main style={{ maxWidth: 720, margin: "48px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 28 }}>Fluid Email Agent</h1>
      <p><a href="/admin">Clients (team view) →</a></p>
      <p style={{ color: "#555" }}>Design engine previews: the same spec rendered with each client brand kit.</p>
      {specs.map((spec) => (
        <section key={spec} style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 18 }}>{spec}</h2>
          <ul>
            {kits.map((kit) => (
              <li key={kit}>
                <a href={`/preview?spec=${spec}&kit=${kit}`}>{kit}</a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
