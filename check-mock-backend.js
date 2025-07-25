// Script to check for mock backend configuration
// Run this in the browser console at http://localhost:5173

console.log('=== Checking for Mock Backend Configuration ===');

// Check localStorage
console.log('\n1. LocalStorage:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  if (key.toLowerCase().includes('mock') || value.toLowerCase().includes('mock')) {
    console.log(`  ${key}: ${value}`);
  }
}

// Check sessionStorage
console.log('\n2. SessionStorage:');
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  const value = sessionStorage.getItem(key);
  if (key.toLowerCase().includes('mock') || value.toLowerCase().includes('mock')) {
    console.log(`  ${key}: ${value}`);
  }
}

// Check window object for mock properties
console.log('\n3. Window object:');
Object.keys(window).forEach(key => {
  if (key.toLowerCase().includes('mock')) {
    console.log(`  window.${key}:`, window[key]);
  }
});

// Check for service workers
console.log('\n4. Service Workers:');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log(`  Found ${registrations.length} service workers`);
    registrations.forEach((reg, index) => {
      console.log(`  SW ${index + 1}: ${reg.scope}`);
    });
  });
}

// Check for any global mock configurations
console.log('\n5. Checking import.meta.env:');
if (typeof import !== 'undefined' && import.meta && import.meta.env) {
  Object.entries(import.meta.env).forEach(([key, value]) => {
    if (key.includes('MOCK') || String(value).toLowerCase().includes('mock')) {
      console.log(`  ${key}: ${value}`);
    }
  });
}

console.log('\n=== End of Mock Backend Check ===');