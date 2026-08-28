/**
 * Módulo de Ditado Clínico por Voz (Web Speech API)
 * Permite transcrição contínua em Português (pt-BR) diretamente nos campos de texto livres do SOAP.
 */

import { showToast } from './ui.js';

let activeRecognition = null;
let activeTargetInput = null;
let activeBtnElement = null;

export function isSpeechRecognitionSupported() {
  return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
}

/**
 * Alterna o estado de escuta do microfone em um elemento input/textarea alvo
 * @param {string|HTMLElement} targetInput - Seletor ou elemento DOM que receberá o texto
 * @param {HTMLElement} triggerBtn - Botão que acionou a escuta
 */
export function toggleVoiceDictation(targetInput, triggerBtn) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert('O seu navegador não suporta reconhecimento de voz direto. Recomendamos o Google Chrome, Microsoft Edge ou Safari.');
    return;
  }

  const inputEl = typeof targetInput === 'string' ? document.querySelector(targetInput) : targetInput;
  if (!inputEl) return;

  // Se já estiver escutando no mesmo botão, encerra
  if (activeRecognition && activeTargetInput === inputEl) {
    stopVoiceDictation();
    return;
  }

  // Se estiver escutando em outro campo, para o anterior primeiro
  if (activeRecognition) {
    stopVoiceDictation();
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    activeRecognition = recognition;
    activeTargetInput = inputEl;
    activeBtnElement = triggerBtn;

    // Atualiza estado visual do botão
    if (triggerBtn) {
      triggerBtn.dataset.originalContent = triggerBtn.innerHTML;
      triggerBtn.innerHTML = '<i class="fa-solid fa-microphone-lines fa-fade" style="color: #ef4444;"></i> <span style="color: #ef4444; font-weight: 800;">Ouvindo...</span>';
      triggerBtn.classList.add('voice-listening-pulse');
    }

    if (typeof showToast === 'function') {
      showToast('🎙️ Ditado ativo: Pode falar agora...');
    }

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        const separator = inputEl.value && !inputEl.value.endsWith(' ') && !inputEl.value.endsWith('\n') ? ' ' : '';
        inputEl.value += separator + finalTranscript.trim();
        finalTranscript = '';
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    recognition.onerror = (event) => {
      console.warn('[VoiceDictation] Erro de reconhecimento:', event.error);
      if (event.error === 'not-allowed') {
        alert('Permissão de microfone negada. Por favor, permita o acesso ao microfone no navegador.');
      }
      stopVoiceDictation();
    };

    recognition.onend = () => {
      stopVoiceDictation();
    };

    recognition.start();

  } catch (err) {
    console.error('[VoiceDictation] Falha ao iniciar reconhecimento:', err);
    stopVoiceDictation();
  }
}

export function stopVoiceDictation() {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch (e) { }
    activeRecognition = null;
  }

  if (activeBtnElement) {
    if (activeBtnElement.dataset.originalContent) {
      activeBtnElement.innerHTML = activeBtnElement.dataset.originalContent;
    } else {
      activeBtnElement.innerHTML = '<i class="fa-solid fa-microphone"></i> Ditado';
    }
    activeBtnElement.classList.remove('voice-listening-pulse');
    activeBtnElement = null;
  }

  activeTargetInput = null;
}

// Tornar acessível globalmente para botões inline
if (typeof window !== 'undefined') {
  window.toggleVoiceDictation = toggleVoiceDictation;
  window.stopVoiceDictation = stopVoiceDictation;
}
