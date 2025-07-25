const puppeteer = require('puppeteer');
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let backendProcess = null;

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'hybrid-login-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function startLocalBackend() {
  console.log('🚀 Starting Local Backend (to bypass Docker errors)...\n');
  
  // First check if backend is already running
  try {
    const check = await axios.get('http://localhost:3000/api/v1/auth/login');
    console.log('   ✅ Backend already running locally!');
    return true;
  } catch (error) {
    // Backend not running, start it
  }

  return new Promise((resolve, reject) => {
    console.log('   Starting backend server...');
    
    backendProcess = spawn('npm', ['run', 'start:dev'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    let started = false;

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('   Backend:', output.trim());
      
      if (output.includes('Application is running on:') && !started) {
        started = true;
        console.log('   ✅ Backend started successfully!\n');
        setTimeout(() => resolve(true), 2000); // Give it 2 more seconds
      }
    });

    backendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (error.includes('error')) {
        console.error('   Backend Error:', error);
      }
    });

    backendProcess.on('error', (error) => {
      console.error('   ❌ Failed to start backend:', error.message);
      reject(error);
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      if (!started) {
        console.log('   ❌ Backend startup timeout');
        reject(new Error('Backend startup timeout'));
      }
    }, 60000);
  });
}

async function testHybridLogin() {
  console.log('🔀 Hybrid Login Test (Docker Frontend + Local Backend)\n');
  console.log('======================================================\n');

  try {
    // Start local backend
    await startLocalBackend();

    // Test API directly first
    console.log('📡 Testing Backend API...');
    try {
      const apiTest = await axios.post('http://localhost:3000/api/v1/auth/login', {
        username: 'chhinhs',
        password: 'password'
      });

      console.log('   ✅ API Login Success!');
      console.log(`   User: ${apiTest.data.user.username} (${apiTest.data.user.role})`);
    } catch (error) {
      console.log('   ❌ API Error:', error.response?.data?.message || error.message);
    }

    // Now test with Puppeteer
    console.log('\n🎭 Testing with Puppeteer...\n');
    
    const browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      slowMo: 50
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to Docker frontend
    console.log('1️⃣ Opening Docker Frontend...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    console.log('   ✅ Login page loaded');
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '1-login-page.png'),
      fullPage: true 
    });

    // Fill form
    console.log('\n2️⃣ Filling login form...');
    await page.waitForSelector('input[name="username"]', { visible: true });
    await page.type('input[name="username"]', 'chhinhs');
    await page.type('input[name="password"]', 'password');
    console.log('   ✅ Form filled');

    await page.screenshot({ 
      path: path.join(screenshotsDir, '2-form-filled.png'),
      fullPage: true 
    });

    // Submit
    console.log('\n3️⃣ Submitting login...');
    
    // Listen for the response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/auth/login'),
      { timeout: 10000 }
    ).catch(() => null);

    await page.click('button[type="submit"]');
    console.log('   ✅ Form submitted');

    const loginResponse = await responsePromise;
    if (loginResponse) {
      console.log(`   📡 Login Response: ${loginResponse.status()}`);
      if (loginResponse.ok()) {
        console.log('   ✅ Login successful!');
      }
    }

    // Wait for navigation
    await page.waitForTimeout(3000);
    
    const finalUrl = page.url();
    console.log(`\n4️⃣ Result: ${finalUrl}`);
    
    if (!finalUrl.includes('/login')) {
      console.log('   ✅ Successfully logged in and redirected!');
      await page.screenshot({ 
        path: path.join(screenshotsDir, '3-logged-in.png'),
        fullPage: true 
      });
    } else {
      console.log('   ⚠️  Still on login page');
      
      // Check for errors
      const errors = await page.$$eval('[class*="error"], .MuiAlert-message', 
        els => els.map(el => el.textContent).filter(text => text)
      );
      if (errors.length > 0) {
        console.log('   Errors found:', errors);
      }
    }

    console.log('\n✅ Test Complete!');
    console.log('================');
    console.log('Frontend (Docker): http://localhost:5173');
    console.log('Backend (Local): http://localhost:3000');
    console.log(`Screenshots: ${screenshotsDir}`);
    console.log('\nBrowser will remain open. Press Ctrl+C to exit.');

    // Keep running
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (backendProcess) {
      backendProcess.kill();
    }
    process.exit(1);
  }
}

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🧹 Cleaning up...');
  if (backendProcess) {
    backendProcess.kill();
  }
  process.exit(0);
});

// Run the test
console.log('🔧 PLP Mentoring Platform - Hybrid Test\n');
console.log('This will use:');
console.log('- Docker Frontend (port 5173)');
console.log('- Local Backend (port 3000)\n');

testHybridLogin().catch(console.error);