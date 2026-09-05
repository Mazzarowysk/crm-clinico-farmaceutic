import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

function getBase64Image(filename) {
  const filePath = path.resolve('docs/manual_images', filename);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
  }
  return '';
}

async function generateCompleteUserManualPDF() {
  const outputPath = path.resolve('Manual_do_Usuario_CRM_Clinico_Farmaceutico.pdf');
  console.log('📄 Carregando capturas de tela em alta resolução...');

  const imgDashboard = getBase64Image('01-dashboard-metricas.png');
  const imgBalcao = getBase64Image('02-crm-balcao-cdss.png');
  const imgProntuario = getBase64Image('03-prontuario-telemetria.png');
  const imgTlr = getBase64Image('04-tlr-exames-laudo.png');
  const imgPosCare = getBase64Image('05-pos-atendimento-adesao.png');
  const imgDsf = getBase64Image('06-dsf-chancela-termica.png');
  const imgClientes = getBase64Image('07-clientes-prontuario.png');
  const imgEstoque = getBase64Image('08-estoque-suprimentos.png');
  const imgFinanceiro = getBase64Image('09-controle-financeiro.png');
  const imgSandbox = getBase64Image('10-configuracoes-sandbox.png');

  console.log('🖋️ Construindo manual operacional mestre de 21 páginas com ilustrações...');

  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Manual do Usuário Master — CRM Clínico Farmacêutico v3.1</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    @page {
      size: A4 portrait;
      margin: 0;
    }

    body {
      font-family: 'Inter', sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 8.6px;
      line-height: 1.33;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      padding: 8mm 12mm 7mm 12mm;
      page-break-after: always;
      break-after: page;
      box-sizing: border-box;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      background: #ffffff;
    }

    .page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    /* CAPA OFICIAL */
    .cover-container {
      background: linear-gradient(145deg, #022c22 0%, #091324 45%, #064e3b 100%);
      color: #ffffff;
      padding: 24px 22px;
      border-radius: 12px;
      border: 2px solid #14b8a6;
      box-sizing: border-box;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .cover-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: rgba(45, 212, 191, 0.2);
      border: 1px solid rgba(45, 212, 191, 0.5);
      color: #2dd4bf;
      padding: 5px 14px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 9px;
      letter-spacing: 1px;
      text-transform: uppercase;
      width: fit-content;
    }
    .cover-title {
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 900;
      margin: 10px 0 4px;
      color: #ffffff;
      letter-spacing: -0.8px;
      line-height: 1.15;
    }
    .cover-title span {
      color: #2dd4bf;
    }
    .cover-subtitle {
      font-size: 10.5px;
      color: #cbd5e1;
      max-width: 650px;
      line-height: 1.38;
      margin-bottom: 12px;
    }

    /* SELOS E BADGES */
    .badge-reg {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 7.6px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .badge-cff { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-anvisa { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .badge-tech { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
    .badge-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .badge-danger { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

    /* CABEÇALHOS INTERNOS */
    .page-header {
      border-bottom: 2px solid #0f766e;
      padding-bottom: 5px;
      margin-bottom: 7px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .page-header-title {
      font-family: 'Outfit', sans-serif;
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .page-header-title i {
      color: #0d9488;
      font-size: 16px;
    }
    .page-header-meta {
      font-size: 8px;
      font-weight: 700;
      color: #0f766e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* RODAPÉ DAS PÁGINAS */
    .footer-page {
      border-top: 1px solid #e2e8f0;
      padding-top: 4px;
      display: flex;
      justify-content: space-between;
      font-size: 7.4px;
      color: #64748b;
      font-weight: 600;
    }

    /* MOLDURA PARA PRINTS DAS TELAS */
    .screenshot-card {
      background: #0f172a;
      border: 1.5px solid #0284c7;
      border-radius: 9px;
      padding: 4px;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.15);
      margin: 6px 0;
      text-align: center;
    }
    .screenshot-card img {
      width: 100%;
      max-height: 98mm;
      object-fit: contain;
      border-radius: 6px;
      display: block;
    }
    .screenshot-caption {
      font-size: 7.4px;
      color: #94a3b8;
      font-weight: 600;
      padding: 3px 6px 1px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .screenshot-caption strong {
      color: #38bdf8;
    }

    /* CARDS E BLOCOS INFORMATIVOS */
    .card-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 7px 10px;
      margin-bottom: 6px;
    }
    .card-box-header {
      font-family: 'Outfit', sans-serif;
      font-size: 10px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .card-box-header i {
      color: #0d9488;
    }

    /* ALERTAS */
    .alert-banner {
      border-radius: 7px;
      padding: 6px 9px;
      margin: 5px 0;
      font-size: 8.2px;
      display: flex;
      align-items: flex-start;
      gap: 7px;
      line-height: 1.35;
    }
    .alert-banner i {
      font-size: 12px;
      margin-top: 1px;
    }
    .alert-info { background: #f0f9ff; border: 1px solid #bae6fd; color: #0369a1; }
    .alert-warning { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
    .alert-danger { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
    .alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }

    /* TABELAS */
    .manual-table {
      width: 100%;
      border-collapse: collapse;
      margin: 5px 0;
      font-size: 8px;
    }
    .manual-table th {
      background: #0f766e;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 4px 7px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      font-size: 7.5px;
    }
    .manual-table td {
      padding: 4px 7px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    .manual-table tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* GRID 2 COLUNAS */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 6px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 5px;
    }

    /* PASSOS NUMERADOS */
    .steps-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin: 4px 0;
    }
    .step-badge-item {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 5px 8px;
    }
    .step-circle {
      min-width: 17px;
      height: 17px;
      border-radius: 50%;
      background: #0f766e;
      color: #fff;
      font-weight: 800;
      font-size: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 1px;
    }
    .step-content strong {
      color: #0f172a;
    }
    .kbd-key {
      display: inline-block;
      padding: 1px 5px;
      font-size: 7.5px;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      color: #1e293b;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      box-shadow: 0 1px 0 rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>

  <!-- ===================================================================== -->
  <!-- PÁGINA 1: CAPA OFICIAL MASTER -->
  <!-- ===================================================================== -->
  <div class="page">
    <div class="cover-container">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="cover-badge"><i class="fa-solid fa-shield-heart"></i> Manual Técnico &amp; Operacional Master v3.1</div>
          <div style="font-size: 8px; font-weight: 700; color: #5eead4; letter-spacing: 1px;">FARMA LOGIC &bull; CRM CLÍNICO</div>
        </div>

        <h1 class="cover-title">
          CRM Clínico Farmacêutico<br>
          <span>Guia Operacional Ilustrado</span>
        </h1>
        <p class="cover-subtitle">
          Manual Completo de Prática Clínica, Triagem com Motor CDSS 4D, Telemetria Gráfica Longitudinal, Testes TLR (RDC 786/2023), Automação de Pós-Atendimento e Governança Farmacêutica Integrada.
        </p>

        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px;">
          <span class="badge-reg" style="background: rgba(45, 212, 191, 0.2); color: #2dd4bf; border: 1px solid #14b8a6;"><i class="fa-solid fa-scale-balanced"></i> Resoluções CFF 585/2013 &amp; 586/2013</span>
          <span class="badge-reg" style="background: rgba(251, 191, 36, 0.2); color: #fbbf24; border: 1px solid #f59e0b;"><i class="fa-solid fa-vial-virus"></i> RDC ANVISA 786/2023 (TLR)</span>
          <span class="badge-reg" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #0284c7;"><i class="fa-solid fa-notes-medical"></i> RDC ANVISA 44/2009</span>
          <span class="badge-reg" style="background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid #9333ea;"><i class="fa-solid fa-fingerprint"></i> Chancela ICP-Brasil &amp; GOV.BR</span>
        </div>
      </div>

      <!-- Sumário dos 10 Módulos na Capa -->
      <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(45, 212, 191, 0.35); border-radius: 10px; padding: 12px 14px;">
        <div style="font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 800; color: #2dd4bf; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
          <i class="fa-solid fa-layer-group"></i> Estrutura dos 10 Módulos Documentados com Imagens Reais:
        </div>
        <div class="grid-2" style="font-size: 7.8px; color: #e2e8f0; line-height: 1.45;">
          <div>
            <div><strong>01. Dashboard &amp; Métricas:</strong> Visão geral de produtividade e gráficos 3D</div>
            <div><strong>02. Balcão Clínico &amp; CDSS 4D:</strong> Triagem SOAP e motor de interações</div>
            <div><strong>03. Prontuário Eletrônico:</strong> Telemetria PAS/PAD e glicemia capilar</div>
            <div><strong>04. Testes TLR (RDC 786):</strong> Laudos, lote, validade e registro ANVISA</div>
            <div><strong>05. Automação Pós-Cuidado:</strong> Follow-up D+2 e Recompra D-5</div>
          </div>
          <div>
            <div><strong>06. DSF &amp; Impressão Térmica:</strong> Consulta em tela, ICP-Brasil e 80mm</div>
            <div><strong>07. Clientes &amp; Prontuários:</strong> Cadastro, alergias, PWA e WhatsApp</div>
            <div><strong>08. Estoque &amp; Insumos:</strong> Rastreabilidade FEFO, lotes e validade</div>
            <div><strong>09. Controle Financeiro:</strong> Faturamento clínico, receitas e DRE</div>
            <div><strong>10. Governança &amp; Sandbox:</strong> Usuários, Turso Cloud e Hard Reset Seguro</div>
          </div>
        </div>
      </div>

      <!-- Ficha Catalográfica e RT -->
      <div style="border-top: 1px solid rgba(255,255,255,0.15); padding-top: 10px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 7.5px; color: #94a3b8;">
        <div>
          <div><strong>Estabelecimento:</strong> Drogaria e Consultório Farmacêutico Modelo</div>
          <div><strong>Responsável Técnico:</strong> Farmacêutico Marcelo Mazaro &bull; <strong>CRF/SP:</strong> 54180</div>
          <div><strong>Autorização Sanitária:</strong> AFE ANVISA Regular &bull; <strong>Licença Sanitária Estadual:</strong> Vigente</div>
        </div>
        <div style="text-align: right;">
          <div><strong>Edição:</strong> Março/2026 &bull; Versão do Sistema: <strong>v3.1.0-prod</strong></div>
          <div style="color: #2dd4bf; font-weight: 700;">Tecnologia Offline-First com Sincronização Turso LibSQL Cloud</div>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 1 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 2: SUMÁRIO & MAPA DE TECLAS DE ATALHO -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-compass"></i> Sumário Analítico &amp; Mapa de Navegação</div>
        <div class="page-header-meta">Seção Preliminar</div>
      </div>

      <div class="card-box" style="margin-bottom: 8px;">
        <div class="card-box-header"><i class="fa-solid fa-list-ol"></i> Índice de Capítulos e Conteúdos</div>
        <table class="manual-table">
          <thead>
            <tr>
              <th style="width: 50px;">Pág.</th>
              <th>Capítulo / Módulo</th>
              <th>Foco Clínico, Operacional &amp; Sanitário</th>
              <th style="width: 80px;">Screenshot</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>03</td><td><strong>Fundamentos Regulatórios</strong></td><td>CFF 585/586, RDC 786/2023, RDC 44/2009, LGPD e Segurança ICP</td><td>Normativo</td></tr>
            <tr><td>04-05</td><td><strong>Módulo 1: Dashboard Clínico</strong></td><td>KPIs de adesão, 3D Donuts, esfera polar de alertas e produtividade</td><td>Figura 01</td></tr>
            <tr><td>06-07</td><td><strong>Módulo 2: Balcão &amp; CDSS 4D</strong></td><td>Triagem SOAP em 5 passos, Red Flags e cruzamento farmacológico</td><td>Figura 02</td></tr>
            <tr><td>08-09</td><td><strong>Módulo 3: Prontuário &amp; Telemetria</strong></td><td>Curvas gráficas PAS/PAD, glicemia, anotações de evolução protegidas</td><td>Figura 03</td></tr>
            <tr><td>10-11</td><td><strong>Módulo 4: Testes TLR (RDC 786)</strong></td><td>Reagentes, lote/validade, metodologia, laudo oficial vetorial</td><td>Figura 04</td></tr>
            <tr><td>12-13</td><td><strong>Módulo 5: Automação Pós-Cuidado</strong></td><td>Follow-up D+2 em 48h e Alerta de Recompra D-5 com WhatsApp direto</td><td>Figura 05</td></tr>
            <tr><td>14-15</td><td><strong>Módulo 6: DSF &amp; Cupom Térmico</strong></td><td>Consulta em tela pré-impressão, chancela digital e bobina 80mm</td><td>Figura 06</td></tr>
            <tr><td>16-17</td><td><strong>Módulo 7: Gestão de Clientes</strong></td><td>Busca unificada, motor NLP de queixas, PWA e cartão de alergias</td><td>Figura 07</td></tr>
            <tr><td>18</td><td><strong>Módulo 8: Estoque &amp; Insumos</strong></td><td>Rastreabilidade FEFO, controle de validade e reposição clínica</td><td>Figura 08</td></tr>
            <tr><td>19</td><td><strong>Módulo 9: Controle Financeiro</strong></td><td>Faturamento clínico dissociado, faturamento MIPs e DRE gerencial</td><td>Figura 09</td></tr>
            <tr><td>20</td><td><strong>Módulo 10: Governança &amp; Hard Reset</strong></td><td>Perfis RBAC, Turso Cloud e processo seguro de Hard Reset de fábrica</td><td>Figura 10</td></tr>
            <tr><td>21</td><td><strong>Checklist &amp; Resolução de Dúvidas</strong></td><td>Rotina diária do RT, plano de contingência e suporte operacional</td><td>Guia Rápido</td></tr>
          </tbody>
        </table>
      </div>

      <div class="card-box">
        <div class="card-box-header"><i class="fa-solid fa-keyboard"></i> Mapa Universal de Teclas de Atalho (Acesso Ultra Rápido)</div>
        <p style="font-size: 8px; color: #475569; margin-bottom: 6px;">
          O CRM Clínico Farmacêutico foi desenhado para operação ágil no balcão sem necessidade constante de mouse. Utilize os atalhos de teclado:
        </p>
        <div class="grid-2">
          <div class="steps-row">
            <div class="step-badge-item">
              <span class="kbd-key">Ctrl + K</span>
              <div class="step-content"><strong>Busca Universal (Spotlight):</strong> Localiza clientes por CPF, nome, prontuário, medicamentos e comandos em qualquer tela.</div>
            </div>
            <div class="step-badge-item">
              <span class="kbd-key">F2</span>
              <div class="step-content"><strong>Balcão Clínico &amp; Atendimento:</strong> Abre imediatamente o funil de triagem SOAP e suporte à decisão clínica.</div>
            </div>
            <div class="step-badge-item">
              <span class="kbd-key">F3</span>
              <div class="step-content"><strong>Clientes &amp; Prontuário:</strong> Alterna para a listagem e cadastro de pacientes.</div>
            </div>
            <div class="step-badge-item">
              <span class="kbd-key">F4</span>
              <div class="step-content"><strong>Estoque &amp; Suprimentos:</strong> Acessa o catálogo, saldos físicos e entradas por lote.</div>
            </div>
          </div>
          <div class="steps-row">
            <div class="step-badge-item">
              <span class="kbd-key">F6</span>
              <div class="step-content"><strong>Controle Financeiro / Caixa:</strong> Visualiza entradas, saídas e faturamento de consultas.</div>
            </div>
            <div class="step-badge-item">
              <span class="kbd-key">F10</span>
              <div class="step-content"><strong>Venda Rápida / Saída PDV:</strong> Conclui dispensação de medicamentos com emissão de comprovante.</div>
            </div>
            <div class="step-badge-item">
              <span class="kbd-key">F12</span>
              <div class="step-content"><strong>Alternar Modo Visual / Noturno:</strong> Transita entre o tema escuro clínico e o tema solar claro.</div>
            </div>
            <div class="step-badge-item">
              <span class="kbd-key">F1</span>
              <div class="step-content"><strong>Manual Interativo &amp; Ajuda:</strong> Abre a central interativa de instruções e tutoriais.</div>
            </div>
          </div>
        </div>
      </div>

      <div class="alert-banner alert-info" style="margin-top: 6px;">
        <i class="fa-solid fa-circle-info"></i>
        <div>
          <strong>Dica Operacional de Produtividade:</strong> No balcão, pressione <span class="kbd-key">Ctrl+K</span>, digite os 3 primeiros dígitos do CPF do cliente e aperte <span class="kbd-key">Enter</span> para carregar imediatamente a ficha do paciente e seus alertas de alergia!
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 2 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 3: FUNDAMENTOS REGULATÓRIOS & SEGURANÇA JURÍDICA -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-gavel"></i> Fundamentos Regulatórios &amp; Segurança Sanitária</div>
        <div class="page-header-meta">Marco Legal &amp; Boas Práticas</div>
      </div>

      <div class="alert-banner alert-success" style="margin-bottom: 7px;">
        <i class="fa-solid fa-shield-check"></i>
        <div>
          <strong>Conformidade Regulatória Total:</strong> O CRM Clínico Farmacêutico atende rigorosamente às diretrizes do Conselho Federal de Farmácia (CFF) e da Agência Nacional de Vigilância Sanitária (ANVISA), conferindo total respaldo jurídico e ético à prescrição farmacêutica e aos testes rápidos.
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 8px;">
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-book-medical"></i> Resolução CFF nº 585/2013</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            Regulamenta as <strong>atribuições clínicas do farmacêutico</strong> nos serviços de saúde:
          </p>
          <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li>Realização de anamnese farmacêutica e verificação de sinais vitais (PA, glicemia, temperatura).</li>
            <li>Identificação, avaliação e intervenção sobre Problemas Relacionados a Medicamentos (PRM).</li>
            <li>Elaboração e pactuação do Plano de Cuidado Farmacêutico com o paciente.</li>
            <li>Emissão da <strong>Declaração de Serviço Farmacêutico (DSF)</strong> como documento probatório.</li>
          </ul>
        </div>

        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-file-signature"></i> Resolução CFF nº 586/2013</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            Regula a <strong>prescrição farmacêutica</strong> de Medicamentos Isentos de Prescrição (MIPs):
          </p>
          <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li>Prescrição autônoma de MIPs, fitoterápicos e suplementos nutricionais.</li>
            <li>Obrigatoriedade de registro em prontuário e entrega de cópia assinada ao usuário.</li>
            <li>Vedação expressa de prescrição de medicamentos sob controle especial (Portaria 344/98).</li>
            <li>Apoio e encaminhamento médico imediato diante de sinais de alerta (Red Flags).</li>
          </ul>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 8px;">
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-vial-circle-check"></i> RDC ANVISA nº 786/2023 (TLR)</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            Nova regulamentação para <strong>Exames de Análises Clínicas (EAC) e TLR em Farmácias</strong>:
          </p>
          <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li>Ambiente privativo (consultório farmacêutico) com alvará sanitário atualizado.</li>
            <li>Rastreabilidade obrigatória: Registro do Lote, Data de Validade e Registro ANVISA do kit.</li>
            <li>Emissão de Laudo Técnico assinado digitalmente pelo Farmacêutico RT.</li>
            <li>Caracterização do teste como triagem de apoio, sem valor de diagnóstico nosológico definitivo.</li>
          </ul>
        </div>

        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-lock"></i> LGPD &amp; Assinatura Digital ICP-Brasil</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            Segurança de dados sensíveis em saúde (Lei nº 13.709/2018):
          </p>
          <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li>Consentimento informado do paciente armazenado no prontuário eletrônico.</li>
            <li>Criptografia de dados locais e transmissão segura via TLS 1.3 para a nuvem.</li>
            <li>Identificador Hash SHA-256 e QR Code em conformidade com o Validador de Documentos Digitais do CFF/ITÍ.</li>
            <li>Segregação estrita de privilégios de acesso por papel operacional (RBAC).</li>
          </ul>
        </div>
      </div>

      <div class="alert-banner alert-warning">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div>
          <strong>Aviso Sanitário Importante:</strong> Todos os registros clínicos efetuados no sistema possuem validade jurídica de prontuário eletrônico de saúde e devem ser guardados pelo prazo mínimo de 20 (vinte) anos conforme a legislação sanitária brasileira vigente.
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 3 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 4: MÓDULO 1 — DASHBOARD & INTELIGÊNCIA CLÍNICA (PARTE 1) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-chart-pie"></i> Módulo 1: Dashboard &amp; Inteligência Clínica</div>
        <div class="page-header-meta">Visão Geral &amp; Métricas</div>
      </div>

      <p style="font-size: 8.4px; color: #334155; margin-bottom: 6px;">
        O painel de <strong>Métricas &amp; Inteligência Clínica do Consultório</strong> consolida em tempo real os principais indicadores da assistência farmacêutica, permitindo ao Responsável Técnico e à gestão monitorar a segurança dos atendimentos, a resolutividade das condutas e a rentabilidade do consultório.
      </p>

      <!-- Screenshot 1 -->
      <div class="screenshot-card">
        <img src="${imgDashboard}" alt="Tela de Dashboard e Métricas Clínicas">
        <div class="screenshot-caption">
          <span><strong>Figura 01:</strong> Dashboard Executivo com KPIs Clínicos, Donut 3D de Procedimentos e Esfera Polar CDSS 4D.</span>
          <span>Resolução Nativa 1600x960 &bull; Modo Escuro Clínico</span>
        </div>
      </div>

      <div class="grid-2" style="margin-top: 6px;">
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-heart-pulse"></i> Indicadores Farmacoterapêuticos Principais</div>
          <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.38;">
            <li><strong>Clientes Cadastrados:</strong> Volume total de pacientes com prontuário ativo no sistema.</li>
            <li><strong>Atendimentos Clínicos:</strong> Consultas realizadas com triagem, evolução ou MIPs orientados.</li>
            <li><strong>Intervenções CDSS 4D:</strong> Riscos iatrogênicos, interações e alergias bloqueadas pelo motor inteligente.</li>
            <li><strong>Declarações DSF (CFF):</strong> Total de declarações oficiais emitidas no período.</li>
            <li><strong>Taxa de Adesão Terapêutica:</strong> Pontuação média Morisky calculada sobre a base de pacientes crônicos.</li>
          </ul>
        </div>

        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-cube"></i> Gráficos Interativos 3D</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            Visualizações tridimensionais renderizadas via Canvas/SVG de alto desempenho:
          </p>
          <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.38;">
            <li><strong>Rosca 3D Glossy (Donut):</strong> Distribuição percentual dos serviços clínicos (Aferição de PA, Glicemia Capilar, Aplicação de Injetáveis, Revisão da Farmacoterapia, Testes TLR).</li>
            <li><strong>Esfera Polar 3D Esmaltada:</strong> Alertas do motor CDSS 4D categorizados (Fármaco-Fármaco, Fármaco-Hábito, Duplicidade Terapêutica, Alergia Cruzada).</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 4 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 5: MÓDULO 1 — DASHBOARD & INTELIGÊNCIA CLÍNICA (PARTE 2) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-chart-line"></i> Módulo 1: Operação do Dashboard &amp; Relatórios</div>
        <div class="page-header-meta">Rotina Operacional &amp; Análise</div>
      </div>

      <div class="card-box" style="margin-bottom: 8px;">
        <div class="card-box-header"><i class="fa-solid fa-arrow-pointer"></i> Interatividade e Navegação Direta a partir do Dashboard</div>
        <p style="font-size: 8.2px; color: #334155; margin-bottom: 6px;">
          Cada elemento do dashboard atua como um atalho dinâmico para aprofundamento analítico e tomada de decisão:
        </p>
        <div class="steps-row">
          <div class="step-badge-item">
            <div class="step-circle">1</div>
            <div class="step-content"><strong>Clique em "Clientes Cadastrados":</strong> Redireciona imediatamente para a aba de Clientes com filtro pré-aplicado para busca ágil.</div>
          </div>
          <div class="step-badge-item">
            <div class="step-circle">2</div>
            <div class="step-content"><strong>Clique em "Atendimentos Clínicos":</strong> Abre o extrato cronológico com todos os atendimentos, queixas relatadas e condutas finais adotadas.</div>
          </div>
          <div class="step-badge-item">
            <div class="step-circle">3</div>
            <div class="step-content"><strong>Clique em "Intervenções CDSS 4D":</strong> Abre a lista de segurança sanitária contendo todos os alertas de perigo farmacológico evitados pelo farmacêutico.</div>
          </div>
          <div class="step-badge-item">
            <div class="step-circle">4</div>
            <div class="step-content"><strong>Botão "Central de Relatórios":</strong> Permite emitir relatórios consolidados em formato PDF para vigilância sanitária, prestação de contas e diretoria.</div>
          </div>
          <div class="step-badge-item">
            <div class="step-circle">5</div>
            <div class="step-content"><strong>Botão "Ir para Balcão &amp; CDSS":</strong> Inicia um novo ciclo de atendimento farmacêutico em menos de 1 segundo.</div>
          </div>
        </div>
      </div>

      <div class="card-box" style="margin-bottom: 8px;">
        <div class="card-box-header"><i class="fa-solid fa-sliders"></i> Barra Superior de Controles e Filtros de Ambiente</div>
        <table class="manual-table">
          <thead>
            <tr>
              <th style="width: 140px;">Controle / Filtro</th>
              <th>Função no Sistema</th>
              <th style="width: 120px;">Impacto Operacional</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Frente vs Gestão vs Todos</strong></td>
              <td>Alterna a visibilidade dos módulos da barra lateral para adequar ao perfil do operador.</td>
              <td>Simplifica a interface do balconista e farmacêutico de balcão.</td>
            </tr>
            <tr>
              <td><strong>Busca no Sistema (Ctrl+K)</strong></td>
              <td>Paleta de comando universal com busca fonética em toda a base de dados.</td>
              <td>Acesso imediato sem cliques de menu.</td>
            </tr>
            <tr>
              <td><strong>Manual Interativo</strong></td>
              <td>Abre a gaveta interativa com tutoriais passo a passo em tela.</td>
              <td>Treinamento imediato de novos operadores.</td>
            </tr>
            <tr>
              <td><strong>Indicador de Sincronização</strong></td>
              <td>Exibe status da réplica local com o cluster Turso Cloud em tempo real.</td>
              <td>Garante segurança de dados e auditoria de réplica.</td>
            </tr>
            <tr>
              <td><strong>Alternador de Tema (Sol/Lua)</strong></td>
              <td>Alterna entre modo escuro (alta fidelidade visual) e modo claro (impressão/alto contraste).</td>
              <td>Conforto ergonômico visual durante longas jornadas.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="alert-banner alert-info">
        <i class="fa-solid fa-lightbulb"></i>
        <div>
          <strong>Recomendação de Gestão:</strong> Avalie o gráfico de intervenções CDSS mensalmente. Estabelecimentos que demonstram alto índice de intervenções com bloqueio de interações reportam 40% mais fidelização de clientes crônicos pela percepção de segurança clínica oferecida pelo farmacêutico!
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 5 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 6: MÓDULO 2 — BALCÃO CLÍNICO & MOTOR CDSS 4D (PARTE 1) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-stethoscope"></i> Módulo 2: Balcão Clínico &amp; Motor CDSS 4D</div>
        <div class="page-header-meta">Triagem Rápida &lt; 60s</div>
      </div>

      <p style="font-size: 8.4px; color: #334155; margin-bottom: 6px;">
        O <strong>Balcão Farmacêutico &amp; Suporte à Decisão Clínica (CDSS 4D)</strong> é o coração operacional da assistência farmacêutica. O funil foi estruturado para que um farmacêutico conduza um acolhimento clínico completo, seguro e resolutivo em menos de 60 segundos.
      </p>

      <!-- Screenshot 2 -->
      <div class="screenshot-card">
        <img src="${imgBalcao}" alt="Balcão Clínico e Motor CDSS 4D">
        <div class="screenshot-caption">
          <span><strong>Figura 02:</strong> Balcão de Atendimento Clínico: Funil em 5 Etapas, Busca Rápida por CPF e Cards de Pacientes com Alertas de Alergia.</span>
          <span>Módulo Frente de Loja &bull; Atalho F2</span>
        </div>
      </div>

      <div class="card-box" style="margin-top: 6px;">
        <div class="card-box-header"><i class="fa-solid fa-route"></i> O Funil Clínico em 5 Etapas Estruturadas</div>
        <div class="grid-2">
          <div class="steps-row">
            <div class="step-badge-item">
              <div class="step-circle">1</div>
              <div class="step-content"><strong>Entrada &amp; Identificação:</strong> Busca pelo CPF ou nome do paciente. O sistema carrega instantaneamente o histórico, comorbidades crônicas e alergias severas cadastradas.</div>
            </div>
            <div class="step-badge-item">
              <div class="step-circle">2</div>
              <div class="step-content"><strong>Queixas &amp; Sintomas:</strong> Seleção rápida das queixas comuns (Cefaleia, Gripe, Dispepsia, Dor Lombar, etc.) ou digitação livre com interpretação automática via NLP de sintomas.</div>
            </div>
            <div class="step-badge-item">
              <div class="step-circle">3</div>
              <div class="step-content"><strong>Validação de Red Flags:</strong> Checagem imediata de sinais de alarme clínicos (ex: dor torácica irradiada, rigidez de nuca) que exigem encaminhamento médico de urgência.</div>
            </div>
          </div>
          <div class="steps-row">
            <div class="step-badge-item">
              <div class="step-circle">4</div>
              <div class="step-content"><strong>Cruzamento Farmacológico &amp; MIPs:</strong> O motor CDSS 4D analisa a medicação proposta cruzando com o uso contínuo do paciente e dispara alertas coloridos de severidade.</div>
            </div>
            <div class="step-badge-item">
              <div class="step-circle">5</div>
              <div class="step-content"><strong>Conclusão &amp; DSF Oficial:</strong> Geração automática do plano de cuidado farmacêutico, impressão da Declaração (DSF) ou envio via WhatsApp.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 6 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 7: MÓDULO 2 — MOTOR DE INTERAÇÕES 4D & RED FLAGS (PARTE 2) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-shield-virus"></i> Módulo 2: Motor CDSS 4D &amp; Segurança do Paciente</div>
        <div class="page-header-meta">Prevenção Iatrogênica</div>
      </div>

      <div class="card-box" style="margin-bottom: 8px;">
        <div class="card-box-header"><i class="fa-solid fa-network-wired"></i> As 4 Dimensões de Análise do Motor CDSS</div>
        <p style="font-size: 8.2px; color: #334155; margin-bottom: 6px;">
          Diferente de simples checadores de bulas, o motor do CRM Clínico cruza 4 eixos simultâneos antes de permitir a recomendação terapêutica:
        </p>
        <div class="grid-2">
          <div class="card-box" style="background: #ffffff; border-left: 3px solid #ef4444;">
            <strong style="color: #b91c1c; font-size: 9px;"><i class="fa-solid fa-pills"></i> Dimensão 1: Fármaco-Fármaco</strong>
            <p style="font-size: 7.8px; color: #475569; margin-top: 3px;">
              Detecta interações farmacodinâmicas e farmacocinéticas (ex: AINE + Anti-hipertensivo inibindo efeito diurético; Fluoxetina + Tramadol elevando risco de síndrome serotoninérgica).
            </p>
          </div>
          <div class="card-box" style="background: #ffffff; border-left: 3px solid #f59e0b;">
            <strong style="color: #b45309; font-size: 9px;"><i class="fa-solid fa-utensils"></i> Dimensão 2: Fármaco-Alimento &amp; Hábitos</strong>
            <p style="font-size: 7.8px; color: #475569; margin-top: 3px;">
              Avisa sobre interações com leite/cálcio (absorção de quinolonas e ferro), alimentos ricos em tiramina, álcool e tabagismo.
            </p>
          </div>
          <div class="card-box" style="background: #ffffff; border-left: 3px solid #06b6d4;">
            <strong style="color: #0e7490; font-size: 9px;"><i class="fa-solid fa-person-breastfeeding"></i> Dimensão 3: Condição Fisiológica / Gestação</strong>
            <p style="font-size: 7.8px; color: #475569; margin-top: 3px;">
              Bloqueia medicamentos contraindicados em lactantes, gestantes (categorias C, D e X) e pacientes idosos (Critérios de Beers).
            </p>
          </div>
          <div class="card-box" style="background: #ffffff; border-left: 3px solid #8b5cf6;">
            <strong style="color: #6d28d9; font-size: 9px;"><i class="fa-solid fa-triangle-exclamation"></i> Dimensão 4: Alergia Severa &amp; Cruzada</strong>
            <p style="font-size: 7.8px; color: #475569; margin-top: 3px;">
              Alerta de risco vital caso o medicamento ou seus derivados possuam correlação com alergias cadastradas do paciente (ex: Penicilinas, Dipirona, Sulfa).
            </p>
          </div>
        </div>
      </div>

      <div class="card-box" style="margin-bottom: 8px;">
        <div class="card-box-header"><i class="fa-solid fa-triangle-exclamation" style="color: #dc2626;"></i> Protocolo Obrigatório de Red Flags (Sinais de Alarme)</div>
        <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
          Caso o paciente apresente qualquer uma das condições abaixo, o sistema <strong>bloqueia a prescrição de MIPs</strong> e emite o Termo de Encaminhamento Médico Imediato:
        </p>
        <table class="manual-table">
          <thead>
            <tr>
              <th>Queixa Apresentada</th>
              <th>Sinais de Alarme (Red Flags) Detectados</th>
              <th>Conduta Farmacêutica Mandatória</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Cefaleia</strong></td>
              <td>Início súbito tipo "trovoada", perda de força motora, rigidez de nuca, febre alta associada.</td>
              <td><span class="badge-reg badge-danger">Encaminhamento Urgência (UPA/SAMU)</span></td>
            </tr>
            <tr>
              <td><strong>Dor Torácica / Digestiva</strong></td>
              <td>Dor em aperto com irradiação para mandíbula ou braço esquerdo, sudorese fria, dispneia.</td>
              <td><span class="badge-reg badge-danger">Bloqueio Total &bull; Suspeita IAM</span></td>
            </tr>
            <tr>
              <td><strong>Tosse / Respiratório</strong></td>
              <td>Hemoptise (escarro com sangue), estridor respiratório, febre persistente &gt; 5 dias.</td>
              <td><span class="badge-reg badge-anvisa">Encaminhamento Pneumológico</span></td>
            </tr>
            <tr>
              <td><strong>Diarreia / Vômitos</strong></td>
              <td>Sinais evidentes de desidratação severa, sangue nas fezes, confusão mental.</td>
              <td><span class="badge-reg badge-anvisa">Hidratação Oral + Suporte Hospitalar</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="alert-banner alert-danger">
        <i class="fa-solid fa-hand"></i>
        <div>
          <strong>Bloqueio Ético &amp; Legal:</strong> O farmacêutico nunca deve prescrever MIPs diante de um Red Flag ativo. O sistema registra no histórico que o paciente foi orientado e encaminhado à rede hospitalar, resguardando o profissional civil e criminalmente.
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 7 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 8: MÓDULO 3 — PRONTUÁRIO ELETRÔNICO & TELEMETRIA GRÁFICA (PARTE 1) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-folder-medical"></i> Módulo 3: Prontuário &amp; Telemetria Gráfica</div>
        <div class="page-header-meta">Acompanhamento Farmacoterapêutico</div>
      </div>

      <p style="font-size: 8.4px; color: #334155; margin-bottom: 6px;">
        O <strong>Prontuário &amp; Histórico Clínico do Paciente</strong> permite a gestão longitudinal completa da saúde do indivíduo, reunindo dados cadastrais, alergias, evoluções clínicas, histórico de dispensações e o monitoramento gráfico dos parâmetros vitais.
      </p>

      <!-- Screenshot 3 -->
      <div class="screenshot-card">
        <img src="${imgProntuario}" alt="Prontuário Eletrônico e Telemetria de PA e Glicemia">
        <div class="screenshot-caption">
          <span><strong>Figura 03:</strong> Janela Modal de Prontuário Clínico: Ficha do Paciente, Alergias Cadastradas, Nova Evolução e Telemetria Gráfica de PA e Glicemia.</span>
          <span>Acesso via Lista de Clientes ou Botão Prontuário</span>
        </div>
      </div>

      <div class="grid-2" style="margin-top: 6px;">
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-address-card"></i> Identificação &amp; Ficha do Paciente</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            Cabeçalho com os dados essenciais para validação de identidade:
          </p>
          <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li><strong>Nome Completo e CPF:</strong> Chave primária para rastreamento no Sistema Único e convênios.</li>
            <li><strong>Data de Nascimento e Idade:</strong> Ajuste automático de dosagens geriátricas ou pediátricas.</li>
            <li><strong>Contatos Rápidos:</strong> Link direto com o WhatsApp para acompanhamento contínuo.</li>
            <li><strong>Alerta Destacado de Alergias:</strong> Tarja vermelha visível em todas as telas do prontuário.</li>
          </ul>
        </div>

        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-pen-to-square"></i> Evolução &amp; Anotação Clínica</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            Espaço para registro narrativo do raciocínio farmacêutico:
          </p>
          <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li>Registro do método SOAP (Subjetivo, Objetivo, Avaliação e Plano).</li>
            <li>Assinatura com data, hora e identificação do farmacêutico logado.</li>
            <li>Imutabilidade após salvamento para atendimento às normas do CFF.</li>
            <li>Botão para anexar exames laboratoriais complementares externos (PDF ou imagem).</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 8 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 9: MÓDULO 3 — TELEMETRIA GRÁFICA & METAS TERAPÊUTICAS (PARTE 2) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-chart-line-up"></i> Módulo 3: Telemetria Gráfica Longitudinal</div>
        <div class="page-header-meta">Monitoramento Contínuo</div>
      </div>

      <div class="card-box" style="margin-bottom: 8px;">
        <div class="card-box-header"><i class="fa-solid fa-gauge-high"></i> Painel de Telemetria de Sinais Vitais</div>
        <p style="font-size: 8.2px; color: #334155; margin-bottom: 6px;">
          O painel de telemetria analisa todas as aferições históricas do paciente e plota curvas evolutivas para avaliação de eficácia terapêutica:
        </p>
        <div class="grid-4" style="margin-bottom: 8px;">
          <div class="card-box" style="text-align: center; background: #f0fdf4; border-color: #bbf7d0;">
            <div style="font-size: 7.5px; font-weight: 700; color: #166534; text-transform: uppercase;">Última PA</div>
            <div style="font-size: 14px; font-weight: 900; color: #15803d; font-family: 'Outfit', sans-serif;">125/82</div>
            <div style="font-size: 7px; color: #166534;">mmHg &bull; Ótima</div>
          </div>
          <div class="card-box" style="text-align: center; background: #eff6ff; border-color: #bfdbfe;">
            <div style="font-size: 7.5px; font-weight: 700; color: #1e40af; text-transform: uppercase;">Média PA Histórica</div>
            <div style="font-size: 14px; font-weight: 900; color: #1d4ed8; font-family: 'Outfit', sans-serif;">129/84</div>
            <div style="font-size: 7px; color: #1e40af;">mmHg &bull; 3 aferições</div>
          </div>
          <div class="card-box" style="text-align: center; background: #fefce8; border-color: #fef08a;">
            <div style="font-size: 7.5px; font-weight: 700; color: #854d0e; text-transform: uppercase;">Última Glicemia</div>
            <div style="font-size: 14px; font-weight: 900; color: #a16207; font-family: 'Outfit', sans-serif;">98</div>
            <div style="font-size: 7px; color: #854d0e;">mg/dL &bull; Jejum Normal</div>
          </div>
          <div class="card-box" style="text-align: center; background: #f5f3ff; border-color: #ddd6fe;">
            <div style="font-size: 7.5px; font-weight: 700; color: #5b21b6; text-transform: uppercase;">Exames TLR</div>
            <div style="font-size: 14px; font-weight: 900; color: #6d28d9; font-family: 'Outfit', sans-serif;">3</div>
            <div style="font-size: 7px; color: #5b21b6;">Protocolo RDC 786</div>
          </div>
        </div>
      </div>

      <div class="card-box" style="margin-bottom: 8px;">
        <div class="card-box-header"><i class="fa-solid fa-code-compare"></i> Parâmetros e Metas Clínicas Recomendadas (CFF / SBC / SBD)</div>
        <table class="manual-table">
          <thead>
            <tr>
              <th>Parâmetro Clínico</th>
              <th>Faixa de Normalidade</th>
              <th>Faixa Limítrofe / Atenção</th>
              <th>Faixa Crítica (Intervenção Imediata)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Pressão Sistólica (PAS)</strong></td>
              <td>&lt; 120 mmHg</td>
              <td>121 a 139 mmHg (Pré-hipertensão)</td>
              <td>&ge; 140 mmHg ou &ge; 180 mmHg (Crise)</td>
            </tr>
            <tr>
              <td><strong>Pressão Diastólica (PAD)</strong></td>
              <td>&lt; 80 mmHg</td>
              <td>81 a 89 mmHg</td>
              <td>&ge; 90 mmHg ou &ge; 110 mmHg (Crise)</td>
            </tr>
            <tr>
              <td><strong>Glicemia de Jejum</strong></td>
              <td>70 a 99 mg/dL</td>
              <td>100 a 125 mg/dL (Glicemia de Jejum Alterada)</td>
              <td>&ge; 126 mg/dL ou &lt; 54 mg/dL (Hipoglicemia)</td>
            </tr>
            <tr>
              <td><strong>Hemoglobina Glicada (HbA1c)</strong></td>
              <td>&lt; 5.7%</td>
              <td>5.7% a 6.4% (Pré-diabetes)</td>
              <td>&ge; 6.5% (Diabetes não controlado)</td>
            </tr>
            <tr>
              <td><strong>Colesterol Total</strong></td>
              <td>&lt; 190 mg/dL</td>
              <td>190 a 239 mg/dL</td>
              <td>&ge; 240 mg/dL</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="alert-banner alert-success">
        <i class="fa-solid fa-circle-check"></i>
        <div>
          <strong>Valor Agregado do Acompanhamento Longitudinal:</strong> Mostrar o gráfico de evolução na tela ao paciente idoso ou hipertenso reforça a adesão ao tratamento, demonstrando visualmente o impacto positivo da correta administração dos medicamentos prescritos pelo médico.
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 9 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 10: MÓDULO 4 — TESTES LABORATORIAIS REMOTOS / TLR (PARTE 1) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-vial-virus"></i> Módulo 4: Testes Laboratoriais Remotos (TLR)</div>
        <div class="page-header-meta">RDC ANVISA nº 786/2023</div>
      </div>

      <p style="font-size: 8.4px; color: #334155; margin-bottom: 6px;">
        O módulo de <strong>Testes Laboratoriais Remotos (TLR)</strong> capacita a farmácia a registrar, laudar e rastrear exames rápidos de triagem clínica com absoluto rigor sanitário, gerando o Laudo Técnico Oficial com validade jurídica em conformidade com a RDC ANVISA nº 786/2023.
      </p>

      <!-- Screenshot 4 -->
      <div class="screenshot-card">
        <img src="${imgTlr}" alt="Modal de Registro e Emissão de Laudo TLR">
        <div class="screenshot-caption">
          <span><strong>Figura 04:</strong> Janela Modal de Testes Rápidos TLR: Rastreabilidade de Lote, Validade, Registro ANVISA, Parecer Farmacêutico e Emissão de Laudo PDF.</span>
          <span>Conformidade RDC 786/2023 ANVISA</span>
        </div>
      </div>

      <div class="grid-2" style="margin-top: 6px;">
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-boxes-stacked"></i> Campos Sanitários Obrigatórios do Reagente</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            A ANVISA exige o registro inequívoco dos insumos utilizados:
          </p>
          <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li><strong>Tipo de Teste Rápido:</strong> Seleção do analito a ser investigado.</li>
            <li><strong>Lote do Kit Reagente:</strong> Identificador gravado na embalagem do dispositivo.</li>
            <li><strong>Data de Validade do Lote:</strong> O sistema bloqueia a execução caso o lote esteja expirado.</li>
            <li><strong>Registro ANVISA do Produto:</strong> Número oficial do registro sanitário do Ministério da Saúde.</li>
            <li><strong>Metodologia Empregada:</strong> Imunoturbidimetria, Imunocromatografia ou Fluorescência.</li>
          </ul>
        </div>

        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-file-invoice"></i> Conteúdo do Laudo Técnico Oficial</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            Estrutura gerada automaticamente no arquivo PDF:
          </p>
          <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li>Identificação completa do estabelecimento farmacêutico (CNPJ, RT, CRF e Endereço).</li>
            <li>Dados do paciente e data/hora exata da coleta capilar ou swab.</li>
            <li>Resultado qualitativo e quantitativo acompanhado dos valores de referência.</li>
            <li>Parecer farmacêutico circunstanciado com orientações de encaminhamento.</li>
            <li>Declaração sanitária legal obrigatória sobre caráter de triagem.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 10 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 11: MÓDULO 4 — CATÁLOGO DE TESTES TLR & ROTINA SANITÁRIA (PARTE 2) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-microscope"></i> Módulo 4: Catálogo de TLR &amp; Validação Sanitária</div>
        <div class="page-header-meta">Catálogo Clínico</div>
      </div>

      <div class="card-box" style="margin-bottom: 8px;">
        <div class="card-box-header"><i class="fa-solid fa-list-check"></i> Testes Laboratoriais Remotos Homologados no Sistema</div>
        <table class="manual-table">
          <thead>
            <tr>
              <th>Teste Laboratorial (TLR)</th>
              <th>Amostra Biológica</th>
              <th>Metodologia Técnica</th>
              <th>Finalidade Clínica na Farmácia</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Glicemia Capilar</strong></td>
              <td>Sangue total capilar</td>
              <td>Amperometria enzimática</td>
              <td>Monitoramento de diabetes e ajuste de conduta</td>
            </tr>
            <tr>
              <td><strong>Hemoglobina Glicada (HbA1c)</strong></td>
              <td>Sangue total capilar</td>
              <td>Imunoturbidimetria / Fotometria</td>
              <td>Avaliação do controle glicêmico dos últimos 90 dias</td>
            </tr>
            <tr>
              <td><strong>Perfil Lipídico Rápido</strong></td>
              <td>Sangue total capilar</td>
              <td>Reflectância enzimática</td>
              <td>Colesterol Total, HDL, Triglicerídeos e cálculo de LDL</td>
            </tr>
            <tr>
              <td><strong>Beta-hCG Qualitativo</strong></td>
              <td>Urina ou Sangue total</td>
              <td>Imunocromatografia lateral</td>
              <td>Triagem rápida de gravidez no consultório</td>
            </tr>
            <tr>
              <td><strong>Dengue NS1 / IgG / IgM</strong></td>
              <td>Sangue total capilar</td>
              <td>Imunocromatografia de ouro coloidal</td>
              <td>Identificação precoce de antígeno NS1 e anticorpos</td>
            </tr>
            <tr>
              <td><strong>Covid-19 / Influenza A+B</strong></td>
              <td>Swab nasofaríngeo</td>
              <td>Imunocromatografia de antígeno</td>
              <td>Diferenciação diagnóstica de infecções respiratórias</td>
            </tr>
            <tr>
              <td><strong>Streptococcus A</strong></td>
              <td>Swab de orofaringe</td>
              <td>Imunocromatografia óptica</td>
              <td>Diferenciação de faringite viral vs bacteriana para médico</td>
            </tr>
            <tr>
              <td><strong>Troponina Cardíaca I</strong></td>
              <td>Sangue total capilar</td>
              <td>Imunofluorescência quantitativa</td>
              <td>Triagem de urgência cardiológica no balcão</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card-box" style="margin-bottom: 8px;">
        <div class="card-box-header"><i class="fa-solid fa-clipboard-check"></i> Passo a Passo Operacional para Execução de um TLR</div>
        <div class="steps-row">
          <div class="step-badge-item">
            <div class="step-circle">1</div>
            <div class="step-content"><strong>Acolhimento e Higienização:</strong> Conduza o paciente ao consultório privativo, higienize as mãos e calce EPIs (luvas e máscara).</div>
          </div>
          <div class="step-badge-item">
            <div class="step-circle">2</div>
            <div class="step-content"><strong>Abertura do Modal TLR:</strong> Clique no botão <span class="badge-reg" style="background:#7c3aed; color:#fff;">Teste Rápido (TLR)</span> no balcão ou na ficha do paciente.</div>
          </div>
          <div class="step-badge-item">
            <div class="step-circle">3</div>
            <div class="step-content"><strong>Verificação do Kit:</strong> Confira se o lote e a validade do kit coincidem com os dados exibidos no CRM.</div>
          </div>
          <div class="step-badge-item">
            <div class="step-circle">4</div>
            <div class="step-content"><strong>Coleta e Leitura:</strong> Execute a punção com lanceta retrátil de segurança e aguarde o tempo indicado pelo fabricante (10 a 15 min).</div>
          </div>
          <div class="step-badge-item">
            <div class="step-circle">5</div>
            <div class="step-content"><strong>Emissão do Laudo Técnico:</strong> Registre o resultado, insira as orientações e clique em <strong>"Salvar &amp; Emitir Laudo (PDF)"</strong>.</div>
          </div>
        </div>
      </div>

      <div class="alert-banner alert-warning">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div>
          <strong>Frase Obrigatória no Laudo (RDC 786/2023):</strong> "Este exame não possui finalidade de diagnóstico nosológico definitivo, devendo seus resultados ser correlacionados com a clínica e avaliados pelo médico assistente."
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 11 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 12: MÓDULO 5 — AUTOMAÇÃO DE PÓS-ATENDIMENTO & ADESÃO (PARTE 1) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-comments"></i> Módulo 5: Automação Pós-Atendimento &amp; Adesão</div>
        <div class="page-header-meta">Fidelização Ativa (CRM 3.1)</div>
      </div>

      <p style="font-size: 8.4px; color: #334155; margin-bottom: 6px;">
        O módulo de <strong>Automação de Pós-Atendimento &amp; Adesão</strong> transforma o consultório farmacêutico em uma central proativa de cuidado, garantindo contato clínico estruturado via WhatsApp no momento exato em que o paciente mais necessita de suporte.
      </p>

      <!-- Screenshot 5 -->
      <div class="screenshot-card">
        <img src="${imgPosCare}" alt="Modal de Automação de Pós-Atendimento e Adesão">
        <div class="screenshot-caption">
          <span><strong>Figura 05:</strong> Central de Automação de Pós-Atendimento: Follow-up D+2 (48h pós-consulta) e Alerta de Recompra D-5 com Envio em 1 Clique.</span>
          <span>Adesão Terapêutica &bull; Impacto +94.2%</span>
        </div>
      </div>

      <div class="grid-2" style="margin-top: 6px;">
        <div class="card-box">
          <div class="card-box-header"><i class="fa-brands fa-whatsapp" style="color: #25d366;"></i> Protocolo Follow-up Clínico D+2 (48 Horas)</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            Acionado automaticamente para atendimentos entre 24h e 96h atrás:
          </p>
          <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li>Checagem da evolução do sintoma principal (Cefaleia, Febre, Tosse).</li>
            <li>Identificação de eventuais reações adversas aos medicamentos dispensados.</li>
            <li>Confirmação da compreensão da posologia e horários de tomada.</li>
            <li>Mensagem humanizada pré-formatada contendo nome do paciente e queixa tratada.</li>
          </ul>
        </div>

        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-clock-rotate-left" style="color: #38bdf8;"></i> Protocolo Alerta de Recompra D-5 (Refill)</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            Prevenção ativa da interrupção do tratamento contínuo:
          </p>
          <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li>Cálculo da duração da caixa (ex: 30 comprimidos = 30 dias de tratamento).</li>
            <li>Disparo do alerta 5 dias antes do esgotamento da medicação.</li>
            <li>Convite para renovação do estoque pessoal e checagem da pressão/glicemia.</li>
            <li>Aumento comprovado de +94.2% na continuidade do tratamento farmacológico.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 12 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 13: MÓDULO 5 — MODELOS DE MENSAGENS WHATSAPP & LGPD (PARTE 2) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-paper-plane"></i> Módulo 5: Scripts de Mensagens &amp; Consentimento</div>
        <div class="page-header-meta">Comunicação Clínica</div>
      </div>

      <div class="card-box" style="margin-bottom: 8px;">
        <div class="card-box-header"><i class="fa-solid fa-message"></i> Modelos Padronizados de Comunicação Farmacêutica</div>
        <div class="grid-2">
          <div class="card-box" style="background: #f0fdf4; border-color: #bbf7d0;">
            <strong style="color: #166534; font-size: 8.8px;"><i class="fa-brands fa-whatsapp"></i> Script 1: Follow-up D+2 (Checagem de Melhora)</strong>
            <div style="background: #ffffff; border: 1px solid #dcfce7; border-radius: 6px; padding: 6px; margin-top: 4px; font-family: 'JetBrains Mono', monospace; font-size: 7px; color: #166534; line-height: 1.35;">
              "Olá, {NOME_PACIENTE}! Aqui é o Farmacêutico {NOME_FARMACEUTICO} da {NOME_FARMACIA}. Passando para acompanhar o seu atendimento de {DATA_ATENDIMENTO}. Como você está se sentindo em relação à {QUEIXA_PRINCIPAL}? Teve alguma dúvida sobre como tomar o {MEDICAMENTO_ORIENTADO}? Conte comigo para o que precisar!"
            </div>
          </div>

          <div class="card-box" style="background: #eff6ff; border-color: #bfdbfe;">
            <strong style="color: #1e40af; font-size: 8.8px;"><i class="fa-solid fa-repeat"></i> Script 2: Lembrete de Recompra D-5 (Uso Contínuo)</strong>
            <div style="background: #ffffff; border: 1px solid #dbeafe; border-radius: 6px; padding: 6px; margin-top: 4px; font-family: 'JetBrains Mono', monospace; font-size: 7px; color: #1e40af; line-height: 1.35;">
              "Olá, {NOME_PACIENTE}! Notamos que seu tratamento com {MEDICAMENTO_CONTINUO} deve estar terminando por volta do dia {DATA_PREVISTA_FIM}. Para não interromper o controle da sua saúde, seu novo medicamento já pode ser reservado. Aproveite para passar aqui e aferir sua pressão gratuitamente!"
            </div>
          </div>
        </div>
      </div>

      <div class="card-box" style="margin-bottom: 8px;">
        <div class="card-box-header"><i class="fa-solid fa-users-gear"></i> Disparo em Lote Seguro vs Disparo Individual</div>
        <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
          O sistema disponibiliza duas modalidades de acionamento:
        </p>
        <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.35;">
          <li><strong>Disparo Individual:</strong> O farmacêutico clica no botão "Enviar Mensagem D+2" do paciente, abrindo a conversa no WhatsApp Web com o texto pré-carregado para personalização.</li>
          <li><strong>Disparo em Lote (Batch):</strong> O sistema processa todos os pacientes elegíveis daquele dia com um intervalo inteligente de 5 a 8 segundos entre mensagens, prevenindo bloqueios por spam e garantindo entrega humanizada.</li>
        </ul>
      </div>

      <div class="alert-banner alert-info">
        <i class="fa-solid fa-shield-halved"></i>
        <div>
          <strong>Conformidade com a LGPD:</strong> As comunicações de pós-atendimento são realizadas com base no legítimo interesse e no consentimento livre e esclarecido obtido no momento do cadastro do paciente para finalidade exclusiva de acompanhamento clínico de sua saúde.
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 13 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 14: MÓDULO 6 — DECLARAÇÃO DE SERVIÇO (DSF) & CUPOM TÉRMICO (PARTE 1) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-file-waveform"></i> Módulo 6: Declaração de Serviço Farmacêutico (DSF)</div>
        <div class="page-header-meta">Resoluções CFF 585/586</div>
      </div>

      <p style="font-size: 8.4px; color: #334155; margin-bottom: 6px;">
        A <strong>Declaração de Serviço Farmacêutico (DSF)</strong> é o documento legal e oficial emitido ao final de cada procedimento clínico. O sistema conta com uma <strong>Janela Modal de Consulta Prévia</strong> que permite ao farmacêutico revisar todos os dados em tela antes da geração do PDF ou do cupom térmico.
      </p>

      <!-- Screenshot 6 -->
      <div class="screenshot-card">
        <img src="${imgDsf}" alt="Janela de Consulta Prévia da DSF e Opções de Impressão">
        <div class="screenshot-caption">
          <span><strong>Figura 06:</strong> Modal de Consulta da DSF em Tela: Botão Baixar em PDF Oficial, Cupom Térmico (80mm/58mm) e Disparo WhatsApp.</span>
          <span>Validação Prévia &bull; Protocolo Oficial DSF</span>
        </div>
      </div>

      <div class="grid-2" style="margin-top: 6px;">
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-eye"></i> Consulta Prévia em Tela (Sem Redundância)</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            Vantagens da verificação antes de exportar:
          </p>
          <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li>Conferência visual de alergias, histórico e condutas adotadas.</li>
            <li>Prevenção de erros de digitação antes do arquivamento do laudo.</li>
            <li>Acesso simultâneo aos três canais de entrega: PDF A4, Cupom Térmico e WhatsApp.</li>
            <li>Consulta sem necessidade de gerar arquivos temporários no disco.</li>
          </ul>
        </div>

        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-print"></i> Formatos de Saída Disponíveis</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            Versatilidade para qualquer perfil de farmácia:
          </p>
          <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li><strong>PDF Oficial A4:</strong> Documento timbrado com cabeçalho da farmácia, layout institucional, chancela digital ICP-Brasil e QR Code validador CFF.</li>
            <li><strong>Cupom Térmico (58mm / 80mm):</strong> Impressão ultrarrápida em bobina de cupom de balcão (ESC/POS) para entrega direta nas mãos do paciente.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 14 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 15: MÓDULO 6 — CHANCELA ICP-BRASIL & VALIDAÇÃO DIGITAL (PARTE 2) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-stamp"></i> Módulo 6: Chancela Digital &amp; Validador de Documentos</div>
        <div class="page-header-meta">Segurança Jurídica</div>
      </div>

      <div class="card-box" style="margin-bottom: 8px;">
        <div class="card-box-header"><i class="fa-solid fa-qrcode"></i> Arquitetura de Autenticidade do Documento Clínico</div>
        <p style="font-size: 8.2px; color: #334155; margin-bottom: 6px;">
          Cada Declaração de Serviço Farmacêutico (DSF) emitida pelo sistema incorpora elementos criptográficos invioláveis:
        </p>
        <div class="grid-3">
          <div class="card-box" style="background: #ffffff; text-align: center;">
            <div style="font-size: 20px; color: #0f766e; margin-bottom: 4px;"><i class="fa-solid fa-fingerprint"></i></div>
            <strong style="color: #0f172a; font-size: 8.5px;">Hash Criptográfico SHA-256</strong>
            <p style="font-size: 7.5px; color: #64748b; margin-top: 2px;">Assinatura matemática única calculada sobre os dados do atendimento que impede qualquer alteração posterior.</p>
          </div>
          <div class="card-box" style="background: #ffffff; text-align: center;">
            <div style="font-size: 20px; color: #0284c7; margin-bottom: 4px;"><i class="fa-solid fa-qrcode"></i></div>
            <strong style="color: #0f172a; font-size: 8.5px;">QR Code Validador Oficial</strong>
            <p style="font-size: 7.5px; color: #64748b; margin-top: 2px;">Aponta diretamente para o validador público de documentos ou portal do paciente para conferência por médicos e fiscais.</p>
          </div>
          <div class="card-box" style="background: #ffffff; text-align: center;">
            <div style="font-size: 20px; color: #7c3aed; margin-bottom: 4px;"><i class="fa-solid fa-file-contract"></i></div>
            <strong style="color: #0f172a; font-size: 8.5px;">Protocolo Único Nacional</strong>
            <p style="font-size: 7.5px; color: #64748b; margin-top: 2px;">Código alfanumérico padrão <code>DSF-AAAAMMDD-XXXX</code> registrado na base de dados para auditoria e rastreio.</p>
          </div>
        </div>
      </div>

      <div class="card-box" style="margin-bottom: 8px;">
        <div class="card-box-header"><i class="fa-solid fa-receipt"></i> Modelo do Cupom Térmico (Bobina 80mm de Balcão)</div>
        <div class="grid-2">
          <div>
            <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
              Estrutura condensada para impressão em impressoras térmicas comuns (Epson TM-T20, Bematech MP-4200, Elgin i9, etc.):
            </p>
            <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.35;">
              <li>Cabeçalho com Razão Social, CNPJ e CRF do Responsável Técnico.</li>
              <li>Identificação do Paciente (Nome e CPF ocultado conforme LGPD).</li>
              <li>Sintomas relatados e conduta orientada.</li>
              <li>Prescrição de MIPs com posologia completa e duração.</li>
              <li>Valores aferidos de Pressão Arterial e Glicemia.</li>
              <li>Assinatura do Farmacêutico.</li>
            </ul>
          </div>
          <div style="background: #f8fafc; border: 1px dashed #94a3b8; border-radius: 6px; padding: 8px; font-family: 'JetBrains Mono', monospace; font-size: 7px; color: #1e293b; line-height: 1.3;">
            ========================================<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CRM CLÍNICO FARMACÊUTICO<br>
            &nbsp;&nbsp;&nbsp;DECLARAÇÃO DE SERVIÇO FARMACÊUTICO<br>
            ========================================<br>
            Protocolo: DSF-20260904-8921<br>
            Data: 04/09/2026 21:45 &bull; RT: Marcelo Mazaro<br>
            CRF/SP: 54180 &bull; CNPJ: 54.180.999/0001-44<br>
            ----------------------------------------<br>
            PACIENTE: Dona Maria de Lourdes Santos<br>
            CPF: ***.567.890-** &bull; Idade: 68 anos<br>
            ----------------------------------------<br>
            MEDIDAS CLÍNICAS:<br>
            &bull; PA: 125/82 mmHg (Pressão Ótima)<br>
            &bull; Glicemia Capilar: 98 mg/dL (Normal)<br>
            ----------------------------------------<br>
            PRESCRIÇÃO / CONDUTA FARMACÊUTICA:<br>
            1. Paracetamol 750mg &bull; Tomar 1 cp a cada<br>
            &nbsp;&nbsp;&nbsp;8h se dor de cabeça moderada.<br>
            ----------------------------------------<br>
            &nbsp;&nbsp;&nbsp;&nbsp;Assinatura do Farmacêutico RT<br>
            ========================================
          </div>
        </div>
      </div>

      <div class="alert-banner alert-success">
        <i class="fa-solid fa-check-double"></i>
        <div>
          <strong>Economia e Agilidade no Balcão:</strong> O uso do cupom térmico reduz em até 85% o custo com papel e toner em comparação com impressões A4 tradicionais, além de ser impresso em apenas 3 segundos!
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 15 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 16: MÓDULO 7 — GESTÃO DE CLIENTES & PORTAL PWA (PARTE 1) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-users"></i> Módulo 7: Gestão de Clientes &amp; Prontuários</div>
        <div class="page-header-meta">Cadastro &amp; Ações Rápidas</div>
      </div>

      <p style="font-size: 8.4px; color: #334155; margin-bottom: 6px;">
        A aba <strong>Clientes &amp; Prontuário</strong> centraliza o cadastro inteligente de pacientes, fornecendo ferramentas ágeis de busca e uma barra de ações rápidas unificadas por ícones que permitem acionar qualquer procedimento clínico diretamente da tabela.
      </p>

      <!-- Screenshot 7 -->
      <div class="screenshot-card">
        <img src="${imgClientes}" alt="Tabela de Pacientes e Ações Rápidas">
        <div class="screenshot-caption">
          <span><strong>Figura 07:</strong> Gestão de Pacientes: Busca por CPF/Nome, Alertas de Alergia em Linha e Ações Rápidas (Estetoscópio, Vacina, Portal PWA, Refill, TLR).</span>
          <span>Aba Clientes &bull; Atalho F3</span>
        </div>
      </div>

      <div class="card-box" style="margin-top: 6px;">
        <div class="card-box-header"><i class="fa-solid fa-toolbox"></i> Significado e Operação dos Ícones de Ações Rápidas</div>
        <table class="manual-table">
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">Ícone</th>
              <th style="width: 130px;">Função do Botão</th>
              <th>Ação Desencadeada no Sistema</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center; font-size: 11px; color: #0d9488;"><i class="fa-solid fa-stethoscope"></i></td>
              <td><strong>Iniciar Triagem SOAP</strong></td>
              <td>Carrega imediatamente o paciente no balcão de atendimento clínico para nova consulta.</td>
            </tr>
            <tr>
              <td style="text-align: center; font-size: 11px; color: #10b981;"><i class="fa-solid fa-syringe"></i></td>
              <td><strong>Registro de Vacinação</strong></td>
              <td>Abre a ficha de imunização para registrar aplicação de vacinas e lote do imunobiológico.</td>
            </tr>
            <tr>
              <td style="text-align: center; font-size: 11px; color: #0284c7;"><i class="fa-solid fa-mobile-screen"></i></td>
              <td><strong>Portal do Paciente PWA</strong></td>
              <td>Gera o link de acesso exclusivo e envia a carteira de saúde digital via WhatsApp ao paciente.</td>
            </tr>
            <tr>
              <td style="text-align: center; font-size: 11px; color: #10b981;"><i class="fa-solid fa-cart-shopping"></i></td>
              <td><strong>Histórico &amp; Refill</strong></td>
              <td>Exibe histórico de produtos adquiridos, medicamentos de uso contínuo e data de recompra.</td>
            </tr>
            <tr>
              <td style="text-align: center; font-size: 11px; color: #8b5cf6;"><i class="fa-solid fa-vial-virus"></i></td>
              <td><strong>Executar Teste TLR</strong></td>
              <td>Abre o formulário de exame rápido (RDC 786/2023) já com os dados do paciente pré-preenchidos.</td>
            </tr>
            <tr>
              <td style="text-align: center; font-size: 11px; color: #6366f1;"><i class="fa-solid fa-diagram-project"></i></td>
              <td><strong>Jornada do Paciente</strong></td>
              <td>Exibe a linha do tempo cronológica com todas as interações e compras do usuário.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 16 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 17: MÓDULO 7 — PORTAL DO PACIENTE PWA & MOTOR NLP (PARTE 2) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-mobile-button"></i> Módulo 7: Portal PWA &amp; Motor NLP de Sintomas</div>
        <div class="page-header-meta">Engajamento &amp; Tecnologia</div>
      </div>

      <div class="card-box" style="margin-bottom: 8px;">
        <div class="card-box-header"><i class="fa-solid fa-mobile-screen-button"></i> O Portal do Paciente PWA (Progressive Web App)</div>
        <p style="font-size: 8.2px; color: #334155; margin-bottom: 6px;">
          O paciente não precisa instalar aplicativos pesados na Play Store ou App Store. O CRM gera um portal PWA responsivo e seguro:
        </p>
        <div class="grid-2">
          <div>
            <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.4;">
              <li><strong>Carteira de Vacinação Digital:</strong> Registro de doses tomadas na farmácia com lote e fabricante.</li>
              <li><strong>Prescrições Ativas de MIPs:</strong> Instruções claras de horários e alertas alimentares.</li>
              <li><strong>Histórico de Medições de PA e Glicemia:</strong> Gráficos simples para acompanhamento familiar.</li>
              <li><strong>Botão de Emergência / Contato Direto:</strong> Comunicação com o WhatsApp da farmácia para dúvidas.</li>
            </ul>
          </div>
          <div class="alert-banner alert-info" style="margin: 0;">
            <i class="fa-solid fa-qrcode"></i>
            <div>
              <strong>Envio Instantâneo:</strong> Com 1 clique no ícone de celular na tabela, o link seguro do portal é despachado para o WhatsApp do paciente com token criptográfico de autoautenticação!
            </div>
          </div>
        </div>
      </div>

      <div class="card-box" style="margin-bottom: 8px;">
        <div class="card-box-header"><i class="fa-solid fa-brain"></i> Motor de Linguagem Natural (NLP) para Queixas e Sintomas</div>
        <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
          Durante a triagem no balcão, o farmacêutico pode digitar as palavras exatas ditas pelo paciente. O algoritmo fonético e semântico do CRM categoriza a queixa automaticamente:
        </p>
        <table class="manual-table">
          <thead>
            <tr>
              <th>Texto Livre Relatado pelo Cliente</th>
              <th>Interpretação Semântica (NLP)</th>
              <th>MIPs e Condutas Sugeridas</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>"tô com a cabeça latejando muito forte e moleza"</td>
              <td><strong>Cefaleia Tensional / Febre</strong></td>
              <td>Paracetamol ou Dipirona (se sem alergia) + aferir temperatura</td>
            </tr>
            <tr>
              <td>"azia danada que queima a garganta depois de comer"</td>
              <td><strong>Dispepsia / Refluxo Gástrico</strong></td>
              <td>Antiácidos e orientação alimentar fracionada</td>
            </tr>
            <tr>
              <td>"nariz entupido, espirrando e olho coçando"</td>
              <td><strong>Rinite Alérgica Aguda</strong></td>
              <td>Anti-histamínico de 2ª geração (Loratadina/Cetirizina) + Soro Nasal</td>
            </tr>
            <tr>
              <td>"dor nas costas no meio da lombar que repuxa"</td>
              <td><strong>Lombalgia Mecânica</strong></td>
              <td>Relaxante muscular / AINE tópico + calor local</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="alert-banner alert-success">
        <i class="fa-solid fa-feather-pointed"></i>
        <div>
          <strong>Agilidade no Acolhimento:</strong> O motor NLP economiza tempo de digitação e assegura que a queixa fique codificada de forma padronizada no prontuário para pesquisas e relatórios futuros.
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 17 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 18: MÓDULO 8 — ESTOQUE & INSUMOS CLÍNICOS (FEFO) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-boxes-stacked"></i> Módulo 8: Estoque &amp; Insumos Clínicos</div>
        <div class="page-header-meta">Rastreabilidade FEFO</div>
      </div>

      <p style="font-size: 8.4px; color: #334155; margin-bottom: 6px;">
        O módulo de <strong>Estoque &amp; Suprimentos</strong> garante o suprimento ininterrupto do consultório farmacêutico e do balcão de dispensação, aplicando com rigor a regra sanitária <strong>FEFO (First-Expired, First-Out)</strong> para controle de validades.
      </p>

      <!-- Screenshot 8 -->
      <div class="screenshot-card">
        <img src="${imgEstoque}" alt="Controle de Estoque e Catálogo de Medicamentos">
        <div class="screenshot-caption">
          <span><strong>Figura 08:</strong> Catálogo e Saldo Físico: Rastreabilidade de Lotes, Validades, Alertas Críticos de Reposição e Importação de XML NF-e.</span>
          <span>Aba Estoque &bull; Atalho F4</span>
        </div>
      </div>

      <div class="grid-2" style="margin-top: 6px;">
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-calendar-xmark"></i> Regra FEFO e Prevenção de Perdas</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            Controle automatizado por data de expiração:
          </p>
          <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li>O sistema prioriza na dispensação o lote com vencimento mais próximo.</li>
            <li>Alerta amarelo para produtos com validade inferior a 90 dias.</li>
            <li>Bloqueio automático total para produtos com validade expirada.</li>
            <li>Rastreamento de número de lote por atendimento para recalls de distribuidores.</li>
          </ul>
        </div>

        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-file-code"></i> Entrada por XML de NF-e &amp; Precificação</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            Automação de compras e notas de distribuidoras:
          </p>
          <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li>Importação direta do XML da Nota Fiscal Eletrônica (NF-e).</li>
            <li>Cadastro automático de princípios ativos, EAN, lote e data de validade.</li>
            <li>Cálculo de Markup e Margem Bruta sobre custo de aquisição.</li>
            <li>Integração com o fluxo de caixa para lançamento das contas a pagar.</li>
          </ul>
        </div>
      </div>

      <div class="alert-banner alert-warning" style="margin-top: 5px;">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div>
          <strong>Auditoria Sanitária de Estoque:</strong> Mantenha os reagentes de TLR e vacinas sempre registrados com lote e validade no sistema. Fiscais sanitários exigem a conferência física do lote com o prontuário do paciente!
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 18 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 19: MÓDULO 9 — CONTROLE FINANCEIRO & FLUXO DE CAIXA -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-sack-dollar"></i> Módulo 9: Controle Financeiro &amp; Fluxo de Caixa</div>
        <div class="page-header-meta">Faturamento Clínico &amp; DRE</div>
      </div>

      <p style="font-size: 8.4px; color: #334155; margin-bottom: 6px;">
        O <strong>Controle Financeiro Farmacêutico</strong> integra o faturamento gerado pelas consultas e exames laboratoriais remotos (TLR) com as vendas de balcão (MIPs) e despesas operacionais da clínica, calculando a margem líquida em tempo real.
      </p>

      <!-- Screenshot 9 -->
      <div class="screenshot-card">
        <img src="${imgFinanceiro}" alt="Controle Financeiro e Fluxo de Caixa">
        <div class="screenshot-caption">
          <span><strong>Figura 09:</strong> Fluxo de Caixa Farmacêutico: Faturamento Clínico Dissociado, Despesas, Extrato de Movimentações e Exportação DRE.</span>
          <span>Aba Financeiro &bull; Atalho F6</span>
        </div>
      </div>

      <div class="grid-2" style="margin-top: 6px;">
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-chart-column"></i> Dissociação Estratégica do Faturamento</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            Clareza contábil sobre a rentabilidade do consultório:
          </p>
          <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li><strong>Receita de Serviços Clínicos:</strong> Consultas, aferições, exames TLR e vacinas (alta margem bruta, sem custo de mercadoria elevado).</li>
            <li><strong>Vendas de Balcão (MIPs):</strong> Vendas associadas geradas a partir da recomendação farmacêutica.</li>
            <li><strong>Despesas com Insumos:</strong> Compras de tiras reagentes, lancetas, luvas e descartáveis.</li>
            <li><strong>Despesas Operacionais Fixas:</strong> Software, energia, manutenção e taxas regulatórias.</li>
          </ul>
        </div>

        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-file-invoice-dollar"></i> Relatório DRE &amp; Meios de Pagamento</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            Controle gerencial profissional para tomada de decisão:
          </p>
          <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li><strong>Exportação DRE em PDF:</strong> Demonstrativo do Resultado do Exercício com 1 clique para a contabilidade.</li>
            <li><strong>Suporte a Múltiplos Meios:</strong> PIX imediato, Cartão de Crédito, Débito, Dinheiro e Convênio.</li>
            <li><strong>Filtros Flexíveis:</strong> Visualização por Mês Atual, Últimos 7 dias, Hoje, Ano Vigente ou Histórico Total.</li>
            <li><strong>Lançamentos Rápidos:</strong> Botão "+ Novo Lançamento" para despesas eventuais do caixa.</li>
          </ul>
        </div>
      </div>

      <div class="alert-banner alert-success" style="margin-top: 5px;">
        <i class="fa-solid fa-coins"></i>
        <div>
          <strong>Monetização da Assistência Farmacêutica:</strong> Farmácias que cobram por consultas e exames TLR reportam faturamento adicional médio de R$ 3.500 a R$ 12.000 por mês por consultório, valorizando a profissão farmacêutica!
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 19 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 20: MÓDULO 10 — GOVERNANÇA, RBAC & HARD RESET SEGURO -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-sliders"></i> Módulo 10: Governança, RBAC &amp; Hard Reset Seguro</div>
        <div class="page-header-meta">Configurações &amp; Segurança</div>
      </div>

      <p style="font-size: 8.4px; color: #334155; margin-bottom: 6px;">
        O módulo de <strong>Configurações &amp; Gestão</strong> administra operadores, níveis de acesso (RBAC), sincronização com o banco distribuído Turso Cloud e os mecanismos de segurança de limpeza de bases e <strong>Hard Reset Atômico Seguro</strong>.
      </p>

      <!-- Screenshot 10 -->
      <div class="screenshot-card">
        <img src="${imgSandbox}" alt="Configurações do Sistema e Sandbox Seguro com Hard Reset">
        <div class="screenshot-caption">
          <span><strong>Figura 10:</strong> Configurações do Sistema: Geradores de Dados Sandbox e Bloco de Limpeza de Bases Protegido por Senha Master (Hard Reset).</span>
          <span>Aba Configurações &bull; Acesso Restrito Master</span>
        </div>
      </div>

      <div class="card-box" style="margin-top: 6px;">
        <div class="card-box-header"><i class="fa-solid fa-shield-halved"></i> Procedimento Seguro de Limpeza de Bases e Hard Reset</div>
        <div class="grid-3">
          <div class="card-box" style="background: #f0f9ff; border-color: #bae6fd;">
            <strong style="color: #0369a1; font-size: 8.5px;"><i class="fa-solid fa-broom"></i> 1. Limpar Simulação</strong>
            <p style="font-size: 7.5px; color: #475569; margin-top: 3px;">
              Remove <strong>exclusivamente</strong> os dados de teste gerados no Sandbox (marcados com <code>[SIMULADO]</code>). Seus clientes reais e vendas permanecem intactos.
            </p>
          </div>
          <div class="card-box" style="background: #fffbeb; border-color: #fde68a;">
            <strong style="color: #92400e; font-size: 8.5px;"><i class="fa-solid fa-eraser"></i> 2. Limpar Produção Real</strong>
            <p style="font-size: 7.5px; color: #475569; margin-top: 3px;">
              Remove os atendimentos e vendas reais de teste antes da inauguração oficial da clínica, mantendo intactos operadores e configurações.
            </p>
          </div>
          <div class="card-box" style="background: #fef2f2; border-color: #fecaca;">
            <strong style="color: #991b1b; font-size: 8.5px;"><i class="fa-solid fa-bomb"></i> 3. Hard Reset de Fábrica</strong>
            <p style="font-size: 7.5px; color: #475569; margin-top: 3px;">
              Purga atômica e integralmente todas as tabelas transacionais no IndexedDB e na nuvem Turso, restaurando o CRM ao estado zero com total segurança.
            </p>
          </div>
        </div>
      </div>

      <div class="alert-banner alert-danger" style="margin-top: 4px;">
        <i class="fa-solid fa-lock"></i>
        <div>
          <strong>Dupla Autenticação de Segurança:</strong> O Hard Reset exige a digitação da <strong>Senha Master</strong> e a confirmação textual <code>RESETAR BANCO</code>. Operadores sem perfil Master não possuem autorização para executar esta ação.
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 20 de 21</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 21: CHECKLIST DIÁRIO, CONTINGÊNCIA & REFERÊNCIAS OFICIAIS -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-clipboard-check"></i> Checklist Diário, Contingência &amp; Suporte</div>
        <div class="page-header-meta">Operação Contínua</div>
      </div>

      <div class="grid-2" style="margin-bottom: 8px;">
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-sun"></i> Checklist Diário do Farmacêutico RT</div>
          <div class="steps-row">
            <div class="step-badge-item">
              <div class="step-circle">1</div>
              <div class="step-content"><strong>Abertura do Consultório:</strong> Logar com perfil individual, verificar temperatura do frigobar de vacinas e calibração dos aparelhos de PA.</div>
            </div>
            <div class="step-badge-item">
              <div class="step-circle">2</div>
              <div class="step-content"><strong>Revisão de Pós-Atendimento:</strong> Abrir a aba Pós-Atendimento e disparar as mensagens de Follow-up D+2 e Refill D-5 do dia.</div>
            </div>
            <div class="step-badge-item">
              <div class="step-circle">3</div>
              <div class="step-content"><strong>Conferência de Validades:</strong> Verificar alertas amarelos no catálogo de estoque para insumos e tiras reagentes de TLR.</div>
            </div>
            <div class="step-badge-item">
              <div class="step-circle">4</div>
              <div class="step-content"><strong>Fechamento de Caixa Diário:</strong> Conferir faturamento clínico na aba Financeiro e validar reconciliação de PIX e cartões.</div>
            </div>
          </div>
        </div>

        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-wifi"></i> Plano de Contingência Offline (Sem Internet)</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            Graças à arquitetura <strong>Offline-First com LibSQL/IndexedDB</strong>:
          </p>
          <ul style="font-size: 7.8px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li>O sistema opera 100% normalmente mesmo se a internet cair por completo.</li>
            <li>Consultas, triagens, prescrições de MIPs e impressões funcionam sem interrupções.</li>
            <li>Todos os dados são persistidos de forma segura no navegador do dispositivo.</li>
            <li>Assim que a conexão for restabelecida, a sincronização com o Turso Cloud ocorre automaticamente em segundo plano.</li>
          </ul>
        </div>
      </div>

      <div class="card-box" style="margin-bottom: 8px;">
        <div class="card-box-header"><i class="fa-solid fa-landmark"></i> Referências Oficiais &amp; Suporte Técnico Especializado</div>
        <table class="manual-table">
          <thead>
            <tr>
              <th>Órgão Regulador / Instituição</th>
              <th>Legislação de Referência</th>
              <th>Portal Oficial de Consulta</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Conselho Federal de Farmácia (CFF)</strong></td>
              <td>Resoluções CFF nº 585/2013 e 586/2013</td>
              <td><a href="https://www.cff.org.br" style="color:#0284c7; text-decoration:none;">www.cff.org.br</a></td>
            </tr>
            <tr>
              <td><strong>ANVISA (Vigilância Sanitária)</strong></td>
              <td>RDC nº 786/2023 (TLR) e RDC nº 44/2009</td>
              <td><a href="https://www.gov.br/anvisa" style="color:#0284c7; text-decoration:none;">www.gov.br/anvisa</a></td>
            </tr>
            <tr>
              <td><strong>Validador CFF / ITI</strong></td>
              <td>Assinatura Digital em Documentos de Saúde</td>
              <td><a href="https://validador.iti.gov.br" style="color:#0284c7; text-decoration:none;">validador.iti.gov.br</a></td>
            </tr>
            <tr>
              <td><strong>Suporte Técnico Farma Logic</strong></td>
              <td>CRM Clínico Farmacêutico v3.1.0</td>
              <td>suporte@farmalogic.com.br &bull; (11) 98765-4321</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="alert-banner alert-success">
        <i class="fa-solid fa-award"></i>
        <div>
          <strong>Excelência na Assistência Farmacêutica:</strong> Este manual consolida as melhores práticas de cuidado centrado no paciente. Utilize diariamente as ferramentas do CRM Clínico para promover saúde, salvar vidas e transformar sua farmácia em uma referência clínica respeitada!
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Guia Operacional Master Oficial</div>
      <div>Página 21 de 21 &bull; Fim do Manual</div>
    </div>
  </div>

</body>
</html>`;

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    console.log('📄 Renderizando documento HTML de 21 páginas no Puppeteer...');
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 120000 });
    
    // Aguardar fontes carregarem com fallback
    try {
      await page.evaluate(async () => {
        if (document.fonts) {
          await document.fonts.ready;
        }
      });
    } catch (fontErr) {
      console.log('Aviso fontes:', fontErr.message);
    }
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    console.log('🖨️ Compilando PDF oficial A4 em alta resolução com ilustrações...');
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      printBackground: true
    });
    await browser.close();
    
    const stats = fs.statSync(outputPath);
    console.log(`✅ Manual do Usuário Super Completo gerado com sucesso!`);
    console.log(`📁 Arquivo: ${outputPath}`);
    console.log(`⚖️ Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (err) {
    console.error('❌ Erro ao gerar Manual do Usuário:', err);
    process.exit(1);
  }
}

generateCompleteUserManualPDF();
