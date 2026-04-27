const base = require('../jest.config.base.cjs');

module.exports = {
  ...base,
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
};
