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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      color: #1e293b;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.6;
    }
    
    @page {
      size: A4;
      margin: 14mm 16mm 14mm 16mm;
    }

    .page-break {
      page-break-after: always;
    }

    /* CAPA */
    .cover {
      background: linear-gradient(135deg, #042f2e 0%, #0f172a 60%, #064e3b 100%);
      color: #ffffff;
      padding: 60px 40px;
      border-radius: 16px;
      text-align: center;
      margin-bottom: 20px;
      position: relative;
    }
    .cover-badge {
      display: inline-block;
      background: rgba(45, 212, 191, 0.2);
      border: 1px solid rgba(45, 212, 191, 0.5);
      color: #2dd4bf;
      padding: 6px 18px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    .cover-title {
      font-family: 'Outfit', sans-serif;
      font-size: 30px;
      font-weight: 800;
      margin: 0 0 10px;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .cover-subtitle {
      font-size: 15px;
      color: #94a3b8;
      max-width: 600px;
      margin: 0 auto 25px;
      line-height: 1.5;
    }
    .cover-meta {
      display: flex;
      justify-content: center;
      gap: 24px;
      font-size: 12px;
      color: #cbd5e1;
      border-top: 1px solid rgba(255,255,255,0.15);
      padding-top: 18px;
    }

    /* SEÇÕES */
    .section-title {
      font-family: 'Outfit', sans-serif;
      font-size: 18px;
      font-weight: 800;
      color: #0f766e;
      border-bottom: 2px solid #14b8a6;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title i {
      color: #0d9488;
    }

    /* CARDS DE KPI */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 18px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
      text-align: center;
    }
    .kpi-value {
      font-family: 'Outfit', sans-serif;
      font-size: 22px;
      font-weight: 800;
      color: #0f766e;
      margin-bottom: 2px;
    }
    .kpi-label {
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }

    /* TABELAS */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 18px;
      font-size: 11.5px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 8px 10px;
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
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
      margin: 14px 0;
      font-size: 12px;
      color: #166534;
    }
    .highlight-box-alert {
      background: #fff1f2;
      border-left: 4px solid #f43f5e;
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
      margin: 14px 0;
      font-size: 12px;
      color: #9f1239;
    }

    /* GRID DE MÓDULOS */
    .module-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 10px;
      border-left: 4px solid #0d9488;
    }
    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .module-name {
      font-family: 'Outfit', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }
    .module-tag {
      font-size: 9.5px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      background: #e6fffa;
      color: #0d9488;
      border: 1px solid #99f6e4;
    }
    .module-desc {
      font-size: 11.5px;
      color: #475569;
      margin: 0;
    }

    .footer-stamp {
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 24px;
      font-size: 10px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <!-- CAPA EXECUTIVA -->
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

  <!-- SEÇÃO 1: RESUMO EXECUTIVO & KPIs -->
  <h2 class="section-title"><i class="fa-solid fa-chart-pie"></i> 1. Resumo Executivo & Impacto Clínico</h2>
  <p>
    O <strong>CRM Clínico Farmacêutico v3.0</strong> consolida a prática clínica avançada no ambiente de farmácias comunitárias e consultórios farmacêuticos, promovendo a integração entre segurança farmacoterapêutica, rastreabilidade sanitária e gestão financeira de alto nível.
  </p>

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

  <div class="highlight-box">
    <strong><i class="fa-solid fa-check-circle"></i> Marco Regulatório:</strong> O sistema atende integralmente às Resoluções CFF nº 585/2013 e 586/2013 (Prescrição Farmacêutica e Serviços Clínicos), CFF nº 654/2018 (Vacinação e Injetáveis) e ANVISA RDC nº 44/2009 e RDC nº 786/2023 (Testes Laboratoriais Remotos - TLR).
  </div>

  <!-- SEÇÃO 2: ARQUITETURA DOS 7 MÓDULOS -->
  <h2 class="section-title"><i class="fa-solid fa-layer-group"></i> 2. Estrutura dos Módulos Operacionais</h2>

  <div class="module-card">
    <div class="module-header">
      <span class="module-name">1. 📊 Métricas do Consultório & Faturamento</span>
      <span class="module-tag">BI & KPIs</span>
    </div>
    <p class="module-desc">Indicadores em tempo real de atendimentos clínicos, taxa de adesão ao tratamento (Escala de Morisky), bloqueios preventivos de iatrogenias pelo CDSS 4D e faturamento consolidado.</p>
  </div>

  <div class="module-card">
    <div class="module-header">
      <span class="module-name">2. 🩺 CRM Farmacêutico & Balcão (SOAP + CDSS 4D)</span>
      <span class="module-tag">Clínica & Balcão</span>
    </div>
    <p class="module-desc">Triagem guiada por queixas frequentes, checagem mandatória de <em>Red Flags</em> com emissão de Guia de Encaminhamento Médico, prescrição segura de MIPs, registro de vacinas/injetáveis e despacho de posologia via WhatsApp.</p>
  </div>

  <div class="module-card">
    <div class="module-header">
      <span class="module-name">3. 👤 Prontuário Longitudinal & Portal do Paciente PWA</span>
      <span class="module-tag">Cuidado Contínuo</span>
    </div>
    <p class="module-desc">Cadastro com validação estrita de CPF, comorbidades, alergias estruturadas, convênios PBMs (com botão <code>+</code> rápido) e acesso móvel do paciente à sua carteirinha digital e despertador inteligente de remédios.</p>
  </div>

  <div class="module-card">
    <div class="module-header">
      <span class="module-name">4. 📦 Controle de Estoque & Catálogo com Leitor de Código de Barras</span>
      <span class="module-tag">Logística & Rastreio</span>
    </div>
    <p class="module-desc">Scanner de código de barras (Câmera e USB), entrada de notas com controle de lotes e validades, Curva ABC, alertas de vencimento (&lt; 90 dias) e ajustes de inventário auditados.</p>
  </div>

  <div class="module-card">
    <div class="module-header">
      <span class="module-name">5. 💰 Controle Financeiro & Fluxo de Caixa (Abas Neon)</span>
      <span class="module-tag">Gestão Financeira</span>
    </div>
    <p class="module-desc">Abas Neon de alto contraste (<code>Todos</code>, <code>⬇️ Receitas</code>, <code>⬆️ Despesas</code>), botões <code>+</code> para cadastro instantâneo de novas categorias e formas de pagamento, e Demonstrativo de Resultados do Exercício (DRE) em PDF.</p>
  </div>

  <div class="module-card">
    <div class="module-header">
      <span class="module-name">6. 📜 Declarações de Serviços Farmacêuticos (DSF)</span>
      <span class="module-tag">Regulatório CFF</span>
    </div>
    <p class="module-desc">Emissão oficial de DSF com carimbo temporal, número de CRF do Farmacêutico RT, parâmetros aferidos e Hash de Autenticidade para comprovação sanitária.</p>
  </div>

  <div class="module-card">
    <div class="module-header">
      <span class="module-name">7. ⚙️ Central de Configurações em 7 Agrupamentos Estruturados</span>
      <span class="module-tag">Governança</span>
    </div>
    <p class="module-desc">Controle de acesso RBAC, monitoramento do Turso Cloud, dados do RT, backup/restauração JSON, protocolos clínicos, Sandbox de simulação com limpeza seletiva protegida por senha e Gestão de Parâmetros Financeiros.</p>
  </div>

  <div class="page-break"></div>

  <!-- SEÇÃO 3: MOTOR CDSS 4D E MATRIZ DE RISCO -->
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

  <!-- SEÇÃO 4: INFRAESTRUTURA DE NUVEM & SEGURANÇA -->
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
    <div>Documento gerado automaticamente &bull; Em conformidade com o CFF e ANVISA</div>
  </div>

</body>
</html>`;

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: { top: '12mm', right: '14mm', bottom: '12mm', left: '14mm' },
      printBackground: true
    });
    await browser.close();
    console.log(`Relatório Executivo em PDF gerado com sucesso em: ${outputPath}`);
  } catch (err) {
    console.error('Erro ao gerar Relatório Executivo em PDF:', err);
  }
}

generateExecutiveReport();
