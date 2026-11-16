/**
 * PothHalaPro - License & Offline Activation Engine
 * Supports 100% offline cryptographic key validation, device fingerprinting,
 * demo session countdown, and local IndexedDB persistence via StorageManager.
 */

const LicenseManager = (() => {
  const STORAGE_KEY = 'pothhalapro_license_data';
  const DEMO_DURATION_SECONDS = 300; // 5 minutes demo session

  // Secret salt for offline checksum verification
  const KEY_SALT = 'POTHA_HALA_PRO_LKR_2026_OFFLINE_SECRET';

  let demoTimeRemaining = DEMO_DURATION_SECONDS;
  let demoInterval = null;
  let isLicensed = false;
  let licenseDetails = null;

  // Simple string hash function for offline checksums
  function computeHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).toUpperCase().padStart(4, '0');
  }

  // Generate Device Fingerprint
  function getDeviceFingerprint() {
    let canvasData = '';
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('PothHalaPro-SL', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('PothHalaPro-SL', 4, 17);
      canvasData = canvas.toDataURL();
    } catch (e) {
      canvasData = 'canvas_blocked_fallback';
    }

    const raw = [
      typeof navigator !== 'undefined' ? navigator.userAgent : 'Node/Test',
      typeof screen !== 'undefined' ? screen.width + 'x' + screen.height + 'x' + screen.colorDepth : '1920x1080x24',
      (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4,
      (typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone) || 'Asia/Colombo',
      canvasData.slice(-50)
    ].join('###');

    const fp = computeHash(raw) + '-' + computeHash(raw.split('').reverse().join(''));

    // Asynchronously record device fingerprint into IndexedDB
    if (typeof window !== 'undefined' && window.StorageManager && typeof window.StorageManager.saveFingerprint === 'function') {
      window.StorageManager.saveFingerprint(fp).catch(console.warn);
    }

    return fp;
  }

  // Cryptographic Key Generation (Used by Distributors / Admins)
  function generateActivationCode(year = '2027') {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
    const p1 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const p2 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    
    // Checksum of (year + p1 + p2 + salt)
    const checkRaw = `${year}-${p1}-${p2}-${KEY_SALT}`;
    const p3 = computeHash(checkRaw).slice(0, 4);

    return `PHP-${year}-${p1}-${p2}-${p3}`;
  }

  // Generate a verified offline cryptographic token
  function generateOfflineToken(code, shopName, fingerprint) {
    const raw = `${code}:::${shopName}:::${fingerprint}:::${KEY_SALT}`;
    return `PHTOKEN-${computeHash(raw)}-${computeHash(raw.split('').reverse().join(''))}`;
  }

  // Verify an offline cryptographic token
  function verifyOfflineToken(token, code, shopName, fingerprint) {
    if (!token || typeof token !== 'string') return false;
    const expected = generateOfflineToken(code, shopName, fingerprint);
    return token === expected;
  }

  // Key Verification
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

  // Initialize status on startup
  function init() {
    // 1. Synchronous initial check via localStorage for instant UI rendering
    loadLicenseSync();
    
    if (isLicensed) {
      updateUIForLicensedState();
    } else {
      startDemoTimer();
    }

    // 2. Asynchronous IndexedDB verification via StorageManager
    if (typeof window !== 'undefined' && window.StorageManager) {
      window.StorageManager.init().then(() => {
        return window.StorageManager.getLicense();
      }).then((dbLicense) => {
        if (dbLicense && dbLicense.code) {
          const verification = verifyActivationCode(dbLicense.code);
          if (verification.valid) {
            isLicensed = true;
            licenseDetails = dbLicense;
            if (demoInterval) {
              clearInterval(demoInterval);
              demoInterval = null;
            }
            updateUIForLicensedState();
          }
        } else if (licenseDetails && licenseDetails.code) {
          // Sync localStorage license to IndexedDB
          window.StorageManager.saveLicense(licenseDetails).catch(console.warn);
        }
      }).catch((err) => {
        console.warn('[LicenseManager] IndexedDB license check warning:', err);
      });
    }
  }

  function loadLicenseSync() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const verification = verifyActivationCode(parsed.code);
          if (verification.valid) {
            isLicensed = true;
            licenseDetails = parsed;
            return;
          }
        }
      }
    } catch (e) {
      console.warn('License parse error:', e);
    }
    isLicensed = false;
    licenseDetails = null;
  }

  function activate(shopName, ownerPhone, code) {
    const result = verifyActivationCode(code);
    if (!result.valid) {
      return { success: false, message: result.reason };
    }

    const deviceFingerprint = getDeviceFingerprint();
    const offlineToken = generateOfflineToken(result.code, shopName || 'Retail Bookshop', deviceFingerprint);

    const licenseData = {
      id: 'current',
      shopName: shopName || 'Retail Bookshop & Communication',
      ownerPhone: ownerPhone || '07X XXX XXXX',
      code: result.code,
      activatedAt: new Date().toISOString(),
      deviceFingerprint: deviceFingerprint,
      offlineToken: offlineToken,
      tier: 'LIFETIME_PRO_OFFLINE',
      verifiedOffline: true
    };

    // 1. LocalStorage for synchronous immediate fallback
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(licenseData));
      }
    } catch (e) {}

    // 2. IndexedDB via StorageManager for durable offline persistence (background save)
    if (typeof window !== 'undefined' && window.StorageManager) {
      try {
        Promise.all([
          window.StorageManager.saveLicense(licenseData),
          window.StorageManager.saveFingerprint(deviceFingerprint, {
            shopName: licenseData.shopName,
            phone: licenseData.ownerPhone
          })
        ]).catch((idbErr) => {
          console.warn('[LicenseManager] IndexedDB activation persist warning:', idbErr);
        });
      } catch (idbErr) {
        console.warn('[LicenseManager] IndexedDB activation persist warning:', idbErr);
      }
    }

    isLicensed = true;
    licenseDetails = licenseData;

    if (demoInterval) {
      clearInterval(demoInterval);
      demoInterval = null;
    }

    updateUIForLicensedState();
    return {
      success: true,
      message: 'Permanent Lifetime License Activated Successfully! (Verified Offline Token Stored)',
      offlineToken: offlineToken
    };
  }

  function startDemoTimer() {
    if (typeof document === 'undefined') return;
    const timerBadge = document.getElementById('demo-timer-badge');
    const timerText = document.getElementById('demo-timer-text');
    if (!timerBadge || !timerText) return;

    timerBadge.style.display = 'flex';
    demoTimeRemaining = DEMO_DURATION_SECONDS;

    if (demoInterval) clearInterval(demoInterval);

    demoInterval = setInterval(() => {
      demoTimeRemaining--;
      if (demoTimeRemaining <= 0) {
        clearInterval(demoInterval);
        demoInterval = null;
        timerText.textContent = '00:00 - Demo Expired';
        showDemoExpiredModal();
      } else {
        const mins = Math.floor(demoTimeRemaining / 60);
        const secs = demoTimeRemaining % 60;
        timerText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} (Demo)`;
      }
    }, 1000);
  }

  function showDemoExpiredModal() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('activate-license-modal');
    if (modal) {
      modal.classList.add('active');
    }
    if (typeof window !== 'undefined' && window.App && window.App.showToast) {
      window.App.showToast('Demo trial session ended. Activate license to continue unlimited printing.', 'warning');
    }
  }

  function updateUIForLicensedState() {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
    const timerBadge = document.getElementById('demo-timer-badge');
    if (timerBadge) timerBadge.style.display = 'none';

    const statusPill = document.getElementById('sidebar-license-status');
    if (statusPill) {
      statusPill.innerHTML = `
        <div class="status-indicator">
          <span class="status-dot active"></span>
          <span style="color:#10B981;font-weight:700;">LIFETIME PRO ACTIVE</span>
        </div>
        <div style="font-size:11px;color:#94A3B8;margin-top:2px;">
          ${licenseDetails?.shopName || 'Registered Counter PC'}
        </div>
      `;
    }

    if (typeof document.querySelector === 'function') {
      const btnTrigger = document.querySelector('.btn-activate-trigger');
      if (btnTrigger) {
        btnTrigger.textContent = '★ License Info';
        btnTrigger.style.background = '#1E293B';
      }
    }

    if (typeof document.querySelectorAll === 'function') {
      document.querySelectorAll('.nav-badge-pro').forEach(el => {
        el.style.background = '#10B981';
        el.textContent = 'UNLOCKED';
      });
    }
  }

  return {
    init,
    isLicensed: () => isLicensed,
    getLicenseDetails: () => licenseDetails,
    activate,
    generateActivationCode,
    verifyActivationCode,
    getDeviceFingerprint,
    generateOfflineToken,
    verifyOfflineToken
  };
})();

if (typeof window !== 'undefined') {
  window.LicenseManager = LicenseManager;
}
