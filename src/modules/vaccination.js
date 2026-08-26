// src/modules/vaccination.js
// MÓDULO DE SERVIÇOS FARMACÊUTICOS: VACINAÇÃO & APLICAÇÃO DE INJETÁVEIS (CFF RES. 654/2018 & RDC ANVISA 197/2017)

import * as localDB from '../localDB.js';
import { state } from '../state.js';
import { showToast, showCustomAlert, showCustomConfirm } from './ui.js';
import { syncManager } from './sync.js';

// Catálogo de Vacinas Comuns e Doses
export const STANDARD_VACCINES = [
  { id: 'influenza-tetra', name: 'Influenza Tetravalente (Gripe)', manufacturer: 'Sanofi / GSK', doses: 'Anual', via: 'IM - Deltoide' },
  { id: 'hpv-nonavalente', name: 'HPV Nonavalente (Gardasil 9)', manufacturer: 'MSD', doses: '2 a 3 doses (0-2-6m)', via: 'IM - Deltoide' },
  { id: 'herpes-zoster', name: 'Herpes Zóster Recombinante (Shingrix)', manufacturer: 'GSK', doses: '2 doses (0-2m)', via: 'IM - Deltoide' },
  { id: 'pneumo-13', name: 'Pneumocócica 13-valente (VPC13)', manufacturer: 'Pfizer', doses: 'Dose única / Reforço', via: 'IM - Deltoide' },
  { id: 'pneumo-23', name: 'Pneumocócica 23-valente (VPP23)', manufacturer: 'MSD', doses: '1 a 2 doses', via: 'IM - Deltoide' },
  { id: 'dtpa', name: 'Tríplice Bacteriana Acelular (DTPa)', manufacturer: 'GSK / Sanofi', doses: 'Reforço a cada 10 anos', via: 'IM - Deltoide' },
  { id: 'hepatite-b', name: 'Hepatite B Recombinante', manufacturer: 'GSK / Butantan', doses: '3 doses (0-1-6m)', via: 'IM - Deltoide' },
  { id: 'febre-amarela', name: 'Febre Amarela (Atenuada)', manufacturer: 'Bio-Manguinhos', doses: 'Dose única / Reforço', via: 'Subcutânea' },
  { id: 'meningo-acwy', name: 'Meningocócica ACWY (Conjugada)', manufacturer: 'GSK / Pfizer', doses: 'Dose única / Reforço', via: 'IM - Deltoide' },
  { id: 'dengue-qdenga', name: 'Dengue Tetravalente (Qdenga)', manufacturer: 'Takeda', doses: '2 doses (0-3m)', via: 'Subcutânea' }
];

// Salva e emite a aplicação de vacina / injetável
export function registerApplication(data) {
  const settings = localDB.get('settings', 'main') || {};
  const currentUser = state.user || {};

  const record = {
    id: `APPL-${Date.now()}`,
    protocol: `VAC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
    type: data.type || 'vacina', // 'vacina' | 'medicamento_injetavel'
    item_name: data.itemName,
    manufacturer: data.manufacturer || '',
    batch: data.batch,
    expiry_date: data.expiryDate,
    dose_number: data.doseNumber || 'Dose Única',
    next_dose_date: data.nextDoseDate || null,
    administration_route: data.route || 'Intramuscular (Deltoide D)',
    applied_at: data.appliedAt || new Date().toISOString(),
    patient: {
      id: data.patientId || null,
      name: data.patientName,
      cpf: data.patientCpf || '',
      phone: data.patientPhone || '',
      birth_date: data.patientBirthDate || '',
      allergies: data.patientAllergies || 'Nenhuma informada'
    },
    screening: {
      has_fever: !!data.hasFever,
      has_acute_illness: !!data.hasAcuteIllness,
      has_allergy: !!data.hasAllergy,
      is_pregnant: !!data.isPregnant,
      observations: data.observations || ''
    },
    prescriber: data.type === 'medicamento_injetavel' ? {
      name: data.prescriberName || '',
      council_num: data.prescriberCouncilNum || '',
      prescription_date: data.prescriptionDate || ''
    } : null,
    pharmacist: {
      name: settings.pharmacist_rt || currentUser.name || 'Farmacêutico Habilitado',
      crf: settings.pharmacist_crf || currentUser.crf || '00000/UF'
    },
    created_at: new Date().toISOString()
  };

  localDB.insert('vaccination_applications', record);

  // Dar baixa no estoque se houver produto vinculado
  if (data.productId) {
    const prod = localDB.get('products', data.productId);
    if (prod) {
      const newStock = Math.max(0, parseInt(prod.current_stock || 0, 10) - 1);
      localDB.update('products', data.productId, { current_stock: newStock });

      localDB.insert('inventory_movements', {
        product_id: data.productId,
        product_name: prod.name,
        type: 'Aplicação Clínica / Injetável',
        quantity: -1,
        batch: data.batch,
        cost_unit: parseFloat(prod.cost_price || 0),
        total_value: parseFloat(prod.sale_price || 0),
        reason: `Aplicação de Injetável/Vacina — Paciente: ${data.patientName} (Protocolo #${record.protocol})`,
        patient_name: data.patientName,
        operator_name: record.pharmacist.name,
        created_at: new Date().toISOString()
      });
    }
  }

  syncManager.pushToCloud(false);
  return record;
}

// Modal de Aplicação de Vacinas & Injetáveis
export function openVaccinationModal(preselectedPatient = null, onSaved = null) {
  const existing = document.getElementById('vaccination-modal');
  if (existing) existing.remove();

  const allPatients = (localDB.list('pharmacy_patients') || []).concat(localDB.list('patients') || []);
  const activeContextPatient = preselectedPatient || state.activePatient || null;

  const modal = document.createElement('div');
  modal.id = 'vaccination-modal';
  modal.className = 'pep-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 15, 29, 0.92); backdrop-filter: blur(16px);
    display: flex; justify-content: center; align-items: center; z-index: 10010; padding: 16px;
  `;

  modal.innerHTML = `
    <div style="width: 100%; max-width: 860px; max-height: 94vh; display: flex; flex-direction: column; background: #0f172a; border: 1.5px solid rgba(16, 185, 129, 0.5); border-radius: 20px; padding: 22px; box-shadow: 0 25px 60px rgba(0,0,0,0.95); overflow: hidden;">
      
      <!-- Cabeçalho -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.3rem;">
            <i class="fa-solid fa-syringe"></i>
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h3 style="margin: 0; color: #fff; font-family: 'Outfit'; font-size: 1.25rem; font-weight: 700;">
                Aplicação de Vacinas &amp; Injetáveis
              </h3>
              <span style="font-size: 0.7rem; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16,185,129,0.4); padding: 2px 8px; border-radius: 10px; font-weight: 700;">
                CFF Res. 654/2018
              </span>
            </div>
            <p style="margin: 2px 0 0; font-size: 0.78rem; color: #94a3b8;">
              Declaração de Serviço Farmacêutico (DSF), triagem clínica pré-vacinal e carteira digital.
            </p>
          </div>
        </div>
        <button id="btn-close-vaccine-modal" style="background: none; border: none; color: #94a3b8; font-size: 1.3rem; cursor: pointer;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <form id="form-vaccine-application" style="display: flex; flex-direction: column; gap: 14px; flex: 1; overflow-y: auto; padding-right: 4px;">
        
        <!-- SEÇÃO 1: PACIENTE -->
        <div style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px;">
          <strong style="font-size: 0.84rem; color: #38bdf8; display: block; margin-bottom: 8px; font-family: 'Outfit';">
            1. Identificação do Paciente
          </strong>

          <div style="display: grid; grid-template-columns: 2fr 1.2fr 1fr; gap: 10px;">
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Selecionar ou Digitar Nome:</label>
              <select id="vac-patient-select" class="form-input" style="font-size: 0.84rem;">
                <option value="">👤 Digitar dados manualmente...</option>
                ${allPatients.map(p => `
                  <option value="${p.id}" ${activeContextPatient && (activeContextPatient.id === p.id) ? 'selected' : ''} data-name="${p.name || p.fullName}" data-cpf="${p.cpf || ''}" data-phone="${p.phone || ''}" data-birth="${p.birthDate || p.birth_date || ''}" data-allergies="${p.allergies || ''}">
                    ${p.name || p.fullName} (CPF: ${p.cpf || 'N/A'})
                  </option>
                `).join('')}
              </select>
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* CPF:</label>
              <input type="text" id="vac-patient-cpf" class="form-input" required placeholder="000.000.000-00" value="${activeContextPatient?.cpf || ''}" style="font-size: 0.84rem;">
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">Telefone / WhatsApp:</label>
              <input type="text" id="vac-patient-phone" class="form-input" placeholder="(11) 90000-0000" value="${activeContextPatient?.phone || ''}" style="font-size: 0.84rem;">
            </div>
          </div>
        </div>

        <!-- SEÇÃO 2: PROCEDIMENTO & VACINA / INJETÁVEL -->
        <div style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px;">
          <strong style="font-size: 0.84rem; color: #34d399; display: block; margin-bottom: 8px; font-family: 'Outfit';">
            2. Vacina ou Medicamento Injetável
          </strong>

          <div style="display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 10px; margin-bottom: 10px;">
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Tipo de Serviço:</label>
              <select id="vac-service-type" class="form-input" style="font-size: 0.84rem;">
                <option value="vacina">💉 Aplicação de Vacina</option>
                <option value="medicamento_injetavel">💊 Medicamento Injetável (Receita)</option>
              </select>
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Nome da Vacina / Injetável:</label>
              <input type="text" id="vac-item-name" class="form-input" required list="vac-standard-list" placeholder="Ex: Influenza Tetravalente" style="font-size: 0.84rem;">
              <datalist id="vac-standard-list">
                ${STANDARD_VACCINES.map(v => `<option value="${v.name}">${v.manufacturer} — ${v.doses}</option>`).join('')}
              </datalist>
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">Fabricante / Lab:</label>
              <input type="text" id="vac-manufacturer" class="form-input" placeholder="Ex: Sanofi / GSK" style="font-size: 0.84rem;">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1.2fr; gap: 10px;">
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Lote:</label>
              <input type="text" id="vac-batch" class="form-input" required placeholder="L-2024" style="font-size: 0.84rem; font-family: monospace;">
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Validade:</label>
              <input type="date" id="vac-expiry" class="form-input" required style="font-size: 0.84rem;">
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Dose:</label>
              <select id="vac-dose-number" class="form-input" style="font-size: 0.84rem;">
                <option value="Dose Única">Dose Única</option>
                <option value="1ª Dose">1ª Dose</option>
                <option value="2ª Dose">2ª Dose</option>
                <option value="3ª Dose">3ª Dose</option>
                <option value="Dose de Reforço">Dose de Reforço</option>
                <option value="Dose Anual">Dose Anual</option>
              </select>
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Via de Administração:</label>
              <select id="vac-route" class="form-input" style="font-size: 0.84rem;">
                <option value="Intramuscular (Deltoide D)">IM - Deltoide Direito</option>
                <option value="Intramuscular (Deltoide E)">IM - Deltoide Esquerdo</option>
                <option value="Intramuscular (Glúteo D)">IM - Glúteo Direito (Ventroglúteo)</option>
                <option value="Intramuscular (Glúteo E)">IM - Glúteo Esquerdo</option>
                <option value="Intramuscular (Vasto Lateral D)">IM - Vasto Lateral D (Pediátrico)</option>
                <option value="Subcutânea (Braço D)">SC - Subcutânea Braço D</option>
                <option value="Subcutânea (Braço E)">SC - Subcutânea Braço E</option>
                <option value="Intradérmica">ID - Intradérmica</option>
              </select>
            </div>
          </div>
        </div>

        <!-- SEÇÃO 3: TRIAGEM PRÉ-VACINAL & REAÇÕES -->
        <div style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px;">
          <strong style="font-size: 0.84rem; color: #fbbf24; display: block; margin-bottom: 8px; font-family: 'Outfit';">
            3. Triagem Clínica Pré-Aplicação (Checklist de Segurança)
          </strong>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; font-size: 0.78rem;">
            <label style="display: flex; align-items: center; gap: 8px; color: #cbd5e1; cursor: pointer;">
              <input type="checkbox" id="chk-fever" style="width: 16px; height: 16px;"> Febre nas últimas 24h?
            </label>
            <label style="display: flex; align-items: center; gap: 8px; color: #cbd5e1; cursor: pointer;">
              <input type="checkbox" id="chk-acute" style="width: 16px; height: 16px;"> Doença aguda / infecção?
            </label>
            <label style="display: flex; align-items: center; gap: 8px; color: #cbd5e1; cursor: pointer;">
              <input type="checkbox" id="chk-allergy" style="width: 16px; height: 16px;"> Alergia a ovo ou componentes?
            </label>
            <label style="display: flex; align-items: center; gap: 8px; color: #cbd5e1; cursor: pointer;">
              <input type="checkbox" id="chk-pregnant" style="width: 16px; height: 16px;"> Gestante ou lactante?
            </label>
          </div>

          <div style="margin-top: 10px;">
            <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">Previsão da Próxima Dose / Reforço:</label>
            <input type="date" id="vac-next-dose-date" class="form-input" style="font-size: 0.84rem; max-width: 240px;">
            <small style="color: #94a3b8; font-size: 0.7rem; display: block; margin-top: 2px;">Para preenchimento da Carteira Digital do Paciente.</small>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;">
          <button type="button" id="btn-cancel-vac" class="btn" style="background: rgba(255,255,255,0.06); color: #94a3b8; border: 1px solid rgba(255,255,255,0.12); padding: 9px 16px; border-radius: 8px;">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, #10b981, #059669); border: none; padding: 9px 24px; border-radius: 8px; font-weight: 700; color: #fff;">
            <i class="fa-solid fa-check"></i> Registrar Aplicação &amp; Emitir DSF
          </button>
        </div>

      </form>

    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();
  document.getElementById('btn-close-vaccine-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-vac')?.addEventListener('click', closeModal);

  // Preencher dados ao selecionar paciente
  document.getElementById('vac-patient-select')?.addEventListener('change', (e) => {
    const opt = e.target.options[e.target.selectedIndex];
    if (opt && opt.value) {
      document.getElementById('vac-patient-cpf').value = opt.dataset.cpf || '';
      document.getElementById('vac-patient-phone').value = opt.dataset.phone || '';
    }
  });

  document.getElementById('form-vaccine-application')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const patientSelect = document.getElementById('vac-patient-select');
    const selectedOpt = patientSelect.options[patientSelect.selectedIndex];
    const patientName = selectedOpt.value ? selectedOpt.dataset.name : (selectedOpt.text.replace('👤 ', '') || 'Paciente');

    const appData = {
      type: document.getElementById('vac-service-type').value,
      itemName: document.getElementById('vac-item-name').value.trim(),
      manufacturer: document.getElementById('vac-manufacturer').value.trim(),
      batch: document.getElementById('vac-batch').value.trim(),
      expiryDate: document.getElementById('vac-expiry').value,
      doseNumber: document.getElementById('vac-dose-number').value,
      route: document.getElementById('vac-route').value,
      nextDoseDate: document.getElementById('vac-next-dose-date').value || null,
      patientId: patientSelect.value || null,
      patientName,
      patientCpf: document.getElementById('vac-patient-cpf').value.trim(),
      patientPhone: document.getElementById('vac-patient-phone').value.trim(),
      hasFever: document.getElementById('chk-fever').checked,
      hasAcuteIllness: document.getElementById('chk-acute').checked,
      hasAllergy: document.getElementById('chk-allergy').checked,
      isPregnant: document.getElementById('chk-pregnant').checked
    };

    const record = registerApplication(appData);
    showToast(`✅ Aplicação #${record.protocol} registrada com sucesso!`);
    closeModal();

    if (typeof window.showFlowCompletionNotification === 'function') {
      window.showFlowCompletionNotification({
        flowType: 'completed',
        badgeText: 'FLUXO DE VACINAÇÃO & DSF CONCLUÍDO',
        badgeIcon: 'fa-circle-check',
        icon: 'fa-syringe',
        actionTitle: `💉 Aplicação Realizada: ${record.item_name}`,
        message: `Protocolo <strong>#${record.protocol}</strong> registrado para <strong>${record.patient?.name}</strong>. Lote ${record.batch} debitado do estoque.`,
        targetTab: 'relatorios',
        targetTabLabel: 'Declarações & Relatórios DSF',
        actionButtonText: 'Ver Declarações >'
      });
    }

    // Abrir Modal de DSF e Carteira Digital com Opção WhatsApp
    openApplicationSuccessModal(record, onSaved);
  });
}

// Modal de Conclusão, Impressão da DSF e Carteira de Vacinação
export function openApplicationSuccessModal(record, onFinished = null) {
  const modal = document.createElement('div');
  modal.className = 'pep-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 15, 29, 0.92); backdrop-filter: blur(16px);
    display: flex; justify-content: center; align-items: center; z-index: 10011; padding: 16px;
  `;

  modal.innerHTML = `
    <div style="width: 100%; max-width: 540px; background: #0f172a; border: 1.5px solid rgba(16, 185, 129, 0.5); border-radius: 20px; padding: 24px; box-shadow: 0 25px 60px rgba(0,0,0,0.9); text-align: center;">
      
      <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); border: 2px solid #10b981; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; color: #34d399; font-size: 1.8rem;">
        <i class="fa-solid fa-shield-halved"></i>
      </div>

      <h3 style="margin: 0; font-family: 'Outfit'; font-size: 1.35rem; color: #fff; font-weight: 800;">
        Aplicação Registrada com Sucesso!
      </h3>
      <p style="margin: 4px 0 16px; color: #94a3b8; font-size: 0.84rem;">
        Protocolo <strong style="color: #38bdf8;">#${record.protocol}</strong> • Paciente: <strong style="color: #fff;">${record.patient?.name}</strong>
      </p>

      <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px; text-align: left; margin-bottom: 18px; font-size: 0.82rem;">
        <div><strong>Procedimento:</strong> ${record.item_name} (${record.dose_number})</div>
        <div style="margin-top: 4px;"><strong>Lote / Validade:</strong> <span style="font-family: monospace; color: #cbd5e1;">${record.batch}</span> (Val: ${new Date(record.expiry_date).toLocaleDateString('pt-BR')})</div>
        <div style="margin-top: 4px;"><strong>Via:</strong> ${record.administration_route}</div>
        <div style="margin-top: 4px;"><strong>Farmacêutico Aplicador:</strong> ${record.pharmacist?.name} (${record.pharmacist?.crf})</div>
        ${record.next_dose_date ? `<div style="margin-top: 6px; color: #fbbf24;"><strong>📅 Próxima Dose / Reforço:</strong> ${new Date(record.next_dose_date).toLocaleDateString('pt-BR')}</div>` : ''}
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
        <button type="button" id="btn-print-vac-dsf" class="btn" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 10px; border-radius: 10px; font-weight: 700; font-size: 0.84rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
          <i class="fa-solid fa-print"></i> Imprimir DSF (CFF)
        </button>
        <button type="button" id="btn-send-vac-whatsapp" class="btn" style="background: linear-gradient(135deg, #25D366, #128C7E); color: #fff; border: none; padding: 10px; border-radius: 10px; font-weight: 700; font-size: 0.84rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
          <i class="fa-brands fa-whatsapp"></i> Enviar Comprovante
        </button>
      </div>

      <button type="button" id="btn-close-vac-success" class="btn" style="background: rgba(255,255,255,0.06); color: #94a3b8; border: 1px solid rgba(255,255,255,0.12); width: 100%; padding: 8px; border-radius: 8px; font-size: 0.82rem; cursor: pointer;">
        Concluir
      </button>

    </div>
  `;

  document.body.appendChild(modal);

  const closeSuccess = () => {
    modal.remove();
    if (typeof onFinished === 'function') onFinished();
  };

  document.getElementById('btn-close-vac-success')?.addEventListener('click', closeSuccess);

  // Impressão da DSF Oficial CFF
  document.getElementById('btn-print-vac-dsf')?.addEventListener('click', () => {
    printVaccinationDsf(record);
  });

  // Envio via WhatsApp
  document.getElementById('btn-send-vac-whatsapp')?.addEventListener('click', () => {
    const phone = (record.patient?.phone || '').replace(/\D/g, '');
    const nextMsg = record.next_dose_date ? `\n📅 *Próxima Dose / Reforço Previsto:* ${new Date(record.next_dose_date).toLocaleDateString('pt-BR')}` : '';
    const text = `🏥 *DECLARAÇÃO DE SERVIÇO FARMACÊUTICO - VACINAÇÃO*\n\n` +
      `Olá, *${record.patient?.name}*!\n` +
      `Seu procedimento de imunização/aplicação foi registrado com sucesso:\n\n` +
      `💉 *Procedimento:* ${record.item_name}\n` +
      `🏷️ *Dose:* ${record.dose_number}\n` +
      `📦 *Lote:* ${record.batch} (Val: ${new Date(record.expiry_date).toLocaleDateString('pt-BR')})\n` +
      `📍 *Via:* ${record.administration_route}\n` +
      `📅 *Data:* ${new Date(record.applied_at).toLocaleString('pt-BR')}\n` +
      `👨‍⚕️ *Farmacêutico(a):* ${record.pharmacist?.name} (${record.pharmacist?.crf})${nextMsg}\n\n` +
      `Guarde este comprovante para sua Carteira de Vacinação Digital.`;

    if (!phone) {
      const promptPhone = prompt('Informe o WhatsApp do paciente com DDD (apenas números):', '11900000000');
      if (promptPhone) {
        window.open(`https://wa.me/55${promptPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
      }
    } else {
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, '_blank');
    }
  });
}

// Impressão da DSF Oficial de Vacinação (A4 / Térmica)
export function printVaccinationDsf(record) {
  const settings = localDB.get('settings', 'main') || {};
  const pharmacyName = settings.clinic_name || settings.pharmacy_name || 'CONSULTÓRIO FARMACÊUTICO';

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>DSF - Vacinação - ${record.protocol}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: 'Arial', sans-serif; color: #1e293b; line-height: 1.4; font-size: 13px; }
        .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 16px; }
        .title { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px; }
        .subtitle { font-size: 11px; color: #64748b; }
        .section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 14px; }
        .section-title { font-weight: bold; color: #0f766e; font-size: 13px; margin-bottom: 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .signature-box { margin-top: 40px; display: flex; justify-content: space-around; text-align: center; }
        .signature-line { border-top: 1px solid #000; width: 220px; margin-top: 40px; padding-top: 4px; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div style="font-size: 16px; font-weight: bold; color: #10b981;">${pharmacyName}</div>
        <div class="title">DECLARAÇÃO DE SERVIÇO FARMACÊUTICO (DSF)</div>
        <div class="subtitle">Procedimento de Imunização / Aplicação de Injetáveis — CFF Resolução nº 654/2018 & RDC Anvisa 197/2017</div>
        <div style="font-size: 11px; margin-top: 4px; color: #64748b;">Protocolo: <strong>#${record.protocol}</strong> • Data: <strong>${new Date(record.applied_at).toLocaleString('pt-BR')}</strong></div>
      </div>

      <div class="section">
        <div class="section-title">1. DADOS DO PACIENTE</div>
        <div class="row"><span>Nome: <strong>${record.patient?.name}</strong></span><span>CPF: <strong>${record.patient?.cpf || 'Não informado'}</strong></span></div>
        <div class="row"><span>Telefone: ${record.patient?.phone || 'Não informado'}</span><span>Alergias Prévias: ${record.patient?.allergies || 'Nenhuma'}</span></div>
      </div>

      <div class="section">
        <div class="section-title">2. ESPECIFICAÇÃO DO PRODUTO / VACINA APLICADA</div>
        <div class="row"><span>Imunobiológico / Injetável: <strong>${record.item_name}</strong></span><span>Fabricante: ${record.manufacturer || 'N/A'}</span></div>
        <div class="row"><span>Lote: <strong>${record.batch}</strong></span><span>Validade do Lote: <strong>${new Date(record.expiry_date).toLocaleDateString('pt-BR')}</strong></span></div>
        <div class="row"><span>Dose: <strong>${record.dose_number}</strong></span><span>Via de Administração: <strong>${record.administration_route}</strong></span></div>
        ${record.next_dose_date ? `<div class="row" style="color: #d97706; font-weight: bold;"><span>Previsão de Próxima Dose / Reforço:</span><span>${new Date(record.next_dose_date).toLocaleDateString('pt-BR')}</span></div>` : ''}
      </div>

      <div class="section">
        <div class="section-title">3. TRIAGEM CLÍNICA & ORIENTAÇÕES AO PACIENTE</div>
        <div>✓ Paciente triado sem febre aguda ou contraindicação vacinal no ato da aplicação.</div>
        <div>✓ Orientado sobre possíveis reações locais benignas (dor leve, rubor no local) e cuidados pós-aplicação.</div>
        <div>✓ Permaneceu em observação imediata pós-vacinal no consultório farmacêutico.</div>
      </div>

      <div class="signature-box">
        <div>
          <div class="signature-line">
            <strong>${record.patient?.name}</strong><br>
            Paciente / Responsável Legal
          </div>
        </div>
        <div>
          <div class="signature-line">
            <strong>${record.pharmacist?.name}</strong><br>
            Farmacêutico(a) Responsável • CRF: ${record.pharmacist?.crf}
          </div>
        </div>
      </div>

      <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8;">
        Este documento comprova a vacinação/aplicação farmacêutica para fins sanitários e controle de imunização pessoal.
      </div>
    </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1500);
  }, 350);
}
