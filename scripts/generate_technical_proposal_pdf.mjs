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

async function generateTechnicalProposalPDF() {
  const outputPath = path.resolve('clinical_crm_technical_proposal-v6.pdf');
  console.log('📄 Carregando capturas de tela em alta resolução para a proposta técnica...');

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

  console.log('🖋️ Construindo Proposta Técnica e de Negócio v6 (v3.1.0 Enterprise)...');

  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Proposta Técnica & Diretrizes de Negócio — CRM Clínico Farmacêutico v3.1.0</title>
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
      font-size: 8.7px;
      line-height: 1.34;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      padding: 9mm 13mm 8mm 13mm;
      page-break-after: always;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      background: #ffffff;
    }

    /* CAPA */
    .page-cover {
      background: radial-gradient(circle at 100% 0%, #064e3b 0%, #0f172a 50%, #020617 100%);
      color: #ffffff;
      padding: 18mm 16mm 14mm 16mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .cover-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      background: rgba(13, 148, 136, 0.25);
      border: 1px solid rgba(45, 212, 191, 0.4);
      border-radius: 999px;
      color: #2dd4bf;
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      width: fit-content;
    }

    .cover-title {
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 900;
      line-height: 1.15;
      margin-top: 14px;
      background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 40%, #2dd4bf 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cover-subtitle {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 8px;
      line-height: 1.4;
      max-width: 90%;
    }

    .cover-pillars {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 20px;
    }

    .cover-pillar-card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 10px;
      backdrop-filter: blur(8px);
    }

    .cover-pillar-icon {
      font-size: 18px;
      color: #38bdf8;
      margin-bottom: 6px;
    }

    .cover-pillar-title {
      font-family: 'Outfit', sans-serif;
      font-size: 9.5px;
      font-weight: 700;
      color: #f8fafc;
    }

    .cover-pillar-desc {
      font-size: 7.6px;
      color: #94a3b8;
      margin-top: 3px;
      line-height: 1.3;
    }

    .cover-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 8px;
      color: #94a3b8;
    }

    /* CABEÇALHO PADRÃO */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 6px;
      border-bottom: 1.5px solid #e2e8f0;
      margin-bottom: 7px;
    }

    .page-header-title {
      font-family: 'Outfit', sans-serif;
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .page-header-meta {
      font-size: 7.8px;
      font-weight: 600;
      color: #0d9488;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* RODAPÉ PADRÃO */
    .footer-page {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 5px;
      border-top: 1px solid #e2e8f0;
      font-size: 7.2px;
      color: #64748b;
    }

    /* GRIDS & CARDS */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 7px;
    }

    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }

    .card-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 7px 9px;
    }

    .card-box-header {
      font-family: 'Outfit', sans-serif;
      font-size: 9px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 4px;
    }

    .badge-tag {
      display: inline-block;
      padding: 1.5px 5px;
      border-radius: 4px;
      font-size: 7px;
      font-weight: 700;
    }

    .alert-banner {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      padding: 6px 9px;
      border-radius: 6px;
      font-size: 7.8px;
      line-height: 1.35;
      margin-top: 5px;
      margin-bottom: 5px;
    }

    .alert-info {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
    }

    .alert-success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
    }

    .alert-warning {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }

    /* TABELAS */
    .table-tech {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.6px;
      margin: 4px 0;
    }

    .table-tech th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      padding: 4px 6px;
      text-align: left;
      font-family: 'Outfit', sans-serif;
    }

    .table-tech td {
      padding: 3.5px 6px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }

    .table-tech tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* SCREENSHOTS */
    .screenshot-frame {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
      background: #0f172a;
      margin-bottom: 5px;
    }

    .screenshot-frame img {
      width: 100%;
      height: auto;
      max-height: 82mm;
      object-fit: cover;
      display: block;
    }

    .screenshot-legend {
      background: #0f172a;
      color: #e2e8f0;
      font-size: 7.2px;
      padding: 3px 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #1e293b;
    }
  </style>
</head>
<body>

  <!-- ===================================================================== -->
  <!-- PÁGINA 1: CAPA EXECUTIVA CORPORATIVA -->
  <!-- ===================================================================== -->
  <div class="page page-cover">
    <div>
      <div class="cover-badge">
        <i class="fa-solid fa-shield-halved"></i> Documento Arquitetural &amp; Proposta de Negócio v6
      </div>
      <div class="cover-title">
        CRM Clínico Farmacêutico &amp;<br>
        Sistema CDSS 4D Multidimensional
      </div>
      <div class="cover-subtitle">
        A plataforma corporativa definitiva para transformação de consultórios e balcões farmacêuticos em hubs clínicos resolutivos, seguros e altamente rentáveis.
      </div>
      <div style="margin-top: 10px; display: flex; gap: 8px;">
        <span style="background: rgba(14, 165, 233, 0.2); border: 1px solid rgba(56, 189, 248, 0.4); padding: 3px 8px; border-radius: 4px; font-size: 7.8px; color: #38bdf8;">Versão 3.1.0 Enterprise</span>
        <span style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(52, 211, 153, 0.4); padding: 3px 8px; border-radius: 4px; font-size: 7.8px; color: #34d399;">RDC ANVISA 786/2023 (TLR)</span>
        <span style="background: rgba(168, 85, 247, 0.2); border: 1px solid rgba(192, 132, 252, 0.4); padding: 3px 8px; border-radius: 4px; font-size: 7.8px; color: #c084fc;">Chancela ICP-Brasil / GOV.BR</span>
      </div>
    </div>

    <div class="cover-pillars">
      <div class="cover-pillar-card">
        <div class="cover-pillar-icon"><i class="fa-solid fa-bolt"></i></div>
        <div class="cover-pillar-title">1. Velocidade Clínica</div>
        <div class="cover-pillar-desc">Triagem SOAP guiada em menos de 60 segundos com navegação 100% por teclado (F1-F12), ditado por voz e cupom térmico ESC/POS.</div>
      </div>
      <div class="cover-pillar-card">
        <div class="cover-pillar-icon"><i class="fa-solid fa-vial-virus"></i></div>
        <div class="cover-pillar-title">2. Suporte 4D &amp; TLR</div>
        <div class="cover-pillar-desc">CDSS em tempo real, rastreio de sepse (SSC/qSOFA), 8 testes rápidos TLR homologados e laudos oficiais com chancela digital.</div>
      </div>
      <div class="cover-pillar-card">
        <div class="cover-pillar-icon"><i class="fa-solid fa-comments-dollar"></i></div>
        <div class="cover-pillar-title">3. Retenção &amp; Monetização</div>
        <div class="cover-pillar-desc">Automação ativa de Follow-up D+2 e Recompra D-5 via WhatsApp, telemetria gráfica longitudinal e faturamento clínico dissociado.</div>
      </div>
    </div>

    <div class="cover-footer">
      <div>
        <strong>Responsabilidade Técnica &amp; Autoria:</strong> Dr. Marcelo Mazaro (CRF-SP 54180)<br>
        <strong>Marco Regulatório:</strong> CFF 585/586 &bull; RDC ANVISA 786/2023 &bull; ICP-Brasil &bull; LGPD Lei 13.709/2018
      </div>
      <div style="text-align: right;">
        <strong>Data de Homologação:</strong> Setembro / 2026<br>
        <strong>Classificação:</strong> Documento Corporativo Confidencial
      </div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 2: PROPOSTA DE VALOR, VISÃO DE MERCADO E MODELO DE MONETIZAÇÃO -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-chart-line"></i> 1. Visão de Mercado &amp; Proposta de Valor</div>
        <div class="page-header-meta">Modelo Estratégico</div>
      </div>

      <div class="grid-2" style="margin-bottom: 8px;">
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-bullseye"></i> O Novo Hub de Saúde no Varejo Farmacêutico</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            A farmácia brasileira deixou de ser um simples balcão de vendas de caixas de medicamentos para se transformar em uma porta de entrada primária de saúde (Lei Federal nº 13.021/2014, Resoluções CFF nº 585/586 e RDC ANVISA nº 786/2023).
          </p>
          <ul style="font-size: 7.7px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li><strong>Monetização Assistencial:</strong> Cobrança direta por consultas, vacinas e exames rápidos (TLR).</li>
            <li><strong>Prevenção de Abandono:</strong> 45% dos pacientes crônicos abandonam o tratamento após 90 dias sem contato.</li>
            <li><strong>Diferenciação Competitiva:</strong> Consultórios clínicos modernos atraem pacientes de alto poder aquisitivo.</li>
          </ul>
        </div>

        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-coins"></i> As 5 Vias de Faturamento &amp; ROI</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            O CRM Clínico Farmacêutico viabiliza receitas recorrentes e economia imediata:
          </p>
          <ul style="font-size: 7.7px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li><strong>Consultas &amp; Procedimentos:</strong> R$ 30 a R$ 80 por atendimento clínico farmacêutico.</li>
            <li><strong>Exames TLR (RDC 786):</strong> Margem de 65% a 80% sobre testes rápidos (HbA1c, Lipídios, Dengue).</li>
            <li><strong>Recuperação de Refill D-5:</strong> +38% de recompra recorrente de medicamentos contínuos.</li>
            <li><strong>Economia com Cupom Térmico:</strong> Até 85% de redução em gastos com papel e toner A4.</li>
            <li><strong>Blindagem Regulatória:</strong> Zero autuações fiscais por ausência de rastreabilidade ou laudos.</li>
          </ul>
        </div>
      </div>

      <div class="card-box" style="margin-bottom: 8px;">
        <div class="card-box-header"><i class="fa-solid fa-sitemap"></i> Arquitetura Tripartite da Plataforma</div>
        <div class="grid-3">
          <div class="card-box" style="background:#ffffff; text-align:center;">
            <div style="font-size: 18px; color: #0284c7; margin-bottom: 3px;"><i class="fa-solid fa-user-doctor"></i></div>
            <strong style="color: #0f172a; font-size: 8.5px;">1. Excelência Clínica</strong>
            <p style="font-size: 7.4px; color: #64748b; margin-top: 2px;">Triagem guiada SOAP em < 60s, motor CDSS 4D, Beers e rastreio de sepse qSOFA.</p>
          </div>
          <div class="card-box" style="background:#ffffff; text-align:center;">
            <div style="font-size: 18px; color: #0d9488; margin-bottom: 3px;"><i class="fa-solid fa-flask-vial"></i></div>
            <strong style="color: #0f172a; font-size: 8.5px;">2. Laboratório Remoto</strong>
            <p style="font-size: 7.4px; color: #64748b; margin-top: 2px;">Catálogo com 8 TLRs RDC 786, controle de lote/validade e laudos oficiais A4.</p>
          </div>
          <div class="card-box" style="background:#ffffff; text-align:center;">
            <div style="font-size: 18px; color: #7c3aed; margin-bottom: 3px;"><i class="fa-solid fa-hand-holding-dollar"></i></div>
            <strong style="color: #0f172a; font-size: 8.5px;">3. Gestão &amp; Retenção</strong>
            <p style="font-size: 7.4px; color: #64748b; margin-top: 2px;">Follow-up D+2, Refill D-5 WhatsApp, PDV dissociado, DRE e cupom térmico 80mm.</p>
          </div>
        </div>
      </div>

      <!-- Screenshot 1 -->
      <div class="screenshot-frame">
        <img src="${imgDashboard}" alt="Dashboard Executivo e Métricas">
        <div class="screenshot-legend">
          <span><strong>Figura 01:</strong> Cockpit Executivo do Consultório: KPIs em Tempo Real, Gráfico 3D Rosca Glossy e Esfera Polar CDSS.</span>
          <span>Versão 3.1.0 Enterprise</span>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Proposta Técnica &amp; Diretrizes de Negócio v6</div>
      <div>Página 2 de 8</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 3: ARQUITETURA TÉCNICA, ENGENHARIA DE SOFTWARE E RESILIÊNCIA -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-microchip"></i> 2. Arquitetura Técnica &amp; Engenharia de Software</div>
        <div class="page-header-meta">Stack &amp; Resiliência</div>
      </div>

      <p style="font-size: 8.2px; color: #334155; margin-bottom: 6px;">
        A plataforma foi desenvolvida sob o paradigma <strong>Offline-First Híbrido</strong>, garantindo que o consultório farmacêutico nunca trave ou interrompa o atendimento ao paciente, mesmo em cenários de oscilação severa ou queda total de internet.
      </p>

      <table class="table-tech">
        <thead>
          <tr>
            <th style="width: 110px;">Camada</th>
            <th style="width: 140px;">Tecnologia Homologada</th>
            <th>Vantagem Arquitetural &amp; Impacto Operacional</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Core Frontend</strong></td>
            <td>Vanilla JavaScript (ES6+ Modules)</td>
            <td>Zero overhead de frameworks pesados. Carregamento inicial em < 100ms e autonomia total de DOM.</td>
          </tr>
          <tr>
            <td><strong>Persistência Local</strong></td>
            <td>IndexedDB / LibSQL WASM (LocalDB)</td>
            <td>Atendimentos, sinais vitais e receitas são salvos no dispositivo sem depender de internet ativa.</td>
          </tr>
          <tr>
            <td><strong>Banco Distribuído</strong></td>
            <td>Turso Cloud (LibSQL Distribuído)</td>
            <td>SQLite distribuído com latência submilisegundo em nós de borda para sincronização multi-dispositivos.</td>
          </tr>
          <tr>
            <td><strong>Motor Clínico CDSS 4D</strong></td>
            <td>Algoritmo Multidimensional Proprietário</td>
            <td>Cruzamento Fármaco x Fármaco, Alergias, Comorbidades e Critérios de Beers em tempo real.</td>
          </tr>
          <tr>
            <td><strong>Rastreio de Sepse</strong></td>
            <td>Surviving Sepsis Campaign / qSOFA</td>
            <td>Identificação precoce de disfunção orgânica (PAS, FR, Glasgow) com bloqueio de MIPs e Guia SAMU.</td>
          </tr>
          <tr>
            <td><strong>Chancela Digital</strong></td>
            <td>ICP-Brasil / GOV.BR com SHA-256</td>
            <td>Assinatura matemática inviolável e QR Code validador oficial conforme Lei nº 14.063/2020.</td>
          </tr>
          <tr>
            <td><strong>Comunicação por Voz/Vídeo</strong></td>
            <td>Web Speech API &amp; WebRTC P2P</td>
            <td>Ditado contínuo em português para anamnese e sala de teleconsulta farmacêutica criptografada.</td>
          </tr>
          <tr>
            <td><strong>Build &amp; Testes</strong></td>
            <td>Vite 5.4 + Vitest Test Runner</td>
            <td>Build em 2.9s no Vercel e 100% de testes unitários automatizados cobrindo regras clínicas críticas.</td>
          </tr>
        </tbody>
      </table>

      <!-- Screenshot 2 -->
      <div class="screenshot-frame" style="margin-top: 6px;">
        <img src="${imgBalcao}" alt="Balcão Clínico e Triagem SOAP">
        <div class="screenshot-legend">
          <span><strong>Figura 02:</strong> Balcão Clínico em 5 Passos: Anamnese Guiada, CDSS 4D Ativo, Beers e Rastreio de Sepse.</span>
          <span>Tempo de Atendimento &lt; 60 segundos</span>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Proposta Técnica &amp; Diretrizes de Negócio v6</div>
      <div>Página 3 de 8</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 4: MÓDULOS CLÍNICOS AVANÇADOS — TELEMETRIA & TLR (RDC 786/2023) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-heart-pulse"></i> 3. Telemetria Gráfica &amp; Testes Rápidos (TLR)</div>
        <div class="page-header-meta">RDC ANVISA 786/2023</div>
      </div>

      <div class="grid-2" style="margin-bottom: 6px;">
        <div>
          <!-- Screenshot 3 -->
          <div class="screenshot-frame">
            <img src="${imgProntuario}" alt="Telemetria de Sinais Vitais no Prontuário">
            <div class="screenshot-legend">
              <span><strong>Figura 03:</strong> Telemetria Gráfica de PA e Glicose no Prontuário.</span>
              <span>Tendências Longitudinais</span>
            </div>
          </div>
          <div class="card-box">
            <div class="card-box-header"><i class="fa-solid fa-chart-line"></i> Curvas de PA e Glicemia</div>
            <p style="font-size: 7.7px; color: #475569; line-height: 1.35;">
              Visualização gráfica das medições de Pressão Arterial Sistólica/Diastólica e Glicemia Capilar ao longo dos meses. Permite ao farmacêutico e ao médico assistente verificar a eficácia do tratamento anti-hipertensivo e hipoglicemiante.
            </p>
          </div>
        </div>

        <div>
          <!-- Screenshot 4 -->
          <div class="screenshot-frame">
            <img src="${imgTlr}" alt="Testes Laboratoriais Remotos TLR">
            <div class="screenshot-legend">
              <span><strong>Figura 04:</strong> Módulo TLR RDC 786: Rastreio de Lote e Laudo A4.</span>
              <span>8 Testes Homologados</span>
            </div>
          </div>
          <div class="card-box">
            <div class="card-box-header"><i class="fa-solid fa-vials"></i> Conformidade RDC 786/2023</div>
            <p style="font-size: 7.7px; color: #475569; line-height: 1.35;">
              Exigência sanitária de registro de <strong>Lote</strong> e <strong>Data de Validade</strong> do kit comercial reagente. Emissão imediata de laudo técnico oficial em PDF A4 com termo de responsabilidade e identificação do RT.
            </p>
          </div>
        </div>
      </div>

      <div class="card-box">
        <div class="card-box-header"><i class="fa-solid fa-list-check"></i> Catálogo Completo de Testes Laboratoriais Remotos (TLR) Homologados</div>
        <div class="grid-4" style="margin-top: 3px;">
          <div class="card-box" style="background:#ffffff; font-size: 7.4px;">
            <strong style="color:#0f172a;">1. Hemoglobina Glicada</strong><br>
            <span style="color:#64748b;">Controle trimestral do diabetes</span>
          </div>
          <div class="card-box" style="background:#ffffff; font-size: 7.4px;">
            <strong style="color:#0f172a;">2. Perfil Lipídico</strong><br>
            <span style="color:#64748b;">Colesterol, HDL, Triglicerídeos e LDL</span>
          </div>
          <div class="card-box" style="background:#ffffff; font-size: 7.4px;">
            <strong style="color:#0f172a;">3. Beta-HCG Rápido</strong><br>
            <span style="color:#64748b;">Gravidez com termo informado</span>
          </div>
          <div class="card-box" style="background:#ffffff; font-size: 7.4px;">
            <strong style="color:#0f172a;">4. COVID-19 + Influenza</strong><br>
            <span style="color:#64748b;">Painel diferencial respiratório</span>
          </div>
          <div class="card-box" style="background:#ffffff; font-size: 7.4px;">
            <strong style="color:#0f172a;">5. Dengue NS1 / IgG/IgM</strong><br>
            <span style="color:#64748b;">Triagem rápida de arboviroses</span>
          </div>
          <div class="card-box" style="background:#ffffff; font-size: 7.4px;">
            <strong style="color:#0f172a;">6. Glicemia Capilar</strong><br>
            <span style="color:#64748b;">Triagem de hipo/hiperglicemia</span>
          </div>
          <div class="card-box" style="background:#ffffff; font-size: 7.4px;">
            <strong style="color:#0f172a;">7. Strep A</strong><br>
            <span style="color:#64748b;">Faringite bacteriana vs viral</span>
          </div>
          <div class="card-box" style="background:#ffffff; font-size: 7.4px;">
            <strong style="color:#0f172a;">8. Painel Duo ISTs</strong><br>
            <span style="color:#64748b;">HIV 1/2 + Sífilis com acolhimento</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Proposta Técnica &amp; Diretrizes de Negócio v6</div>
      <div>Página 4 de 8</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 5: AUTOMAÇÃO DE PÓS-ATENDIMENTO & DECLARAÇÃO DE SERVIÇO (DSF) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-comments"></i> 4. Automação Pós-Atendimento &amp; Declarações DSF</div>
        <div class="page-header-meta">Fidelização &amp; Emissão Oficial</div>
      </div>

      <div class="grid-2" style="margin-bottom: 6px;">
        <div>
          <!-- Screenshot 5 -->
          <div class="screenshot-frame">
            <img src="${imgPosCare}" alt="Automação Pós-Atendimento e Adesão">
            <div class="screenshot-legend">
              <span><strong>Figura 05:</strong> Central de Follow-up D+2 e Recompra D-5.</span>
              <span>Adesão Contínua</span>
            </div>
          </div>
          <div class="card-box">
            <div class="card-box-header"><i class="fa-brands fa-whatsapp" style="color:#25d366;"></i> Automação WhatsApp</div>
            <p style="font-size: 7.7px; color: #475569; line-height: 1.35;">
              Disparo inteligente em 1 clique de mensagens de acompanhamento clínico 48h após a consulta (Follow-up D+2) e lembrete de recompra programada 5 dias antes de acabar a caixa do remédio crônico (Refill D-5).
            </p>
          </div>
        </div>

        <div>
          <!-- Screenshot 6 -->
          <div class="screenshot-frame">
            <img src="${imgDsf}" alt="Janela Modal de Consulta Prévia da DSF">
            <div class="screenshot-legend">
              <span><strong>Figura 06:</strong> Modal de Consulta da DSF, PDF A4 e Cupom Térmico.</span>
              <span>Validação Prévia</span>
            </div>
          </div>
          <div class="card-box">
            <div class="card-box-header"><i class="fa-solid fa-receipt"></i> Dupla Modalidade de Entrega</div>
            <p style="font-size: 7.7px; color: #475569; line-height: 1.35;">
              O farmacêutico revisa a Declaração de Serviço (DSF) na tela antes de exportar. Pode gerar o PDF A4 timbrado com chancela ICP-Brasil ou imprimir o cupom térmico (80mm/58mm) em 3 segundos no balcão.
            </p>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-stamp"></i> Chancela Digital ICP-Brasil / GOV.BR</div>
          <p style="font-size: 7.8px; color: #334155; margin-bottom: 3px;">
            Conformidade plena com a <strong>Medida Provisória nº 2.200-2/2001</strong> e <strong>Lei Federal nº 14.063/2020</strong>:
          </p>
          <ul style="font-size: 7.5px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li>Hash criptográfico SHA-256 gerado exclusivamente sobre os dados do atendimento.</li>
            <li>QR Code validador apontando para portal público de verificação CFF/ITI.</li>
            <li>Número de protocolo oficial único padrão <code>DSF-AAAAMMDD-XXXX</code> para auditorias.</li>
          </ul>
        </div>

        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-print"></i> Economia Operacional com Cupom Térmico (80mm)</div>
          <p style="font-size: 7.8px; color: #334155; margin-bottom: 3px;">
            Agilidade inigualável para o dia a dia da farmácia:
          </p>
          <ul style="font-size: 7.5px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li>Compatível com impressoras térmicas ESC/POS padrão de mercado (Epson, Elgin, Bematech).</li>
            <li>Entrega imediata ao paciente contendo queixa, MIPs receitados e valores aferidos.</li>
            <li>Redução de até 85% nos custos com insumos em relação à impressão A4 em folha inteira.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Proposta Técnica &amp; Diretrizes de Negócio v6</div>
      <div>Página 5 de 8</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 6: GESTÃO DE CLIENTES, ESTOQUE FEFO & CONTROLE FINANCEIRO -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-boxes-packing"></i> 5. Operação Integrada: Clientes, Estoque &amp; Financeiro</div>
        <div class="page-header-meta">Gestão 360°</div>
      </div>

      <div class="grid-3" style="margin-bottom: 6px;">
        <div>
          <!-- Screenshot 7 -->
          <div class="screenshot-frame">
            <img src="${imgClientes}" alt="Gestão de Clientes e Ações Rápidas">
            <div class="screenshot-legend">
              <span><strong>Figura 07:</strong> Clientes e Ações Rápidas.</span>
            </div>
          </div>
          <div class="card-box" style="font-size: 7.5px;">
            <strong style="color:#0f172a;"><i class="fa-solid fa-users"></i> Ações em 1 Clique</strong><br>
            <span style="color:#475569;">Barra unificada para disparar Triagem SOAP, Vacinação, Portal PWA, Refill e TLR direto da tabela de clientes.</span>
          </div>
        </div>

        <div>
          <!-- Screenshot 8 -->
          <div class="screenshot-frame">
            <img src="${imgEstoque}" alt="Estoque e Rastreabilidade FEFO">
            <div class="screenshot-legend">
              <span><strong>Figura 08:</strong> Estoque e Rastreio FEFO.</span>
            </div>
          </div>
          <div class="card-box" style="font-size: 7.5px;">
            <strong style="color:#0f172a;"><i class="fa-solid fa-boxes-stacked"></i> Rastreabilidade FEFO</strong><br>
            <span style="color:#475569;">Dispensação priorizada por data de expiração, alertas amarelos &lt; 90 dias e importação de XML de NF-e da distribuidora.</span>
          </div>
        </div>

        <div>
          <!-- Screenshot 9 -->
          <div class="screenshot-frame">
            <img src="${imgFinanceiro}" alt="Controle Financeiro e Fluxo de Caixa">
            <div class="screenshot-legend">
              <span><strong>Figura 09:</strong> Fluxo de Caixa &amp; DRE.</span>
            </div>
          </div>
          <div class="card-box" style="font-size: 7.5px;">
            <strong style="color:#0f172a;"><i class="fa-solid fa-sack-dollar"></i> Receita Dissociada</strong><br>
            <span style="color:#475569;">Separação contábil entre receita clínica (alta margem) e vendas de balcão, despesas e DRE em PDF com 1 clique.</span>
          </div>
        </div>
      </div>

      <!-- Screenshot 10 -->
      <div class="screenshot-frame">
        <img src="${imgSandbox}" alt="Configurações e Hard Reset Seguro">
        <div class="screenshot-legend">
          <span><strong>Figura 10:</strong> Governança &amp; Segurança: Painel de Geradores Sandbox e Tríade de Limpeza / Hard Reset com Senha Master.</span>
          <span>Zero Resíduos &bull; Sincronização Turso Cloud</span>
        </div>
      </div>

      <div class="card-box" style="margin-top: 5px;">
        <div class="card-box-header"><i class="fa-solid fa-shield-halved"></i> Governança de Dados &amp; Tríade de Limpeza Segura (Hard Reset)</div>
        <div class="grid-3">
          <div class="card-box" style="background:#ffffff; font-size:7.4px;">
            <strong style="color:#0369a1;"><i class="fa-solid fa-broom"></i> 1. Limpar Simulação</strong><br>
            <span style="color:#64748b;">Exclui apenas registros de teste <code>[SIMULADO]</code>, preservando clientes e vendas reais.</span>
          </div>
          <div class="card-box" style="background:#ffffff; font-size:7.4px;">
            <strong style="color:#92400e;"><i class="fa-solid fa-eraser"></i> 2. Limpar Produção Real</strong><br>
            <span style="color:#64748b;">Remove testes de pré-inauguração mantendo operadores e configurações intactos.</span>
          </div>
          <div class="card-box" style="background:#ffffff; font-size:7.4px;">
            <strong style="color:#991b1b;"><i class="fa-solid fa-bomb"></i> 3. Hard Reset de Fábrica</strong><br>
            <span style="color:#64748b;">Purga atômica e simultânea no IndexedDB e Turso Cloud com dupla validação Master.</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Proposta Técnica &amp; Diretrizes de Negócio v6</div>
      <div>Página 6 de 8</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 7: BENCHMARKING DE MERCADO (v3.1) & DIFERENCIAIS COMPETITIVOS -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-trophy"></i> 6. Matriz Comparativa de Mercado (Benchmarking v3.1)</div>
        <div class="page-header-meta">Diferenciais Exclusivos</div>
      </div>

      <p style="font-size: 8.2px; color: #334155; margin-bottom: 6px;">
        Comparativo estratégico entre o **CRM Clínico Farmacêutico v3.1.0 Enterprise** e os principais sistemas médicos e de farmácia disponíveis no mercado:
      </p>

      <table class="table-tech">
        <thead>
          <tr>
            <th>Critério de Avaliação</th>
            <th style="background:#0d9488; text-align:center;">CRM Clínico v3.1</th>
            <th style="text-align:center;">Clinicarx</th>
            <th style="text-align:center;">ERPs (Trier / Linx)</th>
            <th style="text-align:center;">Softwares Médicos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Foco Central da Solução</strong></td>
            <td style="color:#0d9488; font-weight:700; text-align:center;">Clínico + Balcão + Gestão 360°</td>
            <td style="text-align:center;">Apenas Serviços Clínicos</td>
            <td style="text-align:center;">Apenas Fiscal e PDV</td>
            <td style="text-align:center;">Apenas Consultório Médico</td>
          </tr>
          <tr>
            <td><strong>Tempo de Triagem SOAP</strong></td>
            <td style="color:#0d9488; font-weight:700; text-align:center;">&lt; 60s (Atalhos F1-F12)</td>
            <td style="text-align:center;">10 a 15 minutos</td>
            <td style="text-align:center;">❌ Não possui</td>
            <td style="text-align:center;">20 a 30 minutos</td>
          </tr>
          <tr>
            <td><strong>CDSS 4D + Beers + Sepse (qSOFA)</strong></td>
            <td style="color:#0d9488; font-weight:700; text-align:center;">Nativo em Tempo Real</td>
            <td style="text-align:center;">Básico (Alertas simples)</td>
            <td style="text-align:center;">❌ Inexistente</td>
            <td style="text-align:center;">Moderado (foco médico)</td>
          </tr>
          <tr>
            <td><strong>Módulo TLR (RDC 786/2023)</strong></td>
            <td style="color:#0d9488; font-weight:700; text-align:center;">8 Testes + Lote/Validade + Laudo</td>
            <td style="text-align:center;">Sim (Cobrado à parte)</td>
            <td style="text-align:center;">❌ Inexistente</td>
            <td style="text-align:center;">❌ Inexistente</td>
          </tr>
          <tr>
            <td><strong>Automação Pós-Atendimento (D+2 / D-5)</strong></td>
            <td style="color:#0d9488; font-weight:700; text-align:center;">Nativa com Scripts WhatsApp</td>
            <td style="text-align:center;">❌ Inexistente</td>
            <td style="text-align:center;">❌ Inexistente</td>
            <td style="text-align:center;">Lembrete de consulta</td>
          </tr>
          <tr>
            <td><strong>Chancela Digital ICP-Brasil / GOV.BR</strong></td>
            <td style="color:#0d9488; font-weight:700; text-align:center;">Hash SHA-256 + QR Code ITI</td>
            <td style="text-align:center;">Sim</td>
            <td style="text-align:center;">❌ Inexistente</td>
            <td style="text-align:center;">Sim</td>
          </tr>
          <tr>
            <td><strong>Emissão em Cupom Térmico (80mm)</strong></td>
            <td style="color:#0d9488; font-weight:700; text-align:center;">Sim (Economia de 85% em papel)</td>
            <td style="text-align:center;">❌ Apenas PDF A4</td>
            <td style="text-align:center;">Apenas fiscal</td>
            <td style="text-align:center;">❌ Apenas PDF A4</td>
          </tr>
          <tr>
            <td><strong>Resiliência Offline-First</strong></td>
            <td style="color:#0d9488; font-weight:700; text-align:center;">Total (IndexedDB + Turso)</td>
            <td style="text-align:center;">❌ Requer 100% internet</td>
            <td style="text-align:center;">Total (Local DB)</td>
            <td style="text-align:center;">❌ Requer 100% internet</td>
          </tr>
          <tr>
            <td><strong>Portal do Paciente PWA</strong></td>
            <td style="color:#0d9488; font-weight:700; text-align:center;">Nativo ("Minha Saúde" PWA)</td>
            <td style="text-align:center;">App proprietário pesado</td>
            <td style="text-align:center;">❌ Inexistente</td>
            <td style="text-align:center;">App proprietário</td>
          </tr>
          <tr>
            <td><strong>Hard Reset Atômico Seguro</strong></td>
            <td style="color:#0d9488; font-weight:700; text-align:center;">Sim (Tríade com Senha Master)</td>
            <td style="text-align:center;">❌ Não disponível</td>
            <td style="text-align:center;">❌ Suporte especializado</td>
            <td style="text-align:center;">❌ Não disponível</td>
          </tr>
          <tr>
            <td><strong>Custo de Licenciamento</strong></td>
            <td style="color:#0d9488; font-weight:700; text-align:center;">Altamente Competitivo</td>
            <td style="text-align:center;">Alto (Por loja/módulo)</td>
            <td style="text-align:center;">Alto (Mensalidade pesada)</td>
            <td style="text-align:center;">Médio/Alto (Por médico)</td>
          </tr>
        </tbody>
      </table>

      <div class="grid-2" style="margin-top: 8px;">
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-lock"></i> Conformidade Sanitária Blindada</div>
          <p style="font-size: 7.8px; color: #475569; line-height: 1.35;">
            O sistema atende com rigor cirúrgico às exigências de fiscalização do <strong>Conselho Regional de Farmácia (CRF)</strong>, da <strong>Vigilância Sanitária Local (VISA)</strong> e da <strong>ANVISA</strong>, garantindo que nenhum documento clínico seja emitido sem rastreabilidade completa de lotes, datas e identificação do farmacêutico RT.
          </p>
        </div>
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-chart-pie"></i> Retorno do Investimento Comprovado</div>
          <p style="font-size: 7.8px; color: #475569; line-height: 1.35;">
            Uma farmácia com volume moderado de 15 atendimentos clínicos/dia e 3 exames TLR/dia recupera o valor integral do software na primeira semana de operação através das margens dos procedimentos e da redução do churn de tratamentos contínuos.
          </p>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Proposta Técnica &amp; Diretrizes de Negócio v6</div>
      <div>Página 7 de 8</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 8: ROADMAP ESTRATÉGICO, PARECER EXECUTIVO & ASSINATURA -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-compass"></i> 7. Roadmap de Evolução &amp; Parecer Executivo</div>
        <div class="page-header-meta">Homologação Oficial</div>
      </div>

      <div class="card-box" style="margin-bottom: 8px;">
        <div class="card-box-header"><i class="fa-solid fa-timeline"></i> Cronograma de Entregas &amp; Evolução Tecnológica</div>
        <table class="table-tech">
          <thead>
            <tr>
              <th style="width: 80px;">Fase</th>
              <th style="width: 140px;">Módulos &amp; Entregas</th>
              <th style="width: 90px;">Prazo</th>
              <th>Status Atual</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Versão 3.1.0</strong></td>
              <td>TLR RDC 786, Pós-Atendimento WhatsApp D+2/D-5, Chancela ICP-Brasil, Cupom Térmico 80mm, Telemetria Gráfica e Hard Reset Seguro</td>
              <td>Setembro / 2026</td>
              <td><span class="badge-tag" style="background:#dcfce7; color:#166534;"><i class="fa-solid fa-check"></i> 100% Homologado</span></td>
            </tr>
            <tr>
              <td><strong>Versão 3.2.0</strong></td>
              <td>Integração Oficial Meta WhatsApp Cloud API (disparos em background sem depender do WhatsApp Web) e API de Bulário ANVISA</td>
              <td>Outubro / 2026</td>
              <td><span class="badge-tag" style="background:#e0f2fe; color:#0369a1;"><i class="fa-solid fa-gears"></i> Em Desenvolvimento</span></td>
            </tr>
            <tr>
              <td><strong>Versão 3.3.0</strong></td>
              <td>Módulo Corporativo Multi-Filiais para Grandes Redes Farmacêuticas e Assinatura ICP-Brasil em Nuvem via BirdID (Soluti)</td>
              <td>Novembro / 2026</td>
              <td><span class="badge-tag" style="background:#fef3c7; color:#92400e;"><i class="fa-solid fa-calendar"></i> Planejado</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card-box" style="margin-bottom: 10px;">
        <div class="card-box-header"><i class="fa-solid fa-file-contract"></i> Parecer Técnico e Executivo de Homologação</div>
        <p style="font-size: 8.2px; color: #334155; line-height: 1.4; margin-bottom: 6px;">
          O <strong>CRM Clínico Farmacêutico &amp; CDSS 4D (v3.1.0 Enterprise Edition)</strong> reúne os mais modernos padrões mundiais de engenharia de software em saúde, interoperabilidade clínica e conformidade sanitária brasileira.
        </p>
        <p style="font-size: 8.2px; color: #334155; line-height: 1.4;">
          A incorporação nativa de <strong>exames laboratoriais remotos (TLR - RDC 786/2023)</strong>, <strong>automação de adesão por WhatsApp (Follow-up D+2 e Refill D-5)</strong>, <strong>chancela digital com validade jurídica plena</strong> e <strong>emissão em cupom térmico de baixo custo</strong> posiciona esta plataforma como o ativo tecnológico de maior retorno e segurança operacional para farmácias e redes farmacêuticas em todo o território nacional.
        </p>
      </div>

      <div class="grid-2" style="margin-top: 10px;">
        <div class="card-box" style="text-align: center; padding: 12px;">
          <div style="font-size: 22px; color: #0d9488; margin-bottom: 4px;"><i class="fa-solid fa-signature"></i></div>
          <strong style="color: #0f172a; font-size: 9.2px;">Dr. Marcelo Mazaro</strong><br>
          <span style="font-size: 7.8px; color: #64748b;">Farmacêutico Responsável Técnico &bull; CRF-SP 54180</span><br>
          <span style="font-size: 7.2px; color: #94a3b8;">Autor e Arquiteto de Sistemas Clínicos</span>
        </div>

        <div class="card-box" style="text-align: center; padding: 12px;">
          <div style="font-size: 22px; color: #0284c7; margin-bottom: 4px;"><i class="fa-solid fa-certificate"></i></div>
          <strong style="color: #0f172a; font-size: 9.2px;">Homologação Corporativa</strong><br>
          <span style="font-size: 7.8px; color: #64748b;">Plataforma CRM Clínico v3.1.0 Enterprise</span><br>
          <span style="font-size: 7.2px; color: #94a3b8;">Setembro de 2026 &bull; São Paulo, Brasil</span>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Proposta Técnica &amp; Diretrizes de Negócio v6</div>
      <div>Página 8 de 8 &bull; Fim do Documento</div>
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
    console.log('📄 Renderizando documento da Proposta Técnica v6 no Puppeteer...');
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 120000 });
    
    // Aguardar fontes carregarem
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
    
    console.log('🖨️ Compilando PDF oficial da Proposta Técnica v6 em alta resolução...');
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      printBackground: true
    });
    await browser.close();
    
    const stats = fs.statSync(outputPath);
    console.log(`✅ Proposta Técnica v6 gerada com sucesso!`);
    console.log(`📁 Arquivo: ${outputPath}`);
    console.log(`⚖️ Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    console.error('❌ Erro ao gerar Proposta Técnica v6:', error);
    process.exit(1);
  }
}

generateTechnicalProposalPDF();
