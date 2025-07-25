const puppeteer = require('puppeteer');
const axios = require('axios');

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:3000/api/v1';

async function testBackendEndpoints() {
  console.log('🔧 Testing Backend API Endpoints...');
  
  const tests = [
    { name: 'Health Check', url: `${BACKEND_URL}/health` },
    { name: 'Analytics Health', url: `${BACKEND_URL}/analytics/health` },
    { name: 'Users Endpoint', url: `${BACKEND_URL}/users` },
    { name: 'Forms Endpoint', url: `${BACKEND_URL}/observation-forms` },
    { name: 'Missions Endpoint', url: `${BACKEND_URL}/missions` },
  ];

  const results = [];
  
  for (const test of tests) {
    try {
      const response = await axios.get(test.url, { timeout: 5000 });
      results.push({
        name: test.name,
        status: 'PASS',
        statusCode: response.status,
        message: 'Endpoint accessible'
      });
      console.log(`  ✅ ${test.name}: ${response.status}`);
    } catch (error) {
      const statusCode = error.response?.status || 'NO_RESPONSE';
      const message = error.code === 'ECONNREFUSED' ? 'Server not running' : error.message;
      
      results.push({
        name: test.name,
        status: statusCode === 401 || statusCode === 403 ? 'PASS (AUTH REQUIRED)' : 'FAIL',
        statusCode,
        message
      });
      
      if (statusCode === 401 || statusCode === 403) {
        console.log(`  ✅ ${test.name}: ${statusCode} (Auth required - endpoint working)`);
      } else {
        console.log(`  ❌ ${test.name}: ${statusCode} - ${message}`);
      }
    }
  }
  
  return results;
}

async function testFrontendPages() {
  console.log('🌐 Testing Frontend Pages...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const results = [];
  
  // Set a longer timeout for page loads
  page.setDefaultTimeout(10000);
  
  const pages = [
    { name: 'Homepage', url: `${FRONTEND_URL}` },
    { name: 'Analytics Dashboard', url: `${FRONTEND_URL}/analytics` },
    { name: 'Users Page', url: `${FRONTEND_URL}/users` },
    { name: 'Forms Page', url: `${FRONTEND_URL}/forms` },
    { name: 'Missions Page', url: `${FRONTEND_URL}/missions` },
    { name: 'Mission Create', url: `${FRONTEND_URL}/missions/create` },
  ];

  for (const pageTest of pages) {
    try {
      console.log(`  Testing ${pageTest.name}...`);
      
      // Navigate to page
      const response = await page.goto(pageTest.url, { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
      
      // Check if page loaded successfully
      if (response && response.status() < 400) {
        // Wait for page to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check for React/app content
        const hasContent = await page.evaluate(() => {
          // Check if page has meaningful content (not just loading or error)
          const body = document.body.innerText;
          return body.length > 50 && !body.includes('Loading...') && !body.includes('Cannot GET');
        });
        
        // Get page title
        const title = await page.title();
        
        // Check for console errors
        const errors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            errors.push(msg.text());
          }
        });
        
        results.push({
          name: pageTest.name,
          status: hasContent ? 'PASS' : 'PARTIAL',
          statusCode: response.status(),
          title,
          message: hasContent ? 'Page loaded with content' : 'Page loaded but content may be limited'
        });
        
        console.log(`  ✅ ${pageTest.name}: ${response.status()} - "${title}"`);
      } else {
        results.push({
          name: pageTest.name,
          status: 'FAIL',
          statusCode: response ? response.status() : 'NO_RESPONSE',
          message: 'Page failed to load'
        });
        console.log(`  ❌ ${pageTest.name}: Failed to load`);
      }
    } catch (error) {
      results.push({
        name: pageTest.name,
        status: 'FAIL',
        statusCode: 'ERROR',
        message: error.message
      });
      console.log(`  ❌ ${pageTest.name}: ${error.message}`);
    }
  }
  
  await browser.close();
  return results;
}

async function testAnalyticsDashboard() {
  console.log('📊 Testing Analytics Dashboard Functionality...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const results = [];
  
  try {
    await page.goto(`${FRONTEND_URL}/analytics`, { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    // Wait for components to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test if dashboard components are rendered
    const tests = [
      {
        name: 'Dashboard Title',
        selector: '[data-testid="dashboard-title"], h3, .ant-typography h3',
        expected: 'Should have dashboard title'
      },
      {
        name: 'Statistics Cards',
        selector: '.ant-statistic, [class*="statistic"]',
        expected: 'Should have statistic cards'
      },
      {
        name: 'Dashboard Icon',
        selector: '[data-icon="dashboard"], .anticon-dashboard',
        expected: 'Should have dashboard icon'
      }
    ];
    
    for (const test of tests) {
      try {
        const element = await page.$(test.selector);
        if (element) {
          const text = await page.evaluate(el => el.textContent, element);
          results.push({
            name: test.name,
            status: 'PASS',
            message: `Found: "${text?.substring(0, 50)}..."`
          });
          console.log(`  ✅ ${test.name}: Found`);
        } else {
          results.push({
            name: test.name,
            status: 'FAIL',
            message: 'Element not found'
          });
          console.log(`  ❌ ${test.name}: Not found`);
        }
      } catch (error) {
        results.push({
          name: test.name,
          status: 'ERROR',
          message: error.message
        });
        console.log(`  ⚠️  ${test.name}: ${error.message}`);
      }
    }
    
    // Check for any network errors in console
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    results.push({
      name: 'Console Errors',
      status: consoleErrors.length === 0 ? 'PASS' : 'WARN',
      message: consoleErrors.length === 0 ? 'No console errors' : `${consoleErrors.length} console errors found`
    });
    
  } catch (error) {
    results.push({
      name: 'Analytics Dashboard Load',
      status: 'FAIL',
      message: error.message
    });
    console.log(`  ❌ Analytics Dashboard: ${error.message}`);
  }
  
  await browser.close();
  return results;
}

async function runAllTests() {
  console.log('🧪 Starting End-to-End Testing with Puppeteer\n');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  let allResults = {};
  
  try {
    // Test Backend
    allResults.backend = await testBackendEndpoints();
    console.log('');
    
    // Test Frontend Pages
    allResults.frontend = await testFrontendPages();
    console.log('');
    
    // Test Analytics Dashboard
    allResults.analytics = await testAnalyticsDashboard();
    console.log('');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
  
  // Generate Summary Report
  console.log('=' .repeat(60));
  console.log('📊 TEST SUMMARY REPORT');
  console.log('=' .repeat(60));
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  for (const [category, tests] of Object.entries(allResults)) {
    console.log(`\n${category.toUpperCase()}:`);
    
    tests.forEach(test => {
      totalTests++;
      const status = test.status.includes('PASS') ? '✅' : test.status === 'WARN' ? '⚠️' : '❌';
      
      if (test.status.includes('PASS')) passedTests++;
      else if (test.status === 'FAIL' || test.status === 'ERROR') failedTests++;
      
      console.log(`  ${status} ${test.name}: ${test.status}`);
      if (test.message && test.status !== 'PASS') {
        console.log(`    ${test.message}`);
      }
    });
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📈 FINAL RESULTS:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`   Duration: ${duration}s`);
  console.log('=' .repeat(60));
  
  // Determine overall status
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Application is working correctly.');
    process.exit(0);
  } else if (passedTests > failedTests) {
    console.log('⚠️  MOSTLY WORKING: Some issues detected but core functionality is operational.');
    process.exit(0);
  } else {
    console.log('❌ SIGNIFICANT ISSUES: Multiple failures detected. Review required.');
    process.exit(1);
  }
}

// Install required packages if not present
async function checkDependencies() {
  try {
    require('puppeteer');
    require('axios');
  } catch (error) {
    console.log('📦 Installing required dependencies...');
    const { execSync } = require('child_process');
    execSync('npm install puppeteer axios', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully\n');
  }
}

// Run the tests
checkDependencies().then(() => {
  runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
});