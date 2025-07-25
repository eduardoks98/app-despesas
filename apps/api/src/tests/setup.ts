import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock console methods for cleaner test output
const originalWarn = console.warn;
const originalError = console.error;
const originalLog = console.log;

beforeAll(() => {
  console.warn = (...args) => {
    // Ignore specific warnings
    if (args[0]?.includes('deprecated')) return;
    if (args[0]?.includes('ExperimentalWarning')) return;
    originalWarn(...args);
  };

  console.error = (...args) => {
    // Allow actual errors but filter noise
    if (args[0]?.includes('Warning: ')) return;
    originalError(...args);
  };

  console.log = (...args) => {
    // Suppress logs in tests unless explicitly needed
    if (process.env.JEST_VERBOSE === 'true') {
      originalLog(...args);
    }
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
  console.log = originalLog;
});

// Global test configuration
jest.setTimeout(30000);

// Mock external services
jest.mock('mysql2/promise', () => ({
  createConnection: jest.fn(() => ({
    execute: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
  })),
  createPool: jest.fn(() => ({
    execute: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
    getConnection: jest.fn(),
  })),
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
  verify: jest.fn(() => ({ userId: '123', email: 'test@test.com' })),
  decode: jest.fn(() => ({ userId: '123', email: 'test@test.com' })),
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashed-password')),
  compare: jest.fn(() => Promise.resolve(true)),
  genSalt: jest.fn(() => Promise.resolve('salt')),
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-id' })),
  })),
}));

// Mock crypto
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(() => Buffer.from('test-random-bytes')),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'test-hash'),
  })),
}));

// Global test utilities
global.testDb = {
  // Mock database utilities for tests
  clearTables: jest.fn(),
  seedData: jest.fn(),
  disconnect: jest.fn(),
};

// Clean up after each test
afterEach(async () => {
  jest.clearAllMocks();
  
  // Reset any test database state if needed
  if (global.testDb.clearTables) {
    await global.testDb.clearTables();
  }
});

// Setup test database before all tests
beforeAll(async () => {
  // Initialize test database connection if needed
  if (process.env.NODE_ENV === 'test') {
    // Setup test database
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connections
  if (global.testDb.disconnect) {
    await global.testDb.disconnect();
  }
});