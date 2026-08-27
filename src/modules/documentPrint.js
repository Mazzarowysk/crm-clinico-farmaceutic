// src/modules/documentPrint.js
// GERADOR E EXPORTADOR DIRETO DE DOCUMENTOS CLÍNICOS EM PDF & IMPRESSÃO LIMPA ISOLADA
// Suporta: DSF (Declaração de Serviço Farmacêutico), Guias Médicas, Prontuário e DRE

import { showToast } from './ui.js';

/**
 * Baixa o documento clínico diretamente em PDF sem abrir diálogos poluídos
 * @param {HTMLElement|string} targetElementOrId Elemento HTML ou ID do container
 * @param {string} filename Nome do arquivo PDF gerado
 */
export async function downloadDeclarationPDF(targetElementOrId, filename = 'Declaracao_Servico_Farmaceutico_DSF.pdf') {
  let element = typeof targetElementOrId === 'string' 
    ? document.getElementById(targetElementOrId) 
    : targetElementOrId;

  if (!element) {
    element = document.querySelector('.pharmacy-declaration-print') || document.getElementById('declaration-print-wrapper');
  }

  if (!element) {
    showToast('⚠️ Documento clínico não encontrado para exportação.', 'warning');
    return;
  }

  showToast('📄 Gerando PDF de alta resolução para download direto...');

  // Se a biblioteca html2pdf estiver disponível
  if (window.html2pdf) {
    try {
      const opt = {
        margin: [8, 8, 8, 8],
        filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          logging: false
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await window.html2pdf().set(opt).from(element).save();
      showToast('✅ Download do PDF concluído com sucesso!');
      return;
    } catch (err) {
      console.warn('Erro com html2pdf, tentando fallback via iframe:', err);
    }
  }

  // Fallback se html2pdf não estiver ativo no momento: Impressão isolada
  printIsolatedClinicalDocument(element.innerHTML || element.outerHTML, filename);
}

/**
 * Imprime somente a folha do laudo/declaração em janela/iframe isolado,
 * sem menus, cabeçalhos do CRM ou fundo escuro.
 * @param {string} htmlContent Conteúdo HTML do laudo
 * @param {string} title Título do documento
 */
export function printIsolatedClinicalDocument(htmlContent, title = 'Declaração de Serviço Farmacêutico') {
  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'fixed';
  printIframe.style.right = '0';
  printIframe.style.bottom = '0';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = '0';
  document.body.appendChild(printIframe);

  const doc = printIframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }
        body {
          font-family: 'Inter', -apple-system, sans-serif;
          color: #1e293b;
          background: #ffffff;
          margin: 0;
          padding: 6px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .pharmacy-declaration-print {
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          max-width: 100% !important;
        }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `);
  doc.close();

  printIframe.contentWindow.focus();
  setTimeout(() => {
    try {
      printIframe.contentWindow.print();
    } catch(e) {
      console.warn('Erro no comando print do iframe:', e);
    }
    setTimeout(() => printIframe.remove(), 2000);
  }, 400);
}
