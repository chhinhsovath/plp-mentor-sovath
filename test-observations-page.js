const puppeteer = require('puppeteer');

async function testObservationsPage() {
  console.log('🧪 Testing observations/new page for Khmer translations...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the observations page
    console.log('📡 Navigating to http://localhost:5173/observations/new');
    await page.goto('http://localhost:5173/observations/new', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Check if Khmer text is present
    const pageText = await page.evaluate(() => document.body.innerText);
    
    console.log('\n✅ Checking for Khmer translations:');
    
    const khmerChecks = [
      { key: 'ការជ្រើសរើសទម្រង់', desc: 'Form Selection' },
      { key: 'ទម្រង់សង្កេត', desc: 'Observation Form' },
      { key: 'ព័ត៌មានមូលដ្ឋាន', desc: 'Basic Info' },
      { key: 'សាលារៀន', desc: 'School' },
      { key: 'គ្រូបង្រៀន', desc: 'Teacher' },
      { key: 'កាលបរិច្ឆេទ', desc: 'Date/Time' },
      { key: 'ភាសាខ្មែរ', desc: 'Khmer Language' },
      { key: 'គណិតវិទ្យា', desc: 'Mathematics' },
      { key: 'ថ្នាក់', desc: 'Grade' }
    ];
    
    let foundCount = 0;
    khmerChecks.forEach(check => {
      if (pageText.includes(check.key)) {
        console.log(`  ✓ Found: "${check.key}" (${check.desc})`);
        foundCount++;
      } else {
        console.log(`  ✗ Missing: "${check.key}" (${check.desc})`);
      }
    });
    
    console.log(`\n📊 Result: ${foundCount}/${khmerChecks.length} Khmer translations found`);
    
    if (foundCount >= khmerChecks.length * 0.7) {
      console.log('🎉 SUCCESS: Most Khmer translations are working!');
    } else {
      console.log('⚠️  WARNING: Many Khmer translations are missing');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'observations-page-test.png', fullPage: true });
    console.log('📷 Screenshot saved as observations-page-test.png');
    
  } catch (error) {
    console.error('❌ Error testing page:', error.message);
  } finally {
    await browser.close();
  }
}

testObservationsPage();