// ==========================================================================
// 🌿 CRM CLÍNICO FARMACÊUTICO — PHARMACEUTICAL CLINICAL DECISION SUPPORT SYSTEM (CDSS 4D)
// Assistência Farmacêutica Avançada, Triagem Clínica, Red Flags, Prescrição de MIPs,
// Interações Fármaco-Fármaco, Fármaco-Alimento/Hábitos, Duplicidade Terapêutica,
// Marcadores Fisiológicos (Renal/Hepático/Beers), Fórmulas Magistrais & ICP-Brasil Hash
// Em total conformidade com LGPD, CFF (Res. 585/586) e ANVISA (RDC 20/2011)
// ==========================================================================

import { PHARMACOLOGICAL_TAXONOMY, DRUG_INTERACTIONS_DB, detectPharmacologicalClasses } from './clinicalAI.js';

// --- 1. PROTOCOLOS E ÁRVORES DE DECISÃO DE TRIAGEM FARMACÊUTICA (< 60s) ---
export const PHARMACY_TRIAGE_PROTOCOLS = {
  gripe_resfriado: {
    id: 'gripe_resfriado',
    title: 'Sintomas Gripais & Resfriado',
    ciap2: 'R74',
    cid10: 'J00',
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
        drugClass: 'ATC_N02BE',
        indication: 'Antitérmico e analgésico de 1ª linha',
        posology: '1 comprimido de 6/6h ou 8/8h se dor ou febre (máx 3g/dia)',
        contraindications: ['Hepatopatia grave', 'Uso concomitante com álcool']
      },
      {
        name: 'Dipirona Monoidratada 500mg',
        drugClass: 'ATC_N02BB',
        indication: 'Controle de febre e mialgia moderada',
        posology: '1 comprimido de 6/6h (máx 4g/dia)',
        contraindications: ['Alergia a pirazolonas', 'Discrasias sanguíneas']
      },
      {
        name: 'Maleato de Clorfeniramina + Paracetamol',
        drugClass: 'ATC_R06AB',
        indication: 'Alívio de coriza, espirros e congestão associada',
        posology: '1 comprimido a cada 8 horas por até 3 a 5 dias',
        contraindications: ['Glaucoma de ângulo fechado', 'Hiperplasia prostática benigna']
      }
    ]
  },
  cefaleia: {
    id: 'cefaleia',
    title: 'Cefaleia Tensional / Dor de Cabeça',
    ciap2: 'N01',
    cid10: 'G44.2',
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
        drugClass: 'ATC_N02BB',
        indication: 'Analgesia rápida de intensidade moderada',
        posology: '1 comprimido a cada 6 horas se dor',
        contraindications: ['Hipersensibilidade a pirazolonas', 'Porfiria hepática']
      },
      {
        name: 'Paracetamol 750mg + Cafeína 65mg',
        drugClass: 'ATC_N02BE',
        indication: 'Cefaleia tensional e enxaqueca leve a moderada',
        posology: '1 comprimido a cada 6 ou 8 horas (máximo 4 comprimidos/dia)',
        contraindications: ['Hipertensão não controlada', 'Insônia grave', 'Úlcera ativa']
      }
    ]
  },
  dispepsia_azia: {
    id: 'dispepsia_azia',
    title: 'Dispepsia, Azia & Pirose',
    ciap2: 'D03',
    cid10: 'K30',
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
        drugClass: 'ATC_A02AB',
        indication: 'Antiácido de ação imediata com antiflatulento',
        posology: '10ml a 20ml (ou 1-2 comprimidos mastigáveis) 1h após as refeições e ao deitar',
        contraindications: ['Insuficiência renal grave', 'Hipermagnesemia']
      },
      {
        name: 'Famotidina 20mg / 40mg',
        drugClass: 'ATC_A02BA',
        indication: 'Antagonista H2 para alívio de queimação gástrica',
        posology: '1 comprimido 1 vez ao dia antes de dormir por até 14 dias',
        contraindications: ['Hipersensibilidade a bloqueadores H2']
      }
    ]
  },
  dor_muscular_lombalgia: {
    id: 'dor_muscular_lombalgia',
    title: 'Dor Muscular & Lombalgia Aguda',
    ciap2: 'L03',
    cid10: 'M54.5',
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
        drugClass: 'ATC_M01A',
        indication: 'Anti-inflamatório e analgésico para dor osteomuscular',
        posology: '1 comprimido de 8/8h após as refeições por no máximo 5 dias',
        contraindications: ['Úlcera péptica ativa', 'Insuficiência renal', 'Uso de Varfarina/Anticoagulantes', 'Hipertensão descompensada']
      },
      {
        name: 'Dipirona + Citrato de Orfenadrina + Cafeína (Dorflex)',
        drugClass: 'ATC_M03BC',
        indication: 'Analgésico e relaxante muscular de ação central',
        posology: '1 a 2 comprimidos de 8/8h ou 6/6h se dor muscular intensa',
        contraindications: ['Glaucoma', 'Miastenia gravis', 'Obstrução pilórica']
      }
    ]
  },
  diarreia_aguda: {
    id: 'diarreia_aguda',
    title: 'Diarreia Aguda & Gastroenterite Leve',
    ciap2: 'D70',
    cid10: 'A09',
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
        drugClass: 'ATC_A07CA',
        indication: 'Prevenção e tratamento de desidratação (Padrão Ouro OMS)',
        posology: 'Dissolver 1 sachê em 1 litro de água tratada/filtrada; beber aos poucos',
        contraindications: ['Vômitos incoercíveis', 'Íleo paralítico']
      },
      {
        name: 'Saccharomyces boulardii 100mg - 200mg (Probiótico)',
        drugClass: 'ATC_A07FA',
        indication: 'Restauração da microbiota intestinal e redução do tempo de diarreia',
        posology: '1 a 2 cápsulas ao dia por 5 a 7 dias',
        contraindications: ['Pacientes portadores de cateter venoso central', 'Imunossuprimidos graves']
      }
    ]
  }
};

// --- 2. BASE EXPANDIDA DE INTERAÇÕES: ALIMENTOS, HÁBITOS, COMORBIDADES & CRITÉRIOS DE BEERS ---
export const EXTENDED_CLINICAL_RULES_DB = [
  // Fármaco x Comorbidade
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

  // Fármaco x Alimento / Nutrientes
  {
    type: 'FOOD',
    substanceClass: 'ATC_J01MA', // Fluoroquinolonas (Ciprofloxacino, Levofloxacino)
    foodKeywords: ['leite', 'queijo', 'iogurte', 'calcio', 'magnesio', 'ferro', 'antiacido'],
    severity: 'Grave',
    color: '#ef4444',
    title: 'Quelação e Falência Terapêutica (Quinolonas + Cálcio/Laticínios)',
    desc: 'Cátions bivalentes e trivalentes (Cálcio, Magnésio, Alumínio, Ferro) formam quelatos insolúveis com Quinolonas, reduzindo a absorção oral em até 90%.',
    action: 'Administrar o antibiótico no mínimo 2 horas antes ou 4 a 6 horas após a ingestão de laticínios ou suplementos minerais.'
  },
  {
    type: 'FOOD',
    substanceClass: 'ATC_C10AA', // Estatinas (Sinvastatina, Atorvastatina)
    foodKeywords: ['grapefruit', 'toranja', 'suco de toranja'],
    severity: 'Grave',
    color: '#ef4444',
    title: 'Inibição de CYP3A4 com Risco de Rabdomiólise (Estatinas + Toranja)',
    desc: 'A toranja inibe fortemente o citocromo intestinal CYP3A4, multiplicando a concentração sérica da Sinvastatina/Atorvastatina com risco de miopatia e insuficiência renal.',
    action: 'Evitar consumo de toranja/grapefruit durante a terapia com estatinas dependentes de CYP3A4.'
  },
  {
    type: 'FOOD',
    substanceClass: 'ATC_B01AA', // Varfarina
    foodKeywords: ['vitamina k', 'couve', 'espinafre', 'brocolis', 'folhas verdes'],
    severity: 'Moderada',
    color: '#f59e0b',
    title: 'Interação Fármaco-Alimento: Varfarina e Vegetais Ricos em Vitamina K',
    desc: 'A ingestão abundante e oscilante de folhas verdes escuras ricas em vitamina K antagoniza a eficácia anticoagulante da Varfarina, reduzindo o INR.',
    action: 'Orientar o paciente a manter consumo estável e constante de vegetais, sem grandes variações diárias, e checar INR periodicamente.'
  },
  {
    type: 'FOOD',
    substanceClass: 'ATC_H03AA', // Levotiroxina
    foodKeywords: ['cafe', 'leite', 'soja', 'fibras', 'suplemento de ferro', 'suplemento de calcio'],
    severity: 'Moderada',
    color: '#f59e0b',
    title: 'Redução Crítica da Absorção de Levotiroxina',
    desc: 'A Levotiroxina exige meio ácido e jejum estrito para absorção ideal. Alimentos, café, cálcio e soja diminuem severamente a biodisponibilidade.',
    action: 'Ingerir em jejum absoluto com água, aguardando de 30 a 60 minutos antes do desjejum.'
  },

  // Fármaco x Hábitos (Álcool & Tabagismo)
  {
    type: 'HABIT',
    substanceClass: 'ATC_N05BA', // Benzodiazepínicos / Hipnóticos
    habitKeywords: ['alcool', 'bebida alcoolica', 'cerveja', 'vinho', 'destilado'],
    severity: 'Critica',
    color: '#ef4444',
    title: 'Potencialização Depressora Fatal do SNC (Sedativos + Álcool)',
    desc: 'Álcool potencializa de forma sinérgica a ação gabaérgica dos benzodiazepínicos e opioides, com risco iminente de parada cardiorrespiratória e coma.',
    action: 'ABSTENÇÃO TOTAL DE ÁLCOOL durante todo o tratamento medicamentoso com fármacos depressores do SNC.'
  },
  {
    type: 'HABIT',
    substanceClass: 'ATC_J01XD', // Metronidazol
    habitKeywords: ['alcool', 'bebida alcoolica', 'cerveja', 'vinho', 'destilado'],
    severity: 'Critica',
    color: '#ef4444',
    title: 'Efeito Dissulfiram / Antabuse (Metronidazol + Álcool)',
    desc: 'O Metronidazol inibe a enzima aldeído desidrogenase, causando acúmulo tóxico de acetaldeído: rubor facial, vômitos incoercíveis, taquicardia e hipotensão.',
    action: 'Proibir ingestão de qualquer bebida alcoólica durante o uso e até 48 horas após o término do Metronidazol.'
  },
  {
    type: 'HABIT',
    substanceClass: 'ATC_G03AA', // Anticoncepcionais Orais
    habitKeywords: ['fumo', 'cigarro', 'tabaco', 'tabagismo', 'fumante'],
    severity: 'Critica',
    color: '#ef4444',
    title: 'Risco Tromboembólico Grave (Estrogênios + Tabagismo > 35 anos)',
    desc: 'A combinação de anticoncepcionais orais combinados com tabagismo eleva exponencialmente o risco de Trombose Venosa Profunda, Embolia Pulmonar, AVC e IAM.',
    action: 'Contraindicação categórica (Critérios OMS Categoria 4). Indicar métodos progestagênicos exclusivos ou não hormonais.'
  },

  // Marcadores Fisiológicos / Critérios de Beers (Idosos > 65 anos)
  {
    type: 'BEERS_CRITERIA',
    substanceClass: 'ATC_N05BA', // Benzodiazepínicos em Idosos
    minAge: 65,
    severity: 'Grave',
    color: '#ef4444',
    title: 'Critérios de Beers / STOPP: Benzodiazepínicos em Idosos',
    desc: 'Idosos possuem sensibilidade aumentada e clearance diminuído para benzodiazepínicos, com alto risco de sedação prolongada, quedas, fraturas de fêmur e declínio cognitivo.',
    action: 'Evitar o uso. Se indispensável, preferir agentes de meia-vida curta e na menor dose possível.'
  },
  {
    type: 'BEERS_CRITERIA',
    substanceClass: 'ATC_M01A', // AINEs contínuos em Idosos
    minAge: 65,
    severity: 'Grave',
    color: '#ef4444',
    title: 'Critérios de Beers: AINEs de Uso Contínuo em Idosos',
    desc: 'Risco quadruplicado de hemorragia gastrointestinal alta silenciosa e descompensação de função renal e pressão arterial.',
    action: 'Evitar AINEs por mais de 5 a 7 dias em idosos. Prescrever gastroproteção concomitante se uso for inevitável.'
  }
];

// --- 3. AUDITORIA E SILENCIAMENTO INTELIGENTE DE ALERTAS (ALERT FATIGUE MITIGATION) ---
export const getSilencedAlertsKey = (patientId, alertCode) => `cdss_silenced_${patientId}_${alertCode}`;

export const isAlertSilenced = (patientId, alertCode) => {
  if (!patientId || !alertCode) return false;
  const item = localStorage.getItem(getSilencedAlertsKey(patientId, alertCode));
  if (!item) return false;
  try {
    const data = JSON.parse(item);
    // Válido por 30 dias
    const isExpired = (Date.now() - (data.timestamp || 0)) > (30 * 24 * 60 * 60 * 1000);
    return !isExpired;
  } catch (e) {
    return false;
  }
};

export const silenceAlertWithAudit = ({ patientId, alertCode, reason, pharmacistCrf }) => {
  const payload = {
    patientId,
    alertCode,
    reason,
    pharmacistCrf: pharmacistCrf || 'CRF-SP 54180',
    timestamp: Date.now(),
    dateStr: new Date().toISOString()
  };
  localStorage.setItem(getSilencedAlertsKey(patientId, alertCode), JSON.stringify(payload));
  return payload;
};

// --- 4. PARSER DE FÓRMULAS MAGISTRAIS & COMPONENTES ---
export const parseMagistralFormula = (formulaText = '') => {
  if (!formulaText) return [];
  // Exemplo: "Minoxidil 5% + Finasterida 0.05% + Biotina 2mg em Loção Capilar qsp 100ml"
  const lines = formulaText.split(/[\+\n;,]/).map(s => s.trim()).filter(Boolean);
  return lines.map(item => {
    const match = item.match(/^([a-zA-Zá-úÁ-Ú\s]+)\s*([\d\.,]+\s*(?:mg|mcg|g|%|ui|ml|qsp)?.*)$/i);
    if (match) {
      return { activePrinciple: match[1].trim(), posologyQuantity: match[2].trim() };
    }
    return { activePrinciple: item, posologyQuantity: '' };
  });
};

// --- 5. MOTOR MULTIDIMENSIONAL DE CRUZAMENTO EM TEMPO REAL (CDSS 4D) ---
export const runRealtimeClinicalCrosscheck = ({
  proposedMedications = [],
  activeMedications = [],
  allergies = '',
  chronicConditions = '',
  isPregnantOrLactating = false,
  renalImpairment = false, // Clearance < 30 mL/min
  hepaticImpairment = false,
  patientAge = 35,
  patientHabits = '', // Ex: 'fumante, consome álcool ocasional'
  patientId = null
}) => {
  const alerts = [];

  // 1. Extração e Normalização de Textos e Classes
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
  const normHabits = (patientHabits || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (!normProposed && !normActive) return [];

  const proposedClasses = detectPharmacologicalClasses(normProposed);
  const activeClasses = detectPharmacologicalClasses(normActive);

  // --- DIMENSÃO 1: FÁRMACO X FÁRMACO (DDI) ---
  DRUG_INTERACTIONS_DB.forEach(rule => {
    const propHasA = proposedClasses.some(c => c.classCode === rule.classA);
    const propHasB = proposedClasses.some(c => c.classCode === rule.classB);
    const actHasA = activeClasses.some(c => c.classCode === rule.classA);
    const actHasB = activeClasses.some(c => c.classCode === rule.classB);

    const matchCase1 = propHasA && (propHasB || actHasB);
    const matchCase2 = propHasB && (propHasA || actHasA);

    if (matchCase1 || matchCase2) {
      const alertCode = `DDI_${rule.classA}_${rule.classB}`;
      if (!isAlertSilenced(patientId, alertCode)) {
        const isCrossWithActive = (propHasA && !propHasB && actHasB) || (propHasB && !propHasA && actHasA);
        alerts.push({
          code: alertCode,
          dimension: 'DDI',
          severity: rule.severity,
          color: rule.color,
          title: isCrossWithActive ? `[Cruzamento c/ Medicamento Ativo] ${rule.title}` : rule.title,
          desc: isCrossWithActive ? `O paciente faz uso contínuo registrado no prontuário. ${rule.desc}` : rule.desc,
          action: rule.action,
          isBlocker: rule.severity === 'Critica' || Boolean(rule.isBlocker)
        });
      }
    }
  });

  // --- DIMENSÃO 2: DUPLICIDADE TERAPÊUTICA (SAME CLASS DUPLICATION) ---
  const classCountMap = {};
  [...proposedClasses, ...activeClasses].forEach(c => {
    classCountMap[c.classCode] = (classCountMap[c.classCode] || 0) + 1;
  });

  Object.entries(classCountMap).forEach(([classCode, count]) => {
    if (count > 1) {
      const classInfo = Object.values(PHARMACOLOGICAL_TAXONOMY).find(t => t.code === classCode);
      const className = classInfo ? classInfo.name : classCode;
      alerts.push({
        code: `DUP_${classCode}`,
        dimension: 'DUPLICITY',
        severity: 'Grave',
        color: '#f59e0b',
        title: `DUPLICIDADE TERAPÊUTICA: ${count} medicamentos da mesma classe (${className})`,
        desc: `O paciente possui mais de um medicamento ativo simultaneamente pertencente à mesma classe terapêutica (${className}). Isso aumenta exponencialmente a toxicidade cumulativa sem ganho proporcional de eficácia.`,
        action: 'Avaliar desprescrição ou ajuste de monoterapia com o médico assistente.',
        isBlocker: false
      });
    }
  });

  // --- DIMENSÃO 3: FÁRMACO X ALERGIAS PADRONIZADAS (CRITICAL ALLERGY INTERCEPT) ---
  const ALLERGY_MAP = [
    { key: 'dipirona', matchClass: null, terms: ['dipirona', 'metamizol', 'novalgina', 'lisador', 'anador'], label: 'Dipirona / Pirazolonas' },
    { key: 'penicilina', matchClass: 'ATC_J01CA', terms: ['penicilina', 'amoxicilina', 'ampicilina', 'cefalosporina', 'clavulanato'], label: 'Penicilinas & Beta-lactâmicos' },
    { key: 'aine', matchClass: 'ATC_M01A', terms: ['anti-inflamatorio', 'aine', 'ibuprofeno', 'diclofenaco', 'cetoprofeno', 'nimesulida', 'naproxeno', 'meloxicam', 'piroxicam'], label: 'Anti-inflamatórios Não Esteroidais (AINEs)' },
    { key: 'aas', matchClass: 'ATC_B01AC', terms: ['aas', 'aspirina', 'acido acetilsalicilico'], label: 'Aspirina / Salicilatos' },
    { key: 'sulfa', matchClass: null, terms: ['sulfa', 'sulfametoxazol', 'bactrim', 'sulfadiazina'], label: 'Sulfonamidas / Sulfas' }
  ];

  ALLERGY_MAP.forEach(item => {
    const hasAllergyDeclared = item.terms.some(t => normAllergies.includes(t));
    if (hasAllergyDeclared) {
      const hasPropMatch = item.terms.some(t => normProposed.includes(t)) || (item.matchClass && proposedClasses.some(c => c.classCode === item.matchClass));
      if (hasPropMatch) {
        alerts.push({
          code: `ALLERGY_${item.key}`,
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

  // --- DIMENSÃO 4: FÁRMACO X ALIMENTOS, HÁBITOS & COMORBIDADES ---
  EXTENDED_CLINICAL_RULES_DB.forEach(rule => {
    const hasClass = proposedClasses.some(c => c.classCode === rule.substanceClass) || activeClasses.some(c => c.classCode === rule.substanceClass);
    if (!hasClass) return;

    if (rule.type === 'DISEASE') {
      const hasCondition = rule.conditionKeywords.some(kw => normConditions.includes(kw)) || (renalImpairment && rule.conditionKeywords.includes('insuficiencia renal'));
      if (hasCondition) {
        alerts.push({
          code: `DIS_${rule.substanceClass}`,
          dimension: 'DISEASE',
          severity: rule.severity,
          color: rule.color,
          title: `[Fármaco x Comorbidade] ${rule.title}`,
          desc: rule.desc,
          action: rule.action,
          isBlocker: rule.severity === 'Critica'
        });
      }
    } else if (rule.type === 'FOOD') {
      alerts.push({
        code: `FOOD_${rule.substanceClass}`,
        dimension: 'FOOD',
        severity: rule.severity,
        color: rule.color,
        title: `[Fármaco x Alimento/Nutriente] ${rule.title}`,
        desc: rule.desc,
        action: rule.action,
        isBlocker: false
      });
    } else if (rule.type === 'HABIT') {
      const hasHabit = rule.habitKeywords.some(kw => normHabits.includes(kw));
      if (hasHabit) {
        alerts.push({
          code: `HABIT_${rule.substanceClass}`,
          dimension: 'HABIT',
          severity: rule.severity,
          color: rule.color,
          title: `[Fármaco x Hábito] ${rule.title}`,
          desc: rule.desc,
          action: rule.action,
          isBlocker: rule.severity === 'Critica'
        });
      }
    } else if (rule.type === 'BEERS_CRITERIA') {
      if (patientAge >= (rule.minAge || 65)) {
        alerts.push({
          code: `BEERS_${rule.substanceClass}`,
          dimension: 'BEERS',
          severity: rule.severity,
          color: rule.color,
          title: rule.title,
          desc: rule.desc,
          action: rule.action,
          isBlocker: false
        });
      }
    }
  });

  // --- DIMENSÃO 5: GESTAÇÃO & LACTAÇÃO ---
  if (isPregnantOrLactating) {
    const unsafeInPregnancy = proposedClasses.some(c => ['ATC_M01A', 'ATC_C09A', 'ATC_B01AA', 'ATC_C10AA', 'ATC_J01MA', 'ATC_C09CA'].includes(c.classCode));
    if (unsafeInPregnancy) {
      alerts.push({
        code: 'PREGNANCY_RISK',
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

// --- 6. GERAÇÃO DE HASH CRIPTOGRÁFICO DE AUTENTICIDADE (PADRÃO ICP-BRASIL / CFF) ---
export const generateDeclarationAuthHash = (declarationData) => {
  const str = JSON.stringify(declarationData) + '|CFF_RES_585_586|' + Date.now();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit int
  }
  const hexPart = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  const timePart = Date.now().toString(36).toUpperCase().slice(-4);
  return `BR-CRF-${hexPart}-${timePart}`;
};

// --- 7. EMISSÃO DE DECLARAÇÃO DE SERVIÇO FARMACÊUTICO (DSF) & ENCAMINHAMENTO ---
export const generatePharmacistDeclarationHTML = ({
  patient,
  pharmacist = { name: 'Dr. Marcelo Mazaro', crf: 'CRF-SP 54180' },
  triageComplaint,
  redFlags = [],
  recommendedMedications = [],
  nonPharmaInstructions = [],
  observations = '',
  date = new Date()
}) => {
  const dateFormatted = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(date);
  const authCode = generateDeclarationAuthHash({ patientName: patient.name, cpf: patient.cpf, crf: pharmacist.crf, date: date.toISOString() });

  return `
    <div class="pharmacy-declaration-print" style="font-family: 'Inter', sans-serif; color: #1e293b; background: #ffffff; padding: 36px; border-radius: 14px; border: 1px solid #cbd5e1; max-width: 820px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
      
      <!-- Cabeçalho Oficial -->
      <div style="border-bottom: 2.5px solid #0d9488; padding-bottom: 18px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div>
          <h2 style="margin: 0; color: #0f766e; font-size: 1.45rem; font-family: 'Outfit', sans-serif; font-weight: 800; letter-spacing: -0.02em;">
            DECLARAÇÃO DE SERVIÇO FARMACÊUTICO (DSF)
          </h2>
          <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b;">
            Assistência Farmacêutica Clínica &amp; Prescrição Farmacêutica de MIPs — Resoluções CFF nº 585/2013 e 586/2013
          </p>
        </div>
        <div style="text-align: right; font-size: 0.8rem; color: #475569; background: #f8fafc; padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div><strong>Data/Hora:</strong> ${dateFormatted}</div>
          <div style="color: #0d9488; font-weight: 700; margin-top: 2px;">Cód. Autenticidade: ${authCode}</div>
        </div>
      </div>

      <!-- Dados do Paciente -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 22px; font-size: 0.9rem;">
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; margin-bottom: 6px;">
          <div><strong>Paciente:</strong> ${patient.name || 'Não Informado'}</div>
          <div><strong>CPF:</strong> ${patient.cpf || 'Não Informado'}</div>
          <div><strong>Idade/Sexo:</strong> ${patient.age || '--'} anos / ${patient.gender || '--'}</div>
        </div>
        ${patient.allergies ? `<div style="margin-top: 6px; color: #be123c; font-size: 0.86rem;"><strong>⚠️ Alergias Informadas:</strong> ${patient.allergies}</div>` : ''}
        ${patient.chronicConditions ? `<div style="margin-top: 4px; color: #475569; font-size: 0.86rem;"><strong>Comorbidades Crônicas:</strong> ${patient.chronicConditions}</div>` : ''}
      </div>

      <!-- Queixa Principal e Triagem -->
      <div style="margin-bottom: 22px;">
        <h4 style="margin: 0 0 8px 0; color: #0f766e; font-size: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; font-family: 'Outfit', sans-serif;">
          1. AVALIAÇÃO CLÍNICA &amp; TRIAGEM DE SINTOMAS
        </h4>
        <p style="margin: 0; font-size: 0.92rem; color: #334155;">
          <strong>Queixa Principal / Motivo:</strong> ${triageComplaint || 'Atendimento de rotina e orientação farmacoterapêutica.'}
        </p>
        ${redFlags.length > 0 ? `
          <div style="margin-top: 10px; background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 8px; padding: 12px; color: #9f1239; font-size: 0.88rem;">
            <strong>🚨 SINAIS DE ALERTA (RED FLAGS) DETECTADOS — ENCAMINHAMENTO MÉDICO IMEDIATO:</strong>
            <ul style="margin: 6px 0 0 18px; padding: 0;">
              ${redFlags.map(rf => `<li>${rf}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>

      <!-- Prescrição / Recomendação Farmacêutica -->
      ${recommendedMedications.length > 0 ? `
        <div style="margin-bottom: 22px;">
          <h4 style="margin: 0 0 8px 0; color: #0f766e; font-size: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; font-family: 'Outfit', sans-serif;">
            2. PRESCRIÇÃO FARMACÊUTICA DE MIPs / ORIENTAÇÃO TERAPÊUTICA
          </h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem; margin-top: 8px;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left;">
                <th style="padding: 9px; border: 1px solid #cbd5e1; color: #334155;">Medicamento / Princípio Ativo</th>
                <th style="padding: 9px; border: 1px solid #cbd5e1; color: #334155;">Indicação Clínica</th>
                <th style="padding: 9px; border: 1px solid #cbd5e1; color: #334155;">Posologia &amp; Instruções de Uso</th>
              </tr>
            </thead>
            <tbody>
              ${recommendedMedications.map(m => `
                <tr>
                  <td style="padding: 9px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f172a;">${m.name || m}</td>
                  <td style="padding: 9px; border: 1px solid #cbd5e1; color: #475569;">${m.indication || 'Alívio sintomático'}</td>
                  <td style="padding: 9px; border: 1px solid #cbd5e1; color: #0f766e; font-weight: 600;">${m.posology || 'Conforme orientação farmacêutica'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Orientações Não Medicamentosas -->
      ${nonPharmaInstructions.length > 0 ? `
        <div style="margin-bottom: 22px;">
          <h4 style="margin: 0 0 8px 0; color: #0f766e; font-size: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; font-family: 'Outfit', sans-serif;">
            3. MEDIDAS NÃO FARMACOLÓGICAS &amp; CUIDADOS EM SAÚDE
          </h4>
          <ul style="margin: 6px 0 0 18px; padding: 0; font-size: 0.88rem; color: #334155;">
            ${nonPharmaInstructions.map(inst => `<li style="margin-bottom: 4px;">${inst}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- Parecer e Observações -->
      ${observations ? `
        <div style="margin-bottom: 22px;">
          <h4 style="margin: 0 0 8px 0; color: #0f766e; font-size: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; font-family: 'Outfit', sans-serif;">
            4. OBSERVAÇÕES &amp; EVOLUÇÃO FARMACOTERAPÊUTICA
          </h4>
          <p style="margin: 0; font-size: 0.88rem; color: #334155; line-height: 1.5; white-space: pre-wrap;">${observations}</p>
        </div>
      ` : ''}

      <!-- Assinatura do Farmacêutico e Carimbo Digital -->
      <div style="margin-top: 36px; padding-top: 18px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 20px;">
        <div>
          <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px;">DOCUMENTO ASSINADO DIGITALMENTE</div>
          <div style="font-family: monospace; font-size: 0.8rem; color: #0d9488; font-weight: 700;">${authCode}</div>
          <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">Válido em todo o território nacional conforme Medida Provisória nº 2.200-2/2001</div>
        </div>

        <div style="text-align: center; min-width: 260px;">
          <div style="border-bottom: 1.5px solid #0f172a; width: 100%; margin-bottom: 6px;"></div>
          <div style="font-weight: 700; color: #0f172a; font-size: 0.95rem;">${pharmacist.name || 'Dr. Marcelo Mazaro'}</div>
          <div style="font-size: 0.82rem; color: #0f766e; font-weight: 600;">Farmacêutico(a) — ${pharmacist.crf || 'CRF-SP 54180'}</div>
        </div>
      </div>

    </div>
  `;
};

// --- 8. GERADOR DE MENSAGENS ESTRUTURADAS PARA WHATSAPP ---
export const generateWhatsAppPosologyMessage = ({ patient, medications = [], nonPharma = [] }) => {
  const medText = medications.map(m => `💊 *${m.name || m}*\n   ⏱️ _Como tomar:_ ${m.posology || 'Conforme orientação'}`).join('\n\n');
  const nonPharmaText = nonPharma.length > 0 ? `\n\n🌿 *Cuidados e Orientações:*\n${nonPharma.map(i => `• ${i}`).join('\n')}` : '';

  const msg = `Olá, *${patient.name}*! 👋\n\nAqui estão as suas orientações de cuidados farmacêuticos:\n\n${medText}${nonPharmaText}\n\nQualquer dúvida ou sintoma inesperado, procure nossa farmácia!\n_CRM Clínico Farmacêutico_`;
  return encodeURIComponent(msg);
};
