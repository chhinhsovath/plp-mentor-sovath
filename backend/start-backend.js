const { spawn } = require('child_process');
const path = require('path');

// Start the backend server
const backend = spawn('node', [
  '-r', 'ts-node/register',
  '-r', 'tsconfig-paths/register',
  'src/main.ts'
], {
  cwd: __dirname,
  env: { ...process.env, TS_NODE_TRANSPILE_ONLY: 'true' },
  stdio: 'inherit'
});

backend.on('error', (err) => {
  console.error('Failed to start backend:', err);
});

backend.on('exit', (code) => {
  console.log(`Backend exited with code ${code}`);
});