// src/modules/quickCheckoutModal.js
// MODAL DE SAÍDA RÁPIDA / CHECKOUT POR LEITURA DE CÓDIGO DE BARRAS (PDV BALCÃO COM PAGAMENTO E CUPOM TÉRMICO)

import * as localDB from '../localDB.js';
import { state } from '../state.js';
import { showToast, showCustomAlert } from './ui.js';
import { syncManager } from './sync.js';
import { playBeepSound, openCameraBarcodeScanner } from './barcodeScanner.js';
import { printThermalReceipt, generateWhatsAppSaleText } from './thermalReceipt.js';
import { getActiveCashRegister, openCashRegisterModal } from './cashRegister.js';

export function openQuickCheckoutModal(onFinished = null) {
  const existing = document.getElementById('quick-checkout-modal');
  if (existing) existing.remove();

  let cart = []; // [{ product, quantity, unitPrice, subtotal }]
  let discountValue = 0;
  let selectedPayment = 'dinheiro'; // 'dinheiro' | 'pix' | 'debito' | 'credito' | 'convenio'
  let installments = 1;

  const activeCash = getActiveCashRegister();

  const modal = document.createElement('div');
  modal.id = 'quick-checkout-modal';
  modal.className = 'pep-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 15, 29, 0.88); backdrop-filter: blur(16px);
    display: flex; justify-content: center; align-items: center; z-index: 10002; padding: 16px;
  `;

  const allPatients = (localDB.list('pharmacy_patients') || []).concat(localDB.list('patients') || []);

  modal.innerHTML = `
    <div style="width: 100%; max-width: 1020px; max-height: 92vh; display: flex; flex-direction: column; background: #0f172a; border: 1.5px solid rgba(16, 185, 129, 0.4); border-radius: 20px; padding: 22px; box-shadow: 0 25px 60px rgba(0,0,0,0.85); overflow: hidden;">
      
      <!-- Cabeçalho -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.3rem; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">
            <i class="fa-solid fa-cash-register"></i>
          </div>
          <div>
            <h3 style="margin: 0; color: #fff; font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              Frente de Caixa &amp; PDV Clínico por Código de Barras
            </h3>
            <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: #94a3b8;">
              Dispensação ágil com leitor de código de barras, formas de pagamento e emissão de cupom térmico (58/80mm).
            </p>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          ${activeCash ? `
            <span style="font-size: 0.75rem; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 10px; border-radius: 8px; font-weight: 700;">
              🟢 Caixa #${activeCash.protocol}
            </span>
          ` : `
            <button type="button" id="btn-checkout-open-cash" class="btn" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; font-size: 0.74rem; font-weight: 700; padding: 4px 10px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-lock"></i> Caixa Fechado (Abrir)
            </button>
          `}
          <button id="btn-close-checkout-modal" style="background: none; border: none; color: #94a3b8; font-size: 1.3rem; cursor: pointer; padding: 4px;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <!-- Corpo Principal (Duas Colunas) -->
      <div style="display: grid; grid-template-columns: 1.15fr 1fr; gap: 20px; flex: 1; overflow: hidden; min-height: 420px;">
        
        <!-- COLUNA 1: BIAGEM / LEITURA & FORMAS DE PAGAMENTO -->
        <div style="display: flex; flex-direction: column; gap: 12px; overflow-y: auto; padding-right: 6px;">
          
          <!-- Identificação do Cliente -->
          <div style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px;">
            <label style="display: block; font-size: 0.78rem; color: #cbd5e1; font-weight: 700; margin-bottom: 5px;">
              <i class="fa-solid fa-user" style="color: #38bdf8;"></i> Cliente / Paciente:
            </label>
            <select id="checkout-patient-select" class="form-input" style="width: 100%; background: #1e293b; color: #fff; font-size: 0.84rem; height: 38px;">
              <option value="">👤 Venda Avulsa / Consumidor Balcão</option>
              ${allPatients.map(p => `<option value="${p.id}" data-phone="${p.phone || ''}" data-cpf="${p.cpf || ''}">${p.name || p.fullName} (CPF: ${p.cpf || 'N/A'})</option>`).join('')}
            </select>
          </div>

          <!-- Campo de Leitura por Código de Barras (Scanner) -->
          <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 23, 42, 0.6)); border: 1.5px solid rgba(16, 185, 129, 0.4); border-radius: 12px; padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label style="font-size: 0.82rem; color: #34d399; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-barcode"></i> Bipar Código de Barras / EAN:
              </label>
              <button type="button" id="btn-open-camera-pdv" class="btn" style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-size: 0.74rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                <i class="fa-solid fa-camera"></i> Câmera
              </button>
            </div>

            <div style="display: flex; gap: 8px;">
              <input type="text" id="input-pdv-barcode" class="form-input" placeholder="Bipe ou digite o EAN e tecle Enter..." style="flex: 1; height: 40px; font-family: monospace; font-size: 0.95rem; font-weight: 700; background: #0f172a; color: #38bdf8; border: 1.5px solid rgba(56, 189, 248, 0.4);" autofocus>
              <button type="button" id="btn-add-pdv-barcode" class="btn" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 0 14px; border-radius: 6px; font-weight: 700; font-size: 0.85rem;">
                <i class="fa-solid fa-plus"></i> Inserir
              </button>
            </div>
          </div>

          <!-- Busca Rápida Manual por Nome -->
          <div style="background: rgba(30, 41, 59, 0.35); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 12px;">
            <label style="display: block; font-size: 0.78rem; color: #cbd5e1; font-weight: 700; margin-bottom: 5px;">
              <i class="fa-solid fa-magnifying-glass" style="color: #94a3b8;"></i> Seleção Manual do Catálogo:
            </label>
            <div style="display: flex; gap: 8px;">
              <select id="select-pdv-product-manual" class="form-input" style="flex: 1; background: #1e293b; color: #fff; font-size: 0.82rem; height: 36px;">
                <option value="">Selecione um produto...</option>
                ${(localDB.list('products') || []).map(p => `
                  <option value="${p.id}">${p.name} — R$ ${(parseFloat(p.sale_price || 0)).toFixed(2).replace('.', ',')} (Saldo: ${p.current_stock || 0})</option>
                `).join('')}
              </select>
              <button type="button" id="btn-add-pdv-manual" class="btn" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; padding: 0 12px; border-radius: 6px; font-weight: 600; font-size: 0.8rem;">
                Adicionar
              </button>
            </div>
          </div>

          <!-- Seção de Formas de Pagamento & Condições -->
          <div style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px;">
            <label style="display: block; font-size: 0.8rem; color: #38bdf8; font-weight: 700; margin-bottom: 8px;">
              <i class="fa-solid fa-credit-card"></i> Forma de Pagamento:
            </label>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 10px;">
              <button type="button" class="btn-pay-tab active" data-pay="dinheiro" style="padding: 8px 4px; border-radius: 8px; font-size: 0.76rem; font-weight: 700; cursor: pointer; border: 1px solid #10b981; background: rgba(16, 185, 129, 0.2); color: #34d399; text-align: center;">
                <i class="fa-solid fa-money-bill-wave"></i> Dinheiro
              </button>
              <button type="button" class="btn-pay-tab" data-pay="pix" style="padding: 8px 4px; border-radius: 8px; font-size: 0.76rem; font-weight: 700; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #cbd5e1; text-align: center;">
                <i class="fa-brands fa-pix" style="color: #06b6d4;"></i> PIX
              </button>
              <button type="button" class="btn-pay-tab" data-pay="debito" style="padding: 8px 4px; border-radius: 8px; font-size: 0.76rem; font-weight: 700; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #cbd5e1; text-align: center;">
                <i class="fa-solid fa-credit-card"></i> Débito
              </button>
              <button type="button" class="btn-pay-tab" data-pay="credito" style="padding: 8px 4px; border-radius: 8px; font-size: 0.76rem; font-weight: 700; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #cbd5e1; text-align: center;">
                <i class="fa-solid fa-receipt"></i> Crédito
              </button>
              <button type="button" class="btn-pay-tab" data-pay="convenio" style="padding: 8px 4px; border-radius: 8px; font-size: 0.76rem; font-weight: 700; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #cbd5e1; text-align: center;">
                <i class="fa-solid fa-hospital-user"></i> Convênio / A Prazo
              </button>
            </div>

            <!-- Subpainel Dinâmico por Forma de Pagamento -->
            <div id="pay-details-panel" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 10px;">
              <!-- Renderizado via JS -->
            </div>
          </div>

        </div>

        <!-- COLUNA 2: CUPOM DE ITENS & FINALIZAÇÃO -->
        <div style="display: flex; flex-direction: column; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 14px; overflow: hidden;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
            <strong style="color: #fff; font-size: 0.95rem; font-family: 'Outfit'; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-receipt" style="color: #38bdf8;"></i> Itens do Cupom
            </strong>
            <span id="pdv-items-count" style="font-size: 0.74rem; color: #38bdf8; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); padding: 2px 8px; border-radius: 10px; font-weight: 700;">
              0 itens
            </span>
          </div>

          <!-- Lista de Itens no Carrinho -->
          <div id="pdv-cart-items-container" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 4px;">
            <div style="text-align: center; padding: 40px 10px; color: #64748b; font-size: 0.85rem;">
              <i class="fa-solid fa-barcode" style="font-size: 2.2rem; opacity: 0.3; margin-bottom: 10px; display: block;"></i>
              Aguardando leitura de código de barras ou seleção de itens...
            </div>
          </div>

          <!-- Resumo Financeiro & Totais -->
          <div style="margin-top: 10px; border-top: 1.5px solid rgba(255,255,255,0.1); padding-top: 10px;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-size: 0.82rem; color: #94a3b8;">
              <span>Subtotal Bruto:</span>
              <span id="pdv-gross-subtotal">R$ 0,00</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 0.82rem; color: #94a3b8;">Desconto (R$):</span>
              <input type="number" id="input-pdv-discount" min="0" step="0.50" value="0.00" style="width: 85px; height: 26px; font-size: 0.8rem; background: #1e293b; color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 6px; text-align: right; padding: 0 6px;">
            </div>

            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 6px 10px;">
              <span style="font-size: 0.88rem; color: #f8fafc; font-weight: 700;">TOTAL LÍQUIDO:</span>
              <span id="pdv-cart-total-value" style="font-size: 1.55rem; font-weight: 800; color: #34d399; font-family: 'Outfit';">
                R$ 0,00
              </span>
            </div>

            <div style="display: flex; gap: 8px;">
              <button type="button" id="btn-clear-pdv-cart" class="btn" style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; padding: 10px 12px; border-radius: 8px; font-weight: 600; font-size: 0.82rem; cursor: pointer;">
                Limpar
              </button>
              <button type="button" id="btn-finish-pdv-sale" class="btn btn-primary" style="flex: 1; background: linear-gradient(135deg, #10b981, #059669); border: none; padding: 11px; border-radius: 8px; font-weight: 700; font-size: 0.92rem; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35); cursor: pointer;">
                <i class="fa-solid fa-circle-check"></i> Finalizar Venda &amp; Cupom
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  `;

  document.body.appendChild(modal);

  const barcodeInput = document.getElementById('input-pdv-barcode');
  const cartContainer = document.getElementById('pdv-cart-items-container');
  const grossSubtotalEl = document.getElementById('pdv-gross-subtotal');
  const discountInput = document.getElementById('input-pdv-discount');
  const totalValueEl = document.getElementById('pdv-cart-total-value');
  const itemsCountEl = document.getElementById('pdv-items-count');
  const payPanel = document.getElementById('pay-details-panel');

  const closeModal = () => modal.remove();
  document.getElementById('btn-close-checkout-modal')?.addEventListener('click', closeModal);

  document.getElementById('btn-checkout-open-cash')?.addEventListener('click', () => {
    closeModal();
    openCashRegisterModal(() => {
      openQuickCheckoutModal(onFinished);
    });
  });

  // Calcula totais
  const getCartTotals = () => {
    const gross = cart.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const disc = Math.min(gross, Math.max(0, parseFloat(discountInput.value || 0)));
    const net = Math.max(0, gross - disc);
    return { gross, disc, net };
  };

  // Renderiza detalhes de pagamento
  const renderPaymentPanel = () => {
    const { net } = getCartTotals();

    if (selectedPayment === 'dinheiro') {
      payPanel.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: center;">
          <div style="flex: 1;">
            <label style="display: block; font-size: 0.72rem; color: #94a3b8; margin-bottom: 2px;">Valor Recebido em Dinheiro (R$):</label>
            <input type="number" id="input-cash-received" min="${net}" step="1" value="${net.toFixed(2)}" style="width: 100%; height: 32px; font-size: 0.9rem; font-weight: 700; background: #0f172a; color: #34d399; border: 1px solid #10b981; border-radius: 6px; padding: 0 8px;">
          </div>
          <div style="flex: 1; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 6px; padding: 6px 10px; text-align: right;">
            <div style="font-size: 0.68rem; color: #94a3b8; text-transform: uppercase;">Troco a Devolver:</div>
            <div id="cash-change-display" style="font-size: 1.1rem; font-weight: 800; color: #34d399; font-family: 'Outfit';">R$ 0,00</div>
          </div>
        </div>
      `;

      const cashInput = document.getElementById('input-cash-received');
      const changeDisplay = document.getElementById('cash-change-display');

      const updateChange = () => {
        const received = parseFloat(cashInput.value || 0);
        const change = Math.max(0, received - net);
        changeDisplay.textContent = `R$ ${change.toFixed(2).replace('.', ',')}`;
      };

      cashInput?.addEventListener('input', updateChange);
      updateChange();

    } else if (selectedPayment === 'pix') {
      payPanel.innerHTML = `
        <div style="display: flex; gap: 12px; align-items: center;">
          <div style="width: 54px; height: 54px; background: #fff; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #000; font-size: 1.8rem;">
            <i class="fa-solid fa-qrcode"></i>
          </div>
          <div style="flex: 1;">
            <div style="font-size: 0.78rem; font-weight: 700; color: #06b6d4;">Chave PIX Dinâmica Gerada</div>
            <div style="font-size: 0.7rem; color: #94a3b8; font-family: monospace; word-break: break-all;">pix@farmaciaclinica.com.br • R$ ${net.toFixed(2).replace('.', ',')}</div>
            <span style="display: inline-block; font-size: 0.68rem; background: rgba(6, 182, 212, 0.2); color: #38bdf8; padding: 2px 6px; border-radius: 4px; margin-top: 3px;">
              <i class="fa-solid fa-clock"></i> Aguardando confirmação do app bancário
            </span>
          </div>
        </div>
      `;
    } else if (selectedPayment === 'credito') {
      payPanel.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: center;">
          <div style="flex: 1;">
            <label style="display: block; font-size: 0.72rem; color: #94a3b8; margin-bottom: 2px;">Parcelamento:</label>
            <select id="select-card-installments" class="form-input" style="width: 100%; height: 32px; font-size: 0.8rem; background: #0f172a; color: #fff;">
              <option value="1">1x de R$ ${net.toFixed(2).replace('.', ',')} (À Vista)</option>
              <option value="2">2x de R$ ${(net/2).toFixed(2).replace('.', ',')} sem juros</option>
              <option value="3">3x de R$ ${(net/3).toFixed(2).replace('.', ',')} sem juros</option>
              <option value="4">4x de R$ ${(net/4).toFixed(2).replace('.', ',')} sem juros</option>
              <option value="5">5x de R$ ${(net/5).toFixed(2).replace('.', ',')} sem juros</option>
              <option value="6">6x de R$ ${(net/6).toFixed(2).replace('.', ',')} sem juros</option>
            </select>
          </div>
        </div>
      `;
      document.getElementById('select-card-installments')?.addEventListener('change', (e) => {
        installments = parseInt(e.target.value, 10) || 1;
      });
    } else if (selectedPayment === 'debito') {
      payPanel.innerHTML = `
        <div style="font-size: 0.78rem; color: #cbd5e1; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-credit-card" style="color: #38bdf8; font-size: 1.2rem;"></i>
          <span>Insira ou aproxime o cartão de débito na maquininha TEF/POS. Total: <strong>R$ ${net.toFixed(2).replace('.', ',')}</strong></span>
        </div>
      `;
    } else if (selectedPayment === 'convenio') {
      payPanel.innerHTML = `
        <div style="font-size: 0.78rem; color: #cbd5e1;">
          <div style="color: #fbbf24; font-weight: 700; margin-bottom: 2px;"><i class="fa-solid fa-file-invoice-dollar"></i> Venda a Prazo / Crediário Clínico</div>
          <span style="font-size: 0.72rem; color: #94a3b8;">Faturar no prontuário do cliente com vencimento para 30 dias.</span>
        </div>
      `;
    }
  };

  // Alternador de abas de pagamento
  modal.querySelectorAll('.btn-pay-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.btn-pay-tab').forEach(b => {
        b.style.border = '1px solid rgba(255,255,255,0.1)';
        b.style.background = 'rgba(255,255,255,0.04)';
        b.style.color = '#cbd5e1';
      });
      btn.style.border = '1px solid #10b981';
      btn.style.background = 'rgba(16, 185, 129, 0.2)';
      btn.style.color = '#34d399';
      selectedPayment = btn.dataset.pay;
      renderPaymentPanel();
    });
  });

  // Renderizar Itens do Carrinho
  const updateCartView = () => {
    const { gross, disc, net } = getCartTotals();
    let totalQty = 0;

    if (cart.length === 0) {
      cartContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 10px; color: #64748b; font-size: 0.85rem;">
          <i class="fa-solid fa-barcode" style="font-size: 2.2rem; opacity: 0.3; margin-bottom: 10px; display: block;"></i>
          Aguardando leitura de código de barras ou seleção de itens...
        </div>
      `;
      grossSubtotalEl.textContent = 'R$ 0,00';
      totalValueEl.textContent = 'R$ 0,00';
      itemsCountEl.textContent = '0 itens';
      renderPaymentPanel();
      return;
    }

    cartContainer.innerHTML = cart.map((item, index) => {
      const subtotal = item.quantity * item.unitPrice;
      totalQty += item.quantity;

      return `
        <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 8px 10px; display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1; padding-right: 8px;">
            <strong style="color: #fff; font-size: 0.85rem; display: block;">${item.product.name}</strong>
            <small style="color: #94a3b8; font-size: 0.72rem;">EAN: ${item.product.ean || 'N/A'} • Saldo: ${item.product.current_stock || 0} un</small>
            <div style="color: #38bdf8; font-size: 0.76rem; font-weight: 600; margin-top: 2px;">
              R$ ${item.unitPrice.toFixed(2).replace('.', ',')} un
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="display: flex; align-items: center; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; overflow: hidden;">
              <button type="button" class="btn-cart-minus" data-index="${index}" style="background: none; border: none; color: #94a3b8; padding: 3px 6px; cursor: pointer; font-size: 0.85rem;">-</button>
              <span style="color: #fff; font-weight: 700; font-size: 0.82rem; padding: 0 4px;">${item.quantity}</span>
              <button type="button" class="btn-cart-plus" data-index="${index}" style="background: none; border: none; color: #34d399; padding: 3px 6px; cursor: pointer; font-size: 0.85rem;">+</button>
            </div>

            <div style="text-align: right; min-width: 65px;">
              <strong style="color: #34d399; font-size: 0.88rem;">R$ ${subtotal.toFixed(2).replace('.', ',')}</strong>
            </div>

            <button type="button" class="btn-cart-remove" data-index="${index}" style="background: none; border: none; color: #f87171; cursor: pointer; padding: 4px;" title="Remover">
              <i class="fa-solid fa-trash-can" style="font-size: 0.8rem;"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    grossSubtotalEl.textContent = `R$ ${gross.toFixed(2).replace('.', ',')}`;
    totalValueEl.textContent = `R$ ${net.toFixed(2).replace('.', ',')}`;
    itemsCountEl.textContent = `${totalQty} un (${cart.length} itens)`;

    // Listeners dos botões do carrinho
    cartContainer.querySelectorAll('.btn-cart-plus').forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.dataset.index, 10);
        const item = cart[idx];
        if (item.quantity + 1 > (item.product.current_stock || 0)) {
          showToast(`⚠️ Saldo insuficiente! Disponível: ${item.product.current_stock} unidades.`);
          return;
        }
        item.quantity += 1;
        playBeepSound('success');
        updateCartView();
      });
    });

    cartContainer.querySelectorAll('.btn-cart-minus').forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.dataset.index, 10);
        if (cart[idx].quantity > 1) {
          cart[idx].quantity -= 1;
        } else {
          cart.splice(idx, 1);
        }
        updateCartView();
      });
    });

    cartContainer.querySelectorAll('.btn-cart-remove').forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.dataset.index, 10);
        cart.splice(idx, 1);
        updateCartView();
      });
    });

    renderPaymentPanel();
  };

  discountInput?.addEventListener('input', updateCartView);

  // Inserir Produto no Carrinho
  const addProductToCart = (codeOrId) => {
    const raw = (codeOrId || '').trim();
    if (!raw) return;

    const products = localDB.list('products') || [];
    const found = products.find(p => p.ean === raw || p.id === raw || (p.ean && p.ean.endsWith(raw)));

    if (!found) {
      playBeepSound('error');
      showToast(`❌ Nenhum produto encontrado com o código "${raw}".`);
      return;
    }

    if ((found.current_stock || 0) <= 0) {
      playBeepSound('error');
      showToast(`⚠️ Produto "${found.name}" com ESTOQUE ZERADO!`);
      return;
    }

    const existingCartItem = cart.find(ci => ci.product.id === found.id);
    if (existingCartItem) {
      if (existingCartItem.quantity + 1 > (found.current_stock || 0)) {
        playBeepSound('error');
        showToast(`⚠️ Limite de estoque atingido (${found.current_stock} un disponíveis).`);
        return;
      }
      existingCartItem.quantity += 1;
    } else {
      cart.push({
        product: found,
        quantity: 1,
        unitPrice: parseFloat(found.sale_price || 0),
        subtotal: parseFloat(found.sale_price || 0)
      });
    }

    playBeepSound('success');
    showToast(`🛒 +1 ${found.name} adicionado ao cupom!`);
    updateCartView();

    if (barcodeInput) {
      barcodeInput.value = '';
      barcodeInput.focus();
    }
  };

  // Eventos de Inserção de Código
  document.getElementById('btn-add-pdv-barcode')?.addEventListener('click', () => {
    addProductToCart(barcodeInput.value);
  });

  barcodeInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addProductToCart(barcodeInput.value);
    }
  });

  // Botão Câmera
  document.getElementById('btn-open-camera-pdv')?.addEventListener('click', () => {
    openCameraBarcodeScanner((scannedEan) => {
      addProductToCart(scannedEan);
    }, {
      title: 'Leitor de Câmera — Venda no Caixa',
      subtitle: 'Aponte a câmera para o código EAN do medicamento/produto'
    });
  });

  // Inserção Manual
  document.getElementById('btn-add-pdv-manual')?.addEventListener('click', () => {
    const sel = document.getElementById('select-pdv-product-manual');
    if (sel && sel.value) {
      addProductToCart(sel.value);
      sel.value = '';
    }
  });

  // Limpar Carrinho
  document.getElementById('btn-clear-pdv-cart')?.addEventListener('click', () => {
    cart = [];
    discountInput.value = '0.00';
    updateCartView();
  });

  // Render inicial do painel de pagamento
  renderPaymentPanel();

  // Finalizar Venda & Abrir Modal de Cupom Térmico
  document.getElementById('btn-finish-pdv-sale')?.addEventListener('click', () => {
    if (cart.length === 0) {
      showCustomAlert({ title: 'Aviso', message: 'Adicione pelo menos um produto ao carrinho antes de finalizar a venda.', type: 'warning' });
      return;
    }

    const { gross, disc, net } = getCartTotals();
    const patientSelect = document.getElementById('checkout-patient-select');
    const selectedOption = patientSelect?.options[patientSelect.selectedIndex];
    const patientId = patientSelect?.value;
    const clientName = patientId ? selectedOption.text.split(' (CPF')[0] : 'Consumidor Balcão';
    const clientCpf = selectedOption?.dataset.cpf || '';
    const clientPhone = selectedOption?.dataset.phone || '';
    const currentUser = state.user || {};

    let cashReceived = net;
    let changeVal = 0;
    if (selectedPayment === 'dinheiro') {
      cashReceived = parseFloat(document.getElementById('input-cash-received')?.value || net);
      changeVal = Math.max(0, cashReceived - net);
    }

    const protocol = `VD-${Date.now().toString().slice(-6)}`;
    const paymentNames = {
      dinheiro: 'Dinheiro',
      pix: 'PIX Instantâneo',
      debito: 'Cartão de Débito',
      credito: `Cartão de Crédito (${installments}x)`,
      convenio: 'Convênio / A Prazo'
    };

    const saleRecord = {
      protocol,
      clientName,
      clientCpf,
      clientPhone,
      patient_id: patientId || null,
      items: cart,
      subtotalGross: gross,
      discount: disc,
      totalSale: net,
      paymentMethod: paymentNames[selectedPayment] || 'Dinheiro',
      paidAmount: cashReceived,
      change: changeVal,
      operatorName: `${currentUser.name || 'Operador'} (${currentUser.role || 'Farmacêutico'})`,
      created_at: new Date().toISOString()
    };

    // Executar baixa no estoque e registrar no Kardex
    cart.forEach(item => {
      const prod = localDB.get('products', item.product.id);
      if (prod) {
        const newStock = Math.max(0, parseInt(prod.current_stock || 0, 10) - item.quantity);
        localDB.update('products', item.product.id, { current_stock: newStock });

        const subtotal = item.quantity * item.unitPrice;

        localDB.insert('inventory_movements', {
          product_id: item.product.id,
          product_name: prod.name,
          type: 'Saída por Venda',
          quantity: -item.quantity,
          batch: prod.batch || 'N/A',
          cost_unit: parseFloat(prod.cost_price || 0),
          total_value: subtotal,
          reason: `Venda no Balcão (Protocolo #${protocol}) — ${clientName}`,
          patient_name: clientName,
          operator_name: saleRecord.operatorName,
          created_at: new Date().toISOString()
        });
      }
    });

    // Salvar no histórico de vendas
    localDB.insert('sales', saleRecord);

    playBeepSound('success');
    syncManager.pushToCloud(false);
    closeModal();

    if (typeof window.showFlowCompletionNotification === 'function') {
      window.showFlowCompletionNotification({
        flowType: 'completed',
        badgeText: 'FLUXO DE VENDA & PDV CONCLUÍDO',
        badgeIcon: 'fa-circle-check',
        icon: 'fa-cash-register',
        actionTitle: `💳 Venda #${protocol} Finalizada`,
        message: `Valor total: <strong>R$ ${net.toFixed(2).replace('.', ',')}</strong> (${paymentNames[selectedPayment] || 'Dinheiro'}). Cliente: <strong>${clientName}</strong>.`,
        targetTab: 'farmacia',
        targetTabLabel: 'Farmácia & Estoque',
        actionButtonText: 'Ver Estoque >'
      });
    }

    // Abrir Modal de Conclusão & Impressão de Cupom Térmico
    openSaleSuccessModal(saleRecord, onFinished);
  });
}

// MODAL DE SUCESSO DA VENDA COM CUPOM TÉRMICO E WHATSAPP
function openSaleSuccessModal(saleRecord, onFinished) {
  const successModal = document.createElement('div');
  successModal.id = 'sale-success-modal';
  successModal.className = 'pep-modal';
  successModal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 15, 29, 0.92); backdrop-filter: blur(16px);
    display: flex; justify-content: center; align-items: center; z-index: 10003; padding: 16px;
  `;

  const totalFormatted = parseFloat(saleRecord.totalSale || 0).toFixed(2).replace('.', ',');

  successModal.innerHTML = `
    <div style="width: 100%; max-width: 520px; background: #0f172a; border: 1.5px solid rgba(16, 185, 129, 0.5); border-radius: 20px; padding: 24px; box-shadow: 0 25px 60px rgba(0,0,0,0.9); text-align: center;">
      
      <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); border: 2px solid #10b981; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto; color: #34d399; font-size: 1.8rem;">
        <i class="fa-solid fa-check"></i>
      </div>

      <h3 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.35rem; color: #fff; font-weight: 800;">
        Venda Realizada com Sucesso!
      </h3>
      <p style="margin: 4px 0 16px 0; color: #94a3b8; font-size: 0.84rem;">
        Protocolo <strong style="color: #38bdf8;">#${saleRecord.protocol}</strong> • Total: <strong style="color: #34d399;">R$ ${totalFormatted}</strong>
      </p>

      <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px; margin-bottom: 20px; text-align: left; font-size: 0.82rem; color: #cbd5e1;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Cliente:</span>
          <strong style="color: #fff;">${saleRecord.clientName}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Pagamento:</span>
          <strong style="color: #34d399;">${saleRecord.paymentMethod}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Itens Baixados:</span>
          <span>${saleRecord.items.length} produto(s)</span>
        </div>
      </div>

      <!-- Ações de Impressão e WhatsApp -->
      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <button type="button" id="btn-print-receipt-80mm" class="btn" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: none; padding: 10px; border-radius: 8px; font-weight: 700; font-size: 0.84rem; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer;">
            <i class="fa-solid fa-print"></i> Cupom Térmico (80mm)
          </button>
          <button type="button" id="btn-print-receipt-58mm" class="btn" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; padding: 10px; border-radius: 8px; font-weight: 600; font-size: 0.84rem; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer;">
            <i class="fa-solid fa-receipt"></i> Mini Cupom (58mm)
          </button>
        </div>

        <button type="button" id="btn-whatsapp-receipt" class="btn" style="background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; border: none; padding: 11px; border-radius: 8px; font-weight: 700; font-size: 0.88rem; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;">
          <i class="fa-brands fa-whatsapp"></i> Enviar Comprovante via WhatsApp
        </button>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px; display: flex; justify-content: flex-end; gap: 10px;">
        <button type="button" id="btn-close-sale-success" class="btn" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #94a3b8; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.82rem; cursor: pointer;">
          Fechar
        </button>
        <button type="button" id="btn-new-sale-shortcut" class="btn btn-primary" style="background: linear-gradient(135deg, #10b981, #059669); border: none; padding: 8px 18px; border-radius: 8px; font-weight: 700; font-size: 0.84rem; display: flex; align-items: center; gap: 6px; cursor: pointer;">
          <i class="fa-solid fa-plus"></i> Nova Venda (PDV)
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(successModal);

  const closeSuccess = () => {
    successModal.remove();
    if (typeof onFinished === 'function') {
      onFinished(saleRecord);
    }
  };

  document.getElementById('btn-close-sale-success')?.addEventListener('click', closeSuccess);

  document.getElementById('btn-print-receipt-80mm')?.addEventListener('click', () => {
    printThermalReceipt(saleRecord, '80mm');
  });

  document.getElementById('btn-print-receipt-58mm')?.addEventListener('click', () => {
    printThermalReceipt(saleRecord, '58mm');
  });

  document.getElementById('btn-whatsapp-receipt')?.addEventListener('click', () => {
    const text = generateWhatsAppSaleText(saleRecord);
    const phone = (saleRecord.clientPhone || '').replace(/\D/g, '');
    const url = phone.length >= 10 
      ? `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  });

  document.getElementById('btn-new-sale-shortcut')?.addEventListener('click', () => {
    closeSuccess();
    openQuickCheckoutModal(onFinished);
  });
}
