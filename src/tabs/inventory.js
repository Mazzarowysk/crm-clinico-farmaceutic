// src/tabs/inventory.js
// MÓDULO DE CONTROLE DE ESTOQUE FARMACÊUTICO, CATÁLOGO DE PRODUTOS & DISPENSAÇÃO (v3.0)

import * as localDB from '../localDB.js';
import { state } from '../state.js';
import { showToast, showCustomAlert, showCustomConfirm } from '../modules/ui.js';
import { syncManager } from '../modules/sync.js';

export function renderInventoryTab(contentArea) {
  const currentUser = state.user || {};

  contentArea.innerHTML = `
    <div class="tab-section active" style="padding: 20px; max-width: 1300px; margin: 0 auto;">
      
      <!-- Cabeçalho da Aba Estoque -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.45rem; font-weight: 700; color: #fff; margin: 0 0 4px; display: flex; align-items: center; gap: 10px;">
            <i class="fa-solid fa-boxes-stacked" style="color: #10b981;"></i> Controle de Estoque &amp; Catálogo Farmacêutico
          </h2>
          <p style="font-size: 0.85rem; color: #94a3b8; margin: 0;">
            Gestão de saldos físicos, entradas por lote/validade (FEFO), dispensação integrada ao balcão e prevenção de perdas.
          </p>
        </div>

        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <button id="btn-quick-new-product" class="btn" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 9px 18px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">
            <i class="fa-solid fa-plus"></i> Novo Produto
          </button>
          <button id="btn-quick-stock-entry" class="btn" style="background: linear-gradient(135deg, #0d9488, #0f766e); color: #fff; border: none; padding: 9px 18px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.35);">
            <i class="fa-solid fa-box-open"></i> Dar Entrada de Lote
          </button>
        </div>
      </div>

      <!-- CARDS DE KPIS DO ESTOQUE -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 22px;">
        <div class="pharmacy-kpi-card" style="background: rgba(30, 41, 59, 0.45); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 16px;">
          <div style="font-size: 0.74rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Catálogo de Itens</div>
          <div id="kpi-stock-products-count" style="font-size: 1.6rem; font-weight: 800; color: #fff; margin-top: 4px;">--</div>
          <small style="color: #10b981; font-size: 0.72rem;"><i class="fa-solid fa-pills"></i> Produtos cadastrados</small>
        </div>

        <div class="pharmacy-kpi-card" style="background: rgba(30, 41, 59, 0.45); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 16px;">
          <div style="font-size: 0.74rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Saldo Físico Total</div>
          <div id="kpi-stock-units-count" style="font-size: 1.6rem; font-weight: 800; color: #38bdf8; margin-top: 4px;">--</div>
          <small style="color: #38bdf8; font-size: 0.72rem;"><i class="fa-solid fa-boxes-packing"></i> Unidades disponíveis</small>
        </div>

        <div class="pharmacy-kpi-card" style="background: rgba(30, 41, 59, 0.45); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 16px;">
          <div style="font-size: 0.74rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Valor em Estoque</div>
          <div id="kpi-stock-value-sale" style="font-size: 1.45rem; font-weight: 800; color: #34d399; margin-top: 4px;">R$ --</div>
          <small id="kpi-stock-value-cost" style="color: #94a3b8; font-size: 0.72rem;">Custo: R$ --</small>
        </div>

        <div class="pharmacy-kpi-card" style="background: rgba(30, 41, 59, 0.45); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 16px;">
          <div style="font-size: 0.74rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Alertas Críticos</div>
          <div id="kpi-stock-alerts" style="font-size: 1.45rem; font-weight: 800; color: #fbbf24; margin-top: 4px;">--</div>
          <small id="kpi-stock-alerts-sub" style="color: #fbbf24; font-size: 0.72rem;"><i class="fa-solid fa-triangle-exclamation"></i> Estoque baixo / Validade</small>
        </div>
      </div>

      <!-- Barra de Controle dos Agrupamentos em Acordeão -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(255,255,255,0.08); padding: 12px 18px; border-radius: 14px; backdrop-filter: blur(12px);">
        <div style="display: flex; align-items: center; gap: 10px; color: #94a3b8; font-size: 0.84rem;">
          <i class="fa-solid fa-layer-group" style="color: #10b981; font-size: 1rem;"></i>
          <span>Gestão Operacional &bull; <strong>4 Agrupamentos de Estoque</strong></span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="btn-inv-expand-all" class="btn" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); color: #34d399; font-size: 0.78rem; font-weight: 700; padding: 7px 14px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-angles-down"></i> Expandir Todos
          </button>
          <button id="btn-inv-collapse-all" class="btn" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); color: #94a3b8; font-size: 0.78rem; font-weight: 700; padding: 7px 14px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-angles-up"></i> Recolher Todos
          </button>
        </div>
      </div>

      <!-- CONTAINER DOS AGRUPAMENTOS EXPANSÍVEIS E RETRÁTEIS -->
      <div class="cfg-accordion-container" style="display: flex; flex-direction: column; gap: 18px;">

        <!-- ==================================================================== -->
        <!-- AGRUPAMENTO 1: CATÁLOGO & SALDO DE PRODUTOS                         -->
        <!-- ==================================================================== -->
        <div class="cfg-accordion-card open" id="accordion-group-catalog" style="background: rgba(15, 23, 42, 0.75); border: 1.5px solid rgba(16, 185, 129, 0.35); border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.35); transition: all 0.3s ease;">
          <div class="cfg-accordion-header" data-target="body-catalog" style="padding: 16px 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.6)); border-bottom: 1px solid rgba(16, 185, 129, 0.25); user-select: none;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.45)); border: 1.5px solid rgba(52, 211, 153, 0.6); display: flex; align-items: center; justify-content: center; color: #34d399; font-size: 1.3rem; box-shadow: 0 0 18px rgba(16, 185, 129, 0.25);">
                <i class="fa-solid fa-boxes-stacked"></i>
              </div>
              <div>
                <div style="font-family: 'Outfit', sans-serif; font-size: 1.12rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  Catálogo &amp; Saldo Físico de Produtos
                  <span id="badge-catalog-count" style="font-size: 0.72rem; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 2px 9px; border-radius: 12px; font-weight: 700;">
                    Carregando...
                  </span>
                </div>
                <p style="margin: 3px 0 0; font-size: 0.82rem; color: #94a3b8;">
                  Lista completa de medicamentos, MIPs, correlatos e suplementos com estoque em tempo real.
                </p>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="cfg-chevron-btn" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; color: #34d399; transition: transform 0.3s ease;">
                <i class="fa-solid fa-chevron-down cfg-chevron-icon"></i>
              </div>
            </div>
          </div>

          <div id="body-catalog" class="cfg-accordion-body" style="padding: 20px; display: block;">
            <!-- Filtros e Busca -->
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 18px;">
              <div style="position: relative; flex: 1; min-width: 260px;">
                <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 0.9rem;"></i>
                <input type="text" id="inv-search-input" class="form-input" placeholder="Buscar por nome do produto, DCI / princípio ativo ou código de barras EAN..." style="width: 100%; padding-left: 40px; background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; font-size: 0.88rem;">
              </div>

              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <select id="inv-category-filter" class="form-input" style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 0.84rem; padding: 8px 12px; border-radius: 8px;">
                  <option value="">Todas as Categorias</option>
                  <option value="MIP">MIPs / Isentos de Prescrição</option>
                  <option value="Uso Contínuo">Uso Contínuo (Hipertensão, Diabetes)</option>
                  <option value="Suplemento">Suplementos &amp; Vitaminas</option>
                  <option value="Correlatos">Correlatos / Diagnóstico Clínico</option>
                </select>

                <select id="inv-status-filter" class="form-input" style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 0.84rem; padding: 8px 12px; border-radius: 8px;">
                  <option value="">Todos os Status</option>
                  <option value="baixo">Estoque Baixo / Crítico</option>
                  <option value="vencimento">Vencimento Próximo</option>
                  <option value="normal">Estoque Normal</option>
                </select>
              </div>
            </div>

            <!-- Tabela de Produtos -->
            <div id="inv-products-table-container" style="overflow-x: auto;">
              <div style="text-align: center; padding: 30px; color: #94a3b8;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; color: #10b981; margin-bottom: 8px;"></i>
                <p>Carregando catálogo farmacêutico...</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================================================================== -->
        <!-- AGRUPAMENTO 2: ENTRADA DE MERCADORIAS & NOTAS                        -->
        <!-- ==================================================================== -->
        <div class="cfg-accordion-card" id="accordion-group-entry" style="background: rgba(15, 23, 42, 0.75); border: 1.5px solid rgba(56, 189, 248, 0.35); border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.35); transition: all 0.3s ease;">
          <div class="cfg-accordion-header" data-target="body-entry" style="padding: 16px 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, rgba(56, 189, 248, 0.15), rgba(15, 23, 42, 0.6)); border-bottom: 1px solid rgba(56, 189, 248, 0.25); user-select: none;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(2, 132, 199, 0.45)); border: 1.5px solid rgba(56, 189, 248, 0.6); display: flex; align-items: center; justify-content: center; color: #38bdf8; font-size: 1.3rem; box-shadow: 0 0 18px rgba(56, 189, 248, 0.25);">
                <i class="fa-solid fa-box-open"></i>
              </div>
              <div>
                <div style="font-family: 'Outfit', sans-serif; font-size: 1.12rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  Entrada de Mercadorias &amp; Gestão de Lotes
                  <span style="font-size: 0.72rem; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); padding: 2px 9px; border-radius: 12px; font-weight: 700;">
                    Rastreabilidade FEFO
                  </span>
                </div>
                <p style="margin: 3px 0 0; font-size: 0.82rem; color: #94a3b8;">
                  Registro de NF-e, recebimento de distribuidores, atualização de preço de custo e cadastro de lotes.
                </p>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="cfg-chevron-btn" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; color: #38bdf8; transition: transform 0.3s ease;">
                <i class="fa-solid fa-chevron-down cfg-chevron-icon"></i>
              </div>
            </div>
          </div>

          <div id="body-entry" class="cfg-accordion-body" style="padding: 20px; display: none;">
            <div style="background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 20px;">
              <form id="form-stock-entry" style="display: flex; flex-direction: column; gap: 16px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
                  <div class="form-group">
                    <label class="form-label" for="entry-product-id">* Selecionar Produto:</label>
                    <select id="entry-product-id" class="form-input" required style="background: #1e293b; color: #fff;">
                      <option value="">Selecione um produto do catálogo...</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="entry-supplier">Distribuidor / Fornecedor / NF-e:</label>
                    <input type="text" id="entry-supplier" class="form-input" placeholder="Ex: Santa Cruz Distribuidora - NF 84920">
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
                  <div class="form-group">
                    <label class="form-label" for="entry-quantity">* Quantidade Recebida (Un):</label>
                    <input type="number" id="entry-quantity" class="form-input" required min="1" placeholder="Ex: 50">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="entry-batch">* Número do Lote:</label>
                    <input type="text" id="entry-batch" class="form-input" required placeholder="Ex: L-24098">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="entry-expiry">* Data de Validade:</label>
                    <input type="date" id="entry-expiry" class="form-input" required>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                  <div class="form-group">
                    <label class="form-label" for="entry-cost-price">* Preço de Custo Unitário (R$):</label>
                    <input type="number" id="entry-cost-price" step="0.01" min="0" class="form-input" required placeholder="0.00">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="entry-sale-price">* Preço de Venda Unitário (R$):</label>
                    <input type="number" id="entry-sale-price" step="0.01" min="0" class="form-input" required placeholder="0.00">
                  </div>
                </div>

                <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
                  <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, #0d9488, #0f766e); border: none; padding: 11px 24px; font-weight: 700; font-size: 0.9rem; cursor: pointer;">
                    <i class="fa-solid fa-plus-circle"></i> Confirmar Entrada de Estoque
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- ==================================================================== -->
        <!-- AGRUPAMENTO 3: HISTÓRICO DE MOVIMENTAÇÕES (KARDEX DIGITAL)          -->
        <!-- ==================================================================== -->
        <div class="cfg-accordion-card" id="accordion-group-history" style="background: rgba(15, 23, 42, 0.75); border: 1.5px solid rgba(245, 158, 11, 0.35); border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.35); transition: all 0.3s ease;">
          <div class="cfg-accordion-header" data-target="body-history" style="padding: 16px 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, rgba(245, 158, 11, 0.15), rgba(15, 23, 42, 0.6)); border-bottom: 1px solid rgba(245, 158, 11, 0.25); user-select: none;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.45)); border: 1.5px solid rgba(245, 158, 11, 0.6); display: flex; align-items: center; justify-content: center; color: #fbbf24; font-size: 1.3rem; box-shadow: 0 0 18px rgba(245, 158, 11, 0.25);">
                <i class="fa-solid fa-clock-rotate-left"></i>
              </div>
              <div>
                <div style="font-family: 'Outfit', sans-serif; font-size: 1.12rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  Histórico de Movimentações &amp; Auditoria (Kardex)
                  <span style="font-size: 0.72rem; background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 2px 9px; border-radius: 12px; font-weight: 700;">
                    Auditoria Completa
                  </span>
                </div>
                <p style="margin: 3px 0 0; font-size: 0.82rem; color: #94a3b8;">
                  Extrato cronológico de todas as entradas, baixas por dispensação de balcão e ajustes de estoque.
                </p>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="cfg-chevron-btn" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; color: #fbbf24; transition: transform 0.3s ease;">
                <i class="fa-solid fa-chevron-down cfg-chevron-icon"></i>
              </div>
            </div>
          </div>

          <div id="body-history" class="cfg-accordion-body" style="padding: 20px; display: none;">
            <div id="inv-history-table-container" style="overflow-x: auto;">
              <div style="text-align: center; padding: 30px; color: #94a3b8;">
                Carregando histórico...
              </div>
            </div>
          </div>
        </div>

        <!-- ==================================================================== -->
        <!-- AGRUPAMENTO 4: PAINEL DE VALIDADES & FEFO                           -->
        <!-- ==================================================================== -->
        <div class="cfg-accordion-card" id="accordion-group-fefo" style="background: rgba(15, 23, 42, 0.75); border: 1.5px solid rgba(168, 85, 247, 0.35); border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.35); transition: all 0.3s ease;">
          <div class="cfg-accordion-header" data-target="body-fefo" style="padding: 16px 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, rgba(168, 85, 247, 0.15), rgba(15, 23, 42, 0.6)); border-bottom: 1px solid rgba(168, 85, 247, 0.25); user-select: none;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(126, 34, 206, 0.45)); border: 1.5px solid rgba(168, 85, 247, 0.6); display: flex; align-items: center; justify-content: center; color: #c084fc; font-size: 1.3rem; box-shadow: 0 0 18px rgba(168, 85, 247, 0.25);">
                <i class="fa-solid fa-hourglass-half"></i>
              </div>
              <div>
                <div style="font-family: 'Outfit', sans-serif; font-size: 1.12rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  Painel de Validades &amp; Prevenção de Perdas (FEFO)
                  <span style="font-size: 0.72rem; background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); padding: 2px 9px; border-radius: 12px; font-weight: 700;">
                    First Expire, First Out
                  </span>
                </div>
                <p style="margin: 3px 0 0; font-size: 0.82rem; color: #94a3b8;">
                  Priorização automática de dispensação para produtos com vencimento nos próximos 30 a 90 dias.
                </p>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="cfg-chevron-btn" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; color: #c084fc; transition: transform 0.3s ease;">
                <i class="fa-solid fa-chevron-down cfg-chevron-icon"></i>
              </div>
            </div>
          </div>

          <div id="body-fefo" class="cfg-accordion-body" style="padding: 20px; display: none;">
            <div id="inv-fefo-container">
              <div style="text-align: center; padding: 30px; color: #94a3b8;">
                Carregando análise FEFO...
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  `;

  // --- LÓGICA DE EXPANSÃO / RETRAÇÃO DOS AGRUPAMENTOS ---
  contentArea.querySelectorAll('.cfg-accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.cfg-accordion-card');
      const targetBodyId = header.getAttribute('data-target');
      const body = document.getElementById(targetBodyId);
      const chevron = header.querySelector('.cfg-chevron-btn');

      if (body) {
        const isCurrentlyOpen = body.style.display !== 'none';
        if (isCurrentlyOpen) {
          body.style.display = 'none';
          header.style.borderBottom = 'none';
          card.classList.remove('open');
          if (chevron) chevron.style.transform = 'rotate(-90deg)';
        } else {
          body.style.display = 'block';
          header.style.borderBottom = '1px solid rgba(255,255,255,0.15)';
          card.classList.add('open');
          if (chevron) chevron.style.transform = 'rotate(0deg)';
        }
      }
    });
  });

  // Expandir Todos
  document.getElementById('btn-inv-expand-all')?.addEventListener('click', () => {
    contentArea.querySelectorAll('.cfg-accordion-card').forEach(card => {
      const body = card.querySelector('.cfg-accordion-body');
      const header = card.querySelector('.cfg-accordion-header');
      const chevron = card.querySelector('.cfg-chevron-btn');
      if (body) body.style.display = 'block';
      if (header) header.style.borderBottom = '1px solid rgba(255,255,255,0.15)';
      card.classList.add('open');
      if (chevron) chevron.style.transform = 'rotate(0deg)';
    });
    showToast('Todos os agrupamentos foram expandidos.');
  });

  // Recolher Todos
  document.getElementById('btn-inv-collapse-all')?.addEventListener('click', () => {
    contentArea.querySelectorAll('.cfg-accordion-card').forEach(card => {
      const body = card.querySelector('.cfg-accordion-body');
      const header = card.querySelector('.cfg-accordion-header');
      const chevron = card.querySelector('.cfg-chevron-btn');
      if (body) body.style.display = 'none';
      if (header) header.style.borderBottom = 'none';
      card.classList.remove('open');
      if (chevron) chevron.style.transform = 'rotate(-90deg)';
    });
    showToast('Todos os agrupamentos foram recolhidos.');
  });

  // --- CARREGAMENTO DE DADOS & RENDERIZAÇÃO ---
  const loadInventoryData = () => {
    const products = localDB.list('products') || [];
    const movements = localDB.list('inventory_movements') || [];

    // 1. Calcular KPIs
    const totalProducts = products.length;
    let totalUnits = 0;
    let totalCostVal = 0;
    let totalSaleVal = 0;
    let criticalCount = 0;
    let nearExpiryCount = 0;

    const now = new Date();
    const ninetyDaysFromNow = new Date(Date.now() + 90 * 86400000);

    products.forEach(p => {
      const qty = parseInt(p.current_stock || 0, 10);
      const min = parseInt(p.min_stock || 5, 10);
      const cost = parseFloat(p.cost_price || 0);
      const sale = parseFloat(p.sale_price || 0);

      totalUnits += qty;
      totalCostVal += (qty * cost);
      totalSaleVal += (qty * sale);

      if (qty <= min) criticalCount++;

      if (p.expiry_date) {
        const exp = new Date(p.expiry_date);
        if (exp <= ninetyDaysFromNow) {
          nearExpiryCount++;
        }
      }
    });

    document.getElementById('kpi-stock-products-count').textContent = totalProducts;
    document.getElementById('kpi-stock-units-count').textContent = totalUnits.toLocaleString('pt-BR');
    document.getElementById('kpi-stock-value-sale').textContent = `R$ ${totalSaleVal.toFixed(2).replace('.', ',')}`;
    document.getElementById('kpi-stock-value-cost').textContent = `Custo: R$ ${totalCostVal.toFixed(2).replace('.', ',')}`;
    
    const alertsEl = document.getElementById('kpi-stock-alerts');
    alertsEl.textContent = `${criticalCount + nearExpiryCount} Alertas`;
    if (criticalCount + nearExpiryCount > 0) {
      alertsEl.style.color = '#f87171';
    } else {
      alertsEl.style.color = '#34d399';
    }

    const badgeCatalog = document.getElementById('badge-catalog-count');
    if (badgeCatalog) badgeCatalog.textContent = `${totalProducts} Produtos (${totalUnits} un)`;

    // 2. Popular Seletor de Produtos na Entrada
    const entrySelect = document.getElementById('entry-product-id');
    if (entrySelect) {
      entrySelect.innerHTML = `<option value="">Selecione um produto do catálogo...</option>` +
        products.map(p => `<option value="${p.id}" data-cost="${p.cost_price}" data-sale="${p.sale_price}" data-batch="${p.batch || ''}">${p.name} (Saldo: ${p.current_stock} un)</option>`).join('');
    }

    // 3. Renderizar Tabela de Produtos Filtrada
    renderProductsTable(products);

    // 4. Renderizar Histórico (Kardex)
    renderMovementsTable(movements);

    // 5. Renderizar Painel FEFO
    renderFEFOPanel(products);
  };

  // Renderizar Tabela de Produtos
  const renderProductsTable = (products) => {
    const container = document.getElementById('inv-products-table-container');
    if (!container) return;

    const searchTerm = (document.getElementById('inv-search-input')?.value || '').toLowerCase().trim();
    const categoryFilter = document.getElementById('inv-category-filter')?.value || '';
    const statusFilter = document.getElementById('inv-status-filter')?.value || '';

    const filtered = products.filter(p => {
      const matchSearch = !searchTerm ||
        (p.name || '').toLowerCase().includes(searchTerm) ||
        (p.dci || '').toLowerCase().includes(searchTerm) ||
        (p.ean || '').includes(searchTerm);

      const matchCat = !categoryFilter || (p.category || '').toLowerCase().includes(categoryFilter.toLowerCase());

      let matchStatus = true;
      if (statusFilter === 'baixo') {
        matchStatus = (p.current_stock || 0) <= (p.min_stock || 5);
      } else if (statusFilter === 'vencimento') {
        const exp = p.expiry_date ? new Date(p.expiry_date) : null;
        matchStatus = exp && (exp <= new Date(Date.now() + 90 * 86400000));
      } else if (statusFilter === 'normal') {
        matchStatus = (p.current_stock || 0) > (p.min_stock || 5);
      }

      return matchSearch && matchCat && matchStatus;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #94a3b8;">
          <i class="fa-solid fa-box-open" style="font-size: 2.5rem; opacity: 0.4; margin-bottom: 12px; display: block;"></i>
          Nenhum produto encontrado com os filtros aplicados.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table class="patients-table" style="width: 100%; border-collapse: collapse; font-size: 0.86rem;">
        <thead>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); text-align: left; color: #94a3b8; font-size: 0.76rem; text-transform: uppercase;">
            <th style="padding: 12px 10px;">Produto / Apresentação</th>
            <th style="padding: 12px 10px;">Princípio Ativo (DCI) / EAN</th>
            <th style="padding: 12px 10px;">Categoria</th>
            <th style="padding: 12px 10px;">Lote / Validade</th>
            <th style="padding: 12px 10px; text-align: center;">Saldo Atual</th>
            <th style="padding: 12px 10px; text-align: right;">Preço Venda</th>
            <th style="padding: 12px 10px; text-align: right;">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(p => {
            const isLow = (p.current_stock || 0) <= (p.min_stock || 5);
            let badgeStyle = 'background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);';
            if (isLow) badgeStyle = 'background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);';

            const expDate = p.expiry_date ? new Date(p.expiry_date) : null;
            const isExpiringSoon = expDate && (expDate <= new Date(Date.now() + 90 * 86400000));
            const formattedExp = expDate ? expDate.toLocaleDateString('pt-BR') : 'N/A';

            return `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                <td style="padding: 12px 10px;">
                  <strong style="color: #fff; font-size: 0.92rem; display: block;">${p.name}</strong>
                  <small style="color: #94a3b8; font-size: 0.76rem;">${p.presentation || 'Apresentação padrão'}</small>
                </td>
                <td style="padding: 12px 10px;">
                  <div style="color: #cbd5e1;">${p.dci || '-'}</div>
                  <small style="color: #64748b; font-family: monospace; font-size: 0.72rem;">EAN: ${p.ean || 'Sem código'}</small>
                </td>
                <td style="padding: 12px 10px;">
                  <span style="font-size: 0.72rem; padding: 3px 8px; border-radius: 8px; background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">
                    ${p.category || 'Geral'}
                  </span>
                </td>
                <td style="padding: 12px 10px;">
                  <div style="color: #cbd5e1; font-family: monospace; font-size: 0.8rem;">${p.batch || 'Sem lote'}</div>
                  <small style="font-size: 0.72rem; ${isExpiringSoon ? 'color: #f87171; font-weight: 700;' : 'color: #94a3b8;'}">
                    ${isExpiringSoon ? '<i class="fa-solid fa-clock"></i> ' : ''}Val: ${formattedExp}
                  </small>
                </td>
                <td style="padding: 12px 10px; text-align: center;">
                  <span style="font-size: 0.85rem; font-weight: 800; padding: 4px 10px; border-radius: 12px; ${badgeStyle}">
                    ${p.current_stock || 0} un
                  </span>
                  <div style="font-size: 0.68rem; color: #64748b; margin-top: 3px;">Mín: ${p.min_stock || 5} un</div>
                </td>
                <td style="padding: 12px 10px; text-align: right;">
                  <strong style="color: #34d399; font-size: 0.95rem;">R$ ${(parseFloat(p.sale_price || 0)).toFixed(2).replace('.', ',')}</strong>
                  <div style="font-size: 0.7rem; color: #94a3b8;">Custo: R$ ${(parseFloat(p.cost_price || 0)).toFixed(2).replace('.', ',')}</div>
                </td>
                <td style="padding: 12px 10px; text-align: right;">
                  <div style="display: inline-flex; gap: 6px;">
                    <button class="btn btn-sm btn-edit-product" data-id="${p.id}" title="Editar Produto" style="background: rgba(255,255,255,0.06); color: #38bdf8; border: 1px solid rgba(255,255,255,0.1); padding: 5px 9px; border-radius: 6px; cursor: pointer;">
                      <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn btn-sm btn-adjust-stock" data-id="${p.id}" data-name="${p.name}" data-qty="${p.current_stock || 0}" title="Ajuste Rápido de Estoque" style="background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 5px 9px; border-radius: 6px; cursor: pointer;">
                      <i class="fa-solid fa-sliders"></i>
                    </button>
                    <button class="btn btn-sm btn-delete-product" data-id="${p.id}" data-name="${p.name}" title="Excluir Produto" style="background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 5px 9px; border-radius: 6px; cursor: pointer;">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    // Event listeners da tabela
    container.querySelectorAll('.btn-edit-product').forEach(btn => {
      btn.addEventListener('click', () => {
        const prod = (localDB.list('products') || []).find(p => p.id === btn.dataset.id);
        if (prod) openProductModal(prod, loadInventoryData);
      });
    });

    container.querySelectorAll('.btn-adjust-stock').forEach(btn => {
      btn.addEventListener('click', () => {
        openStockAdjustmentModal(btn.dataset.id, btn.dataset.name, parseInt(btn.dataset.qty, 10), loadInventoryData);
      });
    });

    container.querySelectorAll('.btn-delete-product').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await showCustomConfirm({
          title: 'Excluir Produto',
          message: `Deseja realmente remover o produto <strong>${btn.dataset.name}</strong> do catálogo de estoque?`,
          confirmText: 'Sim, Excluir',
          cancelText: 'Cancelar',
          type: 'danger'
        });

        if (confirmed) {
          localDB.remove('products', btn.dataset.id);
          showToast('Produto excluído com sucesso.');
          syncManager.pushToCloud(false);
          loadInventoryData();
        }
      });
    });
  };

  // Renderizar Histórico de Movimentações
  const renderMovementsTable = (movements) => {
    const container = document.getElementById('inv-history-table-container');
    if (!container) return;

    if (movements.length === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 25px; color: #94a3b8;">Nenhuma movimentação registrada no histórico.</div>`;
      return;
    }

    const sorted = [...movements].reverse().slice(0, 20);

    container.innerHTML = `
      <table class="patients-table" style="width: 100%; border-collapse: collapse; font-size: 0.84rem;">
        <thead>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); text-align: left; color: #94a3b8; font-size: 0.74rem; text-transform: uppercase;">
            <th style="padding: 10px 8px;">Data / Hora</th>
            <th style="padding: 10px 8px;">Tipo</th>
            <th style="padding: 10px 8px;">Produto</th>
            <th style="padding: 10px 8px; text-align: center;">Quantidade</th>
            <th style="padding: 10px 8px;">Lote</th>
            <th style="padding: 10px 8px;">Motivo / Destino</th>
            <th style="padding: 10px 8px;">Operador</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map(m => {
            const isEntry = m.type === 'Entrada' || m.quantity > 0;
            const badgeType = isEntry
              ? 'background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);'
              : 'background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);';

            const dt = m.created_at ? new Date(m.created_at).toLocaleString('pt-BR') : 'Hoje';

            return `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                <td style="padding: 10px 8px; color: #94a3b8; font-size: 0.78rem;">${dt}</td>
                <td style="padding: 10px 8px;">
                  <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 8px; ${badgeType}">
                    ${m.type || 'Movimento'}
                  </span>
                </td>
                <td style="padding: 10px 8px; color: #fff; font-weight: 600;">${m.product_name}</td>
                <td style="padding: 10px 8px; text-align: center; font-weight: 800; font-family: monospace; ${isEntry ? 'color: #34d399;' : 'color: #f87171;'}">
                  ${m.quantity > 0 ? `+${m.quantity}` : m.quantity} un
                </td>
                <td style="padding: 10px 8px; color: #cbd5e1; font-family: monospace; font-size: 0.78rem;">${m.batch || '-'}</td>
                <td style="padding: 10px 8px; color: #94a3b8; font-size: 0.78rem;">
                  ${m.patient_name ? `<strong>${m.patient_name}</strong> - ` : ''}${m.reason || 'Sem descrição'}
                </td>
                <td style="padding: 10px 8px; color: #94a3b8; font-size: 0.78rem;">${m.operator_name || 'Sistema'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  };

  // Renderizar Painel FEFO (Validades)
  const renderFEFOPanel = (products) => {
    const container = document.getElementById('inv-fefo-container');
    if (!container) return;

    const withExpiry = products
      .filter(p => p.expiry_date)
      .map(p => {
        const exp = new Date(p.expiry_date);
        const daysDiff = Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24));
        return { ...p, daysDiff };
      })
      .sort((a, b) => a.daysDiff - b.daysDiff);

    if (withExpiry.length === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 25px; color: #94a3b8;">Nenhum lote com data de validade cadastrado.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
        ${withExpiry.map(p => {
          let cardBorder = 'rgba(255,255,255,0.08)';
          let daysBadge = 'background: rgba(16, 185, 129, 0.15); color: #34d399;';

          if (p.daysDiff < 0) {
            cardBorder = 'rgba(239, 68, 68, 0.5)';
            daysBadge = 'background: #dc2626; color: #fff; font-weight: 800;';
          } else if (p.daysDiff <= 60) {
            cardBorder = 'rgba(245, 158, 11, 0.5)';
            daysBadge = 'background: #d97706; color: #fff; font-weight: 800;';
          }

          return `
            <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid ${cardBorder}; border-radius: 14px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
                  <strong style="color: #fff; font-size: 0.95rem;">${p.name}</strong>
                  <span style="font-size: 0.72rem; padding: 3px 8px; border-radius: 10px; ${daysBadge}">
                    ${p.daysDiff < 0 ? 'VENCIDO' : `${p.daysDiff} dias`}
                  </span>
                </div>
                <div style="font-size: 0.78rem; color: #94a3b8;">Lote: <span style="color: #cbd5e1; font-family: monospace;">${p.batch || 'N/A'}</span></div>
                <div style="font-size: 0.78rem; color: #94a3b8;">Validade: <strong style="color: #fff;">${new Date(p.expiry_date).toLocaleDateString('pt-BR')}</strong></div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06);">
                <span style="font-size: 0.82rem; font-weight: 700; color: #34d399;">Saldo: ${p.current_stock || 0} un</span>
                <span style="font-size: 0.74rem; color: #94a3b8;">Prioridade FEFO</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  };

  // --- EVENT LISTENERS DA PÁGINA ---
  document.getElementById('inv-search-input')?.addEventListener('input', () => {
    renderProductsTable(localDB.list('products') || []);
  });
  document.getElementById('inv-category-filter')?.addEventListener('change', () => {
    renderProductsTable(localDB.list('products') || []);
  });
  document.getElementById('inv-status-filter')?.addEventListener('change', () => {
    renderProductsTable(localDB.list('products') || []);
  });

  document.getElementById('btn-quick-new-product')?.addEventListener('click', () => {
    openProductModal(null, loadInventoryData);
  });

  document.getElementById('btn-quick-stock-entry')?.addEventListener('click', () => {
    // Abrir o acordeão de entrada
    const entryCard = document.getElementById('accordion-group-entry');
    const entryBody = document.getElementById('body-entry');
    const chevron = entryCard?.querySelector('.cfg-chevron-btn');
    if (entryBody) {
      entryBody.style.display = 'block';
      entryCard?.classList.add('open');
      if (chevron) chevron.style.transform = 'rotate(0deg)';
      entryBody.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Listener para preencher dados sugeridos na entrada ao selecionar produto
  document.getElementById('entry-product-id')?.addEventListener('change', (e) => {
    const selectedOpt = e.target.options[e.target.selectedIndex];
    if (selectedOpt && selectedOpt.value) {
      document.getElementById('entry-cost-price').value = selectedOpt.dataset.cost || '';
      document.getElementById('entry-sale-price').value = selectedOpt.dataset.sale || '';
      document.getElementById('entry-batch').value = selectedOpt.dataset.batch || '';
    }
  });

  // Formulário de Entrada de Estoque
  document.getElementById('form-stock-entry')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const productId = document.getElementById('entry-product-id').value;
    const supplier = document.getElementById('entry-supplier').value.trim();
    const quantity = parseInt(document.getElementById('entry-quantity').value, 10);
    const batch = document.getElementById('entry-batch').value.trim();
    const expiry = document.getElementById('entry-expiry').value;
    const costPrice = parseFloat(document.getElementById('entry-cost-price').value);
    const salePrice = parseFloat(document.getElementById('entry-sale-price').value);

    if (!productId || isNaN(quantity) || quantity <= 0) {
      showCustomAlert({ title: 'Aviso', message: 'Selecione um produto e informe uma quantidade válida.', type: 'warning' });
      return;
    }

    const prod = localDB.get('products', productId);
    if (!prod) return;

    const newStock = parseInt(prod.current_stock || 0, 10) + quantity;
    localDB.update('products', productId, {
      current_stock: newStock,
      batch: batch || prod.batch,
      expiry_date: expiry || prod.expiry_date,
      cost_price: costPrice || prod.cost_price,
      sale_price: salePrice || prod.sale_price,
      supplier: supplier || prod.supplier
    });

    // Registrar no histórico de movimentações (Kardex)
    localDB.insert('inventory_movements', {
      product_id: productId,
      product_name: prod.name,
      type: 'Entrada',
      quantity: quantity,
      batch: batch,
      cost_unit: costPrice,
      total_value: (quantity * costPrice),
      reason: supplier ? `Entrada de Mercadoria (${supplier})` : 'Entrada Manual de Lote',
      operator_name: `${currentUser.name || 'Operador'} (${currentUser.role || 'Farmacêutico'})`,
      created_at: new Date().toISOString()
    });

    showToast(`✅ Entrada de ${quantity} un de ${prod.name} registrada com sucesso!`);
    syncManager.pushToCloud(false);
    document.getElementById('form-stock-entry').reset();
    loadInventoryData();
  });

  // Inicializar dados
  loadInventoryData();
}

// --- MODAL DE CRIAÇÃO / EDIÇÃO DE PRODUTO ---
export function openProductModal(productToEdit = null, onSaved = null) {
  const isEdit = !!productToEdit;
  const modal = document.createElement('div');
  modal.id = 'product-crud-modal';
  modal.className = 'pep-modal';
  modal.style.display = 'flex';

  modal.innerHTML = `
    <div class="pep-content" style="max-width: 650px; background: #0f172a; border: 1px solid rgba(255,255,255,0.12); border-radius: 18px; padding: 24px; box-shadow: 0 25px 60px rgba(0,0,0,0.85);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 14px;">
        <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 700; color: #fff; margin: 0; display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid ${isEdit ? 'fa-pen-to-square' : 'fa-plus-circle'}" style="color: #10b981;"></i>
          ${isEdit ? 'Editar Dados do Produto' : 'Cadastrar Novo Medicamento / Produto'}
        </h3>
        <button id="close-prod-modal" style="background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <form id="prod-crud-form" style="display: flex; flex-direction: column; gap: 14px;">
        <div class="form-group">
          <label class="form-label" for="p-name" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">* Nome Comercial / Descrição Completa:</label>
          <input type="text" id="p-name" class="form-input" required value="${productToEdit ? productToEdit.name : ''}" placeholder="Ex: Losartana Potássica 50mg c/ 30 comprimidos">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label" for="p-dci" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">Princípio Ativo (DCI):</label>
            <input type="text" id="p-dci" class="form-input" value="${productToEdit ? (productToEdit.dci || '') : ''}" placeholder="Ex: Losartana Potássica">
          </div>
          <div class="form-group">
            <label class="form-label" for="p-ean" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">Código EAN / Barras:</label>
            <input type="text" id="p-ean" class="form-input" value="${productToEdit ? (productToEdit.ean || '') : ''}" placeholder="7890000000000">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label" for="p-category" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">* Categoria:</label>
            <select id="p-category" class="form-input" style="background: #1e293b; color: #fff;">
              <option value="MIP / Analgésico" ${productToEdit?.category?.includes('MIP') ? 'selected' : ''}>MIP / Analgésico &amp; Antitérmico</option>
              <option value="Uso Contínuo / Anti-hipertensivo" ${productToEdit?.category?.includes('Contínuo') ? 'selected' : ''}>Uso Contínuo / Anti-hipertensivo / Diabetes</option>
              <option value="Suplemento / Imunidade" ${productToEdit?.category?.includes('Suplemento') ? 'selected' : ''}>Suplementos &amp; Vitaminas</option>
              <option value="Correlatos / Diagnóstico Clínico" ${productToEdit?.category?.includes('Correlatos') ? 'selected' : ''}>Correlatos &amp; Tiras de Glicose</option>
              <option value="Perfumaria / Higiene" ${productToEdit?.category?.includes('Perfumaria') ? 'selected' : ''}>Perfumaria &amp; Higiene</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="p-presentation" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">Apresentação:</label>
            <input type="text" id="p-presentation" class="form-input" value="${productToEdit ? (productToEdit.presentation || '') : ''}" placeholder="Ex: Caixa com 30 comprimidos">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label" for="p-stock" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">* Estoque Atual (Un):</label>
            <input type="number" id="p-stock" class="form-input" required min="0" value="${productToEdit ? (productToEdit.current_stock ?? 10) : 10}">
          </div>
          <div class="form-group">
            <label class="form-label" for="p-min-stock" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">* Estoque Mínimo:</label>
            <input type="number" id="p-min-stock" class="form-input" required min="1" value="${productToEdit ? (productToEdit.min_stock ?? 5) : 5}">
          </div>
          <div class="form-group">
            <label class="form-label" for="p-expiry" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">Validade Lote:</label>
            <input type="date" id="p-expiry" class="form-input" value="${productToEdit ? (productToEdit.expiry_date || '') : ''}">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label" for="p-cost" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">Preço de Custo (R$):</label>
            <input type="number" id="p-cost" step="0.01" min="0" class="form-input" value="${productToEdit ? (productToEdit.cost_price || 0) : ''}" placeholder="0.00">
          </div>
          <div class="form-group">
            <label class="form-label" for="p-sale" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">* Preço de Venda (R$):</label>
            <input type="number" id="p-sale" step="0.01" min="0" class="form-input" required value="${productToEdit ? (productToEdit.sale_price || 0) : ''}" placeholder="0.00">
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 14px;">
          <button type="submit" class="btn btn-primary" style="flex: 1; background: linear-gradient(135deg, #10b981, #059669); border: none; padding: 11px; font-weight: 700; font-size: 0.9rem;">
            <i class="fa-solid fa-floppy-disk"></i> ${isEdit ? 'Salvar Alterações' : 'Cadastrar Produto'}
          </button>
          <button type="button" id="cancel-prod-modal" class="btn" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; padding: 11px 18px; font-weight: 600;">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();
  document.getElementById('close-prod-modal').addEventListener('click', closeModal);
  document.getElementById('cancel-prod-modal').addEventListener('click', closeModal);

  document.getElementById('prod-crud-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('p-name').value.trim();
    const dci = document.getElementById('p-dci').value.trim();
    const ean = document.getElementById('p-ean').value.trim();
    const category = document.getElementById('p-category').value;
    const presentation = document.getElementById('p-presentation').value.trim();
    const current_stock = parseInt(document.getElementById('p-stock').value, 10);
    const min_stock = parseInt(document.getElementById('p-min-stock').value, 10);
    const expiry_date = document.getElementById('p-expiry').value;
    const cost_price = parseFloat(document.getElementById('p-cost').value || 0);
    const sale_price = parseFloat(document.getElementById('p-sale').value || 0);

    if (isEdit) {
      localDB.update('products', productToEdit.id, {
        name, dci, ean, category, presentation, current_stock, min_stock, expiry_date, cost_price, sale_price
      });
      showToast('Produto atualizado com sucesso!');
    } else {
      localDB.insert('products', {
        name, dci, ean, category, presentation, current_stock, min_stock, expiry_date, cost_price, sale_price,
        batch: `L-${Math.floor(10000 + Math.random() * 90000)}`,
        created_at: new Date().toISOString()
      });
      showToast('Novo produto cadastrado no catálogo!');
    }

    syncManager.pushToCloud(false);
    closeModal();
    if (onSaved) onSaved();
  });
}

// --- MODAL DE AJUSTE RÁPIDO DE SALDO ---
function openStockAdjustmentModal(productId, productName, currentQty, onSaved) {
  const modal = document.createElement('div');
  modal.id = 'stock-adjust-modal';
  modal.className = 'pep-modal';
  modal.style.display = 'flex';

  modal.innerHTML = `
    <div class="pep-content" style="max-width: 480px; background: #0f172a; border: 1px solid rgba(255,255,255,0.12); border-radius: 18px; padding: 24px;">
      <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 700; color: #fff; margin: 0 0 12px; display: flex; align-items: center; gap: 8px;">
        <i class="fa-solid fa-sliders" style="color: #34d399;"></i> Ajuste Rápido de Estoque
      </h3>
      <p style="font-size: 0.84rem; color: #94a3b8; margin-bottom: 16px;">
        Produto: <strong style="color: #fff;">${productName}</strong><br>
        Saldo Atual Físico: <strong style="color: #38bdf8;">${currentQty} unidades</strong>
      </p>

      <form id="stock-adjust-form" style="display: flex; flex-direction: column; gap: 14px;">
        <div class="form-group">
          <label class="form-label" for="adj-new-qty" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">Novo Saldo Físico Contado:</label>
          <input type="number" id="adj-new-qty" class="form-input" required min="0" value="${currentQty}">
        </div>

        <div class="form-group">
          <label class="form-label" for="adj-reason" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">Motivo do Ajuste:</label>
          <select id="adj-reason" class="form-input" style="background: #1e293b; color: #fff;">
            <option value="Contagem de Balanço / Inventário Periódico">Contagem de Balanço / Inventário Periódico</option>
            <option value="Avaria / Quebra de Frasco">Avaria / Quebra de Frasco</option>
            <option value="Descarte por Vencimento">Descarte por Vencimento</option>
            <option value="Correção de Lançamento Anterior">Correção de Lançamento Anterior</option>
          </select>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <button type="submit" class="btn btn-primary" style="flex: 1; background: linear-gradient(135deg, #10b981, #059669); border: none; padding: 10px; font-weight: 700;">
            Salvar Ajuste
          </button>
          <button type="button" id="cancel-adj-modal" class="btn" style="background: rgba(255,255,255,0.08); color: #cbd5e1;">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();
  document.getElementById('cancel-adj-modal').addEventListener('click', closeModal);

  document.getElementById('stock-adjust-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newQty = parseInt(document.getElementById('adj-new-qty').value, 10);
    const reason = document.getElementById('adj-reason').value;
    const diff = newQty - currentQty;

    localDB.update('products', productId, { current_stock: newQty });

    localDB.insert('inventory_movements', {
      product_id: productId,
      product_name: productName,
      type: 'Ajuste de Saldo',
      quantity: diff,
      reason: reason,
      operator_name: `${state.user?.name || 'Operador'} (Ajuste Manual)`,
      created_at: new Date().toISOString()
    });

    showToast('Saldo de estoque ajustado com sucesso!');
    syncManager.pushToCloud(false);
    closeModal();
    if (onSaved) onSaved();
  });
}
