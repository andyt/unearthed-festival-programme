#!/usr/bin/env node
// Reads data/acts.json and:
//   1. Splices const ACTS = [...] into src/index.html between BEGIN_ACTS / END_ACTS markers
//   2. Writes worker/src/acts.js as an ES module export
// Run from the repo root: node scripts/build.js
import { readFileSync, writeFileSync } from 'fs';

const acts = JSON.parse(readFileSync('data/acts.json', 'utf8'));
const actsJson = JSON.stringify(acts, null, 2);

// ── 1. Update index.html ────────────────────────────────────────────────────
const html = readFileSync('src/index.html', 'utf8');
const replacement = `// BEGIN_ACTS\nconst ACTS = ${actsJson};\n// END_ACTS`;

if (!html.includes('// BEGIN_ACTS')) {
  console.error('src/index.html is missing // BEGIN_ACTS marker');
  process.exit(1);
}

const updatedHtml = html.replace(/\/\/ BEGIN_ACTS[\s\S]*?\/\/ END_ACTS/, replacement);
writeFileSync('src/index.html', updatedHtml);
console.log('Updated src/index.html');

// ── 2. Write worker/src/acts.js ─────────────────────────────────────────────
writeFileSync('worker/src/acts.js', `export default ${actsJson};\n`);
console.log('Wrote worker/src/acts.js');
