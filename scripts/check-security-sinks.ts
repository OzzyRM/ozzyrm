#!/usr/bin/env bun
/**
 * Fail if library source introduces common XSS / code-execution sinks.
 * Used by husky pre-commit and CI.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dir, "..");
const SRC = join(ROOT, "src");

const FORBIDDEN: { name: string; pattern: RegExp }[] = [
  { name: "dangerouslySetInnerHTML", pattern: /dangerouslySetInnerHTML/ },
  { name: "innerHTML assignment", pattern: /\.innerHTML\s*=/ },
  { name: "eval(", pattern: /\beval\s*\(/ },
  { name: "new Function", pattern: /\bnew\s+Function\b/ },
];

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(dir, entry);
    const info = await stat(path);
    if (info.isDirectory()) {
      files.push(...(await walk(path)));
      continue;
    }
    if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      files.push(path);
    }
  }

  return files;
}

const hits: string[] = [];

for (const file of await walk(SRC)) {
  const text = await readFile(file, "utf8");
  const rel = relative(ROOT, file);

  for (const rule of FORBIDDEN) {
    if (!rule.pattern.test(text)) continue;
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      if (rule.pattern.test(line)) {
        hits.push(`${rel}:${i + 1}: ${rule.name} → ${line.trim()}`);
      }
    });
  }
}

if (hits.length > 0) {
  console.error("Security sink check failed:\n");
  for (const hit of hits) console.error(`  ${hit}`);
  console.error("\nSee security/CHECKLIST.md — remove the sink or get a maintainer waiver.");
  process.exit(1);
}

console.log("check:security ok — no forbidden sinks in src/");
