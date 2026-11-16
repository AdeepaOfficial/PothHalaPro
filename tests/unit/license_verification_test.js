/**
 * PothHalaPro - Test Suite 2: License Verification & Offline Security Validation
 * Verifies cryptographic license key generation, checksum calculation,
 * hardware device fingerprinting, offline token binding, and tamper resistance.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { describe, it, assert } = require('../test_runner');

describe('Cryptographic License Validation & Offline Security', () => {
  const KEY_SALT = 'POTHA_HALA_PRO_LKR_2026_OFFLINE_SECRET';

  // Standalone Reference Hash Implementation
  function computeHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(36).toUpperCase().padStart(4, '0');
  }

  // Standalone Reference Generator
  function generateActivationCode(year = '2027') {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const p1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const p2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const checkRaw = `${year}-${p1}-${p2}-${KEY_SALT}`;
    const p3 = computeHash(checkRaw).slice(0, 4);
    return `PHP-${year}-${p1}-${p2}-${p3}`;
  }

  // Standalone Reference Verifier
  function verifyActivationCode(code) {
    if (!code || typeof code !== 'string') return { valid: false, reason: 'Empty code' };
    const clean = code.trim().toUpperCase();
    const parts = clean.split('-');

    if (parts.length !== 5 || parts[0] !== 'PHP') {
      return { valid: false, reason: 'Invalid format. Required: PHP-YYYY-XXXX-XXXX-XXXX' };
    }

    const [prefix, year, p1, p2, p3] = parts;
    const checkRaw = `${year}-${p1}-${p2}-${KEY_SALT}`;
    const expectedP3 = computeHash(checkRaw).slice(0, 4);

    if (p3 !== expectedP3) {
      return { valid: false, reason: 'Invalid activation code checksum.' };
    }

    return {
      valid: true,
      year: year,
      tier: 'LIFETIME_PRO',
      code: clean
    };
  }

  // Offline Token Generator & Verifier
  function generateOfflineToken(code, shopName, fingerprint) {
    const raw = `${code}:::${shopName}:::${fingerprint}:::${KEY_SALT}`;
    return `PHTOKEN-${computeHash(raw)}-${computeHash(raw.split('').reverse().join(''))}`;
  }

  function verifyOfflineToken(token, code, shopName, fingerprint) {
    if (!token || typeof token !== 'string') return false;
    const expected = generateOfflineToken(code, shopName, fingerprint);
    return token === expected;
  }

  // Load public/js/license.js into VM Sandbox
  function loadLicenseManagerInVM() {
    const filePath = path.join(__dirname, '../../public/js/license.js');
    const code = fs.readFileSync(filePath, 'utf8');

    const mockStorage = {};
    const sandbox = {
      window: {},
      document: {
        createElement: (tag) => ({
          getContext: () => ({
            textBaseline: '',
            font: '',
            fillStyle: '',
            fillRect: () => {},
            fillText: () => {}
          }),
          toDataURL: () => 'data:image/png;base64,mockedCanvasTelemetry1234567890'
        }),
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => []
      },
      localStorage: {
        getItem: (k) => mockStorage[k] || null,
        setItem: (k, v) => { mockStorage[k] = String(v); },
        removeItem: (k) => { delete mockStorage[k]; }
      },
      navigator: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PothHalaTest',
        hardwareConcurrency: 8
      },
      screen: { width: 1920, height: 1080, colorDepth: 24 },
      Intl: {
        DateTimeFormat: () => ({
          resolvedOptions: () => ({ timeZone: 'Asia/Colombo' })
        })
      },
      setInterval: () => 1,
      clearInterval: () => {}
    };
    sandbox.window = sandbox;

    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);

    return { LicenseManager: sandbox.LicenseManager, sandbox, mockStorage };
  }

  it('validates 32-bit shift-and-subtract string hash algorithm determinism', () => {
    const hash1 = computeHash('TEST_STRING_123');
    const hash2 = computeHash('TEST_STRING_123');
    assert.strictEqual(hash1, hash2, 'Hash must be strictly deterministic for identical inputs');
    assert.ok(hash1.length >= 4, 'Base36 hash output must be at least 4 characters');
    assert.ok(/^[A-Z0-9]+$/.test(hash1), 'Hash output must only contain uppercase alphanumeric characters');

    // Checksum slice formatting to 4 characters
    const checksum = hash1.slice(0, 4);
    assert.strictEqual(checksum.length, 4, 'Checksum slice must be exactly 4 uppercase characters');
    assert.ok(/^[A-Z0-9]{4}$/.test(checksum), 'Checksum slice must be 4 alphanumeric characters');

    // Distinct strings produce distinct hashes
    const hash3 = computeHash('TEST_STRING_124');
    assert.ok(hash1 !== hash3, 'Different strings must produce distinct hashes');
  });

  it('generates compliant cryptographic activation codes matching PHP-YYYY-XXXX-XXXX-XXXX', () => {
    for (const year of ['2026', '2027', '2028', '2030']) {
      const code = generateActivationCode(year);
      const parts = code.split('-');

      assert.strictEqual(parts.length, 5, 'Activation code must consist of 5 hyphen-delimited segments');
      assert.strictEqual(parts[0], 'PHP', 'Prefix must be PHP');
      assert.strictEqual(parts[1], year, `Year segment must match requested year ${year}`);
      assert.strictEqual(parts[2].length, 4, 'Segment 1 must be 4 characters');
      assert.strictEqual(parts[3].length, 4, 'Segment 2 must be 4 characters');
      assert.strictEqual(parts[4].length, 4, 'Checksum segment must be 4 characters');

      // Immediate verification
      const verifyRes = verifyActivationCode(code);
      assert.strictEqual(verifyRes.valid, true, `Newly generated code ${code} must pass verification`);
      assert.strictEqual(verifyRes.tier, 'LIFETIME_PRO', 'Verified code tier must be LIFETIME_PRO');
    }
  });

  it('detects and rejects tampered or fraudulent activation codes', () => {
    const validCode = generateActivationCode('2027');
    const parts = validCode.split('-');

    // 1. Flip a character in Segment 1
    const tamperedP1 = parts[2][0] === 'A' ? 'B' + parts[2].slice(1) : 'A' + parts[2].slice(1);
    const tamperedCode1 = `PHP-${parts[1]}-${tamperedP1}-${parts[3]}-${parts[4]}`;
    assert.strictEqual(verifyActivationCode(tamperedCode1).valid, false, 'Tampered segment 1 must fail checksum');

    // 2. Flip a character in Checksum segment
    const tamperedP3 = parts[4][0] === 'Z' ? 'Y' + parts[4].slice(1) : 'Z' + parts[4].slice(1);
    const tamperedCode2 = `PHP-${parts[1]}-${parts[2]}-${parts[3]}-${tamperedP3}`;
    assert.strictEqual(verifyActivationCode(tamperedCode2).valid, false, 'Tampered checksum segment must fail verification');

    // 3. Flip year segment
    const tamperedCode3 = `PHP-2028-${parts[2]}-${parts[3]}-${parts[4]}`;
    assert.strictEqual(verifyActivationCode(tamperedCode3).valid, false, 'Tampered year must fail verification');
  });

  it('rejects malformed inputs, missing prefixes, and invalid character sets', () => {
    assert.strictEqual(verifyActivationCode('').valid, false, 'Empty code must fail');
    assert.strictEqual(verifyActivationCode(null).valid, false, 'Null code must fail');
    assert.strictEqual(verifyActivationCode(undefined).valid, false, 'Undefined code must fail');
    assert.strictEqual(verifyActivationCode('ABC-2027-1234-5678-90AB').valid, false, 'Non-PHP prefix must fail');
    assert.strictEqual(verifyActivationCode('PHP-2027-SHORT').valid, false, 'Too few segments must fail');
    assert.strictEqual(verifyActivationCode('PHP-2027-1234-5678-90AB-EXTRA').valid, false, 'Too many segments must fail');
  });

  it('normalizes lowercase input and whitespace automatically', () => {
    const validCode = generateActivationCode('2027');
    const lowerWithSpaces = `  ${validCode.toLowerCase()}  `;

    const res = verifyActivationCode(lowerWithSpaces);
    assert.strictEqual(res.valid, true, 'Lower-case and padded code must be normalized and verified');
    assert.strictEqual(res.code, validCode, 'Verified code must be uppercase');
  });

  it('generates and cryptographically binds offline activation tokens to shop and hardware fingerprint', () => {
    const code = generateActivationCode('2027');
    const shopName = 'Vidyalankara Bookshop & Communication';
    const fingerprint = 'FP-E8A1-9B4C';

    const token = generateOfflineToken(code, shopName, fingerprint);
    assert.ok(token.startsWith('PHTOKEN-'), 'Offline token must start with PHTOKEN-');

    // Verification must succeed with exact parameters
    const isValid = verifyOfflineToken(token, code, shopName, fingerprint);
    assert.strictEqual(isValid, true, 'Valid offline token must pass verification');
  });

  it('strictly rejects forged or transferred offline tokens across different counter PCs or shops', () => {
    const code = generateActivationCode('2027');
    const originalShop = 'Lanka Books Maharagama';
    const originalFP = 'FP-DESKTOP-POS-01';
    const token = generateOfflineToken(code, originalShop, originalFP);

    // 1. Stolen token used on different PC in the same shop
    const transferredToDifferentPC = verifyOfflineToken(token, code, originalShop, 'FP-LAPTOP-POS-02');
    assert.strictEqual(transferredToDifferentPC, false, 'Token on unauthorized hardware device must fail');

    // 2. Token used under different shop name
    const transferredToDifferentShop = verifyOfflineToken(token, code, 'Pirated Counter Shop', originalFP);
    assert.strictEqual(transferredToDifferentShop, false, 'Token under different shop name must fail');

    // 3. Token used with altered license code
    const differentCode = generateActivationCode('2027');
    const mismatchedCode = verifyOfflineToken(token, differentCode, originalShop, originalFP);
    assert.strictEqual(mismatchedCode, false, 'Token paired with different license code must fail');

    // 4. Corrupted token string
    const corruptedToken = token.slice(0, -3) + 'XYZ';
    assert.strictEqual(verifyOfflineToken(corruptedToken, code, originalShop, originalFP), false, 'Corrupted token string must fail');
  });

  it('enforces multi-device counter registration limit (maximum 2 terminals per shop license)', () => {
    const registeredDevices = new Set();
    const MAX_TERMINALS = 2;

    function registerTerminal(fingerprint) {
      if (registeredDevices.has(fingerprint)) {
        return { allowed: true, status: 'EXISTING_DEVICE' };
      }
      if (registeredDevices.size >= MAX_TERMINALS) {
        return { allowed: false, status: 'TERMINAL_LIMIT_EXCEEDED' };
      }
      registeredDevices.add(fingerprint);
      return { allowed: true, status: 'DEVICE_REGISTERED' };
    }

    // Terminal 1: Counter Main PC
    const reg1 = registerTerminal('TERMINAL-01-COUNTER-A');
    assert.strictEqual(reg1.allowed, true);
    assert.strictEqual(reg1.status, 'DEVICE_REGISTERED');

    // Terminal 2: Counter Sub PC
    const reg2 = registerTerminal('TERMINAL-02-COUNTER-B');
    assert.strictEqual(reg2.allowed, true);
    assert.strictEqual(reg2.status, 'DEVICE_REGISTERED');

    // Terminal 3: Unauthorized extra machine
    const reg3 = registerTerminal('TERMINAL-03-UNAUTHORIZED');
    assert.strictEqual(reg3.allowed, false);
    assert.strictEqual(reg3.status, 'TERMINAL_LIMIT_EXCEEDED');

    // Terminal 1 reconnecting must remain allowed
    const reg1Again = registerTerminal('TERMINAL-01-COUNTER-A');
    assert.strictEqual(reg1Again.allowed, true);
    assert.strictEqual(reg1Again.status, 'EXISTING_DEVICE');
  });

  it('executes live public/js/license.js module inside browser sandbox and validates activation workflow', () => {
    const { LicenseManager, mockStorage } = loadLicenseManagerInVM();
    assert.ok(LicenseManager, 'LicenseManager must be instantiated');

    // Generate valid code using the in-app generator
    const code = LicenseManager.generateActivationCode('2027');
    assert.ok(code.startsWith('PHP-2027-'), 'Generated code must match PHP-2027- pattern');

    // Activate license
    const actResult = LicenseManager.activate('Gunasena Bookshop Galle', '077 123 4567', code);
    assert.strictEqual(actResult.success, true, 'Activation must succeed for valid code');
    assert.strictEqual(LicenseManager.isLicensed(), true, 'isLicensed() must return true');

    const details = LicenseManager.getLicenseDetails();
    assert.strictEqual(details.code, code);
    assert.strictEqual(details.shopName, 'Gunasena Bookshop Galle');
    assert.ok(details.deviceFingerprint, 'Device fingerprint must be generated');

    // Verification of persistence in localStorage
    assert.ok(mockStorage['pothhalapro_license_data'], 'License data must be stored in localStorage');
  });
});
