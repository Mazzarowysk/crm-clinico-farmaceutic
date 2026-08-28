import { describe, it, expect } from 'vitest';

describe('Cálculos Financeiros & DRE Gerencial', () => {
  it('deve calcular corretamente o DRE (Receita Bruta, CPV, Despesas e Lucro Líquido)', () => {
    const receitaServicos = 5000;
    const receitaVendas = 15000;
    const receitaBruta = receitaServicos + receitaVendas;
    
    const cpv = 8000; // Custo dos Produtos Vendidos
    const lucroBruto = receitaBruta - cpv;
    
    const despesasOperacionais = 3500;
    const lucroLiquido = lucroBruto - despesasOperacionais;
    const margemLiquida = (lucroLiquido / receitaBruta) * 100;

    expect(receitaBruta).toBe(20000);
    expect(lucroBruto).toBe(12000);
    expect(lucroLiquido).toBe(8500);
    expect(margemLiquida).toBe(42.5);
  });

  it('deve calcular juros e multa pro-rata para títulos vencidos', () => {
    const valorOriginal = 1000;
    const taxaJurosMensal = 0.02; // 2% ao mês
    const taxaMulta = 0.02; // 2% multa fixa
    const diasAtraso = 15;

    const multa = valorOriginal * taxaMulta;
    const jurosDiario = (taxaJurosMensal / 30) * diasAtraso;
    const juros = valorOriginal * jurosDiario;
    const valorTotalComEncargos = valorOriginal + multa + juros;

    expect(multa).toBe(20);
    expect(juros).toBe(10);
    expect(valorTotalComEncargos).toBe(1030);
  });
});
