const { chromium } = require("playwright-core");
const path = require("path");

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:53010/#/Asset/reports", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  await page.locator("text='Insights'").first().click();
  await page.waitForTimeout(500);

  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(__dirname, "insights_lower.png") });

  await browser.close();
})();
