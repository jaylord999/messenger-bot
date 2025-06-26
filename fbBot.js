const puppeteer = require('puppeteer');

const FB_EMAIL = process.env.FB_EMAIL;
const FB_PASSWORD = process.env.FB_PASSWORD;
const THREAD_ID = '525448593982349'; // 🛠 Replace with your actual thread ID

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
    await page.waitForSelector('#email', { timeout: 15000 });
    await page.type('#email', FB_EMAIL);
    await page.type('#pass', FB_PASSWORD);
    await page.click('button[name="login"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

const currentUrl = page.url();
if (currentUrl.includes('login.php')) {
  console.error('❌ Login failed — still on login page.');
  await page.screenshot({ path: 'login-failed.png' });
  await browser.close();
  process.exit(1);
}

console.log('✅ Logged in successfully and authenticated!');

    console.error('⚠️ Login screen not detected — may already be logged in');
  }

  console.log('➡️ Navigating to chat thread...');
  try {
    await page.goto(`https://www.messenger.com/t/${THREAD_ID}`);
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for chat to load

    console.log('🌐 Current URL:', page.url());

    await page.waitForSelector('[data-testid="message-container"]', { timeout: 30000 });
    console.log('💬 Chat thread loaded successfully!');
  } catch (e) {
    console.error('❌ Failed to load chat thread:', e.message);
    await page.screenshot({ path: 'chat-load-error.png' });
    await browser.close();
    process.exit(1);
  }

  console.log('🤖 Bot is now running and listening...');

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
        console.log('📩 New message detected:', newMessage);
        lastMessage = newMessage;

        const triggers = ['hi', 'hello', 'kamusta'];
        if (triggers.some(w => newMessage.toLowerCase().includes(w))) {
          await page.type('div[contenteditable="true"]', 'Hello! 🤖');
          await page.keyboard.press('Enter');
          console.log('✅ Replied to message.');
        }
      }
    } catch (err) {
      console.error('❌ Message handling error:', err.message);
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // We don't close the browser so it can keep running
})();
