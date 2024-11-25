const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const MAX_RETRIES = 3; // Maximum number of retries for login

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false, // Set to true in production
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();

    page.on('requestfailed', (req) =>
      console.error(`Request failed: ${req.url()} - ${req.failure()?.errorText}`)
    );
    page.on('response', (res) => console.log(`Response: ${res.url()} - ${res.status()}`));

    let retries = 0;
    let loggedIn = false;
    let cookies;

    while (retries < MAX_RETRIES && !loggedIn) {
      try {
        console.log(`Attempt ${retries + 1} to login...`);

        await page.goto('https://app.sellerassistant.app/login', {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });

        // Wait for the email field to be available
        await page.waitForSelector('#input-1', { visible: true, timeout: 15000 });
        await page.type('#input-1', email, { delay: 50 });

        // Wait for the password field to be available
        await page.waitForSelector('#input-3', { visible: true, timeout: 15000 });
        await page.type('#input-3', password, { delay: 50 });

        // Wait for and click the login button
        await page.waitForSelector('button[type="submit"]', { visible: true, timeout: 15000 });
        await page.click('button[type="submit"]');

        // Wait for successful navigation or timeout
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

        // If navigation is successful, retrieve cookies and break the loop
        cookies = await page.cookies();
        loggedIn = true;
      } catch (error) {
        console.warn(`Login attempt ${retries + 1} failed: ${error.message}`);
        retries++;

        if (retries < MAX_RETRIES) {
          console.log('Retrying login...');
          await page.reload({ waitUntil: 'domcontentloaded' });
        }
      }
    }

    await browser.close();

    if (loggedIn) {
      res.status(200).json({ cookies });
    } else {
      res.status(500).json({ error: 'Failed to login after multiple attempts' });
    }
  } catch (error) {
    console.error('Error in login process:', error.message);
    if (browser) await browser.close();
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
