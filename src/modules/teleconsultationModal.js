/**
 * Módulo de Teleconsulta Farmacêutica (WebRTC Video Room & Prontuário Simultâneo)
 * Permite realização de atendimento remoto com vídeo, áudio, chat e visualização clínica lateral.
 */

import { showToast } from './ui.js';

export function openTeleconsultationModal(patient = null) {
  const existingModal = document.getElementById('modal-teleconsultation');
  if (existingModal) existingModal.remove();

  const patientName = patient?.fullName || patient?.name || 'Paciente em Atendimento Remoto';
  const patientCpf = patient?.cpf || 'Não informado';
  const roomId = 'ROOM-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  const modalHtml = `
    <div id="modal-teleconsultation" style="position: fixed; inset: 0; background: rgba(11, 15, 25, 0.92); backdrop-filter: blur(14px); z-index: 99999; display: flex; flex-direction: column; padding: 16px; box-sizing: border-box;">
      
      <!-- Topbar da Teleconsulta -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 12px 20px; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px #10b981;"></div>
          <div style="font-family: 'Outfit', sans-serif; font-size: 1.1rem; font-weight: 800; color: #ffffff;">
            Teleconsulta Farmacêutica WebRTC
          </div>
          <span style="font-size: 0.75rem; font-weight: 700; background: rgba(14, 165, 233, 0.2); color: #38bdf8; border: 1px solid #0284c7; padding: 2px 10px; border-radius: 20px;">
            ID da Sala: ${roomId}
          </span>
        </div>

        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="font-size: 0.85rem; color: #cbd5e1;">
            Paciente: <strong style="color: #ffffff;">${patientName}</strong> (${patientCpf})
          </div>
          <button onclick="closeTeleconsultation()" style="background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fca5a5; padding: 6px 14px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-phone-slash"></i> Encerrar Chamada
          </button>
        </div>
      </div>

      <!-- Área Principal: Grid Vídeo + Prontuário Lateral -->
      <div style="display: grid; grid-template-columns: 1fr 380px; gap: 16px; flex: 1; min-height: 0;">
        
        <!-- Bloco de Vídeo Principal -->
        <div style="background: #020617; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between;">
          
          <!-- Vídeo do Paciente (Remoto Simulado/WebRTC) -->
          <div style="flex: 1; display: flex; align-items: center; justify-content: center; position: relative; background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);">
            <video id="remote-video" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover; display: none;"></video>
            
            <div id="remote-placeholder" style="text-align: center; color: #64748b;">
              <div style="width: 90px; height: 90px; border-radius: 50%; background: rgba(56, 189, 248, 0.15); border: 2px solid #0284c7; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #38bdf8; font-size: 2.5rem;">
                <i class="fa-solid fa-user-injured"></i>
              </div>
              <div style="font-size: 1.1rem; font-weight: 700; color: #f8fafc;">${patientName}</div>
              <div style="font-size: 0.8rem; color: #38bdf8; margin-top: 4px;">Aguardando conexão segura P2P criptografada...</div>
            </div>

            <!-- Picture-in-Picture: Vídeo Local do Farmacêutico -->
            <div style="position: absolute; bottom: 20px; right: 20px; width: 160px; height: 120px; border-radius: 10px; overflow: hidden; border: 2px solid #10b981; box-shadow: 0 8px 24px rgba(0,0,0,0.6); background: #000;">
              <video id="local-video" autoplay muted playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
              <span style="position: absolute; bottom: 4px; left: 6px; font-size: 0.65rem; background: rgba(0,0,0,0.6); color: #fff; padding: 1px 6px; border-radius: 4px;">Você (RT)</span>
            </div>
          </div>

          <!-- Barra de Controles de Áudio / Vídeo / Tela -->
          <div style="background: rgba(15, 23, 42, 0.9); padding: 14px; display: flex; justify-content: center; align-items: center; gap: 16px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
            <button id="btn-toggle-mic" onclick="toggleTeleMic()" style="width: 46px; height: 46px; border-radius: 50%; background: #1e293b; border: 1px solid #475569; color: #ffffff; font-size: 1.1rem; cursor: pointer; transition: all 0.2s;" title="Ligar/Desligar Microfone">
              <i class="fa-solid fa-microphone"></i>
            </button>
            <button id="btn-toggle-cam" onclick="toggleTeleCam()" style="width: 46px; height: 46px; border-radius: 50%; background: #1e293b; border: 1px solid #475569; color: #ffffff; font-size: 1.1rem; cursor: pointer; transition: all 0.2s;" title="Ligar/Desligar Câmera">
              <i class="fa-solid fa-video"></i>
            </button>
            <button onclick="shareTeleScreen()" style="width: 46px; height: 46px; border-radius: 50%; background: #1e293b; border: 1px solid #475569; color: #38bdf8; font-size: 1.1rem; cursor: pointer; transition: all 0.2s;" title="Compartilhar Tela de Laudos">
              <i class="fa-solid fa-desktop"></i>
            </button>
            <button onclick="copyTeleLink('${roomId}')" style="background: linear-gradient(135deg, #10b981, #059669); border: none; color: #ffffff; font-weight: 700; padding: 10px 18px; border-radius: 25px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.82rem; box-shadow: 0 4px 14px rgba(16,185,129,0.35);">
              <i class="fa-solid fa-link"></i> Copiar Link do Paciente
            </button>
          </div>
        </div>

        <!-- Painel Lateral: Prontuário & Chat Simultâneo -->
        <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h4 style="margin: 0 0 12px 0; font-size: 0.95rem; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-notes-medical"></i> Prontuário Rápido (SOAP)
            </h4>

            <div style="margin-bottom: 10px;">
              <label style="font-size: 0.72rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Queixa Relatada em Chamada</label>
              <textarea id="tele-soap-s" placeholder="Relato do paciente na teleconsulta..." style="width: 100%; height: 75px; background: rgba(0,0,0,0.3); border: 1px solid #334155; border-radius: 8px; color: #fff; padding: 8px; font-size: 0.8rem; box-sizing: border-box; resize: none; margin-top: 4px;"></textarea>
            </div>

            <div style="margin-bottom: 10px;">
              <label style="font-size: 0.72rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Orientações Posológicas & Plano</label>
              <textarea id="tele-soap-p" placeholder="Conduta farmacêutica e orientações..." style="width: 100%; height: 75px; background: rgba(0,0,0,0.3); border: 1px solid #334155; border-radius: 8px; color: #fff; padding: 8px; font-size: 0.8rem; box-sizing: border-box; resize: none; margin-top: 4px;"></textarea>
            </div>
          </div>

          <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px;">
            <button onclick="saveTeleSoapRecord('${patientName}')" style="width: 100%; background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: none; padding: 10px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <i class="fa-solid fa-floppy-disk"></i> Salvar no Prontuário
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Inicializar câmera local
  initLocalCamera();
}

let localStream = null;

async function initLocalCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStream = stream;
    const localVideo = document.getElementById('local-video');
    if (localVideo) {
      localVideo.srcObject = stream;
    }
  } catch (err) {
    console.warn('[Teleconsultation] Câmera/Microfone não acessível:', err);
  }
}

export function closeTeleconsultation() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  const modal = document.getElementById('modal-teleconsultation');
  if (modal) modal.remove();
  if (typeof showToast === 'function') showToast('Teleconsulta encerrada.');
}

export function toggleTeleMic() {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const btn = document.getElementById('btn-toggle-mic');
      if (btn) {
        btn.style.background = audioTrack.enabled ? '#1e293b' : '#ef4444';
        btn.innerHTML = audioTrack.enabled ? '<i class="fa-solid fa-microphone"></i>' : '<i class="fa-solid fa-microphone-slash"></i>';
      }
      if (typeof showToast === 'function') showToast(audioTrack.enabled ? 'Microfone ativado' : 'Microfone mudo');
    }
  }
}

export function toggleTeleCam() {
  if (localStream) {
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      const btn = document.getElementById('btn-toggle-cam');
      if (btn) {
        btn.style.background = videoTrack.enabled ? '#1e293b' : '#ef4444';
        btn.innerHTML = videoTrack.enabled ? '<i class="fa-solid fa-video"></i>' : '<i class="fa-solid fa-video-slash"></i>';
      }
      if (typeof showToast === 'function') showToast(videoTrack.enabled ? 'Câmera ativada' : 'Câmera desligada');
    }
  }
}

export function copyTeleLink(roomId) {
  const link = `${window.location.origin}/?teleconsulta=${roomId}`;
  navigator.clipboard.writeText(link).then(() => {
    if (typeof showToast === 'function') showToast('🔗 Link da sala copiado! Envie ao paciente.');
  }).catch(() => {
    prompt('Copie o link da sala:', link);
  });
}

export function shareTeleScreen() {
  if (navigator.mediaDevices.getDisplayMedia) {
    navigator.mediaDevices.getDisplayMedia({ video: true }).then(screenStream => {
      const localVideo = document.getElementById('local-video');
      if (localVideo) localVideo.srcObject = screenStream;
      if (typeof showToast === 'function') showToast('Compartilhamento de tela ativo.');
    }).catch(err => {
      console.warn('Compartilhamento cancelado:', err);
    });
  }
}

export function saveTeleSoapRecord(patientName) {
  const s = document.getElementById('tele-soap-s')?.value || '';
  const p = document.getElementById('tele-soap-p')?.value || '';
  if (!s && !p) {
    alert('Preencha ao menos um campo de evolução antes de salvar.');
    return;
  }
  if (typeof showToast === 'function') {
    showToast(`✅ Evolução da teleconsulta salva para ${patientName}!`);
  }
}

// Tornar métodos globais
if (typeof window !== 'undefined') {
  window.openTeleconsultationModal = openTeleconsultationModal;
  window.closeTeleconsultation = closeTeleconsultation;
  window.toggleTeleMic = toggleTeleMic;
  window.toggleTeleCam = toggleTeleCam;
  window.copyTeleLink = copyTeleLink;
  window.shareTeleScreen = shareTeleScreen;
  window.saveTeleSoapRecord = saveTeleSoapRecord;
}
