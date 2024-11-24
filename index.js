const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const browser = await puppeteer.launch({
      headless: false, // Use true in production
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();

    page.on('requestfailed', (req) =>
      console.error(`Request failed: ${req.url()} - ${req.failure()?.errorText}`)
    );
    page.on('response', (res) => console.log(`Response: ${res.url()} - ${res.status()}`));

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    await page.goto('https://app.sellerassistant.app/login', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForSelector('#input-1', { timeout: 60000 });
    await page.type('#input-1', email);
    await page.waitForSelector('#input-3', { timeout: 60000 });
    await page.type('#input-3', password);

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

    const cookies = await page.cookies();
    await browser.close();

    res.status(200).json({ cookies });
  } catch (error) {
    console.error('Error in login:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
