// src/modules/patientPurchasesModal.js
// MODAL EXCLUSIVO DE HISTÓRICO DE COMPRAS AGRUPADO POR COMPRA / VENDA & ADESÃO TERAPÊUTICA

import * as localDB from '../localDB.js';
import { showToast, showCustomAlert } from './ui.js';
import { openQuickCheckoutModal } from './quickCheckoutModal.js';
import { printThermalReceipt, exportThermalReceiptPDF } from './thermalReceipt.js';

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

    // 1. Obter registros de vendas gerais (sales) e de compras unitárias (patient_purchases)
    const allSales = (localDB.list('sales') || []).filter(s =>
      s && (
        String(s.patient_id) === String(pId) ||
        (s.clientName && pName && s.clientName.toLowerCase().includes(pName.toLowerCase())) ||
        (pName && s.clientName && pName.toLowerCase().includes(s.clientName.toLowerCase())) ||
        (s.clientCpf && patient.cpf && s.clientCpf.replace(/\D/g, '') === patient.cpf.replace(/\D/g, ''))
      )
    );

    let allPurchasesRaw = (localDB.list('patient_purchases') || []).filter(pur => 
      pur && (
        String(pur.patient_id) === String(pId) ||
        (pur.patient_name && pName && pur.patient_name.toLowerCase().includes(pName.toLowerCase())) ||
        (pName && pur.patient_name && pName.toLowerCase().includes(pur.patient_name.toLowerCase()))
      )
    );

    // Se o paciente for simulado e não tiver compras ainda, cria compras simuladas agrupadas
    if (allPurchasesRaw.length === 0 && allSales.length === 0 && (patient.isSimulation || String(pId).startsWith('SIM-') || pName.includes('[SIMULADO]'))) {
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
          attendance_id: 'VD-DEMO-01',
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
          attendance_id: 'VD-DEMO-01',
          pharmacist_name: 'Marcelo Mazaro',
          created_at: new Date(Date.now() - 24 * 86400000).toISOString()
        }
      ];

      mockItems.forEach(item => localDB.insert('patient_purchases', item));
      allPurchasesRaw = mockItems;
    }

    // 2. AGRUPAMENTO ESTRUTURADO POR COMPRA (Venda / Protocolo)
    const purchasesMap = new Map();

    // Primeiro indexa vendas registradas em 'sales'
    allSales.forEach(sale => {
      const proto = sale.protocol || `VD-${Date.now().toString().slice(-6)}`;
      const items = (sale.items || []).map(i => ({
        product_name: i.product?.name || i.name || 'Produto',
        quantity: parseInt(i.quantity || 1, 10),
        unit_price: parseFloat(i.unitPrice || 0),
        total_price: parseFloat(i.subtotal || (i.quantity * i.unitPrice) || 0),
        batch: i.product?.batch || 'L-DISP-2026',
        is_continuous: (i.product?.category && i.product.category.includes('Contínuo')) || false,
        refill_date: null
      }));

      purchasesMap.set(proto, {
        protocol: proto,
        created_at: sale.created_at || new Date().toISOString(),
        pharmacist_name: sale.operatorName || 'Farmacêutico Responsável',
        paymentMethod: sale.paymentMethod || 'Dinheiro / Balcão',
        subtotalGross: parseFloat(sale.subtotalGross || sale.totalSale || 0),
        discount: parseFloat(sale.discount || 0),
        totalSale: parseFloat(sale.totalSale || 0),
        items: items,
        fromSalesTable: true
      });
    });

    // Depois agrupa itens de 'patient_purchases'
    allPurchasesRaw.forEach(pur => {
      const proto = pur.attendance_id || pur.protocol || (pur.created_at ? `COMPRA-${pur.created_at.slice(0, 16)}` : 'COMPRA-AVULSA');
      
      if (!purchasesMap.has(proto)) {
        purchasesMap.set(proto, {
          protocol: proto.startsWith('VD-') || proto.startsWith('ATT-') ? proto : `VD-${proto.replace(/\D/g, '').slice(-6) || '782910'}`,
          created_at: pur.created_at || new Date().toISOString(),
          pharmacist_name: pur.pharmacist_name || 'Farmacêutico Responsável',
          paymentMethod: 'Balcão / Caixa',
          subtotalGross: 0,
          discount: 0,
          totalSale: 0,
          items: [],
          fromSalesTable: false
        });
      }

      const purchaseGroup = purchasesMap.get(proto);
      if (!purchaseGroup.fromSalesTable) {
        const itemPrice = parseFloat(pur.total_price || (pur.unit_price * (pur.quantity || 1)) || 0);
        purchaseGroup.items.push({
          product_name: pur.product_name || 'Medicamento Dispensado',
          quantity: parseInt(pur.quantity || 1, 10),
          unit_price: parseFloat(pur.unit_price || itemPrice),
          total_price: itemPrice,
          batch: pur.batch || 'L-DISP-2026',
          is_continuous: pur.is_continuous || false,
          refill_date: pur.refill_date || null
        });
        purchaseGroup.totalSale += itemPrice;
        purchaseGroup.subtotalGross += itemPrice;
      }
    });

    // Lista final de compras agrupadas
    const groupedPurchases = Array.from(purchasesMap.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Totais consolidados
    const totalPurchasesCount = groupedPurchases.length;
    const totalItemsCount = groupedPurchases.reduce((acc, p) => acc + p.items.reduce((s, i) => s + (i.quantity || 1), 0), 0);
    const totalSpent = groupedPurchases.reduce((acc, p) => acc + (parseFloat(p.totalSale || 0)), 0);

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
      <div style="max-width: 860px; width: 100%; max-height: 92vh; display: flex; flex-direction: column; background: #0f172a; border: 1.5px solid rgba(16, 185, 129, 0.4); border-radius: 20px; box-shadow: 0 25px 70px rgba(0,0,0,0.9), 0 0 30px rgba(16, 185, 129, 0.15); overflow: hidden;">
        
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
          <div style="display: flex; gap: 24px;">
            <div>
              <small style="color: #94a3b8; font-size: 0.72rem; text-transform: uppercase; font-weight: 600;">Total de Compras</small>
              <div style="color: #fff; font-size: 1.15rem; font-weight: 800; font-family: 'Outfit';">${totalPurchasesCount} compra${totalPurchasesCount !== 1 ? 's' : ''}</div>
            </div>
            <div>
              <small style="color: #94a3b8; font-size: 0.72rem; text-transform: uppercase; font-weight: 600;">Itens Dispensados</small>
              <div style="color: #38bdf8; font-size: 1.15rem; font-weight: 800; font-family: 'Outfit';">${totalItemsCount} produto${totalItemsCount !== 1 ? 's' : ''}</div>
            </div>
            <div>
              <small style="color: #94a3b8; font-size: 0.72rem; text-transform: uppercase; font-weight: 600;">Valor Total Acumulado</small>
              <div style="color: #34d399; font-size: 1.15rem; font-weight: 800; font-family: 'Outfit';">R$ ${totalSpent.toFixed(2).replace('.', ',')}</div>
            </div>
          </div>
          <button type="button" id="btn-new-sale-for-patient" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);">
            <i class="fa-solid fa-cash-register"></i> + Nova Venda / Dispensação no Caixa
          </button>
        </div>

        <!-- Conteúdo Scrollável Agrupado por Compra -->
        <div style="padding: 20px 22px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 14px;">
          ${groupedPurchases.length === 0 ? `
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
            <div style="display: flex; flex-direction: column; gap: 14px;">
              ${groupedPurchases.map((purchase, index) => {
                const dt = purchase.created_at ? new Date(purchase.created_at).toLocaleString('pt-BR') : 'Data não informada';
                const totalPurchaseVal = parseFloat(purchase.totalSale || 0).toFixed(2).replace('.', ',');
                
                // Checar se algum item tem alerta de uso contínuo
                const continuousItem = purchase.items.find(i => i.is_continuous);
                let refillBanner = '';
                if (continuousItem && continuousItem.refill_date) {
                  const daysToRefill = Math.ceil((new Date(continuousItem.refill_date) - new Date()) / (1000 * 60 * 60 * 24));
                  const isLate = daysToRefill <= 0;
                  refillBanner = `
                    <div style="margin-top: 10px; background: ${isLate ? 'rgba(239, 68, 68, 0.12)' : 'rgba(56, 189, 248, 0.1)'}; border: 1px solid ${isLate ? 'rgba(239, 68, 68, 0.35)' : 'rgba(56, 189, 248, 0.3)'}; border-radius: 8px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                      <span style="font-size: 0.76rem; color: ${isLate ? '#f87171' : '#38bdf8'}; font-weight: 600;">
                        <i class="fa-solid fa-clock-rotate-left"></i> Uso Contínuo (${continuousItem.product_name}): Previsão de Recompra em <strong>${continuousItem.refill_date.split('-').reverse().join('/')} (${isLate ? 'Tratamento Vencido / Repor Imediatamente' : `faltam ${daysToRefill} dias`})</strong>
                      </span>
                      <button type="button" class="btn-whatsapp-refill" data-med="${continuousItem.product_name}" data-date="${continuousItem.refill_date}" style="background: #25d366; color: #000; font-size: 0.72rem; font-weight: 800; border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <i class="fa-brands fa-whatsapp"></i> Lembrar Recompra
                      </button>
                    </div>
                  `;
                }

                // Objeto de dados serializado para emissão do cupom
                const saleDataForPrint = {
                  protocol: purchase.protocol,
                  clientName: pName,
                  clientCpf: patient.cpf || '',
                  items: purchase.items.map(it => ({
                    product: { name: it.product_name, batch: it.batch },
                    name: it.product_name,
                    quantity: it.quantity,
                    unitPrice: it.unit_price,
                    subtotal: it.total_price
                  })),
                  subtotalGross: purchase.subtotalGross || purchase.totalSale,
                  discount: purchase.discount || 0,
                  totalSale: purchase.totalSale,
                  paymentMethod: purchase.paymentMethod,
                  operatorName: purchase.pharmacist_name,
                  created_at: purchase.created_at
                };

                return `
                  <!-- CARD DA COMPRA CONSOLIDADA -->
                  <div class="purchase-order-card" style="background: rgba(30, 41, 59, 0.7); border: 1.5px solid rgba(255,255,255,0.09); border-radius: 14px; padding: 14px 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.2);">
                    
                    <!-- Topo da Compra -->
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 3px 8px; border-radius: 6px; font-weight: 800; font-size: 0.78rem; font-family: monospace;">
                          #${purchase.protocol}
                        </span>
                        <span style="font-size: 0.8rem; color: #cbd5e1; font-weight: 600;">
                          📅 ${dt}
                        </span>
                        <span style="font-size: 0.74rem; background: rgba(255,255,255,0.06); color: #94a3b8; padding: 2px 8px; border-radius: 6px;">
                          💳 ${purchase.paymentMethod}
                        </span>
                      </div>

                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 0.74rem; color: #94a3b8;">Total da Compra:</span>
                        <span style="color: #34d399; font-weight: 900; font-size: 1.15rem; font-family: 'Outfit';">
                          R$ ${totalPurchaseVal}
                        </span>
                      </div>
                    </div>

                    <!-- Lista de Produtos Comprados nesta Compra -->
                    <div style="display: flex; flex-direction: column; gap: 6px; background: rgba(15, 23, 42, 0.6); border-radius: 10px; padding: 10px 12px; border: 1px solid rgba(255,255,255,0.04);">
                      <div style="font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px; display: flex; justify-content: space-between;">
                        <span>PRODUTO DISPENSADO (${purchase.items.length} item${purchase.items.length !== 1 ? 's' : ''})</span>
                        <span>VALOR</span>
                      </div>
                      ${purchase.items.map((it, idx) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.84rem; padding: 4px 0; ${idx !== purchase.items.length - 1 ? 'border-bottom: 1px dashed rgba(255,255,255,0.06);' : ''}">
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-weight: 700; color: #38bdf8; font-size: 0.78rem;">${it.quantity}x</span>
                            <span style="color: #f8fafc; font-weight: 600;">${it.product_name}</span>
                            ${it.batch ? `<code style="font-size: 0.68rem; color: #94a3b8; background: rgba(255,255,255,0.05); padding: 1px 4px; border-radius: 4px;">Lote: ${it.batch}</code>` : ''}
                            ${it.is_continuous ? '<span style="font-size: 0.62rem; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56,189,248,0.4); padding: 1px 5px; border-radius: 4px; font-weight: 700;">CONTÍNUO</span>' : ''}
                          </div>
                          <div style="font-weight: 700; color: #f1f5f9;">
                            R$ ${parseFloat(it.total_price || (it.unit_price * it.quantity) || 0).toFixed(2).replace('.', ',')}
                          </div>
                        </div>
                      `).join('')}
                    </div>

                    ${refillBanner}

                    <!-- Ações da Compra (Cupom Térmico e PDF) -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; gap: 8px;">
                      <div style="font-size: 0.74rem; color: #94a3b8;">
                        <i class="fa-solid fa-user-doctor"></i> Responsável: <strong style="color: #cbd5e1;">${purchase.pharmacist_name}</strong>
                      </div>

                      <div style="display: flex; align-items: center; gap: 8px;">
                        <button type="button" 
                          onclick="window.emitFullPurchaseThermalReceipt(this)"
                          class="btn-print-full-purchase-receipt" 
                          data-sale-json="${encodeURIComponent(JSON.stringify(saleDataForPrint))}"
                          style="background: rgba(254, 240, 138, 0.15); border: 1.5px solid #fef08a; color: #fef08a; font-size: 0.76rem; font-weight: 800; padding: 6px 14px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(254, 240, 138, 0.2); transition: 0.2s;">
                          <i class="fa-solid fa-receipt"></i> 🖨️ Emitir Cupom Térmico (80mm)
                        </button>
                        <button type="button" 
                          onclick="window.downloadFullPurchasePdf(this)"
                          class="btn-download-full-purchase-pdf" 
                          data-sale-json="${encodeURIComponent(JSON.stringify(saleDataForPrint))}"
                          style="background: linear-gradient(135deg, #10b981, #059669); border: none; color: #ffffff; font-size: 0.76rem; font-weight: 800; padding: 6px 14px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35); transition: 0.2s;">
                          <i class="fa-solid fa-file-pdf"></i> 📥 Baixar PDF
                        </button>
                      </div>
                    </div>

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

// Exportações globais para acionamento direto via onclick
if (typeof window !== 'undefined') {
  window.openPatientPurchasesModal = openPatientPurchasesModal;

  window.emitFullPurchaseThermalReceipt = function(btn) {
    try {
      if (!btn) return;
      const raw = btn.getAttribute('data-sale-json');
      if (!raw) {
        showToast('⚠️ Dados da compra não encontrados.');
        return;
      }
      const saleObj = JSON.parse(decodeURIComponent(raw));
      showToast('🖨️ Abrindo Cupom Térmico (Bobina Amarela)...');
      if (typeof printThermalReceipt === 'function') {
        printThermalReceipt(saleObj, '80mm');
      } else if (window.printThermalReceipt) {
        window.printThermalReceipt(saleObj, '80mm');
      }
    } catch(e) {
      console.error('Erro ao emitir cupom térmico:', e);
      showToast('Erro ao processar cupom térmico.');
    }
  };

  window.downloadFullPurchasePdf = function(btn) {
    try {
      if (!btn) return;
      const raw = btn.getAttribute('data-sale-json');
      if (!raw) {
        showToast('⚠️ Dados da compra não encontrados.');
        return;
      }
      const saleObj = JSON.parse(decodeURIComponent(raw));
      showToast('📥 Baixando Cupom em PDF...');
      if (typeof exportThermalReceiptPDF === 'function') {
        exportThermalReceiptPDF(saleObj, '80mm');
      } else if (window.exportThermalReceiptPDF) {
        window.exportThermalReceiptPDF(saleObj, '80mm');
      }
    } catch(e) {
      console.error('Erro ao baixar PDF:', e);
      showToast('Erro ao baixar arquivo PDF.');
    }
  };
}
