const puppeteer = require('puppeteer');

exports.loginSellerAssistant = async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto('https://app.sellerassistant.app/login', { waitUntil: 'domcontentloaded' });

    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).send('Missing email or password');
      return;
    }

    await page.type('#input-1', email);
    await page.type('#input-3', password);

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const cookies = await page.cookies();
    await browser.close();

    res.status(200).json({ cookies });
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
};
