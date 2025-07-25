const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFormTemplates() {
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 200,
    args: ['--window-size=1400,900']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  
  try {
    console.log('1. Navigating to forms page...');
    await page.goto('http://localhost:5173/forms');
    await sleep(2000);
    
    // Log all button texts to find the right one
    console.log('\n2. Finding buttons on page...');
    const buttonTexts = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(btn => btn.textContent.trim());
    });
    console.log('Button texts found:', buttonTexts);
    
    // Click the create form button (try multiple selectors)
    console.log('\n3. Clicking create form button...');
    try {
      // Try finding button by partial text
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const createBtn = buttons.find(btn => 
          btn.textContent.includes('បង្កើត') || 
          btn.textContent.includes('Create') ||
          btn.textContent.includes('New')
        );
        if (createBtn) createBtn.click();
        else throw new Error('No create button found');
      });
      await page.waitForNavigation();
    } catch (e) {
      console.log('Could not find create button, trying alternative...');
      // Try the first button with an icon
      await page.click('button:has(svg)');
      await page.waitForNavigation();
    }
    
    console.log('\n4. Form builder loaded');
    await sleep(1000);
    
    // Fill form details
    console.log('\n5. Filling form details...');
    await page.type('input[type="text"]:first-of-type', 'Test Form KH-G1-Level1');
    
    const textareas = await page.$$('textarea');
    if (textareas.length > 0) {
      await textareas[0].type('Testing form with KH-G1-Level1 template');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-01-form-builder.png', fullPage: true });
    
    // Look for Apply Template button
    console.log('\n6. Looking for Apply Template button...');
    const applyTemplateButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons
        .filter(btn => btn.textContent.toLowerCase().includes('template'))
        .map(btn => btn.textContent);
    });
    console.log('Template buttons found:', applyTemplateButtons);
    
    // Click Apply Template
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const templateBtn = buttons.find(btn => 
        btn.textContent.includes('Apply Template') ||
        btn.textContent.includes('ទម្រង់គំរូ')
      );
      if (templateBtn) templateBtn.click();
    });
    
    await sleep(1000);
    await page.screenshot({ path: 'test-02-template-dialog.png', fullPage: true });
    
    // Select KH-G1-Level1
    console.log('\n7. Selecting KH-G1-Level1 template...');
    await page.click('text="KH-G1-Level1"');
    await sleep(500);
    
    // Select all checkboxes
    console.log('\n8. Selecting all activities...');
    const checkboxes = await page.$$('input[type="checkbox"]');
    console.log(`Found ${checkboxes.length} checkboxes`);
    for (const checkbox of checkboxes) {
      await checkbox.click();
      await sleep(100);
    }
    
    await page.screenshot({ path: 'test-03-selected-activities.png', fullPage: true });
    
    // Apply the template
    console.log('\n9. Applying template...');
    const dialogButtons = await page.$$('[role="dialog"] button');
    if (dialogButtons.length >= 2) {
      await dialogButtons[dialogButtons.length - 1].click(); // Last button should be Apply
    }
    
    await sleep(2000);
    await page.screenshot({ path: 'test-04-template-applied.png', fullPage: true });
    
    // Count sections and fields
    console.log('\n10. Counting sections and fields...');
    const sectionCount = await page.evaluate(() => {
      return document.querySelectorAll('.MuiAccordion-root').length;
    });
    
    const fieldCount = await page.evaluate(() => {
      return document.querySelectorAll('.MuiListItem-root').length;
    });
    
    console.log(`Sections: ${sectionCount}`);
    console.log(`Fields: ${fieldCount}`);
    
    // Save the form
    console.log('\n11. Saving form...');
    const saveButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => 
        btn.textContent.includes('រក្សាទុក') || 
        btn.textContent.includes('Save')
      );
    });
    
    if (saveButton) {
      await saveButton.click();
      await page.waitForNavigation();
      console.log('✅ Form saved successfully!');
      
      // Get form ID from URL
      const url = page.url();
      console.log(`Form URL: ${url}`);
      
      await page.screenshot({ path: 'test-05-form-saved.png', fullPage: true });
    }
    
    // Now try to view the form
    console.log('\n12. Viewing saved form...');
    await sleep(2000);
    
    // Count fields in view mode
    const viewFieldCount = await page.evaluate(() => {
      return document.querySelectorAll('.MuiFormControlLabel-root').length;
    });
    console.log(`Fields in view mode: ${viewFieldCount}`);
    
    await page.screenshot({ path: 'test-06-form-view.png', fullPage: true });
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testFormTemplates();