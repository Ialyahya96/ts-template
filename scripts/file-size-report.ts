// Reports working-tree code files by line and byte size so oversized files are visible before an agent reads them whole.
// Review policy lives in AGENTS.md: source review >500 lines, ceiling 1000; tests review >800, ceiling 1500. Report only; always exits 0.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"]);
const TEST_PATH = /(^|\/)(__tests__|tests?)(\/|$)|\.(test|spec)\./;
const SKIP_DIRECTORIES = new Set([".git", "node_modules", "dist", "coverage", "screenshots"]);
const SOURCE_REVIEW = 500;
const SOURCE_CEILING = 1000;
const TEST_REVIEW = 800;
const TEST_CEILING = 1500;

interface FileSize {
  path: string;
  lines: number;
  kilobytes: number;
  reviewAt: number;
  ceilingAt: number;
}

function listFiles(root: string): string[] {
  const found: string[] = [];
  const pending = [root];
  for (;;) {
    const directory = pending.pop();
    if (directory === undefined) break;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRECTORIES.has(entry.name)) pending.push(full);
      } else if (entry.isFile()) {
        found.push(full);
      }
    }
  }
  return found.sort((a, b) => a.localeCompare(b));
}

function countLines(content: string): number {
  const body = content.endsWith("\n") ? content.slice(0, -1) : content;
  return body.length === 0 ? 0 : body.split("\n").length;
}

function collectSizes(root: string): FileSize[] {
  const sizes: FileSize[] = [];
  for (const full of listFiles(root)) {
    if (!CODE_EXTENSIONS.has(extname(full))) continue;
    const path = relative(root, full);
    const isTest = TEST_PATH.test(path);
    sizes.push({
      path,
      lines: countLines(readFileSync(full, "utf8")),
      kilobytes: statSync(full).size / 1024,
      reviewAt: isTest ? TEST_REVIEW : SOURCE_REVIEW,
      ceilingAt: isTest ? TEST_CEILING : SOURCE_CEILING,
    });
  }
  return sizes;
}

function describe(file: FileSize): string {
  return `${file.lines} lines, ${file.kilobytes.toFixed(1)} KB  ${file.path}`;
}

function printSection(title: string, files: FileSize[]): void {
  if (files.length === 0) return;
  console.log(`\n${title} (${files.length})`);
  for (const file of files) {
    console.log(`  ${describe(file)}  [review >${file.reviewAt}, ceiling ${file.ceilingAt}]`);
  }
}

const sizes = collectSizes(process.cwd()).sort((a, b) => b.lines - a.lines);
const overCeiling = sizes.filter((file) => file.lines > file.ceilingAt);
const overReview = sizes.filter((file) => file.lines > file.reviewAt && file.lines <= file.ceilingAt);

printSection("Over the hard ceiling", overCeiling);
printSection("Above the review threshold", overReview);

console.log(`\n${sizes.length} code files, ${sizes.reduce((total, file) => total + file.lines, 0)} lines total.`);
console.log("Largest files:");
for (const file of sizes.slice(0, 5)) {
  console.log(`  ${describe(file)}`);
}
