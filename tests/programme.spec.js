import { test, expect } from '@playwright/test';

// Open the browse/grid view before each test so all act cards are in the DOM.
test.beforeEach(async ({ page }) => {
  await page.goto('/#v=browse');
  await page.waitForSelector('.act-card');
});

// Verify a card's displayed name, time string, and stage tag.
async function checkAct(page, { id, name, time, day, stage }) {
  const card = page.locator(`.act-card[data-id="${id}"]`);
  await expect(card.locator('.act-name')).toHaveText(name);
  // act-time renders as e.g. "23:30 · FRI"
  await expect(card.locator('.act-time')).toContainText(time);
  await expect(card.locator('.act-time')).toContainText(day.toUpperCase().slice(0, 3));
  await expect(card.locator('.act-meta')).toContainText(stage);
}

// ─── Main Stage ──────────────────────────────────────────────────────────────

test('Main Stage pre-midnight: Roni Size (id 9)', async ({ page }) => {
  await checkAct(page, { id: 9, name: 'Roni Size', time: '23:30', day: 'fri', stage: 'Main Stage' });
});

test('Main Stage post-midnight: DJ Moonshine (id 10)', async ({ page }) => {
  await checkAct(page, { id: 10, name: 'DJ Moonshine', time: '01:00', day: 'fri', stage: 'Main Stage' });
});

// ─── Dub Corner ──────────────────────────────────────────────────────────────

test('Dub Corner pre-midnight: DJ Sal (id 28)', async ({ page }) => {
  await checkAct(page, { id: 28, name: 'DJ Sal', time: '23:00', day: 'fri', stage: 'Dub Corner' });
});

test('Dub Corner post-midnight: DJ Uncle Funk (id 29)', async ({ page }) => {
  await checkAct(page, { id: 29, name: 'DJ Uncle Funk', time: '00:00', day: 'fri', stage: 'Dub Corner' });
});

// ─── Cosmic Cwtsh ────────────────────────────────────────────────────────────

test('Cosmic Cwtsh pre-midnight: Sylark (id 44)', async ({ page }) => {
  await checkAct(page, { id: 44, name: 'Sylark', time: '22:30', day: 'fri', stage: 'Cosmic Cwtsh' });
});

test('Cosmic Cwtsh post-midnight: DJ LSGD (id 45)', async ({ page }) => {
  await checkAct(page, { id: 45, name: 'DJ LSGD', time: '00:00', day: 'fri', stage: 'Cosmic Cwtsh' });
});

// ─── Freedom Stage ───────────────────────────────────────────────────────────

test('Freedom Stage pre-midnight: Freaky Deaky Takeover (id 57)', async ({ page }) => {
  await checkAct(page, { id: 57, name: 'Freaky Deaky Takeover', time: '23:00', day: 'fri', stage: 'Freedom Stage' });
});

// ─── Temple Tent ─────────────────────────────────────────────────────────────

test('Temple Tent: Celtic Grief Keening (id 309)', async ({ page }) => {
  await checkAct(page, { id: 309, name: 'Celtic Grief Keening - Jewels Wingfield', time: '19:30', day: 'fri', stage: 'Temple Tent' });
});

// ─── Sacred Fire ─────────────────────────────────────────────────────────────

test('Sacred Fire: Stories & Hot Chocolate round the Fire (id 404)', async ({ page }) => {
  await checkAct(page, { id: 404, name: 'Stories & Hot Chocolate round the Fire', time: '20:30', day: 'fri', stage: 'Sacred Fire' });
});

// ─── GeoJam ──────────────────────────────────────────────────────────────────

test('GeoJam pre-midnight: Queen Beezie (id 506)', async ({ page }) => {
  await checkAct(page, { id: 506, name: 'Queen Beezie', time: '21:30', day: 'fri', stage: 'GeoJam' });
});

// ─── Tea of Life ─────────────────────────────────────────────────────────────

test('Tea of Life: A Taste of Tarot (id 503)', async ({ page }) => {
  await checkAct(page, { id: 503, name: 'A Taste of Tarot', time: '16:00', day: 'fri', stage: 'Tea of Life' });
});

// ─── Kids & Youth ────────────────────────────────────────────────────────────

test('Kids & Youth: Driftwood Decor (id 609)', async ({ page }) => {
  await checkAct(page, { id: 609, name: 'Driftwood Decor', time: '17:30', day: 'fri', stage: 'Kids & Youth' });
});

// ─── Kids Tipi ───────────────────────────────────────────────────────────────

test('Kids Tipi: Summer Songs (id 700)', async ({ page }) => {
  await checkAct(page, { id: 700, name: 'Summer Songs', time: '11:00', day: 'fri', stage: 'Kids Tipi' });
});
