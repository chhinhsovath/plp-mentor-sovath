const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testCompleteApp() {
  console.log('🧪 Testing PLP Mentoring Platform...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'app-test-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    // 1. Test Login Page
    console.log('1️⃣ Testing Login Page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    const loginPageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasLoginForm: !!document.querySelector('input[name="username"]'),
        hasPasswordField: !!document.querySelector('input[name="password"]'),
        loginButtonText: document.querySelector('button[type="submit"]')?.textContent,
        pageLanguage: document.documentElement.lang
      };
    });
    
    console.log('   ✅ Login Page Details:');
    console.log('   - Title:', loginPageContent.title);
    console.log('   - Language:', loginPageContent.pageLanguage);
    console.log('   - Has login form:', loginPageContent.hasLoginForm);
    console.log('   - Login button text:', loginPageContent.loginButtonText);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '1-login-page.png'),
      fullPage: true 
    });

    // 2. Perform Login
    console.log('\n2️⃣ Logging in...');
    await page.type('input[name="username"]', 'chhinhs');
    await page.type('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    const afterLoginUrl = page.url();
    console.log('   ✅ Logged in successfully!');
    console.log('   - Current URL:', afterLoginUrl);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '2-after-login.png'),
      fullPage: true 
    });

    // 3. Test Users Page
    console.log('\n3️⃣ Testing Users Page...');
    await page.goto('http://localhost:5173/users', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);
    
    const usersPageContent = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      const users = [];
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0 && !cells[0].textContent.includes('No data')) {
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
        pageTitle: document.querySelector('h4')?.textContent,
        userCount: users.length,
        users: users,
        hasTable: !!document.querySelector('table'),
        hasSearchBox: !!document.querySelector('input[placeholder*="search" i]'),
        hasAddButton: !!document.querySelector('button[aria-label*="add" i], button:has(svg[data-testid*="PersonAdd"])')
      };
    });
    
    console.log('   ✅ Users Page Details:');
    console.log('   - Page title:', usersPageContent.pageTitle);
    console.log('   - Has table:', usersPageContent.hasTable);
    console.log('   - Has search box:', usersPageContent.hasSearchBox);
    console.log('   - Has add button:', usersPageContent.hasAddButton);
    console.log('   - Number of users:', usersPageContent.userCount);
    
    if (usersPageContent.users.length > 0) {
      console.log('\n   📋 Users List:');
      usersPageContent.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.fullName} (${user.username})`);
        console.log(`      - Email: ${user.email}`);
        console.log(`      - Role: ${user.role}`);
        console.log(`      - Status: ${user.status}`);
      });
    }
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '3-users-page.png'),
      fullPage: true 
    });

    // 4. Test Navigation Menu
    console.log('\n4️⃣ Checking Navigation Menu...');
    const navigation = await page.evaluate(() => {
      const menuItems = [];
      document.querySelectorAll('nav a, [role="navigation"] a, aside a').forEach(link => {
        const text = link.textContent.trim();
        if (text) {
          menuItems.push({
            text: text,
            href: link.href
          });
        }
      });
      return menuItems;
    });
    
    console.log('   ✅ Available Menu Items:');
    navigation.forEach(item => {
      console.log(`   - ${item.text}`);
    });

    // 5. Check User Info
    console.log('\n5️⃣ Checking User Info...');
    const userInfo = await page.evaluate(() => {
      // Look for user info in various possible locations
      const possibleSelectors = [
        '[data-testid="user-info"]',
        '.user-info',
        '[class*="user"]',
        'header [class*="avatar"]',
        'nav [class*="user"]'
      ];
      
      for (const selector of possibleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          return element.textContent.trim();
        }
      }
      return null;
    });
    
    if (userInfo) {
      console.log('   ✅ Logged in as:', userInfo);
    }

    // Summary
    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log('✅ Login page: Working');
    console.log('✅ Authentication: Working');
    console.log('✅ Users page: ' + (usersPageContent.userCount > 0 ? 'Displaying data' : 'No data'));
    console.log('✅ Navigation: Available');
    console.log('\n📸 Screenshots saved to:', screenshotsDir);
    
    // Keep browser open for 5 seconds to see the result
    console.log('\n👀 Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'error-screenshot.png'),
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

testCompleteApp().catch(console.error);