const puppeteer = require('puppeteer');

async function testFormSubmission() {
  console.log('Starting form submission test...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to the forms page
    console.log('Navigating to forms page...');
    await page.goto('http://localhost:5173/forms', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for the page to load
    await page.waitForTimeout(3000);

    // Check if we need to login first
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('Login required, attempting to login...');
      
      // Fill in login credentials
      await page.type('input[name="username"]', 'admin');
      await page.type('input[name="password"]', 'password123');
      
      // Click login button
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Navigate to forms page again
      await page.goto('http://localhost:5173/forms', {
        waitUntil: 'networkidle2'
      });
    }

    // Wait for forms page to load
    await page.waitForTimeout(2000);

    // Look for a "Create Form" or "New Form" button
    console.log('Looking for create form button...');
    const createButtonSelectors = [
      'button:has-text("Create Form")',
      'button:has-text("New Form")',
      'button:has-text("Add Form")',
      'button:has-text("បង្កើតទម្រង់ថ្មី")', // Khmer: Create New Form
      '[data-testid="create-form-button"]',
      'button[aria-label*="create"]',
      'button[aria-label*="new"]',
      'a[href*="/forms/new"]',
      'a[href*="/forms/create"]'
    ];

    let createButton = null;
    for (const selector of createButtonSelectors) {
      try {
        createButton = await page.$(selector);
        if (createButton) {
          console.log(`Found create button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }

    // If no button found, check for any buttons on the page
    if (!createButton) {
      const buttons = await page.$$('button');
      console.log(`Found ${buttons.length} buttons on the page`);
      
      // Log all button texts
      for (let i = 0; i < buttons.length; i++) {
        const text = await buttons[i].evaluate(el => el.textContent);
        console.log(`Button ${i}: "${text}"`);
        
        if (text && (text.toLowerCase().includes('create') || 
                     text.toLowerCase().includes('new') || 
                     text.toLowerCase().includes('add') ||
                     text.includes('បង្កើត') || // Khmer: Create
                     text.includes('ថ្មី'))) { // Khmer: New
          createButton = buttons[i];
          console.log(`Using button with text: "${text}"`);
          break;
        }
      }
    }

    if (createButton) {
      console.log('Clicking create form button...');
      await createButton.click();
      await page.waitForTimeout(2000);

      // Fill in form details
      console.log('Filling form details...');
      
      // Debug: Log all input fields
      const allInputs = await page.$$('input, textarea, select');
      console.log(`Found ${allInputs.length} form fields`);
      
      for (let i = 0; i < Math.min(allInputs.length, 10); i++) {
        const input = allInputs[i];
        const tagName = await input.evaluate(el => el.tagName);
        const name = await input.evaluate(el => el.getAttribute('name'));
        const placeholder = await input.evaluate(el => el.getAttribute('placeholder'));
        const type = await input.evaluate(el => el.getAttribute('type'));
        console.log(`Field ${i}: ${tagName} - name="${name}", placeholder="${placeholder}", type="${type}"`);
      }
      
      // Try to find form fields
      const formNameInput = await page.$('input[name="name"], input[name="title"], input[id*="name"], input[id*="title"], input[placeholder*="name"], input[placeholder*="title"], input[type="text"]:first-of-type');
      if (formNameInput) {
        await formNameInput.click();
        await formNameInput.type('Test Form - ' + new Date().toISOString());
        console.log('Filled form name');
      } else {
        console.log('Could not find name input field');
      }

      const descriptionInput = await page.$('textarea[name="description"], input[name="description"], textarea[id*="description"], input[id*="description"], textarea:first-of-type');
      if (descriptionInput) {
        await descriptionInput.click();
        await descriptionInput.type('This is a test form created by Puppeteer automated test');
        console.log('Filled description');
      } else {
        console.log('Could not find description field');
      }

      // Look for save button
      console.log('Looking for save button...');
      const saveButtonSelectors = [
        'button:has-text("Save")',
        'button:has-text("Submit")',
        'button:has-text("Create")',
        'button:has-text("រក្សាទុក")', // Khmer: Save
        'button:has-text("បញ្ជូន")', // Khmer: Submit
        'button[type="submit"]',
        '[data-testid="save-form-button"]'
      ];

      let saveButton = null;
      for (const selector of saveButtonSelectors) {
        try {
          saveButton = await page.$(selector);
          if (saveButton) {
            console.log(`Found save button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue trying other selectors
        }
      }

      if (!saveButton) {
        const submitButtons = await page.$$('button[type="submit"], button');
        console.log(`Found ${submitButtons.length} buttons on form page`);
        
        for (let i = 0; i < submitButtons.length; i++) {
          const button = submitButtons[i];
          const text = await button.evaluate(el => el.textContent);
          const disabled = await button.evaluate(el => el.disabled);
          console.log(`Button ${i}: "${text}" - disabled: ${disabled}`);
          
          if (!disabled && text && (text.toLowerCase().includes('save') || 
                       text.toLowerCase().includes('submit') || 
                       text.toLowerCase().includes('create') ||
                       text.includes('រក្សាទុក') || // Khmer: Save
                       text.includes('បញ្ជូន'))) { // Khmer: Submit
            saveButton = button;
            console.log(`Using save button with text: "${text}"`);
            break;
          }
        }
      }

      if (saveButton) {
        console.log('Clicking save button...');
        await saveButton.click();
        
        // Wait for response
        await page.waitForTimeout(3000);
        
        // Check for success message
        console.log('Checking for success indicators...');
        const successSelectors = [
          '.success',
          '.alert-success',
          '[role="alert"]',
          '.MuiAlert-root',
          '.notification',
          '.toast'
        ];
        
        let successFound = false;
        for (const selector of successSelectors) {
          const element = await page.$(selector);
          if (element) {
            const text = await element.evaluate(el => el.textContent);
            console.log(`Found potential success message: "${text}"`);
            if (text.toLowerCase().includes('success') || 
                text.toLowerCase().includes('saved') || 
                text.toLowerCase().includes('created')) {
              successFound = true;
              console.log('✅ Form saved successfully!');
              break;
            }
          }
        }
        
        if (!successFound) {
          // Check if we were redirected (which might indicate success)
          const newUrl = page.url();
          if (newUrl !== currentUrl && !newUrl.includes('/new') && !newUrl.includes('/create')) {
            console.log('✅ Form likely saved - redirected to:', newUrl);
            successFound = true;
          }
        }
        
        if (!successFound) {
          console.log('⚠️  No clear success indicator found, checking page state...');
          
          // Take a screenshot for debugging
          await page.screenshot({ path: 'form-submission-result.png' });
          console.log('Screenshot saved as form-submission-result.png');
        }
        
      } else {
        console.log('❌ Could not find save button');
      }
      
    } else {
      console.log('❌ Could not find create form button');
      
      // Take a screenshot of the current page
      await page.screenshot({ path: 'forms-page.png' });
      console.log('Screenshot of forms page saved as forms-page.png');
      
      // Log the current page content for debugging
      const pageContent = await page.content();
      console.log('Page title:', await page.title());
      console.log('Current URL:', page.url());
    }

  } catch (error) {
    console.error('Error during test:', error);
    
    // Take error screenshot
    const page = (await browser.pages())[0];
    if (page) {
      await page.screenshot({ path: 'error-screenshot.png' });
      console.log('Error screenshot saved as error-screenshot.png');
    }
  } finally {
    // Keep browser open for inspection
    console.log('\nTest complete. Browser will remain open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    await browser.close();
  }
}

// Run the test
testFormSubmission().catch(console.error);