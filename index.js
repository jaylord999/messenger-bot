const express = require('express');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const { handleMessages } = require('./responseHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

let logs = [];
let latestScreenshot = null;

// Logging helper
const log = (msg) => {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${msg}`;
  console.log(entry);
  logs.unshift(entry); // Keep newest first
  if (logs.length > 100) logs.pop(); // Limit log length
};

// Serve images
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

// Web UI
app.get('/', (req, res) => {
  const screenshotImg = latestScreenshot
    ? `<img src="/screenshots/${latestScreenshot}" width="300" />`
    : `<em>No screenshot captured</em>`;
  const logHtml = logs.map(line => `<div>${line}</div>`).join('');

  res.send(`
    <html>
      <head><title>Messenger Bot</title></head>
      <body style="font-family: sans-serif; padding: 20px;">
        <h1>🤖 Messenger Bot is running</h1>
        <h2>📝 Logs:</h2>
        <div style="background: #f3f3f3; padding: 10px; max-height: 300px; overflow-y: auto;">
          ${logHtml}
        </div>
        <h2>🖼️ Latest Debug Screenshot:</h2>
        ${screenshotImg}
      </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  log(`🌐 Express server running on port ${PORT}`);
  startBot();
});

// Bot logic
async function startBot() {
  try {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();

    if ((day === 0 || day === 6) || (day === 5 && hour >= 22) || (day === 1 && hour < 2)) {
      log('⏰ Bot is outside active hours (Mon 2AM – Fri 10PM). Sleeping.');
      return;
    }

    log('🔐 Logging into Messenger...');
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.goto('https://www.messenger.com/login');
    await page.type('#email', process.env.FB_EMAIL, { delay: 50 });
    await page.type('#pass', process.env.FB_PASSWORD, { delay: 50 });
    await Promise.all([
      page.click('[name="login"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    log('✅ Logged in!');

    const threadUrl = `https://www.messenger.com/t/${process.env.THREAD_ID}`;
    await page.goto(threadUrl, { waitUntil: 'networkidle2' });
    log('➡️ Navigated to thread');

    try {
      await page.waitForSelector('[data-testid="message-container"]', { timeout: 30000 });
      log('✅ Message container detected!');
    } catch {
      log('⚠️ message-container not found, trying fallback selector...');
      try {
        await page.waitForSelector('div[role="row"]', { timeout: 30000 });
        log('✅ Fallback message row detected!');
      } catch (err) {
        log('❌ Failed to detect messages. Capturing screenshot.');
        const screenshotDir = path.join(__dirname, 'screenshots');
        fs.mkdirSync(screenshotDir, { recursive: true });
        latestScreenshot = `error_${Date.now()}.png`;
        const screenshotPath = path.join(screenshotDir, latestScreenshot);
        await page.screenshot({ path: screenshotPath });
        log(`🖼️ Screenshot saved: ${latestScreenshot}`);
        await browser.close();
        return;
      }
    }

    log('🔍 Waiting for messages...');
    await handleMessages(page, log); // Pass logger to your handler

  } catch (error) {
    log(`🔥 Fatal error: ${error.message}`);
  }
}
