// src/modules/thermalReceipt.js
// GERADOR, VISUALIZADOR E IMPRESSOR DE CUPOM TÉRMICO NÃO FISCAL (58mm e 80mm) & COMPROVANTE DE DISPENSAÇÃO

import { state } from '../state.js';
import * as localDB from '../localDB.js';
import { showToast } from './ui.js';
import { formatCurrency } from './financialParams.js';

export function printThermalReceipt(saleData, paperWidth = '80mm') {
  const is58mm = paperWidth === '58mm';
  const widthPx = is58mm ? '230px' : '320px';
  const fontSize = is58mm ? '10px' : '12px';

  let settings = {};
  try {
    settings = localDB.get('settings', 'main') || localDB.getConfig() || {};
  } catch (e) {
    settings = localDB.getConfig ? localDB.getConfig() : {};
  }
  const pharmacyName = settings.clinic_name || settings.pharmacy_name || 'FARMÁCIA & CONSULTÓRIO CLÍNICO';
  const cnpj = settings.cnpj || '00.000.000/0001-99';
  const address = settings.address || 'Rua da Saúde, 100 - Centro';
  const phone = settings.phone || '(11) 99999-0000';
  const rtName = settings.rt_name || (state.user?.name ? `${state.user.name}` : 'Farmacêutico Responsável');
  const crf = settings.rt_crf || 'CRF-SP 54180';

  const saleId = saleData.protocol || `VD-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date(saleData.created_at || Date.now()).toLocaleString('pt-BR');
  const clientName = saleData.clientName || 'Consumidor Balcão';
  const clientCpf = saleData.clientCpf ? `CPF: ${saleData.clientCpf}` : '';
  const operator = saleData.operatorName || (state.user?.name || 'Operador');
  const paymentMethod = saleData.paymentMethod || 'Dinheiro / Balcão';

  const itemsHtml = (saleData.items || []).map((item, idx) => {
    const qty = item.quantity || 1;
    const price = formatCurrency(item.unitPrice || 0);
    const subtotal = formatCurrency(item.subtotal || (qty * (item.unitPrice || 0)));
    const name = item.product?.name || item.name || 'Produto';
    const ean = item.product?.ean || item.ean || '';

    return `
      <div style="margin-bottom: 5px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">
        <div style="font-weight: bold; font-size: ${is58mm ? '10px' : '12px'}; text-transform: uppercase; color: #0f172a;">
          ${idx + 1}. ${name}
        </div>
        ${ean ? `<div style="font-size: 8.5px; color: #64748b; font-family: monospace;">EAN: ${ean}</div>` : ''}
        <div style="display: flex; justify-content: space-between; font-size: ${is58mm ? '9.5px' : '11.5px'}; color: #334155; margin-top: 2px;">
          <span>${qty} un x ${price}</span>
          <strong style="color: #0f172a;">${subtotal}</strong>
        </div>
      </div>
    `;
  }).join('');

  const subtotalGross = formatCurrency(saleData.subtotalGross || saleData.totalSale || 0);
  const discountVal = formatCurrency(saleData.discount || 0);
  const totalNet = formatCurrency(saleData.totalSale || 0);
  const paidVal = formatCurrency(saleData.paidAmount || saleData.totalSale || 0);
  const changeVal = formatCurrency(saleData.change || 0);
  const receiptBodyHtml = `
    <div id="thermal-receipt-sheet" style="background: #fef08a; color: #000000; font-family: 'Courier New', Courier, monospace; width: 100%; max-width: ${widthPx}; margin: 0 auto; padding: 14px 12px; line-height: 1.3; font-size: ${fontSize}; box-sizing: border-box; box-shadow: 0 4px 14px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.08);">
      <div style="text-align: center; margin-bottom: 6px;">
        <div style="font-weight: 900; font-size: ${is58mm ? '13px' : '15px'}; text-transform: uppercase; letter-spacing: 0.5px; color: #000;">${pharmacyName}</div>
        <div style="font-size: ${is58mm ? '9px' : '10.5px'}; color: #111;">${address}</div>
        <div style="font-size: ${is58mm ? '9px' : '10.5px'}; color: #111;">CNPJ: ${cnpj} • Tel: ${phone}</div>
        <div style="font-size: ${is58mm ? '8.5px' : '10px'}; color: #222; margin-top: 2px;">RT: ${rtName} • ${crf}</div>
      </div>

      <div style="border-top: 1.5px dashed #000; margin: 6px 0;"></div>
      <div style="text-align: center; font-weight: 800; font-size: ${is58mm ? '11px' : '13px'}; letter-spacing: 0.5px; color: #000;">
        COMPROVANTE DE DISPENSAÇÃO &amp; VENDA
      </div>
      <div style="text-align: center; font-size: ${is58mm ? '8.5px' : '10px'}; color: #333;">
        (DOCUMENTO AUXILIAR NÃO FISCAL)
      </div>
      <div style="border-top: 1.5px dashed #000; margin: 6px 0;"></div>

      <div style="display: flex; justify-content: space-between; margin: 2px 0; color: #000;">
        <span>Protocolo: <strong>#${saleId}</strong></span>
        <span>${dateStr.split(' ')[0]}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 2px 0; color: #000;">
        <span>Hora: ${dateStr.split(' ')[1] || ''}</span>
        <span>Operador: ${operator.split(' ')[0]}</span>
      </div>
      <div style="margin: 2px 0; color: #000;">
        <span>Cliente: <strong>${clientName}</strong></span>
      </div>
      ${clientCpf ? `<div style="margin: 2px 0; color: #000;"><span>${clientCpf}</span></div>` : ''}

      <div style="border-top: 1.5px dashed #000; margin: 6px 0;"></div>
      <div style="font-weight: bold; margin-bottom: 6px; font-size: ${is58mm ? '10px' : '11.5px'}; color: #000;">ITENS DISPENSADOS / PRODUTOS:</div>
      ${itemsHtml}

      <div style="border-top: 1.5px dashed #000; margin: 6px 0;"></div>
      <div style="display: flex; justify-content: space-between; margin: 3px 0; color: #000;">
        <span>SUBTOTAL:</span>
        <span>R$ ${subtotalGross}</span>
      </div>
      ${parseFloat(saleData.discount || 0) > 0 ? `
        <div style="display: flex; justify-content: space-between; margin: 3px 0; color: #000;">
          <span>DESCONTO:</span>
          <span>- R$ ${discountVal}</span>
        </div>
      ` : ''}
      <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: ${is58mm ? '13px' : '15px'}; margin: 6px 0; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 4px 0; color: #000;">
        <span>TOTAL A PAGAR:</span>
        <span>R$ ${totalNet}</span>
      </div>

      <div style="display: flex; justify-content: space-between; margin: 3px 0; color: #000;">
        <span>Forma Pagto:</span>
        <strong style="text-transform: uppercase;">${paymentMethod}</strong>
      </div>
      ${saleData.paymentMethod === 'Dinheiro' ? `
        <div style="display: flex; justify-content: space-between; margin: 3px 0; color: #000;">
          <span>Valor Recebido:</span>
          <span>R$ ${paidVal}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 3px 0; color: #000;">
          <span>Troco:</span>
          <strong>R$ ${changeVal}</strong>
        </div>
      ` : ''}

      <div style="border-top: 1.5px dashed #000; margin: 8px 0 6px 0;"></div>
      <div style="font-size: ${is58mm ? '8.5px' : '10px'}; text-align: center; color: #111; line-height: 1.35;">
        Farmacêutico: Promovendo o Uso Racional de Medicamentos.<br>
        Em caso de reações adversas, procure o farmacêutico.<br>
        <strong>Agradecemos a preferência!</strong>
      </div>
      <div style="border-top: 1.5px dashed #000; margin: 6px 0;"></div>
      <div style="text-align: center; font-size: 8.5px; color: #333;">
        CRM Clínico Farmacêutico v3.0 • Sistema Autorizado
      </div>
    </div>
  `;

  // 1. Abre modal com a visualização realista do cupom na tela
  openReceiptPreviewModal(receiptBodyHtml, saleData, widthPx);

  // 2. Dispara a impressão imediatamente
  triggerPrintDocument(receiptBodyHtml, `Cupom_${saleId}`, paperWidth, saleData);
}

// Dispara o comando de impressão de forma confiável com barra de ferramentas
function triggerPrintDocument(receiptHtml, title = 'Cupom', paperWidth = '80mm', saleData = null) {
  const printWindow = window.open('', '_blank', 'width=460,height=680');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page { margin: 0; size: ${paperWidth} auto; }
          body { margin: 0; padding: 0; background: #334155; font-family: 'Courier New', Courier, monospace; display: flex; flex-direction: column; align-items: center; }
          .receipt-container { background: #fef08a !important; box-shadow: 0 4px 14px rgba(0,0,0,0.3); margin: 15px 0; border-radius: 4px; border: 1px solid #eab308; }
          @media print {
            body { background: #fef08a !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            .receipt-container { background: #fef08a !important; box-shadow: none; margin: 0; border: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="position: sticky; top: 0; width: 100%; background: #0f172a; padding: 10px 14px; border-bottom: 1px solid #334155; display: flex; justify-content: center; gap: 10px; z-index: 1000; box-sizing: border-box;">
          <button onclick="window.print()" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px;">
            🖨️ Imprimir
          </button>
          <button id="btn-popup-download-pdf" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px;">
            📥 Baixar PDF
          </button>
          <button onclick="window.close()" style="background: #475569; color: #fff; border: none; padding: 8px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">
            ✕ Fechar
          </button>
        </div>

        <div class="receipt-container">
          ${receiptHtml}
        </div>

        <script>
          document.getElementById('btn-popup-download-pdf')?.addEventListener('click', () => {
            if (window.opener && window.opener.exportThermalReceiptPDF) {
              window.opener.exportThermalReceiptPDF(${JSON.stringify(saleData || {})}, '${paperWidth}');
            } else {
              window.print();
            }
          });
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  }
}

// GERAÇÃO E DOWNLOAD DIRETO DO CUPOM EM ARQUIVO PDF (PAPEL AMARELO PADRÃO)
export function exportThermalReceiptPDF(saleData, paperWidth = '80mm') {
  if (!window.jspdf) {
    showToast('⚠️ jsPDF não disponível.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const is58 = paperWidth === '58mm';
  const widthMm = is58 ? 58 : 80;
  
  let settings = {};
  try {
    settings = localDB.get('settings', 'main') || localDB.getConfig() || {};
  } catch(e) {
    settings = localDB.getConfig ? localDB.getConfig() : {};
  }

  const pharmacyName = settings.clinic_name || settings.pharmacy_name || 'FARMÁCIA & CONSULTÓRIO CLÍNICO';
  const cnpj = settings.cnpj || '00.000.000/0001-99';
  const address = settings.address || 'Rua da Saúde, 100 - Centro';
  const phone = settings.phone || '(11) 99999-0000';
  const rtName = settings.rt_name || (state.user?.name ? `${state.user.name}` : 'Farmacêutico Responsável');
  const crf = settings.rt_crf || 'CRF-SP 54180';

  const saleId = saleData.protocol || `VD-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date(saleData.created_at || Date.now()).toLocaleString('pt-BR');
  const clientName = saleData.clientName || 'Consumidor Balcão';
  const clientCpf = saleData.clientCpf ? `CPF: ${saleData.clientCpf}` : '';
  const operator = saleData.operatorName || (state.user?.name || 'Operador');

  const items = saleData.items || [];
  const estimatedHeight = Math.max(130, 95 + (items.length * 14));

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [widthMm, estimatedHeight]
  });

  // Fundo Amarelo Padrão do Cupom Térmico (Papel Bobina Amarela)
  doc.setFillColor(254, 240, 138); // RGB #fef08a amarelo canário / bobina térmica
  doc.rect(0, 0, widthMm, estimatedHeight, 'F');
  doc.setTextColor(0, 0, 0);

  const center = widthMm / 2;
  let y = 6;

  // Cabeçalho
  doc.setFont('courier', 'bold');
  doc.setFontSize(is58 ? 8.5 : 10);
  doc.text(pharmacyName.toUpperCase(), center, y, { align: 'center' });
  y += 4;

  doc.setFont('courier', 'normal');
  doc.setFontSize(is58 ? 6.5 : 7.5);
  doc.text(address, center, y, { align: 'center' });
  y += 3.5;
  doc.text(`CNPJ: ${cnpj} • Tel: ${phone}`, center, y, { align: 'center' });
  y += 3.5;
  doc.text(`RT: ${rtName} • ${crf}`, center, y, { align: 'center' });
  y += 4;

  doc.text('------------------------------------------------', center, y, { align: 'center' });
  y += 3.5;

  doc.setFont('courier', 'bold');
  doc.setFontSize(is58 ? 7.5 : 8.5);
  doc.text('COMPROVANTE DE DISPENSAÇÃO & VENDA', center, y, { align: 'center' });
  y += 3;
  doc.setFont('courier', 'normal');
  doc.setFontSize(is58 ? 6 : 7);
  doc.text('(DOCUMENTO AUXILIAR NÃO FISCAL)', center, y, { align: 'center' });
  y += 3.5;

  doc.text('------------------------------------------------', center, y, { align: 'center' });
  y += 4;

  doc.text(`Protocolo: #${saleId}`, 4, y);
  doc.text(`${dateStr.split(' ')[0]}`, widthMm - 4, y, { align: 'right' });
  y += 3.5;
  doc.text(`Hora: ${dateStr.split(' ')[1] || ''}`, 4, y);
  doc.text(`Op: ${operator.split(' ')[0]}`, widthMm - 4, y, { align: 'right' });
  y += 3.5;
  doc.text(`Cliente: ${clientName.slice(0, 24)}`, 4, y);
  y += 3.5;
  if (clientCpf) {
    doc.text(clientCpf, 4, y);
    y += 3.5;
  }

  doc.text('------------------------------------------------', center, y, { align: 'center' });
  y += 4;

  doc.setFont('courier', 'bold');
  doc.text('ITENS DISPENSADOS / PRODUTOS:', 4, y);
  y += 4;

  doc.setFont('courier', 'normal');
  items.forEach((it, i) => {
    const name = it.product?.name || it.name || 'Produto';
    const qty = it.quantity || 1;
    const price = formatCurrency(it.unitPrice || 0);
    const sub = formatCurrency(it.subtotal || (qty * (it.unitPrice || 0)));

    doc.setFont('courier', 'bold');
    doc.text(`${i + 1}. ${name.slice(0, 28)}`, 4, y);
    y += 3.2;
    doc.setFont('courier', 'normal');
    doc.text(`   ${qty} un x ${price}`, 4, y);
    doc.text(`${sub}`, widthMm - 4, y, { align: 'right' });
    y += 3.8;
  });

  doc.text('------------------------------------------------', center, y, { align: 'center' });
  y += 4;

  const totalNet = formatCurrency(saleData.totalSale || 0);
  doc.setFont('courier', 'bold');
  doc.setFontSize(is58 ? 9 : 10.5);
  doc.text('TOTAL A PAGAR:', 4, y);
  doc.text(`${totalNet}`, widthMm - 4, y, { align: 'right' });
  y += 5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(is58 ? 6.5 : 7.5);
  doc.text(`Forma Pagto: ${saleData.paymentMethod || 'Dinheiro'}`, 4, y);
  y += 4;

  doc.text('------------------------------------------------', center, y, { align: 'center' });
  y += 3.5;

  doc.setFontSize(is58 ? 5.5 : 6.5);
  doc.text('Promovendo o Uso Racional de Medicamentos.', center, y, { align: 'center' });
  y += 3;
  doc.text('Agradecemos a sua preferência!', center, y, { align: 'center' });
  y += 3.5;
  doc.text('CRM Clínico Farmacêutico v3.0', center, y, { align: 'center' });

  doc.save(`cupom_venda_${saleId}.pdf`);
  showToast(`📥 Cupom #${saleId} baixado com sucesso em PDF!`);
}

// Modal com Visualização Realista do Cupom na Tela
function openReceiptPreviewModal(receiptHtml, saleData, widthPx) {
  const existing = document.getElementById('thermal-receipt-preview-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'thermal-receipt-preview-modal';
  modal.className = 'pep-modal';
  modal.style.cssText = `
    position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
    background: rgba(10, 15, 29, 0.94) !important; backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
    display: flex !important; justify-content: center !important; align-items: center !important;
    z-index: 999999 !important; padding: 16px !important; box-sizing: border-box !important;
  `;

  modal.innerHTML = `
    <div style="width: 100%; max-width: 480px; max-height: 94vh; display: flex; flex-direction: column; background: #0f172a; border: 1.5px solid rgba(16, 185, 129, 0.5); border-radius: 20px; padding: 18px; box-shadow: 0 25px 60px rgba(0,0,0,0.9); overflow: hidden;">
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px;">
        <h4 style="margin: 0; color: #fff; font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-receipt" style="color: #fbbf24;"></i> Cupom Térmico (Bobina Amarela)
        </h4>
        <button id="btn-close-receipt-preview" style="background: none; border: none; color: #94a3b8; font-size: 1.3rem; cursor: pointer; padding: 4px;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Papel do Cupom com Efeito Realista de Bobina Amarela -->
      <div style="flex: 1; overflow-y: auto; background: #1e293b; border-radius: 12px; padding: 16px; display: flex; justify-content: center;">
        <div style="background: #fef08a; box-shadow: 0 8px 24px rgba(0,0,0,0.4); border-radius: 4px; padding: 4px; width: 100%; max-width: ${widthPx}; border: 1px solid #eab308;">
          ${receiptHtml}
        </div>
      </div>

      <!-- Botões de Ação -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 14px;">
        <button type="button" id="btn-reprint-receipt" class="btn" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: none; padding: 10px 6px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);">
          <i class="fa-solid fa-print"></i> Imprimir
        </button>
        <button type="button" id="btn-download-pdf-receipt" class="btn" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 10px 6px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
          <i class="fa-solid fa-file-pdf"></i> Baixar PDF
        </button>
        <button type="button" id="btn-preview-whatsapp-receipt" class="btn" style="background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; border: none; padding: 10px 6px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer;">
          <i class="fa-brands fa-whatsapp"></i> WhatsApp
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('btn-close-receipt-preview')?.addEventListener('click', () => modal.remove());

  document.getElementById('btn-reprint-receipt')?.addEventListener('click', () => {
    triggerPrintDocument(receiptHtml, `Cupom_${saleData.protocol || 'VD'}`, widthPx.includes('230') ? '58mm' : '80mm', saleData);
  });

  document.getElementById('btn-download-pdf-receipt')?.addEventListener('click', () => {
    exportThermalReceiptPDF(saleData, widthPx.includes('230') ? '58mm' : '80mm');
  });

  document.getElementById('btn-preview-whatsapp-receipt')?.addEventListener('click', () => {
    const text = generateWhatsAppSaleText(saleData);
    const phone = (saleData.clientPhone || '').replace(/\D/g, '');
    const url = phone.length >= 10 
      ? `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  });
}

// MODAL DE DETALHES COMPLETOS DA VENDA & REEMISSÃO DE CUPOM
export function openSaleDetailsModal(saleOrTransaction) {
  if (!saleOrTransaction) return;

  let sale = saleOrTransaction;
  const allSales = localDB.list('sales') || [];

  if (typeof saleOrTransaction === 'string') {
    const fin = (localDB.list('financial_transactions') || []).find(t => t.id === saleOrTransaction);
    if (fin) {
      const protoMatch = fin.description?.match(/#VD-\d+/)?.[0]?.replace('#', '');
      sale = allSales.find(s => s.protocol === protoMatch || s.id === protoMatch) || {
        protocol: protoMatch || fin.id,
        clientName: fin.clientOrSupplier || 'Consumidor',
        totalSale: fin.amount,
        paymentMethod: fin.paymentMethod || 'Dinheiro',
        description: fin.description,
        items: [{ product: { name: fin.description.replace(/Venda #VD-\d+ — /, '') }, quantity: 1, unitPrice: fin.amount, subtotal: fin.amount }],
        created_at: fin.date || new Date().toISOString()
      };
    }
  }

  if (sale.protocol) {
    const matchedSale = allSales.find(s => s.protocol === sale.protocol || s.id === sale.protocol);
    if (matchedSale) sale = matchedSale;
  }

  const existing = document.getElementById('sale-details-modal');
  if (existing) existing.remove();

  const totalFormatted = formatCurrency(sale.totalSale || sale.amount || 0);
  const items = sale.items || [];

  const modal = document.createElement('div');
  modal.id = 'sale-details-modal';
  modal.className = 'pep-modal';
  modal.style.cssText = `
    position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
    background: rgba(10, 15, 29, 0.94) !important; backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
    display: flex !important; justify-content: center !important; align-items: center !important;
    z-index: 999999 !important; padding: 16px !important; box-sizing: border-box !important;
  `;

  modal.innerHTML = `
    <div style="width: 100%; max-width: 560px; max-height: 92vh; display: flex; flex-direction: column; background: #0f172a; border: 1.5px solid rgba(56, 189, 248, 0.5); border-radius: 20px; padding: 22px; box-shadow: 0 25px 60px rgba(0,0,0,0.9); overflow: hidden;">
      
      <!-- Cabeçalho -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(56, 189, 248, 0.2); border: 1px solid rgba(56, 189, 248, 0.4); display: flex; align-items: center; justify-content: center; color: #38bdf8; font-size: 1.2rem;">
            <i class="fa-solid fa-receipt"></i>
          </div>
          <div>
            <h3 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.2rem; color: #fff; font-weight: 700;">
              Detalhes da Venda &amp; Reemissão
            </h3>
            <div style="font-size: 0.78rem; color: #94a3b8;">
              Protocolo <strong style="color: #38bdf8;">#${sale.protocol || sale.id || 'VD'}</strong> &bull; ${new Date(sale.created_at || sale.date || Date.now()).toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
        <button id="btn-close-sale-details" style="background: none; border: none; color: #94a3b8; font-size: 1.3rem; cursor: pointer; padding: 4px;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Informações Principais -->
      <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px; margin-bottom: 14px; font-size: 0.84rem; color: #cbd5e1;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span>Cliente:</span>
          <strong style="color: #fff;">${sale.clientName || sale.clientOrSupplier || 'Consumidor Balcão'}</strong>
        </div>
        ${sale.clientCpf ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span>CPF:</span><span>${sale.clientCpf}</span></div>` : ''}
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span>Forma de Pagamento:</span>
          <strong style="color: #34d399;">${sale.paymentMethod || 'Dinheiro'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Operador:</span>
          <span>${sale.operatorName || 'Farmacêutico Responsável'}</span>
        </div>
      </div>

      <!-- Itens Dispensados -->
      <div style="flex: 1; overflow-y: auto; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 12px; margin-bottom: 14px;">
        <div style="font-size: 0.76rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-bottom: 8px;">Itens Adquiridos (${items.length}):</div>
        ${items.length === 0 ? `
          <div style="color: #cbd5e1; font-size: 0.82rem;">${sale.description || 'Medicamentos e produtos de balcão'}</div>
        ` : items.map((it, idx) => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed rgba(255,255,255,0.08); font-size: 0.82rem;">
            <div>
              <strong style="color: #f8fafc;">${idx + 1}. ${it.product?.name || it.name || 'Produto'}</strong>
              <div style="font-size: 0.72rem; color: #94a3b8;">${it.quantity || 1} un x ${formatCurrency(it.unitPrice || it.total_price || 0)}</div>
            </div>
            <strong style="color: #34d399;">${formatCurrency(it.subtotal || it.total_price || it.unitPrice || 0)}</strong>
          </div>
        `).join('')}
      </div>

      <!-- Total -->
      <div style="display: flex; justify-content: space-between; align-items: baseline; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 10px 14px; margin-bottom: 16px;">
        <span style="color: #f8fafc; font-weight: 700; font-size: 0.95rem;">TOTAL DA VENDA:</span>
        <span style="font-size: 1.45rem; font-weight: 800; color: #34d399; font-family: 'Outfit';">${totalFormatted}</span>
      </div>

      <!-- Ações de Reemissão -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <button type="button" id="btn-reemit-receipt-80mm" class="btn" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: none; padding: 10px; border-radius: 8px; font-weight: 700; font-size: 0.84rem; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer;">
          <i class="fa-solid fa-print"></i> Reemitir Cupom (80mm)
        </button>
        <button type="button" id="btn-reemit-receipt-58mm" class="btn" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; padding: 10px; border-radius: 8px; font-weight: 600; font-size: 0.84rem; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer;">
          <i class="fa-solid fa-receipt"></i> Mini Cupom (58mm)
        </button>
      </div>

      <button type="button" id="btn-reemit-whatsapp" class="btn" style="margin-top: 8px; background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; border: none; padding: 10px; border-radius: 8px; font-weight: 700; font-size: 0.86rem; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer;">
        <i class="fa-brands fa-whatsapp"></i> Reenviar Comprovante via WhatsApp
      </button>

    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('btn-close-sale-details')?.addEventListener('click', () => modal.remove());

  document.getElementById('btn-reemit-receipt-80mm')?.addEventListener('click', () => {
    printThermalReceipt(sale, '80mm');
  });

  document.getElementById('btn-reemit-receipt-58mm')?.addEventListener('click', () => {
    printThermalReceipt(sale, '58mm');
  });

  document.getElementById('btn-reemit-whatsapp')?.addEventListener('click', () => {
    const text = generateWhatsAppSaleText(sale);
    const phone = (sale.clientPhone || '').replace(/\D/g, '');
    const url = phone.length >= 10 
      ? `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  });
}

// Exportações Globais
if (typeof window !== 'undefined') {
  window.printThermalReceipt = printThermalReceipt;
  window.exportThermalReceiptPDF = exportThermalReceiptPDF;
  window.openSaleDetailsModal = openSaleDetailsModal;
  window.reprintSaleReceiptFromFin = function(id) {
    openSaleDetailsModal(id);
  };
  window.imprimirCupomTermicoEscPos = function(attOrId, patientObj, width = '80mm') {
    let att = attOrId;
    if (typeof attOrId === 'string') {
      const allAtts = (typeof localDB !== 'undefined' && localDB.list ? (localDB.list('pharmacy_attendances') || []).concat(localDB.list('pharmacy_consultations') || []) : []);
      att = allAtts.find(a => String(a.id) === String(attOrId)) || { id: attOrId };
    }
    printClinicalAttendanceReceipt(att, patientObj, width);
  };
}

/**
 * Emite Cupom Térmico ESC/POS (58mm / 80mm) para Atendimento Clínico Farmacêutico & DSF
 */
export function printClinicalAttendanceReceipt(attendance = {}, patientObj = null, paperWidth = '80mm') {
  const is58mm = paperWidth === '58mm';
  const widthPx = is58mm ? '230px' : '320px';
  const fontSize = is58mm ? '10px' : '12px';

  let settings = {};
  try {
    settings = localDB.get('settings', 'main') || localDB.getConfig() || {};
  } catch (e) {
    settings = {};
  }
  const pharmacyName = settings.pharmacy_name || settings.clinic_name || 'FARMÁCIA & CONSULTÓRIO CLÍNICO';
  const cnpj = settings.cnpj || '54.180.999/0001-44';
  const address = settings.address || 'Av. Brasil, 1500 - Centro';
  const phone = settings.phone || '(18) 3528-1000';
  const rtName = attendance.pharmacist_name || settings.rt_name || (state.user?.name || 'Farmacêutico Responsável');
  const crf = settings.crf || settings.rt_crf || 'CRF/SP 54.180';

  const patient = patientObj || {
    fullName: attendance.patient_name || attendance.patientName || 'Cliente Balcão',
    cpf: attendance.patient_cpf || 'Não informado'
  };

  const protocol = attendance.id ? `DSF-${attendance.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}` : `DSF-${Date.now().toString().slice(-6)}`;
  const dateStr = attendance.data_hora ? new Date(attendance.data_hora).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
  const queixa = attendance.queixa_triagem || attendance.complaint || 'Atendimento e Orientação Clínica';
  const prescricaoTxt = attendance.prescricao_mips || '';
  const mipsList = prescricaoTxt ? prescricaoTxt.split(/;|\n/).map(m => m.trim()).filter(Boolean) : (attendance.prescribedMIPs || []);

  const vitals = attendance.vitals || attendance.service_data || {};
  const hasVitals = vitals.pa || vitals.bloodPressure || vitals.glucose || vitals.glicemia || vitals.temperature || vitals.heartRate;

  const receiptHtml = `
    <div id="clinical-thermal-sheet" style="background: #fff; color: #000; font-family: 'Courier New', Courier, monospace; width: 100%; max-width: ${widthPx}; margin: 0 auto; padding: 14px 10px; line-height: 1.35; font-size: ${fontSize}; box-sizing: border-box; border: 1px solid #ddd; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
      <div style="text-align: center; margin-bottom: 6px;">
        <div style="font-weight: 900; font-size: ${is58mm ? '12px' : '14px'}; text-transform: uppercase;">${pharmacyName}</div>
        <div style="font-size: ${is58mm ? '8.5px' : '10px'};">${address}</div>
        <div style="font-size: ${is58mm ? '8.5px' : '10px'};">CNPJ: ${cnpj} • Tel: ${phone}</div>
        <div style="font-size: ${is58mm ? '8.5px' : '9.5px'}; margin-top: 2px;">RT: ${rtName} • ${crf}</div>
      </div>

      <div style="border-top: 1.5px dashed #000; margin: 6px 0;"></div>
      <div style="text-align: center; font-weight: 900; font-size: ${is58mm ? '11px' : '13px'};">
        CUPOM DE ATENDIMENTO CLÍNICO
      </div>
      <div style="text-align: center; font-size: ${is58mm ? '8px' : '9.5px'};">
        DECLARAÇÃO DE SERVIÇO FARMACÊUTICO (CFF 585/586)
      </div>
      <div style="border-top: 1.5px dashed #000; margin: 6px 0;"></div>

      <div style="display: flex; justify-content: space-between; margin: 2px 0;">
        <span>Protocolo: <strong>#${protocol}</strong></span>
        <span>${dateStr.split(' ')[0]}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 2px 0;">
        <span>Hora: ${dateStr.split(' ')[1] || ''}</span>
        <span>Farmacêutico: ${rtName.split(' ')[0]}</span>
      </div>
      <div style="margin: 2px 0;">
        <span>Paciente: <strong>${patient.fullName || patient.name}</strong></span>
      </div>
      ${patient.cpf ? `<div>CPF: ${patient.cpf}</div>` : ''}

      ${hasVitals ? `
        <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>
        <div style="font-weight: bold; margin-bottom: 3px;">SINAIS VITAIS / PARÂMETROS:</div>
        ${(vitals.pa || vitals.bloodPressure) ? `<div>• PA: <strong>${vitals.pa || vitals.bloodPressure} mmHg</strong></div>` : ''}
        ${(vitals.glucose || vitals.glicemia) ? `<div>• Glicemia: <strong>${vitals.glucose || vitals.glicemia} mg/dL</strong></div>` : ''}
        ${vitals.temperature ? `<div>• Temperatura: <strong>${vitals.temperature} °C</strong></div>` : ''}
        ${vitals.heartRate ? `<div>• Freq. Cardíaca: <strong>${vitals.heartRate} bpm</strong></div>` : ''}
      ` : ''}

      <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>
      <div style="font-weight: bold; margin-bottom: 3px;">QUEIXA / MOTIVO DA CONSULTA:</div>
      <div style="font-size: ${is58mm ? '9px' : '11px'}; margin-bottom: 4px;">${queixa}</div>

      ${mipsList.length > 0 ? `
        <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>
        <div style="font-weight: bold; margin-bottom: 4px;">MEDICAMENTOS & ORIENTAÇÕES:</div>
        ${mipsList.map((m, idx) => {
          const itemTitle = typeof m === 'object' ? (m.name || m.productName) : m;
          const posology = typeof m === 'object' ? (m.posology || m.directions || '') : '';
          return `
            <div style="margin-bottom: 4px;">
              <strong>${idx + 1}. ${itemTitle}</strong>
              ${posology ? `<div style="font-size: ${is58mm ? '8.5px' : '10px'}; font-style: italic;">↳ ${posology}</div>` : ''}
            </div>
          `;
        }).join('')}
      ` : ''}

      <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>
      <div style="font-size: ${is58mm ? '8px' : '9.5px'}; text-align: center; margin: 6px 0;">
        Prescrição de Medicamentos Isentos de Prescrição (MIPs) conforme Resolução CFF nº 586/2013.<br>
        Em caso de piora ou persistência dos sintomas, procure atendimento médico imediatamente.
      </div>

      <div style="border-top: 1.5px dashed #000; margin: 10px 0 6px 0;"></div>
      <div style="text-align: center; margin-top: 12px;">
        <div style="border-top: 1px solid #000; width: 80%; margin: 0 auto 3px auto;"></div>
        <div style="font-weight: bold; font-size: ${is58mm ? '9px' : '10.5px'};">${rtName}</div>
        <div style="font-size: ${is58mm ? '8px' : '9px'};">Farmacêutico(a) • ${crf}</div>
        <div style="font-size: 7.5px; margin-top: 3px; color: #444;">Assinatura Digital ICP-Brasil / GOV.BR</div>
      </div>
    </div>
  `;

  // Modal de impressão do Cupom
  const modal = document.createElement('div');
  modal.id = 'clinical-thermal-modal';
  modal.style.cssText = 'position: fixed; inset: 0; background: rgba(5,8,22,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100300; padding: 16px;';
  modal.innerHTML = `
    <div style="background: #0f172a; border: 1.5px solid #334155; border-radius: 16px; max-width: 480px; width: 100%; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.8);">
      <div style="padding: 14px 20px; background: #1e293b; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-weight: 700; color: #fff; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-receipt" style="color: #f59e0b;"></i> Impressão Térmica ESC/POS (${paperWidth})
        </div>
        <button type="button" onclick="document.getElementById('clinical-thermal-modal')?.remove()" style="background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div style="flex: 1; overflow-y: auto; padding: 16px; display: flex; justify-content: center; background: #080c16;">
        ${receiptHtml}
      </div>

      <div style="padding: 14px 20px; background: #1e293b; border-top: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
        <div style="display: flex; gap: 6px;">
          <button type="button" onclick="window.imprimirCupomTermicoEscPos('${attendance.id || ''}', null, '58mm')" style="background: ${is58mm ? '#0d9488' : '#334155'}; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer;">
            58mm
          </button>
          <button type="button" onclick="window.imprimirCupomTermicoEscPos('${attendance.id || ''}', null, '80mm')" style="background: ${!is58mm ? '#0d9488' : '#334155'}; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer;">
            80mm
          </button>
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" onclick="window.print()" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-print"></i> Imprimir Cupom
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('clinical-thermal-modal')?.remove();
  document.body.appendChild(modal);
}


// Gera mensagem formatada para envio do comprovante por WhatsApp
export function generateWhatsAppSaleText(saleData) {
  const saleId = saleData.protocol || `VD-${Date.now().toString().slice(-6)}`;
  const clientName = saleData.clientName || 'Cliente';
  const total = formatCurrency(saleData.totalSale || 0);
  const dateStr = new Date(saleData.created_at || Date.now()).toLocaleString('pt-BR');

  let text = `*COMPROVANTE DE DISPENSAÇÃO & VENDA* 🧾\n`;
  text += `*Protocolo:* #${saleId}\n`;
  text += `*Data/Hora:* ${dateStr}\n`;
  text += `*Cliente:* ${clientName}\n`;
  text += `----------------------------------------\n`;
  text += `*ITENS ADQUIRIDOS:*\n`;

  (saleData.items || []).forEach((item, i) => {
    const qty = item.quantity || 1;
    const sub = formatCurrency(item.subtotal || (qty * (item.unitPrice || 0)));
    text += `${i + 1}. ${item.product?.name || item.name} (${qty}x) = ${sub}\n`;
  });

  text += `----------------------------------------\n`;
  text += `*TOTAL PAGO:* ${total} (${saleData.paymentMethod || 'Dinheiro'})\n\n`;
  text += `💊 _Dúvidas sobre o uso dos medicamentos? Consulte nosso farmacêutico!_\n`;
  text += `Agradecemos a sua preferência!`;

  return text;
}
