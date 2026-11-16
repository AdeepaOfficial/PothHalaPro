/**
 * PothHalaPro - Test Suite 3: Sri Lankan Curriculum Mapping & Unicode Integrity
 * Verifies Grades 1-13 subject mapping accuracy in Sinhala & English,
 * tier classification, 8-up sheet alignment, and Sinhala Unicode typography health.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { describe, it, assert } = require('../test_runner');

describe('Bilingual Curriculum Mapping & Sinhala Typography Integrity', () => {
  // Reference Syllabus Specification
  const SYLLABUS_SPEC = {
    primary: {
      tierName: 'Primary & Scholarship (Grades 1 - 5)',
      grades: [1, 2, 3, 4, 5],
      si: ['මව්බස (සිංහල)', 'ගණිතය', 'පරිසරය', 'ඉංග්‍රීසි භාෂාව', 'බුද්ධ ධර්මය', 'දෙමළ (දෙවන බස)', 'ශිෂ්‍යත්ව පෙරහුරු', 'රචනා හා අත්අකුරු'],
      en: ['Mother Tongue', 'Mathematics', 'Environment', 'English Language', 'Buddhism', 'Tamil (2nd Lang)', 'Scholarship Papers', 'Creative Writing']
    },
    junior: {
      tierName: 'Junior Secondary (Grades 6 - 9)',
      grades: [6, 7, 8, 9],
      si: ['සිංහල භාෂාව', 'ගණිතය', 'විද්‍යාව', 'ඉතිහාසය', 'ඉංග්‍රීසි භාෂාව', 'බුද්ධ ධර්මය', 'භූගෝල විද්‍යාව', 'පුරවැසි අධ්‍යාපනය'],
      en: ['Sinhala Language', 'Mathematics', 'Science', 'History', 'English Language', 'Buddhism', 'Geography', 'Civic Education']
    },
    ol: {
      tierName: 'G.C.E. Ordinary Level (Grades 10 - 11)',
      grades: [10, 11],
      si: ['සිංහල භාෂාව', 'ගණිතය', 'විද්‍යාව', 'ඉංග්‍රීසි භාෂාව', 'බුද්ධ ධර්මය', 'ඉතිහාසය', 'ව්‍යාපාර හා ගිණුම්කරණය', 'තොරතුරු තාක්ෂණය (ICT)'],
      en: ['Sinhala Language', 'Mathematics', 'Science', 'English Language', 'Buddhism', 'History', 'Business & Accounting', 'ICT']
    },
    al: {
      tierName: 'G.C.E. Advanced Level (Grades 12 - 13)',
      grades: [12, 13],
      si: ['සංයුක්ත ගණිතය / ජීව විද්‍යාව', 'භෞතික විද්‍යාව', 'රසායන විද්‍යාව', 'ආර්ථික විද්‍යාව', 'ව්‍යාපාර අධ්‍යයනය', 'ගිණුම්කරණය', 'තොරතුරු තාක්ෂණය (ICT)', 'සාමාන්‍ය ඉංග්‍රීසි'],
      en: ['Combined Maths / Bio', 'Physics', 'Chemistry', 'Economics', 'Business Studies', 'Accounting', 'ICT', 'General English']
    }
  };

  // Grade Resolver Function
  function resolveGradeTier(gradeInput) {
    if (gradeInput === null || gradeInput === undefined) return null;

    let gradeNum = gradeInput;
    if (typeof gradeInput === 'string') {
      const match = gradeInput.match(/\d+/);
      if (!match) return null;
      gradeNum = parseInt(match[0], 10);
    }

    if (typeof gradeNum !== 'number' || isNaN(gradeNum)) return null;

    if (gradeNum >= 1 && gradeNum <= 5) return 'primary';
    if (gradeNum >= 6 && gradeNum <= 9) return 'junior';
    if (gradeNum >= 10 && gradeNum <= 11) return 'ol';
    if (gradeNum >= 12 && gradeNum <= 13) return 'al';

    return null; // Out of bounds
  }

  // Load public/js/sticker-studio.js into VM Sandbox
  function loadStickerStudioInVM() {
    const filePath = path.join(__dirname, '../../public/js/sticker-studio.js');
    const code = fs.readFileSync(filePath, 'utf8');

    const sandbox = {
      window: {},
      document: {
        createElement: () => ({
          getContext: () => ({
            fillRect: () => {},
            fillText: () => {},
            measureText: () => ({ width: 50 })
          }),
          toDataURL: () => ''
        }),
        getElementById: () => null,
        querySelectorAll: () => []
      },
      localStorage: { getItem: () => null, setItem: () => {} }
    };
    sandbox.window = sandbox;

    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);

    return sandbox.StickerStudio;
  }

  it('verifies 100% comprehensive coverage for all school grades from Grade 1 through Grade 13', () => {
    const allGrades = Array.from({ length: 13 }, (_, i) => i + 1);

    for (const g of allGrades) {
      const tierKey = resolveGradeTier(g);
      assert.ok(tierKey !== null, `Grade ${g} must resolve to a valid curriculum tier`);
      assert.ok(SYLLABUS_SPEC[tierKey], `Resolved tier ${tierKey} for Grade ${g} must exist in syllabus specification`);
      assert.includes(SYLLABUS_SPEC[tierKey].grades, g, `Grade ${g} must be explicitly mapped in tier ${tierKey}`);
    }
  });

  it('guarantees 1:1 subject count parity between Sinhala and English curricula across all tiers', () => {
    for (const [tierKey, tierData] of Object.entries(SYLLABUS_SPEC)) {
      assert.strictEqual(
        tierData.si.length,
        tierData.en.length,
        `Mismatch in subject count for tier ${tierKey}: Sinhala (${tierData.si.length}) vs English (${tierData.en.length})`
      );

      // Exactly 8 subjects per tier to perfectly match the 8-up sticker sheet (2 x 4)
      assert.strictEqual(
        tierData.si.length,
        8,
        `Tier ${tierKey} must provide exactly 8 subjects for the 8-up sticker sheet standard`
      );
    }
  });

  it('validates Sinhala Unicode character encoding and vowel modifier integrity', () => {
    // Range for Sinhala script in Unicode: U+0D80 to U+0DFF
    const sinhalaCharRegex = /[\u0D80-\u0DFF]/;

    for (const [tierKey, tierData] of Object.entries(SYLLABUS_SPEC)) {
      for (let i = 0; i < tierData.si.length; i++) {
        const sinhalaText = tierData.si[i];

        // 1. Must contain valid Sinhala script characters
        assert.ok(
          sinhalaCharRegex.test(sinhalaText),
          `Subject [${tierKey}][${i}] "${sinhalaText}" must contain Sinhala Unicode characters`
        );

        // 2. Must not contain Unicode replacement character (mojibake detection)
        assert.ok(
          !sinhalaText.includes('\uFFFD'),
          `Subject "${sinhalaText}" contains corrupt replacement character (mojibake \uFFFD)`
        );

        // 3. Must not contain broken escape sequences or raw question marks
        assert.ok(
          !sinhalaText.includes('???'),
          `Subject "${sinhalaText}" contains unresolved question marks`
        );
      }
    }
  });

  it('verifies critical Sinhala conjuncts and vowel modifiers in subject strings', () => {
    // Al-lakuna (්) - U+0DCA
    // Kombuwa (ෙ) - U+0DD9
    // Ispilla (ි, ී) - U+0DD2, U+0DD3
    // Papilla (ු, ූ) - U+0DD4, U+0DD6
    // Yansaya (්‍ය) - U+0DCA U+200D U+0DCF
    // Rakaransaya (්‍ර) - U+0DCA U+200D U+0DBB

    const allSinhalaSubjects = Object.values(SYLLABUS_SPEC).flatMap(t => t.si).join(' ');

    // Test for Kombuwa presence (e.g., දෙමළ, පෙරහුරු, බුද්ධ ධර්මය)
    assert.ok(allSinhalaSubjects.includes('\u0DD9'), 'Curriculum must contain Kombuwa (ෙ)');

    // Test for Al-lakuna presence (e.g., සිංහල, ගණිතය, පරිසරය, ධර්මය)
    assert.ok(allSinhalaSubjects.includes('\u0DCA'), 'Curriculum must contain Al-lakuna (්)');

    // Test for Ispilla presence (e.g., විද්‍යාව, ඉතිහාසය, භූගෝල)
    assert.ok(allSinhalaSubjects.includes('\u0DD2') || allSinhalaSubjects.includes('\u0DD3'), 'Curriculum must contain Ispilla (ි/ී)');

    // Test for Papilla presence (e.g., බුද්ධ, පුරවැසි, රචනා හා අත්අකුරු)
    assert.ok(allSinhalaSubjects.includes('\u0DD4') || allSinhalaSubjects.includes('\u0DD6'), 'Curriculum must contain Papilla (ු/ූ)');

    // Test for Yansaya conjunct presence in 'විද්‍යාව' (Science)
    assert.ok(allSinhalaSubjects.includes('විද්‍යාව'), "Curriculum must contain properly joined 'විද්‍යාව' with Yansaya conjunct");

    // Test for Rakaransaya conjunct presence in 'ඉංග්‍රීසි' (English)
    assert.ok(allSinhalaSubjects.includes('ඉංග්‍රීසි'), "Curriculum must contain properly joined 'ඉංග්‍රීසි' with Rakaransaya conjunct");
  });

  it('accurately parses mixed string representations and grade variations', () => {
    assert.strictEqual(resolveGradeTier('Grade 1'), 'primary');
    assert.strictEqual(resolveGradeTier('Grade 5 Scholarship'), 'primary');
    assert.strictEqual(resolveGradeTier('5 ශ්‍රේණිය'), 'primary');
    assert.strictEqual(resolveGradeTier('Grade 6'), 'junior');
    assert.strictEqual(resolveGradeTier('9 වන ශ්‍රේණිය'), 'junior');
    assert.strictEqual(resolveGradeTier('Grade 10 O/L'), 'ol');
    assert.strictEqual(resolveGradeTier('11 ශ්‍රේණිය'), 'ol');
    assert.strictEqual(resolveGradeTier('Grade 12 A/L'), 'al');
    assert.strictEqual(resolveGradeTier('Grade 13 Maths/Bio'), 'al');
  });

  it('gracefully handles out-of-bounds, invalid, and null grade inputs', () => {
    assert.strictEqual(resolveGradeTier(0), null, 'Grade 0 must return null');
    assert.strictEqual(resolveGradeTier(14), null, 'Grade 14 must return null');
    assert.strictEqual(resolveGradeTier(-5), null, 'Negative grade must return null');
    assert.strictEqual(resolveGradeTier(null), null, 'Null must return null');
    assert.strictEqual(resolveGradeTier(undefined), null, 'Undefined must return null');
    assert.strictEqual(resolveGradeTier('Kindergarten'), null, 'Non-matching string must return null');
  });

  it('validates live public/js/sticker-studio.js SYLLABUS against specification', () => {
    const StickerStudio = loadStickerStudioInVM();
    assert.ok(StickerStudio, 'StickerStudio must be instantiated from public/js/sticker-studio.js');

    // Read the source file to inspect SYLLABUS structure
    const filePath = path.join(__dirname, '../../public/js/sticker-studio.js');
    const source = fs.readFileSync(filePath, 'utf8');

    for (const [tierKey, specData] of Object.entries(SYLLABUS_SPEC)) {
      // Check that the source file contains the expected subjects
      for (const subject of specData.si) {
        assert.ok(
          source.includes(subject),
          `Live sticker-studio.js must include Sinhala subject "${subject}" in tier ${tierKey}`
        );
      }
      for (const subject of specData.en) {
        assert.ok(
          source.includes(subject),
          `Live sticker-studio.js must include English subject "${subject}" in tier ${tierKey}`
        );
      }
    }
  });
});
