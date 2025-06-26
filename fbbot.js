const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: './fb-profile',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null
  });

  const page = await browser.newPage();
  await page.goto('https://www.messenger.com/');

  await page.waitForTimeout(30000); // log in manually once

  await page.goto('https://www.messenger.com/t/REPLACE_THIS_WITH_THREAD_ID');
  await page.waitForSelector('[data-testid="message-container"]');

  let lastMessage = null;

  while (true) {
    try {
      const message = await page.evaluate(() => {
        const list = document.querySelectorAll('[data-testid="message-container"]');
        const last = list[list.length - 1];
        const text = last.querySelector('[dir="auto"]');
        return text ? text.innerText : null;
      });

      if (message && message !== lastMessage) {
        console.log('New message:', message);
        lastMessage = message;

        if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hi")) {
          await page.type('div[contenteditable="true"]', 'Hi there! 🤖');
          await page.keyboard.press('Enter');
        }
      }

    } catch (err) {
      console.error('Error:', err.message);
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
  }
})();
