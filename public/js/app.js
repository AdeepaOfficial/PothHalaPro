/**
 * PothHalaPro - Main Application Controller
 * Handles global routing, Ctrl+K command palette, offline PWA registration,
 * toasts, printer calibration, and modal dialogues.
 */

const App = (() => {
  let currentView = 'view-nic';
  let zoomScale = 1.0;

  // Searchable command palette items
  const COMMAND_ITEMS = [
    { title: 'Smart NIC & Driving License 1:1 Cloner', view: 'view-nic', icon: '🪪', hub: 'Cards & Production' },
    { title: 'ISO ID-1 Smart NIC Preset (85.6 x 54mm)', view: 'view-nic', action: () => NicCloner.loadSampleDocuments(), icon: '🪪', hub: 'Cards & Production' },
    { title: 'MTA Driving License Preset (85.6 x 54mm)', view: 'view-nic', icon: '🚗', hub: 'Cards & Production' },
    { title: 'School Name Sticker Studio (Grade 1-13)', view: 'view-stickers', icon: '🏷️', hub: 'Cards & Production' },
    { title: 'Passport & Visa Photo Studio (35x45mm)', view: 'view-passport', icon: '📷', hub: 'Cards & Production' },
    { title: 'Bookshop Fast Billing & Counter POS', view: 'view-pos', icon: '🧾', hub: 'Cards & Production' },
    { title: 'MTA 32 Driving License Renewal Application', view: 'view-gov', icon: '📋', hub: 'Documents & Gov Forms' },
    { title: 'Sri Lanka Passport Application Form K', view: 'view-gov', icon: '🛂', hub: 'Documents & Gov Forms' },
    { title: 'Sinhala House Rental Agreement (කුලී ගිවිසුම)', view: 'view-gov', icon: '📜', hub: 'Documents & Gov Forms' },
    { title: 'Sinhala General Affidavit (දිවුරුම් ප්‍රකාශය)', view: 'view-gov', icon: '⚖️', hub: 'Documents & Gov Forms' },
    { title: 'Sinhala Hodiya Letter Tracing Worksheet', view: 'view-edu', icon: '✏️', hub: 'Student Assets & Education' },
    { title: 'Grade 5 Scholarship Maths Model Paper', view: 'view-edu', icon: '📚', hub: 'Student Assets & Education' },
    { title: 'Printer Calibration Guide (100% 1:1 Scale)', action: () => showModal('calibration-modal'), icon: '⚙️', hub: 'System' },
    { title: 'Activate Lifetime License Key', action: () => showModal('activate-license-modal'), icon: '🔑', hub: 'System' },
    { title: 'Distributor Key Generator (Admin)', action: () => showModal('keygen-modal'), icon: '🛡️', hub: 'Admin' }
  ];

  function init() {
    registerServiceWorker();
    setupNavigation();
    setupCommandPalette();
    setupZoomControls();
    setupModals();
    setupLanguageToggle();

    // Initialize Child Modules
    if (window.LicenseManager) LicenseManager.init();
    if (window.NicCloner) NicCloner.init();
    if (window.StickerStudio) StickerStudio.init();
    if (window.CounterTools) {
      CounterTools.initPassportStudio();
      CounterTools.initBillingPOS();
    }
    if (window.EducationHub) EducationHub.init();

    // Switch to initial view
    switchView('view-nic');
  }

  // -------------------------------------------------------------
  // PWA SERVICE WORKER
  // -------------------------------------------------------------
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('[PWA] Service Worker active:', reg.scope))
          .catch(err => console.log('[PWA] Service Worker registration failed:', err));
      });
    }
  }

  // -------------------------------------------------------------
  // NAVIGATION & ROUTER
  // -------------------------------------------------------------
  function setupNavigation() {
    document.querySelectorAll('[data-nav-view]').forEach(item => {
      item.addEventListener('click', () => {
        const targetView = item.getAttribute('data-nav-view');
        switchView(targetView);
      });
    });

    // Mobile sidebar hamburger toggle & backdrop
    const btnToggle = document.getElementById('btn-sidebar-toggle');
    const backdrop = document.getElementById('sidebar-backdrop');
    const sidebar = document.getElementById('app-sidebar');

    if (btnToggle && sidebar) {
      btnToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (backdrop) backdrop.classList.toggle('active');
      });
    }

    if (backdrop && sidebar) {
      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
      });
    }

    // Global 1-Click Print Button in Header
    const btnPrint = document.getElementById('btn-global-print');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        if (currentView === 'view-nic' && window.NicCloner) {
          NicCloner.triggerPrint();
        } else if (currentView === 'view-stickers' && window.StickerStudio) {
          StickerStudio.triggerPrint();
        } else if (currentView === 'view-pos' && window.CounterTools) {
          CounterTools.printReceipt();
        } else {
          window.print();
        }
      });
    }
  }

  function switchView(viewId) {
    document.querySelectorAll('.view-container').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const targetEl = document.getElementById(viewId);
    const navItem = document.querySelector(`[data-nav-view="${viewId}"]`);

    if (targetEl) targetEl.classList.add('active');
    if (navItem) navItem.classList.add('active');
    currentView = viewId;

    // Close mobile drawer if open
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');

    // Trigger canvas/sheet update for current view
    if (viewId === 'view-nic' && window.NicCloner) {
      NicCloner.renderLivePreview();
    } else if (viewId === 'view-stickers' && window.StickerStudio) {
      StickerStudio.renderLiveStickerPreview();
    } else if (viewId === 'view-passport' && window.CounterTools) {
      CounterTools.renderPassportPreview();
    }
  }

  // -------------------------------------------------------------
  // ZOOM CONTROLS (Live A4 Preview Zoom)
  // -------------------------------------------------------------
  function setupZoomControls() {
    const sheet = document.getElementById('a4-live-sheet');
    const zoomText = document.getElementById('zoom-percentage-text');

    const updateZoom = () => {
      if (sheet) sheet.style.transform = `scale(${zoomScale})`;
      if (zoomText) zoomText.textContent = `${Math.round(zoomScale * 100)}%`;
    };

    const btnZoomIn = document.getElementById('btn-zoom-in');
    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => {
        if (zoomScale < 1.6) zoomScale += 0.1;
        updateZoom();
      });
    }

    const btnZoomOut = document.getElementById('btn-zoom-out');
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => {
        if (zoomScale > 0.5) zoomScale -= 0.1;
        updateZoom();
      });
    }

    const btnZoomReset = document.getElementById('btn-zoom-reset');
    if (btnZoomReset) {
      btnZoomReset.addEventListener('click', () => {
        zoomScale = 1.0;
        updateZoom();
      });
    }
  }

  // -------------------------------------------------------------
  // CTRL + K COMMAND PALETTE & GLOBAL SHORTCUTS
  // -------------------------------------------------------------
  function setupCommandPalette() {
    const modal = document.getElementById('command-palette-modal');
    const searchInput = document.getElementById('command-palette-input');
    const resultsContainer = document.getElementById('command-palette-results');
    const btnTrigger = document.querySelector('.btn-quick-search');

    const openPalette = () => {
      showModal('command-palette-modal');
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
        renderPaletteResults('');
      }
    };

    if (btnTrigger) btnTrigger.addEventListener('click', openPalette);

    window.addEventListener('keydown', (e) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

      // Ctrl + K: Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openPalette();
        return;
      }

      // Escape: Close all modals & drawers
      if (e.key === 'Escape') {
        closeAllModals();
        const sidebar = document.getElementById('app-sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar) sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('active');
        return;
      }

      // Ctrl + Enter: POS Complete & Print Receipt
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (currentView === 'view-pos' && window.CounterTools) {
          e.preventDefault();
          CounterTools.printReceipt();
          return;
        }
      }

      // Alt + C: Clear POS Cart
      if (e.altKey && e.key.toLowerCase() === 'c') {
        if (currentView === 'view-pos' && window.CounterTools) {
          e.preventDefault();
          CounterTools.clearBill();
          return;
        }
      }

      // Alt + E: Exact Cash Tender
      if (e.altKey && e.key.toLowerCase() === 'e') {
        if (currentView === 'view-pos') {
          e.preventDefault();
          document.querySelector('[data-tender="exact"]')?.click();
          return;
        }
      }

      // Alt + T: Quick +1000 Cash Tender
      if (e.altKey && e.key.toLowerCase() === 't') {
        if (currentView === 'view-pos') {
          e.preventDefault();
          document.querySelector('[data-tender="add1000"]')?.click();
          return;
        }
      }

      // Alt + Q: Focus Custom Item Name
      if (e.altKey && e.key.toLowerCase() === 'q') {
        if (currentView === 'view-pos') {
          e.preventDefault();
          document.getElementById('pos-custom-name')?.focus();
          return;
        }
      }

      // If typing in input, ignore single-key & F-keys
      if (isInput) return;

      // ? or F1: Show Interactive Keyboard Shortcuts Cheat Sheet
      if (e.key === '?' || e.key === 'F1') {
        e.preventDefault();
        const shortcutsModal = document.getElementById('shortcuts-modal');
        if (shortcutsModal?.classList.contains('active')) {
          closeAllModals();
        } else {
          showModal('shortcuts-modal');
        }
        return;
      }

      // F-Keys Navigation
      if (e.key === 'F2') {
        e.preventDefault();
        switchView('view-nic');
      } else if (e.key === 'F3') {
        e.preventDefault();
        switchView('view-stickers');
      } else if (e.key === 'F4') {
        e.preventDefault();
        switchView('view-passport');
      } else if (e.key === 'F8') {
        e.preventDefault();
        switchView('view-pos');
      } else if (e.key === 'F6') {
        e.preventDefault();
        switchView('view-gov');
      } else if (e.key === 'F7') {
        e.preventDefault();
        switchView('view-edu');
      }

      // Quick-add items 1-6 in POS view
      if (currentView === 'view-pos' && window.CounterTools && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        CounterTools.addItemByShortcut(e.key);
      }
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderPaletteResults(e.target.value.trim().toLowerCase());
      });
    }
  }

  function renderPaletteResults(query) {
    const container = document.getElementById('command-palette-results');
    if (!container) return;

    const filtered = COMMAND_ITEMS.filter(item => {
      if (!query) return true;
      return item.title.toLowerCase().includes(query) || item.hub.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      container.innerHTML = '<div style="padding:16px;text-align:center;color:#94A3B8;font-size:13px;">No matching tools or forms found</div>';
      return;
    }

    let html = '';
    filtered.forEach((item, idx) => {
      html += `
        <div class="command-result-item" data-idx="${idx}" style="
          display:flex;align-items:center;justify-content:space-between;
          padding:10px 14px;border-radius:6px;cursor:pointer;
          border-bottom:1px solid #F1F5F9;transition:background 0.15s;
        ">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:18px;">${item.icon}</span>
            <div>
              <div style="font-size:13.5px;font-weight:600;color:#0F172A;">${item.title}</div>
              <div style="font-size:11px;color:#64748B;">${item.hub}</div>
            </div>
          </div>
          <span style="font-size:11px;color:#2563EB;font-weight:600;">Select ↵</span>
        </div>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.command-result-item').forEach(el => {
      el.addEventListener('mouseenter', () => el.style.background = '#EFF6FF');
      el.addEventListener('mouseleave', () => el.style.background = 'transparent');
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-idx'), 10);
        const item = filtered[idx];
        closeAllModals();
        if (item.view) switchView(item.view);
        if (item.action) item.action();
      });
    });
  }

  // -------------------------------------------------------------
  // MODALS
  // -------------------------------------------------------------
  function setupModals() {
    // Close buttons
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => closeAllModals());
    });

    // Close on backdrop click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAllModals();
      });
    });

    // Activation modal trigger
    const btnActivate = document.querySelector('.btn-activate-trigger');
    if (btnActivate) {
      btnActivate.addEventListener('click', () => showModal('activate-license-modal'));
    }

    // License Activation Form Submit
    const btnSubmitActivation = document.getElementById('btn-submit-activation');
    if (btnSubmitActivation) {
      btnSubmitActivation.addEventListener('click', () => {
        const shopName = document.getElementById('act-shop-name')?.value;
        const phone = document.getElementById('act-owner-phone')?.value;
        const code = document.getElementById('act-license-code')?.value;

        const result = LicenseManager.activate(shopName, phone, code);
        if (result.success) {
          showToast(result.message, 'success');
          closeAllModals();
        } else {
          showToast(result.message, 'error');
        }
      });
    }

    // Keygen (Distributor Portal) Modal
    const btnGenerateKey = document.getElementById('btn-generate-keygen');
    if (btnGenerateKey) {
      btnGenerateKey.addEventListener('click', () => {
        const newCode = LicenseManager.generateActivationCode('2027');
        const output = document.getElementById('keygen-output-code');
        if (output) output.value = newCode;
        showToast('Generated cryptographically verified lifetime activation key!', 'success');
      });
    }

    // Shortcuts Cheat Sheet Modal triggers
    const btnShortcuts = document.getElementById('btn-shortcuts-hint');
    if (btnShortcuts) {
      btnShortcuts.addEventListener('click', () => showModal('shortcuts-modal'));
    }

    const btnFloatingShortcuts = document.getElementById('floating-shortcut-pill');
    if (btnFloatingShortcuts) {
      btnFloatingShortcuts.addEventListener('click', () => showModal('shortcuts-modal'));
    }
  }

  function showModal(modalId) {
    closeAllModals();
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  // -------------------------------------------------------------
  // LANGUAGE TOGGLE
  // -------------------------------------------------------------
  function setupLanguageToggle() {
    const btnSi = document.getElementById('btn-lang-si');
    const btnEn = document.getElementById('btn-lang-en');

    if (btnSi && btnEn) {
      btnSi.addEventListener('click', () => {
        btnSi.classList.add('active');
        btnEn.classList.remove('active');
        if (window.StickerStudio) StickerStudio.setLanguage('si');
      });

      btnEn.addEventListener('click', () => {
        btnEn.classList.add('active');
        btnSi.classList.remove('active');
        if (window.StickerStudio) StickerStudio.setLanguage('en');
      });
    }
  }

  // -------------------------------------------------------------
  // TOAST NOTIFICATIONS
  // -------------------------------------------------------------
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s';
      setTimeout(() => toast.remove(), 200);
    }, 3500);
  }

  return {
    init,
    switchView,
    showModal,
    closeAllModals,
    showToast
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;
