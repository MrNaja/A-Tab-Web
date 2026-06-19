import { expect, test } from '@playwright/test';
import { Buffer } from 'node:buffer';

const GITHUB_API = 'https://api.github.com';
const FAVICON_PATTERN = 'https://www.google.com/s2/favicons**';
const TEST_TOKEN = 'github_pat_test_only';

const localBackup = {
  groups: [
    { id: 'sys:start_page', name: 'Start', type: 'system' },
    { id: 'grp_dev', name: 'Development', type: 'user' }
  ],
  bookmarks: [
    { id: 'start', title: 'Start link', url: 'https://start.example', groupId: 'sys:start_page', order: 0 },
    { id: 'divider', title: 'Tools', type: 'divider', groupId: 'grp_dev', order: 0 },
    { id: 'docs', title: 'Documentation', url: 'https://docs.example', groupId: 'grp_dev', order: 1 }
  ]
};

const githubBackup = {
  groups: [{ id: 'grp_cloud', name: 'Cloud', type: 'user' }],
  bookmarks: [
    { id: 'cloud', title: 'Cloud bookmark', url: 'https://cloud.example', groupId: 'grp_cloud', order: 0 }
  ]
};

const browserErrors = new WeakMap();

test.beforeEach(async ({ page }) => {
  const errors = [];
  browserErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  await page.route(FAVICON_PATTERN, (route) => route.fulfill({ status: 204 }));
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page) || [], 'Webpage emitted browser errors').toEqual([]);
});

async function openSettings(page) {
  await page.getByRole('button', { name: '自定义' }).click();
  await expect(page.getByRole('heading', { name: '常规设置' })).toBeVisible();
}

async function importBackup(page, backup = localBackup) {
  await openSettings(page);
  await page.locator('#importFileInput').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup))
  });
  await expect(page.getByText('导入成功')).toBeVisible();
}

test('starts cleanly with all core resources available', async ({ page }) => {
  const failedCoreRequests = [];
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (url.startsWith('http://127.0.0.1:4177/')) {
      failedCoreRequests.push(`${request.resourceType()}: ${url}`);
    }
  });

  await page.goto('/');

  await expect(page).toHaveTitle('A Tab Web');
  await expect(page.getByText('还没有导入数据')).toBeVisible();
  await expect(page.getByRole('button', { name: '自定义' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: '书签分组' })).toBeVisible();
  await expect(page.getByRole('region', { name: '起始页' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '起始页', level: 1 })).toBeAttached();
  await expect(page.locator('#currentGroupBadge')).toHaveAttribute('aria-label', '起始页，0 个书签');
  await expect(page.getByRole('button', { name: '起始页' })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.content-panel')).not.toHaveAttribute('aria-live');
  await expect(page.locator('#toastRegion')).toHaveAttribute('role', 'status');
  expect(failedCoreRequests).toEqual([]);
});

test('imports local JSON and restores it after reload', async ({ page }) => {
  await page.goto('/');
  await importBackup(page);

  await page.getByRole('button', { name: 'Development' }).click();
  const activeGroup = page.getByRole('button', { name: 'Development' });
  await expect(activeGroup).toHaveAttribute('aria-current', 'page');
  await expect(activeGroup).toBeFocused();
  await expect(page.getByRole('separator', { name: 'Tools' })).toBeVisible();
  const bookmark = page.getByRole('link', { name: '在新标签页打开: Documentation' });
  await expect(bookmark).toHaveAttribute('href', 'https://docs.example');
  await expect(bookmark).toHaveAttribute('target', '_blank');
  await expect(bookmark).toHaveAttribute('rel', 'noopener noreferrer');

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('a-tab-web:data') || 'null'));
  expect(stored.bookmarks).toHaveLength(3);

  await page.reload();
  await page.getByRole('button', { name: 'Development' }).click();
  await expect(page.getByRole('link', { name: '在新标签页打开: Documentation' })).toBeVisible();
});

test('supports keyboard settings and restores dialog focus', async ({ page }) => {
  await page.goto('/');

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: '跳到主要内容' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await page.keyboard.press('Tab');
  const settingsButton = page.getByRole('button', { name: '自定义' });
  await expect(settingsButton).toBeFocused();
  expect(await settingsButton.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(settingsButton).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('button', { name: '起始页' })).not.toHaveAttribute('aria-current');
  await expect(page.getByRole('region', { name: '自定义' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '自定义', level: 1 })).toBeAttached();

  const languageSelect = page.getByLabel('语言');
  await languageSelect.selectOption('en');
  await expect(page.getByLabel('Language')).toBeFocused();
  const fontSizeSelect = page.getByLabel('Font size');
  await fontSizeSelect.selectOption('large');
  await expect(page.getByLabel('Font size')).toBeFocused();
  const configureButton = page.getByRole('button', { name: 'Configure' });
  await configureButton.click();

  const dialog = page.getByRole('dialog', { name: 'Configure Github data source' });
  await expect(dialog).toHaveAttribute('aria-describedby', 'githubConfigHelp githubConfigStatus');
  expect(await page.locator('.app-shell').evaluate((element) => element.inert)).toBe(true);
  expect(await page.locator('#skipLink').evaluate((element) => Boolean(element.closest('[inert]')))).toBe(true);
  const tokenInput = page.getByLabel('Token');
  await expect(tokenInput).toBeFocused();
  await tokenInput.fill('temporary-token');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Save' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(tokenInput).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(configureButton).toBeFocused();
  expect(await page.locator('.app-shell').evaluate((element) => element.inert)).toBe(false);

  await page.reload();
  await page.getByRole('button', { name: 'Custom' }).click();
  await expect(page.getByLabel('Language')).toHaveValue('en');
  await expect(page.getByLabel('Font size')).toHaveValue('large');
});

test('imports Github backup with a session-only PAT and no real network', async ({ page }) => {
  const authorizationHeaders = [];
  await page.route(`${GITHUB_API}/**`, async (route) => {
    const request = route.request();
    authorizationHeaders.push(request.headers().authorization || '');
    const url = new URL(request.url());

    if (url.pathname === '/user') {
      await route.fulfill({ json: { login: 'octo' } });
      return;
    }
    if (url.pathname === '/repos/octo/a-tab-backup/contents/backup.json') {
      await route.fulfill({
        json: { content: Buffer.from(JSON.stringify(githubBackup)).toString('base64') }
      });
      return;
    }
    await route.abort('blockedbyclient');
  });

  await page.goto('/');
  await openSettings(page);
  await page.getByRole('button', { name: '配置' }).click();
  await page.getByLabel('Token').fill(TEST_TOKEN);
  await page.getByRole('button', { name: '保存配置' }).click();
  await expect(page.getByText('Github 配置已保存')).toBeVisible();

  const credentialStorage = await page.evaluate(() => ({
    legacy: localStorage.getItem('a-tab-web:github-config'),
    session: sessionStorage.getItem('a-tab-web:github-session-config')
  }));
  expect(credentialStorage.legacy).toBeNull();
  expect(credentialStorage.session).toContain(TEST_TOKEN);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '导入', exact: true }).click();
  await expect(page.getByText('Github 数据导入成功')).toBeVisible();
  await page.getByRole('button', { name: 'Cloud' }).click();
  await expect(page.getByRole('link', { name: '在新标签页打开: Cloud bookmark' })).toBeVisible();
  expect(authorizationHeaders.length).toBeGreaterThanOrEqual(3);
  expect(authorizationHeaders.every((header) => header === `token ${TEST_TOKEN}`)).toBe(true);
});

test('uses the mobile single-column layout without page overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'webpage-mobile', 'Mobile project only');
  await page.goto('/');
  await importBackup(page);
  await page.getByRole('button', { name: 'Development' }).click();

  const layout = await page.evaluate(() => {
    const sidebar = document.querySelector('.groups-sidebar');
    const content = document.querySelector('.content-panel');
    const groupList = document.querySelector('.group-list');
    const grid = document.querySelector('.bookmark-grid');
    if (!sidebar || !content || !groupList || !grid) throw new Error('Missing mobile layout elements');
    const sidebarRect = sidebar.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    return {
      columns: getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,
      contentBelowSidebar: contentRect.top >= sidebarRect.bottom - 1,
      groupDirection: getComputedStyle(groupList).flexDirection,
      noPageOverflow: document.documentElement.scrollWidth <= window.innerWidth
    };
  });

  expect(layout).toEqual({
    columns: 1,
    contentBelowSidebar: true,
    groupDirection: 'row',
    noPageOverflow: true
  });
});
