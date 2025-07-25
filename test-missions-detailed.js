const puppeteer = require('puppeteer');

async function testMissionsPageDetailed() {
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    devtools: true   // Open devtools automatically
  });
  const page = await browser.newPage();
  
  // Enhanced console logging
  const consoleMessages = [];
  page.on('console', msg => {
    const msgObj = {
      type: msg.type(),
      text: msg.text(),
      args: msg.args(),
      location: msg.location()
    };
    consoleMessages.push(msgObj);
    
    // Print in real-time
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  // Collect page errors
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]', error.message);
    console.log(error.stack);
  });

  // Monitor all network requests
  const networkRequests = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`[API ${response.status()}] ${response.url()}`);
      if (response.status() >= 400) {
        response.text().then(body => {
          console.log('Response body:', body);
        }).catch(() => {});
      }
    }
  });

  page.on('requestfailed', request => {
    if (request.url().includes('/api/')) {
      console.log(`[FAILED REQUEST] ${request.url()}: ${request.failure().errorText}`);
    }
  });

  try {
    console.log('Setting localStorage for authentication...');
    await page.evaluateOnNewDocument(() => {
      // Mock authentication
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        role: {
          name: 'administrator',
          permissions: ['APPROVE_MISSIONS']
        }
      }));
    });

    console.log('Navigating to http://localhost:5173/missions...');
    await page.goto('http://localhost:5173/missions', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('Page loaded. Waiting for potential React errors...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for React error boundaries
    const hasReactError = await page.evaluate(() => {
      const errorBoundary = document.querySelector('.error-boundary-message');
      const errorFallback = document.querySelector('[data-error-boundary]');
      return errorBoundary || errorFallback;
    });
    
    if (hasReactError) {
      console.log('[REACT ERROR BOUNDARY TRIGGERED]');
      const errorText = await page.evaluate(() => {
        const errorEl = document.querySelector('.error-boundary-message, [data-error-boundary]');
        return errorEl ? errorEl.textContent : 'Unknown error';
      });
      console.log('Error text:', errorText);
    }
    
    // Check if missions data loaded
    const missionsLoaded = await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      const noDataMessage = document.querySelector('[data-testid="no-missions"], .MuiTypography-root');
      return {
        hasTables: tables.length > 0,
        hasNoDataMessage: noDataMessage && noDataMessage.textContent.includes('No missions') || false,
        pageContent: document.body.innerText.substring(0, 500)
      };
    });
    
    console.log('\n=== PAGE STATE ===');
    console.log('Has tables:', missionsLoaded.hasTables);
    console.log('Has no data message:', missionsLoaded.hasNoDataMessage);
    console.log('Page content preview:', missionsLoaded.pageContent);
    
    // Get all console errors
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    if (errors.length > 0) {
      console.log('\n=== ALL CONSOLE ERRORS ===');
      errors.forEach(err => {
        console.log(`${err.text}`);
        if (err.location.url) {
          console.log(`  at ${err.location.url}:${err.location.lineNumber}`);
        }
      });
    }
    
    console.log('\n=== API REQUESTS MADE ===');
    networkRequests.forEach(req => {
      console.log(`${req.method} ${req.url}`);
    });

    // Take a screenshot for visual debugging
    await page.screenshot({ path: 'missions-page-screenshot.png', fullPage: true });
    console.log('\nScreenshot saved as missions-page-screenshot.png');
    
    console.log('\nPress Ctrl+C to close the browser...');
    // Keep browser open for manual inspection
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Error during test:', error);
    await browser.close();
  }
}

testMissionsPageDetailed().catch(console.error);