const puppeteer = require('puppeteer');
const responseHandler = require('./responseHandler');

const FB_EMAIL = process.env.FB_EMAIL;
const FB_PASSWORD = process.env.FB_PASSWORD;
const THREAD_ID = process.env.THREAD_ID;

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
    ]
  });

  const page = await browser.newPage();

  try {
    console.log('🔐 Logging into Messenger...');
    await page.goto('https://www.messenger.com/');

    await page.waitForSelector('#email', { timeout: 15000 });
    await page.type('#email', FB_EMAIL);
    await page.type('#pass', FB_PASSWORD);
    await page.click('button[name="login"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
    console.log('✅ Logged in!');

    console.log('➡️ Navigating to thread...');
    await page.goto(`https://www.messenger.com/t/${THREAD_ID}`);

    // Wait additional time for Messenger UI to finish loading
    await new Promise(resolve => setTimeout(resolve, 10000));

    try {
      // Try primary selector
      await page.waitForSelector('[data-testid="message-container"]', { timeout: 30000 });
    } catch (e) {
      console.warn('⚠️ message-container not found, trying fallback selector...');
      await page.waitForSelector('div[role="row"]', { timeout: 20000 });
    }

    await page.screenshot({ path: 'after-thread-load.png' });
    console.log('💬 Chat thread loaded successfully!');
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    await page.screenshot({ path: 'error.png' });
    await browser.close();
    process.exit(1);
  }

  console.log('🤖 Bot is now running and listening...');

  let lastMessage = null;

  while (true) {
    try {
      const newMessage = await page.evaluate(() => {
        const messages = document.querySelectorAll('[data-testid="message-container"], div[role="row"]');
        const last = messages[messages.length - 1];
        const text = last?.querySelector('[dir="auto"]');
        return text ? text.innerText : null;
      });

      if (newMessage && newMessage !== lastMessage) {
        console.log('📩 New message detected:', newMessage);
        lastMessage = newMessage;

        const response = responseHandler.processMessage(THREAD_ID, newMessage);
        if (response) {
          await page.type('div[contenteditable="true"]', response);
          await page.keyboard.press('Enter');
          console.log('✅ Replied with:', response);
        } else {
          console.log('🤫 No reply needed for this message.');
        }
      }
    } catch (err) {
      console.error('❌ Message handling error:', err.message);
    }

    await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
  }

  // (Never closes browser in loop)
})();
