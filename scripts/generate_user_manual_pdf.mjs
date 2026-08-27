import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

async function generateUserManualPDF() {
  const outputPath = path.resolve('Manual_do_Usuario_CRM_Clinico_Farmaceutico.pdf');

  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Manual do Usuário — CRM Clínico Farmacêutico v3.0</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      color: #1e293b;
      background: #ffffff;
      font-size: 11.5px;
      line-height: 1.55;
    }
    
    @page {
      size: A4;
      margin: 12mm 14mm 12mm 14mm;
    }

    .page-break {
      page-break-after: always;
      break-after: page;
    }

    /* CAPA */
    .cover-container {
      height: 100%;
      min-height: 980px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: linear-gradient(145deg, #042f2e 0%, #0f172a 55%, #064e3b 100%);
      color: #ffffff;
      padding: 48px 36px;
      border-radius: 16px;
      border: 1.5px solid #14b8a6;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    .cover-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(45, 212, 191, 0.2);
      border: 1px solid rgba(45, 212, 191, 0.5);
      color: #2dd4bf;
      padding: 6px 16px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 1px;
      text-transform: uppercase;
      width: fit-content;
    }
    .cover-title {
      font-family: 'Outfit', sans-serif;
      font-size: 34px;
      font-weight: 900;
      margin: 18px 0 10px;
      color: #ffffff;
      letter-spacing: -0.8px;
      line-height: 1.15;
    }
    .cover-title span {
      color: #2dd4bf;
    }
    .cover-subtitle {
      font-size: 14.5px;
      color: #cbd5e1;
      max-width: 650px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .cover-features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 24px 0;
    }
    .cover-feature-item {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cover-feature-item i {
      font-size: 20px;
      color: #2dd4bf;
    }
    .cover-feature-text strong {
      display: block;
      color: #ffffff;
      font-size: 12px;
      font-family: 'Outfit', sans-serif;
    }
    .cover-feature-text span {
      color: #94a3b8;
      font-size: 10px;
    }
    .cover-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding-top: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 10.5px;
      color: #94a3b8;
    }
    .cover-footer strong {
      color: #2dd4bf;
    }

    /* SEÇÕES DE CONTEÚDO */
    .chapter-header {
      background: linear-gradient(135deg, #0f172a, #134e4a);
      color: #ffffff;
      padding: 10px 16px;
      border-radius: 10px;
      margin-top: 12px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-left: 5px solid #2dd4bf;
    }
    .chapter-title {
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 800;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .chapter-tag {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 6px;
      background: rgba(45, 212, 191, 0.2);
      color: #2dd4bf;
      border: 1px solid rgba(45, 212, 191, 0.4);
    }

    .situation-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .situation-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 12.5px;
      color: #0f172a;
    }
    .situation-header i {
      color: #0d9488;
      font-size: 14px;
    }
    .situation-context {
      font-size: 11px;
      color: #475569;
      margin-bottom: 8px;
      background: #f8fafc;
      padding: 6px 10px;
      border-radius: 6px;
      border-left: 3px solid #0284c7;
    }

    /* PASSOS */
    .steps-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin: 8px 0;
    }
    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 11px;
      color: #334155;
    }
    .step-num {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #0f766e;
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .step-text strong {
      color: #0f172a;
    }

    /* CAIXAS DE ALERTA */
    .alert-box {
      border-radius: 6px;
      padding: 6px 10px;
      margin: 6px 0;
      font-size: 10.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .alert-box-tip {
      background: #f0fdf4;
      border-left: 3px solid #10b981;
      color: #166534;
    }
    .alert-box-warn {
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
      color: #92400e;
    }
    .alert-box-danger {
      background: #fff1f2;
      border-left: 3px solid #f43f5e;
      color: #9f1239;
    }

    .key-badge {
      font-family: 'JetBrains Mono', monospace;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 1px 4px;
      border-radius: 4px;
      font-size: 10px;
      color: #0f766e;
      font-weight: 700;
    }

    /* TABELAS */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 10.5px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      text-align: left;
      padding: 5px 8px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }

    .footer-page {
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 14px;
      font-size: 9px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <!-- PÁGINA 1: CAPA OFICIAL & FICHA TÉCNICA -->
  <div class="cover-container">
    <div>
      <div class="cover-badge"><i class="fa-solid fa-book-medical"></i> Manual Oficial do Usuário &bull; Versão 3.0</div>
      <h1 class="cover-title">CRM Clínico <span>Farmacêutico</span></h1>
      <div class="cover-subtitle">
        Guia Operacional Passo a Passo para Prática Clínica Farmacêutica, Suporte à Decisão (CDSS 4D), Controle Financeiro com Abas Neon, Estoque com Barcode e Portal do Paciente PWA.
      </div>

      <div class="cover-features-grid">
        <div class="cover-feature-item">
          <i class="fa-solid fa-stethoscope"></i>
          <div class="cover-feature-text">
            <strong>Triagem Clínica SOAP &lt; 60s</strong>
            <span>Queixas comuns, sinais de alerta e anamnese guiada</span>
          </div>
        </div>
        <div class="cover-feature-item">
          <i class="fa-solid fa-shield-halved"></i>
          <div class="cover-feature-text">
            <strong>Motor de Interações CDSS 4D</strong>
            <span>Fármaco, alergias, comorbidades e hábitos</span>
          </div>
        </div>
        <div class="cover-feature-item">
          <i class="fa-solid fa-barcode"></i>
          <div class="cover-feature-text">
            <strong>Estoque com Barcode Scanner</strong>
            <span>Leitura por câmera/USB, lotes e curva ABC</span>
          </div>
        </div>
        <div class="cover-feature-item">
          <i class="fa-solid fa-sack-dollar"></i>
          <div class="cover-feature-text">
            <strong>Financeiro com Abas Neon</strong>
            <span>Receitas, Despesas, botões [+] e DRE gerencial</span>
          </div>
        </div>
        <div class="cover-feature-item">
          <i class="fa-solid fa-syringe"></i>
          <div class="cover-feature-text">
            <strong>Sala de Vacinas &amp; Injetáveis</strong>
            <span>Rastreabilidade de lote, RDC 786 e DSF Sanitária</span>
          </div>
        </div>
        <div class="cover-feature-item">
          <i class="fa-solid fa-mobile-screen-button"></i>
          <div class="cover-feature-text">
            <strong>Portal PWA "Minha Saúde"</strong>
            <span>Despertador de remédios, laudos e WhatsApp</span>
          </div>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div>
        <strong>Conformidade Regulatória:</strong> CFF 585/2013, CFF 586/2013, CFF 654/2018, ANVISA RDC 44/2009 &amp; RDC 786/2023.
      </div>
      <div>
        <strong>Edição:</strong> Agosto / 2026 &bull; Produção & Nuvem
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 2: SUMÁRIO OPERACIONAL & COCKPIT -->
  <div class="chapter-header">
    <h2 class="chapter-title"><i class="fa-solid fa-compass"></i> Sumário Operacional &amp; Linha de Cuidado Contínuo</h2>
    <span class="chapter-tag">Navegação Rápida</span>
  </div>

  <p style="color: #475569; margin-top: 4px;">
    Este manual foi estruturado por <strong>Situações Reais do Dia a Dia</strong> vivenciadas na farmácia comunitária e no consultório farmacêutico, organizando o fluxo de trabalho desde a chegada do cliente até o faturamento e envio de posologia.
  </p>

  <div class="situation-card">
    <div class="situation-header"><i class="fa-solid fa-layer-group"></i> Mapa dos 7 Módulos Principais do Sistema</div>
    <table>
      <thead>
        <tr>
          <th>Módulo / Aba</th>
          <th>Função Principal</th>
          <th>Atalho Principal</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1. 📊 Métricas do Consultório</strong></td>
          <td>Dashboard de BI com volume clínico, Morisky, bloqueios CDSS e faturamento.</td>
          <td>Aba Superior "Métricas"</td>
        </tr>
        <tr>
          <td><strong>2. 🩺 CRM &amp; Balcão SOAP</strong></td>
          <td>Triagem em 5 etapas, checagem de Red Flags e prescrição segura de MIPs.</td>
          <td>Aba "Balcão" ou <span class="key-badge">Ctrl+K</span></td>
        </tr>
        <tr>
          <td><strong>3. 👤 Prontuário &amp; PWA</strong></td>
          <td>Cadastro longitudinal, PBMs (com botão <span class="key-badge">+</span>) e Portal Minha Saúde.</td>
          <td>Aba "Pacientes"</td>
        </tr>
        <tr>
          <td><strong>4. 📦 Controle de Estoque</strong></td>
          <td>Scanner de código de barras, notas fiscais, lotes, validade e Curva ABC.</td>
          <td>Aba "Estoque"</td>
        </tr>
        <tr>
          <td><strong>5. 💰 Controle Financeiro</strong></td>
          <td>Abas Neon (<span class="key-badge">Todos</span>, <span class="key-badge">Receitas</span>, <span class="key-badge">Despesas</span>), botões <span class="key-badge">+</span> e DRE.</td>
          <td>Aba "Financeiro"</td>
        </tr>
        <tr>
          <td><strong>6. 📜 Declarações DSF</strong></td>
          <td>Emissão de DSF oficial com carimbo de CRF e Hash de Autenticidade sanitária.</td>
          <td>Aba "Relatórios"</td>
        </tr>
        <tr>
          <td><strong>7. ⚙️ Configurações</strong></td>
          <td>7 Agrupamentos: Operadores RBAC, Turso Cloud, Sandbox e Parâmetros.</td>
          <td>Aba "Configurações"</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="situation-card">
    <div class="situation-header"><i class="fa-solid fa-cubes-stacked"></i> O Cockpit Farmacêutico Flutuante (Barra Inferior)</div>
    <div class="situation-context">
      <strong>O que é:</strong> Uma barra de navegação rápida docked na parte inferior da tela que mantém o paciente em atendimento sempre em foco enquanto você navega entre as abas.
    </div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num"><i class="fa-solid fa-stethoscope"></i></div>
        <div class="step-text"><strong>Botão Balcão:</strong> Leva direto para a triagem SOAP e indicação do paciente ativo sem reiniciar o formulário.</div>
      </div>
      <div class="step-item">
        <div class="step-num"><i class="fa-solid fa-bolt"></i></div>
        <div class="step-text"><strong>Botão Interações:</strong> Abre o testador rápido CDSS 4D com as medicações e alergias do paciente já carregadas.</div>
      </div>
      <div class="step-item">
        <div class="step-num"><i class="fa-solid fa-notes-medical"></i></div>
        <div class="step-text"><strong>Botão Prontuário:</strong> Acessa o prontuário completo, histórico de aferições e linha do tempo.</div>
      </div>
      <div class="step-item">
        <div class="step-num"><i class="fa-brands fa-whatsapp"></i></div>
        <div class="step-text"><strong>Botão WhatsApp:</strong> Envia a posologia e receitas diretamente para o celular do paciente.</div>
      </div>
      <div class="step-item">
        <div class="step-num"><i class="fa-solid fa-xmark"></i></div>
        <div class="step-text"><strong>Botão Fechar (✕):</strong> Libera o paciente em foco e oculta a barra flutuante.</div>
      </div>
    </div>
  </div>

  <div class="footer-page">
    <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
    <div>Página 2</div>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 3: SITUAÇÕES 1 E 2 — ATENDIMENTO NO BALCÃO E RED FLAGS -->
  <div class="chapter-header">
    <h2 class="chapter-title"><i class="fa-solid fa-stethoscope"></i> Situações de Balcão: Triagem SOAP &amp; Sinais de Alerta</h2>
    <span class="chapter-tag">Clínica &amp; Balcão</span>
  </div>

  <div class="situation-card">
    <div class="situation-header"><i class="fa-solid fa-person-circle-question"></i> Situação 1: Cliente chega com uma queixa aguda no balcão</div>
    <div class="situation-context">
      <strong>Cenário:</strong> O cliente relata sintomas como gripe, dor de cabeça, azia ou tosse e busca orientação farmacêutica imediata.
    </div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">Acesse a aba <strong>Balcão</strong> ou use o atalho <span class="key-badge">Ctrl + K</span> e digite o nome/CPF do cliente na <strong>Etapa 1</strong>.</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">Na <strong>Etapa 2 (Queixas &amp; Sintomas)</strong>, clique no card do sintoma correspondente (ex: <em>Sintomas Gripais</em>, <em>Cefaleia</em>, <em>Dispepsia</em>).</div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">Defina o <strong>Tempo de Evolução</strong> em dias e selecione a <strong>Intensidade Relatada</strong> no seletor com ícones coloridos.</div>
      </div>
      <div class="step-item">
        <div class="step-num">4</div>
        <div class="step-text">Clique no botão azul <strong>"Checar Sinais de Alerta (Red Flags)"</strong> para prosseguir para a Etapa 3.</div>
      </div>
    </div>
    <div class="alert-box alert-box-tip">
      <i class="fa-solid fa-lightbulb"></i> <strong>Dica Clínica:</strong> O sistema possui 12 protocolos clínicos com tempo médio de resposta inferior a 60 segundos.
    </div>
  </div>

  <div class="situation-card">
    <div class="situation-header"><i class="fa-solid fa-triangle-exclamation"></i> Situação 2: Paciente apresenta sintomas graves (Red Flags)</div>
    <div class="situation-context">
      <strong>Cenário:</strong> Na Etapa 3, o paciente relata febre persistente (> 39°C por mais de 3 dias), dor súbita em facada ou falta de ar.
    </div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">Marque a caixa de seleção do sinal de alerta apresentado na lista da <strong>Etapa 3</strong>.</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">O sistema imediatamente <strong>bloqueia a indicação de MIPs</strong> e exibe o banner vermelho de emergência sanitária.</div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">Clique no botão <strong>"Emitir Guia de Encaminhamento Médico"</strong>.</div>
      </div>
      <div class="step-item">
        <div class="step-num">4</div>
        <div class="step-text">O sistema gera um documento PDF formal com os sinais aferidos, justificativa clínica e número do CRF para entrega ao médico.</div>
      </div>
    </div>
    <div class="alert-box alert-box-danger">
      <i class="fa-solid fa-shield-halved"></i> <strong>Exigência CFF:</strong> A resolução CFF 586/2013 proíbe a prescrição farmacêutica isolada na presença de sinais de alarme.
    </div>
  </div>

  <div class="footer-page">
    <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
    <div>Página 3</div>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 4: SITUAÇÕES 3 E 4 — PRESCRIÇÃO CDSS 4D E DISPARO WHATSAPP -->
  <div class="chapter-header">
    <h2 class="chapter-title"><i class="fa-solid fa-pills"></i> Prescrição Segura: Motor CDSS 4D &amp; Orientações</h2>
    <span class="chapter-tag">Segurança Farmacoterapêutica</span>
  </div>

  <div class="situation-card">
    <div class="situation-header"><i class="fa-solid fa-shield-virus"></i> Situação 3: Cruzamento de Interações Medicamentosas em Tempo Real</div>
    <div class="situation-context">
      <strong>Cenário:</strong> Na Etapa 4, o farmacêutico escolhe os MIPs sugeridos para o paciente, que já faz uso de medicamentos contínuos.
    </div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">Selecione o medicamento isento de prescrição clicando no botão <strong>"+ Prescrever"</strong>.</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">O motor <strong>CDSS 4D</strong> cruza instantaneamente a fórmula proposta com: <em>Uso Contínuo</em>, <em>Alergias Cadastradas</em>, <em>Comorbidades</em> e <em>Faixa Etária</em>.</div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">Caso surja um <strong>Alerta Vermelho de Interação Grave</strong> (ex: AINE para hipertenso ou alérgico a dipirona), a prescrição é travada preventivamente.</div>
      </div>
      <div class="step-item">
        <div class="step-num">4</div>
        <div class="step-text">O sistema sugere alternativas terapêuticas seguras (ex: Paracetamol no lugar de Ibuprofeno).</div>
      </div>
    </div>
    <div class="alert-box alert-box-warn">
      <i class="fa-solid fa-triangle-exclamation"></i> <strong>Critérios de Beers:</strong> Medicamentos potencialmente inapropriados para idosos são automaticamente alertados em amarelo.
    </div>
  </div>

  <div class="situation-card">
    <div class="situation-header"><i class="fa-brands fa-whatsapp"></i> Situação 4: Finalização do Atendimento e Envio de Posologia por WhatsApp</div>
    <div class="situation-context">
      <strong>Cenário:</strong> Atendimento concluído na Etapa 5 e o paciente deseja receber os horários e doses no celular.
    </div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">Na <strong>Etapa 5 (Conclusão &amp; DSF)</strong>, revise o resumo da consulta, medidas não-farmacológicas e parâmetros aferidos.</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">Clique em <strong>"Imprimir DSF Oficial (PDF)"</strong> para gerar a via impressa sanitária com carimbo e Hash.</div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">Clique no botão verde <strong>"Enviar Posologia via WhatsApp"</strong>.</div>
      </div>
      <div class="step-item">
        <div class="step-num">4</div>
        <div class="step-text">O sistema abre o WhatsApp com a mensagem formatada com emojis, horários, recomendações e link do Portal Minha Saúde.</div>
      </div>
    </div>
  </div>

  <div class="footer-page">
    <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
    <div>Página 4</div>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 5: SITUAÇÕES 5 E 6 — PRONTUÁRIO, PBMS E PORTAL DO PACIENTE PWA -->
  <div class="chapter-header">
    <h2 class="chapter-title"><i class="fa-solid fa-user-nurse"></i> Gestão de Clientes: Prontuário, PBMs &amp; Portal PWA</h2>
    <span class="chapter-tag">Cuidado Longitudinal</span>
  </div>

  <div class="situation-card">
    <div class="situation-header"><i class="fa-solid fa-address-card"></i> Situação 5: Cadastro de Cliente com Alergias e Convênio PBM</div>
    <div class="situation-context">
      <strong>Cenário:</strong> Cadastro de novo cliente que possui convênio corporativo ou desconto PBM (ex: Farmácia Popular, Vidalink, Orizon).
    </div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">Na aba <strong>Pacientes</strong>, clique no botão azul <strong>"Novo Cliente / Queixa"</strong>.</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">Preencha o <strong>Nome Completo</strong>, <strong>CPF</strong> (com validação automática de dígitos) e <strong>WhatsApp</strong>.</div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">No campo <strong>Programa / Convênio PBM</strong>, escolha o convênio ou clique no botão <span class="key-badge">+</span> ao lado para cadastrar um novo convênio instantaneamente.</div>
      </div>
      <div class="step-item">
        <div class="step-num">4</div>
        <div class="step-text">Preencha as <strong>Alergias Conhecidas</strong> (ex: Penicilinas, Sulfas, Dipirona) para ativação do escudo CDSS e salve.</div>
      </div>
    </div>
    <div class="alert-box alert-box-tip">
      <i class="fa-solid fa-star"></i> <strong>Sincronização Automática:</strong> Qualquer PBM cadastrado via botão <span class="key-badge">+</span> é salvo no banco local e na nuvem.
    </div>
  </div>

  <div class="situation-card">
    <div class="situation-header"><i class="fa-solid fa-mobile-screen-button"></i> Situação 6: Uso do Portal do Paciente PWA ("Minha Saúde")</div>
    <div class="situation-context">
      <strong>Cenário:</strong> Demonstração do aplicativo móvel do paciente para acompanhamento de alarmes e vacinas.
    </div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">Clique no botão azul <strong>"📱 Portal do Paciente PWA"</strong> no topo da aba de Pacientes ou na linha do cliente.</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">O simulador smartphone abre na tela exibindo as 4 abas: <em>Despertador</em>, <em>Aferições</em>, <em>Vacinas</em> e <em>Laudos DSF</em>.</div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">Na aba <strong>Despertador</strong>, clique em <strong>"+ Alarme"</strong> para programar lembretes de tomada de medicação.</div>
      </div>
      <div class="step-item">
        <div class="step-num">4</div>
        <div class="step-text">Ao clicar em <strong>"Tomar"</strong>, o sistema confirma com efeito sonoro de bip e calcula a <em>Taxa de Adesão</em> (Escala de Morisky).</div>
      </div>
    </div>
  </div>

  <div class="footer-page">
    <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
    <div>Página 5</div>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 6: SITUAÇÕES 7 E 8 — SALA DE VACINAS E CONTROLE DE ESTOQUE COM BARCODE -->
  <div class="chapter-header">
    <h2 class="chapter-title"><i class="fa-solid fa-boxes-stacked"></i> Operações: Sala de Vacinas &amp; Estoque com Barcode</h2>
    <span class="chapter-tag">Logística &amp; Rastreabilidade</span>
  </div>

  <div class="situation-card">
    <div class="situation-header"><i class="fa-solid fa-syringe"></i> Situação 7: Aplicação de Vacina ou Medicamento Injetável (CFF 654)</div>
    <div class="situation-context">
      <strong>Cenário:</strong> Paciente comparece para aplicação de vacina (ex: Gripe Tetravalente) ou injetável com receita médica.
    </div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">Clique no botão verde <strong>"💉 Vacinação"</strong> no cabeçalho ou na aba de procedimentos.</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">Selecione o paciente e o imunobiológico/injetável. Preencha o <strong>Número de Lote</strong>, <strong>Validade</strong> e <strong>Via de Administração</strong>.</div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">Realize a triagem pré-vacinal (avaliação de febre e alergias agudas a componentes como ovo).</div>
      </div>
      <div class="step-item">
        <div class="step-num">4</div>
        <div class="step-text">Clique em <strong>"Registrar Aplicação &amp; Emitir DSF"</strong>. O estoque é debitado e a carteirinha digital é atualizada.</div>
      </div>
    </div>
  </div>

  <div class="situation-card">
    <div class="situation-header"><i class="fa-solid fa-barcode"></i> Situação 8: Entrada de Mercadoria e Leitura por Código de Barras (EAN-13)</div>
    <div class="situation-context">
      <strong>Cenário:</strong> Chegada de medicamentos e necessidade de entrada rápida e conferência de inventário.
    </div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">Acesse a aba <strong>Estoque</strong> e clique em <strong>"📷 Leitor de Código de Barras"</strong> ou use um leitor USB padrão.</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">Aponte a câmera para o código de barras da caixa. O sistema emite um bip e localiza o produto no catálogo.</div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">Informe a quantidade de entrada, número do lote e data de validade da remessa.</div>
      </div>
      <div class="step-item">
        <div class="step-num">4</div>
        <div class="step-text">Salve o lançamento. O produto é classificado na <strong>Curva ABC</strong> e monitorado para alertas de vencimento (&lt; 90 dias).</div>
      </div>
    </div>
  </div>

  <div class="footer-page">
    <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
    <div>Página 6</div>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 7: SITUAÇÕES 9 E 10 — FINANCEIRO (ABAS NEON) E DRE -->
  <div class="chapter-header">
    <h2 class="chapter-title"><i class="fa-solid fa-sack-dollar"></i> Gestão Financeira: Abas Neon, Botões [+] &amp; DRE</h2>
    <span class="chapter-tag">Controladoria</span>
  </div>

  <div class="situation-card">
    <div class="situation-header"><i class="fa-solid fa-money-bill-transfer"></i> Situação 9: Lançamento de Receitas ou Despesas com Categorias Personalizadas</div>
    <div class="situation-context">
      <strong>Cenário:</strong> Lançamento de honorários de consultas, venda de serviços TLR ou despesas operacionais da farmácia.
    </div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">Acesse a aba <strong>Financeiro</strong>. Navegue entre as Abas Neon: <span class="key-badge">Todos</span>, <span class="key-badge">⬇️ Receitas</span> ou <span class="key-badge">⬆️ Despesas</span>.</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">Clique em <strong>"+ Novo Lançamento"</strong> para abrir o formulário com fundo escuro e tipografia nítida.</div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">Caso a <strong>Categoria</strong> ou a <strong>Forma de Pagamento</strong> desejada não existam, clique no botão <span class="key-badge">+</span> ao lado do campo.</div>
      </div>
      <div class="step-item">
        <div class="step-num">4</div>
        <div class="step-text">Digite o novo nome no prompt. O item é selecionado imediatamente no formulário e enviado para o <strong>Agrupamento 7 de Configurações</strong>.</div>
      </div>
    </div>
    <div class="alert-box alert-box-tip">
      <i class="fa-solid fa-check-double"></i> <strong>Sincronização em Tempo Real:</strong> Todos os itens criados via botão <span class="key-badge">+</span> recebem o selo <code>⭐ Personalizado</code> na central de configurações.
    </div>
  </div>

  <div class="situation-card">
    <div class="situation-header"><i class="fa-solid fa-file-invoice-dollar"></i> Situação 10: Emissão do DRE (Demonstrativo de Resultados) em PDF</div>
    <div class="situation-context">
      <strong>Cenário:</strong> Fechamento mensal de faturamento para análise contábil e apresentação aos sócios.
    </div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">No painel superior do Financeiro, filtre o <strong>Período</strong> desejado (ex: Mês Atual ou Últimos 3 Meses).</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">Clique no botão <strong>"📄 Exportar DRE em PDF"</strong>.</div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">O sistema compila as <em>Receitas Brutas Clínicas</em>, <em>Custos de Insumos</em>, <em>Despesas Fixas</em> e <em>Resultado Líquido</em> em PDF formatado.</div>
      </div>
    </div>
  </div>

  <div class="footer-page">
    <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
    <div>Página 7</div>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 8: SITUAÇÕES 11 E 12 — CONFIGURAÇÕES, NUVEM E HARD RESET -->
  <div class="chapter-header">
    <h2 class="chapter-title"><i class="fa-solid fa-sliders"></i> Governança: 7 Agrupamentos, Turso Cloud &amp; Hard Reset</h2>
    <span class="chapter-tag">Administração &amp; Segurança</span>
  </div>

  <div class="situation-card">
    <div class="situation-header"><i class="fa-solid fa-sitemap"></i> Situação 11: Gestão nos 7 Agrupamentos Estruturados de Configurações</div>
    <div class="situation-context">
      <strong>Cenário:</strong> Ajuste de permissões de operadores, dados do RT ou gestão de categorias financeiras.
    </div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">Acesse a aba <strong>Configurações</strong> para visualizar os 7 blocos modulares.</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-text"><strong>Agrupamento 1 (Operadores RBAC):</strong> Cadastre farmacêuticos, balconistas e administradores com restrições de tela.</div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-text"><strong>Agrupamento 2 (Nuvem Turso):</strong> Monitore o status da réplica LibSQL Edge e force sincronização manual.</div>
      </div>
      <div class="step-item">
        <div class="step-num">4</div>
        <div class="step-text"><strong>Agrupamento 7 (Parâmetros Financeiros):</strong> Edite ou exclua categorias e formas de pagamento criadas pelos operadores.</div>
      </div>
    </div>
  </div>

  <div class="situation-card">
    <div class="situation-header"><i class="fa-solid fa-triangle-exclamation"></i> Situação 12: Execução de Hard Reset Seguro (Limpeza Protegida por Senha)</div>
    <div class="situation-context">
      <strong>Cenário:</strong> Necessidade de zerar todos os atendimentos e transações de teste antes de iniciar o uso real da farmácia.
    </div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">No <strong>Agrupamento 6 (Ambiente de Demonstração &amp; Sandbox)</strong>, localize a seção vermelha <strong>"Hard Reset Total"</strong>.</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">Clique no botão vermelho <strong>"⚠️ Hard Reset Total"</strong>.</div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">O sistema solicitará a <strong>Senha Master de Confirmação</strong> (ex: senha do usuário Master).</div>
      </div>
      <div class="step-item">
        <div class="step-num">4</div>
        <div class="step-text">Após validar a senha, o sistema limpa 100% das tabelas operacionais, zera os gráficos e envia o banco zerado para o Turso Cloud.</div>
      </div>
    </div>
    <div class="alert-box alert-box-danger">
      <i class="fa-solid fa-lock"></i> <strong>Proteção de Dados:</strong> Usuários com login e configurações institucionais do RT são estritamente preservados para evitar bloqueio de acesso.
    </div>
  </div>

  <div class="footer-page">
    <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
    <div>Página 8</div>
  </div>

</body>
</html>`;

  try {
    const browser = await puppeteer.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: { top: '10mm', right: '12mm', bottom: '10mm', left: '12mm' },
      printBackground: true
    });
    await browser.close();
    console.log(`Manual do Usuário em PDF gerado com sucesso em: ${outputPath}`);
  } catch (err) {
    console.error('Erro ao gerar Manual do Usuário em PDF:', err);
  }
}

generateUserManualPDF();
