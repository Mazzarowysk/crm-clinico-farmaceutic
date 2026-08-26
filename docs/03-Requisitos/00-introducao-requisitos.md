# CRM Clínico Farmacêutico — Introdução aos Requisitos e Especificações de Módulos

Esta seção da documentação descreve os requisitos funcionais do **CRM Clínico Farmacêutico** de forma modular. O sistema é composto por 15 módulos clínicos, assistenciais, de apoio e administrativos.

## Estrutura da Especificação de Módulo

Para manter a consistência metodológica da documentação de engenharia de software, cada módulo é documentado sob a mesma estrutura de 10 seções fundamentais:

1.  **Objetivo**: O problema operacional ou clínico que o módulo resolve.
2.  **Fluxo de Processo (Workflow)**: Representação visual do fluxo de trabalho usando diagramas **Mermaid sequenceDiagram** ou **stateDiagram**.
3.  **Regras de Negócio**: Lista de diretrizes operacionais imperativas e comportamentos sistêmicos exigidos.
4.  **Banco de Dados (Schema)**: Modelagem de entidades, chaves estrangeiras e relacionamentos específicos do módulo.
5.  **APIs**: Relação de endpoints REST, métodos HTTP e payloads de requisição/resposta previstos.
6.  **Wireframes**: Representação estrutural (layout de tela) em formato de marcação ou caixa de texto para guiar o desenvolvimento do frontend.
7.  **Casos de Uso**: Especificações detalhadas com Atores, Pré-condições, Fluxo Principal e Fluxos Alternativos/Exceções.
8.  **Perfis e Permissões (RBAC)**: Matriz de permissões baseada nos papéis dos usuários do sistema.
9.  **Dicionário de Campos**: Relação de campos da interface (nome, tipo, tamanho, descrição).
10. **Validações**: Regras de validação de dados necessárias no frontend e no backend.

---

## Relação dos Módulos

Abaixo está o índice de especificação dos 15 módulos do CRM Clínico Farmacêutico:

1.  **[Módulo 01: Dashboard](./01-dashboard.md)**: Painéis de indicadores clínicos, adesão e faturamento.
2.  **[Módulo 02: Atendimento](./02-atendimento.md)**: Triagem clínica guiada SOAP e checagem de Red Flags.
3.  **[Módulo 03: Pacientes](./03-pacientes.md)**: Cadastro unificado de pacientes, comorbidades, alergias e PBMs.
4.  **[Módulo 04: Prontuário](./04-prontuario.md)**: Prontuário longitudinal farmacoterapêutico e linha do tempo.
5.  **[Módulo 05: Agenda](./05-agenda.md)**: Agendamento de consultas farmacêuticas, TLR e injetáveis.
6.  **[Módulo 08: Farmácia & CDSS 4D](./08-farmacia.md)**: Prescrição de MIPs, motor de interações 4D e vacinação.
7.  **[Módulo 10: Estoque](./10-estoque.md)**: Catálogo com código de barras (Câmera/USB), lotes e validades.
8.  **[Módulo 11: Financeiro](./11-financeiro.md)**: Fluxo de caixa com Abas Neon, botões + de categorias e DRE.
9.  **[Módulo 12: Convênios & PBMs](./12-convenios.md)**: Gestão de programas de benefícios em medicamentos e convênios.
10. **[Módulo 13: Relatórios & DSF](./13-relatorios.md)**: Emissão de Declaração de Serviço Farmacêutico (CFF 585/586) com Hash.
11. **[Módulo 14: Comunicação](./14-comunicacao.md)**: Envio de posologia via WhatsApp e Portal PWA do paciente.
12. **[Módulo 15: Configurações](./15-configuracoes.md)**: Central de governança em 7 Agrupamentos Estruturados e Turso Cloud.
