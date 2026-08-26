// src/modules/barcodeScanner.js
// MÓDULO UNIFICADO DE LEITURA DE CÓDIGO DE BARRAS (EAN-13, EAN-8, CODE-128, QR CODE)

// Efeito sonoro de Bipe Clínico usando Web Audio API
export function playBeepSound(type = 'success') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.setValueAtTime(250, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    // AudioContext pode ser bloqueado sem interação prévia
  }
}

/**
 * Abre o Modal da Câmera para leitura óptica de Código de Barras
 * @param {Function} onCodeScanned Callback executado com a string do código lido
 * @param {Object} options Configurações adicionais (título, instruções)
 */
export function openCameraBarcodeScanner(onCodeScanned, options = {}) {
  const existingModal = document.getElementById('camera-barcode-modal');
  if (existingModal) existingModal.remove();

  const title = options.title || 'Leitor Óptico de Código de Barras';
  const subtitle = options.subtitle || 'Aponte a câmera para o código EAN / Barras da embalagem do produto';

  const modal = document.createElement('div');
  modal.id = 'camera-barcode-modal';
  modal.className = 'pep-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 15, 29, 0.88); backdrop-filter: blur(16px);
    display: flex; justify-content: center; align-items: center; z-index: 10005; padding: 16px;
  `;

  modal.innerHTML = `
    <div style="width: 100%; max-width: 520px; background: #0f172a; border: 1.5px solid rgba(16, 185, 129, 0.4); border-radius: 20px; padding: 22px; box-shadow: 0 25px 60px rgba(0,0,0,0.85); position: relative;">
      
      <!-- Cabeçalho -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); display: flex; align-items: center; justify-content: center; color: #34d399; font-size: 1.1rem;">
            <i class="fa-solid fa-barcode"></i>
          </div>
          <div>
            <h3 style="margin: 0; color: #fff; font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 700;">${title}</h3>
            <p style="margin: 2px 0 0 0; font-size: 0.76rem; color: #94a3b8;">${subtitle}</p>
          </div>
        </div>
        <button id="btn-close-camera-scanner" style="background: none; border: none; color: #94a3b8; font-size: 1.3rem; cursor: pointer; padding: 4px;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Viewfinder da Câmera -->
      <div style="position: relative; width: 100%; height: 280px; background: #000; border-radius: 14px; overflow: hidden; border: 2px solid rgba(16, 185, 129, 0.5); display: flex; align-items: center; justify-content: center;">
        <video id="barcode-video-stream" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover;"></video>
        
        <!-- Guia Laser Neon e Moldura -->
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <!-- Quadrante de Foco -->
          <div style="width: 75%; height: 120px; border: 2px dashed rgba(52, 211, 153, 0.8); border-radius: 10px; position: relative; box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);">
            <!-- Linha Laser que anima -->
            <div style="position: absolute; left: 0; right: 0; height: 2px; background: #10b981; box-shadow: 0 0 10px #34d399, 0 0 20px #10b981; animation: laserScanAnim 2s infinite ease-in-out;"></div>
          </div>
          <span style="margin-top: 12px; font-size: 0.76rem; color: #e2e8f0; background: rgba(0,0,0,0.65); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15);">
            Centralize o código de barras no quadro
          </span>
        </div>

        <div id="camera-loading-indicator" style="position: absolute; color: #94a3b8; font-size: 0.88rem; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-spinner fa-spin" style="color: #10b981;"></i> Inicializando câmera...
        </div>
      </div>

      <!-- Entrada Manual Alternativa -->
      <div style="margin-top: 16px;">
        <div style="font-size: 0.78rem; color: #94a3b8; margin-bottom: 6px; display: flex; justify-content: space-between;">
          <span>Ou digite / use leitor USB:</span>
          <span style="color: #34d399; font-weight: 600;"><i class="fa-solid fa-keyboard"></i> Leitor USB ativo</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="manual-barcode-input" placeholder="Ex: 7891058012345" class="form-input" style="flex: 1; height: 38px; font-family: monospace; font-size: 0.95rem; background: rgba(30, 41, 59, 0.7); color: #fff;">
          <button type="button" id="btn-submit-manual-barcode" class="btn" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 0 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer;">
            Confirmar
          </button>
        </div>
      </div>

      <style>
        @keyframes laserScanAnim {
          0% { top: 5%; opacity: 0.4; }
          50% { top: 90%; opacity: 1; }
          100% { top: 5%; opacity: 0.4; }
        }
      </style>
    </div>
  `;

  document.body.appendChild(modal);

  let stream = null;
  let animationFrameId = null;
  let isScanning = true;

  const videoEl = document.getElementById('barcode-video-stream');
  const loadingEl = document.getElementById('camera-loading-indicator');
  const manualInput = document.getElementById('manual-barcode-input');
  manualInput?.focus();

  const stopCamera = () => {
    isScanning = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    modal.remove();
  };

  document.getElementById('btn-close-camera-scanner')?.addEventListener('click', stopCamera);

  // Submissão Manual
  const submitCode = (code) => {
    const cleanCode = (code || '').trim();
    if (!cleanCode) return;
    playBeepSound('success');
    stopCamera();
    if (typeof onCodeScanned === 'function') {
      onCodeScanned(cleanCode);
    }
  };

  document.getElementById('btn-submit-manual-barcode')?.addEventListener('click', () => {
    submitCode(manualInput.value);
  });

  manualInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitCode(manualInput.value);
    }
  });

  // Inicializa Câmera
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
    }).then(s => {
      stream = s;
      if (videoEl) {
        videoEl.srcObject = stream;
        videoEl.onloadedmetadata = () => {
          if (loadingEl) loadingEl.style.display = 'none';
          startDetectionLoop();
        };
      }
    }).catch(err => {
      console.warn('[BarcodeScanner] Câmera não acessível:', err);
      if (loadingEl) {
        loadingEl.innerHTML = `<span style="color: #fbbf24;"><i class="fa-solid fa-camera-slash"></i> Câmera indisponível. Utilize a digitação ou leitor USB.</span>`;
      }
    });
  } else {
    if (loadingEl) {
      loadingEl.innerHTML = `<span style="color: #fbbf24;"><i class="fa-solid fa-triangle-exclamation"></i> Câmera não suportada neste dispositivo.</span>`;
    }
  }

  // Loop de Detecção com BarcodeDetector API Nativa (Chrome / Edge / Safari / Android)
  async function startDetectionLoop() {
    if (!('BarcodeDetector' in window)) {
      return;
    }

    try {
      const formats = ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e', 'data_matrix'];
      const detector = new window.BarcodeDetector({ formats });

      const detectFrame = async () => {
        if (!isScanning || !videoEl || videoEl.readyState < 2) {
          if (isScanning) animationFrameId = requestAnimationFrame(detectFrame);
          return;
        }

        try {
          const barcodes = await detector.detect(videoEl);
          if (barcodes && barcodes.length > 0) {
            const detectedValue = barcodes[0].rawValue;
            if (detectedValue) {
              submitCode(detectedValue);
              return;
            }
          }
        } catch (err) {
          // Frame skip
        }

        if (isScanning) {
          animationFrameId = requestAnimationFrame(detectFrame);
        }
      };

      animationFrameId = requestAnimationFrame(detectFrame);
    } catch (e) {
      console.warn('[BarcodeScanner] Erro ao instanciar BarcodeDetector:', e);
    }
  }
}
