const puppeteer = require('puppeteer');

async function testFrontendDisplay() {
  console.log('🔍 Testing Frontend Display...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[${type.toUpperCase()}] ${text}`);
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });

  // Capture network errors
  page.on('requestfailed', request => {
    console.log('❌ Request Failed:', request.url());
  });

  try {
    console.log('1. Navigating to http://localhost:5173...');
    const response = await page.goto('http://localhost:5173', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('   Response status:', response.status());
    
    // Wait a bit for React to render
    await page.waitForTimeout(2000);

    // Get page content
    const pageContent = await page.content();
    console.log('\n2. Page HTML length:', pageContent.length);
    
    // Check if root element exists
    const rootElement = await page.$('#root');
    if (rootElement) {
      console.log('   ✅ Root element found');
      
      // Check if root has content
      const rootContent = await page.evaluate(() => {
        const root = document.getElementById('root');
        return {
          childCount: root.children.length,
          innerHTML: root.innerHTML.substring(0, 200),
          hasContent: root.innerHTML.trim().length > 0
        };
      });
      
      console.log('   Root element info:');
      console.log('   - Child count:', rootContent.childCount);
      console.log('   - Has content:', rootContent.hasContent);
      if (!rootContent.hasContent) {
        console.log('   ❌ Root element is empty!');
      }
    } else {
      console.log('   ❌ Root element not found!');
    }

    // Check for common React errors
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('Cannot GET')) {
      console.log('\n❌ Server returned "Cannot GET" - Check your routes');
    }

    // Take screenshot
    await page.screenshot({ path: 'frontend-display-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved as frontend-display-test.png');

    // Get all script tags
    const scripts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script')).map(script => ({
        src: script.src,
        hasContent: script.innerHTML.length > 0
      }));
    });
    
    console.log('\n3. Script tags found:', scripts.length);
    scripts.forEach((script, i) => {
      if (script.src) {
        console.log(`   Script ${i + 1}: ${script.src}`);
      }
    });

    // Check for Vite-specific elements
    const viteClientScript = await page.$('script[type="module"][src*="@vite/client"]');
    if (viteClientScript) {
      console.log('\n✅ Vite client script found - Vite is running');
    }

    console.log('\n📊 Test Complete. Browser will remain open for inspection.');
    console.log('Press Ctrl+C to exit.');
    
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await browser.close();
  }
}

testFrontendDisplay().catch(console.error);