const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

// Initialize Express app
const app = express();
app.use(express.json()); // Middleware to parse JSON request bodies
app.use(cors()); // Enable Cross-Origin Resource Sharing (CORS)

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request payload
    if (!email || !password) {
      res.status(400).json({ error: 'Missing email or password' });
      return;
    }

    // Launch Puppeteer browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto('https://app.sellerassistant.app/login', { waitUntil: 'domcontentloaded' });

    // Type the login credentials
    await page.type('#input-1', email);
    await page.type('#input-3', password);

    // Click the submit button and wait for navigation
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Retrieve cookies after login
    const cookies = await page.cookies();
    await browser.close();

    // Respond with the cookies
    res.status(200).json({ cookies });
  } catch (error) {
    console.error('Error in login:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start the server on port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://140.245.27.252:${PORT}`);
});
