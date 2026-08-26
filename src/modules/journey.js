// ─── MÓDULO DE LINHA DE CUIDADO GUIADA & JOURNEY STEPPER (CRM CLÍNICO FARMACÊUTICO v2.7.2) ───
import { state } from '../state.js';
import { showToast } from './ui.js';
import { apiFetch } from './api.js';

let activePatientContext = null;

export const setActivePatientContext = (patient) => {
  activePatientContext = patient;
  state.activePatient = patient;
  renderFloatingPatientHUD();
  if (typeof window.renderSmartFlowGuide === 'function') {
    window.renderSmartFlowGuide();
  }
};

export const getActivePatientContext = () => activePatientContext || state.activePatient;

export function renderPatientJourneyStepper(container, currentStep = 'consulta') {
  if (!container || !activePatientContext) return;

  const steps = [
    { id: 'recepcao', label: '1. Recepção', icon: 'fa-id-card', tab: 'pacientes' },
    { id: 'triagem', label: '2. Triagem Manchester', icon: 'fa-user-nurse', tab: 'atendimento' },
    { id: 'consulta', label: '3. Consulta Médica', icon: 'fa-user-doctor', tab: 'consultorios' },
    { id: 'farmacia', label: '4. Farmácia & Exames', icon: 'fa-pills', tab: 'farmacia' },
    { id: 'desfecho', label: '5. Desfecho Clínico', icon: 'fa-flag-checkered', tab: 'leitos' }
  ];

  const stepOrder = ['recepcao', 'triagem', 'consulta', 'farmacia', 'desfecho'];
  const currentIndex = stepOrder.indexOf(currentStep);

  container.innerHTML = `
    <div class="patient-journey-stepper">
      <div class="stepper-header-info">
        <div class="stepper-patient-avatar">
          <i class="fa-solid fa-hospital-user"></i>
        </div>
        <div>
          <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">
            ${activePatientContext.fullName || activePatientContext.patientName || 'Paciente Ativo'}
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">
            CPF: ${activePatientContext.cpf || '—'} | Risco: <strong style="color: ${getManchesterColor(activePatientContext.manchesterColor)};">${activePatientContext.manchesterColor || 'Verde'}</strong>
          </div>
        </div>
      </div>

      <div class="stepper-steps-track">
        ${steps.map((step, idx) => {
          let statusClass = 'pending';
          if (idx < currentIndex) statusClass = 'completed';
          else if (idx === currentIndex) statusClass = 'active';

          return `
            <div class="stepper-step ${statusClass}" onclick="window.handleStepperStepClick('${step.tab}', '${step.id}')" title="Ir para ${step.label}">
              <i class="fa-solid ${statusClass === 'completed' ? 'fa-check' : step.icon}"></i>
              <span>${step.label}</span>
            </div>
            ${idx < steps.length - 1 ? '<i class="fa-solid fa-chevron-right stepper-arrow"></i>' : ''}
          `;
        }).join('')}
      </div>

      <div>
        <button class="btn btn-sm" onclick="window.showClinicalHandoffModal()" style="font-size: 0.76rem; padding: 6px 12px; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
          <i class="fa-solid fa-bolt"></i> Desfecho Rápido
        </button>
      </div>
    </div>
  `;
}

function getManchesterColor(color) {
  const map = {
    'Vermelho': '#ef4444',
    'Laranja': '#f97316',
    'Amarelo': '#eab308',
    'Verde': '#10b981',
    'Azul': '#3b82f6'
  };
  return map[color] || '#10b981';
}

window.handleStepperStepClick = function(targetTab, stepId) {
  if (typeof window.switchTab === 'function') {
    showToast(`📍 Navegando na Linha de Cuidado: ${stepId.toUpperCase()}`);
    window.switchTab(targetTab);
  }
};

export function renderFloatingPatientHUD() {
  let hud = document.getElementById('floating-patient-hud');
  let miniPill = document.getElementById('floating-patient-minipill');

  // Se o usuário desativou a barra flutuante nas preferências
  if (localStorage.getItem('pharmacy_hud_disabled') === 'true') {
    if (hud) hud.style.display = 'none';
    if (miniPill) miniPill.style.display = 'none';
    return;
  }

  if (!activePatientContext) {
    if (hud) hud.style.display = 'none';
    if (miniPill) miniPill.style.display = 'none';
    return;
  }

  // Se estiver minimizado
  if (localStorage.getItem('pharmacy_hud_minimized') === 'true') {
    if (hud) hud.style.display = 'none';
    renderMiniPill();
    return;
  } else {
    if (miniPill) miniPill.style.display = 'none';
  }

  if (!hud) {
    hud = document.createElement('div');
    hud.id = 'floating-patient-hud';
    hud.className = 'floating-patient-hud';
    document.body.appendChild(hud);
    setupHudDraggable(hud);
  }

  const p = activePatientContext;
  const pName = p.fullName || p.name || p.patientName || 'Cliente em Atendimento';
  const pPhone = p.phone || p.celular || p.whatsapp || '';
  const pAllergies = p.allergies ? `<span style="color: #f87171; font-size: 0.72rem; margin-left: 6px;">⚠️ ${p.allergies}</span>` : '';

  hud.style.display = 'flex';
  hud.innerHTML = `
    <div class="hud-drag-handle" title="Arraste para reposicionar na tela" style="cursor: grab; display: flex; align-items: center; color: #64748b; padding: 2px 4px; font-size: 0.9rem; user-select: none;">
      <i class="fa-solid fa-grip-vertical"></i>
    </div>

    <div style="display: flex; align-items: center; gap: 10px; border-right: 1px solid rgba(255,255,255,0.12); padding-right: 12px;">
      <div style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px #10b981; animation: pulse 1.5s infinite;"></div>
      <div class="hud-patient-info" style="line-height: 1.2;">
        <div style="display: flex; align-items: center;">
          <span style="font-size: 0.68rem; color: #2dd4bf; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em;">Cockpit Farmacêutico</span>
          ${pAllergies}
        </div>
        <strong style="font-size: 0.9rem; color: #ffffff; font-family: 'Outfit', sans-serif; white-space: nowrap; max-width: 160px; overflow: hidden; text-overflow: ellipsis; display: block;" title="${pName}">
          ${pName}
        </strong>
      </div>
    </div>

    <div class="hud-actions-group" style="display: flex; align-items: center; gap: 6px;">
      <!-- 1. Balcão / Triagem -->
      <button onclick="window.openBalcaoFromHUD()" class="btn btn-hud-balcao" style="font-size: 0.76rem; font-weight: 700; padding: 6px 11px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(13, 148, 136, 0.4)); border: 1px solid #10b981; color: #a7f3d0; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 5px; box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);" title="Iniciar/Retomar Triagem de Balcão e Prescrição de MIPs">
        <i class="fa-solid fa-stethoscope" style="color: #34d399;"></i> Balcão
      </button>

      <!-- 2. Simulador de Interações CDSS -->
      <button onclick="window.openSimuladorFromHUD()" class="btn btn-hud-simulador" style="font-size: 0.76rem; font-weight: 700; padding: 6px 11px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.35)); border: 1px solid #f59e0b; color: #fde68a; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 5px;" title="Testar Interações Medicamentosas em Tempo Real">
        <i class="fa-solid fa-bolt" style="color: #fbbf24;"></i> Interações
      </button>

      <!-- 3. Prontuário Longitudinal -->
      <button onclick="window.openProntuarioFromHUD()" class="btn btn-hud-prontuario" style="font-size: 0.76rem; font-weight: 700; padding: 6px 11px; background: linear-gradient(135deg, rgba(2, 132, 199, 0.2), rgba(3, 105, 161, 0.35)); border: 1px solid #0284c7; color: #bae6fd; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 5px;" title="Ver Prontuário, Uso Contínuo e Histórico">
        <i class="fa-solid fa-notes-medical" style="color: #38bdf8;"></i> Prontuário
      </button>

      <!-- 4. WhatsApp / Posologia -->
      <button onclick="window.openWhatsAppFromHUD('${(pPhone || '').replace(/'/g, "\\'")}', '${pName.replace(/'/g, "\\'")}')" class="btn btn-hud-whatsapp" style="font-size: 0.76rem; font-weight: 700; padding: 6px 10px; background: rgba(37, 211, 102, 0.15); border: 1px solid rgba(37, 211, 102, 0.4); color: #86efac; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 4px;" title="Enviar Orientações Posológicas via WhatsApp">
        <i class="fa-brands fa-whatsapp" style="color: #25D366; font-size: 0.9rem;"></i>
      </button>

      <!-- 5. Menu / Controles do Cockpit -->
      <div style="position: relative; display: inline-block;">
        <button onclick="window.toggleHudSettingsMenu(event)" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #cbd5e1; cursor: pointer; padding: 6px 8px; border-radius: 8px; font-size: 0.78rem;" title="Opções da Barra Flutuante">
          <i class="fa-solid fa-ellipsis-vertical"></i>
        </button>

        <div id="hud-options-dropdown" style="display: none; position: absolute; bottom: 120%; right: 0; background: #0f172a; border: 1px solid #334155; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.6); min-width: 210px; z-index: 10050; padding: 6px 0; overflow: hidden;">
          <div onclick="window.minimizePatientHUD()" style="padding: 9px 14px; color: #f1f5f9; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s;" onmouseenter="this.style.background='#1e293b'" onmouseleave="this.style.background='transparent'">
            <i class="fa-solid fa-window-minimize" style="color: #38bdf8; font-size: 0.75rem;"></i> Minimizar Pílula
          </div>
          <div onclick="window.clearActivePatientHUD()" style="padding: 9px 14px; color: #f1f5f9; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s;" onmouseenter="this.style.background='#1e293b'" onmouseleave="this.style.background='transparent'">
            <i class="fa-solid fa-user-xmark" style="color: #fbbf24;"></i> Liberar Paciente em Foco
          </div>
          <div style="border-top: 1px solid rgba(255,255,255,0.08); margin: 4px 0;"></div>
          <div onclick="window.disablePharmacyHUD()" style="padding: 9px 14px; color: #f87171; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s;" onmouseenter="this.style.background='rgba(225, 29, 72, 0.15)'" onmouseleave="this.style.background='transparent'">
            <i class="fa-solid fa-eye-slash" style="color: #f87171;"></i> Desativar Barra Flutuante
          </div>
        </div>
      </div>

      <!-- Botão Fechar Rápido -->
      <button onclick="window.clearActivePatientHUD()" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px 6px; font-size: 0.85rem;" title="Encerrar Foco">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `;
}

function renderMiniPill() {
  let miniPill = document.getElementById('floating-patient-minipill');
  if (!miniPill) {
    miniPill = document.createElement('div');
    miniPill.id = 'floating-patient-minipill';
    miniPill.className = 'floating-patient-minipill';
    document.body.appendChild(miniPill);
  }

  const p = activePatientContext;
  if (!p) {
    miniPill.style.display = 'none';
    return;
  }
  const pName = p.fullName || p.name || 'Cliente';

  miniPill.style.display = 'flex';
  miniPill.innerHTML = `
    <div onclick="window.restorePatientHUD()" style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 14px; background: linear-gradient(135deg, #1e293b, #0f172a); border: 1.5px solid #10b981; border-radius: 24px; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.35); color: #fff; font-size: 0.82rem; font-weight: 700;">
      <div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 6px #10b981;"></div>
      <i class="fa-solid fa-stethoscope" style="color: #2dd4bf;"></i>
      <span>${pName}</span>
      <i class="fa-solid fa-chevron-up" style="color: #94a3b8; font-size: 0.7rem; margin-left: 4px;"></i>
    </div>
  `;
}

function setupHudDraggable(hudElement) {
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  hudElement.addEventListener('mousedown', (e) => {
    const handle = e.target.closest('.hud-drag-handle');
    if (!handle) return;
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = hudElement.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    hudElement.style.right = 'auto';
    hudElement.style.bottom = 'auto';
    hudElement.style.left = `${initialLeft}px`;
    hudElement.style.top = `${initialTop}px`;
    hudElement.style.cursor = 'grabbing';

    const onMouseMove = (moveEvt) => {
      if (!isDragging) return;
      const dx = moveEvt.clientX - startX;
      const dy = moveEvt.clientY - startY;
      hudElement.style.left = `${Math.max(10, Math.min(window.innerWidth - hudElement.offsetWidth - 10, initialLeft + dx))}px`;
      hudElement.style.top = `${Math.max(10, Math.min(window.innerHeight - hudElement.offsetHeight - 10, initialTop + dy))}px`;
    };

    const onMouseUp = () => {
      isDragging = false;
      hudElement.style.cursor = 'default';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });
}

// ─── AÇÕES DO COCKPIT FARMACÊUTICO ───

window.openBalcaoFromHUD = function() {
  if (!activePatientContext) return;
  const p = activePatientContext;
  if (typeof window.startNewPharmacyConsultationForClient === 'function') {
    window.startNewPharmacyConsultationForClient(p.id, p.fullName || p.name, 'gripe_resfriado', '', 2);
  } else {
    if (typeof window.switchTab === 'function') window.switchTab('farmacia');
  }
};

window.openSimuladorFromHUD = function() {
  if (!activePatientContext) return;
  if (typeof window.switchTab === 'function') window.switchTab('farmacia');
  if (typeof window.switchPharmacySubTab === 'function') {
    window.switchPharmacySubTab('simulador');
  }
  showToast(`⚡ Simulador de Interações carregado para ${activePatientContext.fullName || activePatientContext.name}!`);
};

window.openProntuarioFromHUD = function() {
  if (!activePatientContext) return;
  const p = activePatientContext;
  if (typeof window.openPatientHistoryModal === 'function') {
    window.openPatientHistoryModal(p.id, p.fullName || p.name);
  } else {
    showToast(`📜 Abrindo prontuário de ${p.fullName || p.name}...`);
  }
};

window.openWhatsAppFromHUD = function(phone, name) {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const message = encodeURIComponent(`Olá, ${name || 'Cliente'}! Aqui é do atendimento farmacêutico. Seguem as orientações sobre a sua prescrição e cuidados de saúde.`);
  
  if (cleanPhone && cleanPhone.length >= 10) {
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${message}`, '_blank');
    showToast(`📱 Abrindo WhatsApp para ${name}...`);
  } else {
    const manualPhone = prompt(`Digite o número de WhatsApp de ${name} com DDD (Ex: 18988175809):`);
    if (manualPhone) {
      const cleanManual = manualPhone.replace(/\D/g, '');
      const fullManual = cleanManual.startsWith('55') ? cleanManual : `55${cleanManual}`;
      window.open(`https://api.whatsapp.com/send?phone=${fullManual}&text=${message}`, '_blank');
    }
  }
};

window.toggleHudSettingsMenu = function(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('hud-options-dropdown');
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  }
};

document.addEventListener('click', () => {
  const dropdown = document.getElementById('hud-options-dropdown');
  if (dropdown) dropdown.style.display = 'none';
});

window.minimizePatientHUD = function() {
  localStorage.setItem('pharmacy_hud_minimized', 'true');
  renderFloatingPatientHUD();
  showToast('Barra minimizada em pílula rápida.');
};

window.restorePatientHUD = function() {
  localStorage.removeItem('pharmacy_hud_minimized');
  renderFloatingPatientHUD();
};

window.disablePharmacyHUD = function() {
  localStorage.setItem('pharmacy_hud_disabled', 'true');
  const hud = document.getElementById('floating-patient-hud');
  const miniPill = document.getElementById('floating-patient-minipill');
  if (hud) hud.style.display = 'none';
  if (miniPill) miniPill.style.display = 'none';
  showToast('Barra Flutuante desativada. Para reativar, clique em "Reativar Cockpit" no menu superior.');
};

window.enablePharmacyHUD = function() {
  localStorage.removeItem('pharmacy_hud_disabled');
  localStorage.removeItem('pharmacy_hud_minimized');
  renderFloatingPatientHUD();
  showToast('Cockpit Farmacêutico Flutuante reativado com sucesso!');
};

window.clearActivePatientHUD = function() {
  activePatientContext = null;
  state.activePatient = null;
  const hud = document.getElementById('floating-patient-hud');
  const miniPill = document.getElementById('floating-patient-minipill');
  if (hud) hud.style.display = 'none';
  if (miniPill) miniPill.style.display = 'none';
  showToast('Foco no paciente encerrado.');
};
