const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:5173';

async function checkConsoleErrors() {
  console.log('🔍 Checking for console errors\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Capture console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });
    
    // Capture page errors
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.toString());
    });
    
    // Capture request failures
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure()
      });
    });
    
    console.log('1️⃣ Navigating to homepage...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('\n2️⃣ Console messages:');
    if (consoleMessages.length === 0) {
      console.log('   No console messages');
    } else {
      consoleMessages.forEach((msg, i) => {
        console.log(`   ${i + 1}. [${msg.type}] ${msg.text}`);
        if (msg.location.url) {
          console.log(`      at ${msg.location.url}:${msg.location.lineNumber}`);
        }
      });
    }
    
    console.log('\n3️⃣ Page errors:');
    if (pageErrors.length === 0) {
      console.log('   No page errors');
    } else {
      pageErrors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }
    
    console.log('\n4️⃣ Failed requests:');
    if (failedRequests.length === 0) {
      console.log('   No failed requests');
    } else {
      failedRequests.forEach((req, i) => {
        console.log(`   ${i + 1}. ${req.url}`);
        console.log(`      Failure: ${req.failure?.errorText}`);
      });
    }
    
    // Now navigate to login
    console.log('\n5️⃣ Navigating to login page...');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('\n6️⃣ Console messages after navigation:');
    const newMessages = consoleMessages.slice(consoleMessages.length);
    if (newMessages.length === 0) {
      console.log('   No new console messages');
    } else {
      newMessages.forEach((msg, i) => {
        console.log(`   ${i + 1}. [${msg.type}] ${msg.text}`);
      });
    }
    
    // Check if the app is actually loaded
    const appLoaded = await page.evaluate(() => {
      const root = document.getElementById('root');
      if (!root) return 'No root element';
      
      const childCount = root.children.length;
      const hasContent = root.innerHTML.length > 100;
      
      return {
        childCount,
        hasContent,
        firstChild: root.firstElementChild?.tagName,
        innerHTML: root.innerHTML.substring(0, 200)
      };
    });
    
    console.log('\n7️⃣ App state:');
    console.log(`   Root element children: ${appLoaded.childCount}`);
    console.log(`   Has content: ${appLoaded.hasContent}`);
    console.log(`   First child: ${appLoaded.firstChild}`);
    console.log(`   Content preview: ${appLoaded.innerHTML}...`);
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    console.log('\nClosing browser in 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
  }
}

checkConsoleErrors().catch(console.error);