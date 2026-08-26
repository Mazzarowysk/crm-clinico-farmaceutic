// src/modules/cashRegister.js
// MÓDULO DE GESTÃO DE CAIXA DIÁRIO: ABERTURA, SUPRIMENTO, SANGRIA, FECHAMENTO E CUPOM TÉRMICO

import * as localDB from '../localDB.js';
import { state } from '../state.js';
import { showToast, showCustomAlert, showCustomConfirm } from './ui.js';
import { syncManager } from './sync.js';
import { printThermalReceipt } from './thermalReceipt.js';

// Retorna o caixa atualmente aberto
export function getActiveCashRegister() {
  const registers = localDB.list('cash_registers') || [];
  return registers.find(r => r.status === 'aberto') || null;
}

// Abre o modal principal de Gestão de Caixa
export function openCashRegisterModal(onUpdated = null) {
  const existing = document.getElementById('cash-register-modal');
  if (existing) existing.remove();

  const activeCash = getActiveCashRegister();

  const modal = document.createElement('div');
  modal.id = 'cash-register-modal';
  modal.className = 'pep-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 15, 29, 0.9); backdrop-filter: blur(16px);
    display: flex; justify-content: center; align-items: center; z-index: 10004; padding: 16px;
  `;

  if (!activeCash) {
    // TELA DE ABERTURA DE CAIXA
    modal.innerHTML = `
      <div style="width: 100%; max-width: 480px; background: #0f172a; border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 20px; padding: 24px; box-shadow: 0 25px 60px rgba(0,0,0,0.9);">
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
              <i class="fa-solid fa-cash-register"></i>
            </div>
            <div>
              <h3 style="margin: 0; color: #fff; font-family: 'Outfit'; font-size: 1.2rem; font-weight: 700;">
                Abertura de Caixa
              </h3>
              <small style="color: #94a3b8;">Nenhum turno de caixa aberto no momento</small>
            </div>
          </div>
          <button id="btn-close-cash-modal" style="background: none; border: none; color: #94a3b8; font-size: 1.3rem; cursor: pointer;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form id="form-open-cash" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="display: block; font-size: 0.8rem; color: #cbd5e1; font-weight: 700; margin-bottom: 4px;">
              Operador Responsável:
            </label>
            <input type="text" class="form-input" value="${state.user?.name || 'Operador'} (${state.user?.role || 'Farmacêutico'})" disabled style="background: rgba(30, 41, 59, 0.5); color: #94a3b8; font-weight: 600;">
          </div>

          <div>
            <label style="display: block; font-size: 0.8rem; color: #34d399; font-weight: 700; margin-bottom: 4px;">
              * Fundo de Troco Inicial (R$):
            </label>
            <input type="number" id="input-initial-cash" min="0" step="1" value="100.00" required class="form-input" style="font-size: 1.1rem; font-weight: 800; color: #34d399; background: #0f172a; border-color: #10b981; height: 42px;">
            <small style="color: #94a3b8; font-size: 0.72rem; display: block; margin-top: 3px;">
              Valor em dinheiro disponível na gaveta para troco ao iniciar o dia.
            </small>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px;">
            <button type="button" id="btn-cancel-open-cash" class="btn" style="background: rgba(255,255,255,0.06); color: #94a3b8; border: 1px solid rgba(255,255,255,0.12); padding: 9px 16px; border-radius: 8px;">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, #10b981, #059669); border: none; padding: 9px 22px; border-radius: 8px; font-weight: 700; color: #fff;">
              <i class="fa-solid fa-lock-open"></i> Abrir Caixa
            </button>
          </div>
        </form>

      </div>
    `;
    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    document.getElementById('btn-close-cash-modal')?.addEventListener('click', closeModal);
    document.getElementById('btn-cancel-open-cash')?.addEventListener('click', closeModal);

    document.getElementById('form-open-cash')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const initialCash = parseFloat(document.getElementById('input-initial-cash').value || 0);
      const currentUser = state.user || {};
      const newRegister = {
        protocol: `CX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
        operator_name: `${currentUser.name || 'Operador'} (${currentUser.role || 'Farmacêutico'})`,
        opened_at: new Date().toISOString(),
        initial_cash: initialCash,
        status: 'aberto',
        closed_at: null,
        movements: [],
        counted_cash: null,
        difference: null
      };

      localDB.insert('cash_registers', newRegister);
      syncManager.pushToCloud(false);
      showToast(`✅ Caixa #${newRegister.protocol} aberto com R$ ${initialCash.toFixed(2).replace('.', ',')} de fundo de troco!`);
      closeModal();
      if (typeof onUpdated === 'function') onUpdated();
    });

    return;
  }

  // TELA DE CONTROLE DE CAIXA ABERTO
  const sales = (localDB.list('sales') || []).filter(s => new Date(s.created_at) >= new Date(activeCash.opened_at));
  
  let totalDinheiro = 0;
  let totalPix = 0;
  let totalDebito = 0;
  let totalCredito = 0;
  let totalConvenio = 0;
  let totalDescontos = 0;

  sales.forEach(s => {
    const val = parseFloat(s.totalSale || 0);
    const disc = parseFloat(s.discount || 0);
    totalDescontos += disc;
    const method = (s.paymentMethod || '').toLowerCase();

    if (method.includes('dinheiro')) totalDinheiro += val;
    else if (method.includes('pix')) totalPix += val;
    else if (method.includes('débito') || method.includes('debito')) totalDebito += val;
    else if (method.includes('crédito') || method.includes('credito')) totalCredito += val;
    else if (method.includes('convênio') || method.includes('prazo')) totalConvenio += val;
    else totalDinheiro += val;
  });

  const totalVendas = totalDinheiro + totalPix + totalDebito + totalCredito + totalConvenio;

  let totalSuprimento = 0;
  let totalSangria = 0;
  (activeCash.movements || []).forEach(m => {
    if (m.type === 'suprimento') totalSuprimento += parseFloat(m.amount || 0);
    if (m.type === 'sangria') totalSangria += parseFloat(m.amount || 0);
  });

  const expectedCashInDrawer = (activeCash.initial_cash || 0) + totalDinheiro + totalSuprimento - totalSangria;

  modal.innerHTML = `
    <div style="width: 100%; max-width: 820px; max-height: 92vh; display: flex; flex-direction: column; background: #0f172a; border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 20px; padding: 22px; box-shadow: 0 25px 60px rgba(0,0,0,0.9); overflow: hidden;">
      
      <!-- Cabeçalho -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #0284c7, #0369a1); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.3rem;">
            <i class="fa-solid fa-cash-register"></i>
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h3 style="margin: 0; color: #fff; font-family: 'Outfit'; font-size: 1.25rem; font-weight: 700;">
                Caixa Aberto: #${activeCash.protocol}
              </h3>
              <span style="font-size: 0.7rem; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16,185,129,0.4); padding: 2px 8px; border-radius: 10px; font-weight: 700;">
                TURNO ATIVO
              </span>
            </div>
            <p style="margin: 2px 0 0; font-size: 0.78rem; color: #94a3b8;">
              Aberto em ${new Date(activeCash.opened_at).toLocaleString('pt-BR')} por <strong>${activeCash.operator_name}</strong>
            </p>
          </div>
        </div>
        <button id="btn-close-cash-modal" style="background: none; border: none; color: #94a3b8; font-size: 1.3rem; cursor: pointer;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px; flex: 1; overflow-y: auto; padding-right: 4px;">
        
        <!-- RESUMO FINANCEIRO DO TURNO -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px;">
          
          <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px;">
            <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase;">Fundo Inicial</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: #fff; margin-top: 2px; font-family: 'Outfit';">
              R$ ${(activeCash.initial_cash || 0).toFixed(2).replace('.', ',')}
            </div>
          </div>

          <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 12px;">
            <div style="font-size: 0.72rem; color: #34d399; text-transform: uppercase;">Total Vendas</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: #34d399; margin-top: 2px; font-family: 'Outfit';">
              R$ ${totalVendas.toFixed(2).replace('.', ',')}
            </div>
            <small style="font-size: 0.68rem; color: #94a3b8;">${sales.length} cupom(ns)</small>
          </div>

          <div style="background: rgba(56, 189, 248, 0.12); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 12px; padding: 12px;">
            <div style="font-size: 0.72rem; color: #38bdf8; text-transform: uppercase; font-weight: 700;">💵 Dinheiro na Gaveta</div>
            <div style="font-size: 1.35rem; font-weight: 900; color: #38bdf8; margin-top: 2px; font-family: 'Outfit';">
              R$ ${expectedCashInDrawer.toFixed(2).replace('.', ',')}
            </div>
            <small style="font-size: 0.68rem; color: #94a3b8;">Esperado físico</small>
          </div>

          <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 12px;">
            <div style="font-size: 0.72rem; color: #fbbf24; text-transform: uppercase;">Retiradas / Sangrias</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: #fbbf24; margin-top: 2px; font-family: 'Outfit';">
              - R$ ${totalSangria.toFixed(2).replace('.', ',')}
            </div>
          </div>

        </div>

        <!-- DETALHAMENTO POR FORMA DE PAGAMENTO -->
        <div style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px;">
          <strong style="font-size: 0.85rem; color: #fff; margin-bottom: 10px; display: block; font-family: 'Outfit';">
            <i class="fa-solid fa-chart-pie" style="color: #38bdf8;"></i> Apuração por Forma de Pagamento
          </strong>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; font-size: 0.8rem;">
            <div style="background: rgba(15, 23, 42, 0.6); padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.04);">
              <span style="color: #94a3b8; display: block; font-size: 0.72rem;">💵 Dinheiro:</span>
              <strong style="color: #fff;">R$ ${totalDinheiro.toFixed(2).replace('.', ',')}</strong>
            </div>
            <div style="background: rgba(15, 23, 42, 0.6); padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.04);">
              <span style="color: #94a3b8; display: block; font-size: 0.72rem;">📱 PIX:</span>
              <strong style="color: #06b6d4;">R$ ${totalPix.toFixed(2).replace('.', ',')}</strong>
            </div>
            <div style="background: rgba(15, 23, 42, 0.6); padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.04);">
              <span style="color: #94a3b8; display: block; font-size: 0.72rem;">💳 Cartão Débito:</span>
              <strong style="color: #38bdf8;">R$ ${totalDebito.toFixed(2).replace('.', ',')}</strong>
            </div>
            <div style="background: rgba(15, 23, 42, 0.6); padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.04);">
              <span style="color: #94a3b8; display: block; font-size: 0.72rem;">💳 Cartão Crédito:</span>
              <strong style="color: #a855f7;">R$ ${totalCredito.toFixed(2).replace('.', ',')}</strong>
            </div>
            <div style="background: rgba(15, 23, 42, 0.6); padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.04);">
              <span style="color: #94a3b8; display: block; font-size: 0.72rem;">📋 Convênio/Prazo:</span>
              <strong style="color: #fbbf24;">R$ ${totalConvenio.toFixed(2).replace('.', ',')}</strong>
            </div>
          </div>
        </div>

        <!-- MOVIMENTAÇÕES DE SANGRIA E SUPRIMENTO -->
        <div style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="font-size: 0.85rem; color: #fff; font-family: 'Outfit';">
              <i class="fa-solid fa-arrow-right-arrow-left" style="color: #fbbf24;"></i> Sangrias &amp; Suprimentos do Turno
            </strong>
            <div style="display: flex; gap: 8px;">
              <button type="button" id="btn-cash-suprimento" class="btn" style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; cursor: pointer;">
                + Suprimento (Troco)
              </button>
              <button type="button" id="btn-cash-sangria" class="btn" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; cursor: pointer;">
                - Sangria (Retirada)
              </button>
            </div>
          </div>

          ${(activeCash.movements || []).length === 0 ? `
            <div style="font-size: 0.78rem; color: #64748b; text-align: center; padding: 10px;">Nenhuma sangria ou suprimento registrado neste turno.</div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${activeCash.movements.map(m => `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.6); padding: 6px 10px; border-radius: 6px; font-size: 0.78rem;">
                  <div>
                    <strong style="color: ${m.type === 'suprimento' ? '#34d399' : '#f87171'}; text-transform: uppercase;">
                      ${m.type === 'suprimento' ? '+ Suprimento' : '- Sangria'}:
                    </strong>
                    <span style="color: #cbd5e1; margin-left: 4px;">${m.reason || 'Sem motivo'}</span>
                    <small style="color: #64748b; display: block; font-size: 0.68rem;">${new Date(m.created_at).toLocaleTimeString('pt-BR')}</small>
                  </div>
                  <strong style="font-size: 0.88rem; color: ${m.type === 'suprimento' ? '#34d399' : '#f87171'};">
                    ${m.type === 'suprimento' ? '+' : '-'} R$ ${(parseFloat(m.amount || 0)).toFixed(2).replace('.', ',')}
                  </strong>
                </div>
              `).join('')}
            </div>
          `}
        </div>

      </div>

      <!-- Rodapé de Ações: Fechar Caixa & Cupom -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px;">
        <button type="button" id="btn-print-active-cash" class="btn" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; padding: 9px 14px; border-radius: 8px; font-weight: 600; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-print"></i> Extrato Parcial Térmico
        </button>

        <div style="display: flex; gap: 10px;">
          <button type="button" id="btn-close-modal-bottom" class="btn" style="background: rgba(255,255,255,0.06); color: #94a3b8; border: 1px solid rgba(255,255,255,0.12); padding: 9px 16px; border-radius: 8px; cursor: pointer;">
            Continuar Atendendo
          </button>
          <button type="button" id="btn-trigger-close-cash" class="btn btn-primary" style="background: linear-gradient(135deg, #ef4444, #dc2626); border: none; padding: 9px 20px; border-radius: 8px; font-weight: 700; color: #fff; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-lock"></i> Encerrar Turno &amp; Fechar Caixa
          </button>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();
  document.getElementById('btn-close-cash-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-close-modal-bottom')?.addEventListener('click', closeModal);

  // Botão Suprimento
  document.getElementById('btn-cash-suprimento')?.addEventListener('click', () => {
    openMovementModal(activeCash, 'suprimento', () => {
      closeModal();
      openCashRegisterModal(onUpdated);
    });
  });

  // Botão Sangria
  document.getElementById('btn-cash-sangria')?.addEventListener('click', () => {
    openMovementModal(activeCash, 'sangria', () => {
      closeModal();
      openCashRegisterModal(onUpdated);
    });
  });

  // Impressão Parcial
  document.getElementById('btn-print-active-cash')?.addEventListener('click', () => {
    printCashRegisterReceipt({
      activeCash,
      totalVendas,
      totalDinheiro,
      totalPix,
      totalDebito,
      totalCredito,
      totalConvenio,
      totalSuprimento,
      totalSangria,
      expectedCashInDrawer,
      salesCount: sales.length,
      isFinal: false
    });
  });

  // Fechar Caixa (Conferência Cega)
  document.getElementById('btn-trigger-close-cash')?.addEventListener('click', () => {
    openCloseCashVerificationModal({
      activeCash,
      totalVendas,
      totalDinheiro,
      totalPix,
      totalDebito,
      totalCredito,
      totalConvenio,
      totalSuprimento,
      totalSangria,
      expectedCashInDrawer,
      salesCount: sales.length
    }, () => {
      closeModal();
      if (typeof onUpdated === 'function') onUpdated();
    });
  });
}

// Modal para Inserir Suprimento ou Sangria
function openMovementModal(activeCash, type, onDone) {
  const isSuprimento = type === 'suprimento';
  const modal = document.createElement('div');
  modal.className = 'pep-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 15, 29, 0.9); backdrop-filter: blur(14px);
    display: flex; justify-content: center; align-items: center; z-index: 10006; padding: 16px;
  `;

  modal.innerHTML = `
    <div style="width: 100%; max-width: 420px; background: #0f172a; border: 1.5px solid ${isSuprimento ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}; border-radius: 18px; padding: 22px;">
      <h4 style="margin: 0 0 12px; color: #fff; font-family: 'Outfit'; font-size: 1.15rem; font-weight: 700;">
        ${isSuprimento ? '💵 Adicionar Suprimento de Troco' : '💸 Realizar Sangria de Caixa'}
      </h4>

      <form id="form-cash-mov" style="display: flex; flex-direction: column; gap: 12px;">
        <div>
          <label style="display: block; font-size: 0.78rem; color: #cbd5e1; font-weight: 700; margin-bottom: 4px;">* Valor (R$):</label>
          <input type="number" id="input-mov-val" min="0.01" step="0.50" required placeholder="0.00" class="form-input" style="font-size: 1.1rem; font-weight: 800; color: ${isSuprimento ? '#34d399' : '#f87171'};">
        </div>

        <div>
          <label style="display: block; font-size: 0.78rem; color: #cbd5e1; font-weight: 700; margin-bottom: 4px;">* Motivo / Justificativa:</label>
          <input type="text" id="input-mov-reason" required placeholder="${isSuprimento ? 'Ex: Reforço de moedas e cédulas' : 'Ex: Retirada de excesso para o cofre'}" class="form-input" style="font-size: 0.85rem;">
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
          <button type="button" id="btn-cancel-mov" class="btn" style="background: rgba(255,255,255,0.06); color: #94a3b8; border: 1px solid rgba(255,255,255,0.12); padding: 8px 14px; border-radius: 8px;">Cancelar</button>
          <button type="submit" class="btn btn-primary" style="background: ${isSuprimento ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'}; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 700; color: #fff;">Confirmar</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const closeMov = () => modal.remove();
  document.getElementById('btn-cancel-mov')?.addEventListener('click', closeMov);

  document.getElementById('form-cash-mov')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('input-mov-val').value || 0);
    const reason = document.getElementById('input-mov-reason').value.trim();

    const movements = activeCash.movements || [];
    movements.push({
      type,
      amount,
      reason,
      created_at: new Date().toISOString(),
      operator: state.user?.name || 'Operador'
    });

    localDB.update('cash_registers', activeCash.id, { movements });
    syncManager.pushToCloud(false);
    showToast(`✅ ${isSuprimento ? 'Suprimento' : 'Sangria'} de R$ ${amount.toFixed(2).replace('.', ',')} registrado!`);
    closeMov();
    if (typeof onDone === 'function') onDone();
  });
}

// Modal de Fechamento com Conferência Cega
function openCloseCashVerificationModal(cashData, onClosed) {
  const modal = document.createElement('div');
  modal.className = 'pep-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 15, 29, 0.94); backdrop-filter: blur(16px);
    display: flex; justify-content: center; align-items: center; z-index: 10007; padding: 16px;
  `;

  modal.innerHTML = `
    <div style="width: 100%; max-width: 480px; background: #0f172a; border: 1.5px solid rgba(239, 68, 68, 0.5); border-radius: 20px; padding: 24px; box-shadow: 0 25px 60px rgba(0,0,0,0.95); text-align: center;">
      
      <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); border: 2px solid #ef4444; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; color: #f87171; font-size: 1.5rem;">
        <i class="fa-solid fa-lock"></i>
      </div>

      <h3 style="margin: 0; color: #fff; font-family: 'Outfit'; font-size: 1.3rem; font-weight: 800;">
        Conferência e Fechamento de Caixa
      </h3>
      <p style="margin: 4px 0 16px; font-size: 0.8rem; color: #94a3b8;">
        Informe o valor total em cédulas e moedas contado na gaveta.
      </p>

      <form id="form-blind-close" style="text-align: left; display: flex; flex-direction: column; gap: 12px;">
        <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px;">
          <label style="display: block; font-size: 0.78rem; color: #38bdf8; font-weight: 700; margin-bottom: 4px;">
            * Valor em Dinheiro Contado na Gaveta (R$):
          </label>
          <input type="number" id="input-counted-cash" step="0.01" min="0" required placeholder="0.00" class="form-input" style="font-size: 1.25rem; font-weight: 900; color: #fff; height: 44px; text-align: center; border-color: #38bdf8;">
        </div>

        <div id="diff-preview" style="display: none; padding: 10px; border-radius: 8px; font-size: 0.84rem; text-align: center;"></div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
          <button type="button" id="btn-cancel-close-verify" class="btn" style="background: rgba(255,255,255,0.06); color: #94a3b8; border: 1px solid rgba(255,255,255,0.12); padding: 9px 16px; border-radius: 8px;">Voltar</button>
          <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, #ef4444, #dc2626); border: none; padding: 9px 22px; border-radius: 8px; font-weight: 700; color: #fff;">
            Confirmar Fechamento
          </button>
        </div>
      </form>

    </div>
  `;

  document.body.appendChild(modal);

  const closeVerify = () => modal.remove();
  document.getElementById('btn-cancel-close-verify')?.addEventListener('click', closeVerify);

  const countedInput = document.getElementById('input-counted-cash');
  const diffPreview = document.getElementById('diff-preview');

  countedInput?.addEventListener('input', () => {
    const counted = parseFloat(countedInput.value || 0);
    const expected = cashData.expectedCashInDrawer;
    const diff = counted - expected;

    diffPreview.style.display = 'block';
    if (Math.abs(diff) < 0.01) {
      diffPreview.style.background = 'rgba(16, 185, 129, 0.15)';
      diffPreview.style.border = '1px solid rgba(16, 185, 129, 0.3)';
      diffPreview.style.color = '#34d399';
      diffPreview.innerHTML = `<strong>✅ Caixa Exato!</strong> Nenhuma sobra ou falta.`;
    } else if (diff > 0) {
      diffPreview.style.background = 'rgba(56, 189, 248, 0.15)';
      diffPreview.style.border = '1px solid rgba(56, 189, 248, 0.3)';
      diffPreview.style.color = '#38bdf8';
      diffPreview.innerHTML = `<strong>🔵 Sobra de Caixa:</strong> + R$ ${diff.toFixed(2).replace('.', ',')}`;
    } else {
      diffPreview.style.background = 'rgba(239, 68, 68, 0.15)';
      diffPreview.style.border = '1px solid rgba(239, 68, 68, 0.3)';
      diffPreview.style.color = '#f87171';
      diffPreview.innerHTML = `<strong>⚠️ Falta de Caixa:</strong> - R$ ${Math.abs(diff).toFixed(2).replace('.', ',')}`;
    }
  });

  document.getElementById('form-blind-close')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const counted = parseFloat(countedInput.value || 0);
    const expected = cashData.expectedCashInDrawer;
    const diff = counted - expected;

    localDB.update('cash_registers', cashData.activeCash.id, {
      status: 'fechado',
      closed_at: new Date().toISOString(),
      total_sales: cashData.totalVendas,
      sales_count: cashData.salesCount,
      counted_cash: counted,
      expected_cash: expected,
      difference: diff
    });

    syncManager.pushToCloud(false);
    showToast(`🔒 Caixa #${cashData.activeCash.protocol} encerrado com sucesso!`);
    closeVerify();

    // Imprimir Cupom Térmico de Fechamento de Caixa
    printCashRegisterReceipt({
      ...cashData,
      countedCash: counted,
      difference: diff,
      isFinal: true
    });

    if (typeof onClosed === 'function') onClosed();
  });
}

// Impressão Térmica de Fechamento / Parcial de Caixa
export function printCashRegisterReceipt(data, paperWidth = '80mm') {
  const is58mm = paperWidth === '58mm';
  const widthPx = is58mm ? '210px' : '300px';

  const settings = localDB.get('settings', 'main') || {};
  const pharmacyName = settings.clinic_name || settings.pharmacy_name || 'FARMÁCIA & CONSULTÓRIO CLÍNICO';
  const protocol = data.activeCash?.protocol || 'CX-000';
  const dateStr = new Date().toLocaleString('pt-BR');
  const operator = data.activeCash?.operator_name || 'Operador';

  const receiptHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Fechamento de Caixa - ${protocol}</title>
      <style>
        @page { margin: 0; size: ${paperWidth} auto; }
        body {
          font-family: 'Courier New', Courier, monospace;
          color: #000;
          background: #fff;
          margin: 0;
          padding: 8px 6px;
          width: ${widthPx};
          font-size: ${is58mm ? '10px' : '12px'};
          line-height: 1.25;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        .bold { font-weight: bold; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
      </style>
    </head>
    <body>
      <div class="text-center">
        <div class="bold" style="font-size: ${is58mm ? '12px' : '14px'};">${pharmacyName}</div>
        <div class="bold" style="font-size: ${is58mm ? '10px' : '12px'}; margin-top: 4px;">
          ${data.isFinal ? 'RELATÓRIO DE FECHAMENTO DE CAIXA' : 'EXTRATO PARCIAL DE TURNO'}
        </div>
      </div>

      <div class="divider"></div>
      <div class="row"><span>Protocolo: <strong>#${protocol}</strong></span></div>
      <div class="row"><span>Data/Hora: ${dateStr}</span></div>
      <div class="row"><span>Operador: ${operator}</span></div>
      <div class="row"><span>Status: <strong>${data.isFinal ? 'FECHADO' : 'EM ANDAMENTO'}</strong></span></div>

      <div class="divider"></div>
      <div class="bold">RESUMO FINANCEIRO:</div>
      <div class="row">
        <span>Fundo de Troco Inicial:</span>
        <span>R$ ${(data.activeCash?.initial_cash || 0).toFixed(2).replace('.', ',')}</span>
      </div>
      <div class="row">
        <span>Total Vendas (${data.salesCount || 0} un):</span>
        <strong>R$ ${(data.totalVendas || 0).toFixed(2).replace('.', ',')}</strong>
      </div>
      <div class="row">
        <span>(+) Suprimentos:</span>
        <span>R$ ${(data.totalSuprimento || 0).toFixed(2).replace('.', ',')}</span>
      </div>
      <div class="row">
        <span>(-) Sangrias / Retiradas:</span>
        <span>R$ ${(data.totalSangria || 0).toFixed(2).replace('.', ',')}</span>
      </div>

      <div class="divider"></div>
      <div class="bold">POR FORMA DE PAGAMENTO:</div>
      <div class="row"><span>Dinheiro:</span><span>R$ ${(data.totalDinheiro || 0).toFixed(2).replace('.', ',')}</span></div>
      <div class="row"><span>PIX:</span><span>R$ ${(data.totalPix || 0).toFixed(2).replace('.', ',')}</span></div>
      <div class="row"><span>Cartão Débito:</span><span>R$ ${(data.totalDebito || 0).toFixed(2).replace('.', ',')}</span></div>
      <div class="row"><span>Cartão Crédito:</span><span>R$ ${(data.totalCredito || 0).toFixed(2).replace('.', ',')}</span></div>
      <div class="row"><span>Convênio/Prazo:</span><span>R$ ${(data.totalConvenio || 0).toFixed(2).replace('.', ',')}</span></div>

      <div class="divider"></div>
      <div class="row bold" style="font-size: ${is58mm ? '11px' : '13px'};">
        <span>DINHEIRO ESPERADO:</span>
        <span>R$ ${(data.expectedCashInDrawer || 0).toFixed(2).replace('.', ',')}</span>
      </div>
      ${data.isFinal ? `
        <div class="row">
          <span>Dinheiro Contado:</span>
          <strong>R$ ${(data.countedCash || 0).toFixed(2).replace('.', ',')}</strong>
        </div>
        <div class="row bold" style="color: #000;">
          <span>Diferença (Sobra/Falta):</span>
          <span>R$ ${(data.difference || 0).toFixed(2).replace('.', ',')}</span>
        </div>
      ` : ''}

      <div class="divider"></div>
      <div style="margin-top: 14px; text-align: center;">
        __________________________________<br>
        Assinatura do Operador<br><br>
        __________________________________<br>
        Farmacêutico RT / Gerência
      </div>

      <div class="divider"></div>
      <div class="text-center" style="font-size: 8px; color: #555;">
        CRM Clínico Farmacêutico v3.0 • Fechamento de Caixa
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
  doc.write(receiptHtml);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1500);
  }, 350);
}
