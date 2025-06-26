const puppeteer = require('puppeteer');

const FB_EMAIL = process.env.FB_EMAIL;
const FB_PASSWORD = process.env.FB_PASSWORD;
const THREAD_ID = '525448593982349'; // 🛠 Replace with your actual Messenger thread ID

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
  console.log('🔐 Opening Messenger login...');
  await page.goto('https://www.messenger.com/');

  // Auto-login using credentials
  try {
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.type('#email', FB_EMAIL);
    await page.type('#pass', FB_PASSWORD);
    await page.click('button[name="login"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Logged in successfully!');
  } catch (err) {
    console.error('❌ Login failed or already logged in:', err.message);
  }

  // Go to the specific Messenger thread
  await page.goto(`https://www.messenger.com/t/${THREAD_ID}`);
  await page.waitForSelector('[data-testid="message-container"]');

  console.log('🤖 Bot is running...');

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
        lastMessage = newMessage;

        if (['hi', 'hello', 'kamusta'].some(w => newMessage.toLowerCase().includes(w))) {
          await page.type('div[contenteditable="true"]', 'Hello! 🤖');
          await page.keyboard.press('Enter');
          console.log('✅ Replied to message');
        }
      }
    } catch (err) {
      console.error('❌ Message read/reply error:', err.message);
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
  }
})();
