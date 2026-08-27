// src/modules/pricingCalculatorModal.js
// MÓDULO DE PRECIFICAÇÃO FARMACÊUTICA INTELIGENTE, MARKUP & FORMAÇÃO DO PREÇO DE VENDA

import * as localDB from '../localDB.js';
import { showToast, showCustomAlert } from './ui.js';
import { syncManager } from './sync.js';

// Presets de Margem por Categoria Farmacêutica
const CATEGORY_PRESETS = {
  'generico': { label: 'Genéricos & Similares', margin: 60, tax: 6.5, cardFee: 2.5, comm: 2.0 },
  'mip': { label: 'MIPs & Medicamentos Isentos', margin: 45, tax: 6.5, cardFee: 2.5, comm: 1.5 },
  'referencia': { label: 'Referência / Éticos (PMC Anvisa)', margin: 22, tax: 6.5, cardFee: 2.5, comm: 1.0 },
  'perfumaria': { label: 'Perfumaria & Dermocosméticos', margin: 50, tax: 6.5, cardFee: 2.5, comm: 2.0 },
  'suplemento': { label: 'Suplementos & Vitaminas', margin: 55, tax: 6.5, cardFee: 2.5, comm: 2.5 },
  'geral': { label: 'Personalizado / Geral', margin: 40, tax: 6.5, cardFee: 2.5, comm: 1.5 }
};

export function openPricingCalculatorModal(targetProductId = null, onAppliedCallback = null) {
  try {
    const existing = document.getElementById('pricing-calculator-modal');
    if (existing) existing.remove();

    const allProducts = localDB.list('products') || [];
    let selectedProduct = targetProductId ? allProducts.find(p => String(p.id) === String(targetProductId)) : null;

    // Valores Iniciais
    let costPrice = selectedProduct ? parseFloat(selectedProduct.cost_price || 0) : 12.00;
    let freightPct = 2.0;
    let taxPct = 6.5; // Simples Nacional médio
    let cardFeePct = 2.5; // Taxa de cartão média
    let commissionPct = 1.5; // Comissão de balcão
    let targetMarginPct = 50.0; // Margem líquida alvo
    let pmcAnvisa = selectedProduct ? parseFloat(selectedProduct.pmc || selectedProduct.sale_price * 1.35 || 0) : 0;
    let selectedCategory = 'generico';

    if (selectedProduct) {
      const cat = (selectedProduct.category || '').toLowerCase();
      if (cat.includes('genérico') || cat.includes('similar')) selectedCategory = 'generico';
      else if (cat.includes('mip') || cat.includes('isento') || cat.includes('analgésico')) selectedCategory = 'mip';
      else if (cat.includes('referência') || cat.includes('controlado')) selectedCategory = 'referencia';
      else if (cat.includes('dermocosmético') || cat.includes('perfumaria')) selectedCategory = 'perfumaria';
      else if (cat.includes('suplemento') || cat.includes('vitamina')) selectedCategory = 'suplemento';
    }

    const modal = document.createElement('div');
    modal.id = 'pricing-calculator-modal';
    modal.className = 'pep-modal';
    modal.style.cssText = `
      position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
      width: 100vw !important; height: 100vh !important;
      background: rgba(5, 8, 22, 0.9) !important; backdrop-filter: blur(16px) !important;
      -webkit-backdrop-filter: blur(16px) !important;
      display: flex !important; align-items: center !important; justify-content: center !important;
      z-index: 100060 !important; padding: 16px !important; box-sizing: border-box !important;
    `;

    modal.innerHTML = `
      <div style="max-width: 980px; width: 100%; max-height: 94vh; display: flex; flex-direction: column; background: #0b1120; border: 1.5px solid rgba(245, 158, 11, 0.45); border-radius: 22px; box-shadow: 0 25px 75px rgba(0,0,0,0.95), 0 0 35px rgba(245, 158, 11, 0.15); overflow: hidden;">
        
        <!-- Header -->
        <div style="padding: 16px 24px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(180, 83, 9, 0.35)); border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(245, 158, 11, 0.25); border: 1.5px solid #f59e0b; display: flex; align-items: center; justify-content: center; color: #fbbf24; font-size: 1.3rem;">
              <i class="fa-solid fa-calculator"></i>
            </div>
            <div>
              <h3 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.25rem; color: #fff; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                Precificação Farmacêutica Inteligente &amp; Formação de Preço
              </h3>
              <p style="margin: 2px 0 0; font-size: 0.8rem; color: #cbd5e1;">
                Cálculo de Markup, Margem de Contribuição, Impostos, Despesas e Trava Regulatória CMED/Anvisa.
              </p>
            </div>
          </div>
          <button type="button" id="btn-close-pricing-modal" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); color: #fff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Seletor Rápido de Produto -->
        <div style="background: rgba(15, 23, 42, 0.95); padding: 12px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 280px;">
            <label style="font-size: 0.78rem; font-weight: 700; color: #fbbf24; white-space: nowrap;">
              <i class="fa-solid fa-pills"></i> Produto do Estoque:
            </label>
            <select id="pricing-product-select" style="flex: 1; background: #1e293b; border: 1px solid rgba(245,158,11,0.35); color: #f8fafc; padding: 7px 12px; border-radius: 8px; font-size: 0.84rem; outline: none;">
              <option value="">-- Modo Simulação Livre (Novo Produto) --</option>
              ${allProducts.map(p => `
                <option value="${p.id}" ${selectedProduct && selectedProduct.id === p.id ? 'selected' : ''}>
                  ${p.name} (Custo: R$ ${(parseFloat(p.cost_price || 0)).toFixed(2)} | Venda Atual: R$ ${(parseFloat(p.sale_price || 0)).toFixed(2)})
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Presets de Categoria -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${Object.entries(CATEGORY_PRESETS).map(([k, v]) => `
              <button type="button" class="btn-preset-cat ${k === selectedCategory ? 'active' : ''}" data-cat="${k}" style="
                background: ${k === selectedCategory ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.04)'};
                border: 1px solid ${k === selectedCategory ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)'};
                color: ${k === selectedCategory ? '#fbbf24' : '#94a3b8'};
                font-size: 0.72rem; font-weight: 700; padding: 4px 10px; border-radius: 8px; cursor: pointer; transition: 0.2s;
              ">
                ${v.label.split(' ')[0]} (${v.margin}%)
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Corpo Principal (2 Colunas: Inputs de Custos vs Resultados DRE) -->
        <div style="display: grid; grid-template-columns: 1.15fr 1fr; gap: 20px; padding: 20px 24px; overflow-y: auto; flex: 1;">
          
          <!-- COLUNA ESQUERDA: PARÂMETROS E CUSTOS -->
          <div style="display: flex; flex-direction: column; gap: 14px;">
            
            <!-- Bloco 1: Custo de Aquisição -->
            <div style="background: rgba(30, 41, 59, 0.55); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 16px;">
              <h4 style="margin: 0 0 10px; color: #38bdf8; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-file-invoice"></i> 1. Custo de Aquisição (Entrada / NF-e)
              </h4>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label style="font-size: 0.75rem; color: #cbd5e1; display: block; margin-bottom: 4px;">Custo Unitário (R$)</label>
                  <div style="position: relative;">
                    <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-weight: 700; color: #94a3b8; font-size: 0.82rem;">R$</span>
                    <input type="number" step="0.01" min="0" id="input-cost-price" value="${costPrice.toFixed(2)}" style="width: 100%; background: #0f172a; border: 1.5px solid rgba(56, 189, 248, 0.4); color: #fff; padding: 8px 10px 8px 34px; border-radius: 8px; font-weight: 800; font-size: 0.95rem; outline: none; box-sizing: border-box;">
                  </div>
                </div>

                <div>
                  <label style="font-size: 0.75rem; color: #cbd5e1; display: block; margin-bottom: 4px;">Frete / Rateio (%)</label>
                  <div style="position: relative;">
                    <input type="number" step="0.1" min="0" id="input-freight-pct" value="${freightPct}" style="width: 100%; background: #0f172a; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 8px 26px 8px 10px; border-radius: 8px; font-size: 0.88rem; outline: none; box-sizing: border-box;">
                    <span style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.82rem;">%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bloco 2: Impostos e Despesas Variáveis -->
            <div style="background: rgba(30, 41, 59, 0.55); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 16px;">
              <h4 style="margin: 0 0 10px; color: #a78bfa; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-percent"></i> 2. Impostos &amp; Despesas de Venda
              </h4>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                <div>
                  <label style="font-size: 0.72rem; color: #cbd5e1; display: block; margin-bottom: 4px;">Impostos (%)</label>
                  <div style="position: relative;">
                    <input type="number" step="0.1" min="0" id="input-tax-pct" value="${taxPct}" style="width: 100%; background: #0f172a; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 7px 22px 7px 8px; border-radius: 8px; font-size: 0.84rem; outline: none; box-sizing: border-box;">
                    <span style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.75rem;">%</span>
                  </div>
                </div>

                <div>
                  <label style="font-size: 0.72rem; color: #cbd5e1; display: block; margin-bottom: 4px;">Taxa Cartão (%)</label>
                  <div style="position: relative;">
                    <input type="number" step="0.1" min="0" id="input-card-fee-pct" value="${cardFeePct}" style="width: 100%; background: #0f172a; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 7px 22px 7px 8px; border-radius: 8px; font-size: 0.84rem; outline: none; box-sizing: border-box;">
                    <span style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.75rem;">%</span>
                  </div>
                </div>

                <div>
                  <label style="font-size: 0.72rem; color: #cbd5e1; display: block; margin-bottom: 4px;">Comissão (%)</label>
                  <div style="position: relative;">
                    <input type="number" step="0.1" min="0" id="input-comm-pct" value="${commissionPct}" style="width: 100%; background: #0f172a; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 7px 22px 7px 8px; border-radius: 8px; font-size: 0.84rem; outline: none; box-sizing: border-box;">
                    <span style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.75rem;">%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bloco 3: Margem Desejada & Teto Anvisa -->
            <div style="background: rgba(30, 41, 59, 0.55); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 16px;">
              <h4 style="margin: 0 0 10px; color: #10b981; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-bullseye"></i> 3. Margem Líquida Alvo &amp; Teto Anvisa
              </h4>

              <div style="display: flex; flex-direction: column; gap: 10px;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <label style="font-size: 0.76rem; color: #cbd5e1;">Margem Líquida de Lucro Desejada:</label>
                    <strong id="label-target-margin" style="color: #34d399; font-size: 0.9rem;">${targetMarginPct.toFixed(1)}%</strong>
                  </div>
                  <input type="range" min="5" max="85" step="0.5" id="slider-target-margin" value="${targetMarginPct}" style="width: 100%; accent-color: #10b981; cursor: pointer;">
                </div>

                <div>
                  <label style="font-size: 0.75rem; color: #cbd5e1; display: block; margin-bottom: 4px;">
                    PMC Anvisa (Preço Máximo ao Consumidor) — <small style="color: #94a3b8;">Teto Legal</small>
                  </label>
                  <div style="position: relative;">
                    <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.82rem;">R$</span>
                    <input type="number" step="0.01" min="0" id="input-pmc-anvisa" value="${pmcAnvisa > 0 ? pmcAnvisa.toFixed(2) : ''}" placeholder="Opcional (Teto CMED)" style="width: 100%; background: #0f172a; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 7px 10px 7px 34px; border-radius: 8px; font-size: 0.88rem; outline: none; box-sizing: border-box;">
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- COLUNA DIREITA: RESULTADOS FINANCEIROS & SUGESTÃO DE PREÇO -->
          <div style="display: flex; flex-direction: column; gap: 14px;">
            
            <!-- Card Principal de Preço Sugerido -->
            <div style="background: linear-gradient(145deg, #064e3b, #042f2e); border: 2px solid #10b981; border-radius: 16px; padding: 18px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.25); text-align: center; position: relative;">
              <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 800; color: #a7f3d0; letter-spacing: 0.6px; display: block; margin-bottom: 4px;">
                PREÇO IDEAL DE VENDA (SUGERIDO)
              </span>
              <div id="res-suggested-price" style="font-size: 2.2rem; font-weight: 900; color: #ffffff; font-family: 'Outfit', sans-serif;">
                R$ 0,00
              </div>
              <div style="display: flex; justify-content: center; gap: 8px; margin-top: 6px;">
                <span id="badge-markup" style="font-size: 0.74rem; background: rgba(0,0,0,0.3); color: #34d399; padding: 3px 10px; border-radius: 12px; font-weight: 700; border: 1px solid rgba(52, 211, 153, 0.3);">
                  Markup: 0.00x
                </span>
                <span id="badge-psychological-price" style="font-size: 0.74rem; background: rgba(245, 158, 11, 0.25); color: #fef08a; padding: 3px 10px; border-radius: 12px; font-weight: 700; border: 1px solid rgba(245, 158, 11, 0.4);">
                  Preço Psicológico: R$ 0,00
                </span>
              </div>
            </div>

            <!-- Grade de Métricas DRE Unitária -->
            <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px;">
              <div style="font-size: 0.72rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 6px; margin-bottom: 4px;">
                DRE Unitária &amp; Análise de Viabilidade
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.84rem; color: #cbd5e1;">
                <span>Custo Total Efetivo:</span>
                <strong id="res-total-cost" style="color: #fff;">R$ 0,00</strong>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.84rem; color: #cbd5e1;">
                <span>Ponto de Equilíbrio (Preço Mínimo):</span>
                <strong id="res-breakeven-price" style="color: #fbbf24;">R$ 0,00</strong>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.84rem; color: #cbd5e1;">
                <span>Total Impostos &amp; Taxas:</span>
                <span id="res-total-fees" style="color: #f87171;">- R$ 0,00</span>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.84rem; color: #cbd5e1; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 6px;">
                <span style="font-weight: 700; color: #34d399;">Lucro Líquido Real / un:</span>
                <strong id="res-net-profit" style="color: #34d399; font-size: 0.95rem;">R$ 0,00 (0%)</strong>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.84rem; color: #cbd5e1;">
                <span>Preço Promocional Balcão / PBM (-15%):</span>
                <span id="res-promo-price" style="color: #38bdf8; font-weight: 700;">R$ 0,00</span>
              </div>
            </div>

            <!-- Validador de Teto Anvisa CMED -->
            <div id="box-anvisa-status" style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 12px; padding: 10px 14px; font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-shield-check" style="font-size: 1.1rem;"></i>
              <span id="text-anvisa-status">Preço formatado de acordo com a margem operacional farmacêutica.</span>
            </div>

            <!-- Botões de Ação -->
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: auto;">
              <button type="button" id="btn-apply-calculated-price" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 12px 18px; border-radius: 10px; font-weight: 800; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); transition: 0.2s;">
                <i class="fa-solid fa-floppy-disk"></i> 💾 Aplicar Preço de Venda no Estoque &amp; PDV
              </button>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button type="button" id="btn-print-pricing-sheet" style="background: rgba(245, 158, 11, 0.18); border: 1px solid rgba(245, 158, 11, 0.4); color: #fbbf24; padding: 8px 12px; border-radius: 8px; font-weight: 700; font-size: 0.78rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                  <i class="fa-solid fa-print"></i> Imprimir Ficha
                </button>
                <button type="button" id="btn-reset-pricing-fields" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #cbd5e1; padding: 8px 12px; border-radius: 8px; font-weight: 600; font-size: 0.78rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                  <i class="fa-solid fa-rotate-left"></i> Limpar / Resetar
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    document.getElementById('btn-close-pricing-modal')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // ── MOTOR MATEMÁTICO DE PRECIFICAÇÃO (CÁLCULO EM TEMPO REAL) ──
    const calculatePricing = () => {
      const cost = parseFloat(document.getElementById('input-cost-price')?.value || 0);
      const freight = parseFloat(document.getElementById('input-freight-pct')?.value || 0);
      const tax = parseFloat(document.getElementById('input-tax-pct')?.value || 0);
      const cardFee = parseFloat(document.getElementById('input-card-fee-pct')?.value || 0);
      const comm = parseFloat(document.getElementById('input-comm-pct')?.value || 0);
      const margin = parseFloat(document.getElementById('slider-target-margin')?.value || 0);
      const pmc = parseFloat(document.getElementById('input-pmc-anvisa')?.value || 0);

      document.getElementById('label-target-margin').textContent = `${margin.toFixed(1)}%`;

      // 1. Custo Efetivo de Entrada
      const effectiveCost = cost * (1 + (freight / 100));

      // 2. Soma de Despesas Variáveis sobre o Preço de Venda
      const totalVariableDeductionsPct = (tax + cardFee + comm + margin) / 100;

      // 3. Fórmula do Preço de Venda com Margem sobre o Preço (Margem de Contribuição):
      // PV = Custo Efetivo / (1 - % Despesas - % Margem Desejada)
      let idealPrice = 0;
      if (totalVariableDeductionsPct < 0.98) {
        idealPrice = effectiveCost / (1 - totalVariableDeductionsPct);
      } else {
        idealPrice = effectiveCost * 2.5; // Fallback multiplicador
      }

      // 4. Ponto de Equilíbrio (Preço Mínimo para Margem Zero)
      const breakevenDeductions = (tax + cardFee + comm) / 100;
      const breakevenPrice = breakevenDeductions < 0.98 ? (effectiveCost / (1 - breakevenDeductions)) : effectiveCost * 1.15;

      // 5. Markup Multiplicador (PV / Custo Inicial)
      const markup = cost > 0 ? (idealPrice / cost) : 0;

      // 6. Preço Psicológico (arredondamento comercial para .90 ou .99)
      const floorInt = Math.floor(idealPrice);
      const psychPrice = (idealPrice - floorInt <= 0.45) ? (floorInt - 0.10) : (floorInt + 0.90);
      const finalPsychPrice = Math.max(breakevenPrice, psychPrice > 0 ? psychPrice : idealPrice);

      // 7. Lucro Líquido Real e Impostos em R$
      const taxVal = idealPrice * (tax / 100);
      const cardFeeVal = idealPrice * (cardFee / 100);
      const commVal = idealPrice * (comm / 100);
      const totalFeesVal = taxVal + cardFeeVal + commVal;
      const netProfitVal = idealPrice - effectiveCost - totalFeesVal;
      const netProfitPct = idealPrice > 0 ? (netProfitVal / idealPrice) * 100 : 0;

      // 8. Preço Promocional Balcão (-15%)
      const promoPrice = Math.max(breakevenPrice, idealPrice * 0.85);

      // Atualizar UI em tempo real
      document.getElementById('res-suggested-price').textContent = `R$ ${idealPrice.toFixed(2).replace('.', ',')}`;
      document.getElementById('badge-markup').textContent = `Markup: ${markup.toFixed(2)}x`;
      document.getElementById('badge-psychological-price').textContent = `Preço Psicológico: R$ ${finalPsychPrice.toFixed(2).replace('.', ',')}`;
      document.getElementById('res-total-cost').textContent = `R$ ${effectiveCost.toFixed(2).replace('.', ',')}`;
      document.getElementById('res-breakeven-price').textContent = `R$ ${breakevenPrice.toFixed(2).replace('.', ',')}`;
      document.getElementById('res-total-fees').textContent = `- R$ ${totalFeesVal.toFixed(2).replace('.', ',')} (${(tax + cardFee + comm).toFixed(1)}%)`;
      document.getElementById('res-net-profit').textContent = `R$ ${netProfitVal.toFixed(2).replace('.', ',')} (${netProfitPct.toFixed(1)}%)`;
      document.getElementById('res-promo-price').textContent = `R$ ${promoPrice.toFixed(2).replace('.', ',')}`;

      // Validação CMED / Anvisa
      const anvisaBox = document.getElementById('box-anvisa-status');
      const anvisaText = document.getElementById('text-anvisa-status');

      if (pmc > 0) {
        if (idealPrice > pmc) {
          anvisaBox.style.background = 'rgba(239, 68, 68, 0.15)';
          anvisaBox.style.borderColor = 'rgba(239, 68, 68, 0.45)';
          anvisaBox.style.color = '#f87171';
          anvisaText.innerHTML = `⚠️ <strong>ALERTA CMED/ANVISA:</strong> O preço calculado (R$ ${idealPrice.toFixed(2)}) ultrapassa o PMC regulatório teto de R$ ${pmc.toFixed(2)}!`;
        } else {
          const discountFromPmc = ((pmc - idealPrice) / pmc) * 100;
          anvisaBox.style.background = 'rgba(16, 185, 129, 0.12)';
          anvisaBox.style.borderColor = 'rgba(16, 185, 129, 0.35)';
          anvisaBox.style.color = '#34d399';
          anvisaText.innerHTML = `✅ <strong>CONFORME ANVISA:</strong> Preço dentro do teto legal (PMC R$ ${pmc.toFixed(2)} &bull; Desconto de ${discountFromPmc.toFixed(1)}% ao consumidor).`;
        }
      } else {
        anvisaBox.style.background = 'rgba(56, 189, 248, 0.12)';
        anvisaBox.style.borderColor = 'rgba(56, 189, 248, 0.35)';
        anvisaBox.style.color = '#38bdf8';
        anvisaText.textContent = `Margem de contribuição saudável (${netProfitPct.toFixed(1)}% líquido) para farmácias e consultórios.`;
      }
    };

    // Listeners de Cálculo Instantâneo
    [
      'input-cost-price',
      'input-freight-pct',
      'input-tax-pct',
      'input-card-fee-pct',
      'input-comm-pct',
      'slider-target-margin',
      'input-pmc-anvisa'
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', calculatePricing);
      }
    });

    // Seletor de Categoria Preset
    modal.querySelectorAll('.btn-preset-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.btn-preset-cat').forEach(b => {
          b.style.background = 'rgba(255, 255, 255, 0.04)';
          b.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          b.style.color = '#94a3b8';
        });
        btn.style.background = 'rgba(245, 158, 11, 0.25)';
        btn.style.borderColor = '#f59e0b';
        btn.style.color = '#fbbf24';

        const catKey = btn.dataset.cat;
        const preset = CATEGORY_PRESETS[catKey];
        if (preset) {
          document.getElementById('slider-target-margin').value = preset.margin;
          document.getElementById('input-tax-pct').value = preset.tax;
          document.getElementById('input-card-fee-pct').value = preset.cardFee;
          document.getElementById('input-comm-pct').value = preset.comm;
          calculatePricing();
        }
      });
    });

    // Mudança de Produto Selecionado
    const prodSelect = document.getElementById('pricing-product-select');
    prodSelect.addEventListener('change', () => {
      const pId = prodSelect.value;
      if (pId) {
        const prod = allProducts.find(p => String(p.id) === String(pId));
        if (prod) {
          selectedProduct = prod;
          document.getElementById('input-cost-price').value = parseFloat(prod.cost_price || 0).toFixed(2);
          if (prod.pmc) document.getElementById('input-pmc-anvisa').value = parseFloat(prod.pmc).toFixed(2);
          calculatePricing();
        }
      }
    });

    // Botão Aplicar Preço no Estoque & PDV
    document.getElementById('btn-apply-calculated-price')?.addEventListener('click', () => {
      const cost = parseFloat(document.getElementById('input-cost-price')?.value || 0);
      const freight = parseFloat(document.getElementById('input-freight-pct')?.value || 0);
      const tax = parseFloat(document.getElementById('input-tax-pct')?.value || 0);
      const cardFee = parseFloat(document.getElementById('input-card-fee-pct')?.value || 0);
      const comm = parseFloat(document.getElementById('input-comm-pct')?.value || 0);
      const margin = parseFloat(document.getElementById('slider-target-margin')?.value || 0);

      const effectiveCost = cost * (1 + (freight / 100));
      const totalVar = (tax + cardFee + comm + margin) / 100;
      const finalPrice = totalVar < 0.98 ? (effectiveCost / (1 - totalVar)) : effectiveCost * 2.5;

      const pId = prodSelect.value;
      if (!pId) {
        showCustomAlert({
          title: 'Simulação Livre',
          message: `Preço calculado: <strong>R$ ${finalPrice.toFixed(2).replace('.', ',')}</strong>.<br><br>Para salvar automaticamente, selecione um produto cadastrado no menu superior.`,
          type: 'info'
        });
        return;
      }

      // Atualizar no banco local
      localDB.update('products', pId, {
        cost_price: cost,
        sale_price: parseFloat(finalPrice.toFixed(2))
      });

      showToast(`🏷️ Preço de R$ ${finalPrice.toFixed(2).replace('.', ',')} aplicado com sucesso no produto e Frente de Caixa!`);
      syncManager.pushToCloud(false);
      closeModal();

      if (typeof onAppliedCallback === 'function') {
        onAppliedCallback();
      }
    });

    // Botão Imprimir Ficha de Precificação
    document.getElementById('btn-print-pricing-sheet')?.addEventListener('click', () => {
      window.print();
    });

    // Botão Resetar
    document.getElementById('btn-reset-pricing-fields')?.addEventListener('click', () => {
      document.getElementById('input-cost-price').value = '10.00';
      document.getElementById('input-freight-pct').value = '2.0';
      document.getElementById('input-tax-pct').value = '6.5';
      document.getElementById('input-card-fee-pct').value = '2.5';
      document.getElementById('input-comm-pct').value = '1.5';
      document.getElementById('slider-target-margin').value = '50';
      document.getElementById('input-pmc-anvisa').value = '';
      calculatePricing();
    });

    // Executa o primeiro cálculo
    calculatePricing();

  } catch (err) {
    console.error('[PricingCalculator] Erro ao abrir calculadora:', err);
    showToast('Erro ao abrir módulo de precificação.');
  }
}

// Exportação global
if (typeof window !== 'undefined') {
  window.openPricingCalculatorModal = openPricingCalculatorModal;
}
