// ==========================================================================
// 🧠 HEALTH NEXUS — CLINICAL PHARMACEUTICAL NLP & FUZZY SEARCH ENGINE
// Processamento de Linguagem Natural (PLN), Reconhecimento de Entidades (NER),
// Distância Fonética / Levenshtein e Mapeamento Semântico de Sintomas x Fármacos
// ==========================================================================

import { CANONICAL_MEDICATIONS_DB } from './medicationsDB.js';

// Normalização NFD e limpeza de caracteres especiais
export const normalizeText = (text = '') => {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Cálculo de Distância de Levenshtein para tolerância a erros de digitação (Fuzzy Matching)
export const levenshteinDistance = (a = '', b = '') => {
  const s1 = normalizeText(a);
  const s2 = normalizeText(b);
  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const matrix = [];
  for (let i = 0; i <= s2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= s1.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substituição
          matrix[i][j - 1] + 1,     // inserção
          matrix[i - 1][j] + 1      // deleção
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
};

// Similaridade percentual (0.0 a 1.0)
export const calculateFuzzySimilarity = (strA, strB) => {
  const cleanA = normalizeText(strA);
  const cleanB = normalizeText(strB);
  const maxLen = Math.max(cleanA.length, cleanB.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(cleanA, cleanB);
  return Math.max(0, (maxLen - dist) / maxLen);
};

// Extração de Entidades Clínicas (NER): Dosagem e Forma Farmacêutica
export const extractClinicalEntities = (query = '') => {
  const norm = normalizeText(query);
  const entities = {
    dosage: null,
    form: null,
    cleanTerm: norm
  };

  // 1. Extração de Dosagens (ex: 500mg, 1g, 750 mg, 10ml, 50mg/ml, 2.5mg)
  const dosageMatch = query.match(/(\d+(?:[.,]\d+)?)\s*(mg\/ml|mcg|mg|g|ml|ui|%)/i);
  if (dosageMatch) {
    entities.dosage = dosageMatch[0].replace(/\s+/g, '').toLowerCase();
  }

  // 2. Extração de Formas Farmacêuticas comuns
  const FORMS_MAP = [
    { key: 'comprimido', aliases: ['comprimido', 'comprimidos', 'comp', 'cp', 'capsula', 'capsulas', 'cap'] },
    { key: 'gotas', aliases: ['gotas', 'gota', 'gts', 'solucao oral', 'frasco'] },
    { key: 'xarope', aliases: ['xarope', 'suspensao', 'solucao'] },
    { key: 'injetavel', aliases: ['injetavel', 'ampola', 'inj', 'iv', 'im'] },
    { key: 'pomada', aliases: ['pomada', 'creme', 'gel', 'topico'] },
    { key: 'sublingual', aliases: ['sublingual', 'sl'] }
  ];

  FORMS_MAP.forEach(item => {
    if (item.aliases.some(alias => norm.includes(alias))) {
      entities.form = item.key;
    }
  });

  return entities;
};

// Dicionário de Sinônimos Clínicos e Mapeamento de Linguagem Natural / Queixas Leigas
export const CLINICAL_INTENT_SYNONYMS = {
  // Dores & Febre
  dor: ['dor', 'doendo', 'dor forte', 'dor no corpo', 'mialgia', 'analgesico', 'analgesia', 'febre', 'quente', 'temperatura alta'],
  dor_cabeca: ['dor de cabeca', 'dor na cabeca', 'enxaqueca', 'cefaleia', 'cabeca latejando', 'dor frontal'],
  dor_muscular: ['dor muscular', 'torcicolo', 'musculo travado', 'pescoco duro', 'dor nas costas', 'lombar', 'lombalgia', 'contratura'],
  dor_garganta: ['dor de garganta', 'garganta inflamada', 'garganta raspando', 'amigdalite', 'engolir doi'],
  
  // Gastrointestinal
  azia: ['azia', 'queimacao', 'refluxo', 'estomago queimando', 'estomago pesado', 'gastrite', 'antiacido', 'pirose', 'protetor gastrico'],
  diarreia: ['diarreia', 'desarranjo', 'intestino solto', 'evacuacao liquida', 'soro', 'reidratacao', 'flora intestinal'],
  gases: ['gases', 'estufamento', 'barriga inchada', 'antiflatulento', 'flatulencia', 'gases preso'],

  // Cardiovascular & Metabólico
  pressao_alta: ['pressao alta', 'hipertensao', 'remedio de pressao', 'pressao subiu', 'anti-hipertensivo'],
  colesterol: ['colesterol', 'colesterol alto', 'gordura no sangue', 'estatina', 'triglicerideos'],
  dor_peito: ['dor no peito', 'angina', 'coronaria', 'vasodilatador', 'infarto'],
  afinar_sangue: ['afinar o sangue', 'anticoagulante', 'trombose', 'prevenir avc', 'trombofilia'],

  // Saúde Sexual & Urologia
  disfuncao: ['impotencia', 'disfuncao eretil', 'viagra', 'erecao', 'estimulante', 'vasodilatador masculino'],

  // Saúde Mental & SNC
  ansiedade: ['ansiedade', 'calmante', 'tranquilizante', 'panico', 'crise de ansiedade', 'insonia', 'dormir', 'tarja preta']
};

// Motor Principal de Busca por PLN (Relevance Scoring)
export const searchMedicationsNLP = (rawQuery = '', database = CANONICAL_MEDICATIONS_DB, options = {}) => {
  if (!rawQuery || typeof rawQuery !== 'string') return [];
  const cleanQuery = normalizeText(rawQuery);
  if (!cleanQuery) return [];

  const entities = extractClinicalEntities(rawQuery);
  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);

  const scoredResults = database.map(med => {
    let score = 0;
    const matchReasons = [];

    const normName = normalizeText(med.name);
    const normActive = normalizeText(med.activeSubstance);
    const normTrades = (med.tradeNames || []).map(t => normalizeText(t));
    const normClass = normalizeText(med.therapeuticClass + ' ' + (med.pharmaceuticalClass || ''));
    const normSymptoms = (med.symptomKeywords || []).map(s => normalizeText(s));
    const normForms = (med.pharmaceuticalForms || []).map(f => normalizeText(f));

    // 1. MATCH EXATO NO NOME OU PRINCÍPIO ATIVO (100 pts)
    if (normName === cleanQuery || normActive === cleanQuery) {
      score += 100;
      matchReasons.push('Correspondência Exata no Nome/Princípio Ativo');
    } else if (normName.startsWith(cleanQuery) || normActive.startsWith(cleanQuery)) {
      score += 85;
      matchReasons.push('Início do Nome do Medicamento');
    } else if (normName.includes(cleanQuery) || normActive.includes(cleanQuery)) {
      score += 70;
      matchReasons.push('Termo presente no Nome');
    }

    // 2. MATCH EM NOMES COMERCIAIS / MARCAS DE REFERÊNCIA (95 pts)
    normTrades.forEach(trade => {
      if (trade === cleanQuery) {
        score += 95;
        matchReasons.push(`Marca Comercial Conhecida: ${trade}`);
      } else if (trade.startsWith(cleanQuery)) {
        score += 75;
        matchReasons.push(`Início da Marca: ${trade}`);
      } else if (trade.includes(cleanQuery)) {
        score += 60;
        matchReasons.push(`Marca relacionada: ${trade}`);
      }
    });

    // 3. FUZZY SEARCH (Tolerância a erros de digitação como "iboprofeno", "parasetamol")
    const allNamesToFuzzy = [normName, normActive, ...normTrades];
    allNamesToFuzzy.forEach(target => {
      queryTokens.forEach(token => {
        if (token.length >= 4) {
          const sim = calculateFuzzySimilarity(token, target);
          if (sim >= 0.78 && score < 70) {
            score += Math.round(sim * 65);
            matchReasons.push(`Grafia Aproximada (${Math.round(sim * 100)}% similar a "${target}")`);
          }
        }
      });
    });

    // 4. MAPEAMENTO SEMÂNTICO DE SINTOMAS E INTENÇÃO CLÍNICA
    normSymptoms.forEach(symp => {
      if (symp.includes(cleanQuery) || cleanQuery.includes(symp)) {
        score += 55;
        matchReasons.push(`Indicação Clínica para: ${symp}`);
      } else {
        queryTokens.forEach(token => {
          if (token.length >= 3 && symp.includes(token)) {
            score += 35;
            matchReasons.push(`Sintoma relacionado: ${symp}`);
          }
        });
      }
    });

    // 5. CORRESPONDÊNCIA DE CLASSE TERAPÊUTICA (40 pts)
    if (normClass.includes(cleanQuery)) {
      score += 45;
      matchReasons.push('Classe Terapêutica Correspondente');
    }

    // 6. BÔNUS POR EXTRAÇÃO DE ENTIDADE (Dosagem e Forma coincidente)
    if (entities.dosage) {
      const hasDosage = (med.usualDosages || []).some(d => normalizeText(d).includes(entities.dosage)) ||
                        normForms.some(f => f.includes(entities.dosage));
      if (hasDosage) {
        score += 20;
        matchReasons.push(`Dosagem solicitada identificada (${entities.dosage})`);
      }
    }

    if (entities.form) {
      const hasForm = normForms.some(f => f.includes(entities.form));
      if (hasForm) {
        score += 15;
        matchReasons.push(`Forma farmacêutica (${entities.form})`);
      }
    }

    return {
      ...med,
      relevanceScore: score,
      matchReasons: Array.from(new Set(matchReasons)),
      extractedEntities: entities
    };
  });

  // Filtrar apenas com pontuação relevante e ordenar pelo score decrescente
  const filtered = scoredResults
    .filter(item => item.relevanceScore >= 25)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  const limit = options.limit || 8;
  return filtered.slice(0, limit);
};
