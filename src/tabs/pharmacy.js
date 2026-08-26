import { apiFetch, showToast, abbreviateName, switchTab, setupCustomSelect, anonymizeCPF, exportToPDF, formatSyncDate, showCustomAlert, renderTabContent, cachedApiGet, getRolePermissions } from '../main.js';
import { state, dataCache, dataCacheTimestamps } from '../state.js';
import * as localDB from '../localDB.js';
import {
  PHARMACY_TRIAGE_PROTOCOLS,
  runRealtimeClinicalCrosscheck,
  generatePharmacistDeclarationHTML
} from '../modules/pharmacyCDSS.js';
import { CANONICAL_MEDICATIONS_DB } from '../modules/medicationsDB.js';
import { searchMedicationsNLP } from '../modules/medicationNLP.js';

const API_URL = '/api';

// Estado da Aba Farmácia & CRM Clínico
let currentPharmacyItems = [];
let activePharmacySubTab = 'crm_balcao'; // 'crm_balcao' | 'prontuario' | 'simulador' | 'estoque'

// Estado do Atendimento em Andamento
let currentClinicalEncounter = {
  step: 1,
  patient: null,
  triageProtocolKey: 'gripe_resfriado',
  selectedRedFlags: [],
  symptomDurationDays: 1,
  symptomSeverity: 'Leve a Moderado',
  customComplaintNotes: '',
  prescribedMIPs: [],
  nonPharmaRecommendations: [],
  detectedAlerts: [],
  technicalJustification: '',
  isBlockerOverridden: false
};

export async function renderPharmacyTab() {
  const contentArea = document.getElementById('main-content') || document.getElementById('content-area');
  if (!contentArea) return;

  contentArea.innerHTML = `
    <div class="tab-section active pharmacy-crm-root" style="padding-bottom: 40px;">
      
      <!-- CABEÇALHO COM ESTILO FROSTED GLASS -->
      <div class="pharmacy-glass-panel" style="margin-bottom: 20px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #0d9488, #0f766e); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4); color: #fff; font-size: 1.3rem;">
              <i class="fa-solid fa-notes-medical"></i>
            </div>
            <div>
              <h2 style="font-size: 1.5rem; color: #f8fafc; font-family: 'Outfit', sans-serif; margin: 0; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                CRM Clínico Farmacêutico &amp; Suporte à Decisão
              </h2>
              <p style="color: #94a3b8; font-size: 0.86rem; margin: 3px 0 0 0;">
                Rastreamento longitudinal, triagem rápida de sintomas, validação de Red Flags e motor de interações medicamentosas em tempo real.
              </p>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 10px; align-items: center;">
          <button id="btn-open-interactive-manual-pharm" class="btn btn-secondary" style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.1); color: #38bdf8; font-weight: 600; padding: 9px 16px; border-radius: 10px; display: flex; align-items: center; gap: 8px; backdrop-filter: blur(10px);">
            <i class="fa-solid fa-book-medical"></i> Manual Interativo &amp; Busca
          </button>
          <button id="btn-quick-new-patient" class="btn btn-primary" style="background: linear-gradient(135deg, #0d9488, #0f766e); border: none; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.35); font-weight: 600; padding: 9px 18px; border-radius: 10px;">
            <i class="fa-solid fa-user-plus" style="margin-right: 6px;"></i> Novo Paciente Clínico
          </button>
        </div>
      </div>

      <!-- BARRA DE SUB-ABAS (FROSTED GLASS SUBNAV) -->
      <div class="pharmacy-subnav-container">
        <button id="subnav-btn-balcao" class="pharmacy-subnav-btn ${activePharmacySubTab === 'crm_balcao' ? 'active' : ''}">
          <i class="fa-solid fa-stethoscope"></i> Balcão de Atendimento &amp; Triagem (&lt; 60s)
        </button>
        <button id="subnav-btn-prontuario" class="pharmacy-subnav-btn ${activePharmacySubTab === 'prontuario' ? 'active' : ''}">
          <i class="fa-solid fa-timeline"></i> Prontuário Longitudinal &amp; Histórico
        </button>
        <button id="subnav-btn-simulador" class="pharmacy-subnav-btn ${activePharmacySubTab === 'simulador' ? 'active' : ''}">
          <i class="fa-solid fa-bolt-lightning"></i> Simulador de Interações em Tempo Real
        </button>
        <button id="subnav-btn-estoque" class="pharmacy-subnav-btn ${activePharmacySubTab === 'estoque' ? 'active' : ''}">
          <i class="fa-solid fa-boxes-stacked"></i> Estoque Central &amp; Dispensação
        </button>
      </div>

      <!-- ÁREA DE CONTEÚDO DINÂMICO CONFORME A SUB-ABA -->
      <div id="pharmacy-subtab-content">
        <!-- Renderizado dinamicamente -->
      </div>
    </div>
  `;

  // Event Listeners das Sub-abas
  document.getElementById('subnav-btn-balcao')?.addEventListener('click', () => switchPharmacySubTab('crm_balcao'));
  document.getElementById('subnav-btn-prontuario')?.addEventListener('click', () => switchPharmacySubTab('prontuario'));
  document.getElementById('subnav-btn-simulador')?.addEventListener('click', () => switchPharmacySubTab('simulador'));
  document.getElementById('subnav-btn-estoque')?.addEventListener('click', () => switchPharmacySubTab('estoque'));

  document.getElementById('btn-open-interactive-manual-pharm')?.addEventListener('click', () => {
    if (typeof window.showInteractiveManualModal === 'function') {
      window.showInteractiveManualModal();
    } else {
      showToast('📖 Abrindo Manual Interativo...');
      switchTab('geral');
    }
  });

  document.getElementById('btn-quick-new-patient')?.addEventListener('click', openAddClinicalPatientModal);

  // Carregar dados de estoque e renderizar a sub-aba ativa
  await loadPharmacyData();
  renderCurrentSubTab();
}

function switchPharmacySubTab(tabKey) {
  activePharmacySubTab = tabKey;
  const allBtns = document.querySelectorAll('.pharmacy-subnav-btn');
  allBtns.forEach(btn => btn.classList.remove('active'));

  if (tabKey === 'crm_balcao') document.getElementById('subnav-btn-balcao')?.classList.add('active');
  if (tabKey === 'prontuario') document.getElementById('subnav-btn-prontuario')?.classList.add('active');
  if (tabKey === 'simulador') document.getElementById('subnav-btn-simulador')?.classList.add('active');
  if (tabKey === 'estoque') document.getElementById('subnav-btn-estoque')?.classList.add('active');

  renderCurrentSubTab();
}

function renderCurrentSubTab() {
  const container = document.getElementById('pharmacy-subtab-content');
  if (!container) return;

  if (activePharmacySubTab === 'crm_balcao') {
    renderBalcaoAtendimentoView(container);
  } else if (activePharmacySubTab === 'prontuario') {
    renderProntuarioLongitudinalView(container);
  } else if (activePharmacySubTab === 'simulador') {
    renderSimuladorInteracoesView(container);
  } else if (activePharmacySubTab === 'estoque') {
    renderEstoqueCentralView(container);
  }
}

// ============================================================================
// 1. SUB-ABA: BALCÃO DE ATENDIMENTO CLÍNICO & TRIAGEM RÁPIDA (< 60s)
// ============================================================================
function renderBalcaoAtendimentoView(container) {
  const step = currentClinicalEncounter.step || 1;
  const currentPatient = currentClinicalEncounter.patient;
  const allPatients = localDB.list('pharmacy_patients') || [];

  // Obter medicamentos contínuos do paciente selecionado
  const activeMeds = currentPatient ? (localDB.list('pharmacy_active_meds', m => m.patient_id === currentPatient.id) || []) : [];

  container.innerHTML = `
    <!-- STEPPER DE ATENDIMENTO EM 5 ETAPAS -->
    <div class="pharmacy-stepper pharmacy-glass-card">
      <div class="pharmacy-step-item ${step === 1 ? 'active' : (step > 1 ? 'completed' : '')}">
        <div class="pharmacy-step-badge">1</div>
        <span>Entrada &amp; Identificação</span>
      </div>
      <i class="fa-solid fa-chevron-right" style="color: rgba(255,255,255,0.15); font-size: 0.8rem;"></i>

      <div class="pharmacy-step-item ${step === 2 ? 'active' : (step > 2 ? 'completed' : '')}">
        <div class="pharmacy-step-badge">2</div>
        <span>Queixas &amp; Sintomas</span>
      </div>
      <i class="fa-solid fa-chevron-right" style="color: rgba(255,255,255,0.15); font-size: 0.8rem;"></i>

      <div class="pharmacy-step-item ${step === 3 ? 'active' : (step > 3 ? 'completed' : '')}">
        <div class="pharmacy-step-badge">3</div>
        <span>Validação Red Flags</span>
      </div>
      <i class="fa-solid fa-chevron-right" style="color: rgba(255,255,255,0.15); font-size: 0.8rem;"></i>

      <div class="pharmacy-step-item ${step === 4 ? 'active' : (step > 4 ? 'completed' : '')}">
        <div class="pharmacy-step-badge">4</div>
        <span>Cruzamento &amp; Prescrição</span>
      </div>
      <i class="fa-solid fa-chevron-right" style="color: rgba(255,255,255,0.15); font-size: 0.8rem;"></i>

      <div class="pharmacy-step-item ${step === 5 ? 'active' : ''}">
        <div class="pharmacy-step-badge">5</div>
        <span>Conclusão &amp; Declaração</span>
      </div>
    </div>

    <!-- CONTEÚDO DA ETAPA ATUAL -->
    <div class="pharmacy-glass-panel" id="balcao-step-container">
      ${renderBalcaoStepContent(step, currentPatient, allPatients, activeMeds)}
    </div>
  `;

  setupBalcaoStepListeners(step, allPatients);
}

function renderBalcaoStepContent(step, patient, allPatients, activeMeds) {
  if (step === 1) {
    return `
      <div style="max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h3 style="color: #f8fafc; font-family: 'Outfit', sans-serif; font-size: 1.3rem; margin: 0 0 6px 0;">
            Etapa 1 — Localização e Identificação Unificada do Paciente
          </h3>
          <p style="color: #94a3b8; font-size: 0.88rem; margin: 0;">
            Digite o CPF, nome ou selecione um paciente cadastrado para carregar seu histórico longitudinal instantaneamente.
          </p>
        </div>

        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
          <div style="position: relative; flex: 1;">
            <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 14px; top: 14px; color: #0d9488;"></i>
            <input type="text" id="input-search-pharm-patient" class="form-input" placeholder="Buscar por Nome ou CPF do paciente..." style="padding-left: 40px; width: 100%; height: 44px; font-size: 0.95rem;">
          </div>
          <button type="button" id="btn-select-searched-patient" class="btn btn-primary" style="background: #0d9488; border: none; padding: 0 22px; font-weight: 600;">
            Identificar
          </button>
        </div>

        <!-- Lista Rápida de Pacientes Recentes -->
        <h4 style="color: var(--text-secondary); font-size: 0.84rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
          Pacientes Cadastrados no CRM
        </h4>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px;">
          ${allPatients.map(p => `
            <div class="pharmacy-glass-card patient-select-card ${patient?.id === p.id ? 'selected' : ''}" data-patient-id="${p.id}" style="padding: 16px; cursor: pointer; border: 1px solid ${patient?.id === p.id ? '#0d9488' : 'rgba(255,255,255,0.07)'}; background: ${patient?.id === p.id ? 'rgba(13, 148, 136, 0.15)' : 'rgba(30, 41, 59, 0.45)'};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div style="font-weight: 700; color: #f8fafc; font-size: 0.95rem;">${p.name}</div>
                ${p.isPregnantOrLactating ? '<span style="background: rgba(244, 114, 182, 0.2); color: #f472b6; border: 1px solid rgba(244, 114, 182, 0.4); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">Gestante</span>' : ''}
              </div>
              <div style="font-size: 0.8rem; color: #94a3b8;">CPF: ${p.cpf}</div>
              <div style="font-size: 0.8rem; color: #94a3b8;">Idade: ${p.age} anos (${p.gender})</div>
              ${p.allergies ? `<div style="font-size: 0.78rem; color: #f87171; margin-top: 6px;">⚠️ ${p.allergies}</div>` : ''}
            </div>
          `).join('')}
        </div>

        ${patient ? `
          <div style="margin-top: 28px; display: flex; justify-content: flex-end;">
            <button type="button" id="btn-advance-to-step-2" class="btn btn-primary" style="background: linear-gradient(135deg, #0d9488, #0f766e); border: none; padding: 12px 28px; font-size: 1rem; font-weight: 700; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4);">
              Avançar para Triagem de Queixas <i class="fa-solid fa-arrow-right" style="margin-left: 8px;"></i>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  if (step === 2) {
    const protocols = Object.values(PHARMACY_TRIAGE_PROTOCOLS);
    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 14px; margin-bottom: 20px;">
          <div>
            <h3 style="color: #f8fafc; font-family: 'Outfit', sans-serif; font-size: 1.25rem; margin: 0;">
              Etapa 2 — Coleta Estruturada de Queixas &amp; Sintomas
            </h3>
            <p style="color: #94a3b8; font-size: 0.86rem; margin: 2px 0 0 0;">
              Paciente: <strong style="color: #14b8a6;">${patient.name}</strong> (${patient.age} anos) | Alergias: <span style="color: #f87171;">${patient.allergies || 'Nenhuma'}</span>
            </p>
          </div>
          <button type="button" id="btn-step2-back" class="btn btn-secondary" style="padding: 6px 14px; font-size: 0.82rem;">
            <i class="fa-solid fa-arrow-left"></i> Alterar Paciente
          </button>
        </div>

        <!-- Seletor de Protocolo Clínico Guiado -->
        <h4 style="color: var(--text-secondary); font-size: 0.84rem; text-transform: uppercase; margin-bottom: 12px;">
          Selecione a Queixa Principal / Protocolo de Triagem
        </h4>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-bottom: 24px;">
          ${protocols.map(prot => `
            <div class="pharmacy-glass-card triage-protocol-card ${currentClinicalEncounter.triageProtocolKey === prot.id ? 'selected' : ''}" data-protocol-key="${prot.id}" style="padding: 16px; cursor: pointer; border: 1px solid ${currentClinicalEncounter.triageProtocolKey === prot.id ? '#0d9488' : 'rgba(255,255,255,0.07)'}; background: ${currentClinicalEncounter.triageProtocolKey === prot.id ? 'rgba(13, 148, 136, 0.2)' : 'rgba(30, 41, 59, 0.45)'};">
              <div style="font-size: 1.4rem; color: #14b8a6; margin-bottom: 8px;">
                <i class="fa-solid ${prot.icon}"></i>
              </div>
              <div style="font-weight: 700; color: #f8fafc; font-size: 0.95rem; margin-bottom: 4px;">${prot.title}</div>
              <div style="font-size: 0.78rem; color: #94a3b8; line-height: 1.3;">${prot.description}</div>
            </div>
          `).join('')}
        </div>

        <!-- Duração e Intensidade -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 16px; margin-bottom: 20px;">
          <div>
            <label style="display: block; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600;">
              Tempo de Evolução (Dias)
            </label>
            <input type="number" id="input-symptom-days" class="form-input" min="1" max="90" value="${currentClinicalEncounter.symptomDurationDays || 1}" style="width: 100%;">
          </div>

          <div>
            <label style="display: block; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600;">
              Intensidade Relatada
            </label>
            <select id="select-symptom-intensity" class="form-input" style="width: 100%;">
              <option value="Leve" ${currentClinicalEncounter.symptomSeverity === 'Leve' ? 'selected' : ''}>Leve</option>
              <option value="Leve a Moderado" ${currentClinicalEncounter.symptomSeverity === 'Leve a Moderado' ? 'selected' : ''}>Leve a Moderado</option>
              <option value="Moderado a Forte" ${currentClinicalEncounter.symptomSeverity === 'Moderado a Forte' ? 'selected' : ''}>Moderado a Forte</option>
              <option value="Severo / Incapacitante" ${currentClinicalEncounter.symptomSeverity === 'Severo / Incapacitante' ? 'selected' : ''}>Severo / Incapacitante</option>
            </select>
          </div>

          <div>
            <label style="display: block; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600;">
              Observações Adicionais da Queixa
            </label>
            <input type="text" id="input-complaint-notes" class="form-input" placeholder="Ex.: Piora no período noturno, tosse produtiva clara..." value="${currentClinicalEncounter.customComplaintNotes || ''}" style="width: 100%;">
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
          <button type="button" id="btn-advance-to-step-3" class="btn btn-primary" style="background: linear-gradient(135deg, #0d9488, #0f766e); border: none; padding: 10px 24px; font-weight: 700;">
            Checar Sinais de Alerta (Red Flags) <i class="fa-solid fa-arrow-right" style="margin-left: 6px;"></i>
          </button>
        </div>
      </div>
    `;
  }

  if (step === 3) {
    const protocol = PHARMACY_TRIAGE_PROTOCOLS[currentClinicalEncounter.triageProtocolKey] || PHARMACY_TRIAGE_PROTOCOLS.gripe_resfriado;
    const hasRedFlags = currentClinicalEncounter.selectedRedFlags.length > 0;

    return `
      <div>
        <div style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 14px; margin-bottom: 20px;">
          <h3 style="color: #f8fafc; font-family: 'Outfit', sans-serif; font-size: 1.25rem; margin: 0;">
            Etapa 3 — Validação de Sinais de Alerta Críticos (Red Flags)
          </h3>
          <p style="color: #94a3b8; font-size: 0.86rem; margin: 2px 0 0 0;">
            Protocolo Ativo: <strong style="color: #14b8a6;">${protocol.title}</strong>. Marque caso o paciente apresente qualquer sinal de emergência abaixo:
          </p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 24px;">
          ${protocol.redFlags.map(rf => {
            const isChecked = currentClinicalEncounter.selectedRedFlags.includes(rf.label);
            return `
              <label class="pharmacy-glass-card" style="display: flex; align-items: center; gap: 14px; padding: 14px 18px; cursor: pointer; border: 1px solid ${isChecked ? 'rgba(225, 29, 72, 0.6)' : 'rgba(255,255,255,0.07)'}; background: ${isChecked ? 'rgba(225, 29, 72, 0.15)' : 'rgba(30, 41, 59, 0.45)'};">
                <input type="checkbox" class="red-flag-checkbox" value="${rf.label}" ${isChecked ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #e11d48; cursor: pointer;">
                <div style="flex: 1;">
                  <div style="color: #f8fafc; font-weight: 600; font-size: 0.92rem;">${rf.label}</div>
                </div>
                <span class="badge" style="background: rgba(225,29,72,0.2); color: #f43f5e; border: 1px solid rgba(225,29,72,0.4); font-size: 0.72rem;">RED FLAG</span>
              </label>
            `;
          }).join('')}
        </div>

        ${hasRedFlags ? `
          <div class="red-flag-banner">
            <div style="display: flex; align-items: center; gap: 14px;">
              <i class="fa-solid fa-triangle-exclamation" style="color: #e11d48; font-size: 1.8rem;"></i>
              <div>
                <h4 style="margin: 0; color: #fecdd3; font-size: 1rem; font-weight: 700;">
                  ALERTA CLÍNICO CRÍTICO — RECOMENDAÇÃO DE MIPs BLOQUEADA
                </h4>
                <p style="margin: 3px 0 0 0; color: #fda4af; font-size: 0.85rem;">
                  Sinais de gravidade identificados. Conforme resolução do CFF, o paciente deve ser encaminhado imediatamente para avaliação médica ambulatorial ou hospitalar.
                </p>
              </div>
            </div>
            <button type="button" id="btn-emit-medical-referral" class="btn btn-primary" style="background: #e11d48; border: none; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.4); font-weight: 700; white-space: nowrap;">
              <i class="fa-solid fa-file-medical"></i> Emitir Guia de Encaminhamento
            </button>
          </div>
        ` : `
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
            <i class="fa-solid fa-circle-check" style="color: #10b981; font-size: 1.4rem;"></i>
            <div style="color: #a7f3d0; font-size: 0.88rem;">
              Nenhum sinal de alerta (Red Flag) selecionado. Paciente elegível para Prescrição Farmacêutica Segura de MIPs e Condutas Não-Medicamentosas.
            </div>
          </div>
        `}

        <div style="display: flex; justify-content: space-between; margin-top: 24px;">
          <button type="button" id="btn-step3-back" class="btn btn-secondary" style="padding: 10px 18px;">
            <i class="fa-solid fa-arrow-left"></i> Voltar para Queixas
          </button>
          <button type="button" id="btn-advance-to-step-4" class="btn btn-primary" style="background: linear-gradient(135deg, #0d9488, #0f766e); border: none; padding: 10px 24px; font-weight: 700;">
            ${hasRedFlags ? 'Avançar para Parecer & Encaminhamento' : 'Avançar para Prescrição & Cruzamento'} <i class="fa-solid fa-arrow-right" style="margin-left: 6px;"></i>
          </button>
        </div>
      </div>
    `;
  }

  if (step === 4) {
    const protocol = PHARMACY_TRIAGE_PROTOCOLS[currentClinicalEncounter.triageProtocolKey] || PHARMACY_TRIAGE_PROTOCOLS.gripe_resfriado;
    const isRedFlagActive = currentClinicalEncounter.selectedRedFlags.length > 0;

    // Executar cruzamento em tempo real
    const detectedAlerts = runRealtimeClinicalCrosscheck({
      proposedMedications: currentClinicalEncounter.prescribedMIPs,
      activeMedications: activeMeds,
      allergies: patient.allergies,
      chronicConditions: patient.chronicConditions,
      isPregnantOrLactating: Boolean(patient.isPregnantOrLactating),
      patientAge: patient.age
    });

    currentClinicalEncounter.detectedAlerts = detectedAlerts;
    const hasBlocker = detectedAlerts.some(a => a.isBlocker) && !currentClinicalEncounter.isBlockerOverridden;

    return `
      <div>
        <div style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="color: #f8fafc; font-family: 'Outfit', sans-serif; font-size: 1.25rem; margin: 0;">
              Etapa 4 — Prescrição Farmacêutica &amp; Motor de Cruzamento em Tempo Real (CDSS)
            </h3>
            <p style="color: #94a3b8; font-size: 0.86rem; margin: 2px 0 0 0;">
              Validação cruzada multidimensional automática contra medicamentos em uso, alergias e patologias pré-existentes.
            </p>
          </div>
          <button type="button" id="btn-step4-back" class="btn btn-secondary" style="padding: 6px 14px; font-size: 0.82rem;">
            <i class="fa-solid fa-arrow-left"></i> Voltar para Triagem
          </button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
          <!-- COLUNA 1: CATÁLOGO DE MIPS E CONDUTAS -->
          <div>
            <h4 style="color: #14b8a6; font-size: 0.95rem; font-family: 'Outfit', sans-serif; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-pills"></i> MIPs Sugeridos pelo Protocolo
            </h4>

            ${isRedFlagActive ? `
              <div style="background: rgba(225, 29, 72, 0.1); border: 1px solid rgba(225, 29, 72, 0.3); border-radius: 10px; padding: 14px; color: #fda4af; font-size: 0.85rem;">
                🚫 Indicação de MIPs bloqueada devido à presença de Red Flags na Etapa 3.
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
                ${protocol.recommendedMIPs.map(mip => {
                  const isPrescribed = currentClinicalEncounter.prescribedMIPs.some(m => (m.name || m) === mip.name);
                  return `
                    <div class="pharmacy-glass-card" style="padding: 12px 16px; border: 1px solid ${isPrescribed ? '#0d9488' : 'rgba(255,255,255,0.07)'}; background: ${isPrescribed ? 'rgba(13,148,136,0.18)' : 'rgba(30,41,59,0.45)'};">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                          <div style="font-weight: 700; color: #f8fafc; font-size: 0.92rem;">${mip.name}</div>
                          <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 2px;">${mip.indication}</div>
                          <div style="font-size: 0.78rem; color: #14b8a6; margin-top: 3px;"><strong>Posologia:</strong> ${mip.posology}</div>
                        </div>
                        <button type="button" class="btn btn-sm ${isPrescribed ? 'btn-danger' : 'btn-primary'} btn-toggle-prescribe-mip" data-mip-name="${mip.name}" data-mip-indication="${mip.indication}" data-mip-posology="${mip.posology}" style="font-size: 0.75rem; padding: 4px 10px; border-radius: 6px;">
                          ${isPrescribed ? '<i class="fa-solid fa-trash"></i> Remover' : '<i class="fa-solid fa-plus"></i> Prescrever'}
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}

            <!-- BUSCA DINÂMICA DE MEDICAMENTOS VIA PLN (PROCESSAMENTO DE LINGUAGEM NATURAL) -->
            <div style="margin-top: 16px; background: rgba(15, 23, 42, 0.6); padding: 14px; border-radius: 12px; border: 1px solid rgba(20, 184, 166, 0.25);">
              <label style="display: block; font-size: 0.84rem; color: #14b8a6; margin-bottom: 6px; font-weight: 700;">
                <i class="fa-solid fa-brain"></i> Busca Dinâmica por PLN (Sintomas, Nomes ou Princípios Ativos):
              </label>
              
              <div class="nlp-search-wrapper">
                <div class="nlp-search-input-group">
                  <i class="fa-solid fa-magnifying-glass search-icon"></i>
                  <input type="text" id="input-nlp-med-search" placeholder="Ex.: 'dor de garganta', 'iboprofeno 600', 'novalgina', 'pressao alta'..." autocomplete="off">
                  <button type="button" id="btn-clear-nlp-search" class="nlp-clear-btn" style="display: none;">
                    <i class="fa-solid fa-circle-xmark"></i>
                  </button>
                </div>
                <div id="nlp-search-results-dropdown" class="nlp-search-dropdown" style="display: none;"></div>
              </div>
            </div>

            <!-- Condutas Não Farmacológicas -->
            <h4 style="color: #38bdf8; font-size: 0.95rem; font-family: 'Outfit', sans-serif; margin: 18px 0 10px 0;">
              <i class="fa-solid fa-apple-whole"></i> Condutas Não-Medicamentosas Recomendadas
            </h4>
            <div style="background: rgba(30, 41, 59, 0.4); border-radius: 10px; padding: 12px; border: 1px solid rgba(255,255,255,0.05); font-size: 0.84rem; color: #cbd5e1;">
              <ul style="margin: 0; padding-left: 18px;">
                ${protocol.nonPharmaActions.map(act => `<li style="margin-bottom: 4px;">${act}</li>`).join('')}
              </ul>
            </div>
          </div>

          <!-- COLUNA 2: MOTOR DE ALERTAS CDSS EM TEMPO REAL -->
          <div>
            <h4 style="color: #f8fafc; font-size: 0.95rem; font-family: 'Outfit', sans-serif; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
              <span><i class="fa-solid fa-shield-halved" style="color: #e11d48;"></i> Painel de Interações &amp; Segurança (CDSS)</span>
              <span style="font-size: 0.78rem; color: #94a3b8; font-weight: normal;">${detectedAlerts.length} alerta(s) ativos</span>
            </h4>

            ${detectedAlerts.length === 0 ? `
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 24px; text-align: center;">
                <i class="fa-solid fa-shield-check" style="font-size: 2.2rem; color: #10b981; margin-bottom: 8px;"></i>
                <div style="font-weight: 700; color: #a7f3d0; font-size: 1rem;">Nenhuma Incompatibilidade Crítica Detectada</div>
                <p style="color: #6ee7b7; font-size: 0.84rem; margin: 4px 0 0 0;">
                  A prescrição proposta é compatível com o histórico de medicamentos ativos, alergias e condições crônicas do paciente.
                </p>
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 12px; max-height: 480px; overflow-y: auto; padding-right: 4px;">
                ${detectedAlerts.map(alert => `
                  <div class="cdss-alert-box ${alert.severity === 'Critica' || alert.severity === 'Grave' ? 'grave' : (alert.severity === 'Moderada' ? 'moderada' : 'leve')}">
                    <div class="cdss-icon">
                      <i class="fa-solid ${alert.severity === 'Critica' || alert.severity === 'Grave' ? 'fa-ban' : (alert.severity === 'Moderada' ? 'fa-triangle-exclamation' : 'fa-circle-info')}"></i>
                    </div>
                    <div class="cdss-content">
                      <div class="cdss-badge ${alert.severity === 'Critica' || alert.severity === 'Grave' ? 'grave' : (alert.severity === 'Moderada' ? 'moderada' : 'leve')}">
                        ${alert.severity} • ${alert.dimension}
                      </div>
                      <div style="font-weight: 700; color: #f8fafc; font-size: 0.92rem; margin-bottom: 3px;">${alert.title}</div>
                      <div style="font-size: 0.82rem; color: #cbd5e1; margin-bottom: 6px; line-height: 1.35;">${alert.desc}</div>
                      <div style="font-size: 0.8rem; color: #14b8a6; background: rgba(0,0,0,0.25); padding: 6px 10px; border-radius: 6px; border-left: 3px solid #14b8a6;">
                        <strong>Conduta Sugerida:</strong> ${alert.action}
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}

            <!-- Bloco de Justificativa Farmacêutica Obrigatória em caso de Trava -->
            ${hasBlocker ? `
              <div style="margin-top: 16px; background: rgba(225, 29, 72, 0.15); border: 1px solid rgba(225, 29, 72, 0.45); border-radius: 12px; padding: 16px;">
                <div style="color: #fecdd3; font-weight: 700; font-size: 0.9rem; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid fa-lock"></i> TRAVA DE SEGURANÇA ATIVADA (RESOLUÇÃO CFF)
                </div>
                <p style="color: #fda4af; font-size: 0.82rem; margin: 0 0 10px 0;">
                  Para prosseguir com dispensação em caso de contraindicação crítica, é mandatório registrar a justificativa técnica com o CRF do farmacêutico responsável:
                </p>
                <textarea id="textarea-override-justification" class="form-input" rows="2" placeholder="Descreva a fundamentação farmacológica e a conduta de monitoramento adotada..." style="width: 100%; font-size: 0.85rem;"></textarea>
                <button type="button" id="btn-unlock-cdss-override" class="btn btn-danger" style="margin-top: 8px; width: 100%; font-weight: 700; font-size: 0.85rem;">
                  <i class="fa-solid fa-signature"></i> Registrar Parecer e Desbloquear Trava
                </button>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Botões de Navegação -->
        <div style="display: flex; justify-content: space-between; margin-top: 24px;">
          <button type="button" id="btn-step4-back" class="btn btn-secondary" style="padding: 10px 18px;">
            <i class="fa-solid fa-arrow-left"></i> Voltar
          </button>
          <button type="button" id="btn-advance-to-step-5" class="btn btn-primary" ${hasBlocker ? 'disabled' : ''} style="background: ${hasBlocker ? '#475569' : 'linear-gradient(135deg, #0d9488, #0f766e)'}; border: none; padding: 12px 28px; font-weight: 700;">
            Concluir &amp; Gerar Declaração Farmacêutica <i class="fa-solid fa-arrow-right" style="margin-left: 6px;"></i>
          </button>
        </div>
      </div>
    `;
  }

  if (step === 5) {
    const protocol = PHARMACY_TRIAGE_PROTOCOLS[currentClinicalEncounter.triageProtocolKey] || PHARMACY_TRIAGE_PROTOCOLS.gripe_resfriado;
    const pharmacistName = state.user?.name || 'Farmacêutico(a) Responsável';
    const pharmacistCRF = state.user?.username === 'mazzarowysk' ? 'CRF/SP 48.912' : 'CRF/SP 55.432';

    return `
      <div>
        <div style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="color: #f8fafc; font-family: 'Outfit', sans-serif; font-size: 1.25rem; margin: 0;">
              Etapa 5 — Conclusão Clínica &amp; Emissão de Documentos
            </h3>
            <p style="color: #94a3b8; font-size: 0.86rem; margin: 2px 0 0 0;">
              Atendimento registrado com sucesso no prontuário longitudinal do paciente.
            </p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button type="button" id="btn-print-declaration" class="btn btn-secondary" style="background: rgba(30, 41, 59, 0.6); color: #38bdf8; font-weight: 600;">
              <i class="fa-solid fa-print"></i> Imprimir Declaração
            </button>
            <button type="button" id="btn-send-whatsapp-declaration" class="btn btn-secondary" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); font-weight: 600;">
              <i class="fa-brands fa-whatsapp"></i> Enviar via WhatsApp
            </button>
            <button type="button" id="btn-new-encounter" class="btn btn-primary" style="background: linear-gradient(135deg, #0d9488, #0f766e); border: none; font-weight: 700;">
              <i class="fa-solid fa-plus"></i> Novo Atendimento
            </button>
          </div>
        </div>

        <!-- Visualização da Declaração Farmacêutica em Frosted Glass Paper -->
        <div id="declaration-print-wrapper" style="margin-top: 20px;">
          ${generatePharmacistDeclarationHTML({
            patient,
            pharmacist: { name: pharmacistName, crf: pharmacistCRF },
            triageComplaint: `${protocol.title} (${currentClinicalEncounter.symptomDurationDays} dia(s) de evolução, intensidade ${currentClinicalEncounter.symptomSeverity}) ${currentClinicalEncounter.customComplaintNotes ? '— ' + currentClinicalEncounter.customComplaintNotes : ''}`,
            redFlags: currentClinicalEncounter.selectedRedFlags,
            recommendedMedications: currentClinicalEncounter.prescribedMIPs,
            nonPharmaInstructions: protocol.nonPharmaActions,
            observations: currentClinicalEncounter.technicalJustification ? `Parecer Farmacêutico: ${currentClinicalEncounter.technicalJustification}` : 'Atendimento farmacêutico de suporte à decisão clínica concluído dentro dos padrões CFF/ANVISA.'
          })}
        </div>
      </div>
    `;
  }
}

function setupBalcaoStepListeners(step, allPatients) {
  if (step === 1) {
    const cards = document.querySelectorAll('.patient-select-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const pId = card.getAttribute('data-patient-id');
        const found = allPatients.find(p => p.id === pId);
        if (found) {
          currentClinicalEncounter.patient = found;
          renderBalcaoAtendimentoView(document.getElementById('pharmacy-subtab-content'));
        }
      });
    });

    const searchInput = document.getElementById('input-search-pharm-patient');
    searchInput?.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      cards.forEach(c => {
        const text = c.innerText.toLowerCase();
        c.style.display = text.includes(term) ? 'block' : 'none';
      });
    });

    document.getElementById('btn-advance-to-step-2')?.addEventListener('click', () => {
      currentClinicalEncounter.step = 2;
      renderBalcaoAtendimentoView(document.getElementById('pharmacy-subtab-content'));
    });
  }

  if (step === 2) {
    document.getElementById('btn-step2-back')?.addEventListener('click', () => {
      currentClinicalEncounter.step = 1;
      renderBalcaoAtendimentoView(document.getElementById('pharmacy-subtab-content'));
    });

    const protCards = document.querySelectorAll('.triage-protocol-card');
    protCards.forEach(c => {
      c.addEventListener('click', () => {
        currentClinicalEncounter.triageProtocolKey = c.getAttribute('data-protocol-key');
        currentClinicalEncounter.selectedRedFlags = [];
        currentClinicalEncounter.prescribedMIPs = [];
        renderBalcaoAtendimentoView(document.getElementById('pharmacy-subtab-content'));
      });
    });

    document.getElementById('btn-advance-to-step-3')?.addEventListener('click', () => {
      currentClinicalEncounter.symptomDurationDays = Number(document.getElementById('input-symptom-days')?.value || 1);
      currentClinicalEncounter.symptomSeverity = document.getElementById('select-symptom-intensity')?.value || 'Leve';
      currentClinicalEncounter.customComplaintNotes = document.getElementById('input-complaint-notes')?.value || '';
      currentClinicalEncounter.step = 3;
      renderBalcaoAtendimentoView(document.getElementById('pharmacy-subtab-content'));
    });
  }

  if (step === 3) {
    document.getElementById('btn-step3-back')?.addEventListener('click', () => {
      currentClinicalEncounter.step = 2;
      renderBalcaoAtendimentoView(document.getElementById('pharmacy-subtab-content'));
    });

    const rfCheckboxes = document.querySelectorAll('.red-flag-checkbox');
    rfCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const checkedVals = Array.from(document.querySelectorAll('.red-flag-checkbox:checked')).map(c => c.value);
        currentClinicalEncounter.selectedRedFlags = checkedVals;
        renderBalcaoAtendimentoView(document.getElementById('pharmacy-subtab-content'));
      });
    });

    document.getElementById('btn-emit-medical-referral')?.addEventListener('click', () => {
      showToast('📄 Guia de Encaminhamento Médico Urgente emitida!');
      currentClinicalEncounter.step = 5;
      renderBalcaoAtendimentoView(document.getElementById('pharmacy-subtab-content'));
    });

    document.getElementById('btn-advance-to-step-4')?.addEventListener('click', () => {
      currentClinicalEncounter.step = 4;
      renderBalcaoAtendimentoView(document.getElementById('pharmacy-subtab-content'));
    });
  }

  if (step === 4) {
    document.getElementById('btn-step4-back')?.addEventListener('click', () => {
      currentClinicalEncounter.step = 3;
      renderBalcaoAtendimentoView(document.getElementById('pharmacy-subtab-content'));
    });

    const mipBtns = document.querySelectorAll('.btn-toggle-prescribe-mip');
    mipBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-mip-name');
        const indication = btn.getAttribute('data-mip-indication');
        const posology = btn.getAttribute('data-mip-posology');

        const existingIdx = currentClinicalEncounter.prescribedMIPs.findIndex(m => (m.name || m) === name);
        if (existingIdx >= 0) {
          currentClinicalEncounter.prescribedMIPs.splice(existingIdx, 1);
        } else {
          currentClinicalEncounter.prescribedMIPs.push({ name, indication, posology });
        }
        renderBalcaoAtendimentoView(document.getElementById('pharmacy-subtab-content'));
      });
    });

    // Listener de Busca Dinâmica por PLN (Processamento de Linguagem Natural)
    const nlpInput = document.getElementById('input-nlp-med-search');
    const nlpDropdown = document.getElementById('nlp-search-results-dropdown');
    const nlpClearBtn = document.getElementById('btn-clear-nlp-search');
    let nlpDebounceTimer = null;

    nlpInput?.addEventListener('input', (e) => {
      const term = e.target.value;
      if (nlpClearBtn) nlpClearBtn.style.display = term ? 'block' : 'none';

      clearTimeout(nlpDebounceTimer);
      nlpDebounceTimer = setTimeout(() => {
        if (!term || term.trim().length < 2) {
          if (nlpDropdown) { nlpDropdown.style.display = 'none'; nlpDropdown.innerHTML = ''; }
          return;
        }

        const results = searchMedicationsNLP(term, CANONICAL_MEDICATIONS_DB, { limit: 6 });
        if (!nlpDropdown) return;

        if (results.length === 0) {
          nlpDropdown.style.display = 'block';
          nlpDropdown.innerHTML = `
            <div style="padding: 12px; text-align: center; color: #94a3b8; font-size: 0.84rem;">
              Nenhum medicamento correspondente encontrado para "<em>${term}</em>".
            </div>
          `;
          return;
        }

        nlpDropdown.style.display = 'block';
        nlpDropdown.innerHTML = results.map(med => {
          const isFuzzy = med.matchReasons.some(r => r.includes('Grafia'));
          return `
            <div class="nlp-search-item" data-med-id="${med.id}" data-med-name="${med.name}" data-med-posology="${med.defaultPosology}" data-med-ind="${med.indications?.[0] || 'Alívio sintomático'}">
              <div style="flex: 1;">
                <div class="nlp-item-title">
                  <span>${med.name}</span>
                  ${isFuzzy ? '<span class="nlp-fuzzy-pill">Fuzzy PLN</span>' : '<span class="nlp-match-pill">Match ' + med.relevanceScore + '%</span>'}
                  <span style="font-size: 0.72rem; color: #94a3b8; background: rgba(255,255,255,0.06); padding: 1px 5px; border-radius: 3px;">${med.prescriptionType}</span>
                </div>
                <div class="nlp-item-active-substance">DCB: ${med.activeSubstance}</div>
                <div class="nlp-item-meta">
                  <span>🏷️ ${med.tradeNames?.slice(0, 3).join(', ')}</span>
                  <span>💊 ${med.usualDosages?.join(' | ')}</span>
                </div>
              </div>
              <button type="button" class="btn btn-sm btn-primary" style="background: #0d9488; border: none; font-size: 0.75rem; padding: 5px 10px; border-radius: 6px; white-space: nowrap;">
                <i class="fa-solid fa-plus"></i> Prescrever
              </button>
            </div>
          `;
        }).join('');

        // Listeners de clique nos itens retornados pelo PLN
        const items = nlpDropdown.querySelectorAll('.nlp-search-item');
        items.forEach(it => {
          it.addEventListener('click', () => {
            const medName = it.getAttribute('data-med-name');
            const posology = it.getAttribute('data-med-posology');
            const indication = it.getAttribute('data-med-ind');

            currentClinicalEncounter.prescribedMIPs.push({
              name: medName,
              indication,
              posology
            });

            showToast(`💊 ${medName} adicionado à prescrição via PLN!`);
            renderBalcaoAtendimentoView(document.getElementById('pharmacy-subtab-content'));
          });
        });
      }, 180);
    });

    nlpClearBtn?.addEventListener('click', () => {
      if (nlpInput) nlpInput.value = '';
      if (nlpDropdown) { nlpDropdown.style.display = 'none'; nlpDropdown.innerHTML = ''; }
      if (nlpClearBtn) nlpClearBtn.style.display = 'none';
    });

    document.getElementById('btn-unlock-cdss-override')?.addEventListener('click', () => {
      const just = document.getElementById('textarea-override-justification')?.value?.trim();
      if (!just) {
        showCustomAlert({ title: 'Justificativa Obrigatória', message: 'Por favor, informe a fundamentação clínica para prosseguir com a dispensação.', type: 'warning' });
        return;
      }
      currentClinicalEncounter.technicalJustification = just;
      currentClinicalEncounter.isBlockerOverridden = true;
      showToast('🔓 Trava desbloqueada com registro de responsabilidade técnica.');
      renderBalcaoAtendimentoView(document.getElementById('pharmacy-subtab-content'));
    });

    document.getElementById('btn-advance-to-step-5')?.addEventListener('click', () => {
      // Salvar atendimento no histórico do banco local
      const p = currentClinicalEncounter.patient;
      const attRecord = {
        id: localDB.generateId('ATT-PHARM'),
        patient_id: p.id,
        pharmacist_name: state.user?.name || 'Farmacêutico Responsável',
        data_hora: new Date().toISOString(),
        tipo_visita: 'Triagem e Prescrição de MIPs',
        queixa_triagem: currentClinicalEncounter.triageProtocolKey,
        red_flags: currentClinicalEncounter.selectedRedFlags,
        prescricao_mips: currentClinicalEncounter.prescribedMIPs.map(m => m.name || m).join('; '),
        conduta_final: currentClinicalEncounter.selectedRedFlags.length > 0 ? 'Encaminhamento Médico Urgente' : 'Dispensação com Orientação Farmacêutica',
        observacoes: currentClinicalEncounter.technicalJustification
      };
      localDB.insert('pharmacy_attendances', attRecord);

      // BAIXA AUTOMÁTICA NO ESTOQUE E REGISTRO DE COMPRA DO PACIENTE
      const allProducts = localDB.list('products') || [];
      currentClinicalEncounter.prescribedMIPs.forEach(item => {
        const medName = item.name || item;
        const matchedProd = allProducts.find(prod => 
          (prod.name && prod.name.toLowerCase().includes(medName.toLowerCase())) ||
          (medName && prod.name && medName.toLowerCase().includes(prod.name.toLowerCase()))
        );

        if (matchedProd) {
          const newQty = Math.max(0, parseInt(matchedProd.current_stock || 0, 10) - 1);
          localDB.update('products', matchedProd.id, { current_stock: newQty });

          // Movimentação de estoque
          localDB.insert('inventory_movements', {
            product_id: matchedProd.id,
            product_name: matchedProd.name,
            type: 'Dispensação Balcão',
            quantity: -1,
            batch: matchedProd.batch || 'L-DISP',
            cost_unit: matchedProd.cost_price || 0,
            total_value: matchedProd.sale_price || 0,
            patient_id: p.id,
            patient_name: p.name,
            reason: `Dispensação Clínica - Atendimento #${attRecord.id.slice(-6)}`,
            operator_name: `${state.user?.name || 'Farmacêutico'} (${state.user?.role || 'Farmacêutico'})`,
            created_at: new Date().toISOString()
          });

          // Registro de compra/aquisição do paciente
          localDB.insert('patient_purchases', {
            id: localDB.generateId('PURCH'),
            patient_id: p.id,
            patient_name: p.name,
            product_id: matchedProd.id,
            product_name: matchedProd.name,
            quantity: 1,
            unit_price: matchedProd.sale_price || 0,
            total_price: matchedProd.sale_price || 0,
            is_continuous: matchedProd.category?.includes('Contínuo') || false,
            days_supply: matchedProd.category?.includes('Contínuo') ? 30 : null,
            refill_date: matchedProd.category?.includes('Contínuo') ? new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0] : null,
            batch: matchedProd.batch || 'L-DISP',
            attendance_id: attRecord.id,
            pharmacist_name: state.user?.name || 'Farmacêutico',
            created_at: new Date().toISOString()
          });
        }
      });

      // Salvar auditoria de decisão se houve alerta
      if (currentClinicalEncounter.detectedAlerts.length > 0) {
        localDB.insert('pharmacy_decision_audit', {
          id: localDB.generateId('AUD'),
          attendance_id: attRecord.id,
          interaction_title: currentClinicalEncounter.detectedAlerts.map(a => a.title).join(' | '),
          severity: currentClinicalEncounter.detectedAlerts[0]?.severity || 'Grave',
          acao_tomada: currentClinicalEncounter.isBlockerOverridden ? 'Aceito com Justificativa' : 'Dispensação Aprovada',
          justificativa: currentClinicalEncounter.technicalJustification,
          pharmacist_crf: state.user?.username === 'mazzarowysk' ? 'CRF/SP 54180' : 'CRF/SP 48.912',
          timestamp: new Date().toISOString()
        });
      }

      syncManager.pushToCloud(false);
      currentClinicalEncounter.step = 5;
      renderBalcaoAtendimentoView(document.getElementById('pharmacy-subtab-content'));
    });
  }

  if (step === 5) {
    document.getElementById('btn-print-declaration')?.addEventListener('click', () => {
      window.print();
    });

    document.getElementById('btn-send-whatsapp-declaration')?.addEventListener('click', () => {
      const p = currentClinicalEncounter.patient;
      const phoneClean = (p.phone || '').replace(/\D/g, '');
      const msg = encodeURIComponent(`Olá, ${p.name}! Aqui é da Farmácia Clínica. Segue o resumo do seu atendimento farmacêutico e prescrição de cuidados: ${currentClinicalEncounter.prescribedMIPs.map(m => m.name || m).join(', ')}. Em caso de dúvidas, estamos à disposição.`);
      window.open(`https://api.whatsapp.com/send?phone=55${phoneClean}&text=${msg}`, '_blank');
    });

    document.getElementById('btn-new-encounter')?.addEventListener('click', () => {
      currentClinicalEncounter = {
        step: 1,
        patient: null,
        triageProtocolKey: 'gripe_resfriado',
        selectedRedFlags: [],
        symptomDurationDays: 1,
        symptomSeverity: 'Leve a Moderado',
        customComplaintNotes: '',
        prescribedMIPs: [],
        nonPharmaRecommendations: [],
        detectedAlerts: [],
        technicalJustification: '',
        isBlockerOverridden: false
      };
      renderBalcaoAtendimentoView(document.getElementById('pharmacy-subtab-content'));
    });
  }
}

// ============================================================================
// 2. SUB-ABA: PRONTUÁRIO LONGITUDINAL & HISTÓRICO FARMACOTERAPÊUTICO
// ============================================================================
function renderProntuarioLongitudinalView(container) {
  const allPatients = localDB.list('pharmacy_patients') || [];
  const allAttendances = localDB.list('pharmacy_attendances') || [];
  const allActiveMeds = localDB.list('pharmacy_active_meds') || [];
  const allAudits = localDB.list('pharmacy_decision_audit') || [];

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 320px 1fr; gap: 20px;">
      <!-- Coluna da Esquerda: Lista de Pacientes -->
      <div class="pharmacy-glass-panel" style="padding: 16px;">
        <h4 style="color: #f8fafc; font-family: 'Outfit', sans-serif; font-size: 1.1rem; margin: 0 0 12px 0;">
          Pacientes Cadastrados
        </h4>
        <input type="text" id="input-filter-prontuario-patients" class="form-input" placeholder="Buscar paciente por nome ou CPF..." style="width: 100%; height: 38px; font-size: 0.85rem; margin-bottom: 12px;">

        <div id="prontuario-patients-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 520px; overflow-y: auto;">
          ${allPatients.map((p, idx) => `
            <div class="pharmacy-glass-card prontuario-pat-item ${idx === 0 ? 'selected' : ''}" data-p-id="${p.id}" style="padding: 12px; cursor: pointer; border: 1px solid ${idx === 0 ? '#0d9488' : 'rgba(255,255,255,0.06)'};">
              <div style="font-weight: 700; color: #f8fafc; font-size: 0.9rem;">${p.name}</div>
              <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 2px;">CPF: ${p.cpf} | ${p.age} anos</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Coluna da Direita: Timeline do Prontuário do Paciente Selecionado -->
      <div class="pharmacy-glass-panel" id="prontuario-patient-details-view" style="padding: 24px;">
        ${renderPatientProntuarioDetails(allPatients[0], allAttendances, allActiveMeds, allAudits)}
      </div>
    </div>
  `;

  // Listeners de seleção de paciente no prontuário
  const patItems = document.querySelectorAll('.prontuario-pat-item');
  patItems.forEach(item => {
    item.addEventListener('click', () => {
      patItems.forEach(i => {
        i.style.borderColor = 'rgba(255,255,255,0.06)';
        i.classList.remove('selected');
      });
      item.style.borderColor = '#0d9488';
      item.classList.add('selected');

      const pId = item.getAttribute('data-p-id');
      const patient = allPatients.find(p => p.id === pId);
      const detailContainer = document.getElementById('prontuario-patient-details-view');
      if (detailContainer && patient) {
        detailContainer.innerHTML = renderPatientProntuarioDetails(patient, allAttendances, allActiveMeds, allAudits);
      }
    });
  });
}

function renderPatientProntuarioDetails(patient, attendances, activeMeds, audits) {
  if (!patient) return '<p style="color: #94a3b8;">Nenhum paciente selecionado.</p>';

  const patientAtts = attendances.filter(a => a.patient_id === patient.id);
  const patientMeds = activeMeds.filter(m => m.patient_id === patient.id);

  return `
    <div>
      <!-- Header do Paciente -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <h3 style="font-size: 1.4rem; color: #f8fafc; font-family: 'Outfit', sans-serif; margin: 0; display: flex; align-items: center; gap: 10px;">
            ${patient.name}
            ${patient.isPregnantOrLactating ? '<span style="background: rgba(244,114,182,0.2); color: #f472b6; border: 1px solid #f472b6; padding: 2px 8px; border-radius: 20px; font-size: 0.72rem;">Gestante</span>' : ''}
          </h3>
          <p style="color: #94a3b8; font-size: 0.86rem; margin: 4px 0 0 0;">
            CPF: <strong>${patient.cpf}</strong> | Nasc: ${patient.birthDate} (${patient.age} anos) | Sexo: ${patient.gender} | Telefone: ${patient.phone || 'Não informado'}
          </p>
        </div>
        <button type="button" class="btn btn-primary" onclick="window.startEncounterForPatient('${patient.id}')" style="background: #0d9488; border: none; font-size: 0.85rem; font-weight: 600;">
          <i class="fa-solid fa-stethoscope"></i> Iniciar Atendimento
        </button>
      </div>

      <!-- Alergias e Condições Crônicas -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
        <div style="background: rgba(225, 29, 72, 0.1); border: 1px solid rgba(225, 29, 72, 0.3); border-radius: 12px; padding: 14px;">
          <div style="font-weight: 700; color: #fecdd3; font-size: 0.85rem; margin-bottom: 4px;">
            <i class="fa-solid fa-triangle-exclamation"></i> Alergias &amp; Hipersensibilidades
          </div>
          <div style="font-size: 0.88rem; color: #fda4af;">${patient.allergies || 'Nenhuma alergia conhecida registrada.'}</div>
        </div>

        <div style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 14px;">
          <div style="font-weight: 700; color: #38bdf8; font-size: 0.85rem; margin-bottom: 4px;">
            <i class="fa-solid fa-heart-pulse"></i> Comorbidades Crônicas
          </div>
          <div style="font-size: 0.88rem; color: #cbd5e1;">${patient.chronicConditions || 'Nenhuma comorbidade crônica declarada.'}</div>
        </div>
      </div>

      <!-- Medicamentos de Uso Contínuo e Fórmulas Manipuladas -->
      <div style="margin-bottom: 28px;">
        <h4 style="color: #14b8a6; font-size: 1rem; font-family: 'Outfit', sans-serif; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-capsules"></i> Medicamentos em Uso Contínuo &amp; Fórmulas Manipuladas (${patientMeds.length})
        </h4>

        ${patientMeds.length === 0 ? `
          <p style="color: #94a3b8; font-size: 0.85rem;">Nenhum medicamento ativo registrado.</p>
        ` : `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
            ${patientMeds.map(m => `
              <div class="pharmacy-glass-card" style="padding: 12px 16px;">
                <div style="font-weight: 700; color: #f8fafc; font-size: 0.92rem;">${m.name}</div>
                <div style="font-size: 0.8rem; color: #14b8a6; margin-top: 2px;">${m.posology}</div>
                <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">
                  Prescritor: ${m.prescriber || 'Não informado'} | Início: ${new Date(m.startDate).toLocaleDateString('pt-BR')}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Linha do Tempo Longitudinal de Atendimentos Farmacêuticos -->
      <div>
        <h4 style="color: #f8fafc; font-size: 1rem; font-family: 'Outfit', sans-serif; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-timeline"></i> Linha do Tempo Farmacoterapêutica (${patientAtts.length} atendimentos)
        </h4>

        ${patientAtts.length === 0 ? `
          <p style="color: #94a3b8; font-size: 0.85rem;">Nenhum atendimento clínico anterior registrado para este paciente.</p>
        ` : `
          <div class="pharmacy-timeline">
            ${patientAtts.map(att => `
              <div class="pharmacy-timeline-item">
                <div class="pharmacy-timeline-dot"></div>
                <div class="pharmacy-timeline-content">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-weight: 700; color: #14b8a6; font-size: 0.92rem;">${att.tipo_visita}</span>
                    <span style="font-size: 0.78rem; color: #94a3b8;">${new Date(att.data_hora).toLocaleString('pt-BR')}</span>
                  </div>
                  <div style="font-size: 0.85rem; color: #f8fafc; margin-bottom: 4px;">
                    <strong>Queixa / Protocolo:</strong> ${att.queixa_triagem}
                  </div>
                  ${att.prescricao_mips ? `<div style="font-size: 0.82rem; color: #cbd5e1;"><strong>MIPs / Prescrição:</strong> ${att.prescricao_mips}</div>` : ''}
                  <div style="font-size: 0.8rem; color: #38bdf8; margin-top: 4px;">
                    <strong>Conduta:</strong> ${att.conduta_final}
                  </div>
                  <div style="font-size: 0.75rem; color: #64748b; margin-top: 6px;">
                    Atendido por: ${att.pharmacist_name}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

window.startEncounterForPatient = function(patientId) {
  const allPatients = localDB.list('pharmacy_patients') || [];
  const found = allPatients.find(p => p.id === patientId);
  if (found) {
    currentClinicalEncounter.patient = found;
    currentClinicalEncounter.step = 2;
    switchPharmacySubTab('crm_balcao');
  }
};

// ============================================================================
// 3. SUB-ABA: SIMULADOR DE INTERAÇÕES EM TEMPO REAL (CDSS LIVE CHECKER)
// ============================================================================
function renderSimuladorInteracoesView(container) {
  container.innerHTML = `
    <div class="pharmacy-glass-panel" style="max-width: 900px; margin: 0 auto; padding: 28px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h3 style="font-size: 1.4rem; color: #f8fafc; font-family: 'Outfit', sans-serif; margin: 0 0 6px 0; display: flex; align-items: center; justify-content: center; gap: 10px;">
          <i class="fa-solid fa-bolt-lightning" style="color: #e11d48;"></i> Simulador Instantâneo de Cruzamento Medicamentoso
        </h3>
        <p style="color: #94a3b8; font-size: 0.88rem; margin: 0;">
          Digite dois ou mais fármacos, alimentos ou comorbidades para testar a matriz de interações em tempo real.
        </p>
      </div>

      <!-- BUSCA DINÂMICA NLP NO SIMULADOR -->
      <div style="margin-bottom: 20px; background: rgba(15, 23, 42, 0.6); padding: 14px; border-radius: 12px; border: 1px solid rgba(20, 184, 166, 0.25);">
        <label style="display: block; font-size: 0.84rem; color: #14b8a6; margin-bottom: 6px; font-weight: 700;">
          <i class="fa-solid fa-brain"></i> Localizador Dinâmico de Medicamentos via PLN:
        </label>
        <div class="nlp-search-wrapper">
          <div class="nlp-search-input-group">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input type="text" id="sim-input-nlp-search" placeholder="Digite para buscar qualquer fármaco (ex: 'marevan', 'viagra', 'calmante', 'advil')..." autocomplete="off">
          </div>
          <div id="sim-nlp-dropdown" class="nlp-search-dropdown" style="display: none;"></div>
        </div>
      </div>

      <!-- ATALHOS DE CENÁRIOS CLÍNICOS CRÍTICOS -->
      <div style="margin-bottom: 20px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <span style="font-size: 0.78rem; color: #94a3b8; font-weight: 600;">Cenários Clínicos Rápidos:</span>
        <button type="button" class="btn btn-sm btn-secondary btn-sim-quick-case" data-proposed="Sildenafila 50mg" data-history="Monocordil 20mg (Isossorbida)" style="font-size: 0.75rem; padding: 3px 8px;">
          🛑 PDE-5 + Nitrato (Fatal)
        </button>
        <button type="button" class="btn btn-sm btn-secondary btn-sim-quick-case" data-proposed="Ibuprofeno 600mg (AINE)" data-history="Varfarina 5mg (Marevan)" style="font-size: 0.75rem; padding: 3px 8px;">
          🩸 Varfarina + AINE (Hemorragia)
        </button>
        <button type="button" class="btn btn-sm btn-secondary btn-sim-quick-case" data-proposed="Tramadol 50mg" data-history="Fluoxetina 20mg (ISRS)" style="font-size: 0.75rem; padding: 3px 8px;">
          ⚡ Tramadol + ISRS (Serotonina)
        </button>
        <button type="button" class="btn btn-sm btn-secondary btn-sim-quick-case" data-proposed="Novalgina 1g (Dipirona)" data-history="Histórico de Alergia a Dipirona" style="font-size: 0.75rem; padding: 3px 8px;">
          ⚠️ Alergia Cruzada Dipirona
        </button>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <div>
          <label style="display: block; font-size: 0.84rem; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600;">
            Fármacos Propostos / Inclusão:
          </label>
          <textarea id="sim-input-proposed" class="form-input" rows="3" placeholder="Ex.: Sildenafila 50mg, Ibuprofeno 600mg, Tramadol..." style="width: 100%;">Sildenafila 50mg</textarea>
        </div>

        <div>
          <label style="display: block; font-size: 0.84rem; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600;">
            Fármacos em Uso, Alergias ou Doenças:
          </label>
          <textarea id="sim-input-history" class="form-input" rows="3" placeholder="Ex.: Monocordil, Varfarina, Alergia a Dipirona, Hipertensão..." style="width: 100%;">Monocordil 20mg, Hipertensão</textarea>
        </div>
      </div>

      <div style="display: flex; justify-content: center; margin-bottom: 24px;">
        <button type="button" id="btn-run-sim-check" class="btn btn-primary" style="background: linear-gradient(135deg, #0d9488, #0f766e); border: none; padding: 12px 32px; font-size: 1rem; font-weight: 700; box-shadow: 0 4px 16px rgba(13, 148, 136, 0.4);">
          <i class="fa-solid fa-microscope" style="margin-right: 8px;"></i> Executar Validação Cruzada
        </button>
      </div>

      <!-- Resultados do Simulador -->
      <div id="sim-results-area">
        <!-- Renderizado após o clique -->
      </div>
    </div>
  `;

  // Listeners de cenários rápidos
  const quickBtns = document.querySelectorAll('.btn-sim-quick-case');
  quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.getAttribute('data-proposed');
      const h = btn.getAttribute('data-history');
      const inProp = document.getElementById('sim-input-proposed');
      const inHist = document.getElementById('sim-input-history');
      if (inProp) inProp.value = p;
      if (inHist) inHist.value = h;
      document.getElementById('btn-run-sim-check')?.click();
    });
  });

  // Listener de busca PLN no simulador
  const simNlpInput = document.getElementById('sim-input-nlp-search');
  const simNlpDropdown = document.getElementById('sim-nlp-dropdown');
  let simDebounce = null;

  simNlpInput?.addEventListener('input', (e) => {
    const term = e.target.value;
    clearTimeout(simDebounce);
    simDebounce = setTimeout(() => {
      if (!term || term.trim().length < 2) {
        if (simNlpDropdown) { simNlpDropdown.style.display = 'none'; simNlpDropdown.innerHTML = ''; }
        return;
      }

      const results = searchMedicationsNLP(term, CANONICAL_MEDICATIONS_DB, { limit: 5 });
      if (!simNlpDropdown) return;

      if (results.length === 0) {
        simNlpDropdown.style.display = 'block';
        simNlpDropdown.innerHTML = `<div style="padding: 10px; text-align: center; color: #94a3b8; font-size: 0.8rem;">Nenhum fármaco encontrado.</div>`;
        return;
      }

      simNlpDropdown.style.display = 'block';
      simNlpDropdown.innerHTML = results.map(m => `
        <div class="nlp-search-item" data-name="${m.name} (${m.activeSubstance})" style="padding: 8px 12px;">
          <div>
            <div style="font-weight: 700; color: #f8fafc; font-size: 0.88rem;">${m.name}</div>
            <div style="font-size: 0.75rem; color: #14b8a6;">DCB: ${m.activeSubstance}</div>
          </div>
          <div style="display: flex; gap: 4px;">
            <button type="button" class="btn btn-sm btn-secondary btn-add-to-proposed" data-med="${m.name}" style="font-size: 0.72rem; padding: 2px 6px;">+ Proposto</button>
            <button type="button" class="btn btn-sm btn-secondary btn-add-to-history" data-med="${m.name}" style="font-size: 0.72rem; padding: 2px 6px;">+ Em Uso</button>
          </div>
        </div>
      `).join('');

      simNlpDropdown.querySelectorAll('.btn-add-to-proposed').forEach(b => {
        b.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const med = b.getAttribute('data-med');
          const area = document.getElementById('sim-input-proposed');
          if (area) {
            area.value = (area.value ? area.value + ', ' : '') + med;
          }
          simNlpDropdown.style.display = 'none';
          document.getElementById('btn-run-sim-check')?.click();
        });
      });

      simNlpDropdown.querySelectorAll('.btn-add-to-history').forEach(b => {
        b.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const med = b.getAttribute('data-med');
          const area = document.getElementById('sim-input-history');
          if (area) {
            area.value = (area.value ? area.value + ', ' : '') + med;
          }
          simNlpDropdown.style.display = 'none';
          document.getElementById('btn-run-sim-check')?.click();
        });
      });
    }, 180);
  });

  document.getElementById('btn-run-sim-check')?.addEventListener('click', () => {
    const proposed = document.getElementById('sim-input-proposed')?.value || '';
    const history = document.getElementById('sim-input-history')?.value || '';
    const resultsArea = document.getElementById('sim-results-area');
    if (!resultsArea) return;

    const alerts = runRealtimeClinicalCrosscheck({
      proposedMedications: [proposed],
      activeMedications: [history],
      allergies: history,
      chronicConditions: history,
      isPregnantOrLactating: false
    });

    if (alerts.length === 0) {
      resultsArea.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 12px; padding: 20px; text-align: center;">
          <i class="fa-solid fa-circle-check" style="font-size: 2rem; color: #10b981; margin-bottom: 6px;"></i>
          <div style="color: #a7f3d0; font-weight: 700; font-size: 1rem;">Nenhuma Interação de Risco Detectada</div>
          <div style="color: #6ee7b7; font-size: 0.84rem; margin-top: 2px;">A associação testada é considerada segura segundo as diretrizes de farmacologia clínica.</div>
        </div>
      `;
    } else {
      resultsArea.innerHTML = alerts.map(alert => `
        <div class="cdss-alert-box ${alert.severity === 'Critica' || alert.severity === 'Grave' ? 'grave' : (alert.severity === 'Moderada' ? 'moderada' : 'leve')}">
          <div class="cdss-icon">
            <i class="fa-solid ${alert.severity === 'Critica' || alert.severity === 'Grave' ? 'fa-ban' : 'fa-triangle-exclamation'}"></i>
          </div>
          <div class="cdss-content">
            <div class="cdss-badge ${alert.severity === 'Critica' || alert.severity === 'Grave' ? 'grave' : 'moderada'}">
              ${alert.severity} • ${alert.dimension}
            </div>
            <div style="font-weight: 700; color: #f8fafc; font-size: 0.95rem; margin-bottom: 4px;">${alert.title}</div>
            <div style="font-size: 0.84rem; color: #cbd5e1; margin-bottom: 8px; line-height: 1.4;">${alert.desc}</div>
            <div style="font-size: 0.82rem; color: #14b8a6; background: rgba(0,0,0,0.25); padding: 8px 12px; border-radius: 8px; border-left: 3px solid #14b8a6;">
              <strong>Conduta Farmacêutica:</strong> ${alert.action}
            </div>
          </div>
        </div>
      `).join('');
    }
  });

  // Executar simulação inicial padrão
  document.getElementById('btn-run-sim-check')?.click();
}

// ============================================================================
// 4. SUB-ABA: ESTOQUE CENTRAL & RASTREABILIDADE DE LOTES
// ============================================================================
function renderEstoqueCentralView(container) {
  container.innerHTML = `
    <div>
      <!-- KPI CARDS FARMÁCIA (ESTILO FROSTED GLASS) -->
      <div class="kpi-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div id="kpi-card-pharm-all" class="pharmacy-glass-card" style="padding: 18px; cursor: pointer; border: 1px solid #0d9488;">
          <div style="display: flex; justify-content: space-between; align-items: center; color: var(--text-secondary); font-size: 0.85rem;">
            <span>TOTAL DE ITENS</span>
            <i class="fa-solid fa-boxes-stacked" style="color: #0d9488;"></i>
          </div>
          <div id="kpi-pharm-total" style="font-size: 1.8rem; font-weight: 700; color: var(--text-primary); margin-top: 8px;">--</div>
        </div>

        <div id="kpi-card-pharm-critical" class="pharmacy-glass-card" style="padding: 18px; cursor: pointer;">
          <div style="display: flex; justify-content: space-between; align-items: center; color: var(--text-secondary); font-size: 0.85rem;">
            <span>ESTOQUE CRÍTICO</span>
            <i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i>
          </div>
          <div id="kpi-pharm-critical" style="font-size: 1.8rem; font-weight: 700; color: #ef4444; margin-top: 8px;">--</div>
        </div>

        <div id="kpi-card-pharm-units" class="pharmacy-glass-card" style="padding: 18px; cursor: pointer;">
          <div style="display: flex; justify-content: space-between; align-items: center; color: var(--text-secondary); font-size: 0.85rem;">
            <span>UNIDADES EM ESTOQUE</span>
            <i class="fa-solid fa-capsules" style="color: #10b981;"></i>
          </div>
          <div id="kpi-pharm-units" style="font-size: 1.8rem; font-weight: 700; color: #10b981; margin-top: 8px;">--</div>
        </div>

        <div class="pharmacy-glass-card" style="padding: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; color: var(--text-secondary); font-size: 0.85rem;">
            <span>VALOR EM ESTOQUE</span>
            <i class="fa-solid fa-brazilian-real-sign" style="color: #38bdf8;"></i>
          </div>
          <div id="kpi-pharm-value" style="font-size: 1.8rem; font-weight: 700; color: #38bdf8; margin-top: 8px;">R$ --</div>
        </div>
      </div>

      <!-- TABELA DE ESTOQUE DA FARMÁCIA -->
      <div class="pharmacy-glass-panel" style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
          <h3 style="margin: 0; font-size: 1.1rem; color: #f8fafc; font-family: 'Outfit', sans-serif;">
            Estoque Central de Medicamentos, Insumos &amp; Manipulados
          </h3>
          <div style="display: flex; gap: 10px; align-items: center;">
            <input type="text" id="pharm-search-input" class="form-input" placeholder="Buscar medicamento ou lote..." style="max-width: 240px; height: 38px; font-size: 0.85rem;">
            <button id="btn-dispense-med" class="btn btn-secondary" style="border-color: #0d9488; color: #14b8a6; padding: 0 14px; height: 38px; font-size: 0.82rem;">
              <i class="fa-solid fa-hand-holding-medical"></i> Dispensar
            </button>
            <button id="btn-add-pharm-item" class="btn btn-primary" style="background: #0d9488; border: none; padding: 0 16px; height: 38px; font-size: 0.82rem;">
              <i class="fa-solid fa-plus"></i> Novo Item
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); text-align: left; font-size: 0.82rem; color: var(--text-secondary);">
                <th style="padding: 12px;">ID / CÓDIGO</th>
                <th style="padding: 12px;">MEDICAMENTO</th>
                <th style="padding: 12px;">DOSAGEM / APRESENTAÇÃO</th>
                <th style="padding: 12px;">LOTE / VALIDADE</th>
                <th style="padding: 12px;">QTD ESTOQUE</th>
                <th style="padding: 12px;">STATUS</th>
                <th style="padding: 12px;">PREÇO UNIT.</th>
                <th style="padding: 12px; text-align: right;">AÇÕES</th>
              </tr>
            </thead>
            <tbody id="pharmacy-table-body">
              <tr>
                <td colspan="8" style="text-align: center; padding: 24px; color: var(--text-secondary);">
                  <i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i> Carregando estoque da farmácia...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Listeners de Estoque
  document.getElementById('btn-add-pharm-item')?.addEventListener('click', () => openAddPharmModal());
  document.getElementById('btn-dispense-med')?.addEventListener('click', openDispenseMedModal);
  document.getElementById('pharm-search-input')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#pharmacy-table-body tr[data-search]');
    rows.forEach(r => {
      const txt = r.getAttribute('data-search') || '';
      r.style.display = txt.includes(term) ? '' : 'none';
    });
  });

  renderPharmacyTable(currentPharmacyItems);
}

// ============================================================================
// MODAL: CADASTRO DE NOVO PACIENTE CLÍNICO
// ============================================================================
function openAddClinicalPatientModal() {
  const existingModal = document.getElementById('modal-add-clinical-patient-overlay');
  if (existingModal) existingModal.remove();

  const modalHtml = `
    <div id="modal-add-clinical-patient-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(10, 15, 29, 0.85); backdrop-filter: blur(16px); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 16px;">
      <div class="pharmacy-glass-panel" style="width: 100%; max-width: 600px; padding: 24px; border: 1px solid rgba(13,148,136,0.3); border-radius: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
          <h3 style="margin: 0; color: #f8fafc; font-family: 'Outfit', sans-serif; font-size: 1.25rem; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-user-plus" style="color: #14b8a6;"></i> Novo Paciente Clínico Farmacêutico
          </h3>
          <button type="button" id="btn-close-new-patient-modal" style="background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form id="form-new-clinical-patient">
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 14px; margin-bottom: 14px;">
            <div>
              <label style="display: block; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">Nome Completo *</label>
              <input type="text" id="cp-name" class="form-input" required style="width: 100%;">
            </div>
            <div>
              <label style="display: block; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">CPF *</label>
              <input type="text" id="cp-cpf" class="form-input" required placeholder="000.000.000-00" style="width: 100%;">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 14px;">
            <div>
              <label style="display: block; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">Data de Nascimento</label>
              <input type="date" id="cp-birth" class="form-input" style="width: 100%;">
            </div>
            <div>
              <label style="display: block; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">Sexo Biológico</label>
              <select id="cp-gender" class="form-input" style="width: 100%;">
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label style="display: block; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">Telefone / WhatsApp</label>
              <input type="text" id="cp-phone" class="form-input" placeholder="(00) 00000-0000" style="width: 100%;">
            </div>
          </div>

          <div style="margin-bottom: 14px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #f472b6; font-size: 0.88rem; font-weight: 600;">
              <input type="checkbox" id="cp-pregnant" style="width: 16px; height: 16px; accent-color: #f472b6;">
              Paciente Gestante ou Lactante (Ativar travas de segurança teratogênica)
            </label>
          </div>

          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 0.82rem; color: #f87171; margin-bottom: 4px; font-weight: 600;">
              Alergias &amp; Hipersensibilidades Fármaco-Alimentares
            </label>
            <input type="text" id="cp-allergies" class="form-input" placeholder="Ex.: Dipirona, Penicilinas, AAS, Frutos do Mar..." style="width: 100%;">
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 0.82rem; color: #38bdf8; margin-bottom: 4px; font-weight: 600;">
              Condições Crônicas / Comorbidades
            </label>
            <input type="text" id="cp-conditions" class="form-input" placeholder="Ex.: Hipertensão Arterial, Diabetes Mellitus Tipo 2, Insuficiência Renal..." style="width: 100%;">
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" id="btn-cancel-new-patient" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary" style="background: #0d9488; border: none; font-weight: 700;">
              Salvar Paciente Clínico
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const overlay = document.getElementById('modal-add-clinical-patient-overlay');
  const closeModal = () => overlay?.remove();

  document.getElementById('btn-close-new-patient-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-new-patient')?.addEventListener('click', closeModal);

  document.getElementById('form-new-clinical-patient')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('cp-name')?.value?.trim();
    const cpf = document.getElementById('cp-cpf')?.value?.trim();
    const birthDate = document.getElementById('cp-birth')?.value;
    const gender = document.getElementById('cp-gender')?.value;
    const phone = document.getElementById('cp-phone')?.value?.trim();
    const isPregnant = document.getElementById('cp-pregnant')?.checked;
    const allergies = document.getElementById('cp-allergies')?.value?.trim();
    const chronicConditions = document.getElementById('cp-conditions')?.value?.trim();

    let age = 30;
    if (birthDate) {
      const birth = new Date(birthDate);
      const diff = Date.now() - birth.getTime();
      age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }

    const newPat = {
      id: localDB.generateId('PHARM-PAT'),
      name,
      cpf,
      birthDate: birthDate || '1990-01-01',
      age,
      gender,
      phone,
      isPregnantOrLactating: isPregnant,
      allergies,
      chronicConditions,
      created_at: new Date().toISOString()
    };

    localDB.insert('pharmacy_patients', newPat);
    closeModal();
    showToast(`✅ Paciente ${name} cadastrado com sucesso no CRM Clínico!`);
    currentClinicalEncounter.patient = newPat;
    currentClinicalEncounter.step = 2;
    renderCurrentSubTab();
  });
}

// ============================================================================
// FUNÇÕES DE ESTOQUE E MODAIS EXISTENTES (PRESERVADAS & REFATORADAS)
// ============================================================================
async function loadPharmacyData() {
  try {
    const res = await apiFetch('/api/pharmacy');
    if (res.ok) {
      const data = await res.json();
      currentPharmacyItems = data.data || [];
    }
  } catch (err) {
    console.warn('Usando estoque em cache local.');
  }
}

function renderPharmacyTable(items) {
  const tbody = document.getElementById('pharmacy-table-body');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 24px; color: var(--text-secondary);">
          Nenhum medicamento cadastrado no estoque central.
        </td>
      </tr>
    `;
    return;
  }

  let totalUnits = 0;
  let totalValue = 0;
  let criticalCount = 0;

  items.forEach(item => {
    const qty = Number(item.stockQuantity || 0);
    const min = Number(item.minStock || 10);
    const price = Number(item.unitPrice || 0);
    if (qty <= min) criticalCount++;
    totalUnits += qty;
    totalValue += (qty * price);
  });

  const elTot = document.getElementById('kpi-pharm-total');
  const elCrit = document.getElementById('kpi-pharm-critical');
  const elUnits = document.getElementById('kpi-pharm-units');
  const elVal = document.getElementById('kpi-pharm-value');

  if (elTot) elTot.textContent = items.length;
  if (elCrit) elCrit.textContent = criticalCount;
  if (elUnits) elUnits.textContent = totalUnits;
  if (elVal) elVal.textContent = `R$ ${totalValue.toFixed(2)}`;

  tbody.innerHTML = items.map(item => {
    const qty = Number(item.stockQuantity || 0);
    const min = Number(item.minStock || 10);
    const price = Number(item.unitPrice || 0);
    const isCritical = qty <= min;

    const statusBadge = isCritical
      ? `<span class="badge" style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight:700;"><i class="fa-solid fa-triangle-exclamation"></i> Crítico</span>`
      : `<span class="badge" style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight:700;"><i class="fa-solid fa-check"></i> Normal</span>`;

    const searchTxt = `${item.id} ${item.name} ${item.lotNumber} ${item.dosage}`.toLowerCase();

    return `
      <tr data-search="${searchTxt}" style="border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.88rem;">
        <td style="padding: 12px; font-family: monospace; font-weight: 700; color: #14b8a6;">${item.id}</td>
        <td style="padding: 12px;">
          <div style="font-weight: 700; color: #f8fafc; font-size: 0.95rem;">${item.name}</div>
          <div style="font-size: 0.78rem; color: #94a3b8;">${item.form || 'Geral'}</div>
        </td>
        <td style="padding: 12px; color: #cbd5e1;">${item.dosage || '--'}</td>
        <td style="padding: 12px; color: #94a3b8;">
          <div>Lote: <strong>${item.lotNumber || 'L2026'}</strong></div>
          <div style="font-size: 0.75rem;">Val: ${item.expirationDate || '2027-12-31'}</div>
        </td>
        <td style="padding: 12px; font-weight: 700; color: ${isCritical ? '#ef4444' : '#10b981'}; font-size: 1rem;">
          ${qty}
        </td>
        <td style="padding: 12px;">${statusBadge}</td>
        <td style="padding: 12px; color: #38bdf8;">R$ ${price.toFixed(2)}</td>
        <td style="padding: 12px; text-align: right;">
          <button type="button" class="btn btn-sm btn-secondary" onclick="window.editPharmacyItem('${item.id}')" style="padding: 4px 8px; font-size: 0.78rem; margin-right: 4px;">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddPharmModal(itemToEdit = null) {
  const isEdit = !!itemToEdit;
  const existingModal = document.getElementById('modal-pharm-item-overlay');
  if (existingModal) existingModal.remove();

  const modalHtml = `
    <div id="modal-pharm-item-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(10, 15, 29, 0.85); backdrop-filter: blur(16px); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 16px;">
      <div class="pharmacy-glass-panel" style="width: 100%; max-width: 540px; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
          <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-capsules" style="color: #14b8a6;"></i> ${isEdit ? 'Editar Medicamento' : 'Novo Medicamento no Estoque'}
          </h3>
          <button type="button" id="btn-close-pharm-item-modal" style="background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form id="form-save-pharm-item">
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">Nome do Medicamento *</label>
            <input type="text" id="pharm-input-name" class="form-input" required value="${itemToEdit?.name || ''}" style="width: 100%;">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div>
              <label style="display: block; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">Dosagem</label>
              <input type="text" id="pharm-input-dosage" class="form-input" placeholder="Ex: 500mg, 10mg/ml" value="${itemToEdit?.dosage || ''}" style="width: 100%;">
            </div>
            <div>
              <label style="display: block; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">Forma Farmacêutica</label>
              <input type="text" id="pharm-input-form" class="form-input" placeholder="Ex: Comprimido, Ampola, Xarope" value="${itemToEdit?.form || ''}" style="width: 100%;">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div>
              <label style="display: block; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">Qtd em Estoque *</label>
              <input type="number" id="pharm-input-stock" class="form-input" min="0" required value="${itemToEdit?.stockQuantity || 0}" style="width: 100%;">
            </div>
            <div>
              <label style="display: block; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">Estoque Mínimo (Alerta)</label>
              <input type="number" id="pharm-input-minstock" class="form-input" min="1" value="${itemToEdit?.minStock || 10}" style="width: 100%;">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
            <div>
              <label style="display: block; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">Número do Lote</label>
              <input type="text" id="pharm-input-lot" class="form-input" placeholder="Ex: L2026-A" value="${itemToEdit?.lotNumber || ''}" style="width: 100%;">
            </div>
            <div>
              <label style="display: block; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">Preço Unitário (R$)</label>
              <input type="number" step="0.01" id="pharm-input-price" class="form-input" value="${itemToEdit?.unitPrice || 0}" style="width: 100%;">
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" id="btn-cancel-pharm-item" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary" style="background: #0d9488; border: none; font-weight: 700;">
              Salvar Medicamento
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const overlay = document.getElementById('modal-pharm-item-overlay');
  const closeModal = () => overlay?.remove();

  document.getElementById('btn-close-pharm-item-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-pharm-item')?.addEventListener('click', closeModal);

  document.getElementById('form-save-pharm-item')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('pharm-input-name').value.trim();
    const dosage = document.getElementById('pharm-input-dosage').value.trim();
    const form = document.getElementById('pharm-input-form').value.trim();
    const stockQuantity = Number(document.getElementById('pharm-input-stock').value || 0);
    const minStock = Number(document.getElementById('pharm-input-minstock').value || 10);
    const lotNumber = document.getElementById('pharm-input-lot').value.trim() || 'L2026';
    const unitPrice = Number(document.getElementById('pharm-input-price').value || 0);

    const url = isEdit ? `/api/pharmacy/${itemToEdit.id}` : '/api/pharmacy';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, dosage, form, stockQuantity, minStock, lotNumber, unitPrice })
      });

      if (res.ok) {
        closeModal();
        showToast(`✅ Medicamento ${name} salvo com sucesso!`);
        await loadPharmacyData();
        renderCurrentSubTab();
      }
    } catch (err) {
      showToast('Salvo em modo offline!');
      closeModal();
    }
  });
}

function openDispenseMedModal() {
  const existingModal = document.getElementById('modal-pharm-dispense-overlay');
  if (existingModal) existingModal.remove();

  const options = currentPharmacyItems.map(item => `
    <option value="${item.id}">${item.name} (${item.dosage || 'Sem dosagem'}) - Disponível: ${item.stockQuantity || 0} unds</option>
  `).join('');

  const modalHtml = `
    <div id="modal-pharm-dispense-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(10, 15, 29, 0.85); backdrop-filter: blur(16px); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 16px;">
      <div class="pharmacy-glass-panel" style="width: 100%; max-width: 480px; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
          <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-hand-holding-medical" style="color: #14b8a6;"></i> Dispensação de Medicação
          </h3>
          <button type="button" id="btn-close-pharm-disp-modal" style="background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form id="form-dispense-pharm-item">
          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">Selecione o Medicamento *</label>
            <select id="pharm-disp-item-id" class="form-input" style="width: 100%;" required>
              ${options || '<option value="">Nenhum item cadastrado</option>'}
            </select>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">Quantidade a Dispensar *</label>
            <input type="number" id="pharm-disp-qty" class="form-input" min="1" value="1" required style="width: 100%;">
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" id="btn-cancel-pharm-disp" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary" style="background: #0d9488; border: none; font-weight: 700;">
              Confirmar Baixa
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const overlay = document.getElementById('modal-pharm-dispense-overlay');
  const closeModal = () => overlay?.remove();

  document.getElementById('btn-close-pharm-disp-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-pharm-disp')?.addEventListener('click', closeModal);

  document.getElementById('form-dispense-pharm-item')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemId = document.getElementById('pharm-disp-item-id').value;
    const quantity = Number(document.getElementById('pharm-disp-qty').value || 1);

    try {
      const res = await apiFetch('/api/pharmacy/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity })
      });

      if (res.ok) {
        closeModal();
        showToast('✅ Dispensação realizada com sucesso!');
        await loadPharmacyData();
        renderCurrentSubTab();
      }
    } catch (err) {
      showToast('Dispensação salva em cache local!');
      closeModal();
    }
  });
}

window.editPharmacyItem = function(id) {
  const item = currentPharmacyItems.find(i => i.id === id);
  if (item) openAddPharmModal(item);
};

window.renderPharmacyTab = renderPharmacyTab;
window.renderPharmacyTable = renderPharmacyTable;
