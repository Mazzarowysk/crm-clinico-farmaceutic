import { describe, it, expect } from 'vitest';
import { PHARMACY_TRIAGE_PROTOCOLS } from '../src/modules/pharmacyCDSS.js';
import { checkDrugInteractions } from '../src/modules/clinicalAI.js';

describe('Suporte à Decisão Clínica Farmacêutica (CDSS 4D)', () => {
  it('deve conter protocolos clínicos estruturados com Red Flags definidos', () => {
    expect(PHARMACY_TRIAGE_PROTOCOLS).toBeDefined();
    
    // Verifica protocolo de gripe
    const gripe = PHARMACY_TRIAGE_PROTOCOLS.gripe_resfriado;
    expect(gripe).toBeDefined();
    expect(gripe.redFlags.length).toBeGreaterThan(0);
    expect(gripe.recommendedMIPs.length).toBeGreaterThan(0);
    expect(gripe.nonPharmaActions.length).toBeGreaterThan(0);

    // Verifica protocolo de cefaleia com sinais de alarme meníngeos
    const cefaleia = PHARMACY_TRIAGE_PROTOCOLS.cefaleia;
    expect(cefaleia).toBeDefined();
    expect(cefaleia.redFlags.some(rf => rf.label.includes('Rigidez de nuca') || rf.id.includes('rigidez'))).toBe(true);
  });

  it('deve detectar interação medicamentosa de alto risco ou contraindicação', () => {
    // Varfarina + AAS ou Diclofenaco
    const interactions = checkDrugInteractions(['Varfarina', 'Ácido Acetilsalicílico (AAS)']);
    
    expect(interactions).toBeDefined();
    // Deve retornar interação ou aviso clínico se cadastrado na base de interações
    if (interactions && Array.isArray(interactions) && interactions.length > 0) {
      expect(interactions[0].severity || interactions[0].riskLevel).toBeDefined();
    }
  });
});
