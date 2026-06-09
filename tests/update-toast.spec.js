import { test, expect } from '@playwright/test';

// Patch window.fetch so the version-check call (which fetches location.href)
// returns HTML reporting a newer version. Bypasses the service worker entirely.
async function patchFetchMismatch(page) {
  await page.evaluate(() => {
    const orig = window.fetch;
    window.fetch = (url, opts) => {
      if (typeof url === 'string' && url === location.href) {
        return Promise.resolve(new Response(
          '<meta name="app-version" content="NEWVERSION">',
          { status: 200, headers: { 'Content-Type': 'text/html' } }
        ));
      }
      return orig(url, opts);
    };
  });
}

// Same patch but returns the current version — so no toast should appear.
async function patchFetchSameVersion(page) {
  await page.evaluate(() => {
    const current = document.querySelector('meta[name="app-version"]')?.content ?? '';
    const orig = window.fetch;
    window.fetch = (url, opts) => {
      if (typeof url === 'string' && url === location.href) {
        return Promise.resolve(new Response(
          `<meta name="app-version" content="${current}">`,
          { status: 200, headers: { 'Content-Type': 'text/html' } }
        ));
      }
      return orig(url, opts);
    };
  });
}

// Dispatch a visibilitychange event so the version-check handler fires
// immediately (the page is already visible so visibilityState === 'visible').
async function triggerVersionCheck(page) {
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
}

// ─── Initial state ───────────────────────────────────────────────────────────

test('update toast is hidden on page load', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#festival-clock');
  await expect(page.locator('#update-toast')).not.toHaveClass(/show/);
});

test('reload button is hidden on page load', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#festival-clock');
  await expect(page.locator('#reload-btn')).not.toHaveClass(/show/);
});

// ─── Version mismatch detected ───────────────────────────────────────────────

test('update toast gains the "show" class when a newer version is detected', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#festival-clock');
  await patchFetchMismatch(page);
  await triggerVersionCheck(page);
  await expect(page.locator('#update-toast')).toHaveClass(/show/, { timeout: 3000 });
});

test('reload button gains the "show" class when a newer version is detected', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#festival-clock');
  await patchFetchMismatch(page);
  await triggerVersionCheck(page);
  await expect(page.locator('#reload-btn')).toHaveClass(/show/, { timeout: 3000 });
});

test('update toast does not appear when the version has not changed', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#festival-clock');
  await patchFetchSameVersion(page);
  await triggerVersionCheck(page);
  await page.waitForTimeout(500);
  await expect(page.locator('#update-toast')).not.toHaveClass(/show/);
});

// ─── Reload on click ─────────────────────────────────────────────────────────

test('clicking the update toast triggers a page reload', async ({ page }) => {
  // The update toast is only on-screen for mobile viewports (< 601px); on desktop
  // a media query keeps it hidden even with the "show" class.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForSelector('#festival-clock');
  await patchFetchMismatch(page);
  await triggerVersionCheck(page);
  await expect(page.locator('#update-toast')).toHaveClass(/show/, { timeout: 3000 });

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.locator('#update-toast').click(),
  ]);
});

test('clicking the reload button triggers a page reload', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#festival-clock');
  await patchFetchMismatch(page);
  await triggerVersionCheck(page);
  await expect(page.locator('#reload-btn')).toHaveClass(/show/, { timeout: 3000 });

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.locator('#reload-btn').click(),
  ]);
});
