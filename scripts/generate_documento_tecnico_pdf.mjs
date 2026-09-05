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

async function generateDocumentoTecnicoPDF() {
  const outputPath = path.resolve('DOCUMENTO_TECNICO_PROPOSTA_NEGOCIO.pdf');
  console.log('📄 Carregando capturas de tela em alta resolução para o DOCUMENTO TÉCNICO...');

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

  console.log('🖋️ Construindo DOCUMENTO_TECNICO_PROPOSTA_NEGOCIO.pdf com 12 páginas A4...');

  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Documento Técnico & Diretrizes de Negócio — CRM Clínico Farmacêutico v3.1.0 Enterprise</title>
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
      background: radial-gradient(circle at 100% 0%, #064e3b 0%, #0f172a 45%, #020617 100%);
      color: #ffffff;
      padding: 16mm 16mm 14mm 16mm;
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
      font-size: 25px;
      font-weight: 900;
      line-height: 1.15;
      margin-top: 14px;
      background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 40%, #2dd4bf 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cover-subtitle {
      font-size: 10.8px;
      color: #94a3b8;
      margin-top: 8px;
      line-height: 1.4;
      max-width: 92%;
    }

    .cover-pillars {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 18px;
    }

    .cover-pillar-card {
      background: rgba(30, 41, 59, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 10px;
      backdrop-filter: blur(8px);
    }

    .cover-pillar-icon {
      font-size: 18px;
      color: #38bdf8;
      margin-bottom: 5px;
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
      padding-bottom: 5px;
      border-bottom: 1.5px solid #e2e8f0;
      margin-bottom: 6px;
    }

    .page-header-title {
      font-family: 'Outfit', sans-serif;
      font-size: 11.5px;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .page-header-meta {
      font-size: 7.6px;
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
      padding-top: 4px;
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
      padding: 6px 8px;
    }

    .card-box-header {
      font-family: 'Outfit', sans-serif;
      font-size: 8.8px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 3px;
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
      padding: 5px 8px;
      border-radius: 6px;
      font-size: 7.7px;
      line-height: 1.35;
      margin-top: 4px;
      margin-bottom: 4px;
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
      max-height: 84mm;
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

    .ascii-block {
      background: #0f172a;
      color: #38bdf8;
      font-family: 'JetBrains Mono', monospace;
      font-size: 6.8px;
      padding: 7px;
      border-radius: 6px;
      line-height: 1.25;
      overflow: hidden;
      white-space: pre;
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
        <i class="fa-solid fa-file-contract"></i> Documento Arquitetural &amp; Diretrizes de Negócio
      </div>
      <div class="cover-title">
        CRM Clínico Farmacêutico &amp;<br>
        Sistema de Suporte à Decisão Clínica (CDSS 4D)
      </div>
      <div class="cover-subtitle">
        Documento técnico oficial, diretrizes de engenharia de software, conformidade sanitária e modelo econômico para transformação de farmácias em centros resolutivos de cuidados em saúde.
      </div>
      <div style="margin-top: 10px; display: flex; gap: 8px;">
        <span style="background: rgba(14, 165, 233, 0.25); border: 1px solid rgba(56, 189, 248, 0.4); padding: 3px 8px; border-radius: 4px; font-size: 7.8px; color: #38bdf8;">Versão 3.1.0 Enterprise</span>
        <span style="background: rgba(16, 185, 129, 0.25); border: 1px solid rgba(52, 211, 153, 0.4); padding: 3px 8px; border-radius: 4px; font-size: 7.8px; color: #34d399;">RDC ANVISA nº 786/2023 (TLR)</span>
        <span style="background: rgba(168, 85, 247, 0.25); border: 1px solid rgba(192, 132, 252, 0.4); padding: 3px 8px; border-radius: 4px; font-size: 7.8px; color: #c084fc;">Chancela ICP-Brasil / GOV.BR</span>
      </div>
    </div>

    <div class="cover-pillars">
      <div class="cover-pillar-card">
        <div class="cover-pillar-icon"><i class="fa-solid fa-gauge-high"></i></div>
        <div class="cover-pillar-title">1. Velocidade &amp; Produtividade</div>
        <div class="cover-pillar-desc">Triagem SOAP em menos de 60s, navegação 100% por teclado (F1-F12), ditado clínico por voz e emissão em cupom térmico (80mm).</div>
      </div>
      <div class="cover-pillar-card">
        <div class="cover-pillar-icon"><i class="fa-solid fa-shield-virus"></i></div>
        <div class="cover-pillar-title">2. Segurança CDSS 4D &amp; TLR</div>
        <div class="cover-pillar-desc">Rastreio de sepse (qSOFA/SSC), Critérios de Beers, 8 testes rápidos laboratoriais (RDC 786) e chancela digital SHA-256.</div>
      </div>
      <div class="cover-pillar-card">
        <div class="cover-pillar-icon"><i class="fa-solid fa-sack-dollar"></i></div>
        <div class="cover-pillar-title">3. Retenção &amp; Monetização</div>
        <div class="cover-pillar-desc">Automação de Follow-up D+2 e Recompra D-5 via WhatsApp, telemetria gráfica longitudinal e controle financeiro com DRE.</div>
      </div>
    </div>

    <div class="cover-footer">
      <div>
        <strong>Autor &amp; Responsável Técnico:</strong> Dr. Marcelo Mazaro (CRF-SP 54180)<br>
        <strong>Marco Regulatório:</strong> CFF 585/586/654 &bull; RDC 786/2023 &bull; RDC 44/2009 &bull; ICP-Brasil &bull; LGPD 13.709/2018
      </div>
      <div style="text-align: right;">
        <strong>Homologação:</strong> Setembro / 2026<br>
        <strong>Classificação:</strong> Documento Corporativo Oficial
      </div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 2: SEÇÃO 1 — VISÃO DE MERCADO, PROPOSTA DE VALOR & ROI -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-chart-line"></i> 1. Proposta de Negócio &amp; Visão de Mercado</div>
        <div class="page-header-meta">Hub de Saúde &amp; Retorno Econômico</div>
      </div>

      <div class="grid-2" style="margin-bottom: 7px;">
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-bullseye"></i> O Novo Hub de Saúde no Varejo Farmacêutico</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            A farmácia brasileira deixou de ser um simples balcão de vendas de caixas de medicamentos para se consolidar como porta de entrada primária de saúde (Lei nº 13.021/2014, Resoluções CFF nº 585/586 e RDC ANVISA nº 786/2023).
          </p>
          <ul style="font-size: 7.6px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li><strong>Monetização de Consultas:</strong> Cobrança direta de atendimentos clínicos e testes rápidos.</li>
            <li><strong>Resolução de Balcão:</strong> Triagem clínica em < 60 segundos com segurança sanitária.</li>
            <li><strong>Prevenção de Abandono:</strong> 45% dos pacientes crônicos desistem do tratamento sem acompanhamento.</li>
          </ul>
        </div>

        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-coins"></i> As 5 Vias de Faturamento &amp; Economia</div>
          <p style="font-size: 8px; color: #334155; margin-bottom: 4px;">
            Adoção do CRM Clínico Farmacêutico viabiliza ganhos operacionais imediatos:
          </p>
          <ul style="font-size: 7.6px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li><strong>Consultas Farmacêuticas:</strong> R$ 30 a R$ 80 por consulta estruturada.</li>
            <li><strong>Exames TLR (RDC 786):</strong> Margem líquida de 65% a 80% sobre testes rápidos.</li>
            <li><strong>Aumento do LTV (Refill D-5):</strong> +42% de recompra recorrente de medicamentos contínuos.</li>
            <li><strong>Economia com Cupom Térmico:</strong> Até 85% de redução em gastos com papel e toner A4.</li>
            <li><strong>Blindagem Sanitária:</strong> Rastreabilidade de lotes eliminando autuações da Vigilância.</li>
          </ul>
        </div>
      </div>

      <div class="card-box" style="margin-bottom: 7px;">
        <div class="card-box-header"><i class="fa-solid fa-hand-holding-medical"></i> Arquitetura Tripartite de Valor da Plataforma</div>
        <div class="grid-3">
          <div class="card-box" style="background:#ffffff; text-align:center;">
            <div style="font-size: 18px; color: #0284c7; margin-bottom: 3px;"><i class="fa-solid fa-user-doctor"></i></div>
            <strong style="color: #0f172a; font-size: 8.5px;">1. Eficiência Clínica</strong>
            <p style="font-size: 7.4px; color: #64748b; margin-top: 2px;">Triagem guiada SOAP em < 60s, ditado por voz, teleconsulta WebRTC e atalhos F1-F12.</p>
          </div>
          <div class="card-box" style="background:#ffffff; text-align:center;">
            <div style="font-size: 18px; color: #0d9488; margin-bottom: 3px;"><i class="fa-solid fa-vials"></i></div>
            <strong style="color: #0f172a; font-size: 8.5px;">2. Segurança CDSS 4D &amp; TLR</strong>
            <p style="font-size: 7.4px; color: #64748b; margin-top: 2px;">Cruzamento em 4 dimensões, rastreio de sepse qSOFA, 8 testes TLR e laudos A4.</p>
          </div>
          <div class="card-box" style="background:#ffffff; text-align:center;">
            <div style="font-size: 18px; color: #7c3aed; margin-bottom: 3px;"><i class="fa-solid fa-chart-pie"></i></div>
            <strong style="color: #0f172a; font-size: 8.5px;">3. Gestão &amp; Retenção</strong>
            <p style="font-size: 7.4px; color: #64748b; margin-top: 2px;">Follow-up D+2, Refill D-5 via WhatsApp, PDV dissociado, DRE e cupom térmico 80mm.</p>
          </div>
        </div>
      </div>

      <div class="alert-banner alert-success">
        <i class="fa-solid fa-calculator"></i>
        <div>
          <strong>Retorno do Investimento (ROI Médio):</strong> Com apenas 3 exames TLR e 10 consultas por dia, a farmácia gera entre R$ 5.800 e R$ 14.500 de receita clínica líquida adicional por mês por consultório, pagando o investimento no software em poucos dias!
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Documento Técnico &amp; Diretrizes de Negócio v3.1.0</div>
      <div>Página 2 de 12</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 3: SEÇÃO 2 — ARQUITETURA TÉCNICA, ENGENHARIA DE SOFTWARE & STACK -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-network-wired"></i> 2. Arquitetura Técnica &amp; Engenharia de Software</div>
        <div class="page-header-meta">Resiliência Offline-First</div>
      </div>

      <div class="ascii-block" style="margin-bottom: 6px;">
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (SPA MODULAR)                           │
│  Vanilla JS (ES6+ Modules) │ Router Controller │ Keyboard Shortcuts (F1-F12)│
│  Vite 5.4+ │ Chart.js │ jsPDF │ Google Fonts Outfit/Inter │ FontAwesome 6   │
│  Web Speech API (Ditado Clínico) │ WebRTC P2P (Teleconsulta Farmacêutica)   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Event-Driven &amp; Async API Bridge
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    CAMADA DE PERSISTÊNCIA DUAL &amp; RESILIÊNCIA                │
│  LocalDB (IndexedDB / LibSQL WASM) ◄──────► Reconciliação Criptográfica     │
│  Zero-Downtime Offline-First                 Last-Write-Wins (LWW) Engine   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST / Serverless Sync
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                        BACKEND &amp; CLUSTER SERVERLESS                         │
│  Node.js / Express 4.19 │ Vercel Serverless │ Turso Cloud Cluster (LibSQL)  │
│  Hard Reset Atômico Dual-Store │ Autenticação RBAC com Duplo Fator Master   │
└─────────────────────────────────────────────────────────────────────────────┘</div>

      <table class="table-tech">
        <thead>
          <tr>
            <th style="width: 100px;">Camada</th>
            <th style="width: 135px;">Tecnologia Homologada</th>
            <th>Vantagem Arquitetural &amp; Justificativa Técnica</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Core Frontend</strong></td>
            <td>Vanilla JavaScript (ES6+ Modules)</td>
            <td>Sem overhead de frameworks pesados. Renderização ultrarrápida (< 100ms) e controle fino do ciclo de vida do DOM.</td>
          </tr>
          <tr>
            <td><strong>Persistência Local</strong></td>
            <td>IndexedDB / LibSQL WASM</td>
            <td>Arquitetura <strong>Offline-First</strong>. Atendimentos continuam funcionando sem interrupção caso a internet oscile ou caia.</td>
          </tr>
          <tr>
            <td><strong>Banco Distribuído</strong></td>
            <td>Turso Cloud (LibSQL Distribuído)</td>
            <td>SQLite distribuído com latência submilisegundo em nós de borda para sincronização multi-terminais.</td>
          </tr>
          <tr>
            <td><strong>Motor Clínico CDSS 4D</strong></td>
            <td>Motor Multidimensional Proprietário</td>
            <td>Cruzamento em tempo real Fármaco x Fármaco, Alergias, Comorbidades e Critérios de Beers para idosos.</td>
          </tr>
          <tr>
            <td><strong>Rastreio de Sepse</strong></td>
            <td>Surviving Sepsis Campaign (qSOFA)</td>
            <td>Avaliação contínua de PAS, FR e Glasgow com bloqueio de MIPs e emissão de Guia SAMU/UPA.</td>
          </tr>
          <tr>
            <td><strong>Chancela Digital</strong></td>
            <td>ICP-Brasil / GOV.BR com SHA-256</td>
            <td>Assinatura matemática inviolável e QR Code validador público oficial conforme Lei nº 14.063/2020.</td>
          </tr>
          <tr>
            <td><strong>Ditado por Voz &amp; Vídeo</strong></td>
            <td>Web Speech API &amp; WebRTC P2P</td>
            <td>Transcrição clínica contínua em português para anamnese e teleconsulta farmacêutica integrada ponto a ponto.</td>
          </tr>
          <tr>
            <td><strong>Build &amp; Testes</strong></td>
            <td>Vite 5.4 + Vitest Test Runner</td>
            <td>Build em 2.7s no Vercel e suíte Vitest com cobertura de testes unitários para regras clínicas críticas.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Documento Técnico &amp; Diretrizes de Negócio v3.1.0</div>
      <div>Página 3 de 12</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 4: SEÇÃO 3 — DESIGN SYSTEM & SEÇÃO 4 — MATURIDADE -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-palette"></i> 3. Design System &amp; 4. Diagnóstico de Maturidade</div>
        <div class="page-header-meta">Ergonomia &amp; Pontos Fortes</div>
      </div>

      <div class="grid-2" style="margin-bottom: 7px;">
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-moon"></i> Dark Slate Precision &amp; Tema Solar Anti-Reflexo</div>
          <p style="font-size: 7.8px; color: #334155; margin-bottom: 4px;">
            Projetado para ambientes de alta carga visual (consultório farmacêutico, plantões e luz solar direta):
          </p>
          <ul style="font-size: 7.5px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li><strong>Dark Mode Glassmorphism:</strong> Fundo Slate profundo com acentos HSL neon para máximo contraste em alertas.</li>
            <li><strong>Modo Solar Anti-Reflexo:</strong> Paleta clara de alta luminância (<code>#f8fafc</code> / <code>#0f172a</code>) para fachadas envidraçadas.</li>
            <li><strong>Modo Compacto Hospitalar (F11):</strong> Aumento de densidade de dados para monitores de PDV com tela reduzida.</li>
          </ul>
        </div>

        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-font"></i> Tipografia &amp; Navegação por Teclado</div>
          <ul style="font-size: 7.5px; color: #475569; padding-left: 14px; line-height: 1.35;">
            <li><strong>Headings &amp; KPIs:</strong> Fonte <em>Outfit</em> (Semi-bold, Bold, Extra-bold) para números de alto impacto.</li>
            <li><strong>Corpo &amp; Formulários:</strong> Fonte <em>Inter</em> para legibilidade cirúrgica em bulários e prontuários.</li>
            <li><strong>Monoespaçada:</strong> <em>JetBrains Mono</em> para CPFs, códigos de barras, lotes e hashes CFF.</li>
            <li><strong>Navegação F1-F12 + Ctrl+K:</strong> Operação 100% por teclado sem necessidade compulsória do mouse.</li>
          </ul>
        </div>
      </div>

      <div class="card-box" style="margin-bottom: 7px;">
        <div class="card-box-header"><i class="fa-solid fa-circle-check" style="color:#10b981;"></i> Diagnóstico de Maturidade: Pontos Fortes Consolidados (v3.1.0)</div>
        <div class="grid-2">
          <ul style="font-size: 7.5px; color: #334155; padding-left: 14px; line-height: 1.4;">
            <li>✔ <strong>Atendimento em < 60s:</strong> Triagem guiada SOAP sem hesitação operacional.</li>
            <li>✔ <strong>CDSS 4D + MEWS + Sepse:</strong> Suporte à decisão clínica ativo no momento do ato.</li>
            <li>✔ <strong>Telemetria Gráfica Longitudinal:</strong> Curvas de PA e Glicemia no prontuário.</li>
            <li>✔ <strong>TLR Homologado (RDC 786):</strong> 8 testes com lote/validade e laudo A4 oficial.</li>
            <li>✔ <strong>Automação WhatsApp:</strong> Follow-up D+2 e Recompra D-5 em 1 clique.</li>
          </ul>
          <ul style="font-size: 7.5px; color: #334155; padding-left: 14px; line-height: 1.4;">
            <li>✔ <strong>Chancela ICP-Brasil / GOV.BR:</strong> Validade jurídica com Hash SHA-256 e QR Code.</li>
            <li>✔ <strong>Cupom Térmico (80mm/58mm):</strong> Emissão ultrarrápida com 85% de economia em papel.</li>
            <li>✔ <strong>Barra de Ações Rápidas:</strong> Acesso instantâneo a 5 procedimentos na tabela clientes.</li>
            <li>✔ <strong>Hard Reset Atômico Seguro:</strong> Tríade de limpeza sincronizada com Turso Cloud.</li>
            <li>✔ <strong>Resiliência Offline-First:</strong> Operação ininterrupta sem dependência de internet.</li>
          </ul>
        </div>
      </div>

      <div class="card-box">
        <div class="card-box-header"><i class="fa-solid fa-wrench" style="color:#0284c7;"></i> Débitos Técnicos Mitigados na Versão 3.1.0</div>
        <table class="table-tech">
          <thead>
            <tr>
              <th>Item Técnico</th>
              <th>Situação Anterior (v3.0.0)</th>
              <th>Resolução Homologada na Versão 3.1.0</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Testes TLR (RDC 786)</strong></td>
              <td>Roadmap teórico / menção preliminar</td>
              <td>100% implementado com catálogo de 8 exames, lote/validade e laudos A4.</td>
            </tr>
            <tr>
              <td><strong>Automação Pós-Atendimento</strong></td>
              <td>Inexistente</td>
              <td>Central de Follow-up D+2 e Refill D-5 com scripts WhatsApp em 1 clique.</td>
            </tr>
            <tr>
              <td><strong>Chancela &amp; Cupom Térmico</strong></td>
              <td>Apenas impressão comum em tela</td>
              <td>Chancela ICP-Brasil com QR Code e impressão térmica 80mm ESC/POS.</td>
            </tr>
            <tr>
              <td><strong>Telemetria Longitudinal</strong></td>
              <td>Apenas tabelas com valores vitais</td>
              <td>Gráficos evolutivos de PA (PAS/PAD) e Glicemia com linhas de tendência.</td>
            </tr>
            <tr>
              <td><strong>Limpeza &amp; Hard Reset</strong></td>
              <td>Deixava resíduos de simulação</td>
              <td>Tríade atômica dual-store protegida por senha Master e texto de confirmação.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Documento Técnico &amp; Diretrizes de Negócio v3.1.0</div>
      <div>Página 4 de 12</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 5: SEÇÃO 5 — MÓDULOS 1 & 2 (DASHBOARD & BALCÃO SOAP CDSS 4D) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-cubes"></i> 5. Detalhamento Módulos 1 &amp; 2 (Dashboard &amp; Balcão SOAP)</div>
        <div class="page-header-meta">Módulos 1 e 2</div>
      </div>

      <!-- Screenshot 1 -->
      <div class="screenshot-frame">
        <img src="${imgDashboard}" alt="Dashboard Executivo">
        <div class="screenshot-legend">
          <span><strong>Figura 01:</strong> Dashboard Executivo: KPIs Centrais, Rosca 3D Glossy e Esfera Polar CDSS de Alertas Clínicos.</span>
          <span>Aba Dashboard &bull; Atalho F8</span>
        </div>
      </div>

      <div class="card-box" style="margin-bottom: 6px;">
        <div class="card-box-header"><i class="fa-solid fa-gauge"></i> Módulo 1: Dashboard Executivo &amp; Indicadores em Tempo Real</div>
        <p style="font-size: 7.8px; color: #334155; line-height: 1.35;">
          Cockpit de inteligência clínica e gerencial em tempo real: monitora consultas do mês, faturamento assistencial, procedimentos e adesão terapêutica. Permite alternar estilos de gráfico 3D (<strong>Estilo</strong>) e priorizar o fluxo do consultório através da <strong>Esfera Polar CDSS 3D</strong>.
        </p>
      </div>

      <!-- Screenshot 2 -->
      <div class="screenshot-frame">
        <img src="${imgBalcao}" alt="Balcão Clínico SOAP">
        <div class="screenshot-legend">
          <span><strong>Figura 02:</strong> Balcão Clínico em 5 Passos: Anamnese Guiada, CDSS 4D, Beers e Rastreio de Sepse (SSC/qSOFA).</span>
          <span>Aba Balcão &bull; Atalho F2</span>
        </div>
      </div>

      <div class="card-box">
        <div class="card-box-header"><i class="fa-solid fa-stethoscope"></i> Módulo 2: Balcão de Atendimento &amp; CDSS 4D Multidimensional</div>
        <p style="font-size: 7.8px; color: #334155; line-height: 1.35;">
          Conduz o atendimento em menos de 60s através da esteira SOAP. O motor CDSS 4D cruza interações medicamentosas, alergias e Critérios de Beers. Integra <strong>Rastreio de Sepse (qSOFA)</strong>: ao atingir $\ge 2$ critérios, bloqueia MIPs e prepara Guia de Urgência SAMU/UPA.
        </p>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Documento Técnico &amp; Diretrizes de Negócio v3.1.0</div>
      <div>Página 5 de 12</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 6: SEÇÃO 5 — MÓDULOS 3 & 4 (PRONTUÁRIO & TESTES TLR RDC 786) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-cubes"></i> 5. Detalhamento Módulos 3 &amp; 4 (Prontuário &amp; TLR RDC 786)</div>
        <div class="page-header-meta">Módulos 3 e 4</div>
      </div>

      <!-- Screenshot 3 -->
      <div class="screenshot-frame">
        <img src="${imgProntuario}" alt="Prontuário e Telemetria">
        <div class="screenshot-legend">
          <span><strong>Figura 03:</strong> Prontuário Longitudinal: Telemetria Gráfica de PA (PAS/PAD) e Glicemia Capilar com Metas.</span>
          <span>Aba Clientes &bull; Atalho F3</span>
        </div>
      </div>

      <div class="card-box" style="margin-bottom: 6px;">
        <div class="card-box-header"><i class="fa-solid fa-chart-line"></i> Módulo 3: Prontuário Longitudinal &amp; Telemetria Gráfica</div>
        <p style="font-size: 7.8px; color: #334155; line-height: 1.35;">
          Centraliza a evolução clínica do paciente com gráficos dinâmicos de sinais vitais ao longo dos meses. Exibe histórico de compras integrado para conciliação terapêutica e botão exclusivo <strong>"Visualizar / Exportar DSF"</strong> em cada atendimento da timeline.
        </p>
      </div>

      <!-- Screenshot 4 -->
      <div class="screenshot-frame">
        <img src="${imgTlr}" alt="Testes Rápidos TLR">
        <div class="screenshot-legend">
          <span><strong>Figura 04:</strong> Modal TLR RDC 786: Rastreio Sanitário Obrigatório de Lote/Validade e Emissão de Laudo Oficial A4.</span>
          <span>Exames Rápidos &bull; RDC ANVISA 786/2023</span>
        </div>
      </div>

      <div class="card-box">
        <div class="card-box-header"><i class="fa-solid fa-vial-virus"></i> Módulo 4: Testes Laboratoriais Remotos (TLR - RDC 786/2023)</div>
        <p style="font-size: 7.8px; color: #334155; line-height: 1.35;">
          Catálogo com 8 TLRs homologados (HbA1c, Perfil Lipídico, Beta-HCG, Dengue, COVID/Gripe, Glicemia, Strep A, ISTs). Exige rastreamento de Lote e Validade do kit comercial e emite laudo laboratorial em PDF A4 com termo de responsabilidade e identificação do RT.
        </p>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Documento Técnico &amp; Diretrizes de Negócio v3.1.0</div>
      <div>Página 6 de 12</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 7: SEÇÃO 5 — MÓDULOS 5 & 6 (PÓS-ATENDIMENTO & DSF/CUPOM) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-cubes"></i> 5. Detalhamento Módulos 5 &amp; 6 (Pós-Atendimento &amp; DSF)</div>
        <div class="page-header-meta">Módulos 5 e 6</div>
      </div>

      <!-- Screenshot 5 -->
      <div class="screenshot-frame">
        <img src="${imgPosCare}" alt="Automação Pós-Atendimento">
        <div class="screenshot-legend">
          <span><strong>Figura 05:</strong> Central de Automação Pós-Atendimento: Follow-up D+2 (48h) e Lembrete de Recompra D-5 WhatsApp.</span>
          <span>Adesão Ativa &bull; CRM 3.1</span>
        </div>
      </div>

      <div class="card-box" style="margin-bottom: 6px;">
        <div class="card-box-header"><i class="fa-brands fa-whatsapp" style="color:#25d366;"></i> Módulo 5: Automação de Pós-Atendimento &amp; Adesão Terapêutica</div>
        <p style="font-size: 7.8px; color: #334155; line-height: 1.35;">
          Combate ativamente o abandono de tratamentos crônicos: o Follow-up D+2 contata o paciente 48h após a consulta para checar alívio dos sintomas, enquanto o Refill D-5 avisa 5 dias antes do esgotamento da caixa, recuperando até 42% das receitas perdidas.
        </p>
      </div>

      <!-- Screenshot 6 -->
      <div class="screenshot-frame">
        <img src="${imgDsf}" alt="Declaração de Serviço Farmacêutico">
        <div class="screenshot-legend">
          <span><strong>Figura 06:</strong> Modal de Consulta da DSF em Tela, PDF A4 com Chancela ICP-Brasil e Cupom Térmico (80mm/58mm).</span>
          <span>Segurança Jurídica &bull; CFF 585/586</span>
        </div>
      </div>

      <div class="card-box">
        <div class="card-box-header"><i class="fa-solid fa-file-waveform"></i> Módulo 6: Declaração de Serviço (DSF) &amp; Cupom Térmico 80mm</div>
        <p style="font-size: 7.8px; color: #334155; line-height: 1.35;">
          A DSF é inspecionada em tela na janela modal de consulta prévia antes da exportação. Oferece PDF A4 institucional com chancela digital ICP-Brasil e QR Code validador oficial, e emissão em 3s em cupom térmico (bobina 80mm/58mm) com 85% de economia em insumos.
        </p>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Documento Técnico &amp; Diretrizes de Negócio v3.1.0</div>
      <div>Página 7 de 12</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 8: SEÇÃO 5 — MÓDULOS 7 & 8 (CLIENTES/NLP & ESTOQUE FEFO) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-cubes"></i> 5. Detalhamento Módulos 7 &amp; 8 (Clientes/PWA &amp; Estoque)</div>
        <div class="page-header-meta">Módulos 7 e 8</div>
      </div>

      <!-- Screenshot 7 -->
      <div class="screenshot-frame">
        <img src="${imgClientes}" alt="Gestão de Clientes e Ações Rápidas">
        <div class="screenshot-legend">
          <span><strong>Figura 07:</strong> Gestão de Pacientes: Barra de Ações Rápidas em 1 Clique (SOAP, Vacina, Portal PWA, Refill, TLR).</span>
          <span>Aba Clientes &bull; Atalho F3</span>
        </div>
      </div>

      <div class="card-box" style="margin-bottom: 6px;">
        <div class="card-box-header"><i class="fa-solid fa-users"></i> Módulo 7: Gestão de Clientes, Portal PWA &amp; Motor NLP de Queixas</div>
        <p style="font-size: 7.8px; color: #334155; line-height: 1.35;">
          Barra unificada de ações rápidas permite acionar qualquer procedimento direto da tabela. Inclui o <strong>Portal do Paciente PWA "Minha Saúde"</strong> no celular do usuário e motor NLP que converte relatos coloquiais em diagnósticos clínicos padronizados.
        </p>
      </div>

      <!-- Screenshot 8 -->
      <div class="screenshot-frame">
        <img src="${imgEstoque}" alt="Estoque e Rastreabilidade FEFO">
        <div class="screenshot-legend">
          <span><strong>Figura 08:</strong> Catálogo e Saldo Físico: Rastreabilidade Sanitária FEFO, Alertas Críticos e Importação XML NF-e.</span>
          <span>Aba Estoque &bull; Atalho F4</span>
        </div>
      </div>

      <div class="card-box">
        <div class="card-box-header"><i class="fa-solid fa-boxes-stacked"></i> Módulo 8: Estoque, Suprimentos &amp; Rastreabilidade FEFO</div>
        <p style="font-size: 7.8px; color: #334155; line-height: 1.35;">
          Controle estrito de insumos clínicos e medicamentos sob a regra sanitária <strong>FEFO (First-Expired, First-Out)</strong>. Alertas amarelos para produtos &lt; 90 dias, bloqueio automático de itens vencidos e importador de XML de notas fiscais da distribuidora.
        </p>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Documento Técnico &amp; Diretrizes de Negócio v3.1.0</div>
      <div>Página 8 de 12</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 9: SEÇÃO 5 — MÓDULOS 9 & 10 (FINANCEIRO DRE & GOVERNANÇA) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-cubes"></i> 5. Detalhamento Módulos 9 &amp; 10 (Financeiro &amp; Governança)</div>
        <div class="page-header-meta">Módulos 9 e 10</div>
      </div>

      <!-- Screenshot 9 -->
      <div class="screenshot-frame">
        <img src="${imgFinanceiro}" alt="Controle Financeiro e Fluxo de Caixa">
        <div class="screenshot-legend">
          <span><strong>Figura 09:</strong> Fluxo de Caixa Farmacêutico: Faturamento Clínico Dissociado, Despesas e Exportação DRE.</span>
          <span>Aba Financeiro &bull; Atalho F6</span>
        </div>
      </div>

      <div class="card-box" style="margin-bottom: 6px;">
        <div class="card-box-header"><i class="fa-solid fa-sack-dollar"></i> Módulo 9: Controle Financeiro, PDV Rápido &amp; DRE Dissociado</div>
        <p style="font-size: 7.8px; color: #334155; line-height: 1.35;">
          Separação contábil clara entre receita assistencial de consultas/TLRs (alta margem) e venda de medicamentos/MIPs. Emissão de DRE em PDF em 1 clique, boletos FEBRABAN e terminal de caixa rápido com PIX dinâmico padrão BACEN.
        </p>
      </div>

      <!-- Screenshot 10 -->
      <div class="screenshot-frame">
        <img src="${imgSandbox}" alt="Configurações e Hard Reset Seguro">
        <div class="screenshot-legend">
          <span><strong>Figura 10:</strong> Configurações do Sistema: Geradores Sandbox e Tríade de Limpeza / Hard Reset com Senha Master.</span>
          <span>Acesso Master &bull; Turso Cloud</span>
        </div>
      </div>

      <div class="card-box">
        <div class="card-box-header"><i class="fa-solid fa-sliders"></i> Módulo 10: Governança, RBAC &amp; Hard Reset Atômico Seguro</div>
        <p style="font-size: 7.8px; color: #334155; line-height: 1.35;">
          Administra operadores por níveis de acesso (RBAC) e sincronização Turso Cloud. Conta com a <strong>Tríade de Limpeza Segura</strong>: Limpar Simulação (<code>[SIMULADO]</code>), Limpar Produção Real e Hard Reset de Fábrica com dupla autenticação por Senha Master e frase de confirmação.
        </p>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Documento Técnico &amp; Diretrizes de Negócio v3.1.0</div>
      <div>Página 9 de 12</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 10: SEÇÃO 6 — DIFERENCIAIS COMPETITIVOS EXCLUSIVOS -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-star"></i> 6. Diferenciais Competitivos Exclusivos</div>
        <div class="page-header-meta">Vantagens Tecnológicas</div>
      </div>

      <div class="grid-2" style="margin-bottom: 8px;">
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-bolt" style="color:#0284c7;"></i> 1. Triagem SOAP em Menos de 60s</div>
          <p style="font-size: 7.7px; color: #475569; line-height: 1.35;">
            Funil clínico intuitivo que impede que o farmacêutico perca tempo de balcão. Navegação por teclas de atalho (F1-F12 + Ctrl+K) e suporte a ditado contínuo por voz para anamneses rápidas e precisas.
          </p>
        </div>
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-shield-halved" style="color:#10b981;"></i> 2. CDSS 4D &amp; Rastreio de Sepse (qSOFA)</div>
          <p style="font-size: 7.7px; color: #475569; line-height: 1.35;">
            Cruzamento algorítmico em 4 dimensões (fármaco x fármaco, alergias, comorbidades, Beers). Rastreio precoce de sepse (SSC) com bloqueio automático de MIPs e Guia SAMU/UPA.
          </p>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 8px;">
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-vials" style="color:#8b5cf6;"></i> 3. Testes TLR com RDC 786/2023 Homologada</div>
          <p style="font-size: 7.7px; color: #475569; line-height: 1.35;">
            Catálogo completo com 8 testes rápidos de análises clínicas. Rastreamento sanitário obrigatório de lote e data de expiração, com emissão instantânea de laudo técnico oficial em PDF A4.
          </p>
        </div>
        <div class="card-box">
          <div class="card-box-header"><i class="fa-brands fa-whatsapp" style="color:#22c55e;"></i> 4. Automação Pós-Atendimento (WhatsApp D+2/D-5)</div>
          <p style="font-size: 7.7px; color: #475569; line-height: 1.35;">
            Fidelização ativa com Follow-up clínico em 48h e alerta de recompra 5 dias antes de acabar a caixa do remédio crônico, recuperando até 42% de faturamento recorrente.
          </p>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 8px;">
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-stamp" style="color:#f59e0b;"></i> 5. Chancela Digital ICP-Brasil &amp; Cupom Térmico 80mm</div>
          <p style="font-size: 7.7px; color: #475569; line-height: 1.35;">
            Assinatura matemática com Hash SHA-256 e QR Code validador ITI, somada à versatilidade de impressão ultrarrápida (3s) em cupom térmico ESC/POS com 85% de economia em papelaria.
          </p>
        </div>
        <div class="card-box">
          <div class="card-box-header"><i class="fa-solid fa-wifi" style="color:#06b6d4;"></i> 6. Arquitetura 100% Offline-First (Turso Cloud)</div>
          <p style="font-size: 7.7px; color: #475569; line-height: 1.35;">
            O consultório nunca para de atender diante de oscilações ou quedas totais de internet. Persistência local atômica via IndexedDB/LibSQL WASM com reconciliação em nuvem automática.
          </p>
        </div>
      </div>

      <div class="card-box">
        <div class="card-box-header"><i class="fa-solid fa-lock" style="color:#ef4444;"></i> 7. Governança Segura &amp; Hard Reset Atômico Dual-Store</div>
        <p style="font-size: 7.7px; color: #475569; line-height: 1.35;">
          Tríade de limpeza de bases (Simulação vs Produção Real vs Reset de Fábrica) com proteção por Senha Master e frase de confirmação <code>RESETAR BANCO</code>, garantindo zero resíduos órfãos em auditorias.
        </p>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Documento Técnico &amp; Diretrizes de Negócio v3.1.0</div>
      <div>Página 10 de 12</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 11: SEÇÃO 7 — BENCHMARKING DE MERCADO (v3.1) -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-scale-balanced"></i> 7. Matriz Comparativa de Mercado (Benchmarking v3.1)</div>
        <div class="page-header-meta">Análise de Mercado</div>
      </div>

      <p style="font-size: 8.2px; color: #334155; margin-bottom: 6px;">
        Comparativo aprofundado entre o **CRM Clínico Farmacêutico v3.1.0 Enterprise** e os principais players do ecossistema de software farmacêutico e médico:
      </p>

      <table class="table-tech">
        <thead>
          <tr>
            <th>Critério de Comparação</th>
            <th style="background:#0d9488; text-align:center;">CRM Clínico v3.1</th>
            <th style="text-align:center;">Clinicarx</th>
            <th style="text-align:center;">ERPs Tradicionais (Trier/Linx)</th>
            <th style="text-align:center;">Softwares Médicos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Foco Central da Solução</strong></td>
            <td style="color:#0d9488; font-weight:700; text-align:center;">Clínico + Balcão + Gestão 360°</td>
            <td style="text-align:center;">Apenas Serviços Clínicos</td>
            <td style="text-align:center;">Apenas Fiscal e Venda PDV</td>
            <td style="text-align:center;">Apenas Consultório Médico</td>
          </tr>
          <tr>
            <td><strong>Tempo Médio de Triagem SOAP</strong></td>
            <td style="color:#0d9488; font-weight:700; text-align:center;">&lt; 60s (Atalhos F1-F12)</td>
            <td style="text-align:center;">10 a 15 minutos</td>
            <td style="text-align:center;">❌ Não possui triagem clínica</td>
            <td style="text-align:center;">20 a 30 minutos</td>
          </tr>
          <tr>
            <td><strong>CDSS 4D + MEWS + Sepse (qSOFA)</strong></td>
            <td style="color:#0d9488; font-weight:700; text-align:center;">Nativo em Tempo Real</td>
            <td style="text-align:center;">Básico (Alertas simples)</td>
            <td style="text-align:center;">❌ Inexistente</td>
            <td style="text-align:center;">Moderado (foco médico)</td>
          </tr>
          <tr>
            <td><strong>Módulo TLR (RDC ANVISA 786/2023)</strong></td>
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
            <td style="text-align:center;">Lembretes de consulta</td>
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
            <td><strong>PDV Integrado ao Prontuário</strong></td>
            <td style="color:#0d9488; font-weight:700; text-align:center;">Sim (Nova Venda com Vínculo)</td>
            <td style="text-align:center;">❌ Não possui PDV</td>
            <td style="text-align:center;">Sim (Sem histórico clínico)</td>
            <td style="text-align:center;">Básico</td>
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

      <div class="alert-banner alert-info" style="margin-top: 8px;">
        <i class="fa-solid fa-trophy"></i>
        <div>
          <strong>Vantagem Estratégica Incontestável:</strong> Enquanto os concorrentes exigem contratação fragmentada de múltiplos sistemas (um software clínico, outro emissor fiscal e outro CRM de pós-venda), o CRM Clínico Farmacêutico v3.1.0 unifica toda a jornada de saúde e financeira em uma plataforma única de altíssimo retorno.
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Documento Técnico &amp; Diretrizes de Negócio v3.1.0</div>
      <div>Página 11 de 12</div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- PÁGINA 12: SEÇÃO 8 — ROADMAP, PARECER EXECUTIVO & HOMOLOGAÇÃO -->
  <!-- ===================================================================== -->
  <div class="page">
    <div>
      <div class="page-header">
        <div class="page-header-title"><i class="fa-solid fa-flag-checkered"></i> 8. Roadmap &amp; 9. Homologação Técnica Oficial</div>
        <div class="page-header-meta">Homologação Oficial</div>
      </div>

      <div class="card-box" style="margin-bottom: 7px;">
        <div class="card-box-header"><i class="fa-solid fa-timeline"></i> Cronograma de Entregas &amp; Evolução Tecnológica</div>
        <table class="table-tech">
          <thead>
            <tr>
              <th style="width: 80px;">Versão</th>
              <th style="width: 140px;">Módulos &amp; Entregas</th>
              <th style="width: 90px;">Prazo</th>
              <th>Status</th>
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

      <div class="card-box" style="margin-bottom: 8px;">
        <div class="card-box-header"><i class="fa-solid fa-file-signature"></i> Parecer Executivo de Homologação Técnica</div>
        <p style="font-size: 8px; color: #334155; line-height: 1.38; margin-bottom: 5px;">
          O <strong>CRM Clínico Farmacêutico &amp; CDSS 4D (v3.1.0 Enterprise Edition)</strong> reúne os mais modernos padrões mundiais de engenharia de software em saúde, interoperabilidade clínica e conformidade sanitária brasileira.
        </p>
        <p style="font-size: 8px; color: #334155; line-height: 1.38;">
          A incorporação nativa de <strong>exames laboratoriais remotos (TLR - RDC 786/2023)</strong>, <strong>automação de adesão por WhatsApp (Follow-up D+2 e Refill D-5)</strong>, <strong>chancela digital com validade jurídica plena</strong> e <strong>emissão em cupom térmico de baixo custo</strong> posiciona esta plataforma como o ativo tecnológico de maior retorno e segurança operacional para farmácias e redes farmacêuticas em todo o território nacional.
        </p>
      </div>

      <div class="grid-2" style="margin-top: 8px;">
        <div class="card-box" style="text-align: center; padding: 10px;">
          <div style="font-size: 20px; color: #0d9488; margin-bottom: 3px;"><i class="fa-solid fa-signature"></i></div>
          <strong style="color: #0f172a; font-size: 9px;">Dr. Marcelo Mazaro</strong><br>
          <span style="font-size: 7.7px; color: #64748b;">Farmacêutico Responsável Técnico &bull; CRF-SP 54180</span><br>
          <span style="font-size: 7.2px; color: #94a3b8;">Autor &amp; Arquiteto de Sistemas Clínicos</span>
        </div>

        <div class="card-box" style="text-align: center; padding: 10px;">
          <div style="font-size: 20px; color: #0284c7; margin-bottom: 3px;"><i class="fa-solid fa-certificate"></i></div>
          <strong style="color: #0f172a; font-size: 9px;">Homologação Corporativa</strong><br>
          <span style="font-size: 7.7px; color: #64748b;">Plataforma CRM Clínico v3.1.0 Enterprise</span><br>
          <span style="font-size: 7.2px; color: #94a3b8;">Setembro de 2026 &bull; São Paulo, Brasil</span>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Documento Técnico &amp; Diretrizes de Negócio v3.1.0</div>
      <div>Página 12 de 12 &bull; Fim do Documento</div>
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
    console.log('📄 Renderizando DOCUMENTO_TECNICO_PROPOSTA_NEGOCIO.html no Puppeteer...');
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
    
    console.log('🖨️ Compilando DOCUMENTO_TECNICO_PROPOSTA_NEGOCIO.pdf em alta resolução...');
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      printBackground: true
    });
    await browser.close();
    
    const stats = fs.statSync(outputPath);
    console.log(`✅ DOCUMENTO_TECNICO_PROPOSTA_NEGOCIO.pdf gerado com sucesso!`);
    console.log(`📁 Arquivo: ${outputPath}`);
    console.log(`⚖️ Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    console.error('❌ Erro ao gerar DOCUMENTO_TECNICO_PROPOSTA_NEGOCIO.pdf:', error);
    process.exit(1);
  }
}

generateDocumentoTecnicoPDF();
