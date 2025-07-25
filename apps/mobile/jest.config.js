module.exports = {
  displayName: 'Mobile App',
  preset: 'jest-expo',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.ts',
  ],

  // Transformação de arquivos
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  // Módulos que não precisam de transformação
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@react-native|react-native|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],

  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
  },

  // Arquivos de teste
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],

  // Cobertura específica do mobile
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/index.{ts,tsx}',
    '!src/tests/**',
  ],

  // Environment
  testEnvironment: 'jsdom',

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