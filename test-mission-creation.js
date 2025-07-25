const puppeteer = require('puppeteer');

async function testMissionCreation() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  const page = await browser.newPage();

  try {
    console.log('1. Testing Login...');
    await page.goto('http://localhost:5175/login');
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    
    // Login with test credentials
    await page.type('input[type="text"]', 'teacher_demo');
    await page.type('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✓ Login successful');

    // Navigate to missions page
    console.log('\n2. Navigating to missions page...');
    await page.goto('http://localhost:5175/missions');
    await page.waitForSelector('button', { timeout: 5000 });
    
    // Click create mission button
    console.log('\n3. Clicking create mission button...');
    const createButton = await page.$x('//button[contains(., "បង្កើតបេសកកម្មថ្មី")]');
    if (createButton.length > 0) {
      await createButton[0].click();
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      console.log('✓ Navigated to create mission page');
    }

    // Fill mission form
    console.log('\n4. Filling mission form...');
    await page.waitForSelector('input[placeholder="បញ្ចូលចំណងជើងបេសកកម្ម"]', { timeout: 5000 });
    
    // Title
    await page.type('input[placeholder="បញ្ចូលចំណងជើងបេសកកម្ម"]', 'បេសកកម្មទស្សនកិច្ចសាលារៀនបឋមសិក្សា');
    
    // Select mission type
    await page.click('.ant-select-selector');
    await page.waitForTimeout(500);
    const fieldTripOption = await page.$x('//div[contains(@class, "ant-select-item-option")]//div[contains(., "ទស្សនកិច្ច")]');
    if (fieldTripOption.length > 0) {
      await fieldTripOption[0].click();
    }
    
    // Description
    const descTextarea = await page.$('textarea[placeholder="បញ្ចូលការពិពណ៌នាបេសកកម្ម..."]');
    if (descTextarea) {
      await descTextarea.type('ទស្សនកិច្ចការអនុវត្តវិធីសាស្ត្របង្រៀនថ្មីនៅសាលាបឋមសិក្សា');
    }
    
    // Set dates
    console.log('\n5. Setting dates...');
    const dateInputs = await page.$$('.ant-picker-input input');
    if (dateInputs.length >= 2) {
      // Start date - tomorrow
      await dateInputs[0].click();
      await page.waitForTimeout(500);
      const tomorrow = await page.$('.ant-picker-cell-today + .ant-picker-cell');
      if (tomorrow) await tomorrow.click();
      
      // End date - day after tomorrow
      await dateInputs[1].click();
      await page.waitForTimeout(500);
      const dayAfter = await page.$$('.ant-picker-cell-today ~ .ant-picker-cell');
      if (dayAfter.length >= 2) await dayAfter[1].click();
    }
    
    // Set location
    console.log('\n6. Setting location...');
    const locationInput = await page.$('input[placeholder="ស្វែងរកទីតាំង..."]');
    if (locationInput) {
      await locationInput.type('Siem Reap');
      await page.waitForTimeout(1000);
      
      // Click search button
      const searchButton = await page.$x('//button[@title="ស្វែងរក"]');
      if (searchButton.length > 0) {
        await searchButton[0].click();
        await page.waitForTimeout(2000);
        
        // Select first result if available
        const firstResult = await page.$('.ant-list-item');
        if (firstResult) {
          await firstResult.click();
          console.log('✓ Location selected');
          
          // Wait for travel info to appear
          await page.waitForTimeout(1500);
          const travelInfo = await page.$('.ant-alert-info');
          if (travelInfo) {
            console.log('✓ Travel information displayed');
          } else {
            console.log('⚠ No travel info (user may not have office location set)');
          }
        }
      }
    }
    
    // Fill mission details
    console.log('\n7. Filling mission details...');
    const purposeTextarea = await page.$('textarea[placeholder="ពិពណ៌នាគោលបំណងនៃបេសកកម្មនេះ..."]');
    if (purposeTextarea) {
      await purposeTextarea.type('ស្វែងយល់អំពីវិធីសាស្ត្របង្រៀនថ្មីៗ និងការអនុវត្តជាក់ស្តែង');
    }
    
    const objectivesTextarea = await page.$('textarea[placeholder="រាយគោលដៅសំខាន់ៗ..."]');
    if (objectivesTextarea) {
      await objectivesTextarea.type('1. សង្កេតការបង្រៀន\n2. ពិភាក្សាជាមួយគ្រូបង្រៀន\n3. ចូលរួមក្នុងសកម្មភាពថ្នាក់រៀន');
    }
    
    // Set budget
    console.log('\n8. Setting budget...');
    const budgetInput = await page.$('input[placeholder="0"]');
    if (budgetInput) {
      await budgetInput.type('500000'); // 500,000 Riel
    }
    
    // Transportation details
    const transportTextarea = await page.$('textarea[placeholder="ពិពណ៌នាការរៀបចំការធ្វើដំណើរ..."]');
    if (transportTextarea) {
      await transportTextarea.type('ធ្វើដំណើរដោយរថយន្តក្រុមហ៊ុន');
    }
    
    // Submit form
    console.log('\n9. Submitting mission...');
    const submitButton = await page.$x('//button[contains(., "បង្កើតបេសកកម្ម")]');
    if (submitButton.length > 0) {
      await submitButton[0].click();
      
      // Wait for success message or navigation
      await page.waitForTimeout(2000);
      
      // Check if we're back on missions page
      const currentUrl = page.url();
      if (currentUrl.includes('/missions') && !currentUrl.includes('/create')) {
        console.log('✓ Mission created successfully!');
        
        // Take screenshot of missions list
        await page.screenshot({ path: 'mission-created.png' });
        console.log('✓ Screenshot saved as mission-created.png');
      } else {
        // Check for error messages
        const errorAlert = await page.$('.ant-message-error');
        if (errorAlert) {
          const errorText = await errorAlert.evaluate(el => el.textContent);
          console.log('✗ Error creating mission:', errorText);
        }
      }
    }
    
    // Check the created mission in the list
    console.log('\n10. Verifying mission in list...');
    const missionTitle = await page.$x('//td[contains(., "បេសកកម្មទស្សនកិច្ចសាលារៀនបឋមសិក្សា")]');
    if (missionTitle.length > 0) {
      console.log('✓ Mission found in the list!');
      
      // Click to view details
      const viewButton = await missionTitle[0].$('xpath=../following-sibling::td//button[@title="មើលព័ត៌មានលម្អិត"]');
      if (viewButton) {
        await viewButton.click();
        await page.waitForTimeout(1000);
        console.log('✓ Mission details modal opened');
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    console.log('\nTest completed. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// Run the test
testMissionCreation().catch(console.error);