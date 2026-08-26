// src/modules/sngpc.js
// MÓDULO SNGPC / ANVISA: ESCRITURAÇÃO DE CONTROLADOS (PORTARIA 344/98) E ANTIMICROBIANOS (RDC 20/2011)

import * as localDB from '../localDB.js';
import { state } from '../state.js';
import { showToast, showCustomAlert, showCustomConfirm } from './ui.js';
import { syncManager } from './sync.js';

// Listas de Controle Especial conforme Portaria 344/98
export const SNGPC_LISTS = {
  A1_A2: { code: 'A1/A2', name: 'Entorpecentes (Notificação A - Amarela)', validDays: 30 },
  A3: { code: 'A3', name: 'Psicotrópicos (Notificação A - Amarela)', validDays: 30 },
  B1: { code: 'B1', name: 'Psicotrópicos (Notificação B - Azul)', validDays: 30 },
  B2: { code: 'B2', name: 'Anorexígenos (Notificação B2 - Azul)', validDays: 30 },
  C1: { code: 'C1', name: 'Controle Especial em 2 Vias (Branca)', validDays: 30 },
  C2: { code: 'C2', name: 'Retinóides (Notificação Especial)', validDays: 30 },
  C5: { code: 'C5', name: 'Anabolizantes (Receita em 2 Vias)', validDays: 30 },
  ANTIMICROBIANO: { code: 'AM', name: 'Antimicrobianos (RDC 20/2011 - 2 Vias)', validDays: 10 }
};

// Registra uma nova dispensação de medicamento controlado
export function registerSngpcDispensation(data) {
  const settings = localDB.get('settings', 'main') || {};
  const currentUser = state.user || {};

  const record = {
    id: `SNGPC-${Date.now()}`,
    protocol: `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
    prescription_type: data.prescriptionType,
    notification_number: data.notificationNumber || 'S/N',
    prescription_date: data.prescriptionDate,
    dispensation_date: data.dispensationDate || new Date().toISOString().slice(0, 10),
    prescriber: {
      name: data.prescriberName,
      council: data.prescriberCouncil || 'CRM',
      number: data.prescriberNumber,
      uf: data.prescriberUf
    },
    buyer: {
      name: data.buyerName,
      doc_type: data.buyerDocType || 'RG',
      doc_number: data.buyerDocNumber,
      doc_issuer: data.buyerDocIssuer || 'SSP',
      doc_uf: data.buyerDocUf || 'SP'
    },
    patient: {
      name: data.patientName,
      age: data.patientAge || null,
      gender: data.patientGender || 'M',
      cpf: data.patientCpf || ''
    },
    medication: {
      product_id: data.productId,
      name: data.productName,
      ms_registry: (data.msRegistry || '1000000000000').replace(/\D/g, ''),
      batch: data.batch,
      quantity: parseInt(data.quantity || 1, 10),
      prolonged_use: !!data.prolongedUse
    },
    pharmacist_rt: {
      name: settings.pharmacist_rt || currentUser.name || 'Farmacêutico RT',
      crf: settings.pharmacist_crf || currentUser.crf || '00000/UF',
      cpf: settings.pharmacist_cpf || '000.000.000-00'
    },
    created_at: new Date().toISOString()
  };

  localDB.insert('sngpc_dispensations', record);

  // Dar baixa automática no estoque do produto
  if (data.productId) {
    const prod = localDB.get('products', data.productId);
    if (prod) {
      const newStock = Math.max(0, parseInt(prod.current_stock || 0, 10) - record.medication.quantity);
      localDB.update('products', data.productId, { current_stock: newStock });

      localDB.insert('inventory_movements', {
        product_id: data.productId,
        product_name: prod.name,
        type: 'Saída SNGPC / Portaria 344',
        quantity: -record.medication.quantity,
        batch: record.medication.batch,
        cost_unit: parseFloat(prod.cost_price || 0),
        total_value: record.medication.quantity * parseFloat(prod.sale_price || 0),
        reason: `Dispensação Controlada (${record.prescription_type}) - Receita #${record.notification_number} - Prescritor: Dr. ${record.prescriber.name} (${record.prescriber.council} ${record.prescriber.number}/${record.prescriber.uf})`,
        patient_name: record.patient.name,
        operator_name: record.pharmacist_rt.name,
        created_at: new Date().toISOString()
      });
    }
  }

  syncManager.pushToCloud(false);
  return record;
}

// Gera o arquivo XML padrão SNGPC Anvisa
export function generateSngpcXml(startDateStr, endDateStr) {
  const settings = localDB.get('settings', 'main') || {};
  const dispensations = localDB.list('sngpc_dispensations') || [];

  const start = new Date(startDateStr || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const end = new Date(endDateStr || new Date());
  end.setHours(23, 59, 59, 999);

  const filtered = dispensations.filter(d => {
    const dt = new Date(d.dispensation_date || d.created_at);
    return dt >= start && dt <= end;
  });

  const cnpj = (settings.cnpj || '00.000.000/0001-00').replace(/\D/g, '');
  const cpfRt = (settings.pharmacist_cpf || '000.000.000-00').replace(/\D/g, '');
  const dataInicial = start.toISOString().slice(0, 10);
  const dataFinal = end.toISOString().slice(0, 10);

  let xml = `<?xml version="1.0" encoding="ISO-8859-1"?>\n`;
  xml += `<mensagemSNGPC xmlns="urn:sngpc-schema">\n`;
  xml += `  <cabecalho>\n`;
  xml += `    <cnpjEmissor>${cnpj}</cnpjEmissor>\n`;
  xml += `    <cpfTransmissor>${cpfRt}</cpfTransmissor>\n`;
  xml += `    <dataInicio>${dataInicial}</dataInicio>\n`;
  xml += `    <dataFim>${dataFinal}</dataFim>\n`;
  xml += `  </cabecalho>\n`;
  xml += `  <corpo>\n`;
  xml += `    <medicamentos>\n`;
  xml += `      <entradaMedicamentos></entradaMedicamentos>\n`;
  xml += `      <saidaMedicamentoVendaAoConsumidor>\n`;

  filtered.forEach(item => {
    const m = item.medication;
    const p = item.prescriber;
    const b = item.buyer;
    const pat = item.patient;

    xml += `        <saidaMedicamentoVendaAoConsumidorItem>\n`;
    xml += `          <tipoReceituarioMedicamento>${getTipoReceituarioCode(item.prescription_type)}</tipoReceituarioMedicamento>\n`;
    xml += `          <numeroNotificacaoMedicamento>${escapeXml(item.notification_number)}</numeroNotificacaoMedicamento>\n`;
    xml += `          <dataPrescricaoMedicamento>${item.prescription_date}</dataPrescricaoMedicamento>\n`;
    xml += `          <prescritorMedicamento>\n`;
    xml += `            <nomePrescritor>${escapeXml(p.name)}</nomePrescritor>\n`;
    xml += `            <numeroRegistroProfissional>${escapeXml(p.number)}</numeroRegistroProfissional>\n`;
    xml += `            <conselhoProfissional>${escapeXml(p.council)}</conselhoProfissional>\n`;
    xml += `            <UFConselho>${escapeXml(p.uf)}</UFConselho>\n`;
    xml += `          </prescritorMedicamento>\n`;
    xml += `          <usoProlongadoMedicamento>${m.prolonged_use ? 'S' : 'N'}</usoProlongadoMedicamento>\n`;
    xml += `          <compradorMedicamento>\n`;
    xml += `            <nomeComprador>${escapeXml(b.name)}</nomeComprador>\n`;
    xml += `            <tipoDocumento>${escapeXml(b.doc_type)}</tipoDocumento>\n`;
    xml += `            <numeroDocumento>${escapeXml(b.doc_number)}</numeroDocumento>\n`;
    xml += `            <orgaoExpedidor>${escapeXml(b.doc_issuer)}</orgaoExpedidor>\n`;
    xml += `            <UFEmissaoDocumento>${escapeXml(b.doc_uf)}</UFEmissaoDocumento>\n`;
    xml += `          </compradorMedicamento>\n`;
    xml += `          <pacienteMedicamento>\n`;
    xml += `            <nomePaciente>${escapeXml(pat.name)}</nomePaciente>\n`;
    xml += `            <idade>${pat.age || 30}</idade>\n`;
    xml += `            <unidadeMedidaIdade>1</unidadeMedidaIdade>\n`;
    xml += `            <sexo>${pat.gender || 'M'}</sexo>\n`;
    xml += `          </pacienteMedicamento>\n`;
    xml += `          <medicamentoVenda>\n`;
    xml += `            <registroMSMedicamento>${(m.ms_registry || '1000000000000').padEnd(13, '0').slice(0, 13)}</registroMSMedicamento>\n`;
    xml += `            <numeroLoteMedicamento>${escapeXml(m.batch || 'L01')}</numeroLoteMedicamento>\n`;
    xml += `            <quantidadeMedicamento>${m.quantity}</quantidadeMedicamento>\n`;
    xml += `            <unidadeMedidaMedicamento>1</unidadeMedidaMedicamento>\n`;
    xml += `          </medicamentoVenda>\n`;
    xml += `          <dataVendaMedicamento>${item.dispensation_date}</dataVendaMedicamento>\n`;
    xml += `        </saidaMedicamentoVendaAoConsumidorItem>\n`;
  });

  xml += `      </saidaMedicamentoVendaAoConsumidor>\n`;
  xml += `      <saidaMedicamentoTransferencia></saidaMedicamentoTransferencia>\n`;
  xml += `      <saidaMedicamentoPerda></saidaMedicamentoPerda>\n`;
  xml += `    </medicamentos>\n`;
  xml += `  </corpo>\n`;
  xml += `</mensagemSNGPC>\n`;

  return { xml, recordsCount: filtered.length, startDate: dataInicial, endDate: dataFinal };
}

function getTipoReceituarioCode(type) {
  if (!type) return '1';
  if (type.includes('Amarela') || type.includes('A1') || type.includes('A2') || type.includes('A3')) return '1';
  if (type.includes('Azul') || type.includes('B1')) return '2';
  if (type.includes('B2')) return '3';
  if (type.includes('Especial') || type.includes('C2') || type.includes('C3')) return '4';
  if (type.includes('Antimicrobiano') || type.includes('AM')) return '5';
  return '1'; // 1 = Receita Branca / Controle Especial 2 Vias
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Modal de Registro e Escrituração SNGPC
export function openSngpcDispensationModal(onSaved = null) {
  const existing = document.getElementById('sngpc-dispensation-modal');
  if (existing) existing.remove();

  const products = (localDB.list('products') || []).filter(p => {
    const cat = (p.category || '').toLowerCase();
    return cat.includes('controlad') || cat.includes('antibi') || cat.includes('antimicrob') || cat.includes('tarja preta') || cat.includes('portaria 344');
  });

  const allPatients = (localDB.list('pharmacy_patients') || []).concat(localDB.list('patients') || []);

  const modal = document.createElement('div');
  modal.id = 'sngpc-dispensation-modal';
  modal.className = 'pep-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 15, 29, 0.92); backdrop-filter: blur(16px);
    display: flex; justify-content: center; align-items: center; z-index: 10008; padding: 16px;
  `;

  modal.innerHTML = `
    <div style="width: 100%; max-width: 860px; max-height: 94vh; display: flex; flex-direction: column; background: #0f172a; border: 1.5px solid rgba(239, 68, 68, 0.5); border-radius: 20px; padding: 22px; box-shadow: 0 25px 60px rgba(0,0,0,0.95); overflow: hidden;">
      
      <!-- Cabeçalho -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #ef4444, #b91c1c); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.3rem;">
            <i class="fa-solid fa-file-prescription"></i>
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h3 style="margin: 0; color: #fff; font-family: 'Outfit'; font-size: 1.25rem; font-weight: 700;">
                Escrituração SNGPC / Anvisa
              </h3>
              <span style="font-size: 0.7rem; background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239,68,68,0.4); padding: 2px 8px; border-radius: 10px; font-weight: 700;">
                Portaria 344/98 &amp; RDC 20/2011
              </span>
            </div>
            <p style="margin: 2px 0 0; font-size: 0.78rem; color: #94a3b8;">
              Registro de dispensação de medicamentos controlados, retenção de receita e transmissão eletrônica.
            </p>
          </div>
        </div>
        <button id="btn-close-sngpc-modal" style="background: none; border: none; color: #94a3b8; font-size: 1.3rem; cursor: pointer;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <form id="form-sngpc-dispensation" style="display: flex; flex-direction: column; gap: 14px; flex: 1; overflow-y: auto; padding-right: 4px;">
        
        <!-- SEÇÃO 1: TIPO DE RECEITUÁRIO E DATAS -->
        <div style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px;">
          <strong style="font-size: 0.84rem; color: #38bdf8; display: block; margin-bottom: 8px; font-family: 'Outfit';">
            1. Dados da Notificação / Receita
          </strong>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Tipo de Receituário:</label>
              <select id="sngpc-presc-type" class="form-input" required style="font-size: 0.8rem;">
                <option value="Receita de Controle Especial em 2 Vias (Branca)">Receita Controle Especial (2 Vias Branca - C1/C5)</option>
                <option value="Notificação de Receita A (Amarela - Entorpecentes)">Notificação A (Amarela - Entorpecentes A1/A2/A3)</option>
                <option value="Notificação de Receita B (Azul - Psicotrópicos)">Notificação B (Azul - Psicotrópicos B1)</option>
                <option value="Notificação de Receita B2 (Azul - Anorexígenos)">Notificação B2 (Azul - Anorexígenos B2)</option>
                <option value="Notificação Especial de Retinóides (C2)">Notificação Especial (Retinóides C2)</option>
                <option value="Receita de Antimicrobianos em 2 Vias (RDC 20/2011)">Receita Antimicrobianos (RDC 20/2011)</option>
              </select>
            </div>

            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Número da Notificação / Receita:</label>
              <input type="text" id="sngpc-notif-num" class="form-input" required placeholder="Ex: 849201" style="font-size: 0.85rem; font-family: monospace;">
            </div>

            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Data da Prescrição Médica:</label>
              <input type="date" id="sngpc-presc-date" class="form-input" required value="${new Date().toISOString().slice(0, 10)}" style="font-size: 0.85rem;">
            </div>
          </div>
        </div>

        <!-- SEÇÃO 2: DADOS DO PRESCRITOR -->
        <div style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px;">
          <strong style="font-size: 0.84rem; color: #fbbf24; display: block; margin-bottom: 8px; font-family: 'Outfit';">
            2. Prescritor (Médico / Odontólogo / Veterinário)
          </strong>

          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 10px;">
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Nome do Prescritor:</label>
              <input type="text" id="sngpc-presc-name" class="form-input" required placeholder="Dr. Nome Completo" style="font-size: 0.85rem;">
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Conselho:</label>
              <select id="sngpc-presc-council" class="form-input" style="font-size: 0.85rem;">
                <option value="CRM">CRM</option>
                <option value="CRO">CRO</option>
                <option value="CRMV">CRMV</option>
              </select>
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Nº Registro:</label>
              <input type="text" id="sngpc-presc-num" class="form-input" required placeholder="Ex: 12345" style="font-size: 0.85rem; font-family: monospace;">
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* UF:</label>
              <input type="text" id="sngpc-presc-uf" class="form-input" required value="SP" maxlength="2" style="font-size: 0.85rem; text-transform: uppercase;">
            </div>
          </div>
        </div>

        <!-- SEÇÃO 3: PACIENTE E COMPRADOR -->
        <div style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px;">
          <strong style="font-size: 0.84rem; color: #34d399; display: block; margin-bottom: 8px; font-family: 'Outfit';">
            3. Paciente e Comprador
          </strong>

          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; margin-bottom: 10px;">
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Nome do Paciente:</label>
              <input type="text" id="sngpc-patient-name" class="form-input" required placeholder="Nome do Paciente" style="font-size: 0.85rem;">
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">Idade:</label>
              <input type="number" id="sngpc-patient-age" class="form-input" min="0" max="120" placeholder="Ex: 45" style="font-size: 0.85rem;">
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">Sexo:</label>
              <select id="sngpc-patient-gender" class="form-input" style="font-size: 0.85rem;">
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 10px;">
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Nome do Comprador:</label>
              <input type="text" id="sngpc-buyer-name" class="form-input" required placeholder="Quem está retirando no balcão" style="font-size: 0.85rem;">
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">Tipo Doc:</label>
              <select id="sngpc-buyer-doc-type" class="form-input" style="font-size: 0.85rem;">
                <option value="RG">RG</option>
                <option value="CNH">CNH</option>
                <option value="PASSAPORTE">Passaporte</option>
              </select>
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Nº Doc:</label>
              <input type="text" id="sngpc-buyer-doc-num" class="form-input" required placeholder="12.345.678-9" style="font-size: 0.85rem;">
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">Órgão:</label>
              <input type="text" id="sngpc-buyer-doc-issuer" class="form-input" value="SSP" style="font-size: 0.85rem; text-transform: uppercase;">
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">UF:</label>
              <input type="text" id="sngpc-buyer-doc-uf" class="form-input" value="SP" maxlength="2" style="font-size: 0.85rem; text-transform: uppercase;">
            </div>
          </div>
        </div>

        <!-- SEÇÃO 4: MEDICAMENTO DISPENSADO -->
        <div style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px;">
          <strong style="font-size: 0.84rem; color: #c084fc; display: block; margin-bottom: 8px; font-family: 'Outfit';">
            4. Medicamento Controlado Dispensado
          </strong>

          <div style="display: grid; grid-template-columns: 2fr 1.5fr 1fr 1fr; gap: 10px;">
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Selecionar Medicamento:</label>
              <select id="sngpc-product-select" class="form-input" required style="font-size: 0.85rem;">
                <option value="">Selecione um medicamento...</option>
                ${products.map(p => `<option value="${p.id}" data-batch="${p.batch || ''}" data-name="${p.name}">${p.name} (Lote: ${p.batch || 'N/A'} • Saldo: ${p.current_stock || 0} un)</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Registro MS (13 dígitos):</label>
              <input type="text" id="sngpc-ms-registry" class="form-input" required value="1004300000000" maxlength="13" placeholder="1000000000000" style="font-size: 0.85rem; font-family: monospace;">
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Lote:</label>
              <input type="text" id="sngpc-batch" class="form-input" required placeholder="Lote" style="font-size: 0.85rem; font-family: monospace;">
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-bottom: 3px;">* Qtd Dispensada:</label>
              <input type="number" id="sngpc-qty" class="form-input" required min="1" value="1" style="font-size: 0.85rem; font-weight: 700;">
            </div>
          </div>

          <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" id="sngpc-prolonged-use" style="width: 16px; height: 16px; cursor: pointer;">
            <label for="sngpc-prolonged-use" style="font-size: 0.78rem; color: #cbd5e1; cursor: pointer;">
              Tratamento de Uso Prolongado (Art. 52 Portaria 344/98)
            </label>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;">
          <button type="button" id="btn-cancel-sngpc" class="btn" style="background: rgba(255,255,255,0.06); color: #94a3b8; border: 1px solid rgba(255,255,255,0.12); padding: 9px 16px; border-radius: 8px;">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, #ef4444, #dc2626); border: none; padding: 9px 22px; border-radius: 8px; font-weight: 700; color: #fff;">
            <i class="fa-solid fa-check"></i> Registrar e Reter Receita
          </button>
        </div>

      </form>

    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();
  document.getElementById('btn-close-sngpc-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-sngpc')?.addEventListener('click', closeModal);

  // Auto preencher lote quando seleciona medicamento
  document.getElementById('sngpc-product-select')?.addEventListener('change', (e) => {
    const opt = e.target.options[e.target.selectedIndex];
    if (opt && opt.dataset.batch) {
      document.getElementById('sngpc-batch').value = opt.dataset.batch;
    }
  });

  document.getElementById('form-sngpc-dispensation')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const prodSelect = document.getElementById('sngpc-product-select');
    const selectedProdOpt = prodSelect.options[prodSelect.selectedIndex];

    const data = {
      prescriptionType: document.getElementById('sngpc-presc-type').value,
      notificationNumber: document.getElementById('sngpc-notif-num').value.trim(),
      prescriptionDate: document.getElementById('sngpc-presc-date').value,
      prescriberName: document.getElementById('sngpc-presc-name').value.trim(),
      prescriberCouncil: document.getElementById('sngpc-presc-council').value,
      prescriberNumber: document.getElementById('sngpc-presc-num').value.trim(),
      prescriberUf: document.getElementById('sngpc-presc-uf').value.trim().toUpperCase(),
      patientName: document.getElementById('sngpc-patient-name').value.trim(),
      patientAge: parseInt(document.getElementById('sngpc-patient-age').value || 30, 10),
      patientGender: document.getElementById('sngpc-patient-gender').value,
      buyerName: document.getElementById('sngpc-buyer-name').value.trim(),
      buyerDocType: document.getElementById('sngpc-buyer-doc-type').value,
      buyerDocNumber: document.getElementById('sngpc-buyer-doc-num').value.trim(),
      buyerDocIssuer: document.getElementById('sngpc-buyer-doc-issuer').value.trim().toUpperCase(),
      buyerDocUf: document.getElementById('sngpc-buyer-doc-uf').value.trim().toUpperCase(),
      productId: prodSelect.value,
      productName: selectedProdOpt.dataset.name || 'Medicamento Controlado',
      msRegistry: document.getElementById('sngpc-ms-registry').value.trim(),
      batch: document.getElementById('sngpc-batch').value.trim(),
      quantity: parseInt(document.getElementById('sngpc-qty').value || 1, 10),
      prolongedUse: document.getElementById('sngpc-prolonged-use').checked
    };

    const record = registerSngpcDispensation(data);
    showToast(`✅ Receita #${record.notification_number} escriturada no SNGPC com sucesso!`);
    closeModal();
    if (typeof onSaved === 'function') onSaved();
  });
}

// Modal do Livro de Registro Digital SNGPC e Transmissão XML
export function openSngpcBookModal() {
  const existing = document.getElementById('sngpc-book-modal');
  if (existing) existing.remove();

  const dispensations = localDB.list('sngpc_dispensations') || [];

  const modal = document.createElement('div');
  modal.id = 'sngpc-book-modal';
  modal.className = 'pep-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 15, 29, 0.92); backdrop-filter: blur(16px);
    display: flex; justify-content: center; align-items: center; z-index: 10009; padding: 16px;
  `;

  modal.innerHTML = `
    <div style="width: 100%; max-width: 1050px; max-height: 94vh; display: flex; flex-direction: column; background: #0f172a; border: 1.5px solid rgba(239, 68, 68, 0.5); border-radius: 20px; padding: 22px; box-shadow: 0 25px 60px rgba(0,0,0,0.95); overflow: hidden;">
      
      <!-- Cabeçalho -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #ef4444, #b91c1c); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.3rem;">
            <i class="fa-solid fa-book-medical"></i>
          </div>
          <div>
            <h3 style="margin: 0; color: #fff; font-family: 'Outfit'; font-size: 1.25rem; font-weight: 700;">
              Livro de Registro Digital SNGPC &amp; Transmissão Anvisa
            </h3>
            <p style="margin: 2px 0 0; font-size: 0.78rem; color: #94a3b8;">
              Escrituração oficial de medicamentos controlados (Portaria 344/98) e exportação XML semanal.
            </p>
          </div>
        </div>

        <div style="display: flex; gap: 8px;">
          <button type="button" id="btn-sngpc-new-dispensation" class="btn btn-primary" style="background: linear-gradient(135deg, #ef4444, #dc2626); border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; color: #fff; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-plus"></i> Nova Escrituração
          </button>
          <button type="button" id="btn-sngpc-download-xml" class="btn" style="background: linear-gradient(135deg, #38bdf8, #0284c7); color: #fff; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-file-code"></i> Gerar XML SNGPC (Anvisa)
          </button>
          <button id="btn-close-sngpc-book" style="background: none; border: none; color: #94a3b8; font-size: 1.3rem; cursor: pointer; padding: 4px;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <!-- Tabela do Livro de Registro -->
      <div style="flex: 1; overflow-y: auto; padding-right: 4px;">
        ${dispensations.length === 0 ? `
          <div style="text-align: center; padding: 50px 20px; color: #64748b;">
            <i class="fa-solid fa-prescription-bottle" style="font-size: 3rem; opacity: 0.3; margin-bottom: 12px; display: block;"></i>
            Nenhuma dispensação de medicamento controlado escriturada no SNGPC até o momento.
          </div>
        ` : `
          <table class="patients-table" style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); text-align: left; color: #94a3b8; font-size: 0.72rem; text-transform: uppercase;">
                <th style="padding: 8px;">Data Venda</th>
                <th style="padding: 8px;">Receituário / Nº</th>
                <th style="padding: 8px;">Medicamento Controlado</th>
                <th style="padding: 8px; text-align: center;">Qtd</th>
                <th style="padding: 8px;">Prescritor</th>
                <th style="padding: 8px;">Comprador / Paciente</th>
                <th style="padding: 8px;">Farmacêutico RT</th>
              </tr>
            </thead>
            <tbody>
              ${dispensations.map(d => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                  <td style="padding: 8px; color: #94a3b8; font-size: 0.76rem;">
                    ${new Date(d.dispensation_date).toLocaleDateString('pt-BR')}
                  </td>
                  <td style="padding: 8px;">
                    <strong style="color: #fff; font-size: 0.78rem; display: block;">${d.prescription_type}</strong>
                    <small style="color: #ef4444; font-family: monospace; font-weight: 700;">#${d.notification_number}</small>
                  </td>
                  <td style="padding: 8px;">
                    <strong style="color: #fff;">${d.medication?.name || 'Medicamento'}</strong>
                    <div style="font-size: 0.7rem; color: #94a3b8;">
                      Lote: <span style="font-family: monospace; color: #cbd5e1;">${d.medication?.batch}</span> • MS: <span style="font-family: monospace;">${d.medication?.ms_registry}</span>
                    </div>
                  </td>
                  <td style="padding: 8px; text-align: center; font-weight: 800; color: #34d399;">
                    ${d.medication?.quantity} un
                  </td>
                  <td style="padding: 8px; color: #cbd5e1; font-size: 0.76rem;">
                    Dr(a). ${d.prescriber?.name}<br>
                    <small style="color: #94a3b8;">${d.prescriber?.council} ${d.prescriber?.number}/${d.prescriber?.uf}</small>
                  </td>
                  <td style="padding: 8px; font-size: 0.76rem;">
                    <span style="color: #fff; font-weight: 600;">${d.patient?.name}</span><br>
                    <small style="color: #94a3b8;">Comprador: ${d.buyer?.name} (${d.buyer?.doc_type} ${d.buyer?.doc_number})</small>
                  </td>
                  <td style="padding: 8px; color: #94a3b8; font-size: 0.74rem;">
                    ${d.pharmacist_rt?.name || 'Farmacêutico RT'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  const closeBook = () => modal.remove();
  document.getElementById('btn-close-sngpc-book')?.addEventListener('click', closeBook);

  // Botão Nova Escrituração
  document.getElementById('btn-sngpc-new-dispensation')?.addEventListener('click', () => {
    closeBook();
    openSngpcDispensationModal(() => {
      openSngpcBookModal();
    });
  });

  // Botão Gerar XML Anvisa
  document.getElementById('btn-sngpc-download-xml')?.addEventListener('click', () => {
    const { xml, recordsCount, startDate, endDate } = generateSngpcXml();
    if (recordsCount === 0) {
      showToast('⚠️ Nenhuma escrituração encontrada nos últimos 7 dias para compor o arquivo XML.');
      return;
    }

    const blob = new Blob([xml], { type: 'application/xml;charset=iso-8859-1;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sngpc_${startDate.replace(/-/g, '')}_${endDate.replace(/-/g, '')}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`📄 Arquivo XML SNGPC (${recordsCount} receitas) gerado e validado com sucesso!`);
  });
}
