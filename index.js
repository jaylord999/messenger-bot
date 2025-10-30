const puppeteer = require('puppeteer');
const cron = require('node-cron');
const { getResponse } = require('./responder');

async function runBot() {
  console.log('🤖 Starting bot task...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // go to Messenger conversation
  await page.goto('https://www.messenger.com/t/<TARGET_ID>', { waitUntil: 'networkidle2' });

  try {
    const messages = await page.$$eval('[data-testid="message-container"] div[dir="auto"]', els =>
      els.map(el => el.innerText)
    );
    const lastMsg = messages[messages.length - 1];

    const reply = getResponse(lastMsg);
    if (reply) {
      const textbox = await page.$('[role="textbox"]');
      await textbox.type(reply, { delay: 50 });
      await page.keyboard.press('Enter');
      console.log('💬 Sent reply:', reply);
    } else {
      console.log('❌ No matching response found.');
    }
  } catch (err) {
    console.error('Error processing messages:', err);
  }

  await browser.close();
  console.log('✅ Bot task finished.');
}

// Schedule the bot to run every 5 minutes
cron.schedule('*/5 * * * *', () => {
  console.log('⏱ Cron triggered');
  runBot();
});

// Optional: HTTP server for Render free-tier to keep service alive
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot service running'));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
