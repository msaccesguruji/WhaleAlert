
const puppeteer = require('puppeteer');

async function loginSellerAssistant() {
  try {
    const launchOptions = {
      headless: true, // Set to true for headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    // Set a user agent to mimic a real browser
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    );

    // Navigate to the login page
    console.log('Navigating to login page...');
    await page.goto('https://app.sellerassistant.app/login', { waitUntil: 'domcontentloaded' });

    // Wait for the email input field to appear
    console.log('Waiting for email input...');
    await page.waitForSelector('#input-1', { timeout: 10000 }); // Wait up to 10 seconds
    await page.type('#input-1', 'phdigitalservice@gmail.com'); // Fill email

    // Wait for the password input field to appear
    console.log('Waiting for password input...');
    await page.waitForSelector('#input-3', { timeout: 10000 }); // Wait up to 10 seconds
    await page.type('#input-3', '0x7fw00T'); // Fill password

    // Wait for the Login button and click it
    console.log('Waiting for login button...');
    await page.waitForSelector('button[type="submit"]', { timeout: 10000 });
    await page.click('button[type="submit"]');

    // Wait for navigation or login confirmation
    console.log('Waiting for navigation...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    // Retrieve cookies/session
    console.log('Retrieving cookies...');
    const cookies = await page.cookies();
    console.log('Login successful. Cookies:', cookies);

    await browser.close();
    return cookies;
  } catch (error) {
    console.error('Error during login:', error.message);
  }
}

loginSellerAssistant();
