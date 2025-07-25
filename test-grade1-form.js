const puppeteer = require('puppeteer');

async function testGrade1Form() {
  console.log('Starting Grade 1 Khmer form test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to forms page
    console.log('Navigating to forms page...');
    await page.goto('http://localhost:5173/forms', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check if login is needed
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('Logging in...');
      await page.type('input[name="username"]', 'chhinhs');
      await page.type('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      await page.goto('http://localhost:5173/forms', { waitUntil: 'networkidle2' });
    }

    await page.waitForTimeout(2000);

    // Look for the new form
    console.log('Looking for Grade 1 Khmer form...');
    
    // Get all form titles
    const formTitles = await page.evaluate(() => {
      const titles = [];
      // Try different selectors for form titles
      const titleElements = document.querySelectorAll('h6, .MuiTypography-h6, .form-title, [class*="title"]');
      titleElements.forEach(el => {
        if (el.textContent) {
          titles.push(el.textContent.trim());
        }
      });
      return titles;
    });

    console.log('Found form titles:', formTitles);

    // Check if our form exists
    const grade1Form = formTitles.find(title => 
      title.includes('ឧបករណ៍សង្កេតគ្រូថ្នាក់ទី១') || 
      title.includes('Grade 1') ||
      title.includes('ថ្នាក់ទី១')
    );

    if (grade1Form) {
      console.log('✅ Found Grade 1 Khmer form:', grade1Form);
      
      // Try to click on it
      const formClicked = await page.evaluate((formTitle) => {
        const elements = Array.from(document.querySelectorAll('*'));
        const element = elements.find(el => el.textContent && el.textContent.includes(formTitle));
        if (element) {
          // Find the nearest clickable parent
          let clickable = element;
          while (clickable && clickable.tagName !== 'A' && clickable.tagName !== 'BUTTON' && !clickable.onclick) {
            clickable = clickable.parentElement;
          }
          if (clickable) {
            clickable.click();
            return true;
          }
        }
        return false;
      }, grade1Form);

      if (formClicked) {
        console.log('Clicked on the form, waiting for it to load...');
        await page.waitForTimeout(3000);
        
        // Check if we're now viewing the form details
        const newUrl = page.url();
        if (newUrl !== currentUrl) {
          console.log('✅ Successfully navigated to form details:', newUrl);
        }
      }
      
    } else {
      console.log('❌ Grade 1 Khmer form not found in the list');
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'forms-list-debug.png' });
      console.log('Screenshot saved as forms-list-debug.png');
    }

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    console.log('\nTest complete. Browser will remain open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
}

// Run the test
testGrade1Form().catch(console.error);