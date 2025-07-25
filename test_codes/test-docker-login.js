const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'docker-login-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function testDockerLogin() {
  console.log('🐳 Testing Login with Docker Services\n');
  console.log('=====================================\n');

  // First, test the API directly
  console.log('1️⃣ Testing Backend API directly...');
  try {
    const apiTest = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'chhinhs',
      password: 'password'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });

    console.log('   ✅ Backend API is working!');
    console.log(`   Status: ${apiTest.status}`);
    if (apiTest.data.user) {
      console.log(`   User: ${apiTest.data.user.username} (${apiTest.data.user.role})`);
    }
    if (apiTest.data.tokens) {
      console.log('   ✅ JWT tokens received');
    }
  } catch (error) {
    console.log('   ❌ Backend API Error:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data.message || JSON.stringify(error.response.data)}`);
    } else {
      console.log(`   ${error.message}`);
    }
  }

  // Now test with Puppeteer
  console.log('\n2️⃣ Testing Frontend with Puppeteer...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Capture console logs
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error') {
        console.log('   🔴 Console Error:', msg.text());
      } else if (type === 'warning') {
        console.log('   🟡 Console Warning:', msg.text());
      }
    });

    // Capture failed requests
    page.on('requestfailed', request => {
      console.log('   ❌ Request failed:', request.url());
      console.log('      Reason:', request.failure().errorText);
    });

    // Navigate to login page
    console.log('\n3️⃣ Navigating to login page...');
    await page.goto('http://localhost:5173/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('   ✅ Login page loaded');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '1-login-page.png'),
      fullPage: true 
    });

    // Check what's on the page
    const pageTitle = await page.title();
    console.log(`   Page title: ${pageTitle}`);

    // Wait for form elements
    console.log('\n4️⃣ Looking for login form...');
    
    // Try different selectors
    const selectors = {
      username: ['input[name="username"]', '#username', 'input[type="text"]'],
      password: ['input[name="password"]', '#password', 'input[type="password"]'],
      submit: ['button[type="submit"]', 'button:contains("Login")', 'button:contains("ចូលប្រើប្រាស់")']
    };

    let usernameField = null;
    let passwordField = null;
    let submitButton = null;

    // Find username field
    for (const selector of selectors.username) {
      usernameField = await page.$(selector);
      if (usernameField) {
        console.log(`   ✅ Found username field with: ${selector}`);
        break;
      }
    }

    // Find password field
    for (const selector of selectors.password) {
      passwordField = await page.$(selector);
      if (passwordField) {
        console.log(`   ✅ Found password field with: ${selector}`);
        break;
      }
    }

    // Find submit button
    for (const selector of selectors.submit) {
      submitButton = await page.$(selector);
      if (submitButton) {
        console.log(`   ✅ Found submit button with: ${selector}`);
        break;
      }
    }

    if (!usernameField || !passwordField) {
      console.log('   ❌ Could not find login form fields!');
      
      // Get page content for debugging
      const pageContent = await page.content();
      fs.writeFileSync(path.join(screenshotsDir, 'page-content.html'), pageContent);
      console.log('   📄 Page HTML saved to docker-login-screenshots/page-content.html');
      
      // Try to find any input fields
      const allInputs = await page.$$eval('input', inputs => 
        inputs.map(input => ({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder
        }))
      );
      console.log('   Found inputs:', allInputs);
      
      return;
    }

    // Fill the form
    console.log('\n5️⃣ Filling login form...');
    await usernameField.click();
    await page.keyboard.type('chhinhs', { delay: 100 });
    console.log('   ✅ Entered username: chhinhs');

    await passwordField.click();
    await page.keyboard.type('password', { delay: 100 });
    console.log('   ✅ Entered password: password');

    await page.screenshot({ 
      path: path.join(screenshotsDir, '2-form-filled.png'),
      fullPage: true 
    });

    // Set up request interception to capture login request
    console.log('\n6️⃣ Submitting login form...');
    
    const loginResponsePromise = page.waitForResponse(
      response => response.url().includes('/auth/login'),
      { timeout: 10000 }
    ).catch(() => null);

    // Click submit
    if (submitButton) {
      await submitButton.click();
    } else {
      // Try pressing Enter
      await page.keyboard.press('Enter');
    }
    console.log('   ✅ Form submitted');

    // Wait for response
    const loginResponse = await loginResponsePromise;
    
    if (loginResponse) {
      console.log(`   📡 Login API Response: ${loginResponse.status()}`);
      const responseData = await loginResponse.json().catch(() => null);
      if (responseData) {
        console.log('   Response:', JSON.stringify(responseData, null, 2));
      }
    }

    // Wait for navigation or error
    await page.waitForTimeout(3000);

    // Check result
    console.log('\n7️⃣ Checking login result...');
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    if (!currentUrl.includes('/login')) {
      console.log('   ✅ Login successful! Redirected to:', currentUrl);
    } else {
      console.log('   ⚠️  Still on login page');
      
      // Check for errors
      const errorElements = await page.$$('[class*="error"], [class*="Error"], .MuiAlert-message');
      for (const element of errorElements) {
        const text = await element.evaluate(el => el.textContent);
        if (text) {
          console.log('   Error message:', text);
        }
      }
    }

    await page.screenshot({ 
      path: path.join(screenshotsDir, '3-final-result.png'),
      fullPage: true 
    });

    console.log('\n✅ Test complete!');
    console.log(`📸 Screenshots saved in: ${screenshotsDir}`);
    console.log('🔍 Browser will remain open for inspection');
    console.log('Press Ctrl+C to exit\n');

    // Keep browser open
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'error.png'),
      fullPage: true 
    }).catch(() => {});
  }
}

// Run the test
console.log('🐳 Docker Login Test\n');
console.log('Docker containers detected:');
console.log('- Backend: http://localhost:3000');
console.log('- Frontend: http://localhost:5173\n');

testDockerLogin().catch(console.error);