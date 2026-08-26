// src/modules/thermalReceipt.js
// GERADOR E IMPRESSOR DE CUPOM TÉRMICO NÃO FISCAL & COMPROVANTE DE DISPENSAÇÃO FARMACÊUTICA (58mm e 80mm)

import { state } from '../state.js';
import * as localDB from '../localDB.js';

export function printThermalReceipt(saleData, paperWidth = '80mm') {
  const is58mm = paperWidth === '58mm';
  const widthPx = is58mm ? '210px' : '300px';
  const fontSize = is58mm ? '10px' : '12px';

  const settings = localDB.get('settings', 'main') || {};
  const pharmacyName = settings.clinic_name || settings.pharmacy_name || 'FARMÁCIA & CONSULTÓRIO CLÍNICO';
  const cnpj = settings.cnpj || '00.000.000/0001-99';
  const address = settings.address || 'Rua da Saúde, 100 - Centro';
  const phone = settings.phone || '(11) 99999-0000';
  const rtName = settings.rt_name || (state.user?.name ? `${state.user.name}` : 'Farmacêutico Responsável');
  const crf = settings.rt_crf || 'CRF-SP 00000';

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
      <div style="margin-bottom: 4px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 3px;">
        <div style="font-weight: bold; font-size: ${is58mm ? '9.5px' : '11.5px'}; text-transform: uppercase;">
          ${idx + 1}. ${name}
        </div>
        ${ean ? `<div style="font-size: 8px; color: #555;">EAN: ${ean}</div>` : ''}
        <div style="display: flex; justify-content: space-between; font-size: ${is58mm ? '9px' : '11px'};">
          <span>${qty} un x R$ ${price}</span>
          <strong>R$ ${subtotal}</strong>
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

  const receiptHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Cupom Térmico - ${saleId}</title>
      <style>
        @page {
          margin: 0;
          size: ${paperWidth} auto;
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          color: #000;
          background: #fff;
          margin: 0;
          padding: 8px 6px;
          width: ${widthPx};
          font-size: ${fontSize};
          line-height: 1.25;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .divider {
          border-top: 1px dashed #000;
          margin: 6px 0;
        }
        .bold { font-weight: bold; }
        .row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }
        .footer-note {
          font-size: ${is58mm ? '8px' : '9.5px'};
          text-align: center;
          margin-top: 8px;
          color: #222;
        }
      </style>
    </head>
    <body>
      <div class="text-center">
        <div class="bold" style="font-size: ${is58mm ? '12px' : '14px'};">${pharmacyName}</div>
        <div style="font-size: ${is58mm ? '8.5px' : '10px'};">${address}</div>
        <div style="font-size: ${is58mm ? '8.5px' : '10px'};">CNPJ: ${cnpj} • Tel: ${phone}</div>
        <div style="font-size: ${is58mm ? '8px' : '9.5px'};">RT: ${rtName} • ${crf}</div>
      </div>

      <div class="divider"></div>
      <div class="text-center bold" style="font-size: ${is58mm ? '10px' : '12px'};">
        COMPROVANTE DE DISPENSAÇÃO &amp; VENDA
      </div>
      <div class="text-center" style="font-size: ${is58mm ? '8.5px' : '10px'};">
        (NÃO É DOCUMENTO FISCAL)
      </div>
      <div class="divider"></div>

      <div class="row">
        <span>Protocolo: <strong>${saleId}</strong></span>
        <span>${dateStr.split(' ')[0]}</span>
      </div>
      <div class="row">
        <span>Hora: ${dateStr.split(' ')[1] || ''}</span>
        <span>Op: ${operator.split(' ')[0]}</span>
      </div>
      <div class="row">
        <span>Cliente: <strong>${clientName}</strong></span>
      </div>
      ${clientCpf ? `<div class="row"><span>${clientCpf}</span></div>` : ''}

      <div class="divider"></div>
      <div class="bold" style="margin-bottom: 4px;">ITENS DISPENSADOS / PRODUTOS:</div>
      ${itemsHtml}

      <div class="divider"></div>
      <div class="row">
        <span>SUBTOTAL:</span>
        <span>R$ ${subtotalGross}</span>
      </div>
      ${parseFloat(saleData.discount || 0) > 0 ? `
        <div class="row" style="color: #000;">
          <span>DESCONTO:</span>
          <span>- R$ ${discountVal}</span>
        </div>
      ` : ''}
      <div class="row bold" style="font-size: ${is58mm ? '12px' : '14px'}; margin: 4px 0;">
        <span>TOTAL A PAGAR:</span>
        <span>R$ ${totalNet}</span>
      </div>
      <div class="divider"></div>

      <div class="row">
        <span>Forma Pagto:</span>
        <strong>${paymentMethod.toUpperCase()}</strong>
      </div>
      ${saleData.paymentMethod === 'Dinheiro' ? `
        <div class="row">
          <span>Valor Recebido:</span>
          <span>R$ ${paidVal}</span>
        </div>
        <div class="row">
          <span>Troco:</span>
          <strong>R$ ${changeVal}</strong>
        </div>
      ` : ''}

      <div class="divider"></div>
      <div class="footer-note">
        Farmacêutico: Promovendo o Uso Racional de Medicamentos.<br>
        Em caso de reações adversas, procure o farmacêutico.<br>
        <strong>Obrigado pela preferência!</strong>
      </div>
      <div class="divider"></div>
      <div class="text-center" style="font-size: 8px; color: #555;">
        CRM Clínico Farmacêutico v3.0
      </div>
    </body>
    </html>
  `;

  // Imprimir via iframe isolado
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
