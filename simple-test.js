const puppeteer = require('puppeteer');

async function testPage() {
  console.log('🧪 Testing observations page...');
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:5173/observations/new', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    // Wait a bit for the page to render
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    
    // Check for key Khmer phrases
    const khmerPhrases = ['ការជ្រើសរើសទម្រង់', 'ព័ត៌មានមូលដ្ឋាន', 'សាលារៀន', 'គ្រូបង្រៀន'];
    let found = 0;
    
    khmerPhrases.forEach(phrase => {
      if (bodyText.includes(phrase)) {
        console.log(`✓ Found: ${phrase}`);
        found++;
      } else {
        console.log(`✗ Missing: ${phrase}`);
      }
    });
    
    console.log(`\n📊 Found ${found}/${khmerPhrases.length} Khmer phrases`);
    
    if (found > 0) {
      console.log('🎉 SUCCESS: Khmer content is displaying!');
    } else {
      console.log('❌ ISSUE: No Khmer content found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testPage();