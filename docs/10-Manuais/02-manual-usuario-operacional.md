# 📘 CRM Clínico Farmacêutico — Manual Operacional do Usuário & Consultório

> **Versão da Plataforma:** 3.0.0 Enterprise  
> **Responsabilidade Técnica:** Dr. Marcelo Mazaro (CRF-SP 54180)  
> **Homologação:** Agosto/2026  
> **Marco Regulatório:** Resoluções CFF nº 585/2013, 586/2013, 654/2018 | ANVISA RDC nº 44/2009 & 786/2023 | LGPD Lei nº 13.709/2018

---

## 📑 SUMÁRIO DO MANUAL DO USUÁRIO

1. [Visão Geral & Primeiro Acesso](#1-visão-geral--primeiro-acesso)
2. [Atalhos Globais de Teclado (Produtividade F1-F12)](#2-atalhos-globais-de-teclado-produtividade-f1-f12)
3. [Módulo de Balcão & Atendimento Clínico (SOAP + CDSS 4D)](#3-módulo-de-balcão--atendimento-clínico-soap--cdss-4d)
4. [Prontuário Longitudinal & Telemetria de Sinais Vitais](#4-prontuário-longitudinal--telemetria-de-sinais-vitais)
5. [Controle de Estoque, Código de Barras & Importação de XML](#5-controle-de-estoque-código-de-barras--importação-de-xml)
6. [Gestão Financeira, PDV Rápido & Boletos FEBRABAN](#6-gestão-financeira-pdv-rápido--boletos-febraban)
7. [Central de Relatórios & Exportação Direta de PDF A4](#7-central-de-relatórios--exportação-direta-de-pdf-a4)
8. [Configurações, Backup & Sincronização Cloud](#8-configurações-backup--sincronização-cloud)

---

## 1. Visão Geral & Primeiro Acesso

O **CRM Clínico Farmacêutico** foi desenvolvido para transformar a rotina do farmacêutico clínico e do balcão de dispensação em uma operação de alta velocidade, segurança e lucratividade.

### 1.1. Arquitetura Híbrida Offline-First
- O sistema opera 100% no navegador (Chrome, Edge, Firefox, Safari ou navegadores mobile).
- Os dados são salvos localmente e replicados de forma contínua para o cluster de nuvem **Turso LibSQL**, permitindo continuar o atendimento mesmo se a conexão com a internet oscilar ou cair.

---

## 2. Atalhos Globais de Teclado (Produtividade F1-F12)

Para garantir que o farmacêutico não precise tirar as mãos do teclado durante o atendimento, o sistema disponibiliza teclas de função rápidas:

| Tecla | Módulo / Ação | Descrição Operacional |
| :--- | :--- | :--- |
| **`F1`** | **Ajuda & Atalhos** | Exibe o modal central com todos os atalhos e dicas de uso |
| **`F2`** | **Balcão / Atendimento** | Abre o módulo de triagem clínica SOAP e prescrição |
| **`F3`** | **Pacientes & Prontuário** | Acessa a lista de pacientes, sinais vitais e histórico |
| **`F4`** | **Estoque & Catálogo** | Abre o inventário, curva ABC e scanner de código de barras |
| **`F6`** | **Financeiro & DRE** | Abre o painel financeiro, contas e boletos bancários |
| **`F7`** | **Relatórios & DSF** | Abre a central de relatórios e exportação direta em PDF |
| **`F8`** | **Dashboard Executivo** | Retorna à visão geral de métricas e KPIs do consultório |
| **`F9`** | **Configurações** | Acessa parâmetros, operadores e conexão com a nuvem |
| **`F10`** | **PDV Venda Rápida** | Abre instantaneamente o caixa rápido com o paciente ativo |

---

## 3. Módulo de Balcão & Atendimento Clínico (SOAP + CDSS 4D)

### 3.1. Passo a Passo do Atendimento em Menos de 60 Segundos
1. **Identificação do Paciente:** Digite o nome ou CPF no campo de busca. O sistema carrega o histórico clínico, alergias e medicamentos crônicos.
2. **Seleção da Queixa Principal:** Escolha o protocolo rápido (Ex: *Gripe/Resfriado*, *Dor/Febre*, *Azia/Refluxo*, *Alergia*, *Diarreia*).
3. **Avaliação dos Red Flags & Rastreio de Sepse (qSOFA / SSC):** Se o paciente apresentar sinais de gravidade, febre alta persistente, taquipneia ou hipotensão, o sistema emite o **Card de Alerta de Sepse (Surviving Sepsis Campaign)** e prepara a *Guia de Encaminhamento Médico de Urgência*.
4. **Prescrição Farmacêutica Segura (CDSS 4D):** Adicione os MIPs recomendados. O motor 4D valida:
   - Interações medicamento x medicamento.
   - Alergias declaradas do paciente.
   - Critérios de Beers para idosos.
   - Dosagem e posologia segura.
5. **Conclusão, Consulta em Tela & Exportação Direta de PDF:** Clique em **`Finalizar Atendimento`**. O sistema abre a **Janela Modal de Consulta Prévia da DSF**, permitindo conferir todos os parâmetros clínicos, posologia e orientações na tela antes de emitir. A partir desta janela, você pode:
   - Clicar em **`Exportar PDF Direto`** para gerar e baixar instantaneamente o PDF vetorial A4 nítido (sem depender de caixa de diálogo de impressão do navegador).
   - Enviar a receita digital formatada com link seguro via **WhatsApp**.
   - Clicar em **`Finalizar Venda no Caixa`** para faturar no PDV com baixa imediata no estoque.

### 3.2. Rastreio Precoce de Sepse (Consenso Internacional SSC / qSOFA)
- O sistema analisa continuamente os critérios de corte do *Quick SOFA* (PAS $\le$ 100 mmHg, FR $\ge$ 22 irpm, alteração mental/Glasgow e temperatura fora da faixa).
- **qSOFA $\ge$ 2:** A recomendação de MIPs é **bloqueada imediatamente**, emitindo o alerta vermelho de suspeita de infecção com disfunção orgânica para acionamento do SAMU 192 ou encaminhamento prioritário à UPA/Hospital (CFF nº 585/2013).

---

## 4. Prontuário Longitudinal & Telemetria de Sinais Vitais

### 4.1. Lançamento de Sinais Vitais
No prontuário do paciente, acesse a aba **`Sinais Vitais`** para registrar:
- **Pressão Arterial (PA):** Sistólica e Diastólica com classificação automática e badges visuais coloridos (Ótima, Normal, Pré-hipertensão, Hipertensão Estágio 1/2/3).
- **Frequência Cardíaca (FC):** Batimentos por minuto (bpm) com alerta de taquicardia/bradicardia.
- **Temperatura Corpórea:** Em graus Celsius (°C).
- **Saturação de Oxigênio (SpO2):** Em porcentagem (%) com cálculo de escore MEWS.
- **Glicemia Capilar:** Em mg/dL com indicação de jejum ou pós-prandial.
- **Peso e Altura:** Cálculo instantâneo do Índice de Massa Corporal (IMC) e faixa de risco.

### 4.2. Histórico de Compras Integrado (`🛒`)
Clique no ícone de carrinho para visualizar todas as compras e medicamentos já adquiridos pelo paciente no PDV da farmácia, facilitando a conciliação terapêutica e o cálculo de recompra contínua (refill).

### 4.3. Interface Focada & Centralização de Documentos no Prontuário
- **Eliminação de Redundâncias:** Para manter a tabela de pacientes ágil e ergonômica, os botões redundantes de PDF foram removidos das linhas e do cabeçalho da janela de prontuário.
- **Consulta & Reemissão de DSF na Linha do Tempo:** Cada atendimento gravado na timeline possui o botão exclusivo **`Visualizar / Exportar DSF`**, que abre o modal de consulta prévia em tela e download direto do PDF vetorial.
- **Formulário Ergonômico de Cadastro:** O menu flutuante de seleção de PBMs (+) foi ajustado com posicionamento dinâmico inteligente, evitando que cubra os campos subsequentes (como CEP ou Endereço) durante a digitação.

---

## 5. Controle de Estoque, Código de Barras & Importação de XML

### 5.1. Leitura por Código de Barras
- Conecte um leitor de código de barras USB/Bluetooth ou utilize a câmera do smartphone/webcam clicando no botão do leitor óptico. O sistema identifica o EAN-13 instantaneamente com confirmação sonora (*bip*).

### 5.2. Entrada de Notas Fiscais (XML da Distribuidora)
1. Clique em **`Importar XML NFe`**.
2. Selecione o arquivo `.xml` da nota fiscal recebida do distribuidor.
3. O sistema lê lotes, validades, custos e calcula automaticamente a margem de lucro sugerida e PMC.

---

### 2.3. Ditado Clínico por Voz (Web Speech API)
- Em qualquer campo de texto livre do prontuário (Observações da Queixa, Parecer Farmacêutico, Justificativa Técnica), clique no botão **`🎙️ Ditado por Voz`**.
- O botão passará para o estado pulsante **`🎙️ Ouvindo...`** em vermelho.
- Fale pausadamente no microfone do dispositivo; o sistema transcreverá a anamnese em tempo real em Português (*pt-BR*).
- Clique novamente no botão para finalizar a captura ou pause a fala por alguns instantes.

### 2.4. Sala de Teleconsulta Farmacêutica WebRTC
1. No topo da aba de atendimento clínico, clique em **`📹 Teleconsulta`**.
2. O sistema abrirá a sala de teleatendimento com vídeo HD e áudio ponto a ponto criptografado.
3. Clique em **`🔗 Copiar Link do Paciente`** para enviar o link direto da chamada para o WhatsApp ou e-mail do paciente.
4. Utilize a barra inferior para mutar microfone, desligar câmera ou **compartilhar a tela** para apresentar laudos ou receitas.
5. Preencha a evolução clínica no painel **SOAP Lateral** e clique em **`Salvar no Prontuário`** sem sair da chamada.

---

## 6. Gestão Financeira, PDV Rápido & Boletos FEBRABAN

### 6.1. PDV / Caixa Rápido (`F10`) & PIX Dinâmico BACEN
- Selecione o cliente e os itens/serviços farmacêuticos.
- Ao selecionar a opção **`PIX`**, o sistema gera instantaneamente o **QR Code oficial padrão BACEN (BR Code / EMV QRCPS-MPM)** com o valor exato da venda e cálculo de CRC16.
- Clique em **`📋 Copiar Código PIX`** para enviar a linha Copia e Cola ao cliente ou permita que ele aponte a câmera do aplicativo bancário para a tela.
- Escolha outras formas de pagamento (Cartão de Crédito/Débito, Dinheiro, Convênio) conforme a preferência do cliente.
- Imprima o comprovante térmico (58mm/80mm) ou envie por mensagem eletrônica.

### 6.2. Emissão de Boletos FEBRABAN
1. Acesse **`Financeiro` ➔ `Boletos`**.
2. Clique no título desejado para visualizar o boleto com linha digitável e código de barras FEBRABAN.
3. Clique em **`📥 Baixar PDF Direto`** para salvar o boleto pronto para envio ao cliente.

---

## 7. Central de Relatórios & Exportação Direta de PDF A4

### 7.1. Navegação nas 6 Abas Especializadas
1. **Atendimentos:** Histórico clínico completo e evoluções.
2. **Pacientes:** Listagem demográfica com opção de visualização confidencial PEP / LGPD.
3. **Procedimentos:** Total de aferições de sinais vitais, vacinas e testes rápidos.
4. **Estoque:** Posição física, alertas de validade e giro.
5. **Vendas:** Movimentação do PDV por período e operador.
6. **Financeiro:** Demonstrativo de contas a pagar, receber e liquidadas com resumo executivo.

### 7.2. Gráficos 3D Dinâmicos com Alternador de Estilo (`🔄 Estilo`)
- Todos os gráficos da central de relatórios possuem um botão **`🔄 Estilo`** e um *badge* visual do formato atual.
- Clique no botão para alternar dinamicamente entre **Rosca 3D Glossy**, **Barras 3D Volumétricas**, **Pizza 3D Cristalina**, **Esfera Polar 3D** e **Linha Suave Neon**, permitindo apresentações executivas personalizadas.

### 7.3. Exportação Direta em PDF sem Caixa de Diálogo
- Clique em **`📥 Baixar PDF Direto`** na barra superior da janela do relatório ou na **Janela Modal de Consulta Prévia da DSF**.
- O sistema processa a folha A4 em formato retrato (`210mm × 297mm`) com diagramação estruturada em alta definição vetorial (jsPDF) e salva o arquivo `.pdf` diretamente no dispositivo sem acionar a janela de impressão do sistema operacional.
- O motor de diagramação calcula margens e quebras de página automáticas, garantindo zero sobreposição de textos em prescrições extensas.

### 7.4. Consulta Prévia em Janela Modal da DSF
- Em qualquer ponto do sistema (após a conclusão do atendimento ou na timeline do prontuário), a DSF é exibida em uma janela modal limpa e interativa.
- O farmacêutico pode inspecionar todos os campos clínicos, conferir a lista de MIPs, dosagens e instruções antes de autorizar a impressão ou exportação.

---

## 8. Configurações, Backup & Sincronização Cloud

### 8.1. Gestão de Operadores & Instruções de Acesso Seguras (RBAC)
- **Instruções de Acesso Protegidas:** As credenciais e papéis são gerenciados sob política de privilégio mínimo. O sistema fornece orientações claras de permissão para cada perfil sem expor senhas em texto puro na interface pública.
- **Gestor Master:** Acesso irrestrito a todos os módulos, DRE, configurações, parâmetros fiscais e rotinas de expurgo.
- **Farmacêutico RT:** Emissão com assinatura técnica, validação de protocolos e controle sanitário.
- **Farmacêutico Clínico:** Atendimento ao paciente, triagem SOAP, aferições e prescrições.
- **Atendente:** Operação restrita ao PDV, caixa e cadastro demográfico básico.

### 8.2. Backup de Segurança & Sincronização Turso Cloud
- Na aba **`Configurações` ➔ `Backup`**, gere backups periódicos criptografados em formato JSON para garantir salvaguarda de dados em conformidade com as normas sanitárias do CFF e ANVISA.
- A sincronização contínua com a réplica **Turso LibSQL Cloud** assegura integridade de dados mesmo em trocas de dispositivos.

### 8.3. Sandbox de Demonstração & HARD RESET Atômico Seguro
- O sistema disponibiliza no Agrupamento 6 o gerador de dados de teste (com a tag `[SIMULADO]`).
- **Limpeza Profunda (HARD RESET):** Remove com 1 clique todas as consultas, prescrições, compras, vendas PDV e movimentações financeiras de teste. O expurgo é sincronizado atômica e simultaneamente no banco local (IndexedDB) e na nuvem (Turso Cloud), garantindo a eliminação total de registros órfãos ou resíduos, mantendo intactos os dados cadastrais da farmácia e os operadores do sistema.
