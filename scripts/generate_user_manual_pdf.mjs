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
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      color: #1e293b;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.5;
    }
    
    @page {
      size: A4;
      margin: 10mm 12mm 10mm 12mm;
    }

    .page-break {
      page-break-after: always;
      break-after: page;
    }

    /* CAPA OFICIAL */
    .cover-container {
      min-height: 960px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: linear-gradient(145deg, #042f2e 0%, #0f172a 50%, #064e3b 100%);
      color: #ffffff;
      padding: 44px 34px;
      border-radius: 16px;
      border: 2px solid #14b8a6;
      box-shadow: 0 12px 36px rgba(0,0,0,0.35);
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
      font-weight: 800;
      font-size: 11px;
      letter-spacing: 1px;
      text-transform: uppercase;
      width: fit-content;
    }
    .cover-title {
      font-family: 'Outfit', sans-serif;
      font-size: 32px;
      font-weight: 900;
      margin: 16px 0 8px;
      color: #ffffff;
      letter-spacing: -0.8px;
      line-height: 1.15;
    }
    .cover-title span {
      color: #2dd4bf;
    }
    .cover-subtitle {
      font-size: 13.5px;
      color: #cbd5e1;
      max-width: 660px;
      line-height: 1.5;
      margin-bottom: 20px;
    }
    .cover-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 18px 0;
    }
    .cover-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cover-card i {
      font-size: 18px;
      color: #2dd4bf;
    }
    .cover-card strong {
      display: block;
      color: #ffffff;
      font-size: 11.5px;
      font-family: 'Outfit', sans-serif;
    }
    .cover-card span {
      color: #94a3b8;
      font-size: 9.5px;
    }
    .cover-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 10px;
      color: #94a3b8;
    }
    .cover-footer strong {
      color: #2dd4bf;
    }

    /* CABEÇALHO DE CAPÍTULOS / ABAS */
    .tab-header {
      background: linear-gradient(135deg, #0f172a, #134e4a);
      color: #ffffff;
      padding: 8px 14px;
      border-radius: 8px;
      margin-top: 6px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-left: 5px solid #2dd4bf;
    }
    .tab-title {
      font-family: 'Outfit', sans-serif;
      font-size: 13.5px;
      font-weight: 800;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tab-tag {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 6px;
      background: rgba(45, 212, 191, 0.2);
      color: #2dd4bf;
      border: 1px solid rgba(45, 212, 191, 0.4);
    }

    /* CARDS DE CONTEÚDO E EXEMPLOS */
    .section-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.03);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 12px;
      color: #0f172a;
    }
    .section-header i {
      color: #0d9488;
      font-size: 13px;
    }

    /* BOX DE EXEMPLO PRÁTICO */
    .example-box {
      background: #f8fafc;
      border: 1.5px solid #0284c7;
      border-radius: 8px;
      padding: 10px 12px;
      margin: 8px 0;
      page-break-inside: avoid;
    }
    .example-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #0284c7;
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .example-title {
      font-family: 'Outfit', sans-serif;
      font-size: 11.5px;
      font-weight: 800;
      color: #0c4a6e;
      margin-bottom: 4px;
    }

    /* PASSOS */
    .steps-list {
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin: 6px 0;
    }
    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 10.5px;
      color: #334155;
    }
    .step-num {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #0f766e;
      color: #ffffff;
      font-size: 9px;
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
      font-size: 10px;
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
      font-size: 9.5px;
      color: #0f766e;
      font-weight: 700;
    }

    /* TABELAS */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0;
      font-size: 10px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      text-align: left;
      padding: 5px 7px;
      font-size: 9.5px;
      text-transform: uppercase;
    }
    td {
      padding: 4px 7px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }

    .footer-page {
      border-top: 1px solid #e2e8f0;
      padding-top: 4px;
      margin-top: 10px;
      font-size: 8.5px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <!-- PÁGINA 1: CAPA OFICIAL MASTER -->
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
          <i class="fa-solid fa-mobile-screen-button"></i>
          <div>
            <strong>6. Portal PWA "Minha Saúde"</strong>
            <span>Despertador de remédios e notificação WhatsApp</span>
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

  <div class="page-break"></div>

  <!-- PÁGINA 2: SUMÁRIO POR ABAS E ATALHOS -->
  <div class="tab-header">
    <h2 class="tab-title"><i class="fa-solid fa-compass"></i> Sumário das 7 Abas do Sistema &amp; Cockpit Flutuante</h2>
    <span class="tab-tag">Navegação Geral</span>
  </div>

  <p style="color: #475569; margin: 4px 0 8px;">
    O CRM Clínico Farmacêutico v3.0 organiza todo o trabalho diário em <strong>7 Abas Principais</strong> acessíveis na barra superior de navegação:
  </p>

  <div class="section-card">
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
          <td><strong>📜 6. Relatórios</strong></td>
          <td>Emissão de DSF com Hash SHA-256, Guia de Encaminhamento e Boletos TISS.</td>
          <td>Geração de documentos oficiais sanitários e convênios.</td>
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
        <div class="step-text"><strong>Atalho Balcão:</strong> Leva direto para a triagem SOAP do paciente ativo sem perder os dados preenchidos.</div>
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

  <div class="footer-page">
    <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
    <div>Página 2</div>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 3: ABA BALCÃO (TRIAGEM SOAP, CDSS E VENDA NO CAIXA) -->
  <div class="tab-header">
    <h2 class="tab-title"><i class="fa-solid fa-stethoscope"></i> Aba 2: Balcão &amp; Triagem Clínica SOAP (< 60s)</h2>
    <span class="tab-tag">Balcão &amp; Clínica</span>
  </div>

  <div class="section-card">
    <div class="section-header"><i class="fa-solid fa-list-ol"></i> As 5 Etapas do Atendimento de Balcão</div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-text"><strong>Etapa 1 (Identificação):</strong> Localize o cliente por Nome ou CPF, ou cadastre na hora.</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-text"><strong>Etapa 2 (Queixa &amp; Sintomas):</strong> Clique no protocolo clínico (ex: Gripe, Cefaleia), informe dias de evolução e intensidade.</div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-text"><strong>Etapa 3 (Sinais de Alerta):</strong> O sistema avalia sinais graves. Se houver Red Flags, bloqueia MIPs e emite Guia Médica.</div>
      </div>
      <div class="step-item">
        <div class="step-num">4</div>
        <div class="step-text"><strong>Etapa 4 (Prescrição Segura CDSS 4D):</strong> Selecione os MIPs recomendados. O motor valida interações em tempo real.</div>
      </div>
      <div class="step-item">
        <div class="step-num">5</div>
        <div class="step-text"><strong>Etapa 5 (Conclusão, DSF &amp; Venda):</strong> Emita a DSF em PDF, envie no WhatsApp e clique em <strong>"🛒 Finalizar Venda no Caixa"</strong>.</div>
      </div>
    </div>
  </div>

  <!-- EXEMPLO 1 -->
  <div class="example-box">
    <div class="example-badge"><i class="fa-solid fa-circle-check"></i> Exemplo Prático 1: Atendimento Clínico com Venda Direta</div>
    <div class="example-title">Cenário: Cliente "Dona Carmem" com Sintomas Gripais e Alergia a Dipirona</div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">Na <strong>Etapa 1</strong>, busque "Carmem" e selecione seu cadastro. O sistema alerta imediatamente: <span style="color:#ef4444; font-weight:700;">⚠️ Alergia a Dipirona</span>.</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">Na <strong>Etapa 2</strong>, clique no card <em>"Gripe, Resfriado e Congestão"</em>, coloque <em>2 dias</em> e intensidade <em>Moderada</em>.</div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-text">Na <strong>Etapa 3</strong>, confirme a ausência de febre alta persistente ou falta de ar (Sem Red Flags).</div>
      </div>
      <div class="step-item">
        <div class="step-num">4</div>
        <div class="step-text">Na <strong>Etapa 4</strong>, selecione <em>Paracetamol 750mg</em> + <em>Soro Fisiológico 0.9% para Lavagem Nasal</em>. O motor CDSS aprova a segurança da fórmula.</div>
      </div>
      <div class="step-item">
        <div class="step-num">5</div>
        <div class="step-text">Na <strong>Etapa 5</strong>, clique no botão verde <strong>"🛒 Finalizar Venda no Caixa"</strong>. O sistema abre o PDV com os medicamentos, calcula o total (R$ 23,40), recebe via PIX e dá baixa no estoque.</div>
      </div>
    </div>
  </div>

  <div class="footer-page">
    <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
    <div>Página 3</div>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 4: ABA PACIENTES, HISTÓRICO DE COMPRAS E PWA -->
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

  <!-- EXEMPLO 2 -->
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
        <div class="step-text">Clique no botão verde <strong>"📲 Lembrar Recompra"</strong>. O sistema abre o WhatsApp com a mensagem avisando a cliente para garantir a continuidade do tratamento.</div>
      </div>
    </div>
  </div>

  <div class="footer-page">
    <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
    <div>Página 4</div>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 5: ABA ESTOQUE (LANÇAMENTO DE MEDICAMENTOS, BARCODE E NF-E) -->
  <div class="tab-header">
    <h2 class="tab-title"><i class="fa-solid fa-boxes-stacked"></i> Aba 4: Estoque Central &amp; Entrada de Mercadorias</h2>
    <span class="tab-tag">Logística &amp; Lotes</span>
  </div>

  <div class="section-card">
    <div class="section-header"><i class="fa-solid fa-barcode"></i> Leitura de Código de Barras (EAN-13) &amp; Entrada</div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-text"><strong>Scanner por Câmera / Webcam:</strong> Clique em <em>"📷 Leitor de Código de Barras"</em> e aponte para a caixa. O sistema bipa e carrega o produto.</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-text"><strong>Leitor USB Físico:</strong> Basta manter a tela aberta e bipar o leitor de mão em qualquer momento.</div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-text"><strong>Importação de XML de NF-e:</strong> Clique em <em>"📄 Importar NF-e (XML)"</em> para lançar dezenas de itens de uma só vez com seus respectivos lotes.</div>
      </div>
    </div>
  </div>

  <!-- EXEMPLO 3 -->
  <div class="example-box">
    <div class="example-badge"><i class="fa-solid fa-plus"></i> Exemplo Prático 3: Cadastro e Entrada de Medicamento no Estoque</div>
    <div class="example-title">Cenário: Entrada de 50 caixas de "Amoxicilina 500mg" da Distribuidora</div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">Na aba <strong>Estoque</strong>, clique no botão azul <strong>"+ Novo Produto / Medicamento"</strong>.</div>
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
        <div class="step-text">Clique em <strong>"Salvar Produto &amp; Movimentar Entrada"</strong>. O produto passa a constar no inventário e alimenta a Curva ABC.</div>
      </div>
    </div>
  </div>

  <div class="footer-page">
    <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
    <div>Página 5</div>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 6: ABA FINANCEIRO (ABAS NEON, BOTÕES [+] E DRE) -->
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
        <div class="step-text"><strong>Aba "⬇️ Receitas":</strong> Entradas de consultas clínicas, venda de MIPs, vacinas e procedimentos TLR.</div>
      </div>
      <div class="step-item">
        <div class="step-num"><i class="fa-solid fa-arrow-up" style="color: #f43f5e;"></i></div>
        <div class="step-text"><strong>Aba "⬆️ Despesas":</strong> Saídas para compras de distribuidores, insumos, aluguel e despesas operacionais.</div>
      </div>
      <div class="step-item">
        <div class="step-num"><i class="fa-solid fa-plus"></i></div>
        <div class="step-text"><strong>Botões [+] no Formulário:</strong> Permitem criar novas categorias e formas de pagamento no ato do lançamento, sendo enviadas automaticamente para o Agrupamento 7 de Configurações.</div>
      </div>
    </div>
  </div>

  <!-- EXEMPLO 4 -->
  <div class="example-box">
    <div class="example-badge"><i class="fa-solid fa-file-invoice-dollar"></i> Exemplo Prático 4: Lançamento de Despesa com Categoria Dinâmica [+]</div>
    <div class="example-title">Cenário: Pagamento de Manutenção do Ar-Condicionado da Sala de Vacinas</div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-text">Acesse a aba <strong>Financeiro</strong> e clique no botão <strong>"+ Novo Lançamento"</strong>.</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-text">Selecione o tipo <strong>"⬆️ Despesa / Saída"</strong> e preencha o valor: <code>R$ 180,00</code>.</div>
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
        <div class="step-text">Clique em <strong>"📄 Exportar DRE em PDF"</strong> para gerar o Demonstrativo de Resultados consolidado.</div>
      </div>
    </div>
  </div>

  <div class="footer-page">
    <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
    <div>Página 6</div>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 7: ABA CONFIGURAÇÕES (7 AGRUPAMENTOS E HARD RESET SEGURO) -->
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

  <!-- EXEMPLO 5 -->
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
        <div class="step-text">Clique no botão vermelho <strong>"⚠️ Hard Reset Total"</strong>.</div>
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

  <div class="footer-page">
    <div>CRM Clínico Farmacêutico &bull; Manual do Usuário v3.0</div>
    <div>Página 7</div>
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
      margin: { top: '8mm', right: '10mm', bottom: '8mm', left: '10mm' },
      printBackground: true
    });
    await browser.close();
    console.log(`Manual do Usuário Super Completo gerado com sucesso em: ${outputPath}`);
  } catch (err) {
    console.error('Erro ao gerar Manual do Usuário:', err);
  }
}

generateCompleteUserManualPDF();
