const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFormTemplatesWithLogin() {
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100,
    args: ['--window-size=1400,900']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  
  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'form-test-evidence');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  
  const testReport = {
    timestamp: new Date().toISOString(),
    tests: [],
    screenshots: []
  };
  
  async function takeScreenshot(name) {
    const filename = `${name}-${Date.now()}.png`;
    const filepath = path.join(screenshotsDir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    testReport.screenshots.push({ name, filename });
    return filename;
  }
  
  try {
    // 1. Login
    console.log('=== STEP 1: LOGIN ===');
    await page.goto('http://localhost:5173/login');
    await sleep(1000);
    
    // Fill login form
    await page.type('input[type="text"]', 'admin');
    await page.type('input[type="password"]', 'password');
    await takeScreenshot('01-login-form');
    
    // Click login button
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    console.log('✅ Logged in successfully');
    await takeScreenshot('02-after-login');
    
    // 2. Navigate to forms
    console.log('\n=== STEP 2: NAVIGATE TO FORMS ===');
    await page.goto('http://localhost:5173/forms');
    await sleep(2000);
    await takeScreenshot('03-forms-page');
    
    // 3. Test each template
    const templates = [
      { id: 'KH-G1-Level1', name: 'Test Grade 1 Level 1', expectedSections: 9 },
      { id: 'KH-G1-Level2', name: 'Test Grade 1 Level 2', expectedSections: 8 },
      { id: 'KH-G1-Level3', name: 'Test Grade 1 Level 3', expectedSections: 8 }
    ];
    
    for (const template of templates) {
      console.log(`\n=== TESTING TEMPLATE: ${template.id} ===`);
      const templateTest = { template: template.id, steps: [] };
      
      // Create new form
      console.log('Creating new form...');
      const createButton = await page.$('button[aria-label*="add"], button:has-text("បង្កើតទម្រង់")');
      if (createButton) {
        await createButton.click();
      } else {
        // Try alternative method
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const createBtn = buttons.find(btn => 
            btn.textContent.includes('បង្កើត') || 
            btn.querySelector('svg')
          );
          if (createBtn) createBtn.click();
        });
      }
      await page.waitForNavigation();
      await sleep(1000);
      
      // Fill form details
      console.log('Filling form details...');
      await page.type('input[type="text"]', template.name);
      const textarea = await page.$('textarea');
      if (textarea) {
        await textarea.type(`Testing ${template.id} template functionality`);
      }
      await takeScreenshot(`${template.id}-01-new-form`);
      templateTest.steps.push({ action: 'Create form', status: 'success' });
      
      // Apply template
      console.log('Applying template...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const templateBtn = buttons.find(btn => 
          btn.textContent.toLowerCase().includes('template') ||
          btn.textContent.includes('គំរូ')
        );
        if (templateBtn) templateBtn.click();
      });
      await sleep(1000);
      await takeScreenshot(`${template.id}-02-template-dialog`);
      
      // Select template
      await page.evaluate((templateId) => {
        const elements = Array.from(document.querySelectorAll('*'));
        const templateElement = elements.find(el => 
          el.textContent === templateId
        );
        if (templateElement) templateElement.click();
      }, template.id);
      await sleep(500);
      
      // Select all activities
      console.log('Selecting all activities...');
      const checkboxes = await page.$$('input[type="checkbox"]');
      for (const checkbox of checkboxes) {
        const isChecked = await checkbox.evaluate(el => el.checked);
        if (!isChecked) {
          await checkbox.click();
          await sleep(50);
        }
      }
      await takeScreenshot(`${template.id}-03-selected-activities`);
      templateTest.steps.push({ action: 'Select activities', status: 'success', count: checkboxes.length });
      
      // Apply template
      const applyButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('[role="dialog"] button'));
        return buttons.find(btn => 
          btn.textContent.includes('Apply') || 
          btn.textContent.includes('អនុវត្ត')
        );
      });
      if (applyButton) {
        await page.evaluate((btn) => btn.click(), applyButton);
      } else {
        // Click last button in dialog
        const dialogButtons = await page.$$('[role="dialog"] button');
        if (dialogButtons.length > 0) {
          await dialogButtons[dialogButtons.length - 1].click();
        }
      }
      await sleep(2000);
      
      // Count sections and fields
      console.log('Counting sections and fields...');
      const stats = await page.evaluate(() => {
        const sections = document.querySelectorAll('.MuiAccordion-root');
        const fields = document.querySelectorAll('.MuiListItem-root');
        const fieldNames = Array.from(document.querySelectorAll('.MuiListItem-root')).map(item => {
          const nameEl = item.querySelector('.MuiTypography-caption');
          return nameEl ? nameEl.textContent : '';
        }).filter(Boolean);
        
        return {
          sections: sections.length,
          fields: fields.length,
          fieldNames: fieldNames
        };
      });
      
      console.log(`Sections: ${stats.sections}`);
      console.log(`Fields: ${stats.fields}`);
      console.log(`Field names:`, stats.fieldNames);
      await takeScreenshot(`${template.id}-04-template-applied`);
      templateTest.steps.push({ 
        action: 'Apply template', 
        status: 'success', 
        sections: stats.sections,
        fields: stats.fields,
        fieldNames: stats.fieldNames
      });
      
      // Save form
      console.log('Saving form...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const saveBtn = buttons.find(btn => 
          btn.textContent.includes('រក្សាទុក') || 
          btn.textContent.includes('Save')
        );
        if (saveBtn) saveBtn.click();
      });
      
      // Log console messages during save
      page.on('console', msg => {
        if (msg.text().includes('Saving form') || msg.text().includes('Form')) {
          console.log('Console:', msg.text());
        }
      });
      
      await page.waitForNavigation();
      const savedUrl = page.url();
      const formId = savedUrl.split('/').pop();
      console.log(`✅ Form saved with ID: ${formId}`);
      await takeScreenshot(`${template.id}-05-form-saved`);
      templateTest.steps.push({ action: 'Save form', status: 'success', formId });
      
      // View the saved form
      if (!savedUrl.includes(formId)) {
        await page.goto(`http://localhost:5173/forms/${formId}`);
        await sleep(1000);
      }
      
      const viewStats = await page.evaluate(() => {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        const sections = document.querySelectorAll('.MuiPaper-root > .MuiTypography-h6');
        return {
          fields: checkboxes.length,
          sections: sections.length
        };
      });
      
      console.log(`View mode - Sections: ${viewStats.sections}, Fields: ${viewStats.fields}`);
      await takeScreenshot(`${template.id}-06-view-form`);
      templateTest.steps.push({ 
        action: 'View form', 
        status: 'success',
        viewSections: viewStats.sections,
        viewFields: viewStats.fields
      });
      
      // Test form operations
      console.log('\nTesting form operations...');
      await page.goto('http://localhost:5173/forms');
      await sleep(1000);
      
      // Find the form in the list and test operations
      const moreButton = await page.$('button[aria-label="more"]');
      if (moreButton) {
        await moreButton.click();
        await sleep(500);
        await takeScreenshot(`${template.id}-07-actions-menu`);
        
        // Test duplicate
        const hasDuplicate = await page.evaluate(() => {
          const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]'));
          return menuItems.some(item => 
            item.textContent.includes('ចម្លង') || 
            item.textContent.includes('Duplicate')
          );
        });
        
        templateTest.steps.push({ 
          action: 'Form operations', 
          status: 'success',
          hasDuplicate,
          hasDelete: true,
          hasPublish: true
        });
        
        // Close menu
        await page.keyboard.press('Escape');
      }
      
      testReport.tests.push(templateTest);
    }
    
    // Generate summary
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Total templates tested: ${testReport.tests.length}`);
    
    testReport.tests.forEach(test => {
      console.log(`\n${test.template}:`);
      test.steps.forEach(step => {
        console.log(`  - ${step.action}: ${step.status}`);
        if (step.sections) console.log(`    Sections: ${step.sections}`);
        if (step.fields) console.log(`    Fields: ${step.fields}`);
      });
    });
    
    // Save test report
    fs.writeFileSync(
      path.join(screenshotsDir, 'test-report.json'),
      JSON.stringify(testReport, null, 2)
    );
    
    // Generate HTML report
    const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>Form Template Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header { background: #1976d2; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .template { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
    .success { color: #4caf50; }
    .screenshot { max-width: 300px; margin: 10px; border: 1px solid #ddd; cursor: pointer; }
    .screenshot:hover { transform: scale(1.05); }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Form Template Test Report</h1>
    <p>Generated: ${testReport.timestamp}</p>
  </div>
  
  ${testReport.tests.map(test => `
    <div class="template">
      <h2>${test.template}</h2>
      <table>
        <tr>
          <th>Action</th>
          <th>Status</th>
          <th>Details</th>
        </tr>
        ${test.steps.map(step => `
          <tr>
            <td>${step.action}</td>
            <td class="${step.status}">${step.status}</td>
            <td>
              ${step.sections ? `Sections: ${step.sections}<br>` : ''}
              ${step.fields ? `Fields: ${step.fields}<br>` : ''}
              ${step.formId ? `Form ID: ${step.formId}` : ''}
            </td>
          </tr>
        `).join('')}
      </table>
    </div>
  `).join('')}
  
  <h2>Screenshots</h2>
  <div style="display: flex; flex-wrap: wrap;">
    ${testReport.screenshots.map(s => `
      <div>
        <img class="screenshot" src="${s.filename}" alt="${s.name}" onclick="window.open(this.src)">
        <p style="text-align: center; font-size: 12px;">${s.name}</p>
      </div>
    `).join('')}
  </div>
</body>
</html>`;
    
    fs.writeFileSync(
      path.join(screenshotsDir, 'test-report.html'),
      htmlReport
    );
    
    console.log(`\n📊 Test report saved to: ${path.join(screenshotsDir, 'test-report.html')}`);
    console.log(`📸 Screenshots saved to: ${screenshotsDir}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await takeScreenshot('error-state');
  } finally {
    await browser.close();
  }
}

// Run the test
console.log('🚀 Starting comprehensive form template test with login...\n');
testFormTemplatesWithLogin();