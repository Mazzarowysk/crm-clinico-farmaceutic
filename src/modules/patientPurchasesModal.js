// src/modules/patientPurchasesModal.js
// MODAL EXCLUSIVO DE HISTÓRICO DE COMPRAS, DISPENSAÇÕES E RECOMPRAS DO PACIENTE

import * as localDB from '../localDB.js';
import { showToast, showCustomAlert } from './ui.js';
import { openQuickCheckoutModal } from './quickCheckoutModal.js';
import { printThermalReceipt } from './thermalReceipt.js';

export function openPatientPurchasesModal(patientId, patientName = 'Cliente') {
  try {
    const existing = document.getElementById('patient-purchases-modal');
    if (existing) existing.remove();

    // Localizar paciente no banco local
    const allPatients = [
      ...(localDB.list('pharmacy_patients') || []),
      ...(localDB.list('patients') || [])
    ];
    const patient = allPatients.find(p => p && (String(p.id) === String(patientId) || p.name === patientName || p.fullName === patientName)) || {
      id: patientId,
      name: patientName,
      fullName: patientName
    };

    const pName = patient.fullName || patient.name || patientName || 'Cliente';
    const pId = patient.id || patientId;
    const pPhone = (patient.phone || patient.cellphone || '').replace(/\D/g, '');

    // Buscar compras do paciente
    let allPurchases = (localDB.list('patient_purchases') || []).filter(pur => 
      pur && (
        String(pur.patient_id) === String(pId) ||
        (pur.patient_name && pName && pur.patient_name.toLowerCase().includes(pName.toLowerCase())) ||
        (pName && pur.patient_name && pName.toLowerCase().includes(pur.patient_name.toLowerCase()))
      )
    );

    // Se o paciente for simulado e não tiver compras ainda, cria compras simuladas ricas
    if (allPurchases.length === 0 && (patient.isSimulation || String(pId).startsWith('SIM-') || pName.includes('[SIMULADO]'))) {
      const mockItems = [
        {
          id: localDB.generateId('PURCH'),
          patient_id: pId,
          patient_name: pName,
          product_id: 'PROD-003',
          product_name: 'Losartana Potássica 50mg c/ 30 comprimidos',
          quantity: 1,
          unit_price: 14.90,
          total_price: 14.90,
          is_continuous: true,
          days_supply: 30,
          refill_date: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
          batch: 'L-77621',
          attendance_id: 'ATT-DEMO-1',
          pharmacist_name: 'Marcelo Mazaro',
          created_at: new Date(Date.now() - 24 * 86400000).toISOString()
        },
        {
          id: localDB.generateId('PURCH'),
          patient_id: pId,
          patient_name: pName,
          product_id: 'PROD-002',
          product_name: 'Paracetamol 750mg c/ 20 comprimidos',
          quantity: 1,
          unit_price: 11.50,
          total_price: 11.50,
          is_continuous: false,
          days_supply: null,
          refill_date: null,
          batch: 'L-98412',
          attendance_id: 'ATT-DEMO-2',
          pharmacist_name: 'Dr. Lucas Ferreira',
          created_at: new Date(Date.now() - 5 * 86400000).toISOString()
        }
      ];

      mockItems.forEach(item => localDB.insert('patient_purchases', item));
      allPurchases = mockItems;
    }

    const totalSpent = allPurchases.reduce((acc, cur) => acc + (parseFloat(cur.total_price || cur.unit_price || 0) * (parseInt(cur.quantity || 1, 10))), 0);

    const modal = document.createElement('div');
    modal.id = 'patient-purchases-modal';
    modal.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: rgba(5, 7, 20, 0.88) !important;
      backdrop-filter: blur(14px) !important;
      -webkit-backdrop-filter: blur(14px) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 100050 !important;
      padding: 16px !important;
      box-sizing: border-box !important;
    `;

    modal.innerHTML = `
      <div style="max-width: 820px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; background: #0f172a; border: 1.5px solid rgba(16, 185, 129, 0.4); border-radius: 20px; box-shadow: 0 25px 70px rgba(0,0,0,0.9), 0 0 30px rgba(16, 185, 129, 0.15); overflow: hidden;">
        
        <!-- Modal Header -->
        <div style="padding: 16px 22px; background: linear-gradient(135deg, #064e3b, #042f2e); border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); display: flex; align-items: center; justify-content: center; color: #34d399; font-size: 1.3rem;">
              <i class="fa-solid fa-cart-shopping"></i>
            </div>
            <div>
              <h3 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.15rem; color: #fff; font-weight: 700;">
                Histórico de Compras &amp; Adesão Terapêutica
              </h3>
              <div style="font-size: 0.8rem; color: #94a3b8;">
                Cliente: <strong style="color: #38bdf8;">${pName}</strong> &bull; CPF: ${patient.cpf || 'Não informado'}
              </div>
            </div>
          </div>
          <button type="button" id="btn-close-purchases-modal" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); color: #fff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Banner de Métricas Rápidas -->
        <div style="background: rgba(15, 23, 42, 0.95); padding: 12px 22px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; gap: 20px;">
            <div>
              <small style="color: #94a3b8; font-size: 0.72rem; text-transform: uppercase;">Total de Compras</small>
              <div style="color: #fff; font-size: 1.1rem; font-weight: 800; font-family: 'Outfit';">${allPurchases.length} aquisição(ões)</div>
            </div>
            <div>
              <small style="color: #94a3b8; font-size: 0.72rem; text-transform: uppercase;">Valor Acumulado</small>
              <div style="color: #34d399; font-size: 1.1rem; font-weight: 800; font-family: 'Outfit';">R$ ${totalSpent.toFixed(2).replace('.', ',')}</div>
            </div>
          </div>
          <button type="button" id="btn-new-sale-for-patient" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 7px 14px; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);">
            <i class="fa-solid fa-cash-register"></i> + Nova Venda / Dispensação no Caixa
          </button>
        </div>

        <!-- Conteúdo Scrollável -->
        <div style="padding: 20px 22px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 12px;">
          ${allPurchases.length === 0 ? `
            <div style="text-align: center; padding: 40px 20px; background: rgba(30, 41, 59, 0.5); border: 1.5px dashed rgba(255,255,255,0.12); border-radius: 14px;">
              <i class="fa-solid fa-bag-shopping" style="font-size: 2.5rem; color: #64748b; margin-bottom: 12px; display: block;"></i>
              <strong style="color: #fff; font-size: 1rem; display: block; margin-bottom: 4px;">Nenhuma compra registrada para este cliente ainda</strong>
              <p style="color: #94a3b8; font-size: 0.84rem; max-width: 450px; margin: 0 auto 16px;">
                As compras aparecem aqui automaticamente após a conclusão de atendimentos com dispensação no Balcão ou vendas diretas no Caixa (PDV).
              </p>
              <button type="button" id="btn-first-sale-for-patient" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: none; padding: 9px 18px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-cart-plus"></i> Realizar 1ª Venda / Dispensação
              </button>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${allPurchases.map(pur => {
                const dt = pur.created_at ? new Date(pur.created_at).toLocaleDateString('pt-BR') : 'Data não informada';
                const isContinuous = pur.is_continuous;
                let refillBanner = '';
                
                if (isContinuous && pur.refill_date) {
                  const daysToRefill = Math.ceil((new Date(pur.refill_date) - new Date()) / (1000 * 60 * 60 * 24));
                  const isLate = daysToRefill <= 0;
                  refillBanner = `
                    <div style="margin-top: 8px; background: ${isLate ? 'rgba(239, 68, 68, 0.12)' : 'rgba(56, 189, 248, 0.1)'}; border: 1px solid ${isLate ? 'rgba(239, 68, 68, 0.35)' : 'rgba(56, 189, 248, 0.3)'}; border-radius: 8px; padding: 6px 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                      <span style="font-size: 0.76rem; color: ${isLate ? '#f87171' : '#38bdf8'}; font-weight: 600;">
                        <i class="fa-solid fa-clock-rotate-left"></i> Uso Contínuo: Previsão de Recompra em <strong>${pur.refill_date.split('-').reverse().join('/')} (${isLate ? 'Tratamento Vencido / Repor Imediatamente' : `faltam ${daysToRefill} dias`})</strong>
                      </span>
                      <button type="button" class="btn-whatsapp-refill" data-med="${pur.product_name}" data-date="${pur.refill_date}" style="background: #25d366; color: #000; font-size: 0.72rem; font-weight: 800; border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <i class="fa-brands fa-whatsapp"></i> Lembrar Recompra
                      </button>
                    </div>
                  `;
                }

                return `
                  <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 14px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                      <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <strong style="color: #fff; font-size: 0.92rem; font-family: 'Outfit';">${pur.product_name}</strong>
                          ${isContinuous ? '<span style="font-size: 0.65rem; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56,189,248,0.4); padding: 1px 6px; border-radius: 6px; font-weight: 700;">USO CONTÍNUO</span>' : ''}
                        </div>
                        <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 3px;">
                          📅 Data: <strong style="color: #cbd5e1;">${dt}</strong> &bull; Lote: <code style="color: #34d399;">${pur.batch || 'L-DISP'}</code> &bull; Farmacêutico: ${pur.pharmacist_name || 'Farmacêutico Responsável'}
                        </div>
                      </div>
                      <div style="text-align: right;">
                        <div style="color: #34d399; font-weight: 800; font-size: 0.95rem; font-family: 'Outfit';">
                          R$ ${parseFloat(pur.total_price || pur.unit_price || 0).toFixed(2).replace('.', ',')}
                        </div>
                        <small style="color: #64748b; font-size: 0.7rem;">Qtd: ${pur.quantity || 1} un</small>
                      </div>
                    </div>
                    
                    <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px;">
                      <button type="button" 
                        onclick="window.emitThermalReceiptFromPurchase(this)" 
                        class="btn-print-purchase-receipt" 
                        data-purch-id="${pur.id}" 
                        data-med="${pur.product_name}" 
                        data-price="${pur.total_price || pur.unit_price || 0}" 
                        data-qty="${pur.quantity || 1}" 
                        data-batch="${pur.batch || 'L-DISP'}" 
                        data-resp="${pur.pharmacist_name || 'Farmacêutico Responsável'}" 
                        data-proto="${pur.attendance_id || ''}" 
                        data-patient="${pName}" 
                        data-cpf="${patient.cpf || ''}" 
                        style="background: rgba(56, 189, 248, 0.2); border: 1.5px solid #38bdf8; color: #ffffff; font-size: 0.76rem; font-weight: 800; padding: 6px 14px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.35); transition: 0.2s;">
                        <i class="fa-solid fa-receipt"></i> Emitir Cupom Térmico (80mm)
                      </button>
                    </div>

                    ${refillBanner}
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    document.getElementById('btn-close-purchases-modal')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Abrir Caixa / PDV Rápido
    const openCheckout = () => {
      closeModal();
      if (typeof openQuickCheckoutModal === 'function') {
        openQuickCheckoutModal(() => {
          showToast('🛒 Venda registrada com sucesso!');
        });
      } else if (window.openQuickCheckoutModal) {
        window.openQuickCheckoutModal(() => {
          showToast('🛒 Venda registrada com sucesso!');
        });
      }
    };

    document.getElementById('btn-new-sale-for-patient')?.addEventListener('click', openCheckout);
    document.getElementById('btn-first-sale-for-patient')?.addEventListener('click', openCheckout);

    // Botão WhatsApp Lembrar Recompra
    modal.querySelectorAll('.btn-whatsapp-refill').forEach(btn => {
      btn.addEventListener('click', () => {
        const med = btn.getAttribute('data-med');
        const date = btn.getAttribute('data-date');
        const dateFormatted = date ? date.split('-').reverse().join('/') : 'em breve';
        const msg = encodeURIComponent(`Olá, ${pName}! Passando para lembrar que seu medicamento de uso contínuo *${med}* tem previsão de término para *${dateFormatted}*. Deseja que já deixemos separado para retirada na farmácia?`);
        window.open(`https://api.whatsapp.com/send?phone=55${pPhone}&text=${msg}`, '_blank');
      });
    });

  } catch (err) {
    console.error('[PatientPurchases] Erro ao abrir modal de compras:', err);
    showToast('Erro ao abrir compras do paciente.');
  }
}

// Exportação global da função de emissão de cupom térmico a partir de compras
if (typeof window !== 'undefined') {
  window.openPatientPurchasesModal = openPatientPurchasesModal;

  window.emitThermalReceiptFromPurchase = function(btn) {
    let saleData = null;
    try {
      if (!btn) return;
      const medName = btn.getAttribute('data-med') || 'Medicamento Dispensado';
      const price = parseFloat(btn.getAttribute('data-price') || 0);
      const qty = parseInt(btn.getAttribute('data-qty') || 1, 10);
      const batch = btn.getAttribute('data-batch') || 'L-DISP';
      const resp = btn.getAttribute('data-resp') || 'Farmacêutico Responsável';
      const proto = btn.getAttribute('data-proto') || `VD-${Math.floor(100000 + Math.random()*900000)}`;
      const patientName = btn.getAttribute('data-patient') || 'Cliente';
      const patientCpf = btn.getAttribute('data-cpf') || '';

      saleData = {
        protocol: proto,
        clientName: patientName,
        clientCpf: patientCpf,
        items: [
          {
            product: { name: medName, ean: '', batch: batch },
            quantity: qty,
            unitPrice: price,
            subtotal: qty * price
          }
        ],
        subtotalGross: qty * price,
        discount: 0,
        totalSale: qty * price,
        paymentMethod: 'Balcão / Caixa',
        operatorName: resp,
        created_at: new Date().toISOString()
      };

      showToast('🖨️ Gerando Cupom Térmico (80mm)...');
      if (typeof printThermalReceipt === 'function') {
        printThermalReceipt(saleData, '80mm');
      } else if (window.printThermalReceipt) {
        window.printThermalReceipt(saleData, '80mm');
      }
    } catch (err) {
      console.error('Erro ao emitir cupom térmico:', err);
      if (saleData && window.printThermalReceipt) {
        window.printThermalReceipt(saleData, '80mm');
      }
    }
  };
}
