import { describe, it, expect } from 'vitest';
import { calculateMEWS } from '../src/modules/clinicalAI.js';

describe('Motor Clínico MEWS (Modified Early Warning Score)', () => {
  it('deve retornar escore 0 e risco Baixo para sinais vitais estritamente normais', () => {
    const normalVitals = {
      bloodPressure: '120/80',
      heartRateBpm: 75,
      temperatureCelsius: 36.5,
      respiratoryRateRpm: 16,
      oxygenSaturation: 98,
      glasgowScale: 15
    };

    const result = calculateMEWS(normalVitals);
    expect(result.score).toBe(0);
    expect(result.riskCategory).toBe('Baixo');
    expect(result.colorCode).toBe('#10b981');
    expect(result.reasons.length).toBe(0);
  });

  it('deve detectar Hipotensão Crítica e pontuar 3 no MEWS para PAS <= 70 mmHg', () => {
    const criticalVitals = {
      bloodPressure: '65/40',
      heartRateBpm: 80,
      temperatureCelsius: 36.5,
      oxygenSaturation: 98
    };

    const result = calculateMEWS(criticalVitals);
    expect(result.score).toBeGreaterThanOrEqual(3);
    expect(result.reasons.some(r => r.includes('Hipotensão Crítica') || r.includes('PAS'))).toBe(true);
  });

  it('deve identificar risco Alto/Crítico de Sepse em paciente taquicárdico, febril e hipotenso', () => {
    const sepsisVitals = {
      bloodPressure: '85/50',   // PAS baixa (+1)
      heartRateBpm: 135,        // Taquicardia severa (+3)
      temperatureCelsius: 39.2, // Febre alta (+2)
      oxygenSaturation: 91      // Hipóxia (+1 ou +2)
    };

    const result = calculateMEWS(sepsisVitals);
    expect(result.score).toBeGreaterThanOrEqual(5);
    expect(result.riskCategory).toMatch(/Alto|Crítico/);
    expect(result.isSepsisAlert).toBe(true);
    expect(result.recommendedAction).toBeDefined();
  });
});
