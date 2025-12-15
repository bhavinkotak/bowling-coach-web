#!/usr/bin/env node

/**
 * Test Runner for API Contract Tests
 * 
 * Usage: node run-contract-tests.js
 */

import { runAllTests } from './src/tests/api-contract.test.ts';

runAllTests()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
