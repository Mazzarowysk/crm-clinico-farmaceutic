// src/modules/stockIntelligence.js
// MÓDULO DE INTELIGÊNCIA DE VALIDADES (FEFO 30/60/90 DIAS) & PREVISÃO DE REPOSIÇÃO DE ESTOQUE

import * as localDB from '../localDB.js';
import { state } from '../state.js';
import { showToast, showCustomAlert, showCustomConfirm } from './ui.js';
import { syncManager } from './sync.js';

// Calcula status e agrupamentos de validade para todos os produtos
export function analyzeExpiryRisk(products = []) {
  const now = new Date();
  
  const expired = [];
  const critical30 = [];
  const attention60 = [];
  const alert90 = [];
  const safe = [];

  products.forEach(p => {
    if (!p.expiry_date) return;
    const exp = new Date(p.expiry_date);
    const daysDiff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    const item = { ...p, daysDiff };

    if (daysDiff < 0) {
      expired.push(item);
    } else if (daysDiff <= 30) {
      critical30.push(item);
    } else if (daysDiff <= 60) {
      attention60.push(item);
    } else if (daysDiff <= 90) {
      alert90.push(item);
    } else {
      safe.push(item);
    }
  });

  return {
    expired,
    critical30,
    attention60,
    alert90,
    safe,
    totalTracked: expired.length + critical30.length + attention60.length + alert90.length + safe.length
  };
}

// Calcula previsão de reposição e consumo médio diário
export function analyzeReplenishmentNeeds(products = [], movements = []) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  // Mapear consumo de cada produto nos últimos 30 dias
  const salesByProduct = {};
  movements.forEach(m => {
    if (m.type === 'Saída por Venda' || m.quantity < 0) {
      const dt = new Date(m.created_at || Date.now());
      if (dt >= thirtyDaysAgo) {
        const pId = m.product_id;
        const qty = Math.abs(m.quantity || 0);
        salesByProduct[pId] = (salesByProduct[pId] || 0) + qty;
      }
    }
  });

  const replenishmentList = products.map(p => {
    const currentStock = parseInt(p.current_stock || 0, 10);
    const minStock = parseInt(p.min_stock || 10, 10);
    const monthlyConsumption = salesByProduct[p.id] || 0;
    const dailyConsumption = monthlyConsumption > 0 ? (monthlyConsumption / 30) : (minStock / 30);
    
    const runwayDays = dailyConsumption > 0 ? Math.floor(currentStock / dailyConsumption) : (currentStock > 0 ? 999 : 0);
    
    // Sugestão de compra: repor até o estoque ideal (2x estoque mínimo ou 45 dias de consumo)
    const idealStock = Math.max(minStock * 2, Math.ceil(dailyConsumption * 45));
    const suggestedBuy = Math.max(0, idealStock - currentStock);

    let status = 'saudavel';
    let statusLabel = 'Saldo Saudável';
    let badgeStyle = 'background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);';

    if (currentStock === 0) {
      status = 'zerado';
      statusLabel = '🚨 ESTOQUE ZERADO';
      badgeStyle = 'background: #dc2626; color: #fff; font-weight: 800;';
    } else if (currentStock <= minStock) {
      status = 'critico';
      statusLabel = '⚠️ Abaixo do Mínimo';
      badgeStyle = 'background: #d97706; color: #fff; font-weight: 800;';
    } else if (runwayDays <= 15) {
      status = 'alerta';
      statusLabel = '⏳ Cobertura < 15 dias';
      badgeStyle = 'background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4);';
    }

    return {
      product: p,
      currentStock,
      minStock,
      idealStock,
      monthlyConsumption,
      dailyConsumption: dailyConsumption.toFixed(1),
      runwayDays,
      suggestedBuy,
      status,
      statusLabel,
      badgeStyle
    };
  });

  return replenishmentList.sort((a, b) => {
    const priority = { zerado: 0, critico: 1, alerta: 2, saudavel: 3 };
    return priority[a.status] - priority[b.status];
  });
}

// Modal de Aplicação de Desconto Promocional para Lote Próximo ao Vencimento
export function openPromoDiscountModal(product, onUpdated = null) {
  const currentPrice = parseFloat(product.sale_price || 0);
  const costPrice = parseFloat(product.cost_price || 0);

  const modal = document.createElement('div');
  modal.className = 'pep-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 15, 29, 0.88); backdrop-filter: blur(14px);
    display: flex; justify-content: center; align-items: center; z-index: 10005; padding: 16px;
  `;

  modal.innerHTML = `
    <div style="width: 100%; max-width: 480px; background: #0f172a; border: 1.5px solid rgba(245, 158, 11, 0.5); border-radius: 20px; padding: 22px; box-shadow: 0 25px 60px rgba(0,0,0,0.9);">
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(245, 158, 11, 0.2); color: #fbbf24; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
            <i class="fa-solid fa-tags"></i>
          </div>
          <div>
            <h4 style="margin: 0; color: #fff; font-family: 'Outfit'; font-size: 1.1rem; font-weight: 700;">
              Desconto Promocional (FEFO)
            </h4>
            <small style="color: #94a3b8;">Acelerar escoamento antes do vencimento</small>
          </div>
        </div>
        <button id="btn-close-promo-modal" style="background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 12px; margin-bottom: 16px;">
        <strong style="color: #fff; font-size: 0.92rem; display: block;">${product.name}</strong>
        <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 4px;">
          Lote: <span style="color: #cbd5e1; font-family: monospace;">${product.batch || 'N/A'}</span> • 
          Validade: <strong style="color: #fbbf24;">${product.expiry_date ? new Date(product.expiry_date).toLocaleDateString('pt-BR') : 'N/A'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-top: 6px; color: #94a3b8;">
          <span>Preço Atual: <strong>R$ ${currentPrice.toFixed(2).replace('.', ',')}</strong></span>
          <span>Custo: <strong>R$ ${costPrice.toFixed(2).replace('.', ',')}</strong></span>
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 0.8rem; color: #cbd5e1; font-weight: 700; margin-bottom: 6px;">
          Selecione o Percentual de Desconto:
        </label>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px;">
          <button type="button" class="btn-pct-promo" data-pct="10" style="padding: 8px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #cbd5e1; cursor: pointer;">-10%</button>
          <button type="button" class="btn-pct-promo" data-pct="20" style="padding: 8px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #cbd5e1; cursor: pointer;">-20%</button>
          <button type="button" class="btn-pct-promo" data-pct="30" style="padding: 8px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; border: 1px solid #f59e0b; background: rgba(245, 158, 11, 0.2); color: #fbbf24; cursor: pointer;">-30%</button>
          <button type="button" class="btn-pct-promo" data-pct="50" style="padding: 8px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #cbd5e1; cursor: pointer;">-50%</button>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 10px 14px;">
          <span style="font-size: 0.82rem; color: #cbd5e1;">Novo Preço de Venda:</span>
          <strong id="promo-new-price-display" style="font-size: 1.3rem; font-weight: 800; color: #34d399; font-family: 'Outfit';">
            R$ ${(currentPrice * 0.7).toFixed(2).replace('.', ',')}
          </strong>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button type="button" id="btn-cancel-promo" class="btn" style="background: rgba(255,255,255,0.06); color: #94a3b8; border: 1px solid rgba(255,255,255,0.12); padding: 8px 16px; border-radius: 8px; cursor: pointer;">
          Cancelar
        </button>
        <button type="button" id="btn-confirm-promo" class="btn btn-primary" style="background: linear-gradient(135deg, #f59e0b, #d97706); border: none; padding: 8px 20px; border-radius: 8px; font-weight: 700; color: #fff; cursor: pointer;">
          <i class="fa-solid fa-check"></i> Aplicar Preço Promocional
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  let selectedPct = 30;
  const newPriceDisplay = document.getElementById('promo-new-price-display');

  const updatePrice = (pct) => {
    selectedPct = pct;
    const newPrice = Math.max(costPrice, currentPrice * (1 - pct / 100));
    newPriceDisplay.textContent = `R$ ${newPrice.toFixed(2).replace('.', ',')}`;
  };

  modal.querySelectorAll('.btn-pct-promo').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.btn-pct-promo').forEach(b => {
        b.style.border = '1px solid rgba(255,255,255,0.1)';
        b.style.background = 'rgba(255,255,255,0.04)';
        b.style.color = '#cbd5e1';
      });
      btn.style.border = '1px solid #f59e0b';
      btn.style.background = 'rgba(245, 158, 11, 0.2)';
      btn.style.color = '#fbbf24';
      updatePrice(parseInt(btn.dataset.pct, 10));
    });
  });

  const closeModal = () => modal.remove();
  document.getElementById('btn-close-promo-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-promo')?.addEventListener('click', closeModal);

  document.getElementById('btn-confirm-promo')?.addEventListener('click', () => {
    const finalPrice = Math.max(0.01, currentPrice * (1 - selectedPct / 100));
    localDB.update('products', product.id, { sale_price: finalPrice });
    
    // Registrar na auditoria
    localDB.insert('inventory_movements', {
      product_id: product.id,
      product_name: product.name,
      type: 'Ajuste de Preço',
      quantity: 0,
      batch: product.batch || 'N/A',
      cost_unit: costPrice,
      total_value: 0,
      reason: `Preço Promocional FEFO (-${selectedPct}%): De R$ ${currentPrice.toFixed(2)} por R$ ${finalPrice.toFixed(2)}`,
      patient_name: 'Campanha de Prevenção de Perdas',
      operator_name: `${state.user?.name || 'Operador'} (${state.user?.role || 'Farmacêutico'})`,
      created_at: new Date().toISOString()
    });

    syncManager.pushToCloud(false);
    showToast(`🏷️ Preço promocional de R$ ${finalPrice.toFixed(2).replace('.', ',')} aplicado com sucesso!`);
    closeModal();

    if (typeof onUpdated === 'function') {
      onUpdated();
    }
  });
}

// Modal de Envio para Quarentena / Descarte Sanitário de Lote Vencido
export function openQuarantineModal(product, onUpdated = null) {
  showCustomConfirm({
    title: '⚠️ Mover Lote para Quarentena / Descarte Sanitário',
    message: `Deseja retirar ${product.current_stock || 0} unidades do lote "${product.batch || 'N/A'}" do produto "${product.name}" do estoque de venda? Essa ação dará baixa no saldo físico para conformidade sanitária CFF/Anvisa.`,
    confirmText: 'Sim, Mover para Quarentena',
    cancelText: 'Cancelar',
    type: 'danger',
    onConfirm: () => {
      const qty = parseInt(product.current_stock || 0, 10);
      localDB.update('products', product.id, { current_stock: 0 });

      localDB.insert('inventory_movements', {
        product_id: product.id,
        product_name: product.name,
        type: 'Quarentena / Descarte',
        quantity: -qty,
        batch: product.batch || 'N/A',
        cost_unit: parseFloat(product.cost_price || 0),
        total_value: qty * parseFloat(product.cost_price || 0),
        reason: `Retirada de Lote Vencido/Impróprio para Quarentena Sanitária (FEFO)`,
        patient_name: 'Descarte Sanitário CFF',
        operator_name: `${state.user?.name || 'Operador'} (${state.user?.role || 'Farmacêutico'})`,
        created_at: new Date().toISOString()
      });

      syncManager.pushToCloud(false);
      showToast(`📦 Lote movido para Quarentena Sanitária com sucesso.`);

      if (typeof onUpdated === 'function') {
        onUpdated();
      }
    }
  });
}
