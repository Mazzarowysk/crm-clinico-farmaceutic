// ==========================================
// CRM Clínico Farmacêutico — Keyboard Shortcuts & Navigation Module
// Navegação 100% por Teclado (F1 a F12 + Command Palette + Hotkeys)
// ==========================================

import { showToast, showCustomAlert } from './ui.js';
import { state } from '../state.js';

export const KEYBOARD_SHORTCUTS = [
  { key: 'F1',  tab: 'manual',        label: 'Ajuda & Manual Interativo',  icon: 'fa-book-medical', action: () => openHelpShortcutsModal() },
  { key: 'F2',  tab: 'farmacia',      label: 'CRM Farmacêutico & Balcão', icon: 'fa-prescription-bottle-medical', action: () => navigate('farmacia') },
  { key: 'F3',  tab: 'pacientes',     label: 'Clientes & Prontuário',      icon: 'fa-users', action: () => navigate('pacientes') },
  { key: 'F4',  tab: 'estoque',       label: 'Estoque & Suprimentos',      icon: 'fa-boxes-stacked', action: () => navigate('estoque') },
  { key: 'F6',  tab: 'financeiro',    label: 'Controle Financeiro',        icon: 'fa-sack-dollar', action: () => navigate('financeiro') },
  { key: 'F7',  tab: 'relatorios',    label: 'Declarações (DSF) & Laudos', icon: 'fa-file-signature', action: () => navigate('relatorios') },
  { key: 'F8',  tab: 'dashboard',     label: 'Métricas do Consultório',    icon: 'fa-chart-line', action: () => navigate('dashboard') },
  { key: 'F9',  tab: 'configuracoes', label: 'Configurações & Gestão',     icon: 'fa-sliders', action: () => navigate('configuracoes') },
  { key: 'F10', tab: 'pdv',           label: 'Caixa Rápido / PDV',         icon: 'fa-cash-register', action: () => openPDV() },
  { key: 'F11', tab: 'compact',       label: 'Alternar Modo Compacto',     icon: 'fa-compress', action: () => toggleCompactMode() },
  { key: 'F12', tab: 'solar',         label: 'Modo Alto Contraste Solar',  icon: 'fa-sun', action: () => toggleSolarTheme() }
];

function navigate(tabName) {
  if (typeof window.switchTab === 'function') {
    window.switchTab(tabName);
    showToast(`⚡ Atalho: Aba ${tabName.toUpperCase()} ativada!`);
  }
}

function openPDV() {
  if (typeof window.openQuickCheckoutModal === 'function') {
    window.openQuickCheckoutModal();
  } else {
    navigate('financeiro');
  }
}

function toggleCompactMode() {
  const isCompact = document.body.classList.toggle('compact-mode');
  localStorage.setItem('hn_density', isCompact ? 'compact' : 'normal');
  const icon = document.getElementById('density-icon');
  const label = document.getElementById('density-label');
  if (icon) icon.className = isCompact ? 'fa-solid fa-expand' : 'fa-solid fa-compress';
  if (label) label.textContent = isCompact ? 'Modo Normal' : 'Modo Compacto';
  showToast(isCompact ? '📐 Modo Compacto Hospitalar ativado!' : '📐 Modo Normal ativado.');
}

function toggleSolarTheme() {
  if (typeof window.cycleTheme === 'function') {
    window.cycleTheme();
  } else {
    document.body.classList.toggle('sunlight-theme');
    const isSolar = document.body.classList.contains('sunlight-theme');
    showToast(isSolar ? '☀️ Modo Alto Contraste Solar (Anti-Reflexo) Ativado!' : '🌙 Modo Padrão Restaurado.');
  }
}

export function openHelpShortcutsModal() {
  const existing = document.getElementById('shortcuts-help-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'shortcuts-help-modal';
  modal.className = 'modal-overlay';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(10,8,22,0.85);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;z-index:999999;animation:fadeIn 0.25s ease-out;';

  modal.innerHTML = `
    <div style="background: #0f172a; border: 1.5px solid #38bdf8; border-radius: 20px; width: 92%; max-width: 680px; padding: 26px; box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 35px rgba(56,189,248,0.25); color: #f8fafc; font-family: 'Outfit', sans-serif; position: relative;">
      
      <button id="close-shortcuts-modal" type="button" style="position: absolute; top: 18px; right: 18px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 1.1rem; cursor: pointer; padding: 6px 10px; border-radius: 8px; transition: all 0.2s;" onmouseenter="this.style.background='#ef4444'; this.style.color='#fff'" onmouseleave="this.style.background='rgba(255,255,255,0.08)'; this.style.color='#cbd5e1'">
        <i class="fa-solid fa-xmark"></i>
      </button>

      <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px;">
        <div style="width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, rgba(14,165,233,0.25), rgba(13,148,136,0.35)); border: 1.5px solid #38bdf8; display: flex; align-items: center; justify-content: center; color: #38bdf8; font-size: 1.4rem;">
          <i class="fa-solid fa-keyboard"></i>
        </div>
        <div>
          <h2 style="margin: 0; font-size: 1.35rem; font-weight: 800; color: #ffffff;">Navegação 100% por Teclado</h2>
          <span style="font-size: 0.82rem; color: #94a3b8; font-family: 'Inter', sans-serif;">Atalhos rápidos para alta produtividade no balcão e consultório</span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 22px;">
        ${KEYBOARD_SHORTCUTS.map(s => `
          <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 10px; font-family: 'Inter', sans-serif; font-size: 0.85rem;">
              <i class="fa-solid ${s.icon}" style="color: #38bdf8; width: 18px; text-align: center;"></i>
              <span style="color: #e2e8f0; font-weight: 600;">${s.label}</span>
            </div>
            <kbd style="background: #1e293b; border: 1px solid #64748b; color: #38bdf8; padding: 3px 8px; border-radius: 6px; font-size: 0.76rem; font-weight: 800; font-family: monospace; box-shadow: 0 2px 4px rgba(0,0,0,0.4);">${s.key}</kbd>
          </div>
        `).join('')}
      </div>

      <div style="background: rgba(15, 23, 42, 0.8); border-left: 4px solid #10b981; padding: 10px 14px; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 0.8rem; color: #94a3b8; display: flex; justify-content: space-between; align-items: center;">
        <span><strong style="color: #fff;"><kbd style="background:#334155;color:#fff;padding:1px 5px;border-radius:4px;">Ctrl</kbd> + <kbd style="background:#334155;color:#fff;padding:1px 5px;border-radius:4px;">K</kbd></strong> para Busca Global com Inteligência (Spotlight PLN)</span>
        <button id="btn-close-shortcuts-footer" class="btn btn-primary" style="padding: 6px 16px; font-size: 0.82rem; font-weight: 700; border-radius: 8px; cursor: pointer; background: linear-gradient(135deg, #0284c7, #0369a1); border: none; color: #fff;">Entendi</button>
      </div>

    </div>
  `;

  document.body.appendChild(modal);
  const close = () => modal.remove();
  document.getElementById('close-shortcuts-modal').addEventListener('click', close);
  document.getElementById('btn-close-shortcuts-footer').addEventListener('click', close);
}

export function initGlobalKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignorar atalhos de função se o foco estiver em um input de texto digitando
    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);

    // Permitir F1 a F12 mesmo digitando se for tecla de função pura (exceto F5 de reload padrão)
    const key = e.key;

    if (key === 'F1') {
      e.preventDefault();
      openHelpShortcutsModal();
      return;
    }
    if (key === 'F2') { e.preventDefault(); navigate('farmacia'); return; }
    if (key === 'F3') { e.preventDefault(); navigate('pacientes'); return; }
    if (key === 'F4') { e.preventDefault(); navigate('estoque'); return; }
    if (key === 'F6') { e.preventDefault(); navigate('financeiro'); return; }
    if (key === 'F7') { e.preventDefault(); navigate('relatorios'); return; }
    if (key === 'F8') { e.preventDefault(); navigate('dashboard'); return; }
    if (key === 'F9') { e.preventDefault(); navigate('configuracoes'); return; }
    if (key === 'F10') { e.preventDefault(); openPDV(); return; }
    if (key === 'F11') {
      e.preventDefault();
      toggleCompactMode();
      return;
    }
    if (key === 'F12') {
      e.preventDefault();
      toggleSolarTheme();
      return;
    }

    // Atalho Shift + ? para abrir ajuda de atalhos
    if (e.key === '?' && !isTyping) {
      e.preventDefault();
      openHelpShortcutsModal();
    }
  });

  renderFloatingShortcutBar();
}

function renderFloatingShortcutBar() {
  let bar = document.getElementById('floating-shortcut-bar');
  if (bar) return;

  bar = document.createElement('div');
  bar.id = 'floating-shortcut-bar';
  bar.style.cssText = `
    position: fixed;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 23, 42, 0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 24px;
    padding: 4px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 9999;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
    font-family: 'Inter', sans-serif;
    font-size: 0.72rem;
    color: #94a3b8;
    user-select: none;
    transition: opacity 0.3s ease;
  `;

  bar.innerHTML = `
    <span style="display: flex; align-items: center; gap: 4px; color: #38bdf8; font-weight: 700;">
      <i class="fa-solid fa-bolt"></i> Atalhos:
    </span>
    <span><kbd style="background:#1e293b;color:#38bdf8;padding:1px 5px;border-radius:4px;border:1px solid #475569;">F2</kbd> Balcão</span>
    <span><kbd style="background:#1e293b;color:#38bdf8;padding:1px 5px;border-radius:4px;border:1px solid #475569;">F3</kbd> Pacientes</span>
    <span><kbd style="background:#1e293b;color:#38bdf8;padding:1px 5px;border-radius:4px;border:1px solid #475569;">F4</kbd> Estoque</span>
    <span><kbd style="background:#1e293b;color:#38bdf8;padding:1px 5px;border-radius:4px;border:1px solid #475569;">F6</kbd> Caixa</span>
    <span><kbd style="background:#1e293b;color:#38bdf8;padding:1px 5px;border-radius:4px;border:1px solid #475569;">F10</kbd> PDV</span>
    <span><kbd style="background:#1e293b;color:#38bdf8;padding:1px 5px;border-radius:4px;border:1px solid #475569;">F12</kbd> Solar</span>
    <button id="btn-open-shortcuts-guide" style="background: rgba(56,189,248,0.2); border: 1px solid rgba(56,189,248,0.4); color: #38bdf8; border-radius: 12px; padding: 2px 8px; cursor: pointer; font-size: 0.68rem; font-weight: 700; display: flex; align-items: center; gap: 4px;">
      <i class="fa-solid fa-circle-question"></i> Mais (F1)
    </button>
  `;

  document.body.appendChild(bar);
  document.getElementById('btn-open-shortcuts-guide')?.addEventListener('click', openHelpShortcutsModal);
}
