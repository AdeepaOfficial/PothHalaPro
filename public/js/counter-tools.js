/**
 * PothHalaPro - Counter Tools & Productivity Suite
 * Includes:
 * 1. Passport & Visa Photo Studio (35x45mm, 2x2 inch, 8-up photo grid)
 * 2. Bookshop Fast Billing & Counter POS (LKR currency, quick items, receipts)
 * 3. Product & Daily Labels Studio (Price tags, barcodes, shelf stickers)
 * 4. Fast 1-Page CV Builder
 */

const CounterTools = (() => {
  // -------------------------------------------------------------
  // 1. PASSPORT & VISA PHOTO STUDIO
  // -------------------------------------------------------------
  let passportPhotoImg = null;
  let passportBgColor = '#FFFFFF';
  let passportSizeKey = 'sl-passport'; // 'sl-passport' (35x45mm), 'us-visa' (50.8x50.8mm)

  function initPassportStudio() {
    const input = document.getElementById('passport-photo-input');
    if (input) {
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            const img = new Image();
            img.onload = () => {
              passportPhotoImg = img;
              renderPassportPreview();
            };
            img.src = re.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Background color presets
    document.querySelectorAll('[data-passport-bg]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-passport-bg]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        passportBgColor = btn.getAttribute('data-passport-bg');
        renderPassportPreview();
      });
    });

    // Preset sizes
    document.querySelectorAll('[data-passport-size]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-passport-size]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        passportSizeKey = btn.getAttribute('data-passport-size');
        renderPassportPreview();
      });
    });
  }

  function renderPassportPreview() {
    const liveSheet = document.getElementById('a4-live-sheet');
    const printStage = document.getElementById('print-stage');
    if (!liveSheet || !printStage) return;

    const isUsVisa = passportSizeKey === 'us-visa';
    const cardW = isUsVisa ? '50.8mm' : '35mm';
    const cardH = isUsVisa ? '50.8mm' : '45mm';
    const count = isUsVisa ? 6 : 8;

    let itemsHtml = '';
    const src = passportPhotoImg ? passportPhotoImg.src : './assets/samples/sample_nic_front.svg';

    for (let i = 0; i < count; i++) {
      itemsHtml += `
        <div class="passport-photo-item" style="width:${cardW};height:${cardH};background:${passportBgColor};border:0.2mm solid #CBD5E1;overflow:hidden;box-sizing:border-box;">
          <img src="${src}" style="width:100%;height:100%;object-fit:cover;display:block;">
        </div>
      `;
    }

    const gridHtml = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding-top:30mm;">
        <div style="font-size:12px;color:#64748B;margin-bottom:8mm;font-family:Arial,sans-serif;">
          ${isUsVisa ? 'US / INTERNATIONAL VISA (2 x 2 INCH)' : 'SRI LANKA PASSPORT STANDARD (35 x 45 MM)'} - 1:1 TRUE SCALE
        </div>
        <div style="display:grid;grid-template-columns:repeat(${isUsVisa ? 3 : 4}, ${cardW});gap:6mm;justify-content:center;">
          ${itemsHtml}
        </div>
      </div>
    `;

    if (document.getElementById('view-passport')?.classList.contains('active')) {
      liveSheet.innerHTML = gridHtml;
    }
    printStage.innerHTML = gridHtml;
  }

  // -------------------------------------------------------------
  // 2. BOOKSHOP FAST BILLING & COUNTER POS
  // -------------------------------------------------------------
  let billItems = [
    { name: 'A4 B&W Photocopy (Double)', price: 15, qty: 10 },
    { name: 'Color Print A4 (Photo Paper)', price: 80, qty: 2 },
    { name: 'Pouch Laminating A4', price: 120, qty: 1 },
    { name: 'Spiral Binding (CR Book)', price: 200, qty: 1 }
  ];
  let discountPercent = 0;
  let cashTendered = 1000;

  function initBillingPOS() {
    renderBillTable();

    // Quick add preset items
    document.querySelectorAll('[data-pos-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-pos-item');
        const price = parseFloat(btn.getAttribute('data-pos-price')) || 0;
        addItemToBill(name, price);
      });
    });

    const cashInput = document.getElementById('pos-cash-input');
    if (cashInput) {
      cashInput.addEventListener('input', (e) => {
        cashTendered = parseFloat(e.target.value) || 0;
        updateBillTotals();
      });
    }

    const discountInput = document.getElementById('pos-discount-input');
    if (discountInput) {
      discountInput.addEventListener('input', (e) => {
        discountPercent = parseFloat(e.target.value) || 0;
        updateBillTotals();
      });
    }

    const btnCustomItem = document.getElementById('btn-add-custom-pos');
    if (btnCustomItem) {
      btnCustomItem.addEventListener('click', () => {
        const nameInput = document.getElementById('pos-custom-name');
        const priceInput = document.getElementById('pos-custom-price');
        if (nameInput?.value && priceInput?.value) {
          addItemToBill(nameInput.value, parseFloat(priceInput.value) || 0);
          nameInput.value = '';
          priceInput.value = '';
        }
      });
    }
  }

  function addItemToBill(name, price) {
    const existing = billItems.find(i => i.name === name);
    if (existing) {
      existing.qty++;
    } else {
      billItems.push({ name, price, qty: 1 });
    }
    renderBillTable();
  }

  function renderBillTable() {
    const tbody = document.getElementById('pos-items-tbody');
    if (!tbody) return;

    if (billItems.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94A3B8;padding:16px;">No items in cart</td></tr>';
      updateBillTotals();
      return;
    }

    let rows = '';
    billItems.forEach((item, idx) => {
      const lineTotal = item.price * item.qty;
      rows += `
        <tr style="border-bottom:1px solid #E2E8F0;font-size:13px;">
          <td style="padding:8px 6px;font-weight:600;">${item.name}</td>
          <td style="padding:8px 6px;text-align:right;">LKR ${item.price.toFixed(2)}</td>
          <td style="padding:8px 6px;text-align:center;">
            <button onclick="CounterTools.updateQty(${idx}, -1)" style="padding:1px 6px;cursor:pointer;">-</button>
            <span style="margin:0 6px;font-weight:700;">${item.qty}</span>
            <button onclick="CounterTools.updateQty(${idx}, 1)" style="padding:1px 6px;cursor:pointer;">+</button>
          </td>
          <td style="padding:8px 6px;text-align:right;font-weight:700;">LKR ${lineTotal.toFixed(2)}</td>
          <td style="padding:8px 6px;text-align:center;">
            <button onclick="CounterTools.removeItem(${idx})" style="background:none;border:none;color:#EF4444;cursor:pointer;font-weight:bold;">✕</button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = rows;
    updateBillTotals();
  }

  function updateQty(idx, change) {
    if (billItems[idx]) {
      billItems[idx].qty += change;
      if (billItems[idx].qty <= 0) {
        billItems.splice(idx, 1);
      }
      renderBillTable();
    }
  }

  function removeItem(idx) {
    billItems.splice(idx, 1);
    renderBillTable();
  }

  function updateBillTotals() {
    const subtotal = billItems.reduce((acc, cur) => acc + (cur.price * cur.qty), 0);
    const discountAmt = subtotal * (discountPercent / 100);
    const grandTotal = Math.max(0, subtotal - discountAmt);
    const changeDue = Math.max(0, cashTendered - grandTotal);

    const subEl = document.getElementById('pos-subtotal');
    const grandEl = document.getElementById('pos-grand-total');
    const changeEl = document.getElementById('pos-change-due');

    if (subEl) subEl.textContent = `LKR ${subtotal.toFixed(2)}`;
    if (grandEl) grandEl.textContent = `LKR ${grandTotal.toFixed(2)}`;
    if (changeEl) changeEl.textContent = `LKR ${changeDue.toFixed(2)}`;

    // Prepare print stage for receipt
    renderPrintReceipt(subtotal, discountAmt, grandTotal, changeDue);
  }

  function renderPrintReceipt(subtotal, discountAmt, grandTotal, changeDue) {
    const printStage = document.getElementById('print-stage');
    if (!printStage) return;

    const license = window.LicenseManager?.getLicenseDetails();
    const shopName = license?.shopName || 'POTHA HALA & COMMUNICATION STUDIO';
    const now = new Date().toLocaleString();

    let lines = '';
    billItems.forEach(item => {
      lines += `
        <div style="display:flex;justify-content:space-between;margin:1.5mm 0;">
          <span>${item.name} x${item.qty}</span>
          <span>${(item.price * item.qty).toFixed(2)}</span>
        </div>
      `;
    });

    const receiptHtml = `
      <div class="bill-print-card" style="width:78mm;margin:10mm auto;font-family:'Courier New',monospace;font-size:9.5pt;line-height:1.3;padding:4mm;border:0.2mm solid #000;">
        <div style="text-align:center;font-weight:bold;font-size:12pt;margin-bottom:2mm;">${shopName}</div>
        <div style="text-align:center;font-size:8pt;color:#333;">Print, Photocopy, Lamination & Stationery</div>
        <div style="text-align:center;font-size:8pt;margin-bottom:3mm;">Date: ${now}</div>
        <div style="border-top:0.3mm dashed #000;margin:2mm 0;"></div>
        ${lines}
        <div style="border-top:0.3mm dashed #000;margin:2mm 0;"></div>
        <div style="display:flex;justify-content:space-between;font-weight:bold;">
          <span>SUBTOTAL:</span>
          <span>LKR ${subtotal.toFixed(2)}</span>
        </div>
        ${discountAmt > 0 ? `
          <div style="display:flex;justify-content:space-between;color:#B91C1C;">
            <span>DISCOUNT (${discountPercent}%):</span>
            <span>-LKR ${discountAmt.toFixed(2)}</span>
          </div>
        ` : ''}
        <div style="display:flex;justify-content:space-between;font-weight:900;font-size:11pt;margin-top:1.5mm;">
          <span>TOTAL:</span>
          <span>LKR ${grandTotal.toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:1.5mm;">
          <span>CASH:</span>
          <span>LKR ${cashTendered.toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-weight:bold;">
          <span>CHANGE:</span>
          <span>LKR ${changeDue.toFixed(2)}</span>
        </div>
        <div style="border-top:0.3mm dashed #000;margin:3mm 0;"></div>
        <div style="text-align:center;font-size:8pt;">Thank You! Please Visit Again.</div>
      </div>
    `;

    if (document.getElementById('view-pos')?.classList.contains('active')) {
      printStage.innerHTML = receiptHtml;
    }
  }

  async function printReceipt() {
    if (billItems && billItems.length > 0) {
      const subtotal = billItems.reduce((acc, cur) => acc + (cur.price * cur.qty), 0);
      const discountAmt = subtotal * (discountPercent / 100);
      const grandTotal = Math.max(0, subtotal - discountAmt);
      const changeDue = Math.max(0, cashTendered - grandTotal);
      const license = window.LicenseManager?.getLicenseDetails();

      const receiptRecord = {
        timestamp: Date.now(),
        items: JSON.parse(JSON.stringify(billItems)),
        subtotal: subtotal,
        discountPercent: discountPercent,
        discountAmt: discountAmt,
        grandTotal: grandTotal,
        cashTendered: cashTendered,
        changeDue: changeDue,
        paymentMethod: 'Cash',
        shopName: license?.shopName || 'POTHA HALA & COMMUNICATION STUDIO'
      };

      if (window.StorageManager && typeof window.StorageManager.saveReceipt === 'function') {
        try {
          const saved = await window.StorageManager.saveReceipt(receiptRecord);
          if (window.App && window.App.showToast) {
            window.App.showToast(`Receipt #${saved.receiptNumber} recorded in offline IndexedDB ledger`, 'success');
          }
        } catch (e) {
          console.warn('[CounterTools] Error saving receipt to IndexedDB:', e);
        }
      }
    }
    window.print();
  }

  return {
    initPassportStudio,
    renderPassportPreview,
    initBillingPOS,
    updateQty,
    removeItem,
    printReceipt
  };
})();

window.CounterTools = CounterTools;
