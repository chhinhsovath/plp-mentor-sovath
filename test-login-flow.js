const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:3000/api/v1';

// Test credentials
const TEST_USER = {
  email: 'admin@moeys.gov.kh',
  password: 'Test123!@#'
};

async function takeScreenshot(page, name) {
  await page.screenshot({ 
    path: `test-screenshots/${name}-${Date.now()}.png`,
    fullPage: true 
  });
}

async function testLoginFlow() {
  console.log('🧪 Testing Login Flow with Puppeteer\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to false to see the browser
    slowMo: 50, // Slow down by 50ms
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('1️⃣ Navigating to homepage...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if we're redirected to login or if there's a login button
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    // Look for login button or form
    let loginButton = await page.$('a[href*="login"]') || 
                      await page.$('button[text*="Login"]') ||
                      await page.$('button[text*="ចូលប្រើ"]');
    
    if (loginButton) {
      console.log('2️⃣ Found login button, clicking...');
      await loginButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    } else if (!currentUrl.includes('/login')) {
      console.log('2️⃣ Navigating directly to login page...');
      await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
    }
    
    await new Promise(r => setTimeout(r, 2000));
    console.log(`   Now at: ${page.url()}`);
    
    // Wait for login form
    console.log('3️⃣ Looking for login form...');
    
    // Try different selectors for email/username field
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="អ៊ីមែល" i]',
      '#email',
      'input[type="text"]'
    ];
    
    let emailField = null;
    for (const selector of emailSelectors) {
      emailField = await page.$(selector);
      if (emailField) {
        console.log(`   Found email field with selector: ${selector}`);
        break;
      }
    }
    
    if (!emailField) {
      throw new Error('Could not find email input field');
    }
    
    // Try different selectors for password field
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password" i]',
      'input[placeholder*="ពាក្យសម្ងាត់" i]',
      '#password'
    ];
    
    let passwordField = null;
    for (const selector of passwordSelectors) {
      passwordField = await page.$(selector);
      if (passwordField) {
        console.log(`   Found password field with selector: ${selector}`);
        break;
      }
    }
    
    if (!passwordField) {
      throw new Error('Could not find password input field');
    }
    
    console.log('4️⃣ Filling login form...');
    await emailField.type(TEST_USER.email, { delay: 100 });
    await passwordField.type(TEST_USER.password, { delay: 100 });
    
    await takeScreenshot(page, 'login-form-filled');
    
    // Find and click submit button
    console.log('5️⃣ Looking for submit button...');
    const submitSelectors = [
      'button[type="submit"]',
      'form button',
      'button'
    ];
    
    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        submitButton = await page.$(selector);
        if (submitButton) {
          const buttonText = await page.evaluate(el => el.textContent, submitButton);
          console.log(`   Found submit button: "${buttonText}"`);
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    if (!submitButton) {
      throw new Error('Could not find submit button');
    }
    
    console.log('6️⃣ Submitting login form...');
    await submitButton.click();
    
    // Wait for navigation or response
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
      new Promise(r => setTimeout(r, 5000))
    ]);
    
    await takeScreenshot(page, 'after-login');
    
    const finalUrl = page.url();
    console.log(`\n✅ Login test completed!`);
    console.log(`   Final URL: ${finalUrl}`);
    console.log(`   Login successful: ${!finalUrl.includes('/login')}`);
    
    // Check if we can access protected pages
    console.log('\n7️⃣ Testing access to protected pages...');
    
    const protectedPages = [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Users', url: '/users' },
      { name: 'Forms', url: '/forms' },
      { name: 'Missions', url: '/missions' }
    ];
    
    for (const protectedPage of protectedPages) {
      console.log(`   Checking ${protectedPage.name}...`);
      await page.goto(`${FRONTEND_URL}${protectedPage.url}`, { waitUntil: 'networkidle2' });
      const currentUrl = page.url();
      const hasAccess = !currentUrl.includes('/login');
      console.log(`   ${hasAccess ? '✅' : '❌'} ${protectedPage.name}: ${hasAccess ? 'Accessible' : 'Redirected to login'}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    console.log('\nClosing browser...');
    await browser.close();
  }
}

// Create screenshots directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('test-screenshots')) {
  fs.mkdirSync('test-screenshots');
}

// Run the test
testLoginFlow().catch(console.error);