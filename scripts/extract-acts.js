#!/usr/bin/env node
// Extracts the ACTS array from src/index.html and writes data/acts.json.
// Run from the repo root: node scripts/extract-acts.js
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const html = readFileSync('src/index.html', 'utf8');
const lines = html.split('\n');

const startIdx = lines.findIndex(l => l.trimStart().startsWith('const ACTS = ['));
const endIdx   = lines.findIndex((l, i) => i > startIdx && l.trim() === '];');

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not locate ACTS array in src/index.html');
  process.exit(1);
}

const block = lines.slice(startIdx, endIdx + 1).join('\n');
// Evaluate as JS to handle unquoted keys, trailing commas, and comments
const acts = new Function(block + '\nreturn ACTS;')();

mkdirSync('data', { recursive: true });
writeFileSync('data/acts.json', JSON.stringify(acts, null, 2) + '\n');
console.log(`Wrote ${acts.length} acts to data/acts.json`);
