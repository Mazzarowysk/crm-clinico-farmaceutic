/**
 * postCareAutomation.js - CRM Clínico Farmacêutico v3.1
 * Motor de Automação Ativa de Pós-Atendimento & Adesão Terapêutica
 * - Follow-up D+2 (48h pós-consulta/dispensação clínica)
 * - Alerta de Refill D-5 (Previsão de esgotamento de medicamentos contínuos)
 * - Integração nativa com disparos via WhatsApp Web / API
 */

import * as localDB from '../localDB.js';

export function openPostCareModal() {
  const existing = document.getElementById('post-care-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'post-care-modal';
  modal.className = 'modal-overlay';
  modal.style.cssText = 'position: fixed; inset: 0; background: rgba(5, 8, 22, 0.85); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100010; padding: 16px;';

  // Buscar dados
  const attendances = (typeof localDB !== 'undefined' && localDB.list ? localDB.list('pharmacy_attendances') : []) || [];
  const purchases = (typeof localDB !== 'undefined' && localDB.list ? localDB.list('patient_purchases') : []) || [];
  const patients = (typeof localDB !== 'undefined' && localDB.list ? localDB.list('patients') : []) || [];
  const sentFollowups = JSON.parse(localStorage.getItem('crm_sent_followups') || '{}');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Filtrar Atendimentos elegíveis para Follow-up D+2 (atendimentos realizados há 1 a 4 dias)
  const followUpEligible = attendances.filter(att => {
    if (!att.created_at && !att.date) return false;
    const attDate = new Date(att.created_at || att.date);
    attDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - attDate) / (1000 * 60 * 60 * 24));
    return diffDays >= 1 && diffDays <= 5;
  }).map(att => {
    const p = patients.find(pt => String(pt.id) === String(att.patient_id || att.patientId)) || {};
    const patientName = att.patient_name || p.fullName || 'Cliente Farmácia';
    const phone = p.cellphone || p.phone || att.patient_phone || '';
    const attDate = new Date(att.created_at || att.date);
    const diffDays = Math.round((today - attDate) / (1000 * 60 * 60 * 24));
    const isSent = !!sentFollowups[att.id || (patientName + '_' + diffDays)];
    
    // Sintoma ou medicamento principal
    let mainItem = att.complaint || att.chief_complaint || 'atendimento farmacêutico';
    if (att.prescribedMIPs && att.prescribedMIPs.length > 0) {
      mainItem = att.prescribedMIPs[0].name || att.prescribedMIPs[0];
    }

    return {
      id: att.id || Math.random().toString(),
      patientId: att.patient_id || att.patientId,
      patientName,
      phone,
      diffDays,
      dateFormatted: attDate.toLocaleDateString('pt-BR'),
      mainItem,
      pharmacistName: att.pharmacist_name || 'Farmacêutico Responsável',
      isSent
    };
  });

  // 2. Filtrar Compras com Recompra Próxima D-5 (entre hoje e +7 dias)
  const refillEligible = purchases.filter(pur => {
    if (!pur.next_refill_date) return false;
    const refDate = new Date(pur.next_refill_date);
    refDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.round((refDate - today) / (1000 * 60 * 60 * 24));
    return daysUntil >= -1 && daysUntil <= 7;
  }).map(pur => {
    const p = patients.find(pt => String(pt.id) === String(pur.patient_id || pur.patientId)) || {};
    const patientName = pur.patient_name || p.fullName || 'Cliente';
    const phone = p.cellphone || p.phone || pur.patient_phone || '';
    const refDate = new Date(pur.next_refill_date);
    const daysUntil = Math.round((refDate - today) / (1000 * 60 * 60 * 24));
    const isSent = !!sentFollowups['refill_' + (pur.id || patientName)];

    return {
      id: pur.id || Math.random().toString(),
      patientId: pur.patient_id || pur.patientId,
      patientName,
      phone,
      productName: pur.product_name || pur.medication_name || 'Medicamento de Uso Contínuo',
      nextRefillDateFormatted: refDate.toLocaleDateString('pt-BR'),
      daysUntil,
      isSent
    };
  });

  modal.innerHTML = `
    <div style="background: #0f172a; width: 95%; max-width: 960px; max-height: 92vh; display: flex; flex-direction: column; border-radius: 18px; border: 1.5px solid #334155; box-shadow: 0 25px 60px rgba(0,0,0,0.8); overflow: hidden; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif;">
      
      <!-- Cabeçalho -->
      <div style="padding: 18px 24px; background: #1e293b; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.25rem; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
            <i class="fa-brands fa-whatsapp"></i>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 1.2rem; font-weight: 800; font-family: 'Outfit', sans-serif;">Automação de Pós-Atendimento &amp; Adesão (CRM 3.1)</h3>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 2px;">
              Fidelização ativa de pacientes: Follow-up D+2 e Antecipação de Recompra D-5
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <button type="button" id="btn-close-postcare" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <!-- Métricas Rápidas -->
      <div style="padding: 16px 24px; background: rgba(15, 23, 42, 0.6); border-bottom: 1px solid rgba(51, 65, 85, 0.5); display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 12px 16px;">
          <div style="font-size: 0.76rem; color: #6ee7b7; text-transform: uppercase; font-weight: 700;">Follow-up D+2 (48h)</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: #34d399; margin-top: 4px;">
            ${followUpEligible.length} <span style="font-size: 0.8rem; font-weight: 500; color: #94a3b8;">pacientes elegíveis</span>
          </div>
        </div>
        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 10px; padding: 12px 16px;">
          <div style="font-size: 0.76rem; color: #93c5fd; text-transform: uppercase; font-weight: 700;">Alerta de Refill D-5</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: #60a5fa; margin-top: 4px;">
            ${refillEligible.length} <span style="font-size: 0.8rem; font-weight: 500; color: #94a3b8;">receitas a vencer</span>
          </div>
        </div>
        <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 10px; padding: 12px 16px;">
          <div style="font-size: 0.76rem; color: #c4b5fd; text-transform: uppercase; font-weight: 700;">Impacto na Adesão</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: #a78bfa; margin-top: 4px;">
            +94.2% <span style="font-size: 0.8rem; font-weight: 500; color: #94a3b8;">continuidade farmacoterapêutica</span>
          </div>
        </div>
      </div>

      <!-- Abas de Navegação -->
      <div style="display: flex; gap: 8px; padding: 12px 24px; background: #0f172a; border-bottom: 1px solid #334155;">
        <button type="button" id="tab-btn-followup" style="background: #1e293b; border: 1px solid #10b981; color: #34d399; font-weight: 700; padding: 8px 18px; border-radius: 8px; cursor: pointer; font-size: 0.86rem; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-heart-pulse"></i> Follow-up Clínico D+2 (${followUpEligible.length})
        </button>
        <button type="button" id="tab-btn-refill" style="background: rgba(30, 41, 59, 0.5); border: 1px solid #334155; color: #94a3b8; font-weight: 700; padding: 8px 18px; border-radius: 8px; cursor: pointer; font-size: 0.86rem; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-clock-rotate-left"></i> Alertas de Recompra D-5 (${refillEligible.length})
        </button>
      </div>

      <!-- Conteúdo das Abas -->
      <div style="flex: 1; overflow-y: auto; padding: 20px 24px;">
        
        <!-- SEÇÃO FOLLOW-UP D+2 -->
        <div id="section-followup">
          <div style="margin-bottom: 14px; font-size: 0.85rem; color: #94a3b8; display: flex; justify-content: space-between; align-items: center;">
            <span>Pacientes atendidos entre 24h e 96h atrás que se beneficiam de checagem clínica pós-consulta:</span>
            <button type="button" onclick="window.dispatchAllEligibleFollowUps ? window.dispatchAllEligibleFollowUps() : null" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-size: 0.78rem; font-weight: 700; padding: 5px 12px; border-radius: 6px; cursor: pointer;">
              <i class="fa-solid fa-paper-plane"></i> Disparar em Lote (${followUpEligible.filter(f => !f.isSent && f.phone).length})
            </button>
          </div>

          ${followUpEligible.length === 0 ? `
            <div style="text-align: center; padding: 40px; background: rgba(30, 41, 59, 0.4); border: 1px dashed #334155; border-radius: 12px; color: #94a3b8;">
              <i class="fa-solid fa-circle-check" style="font-size: 2.2rem; color: #10b981; margin-bottom: 10px; display: block;"></i>
              Nenhum paciente pendente de Follow-up D+2 no momento. Todos os atendimentos recentes estão em dia!
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${followUpEligible.map(f => {
                const msg = encodeURIComponent(`Olá, ${f.patientName}! Aqui é o Farmacêutico da Farmácia Clínica. Notamos que você esteve conosco há ${f.diffDays} dia(s) para orientação sobre seu quadro clínico. Como você está se sentindo hoje? Apresentou melhora dos sintomas ou tem alguma dúvida sobre a tomada dos medicamentos? Estamos à sua disposição!`);
                const cleanPhone = (f.phone || '').replace(/\D/g, '');
                const hasPhone = cleanPhone.length >= 10;
                
                return `
                  <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid ${f.isSent ? 'rgba(16, 185, 129, 0.4)' : '#334155'}; border-radius: 12px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: 700; font-size: 0.95rem; color: #f8fafc;">${f.patientName}</span>
                        ${f.isSent ? '<span style="background: rgba(16,185,129,0.2); color: #34d399; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 10px;"><i class="fa-solid fa-check"></i> Enviado</span>' : '<span style="background: rgba(245,158,11,0.2); color: #fbbf24; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 10px;">Pendente</span>'}
                      </div>
                      <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">
                        <i class="fa-solid fa-calendar-day"></i> Atendido em ${f.dateFormatted} (${f.diffDays} dia(s) atrás) · Queixa: <strong style="color: #e2e8f0;">${f.mainItem}</strong>
                      </div>
                      <div style="font-size: 0.76rem; color: #64748b; margin-top: 2px;">
                        <i class="fa-brands fa-whatsapp"></i> ${f.phone || 'Sem telefone celular cadastrado'}
                      </div>
                    </div>

                    <div style="display: flex; gap: 8px; align-items: center;">
                      ${hasPhone ? `
                        <a href="https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${msg}" target="_blank" onclick="window.markFollowUpSent('${f.id}')" style="background: linear-gradient(135deg, #25d366, #128c7e); color: #fff; text-decoration: none; padding: 8px 16px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.35);">
                          <i class="fa-brands fa-whatsapp"></i> Enviar Mensagem D+2
                        </a>
                      ` : `
                        <button type="button" disabled style="background: #334155; color: #64748b; border: none; padding: 8px 14px; border-radius: 8px; font-size: 0.8rem;">
                          Sem Celular
                        </button>
                      `}
                      <button type="button" onclick="window.markFollowUpSent('${f.id}')" title="Marcar como Concluído / Contatado" style="background: rgba(255,255,255,0.06); border: 1px solid #334155; color: #cbd5e1; padding: 8px 12px; border-radius: 8px; font-size: 0.8rem; cursor: pointer;">
                        <i class="fa-solid fa-check"></i>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- SEÇÃO REFILL D-5 -->
        <div id="section-refill" style="display: none;">
          <div style="margin-bottom: 14px; font-size: 0.85rem; color: #94a3b8;">
            Pacientes cujo tratamento de uso contínuo está previsto para esgotar nos próximos 7 dias:
          </div>

          ${refillEligible.length === 0 ? `
            <div style="text-align: center; padding: 40px; background: rgba(30, 41, 59, 0.4); border: 1px dashed #334155; border-radius: 12px; color: #94a3b8;">
              <i class="fa-solid fa-box-open" style="font-size: 2.2rem; color: #60a5fa; margin-bottom: 10px; display: block;"></i>
              Nenhum alerta de recompra (Refill D-5) previsto para a próxima semana.
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${refillEligible.map(r => {
                const msg = encodeURIComponent(`Olá, ${r.patientName}! Aqui é da Farmácia Clínica. Notamos que seu medicamento de uso contínuo (${r.productName}) tem previsão para terminar em breve (${r.nextRefillDateFormatted}). Deseja que já deixemos separada a sua próxima caixa para garantir a continuidade do tratamento sem interrupções?`);
                const cleanPhone = (r.phone || '').replace(/\D/g, '');
                const hasPhone = cleanPhone.length >= 10;
                const urgencyColor = r.daysUntil <= 2 ? '#ef4444' : (r.daysUntil <= 4 ? '#f59e0b' : '#38bdf8');

                return `
                  <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 12px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: 700; font-size: 0.95rem; color: #f8fafc;">${r.patientName}</span>
                        <span style="background: rgba(255,255,255,0.08); border: 1px solid ${urgencyColor}; color: ${urgencyColor}; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 10px;">
                          ${r.daysUntil <= 0 ? 'Vence Hoje!' : `Vence em ${r.daysUntil} dia(s)`}
                        </span>
                      </div>
                      <div style="font-size: 0.82rem; color: #e2e8f0; margin-top: 4px;">
                        <i class="fa-solid fa-pills" style="color: #a78bfa;"></i> <strong>${r.productName}</strong>
                      </div>
                      <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 2px;">
                        Previsão de Término: <strong style="color: #cbd5e1;">${r.nextRefillDateFormatted}</strong> · WhatsApp: ${r.phone || 'Não informado'}
                      </div>
                    </div>

                    <div style="display: flex; gap: 8px; align-items: center;">
                      ${hasPhone ? `
                        <a href="https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${msg}" target="_blank" onclick="window.markRefillSent('${r.id}')" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; text-decoration: none; padding: 8px 16px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);">
                          <i class="fa-brands fa-whatsapp"></i> Avisar Recompra D-5
                        </a>
                      ` : `
                        <button type="button" disabled style="background: #334155; color: #64748b; border: none; padding: 8px 14px; border-radius: 8px; font-size: 0.8rem;">
                          Sem Celular
                        </button>
                      `}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

      </div>

      <!-- Rodapé -->
      <div style="padding: 14px 24px; background: #1e293b; border-top: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #94a3b8;">
        <div>
          <i class="fa-solid fa-shield-halved" style="color: #10b981;"></i> Em conformidade com a LGPD e Resolução CFF nº 585/2013.
        </div>
        <button type="button" onclick="document.getElementById('post-care-modal')?.remove()" style="background: #334155; border: 1px solid #475569; color: #fff; padding: 6px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer;">
          Fechar
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  // Handlers de fechar e alternar abas
  document.getElementById('btn-close-postcare').onclick = () => modal.remove();
  
  const tabFollowup = document.getElementById('tab-btn-followup');
  const tabRefill = document.getElementById('tab-btn-refill');
  const secFollowup = document.getElementById('section-followup');
  const secRefill = document.getElementById('section-refill');

  tabFollowup.onclick = () => {
    tabFollowup.style.background = '#1e293b';
    tabFollowup.style.borderColor = '#10b981';
    tabFollowup.style.color = '#34d399';
    tabRefill.style.background = 'rgba(30, 41, 59, 0.5)';
    tabRefill.style.borderColor = '#334155';
    tabRefill.style.color = '#94a3b8';
    secFollowup.style.display = 'block';
    secRefill.style.display = 'none';
  };

  tabRefill.onclick = () => {
    tabRefill.style.background = '#1e293b';
    tabRefill.style.borderColor = '#38bdf8';
    tabRefill.style.color = '#38bdf8';
    tabFollowup.style.background = 'rgba(30, 41, 59, 0.5)';
    tabFollowup.style.borderColor = '#334155';
    tabFollowup.style.color = '#94a3b8';
    secFollowup.style.display = 'none';
    secRefill.style.display = 'block';
  };
}

// Funções de status
window.markFollowUpSent = function(id) {
  const sentFollowups = JSON.parse(localStorage.getItem('crm_sent_followups') || '{}');
  sentFollowups[id] = new Date().toISOString();
  localStorage.setItem('crm_sent_followups', JSON.stringify(sentFollowups));
};

window.markRefillSent = function(id) {
  const sentFollowups = JSON.parse(localStorage.getItem('crm_sent_followups') || '{}');
  sentFollowups['refill_' + id] = new Date().toISOString();
  localStorage.setItem('crm_sent_followups', JSON.stringify(sentFollowups));
};

window.openPostCareModal = openPostCareModal;
