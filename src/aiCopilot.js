// 🤖 Pharma AI Knowledge Copilot Engine v3.0 — Suporte e Assistente Clínico Farmacêutico
export const getClinicalAICopilotResponse = (q, raw) => {
  let qNorm = q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Normalização de Sinônimos Comuns para expandir a compreensão da IA via PLN
  qNorm = qNorm.replace(/\b(farmaceutico|farmaceutica|atendente|balconista|responsavel tecnico|rt|operador|usuario|colaborador)\b/g, 'profissional');
  qNorm = qNorm.replace(/\b(remedio|droga|pilula|injecao|comprimido|farmaco|insumo|mips|mip)\b/g, 'medicamento');
  qNorm = qNorm.replace(/\b(cliente|doente|consulente|usuario sus)\b/g, 'paciente');
  qNorm = qNorm.replace(/\b(marcar|reservar)\b/g, 'agendar');
  qNorm = qNorm.replace(/\b(deletar|apagar|remover|desativar|inativar|desligar|limpar|lixeira|exclusao)\b/g, 'excluir');
  qNorm = qNorm.replace(/\b(adicionar|inserir|criar|incluir)\b/g, 'cadastrar');
  qNorm = qNorm.replace(/\b(alterar|modificar|atualizar|trocar|ajustar|mudar)\b/g, 'editar');
  qNorm = qNorm.replace(/\b(incompatibilidade|interacao medicamentosa|contraindicacao|cyp3a4|beers|duplicidade)\b/g, 'cdss');
  qNorm = qNorm.replace(/\b(zap|notificacao paciente|posologia celular|receita celular)\b/g, 'whatsapp');
  qNorm = qNorm.replace(/\b(declaracao|receita farmaceutica|cff 585|cff 586|crf)\b/g, 'dsf');

  // Helper: check if query contains ANY of the given tokens
  const has = (...tokens) => tokens.some(t => qNorm.includes(t));
  // Helper: check if query contains ALL of the given tokens
  const hasAll = (...tokens) => tokens.every(t => qNorm.includes(t));

  // ── INTENÇÃO: CDSS 4D / INTERAÇÕES / SEGURANÇA ────────────────────────
  if (has('cdss', 'interacao', 'alergia', 'duplicidade', 'beers', 'alimento', 'habito')) {
    return {
      title: 'Pharma AI Copilot — Motor de Decisão Clínica (CDSS 4D)',
      summary: `O motor <strong>CDSS 4D</strong> cruza em tempo real 4 dimensões de segurança:<br>
• <strong>Fármaco-Fármaco:</strong> Alertas de interações de grau maior e moderado (ex: Varfarina + AINEs).<br>
• <strong>Fármaco-Alimento:</strong> Cuidados com toranja (estatinas), leite/cálcio (quinolonas) e jejum (levotiroxina).<br>
• <strong>Fármaco-Hábito:</strong> Riscos com álcool (efeito antabuse com metronidazol) e tabaco (anticoncepcionais > 35 anos).<br>
• <strong>Duplicidade & Beers:</strong> Alerta de mesma classe terapêutica e riscos iatrogênicos em idosos (> 65 anos).`,
      actionText: '🩺 Ir para Balcão & CDSS',
      actionType: 'switchTab',
      actionTarget: 'farmacia'
    };
  }

  // ── INTENÇÃO: DECLARAÇÃO DSF / CFF 585 e 586 ───────────────────────────
  if (has('dsf', 'declaracao', 'cff', 'crf', 'receita', 'termo', 'pdf')) {
    return {
      title: 'Pharma AI Copilot — Declaração de Serviço Farmacêutico (DSF)',
      summary: `A <strong>DSF</strong> é emitida conforme as Resoluções CFF 585 e 586/2013:<br>
• Registra os parâmetros vitais aferidos (Pressão Arterial, Glicemia Capilar).<br>
• Documenta a indicação de MIPs com posologia clara e orientações não-farmacológicas.<br>
• Insere Hash de Integridade e Carimbo de Tempo para auditoria sanitária.`,
      actionText: '📜 Ir para Declarações (DSF)',
      actionType: 'switchTab',
      actionTarget: 'relatorios'
    };
  }

  // ── INTENÇÃO: GESTÃO DE USUÁRIOS & MASTER ──────────────────────────────
  if (has('usuario', 'operador', 'master', 'mazzarowysk', 'senha', 'rbac', 'permissao')) {
    return {
      title: 'Pharma AI Copilot — Gestão de Usuários & Operadores',
      summary: `A gestão de operadores é realizada na aba ⚙️ <strong>Configurações</strong>:<br>
• Usuário Master: <strong>mazzarowysk</strong> (acesso irrestrito e autoridade administrativa).<br>
• Cadastro de novos farmacêuticos com registro de CRF e atendentes.<br>
• Redefinição instantânea de senhas e auditoria de acessos.`,
      actionText: '⚙️ Ir para Configurações',
      actionType: 'switchTab',
      actionTarget: 'configuracoes'
    };
  }

  // ── INTENÇÃO: PACIENTE & CADASTRO ───────────────────────────────────────
  if (has('paciente', 'cadastrar', 'novo paciente', 'prontuario', 'alergia')) {
    return {
      title: 'Pharma AI Copilot — Prontuário & Pacientes',
      summary: `No módulo de <strong>Prontuário & Pacientes</strong> você pode:<br>
• Cadastrar novos pacientes com validação estrita de CPF e WhatsApp.<br>
• Adicionar alergias conhecidas e condições de saúde crônicas (Hipertensão, Diabetes).<br>
• Acompanhar a linha do tempo longitudinal de todas as consultas e aferições.`,
      actionText: '📋 Ir para Pacientes',
      actionType: 'switchTab',
      actionTarget: 'pacientes'
    };
  }

  // ── INTENÇÃO PADRÃO: BALCÃO / NAVEGAÇÃO GERAL ──────────────────────────
  return {
    title: 'Pharma AI Copilot — CRM Clínico Farmacêutico',
    summary: `Você buscou por <strong>"${raw}"</strong> no sistema. O CRM Clínico Farmacêutico possui 6 módulos integrados:<br>
• 🩺 <strong>CRM Farmacêutico:</strong> Balcão, Triagem de MIPs, Red Flags e CDSS 4D.<br>
• 📋 <strong>Prontuário & Pacientes:</strong> Histórico clínico, alergias e timeline.<br>
• 📅 <strong>Agenda:</strong> Serviços clínicos (PA, Glicemia, Injetáveis).<br>
• 📜 <strong>Declarações (DSF):</strong> Emissão e impressão oficial (CFF 585/586).<br>
• 📊 <strong>Métricas:</strong> Indicadores e gráficos do consultório.<br>
• ⚙️ <strong>Configurações:</strong> Gestão de usuários, Turso Cloud e Backup.`,
    actionText: '📖 Abrir Manual Interativo',
    actionType: 'openManual',
    actionTarget: 'farmacia'
  };
};
