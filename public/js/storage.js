/**
 * PothHalaPro - Storage Engine (IndexedDB Offline Persistence)
 * 
 * Provides robust offline-first persistence for:
 * 1. Verified offline license tokens & activation records
 * 2. Hardware & browser device fingerprints
 * 3. Counter POS billing receipts & daily sales ledgers
 * 4. Saved student sticker lists & school customer rosters
 * 5. Background offline sync queue for REST endpoints
 * 
 * Includes transparent localStorage fallback for restricted/headless environments.
 */

const StorageManager = (() => {
  const DB_NAME = 'PothHalaProDB';
  const DB_VERSION = 1;

  // Store names
  const STORES = {
    LICENSES: 'licenses',
    FINGERPRINTS: 'device_fingerprints',
    RECEIPTS: 'counter_receipts',
    STUDENTS: 'student_stickers',
    SYNC_QUEUE: 'offline_sync_queue'
  };

  let dbInstance = null;
  let initPromise = null;
  let isIndexedDBAvailable = typeof indexedDB !== 'undefined';

  /**
   * Initialize IndexedDB database and schema
   */
  function init() {
    if (initPromise) return initPromise;

    initPromise = new Promise((resolve) => {
      if (!isIndexedDBAvailable) {
        resolve(null);
        return;
      }

      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;

          // 1. Licenses Store
          if (!db.objectStoreNames.contains(STORES.LICENSES)) {
            const licenseStore = db.createObjectStore(STORES.LICENSES, { keyPath: 'id' });
            licenseStore.createIndex('code', 'code', { unique: false });
            licenseStore.createIndex('activatedAt', 'activatedAt', { unique: false });
            licenseStore.createIndex('tier', 'tier', { unique: false });
          }

          // 2. Device Fingerprints Store
          if (!db.objectStoreNames.contains(STORES.FINGERPRINTS)) {
            const fpStore = db.createObjectStore(STORES.FINGERPRINTS, { keyPath: 'fingerprint' });
            fpStore.createIndex('createdAt', 'createdAt', { unique: false });
            fpStore.createIndex('lastSeenAt', 'lastSeenAt', { unique: false });
          }

          // 3. Counter Receipts Store
          if (!db.objectStoreNames.contains(STORES.RECEIPTS)) {
            const receiptStore = db.createObjectStore(STORES.RECEIPTS, { keyPath: 'id' });
            receiptStore.createIndex('receiptNumber', 'receiptNumber', { unique: true });
            receiptStore.createIndex('timestamp', 'timestamp', { unique: false });
            receiptStore.createIndex('dateStr', 'dateStr', { unique: false });
            receiptStore.createIndex('paymentMethod', 'paymentMethod', { unique: false });
            receiptStore.createIndex('syncedWithServer', 'syncedWithServer', { unique: false });
          }

          // 4. Saved Student Sticker Lists Store
          if (!db.objectStoreNames.contains(STORES.STUDENTS)) {
            const studentStore = db.createObjectStore(STORES.STUDENTS, { keyPath: 'id' });
            studentStore.createIndex('studentName', 'studentName', { unique: false });
            studentStore.createIndex('schoolName', 'schoolName', { unique: false });
            studentStore.createIndex('grade', 'grade', { unique: false });
            studentStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          }

          // 5. Offline Sync Queue Store
          if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
            const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
            syncStore.createIndex('endpoint', 'endpoint', { unique: false });
            syncStore.createIndex('status', 'status', { unique: false });
            syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };

        request.onsuccess = (event) => {
          dbInstance = event.target.result;
          resolve(dbInstance);
        };

        request.onerror = () => {
          isIndexedDBAvailable = false;
          resolve(null);
        };

        request.onblocked = () => {
          console.warn('[StorageManager] Database open blocked by another tab');
        };
      } catch (err) {
        isIndexedDBAvailable = false;
        resolve(null);
      }
    });

    return initPromise;
  }

  /**
   * Transparent localStorage fallback if IndexedDB is blocked or unsupported
   */
  function fallbackStorage(storeName, mode, callback) {
    const key = `pothhalapro_idb_${storeName}`;
    let items = [];
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(key);
        if (saved) items = JSON.parse(saved);
      }
    } catch (e) {
      items = [];
    }

    const mockStore = {
      get: (id) => {
        const found = items.find(item => (item.id === id || item.fingerprint === id));
        return { result: found || null };
      },
      getAll: () => ({ result: [...items] }),
      put: (item) => {
        const idx = items.findIndex(i => (i.id && i.id === item.id) || (i.fingerprint && i.fingerprint === item.fingerprint));
        if (idx >= 0) items[idx] = item;
        else items.push(item);
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(key, JSON.stringify(items));
          }
        } catch (e) {}
        return { result: item };
      },
      delete: (id) => {
        items = items.filter(i => (i.id !== id && i.fingerprint !== id));
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(key, JSON.stringify(items));
          }
        } catch (e) {}
        return { result: true };
      },
      clear: () => {
        items = [];
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(key);
          }
        } catch (e) {}
        return { result: true };
      }
    };

    return callback(mockStore, null);
  }

  /**
   * Helper to write/delete on an object store
   */
  async function performWrite(storeName, operation, itemOrKey) {
    const db = await init();
    if (!db) {
      return fallbackStorage(storeName, 'readwrite', (store) => {
        if (operation === 'put') return store.put(itemOrKey).result;
        if (operation === 'delete') return store.delete(itemOrKey).result;
        if (operation === 'clear') return store.clear().result;
      });
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        let req;
        if (operation === 'put') req = store.put(itemOrKey);
        else if (operation === 'delete') req = store.delete(itemOrKey);
        else if (operation === 'clear') req = store.clear();

        tx.oncomplete = () => resolve(req ? req.result : true);
        tx.onerror = (e) => reject(e.target.error);
        tx.onabort = (e) => reject(e.target.error || new Error('Transaction aborted'));
      } catch (err) {
        try {
          resolve(fallbackStorage(storeName, 'readwrite', (store) => {
            if (operation === 'put') return store.put(itemOrKey).result;
            if (operation === 'delete') return store.delete(itemOrKey).result;
          }));
        } catch (fbErr) {
          reject(fbErr);
        }
      }
    });
  }

  /**
   * Helper to read data from an object store
   */
  async function getStoreData(storeName, operation, key = null) {
    const db = await init();
    if (!db) {
      let res = null;
      fallbackStorage(storeName, 'readonly', (store) => {
        if (operation === 'get') res = store.get(key).result;
        else if (operation === 'getAll') res = store.getAll().result;
      });
      return res;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = (operation === 'get') ? store.get(key) : store.getAll();
        req.onsuccess = () => resolve(req.result || (operation === 'getAll' ? [] : null));
        req.onerror = () => resolve(operation === 'getAll' ? [] : null);
      } catch (e) {
        resolve(operation === 'getAll' ? [] : null);
      }
    });
  }

  // =============================================================
  // 1. LICENSE & VERIFIED OFFLINE TOKENS
  // =============================================================

  /**
   * Save verified offline license data and cryptographic token
   */
  async function saveLicense(licenseData) {
    if (!licenseData) return null;
    const record = {
      id: licenseData.id || 'current',
      code: licenseData.code,
      shopName: licenseData.shopName || 'Retail Bookshop & Communication',
      ownerPhone: licenseData.ownerPhone || '',
      tier: licenseData.tier || 'LIFETIME_PRO_OFFLINE',
      activatedAt: licenseData.activatedAt || new Date().toISOString(),
      deviceFingerprint: licenseData.deviceFingerprint || '',
      offlineToken: licenseData.offlineToken || generateOfflineToken(licenseData.code, licenseData.deviceFingerprint),
      checksum: licenseData.checksum || '',
      verifiedOffline: true,
      lastVerifiedAt: new Date().toISOString()
    };

    await performWrite(STORES.LICENSES, 'put', record);

    // Also mirror to legacy localStorage for instant synchronous reads
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pothhalapro_license_data', JSON.stringify(record));
      }
    } catch (e) {}

    return record;
  }

  /**
   * Retrieve active license record from IndexedDB (or fallback)
   */
  async function getLicense(id = 'current') {
    let license = await getStoreData(STORES.LICENSES, 'get', id);
    if (!license) {
      try {
        if (typeof localStorage !== 'undefined') {
          const legacy = localStorage.getItem('pothhalapro_license_data');
          if (legacy) {
            license = JSON.parse(legacy);
            saveLicense(license).catch(() => {});
          }
        }
      } catch (e) {}
    }
    return license;
  }

  /**
   * Clear license from storage
   */
  async function clearLicense(id = 'current') {
    await performWrite(STORES.LICENSES, 'delete', id);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('pothhalapro_license_data');
      }
    } catch (e) {}
    return true;
  }

  /**
   * Helper to derive an offline token
   */
  function generateOfflineToken(code, fingerprint) {
    const raw = `${code}:::${fingerprint}:::POTHA_HALA_OFFLINE_2026`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    return `PHTOKEN-${Math.abs(hash).toString(36).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  }

  // =============================================================
  // 2. DEVICE FINGERPRINTS
  // =============================================================

  /**
   * Save device fingerprint with system telemetry details
   */
  async function saveFingerprint(fingerprint, details = {}) {
    if (!fingerprint) return null;
    const record = {
      fingerprint: fingerprint,
      userAgent: details.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
      screenResolution: details.screenResolution || (typeof screen !== 'undefined' ? `${screen.width}x${screen.height}x${screen.colorDepth}` : ''),
      timezone: details.timezone || (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Colombo'),
      cores: details.cores || (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4),
      createdAt: details.createdAt || new Date().toISOString(),
      lastSeenAt: new Date().toISOString()
    };

    await performWrite(STORES.FINGERPRINTS, 'put', record);
    return record;
  }

  /**
   * Retrieve device fingerprint
   */
  async function getFingerprint(fingerprint) {
    if (fingerprint) {
      return getStoreData(STORES.FINGERPRINTS, 'get', fingerprint);
    }
    const all = await getStoreData(STORES.FINGERPRINTS, 'getAll');
    return Array.isArray(all) ? (all[0] || null) : null;
  }

  // =============================================================
  // 3. COUNTER BILLING RECEIPTS & SALES LEDGER
  // =============================================================

  /**
   * Save a completed counter billing receipt
   */
  async function saveReceipt(receipt) {
    if (!receipt) return null;

    const timestamp = receipt.timestamp || Date.now();
    const dateStr = receipt.dateStr || new Date(timestamp).toISOString().split('T')[0];
    const receiptId = receipt.id || `REC-${dateStr.replace(/-/g, '')}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const receiptNumber = receipt.receiptNumber || receiptId;

    const record = {
      id: receiptId,
      receiptNumber: receiptNumber,
      timestamp: timestamp,
      dateStr: dateStr,
      items: Array.isArray(receipt.items) ? receipt.items : [],
      subtotal: parseFloat(receipt.subtotal) || 0,
      discountPercent: parseFloat(receipt.discountPercent) || 0,
      discountAmt: parseFloat(receipt.discountAmt) || 0,
      grandTotal: parseFloat(receipt.grandTotal) || 0,
      cashTendered: parseFloat(receipt.cashTendered) || 0,
      changeDue: parseFloat(receipt.changeDue) || 0,
      paymentMethod: receipt.paymentMethod || 'Cash',
      customerPhone: receipt.customerPhone || '',
      shopName: receipt.shopName || 'POTHA HALA & COMMUNICATION',
      syncedWithServer: receipt.syncedWithServer || false,
      createdAt: new Date(timestamp).toISOString()
    };

    await performWrite(STORES.RECEIPTS, 'put', record);

    // Also push to offline sync queue if not synced
    if (!record.syncedWithServer) {
      await enqueueSync('/api/billing/receipt', 'POST', record);
    }

    return record;
  }

  /**
   * Retrieve all receipts with optional filtering and pagination
   */
  async function getAllReceipts(options = {}) {
    let list = await getStoreData(STORES.RECEIPTS, 'getAll') || [];
    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (options.dateStr) {
      list = list.filter(r => r.dateStr === options.dateStr);
    }
    if (options.limit && options.limit > 0) {
      const offset = options.offset || 0;
      list = list.slice(offset, offset + options.limit);
    }
    return list;
  }

  /**
   * Retrieve a single receipt by ID
   */
  async function getReceiptById(id) {
    return getStoreData(STORES.RECEIPTS, 'get', id);
  }

  /**
   * Delete a receipt by ID
   */
  async function deleteReceipt(id) {
    await performWrite(STORES.RECEIPTS, 'delete', id);
    return true;
  }

  /**
   * Calculate daily sales summary metrics for the counter POS
   */
  async function getDailySalesSummary(targetDateStr) {
    const dateStr = targetDateStr || new Date().toISOString().split('T')[0];
    const receipts = await getAllReceipts({ dateStr: dateStr });

    const summary = {
      dateStr: dateStr,
      totalBills: receipts.length,
      grossRevenue: 0,
      totalDiscount: 0,
      netRevenue: 0,
      cashTotal: 0,
      qrTotal: 0,
      cardTotal: 0,
      itemsSoldCount: 0,
      itemsBreakdown: {}
    };

    receipts.forEach(r => {
      summary.grossRevenue += (r.subtotal || 0);
      summary.totalDiscount += (r.discountAmt || 0);
      summary.netRevenue += (r.grandTotal || 0);

      const method = (r.paymentMethod || 'Cash').toLowerCase();
      if (method.includes('qr') || method.includes('frimi')) {
        summary.qrTotal += (r.grandTotal || 0);
      } else if (method.includes('card')) {
        summary.cardTotal += (r.grandTotal || 0);
      } else {
        summary.cashTotal += (r.grandTotal || 0);
      }

      if (Array.isArray(r.items)) {
        r.items.forEach(item => {
          const qty = item.qty || 1;
          summary.itemsSoldCount += qty;
          summary.itemsBreakdown[item.name] = (summary.itemsBreakdown[item.name] || 0) + qty;
        });
      }
    });

    return summary;
  }

  // =============================================================
  // 4. SAVED STUDENT STICKER LISTS (STUDENT ROSTER PERSISTENCE)
  // =============================================================

  /**
   * Save or update a student sticker profile
   */
  async function saveStudentSticker(studentData) {
    if (!studentData) return null;

    const id = studentData.id || `STUDENT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = {
      id: id,
      studentName: studentData.studentName || 'Student Name',
      schoolName: studentData.schoolName || 'School Name',
      grade: String(studentData.grade || '5'),
      classSection: studentData.classSection || 'A',
      packMode: studentData.packMode || 'multi', // 'multi' or '8pack'
      singleSubject: studentData.singleSubject || 'ගණිතය',
      activeTemplateKey: studentData.activeTemplateKey || 'cyber-neon',
      activeCartoonKey: studentData.activeCartoonKey || 'superhero',
      customPhotoDataUrl: studentData.customPhotoDataUrl || null,
      cartoonSizePercent: parseInt(studentData.cartoonSizePercent, 10) || 100,
      useCircleBadge: studentData.useCircleBadge !== false,
      lang: studentData.lang || 'si',
      updatedAt: new Date().toISOString(),
      createdAt: studentData.createdAt || new Date().toISOString()
    };

    await performWrite(STORES.STUDENTS, 'put', record);
    return record;
  }

  /**
   * Save a batch of student sticker profiles
   */
  async function saveStudentStickerBatch(studentsArray) {
    if (!Array.isArray(studentsArray)) return [];
    const saved = [];
    for (const item of studentsArray) {
      const res = await saveStudentSticker(item);
      if (res) saved.push(res);
    }
    return saved;
  }

  /**
   * Retrieve all saved student stickers
   */
  async function getAllStudentStickers() {
    const list = await getStoreData(STORES.STUDENTS, 'getAll') || [];
    list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    return list;
  }

  /**
   * Retrieve student sticker profile by ID
   */
  async function getStudentStickerById(id) {
    return getStoreData(STORES.STUDENTS, 'get', id);
  }

  /**
   * Delete a student sticker profile
   */
  async function deleteStudentSticker(id) {
    await performWrite(STORES.STUDENTS, 'delete', id);
    return true;
  }

  /**
   * Search student stickers by name or school
   */
  async function searchStudentStickers(query) {
    if (!query) return getAllStudentStickers();
    const q = query.trim().toLowerCase();
    const all = await getAllStudentStickers();
    return all.filter(s =>
      (s.studentName && s.studentName.toLowerCase().includes(q)) ||
      (s.schoolName && s.schoolName.toLowerCase().includes(q)) ||
      (s.grade && String(s.grade).includes(q))
    );
  }

  // =============================================================
  // 5. OFFLINE SYNC QUEUE (BACKGROUND SYNC WITH REST APIS)
  // =============================================================

  /**
   * Enqueue a network action to be performed when online
   */
  async function enqueueSync(endpoint, method = 'POST', payload = {}) {
    const item = {
      id: Date.now() + Math.random(),
      endpoint: endpoint,
      method: method,
      payload: payload,
      status: 'pending',
      attempts: 0,
      timestamp: Date.now()
    };

    await performWrite(STORES.SYNC_QUEUE, 'put', item);
    return item;
  }

  /**
   * Retrieve all pending sync queue items
   */
  async function getPendingSyncQueue() {
    const all = await getStoreData(STORES.SYNC_QUEUE, 'getAll') || [];
    return all.filter(i => i.status === 'pending');
  }

  /**
   * Remove a completed sync queue item
   */
  async function removeSyncItem(id) {
    await performWrite(STORES.SYNC_QUEUE, 'delete', id);
    return true;
  }

  /**
   * Synchronize pending offline data with the server
   */
  async function syncPendingData() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { success: false, reason: 'offline', syncedCount: 0 };
    }

    const pending = await getPendingSyncQueue();
    if (pending.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    let syncedCount = 0;
    for (const item of pending) {
      try {
        const response = await fetch(item.endpoint, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload)
        });

        if (response.ok) {
          await removeSyncItem(item.id);
          syncedCount++;

          if (item.endpoint.includes('/billing/receipt') && item.payload.id) {
            const receipt = await getReceiptById(item.payload.id);
            if (receipt) {
              receipt.syncedWithServer = true;
              await performWrite(STORES.RECEIPTS, 'put', receipt);
            }
          }
        } else {
          item.attempts = (item.attempts || 0) + 1;
          await performWrite(STORES.SYNC_QUEUE, 'put', item);
        }
      } catch (err) {
        break;
      }
    }

    return { success: true, syncedCount: syncedCount, remaining: pending.length - syncedCount };
  }

  // =============================================================
  // 6. BACKUP, EXPORT & STATS
  // =============================================================

  /**
   * Export all database stores into a single portable JSON backup
   */
  async function exportAllData() {
    const license = await getLicense();
    const receipts = await getAllReceipts();
    const students = await getAllStudentStickers();

    return {
      appName: 'PothHalaPro',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      license: license,
      receipts: receipts,
      students: students
    };
  }

  /**
   * Import data from JSON backup into IndexedDB
   */
  async function importAllData(jsonData) {
    if (!jsonData || typeof jsonData !== 'object') return false;

    if (jsonData.license) {
      await saveLicense(jsonData.license);
    }
    if (Array.isArray(jsonData.receipts)) {
      for (const r of jsonData.receipts) {
        await saveReceipt(r);
      }
    }
    if (Array.isArray(jsonData.students)) {
      await saveStudentStickerBatch(jsonData.students);
    }
    return true;
  }

  /**
   * Get storage statistics
   */
  async function getStats() {
    const receipts = await getAllReceipts();
    const students = await getAllStudentStickers();
    const license = await getLicense();
    const queue = await getPendingSyncQueue();

    return {
      isIndexedDB: isIndexedDBAvailable && !!dbInstance,
      isLicensed: !!(license && license.verifiedOffline),
      receiptCount: receipts.length,
      studentCount: students.length,
      pendingSyncCount: queue.length
    };
  }

  // Auto-register online sync listener
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('online', () => {
      syncPendingData().catch(() => {});
    });
  }

  return {
    init,
    STORES,
    // License
    saveLicense,
    getLicense,
    clearLicense,
    generateOfflineToken,
    // Fingerprint
    saveFingerprint,
    getFingerprint,
    // Receipts & Billing
    saveReceipt,
    getAllReceipts,
    getReceiptById,
    deleteReceipt,
    getDailySalesSummary,
    // Student Stickers
    saveStudentSticker,
    saveStudentStickerBatch,
    getAllStudentStickers,
    getStudentStickerById,
    deleteStudentSticker,
    searchStudentStickers,
    // Sync Queue
    enqueueSync,
    getPendingSyncQueue,
    syncPendingData,
    // Backup & Diagnostic
    exportAllData,
    importAllData,
    getStats
  };
})();

// Global bindings for browser and worker environments
if (typeof window !== 'undefined') {
  window.StorageManager = StorageManager;
  window.PothHalaStorage = StorageManager;
}
