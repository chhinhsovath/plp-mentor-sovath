const puppeteer = require('puppeteer');

async function testMissionsPage() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  // Collect page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
  });

  // Collect failed requests
  const failedRequests = [];
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()
    });
  });

  try {
    console.log('Navigating to http://localhost:5173/missions...');
    await page.goto('http://localhost:5173/missions', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait a bit for any async errors
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => {
      if (msg.type === 'error' || msg.type === 'warning') {
        console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
        if (msg.location.url) {
          console.log(`  Location: ${msg.location.url}:${msg.location.lineNumber}:${msg.location.columnNumber}`);
        }
      }
    });
    
    console.log('\n=== PAGE ERRORS ===');
    pageErrors.forEach(error => {
      console.log(`ERROR: ${error.message}`);
      if (error.stack) {
        console.log('Stack trace:');
        console.log(error.stack);
      }
    });
    
    console.log('\n=== FAILED REQUESTS ===');
    failedRequests.forEach(req => {
      console.log(`Failed: ${req.url}`);
      console.log(`Reason: ${req.failure.errorText}`);
    });
    
    // Check for specific React errors
    const reactErrors = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[data-reactroot] .error, [data-reactroot] .error-boundary');
      return Array.from(errorElements).map(el => el.textContent);
    });
    
    if (reactErrors.length > 0) {
      console.log('\n=== REACT ERRORS ===');
      reactErrors.forEach(error => console.log(error));
    }
    
    // Log any network errors in the console
    const networkErrors = consoleMessages.filter(msg => 
      msg.text.includes('Failed to fetch') || 
      msg.text.includes('Network') ||
      msg.text.includes('401') ||
      msg.text.includes('403') ||
      msg.text.includes('404') ||
      msg.text.includes('500')
    );
    
    if (networkErrors.length > 0) {
      console.log('\n=== NETWORK ERRORS ===');
      networkErrors.forEach(msg => {
        console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
      });
    }

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

testMissionsPage().catch(console.error);