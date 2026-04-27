const base = require('../jest.config.base.cjs');

module.exports = {
  ...base,
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
};
