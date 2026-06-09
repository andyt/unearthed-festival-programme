#!/usr/bin/env node
// Reads data/acts.json and:
//   1. Builds dist/index.html from src/index.html template (splices ACTS, stamps version)
//   2. Copies src/sw.js to dist/sw.js
//   3. Writes worker/src/acts.js as an ES module export
// Run from the repo root: node scripts/build.js
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { execSync } from 'child_process';
import { validate } from './validate-acts.js';

const acts = JSON.parse(readFileSync('data/acts.json', 'utf8'));

// ── 0. Validate before building ──────────────────────────────────────────────
const { errors, warnings } = validate(acts);
warnings.forEach((w) => console.warn(`⚠ [${w.id}] ${w.msg}`));
if (errors.length) {
  errors.forEach((e) => console.error(`✖ ${e}`));
  console.error(`\nAborting build: ${errors.length} validation error(s) in data/acts.json`);
  process.exit(1);
}

const actsJson = JSON.stringify(acts, null, 2);

mkdirSync('dist', { recursive: true });

// ── 1. Build dist/index.html ────────────────────────────────────────────────
const html = readFileSync('src/index.html', 'utf8');
const replacement = `// BEGIN_ACTS\nconst ACTS = ${actsJson};\n// END_ACTS`;

if (!html.includes('// BEGIN_ACTS')) {
  console.error('src/index.html is missing // BEGIN_ACTS marker');
  process.exit(1);
}

const gitHash = execSync('git rev-parse --short HEAD').toString().trim();
const builtHtml = html
  .replace(/\/\/ BEGIN_ACTS[\s\S]*?\/\/ END_ACTS/, replacement)
  .replace(/<meta name="app-version" content="[^"]*"/, `<meta name="app-version" content="${gitHash}"`);
writeFileSync('dist/index.html', builtHtml);
console.log(`Wrote dist/index.html (version: ${gitHash})`);

// ── 2. Copy sw.js ────────────────────────────────────────────────────────────
copyFileSync('src/sw.js', 'dist/sw.js');
console.log('Copied src/sw.js → dist/sw.js');

// ── 3. Write worker/src/acts.js ─────────────────────────────────────────────
writeFileSync('worker/src/acts.js', `export default ${actsJson};\n`);
console.log('Wrote worker/src/acts.js');
