module.exports = {
  displayName: 'Web App',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.ts',
  ],

  // Transformação de arquivos
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.css$': 'jest-transform-css',
  },

  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },

  // Arquivos de teste
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],

  // Cobertura específica da web
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/index.{ts,tsx}',
    '!src/tests/**',
    '!src/main.tsx',
  ],

  // Mock de arquivos estáticos
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Configurações específicas para React
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },

  // Scripts para diferentes tipos de teste
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/src/**/*.integration.test.{ts,tsx}'],
    },
  ],
};