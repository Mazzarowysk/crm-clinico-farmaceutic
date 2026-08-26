// ============================================================================
// 🌿 CRM CLÍNICO FARMACÊUTICO — MÓDULO DE CONTROLE FINANCEIRO & FLUXO DE CAIXA
// Gestão de Receitas Clínicas (Consultas/MIPs/TLR) vs Despesas Operacionais e Compras
// ============================================================================

import { state } from '../state.js';
import * as localDB from '../localDB.js';
import { apiFetch } from '../modules/api.js';
import { showToast, showCustomAlert, showCustomConfirm } from '../modules/ui.js';
import {
  getFinancialCategories,
  addFinancialCategory,
  getPaymentMethods,
  addPaymentMethod
} from '../modules/financialParams.js';

let currentFilterType = 'todos'; // 'todos' | 'receita' | 'despesa'
let currentFilterPeriod = 'mes'; // 'hoje' | '7dias' | 'mes' | 'ano' | 'todos'
let currentSearchTerm = '';

export function renderFinancialTab(contentArea) {
  if (!contentArea) contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  const allTransactions = getFinancialTransactions();
  const filtered = filterTransactions(allTransactions);
  const metrics = calculateFinancialMetrics(allTransactions);

  contentArea.innerHTML = `
    <div class="tab-section active" style="padding: 20px; max-width: 1400px; margin: 0 auto;">
      
      <!-- Cabeçalho do Módulo Financeiro -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.45rem; font-weight: 700; color: #fff; margin: 0 0 4px; display: flex; align-items: center; gap: 10px;">
            <i class="fa-solid fa-sack-dollar" style="color: #10b981;"></i> Controle Financeiro &amp; Fluxo de Caixa Farmacêutico
          </h2>
          <p style="font-size: 0.85rem; color: #94a3b8; margin: 0;">
            Gestão integrada de faturamento em vendas de balcão (MIPs), serviços clínicos farmacêuticos (RDC 786) e despesas operacionais.
          </p>
        </div>

        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <button id="btn-export-financial-pdf" class="btn" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #e2e8f0; padding: 9px 16px; border-radius: 10px; font-weight: 600; font-size: 0.84rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-file-pdf" style="color: #f87171;"></i> Exportar DRE (PDF)
          </button>
          <button id="btn-new-transaction" class="btn" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: 1px solid #34d399; padding: 9px 18px; border-radius: 10px; font-weight: 700; font-size: 0.86rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);">
            <i class="fa-solid fa-plus"></i> Novo Lançamento
          </button>
        </div>
      </div>

      <!-- CARDS DE METRICAS FINANCEIRAS (KPIS NEON) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">
        
        <!-- Faturamento Total -->
        <div class="pharmacy-glass-card" style="padding: 18px 20px; border-radius: 16px; border: 1.5px solid rgba(16, 185, 129, 0.4); background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 23, 42, 0.85)); box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; color: #34d399; letter-spacing: 0.5px;">Receita Bruta Total</span>
            <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(16, 185, 129, 0.2); display: flex; align-items: center; justify-content: center; color: #34d399;">
              <i class="fa-solid fa-arrow-trend-up"></i>
            </div>
          </div>
          <div style="font-size: 1.65rem; font-weight: 800; color: #ffffff; font-family: 'Outfit', sans-serif;">
            ${formatCurrency(metrics.totalRevenue)}
          </div>
          <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 4px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-circle-check" style="color: #34d399;"></i> ${metrics.revenueCount} lançamentos registrados
          </div>
        </div>

        <!-- Receita Serviços Clínicos -->
        <div class="pharmacy-glass-card" style="padding: 18px 20px; border-radius: 16px; border: 1.5px solid rgba(56, 189, 248, 0.4); background: linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(15, 23, 42, 0.85)); box-shadow: 0 0 20px rgba(56, 189, 248, 0.15);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; color: #38bdf8; letter-spacing: 0.5px;">Serviços Clínicos Farmacêuticos</span>
            <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(56, 189, 248, 0.2); display: flex; align-items: center; justify-content: center; color: #38bdf8;">
              <i class="fa-solid fa-stethoscope"></i>
            </div>
          </div>
          <div style="font-size: 1.65rem; font-weight: 800; color: #ffffff; font-family: 'Outfit', sans-serif;">
            ${formatCurrency(metrics.clinicalRevenue)}
          </div>
          <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 4px;">
            Consultas, Vacinas &amp; Testes TLR (${metrics.clinicalPercent}% do total)
          </div>
        </div>

        <!-- Despesas Totais -->
        <div class="pharmacy-glass-card" style="padding: 18px 20px; border-radius: 16px; border: 1.5px solid rgba(244, 63, 94, 0.4); background: linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(15, 23, 42, 0.85)); box-shadow: 0 0 20px rgba(244, 63, 94, 0.15);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; color: #fb7185; letter-spacing: 0.5px;">Despesas &amp; Compras</span>
            <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(244, 63, 94, 0.2); display: flex; align-items: center; justify-content: center; color: #fb7185;">
              <i class="fa-solid fa-arrow-trend-down"></i>
            </div>
          </div>
          <div style="font-size: 1.65rem; font-weight: 800; color: #ffffff; font-family: 'Outfit', sans-serif;">
            ${formatCurrency(metrics.totalExpenses)}
          </div>
          <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 4px;">
            Distribuidoras, insumos &amp; operacionais
          </div>
        </div>

        <!-- Lucro Líquido -->
        <div class="pharmacy-glass-card" style="padding: 18px 20px; border-radius: 16px; border: 1.5px solid ${metrics.netProfit >= 0 ? 'rgba(52, 211, 153, 0.5)' : 'rgba(239, 68, 68, 0.5)'}; background: linear-gradient(135deg, ${metrics.netProfit >= 0 ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)'}, rgba(15, 23, 42, 0.9));">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; color: ${metrics.netProfit >= 0 ? '#34d399' : '#f87171'}; letter-spacing: 0.5px;">Resultado Líquido (DRE)</span>
            <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(255, 255, 255, 0.08); display: flex; align-items: center; justify-content: center; color: ${metrics.netProfit >= 0 ? '#34d399' : '#f87171'};">
              <i class="fa-solid ${metrics.netProfit >= 0 ? 'fa-wallet' : 'fa-triangle-exclamation'}"></i>
            </div>
          </div>
          <div style="font-size: 1.65rem; font-weight: 800; color: ${metrics.netProfit >= 0 ? '#34d399' : '#f87171'}; font-family: 'Outfit', sans-serif;">
            ${formatCurrency(metrics.netProfit)}
          </div>
          <div style="font-size: 0.76rem; color: #cbd5e1; margin-top: 4px;">
            Margem Operacional: <strong style="color: #fff;">${metrics.profitMargin}%</strong>
          </div>
        </div>

      </div>

      <!-- BARRA DE NAVEGAÇÃO POR ABAS NEON (TODOS / RECEITAS / DESPESAS) & CONTROLES -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 14px; margin-bottom: -1px; position: relative; z-index: 10;">
        
        <!-- ABAS PRINCIPAIS COM IDENTIDADE NEON DE ALTO DESTAQUE -->
        <div style="display: flex; gap: 6px; align-items: flex-end;">
          
          <!-- Aba 1: Todos os Lançamentos -->
          <button class="fin-filter-type-btn ${currentFilterType === 'todos' ? 'active' : ''}" data-type="todos" style="
            position: relative;
            padding: 12px 24px;
            border-radius: 14px 14px 0 0;
            font-size: 0.88rem;
            font-weight: 700;
            font-family: 'Outfit', sans-serif;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            transition: all 0.25s ease;
            ${currentFilterType === 'todos' ? `
              background: linear-gradient(180deg, rgba(56, 189, 248, 0.28) 0%, rgba(15, 23, 42, 0.98) 100%);
              color: #38bdf8;
              border: 1.5px solid #38bdf8;
              border-bottom: 2px solid #0f172a;
              box-shadow: 0 -6px 20px rgba(56, 189, 248, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.3);
            ` : `
              background: rgba(30, 41, 59, 0.5);
              color: #94a3b8;
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-bottom: none;
            `}
          ">
            <i class="fa-solid fa-layer-group" style="color: ${currentFilterType === 'todos' ? '#38bdf8' : '#64748b'}; font-size: 0.95rem;"></i>
            <span>Todos os Lançamentos</span>
            <span style="
              font-size: 0.72rem;
              padding: 2px 8px;
              border-radius: 12px;
              font-weight: 800;
              ${currentFilterType === 'todos' ? `
                background: rgba(56, 189, 248, 0.3);
                color: #ffffff;
                border: 1px solid #38bdf8;
                box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
              ` : `
                background: rgba(255, 255, 255, 0.06);
                color: #94a3b8;
              `}
            ">${allTransactions.length}</span>
          </button>

          <!-- Aba 2: Receitas & Faturamento -->
          <button class="fin-filter-type-btn ${currentFilterType === 'receita' ? 'active' : ''}" data-type="receita" style="
            position: relative;
            padding: 12px 24px;
            border-radius: 14px 14px 0 0;
            font-size: 0.88rem;
            font-weight: 700;
            font-family: 'Outfit', sans-serif;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            transition: all 0.25s ease;
            ${currentFilterType === 'receita' ? `
              background: linear-gradient(180deg, rgba(16, 185, 129, 0.28) 0%, rgba(15, 23, 42, 0.98) 100%);
              color: #34d399;
              border: 1.5px solid #10b981;
              border-bottom: 2px solid #0f172a;
              box-shadow: 0 -6px 20px rgba(16, 185, 129, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.3);
            ` : `
              background: rgba(30, 41, 59, 0.5);
              color: #94a3b8;
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-bottom: none;
            `}
          ">
            <i class="fa-solid fa-arrow-down-long" style="color: ${currentFilterType === 'receita' ? '#34d399' : '#10b981'}; font-size: 0.95rem;"></i>
            <span>Receitas &amp; Faturamento</span>
            <span style="
              font-size: 0.72rem;
              padding: 2px 8px;
              border-radius: 12px;
              font-weight: 800;
              ${currentFilterType === 'receita' ? `
                background: rgba(16, 185, 129, 0.35);
                color: #ffffff;
                border: 1px solid #10b981;
                box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
              ` : `
                background: rgba(255, 255, 255, 0.06);
                color: #94a3b8;
              `}
            ">${allTransactions.filter(t => t.type === 'receita').length}</span>
          </button>

          <!-- Aba 3: Despesas & Compras -->
          <button class="fin-filter-type-btn ${currentFilterType === 'despesa' ? 'active' : ''}" data-type="despesa" style="
            position: relative;
            padding: 12px 24px;
            border-radius: 14px 14px 0 0;
            font-size: 0.88rem;
            font-weight: 700;
            font-family: 'Outfit', sans-serif;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            transition: all 0.25s ease;
            ${currentFilterType === 'despesa' ? `
              background: linear-gradient(180deg, rgba(244, 63, 94, 0.28) 0%, rgba(15, 23, 42, 0.98) 100%);
              color: #fb7185;
              border: 1.5px solid #f43f5e;
              border-bottom: 2px solid #0f172a;
              box-shadow: 0 -6px 20px rgba(244, 63, 94, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.3);
            ` : `
              background: rgba(30, 41, 59, 0.5);
              color: #94a3b8;
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-bottom: none;
            `}
          ">
            <i class="fa-solid fa-arrow-up-long" style="color: ${currentFilterType === 'despesa' ? '#fb7185' : '#f43f5e'}; font-size: 0.95rem;"></i>
            <span>Despesas &amp; Compras</span>
            <span style="
              font-size: 0.72rem;
              padding: 2px 8px;
              border-radius: 12px;
              font-weight: 800;
              ${currentFilterType === 'despesa' ? `
                background: rgba(244, 63, 94, 0.35);
                color: #ffffff;
                border: 1px solid #f43f5e;
                box-shadow: 0 0 10px rgba(244, 63, 94, 0.4);
              ` : `
                background: rgba(255, 255, 255, 0.06);
                color: #94a3b8;
              `}
            ">${allTransactions.filter(t => t.type === 'despesa').length}</span>
          </button>

        </div>

        <!-- Filtros de Período e Campo de Busca -->
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 6px;">
          <select id="fin-period-select" class="form-input" style="height: 38px; font-size: 0.82rem; padding: 0 12px; background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 8px;">
            <option value="mes" ${currentFilterPeriod === 'mes' ? 'selected' : ''}>Mês Atual</option>
            <option value="7dias" ${currentFilterPeriod === '7dias' ? 'selected' : ''}>Últimos 7 Dias</option>
            <option value="hoje" ${currentFilterPeriod === 'hoje' ? 'selected' : ''}>Hoje</option>
            <option value="ano" ${currentFilterPeriod === 'ano' ? 'selected' : ''}>Ano Vigente</option>
            <option value="todos" ${currentFilterPeriod === 'todos' ? 'selected' : ''}>Todo o Histórico</option>
          </select>

          <div style="position: relative; width: 220px;">
            <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 12px; top: 11px; color: #64748b; font-size: 0.85rem;"></i>
            <input type="text" id="fin-search-input" class="form-input" placeholder="Buscar lançamento..." value="${currentSearchTerm}" style="padding-left: 34px; height: 38px; font-size: 0.84rem; border-radius: 8px; width: 100%;">
          </div>
        </div>

      </div>

      <!-- TABELA DE LANÇAMENTOS FINANCEIROS (INTEGRADA COM AS ABAS) -->
      <div style="background: rgba(15, 23, 42, 0.9); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 0 16px 16px 16px; overflow: hidden; box-shadow: 0 12px 35px rgba(0,0,0,0.45);">
        
        <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.05rem; color: #f8fafc; font-weight: 700; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-list-check" style="color: #38bdf8;"></i> Extrato de Movimentações Financeiras
          </h3>
          <span style="font-size: 0.78rem; color: #94a3b8;">${filtered.length} registro(s) listado(s)</span>
        </div>

        <div style="overflow-x: auto;">
          <table class="data-table" style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: rgba(30, 41, 59, 0.6); color: #94a3b8; font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.5px;">
                <th style="padding: 12px 18px;">Data / Hora</th>
                <th style="padding: 12px 18px;">Tipo</th>
                <th style="padding: 12px 18px;">Descrição / Origem</th>
                <th style="padding: 12px 18px;">Categoria Farmacêutica</th>
                <th style="padding: 12px 18px;">Forma de Pgto</th>
                <th style="padding: 12px 18px;">Valor</th>
                <th style="padding: 12px 18px;">Status</th>
                <th style="padding: 12px 18px; text-align: center;">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="8" style="padding: 50px 20px; text-align: center; color: #94a3b8; font-size: 0.88rem;">
                    <i class="fa-solid fa-receipt" style="font-size: 2.5rem; color: #475569; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
                    <div style="font-weight: 700; color: #cbd5e1; font-size: 1rem;">Nenhum lançamento financeiro encontrado</div>
                    <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">Nenhum registro para os filtros selecionados ou base limpa.</div>
                    <button type="button" onclick="window.openNewTransactionModal()" class="btn btn-sm" style="margin-top: 14px; background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: 1px solid #34d399; font-weight: 700; padding: 7px 18px; border-radius: 8px; cursor: pointer;">
                      + Criar Primeiro Lançamento
                    </button>
                  </td>
                </tr>
              ` : filtered.map(t => {
                const isRec = t.type === 'receita';
                const dateStr = t.date ? new Date(t.date).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
                const isPaid = t.status === 'pago' || t.status === 'recebido' || t.status === 'Liquidado';
                const isSim = t.isSimulation;

                return `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s;" onmouseenter="this.style.background='rgba(255,255,255,0.03)'" onmouseleave="this.style.background='transparent'">
                    <td style="padding: 12px 18px; font-size: 0.82rem; color: #cbd5e1;">${dateStr}</td>
                    <td style="padding: 12px 18px;">
                      <span style="font-size: 0.72rem; font-weight: 800; padding: 3px 8px; border-radius: 12px; display: inline-flex; align-items: center; gap: 4px; background: ${isRec ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)'}; color: ${isRec ? '#34d399' : '#fb7185'}; border: 1px solid ${isRec ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'};">
                        <i class="fa-solid ${isRec ? 'fa-arrow-down' : 'fa-arrow-up'}"></i> ${isRec ? 'Receita' : 'Despesa'}
                      </span>
                      ${isSim ? `<span style="font-size: 0.65rem; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 1px 5px; border-radius: 8px; margin-left: 4px;">SIMULADO</span>` : ''}
                    </td>
                    <td style="padding: 12px 18px; font-weight: 600; color: #f8fafc; font-size: 0.86rem;">
                      ${t.description || 'Sem descrição'}
                      ${t.clientOrSupplier ? `<div style="font-size: 0.74rem; color: #94a3b8; font-weight: normal;">Ref: ${t.clientOrSupplier}</div>` : ''}
                    </td>
                    <td style="padding: 12px 18px; font-size: 0.82rem; color: #cbd5e1;">
                      <span style="background: rgba(255,255,255,0.06); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08);">
                        ${t.category || 'Geral'}
                      </span>
                    </td>
                    <td style="padding: 12px 18px; font-size: 0.82rem; color: #94a3b8;">
                      ${t.paymentMethod || 'PIX'}
                    </td>
                    <td style="padding: 12px 18px; font-weight: 800; font-size: 0.95rem; color: ${isRec ? '#34d399' : '#fb7185'}; font-family: 'Outfit', sans-serif;">
                      ${isRec ? '+' : '-'} ${formatCurrency(t.amount)}
                    </td>
                    <td style="padding: 12px 18px;">
                      <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 10px; background: ${isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'}; color: ${isPaid ? '#34d399' : '#fbbf24'}; border: 1px solid ${isPaid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'};">
                        ${isPaid ? '✓ Liquidado' : '⏳ Pendente'}
                      </span>
                    </td>
                    <td style="padding: 12px 18px; text-align: center;">
                      <div style="display: flex; gap: 6px; justify-content: center;">
                        ${!isPaid ? `
                          <button onclick="window.markTransactionAsPaid('${t.id}')" title="Marcar como Pago/Recebido" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; padding: 5px 8px; border-radius: 6px; cursor: pointer; font-size: 0.75rem;">
                            <i class="fa-solid fa-check"></i>
                          </button>
                        ` : ''}
                        <button onclick="window.deleteFinancialTransaction('${t.id}')" title="Excluir Lançamento" style="background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.3); color: #fb7185; padding: 5px 8px; border-radius: 6px; cursor: pointer; font-size: 0.75rem;">
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  `;

  setupFinancialListeners(contentArea);
}

function setupFinancialListeners(container) {
  // Filtros de Tipo (Abas Neon)
  container.querySelectorAll('.fin-filter-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilterType = btn.getAttribute('data-type');
      renderFinancialTab(container);
    });
  });

  // Filtro de Período
  const periodSel = container.querySelector('#fin-period-select');
  periodSel?.addEventListener('change', (e) => {
    currentFilterPeriod = e.target.value;
    renderFinancialTab(container);
  });

  // Busca
  const searchInput = container.querySelector('#fin-search-input');
  searchInput?.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value;
    renderFinancialTab(container);
  });

  // Botão Novo Lançamento
  container.querySelector('#btn-new-transaction')?.addEventListener('click', () => {
    openNewTransactionModal();
  });

  // Botão Exportar PDF
  container.querySelector('#btn-export-financial-pdf')?.addEventListener('click', () => {
    exportFinancialDRE_PDF();
  });
}

// ─── HELPERS E BANCO DE DADOS FINANCEIRO ───

export function getFinancialTransactions() {
  return localDB.list('financial_transactions') || [];
}

function filterTransactions(list) {
  let result = [...list];

  // Filtro por Tipo
  if (currentFilterType !== 'todos') {
    result = result.filter(t => t.type === currentFilterType);
  }

  // Filtro por Período
  const now = new Date();
  if (currentFilterPeriod === 'hoje') {
    const todayStr = now.toISOString().slice(0, 10);
    result = result.filter(t => t.date && t.date.slice(0, 10) === todayStr);
  } else if (currentFilterPeriod === '7dias') {
    const cutoff = new Date(Date.now() - 7 * 86400000);
    result = result.filter(t => new Date(t.date) >= cutoff);
  } else if (currentFilterPeriod === 'mes') {
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    result = result.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    });
  } else if (currentFilterPeriod === 'ano') {
    const curYear = now.getFullYear();
    result = result.filter(t => new Date(t.date).getFullYear() === curYear);
  }

  // Busca textual
  if (currentSearchTerm.trim()) {
    const term = currentSearchTerm.toLowerCase();
    result = result.filter(t => 
      (t.description && t.description.toLowerCase().includes(term)) ||
      (t.category && t.category.toLowerCase().includes(term)) ||
      (t.clientOrSupplier && t.clientOrSupplier.toLowerCase().includes(term))
    );
  }

  // Ordenar por data decrescente
  return result.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function calculateFinancialMetrics(list) {
  let totalRevenue = 0;
  let clinicalRevenue = 0;
  let revenueCount = 0;
  let totalExpenses = 0;

  list.forEach(t => {
    const val = Number(t.amount) || 0;
    if (t.type === 'receita') {
      totalRevenue += val;
      revenueCount++;
      if (t.category && (
        t.category.includes('Consulta') || 
        t.category.includes('Injetáveis') || 
        t.category.includes('Vacina') || 
        t.category.includes('TLR') || 
        t.category.includes('Teste') || 
        t.category.includes('Pressão') || 
        t.category.includes('Serviço')
      )) {
        clinicalRevenue += val;
      }
    } else if (t.type === 'despesa') {
      totalExpenses += val;
    }
  });

  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';
  const clinicalPercent = totalRevenue > 0 ? ((clinicalRevenue / totalRevenue) * 100).toFixed(1) : '0.0';

  return {
    totalRevenue,
    clinicalRevenue,
    revenueCount,
    clinicalPercent,
    totalExpenses,
    netProfit,
    profitMargin
  };
}

function formatCurrency(val) {
  return (Number(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── MODAL DE NOVO LANÇAMENTO FINANCEIRO ───

export function openNewTransactionModal() {
  const modalHtml = `
    <div id="modal-new-transaction-overlay" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10050; padding: 20px; animation: fadeIn 0.2s ease;">
      <div style="background: linear-gradient(145deg, #1e293b, #0f172a); border: 1px solid #10b981; border-radius: 18px; max-width: 540px; width: 100%; box-shadow: 0 0 35px rgba(16, 185, 129, 0.25); overflow: hidden;">
        
        <div style="padding: 18px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.2);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(16, 185, 129, 0.2); display: flex; align-items: center; justify-content: center; color: #34d399; font-size: 1.1rem;">
              <i class="fa-solid fa-plus"></i>
            </div>
            <h3 style="color: #f8fafc; font-family: 'Outfit', sans-serif; font-size: 1.15rem; margin: 0;">Novo Lançamento Financeiro</h3>
          </div>
          <button type="button" id="btn-close-fin-modal" style="background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer;">✕</button>
        </div>

        <form id="form-new-fin-transaction" style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
          
          <!-- Tipo: Receita ou Despesa -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <label style="cursor: pointer; padding: 12px; border-radius: 10px; border: 1.5px solid #10b981; background: rgba(16, 185, 129, 0.15); display: flex; align-items: center; gap: 8px; color: #34d399; font-weight: 700; font-size: 0.88rem;">
              <input type="radio" name="trans-type" value="receita" checked style="accent-color: #10b981;">
              <i class="fa-solid fa-arrow-down"></i> Receita (Entrada)
            </label>

            <label style="cursor: pointer; padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.03); display: flex; align-items: center; gap: 8px; color: #cbd5e1; font-weight: 700; font-size: 0.88rem;">
              <input type="radio" name="trans-type" value="despesa" style="accent-color: #f43f5e;">
              <i class="fa-solid fa-arrow-up" style="color: #fb7185;"></i> Despesa (Saída)
            </label>
          </div>

          <!-- Descrição -->
          <div>
            <label style="display: block; font-size: 0.82rem; color: #cbd5e1; margin-bottom: 6px; font-weight: 600;">Descrição do Lançamento *</label>
            <input type="text" id="fin-desc" class="form-input" placeholder="Ex.: Consulta Farmacêutica de Triagem, Compra de Medicamentos..." required style="width: 100%; height: 40px;">
          </div>

          <!-- Categoria e Valor -->
          <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 14px;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label style="font-size: 0.82rem; color: #cbd5e1; font-weight: 600;">Categoria Farmacêutica *</label>
                <button type="button" id="btn-quick-plus-category" title="Cadastrar Nova Categoria" style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.45); color: #34d399; font-size: 0.74rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;">
                  <i class="fa-solid fa-plus"></i> Nova
                </button>
              </div>
              <div style="display: flex; gap: 6px;">
                <select id="fin-category" class="form-input" style="flex: 1; height: 42px; font-size: 0.88rem; line-height: 1.4; padding: 6px 10px; background: rgba(30, 41, 59, 0.95); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 8px;" required>
                  <optgroup label="── Receitas Clínicas &amp; Balcão ──">
                    ${getFinancialCategories('receita').map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                  </optgroup>
                  <optgroup label="── Despesas Operacionais &amp; Compras ──">
                    ${getFinancialCategories('despesa').map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                  </optgroup>
                </select>
                <button type="button" id="btn-plus-icon-category" title="Adicionar Categoria" style="width: 42px; height: 42px; border-radius: 8px; background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <i class="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>

            <div>
              <div style="margin-bottom: 6px;">
                <label style="font-size: 0.82rem; color: #cbd5e1; font-weight: 600;">Valor (R$) *</label>
              </div>
              <input type="number" id="fin-amount" class="form-input" step="0.01" min="0.01" placeholder="0,00" required style="width: 100%; height: 42px; font-weight: 700; font-size: 1.1rem; color: #34d399; background: rgba(30, 41, 59, 0.95); border: 1px solid rgba(255,255,255,0.15); padding: 0 12px; border-radius: 8px;">
            </div>
          </div>

          <!-- Forma de Pagamento e Cliente/Fornecedor -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label style="font-size: 0.82rem; color: #cbd5e1; font-weight: 600;">Forma de Pagamento</label>
                <button type="button" id="btn-quick-plus-payment" title="Cadastrar Nova Forma de Pagamento" style="background: rgba(56, 189, 248, 0.2); border: 1px solid rgba(56, 189, 248, 0.45); color: #38bdf8; font-size: 0.74rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;">
                  <i class="fa-solid fa-plus"></i> Nova
                </button>
              </div>
              <div style="display: flex; gap: 6px;">
                <select id="fin-payment-method" class="form-input" style="flex: 1; height: 42px; font-size: 0.88rem; line-height: 1.4; padding: 6px 10px; background: rgba(30, 41, 59, 0.95); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 8px;">
                  ${getPaymentMethods().map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
                </select>
                <button type="button" id="btn-plus-icon-payment" title="Adicionar Forma de Pagamento" style="width: 42px; height: 42px; border-radius: 8px; background: rgba(56, 189, 248, 0.2); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <i class="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>

            <div>
              <div style="margin-bottom: 6px;">
                <label style="font-size: 0.82rem; color: #cbd5e1; font-weight: 600;">Cliente ou Fornecedor</label>
              </div>
              <input type="text" id="fin-client-supplier" class="form-input" placeholder="Nome do cliente ou distribuidora..." style="width: 100%; height: 42px; font-size: 0.88rem; background: rgba(30, 41, 59, 0.95); border: 1px solid rgba(255,255,255,0.15); padding: 0 12px; border-radius: 8px;">
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08);">
            <button type="button" id="btn-cancel-fin" class="btn btn-secondary" style="padding: 10px 18px;">Cancelar</button>
            <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, #10b981, #059669); border: none; font-weight: 700; padding: 10px 24px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">
              <i class="fa-solid fa-check"></i> Salvar Lançamento
            </button>
          </div>

        </form>
      </div>
    </div>
  `;

  const existing = document.getElementById('modal-new-transaction-overlay');
  if (existing) existing.remove();

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const overlay = document.getElementById('modal-new-transaction-overlay');
  const close = () => overlay?.remove();

  document.getElementById('btn-close-fin-modal')?.addEventListener('click', close);
  document.getElementById('btn-cancel-fin')?.addEventListener('click', close);

  // Ação dos botões + de Adicionar Nova Categoria
  const handleAddNewCategory = () => {
    const selectedType = overlay.querySelector('input[name="trans-type"]:checked')?.value || 'receita';
    const typeLabel = selectedType === 'receita' ? 'Receita' : 'Despesa';
    const newCat = prompt(`Digite o nome da nova Categoria de ${typeLabel}:`);
    if (!newCat || !newCat.trim()) return;
    const cleanCat = newCat.trim();
    
    // Cadastra via módulo centralizado
    addFinancialCategory(cleanCat, selectedType, false);

    const selectEl = document.getElementById('fin-category');
    if (selectEl) {
      // Re-popula para ter a lista 100% atualizada
      selectEl.innerHTML = `
        <optgroup label="── Receitas Clínicas &amp; Balcão ──">
          ${getFinancialCategories('receita').map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
        </optgroup>
        <optgroup label="── Despesas Operacionais &amp; Compras ──">
          ${getFinancialCategories('despesa').map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
        </optgroup>
      `;
      selectEl.value = cleanCat;
    }
    showToast(`✅ Categoria de ${typeLabel} "${cleanCat}" adicionada e sincronizada com Configurações!`);
  };

  document.getElementById('btn-quick-plus-category')?.addEventListener('click', handleAddNewCategory);
  document.getElementById('btn-plus-icon-category')?.addEventListener('click', handleAddNewCategory);

  // Ação dos botões + de Adicionar Nova Forma de Pagamento
  const handleAddNewPayment = () => {
    const newPay = prompt('Digite a nova Forma de Pagamento (Ex.: Cheque, Crediário, Convênio Local):');
    if (!newPay || !newPay.trim()) return;
    const cleanPay = newPay.trim();
    
    // Cadastra via módulo centralizado
    addPaymentMethod(cleanPay, false);

    const selectEl = document.getElementById('fin-payment-method');
    if (selectEl) {
      selectEl.innerHTML = getPaymentMethods().map(p => `<option value="${p.name}">${p.name}</option>`).join('');
      selectEl.value = cleanPay;
    }
    showToast(`✅ Forma de pagamento "${cleanPay}" adicionada e sincronizada com Configurações!`);
  };

  document.getElementById('btn-quick-plus-payment')?.addEventListener('click', handleAddNewPayment);
  document.getElementById('btn-plus-icon-payment')?.addEventListener('click', handleAddNewPayment);

  // Toggle visual radio buttons
  const radios = overlay.querySelectorAll('input[name="trans-type"]');
  radios.forEach(r => {
    r.addEventListener('change', () => {
      radios.forEach(other => {
        const lbl = other.closest('label');
        if (other.checked) {
          if (other.value === 'receita') {
            lbl.style.borderColor = '#10b981';
            lbl.style.background = 'rgba(16, 185, 129, 0.15)';
            lbl.style.color = '#34d399';
          } else {
            lbl.style.borderColor = '#f43f5e';
            lbl.style.background = 'rgba(244, 63, 94, 0.15)';
            lbl.style.color = '#fb7185';
          }
        } else {
          lbl.style.borderColor = 'rgba(255,255,255,0.12)';
          lbl.style.background = 'rgba(255,255,255,0.03)';
          lbl.style.color = '#cbd5e1';
        }
      });
    });
  });

  document.getElementById('form-new-fin-transaction')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = overlay.querySelector('input[name="trans-type"]:checked')?.value || 'receita';
    const description = document.getElementById('fin-desc').value.trim();
    const category = document.getElementById('fin-category').value;
    const amount = Number(document.getElementById('fin-amount').value || 0);
    const paymentMethod = document.getElementById('fin-payment-method').value;
    const clientOrSupplier = document.getElementById('fin-client-supplier').value.trim();

    if (!description || amount <= 0) {
      showToast('⚠️ Preencha a descrição e um valor válido.');
      return;
    }

    const newRecord = {
      id: 'FIN-' + Date.now().toString().slice(-6),
      type,
      category,
      description,
      clientOrSupplier,
      amount,
      paymentMethod,
      date: new Date().toISOString(),
      status: 'recebido',
      isSimulation: false // Cadastro real
    };

    localDB.insert('financial_transactions', newRecord);
    close();
    showToast(`✅ ${type === 'receita' ? 'Receita' : 'Despesa'} de ${formatCurrency(amount)} lançada com sucesso!`);
    renderFinancialTab();
  });
}

window.openNewTransactionModal = openNewTransactionModal;

window.markTransactionAsPaid = function(id) {
  const list = localDB.list('financial_transactions') || [];
  const found = list.find(t => t.id === id);
  if (found) {
    found.status = 'recebido';
    localDB.update('financial_transactions', id, found);
    showToast('✅ Lançamento marcado como liquidado!');
    renderFinancialTab();
  }
};

window.deleteFinancialTransaction = function(id) {
  if (confirm('Deseja realmente remover este lançamento financeiro?')) {
    localDB.remove('financial_transactions', id);
    showToast('Lançamento removido.');
    renderFinancialTab();
  }
};

// ─── EXPORTAÇÃO DE RELATÓRIO DRE EM PDF ───

export async function exportFinancialDRE_PDF() {
  if (!window.jspdf) {
    showToast('⚠️ jsPDF não carregado.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const transactions = getFinancialTransactions();
  const metrics = calculateFinancialMetrics(transactions);
  const now = new Date().toLocaleString('pt-BR');

  // Cabeçalho
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 30, 210, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CRM CLÍNICO FARMACÊUTICO', 14, 11);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('DEMONSTRATIVO DE RESULTADO DO EXERCÍCIO (DRE) & FLUXO DE CAIXA', 14, 17);
  doc.text('Serviços Clínicos Farmacêuticos (RDC 786) & Venda de MIPs', 14, 23);

  doc.setFontSize(7.5);
  doc.text(`Emissão: ${now}`, 196, 11, { align: 'right' });
  doc.text('Responsável: Dr. Marcelo Mazaro (CRF-SP 54180)', 196, 17, { align: 'right' });

  let currentY = 38;

  // Quadro de Resumo
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, currentY, 186, 26, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, currentY, 186, 26, 2, 2, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('RESUMO GERENCIAL DO FLUXO DE CAIXA', 16, currentY + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Receita Total: ${formatCurrency(metrics.totalRevenue)}`, 16, currentY + 13);
  doc.text(`Serviços Clínicos: ${formatCurrency(metrics.clinicalRevenue)} (${metrics.clinicalPercent}%)`, 16, currentY + 19);

  doc.text(`Despesas Totais: ${formatCurrency(metrics.totalExpenses)}`, 85, currentY + 13);
  doc.text(`Lançamentos: ${transactions.length} registros`, 85, currentY + 19);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(metrics.netProfit >= 0 ? 22 : 220, metrics.netProfit >= 0 ? 101 : 38, metrics.netProfit >= 0 ? 52 : 38);
  doc.text(`Resultado Líquido: ${formatCurrency(metrics.netProfit)}`, 145, currentY + 13);
  doc.text(`Margem Operacional: ${metrics.profitMargin}%`, 145, currentY + 19);

  currentY += 32;

  // Tabela de Lançamentos
  const tableRows = transactions.map(t => [
    t.date ? new Date(t.date).toLocaleDateString('pt-BR') : '-',
    t.type === 'receita' ? 'RECEITA' : 'DESPESA',
    t.description || '-',
    t.category || '-',
    t.paymentMethod || '-',
    `${t.type === 'receita' ? '+' : '-'} ${formatCurrency(t.amount)}`,
    t.status === 'pago' || t.status === 'recebido' ? 'LIQUIDADO' : 'PENDENTE'
  ]);

  doc.autoTable({
    startY: currentY,
    head: [['Data', 'Tipo', 'Descrição', 'Categoria', 'Forma Pgto', 'Valor', 'Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 7.8, fontStyle: 'bold', cellPadding: 2.8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 7.2, cellPadding: 2.4, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.15 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 20, fontStyle: 'bold' },
      2: { cellWidth: 48 },
      3: { cellWidth: 38 },
      4: { cellWidth: 22 },
      5: { cellWidth: 24, fontStyle: 'bold' },
      6: { cellWidth: 20, halign: 'center' }
    },
    margin: { left: 12, right: 12 }
  });

  doc.save(`dre_fluxo_caixa_farmacia_${new Date().toISOString().slice(0, 10)}.pdf`);
  showToast('📄 Relatório DRE em PDF exportado com sucesso!');
}

window.renderFinancialTab = renderFinancialTab;
