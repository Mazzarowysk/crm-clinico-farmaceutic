// ─── MANUAL INTERATIVO POR ABAS (CRM CLÍNICO FARMACÊUTICO v3.0) ────────────────────────
import { getNexusAICopilotResponse } from './aiCopilot.js';

// Normalizador de strings e remoção de acentos
export const removeAccents = (str) => {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
};

// Dicionário de Expansão Semântica e Sinônimos Clínicos Farmacêuticos
export const SEMANTIC_SYNONYMS = {
  // CRM Clínico Farmacêutico & Balcão
  crm_farmacia: ['crm farmaceutico', 'crm clinico', 'atendimento farmacia', 'triagem farmaceutica', 'balcao', 'prontuario farmaceutico', 'declaracao de servico farmaceutico', 'dsf', 'cff 585', 'cff 586', 'prescricao farmaceutica', 'mips', 'medicamento isento de prescricao', 'red flags', 'sinais de alerta', 'encaminhamento medico', 'adesao', 'posologia'],
  // Motor CDSS 4D & Interações
  cdss: ['cdss', 'cdss 4d', 'motor cdss', 'interacao', 'interacoes', 'incompatibilidade', 'farmaco-farmaco', 'farmaco-alimento', 'farmaco-habito', 'duplicidade terapeutica', 'beers', 'criterios de beers', 'idosos', 'alergias cruzadas', 'bloqueio automatico', 'alerta vermelho', 'alerta amarelo', 'seguranca do paciente'],
  // Declaração de Serviço Farmacêutico (DSF)
  dsf: ['dsf', 'declaracao de servico farmaceutico', 'declaracao farmaceutica', 'cff 585', 'cff 586', 'crf', 'receita farmaceutica', 'impressao dsf', 'pdf dsf', 'hash cff', 'icp-brasil', 'autenticidade', 'termo de orientacao'],
  // Prontuário & Pacientes
  paciente: ['paciente', 'pacientes', 'cliente', 'cadastro', 'prontuario', 'alergias', 'comorbidades', 'historico medicamentoso', 'timeline', 'longitudinal', 'hipertensao', 'diabetes', 'alergia penicilina', 'alergia aine'],
  // Agenda & Serviços Clínicos
  agenda: ['agenda', 'agendamento', 'marcar horario', 'servicos clinicos', 'afericao pa', 'pressao arterial', 'glicemia capilar', 'injetaveis', 'aplicacao', 'consulta farmaceutica', 'revisao da farmacoterapia', 'testes rapidos'],
  // Métricas & Dashboard
  dashboard: ['metricas', 'indicadores', 'dashboard', 'graficos', 'kpi', 'volume de atendimentos', 'adesao', 'morisky', 'intervencoes', 'estatisticas', 'relatorio de gestao'],
  // Usuários, Gestão & Turso Cloud
  configuracoes: ['configuracoes', 'usuarios', 'operadores', 'gestao de usuarios', 'senha', 'master', 'mazzarowysk', 'rbac', 'turso', 'turso cloud', 'banco de dados', 'sincronizacao', 'backup', 'json', 'crf-sp', 'responsavel tecnico']
};

export const expandQueryTokens = (rawQuery) => {
  const qNorm = removeAccents(rawQuery);
  const words = qNorm.split(/\s+/).filter(Boolean);
  const expanded = new Set(words);

  words.forEach(word => {
    Object.entries(SEMANTIC_SYNONYMS).forEach(([key, synList]) => {
      const matchInList = synList.some(s => s === word || (word.length >= 4 && s.startsWith(word)) || (s.length >= 4 && word.startsWith(s)));
      if (matchInList || key === word) {
        synList.forEach(s => expanded.add(s));
        expanded.add(key);
      }
    });
  });

  return Array.from(expanded);
};

export const manualData = [
  {
    id: 'dashboard',
    title: 'Métricas do Consultório',
    icon: 'fa-chart-line',
    color: '#06b6d4',
    summary: 'Inteligência e indicadores clínicos: volume de procedimentos, taxa de adesão farmacoterapêutica, intervenções CDSS 4D e perfil de Red Flags.',
    roles: ['Master', 'Farmacêutico RT', 'Farmacêutico', 'Administrador'],
    buttons: [
      {
        icon: 'fa-chart-pie',
        name: '📊 Gráficos de Serviços Farmacêuticos',
        type: 'Inteligência Clínica',
        color: '#10b981',
        description: 'Visualiza a distribuição percentual de procedimentos clínicos mais demandados (PA, Glicemia, Injetáveis, Revisão de Farmacoterapia).',
        shortcut: 'Painel Superior do Dashboard',
        rules: 'Atualizado em tempo real a cada novo atendimento concluído.',
        keywords: ['graficos', 'servicos mais realizados', 'procedimentos', 'distribuicao', 'kpi']
      },
      {
        icon: 'fa-shield-virus',
        name: '🛡️ Painel de Intervenções CDSS 4D',
        type: 'Segurança do Paciente',
        color: '#f59e0b',
        description: 'Mede quantas interações graves, duplicidades e riscos em idosos (Critérios de Beers) foram prevenidos pelo sistema.',
        shortcut: 'Painel Central do Dashboard',
        rules: 'Evidencia o valor clínico e preventivo da atuação farmacêutica.',
        keywords: ['intervencoes evitadas', 'cdss metricas', 'alertas barrados', 'iatrogenia']
      },
      {
        icon: 'fa-sack-dollar',
        name: '💰 Faturamento & Lucratividade Clínica',
        type: 'Gestão Financeira',
        color: '#38bdf8',
        description: 'Acompanha o faturamento total gerado por consultas, serviços farmacêuticos (TLR/RDC 786) e venda de MIPs.',
        shortcut: 'Card de Receitas no Dashboard',
        rules: 'Integrado diretamente com o fluxo de caixa do módulo financeiro.',
        keywords: ['faturamento', 'lucratividade', 'receitas clinicas', 'servicos pagos', 'dre']
      }
    ],
    workflow: [
      { step: 1, title: 'Análise de Volume', desc: 'Acompanhe a evolução de consultas na semana e no mês.' },
      { step: 2, title: 'Monitoramento de Adesão', desc: 'Avalie a porcentagem de pacientes com adesão satisfatória ao tratamento.' },
      { step: 3, title: 'Relatório de Impacto Clínico', desc: 'Utilize as métricas para comprovar a eficácia das intervenções farmacêuticas.' }
    ],
    faq: [
      { q: 'Como são calculados os índices de intervenção?', a: 'O sistema contabiliza todas as vezes em que um alerta do motor CDSS 4D (interação grave, duplicidade ou alergia) impediu uma conduta inadequada.' }
    ]
  },
  {
    id: 'farmacia',
    title: 'CRM Farmacêutico & Balcão',
    icon: 'fa-prescription-bottle-medical',
    color: '#10b981',
    summary: 'Módulo central do consultório e balcão: Anamnese Farmacêutica, triagem de MIPs, checagem de Red Flags, Motor CDSS 4D e despacho por WhatsApp.',
    roles: ['Master', 'Farmacêutico RT', 'Farmacêutico', 'Atendente', 'Administrador'],
    buttons: [
      {
        icon: 'fa-user-check',
        name: '🩺 Anamnese Farmacêutica Rápida (SOAP)',
        type: 'Avaliação Clínica',
        color: '#10b981',
        description: 'Coleta queixa principal, início dos sintomas, histórico de tratamentos prévios e sinais vitais (PA, Glicemia, IMC).',
        shortcut: 'Sub-aba 1 no CRM Farmacêutico',
        rules: 'Permite selecionar paciente cadastrado ou atendimento avulso no balcão.',
        keywords: ['anamnese', 'queixa', 'sintomas', 'balcao', 'triagem', 'atendimento', 'avaliacao']
      },
      {
        icon: 'fa-shield-halved',
        name: '🛡️ Motor CDSS 4D em Tempo Real',
        type: 'Suporte à Decisão Clínica',
        color: '#f59e0b',
        description: 'Cruza 4 dimensões de segurança: Fármaco-Fármaco, Fármaco-Alimento, Fármaco-Hábito e Fármaco-Condição/Alergia. Bloqueia prescrições de risco e sugere alternativas seguras.',
        shortcut: 'Sub-aba 3 / Automático na Prescrição',
        rules: 'Alertas de risco maior exigem justificativa formal ou troca do medicamento.',
        keywords: ['cdss', 'motor 4d', 'interacao', 'alergia', 'duplicidade', 'beers', 'idosos', 'seguranca']
      },
      {
        icon: 'fa-triangle-exclamation',
        name: '🚨 Checagem de Red Flags (Sinais de Alerta)',
        type: 'Segurança & Encaminhamento',
        color: '#ef4444',
        description: 'Detecta sintomas que contraindicam a automedicação por MIPs (ex: dor precordial, febre > 3 dias, dispneia). Emite guia de encaminhamento médico imediato.',
        shortcut: 'Painel de Red Flags no Balcão',
        rules: 'Ao marcar um Red Flag, a prescrição de MIP é bloqueada com geração de Encaminhamento.',
        keywords: ['red flags', 'sinais de alerta', 'dor no peito', 'febre persistente', 'encaminhamento medico', 'urgencia']
      },
      {
        icon: 'fa-brands fa-whatsapp',
        name: '📲 Despacho Posológico via WhatsApp',
        type: 'Comunicação & Adesão',
        color: '#22c55e',
        description: 'Gera e envia a posologia completa, horários e recomendações de uso direto para o WhatsApp do paciente com layout limpo e emojis intuitivos.',
        shortcut: 'Botão "Enviar WhatsApp" no Balcão',
        rules: 'Formata a mensagem automaticamente com o nome da farmácia e CRF do farmacêutico.',
        keywords: ['whatsapp', 'posologia zap', 'mensagem paciente', 'horarios remedio', 'orientacao']
      },
      {
        icon: 'fa-syringe',
        name: '💉 Aplicação de Injetáveis & Vacinas (CFF 654)',
        type: 'Serviço Clínico',
        color: '#06b6d4',
        description: 'Registro de vacinas e injetáveis com lote, validade, via de administração, músculo de aplicação e emissão de comprovante DSF.',
        shortcut: 'Botão "Aplicar Injetável" no Balcão',
        rules: 'Gera comprovante com autenticação de acordo com a RDC 44/2009 da ANVISA.',
        keywords: ['vacina', 'injetavel', 'seringa', 'aplicacao', 'lote vacina', 'dsf vacinacao']
      }
    ],
    workflow: [
      { step: 1, title: 'Identificação & Queixa', desc: 'Selecione o paciente e registre o motivo da busca pelo serviço farmacêutico.' },
      { step: 2, title: 'Checagem de Red Flags', desc: 'Verifique se há sintomas graves que exigem encaminhamento médico imediato.' },
      { step: 3, title: 'Análise CDSS 4D', desc: 'Selecione o MIP ou serviço e verifique se há alertas de alergias ou interações.' },
      { step: 4, title: 'Emissão DSF & WhatsApp', desc: 'Conclua emitindo a Declaração de Serviço Farmacêutico (DSF) e enviando ao WhatsApp.' }
    ],
    faq: [
      { q: 'O que fazer quando o CDSS 4D emite um alerta vermelho?', a: 'O alerta vermelho indica contraindicação clínica absoluta. O sistema bloqueia a prescrição e recomenda substituir o medicamento ou encaminhar ao médico prescritor.' },
      { q: 'Como prescrever um MIP com segurança?', a: 'Certifique-se de que o paciente não apresenta Red Flags, confirme ausência de gravidez/lactação e revise as alergias cadastradas no prontuário.' }
    ]
  },
  {
    id: 'pacientes',
    title: 'Prontuário & Pacientes',
    icon: 'fa-user-nurse',
    color: '#38bdf8',
    summary: 'Cadastro longitudinal de saúde: dados clínicos, alergias estruturadas, condições crônicas, PBMs e acesso ao Portal do Paciente PWA.',
    roles: ['Master', 'Farmacêutico RT', 'Farmacêutico', 'Atendente', 'Administrador'],
    buttons: [
      {
        icon: 'fa-user-plus',
        name: '➕ Cadastrar Novo Paciente (Com Botão + PBM)',
        type: 'Cadastro Clínico',
        color: '#10b981',
        description: 'Registra o paciente com validação estrita de CPF, data de nascimento, celular/WhatsApp, endereço via CEP e inclusão rápida de novos PBMs pelo botão +.',
        shortcut: 'Botão no topo de Pacientes',
        rules: 'Valida CPF em tempo real e impede duplicidade de registros.',
        keywords: ['novo paciente', 'cadastrar', 'adicionar paciente', 'cpf', 'dados cadastrais', 'pbm']
      },
      {
        icon: 'fa-mobile-screen-button',
        name: '📱 Portal do Paciente PWA ("Minha Saúde")',
        type: 'Engajamento Digital',
        color: '#38bdf8',
        description: 'Visualização da carteirinha digital do paciente com histórico de DSF, lista de medicamentos em uso e despertador inteligente (+ Alarme).',
        shortcut: 'Botão "📱 Portal do Paciente PWA" no cabeçalho ou tabela',
        rules: 'Pode ser compartilhado por link com o paciente para acompanhamento móvel.',
        keywords: ['portal paciente', 'pwa', 'minha saude', 'carteirinha', 'alarmes', 'despertador remedio']
      },
      {
        icon: 'fa-allergies',
        name: '⚠️ Alergias & Comorbidades Estruturadas',
        type: 'Histórico de Risco',
        color: '#ef4444',
        description: 'Adiciona substâncias alergênicas (Penicilinas, AINEs, Dipirona, Sulfa) e doenças de base (Hipertensão, Diabetes, DRC, Asma) para cruzamento no CDSS.',
        shortcut: 'Card do Paciente / Prontuário',
        rules: 'Esses dados alimentam as travas automáticas do motor CDSS em qualquer atendimento futuro.',
        keywords: ['alergias', 'comorbidades', 'hipertensao', 'diabetes', 'penicilina', 'asma', 'alergia aine']
      },
      {
        icon: 'fa-timeline',
        name: '📅 Timeline do Cuidado Farmacoterapêutico',
        type: 'Histórico Longitudinal',
        color: '#818cf8',
        description: 'Visualização cronológica de todas as aferições de PA, glicemia, medicamentos em uso e DSF emitidas para o paciente.',
        shortcut: 'Aba Histórico no Prontuário',
        rules: 'Permite acompanhar a evolução dos parâmetros clínicos e adesão ao longo dos meses.',
        keywords: ['timeline', 'historico', 'evolucao', 'afericoes anteriores', 'longitudinal']
      }
    ],
    workflow: [
      { step: 1, title: 'Busca por CPF/Nome', desc: 'Digite o CPF ou nome do paciente na barra de busca.' },
      { step: 2, title: 'Atualização do Perfil Clínico', desc: 'Registre novas comorbidades, alergias relatadas e medicamentos em uso contínuo.' },
      { step: 3, title: 'Acesso Rápido ao Atendimento', desc: 'Clique em "Iniciar Atendimento" para abrir a tela de balcão já com o paciente selecionado.' }
    ],
    faq: [
      { q: 'Como cadastrar uma nova alergia?', a: 'Abra a ficha do paciente, clique no campo Alergias Conhecidas, selecione as classes (ex: Dipirona, AINEs) e salve as alterações.' },
      { q: 'O que o paciente consegue ver no Portal PWA?', a: 'Sua carteirinha digital, dados cadastrais, histórico de atendimentos, orientações do farmacêutico e alarmes configurados para tomar seus medicamentos nos horários certos.' }
    ]
  },
  {
    id: 'estoque',
    title: 'Controle de Estoque & Catálogo',
    icon: 'fa-boxes-stacked',
    color: '#fbbf24',
    summary: 'Gestão completa de insumos e medicamentos: Leitura de código de barras por Câmera/USB, lotes, validade, Curva ABC e ajustes rápidos de balanço.',
    roles: ['Master', 'Farmacêutico RT', 'Farmacêutico', 'Atendente', 'Administrador'],
    buttons: [
      {
        icon: 'fa-barcode',
        name: '📷 Leitor de Código de Barras (Câmera & USB)',
        type: 'Automação & Entrada',
        color: '#10b981',
        description: 'Permite escanear caixas de medicamentos e produtos diretamente pela câmera do celular/notebook ou leitor óptico USB.',
        shortcut: 'Botão "Escanear Câmera" nas telas de estoque e PDV',
        rules: 'Preenche instantaneamente os dados do medicamento e lote correspondente.',
        keywords: ['leitor barras', 'camera barcode', 'ean', 'scanner', 'bipagem']
      },
      {
        icon: 'fa-plus',
        name: '📦 Entrada de Estoque & Novos Lotes',
        type: 'Movimentação',
        color: '#38bdf8',
        description: 'Registra entradas de distribuidoras com quantidade recebida, número de lote, validade 2028, preço de custo e preço de venda sugerido.',
        shortcut: 'Sub-aba "Entrada de Estoque"',
        rules: 'Gera movimentação rastreável no Kardex de estoque da farmácia.',
        keywords: ['entrada estoque', 'novo lote', 'distribuidora', 'validade', 'preco custo']
      },
      {
        icon: 'fa-sliders',
        name: '⚖️ Ajuste Rápido de Saldo (Inventário / Avaria)',
        type: 'Controle Físico',
        color: '#f59e0b',
        description: 'Permite corrigir saldos físicos com justificativa formal (Inventário periódico, Quebra de frasco, Descarte por vencimento).',
        shortcut: 'Botão de Ajuste no card do produto',
        rules: 'Registra a operação com nome do operador e motivo para auditoria.',
        keywords: ['ajuste estoque', 'inventario', 'balanco', 'avaria', 'quebra']
      }
    ],
    workflow: [
      { step: 1, title: 'Bipagem ou Busca do Produto', desc: 'Aponte o leitor de código de barras ou digite o nome do medicamento.' },
      { step: 2, title: 'Conferência de Lote & Validade', desc: 'Verifique se o lote e a data de validade correspondem à nota fiscal.' },
      { step: 3, title: 'Confirmação de Saldo', desc: 'Salve a entrada para que o estoque fique disponível imediatamente para dispensação e prescrição.' }
    ],
    faq: [
      { q: 'O sistema avisa sobre produtos perto de vencer?', a: 'Sim! O painel de estoque possui badges em amarelo e vermelho para alertar sobre lotes com vencimento inferior a 90 dias.' }
    ]
  },
  {
    id: 'financeiro',
    title: 'Controle Financeiro & Fluxo de Caixa',
    icon: 'fa-sack-dollar',
    color: '#34d399',
    summary: 'Controle total de faturamento clínico e operacional: Abas Neon (Todos, Receitas, Despesas), Botões + para cadastro rápido de parâmetros e DRE em tempo real.',
    roles: ['Master', 'Farmacêutico RT', 'Administrador'],
    buttons: [
      {
        icon: 'fa-plus',
        name: '➕ Novo Lançamento Financeiro (Com Botão +)',
        type: 'Movimentação Financeira',
        color: '#10b981',
        description: 'Registra receitas (consultas, MIPs, testes rápidos) e despesas (distribuidoras, aluguel, salários) com seleção e criação rápida de categorias pelo botão +.',
        shortcut: 'Botão "Novo Lançamento" no topo do Financeiro',
        rules: 'Categorias e formas de pagamento criadas no botão + sincronizam automaticamente com as Configurações.',
        keywords: ['novo lancamento', 'receita', 'despesa', 'fluxo de caixa', 'categoria +', 'pagamento +']
      },
      {
        icon: 'fa-layer-group',
        name: '🌈 Abas Neon de Alto Contraste (Filtros Rápidos)',
        type: 'Visualização Clínica',
        color: '#38bdf8',
        description: 'Navegue com clareza entre "Todos os Lançamentos", "⬇️ Receitas & Faturamento" e "⬆️ Despesas & Compras".',
        shortcut: 'Abas superiores na tabela de extrato',
        rules: 'Calcula totais consolidados e saldo líquido instantaneamente.',
        keywords: ['abas neon', 'extrato', 'todas', 'receitas', 'despesas', 'filtro financeiro']
      },
      {
        icon: 'fa-file-invoice-dollar',
        name: '📄 Exportação de DRE & Demonstrativo Financeiro',
        type: 'Relatórios Financeiros',
        color: '#fbbf24',
        description: 'Gera relatório executivo em PDF com o demonstrativo de receitas por serviço, custos e margem líquida da farmácia.',
        shortcut: 'Botão "Exportar DRE (PDF)"',
        rules: 'Formatado com padrão executivo contábil para o gestor e contador.',
        keywords: ['dre', 'pdf financeiro', 'demonstrativo', 'lucro liquido', 'contabilidade']
      }
    ],
    workflow: [
      { step: 1, title: 'Escolha do Tipo', desc: 'Selecione se o lançamento é uma Receita (Entrada) ou Despesa (Saída).' },
      { step: 2, title: 'Categoria e Meio de Pagamento', desc: 'Selecione a categoria ou clique no botão + para criar uma nova no mesmo instante.' },
      { step: 3, title: 'Gravação & Sincronização', desc: 'Salve o lançamento para atualizar o saldo do caixa e sincronizar com a nuvem Turso.' }
    ],
    faq: [
      { q: 'O que acontece ao clicar no botão + dentro do lançamento?', a: 'O sistema solicita o nome da nova categoria ou forma de pagamento, salva no banco de dados, sincroniza com o Turso Cloud e a exibe no Agrupamento 7 da aba Configurações.' }
    ]
  },
  {
    id: 'relatorios',
    title: 'Declarações (DSF) & Relatórios',
    icon: 'fa-file-signature',
    color: '#f59e0b',
    summary: 'Emissão e autenticação de Declarações de Serviços Farmacêuticos (DSF) em conformidade com as Resoluções CFF 585 e 586/2013, com carimbo e hash de integridade.',
    roles: ['Master', 'Farmacêutico RT', 'Farmacêutico', 'Administrador'],
    buttons: [
      {
        icon: 'fa-file-pdf',
        name: '📜 Emitir Declaração de Serviço Farmacêutico (DSF)',
        type: 'Documentação Regulatória',
        color: '#f59e0b',
        description: 'Gera a DSF oficial com cabeçalho da farmácia, dados do paciente, parâmetros aferidos (PA/Glicemia), MIPs indicados, orientações e assinatura com CRF.',
        shortcut: 'Aba Relatórios / Botão "Emitir DSF" no Balcão',
        rules: 'Inclui Hash de Autenticidade e Carimbo de Tempo rastreável conforme normas do CFF.',
        keywords: ['dsf', 'declaracao farmaceutica', 'cff 585', 'cff 586', 'receita farmaceutica', 'imprimir dsf', 'pdf']
      },
      {
        icon: 'fa-file-excel',
        name: '📊 Exportar Relatório de Atendimentos (Excel/PDF)',
        type: 'Exportação & Gestão',
        color: '#10b981',
        description: 'Exporta a listagem completa de atendimentos clínicos, serviços executados, alertas CDSS acionados e desfechos para prestação de contas.',
        shortcut: 'Botões de Exportação na aba Relatórios',
        rules: 'Permite filtrar por período (mês, trimestre) e tipo de serviço.',
        keywords: ['exportar excel', 'relatorio pdf', 'prestacao de contas', 'vigilancia sanitaria', 'relatorio cff']
      }
    ],
    workflow: [
      { step: 1, title: 'Seleção do Atendimento', desc: 'Localize o atendimento concluído na listagem de declarações.' },
      { step: 2, title: 'Conferência dos Dados Clínicos', desc: 'Revise os valores aferidos, orientações posológicas e orientações não-farmacológicas.' },
      { step: 3, title: 'Impressão ou Envio Digital', desc: 'Imprima em papel timbrado ou gere o PDF assinado para envio ao paciente.' }
    ],
    faq: [
      { q: 'O que é a DSF e por que ela é obrigatória?', a: 'A DSF (Declaração de Serviço Farmacêutico) é o documento legal exigido pelo Conselho Federal de Farmácia (Resoluções 585/586) para comprovar a realização de serviços clínicos e prescrições de MIPs.' }
    ]
  },
  {
    id: 'configuracoes',
    title: 'Configurações & Gestão',
    icon: 'fa-sliders',
    color: '#a855f7',
    summary: 'Central de governança com 7 Agrupamentos Estruturados: Operadores RBAC, Turso Cloud, Dados da Farmácia & RT, Backup/Restauração, Protocolos Clínicos, Sandbox Simulador & Gestão de Parâmetros Financeiros.',
    roles: ['Master', 'Farmacêutico RT', 'Administrador'],
    buttons: [
      {
        icon: 'fa-users-gear',
        name: '👥 1. Gestão de Operadores & Perfis (RBAC)',
        type: 'Controle de Acesso',
        color: '#8b5cf6',
        description: 'Cadastra novos operadores, define papéis (Farmacêutico RT, Farmacêutico, Atendente), vincula número de CRF e reseta senhas.',
        shortcut: 'Agrupamento 1 em Configurações',
        rules: 'O usuário Master mazzarowysk possui autoridade total para administrar todos os operadores.',
        keywords: ['usuarios', 'operadores', 'novo usuario', 'senha', 'crf', 'rbac', 'permissoes', 'master', 'mazzarowysk']
      },
      {
        icon: 'fa-cloud-arrow-up',
        name: '☁️ 2. Banco Turso Cloud (LibSQL Distribuído)',
        type: 'Infraestrutura & Nuvem',
        color: '#38bdf8',
        description: 'Monitora a conexão com o cluster Turso Cloud na AWS. Dispara comparativo de versões (Modais Roxo/Laranja) ao entrar pelo Vercel.',
        shortcut: 'Agrupamento 2 em Configurações',
        rules: 'Operação Offline-First contínua com reconciliação automática de timestamps.',
        keywords: ['turso', 'nuvem', 'cloud', 'sincronizacao', 'offline-first', 'libsql', 'banco de dados']
      },
      {
        icon: 'fa-building-circle-check',
        name: '🏢 3. Dados da Farmácia & Responsável Técnico (RT)',
        type: 'Conformidade Sanitária',
        color: '#fbbf24',
        description: 'Configura Razão Social, CNPJ, Endereço, Nome do Farmacêutico RT e CRF-UF para inclusão automática nos cabeçalhos de DSF e relatórios.',
        shortcut: 'Agrupamento 3 em Configurações',
        rules: 'Obrigatório para emissão legal de DSF segundo a ANVISA (RDC 44/2009) e CFF.',
        keywords: ['dados farmacia', 'razao social', 'cnpj', 'responsavel tecnico', 'rt', 'crf-sp', 'cabecalho dsf']
      },
      {
        icon: 'fa-download',
        name: '💾 4. Backup & Restauração JSON',
        type: 'Segurança & Recuperação',
        color: '#c084fc',
        description: 'Gera arquivo de backup completo criptografado em JSON com todos os pacientes, prontuários, atendimentos e estoque, permitindo restauração instantânea.',
        shortcut: 'Agrupamento 4 em Configurações',
        rules: 'Recomenda-se exportar backups semanais para armazenamento seguro externo.',
        keywords: ['backup', 'restauracao', 'exportar json', 'recuperar dados', 'seguranca']
      },
      {
        icon: 'fa-book-medical',
        name: '📖 5. Manual Interativo & Protocolos Clínicos',
        type: 'CDSS & Procedimentos',
        color: '#34d399',
        description: 'Acesso aos 6 protocolos clínicos farmacêuticos embutidos (Gripe, Azia, Cefaleia, Rinite, Lombalgia, Diarreia) com árvores de decisão e dosagens.',
        shortcut: 'Agrupamento 5 em Configurações',
        rules: 'Totalmente alinhado às Resoluções CFF 585 e 586/2013.',
        keywords: ['protocolos clinicos', 'mips doses', 'orientacoes farmacologia', 'manual interativo']
      },
      {
        icon: 'fa-wand-magic-sparkles',
        name: '🧪 6. Simulação de Dados (Sandbox) & Limpeza com Senha',
        type: 'Testes & Gestão de Bases',
        color: '#f472b6',
        description: 'Gere dados simulados para treinamento ou limpe seletivamente simulações ou cadastros reais com autenticação por senha.',
        shortcut: 'Agrupamento 6 em Configurações',
        rules: 'Protegido por senha Master para evitar perdas acidentais.',
        keywords: ['simulador', 'sandbox', 'gerar dados', 'limpar simulacao', 'limpar producao', 'hard reset']
      },
      {
        icon: 'fa-tags',
        name: '🏷️ 7. Gestão de Parâmetros Financeiros (Receitas, Despesas & Meios)',
        type: 'Parâmetros & CRUD',
        color: '#10b981',
        description: 'Gerencie todas as categorias de receitas, despesas e formas de pagamento. Qualquer item criado via botão + é sincronizado e editável aqui.',
        shortcut: 'Agrupamento 7 em Configurações',
        rules: 'Permite editar, renomear e excluir parâmetros de faturamento do sistema.',
        keywords: ['parametros financeiros', 'categorias receitas', 'categorias despesas', 'formas de pagamento', 'editar categoria']
      }
    ],
    workflow: [
      { step: 1, title: 'Configuração da Farmácia', desc: 'Preencha os dados institucionais e o CRF do Responsável Técnico.' },
      { step: 2, title: 'Cadastro da Equipe', desc: 'Crie os usuários para os farmacêuticos e atendentes com seus respectivos papéis.' },
      { step: 3, title: 'Parâmetros Financeiros', desc: 'Defina suas categorias personalizadas de receitas, despesas e formas de pagamento.' },
      { step: 4, title: 'Sincronização & Backup', desc: 'Verifique o status verde da nuvem Turso e exporte cópias de segurança periódicas.' }
    ],
    faq: [
      { q: 'Quem pode criar ou resetar senhas de usuários?', a: 'Apenas usuários com perfil Master (ex: mazzarowysk) ou Administrador têm permissão para criar operadores e redefinir credenciais.' },
      { q: 'O sistema continua funcionando se a internet cair?', a: 'Sim! Graças à arquitetura Offline-First, o CRM Clínico Farmacêutico armazena tudo no banco local e faz a sincronização em segundo plano assim que a conexão retornar.' },
      { q: 'Como limpar dados de simulação sem apagar meus clientes reais?', a: 'No Agrupamento 6, clique em "Limpar Dados de Simulação" e digite sua senha. Somente registros com a tag [SIMULADO] serão removidos.' }
    ]
  }
];

// ─── MECANISMO DE BUSCA INTELIGENTE DO MANUAL ─────────────────────────────────
export const searchManualEngine = (query, userRole = 'Master') => {
  const qNorm = removeAccents(query);
  const tokens = expandQueryTokens(query);

  const buttonMatches = [];
  const tabMatches = [];
  const faqMatches = [];

  manualData.forEach(mod => {
    // 1. Match no Módulo
    const modTitleNorm = removeAccents(mod.title);
    const modSummNorm = removeAccents(mod.summary);
    if (modTitleNorm.includes(qNorm) || tokens.some(t => modTitleNorm.includes(t) || modSummNorm.includes(t))) {
      tabMatches.push(mod);
    }

    // 2. Match nos Botões
    mod.buttons.forEach(btn => {
      const nameNorm = removeAccents(btn.name);
      const descNorm = removeAccents(btn.description);
      const kwNorm = (btn.keywords || []).map(k => removeAccents(k));

      let score = 0;
      if (nameNorm.includes(qNorm)) score += 10;
      if (kwNorm.some(k => k.includes(qNorm))) score += 8;
      if (descNorm.includes(qNorm)) score += 5;

      tokens.forEach(tok => {
        if (nameNorm.includes(tok)) score += 4;
        if (kwNorm.some(k => k.includes(tok))) score += 3;
        if (descNorm.includes(tok)) score += 1;
      });

      if (score > 0) {
        buttonMatches.push({
          ...btn,
          _moduleId: mod.id,
          _moduleTitle: mod.title,
          _moduleColor: mod.color,
          _score: score
        });
      }
    });

    // 3. Match no FAQ
    (mod.faq || []).forEach(f => {
      const qN = removeAccents(f.q);
      const aN = removeAccents(f.a);
      if (qN.includes(qNorm) || aN.includes(qNorm) || tokens.some(t => qN.includes(t) || aN.includes(t))) {
        faqMatches.push({ item: f, module: mod });
      }
    });
  });

  buttonMatches.sort((a, b) => b._score - a._score);

  return { buttonMatches, tabMatches, faqMatches };
};

// ─── MODAL DO MANUAL INTERATIVO ───────────────────────────────────────────────
export const showInteractiveManualModal = (initialTabId = 'dashboard') => {
  const existing = document.getElementById('hn-interactive-manual-modal');
  if (existing) existing.remove();

  let activeTabId = initialTabId || 'dashboard';
  let searchQuery = '';

  const overlay = document.createElement('div');
  overlay.id = 'hn-interactive-manual-modal';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(4, 8, 16, 0.85); backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px); z-index: 999999; display: flex;
    align-items: center; justify-content: center; padding: 20px;
    animation: fadeIn 0.25s ease-out; font-family: 'Inter', system-ui, sans-serif;
  `;

  const renderModalContent = () => {
    const currentMod = manualData.find(m => m.id === activeTabId) || manualData[0];

    // Abas de navegação
    const navTabsHtml = manualData.map(m => {
      const isActive = m.id === currentMod.id;
      return `
        <button class="manual-nav-tab ${isActive ? 'active' : ''}" data-tab="${m.id}" style="
          padding: 8px 14px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 8px;
          font-weight: 700; font-size: 0.84rem; transition: all 0.2s; white-space: nowrap; border: 1px solid;
          background: ${isActive ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(13, 148, 136, 0.35))' : 'rgba(255,255,255,0.04)'};
          color: ${isActive ? '#f8fafc' : '#94a3b8'};
          border-color: ${isActive ? m.color : 'rgba(255,255,255,0.08)'};
          box-shadow: ${isActive ? `0 0 16px ${m.color}44` : 'none'};
        ">
          <i class="fa-solid ${m.icon}" style="color: ${m.color};"></i>
          <span>${m.title}</span>
        </button>
      `;
    }).join('');

    // Lista de cards das funcionalidades
    const buttonsListHtml = (currentMod.buttons || []).map(b => `
      <div style="
        background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px; padding: 16px; margin-bottom: 12px; transition: all 0.2s;
      " onmouseover="this.style.borderColor='${b.color}'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'; this.style.transform='none'">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="color: #f8fafc; font-size: 0.95rem; display: flex; align-items: center; gap: 10px;">
            <i class="fa-solid ${b.icon}" style="color: ${b.color}; font-size: 1.1rem;"></i>
            ${b.name}
          </strong>
          <span style="font-size: 0.7rem; background: rgba(255,255,255,0.08); color: ${b.color}; padding: 3px 9px; border-radius: 10px; font-weight: 700;">
            ${b.type}
          </span>
        </div>
        <p style="color: #cbd5e1; font-size: 0.84rem; line-height: 1.45; margin: 0 0 10px 0;">${b.description}</p>
        <div style="font-size: 0.76rem; color: #94a3b8; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <span>📍 <strong>Localização:</strong> ${b.shortcut}</span>
          <button class="manual-direct-sys-nav" data-target-tab="${currentMod.id}" style="
            background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4);
            padding: 4px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer;
          ">
            Acessar no Sistema ➔
          </button>
        </div>
      </div>
    `).join('');

    // Workflow passo a passo
    const workflowHtml = (currentMod.workflow || []).map((w, idx) => `
      <div style="display: flex; gap: 12px; margin-bottom: 14px;">
        <div style="
          width: 26px; height: 26px; border-radius: 50%; background: ${currentMod.color};
          color: #fff; font-weight: 800; font-size: 0.78rem; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; margin-top: 2px;
        ">${w.step}</div>
        <div>
          <strong style="color: #f8fafc; font-size: 0.86rem; display: block;">${w.title}</strong>
          <span style="color: #94a3b8; font-size: 0.8rem; line-height: 1.35; display: block; margin-top: 2px;">${w.desc}</span>
        </div>
      </div>
    `).join('');

    // FAQ
    const faqHtml = (currentMod.faq || []).map(f => `
      <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px; margin-bottom: 10px;">
        <strong style="color: #fbbf24; font-size: 0.84rem; display: block; margin-bottom: 4px;">❓ ${f.q}</strong>
        <p style="color: #cbd5e1; font-size: 0.78rem; margin: 0; line-height: 1.4;">${f.a}</p>
      </div>
    `).join('');

    overlay.innerHTML = `
      <div style="
        background: #0b0f19; border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 18px;
        width: 1100px; max-width: 95vw; height: 85vh; max-height: 850px; display: flex;
        flex-direction: column; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.9);
      ">
        <!-- HEADER DO MODAL -->
        <div style="
          padding: 16px 24px; background: rgba(15, 23, 42, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08); display: flex;
          align-items: center; justify-content: space-between; gap: 16px;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="
              width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #10b981, #0d9488);
              display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.2rem;
            ">
              <i class="fa-solid fa-book-medical"></i>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #f8fafc; font-family: 'Outfit', sans-serif;">
                Manual Operacional &amp; Protocolos Clínicos
              </h3>
              <span style="font-size: 0.75rem; color: #94a3b8;">Guia oficial de operação e diretrizes CFF 585/586</span>
            </div>
          </div>

          <button id="manual-modal-close" style="
            background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
            color: #94a3b8; width: 34px; height: 34px; border-radius: 8px; cursor: pointer;
            display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
          " onmouseover="this.style.color='#fff'; this.style.background='rgba(239, 68, 68, 0.25)'" onmouseout="this.style.color='#94a3b8'; this.style.background='rgba(255,255,255,0.06)'">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- BARRA DE ABAS -->
        <div style="
          padding: 10px 24px; background: rgba(15, 23, 42, 0.6);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08); display: flex;
          gap: 8px; overflow-x: auto; scrollbar-width: thin;
        ">
          ${navTabsHtml}
        </div>

        <!-- CORPO COM COLUNA DUPLA -->
        <div style="flex: 1; overflow-y: auto; padding: 24px; display: grid; grid-template-columns: 2fr 1fr; gap: 24px; scrollbar-width: thin;">
          
          <!-- COLUNA ESQUERDA: FUNCIONALIDADES -->
          <div>
            <div style="margin-bottom: 16px;">
              <h4 style="margin: 0 0 6px 0; font-size: 1.1rem; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid ${currentMod.icon}" style="color: ${currentMod.color};"></i>
                ${currentMod.title}
              </h4>
              <p style="margin: 0; font-size: 0.84rem; color: #94a3b8; line-height: 1.4;">${currentMod.summary}</p>
            </div>

            <div style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; color: ${currentMod.color}; letter-spacing: 0.5px; margin-bottom: 10px;">
              ⚙️ Recursos &amp; Ações do Módulo (${currentMod.buttons.length})
            </div>
            ${buttonsListHtml}
          </div>

          <!-- COLUNA DIREITA: PROTOCOLO & FAQ -->
          <div style="background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 18px; height: fit-content;">
            
            <!-- Protocolo Clínico Recomendado -->
            <div style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; color: #38bdf8; letter-spacing: 0.5px; margin-bottom: 14px; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-list-check"></i> Fluxo Recomendado
            </div>
            ${workflowHtml}

            <!-- Dúvidas Frequentes -->
            <div style="margin-top: 20px; font-size: 0.76rem; font-weight: 800; text-transform: uppercase; color: #fbbf24; letter-spacing: 0.5px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-circle-question"></i> Perguntas Frequentes (FAQ)
            </div>
            ${faqHtml}

            <div style="margin-top: 18px; text-align: center;">
              <button class="manual-direct-sys-nav" data-target-tab="${currentMod.id}" style="
                width: 100%; background: linear-gradient(135deg, #10b981 0%, #0d9488 100%);
                color: #ffffff; border: none; padding: 10px; border-radius: 10px; font-size: 0.85rem;
                font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
              ">
                Abrir Módulo no Sistema ➔
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    // Event listeners
    overlay.querySelectorAll('.manual-nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTabId = tab.dataset.tab;
        renderModalContent();
      });
    });

    overlay.querySelectorAll('.manual-direct-sys-nav').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.targetTab;
        if (targetTab && typeof window.switchTab === 'function') {
          overlay.remove();
          window.switchTab(targetTab);
        }
      });
    });

    const closeBtn = overlay.querySelector('#manual-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => overlay.remove());
    }
  };

  document.body.appendChild(overlay);
  renderModalContent();

  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
};

// Expor globalmente para o sistema
window.showInteractiveManualModal = showInteractiveManualModal;
