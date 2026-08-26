// src/localDB.js

const DB_KEY = 'healthNexusDados';
const CONFIG_KEY = 'healthNexusConfig';
const UPDATED_AT_KEY = 'healthNexusUpdatedAt';

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
  if (!db[table]) {
    db[table] = [];
    modified = true;
  }
  
  // Seed padrão garantido para operadores do CRM Clínico Farmacêutico
  if (table === 'users') {
    const corePharmacyUsers = [
      { id: 'USR-MAZZAROWYSK', name: 'Marcelo Mazaro (Master Gestor)', username: 'mazzarowysk', role: 'Master', crf: 'CRF-SP 54180', password: 'T@zm4n1c0054180', status: 'Ativo' },
      { id: 'USR-FARMACIA', name: 'Dr(a). Farmacêutico(a) Clínico(a)', username: 'farmacia', role: 'Farmacêutico', crf: 'CRF-SP 45890', password: 'farmacia123', status: 'Ativo' },
      { id: 'USR-ADMIN', name: 'Responsável Técnico / Admin', username: 'admin', role: 'Administrador', crf: 'CRF-SP 12345', password: 'admin123', status: 'Ativo' },
      { id: 'USR-ATENDENTE', name: 'Atendente de Balcão / Triagem', username: 'atendente', role: 'Atendente', crf: '-', password: 'farmacia123', status: 'Ativo' }
    ];

    const defaultClinicalUsers = corePharmacyUsers;

    if (db[table].length === 0) {
      corePharmacyUsers.forEach(reqUser => {
        db[table].push({
          ...reqUser,
          created_at: new Date().toISOString()
        });
      });
      modified = true;
    } else {
      // Garante apenas o usuário Master fundador (mazzarowysk) caso a tabela já exista
      const masterUser = coreSystemUsers.find(u => u.username === 'mazzarowysk');
      if (masterUser && !db[table].some(u => u.username === 'mazzarowysk')) {
        db[table].push({
          ...masterUser,
          created_at: new Date().toISOString()
        });
        modified = true;
      }
    }
  }

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
  let results = db[table];
  
  if (queryFn) {
    results = results.filter(queryFn);
  }
  return results;
}

export function get(table, id) {
  const db = getFullDB();
  ensureTable(db, table);
  return db[table].find(item => item.id === id) || null;
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

