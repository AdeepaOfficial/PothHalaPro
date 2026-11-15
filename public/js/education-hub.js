/**
 * PothHalaPro - Education Hub & Government Forms Suite
 * Catalogs downloadable & printable Sri Lankan government forms, Sinhala legal templates,
 * term test papers, Grade 5 scholarship papers, and Sinhala Hodiya worksheets.
 */

const EducationHub = (() => {
  // Government Forms & Sinhala Templates
  const GOV_DOCS = [
    {
      id: 'mta-32',
      title: 'MTA 32 - Driving License Renewal Application',
      titleSi: 'රියදුරු බලපත්‍ර අලුත් කිරීමේ අයදුම්පත (MTA 32)',
      category: 'gov',
      desc: 'Official Department of Motor Traffic application for driving licence renewal and duplicate issues.',
      pages: 2,
      contentHtml: `
        <div style="font-family:'Segoe UI',sans-serif;padding:8mm;line-height:1.4;">
          <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:3mm;margin-bottom:5mm;">
            <div style="font-size:11pt;font-weight:bold;">DEPARTMENT OF MOTOR TRAFFIC - SRI LANKA</div>
            <div style="font-size:10pt;">මෝටර් රථ ප්‍රවාහන දෙපාර්තමේන්තුව - ශ්‍රී ලංකා</div>
            <div style="font-size:13pt;font-weight:900;margin-top:2mm;">APPLICATION FOR DRIVING LICENCE (MTA 32)</div>
          </div>
          <div style="font-size:10pt;display:grid;grid-template-columns:1fr 1fr;gap:4mm;">
            <div style="border:1px solid #94A3B8;padding:3mm;">1. Full Name: ................................................................</div>
            <div style="border:1px solid #94A3B8;padding:3mm;">2. NIC No: ................................................................</div>
            <div style="border:1px solid #94A3B8;padding:3mm;">3. Existing Licence No: .................................................</div>
            <div style="border:1px solid #94A3B8;padding:3mm;">4. Date of Birth: ........................................................</div>
          </div>
          <div style="margin-top:5mm;border:1px solid #94A3B8;padding:3mm;font-size:10pt;">
            5. Permanent Address: .........................................................................................................................
          </div>
          <div style="margin-top:5mm;font-size:9pt;color:#475569;">
            * Attach Medical Certificate (National Transport Medical Institute - NTMI) and certified copy of National Identity Card.
          </div>
        </div>
      `
    },
    {
      id: 'passport-k',
      title: 'Sri Lanka Passport Application Form K',
      titleSi: 'විදේශ ගමන් බලපත්‍ර අයදුම්පත (ආකෘති පත්‍ර K)',
      category: 'gov',
      desc: 'Department of Immigration and Emigration Sri Lanka passport application.',
      pages: 3,
      contentHtml: `
        <div style="font-family:'Segoe UI',sans-serif;padding:8mm;line-height:1.4;">
          <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:3mm;margin-bottom:5mm;">
            <div style="font-size:11pt;font-weight:bold;">DEPARTMENT OF IMMIGRATION & EMIGRATION</div>
            <div style="font-size:10pt;">ආගමන හා විගමන දෙපාර්තමේන්තුව</div>
            <div style="font-size:13pt;font-weight:900;margin-top:2mm;">APPLICATION FOR A SRI LANKAN TRAVEL DOCUMENT (FORM K)</div>
          </div>
          <div style="display:grid;grid-template-columns:2fr 1fr;gap:6mm;">
            <div>
              <div style="margin-bottom:3mm;">1. Type of Travel Document: [ ] All Countries  [ ] Middle East</div>
              <div style="margin-bottom:3mm;">2. Present Travel Document No (if any): ....................................</div>
              <div style="margin-bottom:3mm;">3. National Identity Card No: ................................................</div>
              <div style="margin-bottom:3mm;">4. Surname: ..........................................................................</div>
            </div>
            <div style="border:1px dashed #64748B;height:45mm;display:flex;align-items:center;justify-content:center;text-align:center;font-size:8pt;color:#64748B;">
              Affix Studio Photograph (3.5 x 4.5 cm)
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'sinhala-rent',
      title: 'Sinhala House Rental Agreement (කුලී ගිවිසුම)',
      titleSi: 'නිවාස / වෙළෙඳසැල් කුලී බදු ගිවිසුම',
      category: 'sinhala-doc',
      desc: 'Standard legal format for residential or commercial shop tenancy agreement in Sinhala.',
      pages: 2,
      contentHtml: `
        <div style="font-family:'Noto Sans Sinhala','Segoe UI',sans-serif;padding:8mm;line-height:1.6;font-size:10pt;">
          <div style="text-align:center;font-weight:900;font-size:14pt;border-bottom:2px solid #000;padding-bottom:3mm;margin-bottom:5mm;">
            නිවාස / වෙළෙඳසැල් කුලී බදු ගිවිසුම
          </div>
          <p>
            වර්ෂ දෙදහස් විසි ................ ක් වූ ................. මස ........... වන දින කොළඹ දී එළඹි මෙම කුලී ගිවිසුමෙන්,
          </p>
          <p style="margin-top:3mm;">
            <strong>පළමු පාර්ශ්වය (හිමිකරු):</strong> .....................................................................................................................................
          </p>
          <p style="margin-top:3mm;">
            <strong>දෙවන පාර්ශ්වය (කුලීකරු):</strong> .....................................................................................................................................
          </p>
          <div style="margin-top:5mm;border:1px solid #CBD5E1;padding:4mm;background:#F8FAFC;">
            <strong>කොන්දේසි:</strong><br>
            1. මාසික කුලිය රුපියල් ........................... ක් වන අතර ყოვෑම මසකම 10 වන දිනට පෙර ගෙවිය යුතුය.<br>
            2. අත්තිකාරම් මුදල ලෙස මාස ........... ක කුලිය වන රුපියල් ........................... ක් තැන්පත් කර ඇත.<br>
            3. ජල හා විදුලි බිල්පත් දෙවන පාර්ශ්වය විසින් නිසි කලට ගෙවා අවසන් කළ යුතුය.
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:15mm;">
            <div>................................................<br>පළමු පාර්ශ්වය (හිමිකරු)</div>
            <div>................................................<br>දෙවන පාර්ශ්වය (කුලීකරු)</div>
          </div>
        </div>
      `
    },
    {
      id: 'sinhala-affidavit',
      title: 'General Affidavit (දිවුරුම් ප්‍රකාශය)',
      titleSi: 'සාමාන්‍ය දිවුරුම් ප්‍රකාශ ආකෘතිය',
      category: 'sinhala-doc',
      desc: 'Legal affidavit template for name discrepancy, lost document declaration, and income verification.',
      pages: 1,
      contentHtml: `
        <div style="font-family:'Noto Sans Sinhala','Segoe UI',sans-serif;padding:8mm;line-height:1.6;font-size:10.5pt;">
          <div style="text-align:center;font-weight:900;font-size:14pt;margin-bottom:5mm;">
            දිවුරුම් ප්‍රකාශය
          </div>
          <p>
            ජාතික හැඳුනුම්පත් අංක ........................................ දරන .............................................................................................. ලිපිනයේ පදිංචි මම බෞද්ධ/ක්‍රිස්තියානි/ඉස්ලාම්/හින්දු ආගමිකයෙකු ලෙස සත්‍යය හා ගෞරව බහුමානයෙන් යුතුව මෙසේ ප්‍රකාශ කර සිටිමි:
          </p>
          <div style="margin:6mm 0;padding:4mm;border:1px dashed #94A3B8;">
            1. .........................................................................................................................................................................<br><br>
            2. .........................................................................................................................................................................<br><br>
            3. .........................................................................................................................................................................
          </div>
          <p>ඉහත සඳහන් සියලු කරුණු මාගේ දැනීමේ හා විශ්වාසයේ හැටියට සත්‍ය හා නිවැරදි බවට මෙයින් දිවුරා/සහතික කර ප්‍රකාශ කරමි.</p>
          <div style="display:flex;justify-content:space-between;margin-top:20mm;">
            <div>දිනය: ...........................</div>
            <div>................................................<br>ප්‍රකාශකගේ අත්සන</div>
          </div>
        </div>
      `
    }
  ];

  // Education Worksheets & Exam Papers Archive
  const EDU_ASSETS = [
    {
      id: 'hodiya-akuru',
      title: 'Sinhala Hodiya Letter Tracing Worksheet',
      titleSi: 'සිංහල හෝඩිය අකුරු ලිවීම හා හුරුව (Grades 1-2)',
      category: 'worksheet',
      desc: 'Dotted stroke lines for primary students to practice Sinhala letters (අ, ආ, ඇ, ඈ, ඉ, ඊ, උ, ඌ).',
      contentHtml: `
        <div style="font-family:'Noto Sans Sinhala',sans-serif;padding:8mm;text-align:center;">
          <h2 style="font-size:16pt;margin-bottom:2mm;">සිංහල අකුරු හුරුව - 1 ශ්‍රේණිය</h2>
          <div style="font-size:10pt;color:#64748B;margin-bottom:6mm;">නම: ................................................................... පන්තිය: .......................</div>
          <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:6mm;">
            ${['අ', 'ආ', 'ඇ', 'ඈ', 'ඉ', 'ඊ', 'උ', 'ඌ'].map(letter => `
              <div style="border:2px dashed #3B82F6;border-radius:8px;padding:6mm;background:#EFF6FF;">
                <div style="font-size:36pt;font-weight:900;color:#1D4ED8;">${letter}</div>
                <div style="border-top:1px dashed #93C5FD;margin-top:4mm;padding-top:2mm;font-size:18pt;color:#94A3B8;">${letter}  ${letter}  ${letter}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `
    },
    {
      id: 'grade5-maths',
      title: 'Grade 5 Scholarship Model Mathematics Paper',
      titleSi: '5 ශ්‍රේණිය ශිෂ්‍යත්ව පෙරහුරු ගණිත ප්‍රශ්න පත්‍රය',
      category: 'exam',
      desc: 'Standard pattern 1-hour model test paper with 10 scholarship reasoning and numerical questions.',
      contentHtml: `
        <div style="font-family:'Noto Sans Sinhala',sans-serif;padding:8mm;line-height:1.5;">
          <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:3mm;margin-bottom:5mm;">
            <div style="font-size:13pt;font-weight:bold;">5 ශ්‍රේණිය ශිෂ්‍යත්ව විභාගය - පෙරහුරු ප්‍රශ්න පත්‍රය</div>
            <div style="font-size:10pt;">කාලය: පැය 01 යි | මුළු ලකුණු: 100</div>
          </div>
          <div style="font-size:10.5pt;">
            <p>1. 450, 475, 500, ..... හි හිස්තැනට ගැළපෙන ඊළඟ සංඛ්‍යාව කුමක්ද? (1) 515  (2) 525  (3) 530</p>
            <p style="margin-top:3mm;">2. එක් පොතක මිල රු. 65 කි. එවැනි පොත් 8 ක මිල කොපමණද? ..................................</p>
            <p style="margin-top:3mm;">3. පැය 2 කට මිනිත්තු කීයක් තිබේද? ..................................</p>
            <p style="margin-top:3mm;">4. සෘජුකෝණාස්‍රයක දිග 12cm වන අතර පළල 8cm කි. එහි පරිමිතිය සොයන්න: ..................................</p>
          </div>
        </div>
      `
    },
    {
      id: 'science-diagram',
      title: 'Syllabus Diagram: Human Heart & Blood Circulation',
      titleSi: 'විද්‍යාව විෂය නිර්දේශ සටහන: මිනිස් හදවත සහ රුධිර සංසරණය',
      category: 'diagram',
      desc: 'High-contrast printable line diagram for school science cutouts and lab records.',
      contentHtml: `
        <div style="font-family:'Segoe UI',sans-serif;padding:8mm;text-align:center;">
          <h2 style="font-size:15pt;margin-bottom:2mm;">HUMAN HEART & CIRCULATORY SYSTEM - CUTOUT</h2>
          <div style="font-size:10pt;color:#64748B;margin-bottom:6mm;">G.C.E. O/L Science Syllabus Diagram</div>
          <div style="border:2px solid #0F172A;border-radius:12px;padding:12mm;background:#F8FAFC;display:inline-block;">
            <svg width="220" height="220" viewBox="0 0 100 100">
              <path d="M 50,30 A 20,20 0 0,0 10,50 C 10,75 50,95 50,95 C 50,95 90,75 90,50 A 20,20 0 0,0 50,30 Z" fill="#FEE2E2" stroke="#DC2626" stroke-width="3"/>
              <line x1="50" y1="35" x2="50" y2="90" stroke="#DC2626" stroke-width="2" stroke-dasharray="3 2"/>
              <text x="30" y="55" font-size="6" fill="#991B1B">Right Atrium</text>
              <text x="70" y="55" font-size="6" fill="#991B1B">Left Atrium</text>
            </svg>
          </div>
          <div style="margin-top:6mm;font-size:9pt;color:#64748B;">Print on 1:1 scale for school practical book pasting.</div>
        </div>
      `
    }
  ];

  function init() {
    renderDocsList();
    renderEduList();
  }

  function renderDocsList() {
    const container = document.getElementById('gov-docs-grid');
    if (!container) return;

    let html = '';
    GOV_DOCS.forEach(doc => {
      html += `
        <div class="controls-card" style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <div style="font-weight:700;font-size:14px;color:#0F172A;">${doc.title}</div>
              <div style="font-size:12px;color:#2563EB;margin-top:2px;">${doc.titleSi}</div>
              <div style="font-size:12px;color:#64748B;margin-top:4px;">${doc.desc}</div>
            </div>
            <button onclick="EducationHub.previewDoc('${doc.id}')" class="btn-slot-tool" style="background:#2563EB;color:#FFF;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">
              Preview & Print
            </button>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  function renderEduList() {
    const container = document.getElementById('edu-assets-grid');
    if (!container) return;

    let html = '';
    EDU_ASSETS.forEach(asset => {
      html += `
        <div class="controls-card" style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <div style="font-weight:700;font-size:14px;color:#0F172A;">${asset.title}</div>
              <div style="font-size:12px;color:#10B981;margin-top:2px;">${asset.titleSi}</div>
              <div style="font-size:12px;color:#64748B;margin-top:4px;">${asset.desc}</div>
            </div>
            <button onclick="EducationHub.previewEdu('${asset.id}')" class="btn-slot-tool" style="background:#10B981;color:#FFF;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">
              Preview & Print
            </button>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  function previewDoc(id) {
    const doc = GOV_DOCS.find(d => d.id === id);
    if (!doc) return;

    const liveSheet = document.getElementById('a4-live-sheet');
    const printStage = document.getElementById('print-stage');

    if (liveSheet) liveSheet.innerHTML = doc.contentHtml;
    if (printStage) printStage.innerHTML = doc.contentHtml;

    if (window.App && window.App.showToast) {
      window.App.showToast(`Loaded: ${doc.title}. Ready for 1:1 A4 printing.`, 'info');
    }
  }

  function previewEdu(id) {
    const asset = EDU_ASSETS.find(a => a.id === id);
    if (!asset) return;

    const liveSheet = document.getElementById('a4-live-sheet');
    const printStage = document.getElementById('print-stage');

    if (liveSheet) liveSheet.innerHTML = asset.contentHtml;
    if (printStage) printStage.innerHTML = asset.contentHtml;

    if (window.App && window.App.showToast) {
      window.App.showToast(`Loaded: ${asset.title}. Ready for 1:1 A4 printing.`, 'info');
    }
  }

  return {
    init,
    previewDoc,
    previewEdu
  };
})();

window.EducationHub = EducationHub;
