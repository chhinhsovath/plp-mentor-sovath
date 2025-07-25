const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('import_react') || text.includes('SyntaxError')) {
      consoleMessages.push({
        type: msg.type(),
        text: text
      });
    }
  });
  
  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    const errorText = error.toString();
    if (errorText.includes('import_react') || errorText.includes('SyntaxError')) {
      pageErrors.push(errorText);
    }
  });
  
  try {
    console.log('Testing http://localhost:5173...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait a bit for any delayed errors
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (pageErrors.length > 0) {
      console.log('\n❌ IMPORT ERRORS DETECTED:');
      pageErrors.forEach((error, i) => {
        console.log(`\nError ${i + 1}:`, error);
      });
    } else {
      console.log('\n✅ NO IMPORT ERRORS DETECTED!');
    }
    
    if (consoleMessages.length > 0) {
      console.log('\nConsole errors related to imports:');
      consoleMessages.forEach(msg => {
        console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
      });
    }
    
    // Check if app loaded
    const appLoaded = await page.evaluate(() => {
      return document.getElementById('root')?.children.length > 0;
    });
    
    console.log(`\nApp loaded: ${appLoaded ? '✅ YES' : '❌ NO'}`);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-result.png' });
    console.log('\nScreenshot saved as test-result.png');
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
})();