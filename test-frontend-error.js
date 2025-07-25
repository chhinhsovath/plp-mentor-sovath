const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.toString());
  });
  
  try {
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('\nConsole messages:');
    consoleMessages.forEach(msg => {
      console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
    });
    
    if (pageErrors.length > 0) {
      console.log('\nPage errors:');
      pageErrors.forEach(error => {
        console.log(error);
      });
    } else {
      console.log('\nNo page errors detected!');
    }
    
    // Check if the app loaded successfully
    const appLoaded = await page.evaluate(() => {
      return document.getElementById('root')?.children.length > 0;
    });
    
    console.log(`\nApp loaded successfully: ${appLoaded}`);
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
})();