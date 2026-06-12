import { test, expect } from '@playwright/test';

// ─── Time Machine ─────────────────────────────────────────────────────────────
// Regression test for: END_TIMES temporal dead zone caused a ReferenceError
// when updateDevDisplay() called renderNowNext() during page initialisation
// (before const END_TIMES = buildEndTimes() had been reached).

test('no JS error on page load', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await page.waitForSelector('#festival-clock');

  expect(errors).toEqual([]);
});

test('Time Machine toggle button opens the controls', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#time-machine-btn');

  await expect(page.locator('#time-machine-body')).not.toBeVisible();
  await page.click('#time-machine-btn');
  await expect(page.locator('#time-machine-body')).toBeVisible();
});

test('time simulator shows acts after clicking a day button', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await page.waitForSelector('#time-machine-btn');

  // Open the Time Machine
  await page.click('#time-machine-btn');

  // Click "Fri 19:00" — acts at this time: Samana (Main Stage), Omizu Sound
  // (Dub Corner), Ari Anne Wen (Freedom Stage), Magic in Motion (Temple Tent)
  await page.click('[data-jump="fri-19"]');

  const nownext = page.locator('#nownext-content');
  await expect(nownext.locator('.nn-act-name', { hasText: 'Samana' })).toBeVisible();
  await expect(nownext.locator('.nn-act-name', { hasText: 'Omizu Sound' })).toBeVisible();
  await expect(nownext.locator('.nothing-on')).not.toBeVisible();

  expect(errors).toEqual([]);
});

test('clock shows simulated label after setting dev time', async ({ page }) => {
  await page.goto('/');
  await page.click('#time-machine-btn');
  await page.click('[data-jump="fri-19"]');

  await expect(page.locator('#festival-clock')).toContainText('simulated');
});

test('Real Time button clears simulation and removes simulated label', async ({ page }) => {
  await page.goto('/');
  await page.click('#time-machine-btn');
  await page.click('[data-jump="fri-19"]');
  await expect(page.locator('#festival-clock')).toContainText('simulated');

  await page.click('[data-jump="real"]');
  await expect(page.locator('#festival-clock')).not.toContainText('simulated');
});
