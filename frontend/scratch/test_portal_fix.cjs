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

  // Set transparent on the portal provider
  await page.evaluate(() => {
    document.querySelectorAll('body > .fui-FluentProvider').forEach(el => {
      el.style.setProperty('background-color', 'transparent', 'important');
      el.style.setProperty('background', 'transparent', 'important');
    });
  });

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/Users/PrasanthS/.gemini/antigravity-ide/brain/67e52341-0534-4680-b388-5821eb95e457/drawer_after_transparent_fix.png' });
  await browser.close();
  console.log('Tested transparent fix screenshot captured');
})();
