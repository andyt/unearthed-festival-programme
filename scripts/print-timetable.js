#!/usr/bin/env node
// Prints data/acts.json as a per-day, per-stage text timetable for quick visual
// comparison against the schedule images (and for diffing between updates).
//
//   node scripts/print-timetable.js                # everything
//   node scripts/print-timetable.js sat            # one day
//   node scripts/print-timetable.js sat "Freedom"  # one day, stage name substring
//
// Run from the repo root.
import { readFileSync } from 'fs';
import { STAGE_ORDER } from './validate-acts.js';

const DAY_NAMES = { fri: 'FRIDAY', sat: 'SATURDAY', sun: 'SUNDAY' };
const DAY_ORDER = ['fri', 'sat', 'sun'];

// Sort key so post-midnight late-night slots (00:00–05:59) come after the evening.
const sortKey = (time) => {
  const [h, m] = time.split(':').map(Number);
  return (h < 6 ? h + 24 : h) * 60 + m;
};

const [dayArg, stageArg] = process.argv.slice(2);
const acts = JSON.parse(readFileSync('data/acts.json', 'utf8'));

const days = dayArg ? [dayArg.toLowerCase()] : DAY_ORDER;

for (const day of days) {
  const dayActs = acts.filter((a) => a.day === day);
  if (!dayActs.length) continue;

  console.log(`\n=== ${DAY_NAMES[day] || day.toUpperCase()} ===`);

  const stages = STAGE_ORDER.filter((s) => dayActs.some((a) => a.stage === s));
  // Include any stage not in STAGE_ORDER (shouldn't happen if validation passes).
  for (const s of [...new Set(dayActs.map((a) => a.stage))]) {
    if (!stages.includes(s)) stages.push(s);
  }

  for (const stage of stages) {
    if (stageArg && !stage.toLowerCase().includes(stageArg.toLowerCase())) continue;

    const rows = dayActs
      .filter((a) => a.stage === stage)
      .sort((a, b) => sortKey(a.time) - sortKey(b.time));
    if (!rows.length) continue;

    console.log(`\n${stage}`);
    for (const a of rows) {
      console.log(`  ${a.time}  ${`[${a.type}]`.padEnd(16)} ${a.name}`);
    }
  }
}

console.log('');
