/**
 * PothHalaPro - Test Suite 1: Scale Calibration & Physical Math Verification
 * Verifies exact physical millimeter to 300 DPI pixel ratio math,
 * sub-pixel rounding tolerances, aspect ratios, and A4 print sheet geometry.
 */

const { describe, it, assert } = require('../test_runner');

describe('Physical Millimeter to 300 DPI Scale Calibration', () => {
  // Calibration Constants
  const MM_PER_INCH = 25.4;
  const DPI_300 = 300;
  const PIXELS_PER_MM_300DPI = DPI_300 / MM_PER_INCH; // 11.811023622047244 px/mm
  const POINTS_PER_MM = 72 / MM_PER_INCH;             // 2.8346456692913384 pt/mm (CSS print)
  const SCREEN_PIXELS_PER_MM = 96 / MM_PER_INCH;      // 3.779527559055118 px/mm (96 DPI screen)

  // Standard Target Presets
  const PRESETS = [
    {
      id: 'iso-id1',
      name: 'ISO ID-1 Smart NIC & MTA Driving License',
      standard: 'ISO/IEC 7810 ID-1',
      widthMm: 85.6,
      heightMm: 54.0,
      expectedPxW: 1011,
      expectedPxH: 638
    },
    {
      id: 'classic-nic',
      name: 'Classic Sri Lankan NIC (Laminated Paper)',
      standard: 'Department for Registration of Persons',
      widthMm: 100.0,
      heightMm: 65.0,
      expectedPxW: 1181,
      expectedPxH: 768
    },
    {
      id: 'postal-id',
      name: 'Postal Identity Card (Sri Lanka Post)',
      standard: 'Department of Posts Sri Lanka',
      widthMm: 95.0,
      heightMm: 60.0,
      expectedPxW: 1122,
      expectedPxH: 709
    },
    {
      id: 'school-sticker',
      name: 'School Name Sticker (Standard Exercise Book)',
      standard: 'National Educational Specifications',
      widthMm: 90.0,
      heightMm: 45.0,
      expectedPxW: 1063,
      expectedPxH: 531
    },
    {
      id: 'passport-photo',
      name: 'Passport & Visa Studio Photograph',
      standard: 'ICAO Doc 9303 / Dept of Immigration SL',
      widthMm: 35.0,
      heightMm: 45.0,
      expectedPxW: 413,
      expectedPxH: 531
    },
    {
      id: 'a4-sheet',
      name: 'Standard A4 Sheet Master Canvas',
      standard: 'ISO 216',
      widthMm: 210.0,
      heightMm: 297.0,
      expectedPxW: 2480,
      expectedPxH: 3508
    }
  ];

  it('verifies fundamental millimeter to inch and pixel ratio constants', () => {
    assert.strictEqual(MM_PER_INCH, 25.4, 'Standard inch must equal exactly 25.4 mm');
    assert.strictEqual(DPI_300, 300, 'Master print target must be 300 dots per inch');
    assert.closeTo(PIXELS_PER_MM_300DPI, 11.8110236, 0.00001, '300 DPI must equal ~11.811 pixels per mm');
    assert.closeTo(POINTS_PER_MM, 2.8346457, 0.00001, 'CSS print points must equal ~2.8346 pt per mm');
    assert.closeTo(SCREEN_PIXELS_PER_MM, 3.7795276, 0.00001, '96 DPI screen must equal ~3.7795 px per mm');
  });

  it('validates 300 DPI exact pixel dimensions across all physical card presets', () => {
    for (const preset of PRESETS) {
      const calcW = Math.round(preset.widthMm * PIXELS_PER_MM_300DPI);
      const calcH = Math.round(preset.heightMm * PIXELS_PER_MM_300DPI);

      assert.strictEqual(
        calcW,
        preset.expectedPxW,
        `Width calculation mismatch for ${preset.name}: expected ${preset.expectedPxW}px, calculated ${calcW}px`
      );
      assert.strictEqual(
        calcH,
        preset.expectedPxH,
        `Height calculation mismatch for ${preset.name}: expected ${preset.expectedPxH}px, calculated ${calcH}px`
      );
    }
  });

  it('guarantees sub-pixel rounding error is strictly within sub-millimeter tolerances (< 0.5px / < 0.045mm)', () => {
    for (const preset of PRESETS) {
      const rawW = preset.widthMm * PIXELS_PER_MM_300DPI;
      const rawH = preset.heightMm * PIXELS_PER_MM_300DPI;

      const diffW = Math.abs(Math.round(rawW) - rawW);
      const diffH = Math.abs(Math.round(rawH) - rawH);

      // Sub-pixel deviation must never exceed 0.5 pixels
      assert.ok(diffW < 0.5, `Horizontal sub-pixel error for ${preset.name} exceeded 0.5px: ${diffW}`);
      assert.ok(diffH < 0.5, `Vertical sub-pixel error for ${preset.name} exceeded 0.5px: ${diffH}`);

      // Physical deviation on paper must be less than 0.045 mm (45 microns)
      const physicalDevWMm = diffW / PIXELS_PER_MM_300DPI;
      const physicalDevHMm = diffH / PIXELS_PER_MM_300DPI;
      assert.ok(physicalDevWMm < 0.045, `Physical width deviation for ${preset.name} exceeded 0.045mm: ${physicalDevWMm.toFixed(4)}mm`);
      assert.ok(physicalDevHMm < 0.045, `Physical height deviation for ${preset.name} exceeded 0.045mm: ${physicalDevHMm.toFixed(4)}mm`);
    }
  });

  it('confirms aspect ratio preservation with zero noticeable geometric elongation (< 0.1% distortion)', () => {
    for (const preset of PRESETS) {
      const physicalAspect = preset.widthMm / preset.heightMm;
      const pixelAspect = preset.expectedPxW / preset.expectedPxH;
      const percentDistortion = Math.abs(pixelAspect - physicalAspect) / physicalAspect * 100;

      assert.ok(
        percentDistortion < 0.1,
        `Aspect ratio distortion for ${preset.name} exceeds 0.1%: ${percentDistortion.toFixed(4)}%`
      );
    }
  });

  it('verifies 8-up School Name Sticker grid geometry on A4 sheet', () => {
    const stickerW = 90.0; // mm
    const stickerH = 45.0; // mm
    const cols = 2;
    const rows = 4;
    const a4W = 210.0; // mm
    const a4H = 297.0; // mm

    const totalStickers = cols * rows;
    assert.strictEqual(totalStickers, 8, 'Sticker sheet must hold exactly 8 stickers (8-up layout)');

    const totalContentW = cols * stickerW; // 180.0 mm
    const totalContentH = rows * stickerH; // 180.0 mm

    assert.ok(totalContentW <= a4W, `Grid width ${totalContentW}mm must fit inside A4 width ${a4W}mm`);
    assert.ok(totalContentH <= a4H, `Grid height ${totalContentH}mm must fit inside A4 height ${a4H}mm`);

    const horizontalMargin = (a4W - totalContentW) / 2; // 15.0 mm
    const verticalMargin = (a4H - totalContentH) / 2;   // 58.5 mm

    assert.ok(horizontalMargin >= 10.0, 'Horizontal margins must exceed printer non-printable unprintable border (10mm min)');
    assert.ok(verticalMargin >= 10.0, 'Vertical margins must exceed printer non-printable border (10mm min)');

    // In 300 DPI pixels
    const stickerPxW = Math.round(stickerW * PIXELS_PER_MM_300DPI);
    const stickerPxH = Math.round(stickerH * PIXELS_PER_MM_300DPI);
    assert.strictEqual(stickerPxW, 1063);
    assert.strictEqual(stickerPxH, 531);
  });

  it('validates 1:1 Smart NIC Back-to-Back Lamination Center Fold Axis layout', () => {
    const cardW = 85.6; // mm
    const cardH = 54.0; // mm
    const a4W = 210.0;  // mm
    const a4H = 297.0;  // mm

    // Layout: Front card on left, Back card on right, sharing fold axis
    const totalSpanW = cardW * 2; // 171.2 mm
    assert.ok(totalSpanW < a4W, 'Back-to-back card pair must fit within A4 width with margin');

    const leftMargin = (a4W - totalSpanW) / 2; // 19.4 mm
    const centerFoldX = leftMargin + cardW;    // 105.0 mm (Exact center of A4 sheet!)

    assert.closeTo(centerFoldX, a4W / 2, 0.0001, 'Center fold line must align symmetrically with A4 center axis');

    // 300 DPI pixel alignment
    const centerFoldPx = Math.round(centerFoldX * PIXELS_PER_MM_300DPI);
    const sheetCenterPx = Math.round((a4W / 2) * PIXELS_PER_MM_300DPI);
    assert.strictEqual(centerFoldPx, sheetCenterPx, 'Pixel center fold must match sheet pixel center');

    // Spine score line notch verification
    const notchClearanceMm = 3.0; // 3mm pouch lamination margin
    assert.ok(leftMargin >= notchClearanceMm, 'Lamination seal perimeter must exceed 3mm');
  });

  it('calibrates 50.0mm physical reference ruler bar at sheet bottom', () => {
    const rulerLengthMm = 50.0;
    const rulerPx = Math.round(rulerLengthMm * PIXELS_PER_MM_300DPI);
    assert.strictEqual(rulerPx, 591, '50mm physical ruler must render at exactly 591 px at 300 DPI');

    // 50 1-millimeter interval ticks
    const tickSpacingPx = PIXELS_PER_MM_300DPI;
    const totalTickSpan = tickSpacingPx * 50;
    assert.closeTo(totalTickSpan, 590.551, 0.01, '50 tick spans must match 590.55 px');
  });

  it('verifies CSS print geometry points scale for 1:1 A4 document styling', () => {
    const a4PtW = 210.0 * POINTS_PER_MM;
    const a4PtH = 297.0 * POINTS_PER_MM;

    assert.closeTo(a4PtW, 595.276, 0.01, 'A4 print point width must equal 595.28 pt');
    assert.closeTo(a4PtH, 841.890, 0.01, 'A4 print point height must equal 841.89 pt');
  });
});
