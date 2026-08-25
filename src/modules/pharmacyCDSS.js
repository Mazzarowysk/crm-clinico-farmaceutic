// ==========================================================================
// 🌿 HEALTH NEXUS — PHARMACEUTICAL CLINICAL DECISION SUPPORT SYSTEM (CDSS)
// Módulo de Assistência Farmacêutica Avançada, Triagem Clínica, Red Flags,
// Prescrição de MIPs, Cruzamento em Tempo Real & Documentos Farmacêuticos
// Em total conformidade com LGPD, CFF (Res. 585/586) e ANVISA (RDC 20/2011)
// ==========================================================================

import { PHARMACOLOGICAL_TAXONOMY, DRUG_INTERACTIONS_DB, detectPharmacologicalClasses } from './clinicalAI.js';

// --- 1. PROTOCOLOS E ÁRVORES DE DECISÃO DE TRIAGEM FARMACÊUTICA ---
export const PHARMACY_TRIAGE_PROTOCOLS = {
  gripe_resfriado: {
    id: 'gripe_resfriado',
    title: 'Sintomas Gripais & Resfriado',
    icon: 'fa-head-side-cough',
    description: 'Avaliação de congestão nasal, coriza, dor de garganta, febre baixa e mialgia.',
    redFlags: [
      { id: 'rf_dispneia', label: 'Falta de ar ou dor torácica ao respirar' },
      { id: 'rf_febre_alta', label: 'Febre > 39°C persistente há mais de 3 dias' },
      { id: 'rf_estridor', label: 'Estridor laríngeo, tiragem intercostal ou cianose labial' },
      { id: 'rf_comorbidade_descompensada', label: 'Paciente asmático/DPOC em crise aguda' }
    ],
    nonPharmaActions: [
      'Hidratação oral intensiva (2 a 3 litros de água/líquidos ao dia)',
      'Lavagem nasal abundante com Soro Fisiológico 0.9% 3 a 5 vezes ao dia',
      'Repouso e alimentação leve rica em vitamina C e zinco',
      'Umidificação do ambiente e evitar exposição ao frio/ar condicionado'
    ],
    recommendedMIPs: [
      {
        name: 'Paracetamol 500mg - 750mg',
        indication: 'Antitérmico e analgésico de 1ª linha',
        posology: '1 comprimido de 6/6h ou 8/8h se dor ou febre (máx 3g/dia)',
        contraindications: ['Hepatopatia grave', 'Uso concomitante com álcool']
      },
      {
        name: 'Dipirona Monoidratada 500mg',
        indication: 'Controle de febre e mialgia moderada',
        posology: '1 comprimido de 6/6h (máx 4g/dia)',
        contraindications: ['Alergia a pirazolonas', 'Discrasias sanguíneas']
      },
      {
        name: 'Maleato de Clorfeniramina + Paracetamol',
        indication: 'Alívio de coriza, espirros e congestão associada',
        posology: '1 comprimido a cada 8 horas por até 3 a 5 dias',
        contraindications: ['Glaucoma de ângulo fechado', 'Hiperplasia prostática benigna']
      }
    ]
  },
  cefaleia: {
    id: 'cefaleia',
    title: 'Cefaleia Tensional / Dor de Cabeça',
    icon: 'fa-brain',
    description: 'Avaliação de dor em aperto ou pulsátil de intensidade leve a moderada.',
    redFlags: [
      { id: 'rf_cefaleia_subita', label: 'Início súbito explosivo ("a pior dor de cabeça da vida")' },
      { id: 'rf_rigidez_nuca', label: 'Rigidez de nuca com febre (Sinais meníngeos)' },
      { id: 'rf_deficit_neuro', label: 'Perda de força motora, desvio de rima labial ou fala arrastada' },
      { id: 'rf_trauma_craniano', label: 'Histórico de traumatismo craniano recente' }
    ],
    nonPharmaActions: [
      'Repouso em ambiente escuro, silencioso e bem ventilado',
      'Aplicação de compressa fria na fronte ou morna na musculatura cervical',
      'Correção postural e técnicas de relaxamento muscular',
      'Evitar períodos prolongados de jejum e privação de sono'
    ],
    recommendedMIPs: [
      {
        name: 'Dipirona 1g',
        indication: 'Analgesia rápida de intensidade moderada',
        posology: '1 comprimido a cada 6 horas se dor',
        contraindications: ['Hipersensibilidade a pirazolonas', 'Porfiria hepática']
      },
      {
        name: 'Paracetamol 750mg + Cafeína 65mg',
        indication: 'Cefaleia tensional e enxaqueca leve a moderada',
        posology: '1 comprimido a cada 6 ou 8 horas (máximo 4 comprimidos/dia)',
        contraindications: ['Hipertensão não controlada', 'Insônia grave', 'Úlcera ativa']
      }
    ]
  },
  dispepsia_azia: {
    id: 'dispepsia_azia',
    title: 'Dispepsia, Azia & Pirose',
    icon: 'fa-shield-halved',
    description: 'Avaliação de queimação retroesternal, empachamento pós-prandial e desconforto epigástrico.',
    redFlags: [
      { id: 'rf_hemorragia_digestiva', label: 'Vômito com sangue (hematêmese) ou fezes escuras tipo borra de café (melena)' },
      { id: 'rf_disfagia', label: 'Dificuldade ou dor progressiva ao engolir alimentos (Disfagia/Odinofagia)' },
      { id: 'rf_perda_peso', label: 'Perda de peso involuntária significativa associada a anemia' },
      { id: 'rf_dor_irradiada', label: 'Dor epigástrica que irradia para mandíbula, dorso ou braço esquerdo' }
    ],
    nonPharmaActions: [
      'Fracionar as refeições em pequenas porções e mastigar devagar',
      'Evitar deitar-se antes de 2 a 3 horas após as refeições',
      'Elevar a cabeceira da cama em 15 cm em caso de refluxo noturno',
      'Reduzir consumo de alimentos gordurosos, café, cítricos, chocolate, pimenta e bebidas alcoólicas'
    ],
    recommendedMIPs: [
      {
        name: 'Hidróxido de Alumínio + Magnésio + Simeticona',
        indication: 'Antiácido de ação imediata com antiflatulento',
        posology: '10ml a 20ml (ou 1-2 comprimidos mastigáveis) 1h após as refeições e ao deitar',
        contraindications: ['Insuficiência renal grave', 'Hipermagnesemia']
      },
      {
        name: 'Famotidina 20mg / 40mg',
        indication: 'Antagonista H2 para alívio de queimação gástrica',
        posology: '1 comprimido 1 vez ao dia antes de dormir por até 14 dias',
        contraindications: ['Hipersensibilidade a bloqueadores H2']
      }
    ]
  },
  dor_muscular_lombalgia: {
    id: 'dor_muscular_lombalgia',
    title: 'Dor Muscular & Lombalgia Aguda',
    icon: 'fa-person-walking-with-cane',
    description: 'Avaliação de contratura muscular, torcicolo e dor nas costas sem irradiação.',
    redFlags: [
      { id: 'rf_perda_esfincter', label: 'Incontinência ou retenção urinária/fecal súbita (Síndrome da Cauda Equina)' },
      { id: 'rf_perda_forca_pernas', label: 'Fraqueza progressiva ou perda de sensibilidade em membros inferiores' },
      { id: 'rf_febre_lombar', label: 'Dor lombar acompanhada de febre alta e calafrios' },
      { id: 'rf_dor_oncologica', label: 'Histórico de neoplasia com dor óssea noturna contínua' }
    ],
    nonPharmaActions: [
      'Manter movimentação leve tolerada; evitar repouso absoluto prolongado no leito',
      'Aplicação de calor local (compressas mornas por 20 minutos 3x ao dia)',
      'Alongamento suave da musculatura posterior e correção ergonômica no trabalho',
      'Evitar erguer peso dobrando a coluna'
    ],
    recommendedMIPs: [
      {
        name: 'Ibuprofeno 400mg',
        indication: 'Anti-inflamatório e analgésico para dor osteomuscular',
        posology: '1 comprimido de 8/8h após as refeições por no máximo 5 dias',
        contraindications: ['Úlcera péptica ativa', 'Insuficiência renal', 'Uso de Varfarina/Anticoagulantes', 'Hipertensão descompensada']
      },
      {
        name: 'Dipirona + Citrato de Orfenadrina + Cafeína (Dorflex)',
        indication: 'Analgésico e relaxante muscular de ação central',
        posology: '1 a 2 comprimidos de 8/8h ou 6/6h se dor muscular intensa',
        contraindications: ['Glaucoma', 'Miastenia gravis', 'Obstrução pilórica']
      }
    ]
  },
  diarreia_aguda: {
    id: 'diarreia_aguda',
    title: 'Diarreia Aguda & Gastroenterite Leve',
    icon: 'fa-virus',
    description: 'Evacuações líquidas agudas sem sinais de gravidade sistêmica.',
    redFlags: [
      { id: 'rf_sangue_fezes', label: 'Presença visível de sangue vivo ou pus nas fezes (Disenteria)' },
      { id: 'rf_desidratacao_grave', label: 'Sinais de desidratação grave (olhos encovados, letargia, anúria > 8h)' },
      { id: 'rf_febre_alta_diarreia', label: 'Febre alta (> 38.5°C) com vômitos incoercíveis' },
      { id: 'rf_duracao_diarreia', label: 'Duração dos sintomas superior a 14 dias (Diarreia crônica)' }
    ],
    nonPharmaActions: [
      'Terapia de Reidratação Oral (Sais de Reidratação da OMS) após cada evacuação líquida',
      'Dieta obstipante: arroz branco, maçã sem casca, banana-prata, torradas e batata cozida',
      'Evitar leites e derivados, gorduras, frituras, refrigerantes e doces concentrados',
      'Higiene rigorosa das mãos com água e sabão antes das refeições'
    ],
    recommendedMIPs: [
      {
        name: 'Sais para Reidratação Oral (Envelope)',
        indication: 'Prevenção e tratamento de desidratação (Padrão Ouro OMS)',
        posology: 'Dissolver 1 sachê em 1 litro de água tratada/filtrada; beber aos poucos',
        contraindications: ['Vômitos incoercíveis', 'Íleo paralítico']
      },
      {
        name: 'Saccharomyces boulardii 100mg - 200mg (Probiótico)',
        indication: 'Restauração da microbiota intestinal e redução do tempo de diarreia',
        posology: '1 a 2 cápsulas ao dia por 5 a 7 dias',
        contraindications: ['Pacientes portadores de cateter venoso central', 'Imunossuprimidos graves']
      }
    ]
  }
};

// --- 2. BASE EXPANDIDA DE INTERAÇÕES MEDICAMENTOSAS EM TEMPO REAL ---
export const EXTENDED_DRUG_FOOD_CONDITIONS_DB = [
  // Interações Fármaco x Comorbidade
  {
    type: 'DISEASE',
    substanceClass: 'ATC_M01A', // AINEs
    conditionKeywords: ['hipertensao', 'pressao alta', 'insuficiencia cardiaca', 'icc'],
    severity: 'Grave',
    color: '#ef4444',
    title: 'Descompensação Hipertensiva & Retenção Hidrossalina (AINEs)',
    desc: 'Anti-inflamatórios inibem prostaglandinas renais vasodilatadoras, promovendo retenção de sódio e água e atenuando o efeito de anti-hipertensivos.',
    action: 'Evitar AINEs em hipertensos e cardiopatas. Preferir Dipirona ou Paracetamol.'
  },
  {
    type: 'DISEASE',
    substanceClass: 'ATC_M01A', // AINEs
    conditionKeywords: ['insuficiencia renal', 'drc', 'creatinina alta', 'doenca renal'],
    severity: 'Critica',
    color: '#ef4444',
    title: 'Lesão Renal Aguda & Queda da Filtração Glomerular (AINEs)',
    desc: 'A inibição de prostaglandinas na arteríola aferente renal pode precipitar insuficiência renal aguda oligúrica em pacientes com DRC.',
    action: 'CONTRAINDICAÇÃO ABSOLUTA. Não dispensar AINEs para pacientes com disfunção renal prévia.'
  },
  {
    type: 'DISEASE',
    substanceClass: 'ATC_M01A', // AINEs
    conditionKeywords: ['ulcera', 'gastrite', 'hemorragia digestiva', 'sangramento'],
    severity: 'Grave',
    color: '#ef4444',
    title: 'Risco Elevado de Reativação de Úlcera Péptica e Perfuração',
    desc: 'AINEs inibem a barreira protetora de muco e bicarbonato gástrico, precipitando hemorragias digestivas graves.',
    action: 'Substituir por analgésico sem ação anti-inflamatória gástrica ou associar IBP sob prescrição médica.'
  },
  {
    type: 'FOOD_HABIT',
    substanceClass: 'ATC_B01AA', // Varfarina
    habitKeywords: ['vitamina k', 'couve', 'espinafre', 'brocolis', 'folhas verdes'],
    severity: 'Moderada',
    color: '#f59e0b',
    title: 'Interação Fármaco-Alimento: Varfarina e Vegetais Ricos em Vitamina K',
    desc: 'A ingestão abundante e oscilante de folhas verdes escuras ricas em vitamina K antagoniza a eficácia anticoagulante da Varfarina, reduzindo o INR.',
    action: 'Orientar o paciente a manter consumo estável e constante de vegetais, sem grandes variações diárias, e checar INR.'
  },
  {
    type: 'FOOD_HABIT',
    substanceClass: 'ATC_N05BA', // Benzodiazepínicos
    habitKeywords: ['alcool', 'bebida alcoolica', 'cerveja', 'vinho', 'destilado'],
    severity: 'Critica',
    color: '#ef4444',
    title: 'Potencialização Depressora Fatal do SNC (Sedativos + Álcool)',
    desc: 'Álcool potencializa de forma sinérgica a ação gabaérgica dos benzodiazepínicos e opioides, com risco iminente de parada cardiorrespiratória e coma.',
    action: 'ABSTENÇÃO TOTAL DE ÁLCOOL durante todo o tratamento medicamentoso com fármacos depressores do SNC.'
  }
];

// --- 3. MOTOR DE CRUZAMENTO MULTIDIMENSIONAL EM TEMPO REAL (CDSS) ---
export const runRealtimeClinicalCrosscheck = ({
  proposedMedications = [],
  activeMedications = [],
  allergies = '',
  chronicConditions = '',
  isPregnantOrLactating = false,
  patientAge = 35
}) => {
  const alerts = [];
  const allProposedText = Array.isArray(proposedMedications)
    ? proposedMedications.map(m => typeof m === 'string' ? m : (m.name || m.medication || '')).join(' ')
    : String(proposedMedications);

  const allActiveText = Array.isArray(activeMedications)
    ? activeMedications.map(m => typeof m === 'string' ? m : (m.name || m.medication || '')).join(' ')
    : String(activeMedications);

  const normProposed = (allProposedText || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normActive = (allActiveText || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normAllergies = (allergies || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normConditions = (chronicConditions || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (!normProposed) return [];

  const proposedClasses = detectPharmacologicalClasses(normProposed);
  const activeClasses = detectPharmacologicalClasses(normActive);

  // 1. Fármaco x Fármaco (DDI)
  DRUG_INTERACTIONS_DB.forEach(rule => {
    const propHasA = proposedClasses.some(c => c.classCode === rule.classA);
    const propHasB = proposedClasses.some(c => c.classCode === rule.classB);

    const actHasA = activeClasses.some(c => c.classCode === rule.classA);
    const actHasB = activeClasses.some(c => c.classCode === rule.classB);

    const matchCase1 = propHasA && (propHasB || actHasB);
    const matchCase2 = propHasB && (propHasA || actHasA);

    if (matchCase1 || matchCase2) {
      const isCrossWithActive = (propHasA && !propHasB && actHasB) || (propHasB && !propHasA && actHasA);
      alerts.push({
        dimension: 'DDI',
        severity: rule.severity,
        color: rule.color,
        title: isCrossWithActive ? `[Cruzamento c/ Medicamento Ativo] ${rule.title}` : rule.title,
        desc: isCrossWithActive ? `O paciente faz uso contínuo registrado no prontuário. ${rule.desc}` : rule.desc,
        action: rule.action,
        isBlocker: rule.severity === 'Critica' || Boolean(rule.isBlocker)
      });
    }
  });

  // 2. Fármaco x Alergias
  const ALLERGY_MAP = [
    { key: 'dipirona', matchClass: null, terms: ['dipirona', 'metamizol', 'novalgina', 'lisador', 'anador'], label: 'Dipirona / Pirazolonas' },
    { key: 'penicilina', matchClass: 'ATC_J01CA', terms: ['penicilina', 'amoxicilina', 'ampicilina', 'cefalosporina'], label: 'Penicilinas & Beta-lactâmicos' },
    { key: 'aine', matchClass: 'ATC_M01A', terms: ['anti-inflamatorio', 'aine', 'ibuprofeno', 'diclofenaco', 'cetoprofeno', 'nimesulida', 'naproxeno'], label: 'Anti-inflamatórios Não Esteroidais (AINEs)' },
    { key: 'aas', matchClass: 'ATC_B01AC', terms: ['aas', 'aspirina', 'acido acetilsalicilico'], label: 'Aspirina / Salicilatos' },
    { key: 'sulfa', matchClass: null, terms: ['sulfa', 'sulfametoxazol', 'bactrim'], label: 'Sulfonamidas / Sulfas' }
  ];

  ALLERGY_MAP.forEach(item => {
    const hasAllergyDeclared = item.terms.some(t => normAllergies.includes(t));
    if (hasAllergyDeclared) {
      const hasPropMatch = item.terms.some(t => normProposed.includes(t)) || (item.matchClass && proposedClasses.some(c => c.classCode === item.matchClass));
      if (hasPropMatch) {
        alerts.push({
          dimension: 'ALLERGY',
          severity: 'Critica',
          color: '#ef4444',
          title: `ALERTA DE ALERGIA GRAVE: Hipersensibilidade a ${item.label}`,
          desc: `O paciente possui histórico cadastrado de reação adversa / anafilaxia a ${item.label}. O medicamento proposto pertence ou possui reatividade cruzada com este grupo.`,
          action: 'BLOQUEIO DE DISPENSAÇÃO. Substituir imediatamente por princípio ativo seguro de classe não alergênica.',
          isBlocker: true
        });
      }
    }
  });

  // 3. Fármaco x Condições Crônicas
  EXTENDED_DRUG_FOOD_CONDITIONS_DB.filter(r => r.type === 'DISEASE').forEach(rule => {
    const hasCondition = rule.conditionKeywords.some(kw => normConditions.includes(kw));
    const hasClass = proposedClasses.some(c => c.classCode === rule.substanceClass);
    if (hasCondition && hasClass) {
      alerts.push({
        dimension: 'DISEASE',
        severity: rule.severity,
        color: rule.color,
        title: `[Fármaco x Comorbidade] ${rule.title}`,
        desc: rule.desc,
        action: rule.action,
        isBlocker: rule.severity === 'Critica'
      });
    }
  });

  // 4. Fármaco x Gravidez / Lactação
  if (isPregnantOrLactating) {
    const unsafeInPregnancy = proposedClasses.some(c => ['ATC_M01A', 'ATC_C09A', 'ATC_B01AA', 'ATC_C10AA', 'ATC_J01MA'].includes(c.classCode));
    if (unsafeInPregnancy) {
      alerts.push({
        dimension: 'PREGNANCY',
        severity: 'Critica',
        color: '#ef4444',
        title: 'CONTRAINDICAÇÃO EM GESTANTES / LACTANTES (Risco Teratogênico/Fetal)',
        desc: 'Fármacos pertencentes a esta classe possuem risco fetal comprovado (Categoria D/X ou risco no 3º trimestre como fechamento precoce do ducto arterioso).',
        action: 'CONTRAINDICADO. Utilizar analgésicos de segurança comprovada na gestação (ex.: Paracetamol) sob indicação e acompanhamento obstétrico.',
        isBlocker: true
      });
    }
  }

  return alerts;
};

// --- 4. EMISSÃO DE DOCUMENTOS FARMACÊUTICOS (CFF RES. 585/586) ---
export const generatePharmacistDeclarationHTML = ({
  patient,
  pharmacist = { name: 'Farmacêutico Responsável', crf: 'CRF/SP 123456' },
  triageComplaint,
  redFlags = [],
  recommendedMedications = [],
  nonPharmaInstructions = [],
  observations = '',
  date = new Date()
}) => {
  const dateFormatted = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(date);
  
  return `
    <div class="pharmacy-declaration-print" style="font-family: 'Inter', sans-serif; color: #1e293b; background: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #cbd5e1; max-width: 800px; margin: 0 auto;">
      <!-- Cabeçalho Oficial -->
      <div style="border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 style="margin: 0; color: #0f766e; font-size: 1.4rem; font-family: 'Outfit', sans-serif;">
            DECLARAÇÃO DE SERVIÇO FARMACÊUTICO
          </h2>
          <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b;">
            Assistência Farmacêutica Avançada &amp; Cuidados em Saúde — Resoluções CFF nº 585/2013 e 586/2013
          </p>
        </div>
        <div style="text-align: right; font-size: 0.8rem; color: #475569;">
          <strong>Data/Hora:</strong> ${dateFormatted}
        </div>
      </div>

      <!-- Dados do Paciente -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 0.9rem;">
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px;">
          <div><strong>Paciente:</strong> ${patient.name || 'Não Informado'}</div>
          <div><strong>CPF:</strong> ${patient.cpf || 'Não Informado'}</div>
          <div><strong>Idade/Sexo:</strong> ${patient.age || '--'} anos / ${patient.gender || '--'}</div>
        </div>
        ${patient.allergies ? `<div style="margin-top: 6px; color: #be123c;"><strong>⚠️ Alergias Informadas:</strong> ${patient.allergies}</div>` : ''}
        ${patient.chronicConditions ? `<div style="margin-top: 4px; color: #475569;"><strong>Comorbidades Crônicas:</strong> ${patient.chronicConditions}</div>` : ''}
      </div>

      <!-- Queixa Principal e Triagem -->
      <div style="margin-bottom: 20px;">
        <h4 style="margin: 0 0 8px 0; color: #0f766e; font-size: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
          1. AVALIAÇÃO E QUEIXA CLÍNICA
        </h4>
        <p style="margin: 0; font-size: 0.92rem; color: #334155;">
          <strong>Motivo da Consulta / Sintoma:</strong> ${triageComplaint || 'Atendimento de rotina e orientação farmacoterapêutica.'}
        </p>
        ${redFlags.length > 0 ? `
          <div style="margin-top: 10px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; padding: 10px; color: #9f1239; font-size: 0.88rem;">
            <strong>🚨 SINAIS DE ALERTA DETECTADOS (ENCAMINHAMENTO MÉDICO RECOMENDADO):</strong>
            <ul style="margin: 6px 0 0 18px; padding: 0;">
              ${redFlags.map(rf => `<li>${rf}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>

      <!-- Prescrição / Recomendação Farmacêutica -->
      ${recommendedMedications.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; color: #0f766e; font-size: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            2. PRESCRIÇÃO FARMACÊUTICA / ORIENTAÇÃO FARMACOTERAPÊUTICA (MIPs)
          </h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem; margin-top: 8px;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left;">
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Medicamento / Princípio Ativo</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Indicação</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Posologia e Instruções de Uso</th>
              </tr>
            </thead>
            <tbody>
              ${recommendedMedications.map(m => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 600; color: #0f172a;">${m.name || m}</td>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; color: #475569;">${m.indication || 'Alívio sintomático'}</td>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; color: #334155;">${m.posology || 'Conforme orientação farmacêutica'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Orientações Não Medicamentosas -->
      ${nonPharmaInstructions.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; color: #0f766e; font-size: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            3. CONDUTAS NÃO-MEDICAMENTOSAS &amp; CUIDADOS GERAIS
          </h4>
          <ul style="margin: 6px 0 0 18px; padding: 0; font-size: 0.88rem; color: #334155;">
            ${nonPharmaInstructions.map(inst => `<li style="margin-bottom: 4px;">${inst}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- Parecer e Observações -->
      ${observations ? `
        <div style="margin-bottom: 20px; font-size: 0.88rem; color: #475569;">
          <strong>Observações Adicionais:</strong> ${observations}
        </div>
      ` : ''}

      <!-- Assinatura do Farmacêutico -->
      <div style="margin-top: 40px; border-top: 1px solid #94a3b8; padding-top: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div style="font-size: 0.78rem; color: #64748b; max-width: 400px;">
          Este documento constitui registro formal de atendimento farmacêutico de suporte à decisão. Em caso de persistência ou agravamento dos sintomas, procure avaliação médica imediatamente.
        </div>
        <div style="text-align: center;">
          <div style="font-weight: 700; color: #0f172a; font-size: 0.95rem;">${pharmacist.name}</div>
          <div style="font-size: 0.85rem; color: #0d9488; font-weight: 600;">${pharmacist.crf}</div>
          <div style="font-size: 0.75rem; color: #64748b;">Farmacêutico(a) Clínico(a)</div>
        </div>
      </div>
    </div>
  `;
};
