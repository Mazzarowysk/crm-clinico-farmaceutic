// src/modules/nfeImporter.js
// MÓDULO DE IMPORTAÇÃO DE NOTA FISCAL ELETRÔNICA (NF-e XML 4.00 SEFAZ)
// ENTRADA AUTOMÁTICA DE ESTOQUE, RASTREABILIDADE DE LOTES, VALIDADES E PREÇOS DE CUSTO

import * as localDB from '../localDB.js';
import { state } from '../state.js';
import { showToast, showCustomAlert, showCustomConfirm } from './ui.js';
import { syncManager } from './sync.js';
import { playBeepSound } from './barcodeScanner.js';
import { formatCurrency } from './financialParams.js';

// Função para fazer o parse do arquivo XML da NF-e
export function parseNFeXML(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  // Verificar erros de parse
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Arquivo XML inválido ou corrompido.');
  }

  // Identificação da Nota
  const ide = xmlDoc.querySelector('ide');
  const emit = xmlDoc.querySelector('emit');
  const total = xmlDoc.querySelector('total ICMSTot');
  const infProt = xmlDoc.querySelector('infProt');

  const nNF = ide?.querySelector('nNF')?.textContent || 'S/N';
  const serie = ide?.querySelector('serie')?.textContent || '1';
  const dhEmi = ide?.querySelector('dhEmi')?.textContent || ide?.querySelector('dEmi')?.textContent || new Date().toISOString();
  const chNFe = infProt?.querySelector('chNFe')?.textContent || xmlDoc.querySelector('infNFe')?.getAttribute('Id')?.replace(/\D/g, '') || '';

  const emitente = {
    cnpj: emit?.querySelector('CNPJ')?.textContent || emit?.querySelector('CPF')?.textContent || '',
    razaoSocial: emit?.querySelector('xNome')?.textContent || 'Distribuidora Farmacêutica',
    fantasia: emit?.querySelector('xFant')?.textContent || '',
    uf: emit?.querySelector('enderEmit UF')?.textContent || ''
  };

  const vNF = parseFloat(total?.querySelector('vNF')?.textContent || '0');

  // Itens da Nota
  const detNodes = xmlDoc.querySelectorAll('det');
  const items = [];

  detNodes.forEach((det, index) => {
    const prod = det.querySelector('prod');
    const rastro = det.querySelector('rastro');
    const med = det.querySelector('med');

    const cProd = prod?.querySelector('cProd')?.textContent || '';
    const cEAN = prod?.querySelector('cEAN')?.textContent || prod?.querySelector('cEANTrib')?.textContent || '';
    const xProd = prod?.querySelector('xProd')?.textContent || 'Medicamento / Produto';
    const ncm = prod?.querySelector('NCM')?.textContent || '';
    const uCom = prod?.querySelector('uCom')?.textContent || 'UN';
    const qCom = parseFloat(prod?.querySelector('qCom')?.textContent || '1');
    const vUnCom = parseFloat(prod?.querySelector('vUnCom')?.textContent || '0');
    const vProd = parseFloat(prod?.querySelector('vProd')?.textContent || '0');

    // Dados de Rastreabilidade / Medicamento
    const nLote = rastro?.querySelector('nLote')?.textContent || med?.querySelector('nLote')?.textContent || `LT-${new Date().getFullYear()}${String(index + 1).padStart(3, '0')}`;
    const dVal = rastro?.querySelector('dVal')?.textContent || med?.querySelector('dVal')?.textContent || '';
    const dFab = rastro?.querySelector('dFab')?.textContent || med?.querySelector('dFab')?.textContent || '';
    const cProdANVISA = med?.querySelector('cProdANVISA')?.textContent || '';
    const vPMC = parseFloat(med?.querySelector('vPMC')?.textContent || '0');

    items.push({
      itemNumber: index + 1,
      code: cProd,
      ean: cEAN && cEAN !== 'SEM GTIN' ? cEAN : '',
      description: xProd,
      ncm,
      unit: uCom,
      quantity: qCom,
      unitCost: vUnCom,
      totalCost: vProd,
      batch: nLote,
      expiryDate: dVal,
      manufactureDate: dFab,
      anvisaCode: cProdANVISA,
      pmc: vPMC > 0 ? vPMC : (vUnCom * 1.5).toFixed(2),
      // Margem sugerida padrão de 45% sobre o custo
      suggestedPrice: (vUnCom * 1.45).toFixed(2)
    });
  });

  return {
    nNF,
    serie,
    dhEmi,
    chNFe,
    emitente,
    totalValue: vNF,
    itemsCount: items.length,
    items
  };
}

// Gera um exemplo de XML de NF-e para testes
export function generateSampleNFeXML() {
  const today = new Date().toISOString().split('T')[0];
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const nextTwoYears = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260812345678000199550010000849201000849201" versao="4.00">
      <ide>
        <nNF>84920</nNF>
        <serie>1</serie>
        <dhEmi>${today}T10:30:00-03:00</dhEmi>
        <tpNF>1</tpNF>
      </ide>
      <emit>
        <CNPJ>12345678000199</CNPJ>
        <xNome>DISTRIBUIDORA SANTA CRUZ MEDICAMENTOS S/A</xNome>
        <xFant>SANTA CRUZ DISTRIBUIDORA</xFant>
        <enderEmit>
          <UF>SP</UF>
        </enderEmit>
      </emit>
      <total>
        <ICMSTot>
          <vNF>1485.60</vNF>
        </ICMSTot>
      </total>
      <det nItem="1">
        <prod>
          <cProd>MED-00981</cProd>
          <cEAN>7896004701234</cEAN>
          <xProd>AMOXICILINA + CLAVULANATO DE POTASSIO 875MG/125MG COM 14 COMP</xProd>
          <NCM>30041011</NCM>
          <uCom>CX</uCom>
          <qCom>20.0000</qCom>
          <vUnCom>32.5000</vUnCom>
          <vProd>650.00</vProd>
          <rastro>
            <nLote>AMX26B09</nLote>
            <qLote>20.0000</qLote>
            <dFab>${today}</dFab>
            <dVal>${nextYear}</dVal>
          </rastro>
          <med>
            <cProdANVISA>1004301230012</cProdANVISA>
            <vPMC>58.90</vPMC>
          </med>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>MED-00442</cProd>
          <cEAN>7891058012345</cEAN>
          <xProd>DIPIRONA MONOIDRATADA 500MG/ML GOTAS 20ML</xProd>
          <NCM>30049099</NCM>
          <uCom>FR</uCom>
          <qCom>50.0000</qCom>
          <vUnCom>4.8000</vUnCom>
          <vProd>240.00</vProd>
          <rastro>
            <nLote>DIP26C04</nLote>
            <qLote>50.0000</qLote>
            <dFab>${today}</dFab>
            <dVal>${nextTwoYears}</dVal>
          </rastro>
          <med>
            <cProdANVISA>1018000450021</cProdANVISA>
            <vPMC>9.90</vPMC>
          </med>
        </prod>
      </det>
      <det nItem="3">
        <prod>
          <cProd>VAC-00012</cProd>
          <cEAN>7898901234567</cEAN>
          <xProd>VACINA INFLUENZA TETRAVALENTE (GRIPE) SERINGA PREENCHIDA 0.5ML</xProd>
          <NCM>30022000</NCM>
          <uCom>UN</uCom>
          <qCom>15.0000</qCom>
          <vUnCom>39.7000</vUnCom>
          <vProd>595.60</vProd>
          <rastro>
            <nLote>FLU26T01</nLote>
            <qLote>15.0000</qLote>
            <dFab>${today}</dFab>
            <dVal>${nextYear}</dVal>
          </rastro>
          <med>
            <cProdANVISA>1130000120019</cProdANVISA>
            <vPMC>89.00</vPMC>
          </med>
        </prod>
      </det>
    </infNFe>
    <protNFe>
      <infProt>
        <chNFe>35260812345678000199550010000849201000849201</chNFe>
      </infProt>
    </protNFe>
  </NFe>
</nfeProc>`;
}

// Abre o Modal de Importação de NF-e
export function openNFeImporterModal() {
  const existing = document.getElementById('nfe-importer-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'nfe-importer-modal';
  modal.className = 'pep-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 15, 29, 0.88); backdrop-filter: blur(12px);
    display: flex; justify-content: center; align-items: center; z-index: 10014; padding: 16px;
  `;

  modal.innerHTML = `
    <div style="width: 100%; max-width: 900px; max-height: 90vh; background: #0f172a; border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 20px; box-shadow: 0 25px 60px rgba(0,0,0,0.9); display: flex; flex-direction: column; overflow: hidden;">
      
      <!-- Cabeçalho -->
      <div style="padding: 16px 20px; background: linear-gradient(135deg, rgba(2, 132, 199, 0.3), rgba(15, 23, 42, 0.8)); border-bottom: 1px solid rgba(56, 189, 248, 0.25); display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); display: flex; align-items: center; justify-content: center; color: #38bdf8; font-size: 1.25rem;">
            <i class="fa-solid fa-file-invoice-dollar"></i>
          </div>
          <div>
            <h3 style="margin: 0; font-family: 'Outfit'; font-size: 1.15rem; color: #fff; font-weight: 700;">
              Importador de NF-e (XML 4.00 SEFAZ)
            </h3>
            <small style="color: #94a3b8; font-size: 0.76rem;">
              Entrada Automática no Estoque, Rastreabilidade de Lotes, Validades e Preços de Custo
            </small>
          </div>
        </div>
        <button id="btn-close-nfe-modal" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Corpo com Área de Upload ou Pré-visualização -->
      <div style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px;">
        
        <!-- Dropzone de Arquivo XML -->
        <div id="nfe-dropzone" style="border: 2px dashed rgba(56, 189, 248, 0.4); background: rgba(30, 41, 59, 0.4); border-radius: 16px; padding: 28px 20px; text-align: center; cursor: pointer; transition: all 0.2s ease;">
          <input type="file" id="nfe-file-input" accept=".xml" style="display: none;">
          <i class="fa-solid fa-cloud-arrow-up" style="font-size: 2.4rem; color: #38bdf8; margin-bottom: 10px; display: block;"></i>
          <strong style="color: #fff; font-size: 0.98rem; display: block;">Clique para selecionar ou arraste o arquivo XML da NF-e aqui</strong>
          <span style="color: #94a3b8; font-size: 0.78rem; display: block; margin-top: 4px;">Padrão nacional NF-e 4.00 com tags &lt;rastro&gt; e &lt;med&gt;</span>
          <div style="margin-top: 14px;">
            <button type="button" id="btn-load-sample-nfe" style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.35); color: #38bdf8; font-size: 0.76rem; font-weight: 700; padding: 6px 14px; border-radius: 20px; cursor: pointer;">
              ⚡ Carregar Exemplo de NF-e Distribuidora (Teste)
            </button>
          </div>
        </div>

        <!-- Área de Pré-Visualização dos Itens da NF-e -->
        <div id="nfe-preview-container" style="display: none; flex-direction: column; gap: 14px;">
          
          <!-- Card de Dados da Nota -->
          <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
            <div>
              <span style="color: #94a3b8; font-size: 0.72rem; display: block;">Fornecedor / Emitente</span>
              <strong id="nfe-emit-name" style="color: #fff; font-size: 0.86rem; display: block;">-</strong>
              <small id="nfe-emit-cnpj" style="color: #64748b; font-size: 0.72rem;">CNPJ: -</small>
            </div>
            <div>
              <span style="color: #94a3b8; font-size: 0.72rem; display: block;">Número da NF-e / Série</span>
              <strong id="nfe-number" style="color: #38bdf8; font-size: 0.92rem; font-family: monospace;">-</strong>
              <small id="nfe-date" style="color: #64748b; font-size: 0.72rem;">Emissão: -</small>
            </div>
            <div>
              <span style="color: #94a3b8; font-size: 0.72rem; display: block;">Total da Nota Fiscal</span>
              <strong id="nfe-total" style="color: #34d399; font-size: 1.1rem; font-family: 'Outfit';">-</strong>
            </div>
            <div>
              <span style="color: #94a3b8; font-size: 0.72rem; display: block;">Total de Itens</span>
              <strong id="nfe-count" style="color: #fff; font-size: 0.95rem;">-</strong>
            </div>
          </div>

          <!-- Tabela de Itens da NF-e -->
          <div style="border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; background: #0b1120;">
            <div style="padding: 10px 14px; background: rgba(30, 41, 59, 0.8); border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center;">
              <strong style="font-size: 0.82rem; color: #fff;">📦 Itens &amp; Medicamentos da NF-e</strong>
              <span style="font-size: 0.72rem; color: #94a3b8;">Revise o preço de venda sugerido antes de confirmar</span>
            </div>
            
            <div style="max-height: 280px; overflow-y: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem; text-align: left;">
                <thead>
                  <tr style="background: rgba(15, 23, 42, 0.9); color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.08);">
                    <th style="padding: 8px 10px;">Item / Descrição</th>
                    <th style="padding: 8px 10px;">EAN / Código</th>
                    <th style="padding: 8px 10px;">Lote / Validade</th>
                    <th style="padding: 8px 10px; text-align: center;">Qtd</th>
                    <th style="padding: 8px 10px; text-align: right;">Custo Un.</th>
                    <th style="padding: 8px 10px; text-align: right;">Total Custo</th>
                    <th style="padding: 8px 10px; text-align: right;">Preço Venda</th>
                  </tr>
                </thead>
                <tbody id="nfe-items-table-body">
                  <!-- Injetado via JS -->
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      <!-- Rodapé com Ações -->
      <div style="padding: 14px 20px; background: rgba(15, 23, 42, 0.95); border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center;">
        <button type="button" id="btn-cancel-nfe" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 8px 16px; border-radius: 10px; font-weight: 600; font-size: 0.84rem; cursor: pointer;">
          Cancelar
        </button>

        <button type="button" id="btn-confirm-nfe-import" style="display: none; background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: none; padding: 9px 20px; border-radius: 10px; font-weight: 700; font-size: 0.86rem; cursor: pointer; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4); display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-file-import"></i> Efetivar Entrada no Estoque
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  let currentParsedNFe = null;

  const closeModal = () => modal.remove();
  document.getElementById('btn-close-nfe-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-nfe')?.addEventListener('click', closeModal);

  // Manipulação de Arquivo XML
  const dropzone = document.getElementById('nfe-dropzone');
  const fileInput = document.getElementById('nfe-file-input');

  dropzone?.addEventListener('click', (e) => {
    if (e.target.id !== 'btn-load-sample-nfe') {
      fileInput.click();
    }
  });

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          processXML(ev.target.result);
        } catch (err) {
          showCustomAlert({ title: 'Erro no XML', message: err.message, type: 'danger' });
        }
      };
      reader.readAsText(file);
    }
  });

  // Carregar NF-e Exemplo
  document.getElementById('btn-load-sample-nfe')?.addEventListener('click', () => {
    const sampleXML = generateSampleNFeXML();
    processXML(sampleXML);
  });

  // Processa o conteúdo XML e preenche a tela
  function processXML(xmlText) {
    try {
      const nfeData = parseNFeXML(xmlText);
      currentParsedNFe = nfeData;
      renderNFePreview(nfeData);
      playBeepSound('success');
      showToast(`✓ NF-e nº ${nfeData.nNF} carregada com sucesso!`);
    } catch (err) {
      showCustomAlert({
        title: 'Formato Inválido',
        message: 'Não foi possível ler o arquivo XML como uma NF-e válida da SEFAZ: ' + err.message,
        type: 'danger'
      });
    }
  }

  // Renderiza os dados no formulário de conferência
  function renderNFePreview(data) {
    const previewContainer = document.getElementById('nfe-preview-container');
    const confirmBtn = document.getElementById('btn-confirm-nfe-import');
    if (!previewContainer || !confirmBtn) return;

    document.getElementById('nfe-emit-name').textContent = data.emitente.razaoSocial;
    document.getElementById('nfe-emit-cnpj').textContent = `CNPJ: ${data.emitente.cnpj} (${data.emitente.uf})`;
    document.getElementById('nfe-number').textContent = `NF #${data.nNF} / Série ${data.serie}`;
    document.getElementById('nfe-date').textContent = `Emissão: ${new Date(data.dhEmi).toLocaleDateString('pt-BR')}`;
    document.getElementById('nfe-total').textContent = formatCurrency(data.totalValue);
    document.getElementById('nfe-count').textContent = `${data.itemsCount} produto(s)`;

    const tbody = document.getElementById('nfe-items-table-body');
    const existingProducts = localDB.list('products') || [];

    tbody.innerHTML = data.items.map((item, idx) => {
      const match = existingProducts.find(p => (item.ean && p.barcode === item.ean) || (p.name && p.name.toLowerCase().includes(item.description.toLowerCase().slice(0, 15))));
      const isNew = !match;

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); background: ${idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'};">
          <td style="padding: 10px;">
            <div style="font-weight: 700; color: #fff;">${item.description}</div>
            <div style="display: flex; gap: 6px; margin-top: 3px;">
              ${isNew ? `
                <span style="font-size: 0.65rem; background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-weight: 700;">+ NOVO CADASTRO</span>
              ` : `
                <span style="font-size: 0.65rem; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 6px; border-radius: 4px; font-weight: 700;">✓ VINCULADO AO ESTOQUE</span>
              `}
              ${item.anvisaCode ? `<span style="font-size: 0.65rem; color: #94a3b8;">MS: ${item.anvisaCode}</span>` : ''}
            </div>
          </td>
          <td style="padding: 10px; font-family: monospace; color: #94a3b8;">
            ${item.ean || item.code}
          </td>
          <td style="padding: 10px;">
            <div style="color: #fff; font-weight: 700; font-family: monospace;">${item.batch}</div>
            <small style="color: #fbbf24; font-size: 0.7rem;">Val: ${item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('pt-BR') : 'N/D'}</small>
          </td>
          <td style="padding: 10px; text-align: center; color: #34d399; font-weight: 800; font-size: 0.9rem;">
            ${item.quantity} <small style="font-size: 0.7rem; color: #94a3b8;">${item.unit}</small>
          </td>
          <td style="padding: 10px; text-align: right; color: #fff;">
            ${formatCurrency(item.unitCost)}
          </td>
          <td style="padding: 10px; text-align: right; color: #94a3b8; font-weight: 600;">
            ${formatCurrency(item.totalCost)}
          </td>
          <td style="padding: 10px; text-align: right;">
            <input type="number" step="0.01" class="nfe-sale-price-input" data-index="${idx}" value="${item.suggestedPrice}" style="width: 80px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; font-weight: 700; font-size: 0.8rem; text-align: right; padding: 4px 6px; border-radius: 6px;">
          </td>
        </tr>
      `;
    }).join('');

    previewContainer.style.display = 'flex';
    confirmBtn.style.display = 'flex';
  }

  // Efetivar Entrada no Estoque
  document.getElementById('btn-confirm-nfe-import')?.addEventListener('click', async () => {
    if (!currentParsedNFe) return;

    const confirmed = await showCustomConfirm({
      title: 'Confirmar Entrada de NF-e',
      message: `Deseja dar entrada em <strong>${currentParsedNFe.itemsCount} itens</strong> da NF-e nº <strong>${currentParsedNFe.nNF}</strong> no estoque da farmácia?`,
      confirmText: 'Sim, Efetivar Entrada',
      cancelText: 'Voltar',
      type: 'primary'
    });

    if (!confirmed) return;

    // Atualizar preços de venda editados
    document.querySelectorAll('.nfe-sale-price-input').forEach(input => {
      const idx = parseInt(input.dataset.index, 10);
      const val = parseFloat(input.value);
      if (!isNaN(val) && val > 0 && currentParsedNFe.items[idx]) {
        currentParsedNFe.items[idx].suggestedPrice = val;
      }
    });

    const products = localDB.list('products') || [];
    let addedCount = 0;
    let updatedCount = 0;

    currentParsedNFe.items.forEach(item => {
      // Procura produto existente por EAN ou nome
      const matchIndex = products.findIndex(p => (item.ean && p.barcode === item.ean) || (p.name && p.name.toLowerCase() === item.description.toLowerCase()));

      if (matchIndex >= 0) {
        // Atualiza produto existente
        products[matchIndex].quantity = (products[matchIndex].quantity || 0) + item.quantity;
        products[matchIndex].cost_price = item.unitCost;
        products[matchIndex].price = parseFloat(item.suggestedPrice);
        products[matchIndex].batch = item.batch;
        if (item.expiryDate) products[matchIndex].expiry_date = item.expiryDate;
        if (item.anvisaCode) products[matchIndex].ms_record = item.anvisaCode;
        localDB.update('products', products[matchIndex].id, products[matchIndex]);
        syncManager.pushChange('products', products[matchIndex].id, 'UPDATE', products[matchIndex]);
        updatedCount++;
      } else {
        // Cria novo produto
        const newProduct = {
          id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: item.description,
          barcode: item.ean || '',
          category: item.description.toUpperCase().includes('VACINA') ? 'Vacinas & Imunobiológicos' : 'Medicamentos',
          quantity: item.quantity,
          min_quantity: 5,
          cost_price: item.unitCost,
          price: parseFloat(item.suggestedPrice),
          batch: item.batch,
          expiry_date: item.expiryDate || '',
          ms_record: item.anvisaCode || '',
          unit: item.unit || 'UN',
          created_at: new Date().toISOString()
        };
        localDB.insert('products', newProduct);
        syncManager.pushChange('products', newProduct.id, 'CREATE', newProduct);
        addedCount++;
      }
    });

    // Salvar registro da NF-e importada
    const nfeRecord = {
      id: 'nfe_' + Date.now(),
      nNF: currentParsedNFe.nNF,
      serie: currentParsedNFe.serie,
      chNFe: currentParsedNFe.chNFe,
      emitente: currentParsedNFe.emitente,
      totalValue: currentParsedNFe.totalValue,
      itemsCount: currentParsedNFe.itemsCount,
      importedAt: new Date().toISOString(),
      operator: state.user?.name || 'Farmacêutico RT'
    };
    localDB.insert('nfe_purchases', nfeRecord);
    syncManager.pushChange('nfe_purchases', nfeRecord.id, 'CREATE', nfeRecord);

    playBeepSound('success');
    showCustomAlert({
      title: 'Entrada Efetivada com Sucesso!',
      message: `NF-e nº <strong>${currentParsedNFe.nNF}</strong> importada.<br>• <strong>${addedCount}</strong> novos produtos cadastrados.<br>• <strong>${updatedCount}</strong> produtos existentes atualizados no estoque.`,
      type: 'success'
    });

    closeModal();

    if (typeof window.showFlowCompletionNotification === 'function') {
      window.showFlowCompletionNotification({
        flowType: 'completed',
        badgeText: 'FLUXO DE IMPORTAÇÃO DE NF-E CONCLUÍDO',
        badgeIcon: 'fa-circle-check',
        icon: 'fa-file-invoice-dollar',
        actionTitle: `📦 NF-e nº ${currentParsedNFe.nNF} Importada`,
        message: `Entrada de <strong>${addedCount + updatedCount} produtos</strong> finalizada no estoque com rastreabilidade de lotes e validade.`,
        targetTab: 'farmacia',
        targetTabLabel: 'Farmácia & Estoque',
        actionButtonText: 'Ver no Estoque >'
      });
    }

    // Se estiver na aba estoque, recarrega a tabela
    if (state.activeTab === 'estoque' && window.switchTab) {
      window.switchTab('estoque');
    }
  });
}
