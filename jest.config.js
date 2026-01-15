/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/__tests__'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // Handle CSS imports (with CSS modules)
    '\\.css$': 'identity-obj-proxy',
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    // Map sinon ESM to CJS version
    '^sinon$': 'sinon/pkg/sinon.js',
    // Mock uuid module
    '^uuid$': '<rootDir>/__mocks__/uuid.js',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        diagnostics: {
          ignoreCodes: [151001],
        },
      },
    ],
  },
  // Transform ESM modules that Jest can't handle out of the box
  transformIgnorePatterns: [
    'node_modules/(?!(sinon|@shko.online/componentframework-mock)/)',
  ],
  collectCoverageFrom: [
    'AzureMapsAddressAutoComplete/**/*.{ts,tsx}',
    '!AzureMapsAddressAutoComplete/**/*.d.ts',
    '!AzureMapsAddressAutoComplete/generated/**',
    '!AzureMapsAddressAutoComplete/index.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  verbose: true,
  testTimeout: 10000,
};
