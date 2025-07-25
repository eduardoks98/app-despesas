module.exports = {
  displayName: 'API',
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.ts',
  ],

  // Transformação de arquivos
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
  },

  // Arquivos de teste
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,js}',
    '<rootDir>/src/**/*.{test,spec}.{ts,js}',
  ],

  // Cobertura específica da API
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,js}',
    '!src/**/*.spec.{ts,js}',
    '!src/**/index.{ts,js}',
    '!src/tests/**',
    '!src/server.ts',
  ],

  // Ignore node_modules
  transformIgnorePatterns: [
    '/node_modules/',
  ],

  // Scripts para diferentes tipos de teste
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/src/**/*.test.{ts,js}'],
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/src/**/*.integration.test.{ts,js}'],
      globalSetup: '<rootDir>/src/tests/globalSetup.ts',
      globalTeardown: '<rootDir>/src/tests/globalTeardown.ts',
    },
  ],

  // Configurações para testes de API
  testTimeout: 10000,
  detectOpenHandles: true,
  forceExit: true,
};