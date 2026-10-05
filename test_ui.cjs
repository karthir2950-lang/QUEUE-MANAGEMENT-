const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  console.log("Navigating to login...");
  await page.goto('http://localhost:5175/login');
  await page.waitForTimeout(2000);
  
  console.log("Entering credentials...");
  await page.fill('input[type="email"]', 'admin@smartqueue.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(3000);
  console.log("Current URL:", page.url());
  
  await browser.close();
})();
