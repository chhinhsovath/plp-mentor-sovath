const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const LOGIN_URL = 'https://mentoring.openplp.com/login';
const TEST_CREDENTIALS = [
  { username: 'chhinhs', password: 'password', description: 'Admin account' },
  { username: 'teacher', password: 'teacher123', description: 'Teacher account' },
  { username: 'invalid', password: 'wrong', description: 'Invalid credentials' }
];

// Create screenshots directory
async function ensureScreenshotsDir() {
  const dir = path.join(__dirname, 'login-test-screenshots');
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
  return dir;
}

// Helper to take screenshot with timestamp
async function takeScreenshot(page, name) {
  const screenshotsDir = await ensureScreenshotsDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(screenshotsDir, `${timestamp}_${name}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);
  return filename;
}

// Helper to capture console logs
function setupConsoleLogging(page) {
  const consoleLogs = [];
  
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString()
    };
    consoleLogs.push(logEntry);
    
    // Print errors and warnings
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`🔴 Console ${msg.type()}: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`🔴 Page error: ${error.message}`);
    consoleLogs.push({
      type: 'pageerror',
      text: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });
  
  return consoleLogs;
}

// Helper to capture network requests
function setupNetworkLogging(page) {
  const networkLogs = [];
  
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      networkLogs.push({
        type: 'request',
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      networkLogs.push({
        type: 'response',
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  page.on('requestfailed', request => {
    networkLogs.push({
      type: 'requestfailed',
      url: request.url(),
      failure: request.failure(),
      timestamp: new Date().toISOString()
    });
    console.log(`🔴 Request failed: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  return networkLogs;
}

// Test login functionality
async function testLogin(page, credentials) {
  console.log(`\n🧪 Testing login for: ${credentials.description} (${credentials.username})`);
  console.log('=' .repeat(60));
  
  const consoleLogs = setupConsoleLogging(page);
  const networkLogs = setupNetworkLogging(page);
  
  try {
    // Navigate to login page
    console.log(`📍 Navigating to ${LOGIN_URL}`);
    await page.goto(LOGIN_URL, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Take screenshot of login page
    await takeScreenshot(page, `login-page-${credentials.username}`);
    
    // Check if login form exists
    const loginForm = await page.$('form');
    if (!loginForm) {
      console.log('❌ Login form not found!');
      return { success: false, error: 'Login form not found' };
    }
    
    // Clear and fill username
    console.log('📝 Filling login form...');
    const usernameInput = await page.$('input[name="username"], input[type="text"]');
    if (usernameInput) {
      await usernameInput.click({ clickCount: 3 });
      await usernameInput.type(credentials.username);
    } else {
      console.log('❌ Username input not found!');
      return { success: false, error: 'Username input not found' };
    }
    
    // Clear and fill password
    const passwordInput = await page.$('input[name="password"], input[type="password"]');
    if (passwordInput) {
      await passwordInput.click({ clickCount: 3 });
      await passwordInput.type(credentials.password);
    } else {
      console.log('❌ Password input not found!');
      return { success: false, error: 'Password input not found' };
    }
    
    // Take screenshot before submit
    await takeScreenshot(page, `before-submit-${credentials.username}`);
    
    // Submit form
    console.log('🚀 Submitting login form...');
    
    // Create promise to wait for navigation or API response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/auth/login'),
      { timeout: 10000 }
    ).catch(() => null);
    
    // Click submit button
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
    } else {
      // Try pressing Enter
      await passwordInput.press('Enter');
    }
    
    // Wait for response or timeout
    const response = await responsePromise;
    
    // Wait a bit for any error messages to appear
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot after submit
    await takeScreenshot(page, `after-submit-${credentials.username}`);
    
    // Check for error messages
    const errorAlert = await page.$('.ant-alert-error, [role="alert"]');
    if (errorAlert) {
      const errorText = await errorAlert.evaluate(el => el.textContent);
      console.log(`⚠️  Error message displayed: ${errorText}`);
    }
    
    // Check if still on login page
    const currentUrl = page.url();
    const loginSuccess = !currentUrl.includes('/login');
    
    // Get response details if available
    if (response) {
      const responseBody = await response.text().catch(() => '');
      console.log(`📡 API Response Status: ${response.status()} ${response.statusText()}`);
      if (responseBody) {
        try {
          const jsonResponse = JSON.parse(responseBody);
          console.log(`📡 API Response:`, JSON.stringify(jsonResponse, null, 2));
        } catch {
          console.log(`📡 API Response (text): ${responseBody.substring(0, 200)}...`);
        }
      }
    }
    
    // Save logs
    const logsDir = await ensureScreenshotsDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    await fs.writeFile(
      path.join(logsDir, `${timestamp}_console_${credentials.username}.json`),
      JSON.stringify(consoleLogs, null, 2)
    );
    
    await fs.writeFile(
      path.join(logsDir, `${timestamp}_network_${credentials.username}.json`),
      JSON.stringify(networkLogs, null, 2)
    );
    
    // Result
    if (loginSuccess) {
      console.log(`✅ Login successful! Redirected to: ${currentUrl}`);
      return { success: true, redirectUrl: currentUrl };
    } else {
      console.log(`❌ Login failed. Still on login page.`);
      return { success: false, error: 'Login failed - no redirect occurred' };
    }
    
  } catch (error) {
    console.error(`❌ Test error: ${error.message}`);
    await takeScreenshot(page, `error-${credentials.username}`);
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting PLP Mentoring Login Tests');
  console.log(`🌐 Testing URL: ${LOGIN_URL}`);
  console.log(`📅 Test Date: ${new Date().toISOString()}`);
  console.log('=' .repeat(60));
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI/CD
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });
  
  const results = [];
  
  try {
    // Test each set of credentials
    for (const credentials of TEST_CREDENTIALS) {
      const page = await browser.newPage();
      
      // Set viewport
      await page.setViewport({ width: 1280, height: 800 });
      
      // Set user agent
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
      
      // Run test
      const result = await testLogin(page, credentials);
      results.push({
        ...credentials,
        ...result,
        timestamp: new Date().toISOString()
      });
      
      await page.close();
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Summary
    console.log('\n📊 Test Summary');
    console.log('=' .repeat(60));
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.description}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    // Save results
    const logsDir = await ensureScreenshotsDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await fs.writeFile(
      path.join(logsDir, `${timestamp}_test_results.json`),
      JSON.stringify(results, null, 2)
    );
    
    console.log(`\n📁 Test artifacts saved in: ${logsDir}`);
    
  } finally {
    await browser.close();
  }
}

// Check if we can reach the site first
async function checkSiteAvailability() {
  console.log(`🔍 Checking site availability...`);
  try {
    const https = require('https');
    const url = new URL(LOGIN_URL);
    
    return new Promise((resolve) => {
      https.get(url, (res) => {
        console.log(`✅ Site is reachable. Status: ${res.statusCode}`);
        resolve(true);
      }).on('error', (err) => {
        console.log(`❌ Site is not reachable: ${err.message}`);
        resolve(false);
      });
    });
  } catch (error) {
    console.log(`❌ Error checking site: ${error.message}`);
    return false;
  }
}

// Run the tests
(async () => {
  try {
    const siteAvailable = await checkSiteAvailability();
    if (!siteAvailable) {
      console.log('\n⚠️  Warning: Site may not be accessible. Tests might fail.');
    }
    
    await runTests();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();