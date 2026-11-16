/**
 * PothHalaPro - Automated Test Runner & Assertion Harness
 * Lightweight, zero-dependency Node.js test framework for QA test suites.
 * Supports running individual suites or executing the entire test suite.
 */

const fs = require('fs');
const path = require('path');

// Test State Management
class TestContext {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.currentTest = null;
    this.stats = {
      suites: 0,
      tests: 0,
      assertions: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      durationMs: 0
    };
    this.startTime = Date.now();
  }

  describe(suiteName, suiteFn) {
    const suite = {
      name: suiteName,
      tests: [],
      passed: 0,
      failed: 0,
      durationMs: 0
    };
    this.suites.push(suite);
    this.currentSuite = suite;
    this.stats.suites++;

    const start = Date.now();
    try {
      suiteFn();
    } catch (err) {
      console.error(`\x1b[31m[ERROR] Suite '${suiteName}' failed to execute: ${err.message}\x1b[0m`);
      console.error(err.stack);
    }
    suite.durationMs = Date.now() - start;
    this.currentSuite = null;
  }

  it(testName, testFn) {
    if (!this.currentSuite) {
      throw new Error(`Test '${testName}' must be defined inside a describe() block.`);
    }

    const test = {
      name: testName,
      passed: false,
      error: null,
      assertions: 0,
      durationMs: 0
    };
    this.currentSuite.tests.push(test);
    this.currentTest = test;
    this.stats.tests++;

    const start = Date.now();
    try {
      testFn();
      test.passed = true;
      test.durationMs = Date.now() - start;
      this.currentSuite.passed++;
      this.stats.passed++;
    } catch (err) {
      test.passed = false;
      test.error = err;
      test.durationMs = Date.now() - start;
      this.currentSuite.failed++;
      this.stats.failed++;
    }
    this.currentTest = null;
  }

  recordAssertion() {
    this.stats.assertions++;
    if (this.currentTest) {
      this.currentTest.assertions++;
    }
  }

  printSummary() {
    this.stats.durationMs = Date.now() - this.startTime;

    console.log('\n' + '='.repeat(78));
    console.log('              POTHAHALAPRO - AUTOMATED QA TEST RUNNER');
    console.log('='.repeat(78));

    for (const suite of this.suites) {
      const suiteBadge = suite.failed === 0 
        ? '\x1b[32m[PASS]\x1b[0m' 
        : '\x1b[31m[FAIL]\x1b[0m';
      console.log(`\n${suiteBadge} \x1b[1m${suite.name}\x1b[0m (${suite.durationMs}ms)`);

      for (const test of suite.tests) {
        if (test.passed) {
          console.log(`  \x1b[32m✔\x1b[0m ${test.name} \x1b[90m(${test.assertions} assertions, ${test.durationMs}ms)\x1b[0m`);
        } else {
          console.log(`  \x1b[31m✘ ${test.name}\x1b[0m \x1b[90m(${test.durationMs}ms)\x1b[0m`);
          console.log(`    \x1b[31mAssertionError: ${test.error.message}\x1b[0m`);
          if (test.error.expected !== undefined && test.error.actual !== undefined) {
            console.log(`      \x1b[90mExpected: ${JSON.stringify(test.error.expected)}\x1b[0m`);
            console.log(`      \x1b[90mActual:   ${JSON.stringify(test.error.actual)}\x1b[0m`);
          }
          if (test.error.stack) {
            const stackLine = test.error.stack.split('\n')[1] || '';
            console.log(`      \x1b[90m${stackLine.trim()}\x1b[0m`);
          }
        }
      }
    }

    console.log('\n' + '-'.repeat(78));
    console.log('TEST EXECUTION SUMMARY:');
    console.log(`  Suites:      ${this.stats.suites} total`);
    console.log(`  Tests:       \x1b[32m${this.stats.passed} passed\x1b[0m, ${this.stats.failed > 0 ? `\x1b[31m${this.stats.failed} failed\x1b[0m` : '0 failed'}, ${this.stats.tests} total`);
    console.log(`  Assertions:  \x1b[36m${this.stats.assertions} verified\x1b[0m`);
    console.log(`  Duration:    ${(this.stats.durationMs / 1000).toFixed(3)}s`);

    const allPassed = this.stats.failed === 0 && this.stats.tests > 0;
    if (allPassed) {
      console.log('\x1b[32m\x1b[1m\n✔ OVERALL VERDICT: ALL QA TEST SUITES PASSED (100% SUCCESS RATE)\x1b[0m');
    } else {
      console.log(`\x1b[31m\x1b[1m\n✘ OVERALL VERDICT: ${this.stats.failed} TEST(S) FAILED\x1b[0m`);
    }
    console.log('='.repeat(78) + '\n');

    return allPassed;
  }
}

// Global Context Instance
const testCtx = new TestContext();

// Assertions Helper Class
const assert = {
  strictEqual(actual, expected, message) {
    testCtx.recordAssertion();
    if (actual !== expected) {
      const err = new Error(message || `Expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
      err.expected = expected;
      err.actual = actual;
      throw err;
    }
  },

  deepStrictEqual(actual, expected, message) {
    testCtx.recordAssertion();
    const actStr = JSON.stringify(actual);
    const expStr = JSON.stringify(expected);
    if (actStr !== expStr) {
      const err = new Error(message || `Deep inequality:\nExpected: ${expStr}\nActual:   ${actStr}`);
      err.expected = expected;
      err.actual = actual;
      throw err;
    }
  },

  closeTo(actual, expected, delta, message) {
    testCtx.recordAssertion();
    const diff = Math.abs(actual - expected);
    if (diff > delta) {
      const err = new Error(message || `Value ${actual} is not within ${delta} of expected ${expected} (diff: ${diff.toFixed(6)})`);
      err.expected = `[${expected - delta} .. ${expected + delta}]`;
      err.actual = actual;
      throw err;
    }
  },

  ok(value, message) {
    testCtx.recordAssertion();
    if (!value) {
      const err = new Error(message || `Expected truthy value but got ${JSON.stringify(value)}`);
      err.expected = true;
      err.actual = value;
      throw err;
    }
  },

  throws(fn, expectedMsg, message) {
    testCtx.recordAssertion();
    let threw = false;
    let errorObj = null;
    try {
      fn();
    } catch (e) {
      threw = true;
      errorObj = e;
    }

    if (!threw) {
      throw new Error(message || 'Expected function to throw an exception, but it succeeded.');
    }

    if (expectedMsg && errorObj) {
      if (typeof expectedMsg === 'string' && !errorObj.message.includes(expectedMsg)) {
        throw new Error(message || `Expected error message to include '${expectedMsg}', but got: '${errorObj.message}'`);
      } else if (expectedMsg instanceof RegExp && !expectedMsg.test(errorObj.message)) {
        throw new Error(message || `Expected error message to match regex ${expectedMsg}, but got: '${errorObj.message}'`);
      }
    }
  },

  includes(container, item, message) {
    testCtx.recordAssertion();
    if (typeof container === 'string' || Array.isArray(container)) {
      if (!container.includes(item)) {
        const err = new Error(message || `Container does not include expected element: ${JSON.stringify(item)}`);
        err.expected = item;
        err.actual = container;
        throw err;
      }
    } else {
      throw new Error('assert.includes requires string or array container.');
    }
  }
};

function describe(name, fn) {
  testCtx.describe(name, fn);
}

function it(name, fn) {
  testCtx.it(name, fn);
}

// Suite Runner
function runAllSuites() {
  const unitDir = path.join(__dirname, 'unit');
  if (!fs.existsSync(unitDir)) {
    console.error(`\x1b[31m[ERROR] Unit test directory not found: ${unitDir}\x1b[0m`);
    process.exit(1);
  }

  const testFiles = fs.readdirSync(unitDir)
    .filter(file => file.endsWith('_test.js'))
    .sort();

  console.log(`\x1b[1mDiscovered ${testFiles.length} unit test suite(s) in ${unitDir}\x1b[0m`);

  for (const file of testFiles) {
    const filePath = path.join(unitDir, file);
    try {
      require(filePath);
    } catch (err) {
      console.error(`\x1b[31mFailed to load test suite ${file}: ${err.message}\x1b[0m`);
      console.error(err.stack);
      process.exit(1);
    }
  }

  const success = testCtx.printSummary();
  return success;
}

module.exports = {
  describe,
  it,
  assert,
  testCtx,
  runAllSuites
};

// Also expose as globals for convenience
global.describe = describe;
global.it = it;
global.assert = assert;

// Direct Execution Entrypoint
if (require.main === module) {
  const success = runAllSuites();
  process.exit(success ? 0 : 1);
} else if (require.main && require.main.filename.includes(path.join('tests', 'unit'))) {
  // If an individual unit test file was executed directly
  setImmediate(() => {
    const success = testCtx.printSummary();
    if (!success) process.exitCode = 1;
  });
}
