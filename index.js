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
      headless: true, // Use headless mode in production
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();

    // Log requests and responses for debugging
    page.on('requestfailed', (req) =>
      console.error(`Request failed: ${req.url()} - ${req.failure()?.errorText}`)
    );
    page.on('response', (response) =>
      console.log(`Response: ${response.url()} - ${response.status()}`)
    );

    // Navigate to login page
    await page.goto('https://app.sellerassistant.app/login', { waitUntil: 'domcontentloaded' });

    // Input email
    await page.waitForSelector('#input-1', { visible: true, timeout: 10000 });
    await page.type('#input-1', email);

    // Input password
    await page.waitForSelector('#input-3', { visible: true, timeout: 10000 });
    await page.type('#input-3', password);

    // Click the login button
    await page.waitForSelector('button[type="submit"]', { visible: true, timeout: 10000 });
    await page.evaluate(() => {
      const submitButton = document.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.click();
      }
    });

    // Wait for navigation after login
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    } catch (navError) {
      console.warn('Navigation timeout exceeded. Returning available cookies...');
    }

    // Collect cookies, even if navigation fails
    const cookies = await page.cookies();

    await browser.close();
    res.status(200).json({ cookies });
  } catch (error) {
    console.error('Error in login:', error.message);

    // Capture cookies before responding with an error
    if (browser) {
      try {
        const pages = await browser.pages();
        const cookies = await pages[0]?.cookies();
        await browser.close();

        if (cookies && cookies.length > 0) {
          return res.status(200).json({ cookies });
        }
      } catch (cookieError) {
        console.warn('Failed to capture cookies during error handling:', cookieError.message);
      }
    }

    // Return the error if no cookies are available
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
