// ==========================================
// CRM Clínico Farmacêutico — Routing & Navigation Controller
// Desacoplamento Arquitetural e Controle de Rotas / Abas SPA
// ==========================================

import { state } from '../state.js';
import { getRolePermissions } from './auth.js';
import { showCustomAlert, showToast } from './ui.js';
import { showInteractiveManualModal } from '../manualTabbed.js';
import { renderSmartFlowGuide } from './smartFlowGuide.js';

// Importação dos renderizadores de cada aba
import { renderPharmacyTab } from '../tabs/pharmacy.js';
import { renderPatientsTab } from '../tabs/patients.js';
import { renderInventoryTab } from '../tabs/inventory.js';
import { renderFinancialTab } from '../tabs/financial.js';
import { renderReportsTab } from '../tabs/reports.js';
import { renderDashboardTab } from '../tabs/dashboard.js';
import { renderSettingsTab } from '../tabs/settings.js';

export const TAB_METADATA = {
  farmacia:      { label: 'CRM Farmacêutico & Balcão de Atendimento', shortLabel: 'Balcão', icon: 'fa-prescription-bottle-medical', group: 'frente' },
  pacientes:     { label: 'Prontuário Longitudinal & Pacientes',        shortLabel: 'Pacientes', icon: 'fa-users', group: 'frente' },
  estoque:       { label: 'Controle de Estoque & Catálogo Farmacêutico', shortLabel: 'Estoque', icon: 'fa-boxes-stacked', group: 'suprimentos' },
  financeiro:    { label: 'Controle Financeiro & Fluxo de Caixa',      shortLabel: 'Financeiro', icon: 'fa-sack-dollar', group: 'suprimentos' },
  relatorios:    { label: 'Declarações Farmacêuticas (DSF) & Relatórios', shortLabel: 'Relatórios', icon: 'fa-file-signature', group: 'frente' },
  dashboard:     { label: 'Métricas & Indicadores do Consultório',      shortLabel: 'Métricas', icon: 'fa-chart-line', group: 'frente' },
  configuracoes: { label: 'Configurações & Gestão de Operadores',       shortLabel: 'Configurações', icon: 'fa-sliders', group: 'suprimentos' }
};

export function switchTab(tabName, isBack = false) {
  const perms = getRolePermissions(state.user);
  if (perms && perms.allowedTabs && !perms.allowedTabs.includes(tabName)) {
    showCustomAlert({
      title: 'Acesso Restrito',
      message: `Seu perfil (<strong>${perms.label}</strong>) não possui autorização para acessar esta funcionalidade.`,
      type: 'warning'
    });
    return;
  }

  // Registrar histórico de navegação global
  if (!isBack && state.activeTab && state.activeTab !== tabName) {
    if (!state.navHistory) state.navHistory = [];
    if (state.navHistory[state.navHistory.length - 1] !== state.activeTab) {
      state.navHistory.push(state.activeTab);
    }
  }

  state.activeTab = tabName;
  updateGlobalBackButton();

  // Remover toast de fluxo pendente para esta aba de destino se houver
  const existingFlowToast = document.querySelector(`[data-flow-target-tab="${tabName}"]`);
  if (existingFlowToast) {
    existingFlowToast.style.transform = 'translateX(120%)';
    existingFlowToast.style.opacity = '0';
    setTimeout(() => existingFlowToast.remove(), 300);
  }

  // Atualiza classes ativas na barra lateral
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Atualiza o título do cabeçalho e da aba do navegador
  const meta = TAB_METADATA[tabName] || { label: tabName.toUpperCase() };
  const pageTitle = document.getElementById('page-title-label');
  if (pageTitle) pageTitle.textContent = meta.label;
  document.title = `${meta.label} — CRM Clínico Farmacêutico`;

  // Renderiza o conteúdo da aba ativa
  renderTabContent();

  // Atualiza o Card Flutuante Guia de Fluxo
  if (typeof renderSmartFlowGuide === 'function') {
    renderSmartFlowGuide();
  }
}

export async function renderTabContent() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  const current = state.activeTab || 'farmacia';

  switch (current) {
    case 'farmacia':
      renderPharmacyTab();
      break;
    case 'pacientes':
      renderPatientsTab(contentArea);
      break;
    case 'estoque':
      renderInventoryTab(contentArea);
      break;
    case 'financeiro':
      renderFinancialTab(contentArea);
      break;
    case 'relatorios':
      renderReportsTab(contentArea);
      break;
    case 'dashboard':
      await renderDashboardTab(contentArea);
      break;
    case 'configuracoes':
      renderSettingsTab(contentArea);
      break;
    default:
      state.activeTab = 'farmacia';
      renderPharmacyTab();
      break;
  }
}

export function updateGlobalBackButton() {
  const backBtn = document.getElementById('global-back-btn');
  const backLabel = document.getElementById('global-back-label');
  if (!backBtn) return;

  if (state.navHistory && state.navHistory.length > 0) {
    const prevTab = state.navHistory[state.navHistory.length - 1];
    const prevMeta = TAB_METADATA[prevTab];
    const prevName = prevMeta ? prevMeta.shortLabel : prevTab;
    if (backLabel) backLabel.textContent = `Voltar para ${prevName}`;
    backBtn.style.display = 'inline-flex';
  } else {
    backBtn.style.display = 'none';
  }
}

export function goBack() {
  if (state.navHistory && state.navHistory.length > 0) {
    const prevTab = state.navHistory.pop();
    showToast(`⬅️ Voltando para a tela anterior...`);
    switchTab(prevTab, true);
  }
}

// Vincula ao escopo global do navegador
if (typeof window !== 'undefined') {
  window.switchTab = switchTab;
  window.renderTabContent = renderTabContent;
  window.goBack = goBack;
  window.updateGlobalBackButton = updateGlobalBackButton;
  window.TAB_METADATA = TAB_METADATA;
}
