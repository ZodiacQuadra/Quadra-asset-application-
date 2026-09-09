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

  // Click Stock Status tab
  await page.locator("text='Stock Status'").first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(__dirname, "stock_status_tab.png") });

  // Click Insights tab
  await page.locator("text='Insights'").first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(__dirname, "insights_tab.png") });

  console.log("Screenshots saved.");
  await browser.close();
})();
