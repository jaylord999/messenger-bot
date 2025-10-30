const puppeteer = require('puppeteer');
const { getResponse } = require('./responder');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // load cookies if you have saved
  // await page.setCookie(...cookies);

  // go to Messenger conversation
  await page.goto('https://www.messenger.com/t/<TARGET_ID>', { waitUntil: 'networkidle2' });

  // main loop: check messages and reply
  while (true) {
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
      }
    } catch (err) {
      console.error(err);
    }

    await page.waitForTimeout(2000); // poll every 2s
  }

  // await browser.close(); // never reached in continuous worker
})();
