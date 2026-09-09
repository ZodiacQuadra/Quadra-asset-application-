const { chromium } = require('c:/Users/PrasanthS/Documents/Quadra assest management system/asset-management-local/backend/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:53010/#/Asset/admin-approval', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click "Approve as Admin" button
  const approveBtn = await page.$('button:has-text("Approve as Admin")');
  if (approveBtn) {
    console.log('Clicking Approve as Admin button...');
    await approveBtn.click();
    await page.waitForTimeout(1000);
  } else {
    console.log('Approve as Admin button not found, clicking first card');
    const firstCard = await page.$('.asset-approval-card, div[style*="cursor: pointer"]');
    if (firstCard) await firstCard.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: 'C:/Users/PrasanthS/.gemini/antigravity-ide/brain/67e52341-0534-4680-b388-5821eb95e457/drawer_opened_playwright.png' });

  // Inspect elements on page
  const debugInfo = await page.evaluate(() => {
    const backdrop = document.querySelector('.fui-OverlayDrawer__backdrop, .fui-Drawer__backdrop, [class*="backdrop"]');
    const drawer = document.querySelector('.fui-OverlayDrawer, .fui-Drawer, [class*="OverlayDrawer"]');
    const portals = Array.from(document.querySelectorAll('.fui-Portal, [class*="Portal"]')).map(p => ({
      className: p.className,
      rect: p.getBoundingClientRect(),
      innerHTML: p.innerHTML.substring(0, 200)
    }));
    const sidebar = document.querySelector('.asset-sidebar');
    const shell = document.querySelector('.asset-shell');
    const main = document.querySelector('.asset-main');
    return {
      backdrop: backdrop ? {
        className: backdrop.className,
        style: backdrop.getAttribute('style'),
        computedBg: window.getComputedStyle(backdrop).backgroundColor,
        computedBackdropFilter: window.getComputedStyle(backdrop).backdropFilter || window.getComputedStyle(backdrop).webkitBackdropFilter,
        rect: backdrop.getBoundingClientRect()
      } : null,
      drawer: drawer ? {
        className: drawer.className,
        computedBg: window.getComputedStyle(drawer).backgroundColor,
        rect: drawer.getBoundingClientRect()
      } : null,
      sidebarRect: sidebar ? sidebar.getBoundingClientRect() : null,
      shellRect: shell ? shell.getBoundingClientRect() : null,
      mainRect: main ? main.getBoundingClientRect() : null,
      portals
    };
  });

  console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
  await browser.close();
})();
