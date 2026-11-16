// EVIDENCE.md: the index of per-version evidence records in records/.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { compareMaven } from "./osv.mjs";

const field = (md, name) => md.split("\n").find((l) => l.startsWith(`| ${name} |`))?.split("|")[2]?.trim() ?? "—";

export function writeIndex(dir = "records", out = "EVIDENCE.md") {
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")) : [];
  const rows = files.map((f) => {
    const md = readFileSync(`${dir}/${f}`, "utf8");
    const version = f.replace(/\.md$/, "");
    const generated = md.match(/ on (\d{4}-\d{2}-\d{2}T[\d:.]+Z)/)?.[1] ?? "";
    const built = generated.slice(0, 10) || "—";
    const verdict = field(md, "Gate verdict").match(/\*\*(\w+)\*\*/)?.[1] ?? "—";
    const profile = field(md, "Gate profile").split(" ")[0];
    const release = /GitHub Release (\S+)/.exec(md)?.[1];
    return { version, generated, built, profile, verdict, release };
  }).sort((a, b) => b.generated.localeCompare(a.generated) || compareMaven(b.version, a.version));

  const lines = [
    "# Test evidence records",
    "",
    "One record per build, newest first. Each is written by the bank-side gate job after it fetched the build and its evidence from the Maven repository and checked them. Releases (`demo-v<version>` tags) are the bank-bound builds, gated under the `release` profile; other builds are gated under `development`.",
    "",
    "| Version | Built | Gate profile | Verdict | Record | Release |",
    "|---|---|---|---|---|---|",
    ...rows.map((r) => `| ${r.version} | ${r.built} | ${r.profile} | ${r.verdict} | [records/${r.version}.md](records/${r.version}.md) | ${r.release ? `[release](${r.release})` : "—"} |`),
    "",
  ];
  writeFileSync(out, lines.join("\n"));
  return rows.length;
}
