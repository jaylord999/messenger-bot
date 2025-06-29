const puppeteer = require('puppeteer');
const { getResponse } = require('./responseHandler');
require('dotenv').config();

const FB_EMAIL = process.env.FB_EMAIL;
const FB_PASSWORD = process.env.FB_PASSWORD;
const THREAD_ID = process.env.THREAD_ID;

function isAllowedTime() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const hour = now.getHours();

  return (day >= 1 && day <= 5) && (day !== 5 || hour < 22) && (day !== 1 || hour >= 2);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    userDataDir: './fb-profile',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  console.log('🔐 Logging into Messenger...');
  await page.goto('https://www.messenger.com/');

  try {
    await page.waitForSelector('#email', { timeout: 15000 });
    await page.type('#email', FB_EMAIL);
    await page.type('#pass', FB_PASSWORD);
    await page.click('button[name="login"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Logged in!');
  } catch (err) {
    console.error('❌ Login failed:', err.message);
    await page.screenshot({ path: 'login-error.png' });
    process.exit(1);
  }

  console.log('➡️ Navigating to thread...');
  await page.goto(`https://www.messenger.com/t/${THREAD_ID}`);

  let loaded = false;
  try {
    await page.waitForSelector('[data-testid="message-container"]', { timeout: 30000 });
    loaded = true;
  } catch {
    console.warn('⚠️ message-container not found, trying fallback selector...');
    try {
      await page.waitForSelector('div[role="row"]', { timeout: 20000 });
      loaded = true;
    } catch {
      console.error('❌ Fatal error: Failed to load chat UI.');
      process.exit(1);
    }
  }

  console.log('💬 Chat loaded, monitoring...');

  let lastMessage = null;

  while (true) {
    try {
      if (!isAllowedTime()) {
        console.log('⏳ Outside active hours. Waiting...');
        await new Promise(r => setTimeout(r, 60000));
        continue;
      }

      const newMessage = await page.evaluate(() => {
        const rows = [...document.querySelectorAll('[data-testid="message-container"], div[role="row"]')];
        const last = rows.at(-1);
        const textEl = last?.querySelector('[dir="auto"]');
        return textEl?.innerText ?? null;
      });

      if (newMessage && newMessage !== lastMessage) {
        console.log('📩 New message detected:', newMessage);
        lastMessage = newMessage;

        const response = getResponse(lastMessage);
        if (response) {
          await page.type('div[contenteditable="true"]', response);
          await page.keyboard.press('Enter');
          console.log(`✅ Replied with: ${response}`);
        } else {
          console.log('🕵️ No matching response rule.');
        }
      }
    } catch (err) {
      console.error('⚠️ Error while handling message:', err.message);
    }

    await new Promise(r => setTimeout(r, 5000));
  }
})();
