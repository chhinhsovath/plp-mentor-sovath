const puppeteer = require('puppeteer');

async function quickLoginTest() {
  console.log('🚀 Quick Login Test (Headless)\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Capture console logs
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });

    // Capture failed requests
    page.on('requestfailed', request => {
      console.log('❌ Request failed:', request.url(), '-', request.failure().errorText);
    });

    console.log('1️⃣ Checking if frontend is running...');
    try {
      await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 10000 });
      console.log('   ✅ Frontend is accessible');
    } catch (error) {
      console.log('   ❌ Frontend is NOT running on http://localhost:5173');
      console.log('   Run: cd frontend && npm run dev');
      await browser.close();
      return;
    }

    console.log('\n2️⃣ Checking if backend is running...');
    const backendStatus = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3000/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'test', password: 'test' })
        });
        return { status: response.status, reachable: true };
      } catch (error) {
        return { reachable: false, error: error.message };
      }
    });

    if (!backendStatus.reachable) {
      console.log('   ❌ Backend is NOT running on http://localhost:3000');
      console.log('   Error:', backendStatus.error);
      console.log('   Run: cd backend && npm run start:dev');
      await browser.close();
      return;
    }
    console.log('   ✅ Backend is accessible (Status:', backendStatus.status + ')');

    console.log('\n3️⃣ Testing login with chhinhs account...');
    
    // Wait for form fields
    await page.waitForSelector('input[name="username"]', { visible: true });
    
    // Fill login form
    await page.type('input[name="username"]', 'chhinhs');
    await page.type('input[name="password"]', 'password');
    
    // Prepare to capture the login response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/auth/login'),
      { timeout: 10000 }
    );

    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for login response
    const loginResponse = await responsePromise;
    const responseData = await loginResponse.json().catch(() => ({}));
    
    console.log('   📡 Login API Response:', loginResponse.status());
    
    if (loginResponse.status() === 200 || loginResponse.status() === 201) {
      console.log('   ✅ Login successful!');
      if (responseData.tokens) {
        console.log('   ✅ JWT tokens received');
      }
      if (responseData.user) {
        console.log('   ✅ User data:', {
          id: responseData.user.id,
          username: responseData.user.username,
          role: responseData.user.role
        });
      }
    } else {
      console.log('   ❌ Login failed with status:', loginResponse.status());
      if (responseData.message) {
        console.log('   Error message:', responseData.message);
      }
      console.log('   Response:', JSON.stringify(responseData, null, 2));
    }

    // Check if redirected
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    
    if (finalUrl.includes('/login')) {
      console.log('\n❌ Login failed - still on login page');
      
      // Check for error messages
      const errorText = await page.$eval('body', el => el.innerText).catch(() => '');
      if (errorText.toLowerCase().includes('error')) {
        console.log('   Error on page detected');
      }
    } else {
      console.log('\n✅ Login successful - redirected to:', finalUrl);
    }

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n📊 Test complete!');
}

// Run test
quickLoginTest().catch(console.error);