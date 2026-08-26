// src/modules/patientPortal.js
// PORTAL DO PACIENTE PWA (MINHA SAÚDE DIGITAL: AFERIÇÕES, LAUDOS DSF, DESPERTADOR DE REMÉDIOS E CARTEIRA DE VACINAS)

import * as localDB from '../localDB.js';
import { state } from '../state.js';
import { showToast, showCustomAlert } from './ui.js';
import { playBeepSound } from './barcodeScanner.js';
import { printVaccinationDsf } from './vaccination.js';

// Abre a visualização do Portal do Paciente
export function openPatientPortalModal(patient = null) {
  const existing = document.getElementById('patient-portal-modal');
  if (existing) existing.remove();

  const activePatient = patient || state.activePatient || (localDB.list('pharmacy_patients') || [])[0] || {
    id: 'demo',
    name: 'Paciente Exemplo',
    cpf: '123.456.789-00',
    phone: '(11) 98765-4321',
    birthDate: '1985-06-15'
  };

  const settings = localDB.get('settings', 'main') || {};
  const pharmacyName = settings.clinic_name || settings.pharmacy_name || 'Farmácia & Consultório Farmacêutico';
  const pharmacyPhone = (settings.phone || settings.whatsapp || '11999999999').replace(/\D/g, '');

  // Buscar dados do paciente no banco local
  const allVacs = (localDB.list('vaccination_applications') || []).filter(v => v.patient?.id === activePatient.id || v.patient?.name === (activePatient.name || activePatient.fullName));
  const allConsultations = (localDB.list('clinical_records') || []).filter(c => c.patient_id === activePatient.id);
  
  // Lista de alarmes / medicamentos cadastrados para despertar
  let reminders = JSON.parse(localStorage.getItem(`portal_reminders_${activePatient.id}`) || 'null');
  if (!reminders) {
    reminders = [
      { id: '1', medName: 'Losartana Potássica 50mg', time: '08:00', frequency: '1x ao dia (Manhã)', takenToday: true, streakDays: 14 },
      { id: '2', medName: 'Metformina 850mg', time: '12:30', frequency: '2x ao dia (Almoço e Jantar)', takenToday: false, streakDays: 14 },
      { id: '3', medName: 'Atorvastatina 20mg', time: '21:00', frequency: '1x ao dia (Noite)', takenToday: false, streakDays: 12 }
    ];
    localStorage.setItem(`portal_reminders_${activePatient.id}`, JSON.stringify(reminders));
  }

  const modal = document.createElement('div');
  modal.id = 'patient-portal-modal';
  modal.className = 'pep-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 15, 29, 0.94); backdrop-filter: blur(16px);
    display: flex; justify-content: center; align-items: center; z-index: 10012; padding: 12px;
  `;

  modal.innerHTML = `
    <div style="width: 100%; max-width: 440px; height: 94vh; max-height: 820px; display: flex; flex-direction: column; background: #0f172a; border: 2px solid rgba(56, 189, 248, 0.4); border-radius: 28px; box-shadow: 0 25px 70px rgba(0,0,0,0.95); overflow: hidden; position: relative;">
      
      <!-- Top Bar Estilo Celular (Notch & Status) -->
      <div style="background: #0284c7; padding: 12px 16px 14px; color: #fff; display: flex; justify-content: space-between; align-items: center; border-top-left-radius: 26px; border-top-right-radius: 26px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
            <i class="fa-solid fa-heart-pulse"></i>
          </div>
          <div>
            <div style="font-weight: 800; font-family: 'Outfit'; font-size: 1rem; line-height: 1.1;">Portal Minha Saúde</div>
            <div style="font-size: 0.68rem; opacity: 0.9;">${pharmacyName}</div>
          </div>
        </div>
        <button id="btn-close-portal" style="background: rgba(255,255,255,0.15); border: none; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Identificação do Paciente -->
      <div style="background: linear-gradient(180deg, #0284c7 0%, rgba(15, 23, 42, 0.9) 100%); padding: 0 16px 14px;">
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: #fff; font-size: 0.88rem; display: block;">${activePatient.name || activePatient.fullName}</strong>
            <small style="color: #94a3b8; font-size: 0.72rem;">CPF: ${activePatient.cpf || 'Não informado'}</small>
          </div>
          <span style="font-size: 0.68rem; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16,185,129,0.4); padding: 2px 7px; border-radius: 10px; font-weight: 700;">
            CONECTADO
          </span>
        </div>
      </div>

      <!-- Abas de Navegação Inferior / Módulos -->
      <div style="display: flex; justify-content: space-around; background: rgba(30, 41, 59, 0.8); border-bottom: 1px solid rgba(255,255,255,0.08); padding: 8px 6px;">
        <button type="button" class="portal-nav-tab active" data-target="portal-tab-alarms" style="background: none; border: none; color: #38bdf8; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px;">
          <i class="fa-solid fa-bell" style="font-size: 1.1rem;"></i> Despertador
        </button>
        <button type="button" class="portal-nav-tab" data-target="portal-tab-vitals" style="background: none; border: none; color: #94a3b8; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px;">
          <i class="fa-solid fa-chart-line" style="font-size: 1.1rem;"></i> Aferições
        </button>
        <button type="button" class="portal-nav-tab" data-target="portal-tab-vaccines" style="background: none; border: none; color: #94a3b8; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px;">
          <i class="fa-solid fa-shield-halved" style="font-size: 1.1rem;"></i> Vacinas
        </button>
        <button type="button" class="portal-nav-tab" data-target="portal-tab-dsf" style="background: none; border: none; color: #94a3b8; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px;">
          <i class="fa-solid fa-file-medical" style="font-size: 1.1rem;"></i> Laudos DSF
        </button>
      </div>

      <!-- Conteúdo das Abas (Scrollável) -->
      <div style="flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 12px;">
        
        <!-- ABA 1: DESPERTADOR DE REMÉDIOS -->
        <div id="portal-tab-alarms" class="portal-tab-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="color: #fff; font-size: 0.85rem; font-family: 'Outfit';">
              ⏰ Próximas Tomadas de Remédio
            </strong>
            <button type="button" id="btn-add-alarm" style="background: rgba(56, 189, 248, 0.2); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; cursor: pointer;">
              + Alarme
            </button>
          </div>

          <div id="portal-alarms-list" style="display: flex; flex-direction: column; gap: 8px;">
            ${reminders.map((r, idx) => `
              <div style="background: rgba(30, 41, 59, 0.7); border: 1.5px solid ${r.takenToday ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.3)'}; border-radius: 12px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-family: monospace; font-size: 1rem; font-weight: 800; color: #38bdf8;">${r.time}</span>
                    <strong style="color: #fff; font-size: 0.82rem;">${r.medName}</strong>
                  </div>
                  <small style="color: #94a3b8; font-size: 0.7rem; display: block; margin-top: 2px;">
                    ${r.frequency} • <span style="color: #34d399;">🔥 ${r.streakDays || 1} dias seguidos</span>
                  </small>
                </div>

                <button type="button" class="btn-toggle-taken" data-index="${idx}" style="background: ${r.takenToday ? '#059669' : 'rgba(255,255,255,0.08)'}; border: 1px solid ${r.takenToday ? '#10b981' : 'rgba(255,255,255,0.15)'}; color: ${r.takenToday ? '#fff' : '#94a3b8'}; padding: 6px 10px; border-radius: 8px; font-size: 0.74rem; font-weight: 700; cursor: pointer;">
                  ${r.takenToday ? '✓ Tomado' : 'Tomar'}
                </button>
              </div>
            `).join('')}
          </div>

          <!-- Card de Adesão Farmacoterapêutica -->
          <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.6)); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 14px; padding: 12px; margin-top: 14px; text-align: center;">
            <div style="font-size: 0.75rem; color: #94a3b8;">Taxa de Adesão ao Tratamento</div>
            <div style="font-size: 1.6rem; font-weight: 900; color: #34d399; font-family: 'Outfit'; margin: 2px 0;">94.8%</div>
            <small style="color: #cbd5e1; font-size: 0.72rem;">Excelente! Você tomou quase todas as doses prescritas este mês.</small>
          </div>
        </div>

        <!-- ABA 2: AFERIÇÕES CLÍNICAS -->
        <div id="portal-tab-vitals" class="portal-tab-content" style="display: none;">
          <strong style="color: #fff; font-size: 0.85rem; font-family: 'Outfit'; display: block; margin-bottom: 10px;">
            📊 Minhas Últimas Aferições no Consultório
          </strong>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #94a3b8; font-size: 0.75rem;">Pressão Arterial (PA)</span>
                <span style="font-size: 0.68rem; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 6px; border-radius: 6px; font-weight: 700;">Ótima</span>
              </div>
              <div style="font-size: 1.4rem; font-weight: 800; color: #fff; margin-top: 4px; font-family: 'Outfit';">
                118/78 <span style="font-size: 0.8rem; font-weight: normal; color: #94a3b8;">mmHg</span>
              </div>
              <small style="color: #64748b; font-size: 0.68rem;">Aferido em última consulta farmacêutica</small>
            </div>

            <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #94a3b8; font-size: 0.75rem;">Glicemia Capilar (Jejum)</span>
                <span style="font-size: 0.68rem; background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 2px 6px; border-radius: 6px; font-weight: 700;">Normal</span>
              </div>
              <div style="font-size: 1.4rem; font-weight: 800; color: #38bdf8; margin-top: 4px; font-family: 'Outfit';">
                92 <span style="font-size: 0.8rem; font-weight: normal; color: #94a3b8;">mg/dL</span>
              </div>
              <small style="color: #64748b; font-size: 0.68rem;">Alvo recomendado: 70 a 99 mg/dL</small>
            </div>

            <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #94a3b8; font-size: 0.75rem;">Índice de Massa Corporal (IMC)</span>
                <span style="font-size: 0.68rem; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 6px; border-radius: 6px; font-weight: 700;">Eutrófico</span>
              </div>
              <div style="font-size: 1.4rem; font-weight: 800; color: #34d399; margin-top: 4px; font-family: 'Outfit';">
                23.4 <span style="font-size: 0.8rem; font-weight: normal; color: #94a3b8;">kg/m²</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ABA 3: CARTEIRA DE VACINAS DIGITAL -->
        <div id="portal-tab-vaccines" class="portal-tab-content" style="display: none;">
          <strong style="color: #fff; font-size: 0.85rem; font-family: 'Outfit'; display: block; margin-bottom: 10px;">
            💉 Carteira Digital de Vacinação
          </strong>

          ${allVacs.length === 0 ? `
            <div style="text-align: center; padding: 30px 10px; color: #64748b; font-size: 0.8rem;">
              Nenhuma vacina ou injetável registrado neste consultório.
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${allVacs.map(v => `
                <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 10px 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <strong style="color: #fff; font-size: 0.84rem;">${v.item_name}</strong>
                    <span style="font-size: 0.68rem; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 6px; border-radius: 6px; font-weight: 700;">${v.dose_number}</span>
                  </div>
                  <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 3px;">
                    Aplicada em: <strong style="color: #fff;">${new Date(v.applied_at).toLocaleDateString('pt-BR')}</strong> • Lote: ${v.batch}
                  </div>
                  ${v.next_dose_date ? `
                    <div style="font-size: 0.72rem; color: #fbbf24; margin-top: 4px;">
                      📅 Próximo Reforço: <strong>${new Date(v.next_dose_date).toLocaleDateString('pt-BR')}</strong>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- ABA 4: LAUDOS E DSF EM PDF -->
        <div id="portal-tab-dsf" class="portal-tab-content" style="display: none;">
          <strong style="color: #fff; font-size: 0.85rem; font-family: 'Outfit'; display: block; margin-bottom: 10px;">
            📄 Minhas Declarações Farmacêuticas (DSF)
          </strong>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${allVacs.map(v => `
              <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="color: #fff; font-size: 0.82rem; display: block;">DSF - ${v.item_name}</strong>
                  <small style="color: #94a3b8; font-size: 0.7rem;">Protocolo #${v.protocol} • ${new Date(v.applied_at).toLocaleDateString('pt-BR')}</small>
                </div>
                <button type="button" class="btn-download-portal-dsf" data-id="${v.id}" style="background: rgba(56, 189, 248, 0.2); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; padding: 5px 9px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                  <i class="fa-solid fa-download"></i> PDF
                </button>
              </div>
            `).join('')}
          </div>
        </div>

      </div>

      <!-- Rodapé / Ação Rápida WhatsApp do Farmacêutico -->
      <div style="background: rgba(15, 23, 42, 0.95); border-top: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
        <button type="button" id="btn-portal-whatsapp-farm" style="flex: 1; background: linear-gradient(135deg, #25D366, #128C7E); color: #fff; border: none; padding: 9px; border-radius: 10px; font-weight: 700; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);">
          <i class="fa-brands fa-whatsapp"></i> Falar com o Farmacêutico
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();
  document.getElementById('btn-close-portal')?.addEventListener('click', closeModal);

  // Troca de Abas no Portal
  modal.querySelectorAll('.portal-nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      modal.querySelectorAll('.portal-nav-tab').forEach(t => {
        t.classList.remove('active');
        t.style.color = '#94a3b8';
      });
      tab.classList.add('active');
      tab.style.color = '#38bdf8';

      modal.querySelectorAll('.portal-tab-content').forEach(c => c.style.display = 'none');
      const targetId = tab.dataset.target;
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.style.display = 'block';
    });
  });

  // Botão Marcar Remédio como Tomado
  modal.querySelectorAll('.btn-toggle-taken').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      reminders[idx].takenToday = !reminders[idx].takenToday;
      if (reminders[idx].takenToday) {
        reminders[idx].streakDays = (reminders[idx].streakDays || 0) + 1;
        playBeepSound('success');
        showToast(`💊 Parabéns! Tomada de "${reminders[idx].medName}" confirmada.`);
      }
      localStorage.setItem(`portal_reminders_${activePatient.id}`, JSON.stringify(reminders));
      closeModal();
      openPatientPortalModal(activePatient);
    });
  });

  // Download DSF em PDF
  modal.querySelectorAll('.btn-download-portal-dsf').forEach(btn => {
    btn.addEventListener('click', () => {
      const vac = allVacs.find(v => v.id === btn.dataset.id);
      if (vac) printVaccinationDsf(vac);
    });
  });

  // Adicionar Novo Alarme de Medicamento
  document.getElementById('btn-add-alarm')?.addEventListener('click', () => {
    const medName = prompt('Qual o nome do medicamento para despertar? (Ex: Losartana 50mg)');
    if (!medName || !medName.trim()) return;
    const time = prompt('Qual o horário da dose? (Ex: 08:00)', '08:00');
    if (!time || !time.trim()) return;
    const freq = prompt('Frequência de tomada:', '1x ao dia (Manhã)') || '1x ao dia';

    reminders.push({
      id: Date.now().toString(),
      medName: medName.trim(),
      time: time.trim(),
      frequency: freq.trim(),
      takenToday: false,
      streakDays: 0
    });

    localStorage.setItem(`portal_reminders_${activePatient.id}`, JSON.stringify(reminders));
    showToast(`⏰ Despertador para "${medName}" configurado com sucesso!`);
    closeModal();
    openPatientPortalModal(activePatient);
  });

  // Falar com Farmacêutico via WhatsApp
  document.getElementById('btn-portal-whatsapp-farm')?.addEventListener('click', () => {
    const text = `Olá, Dr(a). Sou o paciente *${activePatient.name || activePatient.fullName}* e estou no Portal Minha Saúde. Gostaria de tirar uma dúvida sobre meu tratamento.`;
    window.open(`https://wa.me/55${pharmacyPhone}?text=${encodeURIComponent(text)}`, '_blank');
  });
}

// Vincula ao escopo global para garantir invocação em qualquer botão HTML
window.openPatientPortalModal = openPatientPortalModal;
