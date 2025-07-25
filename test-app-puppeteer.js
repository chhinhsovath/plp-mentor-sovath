const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:3000/api/v1';

async function testApp() {
  console.log('🧪 Testing PLP Mentor App with Puppeteer\n');
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}\n`);
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser
    slowMo: 100, // Slow down actions by 100ms
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Enable console log capture
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });
    
    console.log('1️⃣ Testing Homepage...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    const title = await page.title();
    console.log(`   Title: ${title}`);
    console.log(`   URL: ${page.url()}`);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-screenshots/1-homepage.png',
      fullPage: true 
    });
    
    // Check if page has content
    const pageContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        hasRoot: !!root,
        hasContent: root ? root.children.length > 0 : false,
        bodyText: document.body.innerText.substring(0, 200)
      };
    });
    
    console.log(`   Has React root: ${pageContent.hasRoot}`);
    console.log(`   Has content: ${pageContent.hasContent}`);
    console.log(`   Page text preview: "${pageContent.bodyText}..."`);
    
    // Look for navigation links
    console.log('\n2️⃣ Looking for navigation elements...');
    const navLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button'));
      return links.map(link => ({
        text: link.textContent?.trim(),
        href: link.getAttribute('href'),
        type: link.tagName.toLowerCase()
      })).filter(link => link.text);
    });
    
    console.log(`   Found ${navLinks.length} navigation elements`);
    navLinks.slice(0, 10).forEach(link => {
      console.log(`   - ${link.type}: "${link.text}" ${link.href ? `(${link.href})` : ''}`);
    });
    
    // Test navigation to different pages
    console.log('\n3️⃣ Testing page navigation...');
    const pagesToTest = [
      { name: 'Analytics', url: '/analytics' },
      { name: 'Users', url: '/users' },
      { name: 'Forms', url: '/forms' },
      { name: 'Missions', url: '/missions' }
    ];
    
    for (const testPage of pagesToTest) {
      console.log(`   Testing ${testPage.name}...`);
      await page.goto(`${FRONTEND_URL}${testPage.url}`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 1000));
      
      const currentUrl = page.url();
      const pageText = await page.evaluate(() => document.body.innerText);
      
      console.log(`   - URL: ${currentUrl}`);
      console.log(`   - Has content: ${pageText.length > 50}`);
      
      // Take screenshot
      await page.screenshot({ 
        path: `test-screenshots/${testPage.name.toLowerCase()}-page.png`,
        fullPage: true 
      });
    }
    
    // Test API connectivity
    console.log('\n4️⃣ Testing API connectivity...');
    const apiHealth = await page.evaluate(async (backendUrl) => {
      try {
        const response = await fetch(`${backendUrl}/health`);
        const data = await response.json();
        return {
          status: response.status,
          data: data
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    }, BACKEND_URL);
    
    console.log(`   API Health Check: ${apiHealth.error ? '❌ Failed' : '✅ Success'}`);
    if (apiHealth.data) {
      console.log(`   - Status: ${apiHealth.data.status}`);
      console.log(`   - Database: ${apiHealth.data.database?.status}`);
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    console.log('\nClosing browser in 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
  }
}

// Create screenshots directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('test-screenshots')) {
  fs.mkdirSync('test-screenshots');
}

// Run the test
testApp().catch(console.error);