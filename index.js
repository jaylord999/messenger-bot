const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
dotenv.config();

const FB_EMAIL = process.env.FB_EMAIL;
const FB_PASSWORD = process.env.FB_PASSWORD;
const THREAD_ID = process.env.THREAD_ID;
const { getResponse } = require('./responseHandler');

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
      '--single-process'
    ]
  });

  const page = await browser.newPage();

  try {
    console.log('🔐 Logging into Messenger...');
    await page.goto('https://www.messenger.com');
    await page.waitForSelector('#email', { timeout: 15000 });
    await page.type('#email', FB_EMAIL);
    await page.type('#pass', FB_PASSWORD);
    await page.click('button[name="login"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    if (page.url().includes('login.php')) {
      console.error('❌ Login failed');
      await page.screenshot({ path: 'login-failed.png' });
      await browser.close();
      process.exit(1);
    }
    console.log('✅ Logged in!');

    console.log('➡️ Navigating to thread...');
    await page.goto(`https://www.messenger.com/t/${THREAD_ID}`);
    await page.waitForSelector('[data-testid="message-container"]', { timeout: 30000 });
    console.log('💬 Thread loaded!');

    let lastMessage = null;

    while (true) {
      try {
        const newMessage = await page.evaluate(() => {
          const messages = document.querySelectorAll('[data-testid="message-container"]');
          const last = messages[messages.length - 1];
          const text = last?.querySelector('[dir="auto"]');
          return text ? text.innerText : null;
        });

        if (newMessage && newMessage !== lastMessage) {
          console.log('📩 New message:', newMessage);
          const response = getResponse(lastMessage, newMessage);
          if (response) {
            await page.type('div[contenteditable="true"]', response);
            await page.keyboard.press('Enter');
            console.log('✅ Sent response:', response);
          }
          lastMessage = newMessage;
        }
      } catch (e) {
        console.error('❌ Error:', e.message);
      }
      await new Promise(res => setTimeout(res, 5000));
    }
  } catch (err) {
    console.error('❌ Fatal error:', err);
    await browser.close();
    process.exit(1);
  }
})();
