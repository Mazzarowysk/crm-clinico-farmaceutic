// ============================================================================
// 🌿 CRM CLÍNICO FARMACÊUTICO — GERENCIADOR DE SIMULAÇÃO & SANDBOX
// Geração de Dados Clínicos, Atendimentos, Suprimentos e Limpeza Segura com Senha
// ============================================================================

import * as localDB from '../localDB.js';
import { state } from '../state.js';
import { syncManager } from './sync.js';

// ─── GERADOR DE PACIENTES / CLIENTES CLÍNICOS SIMULADOS ───

const SIMULATED_NAMES = [
  { name: 'Dona Carmem Silva Silveira', sex: 'Feminino', age: 67, birth: '1959-03-14', phone: '(11) 98765-4321', allergy: 'Dipirona (Broncoespasmo e Urticária)', diseases: 'Hipertensão Arterial, Diabetes Tipo 2', meds: ['Losartana 50mg (1 cp/dia)', 'Metformina 850mg (2 cp/dia)'] },
  { name: 'Sr. Benedito Oliveira Santos', sex: 'Masculino', age: 72, birth: '1954-07-22', phone: '(11) 97654-3210', allergy: 'Anti-inflamatórios Não Esteroidais (AINEs)', diseases: 'Insuficiência Cardíaca Leve, Dislipidemia', meds: ['Sinvastatina 20mg (1 cp/noite)', 'Enalapril 10mg (1 cp 12/12h)'] },
  { name: 'Juliana Mendes de Castro', sex: 'Feminino', age: 34, birth: '1992-11-05', phone: '(11) 99887-1122', allergy: 'Penicilinas e Amoxicilina', diseases: 'Rinite Alérgica Crônica', meds: ['Budesonida Spray Nasal 50mcg'] },
  { name: 'Dr. Roberto Fagundes Lima', sex: 'Masculino', age: 52, birth: '1974-05-18', phone: '(11) 98123-4567', allergy: 'Sulfa / Sulfametoxazol', diseases: 'Hipertensão Arterial Estágio 1', meds: ['Anlodipino 5mg (1 cp/dia)'] },
  { name: 'Larissa Antunes Peixoto', sex: 'Feminino', age: 26, birth: '2000-09-30', phone: '(11) 99554-6677', allergy: 'Nenhuma alergia conhecida', diseases: 'Enxaqueca Ocasional', meds: ['Anticoncepcional Oral'] },
  { name: 'Sr. Waldemar Pires Neto', sex: 'Masculino', age: 80, birth: '1946-01-12', phone: '(11) 97112-3344', allergy: 'Ácido Acetilsalicílico (AAS)', diseases: 'Doença Renal Crônica Estágio 2, Hipertensão', meds: ['Hidroclorotiazida 25mg', 'Atenolol 50mg'] },
  { name: 'Camila Rossi Ferreira', sex: 'Feminino', age: 41, birth: '1985-04-19', phone: '(11) 98877-9900', allergy: 'Iodo / Contrastes', diseases: 'Hipotireoidismo', meds: ['Levotiroxina Sódica 50mcg (em jejum)'] }
];

function generateSimCPF() {
  const n1 = Math.floor(Math.random() * 900) + 100;
  const n2 = Math.floor(Math.random() * 900) + 100;
  const n3 = Math.floor(Math.random() * 900) + 100;
  const d1 = Math.floor(Math.random() * 90) + 10;
  return `${n1}.${n2}.${n3}-${d1}`;
}

export function generateSimulatedPatients(count = 5) {
  let createdCount = 0;
  for (let i = 0; i < count; i++) {
    const template = SIMULATED_NAMES[i % SIMULATED_NAMES.length];
    const newId = 'SIM-PAT-' + Date.now().toString().slice(-5) + '-' + Math.floor(Math.random() * 900 + 100);
    
    const patientRecord = {
      id: newId,
      name: `${template.name} [SIMULADO]`,
      cpf: generateSimCPF(),
      birthDate: template.birth,
      age: template.age,
      sex: template.sex,
      gender: template.sex,
      phone: template.phone,
      city: 'São Paulo - SP',
      address: 'Rua Simulação Clínica, ' + (100 + i * 15),
      allergies: template.allergy,
      chronicConditions: template.diseases,
      chronicDiseases: template.diseases,
      continuousMedications: template.meds,
      clinicalNotes: 'Paciente de demonstração gerado no ambiente Sandbox de Simulação.',
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isSimulation: true
    };

    localDB.insert('patients', patientRecord);
    localDB.insert('pharmacy_patients', patientRecord);
    createdCount++;
  }

  return createdCount;
}

// ─── GERADOR DE ATENDIMENTOS & PRESCRIÇÕES SIMULADAS ───

export function generateSimulatedConsultations(count = 5) {
  let patients = (localDB.list('pharmacy_patients') || []).filter(p => p.isSimulation) || [];
  if (patients.length === 0) {
    patients = (localDB.list('patients') || []).filter(p => p.isSimulation) || [];
  }
  if (patients.length === 0) {
    generateSimulatedPatients(3);
    patients = (localDB.list('pharmacy_patients') || []).filter(p => p.isSimulation) || [];
  }

  const protocols = [
    { name: 'Gripe, Resfriado e Congestão', complaint: 'Gripe e febre de 37.8°C há 2 dias', mips: 'Paracetamol 750mg de 8/8h + Lavagem Nasal com Soro 0.9%', outcome: 'Dispensação com Orientação Farmacêutica' },
    { name: 'Cefaleia Tensional e Enxaqueca Leve', complaint: 'Dor de cabeça pulsátil na região frontal', mips: 'Ibuprofeno 400mg a cada 8 horas (se dor persistir)', outcome: 'Dispensação com Orientação Farmacêutica' },
    { name: 'Rinite Alérgica & Coriza Hialina', complaint: 'Crise de espirros, prurido ocular e coriza', mips: 'Loratadina 10mg (1 cp/dia à noite por 5 dias)', outcome: 'Dispensação com Orientação Farmacêutica' },
    { name: 'Dores Musculares e Lombalgia', complaint: 'Dor lombar após esforço físico intenso', mips: 'Paracetamol 500mg + Cafeína 65mg + Compressas Mornas', outcome: 'Dispensação com Orientação Farmacêutica' },
    { name: 'Queimação Epigástrica e Pirose', complaint: 'Azia e queimação retroesternal pós-refeição', mips: 'Hidróxido de Alumínio + Magnésio suspensão 10ml', outcome: 'Dispensação com Orientação Farmacêutica' }
  ];

  let createdCount = 0;
  for (let i = 0; i < count; i++) {
    const patient = patients[i % patients.length] || { id: 'SIM-PAT-001', name: 'Paciente Simulado', cpf: '000.000.000-00' };
    const proto = protocols[i % protocols.length];
    const consultId = 'SIM-ATT-' + Date.now().toString().slice(-5) + '-' + (i + 1);

    const consultation = {
      id: consultId,
      patient_id: patient.id,
      patientId: patient.id,
      patient_name: patient.name,
      patientName: patient.name,
      patient_cpf: patient.cpf,
      patientCpf: patient.cpf,
      tipo_visita: 'Acompanhamento Farmacoterapêutico',
      protocol: proto.name,
      queixa_triagem: proto.complaint,
      complaint: proto.complaint,
      evolutionDays: Math.floor(Math.random() * 4) + 1,
      intensity: ['Leve', 'Moderada', 'Intensa'][Math.floor(Math.random() * 3)],
      prescricao_mips: proto.mips,
      mipsPrescribed: proto.mips,
      conduta_final: proto.outcome,
      outcome: proto.outcome,
      pharmacist_name: state.user?.name || 'Dr. Marcelo Mazaro (CRF-SP 54.180)',
      pharmacistName: state.user?.name || 'Dr. Marcelo Mazaro',
      pharmacistCrf: 'CRF-SP 54.180',
      data_hora: new Date(Date.now() - (i * 3600000 * 6)).toISOString(),
      date: new Date(Date.now() - (i * 3600000 * 6)).toISOString(),
      isSimulation: true
    };

    localDB.insert('pharmacy_attendances', consultation);
    localDB.insert('pharmacy_consultations', consultation);
    createdCount++;
  }

  return createdCount;
}

// ─── GERADOR DE ESTOQUE & SUPRIMENTOS SIMULADOS (ENTRADAS & SAÍDAS) ───

export function generateSimulatedStockEntries(count = 5) {
  const products = [
    { name: 'Dipirona Monoidratada 500mg (20 cps)', lab: 'EMS S/A', cat: 'Analgésico / Antitérmico', cost: 4.20, sale: 14.90, qty: 80 },
    { name: 'Paracetamol 750mg (20 cps)', lab: 'Medley Farmacêutica', cat: 'Analgésico / Antitérmico', cost: 5.50, sale: 18.50, qty: 65 },
    { name: 'Loratadina 10mg (12 cps)', lab: 'Eurofarma', cat: 'Anti-histamínico', cost: 6.80, sale: 22.90, qty: 50 },
    { name: 'Ibuprofeno 400mg (20 cps)', lab: 'Neo Química', cat: 'Anti-inflamatório (AINE)', cost: 7.10, sale: 24.50, qty: 70 },
    { name: 'Cloreto de Sódio 0.9% Spray 50ml', lab: 'Farmax', cat: 'Solução Nasal', cost: 8.00, sale: 26.90, qty: 45 },
    { name: 'Omeprazol 20mg (28 cápsulas)', lab: 'Aché Laboratórios', cat: 'Antiulceroso', cost: 9.30, sale: 32.00, qty: 40 }
  ];

  let createdCount = 0;
  for (let i = 0; i < count; i++) {
    const prod = products[i % products.length];
    const batch = 'L' + Math.floor(Math.random() * 90000 + 10000);
    const id = 'SIM-PROD-' + Date.now().toString().slice(-5) + '-' + (i + 1);

    const stockItem = {
      id,
      name: prod.name + ' [SIMULADO]',
      laboratory: prod.lab,
      supplier: prod.lab,
      category: prod.cat,
      batch: batch,
      batchNumber: batch,
      expiry_date: '2028-06-30',
      expiryDate: '2028-06-30',
      quantity: prod.qty,
      current_stock: prod.qty,
      cost_price: prod.cost,
      costPrice: prod.cost,
      sale_price: prod.sale,
      salePrice: prod.sale,
      min_stock: 15,
      minStock: 15,
      status: 'Normal',
      isSimulation: true,
      lastUpdated: new Date().toISOString()
    };

    localDB.insert('products', stockItem);
    createdCount++;
  }

  return createdCount;
}

// ─── GERADOR DE LANÇAMENTOS FINANCEIROS SIMULADOS ───

export function generateSimulatedFinancialTransactions(count = 8) {
  const transactions = [
    { type: 'receita', cat: 'Consulta Farmacêutica (Balcão)', desc: 'Triagem de Rinite Alérgica e Orientação', val: 40.00, client: 'Juliana Mendes de Castro' },
    { type: 'receita', cat: 'Venda de Medicamentos (PDV)', desc: 'Paracetamol 750mg + Soro Fisiológico Spray', val: 45.40, client: 'Dona Carmem Silva' },
    { type: 'receita', cat: 'Aplicação de Injetáveis & Vacinas', desc: 'Aplicação de Vacina Antigripal', val: 85.00, client: 'Sr. Benedito Oliveira' },
    { type: 'receita', cat: 'Testes Rápidos / TLR (RDC 786)', desc: 'Teste Rápido de Covid-19 / Influenza Ag', val: 65.00, client: 'Dr. Roberto Fagundes' },
    { type: 'despesa', cat: 'Compra de Medicamentos (Distribuidora)', desc: 'Reposição de Analgésicos NF 99.231', val: 380.00, client: 'Distribuidora Santa Cruz' },
    { type: 'despesa', cat: 'Insumos & Descartáveis', desc: 'Luvas de Procedimento, Seringas e Gaze', val: 78.90, client: 'Cirúrgica Central' },
    { type: 'despesa', cat: 'Energia, Água & Internet', desc: 'Conta de Energia Elétrica Consultório', val: 210.00, client: 'Enel Distribuição' },
    { type: 'receita', cat: 'Aferição de Pressão / Glicemia', desc: 'Perfil Glicêmico e Aferição de PA', val: 20.00, client: 'Sr. Waldemar Pires' }
  ];

  let createdCount = 0;
  for (let i = 0; i < count; i++) {
    const t = transactions[i % transactions.length];
    const transRecord = {
      id: 'SIM-FIN-' + Date.now().toString().slice(-5) + '-' + (i + 1),
      type: t.type,
      category: t.cat,
      description: t.desc + ' [SIMULADO]',
      clientOrSupplier: t.client,
      amount: t.val,
      paymentMethod: ['PIX', 'Cartão de Débito', 'Cartão de Crédito', 'Dinheiro'][i % 4],
      date: new Date(Date.now() - (i * 3600000 * 8)).toISOString(),
      status: 'recebido',
      isSimulation: true
    };

    localDB.insert('financial_transactions', transRecord);
    createdCount++;
  }

  return createdCount;
}

// ─── GERADOR DE ECOSSISTEMA COMPLETO DE DEMONSTRAÇÃO (1 CLIQUE) ───

export function generateFullDemoEcosystem() {
  const pCount = generateSimulatedPatients(6);
  const cCount = generateSimulatedConsultations(6);
  const sCount = generateSimulatedStockEntries(6);
  const fCount = generateSimulatedFinancialTransactions(8);

  return {
    patients: pCount,
    consultations: cCount,
    products: sCount,
    financial: fCount
  };
}

// ─── LIMPEZA SEGURA DE DADOS COM VALIDAÇÃO DE SENHA ───

export function verifyOperatorPassword(inputPassword) {
  if (!inputPassword || typeof inputPassword !== 'string') return false;
  const trimmed = inputPassword.trim();
  if (!trimmed) return false;

  const currentUser = state.user || {};
  
  // Senha do usuário atual logado
  if (currentUser.password && (currentUser.password === trimmed || currentUser.password.toLowerCase() === trimmed.toLowerCase())) {
    return true;
  }

  // Senhas mestres e padrões aceitas
  const authorizedPasswords = [
    'T@zm4n1c0054180',
    'admin',
    'admin123',
    'mazzarowysk',
    'mazzaro123',
    'mazzaro',
    'pharma2026',
    'master',
    'master123',
    '123456'
  ];

  if (authorizedPasswords.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
    return true;
  }

  const allUsers = localDB.list('users') || [];
  const found = allUsers.find(u => 
    u.username?.toLowerCase() === currentUser.username?.toLowerCase() ||
    u.role === 'Master'
  );
  if (found && found.password && (found.password === trimmed || found.password.toLowerCase() === trimmed.toLowerCase())) {
    return true;
  }

  return false;
}

// 1. Limpa apenas os registros de Simulação (isSimulation === true ou [SIMULADO])
export async function cleanSimulationData(password) {
  if (!verifyOperatorPassword(password)) {
    return { success: false, message: 'Senha incorreta. Verifique sua senha de acesso.' };
  }

  const db = localDB.getFullDB();
  let totalRemoved = 0;

  Object.keys(db).forEach(tableName => {
    if (tableName === 'users' || tableName === 'settings' || tableName === '__initialized') return;
    if (Array.isArray(db[tableName])) {
      const originalLen = db[tableName].length;
      db[tableName] = db[tableName].filter(item => {
        if (!item || typeof item !== 'object') return true;
        const isSim = item.isSimulation === true ||
          String(item.id || '').startsWith('SIM-') ||
          String(item.name || '').includes('[SIMULADO]') ||
          String(item.patientName || '').includes('[SIMULADO]') ||
          String(item.patient_name || '').includes('[SIMULADO]') ||
          String(item.clientOrSupplier || '').includes('[SIMULADO]') ||
          String(item.description || '').includes('[SIMULADO]');
        return !isSim;
      });
      totalRemoved += (originalLen - db[tableName].length);
    }
  });

  localDB.saveFullDB(db);
  if (typeof window !== 'undefined' && typeof window.clearDataCache === 'function') {
    window.clearDataCache();
  }

  // Sincronizar com Turso Cloud se configurado
  if (syncManager && typeof syncManager.pushDirectToTurso === 'function') {
    try {
      await syncManager.pushDirectToTurso(
        JSON.stringify(db),
        localStorage.getItem('crmFarmaceuticoConfig') || '{}'
      );
    } catch(e) {
      console.warn('[SimulationManager] Aviso ao sincronizar com Turso:', e.message);
    }
  }

  return { success: true, removedCount: totalRemoved };
}

// 2. Limpa apenas os registros Reais de Produção (mantém simulação)
export async function cleanRealProductionData(password, confirmationText) {
  if (!verifyOperatorPassword(password)) {
    return { success: false, message: 'Senha de operador incorreta.' };
  }

  if (confirmationText?.trim()?.toUpperCase() !== 'CONFIRMAR') {
    return { success: false, message: 'Texto de confirmação incorreto. Digite "CONFIRMAR".' };
  }

  const db = localDB.getFullDB();
  let totalRemoved = 0;

  Object.keys(db).forEach(tableName => {
    if (tableName === 'users' || tableName === 'settings' || tableName === '__initialized') return;
    if (Array.isArray(db[tableName])) {
      const originalLen = db[tableName].length;
      db[tableName] = db[tableName].filter(item => {
        if (!item || typeof item !== 'object') return false;
        const isSim = item.isSimulation === true ||
          String(item.id || '').startsWith('SIM-') ||
          String(item.name || '').includes('[SIMULADO]') ||
          String(item.patientName || '').includes('[SIMULADO]') ||
          String(item.patient_name || '').includes('[SIMULADO]') ||
          String(item.clientOrSupplier || '').includes('[SIMULADO]') ||
          String(item.description || '').includes('[SIMULADO]');
        return isSim; // Mantém apenas os simulados
      });
      totalRemoved += (originalLen - db[tableName].length);
    }
  });

  localDB.saveFullDB(db);
  if (typeof window !== 'undefined' && typeof window.clearDataCache === 'function') {
    window.clearDataCache();
  }

  // Sincronizar com Turso Cloud se configurado
  if (syncManager && typeof syncManager.pushDirectToTurso === 'function') {
    try {
      await syncManager.pushDirectToTurso(
        JSON.stringify(db),
        localStorage.getItem('crmFarmaceuticoConfig') || '{}'
      );
    } catch(e) {
      console.warn('[SimulationManager] Aviso ao sincronizar com Turso:', e.message);
    }
  }

  return { success: true, removedCount: totalRemoved };
}

// 3. Reset Completo de Fábrica (Hard Reset)
export async function hardResetAllCollections(password, confirmationText) {
  if (!verifyOperatorPassword(password)) {
    return { success: false, message: 'Senha de operador incorreta.' };
  }

  if (confirmationText?.trim()?.toUpperCase() !== 'CONFIRMAR') {
    return { success: false, message: 'Texto de confirmação incorreto. Digite "CONFIRMAR".' };
  }

  const currentDB = localDB.getFullDB() || {};

  const masterUser = {
    id: 'USR-MAZZAROWYSK',
    name: 'Marcelo Mazaro',
    username: 'mazzarowysk',
    role: 'Master',
    crf: 'CRF-SP 54180',
    password: 'T@zm4n1c0054180',
    status: 'Ativo',
    created_at: new Date().toISOString()
  };

  // Preserva usuários operadores cadastrados ou garante o Master
  let preservedUsers = Array.isArray(currentDB.users) && currentDB.users.length > 0
    ? currentDB.users
    : [masterUser];
  
  if (!preservedUsers.some(u => (u.username || '').toLowerCase() === 'mazzarowysk')) {
    preservedUsers.unshift(masterUser);
  }

  // Preserva dados fiscais e sanitários da farmácia ou usa o padrão
  const preservedSettings = (currentDB.settings && typeof currentDB.settings === 'object' && Object.keys(currentDB.settings).length > 0)
    ? currentDB.settings
    : {
        pharmacyName: 'Farmácia & Drogaria Modelo',
        pharmacyCnpj: '12.345.678/0001-90',
        pharmacyAddress: 'Av. Paulista, 1000 - São Paulo, SP',
        pharmacyPhone: '(11) 3333-4444',
        pharmacyResponsible: 'Marcelo Mazaro',
        pharmacyCrf: 'CRF-SP 54180',
        pharmacyAnvisaAfe: 'AFE-1.23456.7'
      };

  // Banco de dados limpo com todas as coleções do CRM e módulos zerados
  const cleanDB = {
    __initialized: true,
    users: preservedUsers,
    settings: preservedSettings,
    patients: [],
    pharmacy_patients: [],
    pharmacy_attendances: [],
    pharmacy_consultations: [],
    pharmacy_active_meds: [],
    products: [],
    inventory_movements: [],
    patient_purchases: [],
    pharmacy_decision_audit: [],
    financial_transactions: [],
    financial_installments: [],
    financial_categories: [],
    financial_payment_methods: [],
    appointments: [],
    admissions: [],
    medications: [],
    prescriptions: [],
    telemed_sessions: [],
    sngpc_movements: [],
    vaccinations: [],
    cash_registers: [],
    sales_history: [],
    stagnation_alerts: [],
    consulting_rooms: [],
    consultorios: [],
    doctors: [],
    nurses: [],
    encounters: [],
    triages: [],
    beds: [],
    hospitalizations: [],
    tv_calls: [],
    duty_schedules: [],
    clinical_notes: [],
    tlr_exams: [],
    postcare_followups: [],
    postcare_refills: [],
    user_sessions: []
  };

  // Garante que qualquer outra chave de tabela dinâmica existente seja zerada
  Object.keys(currentDB).forEach(key => {
    if (key !== 'users' && key !== 'settings' && key !== '__initialized') {
      cleanDB[key] = [];
    }
  });

  // Salvar base limpa no localStorage com timestamp atualizado e flag de inicializado
  localStorage.setItem('crm_initialized', 'true');
  localDB.saveFullDB(cleanDB);

  // Limpar chaves legadas e caches (NUNCA remover crmFarmaceuticoDados!)
  const keysToRemove = [
    'crm_financial_transactions',
    'crm_patients',
    'crm_pharmacy_patients',
    'crm_pharmacy_attendances',
    'crm_pharmacy_consultations',
    'crm_products',
    'crm_inventory_movements',
    'crm_patient_purchases',
    'crm_custom_fin_categories',
    'crm_custom_fin_payments',
    'crm_custom_pbms',
    'crm_custom_prod_categories',
    'crmFarmaceuticoDados_cache',
    'healthNexusDados_cache',
    'hn_notified_pending'
  ];
  keysToRemove.forEach(k => localStorage.removeItem(k));

  if (typeof window !== 'undefined' && typeof window.clearDataCache === 'function') {
    window.clearDataCache();
  }

  // Sincronizar Hard Reset com Turso Cloud (garante que nuvem fique idêntica e vazia)
  if (syncManager && typeof syncManager.pushDirectToTurso === 'function') {
    try {
      await syncManager.pushDirectToTurso(
        JSON.stringify(cleanDB),
        localStorage.getItem('crmFarmaceuticoConfig') || '{}'
      );
      console.log('[HardReset] Turso Cloud sincronizado com a base limpa.');
    } catch(e) {
      console.warn('[HardReset] Aviso ao sincronizar reset com Turso:', e.message);
    }
  }

  return { success: true };
}
