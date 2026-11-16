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
  // 2. BOOKSHOP FAST BILLING & TOUCHSCREEN COUNTER POS
  // -------------------------------------------------------------
  const POS_CATALOG = [
    // Copies & Prints
    { id: 'bw-a4', cat: 'prints', name: 'A4 B&W Photocopy', si: 'A4 කලු-සුදු පිටපත', price: 10, defaultQty: 1, shortcut: '1' },
    { id: 'bw-a4-double', cat: 'prints', name: 'A4 B&W Double Side', si: 'A4 දෙපැත්ත පිටපත', price: 15, defaultQty: 1, shortcut: '2' },
    { id: 'col-a4', cat: 'prints', name: 'A4 Color Print', si: 'A4 වර්ණ මුද්‍රණය', price: 50, defaultQty: 1, shortcut: '3' },
    { id: 'col-photo', cat: 'prints', name: 'Color Photo Print (Glossy)', si: 'දිලිසෙන ඡායාරූප මුද්‍රණය', price: 100, defaultQty: 1 },
    { id: 'bw-a3', cat: 'prints', name: 'A3 B&W Photocopy', si: 'A3 විශාල පිටපත', price: 30, defaultQty: 1 },
    
    // Laminating & Binding
    { id: 'lam-nic', cat: 'lamination', name: 'NIC Pouch Laminating', si: 'හැඳුනුම්පත් ලැමිනේටින්', price: 60, defaultQty: 1, shortcut: '4' },
    { id: 'lam-a4', cat: 'lamination', name: 'A4 Pouch Laminating', si: 'A4 ලැමිනේටින්', price: 120, defaultQty: 1, shortcut: '5' },
    { id: 'lam-a3', cat: 'lamination', name: 'A3 Large Laminating', si: 'A3 ලැමිනේටින්', price: 250, defaultQty: 1 },
    { id: 'bind-spiral', cat: 'lamination', name: 'Spiral Binding (CR/A4)', si: 'ස්පයිරල් බයින්ඩින්', price: 180, defaultQty: 1, shortcut: '6' },
    { id: 'bind-hard', cat: 'lamination', name: 'Hard Cover Book Binding', si: 'තද කවර පොත් බයින්ඩින්', price: 450, defaultQty: 1 },
    
    // ID & Photos
    { id: 'nic-clone', cat: 'id-cards', name: '1:1 Smart NIC Exact Clone', si: 'ස්මාර්ට් හැඳුනුම්පත් පිටපත', price: 80, defaultQty: 1 },
    { id: 'dl-clone', cat: 'id-cards', name: 'Driving License Exact Clone', si: 'රියදුරු බලපත්‍ර පිටපත', price: 80, defaultQty: 1 },
    { id: 'passport-8up', cat: 'id-cards', name: 'Passport Photos (8-Photo Grid)', si: 'පාස්පෝට් ඡායාරූප 8 ක්', price: 200, defaultQty: 1 },
    { id: 'us-visa-6up', cat: 'id-cards', name: 'US Visa 2x2 Photos (6-Grid)', si: 'ඇමරිකා වීසා ඡායාරූප 6 ක්', price: 250, defaultQty: 1 },

    // Stationery & Forms
    { id: 'stickers-a4', cat: 'stationery', name: 'School Name Stickers Sheet (8-Up)', si: 'පාසල් නම ස්ටිකර් 8 ක කොළය', price: 150, defaultQty: 1 },
    { id: 'gov-form-print', cat: 'stationery', name: 'MTA / Passport Form & Print', si: 'රජයේ අයදුම්පත සහ මුද්‍රණය', price: 50, defaultQty: 1 },
    { id: 'cr-book-single', cat: 'stationery', name: 'CR Exercise Book (Single Rule)', si: 'CR තනි රූල් අභ්‍යාස පොත', price: 220, defaultQty: 1 },
    { id: 'box-file-standard', cat: 'stationery', name: 'Office Box File (Hardboard)', si: 'කාර්යාල බොක්ස් ෆයිල්', price: 320, defaultQty: 1 }
  ];

  let billItems = [
    { name: 'A4 B&W Photocopy (Double)', price: 15, qty: 10 },
    { name: 'Color Print A4 (Photo Paper)', price: 80, qty: 2 },
    { name: 'Pouch Laminating A4', price: 120, qty: 1 },
    { name: 'Spiral Binding (CR Book)', price: 180, qty: 1 }
  ];

  let activeCategory = 'all';
  let paymentMethod = 'cash'; // 'cash', 'lankaqr', 'card'
  let receiptWidth = '80mm';   // '80mm' or '58mm'
  let discountPercent = 0;
  let cashTendered = 1000;
  let receiptSequence = 1001;

  function initBillingPOS() {
    renderTouchGrid('all');
    renderBillTable();
    bindPosEvents();
  }

  function bindPosEvents() {
    // Category Tabs
    document.querySelectorAll('[data-pos-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-pos-cat]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.getAttribute('data-pos-cat');
        renderTouchGrid(activeCategory);
      });
    });

    // Payment Method selector
    document.querySelectorAll('[data-pay-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-pay-mode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        paymentMethod = btn.getAttribute('data-pay-mode');
        updateBillTotals();
      });
    });

    // Receipt Format toggle (80mm vs 58mm)
    document.querySelectorAll('[data-receipt-width]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-receipt-width]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        receiptWidth = btn.getAttribute('data-receipt-width');
        updateBillTotals();
        if (window.App && window.App.showToast) {
          window.App.showToast(`Thermal Receipt layout set to ${receiptWidth}`, 'info');
        }
      });
    });

    // Cash tender input
    const cashInput = document.getElementById('pos-cash-input');
    if (cashInput) {
      cashInput.addEventListener('input', (e) => {
        cashTendered = parseFloat(e.target.value) || 0;
        updateBillTotals();
      });
    }

    // Discount input
    const discountInput = document.getElementById('pos-discount-input');
    if (discountInput) {
      discountInput.addEventListener('input', (e) => {
        discountPercent = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
        updateBillTotals();
      });
    }

    // Custom Item Add button
    const btnCustomItem = document.getElementById('btn-add-custom-pos');
    if (btnCustomItem) {
      btnCustomItem.addEventListener('click', addCustomItemFromInputs);
    }

    const customNameInput = document.getElementById('pos-custom-name');
    const customPriceInput = document.getElementById('pos-custom-price');
    if (customPriceInput) {
      customPriceInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addCustomItemFromInputs();
      });
    }

    // Quick tender buttons
    document.querySelectorAll('[data-tender]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-tender');
        handleQuickTender(action);
      });
    });

    // Touch Numpad buttons
    document.querySelectorAll('[data-num]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-num');
        handleNumpad(val);
      });
    });

    // Clear cart button
    const btnClearCart = document.getElementById('btn-clear-pos-cart');
    if (btnClearCart) {
      btnClearCart.addEventListener('click', clearBill);
    }
  }

  function renderTouchGrid(cat = 'all') {
    const grid = document.getElementById('pos-touch-grid');
    if (!grid) return;

    const items = (cat === 'all') 
      ? POS_CATALOG 
      : POS_CATALOG.filter(i => i.cat === cat);

    let html = '';
    items.forEach(item => {
      const shortcutBadge = item.shortcut ? `<span class="item-shortcut">${item.shortcut}</span>` : '';
      html += `
        <button class="pos-touch-card" data-catalog-id="${item.id}" type="button">
          ${shortcutBadge}
          <div>
            <div class="item-name">${item.name}</div>
            <div class="item-si sinhala-subtext">${item.si}</div>
          </div>
          <div class="item-price">LKR ${item.price.toFixed(2)}</div>
        </button>
      `;
    });

    grid.innerHTML = html;

    // Attach click/touch handlers
    grid.querySelectorAll('.pos-touch-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-catalog-id');
        const item = POS_CATALOG.find(i => i.id === id);
        if (item) {
          addItemToBill(item.name, item.price);
        }
      });
    });
  }

  function addCustomItemFromInputs() {
    const nameInput = document.getElementById('pos-custom-name');
    const priceInput = document.getElementById('pos-custom-price');
    if (nameInput?.value && priceInput?.value) {
      const price = parseFloat(priceInput.value) || 0;
      addItemToBill(nameInput.value.trim(), price);
      nameInput.value = '';
      priceInput.value = '';
      nameInput.focus();
    }
  }

  function handleQuickTender(action) {
    const cashInput = document.getElementById('pos-cash-input');
    const subtotal = billItems.reduce((acc, cur) => acc + (cur.price * cur.qty), 0);
    const discountAmt = subtotal * (discountPercent / 100);
    const grandTotal = Math.max(0, subtotal - discountAmt);

    if (action === 'exact') {
      cashTendered = grandTotal;
    } else if (action === 'add50') {
      cashTendered = (cashTendered || 0) + 50;
    } else if (action === 'add100') {
      cashTendered = (cashTendered || 0) + 100;
    } else if (action === 'add500') {
      cashTendered = (cashTendered || 0) + 500;
    } else if (action === 'add1000') {
      cashTendered = (cashTendered || 0) + 1000;
    } else if (action === 'add5000') {
      cashTendered = (cashTendered || 0) + 5000;
    }

    if (cashInput) cashInput.value = cashTendered;
    updateBillTotals();
  }

  function handleNumpad(val) {
    const cashInput = document.getElementById('pos-cash-input');
    if (!cashInput) return;

    let current = cashInput.value || '';
    if (val === 'clear') {
      current = '0';
    } else if (val === 'back') {
      current = current.slice(0, -1) || '0';
    } else {
      current = (current === '0') ? val : current + val;
    }

    cashInput.value = current;
    cashTendered = parseFloat(current) || 0;
    updateBillTotals();
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

  function addItemByShortcut(shortcutKey) {
    const item = POS_CATALOG.find(i => i.shortcut === String(shortcutKey));
    if (item) {
      addItemToBill(item.name, item.price);
      if (window.App && window.App.showToast) {
        window.App.showToast(`+ Added ${item.name} (LKR ${item.price})`, 'info');
      }
    }
  }

  function renderBillTable() {
    const tbody = document.getElementById('pos-items-tbody');
    const badge = document.getElementById('pos-item-count-badge');
    if (!tbody) return;

    const totalQty = billItems.reduce((acc, cur) => acc + cur.qty, 0);
    if (badge) badge.textContent = `${totalQty} item${totalQty === 1 ? '' : 's'}`;

    if (billItems.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94A3B8;padding:24px;font-size:13px;">No items in cart. Tap items on the left to start billing.</td></tr>';
      updateBillTotals();
      return;
    }

    let rows = '';
    billItems.forEach((item, idx) => {
      const lineTotal = item.price * item.qty;
      rows += `
        <tr style="border-bottom:1px solid #E2E8F0;font-size:13px;">
          <td style="padding:10px 10px;font-weight:600;color:#0F172A;">${item.name}</td>
          <td style="padding:10px 8px;text-align:right;color:#64748B;">LKR ${item.price.toFixed(2)}</td>
          <td style="padding:10px 8px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:6px;">
              <button type="button" class="btn-qty-touch" onclick="CounterTools.updateQty(${idx}, -1)" title="Decrease">-</button>
              <span style="min-width:24px;font-weight:800;font-size:14px;">${item.qty}</span>
              <button type="button" class="btn-qty-touch" onclick="CounterTools.updateQty(${idx}, 1)" title="Increase">+</button>
            </div>
          </td>
          <td style="padding:10px 10px;text-align:right;font-weight:800;color:#0F172A;">LKR ${lineTotal.toFixed(2)}</td>
          <td style="padding:10px 8px;text-align:center;">
            <button type="button" class="btn-del-touch" onclick="CounterTools.removeItem(${idx})" title="Remove item">✕</button>
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

  function clearBill() {
    if (billItems.length === 0) return;
    billItems = [];
    discountPercent = 0;
    const discountInput = document.getElementById('pos-discount-input');
    if (discountInput) discountInput.value = 0;
    renderBillTable();
    if (window.App && window.App.showToast) {
      window.App.showToast('Current bill cart cleared', 'info');
    }
  }

  function updateBillTotals() {
    const subtotal = billItems.reduce((acc, cur) => acc + (cur.price * cur.qty), 0);
    const discountAmt = subtotal * (discountPercent / 100);
    const grandTotal = Math.max(0, subtotal - discountAmt);
    const changeDue = Math.max(0, cashTendered - grandTotal);
    const hasDeficit = (paymentMethod === 'cash') && (cashTendered < grandTotal) && (grandTotal > 0);

    const subEl = document.getElementById('pos-subtotal');
    const grandEl = document.getElementById('pos-grand-total');
    const changeEl = document.getElementById('pos-change-due');
    const tenderedEl = document.getElementById('pos-tendered-display');
    const discountRow = document.getElementById('pos-discount-row');
    const discountLabel = document.getElementById('pos-discount-label');
    const discountAmtEl = document.getElementById('pos-discount-amt');
    const changeRow = document.getElementById('pos-change-row');

    if (subEl) subEl.textContent = `LKR ${subtotal.toFixed(2)}`;
    if (grandEl) grandEl.textContent = `LKR ${grandTotal.toFixed(2)}`;
    if (tenderedEl) tenderedEl.textContent = `LKR ${cashTendered.toFixed(2)}`;

    if (discountRow && discountAmtEl && discountLabel) {
      if (discountPercent > 0) {
        discountRow.style.display = 'flex';
        discountLabel.textContent = `Discount (${discountPercent}%):`;
        discountAmtEl.textContent = `-LKR ${discountAmt.toFixed(2)}`;
      } else {
        discountRow.style.display = 'none';
      }
    }

    if (changeEl && changeRow) {
      if (hasDeficit) {
        changeRow.className = 'pos-change-row deficit';
        changeEl.textContent = `Deficit -LKR ${(grandTotal - cashTendered).toFixed(2)}`;
      } else {
        changeRow.className = 'pos-change-row positive';
        changeEl.textContent = `LKR ${changeDue.toFixed(2)}`;
      }
    }

    // Render thermal print template
    renderPrintReceipt(subtotal, discountAmt, grandTotal, changeDue);
  }

  function renderPrintReceipt(subtotal, discountAmt, grandTotal, changeDue) {
    const printStage = document.getElementById('print-stage');
    if (!printStage) return;

    const license = window.LicenseManager?.getLicenseDetails();
    const shopName = license?.shopName || 'POTHA HALA & COMMUNICATION STUDIO';
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    const receiptNo = `REC-${receiptSequence}`;

    const is58mm = (receiptWidth === '58mm');
    const paperWidth = is58mm ? '54mm' : '76mm';
    const fontSize = is58mm ? '8pt' : '9.5pt';

    let lines = '';
    billItems.forEach(item => {
      lines += `
        <div style="display:flex;justify-content:space-between;margin:1mm 0;">
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:${is58mm ? '32mm' : '48mm'};">${item.name} x${item.qty}</span>
          <span style="font-weight:bold;">${(item.price * item.qty).toFixed(2)}</span>
        </div>
      `;
    });

    const payLabel = paymentMethod === 'cash' ? 'CASH (මුදල්)' : (paymentMethod === 'lankaqr' ? 'LankaQR' : 'CARD (කාඩ්පත්)');

    const receiptHtml = `
      <div class="bill-print-card" style="width:${paperWidth};margin:6mm auto;font-family:'Courier New',Courier,monospace;font-size:${fontSize};line-height:1.25;padding:3mm;border:0.2mm solid #000;background:#FFF;color:#000;">
        <div style="text-align:center;font-weight:900;font-size:${is58mm ? '10pt' : '12pt'};margin-bottom:1.5mm;line-height:1.2;">${shopName}</div>
        <div style="text-align:center;font-size:7.5pt;margin-bottom:1mm;">Print, Photocopy, Lamination & Stationery</div>
        <div style="text-align:center;font-size:7pt;margin-bottom:2mm;">No 45, High Level Rd, Colombo | 077 123 4567</div>
        <div style="border-top:0.3mm dashed #000;margin:2mm 0;"></div>
        <div style="display:flex;justify-content:space-between;font-size:7.5pt;">
          <span>${receiptNo}</span>
          <span>${dateStr} ${timeStr}</span>
        </div>
        <div style="font-size:7.5pt;margin-bottom:1.5mm;">Payment: <strong>${payLabel}</strong></div>
        <div style="border-top:0.3mm dashed #000;margin:1.5mm 0;"></div>
        ${lines}
        <div style="border-top:0.3mm dashed #000;margin:2mm 0;"></div>
        <div style="display:flex;justify-content:space-between;font-weight:bold;">
          <span>SUBTOTAL:</span>
          <span>LKR ${subtotal.toFixed(2)}</span>
        </div>
        ${discountAmt > 0 ? `
          <div style="display:flex;justify-content:space-between;color:#000;">
            <span>DISCOUNT (${discountPercent}%):</span>
            <span>-LKR ${discountAmt.toFixed(2)}</span>
          </div>
        ` : ''}
        <div style="display:flex;justify-content:space-between;font-weight:900;font-size:${is58mm ? '9.5pt' : '11.5pt'};margin:1.5mm 0;">
          <span>GRAND TOTAL:</span>
          <span>LKR ${grandTotal.toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span>TENDERED:</span>
          <span>LKR ${cashTendered.toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-weight:bold;">
          <span>CHANGE:</span>
          <span>LKR ${changeDue.toFixed(2)}</span>
        </div>
        <div style="border-top:0.3mm dashed #000;margin:2.5mm 0;"></div>
        <div style="text-align:center;font-size:8pt;font-weight:bold;margin-top:2mm;line-height:1.4;">
          *** ස්තූතියි! නැවත එන්න! ***<br>
          *** Thank You! Please Visit Again ***
        </div>
        <div style="text-align:center;font-size:6.5pt;margin-top:2mm;color:#555;">PothHalaPro Print Studio POS</div>
      </div>
    `;

    if (document.getElementById('view-pos')?.classList.contains('active')) {
      printStage.innerHTML = receiptHtml;
    }
  }

  async function printReceipt() {
    if (!billItems || billItems.length === 0) {
      if (window.App && window.App.showToast) {
        window.App.showToast('Please add items to bill before printing receipt.', 'warning');
      }
      return;
    }

    const subtotal = billItems.reduce((acc, cur) => acc + (cur.price * cur.qty), 0);
    const discountAmt = subtotal * (discountPercent / 100);
    const grandTotal = Math.max(0, subtotal - discountAmt);
    const changeDue = Math.max(0, cashTendered - grandTotal);
    const license = window.LicenseManager?.getLicenseDetails();

    const receiptRecord = {
      receiptNo: `REC-${receiptSequence++}`,
      timestamp: Date.now(),
      isoTimestamp: new Date().toISOString(),
      items: JSON.parse(JSON.stringify(billItems)),
      subtotal: subtotal,
      discountPercent: discountPercent,
      discountAmt: discountAmt,
      grandTotal: grandTotal,
      cashTendered: cashTendered,
      changeDue: changeDue,
      paymentMethod: paymentMethod || 'Cash',
      shopName: license?.shopName || 'POTHA HALA & COMMUNICATION STUDIO'
    };

    // Save to IndexedDB if available
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

    // Backup to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('pothhalapro_receipts') || '[]');
      existing.unshift(receiptRecord);
      if (existing.length > 100) existing.pop();
      localStorage.setItem('pothhalapro_receipts', JSON.stringify(existing));
    } catch (e) {
      console.warn('[CounterTools] localStorage backup failed:', e);
    }

    // Sync with backend if online
    if (navigator.onLine) {
      fetch('/api/billing/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiptRecord)
      }).catch(() => {/* Offline mode fallback */});
    }

    setTimeout(() => {
      window.print();
    }, 150);
  }
  }

  return {
    initPassportStudio,
    renderPassportPreview,
    initBillingPOS,
    updateQty,
    removeItem,
    clearBill,
    addItemByShortcut,
    printReceipt
  };
})();

window.CounterTools = CounterTools;
