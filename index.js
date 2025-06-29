// index.js
const express = require("express");
const puppeteer = require("puppeteer");
const handleResponses = require("./responseHandler");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const {
  FB_EMAIL,
  FB_PASSWORD,
  THREAD_ID
} = process.env;

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Messenger bot is running.");
});

app.listen(PORT, () => {
  console.log(`\u{1F310} Express server running on port ${PORT}`);
});

(async () => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  // Only run between Monday 2AM and Friday 10PM
  if (day === 0 || (day === 1 && hour < 2) || (day === 5 && hour >= 22) || day === 6) {
    console.log("\u{1F6D1} Outside active hours. Bot won't run.");
    return;
  }

  console.log("\u{1F512} Logging into Messenger...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  try {
    await page.goto("https://www.messenger.com", { waitUntil: "networkidle2" });

    await page.type("#email", FB_EMAIL);
    await page.type("#pass", FB_PASSWORD);
    await page.click("#loginbutton");
    await page.waitForNavigation({ waitUntil: "networkidle2" });
    console.log("\u2705 Logged in!");

    await page.goto(`https://www.messenger.com/t/${THREAD_ID}`, { waitUntil: "networkidle2" });
    console.log("\u27A1\uFE0F Navigating to thread...");

    try {
      await page.waitForSelector('[data-testid="message-container"]', { timeout: 60000 });
    } catch (e1) {
      console.warn("\u26A0\uFE0F message-container not found, trying fallback selector...");
      try {
        await page.waitForSelector('div[role="row"]', { timeout: 60000 });
      } catch (e2) {
        console.error("\u274C Still couldn’t find message list.");
        await page.screenshot({ path: "error_screenshot.png" });
        await browser.close();
        return;
      }
    }

    console.log("\u{1F50D} Waiting for messages...");

    // Monitor and respond
    await handleResponses(page);
  } catch (err) {
    console.error("\u274C Fatal error:", err);
    await page.screenshot({ path: "fatal_error.png" });
    await browser.close();
  }
})();
