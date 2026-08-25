# CRM Clínico Farmacêutico & Suporte à Decisão Clínica (CDSS 4D)

Plataforma de alta performance para **Cuidado Farmacêutico, Triagem Clínica Guiada (< 60s), Prescrição Segura de MIPs e Motor de Cruzamento de Interações em Tempo Real**, em conformidade com as **Resoluções CFF nº 585/2013 e 586/2013** e normas da **ANVISA**.

---

## 🌿 Pilares Centrais do Sistema

```mermaid
flowchart TD
    A["👤 1. Identificação do Paciente\n(CPF, Alergias, Comorbidades, Gestação)"] --> B["🩺 2. Triagem Guiada por Queixas\n(Gripe, Cefaleia, Dispepsia, Lombalgia, Diarreia)"]
    B --> C["🚨 3. Validação de Red Flags\n(Detecção Automática de Sinais de Alerta)"]
    C -->|Red Flags Detectados| D["🛑 Bloqueio de MIPs + Guia de Encaminhamento Médico"]
    C -->|Sem Red Flags| E["💊 4. Prescrição de MIPs & Não-Medicamentosas"]
    E --> F["⚡ 5. Motor de Interações CDSS 4D\n(Fármaco x Fármaco, Alergias, Doenças, Alimentos)"]
    F -->|Contraindicação Grave| G["🔒 Trava de Segurança com Parecer Técnico & CRF"]
    F -->|Aprovado / Ajuste| H["📜 6. Emissão de Declaração de Serviço (CFF 585/586)\n(Impressão, PDF e WhatsApp)"]
    H --> I["📋 7. Prontuário Longitudinal & Linha do Tempo"]
```

---

## 💎 Características e Diferenciais

1. **🩺 Balcão de Atendimento & Triagem Rápida (< 60s)**
   - Árvores de decisão clínica com protocolos estruturados para as queixas mais comuns de balcão.
   - Detecção em tempo real de sinais de alarme (*Red Flags*), bloqueando a dispensação indevida de MIPs e emitindo a Guia de Encaminhamento Médico.

2. **⚡ Motor de Suporte à Decisão Clínica (CDSS 4D)**
   - Validação cruzada multidimensional instantânea:
     - **Fármaco x Fármaco (DDI)**: Detecção de sinergismos e antagonismos (ex.: *Nitrato + PDE-5*, *Varfarina + AINEs*, *ISRS + Tramadol*).
     - **Fármaco x Alergias**: Alertas de reatividade cruzada (ex.: *Dipirona / Pirazolonas*, *Penicilinas*).
     - **Fármaco x Comorbidades**: Restrições em hipertensos, diabéticos, insuficiência renal ou hepática.
     - **Fármaco x Alimentos/Hábitos**: Interações com álcool, alimentos ricos em vitamina K, etc.
   - **Trava de Segurança Clínica**: Exigência obrigatória de parecer técnico justificado e registro de CRF para prosseguir em alertas contraindicados.

3. **🧠 Busca Dinâmica de Medicamentos via PLN (Processamento de Linguagem Natural)**
   - **Fuzzy Matching com Levenshtein**: Localiza fármacos mesmo com erros de digitação (`"iboprofeno"`, `"parasetamol"`, `"clonasepan"`).
   - **NER Clínico**: Identifica automaticamente dosagens (`500mg`, `1g`, `200mg/ml`) e formas farmacêuticas (`comprimido`, `gotas`, `xarope`).
   - **Mapeamento de Sintomas Leigos**: Converte queixas (`"dor de garganta"`, `"refluxo"`, `"pressão alta"`) diretamente nas classes terapêuticas apropriadas.

4. **📜 Declaração de Serviço Farmacêutico (Resoluções CFF 585/586)**
   - Geração com 1 clique de documentos clínicos oficiais contendo histórico da queixa, conduta não-farmacológica, posologia e dados do farmacêutico.
   - Exportação em PDF, impressão formatada e envio direto para o WhatsApp do paciente.

5. **📋 Prontuário Longitudinal Farmacoterapêutico**
   - Linha do tempo de atendimentos anteriores, fórmulas manipuladas, adesão ao tratamento e previsão de término de medicamentos contínuos.

6. **☁️ Sincronização em Nuvem (Turso LibSQL)**
   - Arquitetura offline-first com sincronização bidirecional atômica entre navegadores e banco de dados Turso na nuvem.

---

## 🚀 Como Executar

### 1. Instalação e Execução Local
```bash
# Instalar dependências
npm install

# Iniciar ambiente de desenvolvimento
npm run dev
```

### 2. Build de Produção
```bash
npm run build
```

---

## 🛠️ Stack Tecnológica

- **Frontend:** SPA Modular Vanilla JavaScript (ES Modules) · Vite 5 · jsPDF · Chart.js
- **Design System:** Frosted Glassmorphism autoral (Deep Teal, Emerald Jade, Ruby Crimson, Obsidian Slate)
- **Backend:** Node.js + Express API REST (Vercel Serverless Functions)
- **Banco de Dados:** Turso Cloud (LibSQL) + Local Storage / IndexedDB Offline-First
- **Conformidade Regulatória:** CFF 585/2013, CFF 586/2013, ANVISA RDC
