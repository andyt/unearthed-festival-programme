import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { toUTC } from './index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const acts = JSON.parse(readFileSync(join(__dirname, '../../data/acts.json'), 'utf8'));
const byId = (id) => acts.find(a => a.id === id);

// ─── toUTC ───────────────────────────────────────────────────────────────────

describe('toUTC', () => {
  it('converts a regular BST time to UTC (22:00 fri)', () => {
    expect(toUTC('fri', '22:00')).toBe('20260619T210000Z');
  });

  it('converts a pre-midnight BST time (23:30 fri)', () => {
    expect(toUTC('fri', '23:30')).toBe('20260619T223000Z');
  });

  it('handles midnight exactly (00:00 fri) — advances date then rolls UTC back', () => {
    // 00:00 BST on Fri night → calendar date advances to Sat, then −1h → 23:00 UTC Fri
    expect(toUTC('fri', '00:00')).toBe('20260619T230000Z');
  });

  it('handles post-midnight (01:00 fri)', () => {
    // 01:00 BST on Fri night → calendar date advances to Sat, 01:00 BST = 00:00 UTC Sat
    expect(toUTC('fri', '01:00')).toBe('20260620T000000Z');
  });

  it('handles post-midnight (02:00 fri)', () => {
    // 02:00 BST on Fri night → calendar date advances to Sat Jun 20, 02:00 BST = 01:00 UTC Sat
    expect(toUTC('fri', '02:00')).toBe('20260620T010000Z');
  });

  it('handles post-midnight on sat night (01:00 sat)', () => {
    // 01:00 BST on Sat night → calendar date advances to Sun, 01:00 BST = 00:00 UTC Sun
    expect(toUTC('sat', '01:00')).toBe('20260621T000000Z');
  });
});

// ─── Data regression: one pre-midnight + one post-midnight per stage ─────────

describe('ACTS data — Main Stage', () => {
  it('pre-midnight: Roni Size (id 9)', () => {
    expect(byId(9)).toMatchObject({ name: 'Roni Size', day: 'fri', time: '23:30', stage: 'Main Stage' });
  });
  it('post-midnight: DJ Moonshine (id 10)', () => {
    expect(byId(10)).toMatchObject({ name: 'DJ Moonshine', day: 'fri', time: '01:00', stage: 'Main Stage' });
  });
});

describe('ACTS data — Dub Corner', () => {
  it('pre-midnight: DJ Sal (id 28)', () => {
    expect(byId(28)).toMatchObject({ name: 'DJ Sal', day: 'fri', time: '23:00', stage: 'Dub Corner' });
  });
  it('post-midnight: DJ Uncle Funk (id 29)', () => {
    expect(byId(29)).toMatchObject({ name: 'DJ Uncle Funk', day: 'fri', time: '00:00', stage: 'Dub Corner' });
  });
});

describe('ACTS data — Cosmic Cwtsh', () => {
  it('pre-midnight: Sylark (id 44)', () => {
    expect(byId(44)).toMatchObject({ name: 'Sylark', day: 'fri', time: '22:30', stage: 'Cosmic Cwtsh' });
  });
  it('post-midnight: DJ LSGD (id 45)', () => {
    expect(byId(45)).toMatchObject({ name: 'DJ LSGD', day: 'fri', time: '00:00', stage: 'Cosmic Cwtsh' });
  });
});

describe('ACTS data — Freedom Stage', () => {
  it('pre-midnight: Freaky Deaky Takeover (id 57)', () => {
    expect(byId(57)).toMatchObject({ name: 'Freaky Deaky Takeover', day: 'fri', time: '23:00', stage: 'Freedom Stage' });
  });
});

describe('ACTS data — Temple Tent', () => {
  it('pre-midnight: Celtic Grief Keening (id 309)', () => {
    expect(byId(309)).toMatchObject({ name: 'Celtic Grief Keening - Jewels Wingfield', day: 'fri', time: '19:30', stage: 'Temple Tent' });
  });
});

describe('ACTS data — Sacred Fire', () => {
  it('pre-midnight: Stories & Hot Chocolate round the Fire (id 404)', () => {
    expect(byId(404)).toMatchObject({ name: 'Stories & Hot Chocolate round the Fire', day: 'fri', time: '20:30', stage: 'Sacred Fire' });
  });
});

describe('ACTS data — GeoJam', () => {
  it('pre-midnight: Queen Beezie (id 506)', () => {
    expect(byId(506)).toMatchObject({ name: 'Queen Beezie', day: 'fri', time: '21:30', stage: 'GeoJam' });
  });
});

describe('ACTS data — Tea of Life', () => {
  it('pre-midnight: A Taste of Tarot (id 503)', () => {
    expect(byId(503)).toMatchObject({ name: 'A Taste of Tarot', day: 'fri', time: '16:00', stage: 'Tea of Life' });
  });
});

describe('ACTS data — Kids & Youth', () => {
  it('pre-midnight: Driftwood Decor (id 609)', () => {
    expect(byId(609)).toMatchObject({ name: 'Driftwood Decor', day: 'fri', time: '17:30', stage: 'Kids & Youth' });
  });
});

describe('ACTS data — Kids Tipi', () => {
  it('pre-midnight: Summer Songs (id 700)', () => {
    expect(byId(700)).toMatchObject({ name: 'Summer Songs', day: 'fri', time: '11:00', stage: 'Kids Tipi' });
  });
});
