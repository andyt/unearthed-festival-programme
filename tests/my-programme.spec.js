import { test, expect } from '@playwright/test';

// Set localStorage before the page loads so the app initialises with saved acts.
async function setSaved(page, ids) {
  await page.addInitScript((ids) => {
    localStorage.setItem('uf26_saved', JSON.stringify(ids));
  }, ids);
}

// Silence expected worker fetch failures so they don't clutter test output.
async function mockWorker(page, onRequest) {
  await page.route('**/acts/**', async route => {
    if (onRequest) onRequest(route.request());
    await route.fulfill({ status: 200, body: 'OK' });
  });
}

// ─── Saving / unsaving via the grid ──────────────────────────────────────────

test('clicking heart saves an act and marks the card', async ({ page }) => {
  await mockWorker(page);
  await page.goto('/?v=browse');
  await page.waitForSelector('.act-card');

  const card = page.locator('.act-card[data-id="9"]');
  await expect(card).not.toHaveClass(/saved/);
  await card.locator('.save-btn').click();
  await expect(card).toHaveClass(/saved/);
});

test('clicking heart again unsaves the act', async ({ page }) => {
  await mockWorker(page);
  await setSaved(page, [9]);
  await page.goto('/?v=browse');
  await page.waitForSelector('.act-card');

  const card = page.locator('.act-card[data-id="9"]');
  await expect(card).toHaveClass(/saved/);
  await card.locator('.save-btn').click();
  await expect(card).not.toHaveClass(/saved/);
});

// ─── My Programme view ───────────────────────────────────────────────────────

test('saved act appears in My Programme with correct name, time and stage', async ({ page }) => {
  await mockWorker(page);
  await setSaved(page, [9]);
  await page.goto('/?v=myprog');

  const act = page.locator('#my-programme-list .timeline-act[data-id="9"]');
  await expect(act.locator('.tl-name')).toHaveText('Roni Size');
  await expect(act.locator('.tl-time')).toHaveText('23:30');
  await expect(act.locator('.tl-stage')).toHaveText('Main Stage');
});

test('My Programme shows all saved acts', async ({ page }) => {
  await mockWorker(page);
  await setSaved(page, [9, 10, 108]);
  await page.goto('/?v=myprog');

  const list = page.locator('#my-programme-list');
  await expect(list.locator('.timeline-act[data-id="9"]')).toBeVisible();
  await expect(list.locator('.timeline-act[data-id="10"]')).toBeVisible();
  await expect(list.locator('.timeline-act[data-id="108"]')).toBeVisible();
});

test('My Programme sorts acts by day then by time, post-midnight after pre-midnight', async ({ page }) => {
  await mockWorker(page);
  // id 9 = Roni Size, fri 23:30  (pre-midnight)
  // id 10 = DJ Moonshine, fri 01:00 (post-midnight, same festival night)
  // id 108 = Goldie Lookin Chain, sat 23:30 (Saturday)
  await setSaved(page, [10, 108, 9]);
  await page.goto('/?v=myprog');

  const acts = page.locator('#my-programme-list .timeline-act');
  await expect(acts).toHaveCount(3);
  await expect(acts.nth(0).locator('.tl-name')).toHaveText('Roni Size');        // fri 23:30
  await expect(acts.nth(1).locator('.tl-name')).toHaveText('DJ Moonshine');     // fri 01:00 (post-midnight)
  await expect(acts.nth(2).locator('.tl-name')).toHaveText('Goldie Lookin Chain'); // sat 23:30
});

test('Subscribe button is visible when acts are saved', async ({ page }) => {
  await mockWorker(page);
  await setSaved(page, [9]);
  await page.goto('/?v=myprog');
  await expect(page.locator('#subscribe-section')).toBeVisible();
});

test('Subscribe button is hidden when nothing is saved', async ({ page }) => {
  await page.goto('/?v=myprog');
  await expect(page.locator('#subscribe-section')).not.toBeVisible();
});

test('calendar link input shows the HTTPS feed URL', async ({ page }) => {
  await mockWorker(page);
  await setSaved(page, [9]);
  await page.goto('/?v=myprog');
  const value = await page.locator('#cal-link-input').inputValue();
  expect(value).toMatch(/^https:\/\/.+\/calendar\/[0-9a-f-]{36}$/);
});

test('Copy link button copies the feed URL to clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await mockWorker(page);
  await setSaved(page, [9]);
  await page.goto('/?v=myprog');
  await page.locator('#cal-link-copy').click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  const inputValue = await page.locator('#cal-link-input').inputValue();
  expect(copied).toBe(inputValue);
});

test('removing an act from My Programme takes it off the list', async ({ page }) => {
  await mockWorker(page);
  await setSaved(page, [9]);
  await page.goto('/?v=myprog');

  const act = page.locator('#my-programme-list .timeline-act[data-id="9"]');
  await expect(act).toBeVisible();
  await act.locator('.tl-save').click();
  // CSS transition fires transitionend (~220ms) then the list re-renders
  await expect(page.locator('#my-programme-list .timeline-act[data-id="9"]')).not.toBeAttached({ timeout: 2000 });
});

// ─── Worker sync ─────────────────────────────────────────────────────────────

test('saving an act triggers a PUT to the worker with the act data', async ({ page }) => {
  let putBody = null;
  await mockWorker(page, req => {
    if (req.method() === 'PUT') putBody = req.postData();
  });

  await page.goto('/?v=browse');
  await page.waitForSelector('.act-card');
  await page.locator('.act-card[data-id="9"] .save-btn').click();

  // pushToWorker debounces by 1 second
  await page.waitForTimeout(1500);

  expect(putBody).not.toBeNull();
  const ids = JSON.parse(putBody);
  expect(Array.isArray(ids)).toBe(true);
  expect(ids).toContain(9);
});
