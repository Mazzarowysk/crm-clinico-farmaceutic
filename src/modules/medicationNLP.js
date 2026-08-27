// ==========================================================================
// 🧠 CRM CLÍNICO FARMACÊUTICO — CLINICAL PHARMACEUTICAL NLP & FUZZY SEARCH ENGINE
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
  // Dores, Febre & Inflamações
  dor: ['dor', 'doendo', 'dor forte', 'dor no corpo', 'mialgia', 'analgesico', 'analgesia', 'febre', 'quente', 'temperatura alta', 'moleza', 'fraqueza'],
  dor_cabeca: ['dor de cabeca', 'dor na cabeca', 'enxaqueca', 'cefaleia', 'cabeca latejando', 'dor frontal', 'dor na testa', 'isometepteno', 'neosaldina', 'doralgina'],
  dor_muscular: ['dor muscular', 'torcicolo', 'musculo travado', 'pescoco duro', 'dor nas costas', 'lombar', 'lombalgia', 'contratura', 'tandrilax', 'mioflex', 'dorflex', 'orfenadrina'],
  dor_dente: ['dor de dente', 'dente furado', 'canal de dente', 'dor na gengiva', 'odontalgia', 'toragesic', 'cetorolaco', 'nimesulida'],
  dor_garganta: ['dor de garganta', 'garganta inflamada', 'garganta raspando', 'amigdalite', 'engolir doi', 'flanax', 'naproxeno', 'anti-inflamatorio garganta'],
  colica: ['colica', 'colica menstrual', 'colica intestinal', 'dor na barriga', 'espasmo', 'buscopan', 'escopolamina', 'atroveran', 'dismenorreia'],
  
  // Gastrointestinal, Fígado & Enjoos
  azia: ['azia', 'queimacao', 'refluxo', 'estomago queimando', 'estomago pesado', 'gastrite', 'antiacido', 'pirose', 'protetor gastrico', 'omeprazol', 'pantoprazol', 'sal de fruta', 'eno', 'estomazil'],
  enjoo: ['enjoo', 'nausea', 'vomito', 'ansia', 'ansia de vomito', 'estomago embrulhado', 'cinetose', 'enjoo de viagem', 'enjoo de carro', 'dramin', 'vonau', 'ondansetrona', 'dimenidrinato', 'plasil', 'metoclopramida'],
  figado: ['figado', 'figado atacado', 'remedio pro figado', 'ressaca', 'ma digestao', 'epocler', 'hepatilon', 'xantinon', 'colina', 'gordura pesada'],
  diarreia: ['diarreia', 'desarranjo', 'intestino solto', 'evacuacao liquida', 'soro', 'reidratacao', 'flora intestinal', 'floratil', 'repoflor', 'boulardii', 'probiotico', 'imosec', 'loperamida'],
  gases: ['gases', 'estufamento', 'barriga inchada', 'antiflatulento', 'flatulencia', 'gases preso', 'luftal', 'simeticona', 'flagass'],
  constipacao: ['prisao de ventre', 'constipacao', 'intestino preso', 'nao consigo evacuar', 'lactulose', 'lactulona', 'laxante', 'soltar intestino'],

  // Respiratório, Gripes & Alergias
  gripe: ['gripe', 'resfriado', 'gripe forte', 'febre e moleza', 'antigripal', 'benegrip', 'cimegripe', 'resfenol', 'coristina', 'apracur', 'coriza e dor'],
  tosse: ['tosse', 'tosse seca', 'tosse com catarro', 'tosse cheia', 'expectorante', 'xarope', 'xaropes', 'catarro', 'peito cheio', 'vibral', 'notuss', 'acebrofilina', 'brondilat', 'hedera helix', 'abrilar', 'vick', 'guaifenesina', 'acetilcisteina', 'fluimucil'],
  rinite_alergia: ['rinite', 'alergia', 'espirros', 'coriza', 'nariz entupido', 'coceira no nariz', 'alergia na pele', 'coceira', 'polaramine', 'dexclorfeniramina', 'claritin', 'loratadina', 'desalex', 'desloratadina', 'allegra', 'fexofenadina', 'antialergico'],
  congestao_nasal: ['nariz entupido', 'lavagem nasal', 'soro nasal', 'descongestionante', 'rinosoro', 'maresis', 'salsep', 'sorine', 'cloreto de sodio'],

  // SNC, Sono, Calmantes & Suplementos
  calmante: ['calmante', 'calmante natural', 'ansiedade', 'nervoso', 'estresse', 'maracugina', 'seakalm', 'calman', 'passiflora', 'valeriana', 'valerimed', 'fitoterapico ansiedade'],
  sono: ['sono', 'insonia', 'dormir', 'remedio pra dormir', 'melatonina', 'sono leve', 'acordando a noite'],
  vitaminas: ['vitamina', 'vitaminas', 'imunidade', 'vitamina c', 'acido ascorbico', 'redoxon', 'cewin', 'vitamina d', 'vitamina d3', 'addera', 'depura', 'colecalciferol', 'complexo b', 'zinco', 'magnesio', 'calcio', 'ossos fracos', 'falta de vitamina'],

  // Crônicos & Metabólicos
  pressao: ['pressao', 'pressao alta', 'hipertensao', 'remedio de pressao', 'losartana', 'aradois', 'cozaar', 'enalapril', 'renitec', 'captopril', 'atenolol', 'anlodipino', 'norvasc', 'hidroclorotiazida'],
  diabetes: ['diabetes', 'diabetico', 'acucar no sangue', 'glicemia', 'glicose alta', 'metformina', 'glifage', 'glibenclamida'],
  colesterol: ['colesterol', 'colesterol alto', 'gordura no sangue', 'estatina', 'sinvastatina', 'zocor', 'atorvastatina', 'lipitor', 'rosuvastatina', 'crestor'],
  tireoide: ['tireoide', 'hipotireoidismo', 'remedio de tireoide', 'puran', 'puran t4', 'synthroid', 'levotiroxina', 'tsh'],
  anticoagulante: ['anticoagulante', 'afinar o sangue', 'trombose', 'prevenir avc', 'marevan', 'varfarina', 'aspirina prevent', 'aas protect']
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

    const normName = normalizeText(med.name || '');
    const normActive = normalizeText(med.activeSubstance || '');
    const normTrades = (med.tradeNames || []).map(t => normalizeText(t));
    const normClass = normalizeText((med.therapeuticClass || '') + ' ' + (med.pharmaceuticalClass || ''));
    const normSymptoms = (med.symptomKeywords || []).map(s => normalizeText(s));
    const normForms = (med.pharmaceuticalForms || []).map(f => normalizeText(f));
    const fullMedText = `${normName} ${normActive} ${normTrades.join(' ')} ${normClass} ${normSymptoms.join(' ')} ${normForms.join(' ')}`;

    // 1. MATCH EXATO OU INÍCIO NO NOME OU PRINCÍPIO ATIVO (100 pts)
    if (normName === cleanQuery || normActive === cleanQuery) {
      score += 100;
      matchReasons.push('Correspondência Exata no Nome / Princípio Ativo');
    } else if (normName.startsWith(cleanQuery) || normActive.startsWith(cleanQuery)) {
      score += 85;
      matchReasons.push('Início do Nome do Medicamento');
    } else if (normName.includes(cleanQuery) || normActive.includes(cleanQuery)) {
      score += 75;
      matchReasons.push('Termo presente no Nome / Princípio Ativo');
    }

    // 2. MATCH EM NOMES COMERCIAIS / MARCAS POPULARES (95 pts)
    normTrades.forEach(trade => {
      if (trade === cleanQuery) {
        score += 95;
        matchReasons.push(`Marca Comercial Conhecida: ${trade}`);
      } else if (trade.startsWith(cleanQuery)) {
        score += 80;
        matchReasons.push(`Início da Marca: ${trade}`);
      } else if (trade.includes(cleanQuery)) {
        score += 65;
        matchReasons.push(`Marca relacionada: ${trade}`);
      }
    });

    // 3. MATCH EM SUBSTÂNCIAS / FÓRMULAS QUÍMICAS FRACIONADAS (Ex: "metamizol", "ondansetrona", "cafeina", "fenilefrina")
    queryTokens.forEach(token => {
      if (token.length >= 3) {
        if (normActive.includes(token)) {
          score += 70;
          matchReasons.push(`Fórmula / Princípio Ativo: "${token}"`);
        }
        if (normName.includes(token)) {
          score += 60;
          matchReasons.push(`Nome contém: "${token}"`);
        }
        normTrades.forEach(t => {
          if (t.includes(token)) {
            score += 55;
            matchReasons.push(`Marca contém: "${token}"`);
          }
        });
      }
    });

    // 4. MAPEAMENTO SEMÂNTICO DE SINTOMAS, QUEIXAS LEIGAS E INTENÇÃO CLÍNICA
    normSymptoms.forEach(symp => {
      if (symp.includes(cleanQuery) || cleanQuery.includes(symp)) {
        score += 65;
        matchReasons.push(`Indicação Clínica para: ${symp}`);
      } else {
        queryTokens.forEach(token => {
          if (token.length >= 3 && symp.includes(token)) {
            score += 45;
            matchReasons.push(`Sintoma relacionado: ${symp}`);
          }
        });
      }
    });

    // 5. MAPEAMENTO POR DICIONÁRIO DE INTENÇÃO POPULAR (Ex: "remédio pro fígado", "remédio de pressão")
    for (const [intentKey, aliases] of Object.entries(CLINICAL_INTENT_SYNONYMS)) {
      const isMatchingIntent = aliases.some(alias => {
        const normAlias = normalizeText(alias);
        return cleanQuery.includes(normAlias) || normAlias.includes(cleanQuery);
      });
      if (isMatchingIntent) {
        if (aliases.some(alias => fullMedText.includes(normalizeText(alias)))) {
          score += 65;
          matchReasons.push(`Termo Popular / Queixa: "${cleanQuery}"`);
          break;
        }
      }
    }

    // 6. CORRESPONDÊNCIA DIRETA DE FORMA FARMACÊUTICA (Xarope, Gotas, Spray, Pomada, Sachê, etc.)
    const isDirectFormQuery = ['xarope', 'xaropes', 'gotas', 'spray', 'pomada', 'sache', 'saches', 'comprimido', 'comprimidos', 'solucao', 'capsula', 'capsulas', 'creme', 'colirio', 'efervescente', 'sublingual'].some(f => cleanQuery.includes(f));
    
    const hasMatchingForm = normForms.some(f => f.includes(cleanQuery) || (entities.form && f.includes(entities.form)));
    if (hasMatchingForm) {
      score += isDirectFormQuery ? 80 : 25;
      matchReasons.push(`Apresentação Farmacêutica em ${cleanQuery.toUpperCase()}`);
    }

    // 7. CORRESPONDÊNCIA DE CLASSE TERAPÊUTICA
    if (normClass.includes(cleanQuery)) {
      score += 50;
      matchReasons.push('Classe Terapêutica Correspondente');
    }

    // 8. FUZZY SEARCH (Tolerância a erros de digitação como "iboprofeno", "parasetamol", "buscopan", "dorflex")
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

    if (entities.dosage) {
      const hasDosage = (med.usualDosages || []).some(d => normalizeText(d).includes(entities.dosage)) ||
                        normForms.some(f => f.includes(entities.dosage));
      if (hasDosage) {
        score += 20;
        matchReasons.push(`Dosagem identificada (${entities.dosage})`);
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

  const limit = options.limit || 10;
  return filtered.slice(0, limit);
};
