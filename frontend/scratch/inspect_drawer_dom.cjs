const { chromium } = require('c:/Users/PrasanthS/Documents/Quadra assest management system/asset-management-local/backend/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:53010/#/Asset/admin-approval', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const approveBtn = await page.$('button:has-text("Approve as Admin")');
  if (approveBtn) await approveBtn.click();
  await page.waitForTimeout(1000);

  const analysis = await page.evaluate(() => {
    const root = document.querySelector('#root') || document.body.firstElementChild;
    const bodyChildren = Array.from(document.body.children).map(c => ({
      tag: c.tagName,
      id: c.id,
      className: c.className,
      style: c.getAttribute('style'),
      rect: c.getBoundingClientRect(),
      visibility: window.getComputedStyle(c).visibility,
      display: window.getComputedStyle(c).display,
      opacity: window.getComputedStyle(c).opacity,
      bg: window.getComputedStyle(c).backgroundColor
    }));

    const drawerEl = document.querySelector('.fui-OverlayDrawer') || document.querySelector('.fui-Drawer');
    let parent = drawerEl;
    const drawerHierarchy = [];
    while (parent && parent !== document.body) {
      drawerHierarchy.push({
        tag: parent.tagName,
        className: parent.className,
        rect: parent.getBoundingClientRect(),
        bg: window.getComputedStyle(parent).backgroundColor
      });
      parent = parent.parentElement;
    }

    // Check what is at (100, 300) on screen
    const elemAtPoint = document.elementFromPoint(100, 300);
    let ep = elemAtPoint;
    const pointHierarchy = [];
    while (ep && ep !== document.body) {
      pointHierarchy.push({
        tag: ep.tagName,
        className: ep.className,
        bg: window.getComputedStyle(ep).backgroundColor,
        opacity: window.getComputedStyle(ep).opacity
      });
      ep = ep.parentElement;
    }

    return {
      bodyChildren,
      drawerHierarchy,
      pointHierarchy
    };
  });

  console.log(JSON.stringify(analysis, null, 2));
  await browser.close();
})();
