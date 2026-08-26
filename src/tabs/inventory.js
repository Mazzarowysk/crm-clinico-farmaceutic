// src/tabs/inventory.js
// MÓDULO DE CONTROLE DE ESTOQUE FARMACÊUTICO, CATÁLOGO DE PRODUTOS & DISPENSAÇÃO (v3.0)

import * as localDB from '../localDB.js';
import { state } from '../state.js';
import { showToast, showCustomAlert, showCustomConfirm } from '../modules/ui.js';
import { syncManager } from '../modules/sync.js';
import { playBeepSound, openCameraBarcodeScanner } from '../modules/barcodeScanner.js';
import { openQuickCheckoutModal } from '../modules/quickCheckoutModal.js';
import { analyzeExpiryRisk, analyzeReplenishmentNeeds, openPromoDiscountModal, openQuarantineModal } from '../modules/stockIntelligence.js';
import { openCashRegisterModal } from '../modules/cashRegister.js';
import { openSngpcBookModal, openSngpcDispensationModal } from '../modules/sngpc.js';
import { openNFeImporterModal } from '../modules/nfeImporter.js';

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

        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <button id="btn-quick-import-nfe" class="btn" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: none; padding: 9px 14px; border-radius: 10px; font-weight: 700; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);" title="Importar arquivo XML de Nota Fiscal de Distribuidora">
            <i class="fa-solid fa-file-invoice-dollar"></i> Importar NF-e (XML)
          </button>
          <button id="btn-quick-sngpc" class="btn" style="background: linear-gradient(135deg, #ef4444, #b91c1c); color: #fff; border: none; padding: 9px 14px; border-radius: 10px; font-weight: 700; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);">
            <i class="fa-solid fa-file-prescription"></i> SNGPC / Controlados
          </button>
          <button id="btn-quick-cash-register" class="btn" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: none; padding: 9px 14px; border-radius: 10px; font-weight: 700; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);">
            <i class="fa-solid fa-cash-register"></i> Caixa &amp; Turno
          </button>
          <button id="btn-quick-stock-intelligence" class="btn" style="background: linear-gradient(135deg, #a855f7, #7e22ce); color: #fff; border: none; padding: 9px 14px; border-radius: 10px; font-weight: 700; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(168, 85, 247, 0.35);">
            <i class="fa-solid fa-hourglass-half"></i> Validades
          </button>
          <button id="btn-quick-stock-checkout" class="btn" style="background: linear-gradient(135deg, #38bdf8, #0284c7); color: #fff; border: none; padding: 9px 14px; border-radius: 10px; font-weight: 700; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(56, 189, 248, 0.35);">
            <i class="fa-solid fa-barcode"></i> Saída / PDV
          </button>
          <button id="btn-quick-new-product" class="btn" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 9px 14px; border-radius: 10px; font-weight: 700; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">
            <i class="fa-solid fa-plus"></i> Novo
          </button>
          <button id="btn-quick-stock-entry" class="btn" style="background: linear-gradient(135deg, #0d9488, #0f766e); color: #fff; border: none; padding: 9px 14px; border-radius: 10px; font-weight: 700; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.35);">
            <i class="fa-solid fa-box-open"></i> Entrada
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
              
              <!-- Barra de Bipe Rápido por Código de Barras / EAN -->
              <div style="background: linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(15, 23, 42, 0.6)); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 12px; padding: 14px 18px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <i class="fa-solid fa-barcode" style="color: #38bdf8; font-size: 1.6rem;"></i>
                  <div>
                    <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">Entrada Rápida por Código de Barras / EAN</div>
                    <div style="font-size: 0.78rem; color: #94a3b8;">Bipe o produto para carregar seus dados e dar entrada em 1 segundo.</div>
                  </div>
                </div>
                <div style="display: flex; gap: 8px;">
                  <input type="text" id="entry-barcode-scan-input" placeholder="Bipar código EAN aqui..." class="form-input" style="width: 220px; height: 40px; font-family: monospace; font-size: 0.92rem; background: #0f172a; border-color: rgba(56, 189, 248, 0.5); color: #38bdf8; font-weight: 700;">
                  <button type="button" id="btn-entry-camera-scan" class="btn" style="background: rgba(56, 189, 248, 0.2); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; padding: 0 14px; font-weight: 700; font-size: 0.82rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-camera"></i> Câmera
                  </button>
                </div>
              </div>

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

  // Renderizar Painel Inteligente de Validades (FEFO) e Previsão de Reposição
  let currentFefoFilter = 'all'; // 'all' | 'expired' | 'critical30' | 'attention60' | 'alert90' | 'safe'

  const renderFEFOPanel = (products) => {
    const container = document.getElementById('inv-fefo-container');
    if (!container) return;

    const riskAnalysis = analyzeExpiryRisk(products);
    const movements = localDB.list('inventory_movements') || [];
    const replenishmentList = analyzeReplenishmentNeeds(products, movements);

    let displayLots = [];
    if (currentFefoFilter === 'expired') displayLots = riskAnalysis.expired;
    else if (currentFefoFilter === 'critical30') displayLots = riskAnalysis.critical30;
    else if (currentFefoFilter === 'attention60') displayLots = riskAnalysis.attention60;
    else if (currentFefoFilter === 'alert90') displayLots = riskAnalysis.alert90;
    else if (currentFefoFilter === 'safe') displayLots = riskAnalysis.safe;
    else {
      displayLots = [...riskAnalysis.expired, ...riskAnalysis.critical30, ...riskAnalysis.attention60, ...riskAnalysis.alert90, ...riskAnalysis.safe];
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        
        <!-- CARDS DE FAIXAS DE RISCO DE VALIDADE (30/60/90 DIAS) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px;">
          
          <div class="fefo-filter-card ${currentFefoFilter === 'all' ? 'active' : ''}" data-filter="all" style="background: rgba(30, 41, 59, 0.5); border: 1.5px solid ${currentFefoFilter === 'all' ? '#c084fc' : 'rgba(255,255,255,0.08)'}; border-radius: 12px; padding: 12px; cursor: pointer; text-align: center; transition: all 0.2s;">
            <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Todos Rastreados</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #fff; margin-top: 2px;">${riskAnalysis.totalTracked}</div>
            <small style="color: #c084fc; font-size: 0.68rem;">Lotes com validade</small>
          </div>

          <div class="fefo-filter-card ${currentFefoFilter === 'expired' ? 'active' : ''}" data-filter="expired" style="background: rgba(239, 68, 68, 0.12); border: 1.5px solid ${currentFefoFilter === 'expired' ? '#ef4444' : 'rgba(239, 68, 68, 0.3)'}; border-radius: 12px; padding: 12px; cursor: pointer; text-align: center; transition: all 0.2s;">
            <div style="font-size: 0.72rem; color: #fca5a5; text-transform: uppercase; font-weight: 700;">🔴 Vencidos</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #ef4444; margin-top: 2px;">${riskAnalysis.expired.length}</div>
            <small style="color: #f87171; font-size: 0.68rem;">Quarentena / Descarte</small>
          </div>

          <div class="fefo-filter-card ${currentFefoFilter === 'critical30' ? 'active' : ''}" data-filter="critical30" style="background: rgba(249, 115, 22, 0.12); border: 1.5px solid ${currentFefoFilter === 'critical30' ? '#f97316' : 'rgba(249, 115, 22, 0.3)'}; border-radius: 12px; padding: 12px; cursor: pointer; text-align: center; transition: all 0.2s;">
            <div style="font-size: 0.72rem; color: #fdba74; text-transform: uppercase; font-weight: 700;">🟠 Críticos (&lt; 30d)</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #f97316; margin-top: 2px;">${riskAnalysis.critical30.length}</div>
            <small style="color: #fb923c; font-size: 0.68rem;">Queima / Promoção</small>
          </div>

          <div class="fefo-filter-card ${currentFefoFilter === 'attention60' ? 'active' : ''}" data-filter="attention60" style="background: rgba(245, 158, 11, 0.12); border: 1.5px solid ${currentFefoFilter === 'attention60' ? '#f59e0b' : 'rgba(245, 158, 11, 0.3)'}; border-radius: 12px; padding: 12px; cursor: pointer; text-align: center; transition: all 0.2s;">
            <div style="font-size: 0.72rem; color: #fde68a; text-transform: uppercase; font-weight: 700;">🟡 Atenção (30-60d)</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #fbbf24; margin-top: 2px;">${riskAnalysis.attention60.length}</div>
            <small style="color: #f59e0b; font-size: 0.68rem;">Dispensar 1º (FEFO)</small>
          </div>

          <div class="fefo-filter-card ${currentFefoFilter === 'alert90' ? 'active' : ''}" data-filter="alert90" style="background: rgba(56, 189, 248, 0.12); border: 1.5px solid ${currentFefoFilter === 'alert90' ? '#38bdf8' : 'rgba(56, 189, 248, 0.3)'}; border-radius: 12px; padding: 12px; cursor: pointer; text-align: center; transition: all 0.2s;">
            <div style="font-size: 0.72rem; color: #bae6fd; text-transform: uppercase; font-weight: 700;">🔵 Alerta (60-90d)</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #38bdf8; margin-top: 2px;">${riskAnalysis.alert90.length}</div>
            <small style="color: #0284c7; font-size: 0.68rem;">Giro sob controle</small>
          </div>

        </div>

        <!-- LISTA DE LOTES COM AÇÕES RÁPIDAS -->
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <strong style="color: #fff; font-size: 0.95rem; font-family: 'Outfit';">
              <i class="fa-solid fa-list-check" style="color: #c084fc;"></i> Lotes com Vencimento Monitorado (${displayLots.length})
            </strong>
            <span style="font-size: 0.74rem; color: #94a3b8;">
              Ordenado por menor prazo de validade (First Expire, First Out)
            </span>
          </div>

          ${displayLots.length === 0 ? `
            <div style="text-align: center; padding: 30px; color: #94a3b8; font-size: 0.85rem;">
              Nenhum lote encontrado para o filtro selecionado.
            </div>
          ` : `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
              ${displayLots.map(p => {
                let badgeStyle = 'background: rgba(16, 185, 129, 0.15); color: #34d399;';
                let cardBorder = 'rgba(255,255,255,0.08)';

                if (p.daysDiff < 0) {
                  badgeStyle = 'background: #dc2626; color: #fff; font-weight: 800;';
                  cardBorder = 'rgba(239, 68, 68, 0.45)';
                } else if (p.daysDiff <= 30) {
                  badgeStyle = 'background: #ea580c; color: #fff; font-weight: 800;';
                  cardBorder = 'rgba(249, 115, 22, 0.45)';
                } else if (p.daysDiff <= 60) {
                  badgeStyle = 'background: #d97706; color: #fff; font-weight: 800;';
                  cardBorder = 'rgba(245, 158, 11, 0.45)';
                } else if (p.daysDiff <= 90) {
                  badgeStyle = 'background: rgba(56, 189, 248, 0.2); color: #38bdf8; font-weight: 700;';
                  cardBorder = 'rgba(56, 189, 248, 0.3)';
                }

                return `
                  <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid ${cardBorder}; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; margin-bottom: 6px;">
                        <strong style="color: #fff; font-size: 0.9rem; line-height: 1.25;">${p.name}</strong>
                        <span style="font-size: 0.68rem; padding: 2px 7px; border-radius: 8px; ${badgeStyle} white-space: nowrap;">
                          ${p.daysDiff < 0 ? 'VENCIDO' : `${p.daysDiff} dias`}
                        </span>
                      </div>
                      <div style="font-size: 0.74rem; color: #94a3b8;">
                        Lote: <span style="color: #cbd5e1; font-family: monospace;">${p.batch || 'N/A'}</span> • 
                        Validade: <strong style="color: #fff;">${new Date(p.expiry_date).toLocaleDateString('pt-BR')}</strong>
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 0.78rem;">
                        <span style="color: #34d399; font-weight: 700;">Saldo: ${p.current_stock || 0} un</span>
                        <span style="color: #38bdf8;">R$ ${(parseFloat(p.sale_price || 0)).toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>

                    <div style="display: flex; gap: 6px; margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06);">
                      ${p.daysDiff <= 60 && p.daysDiff >= 0 ? `
                        <button type="button" class="btn-promo-lot" data-id="${p.id}" style="flex: 1; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); color: #fbbf24; font-size: 0.72rem; font-weight: 700; padding: 5px 8px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                          <i class="fa-solid fa-tags"></i> Promoção FEFO
                        </button>
                      ` : ''}
                      ${p.daysDiff < 0 ? `
                        <button type="button" class="btn-quarantine-lot" data-id="${p.id}" style="flex: 1; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); color: #f87171; font-size: 0.72rem; font-weight: 700; padding: 5px 8px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                          <i class="fa-solid fa-ban"></i> Quarentena Sanitária
                        </button>
                      ` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- SEÇÃO: PREVISÃO INTELIGENTE DE REPOSIÇÃO & COMPRAS -->
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
            <div>
              <strong style="color: #fff; font-size: 0.95rem; font-family: 'Outfit'; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-truck-ramp-box" style="color: #38bdf8;"></i> Previsão de Reposição &amp; Ponto de Pedido
              </strong>
              <small style="color: #94a3b8; display: block; margin-top: 2px;">
                Cálculo baseado no consumo médio diário (últimos 30 dias) e cobertura de estoque (Runway).
              </small>
            </div>

            <button type="button" id="btn-export-purchase-list" class="btn" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: none; padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 0.78rem; display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <i class="fa-solid fa-file-arrow-down"></i> Exportar Lista de Compras
            </button>
          </div>

          <div style="overflow-x: auto;">
            <table class="patients-table" style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
              <thead>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); text-align: left; color: #94a3b8; font-size: 0.72rem; text-transform: uppercase;">
                  <th style="padding: 8px;">Medicamento / Produto</th>
                  <th style="padding: 8px; text-align: center;">Saldo Atual</th>
                  <th style="padding: 8px; text-align: center;">Mínimo</th>
                  <th style="padding: 8px; text-align: center;">Consumo/Dia</th>
                  <th style="padding: 8px; text-align: center;">Cobertura (Dias)</th>
                  <th style="padding: 8px; text-align: center;">Status</th>
                  <th style="padding: 8px; text-align: center; color: #38bdf8;">Sugestão Compra</th>
                </tr>
              </thead>
              <tbody>
                ${replenishmentList.slice(0, 15).map(r => `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                    <td style="padding: 8px; color: #fff; font-weight: 600;">
                      ${r.product.name}
                      <small style="display: block; color: #94a3b8; font-size: 0.7rem;">EAN: ${r.product.ean || 'N/A'}</small>
                    </td>
                    <td style="padding: 8px; text-align: center; font-weight: 700; color: ${r.currentStock <= r.minStock ? '#f87171' : '#34d399'};">
                      ${r.currentStock} un
                    </td>
                    <td style="padding: 8px; text-align: center; color: #94a3b8;">${r.minStock} un</td>
                    <td style="padding: 8px; text-align: center; color: #cbd5e1;">${r.dailyConsumption} un/dia</td>
                    <td style="padding: 8px; text-align: center; font-weight: 700; color: ${r.runwayDays <= 15 ? '#fbbf24' : '#cbd5e1'};">
                      ${r.runwayDays > 100 ? '+100d' : `${r.runwayDays} dias`}
                    </td>
                    <td style="padding: 8px; text-align: center;">
                      <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 6px; ${r.badgeStyle}">
                        ${r.statusLabel}
                      </span>
                    </td>
                    <td style="padding: 8px; text-align: center; font-weight: 800; color: #38bdf8; font-family: monospace; font-size: 0.9rem;">
                      ${r.suggestedBuy > 0 ? `+${r.suggestedBuy} un` : '—'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    // Listeners dos cards de filtro
    container.querySelectorAll('.fefo-filter-card').forEach(card => {
      card.addEventListener('click', () => {
        currentFefoFilter = card.dataset.filter;
        renderFEFOPanel(products);
      });
    });

    // Listener Promoção FEFO
    container.querySelectorAll('.btn-promo-lot').forEach(btn => {
      btn.addEventListener('click', () => {
        const prod = products.find(p => p.id === btn.dataset.id);
        if (prod) openPromoDiscountModal(prod, loadInventoryData);
      });
    });

    // Listener Quarentena
    container.querySelectorAll('.btn-quarantine-lot').forEach(btn => {
      btn.addEventListener('click', () => {
        const prod = products.find(p => p.id === btn.dataset.id);
        if (prod) openQuarantineModal(prod, loadInventoryData);
      });
    });

    // Listener Exportar Compras
    container.querySelector('#btn-export-purchase-list')?.addEventListener('click', () => {
      const needed = replenishmentList.filter(r => r.suggestedBuy > 0);
      if (needed.length === 0) {
        showToast('✅ Todos os produtos possuem estoque saudável. Nenhuma compra necessária.');
        return;
      }

      let csv = 'Medicamento/Produto;EAN;Saldo Atual;Estoque Minimo;Consumo Mensal;Sugestao de Compra\n';
      needed.forEach(n => {
        csv += `"${n.product.name}";"${n.product.ean || ''}";${n.currentStock};${n.minStock};${n.monthlyConsumption};${n.suggestedBuy}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Pedido_Reposicao_Estoque_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('📄 Lista de reposição exportada com sucesso!');
    });
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

  document.getElementById('btn-quick-import-nfe')?.addEventListener('click', () => {
    openNFeImporterModal();
  });

  document.getElementById('btn-quick-sngpc')?.addEventListener('click', () => {
    openSngpcBookModal();
  });

  document.getElementById('btn-quick-cash-register')?.addEventListener('click', () => {
    openCashRegisterModal(() => {
      loadInventoryData();
    });
  });

  document.getElementById('btn-quick-stock-intelligence')?.addEventListener('click', () => {
    const fefoCard = document.getElementById('accordion-group-fefo');
    const fefoBody = document.getElementById('body-fefo');
    const chevron = fefoCard?.querySelector('.cfg-chevron-btn');
    if (fefoBody) {
      fefoBody.style.display = 'block';
      fefoCard?.classList.add('open');
      if (chevron) chevron.style.transform = 'rotate(0deg)';
      fefoBody.scrollIntoView({ behavior: 'smooth' });
    }
  });

  document.getElementById('btn-quick-stock-checkout')?.addEventListener('click', () => {
    openQuickCheckoutModal(() => {
      loadInventoryData();
    });
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
      document.getElementById('entry-barcode-scan-input')?.focus();
    }
  });

  // Lógica de Leitura por Código de Barras na Entrada de Lotes
  const handleEntryBarcodeScan = (scannedEan) => {
    const rawEan = (scannedEan || '').trim();
    if (!rawEan) return;

    const products = localDB.list('products') || [];
    const found = products.find(p => p.ean === rawEan || p.id === rawEan || (p.ean && p.ean.endsWith(rawEan)));

    if (found) {
      playBeepSound('success');
      const selectEl = document.getElementById('entry-product-id');
      if (selectEl) {
        selectEl.value = found.id;
        document.getElementById('entry-cost-price').value = found.cost_price || '';
        document.getElementById('entry-sale-price').value = found.sale_price || '';
        document.getElementById('entry-batch').value = found.batch || `L-${Math.floor(10000 + Math.random() * 90000)}`;
        if (found.expiry_date) document.getElementById('entry-expiry').value = found.expiry_date;
      }
      showToast(`📦 Produto localizado: ${found.name} (Saldo: ${found.current_stock || 0} un). Digite a quantidade recebida.`);
      const qtyInput = document.getElementById('entry-quantity');
      if (qtyInput) {
        qtyInput.focus();
        qtyInput.select();
      }
    } else {
      playBeepSound('error');
      showCustomConfirm({
        title: 'Produto Não Encontrado',
        message: `O código de barras <strong>${rawEan}</strong> ainda não está cadastrado no catálogo de estoque.<br><br>Deseja cadastrar este novo produto agora?`,
        confirmText: 'Cadastrar Novo Produto',
        cancelText: 'Cancelar',
        type: 'warning'
      }).then(confirmed => {
        if (confirmed) {
          openProductModal({ ean: rawEan }, () => {
            loadInventoryData();
          });
        }
      });
    }

    const scanInput = document.getElementById('entry-barcode-scan-input');
    if (scanInput) scanInput.value = '';
  };

  document.getElementById('entry-barcode-scan-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEntryBarcodeScan(e.target.value);
    }
  });

  document.getElementById('btn-entry-camera-scan')?.addEventListener('click', () => {
    openCameraBarcodeScanner((scannedEan) => {
      handleEntryBarcodeScan(scannedEan);
    }, {
      title: 'Entrada de Estoque por Câmera',
      subtitle: 'Aponte a câmera para o código EAN do produto a ser recebido'
    });
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

    if (typeof window.showFlowCompletionNotification === 'function') {
      window.showFlowCompletionNotification({
        flowType: 'completed',
        badgeText: 'FLUXO DE ENTRADA DE ESTOQUE CONCLUÍDO',
        badgeIcon: 'fa-circle-check',
        icon: 'fa-boxes-stacked',
        actionTitle: `📦 Entrada Registrada: ${prod.name}`,
        message: `Foram adicionadas <strong>${quantity} unidades</strong> (Lote: ${batch || 'Padrão'}). Novo saldo físico: <strong>${newStock} un</strong>.`,
        targetTab: 'farmacia',
        targetTabLabel: 'Farmácia & Estoque',
        actionButtonText: 'Ver no Catálogo >'
      });
    }

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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <label class="form-label" for="p-ean" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem; margin: 0;">Código EAN / Barras:</label>
              <button type="button" id="btn-scan-product-ean" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                <i class="fa-solid fa-camera"></i> Escanear
              </button>
            </div>
            <input type="text" id="p-ean" class="form-input" value="${productToEdit ? (productToEdit.ean || '') : ''}" placeholder="7890000000000" style="font-family: monospace;">
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

  document.getElementById('btn-scan-product-ean')?.addEventListener('click', () => {
    openCameraBarcodeScanner((scannedEan) => {
      const eanField = document.getElementById('p-ean');
      if (eanField) {
        eanField.value = scannedEan;
        showToast(`📷 Código EAN "${scannedEan}" capturado com sucesso!`);
      }
    }, {
      title: 'Escanear Código de Barras do Produto',
      subtitle: 'Aponte a câmera para o código EAN da caixa do produto'
    });
  });

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
      if (typeof window.showFlowCompletionNotification === 'function') {
        window.showFlowCompletionNotification({
          flowType: 'completed',
          badgeText: 'CADASTRO DE PRODUTO ATUALIZADO',
          badgeIcon: 'fa-circle-check',
          icon: 'fa-pen-to-square',
          actionTitle: `✓ Produto Atualizado: ${name}`,
          message: `Alterações salvas no catálogo de estoque com sucesso.`,
          targetTab: 'farmacia',
          targetTabLabel: 'Farmácia & Estoque',
          actionButtonText: 'Ver no Estoque >'
        });
      }
    } else {
      localDB.insert('products', {
        name, dci, ean, category, presentation, current_stock, min_stock, expiry_date, cost_price, sale_price,
        batch: `L-${Math.floor(10000 + Math.random() * 90000)}`,
        created_at: new Date().toISOString()
      });
      showToast('Novo produto cadastrado no catálogo!');
      if (typeof window.showFlowCompletionNotification === 'function') {
        window.showFlowCompletionNotification({
          flowType: 'completed',
          badgeText: 'NOVO PRODUTO CADASTRADO',
          badgeIcon: 'fa-circle-check',
          icon: 'fa-pills',
          actionTitle: `📦 Novo Item: ${name}`,
          message: `Produto inserido no catálogo com saldo inicial de <strong>${current_stock} un</strong>.`,
          targetTab: 'farmacia',
          targetTabLabel: 'Farmácia & Estoque',
          actionButtonText: 'Ver Catálogo >'
        });
      }
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

    if (typeof window.showFlowCompletionNotification === 'function') {
      window.showFlowCompletionNotification({
        flowType: 'completed',
        badgeText: 'FLUXO DE AJUSTE DE ESTOQUE CONCLUÍDO',
        badgeIcon: 'fa-circle-check',
        icon: 'fa-sliders',
        actionTitle: `⚖️ Saldo Ajustado: ${productName}`,
        message: `Saldo físico corrigido de <strong>${currentQty}</strong> para <strong>${newQty} un</strong> (${diff >= 0 ? '+' : ''}${diff} un). Motivo: ${reason}.`,
        targetTab: 'farmacia',
        targetTabLabel: 'Farmácia & Estoque',
        actionButtonText: 'Ver Kardex >'
      });
    }

    if (onSaved) onSaved();
  });
}
