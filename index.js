const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/login', async (req, res) => {
  let browser;
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    browser = await puppeteer.launch({
      headless: false, // Set to true in production
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();

    // Event listeners for debugging
    page.on('requestfailed', (req) =>
      console.error(`Request failed: ${req.url()} - ${req.failure()?.errorText}`)
    );
    page.on('response', (response) =>
      console.log(`Response: ${response.url()} - ${response.status()}`)
    );

    // Set navigation timeout to avoid premature timeout errors
    await page.setDefaultNavigationTimeout(60000); // Set timeout to 60 seconds

    await page.goto('https://app.sellerassistant.app/login', {
      waitUntil: 'domcontentloaded', // Load page without waiting for all resources
    });

    await page.waitForSelector('#input-1', { visible: true, timeout: 15000 });
    await page.type('#input-1', email, { delay: 50 });

    await page.waitForSelector('#input-3', { visible: true, timeout: 15000 });
    await page.type('#input-3', password, { delay: 50 });

    await page.waitForSelector('button[type="submit"]', { visible: true, timeout: 15000 });
    await page.click('button[type="submit"]');

    // Attempt to wait for navigation
    try {
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 30000, // 30 seconds timeout for navigation
      });
    } catch (navError) {
      console.warn('Navigation timeout exceeded, returning available cookies...');
    }

    // Retrieve cookies at this point, whether navigation succeeded or not
    const cookies = await page.cookies();
    await browser.close();

    res.status(200).json({ cookies });
  } catch (error) {
    console.error('Error in login:', error.message);

    // If there's an error, attempt to retrieve cookies before closing the browser
    if (browser) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          const cookies = await pages[0].cookies();
          await browser.close();
          return res.status(200).json({ cookies, error: error.message });
        }
      } catch (cookieError) {
        console.error('Error retrieving cookies after failure:', cookieError.message);
      }
      await browser.close();
    }

    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
