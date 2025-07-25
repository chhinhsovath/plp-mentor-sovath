const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'form-test-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Test configuration
const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3000/api/v1';

// Helper function to take screenshot
async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  await page.screenshot({ 
    path: path.join(screenshotsDir, filename),
    fullPage: true 
  });
  return filename;
}

// Helper function to wait and log
async function waitAndLog(page, selector, message) {
  console.log(`⏳ ${message}`);
  await page.waitForSelector(selector, { timeout: 10000 });
  console.log(`✓ ${message} - found`);
}

// Main test function
async function runComprehensiveFormTest() {
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100,
    args: ['--window-size=1400,900']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('Browser console:', msg.text());
    }
  });

  const testResults = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    // Test 1: Navigate to forms page
    console.log('\n=== TEST 1: Navigate to Forms Page ===');
    await page.goto(`${BASE_URL}/forms`);
    await waitAndLog(page, 'button', 'Forms page loaded');
    const formsPageScreenshot = await takeScreenshot(page, '01-forms-page');
    testResults.tests.push({
      name: 'Navigate to Forms Page',
      status: 'PASSED',
      screenshot: formsPageScreenshot
    });

    // Test each template
    const templates = [
      { id: 'KH-G1-Level1', name: 'Test Level 1 Form', expectedFields: 22 },
      { id: 'KH-G1-Level2', name: 'Test Level 2 Form', expectedFields: 12 },
      { id: 'KH-G1-Level3', name: 'Test Level 3 Form', expectedFields: 11 }
    ];

    for (const template of templates) {
      console.log(`\n=== TEST: Create Form with ${template.id} Template ===`);
      
      // Click create form button - find button with AddIcon
      const createButtons = await page.$$('button');
      let createButtonFound = false;
      for (const button of createButtons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && (text.includes('បង្កើតទម្រង់') || text.includes('Create Form'))) {
          await button.click();
          createButtonFound = true;
          break;
        }
      }
      if (!createButtonFound) {
        throw new Error('Create form button not found');
      }
      await page.waitForNavigation();
      await waitAndLog(page, 'input', 'Form builder loaded');
      
      // Fill form name - find the first text input
      const inputs = await page.$$('input[type="text"]');
      if (inputs.length > 0) {
        await inputs[0].type(template.name);
      }
      
      // Find and fill description textarea
      const textareas = await page.$$('textarea');
      if (textareas.length > 0) {
        await textareas[0].type(`Testing ${template.id} template`);
      }
      const formBuilderScreenshot = await takeScreenshot(page, `${template.id}-01-form-builder`);
      
      // Apply template - find button containing "Apply Template"
      const applyButtons = await page.$$('button');
      let applyButtonFound = false;
      for (const button of applyButtons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && text.includes('Apply Template')) {
          await button.click();
          applyButtonFound = true;
          break;
        }
      }
      if (!applyButtonFound) {
        console.warn('Apply Template button not found');
      }
      await waitAndLog(page, '[role="dialog"]', 'Template dialog opened');
      const templateDialogScreenshot = await takeScreenshot(page, `${template.id}-02-template-dialog`);
      
      // Select template
      await page.click(`text="${template.id}"`);
      
      // Wait for activities to load and select all
      await page.waitForTimeout(500);
      const checkboxes = await page.$$('input[type="checkbox"]');
      for (const checkbox of checkboxes) {
        await checkbox.click();
      }
      const selectedActivitiesScreenshot = await takeScreenshot(page, `${template.id}-03-selected-activities`);
      
      // Apply template
      await page.click('button:has-text("Apply Template"):not([disabled])');
      await page.waitForTimeout(1000);
      
      // Count sections and fields
      const sections = await page.$$('[data-testid="form-section"], .MuiAccordion-root');
      const fields = await page.$$('[data-testid="form-field"], .MuiListItem-root:has(.MuiListItemIcon-root)');
      
      console.log(`📊 Template ${template.id} applied:`);
      console.log(`   - Sections: ${sections.length}`);
      console.log(`   - Fields: ${fields.length}`);
      
      const appliedTemplateScreenshot = await takeScreenshot(page, `${template.id}-04-template-applied`);
      
      // Save form - find save button
      const saveButtons = await page.$$('button');
      for (const button of saveButtons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && (text.includes('រក្សាទុក') || text.includes('Save'))) {
          await button.click();
          break;
        }
      }
      await page.waitForNavigation();
      console.log('✓ Form saved successfully');
      
      // Get the created form ID from URL
      const currentUrl = page.url();
      const formId = currentUrl.includes('/forms') && !currentUrl.includes('/new') 
        ? currentUrl.split('/').pop() 
        : null;
      
      testResults.tests.push({
        name: `Create Form with ${template.id}`,
        status: fields.length > 0 ? 'PASSED' : 'FAILED',
        details: {
          expectedFields: template.expectedFields,
          actualFields: fields.length,
          sections: sections.length,
          formId: formId
        },
        screenshots: [
          formBuilderScreenshot,
          templateDialogScreenshot,
          selectedActivitiesScreenshot,
          appliedTemplateScreenshot
        ]
      });

      // Test viewing the form
      if (formId) {
        console.log(`\n=== TEST: View Form ${formId} ===`);
        await page.goto(`${BASE_URL}/forms/${formId}`);
        await page.waitForTimeout(1000);
        const viewFormScreenshot = await takeScreenshot(page, `${template.id}-05-view-form`);
        
        // Count displayed sections and fields
        const viewSections = await page.$$('.MuiPaper-root > .MuiTypography-h6');
        const viewFields = await page.$$('.MuiFormControlLabel-root');
        
        console.log(`📊 Form view shows:`);
        console.log(`   - Sections: ${viewSections.length}`);
        console.log(`   - Fields: ${viewFields.length}`);
        
        testResults.tests.push({
          name: `View Form ${template.id}`,
          status: viewFields.length > 0 ? 'PASSED' : 'FAILED',
          details: {
            sections: viewSections.length,
            fields: viewFields.length
          },
          screenshot: viewFormScreenshot
        });
      }

      // Go back to forms list
      await page.goto(`${BASE_URL}/forms`);
      await page.waitForTimeout(1000);
    }

    // Test form operations (using the last created form)
    console.log('\n=== TEST: Form Operations ===');
    
    // Find the last created form in the list
    const formRows = await page.$$('tr[data-testid="form-row"], tbody tr');
    if (formRows.length > 1) { // Skip header row
      // Click on actions menu for the first form
      const moreButtons = await page.$$('button[aria-label="more"]');
      if (moreButtons.length > 0) {
        await moreButtons[0].click();
        await waitAndLog(page, '[role="menu"]', 'Actions menu opened');
        const actionsMenuScreenshot = await takeScreenshot(page, 'form-actions-menu');
        
        // Test duplicate
        if (await page.$('text="ចម្លង"')) {
          await page.click('text="ចម្លង"');
          await page.waitForTimeout(1000);
          console.log('✓ Form duplicated');
        }
        
        testResults.tests.push({
          name: 'Form Actions Menu',
          status: 'PASSED',
          screenshot: actionsMenuScreenshot
        });
      }
    }

    // Generate summary report
    const passedTests = testResults.tests.filter(t => t.status === 'PASSED').length;
    const failedTests = testResults.tests.filter(t => t.status === 'FAILED').length;
    
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Total tests: ${testResults.tests.length}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    
    // Save test results
    fs.writeFileSync(
      path.join(screenshotsDir, 'test-results.json'),
      JSON.stringify(testResults, null, 2)
    );
    
    // Generate HTML report
    const htmlReport = generateHTMLReport(testResults);
    fs.writeFileSync(
      path.join(screenshotsDir, 'test-report.html'),
      htmlReport
    );
    
    console.log(`\n📊 Test report saved to: ${path.join(screenshotsDir, 'test-report.html')}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await takeScreenshot(page, 'error-state');
    testResults.tests.push({
      name: 'Test Execution',
      status: 'FAILED',
      error: error.message
    });
  } finally {
    await browser.close();
  }
}

// Generate HTML report
function generateHTMLReport(results) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Form Template Test Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: #1976d2;
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .test {
      border: 1px solid #ddd;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 8px;
    }
    .passed {
      border-left: 5px solid #4caf50;
    }
    .failed {
      border-left: 5px solid #f44336;
    }
    .screenshot {
      max-width: 100%;
      margin: 10px 0;
      border: 1px solid #ddd;
      cursor: pointer;
    }
    .details {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
    }
    .summary {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    .summary-item {
      flex: 1;
      padding: 20px;
      text-align: center;
      border-radius: 8px;
      color: white;
    }
    .summary-passed {
      background: #4caf50;
    }
    .summary-failed {
      background: #f44336;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Form Template Test Report</h1>
    <p>Generated: ${results.timestamp}</p>
  </div>
  
  <div class="summary">
    <div class="summary-item summary-passed">
      <h2>${results.tests.filter(t => t.status === 'PASSED').length}</h2>
      <p>Passed</p>
    </div>
    <div class="summary-item summary-failed">
      <h2>${results.tests.filter(t => t.status === 'FAILED').length}</h2>
      <p>Failed</p>
    </div>
  </div>
  
  ${results.tests.map(test => `
    <div class="test ${test.status.toLowerCase()}">
      <h3>${test.name} - ${test.status}</h3>
      ${test.details ? `
        <div class="details">
          <pre>${JSON.stringify(test.details, null, 2)}</pre>
        </div>
      ` : ''}
      ${test.error ? `
        <div class="details" style="background: #ffebee;">
          <strong>Error:</strong> ${test.error}
        </div>
      ` : ''}
      ${test.screenshot ? `
        <img class="screenshot" src="${test.screenshot}" alt="${test.name}" onclick="window.open(this.src)">
      ` : ''}
      ${test.screenshots ? test.screenshots.map(s => `
        <img class="screenshot" src="${s}" alt="${test.name}" onclick="window.open(this.src)" style="width: 24%; display: inline-block;">
      `).join('') : ''}
    </div>
  `).join('')}
</body>
</html>
  `;
  return html;
}

// Run the test
console.log('🚀 Starting comprehensive form template tests...');
runComprehensiveFormTest();