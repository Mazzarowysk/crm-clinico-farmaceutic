// src/modules/thermalReceipt.js
// GERADOR, VISUALIZADOR E IMPRESSOR DE CUPOM TÉRMICO NÃO FISCAL (58mm e 80mm) & COMPROVANTE DE DISPENSAÇÃO

import { state } from '../state.js';
import * as localDB from '../localDB.js';
import { showToast } from './ui.js';

export function printThermalReceipt(saleData, paperWidth = '80mm') {
  const is58mm = paperWidth === '58mm';
  const widthPx = is58mm ? '230px' : '320px';
  const fontSize = is58mm ? '10px' : '12px';

  const settings = localDB.get('settings', 'main') || {};
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

  const itemsHtml = (saleData.items || []).map((item, idx) => {
    const qty = item.quantity || 1;
    const price = parseFloat(item.unitPrice || 0).toFixed(2).replace('.', ',');
    const subtotal = parseFloat(item.subtotal || (qty * item.unitPrice)).toFixed(2).replace('.', ',');
    const name = item.product?.name || item.name || 'Produto';
    const ean = item.product?.ean || item.ean || '';

    return `
      <div style="margin-bottom: 5px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">
        <div style="font-weight: bold; font-size: ${is58mm ? '10px' : '12px'}; text-transform: uppercase; color: #0f172a;">
          ${idx + 1}. ${name}
        </div>
        ${ean ? `<div style="font-size: 8.5px; color: #64748b; font-family: monospace;">EAN: ${ean}</div>` : ''}
        <div style="display: flex; justify-content: space-between; font-size: ${is58mm ? '9.5px' : '11.5px'}; color: #334155; margin-top: 2px;">
          <span>${qty} un x R$ ${price}</span>
          <strong style="color: #0f172a;">R$ ${subtotal}</strong>
        </div>
      </div>
    `;
  }).join('');

  const subtotalGross = parseFloat(saleData.subtotalGross || saleData.totalSale || 0).toFixed(2).replace('.', ',');
  const discountVal = parseFloat(saleData.discount || 0).toFixed(2).replace('.', ',');
  const totalNet = parseFloat(saleData.totalSale || 0).toFixed(2).replace('.', ',');
  const paidVal = parseFloat(saleData.paidAmount || saleData.totalSale || 0).toFixed(2).replace('.', ',');
  const changeVal = parseFloat(saleData.change || 0).toFixed(2).replace('.', ',');
  const paymentMethod = saleData.paymentMethod || 'Dinheiro';

  const receiptBodyHtml = `
    <div id="thermal-receipt-sheet" style="background: #ffffff; color: #000000; font-family: 'Courier New', Courier, monospace; width: 100%; max-width: ${widthPx}; margin: 0 auto; padding: 12px 10px; line-height: 1.3; font-size: ${fontSize}; box-sizing: border-box;">
      <div style="text-align: center; margin-bottom: 6px;">
        <div style="font-weight: 900; font-size: ${is58mm ? '13px' : '15px'}; text-transform: uppercase; letter-spacing: 0.5px;">${pharmacyName}</div>
        <div style="font-size: ${is58mm ? '9px' : '10.5px'}; color: #333;">${address}</div>
        <div style="font-size: ${is58mm ? '9px' : '10.5px'}; color: #333;">CNPJ: ${cnpj} • Tel: ${phone}</div>
        <div style="font-size: ${is58mm ? '8.5px' : '10px'}; color: #444; margin-top: 2px;">RT: ${rtName} • ${crf}</div>
      </div>

      <div style="border-top: 1.5px dashed #000; margin: 6px 0;"></div>
      <div style="text-align: center; font-weight: 800; font-size: ${is58mm ? '11px' : '13px'}; letter-spacing: 0.5px;">
        COMPROVANTE DE DISPENSAÇÃO &amp; VENDA
      </div>
      <div style="text-align: center; font-size: ${is58mm ? '8.5px' : '10px'}; color: #555;">
        (DOCUMENTO AUXILIAR NÃO FISCAL)
      </div>
      <div style="border-top: 1.5px dashed #000; margin: 6px 0;"></div>

      <div style="display: flex; justify-content: space-between; margin: 2px 0;">
        <span>Protocolo: <strong>#${saleId}</strong></span>
        <span>${dateStr.split(' ')[0]}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 2px 0;">
        <span>Hora: ${dateStr.split(' ')[1] || ''}</span>
        <span>Operador: ${operator.split(' ')[0]}</span>
      </div>
      <div style="margin: 2px 0;">
        <span>Cliente: <strong>${clientName}</strong></span>
      </div>
      ${clientCpf ? `<div style="margin: 2px 0;"><span>${clientCpf}</span></div>` : ''}

      <div style="border-top: 1.5px dashed #000; margin: 6px 0;"></div>
      <div style="font-weight: bold; margin-bottom: 6px; font-size: ${is58mm ? '10px' : '11.5px'};">ITENS DISPENSADOS / PRODUTOS:</div>
      ${itemsHtml}

      <div style="border-top: 1.5px dashed #000; margin: 6px 0;"></div>
      <div style="display: flex; justify-content: space-between; margin: 3px 0;">
        <span>SUBTOTAL:</span>
        <span>R$ ${subtotalGross}</span>
      </div>
      ${parseFloat(saleData.discount || 0) > 0 ? `
        <div style="display: flex; justify-content: space-between; margin: 3px 0;">
          <span>DESCONTO:</span>
          <span>- R$ ${discountVal}</span>
        </div>
      ` : ''}
      <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: ${is58mm ? '13px' : '15px'}; margin: 6px 0; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 0;">
        <span>TOTAL A PAGAR:</span>
        <span>R$ ${totalNet}</span>
      </div>

      <div style="display: flex; justify-content: space-between; margin: 3px 0;">
        <span>Forma Pagto:</span>
        <strong style="text-transform: uppercase;">${paymentMethod}</strong>
      </div>
      ${saleData.paymentMethod === 'Dinheiro' ? `
        <div style="display: flex; justify-content: space-between; margin: 3px 0;">
          <span>Valor Recebido:</span>
          <span>R$ ${paidVal}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 3px 0;">
          <span>Troco:</span>
          <strong>R$ ${changeVal}</strong>
        </div>
      ` : ''}

      <div style="border-top: 1.5px dashed #000; margin: 8px 0 6px 0;"></div>
      <div style="font-size: ${is58mm ? '8.5px' : '10px'}; text-align: center; color: #222; line-height: 1.35;">
        Farmacêutico: Promovendo o Uso Racional de Medicamentos.<br>
        Em caso de reações adversas, procure o farmacêutico.<br>
        <strong>Agradecemos a preferência!</strong>
      </div>
      <div style="border-top: 1.5px dashed #000; margin: 6px 0;"></div>
      <div style="text-align: center; font-size: 8.5px; color: #666;">
        CRM Clínico Farmacêutico v3.0 • Sistema Autorizado
      </div>
    </div>
  `;

  // 1. Abre modal com a visualização realista do cupom na tela
  openReceiptPreviewModal(receiptBodyHtml, saleData, widthPx);

  // 2. Dispara a impressão imediatamente
  triggerPrintDocument(receiptBodyHtml, `Cupom_${saleId}`, paperWidth);
}

// Dispara o comando de impressão de forma confiável
function triggerPrintDocument(receiptHtml, title = 'Cupom', paperWidth = '80mm') {
  const printWindow = window.open('', '_blank', 'width=420,height=650');
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
          body { margin: 0; padding: 0; background: #fff; font-family: 'Courier New', Courier, monospace; }
        </style>
      </head>
      <body>
        ${receiptHtml}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
      } catch(e) {
        console.warn('Erro ao disparar printWindow.print():', e);
      }
    }, 300);
  } else {
    // Fallback via iframe com dimensões ativas
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '10px';
    iframe.style.bottom = '10px';
    iframe.style.width = '350px';
    iframe.style.height = '500px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0.01';
    iframe.style.zIndex = '999999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page { margin: 0; size: ${paperWidth} auto; }
          body { margin: 0; padding: 0; background: #fff; }
        </style>
      </head>
      <body>
        ${receiptHtml}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => iframe.remove(), 2500);
    }, 350);
  }
}

// Modal com Visualização Realista do Cupom na Tela
function openReceiptPreviewModal(receiptHtml, saleData, widthPx) {
  const existing = document.getElementById('thermal-receipt-preview-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'thermal-receipt-preview-modal';
  modal.className = 'pep-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 15, 29, 0.92); backdrop-filter: blur(16px);
    display: flex; justify-content: center; align-items: center; z-index: 10005; padding: 16px;
  `;

  modal.innerHTML = `
    <div style="width: 100%; max-width: 460px; max-height: 94vh; display: flex; flex-direction: column; background: #0f172a; border: 1.5px solid rgba(16, 185, 129, 0.5); border-radius: 20px; padding: 18px; box-shadow: 0 25px 60px rgba(0,0,0,0.9); overflow: hidden;">
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px;">
        <h4 style="margin: 0; color: #fff; font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-receipt" style="color: #38bdf8;"></i> Visualização do Cupom Térmico
        </h4>
        <button id="btn-close-receipt-preview" style="background: none; border: none; color: #94a3b8; font-size: 1.3rem; cursor: pointer; padding: 4px;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Papel do Cupom com Efeito Realista -->
      <div style="flex: 1; overflow-y: auto; background: #334155; border-radius: 12px; padding: 16px; display: flex; justify-content: center;">
        <div style="background: #ffffff; box-shadow: 0 8px 24px rgba(0,0,0,0.4); border-radius: 4px; padding: 8px; width: 100%; max-width: ${widthPx};">
          ${receiptHtml}
        </div>
      </div>

      <!-- Botões de Ação -->
      <div style="display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap;">
        <button type="button" id="btn-reprint-receipt" class="btn" style="flex: 1; background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: none; padding: 10px; border-radius: 8px; font-weight: 700; font-size: 0.86rem; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);">
          <i class="fa-solid fa-print"></i> Imprimir Cupom
        </button>
        <button type="button" id="btn-preview-whatsapp-receipt" class="btn" style="flex: 1; background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 10px; border-radius: 8px; font-weight: 700; font-size: 0.86rem; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
          <i class="fa-brands fa-whatsapp"></i> WhatsApp
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('btn-close-receipt-preview')?.addEventListener('click', () => modal.remove());

  document.getElementById('btn-reprint-receipt')?.addEventListener('click', () => {
    triggerPrintDocument(receiptHtml, `Cupom_${saleData.protocol || 'VD'}`, widthPx.includes('230') ? '58mm' : '80mm');
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

// Gera mensagem formatada para envio do comprovante por WhatsApp
export function generateWhatsAppSaleText(saleData) {
  const saleId = saleData.protocol || `VD-${Date.now().toString().slice(-6)}`;
  const clientName = saleData.clientName || 'Cliente';
  const total = parseFloat(saleData.totalSale || 0).toFixed(2).replace('.', ',');
  const dateStr = new Date(saleData.created_at || Date.now()).toLocaleString('pt-BR');

  let text = `*COMPROVANTE DE DISPENSAÇÃO & VENDA* 🧾\n`;
  text += `*Protocolo:* #${saleId}\n`;
  text += `*Data/Hora:* ${dateStr}\n`;
  text += `*Cliente:* ${clientName}\n`;
  text += `----------------------------------------\n`;
  text += `*ITENS ADQUIRIDOS:*\n`;

  (saleData.items || []).forEach((item, i) => {
    const qty = item.quantity || 1;
    const sub = parseFloat(item.subtotal || (qty * item.unitPrice)).toFixed(2).replace('.', ',');
    text += `${i + 1}. ${item.product?.name || item.name} (${qty}x) = R$ ${sub}\n`;
  });

  text += `----------------------------------------\n`;
  text += `*TOTAL PAGO:* R$ ${total} (${saleData.paymentMethod || 'Dinheiro'})\n\n`;
  text += `💊 _Dúvidas sobre o uso dos medicamentos? Consulte nosso farmacêutico!_\n`;
  text += `Agradecemos a sua preferência!`;

  return text;
}
