const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });

    // Login
    console.log('Logging in...');
    await page.type('input[name="username"]', 'admin');
    await page.type('input[name="password"]', 'Admin123!@#');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Navigate to new observation page
    console.log('Navigating to new observation page...');
    await page.goto('http://localhost:5173/observations/new', { waitUntil: 'networkidle0' });
    
    // Wait for the stepper to be visible
    await page.waitForSelector('.MuiStepper-root', { visible: true });
    
    // Get the step labels
    const stepLabels = await page.evaluate(() => {
      const steps = document.querySelectorAll('.MuiStepLabel-label');
      return Array.from(steps).map(step => step.textContent.trim());
    });
    
    console.log('\n=== OBSERVATION FORM STEP LABELS ===');
    console.log('Found', stepLabels.length, 'steps:');
    stepLabels.forEach((label, index) => {
      console.log(`Step ${index + 1}: "${label}"`);
    });
    
    // Check for any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('\nConsole error:', msg.text());
      }
    });
    
    // Take a screenshot
    await page.screenshot({ path: 'observation-steps-screenshot.png', fullPage: true });
    console.log('\nScreenshot saved as observation-steps-screenshot.png');
    
    // Check if any steps are showing English text or translation keys
    const hasEnglishText = stepLabels.some(label => 
      label.includes('basicinformation') || 
      label.includes('observationform') || 
      label.includes('reflections') || 
      label.includes('reviewsubmit') ||
      label.includes('steps.')
    );
    
    if (hasEnglishText) {
      console.log('\n⚠️  WARNING: Some steps are showing translation keys or English text instead of Khmer!');
    } else {
      console.log('\n✓ All steps appear to be showing translated text');
    }
    
    // Wait a moment to see the page
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();