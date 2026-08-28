// src/modules/sepsisScreener.js
// ══════════════════════════════════════════════════════════════════════════════
// MÓDULO CLÍNICO DE RASTREIO PRECOCE DE SEPSE (SURVIVING SEPSIS CAMPAIGN - SCCM / ESICM)
// Escore qSOFA (Quick SOFA) & Sinais de Alarme para Consultório Farmacêutico (CFF 585/2013)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Avalia os critérios do qSOFA e Consenso Internacional da Surviving Sepsis Campaign (SSC)
 * @param {Object} vitals Objeto contendo sinais vitais do paciente
 * @param {string|number} vitals.bloodPressure Pressão arterial no formato "120/80" ou PAS
 * @param {number} vitals.systolicBP Pressão arterial sistólica
 * @param {number} vitals.respiratoryRate Frequência respiratória (irpm)
 * @param {number} vitals.heartRate Frequência cardíaca (bpm)
 * @param {number} vitals.temperature Temperatura axilar (°C)
 * @param {number} vitals.oxygenSaturation Saturação de oxigênio (%)
 * @param {string} vitals.mentalState Estado mental ('alerta', 'confuso', 'sonolento', 'obnubilado')
 * @returns {Object} Diagnóstico de risco e recomendações clínicas
 */
export function evaluateSepsisRisk(vitals = {}) {
  let qSOFAScore = 0;
  const criteriaMatched = [];
  const sscWarnings = [];

  // 1. Extração e Normalização da Pressão Sistólica (PAS)
  let pas = 120;
  if (vitals.systolicBP) {
    pas = Number(vitals.systolicBP);
  } else if (vitals.bloodPressure || vitals.pa) {
    const rawBp = String(vitals.bloodPressure || vitals.pa);
    const parts = rawBp.split('/');
    pas = parseInt(parts[0], 10) || 120;
  }

  // 2. Critério qSOFA 1: Pressão Arterial Sistólica ≤ 100 mmHg
  if (pas <= 100) {
    qSOFAScore += 1;
    criteriaMatched.push(`Hipotensão Arterial Sistólica (PAS = ${pas} mmHg ≤ 100 mmHg)`);
  }

  // 3. Critério qSOFA 2: Frequência Respiratória ≥ 22 irpm (Taquipneia)
  const fr = Number(vitals.respiratoryRate || vitals.fr || 18);
  if (fr >= 22) {
    qSOFAScore += 1;
    criteriaMatched.push(`Taquipneia / Frequência Respiratória Elevada (FR = ${fr} irpm ≥ 22 irpm)`);
  }

  // 4. Critério qSOFA 3: Alteração Aguda do Estado Mental / Consciência (Glasgow < 15)
  const mental = String(vitals.mentalState || vitals.consciousness || 'alerta').toLowerCase();
  const hasAlteredMental = mental.includes('confus') || mental.includes('sonolent') || mental.includes('rebaixad') || mental.includes('desorient');
  if (hasAlteredMental) {
    qSOFAScore += 1;
    criteriaMatched.push(`Alteração do Estado Mental / Nível de Consciência (Glasgow < 15)`);
  }

  // 5. Critérios Complementares do Consenso da Surviving Sepsis Campaign (SSC)
  const temp = Number(vitals.temperature || vitals.temp || 36.5);
  const fc = Number(vitals.heartRate || vitals.fc || 75);
  const spo2 = Number(vitals.oxygenSaturation || vitals.spo2 || 98);

  const hasFeverOrHypothermia = temp >= 38.3 || temp < 36.0;
  const hasTachycardia = fc > 90;

  if (hasFeverOrHypothermia) {
    sscWarnings.push(`Temperatura Fora da Faixa (${temp}°C - ${temp >= 38.3 ? 'Febre Alta' : 'Hipotermia Crítica'})`);
  }
  if (hasTachycardia) {
    sscWarnings.push(`Taquicardia Significativa (FC = ${fc} bpm > 90 bpm)`);
  }
  if (spo2 < 92) {
    sscWarnings.push(`Dessaturação de Oxigênio (SpO2 = ${spo2}% < 92%)`);
  }

  // 6. Determinação da Gravidade
  const isHighRisk = qSOFAScore >= 2;
  const isModerateRisk = qSOFAScore === 1 || (hasFeverOrHypothermia && hasTachycardia);

  let riskLevel = 'Baixo Risco';
  let badgeColor = '#10b981';
  let badgeBg = 'rgba(16, 185, 129, 0.15)';
  let actionTitle = 'Conduta Ambulatorial Padrão';
  let actionRecommendation = 'Sinais vitais estáveis. Seguir com a consulta farmacêutica e dispensação habitual com orientações de uso.';

  if (isHighRisk) {
    riskLevel = '🚨 ALTO RISCO DE SEPSE (qSOFA ≥ 2)';
    badgeColor = '#ef4444';
    badgeBg = 'rgba(239, 68, 68, 0.22)';
    actionTitle = 'ENCAMINHAMENTO MÉDICO IMEDIATO DE URGÊNCIA (CFF 585/2013)';
    actionRecommendation = 'Suspeita de infecção com disfunção orgânica aguda. Contraindicada a dispensação de MIP isolada. Acionar SAMU 192 ou encaminhar com urgência à UPA/Hospital com Guia de Encaminhamento Clínico.';
  } else if (isModerateRisk) {
    riskLevel = '⚠️ ALERTA DE ATENÇÃO / SEPSE EM POTENCIAL';
    badgeColor = '#f59e0b';
    badgeBg = 'rgba(245, 158, 11, 0.18)';
    actionTitle = 'Monitoramento Rigoroso & Avaliação Médica';
    actionRecommendation = 'Presença de sinais inflamatórios sistêmicos. Orientar retorno ou procurar pronto-atendimento se houver piora dos sintomas em 24h.';
  }

  return {
    qSOFAScore,
    isHighRisk,
    isModerateRisk,
    riskLevel,
    badgeColor,
    badgeBg,
    actionTitle,
    actionRecommendation,
    criteriaMatched,
    sscWarnings,
    guideline: 'Surviving Sepsis Campaign (SCCM / ESICM) & Resolução CFF nº 585/2013'
  };
}

/**
 * Renderiza um card visual de Alerta de Sepse / qSOFA para exibição no DOM
 * @param {Object} result Resultado retornado por evaluateSepsisRisk
 * @returns {string} Fragmento HTML formatado
 */
export function renderSepsisAlertCard(result) {
  if (!result || (!result.isHighRisk && !result.isModerateRisk)) {
    return '';
  }

  return `
    <div class="sepsis-screener-card" style="
      background: ${result.isHighRisk ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)'};
      border: 1.5px solid ${result.badgeColor};
      border-radius: 12px;
      padding: 14px 18px;
      margin: 12px 0;
      box-shadow: 0 4px 15px ${result.isHighRisk ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.2)'};
      animation: pulseAlert 2s infinite ease-in-out;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.2rem;">${result.isHighRisk ? '🚨' : '⚠️'}</span>
          <strong style="color: ${result.badgeColor}; font-size: 0.92rem; text-transform: uppercase;">
            ${result.riskLevel}
          </strong>
        </div>
        <span style="font-size: 0.68rem; background: ${result.badgeBg}; color: ${result.badgeColor}; border: 1px solid ${result.badgeColor}60; padding: 2px 8px; border-radius: 6px; font-weight: 700;">
          qSOFA Score: ${result.qSOFAScore}/3
        </span>
      </div>

      <div style="font-size: 0.8rem; color: #f8fafc; margin-bottom: 8px; line-height: 1.4;">
        <strong>Critérios Positivos (Surviving Sepsis Campaign):</strong>
        <ul style="margin: 4px 0 6px 18px; padding: 0; color: #cbd5e1;">
          ${result.criteriaMatched.map(c => `<li>${c}</li>`).join('')}
          ${result.sscWarnings.map(w => `<li><span style="color:#fdba74;">Aviso:</span> ${w}</li>`).join('')}
        </ul>
      </div>

      <div style="background: rgba(0,0,0,0.3); border-left: 3px solid ${result.badgeColor}; padding: 8px 12px; border-radius: 6px; font-size: 0.78rem; color: #e2e8f0;">
        <strong style="color: ${result.badgeColor}; display: block; margin-bottom: 2px;">
          <i class="fa-solid fa-triangle-exclamation"></i> ${result.actionTitle}
        </strong>
        ${result.actionRecommendation}
      </div>
    </div>
  `;
}
