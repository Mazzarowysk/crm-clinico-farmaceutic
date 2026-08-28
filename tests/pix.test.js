import { describe, it, expect } from 'vitest';
import { generatePixPayload } from '../src/modules/pixGenerator.js';

describe('Módulo de Geração de PIX Dinâmico BACEN', () => {
  it('deve gerar payload PIX válido com estrutura EMV e CRC16 de 4 dígitos hexadecimais', () => {
    const payload = generatePixPayload({
      key: '12345678900',
      name: 'Dr. Marcelo Mazaro',
      city: 'Sao Paulo',
      amount: 150.00,
      txid: 'CONSULTA01'
    });

    expect(payload).toBeDefined();
    expect(payload.startsWith('000201')).toBe(true);
    expect(payload.includes('br.gov.bcb.pix')).toBe(true);
    expect(payload.includes('12345678900')).toBe(true);
    expect(payload.includes('150.00')).toBe(true);
    expect(payload.includes('5802BR')).toBe(true);
    expect(payload.length).toBeGreaterThan(50);
    
    // O final deve ser 6304 seguido do CRC de 4 caracteres
    const crcPart = payload.slice(-4);
    expect(crcPart).toMatch(/^[0-9A-F]{4}$/);
  });

  it('deve gerar payload sem valor fixo quando amount for 0', () => {
    const payload = generatePixPayload({
      key: 'contato@farmacia.com.br',
      name: 'Farmacia Modelo',
      city: 'Campinas',
      amount: 0,
      txid: '***'
    });

    expect(payload).toBeDefined();
    expect(payload.includes('5802BR')).toBe(true);
    expect(payload.slice(-4)).toMatch(/^[0-9A-F]{4}$/);
  });
});
