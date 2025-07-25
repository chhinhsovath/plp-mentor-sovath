const fs = require('fs');
const path = require('path');

console.log('Checking for OfflineContext references...\n');

// Read the built files
const distDir = path.join(__dirname, 'frontend', 'dist');
const srcDir = path.join(__dirname, 'frontend', 'src');

// Check if dist exists
if (fs.existsSync(distDir)) {
  console.log('Checking dist folder...');
  const files = fs.readdirSync(path.join(distDir, 'assets')).filter(f => f.endsWith('.js'));
  
  files.forEach(file => {
    const content = fs.readFileSync(path.join(distDir, 'assets', file), 'utf8');
    if (content.includes('OfflineProvider') || content.includes('OfflineContext')) {
      console.log(`Found OfflineProvider/Context in: ${file}`);
    }
  });
}

// Check source files
console.log('\nChecking source files...');
function checkDir(dir) {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      checkDir(fullPath);
    } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('OfflineProvider') || content.includes('OfflineContext') || content.includes('useOffline')) {
        console.log(`Found reference in: ${fullPath.replace(srcDir, 'src')}`);
        // Show the lines
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('OfflineProvider') || line.includes('OfflineContext') || line.includes('useOffline')) {
            console.log(`  Line ${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  });
}

checkDir(srcDir);