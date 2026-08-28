// src/localDB.js

export const DB_KEY = 'crmFarmaceuticoDados';
export const CONFIG_KEY = 'crmFarmaceuticoConfig';
export const UPDATED_AT_KEY = 'crmFarmaceuticoUpdatedAt';

// Função para obter todo o banco
export function getFullDB() {
  try {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('Erro ao ler DB local:', e);
    return {};
  }
}

// Função para salvar todo o banco
export function saveFullDB(dbData, silent = false) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(dbData));
    if (!silent) {
      localStorage.setItem(UPDATED_AT_KEY, Date.now().toString());
    }
  } catch (e) {
    console.error('Erro ao salvar DB local. Possível limite de quota do localStorage atingido.', e);
  }
}

export function getConfig() {
  try {
    const config = localStorage.getItem(CONFIG_KEY);
    return config ? JSON.parse(config) : {};
  } catch (e) {
    return {};
  }
}

export function saveConfig(configData) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(configData));
  localStorage.setItem(UPDATED_AT_KEY, Date.now().toString());
}

export function getLocalUpdatedAt() {
  return parseInt(localStorage.getItem(UPDATED_AT_KEY) || '0', 10);
}

export function generateId(prefix = 'ID') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Inicializa a tabela se não existir
function ensureTable(db, table) {
  let modified = false;
  if (!db[table] || !Array.isArray(db[table])) {
    if (db[table] && typeof db[table] === 'object' && !Array.isArray(db[table])) {
      db[table] = [db[table]];
    } else {
      db[table] = [];
    }
    modified = true;
  }
  
  // Seed padrão para usuários do CRM Clínico Farmacêutico
  if (table === 'users') {
    const defaultUsers = [
      {
        id: 'USR-MAZZAROWYSK',
        name: 'Marcelo Mazaro',
        username: 'mazzarowysk',
        role: 'Master',
        crf: 'CRF-SP 54180',
        password: 'T@zm4n1c0054180',
        status: 'Ativo',
        created_at: new Date().toISOString()
      },
      {
        id: 'USR-ADMIN',
        name: 'Gestor Master',
        username: 'admin',
        role: 'Master',
        crf: 'CRF-SP 54180',
        password: 'admin123',
        status: 'Ativo',
        created_at: new Date().toISOString()
      },
      {
        id: 'USR-FARMACIA',
        name: 'Farmacêutico RT',
        username: 'farmacia',
        role: 'Farmacêutico RT',
        crf: 'CRF-SP 12345',
        password: 'admin123',
        status: 'Ativo',
        created_at: new Date().toISOString()
      }
    ];

    if (!Array.isArray(db[table]) || db[table].length === 0) {
      db[table] = [...defaultUsers];
      modified = true;
    } else {
      // Remove contas legadas de teste mas mantém os usuários oficiais
      const legacyUsernames = ['bcoltri', 'ffacco', 'pforte', 'atendente', 'medico', 'enfermeiro', 'recepcionista'];
      const filtered = db[table].filter(u => {
        const uname = (u.username || '').toLowerCase().trim();
        if (['mazzarowysk', 'admin', 'farmacia'].includes(uname)) return true;
        if (uname.startsWith('dr.') || uname.startsWith('dra.') || uname.startsWith('dr_') || uname.startsWith('dra_')) return false;
        if (legacyUsernames.includes(uname)) return false;
        return true;
      });

      if (filtered.length !== db[table].length) {
        db[table] = filtered;
        modified = true;
      }

      // Garante que mazzarowysk, admin e farmacia estejam sempre presentes e ativos
      defaultUsers.forEach(defU => {
        const idx = db[table].findIndex(u => (u.username || '').toLowerCase().trim() === defU.username);
        if (idx === -1) {
          db[table].push(defU);
          modified = true;
        } else {
          const curr = db[table][idx];
          if (curr.status !== 'Ativo') {
            curr.status = 'Ativo';
            modified = true;
          }
          if (defU.username === 'mazzarowysk') {
            curr.role = 'Master';
            curr.password = 'T@zm4n1c0054180';
            modified = true;
          }
        }
      });
    }
  }

  const isInitialized = db.__initialized || localStorage.getItem('crm_initialized') === 'true';

  // Seed inicial apenas na primeira instalação (se não inicializado)
  if (!isInitialized) {
    db.__initialized = true;
    localStorage.setItem('crm_initialized', 'true');
    modified = true;

    // Seed para Pacientes e Atendimentos do CRM Clínico Farmacêutico
    if (table === 'pharmacy_patients' && db[table].length === 0) {
      db[table] = [
        {
          id: 'PHARM-PAT-001',
          name: 'Dona Maria de Lourdes Santos',
          cpf: '234.567.890-12',
          birthDate: '1958-04-12',
          age: 68,
        gender: 'Feminino',
        isPregnantOrLactating: false,
        allergies: 'Dipirona (Edema de Glote e Urticária Severa)',
        chronicConditions: 'Hipertensão Arterial Sistêmica, Diabetes Mellitus Tipo 2, Insuficiência Renal Leve',
        phone: '(11) 98765-4321',
        address: 'Rua das Flores, 142 - Centro',
        prescribers: 'Dr. Roberto Fernandes (Cardiologista)',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'PHARM-PAT-002',
        name: 'Sr. Antônio Carlos Moreira',
        cpf: '345.678.901-23',
        birthDate: '1962-09-25',
        age: 64,
        gender: 'Masculino',
        isPregnantOrLactating: false,
        allergies: 'Penicilinas e Derivados',
        chronicConditions: 'Fibrilação Atrial Crônica, Histórico de AVC Isquêmico, Hipertensão',
        phone: '(11) 97654-3210',
        address: 'Av. Paulista, 1500 - Bela Vista',
        prescribers: 'Dra. Mariana Lima (Neurologista)',
        created_at: new Date(Date.now() - 60 * 86400000).toISOString()
      },
      {
        id: 'PHARM-PAT-003',
        name: 'Juliana Paes de Camargo',
        cpf: '456.789.012-34',
        birthDate: '1995-11-03',
        age: 31,
        gender: 'Feminino',
        isPregnantOrLactating: true,
        allergies: 'Nenhuma alergia conhecida',
        chronicConditions: 'Gestante (26ª semana) - Pré-natal de baixo risco',
        phone: '(11) 96543-2109',
        address: 'Rua Bela Cintra, 890 - Consolação',
        prescribers: 'Dra. Ana Maria Costa (Obstetra)',
        created_at: new Date(Date.now() - 15 * 86400000).toISOString()
      }
    ];
    modified = true;
  }

  if (table === 'pharmacy_active_meds' && db[table].length === 0) {
    db[table] = [
      {
        id: 'MED-ACT-001',
        patient_id: 'PHARM-PAT-001',
        name: 'Enalapril 20mg',
        type: 'Contínuo',
        posology: '1 comprimido de 12/12h às 08h e 20h',
        prescriber: 'Dr. Roberto Fernandes',
        status_ativo: 'Ativo',
        startDate: new Date(Date.now() - 90 * 86400000).toISOString(),
        durationDays: 180
      },
      {
        id: 'MED-ACT-002',
        patient_id: 'PHARM-PAT-001',
        name: 'Espironolactona 25mg',
        type: 'Contínuo',
        posology: '1 comprimido pela manhã às 08h',
        prescriber: 'Dr. Roberto Fernandes',
        status_ativo: 'Ativo',
        startDate: new Date(Date.now() - 90 * 86400000).toISOString(),
        durationDays: 180
      },
      {
        id: 'MED-ACT-003',
        patient_id: 'PHARM-PAT-002',
        name: 'Varfarina Sódica 5mg (Marevan)',
        type: 'Contínuo',
        posology: '1 comprimido às 18h (Monitorar INR alvo 2.0 - 3.0)',
        prescriber: 'Dra. Mariana Lima',
        status_ativo: 'Ativo',
        startDate: new Date(Date.now() - 120 * 86400000).toISOString(),
        durationDays: 365
      },
      {
        id: 'MED-ACT-004',
        patient_id: 'PHARM-PAT-002',
        name: 'Monocordil 20mg (Isossorbida)',
        type: 'Contínuo',
        posology: '1 comprimido de 12/12h',
        prescriber: 'Dr. Roberto Fernandes',
        status_ativo: 'Ativo',
        startDate: new Date(Date.now() - 45 * 86400000).toISOString(),
        durationDays: 180
      }
    ];
    modified = true;
  }

  if (table === 'pharmacy_attendances' && db[table].length === 0) {
    db[table] = [
      {
        id: 'PHARM-ATT-001',
        patient_id: 'PHARM-PAT-001',
        pharmacist_name: 'Dr. Lucas Ferreira (CRF/SP 48.912)',
        data_hora: new Date(Date.now() - 2 * 86400000).toISOString(),
        tipo_visita: 'Acompanhamento Farmacoterapêutico',
        queixa_triagem: 'Gripe e coriza com febre baixa há 1 dia',
        red_flags: [],
        prescricao_mips: 'Paracetamol 750mg de 8/8h se febre; Lavagem com Soro Fisiológico 0.9%',
        interacoes_detectadas: [],
        conduta_final: 'Dispensação com Orientação Farmacêutica',
        observacoes: 'Alergia a Dipirona checada e respeitada com segurança.'
      }
    ];
    modified = true;
  }

  if (table === 'products' && db[table].length === 0) {
    db[table] = [
      {
        id: 'PROD-001',
        name: 'Dipirona Monoidratada 500mg/ml Gotas 20ml',
        dci: 'Dipirona Sódica',
        ean: '7891058001234',
        category: 'MIP / Analgésico',
        presentation: 'Frasco conta-gotas 20ml',
        current_stock: 45,
        min_stock: 15,
        cost_price: 3.50,
        sale_price: 8.90,
        batch: 'L-24089',
        expiry_date: '2027-08-30',
        supplier: 'Medley / Sanofi',
        status: 'Normal'
      },
      {
        id: 'PROD-002',
        name: 'Paracetamol 750mg c/ 20 comprimidos',
        dci: 'Paracetamol',
        ean: '7896004701235',
        category: 'MIP / Antitérmico',
        presentation: 'Caixa com 20 comprimidos',
        current_stock: 32,
        min_stock: 10,
        cost_price: 4.20,
        sale_price: 11.50,
        batch: 'L-98412',
        expiry_date: '2027-11-15',
        supplier: 'EMS Pharma',
        status: 'Normal'
      },
      {
        id: 'PROD-003',
        name: 'Losartana Potássica 50mg c/ 30 comprimidos',
        dci: 'Losartana Potássica',
        ean: '7896422509871',
        category: 'Uso Contínuo / Anti-hipertensivo',
        presentation: 'Caixa com 30 comprimidos revestidos',
        current_stock: 60,
        min_stock: 20,
        cost_price: 5.80,
        sale_price: 14.90,
        batch: 'L-77621',
        expiry_date: '2027-05-20',
        supplier: 'Eurofarma',
        status: 'Normal'
      },
      {
        id: 'PROD-004',
        name: 'Omeprazol 20mg c/ 28 cápsulas',
        dci: 'Omeprazol',
        ean: '7891058223344',
        category: 'MIP / Antiácido e IBP',
        presentation: 'Caixa com 28 cápsulas gelatinosas duras',
        current_stock: 25,
        min_stock: 12,
        cost_price: 6.90,
        sale_price: 16.80,
        batch: 'L-33410',
        expiry_date: '2026-10-10',
        supplier: 'Aché Laboratórios',
        status: 'Vencimento Próximo'
      },
      {
        id: 'PROD-005',
        name: 'Vitamina C 1g + Zinco 10mg Efervescente c/ 10 comprimidos',
        dci: 'Ácido Ascórbico + Zinco',
        ean: '7898040319800',
        category: 'Suplemento / Imunidade',
        presentation: 'Tubo com 10 comprimidos efervescentes sabor laranja',
        current_stock: 18,
        min_stock: 8,
        cost_price: 8.50,
        sale_price: 19.90,
        batch: 'L-88712',
        expiry_date: '2027-12-31',
        supplier: 'Bayer / Redoxon',
        status: 'Normal'
      },
      {
        id: 'PROD-006',
        name: 'Soro Fisiológico 0.9% 500ml',
        dci: 'Cloreto de Sódio 0,9%',
        ean: '7896006203010',
        category: 'MIP / Solução Nasal e Lavagem',
        presentation: 'Frasco plástico 500ml',
        current_stock: 40,
        min_stock: 15,
        cost_price: 2.80,
        sale_price: 7.50,
        batch: 'L-11290',
        expiry_date: '2028-02-15',
        supplier: 'Farmax',
        status: 'Normal'
      },
      {
        id: 'PROD-007',
        name: 'Tiras de Teste de Glicemia Accu-Chek Guide c/ 50 unidades',
        dci: 'Tiras Reagentes para Glicose',
        ean: '7612980209876',
        category: 'Correlatos / Diagnóstico Clínico',
        presentation: 'Caixa com 50 tiras reagentes',
        current_stock: 8,
        min_stock: 10,
        cost_price: 68.00,
        sale_price: 119.90,
        batch: 'L-GUIDE-99',
        expiry_date: '2026-12-31',
        supplier: 'Roche Diabetes Care',
        status: 'Estoque Baixo'
      },
      {
        id: 'PROD-008',
        name: 'Ibuprofeno 400mg c/ 10 cápsulas líquidas',
        dci: 'Ibuprofeno',
        ean: '7896422501123',
        category: 'MIP / Anti-inflamatório e Analgésico',
        presentation: 'Blíster com 10 cápsulas moles',
        current_stock: 22,
        min_stock: 10,
        cost_price: 7.20,
        sale_price: 17.50,
        batch: 'L-IBU-400',
        expiry_date: '2027-09-18',
        supplier: 'Alivium / Mantecorp',
        status: 'Normal'
      }
    ];
    modified = true;
  }

  if (table === 'inventory_movements' && db[table].length === 0) {
    db[table] = [
      {
        id: 'MOV-001',
        product_id: 'PROD-003',
        product_name: 'Losartana Potássica 50mg c/ 30 comprimidos',
        type: 'Entrada',
        quantity: 60,
        batch: 'L-77621',
        cost_unit: 5.80,
        total_value: 348.00,
        reason: 'Nota Fiscal de Compra NF-e 49812 - Eurofarma',
        operator_name: 'Marcelo Mazaro (Master)',
        created_at: new Date(Date.now() - 10 * 86400000).toISOString()
      },
      {
        id: 'MOV-002',
        product_id: 'PROD-001',
        product_name: 'Dipirona Monoidratada 500mg/ml Gotas 20ml',
        type: 'Entrada',
        quantity: 50,
        batch: 'L-24089',
        cost_unit: 3.50,
        total_value: 175.00,
        reason: 'Entrada de Estoque Inicial',
        operator_name: 'Marcelo Mazaro (Master)',
        created_at: new Date(Date.now() - 8 * 86400000).toISOString()
      },
      {
        id: 'MOV-003',
        product_id: 'PROD-002',
        product_name: 'Paracetamol 750mg c/ 20 comprimidos',
        type: 'Dispensação Clínica',
        quantity: -1,
        batch: 'L-98412',
        cost_unit: 4.20,
        total_value: 11.50,
        patient_id: 'PHARM-PAT-001',
        patient_name: 'Dona Maria de Lourdes Santos',
        reason: 'Atendimento de Balcão e Orientação Farmacêutica',
        operator_name: 'Dr. Lucas Ferreira (CRF/SP 48.912)',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString()
      }
    ];
    modified = true;
  }

  if (table === 'patient_purchases' && db[table].length === 0) {
    db[table] = [
      {
        id: 'PURCH-001',
        patient_id: 'PHARM-PAT-001',
        patient_name: 'Dona Maria de Lourdes Santos',
        product_id: 'PROD-002',
        product_name: 'Paracetamol 750mg c/ 20 comprimidos',
        quantity: 1,
        unit_price: 11.50,
        total_price: 11.50,
        is_continuous: false,
        batch: 'L-98412',
        attendance_id: 'PHARM-ATT-001',
        pharmacist_name: 'Dr. Lucas Ferreira',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: 'PURCH-002',
        patient_id: 'PHARM-PAT-001',
        patient_name: 'Dona Maria de Lourdes Santos',
        product_id: 'PROD-003',
        product_name: 'Losartana Potássica 50mg c/ 30 comprimidos',
        quantity: 1,
        unit_price: 14.90,
        total_price: 14.90,
        is_continuous: true,
        days_supply: 30,
        refill_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        batch: 'L-77621',
        attendance_id: null,
        pharmacist_name: 'Marcelo Mazaro',
        created_at: new Date(Date.now() - 25 * 86400000).toISOString()
      }
    ];
    modified = true;
  }

  if (table === 'pharmacy_decision_audit' && db[table].length === 0) {
    db[table] = [
      {
        id: 'AUD-001',
        attendance_id: 'PHARM-ATT-001',
        interaction_title: 'Validação de Alergia a Dipirona',
        severity: 'Critica',
        acao_tomada: 'Ajustado',
        justificativa: 'Paciente alérgica a Dipirona; selecionado Paracetamol conforme protocolo CDSS.',
        pharmacist_crf: 'CRF/SP 48.912',
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString()
      }
    ];
    modified = true;
  }

  } // Fim de if (!isInitialized)

  if (modified) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch(e) {}
  }
}

// CRUD Genérico

export function list(table, queryFn = null) {
  const db = getFullDB();
  ensureTable(db, table);
  let results = Array.isArray(db[table]) ? db[table] : [];
  
  if (queryFn) {
    results = results.filter(queryFn);
  }
  return results;
}

export function get(table, id) {
  const db = getFullDB();
  ensureTable(db, table);
  if (!Array.isArray(db[table])) {
    if (db[table] && typeof db[table] === 'object') return db[table];
    return null;
  }
  return db[table].find(item => item && (item.id === id || (id === 'main' && !item.id))) || null;
}

export function insert(table, data) {
  const db = getFullDB();
  ensureTable(db, table);
  
  const newItem = {
    ...data,
    id: data.id || generateId(table.toUpperCase().substring(0, 3)),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  db[table].push(newItem);
  const isSilent = (table === 'user_sessions' || table === 'settings');
  saveFullDB(db, isSilent);
  return newItem;
}

export function update(table, id, data) {
  const db = getFullDB();
  ensureTable(db, table);
  
  const index = db[table].findIndex(item => item.id === id);
  if (index === -1) return null;
  
  const updatedItem = {
    ...db[table][index],
    ...data,
    updated_at: new Date().toISOString()
  };
  
  db[table][index] = updatedItem;
  const isSilent = (table === 'user_sessions' || table === 'settings');
  saveFullDB(db, isSilent);
  return updatedItem;
}

export function remove(table, id) {
  const db = getFullDB();
  ensureTable(db, table);
  
  if (!db[table] || !Array.isArray(db[table])) return false;
  
  const initialLength = db[table].length;
  
  if (table === 'users') {
    const targetUser = db[table].find(u => u.id === id || u.username === id);
    const targetUsername = targetUser ? targetUser.username : id;
    db[table] = db[table].filter(u => u.id !== id && u.username !== id && u.username !== targetUsername);
  } else {
    db[table] = db[table].filter(item => item.id !== id);
  }

  if (db[table].length === initialLength) return false;

  const isSilent = (table === 'user_sessions' || table === 'settings');
  saveFullDB(db, isSilent);
  return true;
}

export function overwriteLocal(cloudPayload) {
  if (cloudPayload.dados_json) {
    localStorage.setItem(DB_KEY, cloudPayload.dados_json);
  }
  if (cloudPayload.config_json) {
    localStorage.setItem(CONFIG_KEY, cloudPayload.config_json);
  }
  if (cloudPayload.updated_at) {
    localStorage.setItem(UPDATED_AT_KEY, cloudPayload.updated_at.toString());
  }
}

export function clear() {
  const db = getFullDB();
  const savedUsers = db.users || [];
  const savedSettings = db.settings || [];
  const savedSessions = db.user_sessions || [];

  const emptyDB = {
    users: savedUsers,
    user_sessions: savedSessions,
    patients: [],
    encounters: [],
    appointments: [],
    triages: [],
    prescriptions: [],
    duty_schedules: [],
    stagnation_alerts: [],
    beds: [],
    settings: savedSettings
  };

  localStorage.setItem(DB_KEY, JSON.stringify(emptyDB));
  localStorage.setItem(UPDATED_AT_KEY, Date.now().toString());
  if (typeof window !== 'undefined' && typeof window.clearDataCache === 'function') {
    window.clearDataCache();
  }
}

