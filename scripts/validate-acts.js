#!/usr/bin/env node
// Validates data/acts.json and reports problems.
// Used two ways:
//   - CLI:   node scripts/validate-acts.js   (exits 1 if there are errors)
//   - Import: build.js calls validate(acts) and aborts the build on errors.
// Run from the repo root.
import { readFileSync } from 'fs';
import { createHash } from 'crypto';

export const VALID_DAYS = ['fri', 'sat', 'sun'];

// Stable short id for a warning, derived from a canonical key (act ids + check),
// so the same issue always hashes to the same id regardless of array position.
const warnId = (key) => createHash('sha1').update(key).digest('hex').slice(0, 8);

// Reviewed false positives, suppressed by warning id. Add an id here (copy it
// from the ⚠ output) with a reason once you've confirmed it's not a real problem.
export const WARNING_WHITELIST = {
  // Kids & Youth runs parallel indoor + outdoor tracks, so a shared slot is fine.
  '858bffb0': 'Fri Kids & Youth 11:30 - Dreamcatchers (inside) + Movement with Fay (outside)',
  'b1d6862d': 'Fri Kids & Youth 17:30 - Driftwood Decor (inside) + Amy Singing (outside)',
  'af496eb5': 'Sat Kids & Youth 17:30 - Driftwood Decor (inside) + Amy Singing (outside)',
};

// Canonical stages, in the order they appear across the printed timetable boards.
export const STAGE_ORDER = [
  'Main Stage',
  'Dub Corner',
  'Cosmic Cwtsh',
  'Freedom Stage',
  'Temple Tent',
  'Sacred Fire',
  'GeoJam',
  'Tea of Life',
  'Kids & Youth',
  'Kids Tipi',
];

export const VALID_TYPES = ['Music', 'DJ', 'Workshop', 'Kids', 'Comedy/Theatre'];

const REQUIRED_KEYS = ['id', 'name', 'day', 'time', 'stage', 'type', 'desc'];

// Unicode dash / separator characters that should be plain ASCII instead.
// (Accented letters like è/ä/ö are fine and intentional — only dashes/dots flagged.)
const BAD_CHARS = {
  '‐': 'hyphen (U+2010)',
  '‑': 'non-breaking hyphen (U+2011)',
  '‒': 'figure dash (U+2012)',
  '–': 'en dash (U+2013)',
  '—': 'em dash (U+2014)',
  '―': 'horizontal bar (U+2015)',
  '−': 'minus sign (U+2212)',
  '·': 'middle dot (U+00B7)',
  '•': 'bullet (U+2022)',
};

const findBadChars = (str) =>
  [...new Set([...String(str)].filter((c) => BAD_CHARS[c]))].map((c) => BAD_CHARS[c]);

// Next free id = highest existing id + 1 (ids are permanent and never reused).
export const nextId = (acts) => Math.max(0, ...acts.map((a) => Number(a.id) || 0)) + 1;

export function validate(acts) {
  const errors = [];
  const warnings = [];
  const suppressed = [];

  // Route a warning to the active list or the suppressed list based on its id.
  const addWarning = (key, msg) => {
    const id = warnId(key);
    const entry = { id, msg };
    if (id in WARNING_WHITELIST) suppressed.push(entry);
    else warnings.push(entry);
  };

  if (!Array.isArray(acts)) {
    return { errors: ['acts.json is not an array'], warnings, suppressed };
  }

  const seenIds = new Map();
  const seenSlots = new Map(); // day|stage|time -> first act seen in that slot

  acts.forEach((a, i) => {
    const where = `act[${i}] (id ${a?.id ?? '?'}, "${a?.name ?? '?'}")`;

    for (const k of REQUIRED_KEYS) {
      if (!(k in a)) errors.push(`${where}: missing required key "${k}"`);
    }

    if (!Number.isInteger(a.id)) {
      errors.push(`${where}: id must be an integer`);
    } else if (seenIds.has(a.id)) {
      errors.push(`${where}: duplicate id ${a.id} (also ${seenIds.get(a.id)})`);
    } else {
      seenIds.set(a.id, where);
    }

    if (typeof a.name !== 'string' || a.name.trim() === '') {
      errors.push(`${where}: name must be a non-empty string`);
    }

    if (!VALID_DAYS.includes(a.day)) {
      errors.push(`${where}: day "${a.day}" not one of ${VALID_DAYS.join(', ')}`);
    }

    if (!/^\d{2}:\d{2}$/.test(a.time || '')) {
      errors.push(`${where}: time "${a.time}" must be HH:MM`);
    } else {
      const [h, m] = a.time.split(':').map(Number);
      if (h > 23 || m > 59) errors.push(`${where}: time "${a.time}" out of range`);
    }

    if (!STAGE_ORDER.includes(a.stage)) {
      errors.push(`${where}: stage "${a.stage}" not a known stage`);
    }

    if (!VALID_TYPES.includes(a.type)) {
      errors.push(`${where}: type "${a.type}" not one of ${VALID_TYPES.join(', ')}`);
    }

    if ('links' in a) {
      if (!Array.isArray(a.links)) {
        errors.push(`${where}: links must be an array`);
      } else {
        a.links.forEach((l, j) => {
          if (!l || typeof l.label !== 'string' || typeof l.url !== 'string') {
            errors.push(`${where}: links[${j}] needs string label and url`);
          }
        });
      }
    }

    if ('subtitle' in a) {
      if (typeof a.subtitle !== 'string' || a.subtitle.trim() === '') {
        errors.push(`${where}: subtitle must be a non-empty string if present`);
      }
    }

    // Warn (don't fail) on unicode dashes/separators in any text field.
    for (const k of ['name', 'desc', 'subtitle']) {
      if (!(k in a)) continue;
      const bad = findBadChars(a[k]);
      if (bad.length) {
        addWarning(`unicode:${a.id}:${k}`, `${where}: ${k} contains ${bad.join(', ')} - prefer plain ASCII`);
      }
    }

    // Warn on two acts sharing the exact same day+stage+time (a good signal, but
    // some are legitimate parallel tracks — whitelist those by id).
    const slot = `${a.day}|${a.stage}|${a.time}`;
    if (seenSlots.has(slot)) {
      const other = seenSlots.get(slot);
      const pair = [a.id, other.id].sort((x, y) => x - y);
      addWarning(`slot-clash:${pair[0]}:${pair[1]}`, `${where}: same day/stage/time slot as ${other.where}`);
    } else {
      seenSlots.set(slot, { id: a.id, where });
    }
  });

  return { errors, warnings, suppressed };
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && process.argv[1].endsWith('validate-acts.js');
if (isMain) {
  const showSuppressed = process.argv.includes('--show-suppressed');
  const acts = JSON.parse(readFileSync('data/acts.json', 'utf8'));
  const { errors, warnings, suppressed } = validate(acts);

  warnings.forEach((w) => console.warn(`⚠ [${w.id}] ${w.msg}`));
  errors.forEach((e) => console.error(`✖ ${e}`));

  if (showSuppressed) {
    suppressed.forEach((w) => console.log(`· [${w.id}] (whitelisted) ${w.msg}`));
  }

  const suppNote = suppressed.length
    ? `, ${suppressed.length} suppressed (run with --show-suppressed to list)`
    : '';
  console.log(
    `\n${acts.length} acts checked - ${errors.length} error(s), ${warnings.length} warning(s)${suppNote}. Next free id: ${nextId(acts)}`
  );
  process.exit(errors.length ? 1 : 0);
}
