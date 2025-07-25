const { spawn } = require('child_process');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

let backendProcess = null;
let frontendProcess = null;

async function waitForServer(url, name, maxAttempts = 30) {
  console.log(`${colors.yellow}⏳ Waiting for ${name} to start...${colors.reset}`);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage();
      const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 5000 });
      await browser.close();
      
      if (response.ok()) {
        console.log(`${colors.green}✅ ${name} is ready!${colors.reset}`);
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    process.stdout.write('.');
  }
  
  console.log(`${colors.red}❌ ${name} failed to start${colors.reset}`);
  return false;
}

async function startBackend() {
  console.log(`${colors.blue}🚀 Starting Backend Server...${colors.reset}`);
  
  return new Promise((resolve, reject) => {
    backendProcess = spawn('npm', ['run', 'start:dev'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Application is running on')) {
        console.log(`${colors.green}✅ Backend started successfully${colors.reset}`);
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('error', (error) => {
      console.error(`${colors.red}❌ Failed to start backend: ${error.message}${colors.reset}`);
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!backendProcess.killed) {
        reject(new Error('Backend startup timeout'));
      }
    }, 30000);
  });
}

async function startFrontend() {
  console.log(`${colors.blue}🚀 Starting Frontend Server...${colors.reset}`);
  
  return new Promise((resolve, reject) => {
    frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') && output.includes('5173')) {
        console.log(`${colors.green}✅ Frontend started successfully${colors.reset}`);
        resolve();
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      // Vite outputs to stderr, but it's not always an error
      if (data.toString().includes('error')) {
        console.error(`Frontend Error: ${data}`);
      }
    });

    frontendProcess.on('error', (error) => {
      console.error(`${colors.red}❌ Failed to start frontend: ${error.message}${colors.reset}`);
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!frontendProcess.killed) {
        reject(new Error('Frontend startup timeout'));
      }
    }, 30000);
  });
}

async function testLogin() {
  console.log(`${colors.yellow}🧪 Testing Login with Puppeteer...${colors.reset}\n`);
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Set up console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`${colors.red}Browser Error: ${msg.text()}${colors.reset}`);
      }
    });

    // Navigate to login page
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    // Take screenshot
    await page.screenshot({ path: 'login-page.png' });
    console.log('📸 Screenshot saved: login-page.png');

    // Fill login form
    console.log('📝 Filling login form...');
    await page.waitForSelector('input[name="username"]');
    await page.type('input[name="username"]', 'chhinhs');
    await page.type('input[name="password"]', 'password');

    // Capture network activity
    const loginResponsePromise = page.waitForResponse(
      response => response.url().includes('/auth/login')
    );

    // Submit form
    console.log('🔐 Submitting login...');
    await page.click('button[type="submit"]');

    // Wait for login response
    const loginResponse = await loginResponsePromise;
    const responseData = await loginResponse.json().catch(() => null);

    console.log(`\n📡 Login Response Status: ${loginResponse.status()}`);
    
    if (loginResponse.ok()) {
      console.log(`${colors.green}✅ Login Successful!${colors.reset}`);
      if (responseData?.user) {
        console.log('User:', responseData.user.username);
        console.log('Role:', responseData.user.role);
      }
    } else {
      console.log(`${colors.red}❌ Login Failed${colors.reset}`);
      if (responseData?.message) {
        console.log('Error:', responseData.message);
      }
    }

    // Wait for navigation
    await page.waitForTimeout(3000);
    
    const finalUrl = page.url();
    if (!finalUrl.includes('/login')) {
      console.log(`${colors.green}✅ Successfully redirected to: ${finalUrl}${colors.reset}`);
      await page.screenshot({ path: 'after-login.png' });
      console.log('📸 Screenshot saved: after-login.png');
    } else {
      console.log(`${colors.red}❌ Still on login page${colors.reset}`);
    }

    console.log(`\n${colors.green}✅ Test completed! Browser will remain open for inspection.${colors.reset}`);
    console.log('Press Ctrl+C to close everything.\n');

    // Keep browser open
    await new Promise(() => {});

  } catch (error) {
    console.error(`${colors.red}❌ Test error: ${error.message}${colors.reset}`);
    await browser.close();
    throw error;
  }
}

async function cleanup() {
  console.log(`\n${colors.yellow}🧹 Cleaning up...${colors.reset}`);
  
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
    console.log('Backend process terminated');
  }
  
  if (frontendProcess && !frontendProcess.killed) {
    frontendProcess.kill();
    console.log('Frontend process terminated');
  }
  
  process.exit(0);
}

// Main execution
async function main() {
  console.log(`${colors.blue}🏁 PLP Mentoring Platform - Complete Login Test${colors.reset}`);
  console.log('=====================================\n');

  // Set up cleanup handlers
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    cleanup();
  });

  try {
    // Start servers
    await startBackend();
    await waitForServer('http://localhost:3000/api/docs', 'Backend API');
    
    await startFrontend();
    await waitForServer('http://localhost:5173', 'Frontend');
    
    console.log(`\n${colors.green}✅ Both servers are running!${colors.reset}\n`);
    
    // Run login test
    await testLogin();
    
  } catch (error) {
    console.error(`${colors.red}❌ Test failed: ${error.message}${colors.reset}`);
    cleanup();
  }
}

// Run the test
main().catch(error => {
  console.error(error);
  cleanup();
});