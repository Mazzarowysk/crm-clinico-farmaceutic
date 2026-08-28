import { describe, it, expect } from 'vitest';
import { evaluateSepsisRisk } from '../src/modules/sepsisScreener.js';

describe('Módulo de Rastreio de Sepse (Surviving Sepsis Campaign / qSOFA)', () => {
  it('deve identificar baixo risco quando todos os sinais vitais estão normais', () => {
    const normalVitals = {
      bloodPressure: '120/80',
      respiratoryRate: 16,
      heartRate: 72,
      temperature: 36.6,
      oxygenSaturation: 98,
      mentalState: 'alerta'
    };

    const result = evaluateSepsisRisk(normalVitals);
    expect(result.qSOFAScore).toBe(0);
    expect(result.isHighRisk).toBe(false);
    expect(result.isModerateRisk).toBe(false);
    expect(result.riskLevel).toBe('Baixo Risco');
  });

  it('deve detectar Alto Risco e Alerta Vermelho de Sepse quando qSOFA >= 2 (PAS <= 100 e FR >= 22)', () => {
    const criticalVitals = {
      bloodPressure: '90/60', // PAS 90 (<= 100) -> 1 ponto
      respiratoryRate: 24,    // FR 24 (>= 22) -> 1 ponto
      heartRate: 110,         // Taquicardia
      temperature: 39.1,      // Febre alta
      mentalState: 'confuso'  // Consciência rebaixada -> 1 ponto
    };

    const result = evaluateSepsisRisk(criticalVitals);
    expect(result.qSOFAScore).toBe(3);
    expect(result.isHighRisk).toBe(true);
    expect(result.actionTitle).toContain('ENCAMINHAMENTO MÉDICO IMEDIATO DE URGÊNCIA');
  });

  it('deve detectar Risco Moderado com sinais inflamatórios sistêmicos e qSOFA = 1', () => {
    const moderateVitals = {
      bloodPressure: '125/80',
      respiratoryRate: 24, // FR 24 -> 1 ponto
      heartRate: 85,
      temperature: 37.0,
      mentalState: 'alerta'
    };

    const result = evaluateSepsisRisk(moderateVitals);
    expect(result.qSOFAScore).toBe(1);
    expect(result.isModerateRisk).toBe(true);
    expect(result.isHighRisk).toBe(false);
  });
});
