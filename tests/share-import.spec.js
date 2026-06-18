import { test, expect } from '@playwright/test';

async function setSaved(page, ids) {
  await page.addInitScript((ids) => {
    localStorage.setItem('uf26_saved', JSON.stringify(ids));
  }, ids);
}

async function mockWorker(page) {
  await page.route('**/acts/**', route => route.fulfill({ status: 200, body: 'OK' }));
}

// ─── Share button ─────────────────────────────────────────────────────────────

test('share button copies a URL containing the saved act IDs', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await mockWorker(page);
  await setSaved(page, [9, 10]);
  await page.goto('/#v=myprog');
  await page.locator('#share-btn').click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(/[?&]share=9,10$/);
});

test('share button is visible when acts are saved', async ({ page }) => {
  await mockWorker(page);
  await setSaved(page, [9]);
  await page.goto('/#v=myprog');
  await expect(page.locator('#share-btn')).toBeVisible();
});

test('share button is hidden when nothing is saved', async ({ page }) => {
  await page.goto('/#v=myprog');
  await expect(page.locator('#share-btn')).not.toBeVisible();
});

// ─── Import view ──────────────────────────────────────────────────────────────

test('opening a share link shows the import view', async ({ page }) => {
  await mockWorker(page);
  await page.goto('/?share=9,10');
  await expect(page.locator('#import-view')).toBeVisible();
  await expect(page.locator('#myprog-view')).not.toBeVisible();
  await expect(page.locator('#browse-view')).not.toBeVisible();
});

test('import view shows the shared acts', async ({ page }) => {
  await mockWorker(page);
  await page.goto('/?share=9,10');
  const list = page.locator('#import-list');
  await expect(list.locator('.timeline-act[data-id="9"]')).toBeVisible();
  await expect(list.locator('.timeline-act[data-id="10"]')).toBeVisible();
});

test('import view "Add all" button shows count of unsaved acts', async ({ page }) => {
  await mockWorker(page);
  await page.goto('/?share=9,10');
  await expect(page.locator('#import-add-all')).toContainText('Add all (2)');
});

test('import view "Add all" count excludes already-saved acts', async ({ page }) => {
  await mockWorker(page);
  await setSaved(page, [9]);
  await page.goto('/?share=9,10');
  await expect(page.locator('#import-add-all')).toContainText('Add all (1)');
});

test('import view "Add all" is disabled when all acts already saved', async ({ page }) => {
  await mockWorker(page);
  await setSaved(page, [9, 10]);
  await page.goto('/?share=9,10');
  await expect(page.locator('#import-add-all')).toBeDisabled();
});

test('"Add all" adds acts to My Programme and navigates there', async ({ page }) => {
  await mockWorker(page);
  await page.goto('/?share=9,10');
  await page.locator('#import-add-all').click();
  await expect(page.locator('#myprog-view')).toBeVisible();
  await expect(page.locator('#import-view')).not.toBeVisible();
  await expect(page.locator('#myprog-grid .act-card[data-id="9"]')).toBeVisible();
  await expect(page.locator('#myprog-grid .act-card[data-id="10"]')).toBeVisible();
});

test('"Add all" does not re-add acts already in My Programme', async ({ page }) => {
  await mockWorker(page);
  await setSaved(page, [9]);
  await page.goto('/?share=9,10');
  await page.locator('#import-add-all').click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('uf26_saved') || '[]'));
  expect(saved.filter(id => id === 9)).toHaveLength(1);
});

test('individual save button in import view adds the act', async ({ page }) => {
  await mockWorker(page);
  await page.goto('/?share=9,10');
  const act = page.locator('#import-list .timeline-act[data-id="9"]');
  await expect(act).not.toHaveClass(/saved/);
  await act.locator('.tl-save').click();
  await expect(act).toHaveClass(/saved/);
});

test('"Go to My Programme" navigates without adding acts', async ({ page }) => {
  await mockWorker(page);
  await page.goto('/?share=9,10');
  await page.locator('#import-done').click();
  await expect(page.locator('#myprog-view')).toBeVisible();
  await expect(page.locator('#import-view')).not.toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('uf26_saved') || '[]'));
  expect(saved).toHaveLength(0);
});

test('switching to a tab dismisses the import view', async ({ page }) => {
  await mockWorker(page);
  await page.goto('/?share=9,10');
  await expect(page.locator('#import-view')).toBeVisible();
  await page.locator('.view-tab[data-view="browse"]').click();
  await expect(page.locator('#import-view')).not.toBeVisible();
  await expect(page.locator('#browse-view')).toBeVisible();
});

test('unknown act IDs in share param are silently ignored', async ({ page }) => {
  await mockWorker(page);
  await page.goto('/?share=9,99999');
  await expect(page.locator('#import-view')).toBeVisible();
  await expect(page.locator('#import-list .timeline-act[data-id="9"]')).toBeVisible();
  await expect(page.locator('#import-list .timeline-act[data-id="99999"]')).not.toBeAttached();
});

test('share param with no valid IDs does not show import view', async ({ page }) => {
  await mockWorker(page);
  await page.goto('/?share=99999,88888');
  await expect(page.locator('#import-view')).not.toBeVisible();
});
