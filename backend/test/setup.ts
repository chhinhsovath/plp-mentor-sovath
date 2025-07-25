import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Global test setup
beforeAll(async () => {
  // Global setup for all tests
  console.log('🧪 Starting test suite...');
});

afterAll(async () => {
  // Global cleanup for all tests
  console.log('✅ Test suite completed');
});

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock console methods in test environment to reduce noise
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    // Uncomment to suppress console.log in tests
    // log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}