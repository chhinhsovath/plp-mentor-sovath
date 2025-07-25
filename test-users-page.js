const puppeteer = require('puppeteer');

async function testUsersPage() {
  console.log('🔍 Testing Users Page...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // Capture console logs
  page.on('console', msg => {
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  try {
    // 1. Login first
    console.log('1. Logging in...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    await page.waitForSelector('input[name="username"]', { visible: true });
    await page.type('input[name="username"]', 'chhinhs');
    await page.type('input[name="password"]', 'password');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    console.log('   ✅ Logged in successfully');
    
    // 2. Navigate to users page
    console.log('\n2. Navigating to users page...');
    await page.goto('http://localhost:5173/users', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);
    
    // 3. Check if data is displayed
    console.log('\n3. Checking page content...');
    
    const pageContent = await page.evaluate(() => {
      // Get table rows
      const rows = document.querySelectorAll('table tbody tr');
      const users = [];
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
          users.push({
            fullName: cells[0]?.textContent?.trim(),
            username: cells[1]?.textContent?.trim(),
            email: cells[2]?.textContent?.trim(),
            role: cells[3]?.textContent?.trim(),
            status: cells[4]?.textContent?.trim()
          });
        }
      });
      
      return {
        title: document.querySelector('h4')?.textContent,
        userCount: users.length,
        users: users,
        hasNoDataMessage: document.body.textContent.includes('អត់មានទិន្នន័យដើម្បីបង្ហាញ') || 
                         document.body.textContent.includes('No data to display')
      };
    });
    
    console.log('   Page title:', pageContent.title);
    console.log('   Users found:', pageContent.userCount);
    console.log('   Has "no data" message:', pageContent.hasNoDataMessage);
    
    if (pageContent.users.length > 0) {
      console.log('\n   ✅ Users are displayed correctly:');
      pageContent.users.forEach((user, index) => {
        console.log(`   User ${index + 1}:`, user);
      });
    } else {
      console.log('\n   ❌ No users displayed on the page');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'users-page-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved as users-page-test.png');
    
    console.log('\n📊 Test Complete. Browser will remain open for inspection.');
    console.log('Press Ctrl+C to exit.');
    
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await browser.close();
  }
}

testUsersPage().catch(console.error);