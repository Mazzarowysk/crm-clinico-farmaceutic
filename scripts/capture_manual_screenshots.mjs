// scripts/capture_manual_screenshots.mjs
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:5175';
const OUTPUT_DIR = path.resolve('docs/manual_images');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureAllScreenshots() {
  console.log('🚀 Iniciando captura automatizada de screenshots do CRM Clínico Farmacêutico...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1600, height: 960, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Abrir a página e verificar se precisa logar
  await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  const isAuthForm = await page.$('#auth-username');
  if (isAuthForm) {
    console.log('🔑 Realizando login como Master (mazzarowysk)...');
    await page.type('#auth-username', 'mazzarowysk');
    await page.type('#auth-password', 'T@zm4n1c0054180');
    await page.click('#auth-submit-btn');
    await page.waitForSelector('#app', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('📦 Injetando massa demonstrativa rica e realista para os manuais...');
  await page.evaluate(() => {
    const demoPatient = {
      id: 'PHARM-PAT-001',
      name: 'Dona Maria de Lourdes Santos',
      fullName: 'Dona Maria de Lourdes Santos',
      cpf: '234.567.890-12',
      birthDate: '1958-04-12',
      age: 68,
      sex: 'Feminino',
      gender: 'Feminino',
      isPregnantOrLactating: false,
      allergies: 'Dipirona (Edema de Glote e Urticária Severa)',
      chronicConditions: 'Hipertensão Arterial Sistêmica, Diabetes Tipo 2',
      chronicDiseases: 'Hipertensão Arterial Sistêmica, Diabetes Tipo 2',
      phone: '(11) 98765-4321',
      address: 'Rua das Flores, 142 - Bela Vista, São Paulo/SP',
      prescribers: 'Dr. Roberto Fernandes (Cardiologista)',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    };

    const demoPatient2 = {
      id: 'PHARM-PAT-002',
      name: 'Sr. Antônio Carlos Moreira',
      fullName: 'Sr. Antônio Carlos Moreira',
      cpf: '345.678.901-23',
      birthDate: '1962-09-25',
      age: 64,
      sex: 'Masculino',
      gender: 'Masculino',
      isPregnantOrLactating: false,
      allergies: 'Penicilinas e Amoxicilina',
      chronicConditions: 'Fibrilação Atrial Crônica, Hipertensão',
      chronicDiseases: 'Fibrilação Atrial Crônica, Hipertensão',
      phone: '(11) 97654-3210',
      address: 'Av. Paulista, 1500 - São Paulo/SP',
      prescribers: 'Dra. Mariana Lima (Neurologista)',
      created_at: new Date(Date.now() - 45 * 86400000).toISOString()
    };

    const demoAttendances = [
      {
        id: 'PHARM-ATT-001',
        patient_id: 'PHARM-PAT-001',
        patientId: 'PHARM-PAT-001',
        patient_name: 'Dona Maria de Lourdes Santos',
        patientName: 'Dona Maria de Lourdes Santos',
        pharmacist_name: 'Marcelo Mazaro (CRF/SP 54180)',
        data_hora: new Date(Date.now() - 2 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        date: new Date(Date.now() - 2 * 86400000).toISOString(),
        tipo_visita: 'Acompanhamento Farmacoterapêutico',
        queixa_triagem: 'Cefaleia e queimação estomacal; pressão oscilando.',
        complaint: 'Cefaleia e controle pressórico',
        red_flags: [],
        prescricao_mips: 'Paracetamol 750mg de 8/8h se dor; Soro Fisiológico 0.9%',
        prescribedMIPs: [{ name: 'Paracetamol 750mg' }],
        interacoes_detectadas: ['Alergia cruzada checada e bloqueada (Dipirona)'],
        conduta_final: 'Dispensação com Orientação Farmacêutica e Encaminhamento Cardiológico',
        pressao_arterial: '135/85',
        glicemia_capilar: '128',
        isSimulation: true
      },
      {
        id: 'PHARM-ATT-002',
        patient_id: 'PHARM-PAT-001',
        patientId: 'PHARM-PAT-001',
        patient_name: 'Dona Maria de Lourdes Santos',
        patientName: 'Dona Maria de Lourdes Santos',
        pharmacist_name: 'Marcelo Mazaro (CRF/SP 54180)',
        data_hora: new Date(Date.now() - 15 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
        date: new Date(Date.now() - 15 * 86400000).toISOString(),
        tipo_visita: 'Acompanhamento Farmacoterapêutico',
        queixa_triagem: 'Retorno para aferição de pressão e glicemia de jejum.',
        complaint: 'Aferição de PA e Glicemia',
        red_flags: [],
        prescricao_mips: 'Manutenção de Losartana e Metformina',
        prescribedMIPs: [{ name: 'Losartana Potássica 50mg' }],
        interacoes_detectadas: [],
        conduta_final: 'Adesão terapêutica confirmada',
        pressao_arterial: '142/90',
        glicemia_capilar: '145',
        isSimulation: true
      },
      {
        id: 'PHARM-ATT-003',
        patient_id: 'PHARM-PAT-001',
        patientId: 'PHARM-PAT-001',
        patient_name: 'Dona Maria de Lourdes Santos',
        patientName: 'Dona Maria de Lourdes Santos',
        pharmacist_name: 'Marcelo Mazaro (CRF/SP 54180)',
        data_hora: new Date(Date.now() - 30 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        date: new Date(Date.now() - 30 * 86400000).toISOString(),
        tipo_visita: 'Primeira Consulta Clínica',
        queixa_triagem: 'Início de acompanhamento clínico para hipertensão e diabetes.',
        complaint: 'Acompanhamento Farmacêutico Inicial',
        red_flags: [],
        prescricao_mips: 'Orientação de estilo de vida e automonitoramento',
        interacoes_detectadas: [],
        conduta_final: 'Plano de Cuidado Farmacêutico Estabelecido',
        pressao_arterial: '150/95',
        glicemia_capilar: '162',
        isSimulation: true
      }
    ];

    const demoProducts = [
      {
        id: 'PROD-001',
        name: 'Dipirona Monoidratada 500mg/ml Gotas 20ml',
        product_name: 'Dipirona Monoidratada 500mg/ml Gotas 20ml',
        dci: 'Dipirona Sódica',
        category: 'MIP / Analgésico',
        stock: 45,
        min_stock: 15,
        cost_price: 3.50,
        sale_price: 8.90,
        batch: 'L-24089',
        expiry_date: '2027-08-29',
        supplier: 'EMS Pharma',
        status: 'Ativo'
      },
      {
        id: 'PROD-002',
        name: 'Paracetamol 750mg c/ 20 comprimidos',
        product_name: 'Paracetamol 750mg c/ 20 comprimidos',
        dci: 'Paracetamol',
        category: 'MIP / Antitérmico',
        stock: 32,
        min_stock: 10,
        cost_price: 4.80,
        sale_price: 12.50,
        batch: 'L-98412',
        expiry_date: '2027-11-14',
        supplier: 'Medley',
        status: 'Ativo'
      },
      {
        id: 'PROD-003',
        name: 'Losartana Potássica 50mg c/ 30 comprimidos',
        product_name: 'Losartana Potássica 50mg c/ 30 comprimidos',
        dci: 'Losartana Potássica',
        category: 'Uso Contínuo / Anti-hipertensivo',
        stock: 60,
        min_stock: 20,
        cost_price: 5.80,
        sale_price: 14.90,
        batch: 'L-77621',
        expiry_date: '2028-03-20',
        supplier: 'Neo Química',
        status: 'Ativo'
      },
      {
        id: 'PROD-004',
        name: 'Tiras Reagentes de Glicemia c/ 50 unidades',
        product_name: 'Tiras Reagentes de Glicemia c/ 50 unidades',
        dci: 'Glicose Desidrogenase',
        category: 'Insumo / TLR',
        stock: 8,
        min_stock: 15,
        cost_price: 65.00,
        sale_price: 119.90,
        batch: 'L-GUIDE-99',
        expiry_date: '2026-12-31',
        supplier: 'Roche Diabetes Care',
        status: 'Estoque Baixo'
      }
    ];

    const demoPurchases = [
      {
        id: 'PURCH-001',
        patient_id: 'PHARM-PAT-001',
        patientId: 'PHARM-PAT-001',
        patient_name: 'Dona Maria de Lourdes Santos',
        product_id: 'PROD-003',
        product_name: 'Losartana Potássica 50mg c/ 30 comprimidos',
        medication_name: 'Losartana Potássica 50mg',
        quantity: 1,
        unit_price: 14.90,
        total_price: 14.90,
        is_continuous: true,
        days_supply: 30,
        refill_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        next_refill_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        batch: 'L-77621',
        pharmacist_name: 'Marcelo Mazaro',
        created_at: new Date(Date.now() - 27 * 86400000).toISOString()
      }
    ];

    const nowIso = new Date().toISOString();
    const demoFinancial = [
      {
        id: 'FIN-001',
        patientId: 'PHARM-PAT-001',
        patientName: 'Dona Maria de Lourdes Santos',
        type: 'receita',
        category: 'Consultas & Serviços Farmacêuticos',
        description: 'Consulta Farmacêutica Clínica + Teste Rápido TLR',
        amount: 80.00,
        status: 'pago',
        paymentMethod: 'PIX',
        date: nowIso,
        created_at: nowIso
      },
      {
        id: 'FIN-002',
        patientId: 'PHARM-PAT-001',
        patientName: 'Dona Maria de Lourdes Santos',
        type: 'receita',
        category: 'Vendas de Balcão & MIPs',
        description: 'Dispensação MIPs Orientados (Paracetamol & Soro)',
        amount: 45.90,
        status: 'pago',
        paymentMethod: 'Cartão de Débito',
        date: nowIso,
        created_at: nowIso
      },
      {
        id: 'FIN-003',
        type: 'despesa',
        category: 'Insumos & Tiras Reagentes',
        description: 'Aquisição de Tiras e Lancetas Roche Diabetes',
        amount: 250.00,
        status: 'pago',
        paymentMethod: 'Boleto Bancário',
        date: nowIso,
        created_at: nowIso
      }
    ];

    const currentDB = JSON.parse(localStorage.getItem('crmFarmaceuticoDados') || '{}');
    currentDB.__initialized = true;
    currentDB.patients = [demoPatient, demoPatient2];
    currentDB.pharmacy_patients = [demoPatient, demoPatient2];
    currentDB.pharmacy_attendances = demoAttendances;
    currentDB.products = demoProducts;
    currentDB.patient_purchases = demoPurchases;
    currentDB.financial_transactions = demoFinancial;
    currentDB.financial_installments = demoFinancial;

    localStorage.setItem('crmFarmaceuticoDados', JSON.stringify(currentDB));
    localStorage.setItem('crmFarmaceuticoUpdatedAt', Date.now().toString());

    // Assegurar sessão ativa no sessionStorage
    const masterUser = (currentDB.users || []).find(u => u.username === 'mazzarowysk') || {
      id: 'USR-MAZZAROWYSK',
      name: 'Marcelo Mazaro',
      username: 'mazzarowysk',
      role: 'Master',
      crf: 'CRF-SP 54180'
    };
    sessionStorage.setItem('hn_user', JSON.stringify(masterUser));
    sessionStorage.setItem('hn_token', 'token-offline-master-54180');
  });

  // Recarregar a página para aplicar o banco com os dados visuais
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Desativar popups de sincronização e ocultar assistente flutuante durante os screenshots
  await page.evaluate(() => {
    window.showSyncPromptModal = () => Promise.resolve(false);
    window.showSyncComparisonModal = () => Promise.resolve(false);
    document.querySelectorAll('#sync-prompt-modal, #sync-comparison-modal').forEach(e => e.remove());
    const guide = document.getElementById('smart-flow-guide');
    if (guide) guide.style.display = 'none';
  });

  // 📸 SCREENSHOT 1: DASHBOARD / MÉTRICAS DO CONSULTÓRIO
  console.log('📸 Capturando 01-dashboard-metricas.png...');
  await page.evaluate(() => document.querySelectorAll('#sync-prompt-modal, #sync-comparison-modal').forEach(e => e.remove()));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01-dashboard-metricas.png'), fullPage: false });

  // 📸 SCREENSHOT 2: BALCÃO CLÍNICO & CDSS 4D
  console.log('📸 Navegando e capturando 02-crm-balcao-cdss.png...');
  await page.evaluate(() => window.switchTab('farmacia'));
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02-crm-balcao-cdss.png'), fullPage: false });

  // 📸 SCREENSHOT 3: MODAL DO PRONTUÁRIO & TELEMETRIA GRÁFICA
  console.log('📸 Abrindo e capturando 03-prontuario-telemetria.png...');
  await page.evaluate(() => {
    if (typeof window.openPatientHistoryModal === 'function') {
      window.openPatientHistoryModal('PHARM-PAT-001', 'Dona Maria de Lourdes Santos');
    }
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03-prontuario-telemetria.png'), fullPage: false });
  // Fechar modal de prontuário
  await page.evaluate(() => {
    const m = document.getElementById('patient-history-modal');
    if (m) m.remove();
  });
  await new Promise(r => setTimeout(r, 600));

  // 📸 SCREENSHOT 4: MODAL DE TESTES TLR (RDC 786/2023)
  console.log('📸 Abrindo e capturando 04-tlr-exames-laudo.png...');
  await page.evaluate(() => {
    if (typeof window.openTlrModal === 'function') {
      window.openTlrModal('PHARM-PAT-001', 'Dona Maria de Lourdes Santos');
    }
  });
  await new Promise(r => setTimeout(r, 1800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04-tlr-exames-laudo.png'), fullPage: false });
  // Fechar modal TLR
  await page.evaluate(() => {
    const m = document.getElementById('tlr-exam-modal');
    if (m) m.remove();
  });
  await new Promise(r => setTimeout(r, 600));

  // 📸 SCREENSHOT 5: MODAL DE AUTOMAÇÃO PÓS-ATENDIMENTO
  console.log('📸 Abrindo e capturando 05-pos-atendimento-adesao.png...');
  await page.evaluate(() => {
    if (typeof window.openPostCareModal === 'function') {
      window.openPostCareModal();
    }
  });
  await new Promise(r => setTimeout(r, 1800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05-pos-atendimento-adesao.png'), fullPage: false });
  // Fechar modal pós-atendimento
  await page.evaluate(() => {
    const m = document.getElementById('post-care-modal');
    if (m) m.remove();
  });
  await new Promise(r => setTimeout(r, 600));

  // 📸 SCREENSHOT 6: PRÉVIA DA DSF COM CHANCELA ICP-BRASIL & CUPOM TÉRMICO
  console.log('📸 Abrindo e capturando 06-dsf-chancela-termica.png...');
  await page.evaluate(() => {
    if (typeof window.openDsfPreviewModal === 'function') {
      window.openDsfPreviewModal('PHARM-ATT-001', 'PHARM-PAT-001');
    }
  });
  await new Promise(r => setTimeout(r, 1800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06-dsf-chancela-termica.png'), fullPage: false });
  // Fechar modal DSF
  await page.evaluate(() => {
    const m = document.getElementById('dsf-preview-modal');
    if (m) m.remove();
  });
  await new Promise(r => setTimeout(r, 600));

  // 📸 SCREENSHOT 7: CLIENTES CADASTRADOS & GESTÃO
  console.log('📸 Navegando e capturando 07-clientes-prontuario.png...');
  await page.evaluate(() => window.switchTab('pacientes'));
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07-clientes-prontuario.png'), fullPage: false });

  // 📸 SCREENSHOT 8: ESTOQUE & SUPRIMENTOS
  console.log('📸 Navegando e capturando 08-estoque-suprimentos.png...');
  await page.evaluate(() => window.switchTab('estoque'));
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08-estoque-suprimentos.png'), fullPage: false });

  // 📸 SCREENSHOT 9: CONTROLE FINANCEIRO
  console.log('📸 Navegando e capturando 09-controle-financeiro.png...');
  await page.evaluate(() => window.switchTab('financeiro'));
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09-controle-financeiro.png'), fullPage: false });

  // 📸 SCREENSHOT 10: CONFIGURAÇÕES & SANDBOX SEGURO
  console.log('📸 Navegando e capturando 10-configuracoes-sandbox.png...');
  await page.evaluate(() => {
    window.switchTab('configuracoes');
    const guide = document.getElementById('smart-flow-guide');
    if (guide) guide.style.display = 'none';
  });
  await new Promise(r => setTimeout(r, 1500));
  // Scroll para o agrupamento de Sandbox / Hard Reset
  await page.evaluate(() => {
    const guide = document.getElementById('smart-flow-guide');
    if (guide) guide.style.display = 'none';
    const el = document.getElementById('btn-hard-reset-factory') || document.getElementById('body-simulation');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10-configuracoes-sandbox.png'), fullPage: false });

  console.log('✅ Todas as 10 capturas de tela foram salvas com sucesso em docs/manual_images/!');
  await browser.close();
}

captureAllScreenshots().catch(err => {
  console.error('❌ Erro na captura de screenshots:', err);
  process.exit(1);
});
