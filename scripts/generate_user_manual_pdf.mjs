import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

async function generateCompleteUserManualPDF() {
  const outputPath = path.resolve('Manual_do_Usuario_CRM_Clinico_Farmaceutico.pdf');

  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Manual do Usuário Master — CRM Clínico Farmacêutico v3.0</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      color: #1e293b;
      background: #ffffff;
      font-size: 9px;
      line-height: 1.36;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    @page {
      size: A4;
      margin: 7mm 9mm 7mm 9mm;
    }

    .page {
      page-break-after: always;
      break-after: page;
      padding: 2px 0;
      box-sizing: border-box;
    }

    .page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    /* CAPA OFICIAL */
    .cover-container {
      background: linear-gradient(145deg, #042f2e 0%, #0f172a 50%, #064e3b 100%);
      color: #ffffff;
      padding: 30px 26px;
      border-radius: 12px;
      border: 2px solid #14b8a6;
      box-sizing: border-box;
      min-height: 265mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .cover-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(45, 212, 191, 0.2);
      border: 1px solid rgba(45, 212, 191, 0.5);
      color: #2dd4bf;
      padding: 5px 14px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 9.5px;
      letter-spacing: 1px;
      text-transform: uppercase;
      width: fit-content;
    }
    .cover-title {
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 900;
      margin: 12px 0 6px;
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
      max-width: 660px;
      line-height: 1.4;
      margin-bottom: 12px;
    }
    .cover-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 9px;
      margin: 10px 0;
    }
    .cover-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 8px 11px;
      display: flex;
      align-items: center;
      gap: 9px;
    }
    .cover-card i {
      font-size: 15px;
      color: #2dd4bf;
    }
    .cover-card strong {
      display: block;
      color: #ffffff;
      font-size: 10px;
      font-family: 'Outfit', sans-serif;
    }
    .cover-card span {
      color: #94a3b8;
      font-size: 8px;
    }
    .cover-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 8px;
      color: #94a3b8;
    }
    .cover-footer strong {
      color: #2dd4bf;
    }

    /* CABEÇALHO DE CAPÍTULOS / ABAS */
    .tab-header {
      background: linear-gradient(135deg, #0f172a, #134e4a);
      color: #ffffff;
      padding: 5px 11px;
      border-radius: 6px;
      margin-bottom: 5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-left: 4px solid #2dd4bf;
    }
    .tab-title {
      font-family: 'Outfit', sans-serif;
      font-size: 11px;
      font-weight: 800;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .tab-tag {
      font-size: 7.5px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 3px;
      background: rgba(45, 212, 191, 0.2);
      color: #2dd4bf;
      border: 1px solid rgba(45, 212, 191, 0.4);
    }

    /* CARDS DE CONTEÚDO E EXEMPLOS */
    .section-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      padding: 5px 8px;
      margin-bottom: 5px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 3px;
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 9.8px;
      color: #0f172a;
    }
    .section-header i {
      color: #0d9488;
      font-size: 10.5px;
    }

    /* BOX DE EXEMPLO PRÁTICO */
    .example-box {
      background: #f8fafc;
      border: 1.5px solid #0284c7;
      border-radius: 5px;
      padding: 6px 8px;
      margin-bottom: 4px;
    }
    .example-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #0284c7;
      color: #ffffff;
      font-size: 7.8px;
      font-weight: 800;
      padding: 2px 5px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 3px;
    }
    .example-title {
      font-family: 'Outfit', sans-serif;
      font-size: 9.2px;
      font-weight: 800;
      color: #0c4a6e;
      margin-bottom: 3px;
    }

    /* PASSOS */
    .steps-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin: 2px 0;
    }
    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 5px;
      font-size: 8.5px;
      color: #334155;
      line-height: 1.3;
    }
    .step-num {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #0f766e;
      color: #ffffff;
      font-size: 7.5px;
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

    .btn-badge {
      display: inline-block;
      background: #0284c7;
      color: #ffffff;
      padding: 1px 5px;
      border-radius: 3px;
      font-weight: 700;
      font-size: 7.8px;
    }
    .btn-badge-green {
      background: #10b981;
      color: #ffffff;
      padding: 1px 5px;
      border-radius: 3px;
      font-weight: 700;
      font-size: 7.8px;
    }
    .btn-badge-purple {
      background: #9333ea;
      color: #ffffff;
      padding: 1px 5px;
      border-radius: 3px;
      font-weight: 700;
      font-size: 7.8px;
    }

    /* CAIXA DE OBSERVAÇÃO CLÍNICA / EXPLICAÇÃO */
    .obs-card {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-left: 3.5px solid #10b981;
      border-radius: 4px;
      padding: 4px 7px;
      margin-top: 3px;
      font-size: 8.2px;
      color: #14532d;
      line-height: 1.28;
    }
    .obs-card strong {
      color: #047857;
      display: block;
      margin-bottom: 2px;
    }

    .key-badge {
      font-family: 'JetBrains Mono', monospace;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 1px 3px;
      border-radius: 3px;
      font-size: 7.5px;
      color: #0f766e;
      font-weight: 700;
    }

    /* TABELAS */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 3px 0;
      font-size: 8.2px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      text-align: left;
      padding: 2.5px 4px;
      font-size: 7.8px;
      text-transform: uppercase;
    }
    td {
      padding: 2.2px 4px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }

    .footer-page {
      border-top: 1px solid #e2e8f0;
      padding-top: 2px;
      margin-top: 3px;
      font-size: 7.2px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>

  <!-- ========================================================================= -->
  <!-- PÁGINA 1: CAPA OFICIAL MASTER -->
  <!-- ========================================================================= -->
  <div class="page">
    <div class="cover-container">
      <div>
        <div class="cover-badge"><i class="fa-solid fa-book-medical"></i> Manual Operacional Completo &bull; Versão 3.0</div>
        <h1 class="cover-title">CRM Clínico <span>Farmacêutico</span></h1>
        <div class="cover-subtitle">
          Guia Operacional Passo a Passo Organizado por Abas: Casos Clínicos Reais, Prescrição CDSS 4D, Registro de Vendas e PDV Rápido, Lançamento de Estoque com Código de Barras (EAN-13), Vacinação e Gestão Financeira com Abas Neon.
        </div>

        <div class="cover-grid">
          <div class="cover-card">
            <i class="fa-solid fa-stethoscope"></i>
            <div>
              <strong>1. Triagem SOAP &amp; Balcão (< 60s)</strong>
              <span>Queixas agudas, Red Flags e cruzamento CDSS 4D</span>
            </div>
          </div>
          <div class="cover-card">
            <i class="fa-solid fa-cart-shopping"></i>
            <div>
              <strong>2. Vendas, PDV &amp; Compras</strong>
              <span>Cobrança em 1 clique na Etapa 5 e histórico de refill</span>
            </div>
          </div>
          <div class="cover-card">
            <i class="fa-solid fa-boxes-stacked"></i>
            <div>
              <strong>3. Estoque Central com Barcode</strong>
              <span>Leitor por câmera/USB, lotes, validade e curva ABC</span>
            </div>
          </div>
          <div class="cover-card">
            <i class="fa-solid fa-sack-dollar"></i>
            <div>
              <strong>4. Financeiro Neon &amp; Botões [+]</strong>
              <span>Receitas, Despesas, DRE em PDF e criação dinâmica</span>
            </div>
          </div>
          <div class="cover-card">
            <i class="fa-solid fa-syringe"></i>
            <div>
              <strong>5. Sala de Vacinas &amp; Injetáveis</strong>
              <span>RDC 786, CFF 654, lote sanitário e DSF com Hash</span>
            </div>
          </div>
          <div class="cover-card">
            <i class="fa-solid fa-user-doctor"></i>
            <div>
              <strong>6. Profissionais &amp; Simulador Multiprofissional</strong>
              <span>Consulta CFM, Escala de Plantão e Protocolo MEWS</span>
            </div>
          </div>
        </div>
      </div>

      <div class="cover-footer">
        <div>
          <strong>Chancela Regulatória:</strong> CFF 585/2013, CFF 586/2013, CFF 654/2018, ANVISA RDC 44/2009 &amp; RDC 786/2023.
        </div>
        <div>
          <strong>Edição:</strong> Agosto / 2026 &bull; Produção & Nuvem Turso
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PÁGINA 2: SUMÁRIO POR ABAS E ATALHOS -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="tab-header">
        <h2 class="tab-title"><i class="fa-solid fa-compass"></i> Sumário das 7 Abas do Sistema &amp; Cockpit Flutuante</h2>
        <span class="tab-tag">Navegação Geral</span>
      </div>

      <div class="section-card">
        <div class="section-header"><i class="fa-solid fa-table-list"></i> Visão Geral dos Módulos Principais</div>
        <table>
          <thead>
            <tr>
              <th>Aba</th>
              <th>Funções Principais</th>
              <th>Quando Usar</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>📊 1. Métricas</strong></td>
              <td>Dashboard de BI, volume de atendimentos, taxa de bloqueios CDSS e faturamento.</td>
              <td>Acompanhamento diário e relatórios gerenciais da clínica.</td>
            </tr>
            <tr>
              <td><strong>🩺 2. Balcão</strong></td>
              <td>Triagem SOAP em 5 etapas, Red Flags, CDSS 4D, Prescrição e Venda no Caixa.</td>
              <td>Atendimento imediato de queixas comuns de clientes no balcão.</td>
            </tr>
            <tr>
              <td><strong>👤 3. Pacientes</strong></td>
              <td>Cadastro mestre, Alergias, PBMs (+), Compras (🛒), Prontuário e Portal PWA (📱).</td>
              <td>Gestão do cliente, histórico de compras e previsão de recompras.</td>
            </tr>
            <tr>
              <td><strong>📦 4. Estoque</strong></td>
              <td>Catálogo, Scanner Código de Barras (Câmera/USB), Lotes, Validades e Curva ABC.</td>
              <td>Entrada de mercadorias, conferência e controle de perdas.</td>
            </tr>
            <tr>
              <td><strong>💰 5. Financeiro</strong></td>
              <td>Abas Neon (Todos, Receitas, Despesas), Botões [+] para cadastro e DRE em PDF.</td>
              <td>Lançamento de contas, fluxo de caixa e fechamento contábil.</td>
            </tr>
            <tr>
              <td><strong>👨‍⚕️ 6. Profissionais</strong></td>
              <td>Cadastro de Médicos/Equipe, Validação CFM, Plantão e Simulador MEWS.</td>
              <td>Encaminhamentos interdisciplinares, telemedicina e plantonistas.</td>
            </tr>
            <tr>
              <td><strong>⚙️ 7. Configurações</strong></td>
              <td>7 Agrupamentos: Operadores RBAC, Turso Cloud, Sandbox, Parâmetros Financeiros.</td>
              <td>Administração do sistema, permissões e sincronização em nuvem.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section-card">
        <div class="section-header"><i class="fa-solid fa-cubes-stacked"></i> Cockpit Farmacêutico Flutuante (Barra Inferior Fixa)</div>
        <div class="steps-list">
          <div class="step-item">
            <div class="step-num"><i class="fa-solid fa-stethoscope"></i></div>
            <div class="step-text"><strong>Atalho Balcão:</strong> Leva direto para a triagem SOAP do paciente ativo sem perder os dados já preenchidos.</div>
          </div>
          <div class="step-item">
            <div class="step-num"><i class="fa-solid fa-bolt"></i></div>
            <div class="step-text"><strong>Atalho Interações CDSS:</strong> Abre o testador rápido 4D com as medicações e alergias do paciente já cruzadas.</div>
          </div>
          <div class="step-item">
            <div class="step-num"><i class="fa-brands fa-whatsapp"></i></div>
            <div class="step-text"><strong>Atalho WhatsApp:</strong> Dispara posologia, orientações e laudos DSF com 1 clique.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
      <div>Página 2</div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PÁGINA 3: ABA BALCÃO (AS 5 ETAPAS DO ATENDIMENTO DE BALCÃO) -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="tab-header">
        <h2 class="tab-title"><i class="fa-solid fa-stethoscope"></i> Aba 2: Balcão &amp; Triagem Clínica SOAP (< 60s)</h2>
        <span class="tab-tag">Balcão &amp; Clínica</span>
      </div>

      <div class="section-card">
        <div class="section-header"><i class="fa-solid fa-list-ol"></i> As 5 Etapas do Fluxo Operacional de Balcão</div>
        <div class="steps-list">
          <div class="step-item">
            <div class="step-num">1</div>
            <div class="step-text"><strong>Etapa 1 (Identificação Unificada):</strong> Localize o cliente por Nome ou CPF, ou cadastre na hora. Ao clicar no card do paciente, o sistema bipa e avança automaticamente para a triagem.</div>
          </div>
          <div class="step-item">
            <div class="step-num">2</div>
            <div class="step-text"><strong>Etapa 2 (Queixas &amp; Sintomas):</strong> Clique no protocolo clínico (ex: Gripe, Cefaleia, Sintomas Sistêmicos), informe dias de evolução e intensidade.</div>
          </div>
          <div class="step-item">
            <div class="step-num">3</div>
            <div class="step-text"><strong>Etapa 3 (Validação Red Flags - Semáforo Sanitário):</strong> O sistema avalia sinais de alarme. Se não houver sintomas de gravidade, mantém-se desmarcado e aprova a prescrição.</div>
          </div>
          <div class="step-item">
            <div class="step-num">4</div>
            <div class="step-text"><strong>Etapa 4 (Prescrição Segura CDSS 4D &amp; PLN):</strong> Prescreva os MIPs sugeridos e use a busca inteligente por fórmulas DCB, xaropes e queixas leigas. O motor valida interações em tempo real.</div>
          </div>
          <div class="step-item">
            <div class="step-num">5</div>
            <div class="step-text"><strong>Etapa 5 (Conclusão, DSF &amp; Venda Direta):</strong> Emita a Declaração de Serviço Farmacêutico (DSF) com QR Code, envie pelo WhatsApp e clique em <strong>Finalizar Venda no Caixa</strong> para faturar no PDV.</div>
          </div>
        </div>
      </div>

      <div class="section-card" style="border-left: 3.5px solid #0d9488;">
        <div class="section-header"><i class="fa-solid fa-shield-halved"></i> Matriz de Decisão do Motor CDSS 4D</div>
        <p style="font-size: 8.8px; color: #475569; margin-bottom: 3px;">
          Durante a Etapa 4, o sistema executa 4 camadas simultâneas de checagem farmacológica antes de permitir a prescrição:
        </p>
        <ul style="padding-left: 14px; font-size: 8.2px; color: #334155; line-height: 1.32;">
          <li><strong>1D - Checagem de Alergias Declaradas:</strong> Bloqueia princípios ativos alergênicos (ex: Dipirona em pacientes hipersensíveis).</li>
          <li><strong>2D - Interações Medicamentosas Medicamento-Medicamento:</strong> Alerta sobre duplicidade de classe ou risco de sangramento/hipotensão.</li>
          <li><strong>3D - Contraindicações Clínicas Patologia-Fármaco:</strong> Avisa sobre hipertensão não controlada, úlcera péptica ou insuficiência renal.</li>
          <li><strong>4D - Ajuste de Posologia e Limite de Dosagem Diária:</strong> Trava doses acima do limite terapêutico máximo permitido pela Anvisa.</li>
        </ul>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
      <div>Página 3</div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PÁGINA 4: GUIA PRÁTICO DE SIMULAÇÃO CLÍNICA REAL DE BALCÃO (PASSO A PASSO) -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="tab-header" style="background: linear-gradient(135deg, #042f2e, #0f172a); border-left: 4px solid #14b8a6;">
        <h2 class="tab-title" style="color: #2dd4bf;"><i class="fa-solid fa-graduation-cap"></i> Guia Prático Passo a Passo: Simulação Clínica Real de Balcão</h2>
        <span class="tab-tag" style="background: #0d9488; color: #fff;">Caso Prático Balcão</span>
      </div>

      <div class="example-box" style="border: 1.5px solid #0d9488; background: #f0fdfa;">
        <div class="example-badge" style="background: #0d9488; color: #fff;">
          <i class="fa-solid fa-notes-medical"></i> Caso Clínico Real: Paciente com Cefaleia, Astenia (Moleza no Corpo) e Inapetência há 2 Dias
        </div>
        <div class="example-title" style="color: #0f766e;">
          Roteiro Detalhado: Onde Clicar, Como Preencher e o Que o Sistema Faz em Background
        </div>

        <div class="steps-list">
          <div class="step-item">
            <div class="step-num" style="background: #0d9488;">1</div>
            <div class="step-text">
              <strong>Passo 1 — Acessar a Aba Balcão e Selecionar o Paciente:</strong><br>
              Clique na aba <strong>Balcão</strong> na barra superior. No campo de busca, digite <code>Carmem</code> ou o CPF. Dê <strong>1 clique no card do paciente</strong> (<em>Dona Carmem Silva Silveira</em>). O sistema toca um <em>bip sonoro</em>, pré-carrega o histórico de comorbidades (Hipertensa) e alergias, e avança sozinho para a Etapa 2.
            </div>
          </div>

          <div class="step-item">
            <div class="step-num" style="background: #0d9488;">2</div>
            <div class="step-text">
              <strong>Passo 2 — Relatar Queixas, Sintomas e Tempo de Evolução:</strong><br>
              Na Etapa 2, clique no card do protocolo <strong>Gripe, Resfriado e Sintomas Sistêmicos</strong> (ou <strong>Cefaleia Tensional</strong>). No seletor de evolução, ajuste para <strong>2 dias</strong> e no seletor de intensidade marque <strong>🟡 Leve a Moderado</strong>. Em seguida, clique no botão azul <span class="btn-badge">Checar Sinais de Alerta ➔</span>.
            </div>
          </div>

          <div class="step-item">
            <div class="step-num" style="background: #0d9488;">3</div>
            <div class="step-text">
              <strong>Passo 3 — Validação Sanitária do Semáforo Red Flags:</strong><br>
              O sistema apresenta as perguntas de segurança sanitária do CFF (febre persistente > 39°C, rigidez de nuca, dor torácica ou falta de ar). Como a paciente está estável, <strong>deixe as caixas desmarcadas</strong> (mantendo o sinal verde ativo). Clique no botão <span class="btn-badge">Avançar para Prescrição &amp; Cruzamento ➔</span>.
            </div>
          </div>

          <div class="step-item">
            <div class="step-num" style="background: #0d9488;">4</div>
            <div class="step-text">
              <strong>Passo 4 — Prescrição dos Medicamentos &amp; Busca Inteligente por PLN:</strong><br>
              &bull; Clique no botão azul <span class="btn-badge">+ Prescrever</span> ao lado de <em>Paracetamol 750mg</em> (analgésico seguro para a dor e febre).<br>
              &bull; No campo de <strong>Busca Dinâmica PLN</strong>, digite <code>soro</code> e clique em <span class="btn-badge">+ Prescrever</span> nos <em>Sais para Reidratação Oral</em> para repor eletrólitos e combater a moleza/inapetência.<br>
              &bull; Se houver queixa de tosse, digite <code>xarope</code> no campo de busca para exibir <em>Dropropizina, Acebrofilina, Guaifenesina e Hedera Helix</em>.<br>
              &bull; O painel CDSS 4D à direita exibe: <span style="color:#059669; font-weight:700;">✓ Nenhuma Incompatibilidade Crítica Detectada</span>.
            </div>
          </div>

          <div class="step-item">
            <div class="step-num" style="background: #0d9488;">5</div>
            <div class="step-text">
              <strong>Passo 5 — Emissão da DSF, Disparo de WhatsApp &amp; Faturamento no Caixa:</strong><br>
              Clique no botão azul <span class="btn-badge">Concluir &amp; Gerar Declaração Farmacêutica ➔</span>. A <strong>Declaração de Serviço Farmacêutico (DSF)</strong> é gerada na tela com QR Code, assinatura digital e orientações de hidratação (2 a 3L de água/dia). Clique no botão <span class="btn-badge-green">📲 WhatsApp</span> para enviar a receita digital no celular da cliente. Em seguida, clique no botão verde <span class="btn-badge-green">🛒 Finalizar Venda no Caixa</span>: a Frente de Caixa (PDV Rápido) abre com o Paracetamol e os Sais no carrinho (Total: R$ 17,90), dá baixa no lote do estoque e lança no DRE financeiro!
            </div>
          </div>
        </div>
      </div>

      <!-- OBSERVAÇÕES E EXPLICAÇÕES TÉCNICAS DA SIMULAÇÃO -->
      <div class="obs-card">
        <strong>💡 Observações Clínicas &amp; Racional Farmacoterapêutico Deste Caso:</strong>
        <p><strong>• Racional do Paracetamol 750mg:</strong> É o analgésico de 1ª escolha para cefaleia leve/moderada em hipertensos, sem interferência na pressão arterial nem risco de sangramento gástrico de AINEs.</p>
        <p><strong>• Racional dos Sais de Reidratação Oral (Soro):</strong> Mais de 65% das queixas de fraqueza no corpo e inapetência aguda são causadas por depleção eletrolítica leve. A reidratação oral acelera a recuperação celular em até 3x.</p>
        <p><strong>• Função do Semáforo Red Flags:</strong> Se houver sinal grave marcado, o sistema bloqueia os MIPs e emite Guia de Encaminhamento Médico imediata.</p>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
      <div>Página 4</div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PÁGINA 5: ABA CLIENTES, COMPRAS E PORTAL PWA -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="tab-header">
        <h2 class="tab-title"><i class="fa-solid fa-users"></i> Aba 3: Gestão de Clientes, Compras &amp; Portal PWA</h2>
        <span class="tab-tag">Cuidado Longitudinal</span>
      </div>

      <div class="section-card">
        <div class="section-header"><i class="fa-solid fa-table-cells"></i> Ações Rápidas na Linha do Cliente</div>
        <table>
          <thead>
            <tr>
              <th>Ícone</th>
              <th>Nome da Ação</th>
              <th>O que executa</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><i class="fa-solid fa-stethoscope" style="color: #34d399;"></i></td>
              <td><strong>Atender / Balcão</strong></td>
              <td>Abre a triagem SOAP com o cliente já selecionado na Etapa 1.</td>
            </tr>
            <tr>
              <td><i class="fa-solid fa-syringe" style="color: #10b981;"></i></td>
              <td><strong>Vacinação</strong></td>
              <td>Abre o registro de vacina/injetável com os dados do cliente pré-carregados.</td>
            </tr>
            <tr>
              <td><i class="fa-solid fa-mobile-screen-button" style="color: #38bdf8;"></i></td>
              <td><strong>Portal PWA</strong></td>
              <td>Abre o simulador de smartphone do paciente ("Minha Saúde").</td>
            </tr>
            <tr>
              <td><i class="fa-solid fa-cart-shopping" style="color: #10b981;"></i></td>
              <td><strong>Compras &amp; Adesão</strong></td>
              <td>Abre o histórico de medicamentos adquiridos, refill de uso contínuo e WhatsApp.</td>
            </tr>
            <tr>
              <td><i class="fa-solid fa-timeline" style="color: #a78bfa;"></i></td>
              <td><strong>Prontuário</strong></td>
              <td>Visualiza o prontuário completo, histórico de aferições de PA/Glicemia e laudos.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="example-box">
        <div class="example-badge"><i class="fa-solid fa-cart-shopping"></i> Exemplo Prático 2: Consulta de Compras e Previsão de Recompra (Refill)</div>
        <div class="example-title">Cenário: Acompanhar se o anti-hipertensivo da cliente está acabando</div>
        <div class="steps-list">
          <div class="step-item">
            <div class="step-num">1</div>
            <div class="step-text">Na tabela de <strong>Clientes Cadastrados</strong>, localize a cliente e clique no ícone <strong>🛒</strong> (4º botão da coluna Ações Rápidas).</div>
          </div>
          <div class="step-item">
            <div class="step-num">2</div>
            <div class="step-text">O modal exibe: <em>Losartana Potássica 50mg c/ 30 cp</em> &bull; Lote: <code>L-77621</code> &bull; Quantidade: 1 un.</div>
          </div>
          <div class="step-item">
            <div class="step-num">3</div>
            <div class="step-text">O sistema calcula o banner azul: <span style="color:#0284c7; font-weight:700;">Uso Contínuo: Previsão de Recompra em 01/09/2026 (faltam 5 dias)</span>.</div>
          </div>
          <div class="step-item">
            <div class="step-num">4</div>
            <div class="step-text">Clique no botão verde <span class="btn-badge-green">📲 Lembrar Recompra</span>. O sistema abre o WhatsApp com a mensagem avisando a cliente para garantir a continuidade do tratamento.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
      <div>Página 5</div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PÁGINA 6: ABA ESTOQUE (LANÇAMENTO DE MEDICAMENTOS, BARCODE E NF-E) -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="tab-header">
        <h2 class="tab-title"><i class="fa-solid fa-boxes-stacked"></i> Aba 4: Estoque Central &amp; Entrada de Mercadorias</h2>
        <span class="tab-tag">Logística &amp; Lotes</span>
      </div>

      <div class="section-card">
        <div class="section-header"><i class="fa-solid fa-barcode"></i> Leitura de Código de Barras (EAN-13) &amp; Entrada</div>
        <div class="steps-list">
          <div class="step-item">
            <div class="step-num">1</div>
            <div class="step-text"><strong>Scanner por Câmera / Webcam:</strong> Clique em <span class="btn-badge">Leitor de Código de Barras</span> e aponte para a caixa. O sistema bipa e carrega o produto.</div>
          </div>
          <div class="step-item">
            <div class="step-num">2</div>
            <div class="step-text"><strong>Leitor USB Físico:</strong> Basta manter a tela aberta e bipar o leitor de mão em qualquer momento.</div>
          </div>
          <div class="step-item">
            <div class="step-num">3</div>
            <div class="step-text"><strong>Importação de XML de NF-e:</strong> Clique em <span class="btn-badge">Importar NF-e (XML)</span> para lançar dezenas de itens de uma só vez com seus respectivos lotes.</div>
          </div>
        </div>
      </div>

      <div class="example-box">
        <div class="example-badge"><i class="fa-solid fa-plus"></i> Exemplo Prático 3: Cadastro e Entrada de Medicamento no Estoque</div>
        <div class="example-title">Cenário: Entrada de 50 caixas de "Amoxicilina 500mg" da Distribuidora</div>
        <div class="steps-list">
          <div class="step-item">
            <div class="step-num">1</div>
            <div class="step-text">Na aba <strong>Estoque</strong>, clique no botão azul <span class="btn-badge">+ Novo Produto / Medicamento</span>.</div>
          </div>
          <div class="step-item">
            <div class="step-num">2</div>
            <div class="step-text">Preencha o <strong>Nome Comercial:</strong> <code>Amoxicilina 500mg c/ 21 cápsulas</code> &bull; <strong>DCB:</strong> <code>Amoxicilina Tri-hidratada</code>.</div>
          </div>
          <div class="step-item">
            <div class="step-num">3</div>
            <div class="step-text">Informe o <strong>Código de Barras (EAN):</strong> <code>7896004712345</code> &bull; <strong>Lote:</strong> <code>AMX-2026-B</code> &bull; <strong>Validade:</strong> <code>11/2028</code>.</div>
          </div>
          <div class="step-item">
            <div class="step-num">4</div>
            <div class="step-text">Preencha <strong>Qtd de Entrada:</strong> <code>50</code> &bull; <strong>Preço de Custo:</strong> <code>R$ 8,50</code> &bull; <strong>Preço de Venda:</strong> <code>R$ 19,90</code> &bull; <strong>Estoque Mínimo:</strong> <code>10</code>.</div>
          </div>
          <div class="step-item">
            <div class="step-num">5</div>
            <div class="step-text">Clique em <span class="btn-badge">Salvar Produto &amp; Movimentar Entrada</span>. O produto passa a constar no inventário e alimenta a Curva ABC.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
      <div>Página 6</div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PÁGINA 7: ABA FINANCEIRO (ABAS NEON, BOTÕES [+] E DRE) -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="tab-header">
        <h2 class="tab-title"><i class="fa-solid fa-sack-dollar"></i> Aba 5: Gestão Financeira com Abas Neon &amp; DRE</h2>
        <span class="tab-tag">Controladoria &amp; Caixa</span>
      </div>

      <div class="section-card">
        <div class="section-header"><i class="fa-solid fa-money-bill-trend-up"></i> As 3 Abas Neon &amp; Botão de Cadastro Dinâmico [+]</div>
        <div class="steps-list">
          <div class="step-item">
            <div class="step-num"><i class="fa-solid fa-layer-group"></i></div>
            <div class="step-text"><strong>Aba "Todos":</strong> Extrato financeiro unificado em ordem cronológica com saldo líquido.</div>
          </div>
          <div class="step-item">
            <div class="step-num"><i class="fa-solid fa-arrow-down" style="color: #10b981;"></i></div>
            <div class="step-text"><strong>Aba "Receitas":</strong> Entradas de consultas clínicas, venda de MIPs, vacinas e procedimentos TLR.</div>
          </div>
          <div class="step-item">
            <div class="step-num"><i class="fa-solid fa-arrow-up" style="color: #f43f5e;"></i></div>
            <div class="step-text"><strong>Aba "Despesas":</strong> Saídas para compras de distribuidores, insumos, aluguel e despesas operacionais.</div>
          </div>
          <div class="step-item">
            <div class="step-num"><i class="fa-solid fa-plus"></i></div>
            <div class="step-text"><strong>Botões [+] no Formulário:</strong> Permitem criar novas categorias e formas de pagamento no ato do lançamento, sendo salvas no Agrupamento 7 de Configurações.</div>
          </div>
        </div>
      </div>

      <div class="example-box">
        <div class="example-badge"><i class="fa-solid fa-file-invoice-dollar"></i> Exemplo Prático 4: Lançamento de Despesa com Categoria Dinâmica [+]</div>
        <div class="example-title">Cenário: Pagamento de Manutenção do Ar-Condicionado da Sala de Vacinas</div>
        <div class="steps-list">
          <div class="step-item">
            <div class="step-num">1</div>
            <div class="step-text">Acesse a aba <strong>Financeiro</strong> e clique no botão <span class="btn-badge">+ Novo Lançamento</span>.</div>
          </div>
          <div class="step-item">
            <div class="step-num">2</div>
            <div class="step-text">Selecione o tipo <strong>⬆️ Despesa / Saída</strong> e preencha o valor: <code>R$ 180,00</code>.</div>
          </div>
          <div class="step-item">
            <div class="step-num">3</div>
            <div class="step-text">No campo <strong>Categoria</strong>, clique no botão <span class="key-badge">+</span> ao lado do seletor e digite: <code>Manutenção de Climatização</code>.</div>
          </div>
          <div class="step-item">
            <div class="step-num">4</div>
            <div class="step-text">A nova categoria é selecionada na hora e gravada no sistema. Salve o lançamento.</div>
          </div>
          <div class="step-item">
            <div class="step-num">5</div>
            <div class="step-text">Clique em <span class="btn-badge">Exportar DRE em PDF</span> para gerar o Demonstrativo de Resultados consolidado.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
      <div>Página 7</div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PÁGINA 8: ABA PROFISSIONAIS & SIMULADOR CLÍNICO MULTIPROFISSIONAL -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="tab-header" style="background: linear-gradient(135deg, #2e1065, #0f172a); border-left: 4px solid #a855f7;">
        <h2 class="tab-title" style="color: #c084fc;"><i class="fa-solid fa-user-doctor"></i> Aba 6: Profissionais, Médicos &amp; Equipe Multidisciplinar</h2>
        <span class="tab-tag" style="background: #9333ea; color: #fff;">Corpo Clínico &amp; Plantão</span>
      </div>

      <div class="section-card">
        <div class="section-header"><i class="fa-solid fa-users-gear"></i> Gestão do Corpo Clínico &amp; Escala de Plantão</div>
        <div class="steps-list">
          <div class="step-item">
            <div class="step-num"><i class="fa-solid fa-address-card"></i></div>
            <div class="step-text"><strong>Cadastro Multiprofissional &amp; Validação CFM:</strong> Cadastre Médicos, Enfermeiros, Fisioterapeutas e Nutricionistas. O botão <em>"Verificar CFM"</em> valida o registro profissional em tempo real.</div>
          </div>
          <div class="step-item">
            <div class="step-num"><i class="fa-solid fa-calendar-check"></i></div>
            <div class="step-text"><strong>Escala de Plantão do Dia:</strong> O painel superior exibe os profissionais escalados para o plantão, facilitando o acionamento imediato em caso de emergência ou encaminhamento.</div>
          </div>
          <div class="step-item">
            <div class="step-num"><i class="fa-solid fa-timeline"></i></div>
            <div class="step-text"><strong>Histórico Longitudinal de Visitas:</strong> O prontuário do paciente integra todas as queixas triadas no balcão e os atendimentos médicos em uma timeline única.</div>
          </div>
        </div>
      </div>

      <!-- GUIA DO SIMULADOR CLÍNICO MULTIPROFISSIONAL -->
      <div class="example-box" style="border: 1.5px solid #9333ea; background: #faf5ff;">
        <div class="example-badge" style="background: #9333ea; color: #fff;">
          <i class="fa-solid fa-wand-magic-sparkles"></i> Simulador de Atendimento Clínico, Protocolo MEWS &amp; Encaminhamento
        </div>
        <div class="example-title" style="color: #6b21a8;">
          Como operar o Simulador Clínico de Alta Fidelidade (Botão "✨ Simulação de Atendimento Clínico")
        </div>
        <div class="steps-list">
          <div class="step-item">
            <div class="step-num" style="background: #9333ea;">1</div>
            <div class="step-text"><strong>Acesso Rápido:</strong> No topo da aba <em>Profissionais &amp; Equipe</em>, clique no botão roxo <span class="btn-badge-purple">✨ Simulação de Atendimento Clínico</span>.</div>
          </div>
          <div class="step-item">
            <div class="step-num" style="background: #9333ea;">2</div>
            <div class="step-text"><strong>Seleção do Cenário Clínico:</strong> Escolha entre 5 cenários reais: <em>🫀 Crise Hipertensiva (MEWS 4), 🫁 Broncoespasmo/Asma (SpO2 89%), 💊 Interação Severa Sildenafila+Nitrato, 🩸 Hiperglicemia Aguda (Glicose 395) ou 🧠 Cefaleia em Trovoada (Red Flag)</em>.</div>
          </div>
          <div class="step-item">
            <div class="step-num" style="background: #9333ea;">3</div>
            <div class="step-text"><strong>Cálculo Automático MEWS:</strong> O sistema avalia PA, FC, FR, Temp e SpO₂ calculando o escore de risco fisiológico de acordo com as diretrizes do CFF/CFM.</div>
          </div>
          <div class="step-item">
            <div class="step-num" style="background: #9333ea;">4</div>
            <div class="step-text"><strong>Ações Multiprofissionais Imediatas:</strong>
              <ul>
                <li><strong>📹 Iniciar Teleconsulta:</strong> Abre a sala de Telemedicina WebRTC com IA para consulta ao vivo.</li>
                <li><strong>📲 WhatsApp do Paciente:</strong> Envia a mensagem formatada de encaminhamento e orientações de preparo.</li>
                <li><strong>📄 Gerar Guia Médica (PDF):</strong> Emite a Guia Oficial de Encaminhamento com campos para CRF do Farmacêutico e CRM do Médico.</li>
                <li><strong>💾 Salvar no Prontuário:</strong> Grava o episódio simulado na linha do cuidado longitudinal.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="obs-card" style="background: #fdf4ff; border-color: #f0abfc; border-left-color: #c026d3; color: #701a75;">
        <strong>💡 Observações sobre o Escore MEWS &amp; Integração Interdisciplinar:</strong>
        <p><strong>• Escore MEWS &ge; 5 (Alto Risco):</strong> Exige encaminhamento médico imediato ou acionamento de SAMU/Emergência.</p>
        <p><strong>• Bloqueio por Interação Medicamentosa Severa:</strong> O Farmacêutico atua como barreira final de segurança antes que o paciente administre combinações letais (ex: Nitratos + Inibidores de PDE-5).</p>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
      <div>Página 8</div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PÁGINA 9: ABA CONFIGURAÇÕES (7 AGRUPAMENTOS E HARD RESET SEGURO) -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="tab-header">
        <h2 class="tab-title"><i class="fa-solid fa-sliders"></i> Aba 7: Central de Configurações em 7 Agrupamentos</h2>
        <span class="tab-tag">Administração &amp; Nuvem</span>
      </div>

      <div class="section-card">
        <div class="section-header"><i class="fa-solid fa-sitemap"></i> Estrutura dos 7 Agrupamentos de Governança</div>
        <table>
          <thead>
            <tr>
              <th>Agrupamento</th>
              <th>Responsabilidade</th>
              <th>Permissões</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>1. Operadores &amp; RBAC</strong></td>
              <td>Controle de logins de farmacêuticos, atendentes e administradores.</td>
              <td>Apenas Master / Administrador</td>
            </tr>
            <tr>
              <td><strong>2. Nuvem Turso Cloud</strong></td>
              <td>Status da réplica distribuída LibSQL e sincronização bidirecional.</td>
              <td>Automático com fallback offline</td>
            </tr>
            <tr>
              <td><strong>3. Dados da Farmácia &amp; RT</strong></td>
              <td>Razão Social, CNPJ, Endereço e Registro CRF para laudos DSF.</td>
              <td>Farmacêutico Responsável Técnico</td>
            </tr>
            <tr>
              <td><strong>4. Protocolos Clínicos</strong></td>
              <td>Personalização de queixas, sinais de alarme e árvores de decisão.</td>
              <td>Equipe Clínica / RT</td>
            </tr>
            <tr>
              <td><strong>5. Regras de Dispensação</strong></td>
              <td>Travas de segurança, limites de MIPs e termos de consentimento.</td>
              <td>Farmacêutico RT</td>
            </tr>
            <tr>
              <td><strong>6. Sandbox &amp; Hard Reset</strong></td>
              <td>Geração de massa de teste e limpeza total protegida por senha.</td>
              <td>Senha Master Obrigatória</td>
            </tr>
            <tr>
              <td><strong>7. Parâmetros Financeiros</strong></td>
              <td>Edição e exclusão de categorias e meios de pagamento criados via [+].</td>
              <td>Administrador Financeiro</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="example-box">
        <div class="example-badge"><i class="fa-solid fa-triangle-exclamation"></i> Exemplo Prático 5: Execução de Hard Reset Seguro</div>
        <div class="example-title">Cenário: Limpar atendimentos e vendas de teste antes da inauguração da clínica</div>
        <div class="steps-list">
          <div class="step-item">
            <div class="step-num">1</div>
            <div class="step-text">Acesse a aba <strong>Configurações</strong> e role até o <strong>Agrupamento 6 (Sandbox de Demonstração)</strong>.</div>
          </div>
          <div class="step-item">
            <div class="step-num">2</div>
            <div class="step-text">Clique no botão vermelho <span class="btn-badge" style="background:#dc2626;">⚠️ Hard Reset Total</span>.</div>
          </div>
          <div class="step-item">
            <div class="step-num">3</div>
            <div class="step-text">O sistema abre o modal de segurança solicitando a <strong>Senha Master do Estabelecimento</strong>.</div>
          </div>
          <div class="step-item">
            <div class="step-num">4</div>
            <div class="step-text">Ao digitar a senha correta, todas as vendas e atendimentos de teste são zerados no banco local e na nuvem Turso, preservando os cadastros de operadores e dados do RT.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-page">
      <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
      <div>Página 9</div>
    </div>
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
      margin: { top: '7mm', right: '9mm', bottom: '7mm', left: '9mm' },
      printBackground: true
    });
    await browser.close();
    console.log(`Manual do Usuário Super Completo gerado com sucesso em: ${outputPath}`);
  } catch (err) {
    console.error('Erro ao gerar Manual do Usuário:', err);
  }
}

generateCompleteUserManualPDF();
