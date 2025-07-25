const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:5173';

async function inspectPage() {
  console.log('🔍 Inspecting page content with Puppeteer\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 50,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('1️⃣ Navigating to login page...');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));
    
    console.log(`   Current URL: ${page.url()}`);
    
    // Get page title
    const title = await page.title();
    console.log(`   Page title: ${title}`);
    
    // Get all input fields
    console.log('\n2️⃣ Looking for input fields...');
    const inputs = await page.evaluate(() => {
      const inputElements = document.querySelectorAll('input');
      return Array.from(inputElements).map(input => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        className: input.className,
        visible: input.offsetParent !== null
      }));
    });
    
    if (inputs.length === 0) {
      console.log('   No input fields found!');
    } else {
      console.log(`   Found ${inputs.length} input fields:`);
      inputs.forEach((input, index) => {
        console.log(`   ${index + 1}. Type: ${input.type}, Name: ${input.name}, ID: ${input.id}, Placeholder: "${input.placeholder}", Visible: ${input.visible}`);
      });
    }
    
    // Get all buttons
    console.log('\n3️⃣ Looking for buttons...');
    const buttons = await page.evaluate(() => {
      const buttonElements = document.querySelectorAll('button');
      return Array.from(buttonElements).map(button => ({
        text: button.textContent.trim(),
        type: button.type,
        className: button.className,
        visible: button.offsetParent !== null
      }));
    });
    
    if (buttons.length === 0) {
      console.log('   No buttons found!');
    } else {
      console.log(`   Found ${buttons.length} buttons:`);
      buttons.forEach((button, index) => {
        console.log(`   ${index + 1}. Text: "${button.text}", Type: ${button.type}, Visible: ${button.visible}`);
      });
    }
    
    // Check for React root
    console.log('\n4️⃣ Checking for React app...');
    const hasReactRoot = await page.evaluate(() => {
      return !!document.getElementById('root');
    });
    console.log(`   React root element: ${hasReactRoot ? 'Found' : 'Not found'}`);
    
    // Get body text content
    console.log('\n5️⃣ Page content preview:');
    const bodyText = await page.evaluate(() => {
      const body = document.body.innerText;
      return body.substring(0, 500);
    });
    console.log(`   "${bodyText}${bodyText.length > 500 ? '...' : ''}"`);
    
    // Take screenshot
    await page.screenshot({ 
      path: `test-screenshots/page-inspection-${Date.now()}.png`,
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to test-screenshots/');
    
  } catch (error) {
    console.error('❌ Inspection failed:', error.message);
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

// Run the inspection
inspectPage().catch(console.error);