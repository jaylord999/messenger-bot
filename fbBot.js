const puppeteer = require('puppeteer');

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

  // Step 1: Login (only once; session will be saved)
  console.log('🔐 Opening Messenger...');
  await page.goto('https://www.messenger.com/');
  await page.waitForTimeout(30000); // wait 30s to log in manually the first time

  // Step 2: Go to specific thread
  const threadId = '525448593982349'; // <--- Insert your thread ID here!
  await page.goto(`https://www.messenger.com/t/${threadId}`);
  await page.waitForSelector('[data-testid="message-container"]');

  console.log('🤖 Bot started. Listening for new messages...');

  let lastMessage = null;

  while (true) {
    try {
      const newMessage = await page.evaluate(() => {
        const list = document.querySelectorAll('[data-testid="message-container"]');
        const last = list[list.length - 1];
        const text = last?.querySelector('[dir="auto"]');
        return text ? text.innerText : null;
      });

      if (newMessage && newMessage !== lastMessage) {
        console.log('📩 New message:', newMessage);
        lastMessage = newMessage;

        // Reply logic
        const replyTriggers = ['hi', 'hello', 'kamusta'];
        if (replyTriggers.some(t => newMessage.toLowerCase().includes(t))) {
          await page.type('div[contenteditable="true"]', 'Hello! 🤖');
          await page.keyboard.press('Enter');
          console.log('✅ Replied.');
        }

        // Try clicking a quick reply or postback button
        const button = await page.$('div[aria-label="Yes"]');
        if (button) {
          console.log('🖱 Clicking button...');
          await button.click();
        }
      }

    } catch (err) {
      console.error('❌ Error:', err.message);
    }

    await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5s before checking again
  }

  // browser.close(); // Don't close if running continuously
})();
