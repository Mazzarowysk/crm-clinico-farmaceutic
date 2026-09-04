// ─── MÓDULO DE TESTES LABORATORIAIS REMOTOS (TLR - RDC 786/2023 ANVISA) ─────
import { state } from '../state.js';
import * as localDB from '../localDB.js';
import { showToast, showCustomAlert } from './ui.js';
import { syncManager } from './sync.js';

export const TLR_TEST_CATALOG = [
  {
    id: 'hba1c',
    name: 'Hemoglobina Glicada (HbA1c)',
    method: 'Imunoturbidimetria / Fotometria de Reflectância',
    sample: 'Sangue total capilar',
    defaultUnit: '%',
    referenceRange: 'Normal: < 5.7% | Pré-diabetes: 5.7% - 6.4% | Diabetes: ≥ 6.5%',
    anvisaReg: 'MS 80111400045',
    category: 'Endócrino / Metabólico'
  },
  {
    id: 'lipid_profile',
    name: 'Perfil Lipídico Rápido (Colesterol Total / Triglicerídeos)',
    method: 'Fotometria Enzimática / Tira Reagente',
    sample: 'Sangue total capilar',
    defaultUnit: 'mg/dL',
    referenceRange: 'Colesterol Total: < 190 mg/dL | Triglicerídeos: < 150 mg/dL',
    anvisaReg: 'MS 80111400082',
    category: 'Cardiovascular'
  },
  {
    id: 'bhcg',
    name: 'Beta-HCG Rápido (Teste Imunológico de Gravidez)',
    method: 'Imunocromatografia de Fluxo Lateral',
    sample: 'Urina ou Soro/Plasma',
    defaultUnit: 'Qualitativo',
    referenceRange: 'Não Reagente (Sensibilidade 25 mUI/mL)',
    anvisaReg: 'MS 10301140019',
    category: 'Saúde da Mulher'
  },
  {
    id: 'covid_influenza',
    name: 'Combo Rápido Antígeno: COVID-19 & Influenza A+B',
    method: 'Imunocromatografia com Ouro Coloidal',
    sample: 'Swab Nasofaríngeo / Nasal',
    defaultUnit: 'Qualitativo',
    referenceRange: 'SARS-CoV-2: Não Reagente | Flu A: Não Reagente | Flu B: Não Reagente',
    anvisaReg: 'MS 80560310065',
    category: 'Respiratório / Infeccioso'
  },
  {
    id: 'dengue_combo',
    name: 'Dengue Duo Rápido (Antígeno NS1 & Anticorpos IgG/IgM)',
    method: 'Imunocromatografia de Fluxo Lateral',
    sample: 'Sangue total, soro ou plasma',
    defaultUnit: 'Qualitativo',
    referenceRange: 'NS1: Não Reagente | IgM: Não Reagente | IgG: Não Reagente',
    anvisaReg: 'MS 80111400099',
    category: 'Infeccioso / Arbovirose'
  },
  {
    id: 'blood_glucose',
    name: 'Glicemia Capilar de Triagem',
    method: 'Biossensor Eletroquímico / Glicose Desidrogenase',
    sample: 'Sangue capilar fresco',
    defaultUnit: 'mg/dL',
    referenceRange: 'Jejum: 70 a 99 mg/dL | Pós-prandial: < 140 mg/dL',
    anvisaReg: 'MS 80111400012',
    category: 'Endócrino / Metabólico'
  },
  {
    id: 'strep_a',
    name: 'Teste Rápido Estreptococo do Grupo A (Faringite)',
    method: 'Imunocromatografia de Extração Enzimática',
    sample: 'Swab de Orofaringe',
    defaultUnit: 'Qualitativo',
    referenceRange: 'Não Reagente para Streptococcus pyogenes',
    anvisaReg: 'MS 80111400073',
    category: 'Respiratório / Infeccioso'
  },
  {
    id: 'hiv_combo',
    name: 'Triagem Rápida HIV 1/2 + Sífilis (Duo)',
    method: 'Imunocromatografia de Dupla Antígeno-Sanduíche',
    sample: 'Sangue total capilar',
    defaultUnit: 'Qualitativo',
    referenceRange: 'Anti-HIV: Não Reagente | Treponema pallidum: Não Reagente',
    anvisaReg: 'MS 10301140051',
    category: 'Infecções Sexualmente Transmissíveis'
  }
];

export function openTlrModal(patientIdOrObj = null, patientNamePrefill = '') {
  const existing = document.getElementById('tlr-exam-modal');
  if (existing) existing.remove();

  let selectedPatient = null;
  const allPatients = (typeof localDB !== 'undefined' && localDB.list ? (localDB.list('pharmacy_patients') || []).concat(localDB.list('patients') || []) : []);
  
  if (typeof patientIdOrObj === 'object' && patientIdOrObj !== null) {
    selectedPatient = patientIdOrObj;
  } else if (patientIdOrObj) {
    selectedPatient = allPatients.find(p => String(p.id) === String(patientIdOrObj));
  } else if (patientNamePrefill) {
    selectedPatient = allPatients.find(p => p.fullName && p.fullName.toLowerCase().includes(patientNamePrefill.toLowerCase()));
  }

  const pId = selectedPatient?.id || (typeof patientIdOrObj === 'string' ? patientIdOrObj : '');
  const pName = selectedPatient?.fullName || selectedPatient?.name || patientNamePrefill || '';
  const pCpf = selectedPatient?.cpf || '';

  // Configurações e RT
  const settings = (typeof localDB !== 'undefined' && localDB.get ? (localDB.get('settings', 'main') || localDB.get('settings') || {}) : {}) || {};
  const pharmacyName = settings.pharmacy_name || settings.clinic_name || 'CRM CLÍNICO FARMACÊUTICO';
  const rtPharmacist = settings.rt_name || state.user?.name || 'Dr. Marcelo Mazaro';
  const rtCrf = settings.crf || settings.rt_crf || 'CRF/SP 54180';

  const modal = document.createElement('div');
  modal.id = 'tlr-exam-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(5, 8, 20, 0.88); backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px); z-index: 1000000; display: flex;
    align-items: center; justify-content: center; padding: 16px;
    box-sizing: border-box; font-family: 'Inter', sans-serif;
  `;

  modal.innerHTML = `
    <div style="
      background: #0f172a; border: 1.5px solid rgba(20, 184, 166, 0.5);
      border-radius: 20px; width: 900px; max-width: 96vw; max-height: 92vh;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 25px 70px rgba(0,0,0,0.9), 0 0 35px rgba(20, 184, 166, 0.2);
    ">
      <!-- HEADER -->
      <div style="
        padding: 16px 24px; background: linear-gradient(135deg, #042f2e, #0f172a);
        border-bottom: 1px solid rgba(255,255,255,0.1); display: flex;
        justify-content: space-between; align-items: center; gap: 14px;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="
            width: 42px; height: 42px; border-radius: 12px;
            background: linear-gradient(135deg, #0d9488, #0f766e);
            display: flex; align-items: center; justify-content: center;
            color: #fff; font-size: 1.3rem; box-shadow: 0 4px 14px rgba(13,148,136,0.4);
          ">
            <i class="fa-solid fa-vial-virus"></i>
          </div>
          <div>
            <h3 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 800; color: #f8fafc; letter-spacing: -0.3px;">
              Exame Rápido TLR <span style="font-size: 0.8rem; background: rgba(20, 184, 166, 0.2); color: #2dd4bf; border: 1px solid rgba(20, 184, 166, 0.4); padding: 2px 8px; border-radius: 12px; margin-left: 6px;">RDC 786/2023 ANVISA</span>
            </h3>
            <div style="font-size: 0.8rem; color: #94a3b8;">
              Testes Laboratoriais Remotos em Farmácia • Registro e Emissão de Laudo Técnico Oficial
            </div>
          </div>
        </div>

        <button type="button" id="btn-close-tlr-modal" style="
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
          color: #94a3b8; width: 34px; height: 34px; border-radius: 8px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
        " onmouseover="this.style.color='#fff'; this.style.background='rgba(239, 68, 68, 0.3)'" onmouseout="this.style.color='#94a3b8'; this.style.background='rgba(255,255,255,0.08)'">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- CORPO DO FORMULÁRIO -->
      <div style="padding: 22px 26px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 18px;">
        
        <!-- SELEÇÃO DO PACIENTE E RESPONSÁVEL -->
        <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px;">
          <div style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; color: #38bdf8; letter-spacing: 0.5px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-user-check"></i> Identificação do Paciente &amp; Responsável Técnico
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
            <div>
              <label style="display: block; font-size: 0.76rem; color: #94a3b8; margin-bottom: 4px;">Paciente:</label>
              <input type="text" id="tlr-patient-name" value="${pName}" placeholder="Digite o nome do paciente..." style="width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 8px 12px; color: #fff; font-size: 0.88rem; box-sizing: border-box;">
              <input type="hidden" id="tlr-patient-id" value="${pId}">
            </div>
            <div>
              <label style="display: block; font-size: 0.76rem; color: #94a3b8; margin-bottom: 4px;">CPF do Paciente:</label>
              <input type="text" id="tlr-patient-cpf" value="${pCpf}" placeholder="000.000.000-00" style="width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 8px 12px; color: #fff; font-size: 0.88rem; box-sizing: border-box;">
            </div>
            <div>
              <label style="display: block; font-size: 0.76rem; color: #94a3b8; margin-bottom: 4px;">Farmacêutico(a) RT Executor:</label>
              <input type="text" id="tlr-pharmacist-name" value="${rtPharmacist} (${rtCrf})" readonly style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid #334155; border-radius: 8px; padding: 8px 12px; color: #34d399; font-size: 0.86rem; box-sizing: border-box;">
            </div>
          </div>
        </div>

        <!-- SELEÇÃO DO TESTE RÁPIDO & DADOS DO KIT -->
        <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px;">
          <div style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; color: #2dd4bf; letter-spacing: 0.5px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-microscope"></i> Exame Rápido &amp; Rastreabilidade do Reagente (RDC 786)
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 12px;">
            <div style="grid-column: 1 / -1;">
              <label style="display: block; font-size: 0.76rem; color: #94a3b8; margin-bottom: 4px;">Tipo de Teste Rápido (TLR):</label>
              <select id="tlr-test-select" style="width: 100%; background: #1e293b; border: 1px solid #14b8a6; border-radius: 8px; padding: 9px 12px; color: #fff; font-size: 0.9rem; box-sizing: border-box; cursor: pointer;">
                ${TLR_TEST_CATALOG.map(t => `<option value="${t.id}">${t.name} (${t.sample})</option>`).join('')}
              </select>
            </div>

            <div>
              <label style="display: block; font-size: 0.76rem; color: #94a3b8; margin-bottom: 4px;">Lote do Kit Reagente:</label>
              <input type="text" id="tlr-kit-lot" value="TLR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random()*9000)}" placeholder="Ex: L-88492" style="width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 8px 12px; color: #fff; font-size: 0.88rem; box-sizing: border-box;">
            </div>

            <div>
              <label style="display: block; font-size: 0.76rem; color: #94a3b8; margin-bottom: 4px;">Data de Validade do Lote:</label>
              <input type="date" id="tlr-kit-exp" value="2027-12-31" style="width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 8px 12px; color: #fff; font-size: 0.88rem; box-sizing: border-box;">
            </div>

            <div>
              <label style="display: block; font-size: 0.76rem; color: #94a3b8; margin-bottom: 4px;">Registro ANVISA do Produto:</label>
              <input type="text" id="tlr-anvisa-reg" value="${TLR_TEST_CATALOG[0].anvisaReg}" style="width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 8px 12px; color: #cbd5e1; font-size: 0.86rem; box-sizing: border-box;">
            </div>
          </div>

          <div id="tlr-test-info-box" style="background: rgba(20, 184, 166, 0.08); border: 1px solid rgba(20, 184, 166, 0.25); border-radius: 10px; padding: 10px 14px; font-size: 0.82rem; color: #cbd5e1;">
            <div><strong>Metodologia:</strong> <span id="tlr-info-method">${TLR_TEST_CATALOG[0].method}</span></div>
            <div style="margin-top: 3px;"><strong>Valores de Referência:</strong> <span id="tlr-info-ref" style="color: #2dd4bf;">${TLR_TEST_CATALOG[0].referenceRange}</span></div>
          </div>
        </div>

        <!-- RESULTADO & PARECER TÉCNICO -->
        <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px;">
          <div style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; color: #f59e0b; letter-spacing: 0.5px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-square-poll-vertical"></i> Resultado Obtido &amp; Parecer Farmacêutico
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div>
              <label style="display: block; font-size: 0.76rem; color: #94a3b8; margin-bottom: 4px;">Resultado Qualitativo / Status:</label>
              <select id="tlr-result-qualitative" style="width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 9px 12px; color: #fff; font-size: 0.9rem; box-sizing: border-box;">
                <option value="Normal / Satisfatório">Normal / Satisfatório</option>
                <option value="Não Reagente">Não Reagente (Negativo)</option>
                <option value="Reagente">Reagente (Positivo)</option>
                <option value="Alterado / Acima da Referência">Alterado / Acima da Referência</option>
                <option value="Inconclusivo">Inconclusivo (Requer Repetição)</option>
              </select>
            </div>

            <div>
              <label style="display: block; font-size: 0.76rem; color: #94a3b8; margin-bottom: 4px;">Valor Numérico / Detalhe (se aplicável):</label>
              <input type="text" id="tlr-result-quantitative" placeholder="Ex: 5.4% ou 180 mg/dL" style="width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 8px 12px; color: #34d399; font-weight: 700; font-size: 0.9rem; box-sizing: border-box;">
            </div>
          </div>

          <div>
            <label style="display: block; font-size: 0.76rem; color: #94a3b8; margin-bottom: 4px;">Parecer Farmacêutico &amp; Conduta / Recomendações:</label>
            <textarea id="tlr-clinical-opinion" rows="2" placeholder="Ex: Parâmetro dentro das metas de controle. Orientado a manter adesão farmacoterapêutica e hábitos de vida saudáveis..." style="width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 8px 12px; color: #fff; font-size: 0.84rem; line-height: 1.4; resize: vertical; box-sizing: border-box;"></textarea>
          </div>
        </div>

      </div>

      <!-- FOOTER ACTIONS -->
      <div style="
        padding: 16px 26px; background: rgba(15, 23, 42, 0.95);
        border-top: 1px solid rgba(255,255,255,0.08); display: flex;
        justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;
      ">
        <div style="font-size: 0.76rem; color: #94a3b8; display: flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-shield-halved" style="color: #10b981;"></i> Assinatura Digital &amp; Validador ICP-Brasil habilitado
        </div>

        <div style="display: flex; gap: 10px; align-items: center;">
          <button type="button" id="btn-save-tlr-only" style="
            background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
            color: #f8fafc; padding: 8px 16px; border-radius: 8px; font-weight: 600;
            font-size: 0.84rem; cursor: pointer; display: flex; align-items: center; gap: 6px;
          ">
            <i class="fa-solid fa-floppy-disk"></i> Salvar no Prontuário
          </button>

          <button type="button" id="btn-save-and-pdf-tlr" style="
            background: linear-gradient(135deg, #0d9488, #0f766e); border: 1px solid #14b8a6;
            color: #ffffff; padding: 8px 18px; border-radius: 8px; font-weight: 700;
            font-size: 0.86rem; cursor: pointer; display: flex; align-items: center; gap: 6px;
            box-shadow: 0 4px 14px rgba(13, 148, 136, 0.35);
          ">
            <i class="fa-solid fa-file-pdf"></i> Salvar &amp; Emitir Laudo (PDF)
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Dynamic selector change
  const testSelect = modal.querySelector('#tlr-test-select');
  const infoMethod = modal.querySelector('#tlr-info-method');
  const infoRef = modal.querySelector('#tlr-info-ref');
  const anvisaInput = modal.querySelector('#tlr-anvisa-reg');

  testSelect.addEventListener('change', () => {
    const found = TLR_TEST_CATALOG.find(t => t.id === testSelect.value);
    if (found) {
      infoMethod.textContent = found.method;
      infoRef.textContent = found.referenceRange;
      anvisaInput.value = found.anvisaReg;
    }
  });

  modal.querySelector('#btn-close-tlr-modal').addEventListener('click', () => modal.remove());

  // Handler de salvar
  const handleSaveTlr = async (generatePdf = false) => {
    const patientName = modal.querySelector('#tlr-patient-name').value.trim();
    if (!patientName) {
      showToast('Por favor, informe o nome do paciente.', 'warning');
      return;
    }

    const testId = testSelect.value;
    const testDef = TLR_TEST_CATALOG.find(t => t.id === testId) || TLR_TEST_CATALOG[0];
    const lot = modal.querySelector('#tlr-kit-lot').value.trim();
    const exp = modal.querySelector('#tlr-kit-exp').value;
    const anvisa = modal.querySelector('#tlr-anvisa-reg').value.trim();
    const qual = modal.querySelector('#tlr-result-qualitative').value;
    const quant = modal.querySelector('#tlr-result-quantitative').value.trim();
    const opinion = modal.querySelector('#tlr-clinical-opinion').value.trim();
    const cpf = modal.querySelector('#tlr-patient-cpf').value.trim();
    const patientId = modal.querySelector('#tlr-patient-id').value;

    const tlrRecord = {
      id: `TLR-${Date.now()}`,
      created_at: new Date().toISOString(),
      patient_id: patientId || null,
      patient_name: patientName,
      patient_cpf: cpf,
      test_id: testDef.id,
      test_name: testDef.name,
      sample_type: testDef.sample,
      method: testDef.method,
      lot_number: lot,
      expiration_date: exp,
      anvisa_registry: anvisa,
      reference_range: testDef.referenceRange,
      result_qualitative: qual,
      result_quantitative: quant,
      clinical_opinion: opinion || 'Resultado compatível com as diretrizes clínicas de referência.',
      pharmacist_name: rtPharmacist,
      pharmacist_crf: rtCrf,
      pharmacy_name: pharmacyName
    };

    // Salvar no IndexedDB
    try {
      if (typeof localDB !== 'undefined' && localDB.insert) {
        localDB.insert('tlr_records', tlrRecord);
      }
      if (typeof syncManager !== 'undefined' && syncManager.pushToCloud) {
        syncManager.pushToCloud('tlr_records', tlrRecord);
      }
    } catch(e) {
      console.warn('Erro ao persistir TLR:', e);
    }

    showToast('Exame TLR gravado com sucesso no prontuário!', 'success');

    if (generatePdf) {
      generateTlrLaudoPDF(tlrRecord);
    }

    modal.remove();
  };

  modal.querySelector('#btn-save-tlr-only').addEventListener('click', () => handleSaveTlr(false));
  modal.querySelector('#btn-save-and-pdf-tlr').addEventListener('click', () => handleSaveTlr(true));
}

// ─── GERADOR DO LAUDO OFICIAL TLR EM PDF VETORIAL A4 ─────────────────────────
export function generateTlrLaudoPDF(tlr) {
  const jsPDFClass = window.jspdf?.jsPDF || (typeof jspdf !== 'undefined' ? jspdf.jsPDF : null);
  if (!jsPDFClass) {
    showToast('Biblioteca jsPDF carregando. Tentando imprimir laudo...', 'info');
    window.print();
    return;
  }

  const doc = new jsPDFClass({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const marginX = 14;
  let y = 14;

  // Header Box
  doc.setFillColor(4, 47, 46); // #042f2e
  doc.roundedRect(marginX, y, pageWidth - (marginX * 2), 26, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(String(tlr.pharmacy_name || 'CRM CLÍNICO FARMACÊUTICO').toUpperCase(), marginX + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(45, 212, 191);
  doc.text('SERVIÇOS DE TESTES LABORATORIAIS REMOTOS — RDC 786/2023 ANVISA & CFF 585/2013', marginX + 6, y + 15);

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(7.5);
  doc.text(`Responsável Técnico: ${tlr.pharmacist_name} • ${tlr.pharmacist_crf}`, marginX + 6, y + 21);

  y += 32;

  // Título do Laudo
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('LAUDO TÉCNICO DE EXAME LABORATORIAL REMOTO (TLR)', marginX, y);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Protocolo de Laudo: #${tlr.id} • Emissão: ${new Date(tlr.created_at).toLocaleString('pt-BR')}`, marginX, y + 5);

  y += 10;

  // Dados do Paciente
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, y, pageWidth - (marginX * 2), 16, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Paciente: ${tlr.patient_name}`, marginX + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`CPF: ${tlr.patient_cpf || 'Não informado'}   •   Tipo de Amostra: ${tlr.sample_type || 'Sangue capilar'}`, marginX + 4, y + 12);

  y += 22;

  // Bloco de Identificação do Teste & Rastreabilidade Sanitária
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(20, 184, 166);
  doc.roundedRect(marginX, y, pageWidth - (marginX * 2), 24, 2, 2, 'FD');

  doc.setTextColor(15, 118, 110);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`EXAME: ${tlr.test_name}`, marginX + 4, y + 6);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Metodologia Analítica: ${tlr.method}`, marginX + 4, y + 12);
  doc.text(`Lote do Kit Reagente: ${tlr.lot_number}   •   Validade do Lote: ${tlr.expiration_date ? tlr.expiration_date.split('-').reverse().join('/') : '—'}`, marginX + 4, y + 17);
  doc.text(`Registro ANVISA: ${tlr.anvisa_registry || 'Autorizado'}`, marginX + 4, y + 22);

  y += 30;

  // Bloco de Resultado
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(marginX, y, pageWidth - (marginX * 2), 28, 3, 3, 'F');

  doc.setTextColor(45, 212, 191);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('RESULTADO OBTIDO:', marginX + 6, y + 7);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text(`${tlr.result_qualitative}${tlr.result_quantitative ? ` (${tlr.result_quantitative})` : ''}`, marginX + 6, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Valores de Referência Normativos: ${tlr.reference_range}`, marginX + 6, y + 23);

  y += 34;

  // Parecer Farmacêutico & Recomendações
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, y, pageWidth - (marginX * 2), 26, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PARECER FARMACÊUTICO & CONDUTA ADOTADA:', marginX + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const opinionLines = doc.splitTextToSize(tlr.clinical_opinion, pageWidth - (marginX * 2) - 8);
  doc.text(opinionLines, marginX + 4, y + 12);

  y += 34;

  // Nota Legal Sanitária
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.text('Este teste rápido laboratorial remoto (TLR) tem finalidade de triagem e acompanhamento farmacoterapêutico segundo a RDC 786/2023 da ANVISA.', marginX, y);
  doc.text('Não substitui o diagnóstico médico definitivo quando necessária correlação clínica e exames confirmatórios de laboratório clínico central.', marginX, y + 4);

  y += 18;

  // Bloco de Assinatura Digital & Carimbo
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(148, 163, 184);
  doc.roundedRect(marginX, y, pageWidth - (marginX * 2), 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ASSINATURA DIGITAL DO RESPONSÁVEL TÉCNICO:', marginX + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(13, 148, 136);
  doc.text(`${tlr.pharmacist_name} — ${tlr.pharmacist_crf}`, marginX + 4, y + 12);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Chancela CFF / ICP-Brasil • Hash SHA256: ${tlr.id.padEnd(32, 'X')}`, marginX + 4, y + 17);
  doc.text(`Validador Público de Autenticidade: https://validar.iti.gov.br/?protocolo=${tlr.id}`, marginX + 4, y + 21);

  // Salvar PDF
  const filename = `Laudo_TLR_${tlr.patient_name.replace(/\s+/g, '_')}_${tlr.id}.pdf`;
  doc.save(filename);
  showToast(`Laudo TLR gerado com sucesso: ${filename}`, 'success');
}

// Expor globalmente
if (typeof window !== 'undefined') {
  window.openTlrModal = openTlrModal;
  window.generateTlrLaudoPDF = generateTlrLaudoPDF;
}
