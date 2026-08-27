// src/modules/universalSearch.js
// MOTOR DE BUSCA UNIVERSAL COM PLN (PROCESSAMENTO DE LINGUAGEM NATURAL) & RECONHECIMENTO DE INTENÇÃO

import { state } from '../state.js';
import * as localDB from '../localDB.js';
import { showToast } from './ui.js';

// Normalização avançada de texto para PLN
export function normalizePLN(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s]/g, " ")   // Remove pontuação
    .replace(/\s+/g, " ")           // Unifica múltiplos espaços
    .trim();
}

// Dicionário de Sinônimos e Mapeamento Semântico Farmacêutico / Clínico
const CLINICAL_SYNONYMS = {
  // Compras & Adesão
  'compra': 'compras',
  'compras': 'compras',
  'comprado': 'compras',
  'comprou': 'compras',
  'aquisicao': 'compras',
  'aquisicoes': 'compras',
  'recompra': 'compras',
  'refill': 'compras',
  'adesao': 'compras',
  'posologia': 'compras',
  'historico': 'compras',
  'historico de compras': 'compras',

  // Caixa & PDV
  'caixa': 'pdv',
  'pdv': 'pdv',
  'bipar': 'pdv',
  'codigo de barras': 'pdv',
  'ean': 'pdv',
  'venda': 'pdv',
  'vender': 'pdv',
  'cupom': 'pdv',
  'cupon': 'pdv',
  'comprovante': 'pdv',
  'cupom termico': 'pdv',
  'boleto': 'pdv',

  // Atendimento & Balcão
  'atendimento': 'balcao',
  'atender': 'balcao',
  'consulta': 'balcao',
  'balcao': 'balcao',
  'prescrever': 'balcao',
  'prescricao': 'balcao',
  'receita': 'balcao',
  'receituario': 'balcao',
  'indicacao': 'balcao',
  'orientacao': 'balcao',
  'mip': 'balcao',
  'mips': 'balcao',
  'soap': 'balcao',
  'triagem': 'balcao',

  // Sintomas / Queixas
  'dor de cabeca': 'cefaleia',
  'enxaqueca': 'cefaleia',
  'gripe': 'gripe',
  'resfriado': 'gripe',
  'coriza': 'gripe',
  'febre': 'gripe',
  'tosse': 'tosse',
  'catarro': 'tosse',
  'secrecao': 'tosse',
  'dor muscular': 'dor_muscular',
  'lombalgia': 'dor_muscular',
  'dor nas costas': 'dor_muscular',
  'azia': 'azia',
  'queimacao': 'azia',
  'refluxo': 'azia',
  'estomago': 'azia',
  'rinite': 'rinite',
  'alergia': 'rinite',
  'garganta': 'garganta',
  'amigdalite': 'garganta',
  'diarreia': 'diarreia',
  'desidratacao': 'diarreia',
  'constipacao': 'constipacao',
  'prisao de ventre': 'constipacao',
  'pressao': 'pa',
  'hipertensao': 'pa',
  'glicemia': 'glicemia',
  'diabetes': 'glicemia',
  'acucar': 'glicemia',

  // Estoque
  'estoque': 'estoque',
  'produtos': 'estoque',
  'remedios': 'estoque',
  'medicamentos': 'estoque',
  'validade': 'estoque',
  'lote': 'estoque',
  'kardex': 'estoque',

  // Financeiro
  'financeiro': 'financeiro',
  'faturamento': 'financeiro',
  'dre': 'financeiro',
  'lucro': 'financeiro',
  'despesa': 'financeiro',
  'receita': 'financeiro',
  'fluxo de caixa': 'financeiro',

  // DSF & Relatórios
  'dsf': 'dsf',
  'declaracao': 'dsf',
  'cff': 'dsf',
  'declaracao de servico': 'dsf',

  // Configurações
  'configuracao': 'configuracoes',
  'configuracoes': 'configuracoes',
  'usuario': 'configuracoes',
  'usuarios': 'configuracoes',
  'senha': 'configuracoes',
  'crf': 'configuracoes',
  'cnpj': 'configuracoes'
};

// Matriz de Ações Rápidas & Intenções Inteligentes
export const SYSTEM_INTENTS = [
  {
    id: 'intent_compras',
    title: '🛒 Histórico de Compras & Adesão Terapêutica dos Pacientes',
    subtitle: 'Consultar medicamentos adquiridos, dispensações no balcão e alertas de recompra (refill)',
    category: 'Ações Rápidas',
    keywords: ['compras', 'compra', 'historico de compras', 'aquisicao', 'recompra', 'adesao', 'posologia', 'o que o paciente comprou', 'refill', 'dispensacao anterior'],
    badge: 'Módulo Compras',
    badgeColor: '#10b981',
    icon: 'fa-cart-shopping',
    iconColor: '#34d399',
    execute: () => {
      if (window.switchTab) window.switchTab('pacientes');
      const allP = (localDB.list('pharmacy_patients') || localDB.list('patients') || []);
      const p = allP.find(item => item && (item.fullName || item.name)) || { id: 'SIM-BENEDITO', name: 'Sr. Benedito Oliveira Santos' };
      if (typeof window.openPatientPurchasesModal === 'function') {
        window.openPatientPurchasesModal(p.id, p.fullName || p.name);
      } else {
        showToast('🛒 Abrindo Histórico de Compras na aba de Pacientes...');
      }
    }
  },
  {
    id: 'intent_pdv',
    title: '⚡ Frente de Caixa & PDV Clínico por Código de Barras',
    subtitle: 'Venda rápida, leitor de código de barras (EAN), formas de pagamento e emissão de cupom térmico',
    category: 'Ações Rápidas',
    keywords: ['caixa', 'pdv', 'frente de caixa', 'bipar', 'codigo de barras', 'ean', 'venda', 'vender', 'cupom', 'cupom termico', 'comprovante', 'boleto'],
    badge: 'Frente de Caixa',
    badgeColor: '#06b6d4',
    icon: 'fa-cash-register',
    iconColor: '#22d3ee',
    execute: () => {
      if (typeof window.openQuickCheckoutModal === 'function') {
        window.openQuickCheckoutModal();
      }
    }
  },
  {
    id: 'intent_abrir_caixa',
    title: '💰 Controle & Fechamento de Caixa',
    subtitle: 'Abertura, conferência de sangria, suprimento, saldo e fechamento com comprovante térmico',
    category: 'Ações Rápidas',
    keywords: ['abrir caixa', 'fechar caixa', 'sangria', 'suprimento', 'saldo do caixa', 'fluxo caixa', 'fechamento'],
    badge: 'Financeiro',
    badgeColor: '#f59e0b',
    icon: 'fa-vault',
    iconColor: '#fbbf24',
    execute: () => {
      if (typeof window.openCashRegisterModal === 'function') {
        window.openCashRegisterModal();
      }
    }
  },
  {
    id: 'intent_novo_atendimento',
    title: '🩺 Novo Atendimento Clínico & Balcão Farmacêutico',
    subtitle: 'Triagem de sintomas (Gripe, Cefaleia, Tosse, Rinite...), CDSS 4D e prescrição farmacêutica',
    category: 'Ações Rápidas',
    keywords: ['novo atendimento', 'atender', 'consulta', 'balcao', 'prescrever', 'prescricao', 'receita', 'indicacao', 'mips', 'triagem', 'soap'],
    badge: 'Clínica & Balcão',
    badgeColor: '#10b981',
    icon: 'fa-stethoscope',
    iconColor: '#34d399',
    execute: () => {
      if (window.switchTab) window.switchTab('farmacia');
    }
  },
  {
    id: 'intent_protocolo_cefaleia',
    title: '🤕 Protocolo Clínico: Cefaleia, Enxaqueca & Dor de Cabeça',
    subtitle: 'Triagem farmacêutica para dor de cabeça com checagem CDSS e sugestões de MIPs',
    category: 'Protocolos CDSS',
    keywords: ['cefaleia', 'dor de cabeca', 'enxaqueca', 'dor na cabeca', 'dor cabeca'],
    badge: 'Protocolo CDSS',
    badgeColor: '#8b5cf6',
    icon: 'fa-head-side-virus',
    iconColor: '#a78bfa',
    execute: () => {
      if (window.switchTab) window.switchTab('farmacia');
      setTimeout(() => {
        const sel = document.getElementById('protocol-select');
        if (sel) { sel.value = 'cefaleia'; sel.dispatchEvent(new Event('change')); }
      }, 300);
    }
  },
  {
    id: 'intent_protocolo_gripe',
    title: '🤧 Protocolo Clínico: Gripe, Resfriado & Coriza',
    subtitle: 'Manejo de sintomas respiratórios, antitérmicos e prevenção de interações medicamentosas',
    category: 'Protocolos CDSS',
    keywords: ['gripe', 'resfriado', 'coriza', 'febre', 'espirros', 'congestao nasal'],
    badge: 'Protocolo CDSS',
    badgeColor: '#8b5cf6',
    icon: 'fa-virus',
    iconColor: '#a78bfa',
    execute: () => {
      if (window.switchTab) window.switchTab('farmacia');
      setTimeout(() => {
        const sel = document.getElementById('protocol-select');
        if (sel) { sel.value = 'gripe_resfriado'; sel.dispatchEvent(new Event('change')); }
      }, 300);
    }
  },
  {
    id: 'intent_protocolo_pa',
    title: '❤️ Aferição de Pressão Arterial (PA) & Rastreio de Hipertensão',
    subtitle: 'Procedimento clínico regulamentado pelo CFF com emissão automática de Declaração DSF',
    category: 'Serviços Clínicos',
    keywords: ['pressao', 'hipertensao', 'aferir pressao', 'pa', 'pressao alta', 'pressao arterial'],
    badge: 'Serviço CFF',
    badgeColor: '#ef4444',
    icon: 'fa-heart-pulse',
    iconColor: '#f87171',
    execute: () => {
      if (window.switchTab) window.switchTab('farmacia');
      showToast('🩺 Selecione Aferição de Pressão Arterial na tela de procedimentos.');
    }
  },
  {
    id: 'intent_protocolo_glicemia',
    title: '🩸 Glicemia Capilar & Rastreio de Diabetes',
    subtitle: 'Teste rápido com registro em jejum ou pós-prandial e cálculo de risco',
    category: 'Serviços Clínicos',
    keywords: ['glicemia', 'diabetes', 'hgt', 'glicose', 'acucar no sangue', 'teste de glicemia'],
    badge: 'Serviço CFF',
    badgeColor: '#f59e0b',
    icon: 'fa-droplet',
    iconColor: '#fbbf24',
    execute: () => {
      if (window.switchTab) window.switchTab('farmacia');
      showToast('🩸 Selecione Teste de Glicemia Capilar no Balcão.');
    }
  },
  {
    id: 'intent_novo_paciente',
    title: '👤 Cadastrar Novo Paciente / Cliente',
    subtitle: 'Cadastro completo de identificação, WhatsApp, endereço de entrega e convênios PBM',
    category: 'Ações Rápidas',
    keywords: ['novo paciente', 'cadastrar paciente', 'novo cliente', 'cadastrar cliente', 'adicionar paciente'],
    badge: 'Cadastro',
    badgeColor: '#38bdf8',
    icon: 'fa-user-plus',
    iconColor: '#38bdf8',
    execute: () => {
      if (window.switchTab) window.switchTab('pacientes');
      setTimeout(() => {
        document.getElementById('btn-add-patient')?.click();
      }, 250);
    }
  },
  {
    id: 'intent_sngpc',
    title: '📋 Livro de Registros SNGPC (Medicamentos Controlados)',
    subtitle: 'Conferência de receitas retidas, Portaria 344/98, antimicrobianos e balanço Anvisa',
    category: 'Regulatório Anvisa',
    keywords: ['sngpc', 'controlados', 'portaria 344', 'antimicrobianos', 'livro sngpc', 'balanco sngpc', 'receita retida', 'notificacao'],
    badge: 'SNGPC Anvisa',
    badgeColor: '#6366f1',
    icon: 'fa-book-skull',
    iconColor: '#818cf8',
    execute: () => {
      if (typeof window.openSngpcBookModal === 'function') {
        window.openSngpcBookModal();
      }
    }
  },
  {
    id: 'intent_nfe',
    title: '📥 Importador de Nota Fiscal Eletrônica (NF-e XML)',
    subtitle: 'Importação automática de XML para entrada de estoque, lote, validade e custo',
    category: 'Estoque & Gestão',
    keywords: ['nfe', 'importar nfe', 'xml', 'nota fiscal', 'dar entrada', 'xml nfe', 'entrada nota'],
    badge: 'Estoque',
    badgeColor: '#10b981',
    icon: 'fa-file-invoice',
    iconColor: '#34d399',
    execute: () => {
      if (typeof window.openNFeImporterModal === 'function') {
        window.openNFeImporterModal();
      }
    }
  },
  {
    id: 'intent_estoque',
    title: '📦 Estoque de Medicamentos & Alerta de Validade',
    subtitle: 'Controle de saldo, lote, data de expiração, curva ABC e reposição',
    category: 'Navegação',
    keywords: ['estoque', 'produtos', 'remedios', 'medicamentos', 'validade', 'lote', 'kardex', 'inventario'],
    badge: 'Estoque',
    badgeColor: '#10b981',
    icon: 'fa-boxes-stacked',
    iconColor: '#34d399',
    execute: () => {
      if (window.switchTab) window.switchTab('estoque');
    }
  },
  {
    id: 'intent_dre_financeiro',
    title: '📊 Demonstrativo de Resultados (DRE) & Faturamento',
    subtitle: 'Extrato financeiro, receita de vendas, despesas operacionais e lucratividade',
    category: 'Gestão Financeira',
    keywords: ['dre', 'financeiro', 'fluxo de caixa', 'faturamento', 'receitas', 'despesas', 'lucro', 'extrato financeiro', 'balanco'],
    badge: 'Financeiro',
    badgeColor: '#0ea5e9',
    icon: 'fa-chart-pie',
    iconColor: '#38bdf8',
    execute: () => {
      if (window.switchTab) window.switchTab('relatorios');
    }
  },
  {
    id: 'intent_dsf',
    title: '📄 Declarações de Serviço Farmacêutico (DSF) & Relatórios',
    subtitle: 'Histórico de declarações emitidas com assinatura digital e layout para impressão CFF',
    category: 'Navegação',
    keywords: ['dsf', 'declaracao', 'declaracao de servico', 'cff 585', 'cff 586', 'imprimir dsf', 'relatorios', 'prescricoes'],
    badge: 'Relatórios',
    badgeColor: '#f59e0b',
    icon: 'fa-file-signature',
    iconColor: '#fbbf24',
    execute: () => {
      if (window.switchTab) window.switchTab('relatorios');
    }
  },
  {
    id: 'intent_configuracoes',
    title: '⚙️ Configurações, Usuários & Farmacêutico RT',
    subtitle: 'CRF do responsável técnico, dados fiscais da farmácia, operadores e segurança',
    category: 'Navegação',
    keywords: ['configuracao', 'configuracoes', 'senha', 'usuarios', 'operadores', 'crf', 'cnpj', 'dados da farmacia', 'backup', 'rbac'],
    badge: 'Configurações',
    badgeColor: '#a855f7',
    icon: 'fa-sliders',
    iconColor: '#c084fc',
    execute: () => {
      if (window.switchTab) window.switchTab('configuracoes');
    }
  },
  {
    id: 'intent_manual',
    title: '📖 Manual Interativo & Guia de Protocolos Farmacêuticos',
    subtitle: 'Documentação completa com suporte a todas as rotinas clínicas e regulatórias do sistema',
    category: 'Ajuda',
    keywords: ['manual', 'manual pdf', 'manual interativo', 'ajuda', 'tutorial', 'como usar', 'documentacao'],
    badge: 'Suporte',
    badgeColor: '#2dd4bf',
    icon: 'fa-book-medical',
    iconColor: '#2dd4bf',
    execute: () => {
      document.getElementById('btn-header-manual')?.click();
    }
  }
];

// Função Principal de Pesquisa Semântica PLN
export function searchSystemWithPLN(rawQuery) {
  const query = (rawQuery || '').trim();
  if (!query) return { intents: [], patients: [], products: [], attendances: [], sales: [] };

  const qNorm = normalizePLN(query);
  const qTokens = qNorm.split(' ').filter(Boolean);
  const qDigits = query.replace(/\D/g, '');

  // 1. Busca Semântica em Intenções e Módulos
  const matchedIntents = SYSTEM_INTENTS.filter(item => {
    const titleNorm = normalizePLN(item.title);
    const subtitleNorm = normalizePLN(item.subtitle);
    
    // Correspondência direta
    if (titleNorm.includes(qNorm) || subtitleNorm.includes(qNorm)) return true;

    // Correspondência de palavras-chave e sinônimos
    const hasKeyword = item.keywords.some(kw => {
      const kwNorm = normalizePLN(kw);
      if (kwNorm.includes(qNorm) || qNorm.includes(kwNorm)) return true;
      return qTokens.every(t => {
        const syn = CLINICAL_SYNONYMS[t] || t;
        return kwNorm.includes(syn) || kwNorm.includes(t);
      });
    });

    if (hasKeyword) return true;

    // Todos os tokens presentes no título ou subtítulo
    return qTokens.every(t => titleNorm.includes(t) || subtitleNorm.includes(t));
  });

  // 2. Busca Universal em Pacientes / Clientes
  const allPatients = [
    ...(localDB.list('pharmacy_patients') || []),
    ...(localDB.list('patients') || []),
    ...(state.patients || [])
  ];
  // Deduplicar pacientes por ID ou CPF ou Nome
  const uniquePatients = [];
  const seenP = new Set();
  allPatients.forEach(p => {
    if (!p) return;
    const key = p.id || p.cpf || p.fullName || p.name;
    if (!seenP.has(key)) {
      seenP.add(key);
      uniquePatients.push(p);
    }
  });

  const matchedPatients = uniquePatients.filter(p => {
    const name = normalizePLN(p.fullName || p.name || '');
    const cpf = (p.cpf || '').replace(/\D/g, '');
    const phone = (p.phone || p.cellphone || '').replace(/\D/g, '');
    const conditions = normalizePLN(p.chronicConditions || p.chronic_conditions || p.comorbidities || '');
    const meds = normalizePLN(p.continuousMedications || p.continuous_meds || '');
    const allergies = normalizePLN(p.allergies || '');

    if (name.includes(qNorm)) return true;
    if (qDigits && cpf.includes(qDigits)) return true;
    if (qDigits && phone.includes(qDigits)) return true;
    if (conditions.includes(qNorm) || meds.includes(qNorm) || allergies.includes(qNorm)) return true;

    return qTokens.every(t => name.includes(t) || conditions.includes(t) || meds.includes(t) || allergies.includes(t));
  });

  // 3. Busca Universal em Medicamentos & Produtos
  const allProducts = localDB.list('products') || [];
  const matchedProducts = allProducts.filter(prod => {
    if (!prod) return false;
    const name = normalizePLN(prod.name || '');
    const dcb = normalizePLN(prod.dcb || prod.active_ingredient || '');
    const category = normalizePLN(prod.category || '');
    const ean = (prod.ean || prod.barcode || '').replace(/\D/g, '');
    const batch = normalizePLN(prod.batch || '');

    if (name.includes(qNorm) || dcb.includes(qNorm) || category.includes(qNorm) || batch.includes(qNorm)) return true;
    if (qDigits && ean.includes(qDigits)) return true;

    return qTokens.every(t => name.includes(t) || dcb.includes(t) || category.includes(t));
  });

  // 4. Busca Universal em Atendimentos Clínicos & Prescrições
  const allAttendances = [
    ...(localDB.list('pharmacy_attendances') || []),
    ...(localDB.list('clinical_attendances') || [])
  ];
  const matchedAttendances = allAttendances.filter(att => {
    if (!att) return false;
    const proto = normalizePLN(att.protocol || att.attendance_id || att.id || '');
    const pName = normalizePLN(att.patient_name || att.patientName || '');
    const complaint = normalizePLN(att.queixa_triagem || att.complaint || att.chief_complaint || '');
    const conduct = normalizePLN(att.conduta_final || att.conduct || '');
    const pharmacist = normalizePLN(att.pharmacist_name || att.professional_name || '');

    if (proto.includes(qNorm) || pName.includes(qNorm) || complaint.includes(qNorm) || conduct.includes(qNorm) || pharmacist.includes(qNorm)) return true;
    return qTokens.every(t => pName.includes(t) || complaint.includes(t) || conduct.includes(t));
  });

  // 5. Busca Universal em Vendas & Histórico de Compras
  const allSales = [
    ...(localDB.list('sales') || []),
    ...(localDB.list('patient_purchases') || [])
  ];
  const matchedSales = allSales.filter(s => {
    if (!s) return false;
    const proto = normalizePLN(s.protocol || s.attendance_id || s.id || '');
    const client = normalizePLN(s.clientName || s.patient_name || '');
    const prod = normalizePLN(s.product_name || (Array.isArray(s.items) ? s.items.map(i => i.product?.name || i.name).join(' ') : ''));
    const pay = normalizePLN(s.paymentMethod || '');

    if (proto.includes(qNorm) || client.includes(qNorm) || prod.includes(qNorm) || pay.includes(qNorm)) return true;
    return qTokens.every(t => client.includes(t) || prod.includes(t));
  });

  return {
    intents: matchedIntents,
    patients: matchedPatients,
    products: matchedProducts,
    attendances: matchedAttendances,
    sales: matchedSales
  };
}
