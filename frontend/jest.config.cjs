const base = require('../jest.config.base.cjs');

module.exports = {
  ...base,
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      diagnostics: false,
    }],
  },
  moduleNameMapper: {
    '^@angular/core$': '<rootDir>/__mocks__/@angular/core.js',
    '^@angular/common$': '<rootDir>/__mocks__/@angular/common.js',
    '^@angular/forms$': '<rootDir>/__mocks__/@angular/forms.js',
    '^@angular/router$': '<rootDir>/__mocks__/@angular/router.js',
    '^@angular/common/http$': '<rootDir>/__mocks__/@angular/common/http.js',
  },
};
