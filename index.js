const express = require('express');
const puppeteer = require('puppeteer');
const responseHandler = require('./responseHandler');
const app = express();

const FB_EMAIL = process.env.FB_EMAIL;
const FB_PASSWORD = process.env.FB_PASSWORD;
const THREAD_ID = process.env.THREAD_ID;

app.get('/', (_, res) => res.send('Messenger bot is running'));
app.listen(3000, () => console.log('🌐 Express server running on port 3000'));

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    userDataDir: './fb-profile',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-zygote',
      '--single-process',
    ],
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

    if (page.url().includes('login.php')) {
      console.error('❌ Login failed');
      await browser.close();
      process.exit(1);
    }
    console.log('✅ Logged in!');
  } catch (e) {
    console.error('⚠️ Login screen not detected — maybe already logged in');
  }

  console.log('➡️ Navigating to thread...');
  await page.goto(`https://www.messenger.com/t/${THREAD_ID}`);
  try {
    await page.waitForSelector('[data-testid="message-container"]', { timeout: 30000 });
  } catch {
    console.warn('⚠️ message-container not found, trying fallback selector...');
    await page.waitForSelector('div[role="row"]', { timeout: 20000 });
  }

  console.log('🤖 Bot is running and listening...');

  let lastMessage = null;

  while (true) {
    const now = new Date();
    const isActiveTime = now.getDay() >= 1 && now.getDay() <= 5 &&
                         (now.getDay() !== 5 || now.getHours() < 22) &&
                         (now.getDay() !== 1 || now.getHours() >= 2);

    if (!isActiveTime) {
      console.log('⏱ Outside active window — waiting...');
      await new Promise(res => setTimeout(res, 60000));
      continue;
    }

    try {
      const latest = await page.evaluate(() => {
        const messages = document.querySelectorAll('[data-testid="message-container"]');
        const last = messages[messages.length - 1];
        const text = last?.querySelector('[dir="auto"]');
        const sender = last?.getAttribute('data-senderid') || 'unknown';
        return { senderId: sender, text: text?.innerText || null };
      });

      if (latest.text && latest.text !== lastMessage) {
        console.log('📩 New message:', latest.text);
        const reply = responseHandler.processMessage(latest.senderId, latest.text);
        if (reply) {
          await page.type('div[contenteditable="true"]', reply);
          await page.keyboard.press('Enter');
          console.log('✅ Replied with:', reply);
        } else {
          console.log('⏭ No matching reply');
        }
        lastMessage = latest.text;
      }
    } catch (e) {
      console.error('❌ Error in loop:', e.message);
    }

    await new Promise(res => setTimeout(res, 5000));
  }
})();
