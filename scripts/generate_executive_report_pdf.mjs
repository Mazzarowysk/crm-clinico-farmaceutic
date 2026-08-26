import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

async function generateExecutiveReport() {
  const outputPath = path.resolve('Relatorio_Executivo_CRM_Clinico_Farmaceutico.pdf');

  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Executivo — CRM Clínico Farmacêutico v3.0</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      color: #1e293b;
      background: #ffffff;
      font-size: 12px;
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
    .cover {
      background: linear-gradient(135deg, #042f2e 0%, #0f172a 60%, #064e3b 100%);
      color: #ffffff;
      padding: 40px 30px;
      border-radius: 14px;
      text-align: center;
      margin-bottom: 16px;
      border: 1px solid #14b8a6;
    }
    .cover-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(45, 212, 191, 0.2);
      border: 1px solid rgba(45, 212, 191, 0.5);
      color: #2dd4bf;
      padding: 5px 14px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 10px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .cover-title {
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 800;
      margin: 0 0 8px;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .cover-subtitle {
      font-size: 13px;
      color: #cbd5e1;
      max-width: 620px;
      margin: 0 auto 16px;
      line-height: 1.45;
    }
    .cover-meta {
      display: flex;
      justify-content: center;
      gap: 20px;
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid rgba(255,255,255,0.12);
      padding-top: 12px;
    }
    .cover-meta strong {
      color: #2dd4bf;
    }

    /* SEÇÕES */
    .section-title {
      font-family: 'Outfit', sans-serif;
      font-size: 15px;
      font-weight: 800;
      color: #0f766e;
      border-bottom: 2px solid #14b8a6;
      padding-bottom: 4px;
      margin-top: 16px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* CARDS DE KPI */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
    }
    .kpi-value {
      font-family: 'Outfit', sans-serif;
      font-size: 18px;
      font-weight: 800;
      color: #0f766e;
      margin-bottom: 2px;
    }
    .kpi-label {
      font-size: 9.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }

    /* TABELAS */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 14px;
      font-size: 11px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* BOXES DE DESTAQUE */
    .highlight-box {
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 8px 12px;
      border-radius: 0 6px 6px 0;
      margin: 10px 0;
      font-size: 11.5px;
      color: #166534;
    }

    /* GRID DE MÓDULOS */
    .module-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 9px 12px;
      margin-bottom: 8px;
      border-left: 4px solid #0d9488;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3px;
    }
    .module-name {
      font-family: 'Outfit', sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .module-name i {
      color: #0d9488;
      font-size: 13px;
    }
    .module-tag {
      font-size: 9px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 10px;
      background: #e6fffa;
      color: #0d9488;
      border: 1px solid #99f6e4;
    }
    .module-desc {
      font-size: 11px;
      color: #475569;
      margin: 0;
      line-height: 1.45;
    }
    .badge-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 1px 4px;
      border-radius: 4px;
      color: #0f766e;
      font-weight: 600;
    }

    .footer-stamp {
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 16px;
      font-size: 9.5px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <!-- PÁGINA 1: CAPA & VISÃO GERAL & OS 7 MÓDULOS -->
  <div class="cover">
    <div class="cover-badge"><i class="fa-solid fa-certificate"></i> Relatório Executivo Oficial &bull; Versão 3.0</div>
    <h1 class="cover-title">CRM Clínico Farmacêutico</h1>
    <div class="cover-subtitle">
      Plataforma Integrada de Cuidado Farmacêutico, Suporte à Decisão Clínica (CDSS 4D), Controle Financeiro com Abas Neon, Gestão de Estoque com Barcode e Portal PWA do Paciente.
    </div>
    <div class="cover-meta">
      <div><strong>Data:</strong> Agosto / 2026</div>
      <div><strong>Conformidade:</strong> CFF 585/586 &bull; ANVISA RDC 44/786</div>
      <div><strong>Status:</strong> 100% Produção & Nuvem</div>
    </div>
  </div>

  <h2 class="section-title"><i class="fa-solid fa-chart-pie"></i> 1. Resumo Executivo & Impacto Clínico</h2>
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-value">&lt; 60s</div>
      <div class="kpi-label">Tempo Médio SOAP</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">4 Dimensões</div>
      <div class="kpi-label">Motor CDSS 4D</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">7 Módulos</div>
      <div class="kpi-label">Abas Operacionais</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">100% Cloud</div>
      <div class="kpi-label">Turso LibSQL Cluster</div>
    </div>
  </div>

  <h2 class="section-title"><i class="fa-solid fa-layer-group"></i> 2. Estrutura Completa dos 7 Módulos Operacionais</h2>

  <!-- MÓDULO 1 -->
  <div class="module-card">
    <div class="module-header">
      <span class="module-name"><i class="fa-solid fa-chart-line"></i> 1. Métricas do Consultório & Faturamento</span>
      <span class="module-tag">BI & KPIs</span>
    </div>
    <p class="module-desc">Indicadores em tempo real de atendimentos clínicos, taxa de adesão ao tratamento (Escala de Morisky), bloqueios preventivos de iatrogenias pelo CDSS 4D e faturamento consolidado.</p>
  </div>

  <!-- MÓDULO 2 -->
  <div class="module-card">
    <div class="module-header">
      <span class="module-name"><i class="fa-solid fa-prescription-bottle-medical"></i> 2. CRM Farmacêutico & Balcão (SOAP + CDSS 4D)</span>
      <span class="module-tag">Clínica & Balcão</span>
    </div>
    <p class="module-desc">Triagem guiada por queixas frequentes, checagem mandatória de <em>Red Flags</em> com emissão de Guia de Encaminhamento Médico, prescrição segura de MIPs, registro de vacinas/injetáveis (CFF 654) e despacho de posologia via WhatsApp.</p>
  </div>

  <!-- MÓDULO 3 -->
  <div class="module-card">
    <div class="module-header">
      <span class="module-name"><i class="fa-solid fa-user-nurse"></i> 3. Prontuário Longitudinal & Portal do Paciente PWA</span>
      <span class="module-tag">Cuidado Contínuo</span>
    </div>
    <p class="module-desc">Cadastro com validação estrita de CPF, comorbidades, alergias estruturadas, convênios PBMs (com botão <span class="badge-code">+</span> rápido) e acesso móvel do paciente à sua carteirinha digital e despertador inteligente de remédios.</p>
  </div>

  <!-- MÓDULO 4 -->
  <div class="module-card">
    <div class="module-header">
      <span class="module-name"><i class="fa-solid fa-boxes-stacked"></i> 4. Controle de Estoque & Catálogo com Leitor de Código de Barras</span>
      <span class="module-tag">Logística & Rastreio</span>
    </div>
    <p class="module-desc">Scanner de código de barras (Câmera e USB), entrada de notas com controle de lotes e validades, Curva ABC, alertas de vencimento (&lt; 90 dias) e ajustes de inventário auditados.</p>
  </div>

  <!-- MÓDULO 5 -->
  <div class="module-card">
    <div class="module-header">
      <span class="module-name"><i class="fa-solid fa-sack-dollar"></i> 5. Controle Financeiro & Fluxo de Caixa (Abas Neon)</span>
      <span class="module-tag">Gestão Financeira</span>
    </div>
    <p class="module-desc">Abas Neon de alto contraste (<span class="badge-code">Todos</span>, <span class="badge-code">Receitas</span>, <span class="badge-code">Despesas</span>), botões <span class="badge-code">+</span> para cadastro instantâneo de novas categorias e formas de pagamento, e Demonstrativo de Resultados do Exercício (DRE) em PDF.</p>
  </div>

  <!-- MÓDULO 6 -->
  <div class="module-card">
    <div class="module-header">
      <span class="module-name"><i class="fa-solid fa-file-signature"></i> 6. Declarações de Serviços Farmacêuticos (DSF)</span>
      <span class="module-tag">Regulatório CFF</span>
    </div>
    <p class="module-desc">Emissão oficial de DSF com carimbo temporal, número de CRF do Farmacêutico RT, parâmetros aferidos e Hash de Autenticidade para comprovação sanitária conforme Resoluções CFF nº 585 e 586/2013.</p>
  </div>

  <!-- MÓDULO 7 -->
  <div class="module-card">
    <div class="module-header">
      <span class="module-name"><i class="fa-solid fa-sliders"></i> 7. Central de Configurações em 7 Agrupamentos Estruturados</span>
      <span class="module-tag">Governança & Parâmetros</span>
    </div>
    <p class="module-desc">Controle de acesso RBAC, monitoramento do Turso Cloud, dados do RT, backup/restauração JSON, protocolos clínicos, Sandbox de simulação com limpeza seletiva protegida por senha e Gestão de Parâmetros Financeiros vinculada aos botões <span class="badge-code">+</span>.</p>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 2: MOTOR CDSS 4D, NUVEM E GOVERNANÇA -->
  <h2 class="section-title"><i class="fa-solid fa-shield-halved"></i> 3. Motor de Suporte à Decisão Clínica (CDSS 4D)</h2>
  <p>
    O motor de checagem farmacológica atua como barreira proativa contra iatrogenias, avaliando 4 dimensões críticas de segurança antes de permitir qualquer dispensação:
  </p>

  <table>
    <thead>
      <tr>
        <th>Dimensão</th>
        <th>Exemplos de Checagem</th>
        <th>Conduta do Sistema</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Fármaco &times; Fármaco (DDI)</strong></td>
        <td>Sinvastatina + Claritromicina / Varfarina + AINEs / ISRS + Tramadol</td>
        <td>Alerta Vermelho com Bloqueio de Prescrição e sugestão de alternativa segura.</td>
      </tr>
      <tr>
        <td><strong>2. Fármaco &times; Alergias</strong></td>
        <td>Dipirona (Pirazolonas) / Penicilinas / Sulfas / AAS</td>
        <td>Detecção de reatividade cruzada via histórico cadastrado no prontuário.</td>
      </tr>
      <tr>
        <td><strong>3. Fármaco &times; Comorbidades / Beers</strong></td>
        <td>Hipertensos (Descongestionantes orais) / Idosos (Critérios de Beers)</td>
        <td>Alerta Amarelo com exigência de justificativa clínica formal.</td>
      </tr>
      <tr>
        <td><strong>4. Fármaco &times; Alimentos / Hábitos</strong></td>
        <td>Álcool + Metronidazol / Alimentos ricos em Vitamina K + Varfarina</td>
        <td>Inclusão automática de orientações na posologia da DSF e no WhatsApp.</td>
      </tr>
    </tbody>
  </table>

  <h2 class="section-title"><i class="fa-solid fa-cloud-arrow-up"></i> 4. Infraestrutura de Nuvem, Offline-First & Redundância</h2>

  <table>
    <thead>
      <tr>
        <th>Componente</th>
        <th>Tecnologia</th>
        <th>Benefício Operacional</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Frontend SPA</strong></td>
        <td>Vanilla JS (ES Modules) + Vite 5</td>
        <td>Carregamento ultrarrápido (&lt; 200ms) sem overhead de frameworks.</td>
      </tr>
      <tr>
        <td><strong>Persistência Local</strong></td>
        <td>LocalDB (IndexedDB / LocalStorage)</td>
        <td>Operação Offline-First: funciona sem internet e sem travar o balcão.</td>
      </tr>
      <tr>
        <td><strong>Cluster Cloud</strong></td>
        <td>Turso Cloud (LibSQL Edge na AWS)</td>
        <td>Replicação atômica, backup contínuo e sincronização multi-dispositivos.</td>
      </tr>
      <tr>
        <td><strong>Dual-Pipeline Sync</strong></td>
        <td>SyncManager Inteligente</td>
        <td>Modais automáticos no Vercel (Roxo para baixar nuvem / Laranja para enviar local).</td>
      </tr>
      <tr>
        <td><strong>Segurança & Sandbox</strong></td>
        <td>RBAC + Senha Master de Limpeza</td>
        <td>Ambiente de testes (Sandbox) isolado e Hard Reset protegido por senha.</td>
      </tr>
    </tbody>
  </table>

  <div class="highlight-box">
    <strong><i class="fa-solid fa-lock"></i> Governança de Dados & LGPD:</strong> O sistema implementa anonimização visual de CPF em relatórios, trilha de auditoria para exclusões, controle estrito de papéis (RBAC) e backup criptografado em JSON.
  </div>

  <div class="footer-stamp">
    <div>CRM Clínico Farmacêutico &bull; Relatório Executivo v3.0</div>
    <div>Documento oficial compilado em PDF &bull; Em conformidade com o CFF e ANVISA</div>
  </div>

</body>
</html>`;

  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: { top: '10mm', right: '12mm', bottom: '10mm', left: '12mm' },
      printBackground: true
    });
    await browser.close();
    console.log(`Relatório Executivo em PDF gerado com sucesso em: ${outputPath}`);
  } catch (err) {
    console.error('Erro ao gerar Relatório Executivo em PDF:', err);
  }
}

generateExecutiveReport();
