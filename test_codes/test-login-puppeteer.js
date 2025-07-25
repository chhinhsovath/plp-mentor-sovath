const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'login-test-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function testLogin() {
  console.log('🚀 Starting Puppeteer Login Test...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true if you don't want to see the browser
    devtools: true,  // Open DevTools automatically
    slowMo: 50,      // Slow down actions by 50ms for better visibility
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1280, height: 800 });

  // Enable console log capture
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log('🔴 Browser Console Error:', text);
    } else if (type === 'warning') {
      console.log('🟡 Browser Console Warning:', text);
    } else {
      console.log('🔵 Browser Console:', text);
    }
  });

  // Capture network failures
  page.on('requestfailed', request => {
    console.log('❌ Request failed:', request.url());
    console.log('   Failure:', request.failure().errorText);
  });

  // Capture responses
  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    
    if (url.includes('/auth/login')) {
      console.log(`\n📡 Login API Response: ${status}`);
      if (status >= 400) {
        console.log('   ❌ Login request failed with status:', status);
      }
    }
  });

  try {
    // Step 1: Navigate to login page
    console.log('1️⃣ Navigating to login page...');
    const navigationResponse = await page.goto('http://localhost:5173/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    if (!navigationResponse.ok()) {
      console.log('❌ Failed to load login page. Status:', navigationResponse.status());
      console.log('   Make sure frontend is running on http://localhost:5173');
      await browser.close();
      return;
    }

    console.log('   ✅ Login page loaded successfully');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '1-login-page.png'),
      fullPage: true 
    });

    // Wait for login form to be visible
    await page.waitForSelector('input[name="username"]', { visible: true, timeout: 10000 });

    // Step 2: Check if backend is accessible
    console.log('\n2️⃣ Checking backend connection...');
    try {
      const backendCheck = await page.evaluate(async () => {
        try {
          const response = await fetch('http://localhost:3000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'test', password: 'test' })
          });
          return {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText
          };
        } catch (error) {
          return { error: error.message };
        }
      });

      if (backendCheck.error) {
        console.log('   ❌ Backend is not accessible:', backendCheck.error);
        console.log('   Make sure backend is running on http://localhost:3000');
      } else {
        console.log('   ✅ Backend is responding. Status:', backendCheck.status);
      }
    } catch (error) {
      console.log('   ❌ Backend check failed:', error.message);
    }

    // Step 3: Fill in login form
    console.log('\n3️⃣ Filling login form...');
    
    // Type username
    await page.click('input[name="username"]');
    await page.type('input[name="username"]', 'chhinhs', { delay: 100 });
    console.log('   ✅ Entered username: chhinhs');

    // Type password
    await page.click('input[name="password"]');
    await page.type('input[name="password"]', 'password', { delay: 100 });
    console.log('   ✅ Entered password: password');

    await page.screenshot({ 
      path: path.join(screenshotsDir, '2-form-filled.png'),
      fullPage: true 
    });

    // Step 4: Submit login form
    console.log('\n4️⃣ Submitting login form...');
    
    // Prepare to capture the network request
    const loginPromise = page.waitForResponse(
      response => response.url().includes('/auth/login'),
      { timeout: 10000 }
    ).catch(() => null);

    // Click login button
    const loginButton = await page.$('button[type="submit"]');
    if (loginButton) {
      await loginButton.click();
      console.log('   ✅ Clicked login button');
    } else {
      // Try alternative selector
      await page.click('button:has-text("Login"), button:has-text("ចូលប្រើប្រាស់")');
      console.log('   ✅ Clicked login button (alternative selector)');
    }

    // Wait for response
    const loginResponse = await loginPromise;
    
    if (loginResponse) {
      const responseData = await loginResponse.json().catch(() => null);
      console.log('   📡 Login response status:', loginResponse.status());
      if (responseData) {
        console.log('   📡 Response data:', JSON.stringify(responseData, null, 2));
      }
    }

    // Wait a bit for any redirects or error messages
    await page.waitForTimeout(3000);

    // Step 5: Check result
    console.log('\n5️⃣ Checking login result...');
    
    // Check if we're redirected to dashboard
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('   ❌ Still on login page - login might have failed');
      
      // Check for error messages
      const errorMessage = await page.$eval('.MuiAlert-message', el => el.textContent).catch(() => null);
      if (errorMessage) {
        console.log('   ❌ Error message found:', errorMessage);
      }

      // Check for any visible error text
      const pageText = await page.evaluate(() => document.body.innerText);
      if (pageText.includes('error') || pageText.includes('Error')) {
        console.log('   ❌ Page contains error text');
      }
    } else {
      console.log('   ✅ Redirected away from login - login successful!');
      console.log('   🎉 Current page:', currentUrl);
    }

    await page.screenshot({ 
      path: path.join(screenshotsDir, '3-after-login.png'),
      fullPage: true 
    });

    // Step 6: Extract any errors from console
    console.log('\n6️⃣ Checking browser console for errors...');
    const consoleErrors = await page.evaluate(() => {
      const errors = [];
      // Get any React errors
      const errorElements = document.querySelectorAll('[class*="error"]');
      errorElements.forEach(el => {
        if (el.textContent) errors.push(el.textContent);
      });
      return errors;
    });

    if (consoleErrors.length > 0) {
      console.log('   Found errors on page:');
      consoleErrors.forEach(err => console.log('   - ', err));
    }

    // Keep browser open for debugging
    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log(`Screenshots saved to: ${screenshotsDir}`);
    console.log('Browser window will remain open for debugging.');
    console.log('Press Ctrl+C to close the browser and exit.');
    
    // Wait indefinitely (user can close manually)
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'error-screenshot.png'),
      fullPage: true 
    });
    await browser.close();
  }
}

// Run the test
console.log('🔧 PLP Mentoring Platform - Login Test with Puppeteer\n');
console.log('Prerequisites:');
console.log('1. Backend running on http://localhost:3000');
console.log('2. Frontend running on http://localhost:5173');
console.log('3. User "chhinhs" exists in database\n');

testLogin().catch(console.error);