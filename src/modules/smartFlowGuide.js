// src/modules/smartFlowGuide.js
// COPILOTO CLÍNICO & CARD FLUTUANTE GUIA DE FLUXO (SMART FLOW & JOURNEY GUIDE)
// DIRECIONA O FARMACÊUTICO SEMPRE PARA A PRÓXIMA ETAPA OU AVISA QUANDO O FLUXO FOI CONCLUÍDO

import { state } from '../state.js';
import * as localDB from '../localDB.js';
import { showToast } from './ui.js';
import { playBeepSound } from './barcodeScanner.js';

let currentFlowState = {
  isMinimized: false,
  stepId: 'inicio', // 'inicio' | 'paciente_selecionado' | 'anamnese' | 'prescricao' | 'assinatura' | 'concluido'
  customTitle: null,
  customMessage: null,
  primaryActionLabel: null,
  primaryActionCallback: null,
  secondaryActionLabel: null,
  secondaryActionCallback: null
};

// Posição persistente do card na tela
let guidePosition = {
  x: null,
  y: null
};

try {
  const savedPos = localStorage.getItem('crm_smart_flow_guide_pos');
  if (savedPos) {
    const parsed = JSON.parse(savedPos);
    if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
      guidePosition = parsed;
    }
  }
} catch (e) {}

// Inicializa ou atualiza o Card Flutuante Guia de Fluxo
export function renderSmartFlowGuide(force = false) {
  if (!force && localStorage.getItem('crm_smart_flow_guide_disabled') === 'true') {
    const existing = document.getElementById('smart-flow-guide-widget');
    if (existing) existing.remove();
    return;
  }

  let guideEl = document.getElementById('smart-flow-guide-widget');

  if (!guideEl) {
    guideEl = document.createElement('div');
    guideEl.id = 'smart-flow-guide-widget';
    document.body.appendChild(guideEl);
  }

  // Aplica posicionamento (salvo ou padrão no canto inferior direito)
  guideEl.style.position = 'fixed';
  guideEl.style.zIndex = '9995';
  guideEl.style.fontFamily = "'Outfit', system-ui, -apple-system, sans-serif";
  guideEl.style.touchAction = 'none';

  if (guidePosition.x !== null && guidePosition.y !== null) {
    // Garante que não fique fora da tela caso o tamanho da janela tenha mudado
    const clampedX = Math.max(10, Math.min(window.innerWidth - 360, guidePosition.x));
    const clampedY = Math.max(10, Math.min(window.innerHeight - 180, guidePosition.y));
    guideEl.style.left = `${clampedX}px`;
    guideEl.style.top = `${clampedY}px`;
    guideEl.style.right = 'auto';
    guideEl.style.bottom = 'auto';
  } else {
    guideEl.style.bottom = '22px';
    guideEl.style.right = '22px';
    guideEl.style.left = 'auto';
    guideEl.style.top = 'auto';
  }

  // Resolver dados dinâmicos da etapa atual com base no contexto do sistema
  const flow = evaluateCurrentFlow();

  if (currentFlowState.isMinimized) {
    // MODO MINIMIZADO (PILL FLUTUANTE ELEGANTE COM ALÇA DE ARRASTO)
    guideEl.innerHTML = `
      <div id="minimized-guide-pill-wrap" style="
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(13, 148, 136, 0.9));
        border: 1.5px solid rgba(20, 184, 166, 0.5);
        color: #fff; padding: 6px 14px; border-radius: 30px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 15px rgba(20, 184, 166, 0.3);
        display: flex; align-items: center; gap: 10px; cursor: grab;
        backdrop-filter: blur(12px); font-size: 0.82rem; font-weight: 700;
        user-select: none;
      " title="Arraste para mover ou clique para expandir">
        <i class="fa-solid fa-grip-vertical" style="color: #64748b; font-size: 0.8rem; cursor: grab;"></i>
        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${flow.badgeColor}; box-shadow: 0 0 8px ${flow.badgeColor}; animation: pulse 1.5s infinite;"></span>
        <i class="fa-solid fa-compass" style="color: #2dd4bf;"></i>
        <span id="btn-expand-flow-guide" style="cursor: pointer; display: flex; align-items: center; gap: 6px;">
          ${flow.shortLabel}
          <i class="fa-solid fa-chevron-up" style="font-size: 0.7rem; opacity: 0.8;"></i>
        </span>
      </div>
    `;

    document.getElementById('btn-expand-flow-guide')?.addEventListener('click', () => {
      currentFlowState.isMinimized = false;
      renderSmartFlowGuide();
    });

    initGuideDraggable(guideEl, document.getElementById('minimized-guide-pill-wrap'));
    return;
  }

  // MODO EXPANDIDO (CARD GUIA COMPLETO)
  guideEl.innerHTML = `
    <div id="flow-guide-card-box" style="
      width: 340px; background: rgba(15, 23, 42, 0.96);
      border: 1.5px solid ${flow.borderColor};
      border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.85), 0 0 25px ${flow.glowColor};
      backdrop-filter: blur(16px); overflow: hidden; display: flex; flex-direction: column;
    ">
      
      <!-- Top Bar do Copiloto (Alça de Arrastar) -->
      <div id="flow-guide-drag-handle" style="
        padding: 10px 14px; background: ${flow.headerBg};
        border-bottom: 1px solid rgba(255,255,255,0.08);
        display: flex; justify-content: space-between; align-items: center;
        cursor: grab; user-select: none;
      " title="Clique e arraste para mover o Guia para qualquer parte da tela">
        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
          <i class="fa-solid fa-grip-vertical" style="color: rgba(255,255,255,0.4); font-size: 0.85rem; cursor: grab;" title="Arraste para mover"></i>
          <div style="width: 26px; height: 26px; border-radius: 50%; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; color: #fff; flex-shrink: 0;">
            <i class="fa-solid ${flow.icon}"></i>
          </div>
          <div style="min-width: 0;">
            <span style="font-size: 0.65rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.6px; color: ${flow.badgeTextColor}; display: block; line-height: 1;">
              ${flow.stepTag}
            </span>
            <strong style="font-size: 0.84rem; color: #fff; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">
              ${flow.title}
            </strong>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
          <button type="button" id="btn-reset-pos-flow-guide" style="background: none; border: none; color: #94a3b8; width: 22px; height: 22px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; transition: color 0.2s;" title="Restaurar Posição Padrão">
            <i class="fa-solid fa-arrows-rotate"></i>
          </button>
          <button type="button" id="btn-minimize-flow-guide" style="background: none; border: none; color: #94a3b8; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; transition: color 0.2s;" title="Minimizar Guia">
            <i class="fa-solid fa-chevron-down"></i>
          </button>
          <button type="button" id="btn-close-flow-guide" style="background: none; border: none; color: #f87171; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; transition: color 0.2s;" title="Desativar / Ocultar Copiloto">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <!-- Corpo da Orientação -->
      <div style="padding: 12px 14px 14px;">
        <p style="margin: 0 0 12px; font-size: 0.8rem; color: #cbd5e1; line-height: 1.45;">
          ${flow.message}
        </p>

        <!-- Barra de Progresso Visual da Linha de Cuidado -->
        <div style="display: flex; gap: 4px; margin-bottom: 12px;">
          <div style="flex: 1; height: 4px; border-radius: 2px; background: ${flow.stepNum >= 1 ? '#10b981' : 'rgba(255,255,255,0.1)'};"></div>
          <div style="flex: 1; height: 4px; border-radius: 2px; background: ${flow.stepNum >= 2 ? '#10b981' : 'rgba(255,255,255,0.1)'};"></div>
          <div style="flex: 1; height: 4px; border-radius: 2px; background: ${flow.stepNum >= 3 ? '#10b981' : 'rgba(255,255,255,0.1)'};"></div>
          <div style="flex: 1; height: 4px; border-radius: 2px; background: ${flow.stepNum >= 4 ? '#10b981' : 'rgba(255,255,255,0.1)'};"></div>
        </div>

        <!-- Botões de Ação do Próximo Passo -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <button type="button" id="btn-flow-primary-action" style="
            background: ${flow.btnPrimaryBg};
            color: #fff; border: none; padding: 9px 12px; border-radius: 10px;
            font-size: 0.82rem; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            box-shadow: 0 4px 14px ${flow.btnPrimaryShadow}; transition: all 0.2s ease;
          " onmouseover="this.style.filter='brightness(1.15)'" onmouseout="this.style.filter='brightness(1)'">
            ${flow.primaryActionHtml}
          </button>

          ${flow.secondaryActionHtml ? `
            <button type="button" id="btn-flow-secondary-action" style="
              background: rgba(255,255,255,0.06); color: #94a3b8;
              border: 1px solid rgba(255,255,255,0.1); padding: 7px 10px;
              border-radius: 8px; font-size: 0.76rem; font-weight: 600; cursor: pointer;
              display: flex; align-items: center; justify-content: center; gap: 6px;
            ">
              ${flow.secondaryActionHtml}
            </button>
          ` : ''}
        </div>
      </div>

    </div>
  `;

  // Listeners dos botões
  document.getElementById('btn-minimize-flow-guide')?.addEventListener('click', (e) => {
    e.stopPropagation();
    currentFlowState.isMinimized = true;
    renderSmartFlowGuide();
  });

  document.getElementById('btn-close-flow-guide')?.addEventListener('click', (e) => {
    e.stopPropagation();
    localStorage.setItem('crm_smart_flow_guide_disabled', 'true');
    guideEl.remove();
    showToast('🧭 Copiloto Ocultado. Reative em Configurações caso deseje.');
  });

  document.getElementById('btn-reset-pos-flow-guide')?.addEventListener('click', (e) => {
    e.stopPropagation();
    guidePosition = { x: null, y: null };
    localStorage.removeItem('crm_smart_flow_guide_pos');
    renderSmartFlowGuide();
    showToast('Posição do guia restaurada para o canto padrão.');
  });

  document.getElementById('btn-flow-primary-action')?.addEventListener('click', () => {
    if (typeof flow.onPrimaryClick === 'function') {
      flow.onPrimaryClick();
    }
  });

  document.getElementById('btn-flow-secondary-action')?.addEventListener('click', () => {
    if (typeof flow.onSecondaryClick === 'function') {
      flow.onSecondaryClick();
    }
  });

  // Ativa a funcionalidade de arrastar e soltar (Drag and Drop)
  initGuideDraggable(guideEl, document.getElementById('flow-guide-drag-handle'));
}

/**
 * Sistema de Arrastar e Soltar (Drag & Drop) Suave com Mouse e Touch
 */
function initGuideDraggable(element, handle) {
  if (!element || !handle) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;
  let hasMoved = false;

  const onStart = (clientX, clientY) => {
    isDragging = true;
    hasMoved = false;
    startX = clientX;
    startY = clientY;

    const rect = element.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    handle.style.cursor = 'grabbing';
    element.style.transition = 'none'; // Desabilita animações durante o arrasto para ficar a 60fps
    document.body.style.userSelect = 'none';
  };

  const onMove = (clientX, clientY) => {
    if (!isDragging) return;
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      hasMoved = true;
    }

    const rect = element.getBoundingClientRect();
    const width = rect.width || 340;
    const height = rect.height || 200;

    // Limites da tela para não sair da visão do usuário
    const maxLeft = window.innerWidth - width - 8;
    const maxTop = window.innerHeight - height - 8;

    const newLeft = Math.max(8, Math.min(maxLeft, initialLeft + deltaX));
    const newTop = Math.max(8, Math.min(maxTop, initialTop + deltaY));

    element.style.left = `${newLeft}px`;
    element.style.top = `${newTop}px`;
    element.style.right = 'auto';
    element.style.bottom = 'auto';

    guidePosition.x = newLeft;
    guidePosition.y = newTop;
  };

  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    handle.style.cursor = 'grab';
    element.style.transition = '';
    document.body.style.userSelect = '';

    if (hasMoved && guidePosition.x !== null && guidePosition.y !== null) {
      try {
        localStorage.setItem('crm_smart_flow_guide_pos', JSON.stringify(guidePosition));
      } catch (e) {}
    }
  };

  // Eventos de Mouse
  handle.addEventListener('mousedown', (e) => {
    // Ignora cliques diretos em botões de ação
    if (e.target.closest('button')) return;
    onStart(e.clientX, e.clientY);

    const mouseMoveHandler = (ev) => onMove(ev.clientX, ev.clientY);
    const mouseUpHandler = () => {
      onEnd();
      window.removeEventListener('mousemove', mouseMoveHandler);
      window.removeEventListener('mouseup', mouseUpHandler);
    };

    window.addEventListener('mousemove', mouseMoveHandler);
    window.addEventListener('mouseup', mouseUpHandler);
  });

  // Eventos de Touch (para telas touch / tablets)
  handle.addEventListener('touchstart', (e) => {
    if (e.target.closest('button')) return;
    const touch = e.touches[0];
    onStart(touch.clientX, touch.clientY);

    const touchMoveHandler = (ev) => {
      if (ev.touches && ev.touches[0]) {
        onMove(ev.touches[0].clientX, ev.touches[0].clientY);
      }
    };
    const touchEndHandler = () => {
      onEnd();
      window.removeEventListener('touchmove', touchMoveHandler);
      window.removeEventListener('touchend', touchEndHandler);
    };

    window.addEventListener('touchmove', touchMoveHandler, { passive: true });
    window.addEventListener('touchend', touchEndHandler);
  }, { passive: true });
}

// Avalia o fluxo atual e define a recomendação da próxima etapa
function evaluateCurrentFlow() {
  const p = state.activePatient;

  // CASO 1: FLUXO CONCLUÍDO (Notificação de Sucesso)
  if (currentFlowState.stepId === 'concluido') {
    return {
      stepNum: 4,
      stepTag: 'Jornada Finalizada',
      title: 'Atendimento Concluído',
      shortLabel: '✓ Atendimento Concluído',
      message: currentFlowState.customMessage || `O atendimento de <strong>${p ? (p.name || p.fullName) : 'cliente'}</strong> foi finalizado e salvo no prontuário com sucesso.`,
      icon: 'fa-circle-check',
      badgeColor: '#10b981',
      badgeTextColor: '#34d399',
      borderColor: 'rgba(16, 185, 129, 0.5)',
      glowColor: 'rgba(16, 185, 129, 0.25)',
      headerBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(15, 23, 42, 0.9))',
      btnPrimaryBg: 'linear-gradient(135deg, #10b981, #059669)',
      btnPrimaryShadow: 'rgba(16, 185, 129, 0.4)',
      primaryActionHtml: '<i class="fa-solid fa-user-plus"></i> Iniciar Novo Atendimento',
      onPrimaryClick: () => {
        state.activePatient = null;
        currentFlowState.stepId = 'inicio';
        renderSmartFlowGuide();
        if (window.switchTab) window.switchTab('pacientes');
        showToast('Iniciando novo atendimento no balcão.');
      },
      secondaryActionHtml: p ? '<i class="fa-solid fa-mobile-screen-button"></i> Abrir Portal do Paciente' : null,
      onSecondaryClick: () => {
        if (window.openPatientPortalModal && p) {
          window.openPatientPortalModal(p);
        }
      }
    };
  }

  // CASO 2: NENHUM PACIENTE ATIVO (Etapa 1 - Início)
  if (!p) {
    return {
      stepNum: 1,
      stepTag: 'Etapa 1 de 4 • Início',
      title: 'Selecione o Cliente',
      shortLabel: 'Etapa 1: Selecionar Cliente',
      message: 'Nenhum cliente ativo no momento. Identifique o paciente pelo CPF ou inicie uma dispensação rápida.',
      icon: 'fa-user-check',
      badgeColor: '#38bdf8',
      badgeTextColor: '#38bdf8',
      borderColor: 'rgba(56, 189, 248, 0.4)',
      glowColor: 'rgba(56, 189, 248, 0.2)',
      headerBg: 'linear-gradient(135deg, rgba(2, 132, 199, 0.3), rgba(15, 23, 42, 0.9))',
      btnPrimaryBg: 'linear-gradient(135deg, #0284c7, #0369a1)',
      btnPrimaryShadow: 'rgba(2, 132, 199, 0.4)',
      primaryActionHtml: '<i class="fa-solid fa-users"></i> Buscar / Selecionar Cliente',
      onPrimaryClick: () => {
        if (window.switchTab) window.switchTab('pacientes');
      },
      secondaryActionHtml: '<i class="fa-solid fa-barcode"></i> Dispensação Rápida / PDV',
      onSecondaryClick: () => {
        if (window.openQuickCheckoutModal) window.openQuickCheckoutModal();
      }
    };
  }

  const pName = p.name || p.fullName || 'Cliente';

  // CASO 3: PACIENTE SELECIONADO NA ABA CLIENTES (Etapa 2 - Triagem & Anamnese)
  if (state.activeTab === 'pacientes' || currentFlowState.stepId === 'paciente_selecionado') {
    return {
      stepNum: 2,
      stepTag: 'Etapa 2 de 4 • Triagem',
      title: `Cliente: ${pName}`,
      shortLabel: `Etapa 2: Atender ${pName.split(' ')[0]}`,
      message: `Cliente <strong>${pName}</strong> em atendimento. Registre a queixa de saúde ou inicie um serviço clínico.`,
      icon: 'fa-stethoscope',
      badgeColor: '#10b981',
      badgeTextColor: '#34d399',
      borderColor: 'rgba(16, 185, 129, 0.4)',
      glowColor: 'rgba(16, 185, 129, 0.2)',
      headerBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(15, 23, 42, 0.9))',
      btnPrimaryBg: 'linear-gradient(135deg, #10b981, #059669)',
      btnPrimaryShadow: 'rgba(16, 185, 129, 0.35)',
      primaryActionHtml: '<i class="fa-solid fa-stethoscope"></i> Iniciar Atendimento Clínico (CDSS)',
      onPrimaryClick: () => {
        if (window.startNewPharmacyConsultationForClient) {
          window.startNewPharmacyConsultationForClient(p.id, pName);
        } else if (window.switchTab) {
          window.switchTab('farmacia');
        }
      },
      secondaryActionHtml: '<i class="fa-solid fa-syringe"></i> Aplicar Vacina / Injetável (DSF)',
      onSecondaryClick: () => {
        if (window.openVaccinationModal) {
          window.openVaccinationModal({ id: p.id, name: pName, cpf: p.cpf, phone: p.cellphone || p.phone });
        }
      }
    };
  }

  // CASO 4: NA ABA FARMÁCIA / CONSULTA (Etapa 3 - CDSS & Prescrição)
  if (state.activeTab === 'farmacia') {
    return {
      stepNum: 3,
      stepTag: 'Etapa 3 de 4 • Prescrição',
      title: 'CDSS & Dispensação',
      shortLabel: 'Etapa 3: CDSS & Prescrição',
      message: `Elabore a prescrição de <strong>${pName}</strong> e valide as interações medicamentosas pelo CDSS 4D.`,
      icon: 'fa-prescription-bottle-medical',
      badgeColor: '#a855f7',
      badgeTextColor: '#c084fc',
      borderColor: 'rgba(168, 85, 247, 0.4)',
      glowColor: 'rgba(168, 85, 247, 0.2)',
      headerBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(15, 23, 42, 0.9))',
      btnPrimaryBg: 'linear-gradient(135deg, #a855f7, #7e22ce)',
      btnPrimaryShadow: 'rgba(168, 85, 247, 0.35)',
      primaryActionHtml: '<i class="fa-solid fa-file-signature"></i> Finalizar &amp; Emitir Declaração DSF',
      onPrimaryClick: () => {
        if (window.switchTab) window.switchTab('relatorios');
      },
      secondaryActionHtml: '<i class="fa-solid fa-signature"></i> Assinatura Digital ICP-Brasil',
      onSecondaryClick: () => {
        if (window.renderDigitalSignatureModal) {
          window.renderDigitalSignatureModal({ docTitle: `Prescrição Farmacêutica - ${pName}`, docType: 'DSF' });
        }
      }
    };
  }

  // CASO 5: NA ABA DECLARAÇÕES & RELATÓRIOS (Etapa 4 - Assinatura e Envio)
  if (state.activeTab === 'relatorios') {
    return {
      stepNum: 4,
      stepTag: 'Etapa 4 de 4 • Finalização',
      title: 'Emitir & Concluir',
      shortLabel: 'Etapa 4: Emissão & Conclusão',
      message: `Assine a Declaração de Serviço Farmacêutico (DSF) de <strong>${pName}</strong> e envie no WhatsApp.`,
      icon: 'fa-file-signature',
      badgeColor: '#f59e0b',
      badgeTextColor: '#fbbf24',
      borderColor: 'rgba(245, 158, 11, 0.4)',
      glowColor: 'rgba(245, 158, 11, 0.2)',
      headerBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(15, 23, 42, 0.9))',
      btnPrimaryBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
      btnPrimaryShadow: 'rgba(245, 158, 11, 0.35)',
      primaryActionHtml: '<i class="fa-solid fa-circle-check"></i> Concluir Atendimento',
      onPrimaryClick: () => {
        completeFlow(`Atendimento de <strong>${pName}</strong> finalizado com sucesso!`);
      },
      secondaryActionHtml: '<i class="fa-brands fa-whatsapp"></i> Disparar Comprovante WhatsApp',
      onSecondaryClick: () => {
        if (window.sendToWhatsApp) {
          window.sendToWhatsApp(p.cellphone || p.phone || '', `Olá, ${pName}. Segue sua Declaração de Serviço Farmacêutico (DSF) emitida em nosso consultório.`);
        }
      }
    };
  }

  // DEFAULT: RETAGUARDA / GESTÃO
  return {
    stepNum: 1,
    stepTag: 'Guia do Atendimento',
    title: 'Consultório Clínico',
    shortLabel: 'Guia de Atendimento',
    message: `Paciente em foco: <strong>${pName}</strong>. Clique abaixo para retornar ao atendimento clínico.`,
    icon: 'fa-compass',
    badgeColor: '#10b981',
    badgeTextColor: '#34d399',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    glowColor: 'rgba(16, 185, 129, 0.2)',
    headerBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(15, 23, 42, 0.9))',
    btnPrimaryBg: 'linear-gradient(135deg, #10b981, #059669)',
    btnPrimaryShadow: 'rgba(16, 185, 129, 0.35)',
    primaryActionHtml: '<i class="fa-solid fa-stethoscope"></i> Ir para Balcão Clínico',
    onPrimaryClick: () => {
      if (window.switchTab) window.switchTab('farmacia');
    },
    secondaryActionHtml: '<i class="fa-solid fa-users"></i> Ver Ficha do Paciente',
    onSecondaryClick: () => {
      if (window.switchTab) window.switchTab('pacientes');
    }
  };
}

// Atualiza o estado do guia externamente
export function updateFlowGuideStep(stepId, customMessage = null) {
  currentFlowState.stepId = stepId;
  if (customMessage) currentFlowState.customMessage = customMessage;
  renderSmartFlowGuide();
}

// Marca o fluxo como concluído com feedback visual e sonoro
export function completeFlow(message = null) {
  currentFlowState.stepId = 'concluido';
  currentFlowState.isMinimized = false;
  if (message) currentFlowState.customMessage = message;
  playBeepSound('success');
  renderSmartFlowGuide();
  
  if (typeof window.showFlowCompletionNotification === 'function') {
    const p = state.activePatient;
    const pName = p ? (p.name || p.fullName) : 'Cliente';
    window.showFlowCompletionNotification({
      flowType: 'completed',
      badgeText: 'FLUXO CLÍNICO CONCLUÍDO',
      badgeIcon: 'fa-circle-check',
      icon: 'fa-circle-check',
      actionTitle: `🎉 Atendimento de ${pName} Finalizado`,
      message: message || `Prescrição, orientações e Declaração de Serviço Farmacêutico (DSF) salvas com sucesso.`,
      targetTab: 'farmacia',
      targetTabLabel: 'Consultório Clínico',
      actionButtonText: 'Novo Atendimento >',
      onActionClick: () => {
        state.activePatient = null;
        if (window.switchTab) window.switchTab('pacientes');
      }
    });
  }
}
