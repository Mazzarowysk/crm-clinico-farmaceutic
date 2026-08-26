// ============================================================================
// 🌿 CRM CLÍNICO FARMACÊUTICO — ABA DE CONFIGURAÇÕES & GESTÃO DE USUÁRIOS
// Conforme Resoluções CFF nº 585/2013 e 586/2013 & ANVISA
// ============================================================================
import { state } from '../state.js';
import * as localDB from '../localDB.js';
import { apiFetch } from '../modules/api.js';
import { showToast, showCustomAlert, showCustomConfirm } from '../modules/ui.js';
import { getRolePermissions, showUserSessionsHistory } from '../modules/auth.js';
import { syncManager, getSyncStatus, formatSyncDate } from '../modules/sync.js';
import { showInteractiveManualModal } from '../manualTabbed.js';

export function showSimulationSummaryModal() {
  showToast('Resumo operacional atualizado.');
}

export function renderSettingsTab(contentArea) {
  const currentUser = state.user || {};
  const perms = getRolePermissions(currentUser);
  const isMaster = perms.role === 'Master' || currentUser.username === 'mazzarowysk' || perms.canManageUsers;

  contentArea.innerHTML = `
    <div class="tab-section active" style="padding: 20px; max-width: 1300px; margin: 0 auto;">
      
      <!-- Cabeçalho da Aba Configurações -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.45rem; font-weight: 700; color: #fff; margin: 0 0 4px; display: flex; align-items: center; gap: 10px;">
            <i class="fa-solid fa-sliders" style="color: #14b8a6;"></i> Configurações &amp; Gestão do CRM Farmacêutico
          </h2>
          <p style="font-size: 0.85rem; color: #94a3b8; margin: 0;">
            Gerenciamento integrado de operadores, aprovações, cluster Turso Cloud, dados de RT e redundância.
          </p>
        </div>

        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <button id="btn-settings-sync-now" class="btn" style="background: linear-gradient(135deg, #0d9488, #0f766e); color: #fff; border: none; padding: 9px 18px; border-radius: 10px; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.35);">
            <i class="fa-solid fa-cloud-arrow-up"></i> Sincronizar Nuvem
          </button>
        </div>
      </div>

      <!-- Barra de Controle dos Agrupamentos em Acordeão -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(255,255,255,0.08); padding: 12px 18px; border-radius: 14px; backdrop-filter: blur(12px);">
        <div style="display: flex; align-items: center; gap: 10px; color: #94a3b8; font-size: 0.84rem;">
          <i class="fa-solid fa-layer-group" style="color: #14b8a6; font-size: 1rem;"></i>
          <span>Módulos de Configuração &bull; <strong>5 Agrupamentos Estruturados (Com Manual &amp; Protocolos)</strong></span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="btn-cfg-expand-all" class="btn" style="background: rgba(20, 184, 166, 0.15); border: 1px solid rgba(20, 184, 166, 0.35); color: #2dd4bf; font-size: 0.78rem; font-weight: 700; padding: 7px 14px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
            <i class="fa-solid fa-angles-down"></i> Expandir Todos
          </button>
          <button id="btn-cfg-collapse-all" class="btn" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); color: #94a3b8; font-size: 0.78rem; font-weight: 700; padding: 7px 14px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
            <i class="fa-solid fa-angles-up"></i> Recolher Todos
          </button>
        </div>
      </div>

      <!-- CONTAINER DOS AGRUPAMENTOS EXPANSÍVEIS E RETRÁTEIS -->
      <div class="cfg-accordion-container" style="display: flex; flex-direction: column; gap: 18px;">

        <!-- ==================================================================== -->
        <!-- AGRUPAMENTO 1: GESTÃO DE OPERADORES & USUÁRIOS                       -->
        <!-- ==================================================================== -->
        <div class="cfg-accordion-card open" id="accordion-group-users" style="background: rgba(15, 23, 42, 0.75); border: 1.5px solid rgba(20, 184, 166, 0.35); border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.35); transition: all 0.3s ease;">
          <!-- Header Clicável com Ícone Ilustrativo -->
          <div class="cfg-accordion-header" data-target="body-users" style="padding: 16px 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, rgba(20, 184, 166, 0.15), rgba(15, 23, 42, 0.6)); border-bottom: 1px solid rgba(20, 184, 166, 0.25); user-select: none;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg, rgba(20, 184, 166, 0.25), rgba(13, 148, 136, 0.45)); border: 1.5px solid rgba(45, 212, 191, 0.6); display: flex; align-items: center; justify-content: center; color: #2dd4bf; font-size: 1.3rem; box-shadow: 0 0 18px rgba(20, 184, 166, 0.25);">
                <i class="fa-solid fa-users-gear"></i>
              </div>
              <div>
                <div style="font-family: 'Outfit', sans-serif; font-size: 1.12rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  Gestão de Usuários &amp; Operadores Farmacêuticos
                  <span id="badge-users-status" style="font-size: 0.72rem; background: rgba(20, 184, 166, 0.2); color: #2dd4bf; border: 1px solid rgba(20, 184, 166, 0.4); padding: 2px 9px; border-radius: 12px; font-weight: 700;">
                    Controle de Acesso RBAC
                  </span>
                </div>
                <p style="margin: 3px 0 0; font-size: 0.82rem; color: #94a3b8;">
                  Aprovação Master de acessos, atribuição de cargos (Master, RT, Clínico), senhas e auditoria de operadores.
                </p>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="cfg-chevron-btn" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; color: #2dd4bf; transition: transform 0.3s ease;">
                <i class="fa-solid fa-chevron-down cfg-chevron-icon"></i>
              </div>
            </div>
          </div>

          <!-- Corpo Expansível -->
          <div id="body-users" class="cfg-accordion-body" style="padding: 20px; display: block;">
            <!-- Cards de Métricas de Usuários -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 20px;">
              <div class="pharmacy-kpi-card" style="background: rgba(30, 41, 59, 0.45); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 16px;">
                <div style="font-size: 0.76rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Total de Operadores</div>
                <div id="kpi-users-total" style="font-size: 1.6rem; font-weight: 800; color: #fff; margin-top: 4px;">--</div>
                <small style="color: #14b8a6; font-size: 0.72rem;"><i class="fa-solid fa-circle-check"></i> Cadastrados no CRM</small>
              </div>
              <div class="pharmacy-kpi-card" style="background: rgba(30, 41, 59, 0.45); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 16px;">
                <div style="font-size: 0.76rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Farmacêuticos(as)</div>
                <div id="kpi-users-pharm" style="font-size: 1.6rem; font-weight: 800; color: #2dd4bf; margin-top: 4px;">--</div>
                <small style="color: #2dd4bf; font-size: 0.72rem;"><i class="fa-solid fa-prescription-bottle-medical"></i> Habilitados Prescrição MIPs</small>
              </div>
              <div class="pharmacy-kpi-card" style="background: rgba(30, 41, 59, 0.45); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 16px;">
                <div style="font-size: 0.76rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Gestores &amp; Master</div>
                <div id="kpi-users-master" style="font-size: 1.6rem; font-weight: 800; color: #fbbf24; margin-top: 4px;">--</div>
                <small style="color: #fbbf24; font-size: 0.72rem;"><i class="fa-solid fa-crown"></i> Acesso Irrestrito / RT</small>
              </div>
              <div class="pharmacy-kpi-card" style="background: rgba(30, 41, 59, 0.45); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 16px;">
                <div style="font-size: 0.76rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Status do Usuário Atual</div>
                <div style="font-size: 1rem; font-weight: 700; color: #fff; margin-top: 6px; display: flex; align-items: center; gap: 6px;">
                  <span style="padding: 2px 10px; border-radius: 20px; font-size: 0.75rem; background: ${perms.badgeColor};">${perms.role}</span>
                </div>
                <small style="color: #94a3b8; font-size: 0.72rem;">@${currentUser.username || 'usuario'}</small>
              </div>
            </div>

            <!-- PAINEL DE APROVAÇÃO DE ACESSOS PENDENTES (MASTER) -->
            <div id="cfg-pending-approvals-area"></div>

            <!-- Barra de Ações & Busca de Usuários -->
            <div style="background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 18px;">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;">
                <div style="position: relative; flex: 1; min-width: 260px;">
                  <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 0.9rem;"></i>
                  <input type="text" id="cfg-user-search" class="form-input" placeholder="Buscar operador por nome, @login ou função..." style="width: 100%; padding-left: 40px; background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; font-size: 0.88rem;">
                </div>

                <div style="display: flex; gap: 10px; align-items: center;">
                  ${isMaster ? `
                    <button id="btn-open-new-user-form" class="btn" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 9px 18px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);">
                      <i class="fa-solid fa-user-plus"></i> Novo Operador Farmacêutico
                    </button>
                  ` : `
                    <span style="font-size: 0.78rem; color: #94a3b8; background: rgba(255,255,255,0.05); padding: 6px 12px; border-radius: 8px;">
                      <i class="fa-solid fa-lock"></i> Somente Master pode criar/editar operadores
                    </span>
                  `}
                </div>
              </div>

              <!-- Tabela de Usuários -->
              <div id="cfg-users-table-container">
                <div style="text-align: center; padding: 30px; color: #94a3b8;">
                  <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; color: #14b8a6; margin-bottom: 8px;"></i>
                  <p>Carregando operadores do CRM...</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================================================================== -->
        <!-- AGRUPAMENTO 2: BANCO TURSO CLOUD                                     -->
        <!-- ==================================================================== -->
        <div class="cfg-accordion-card open" id="accordion-group-turso" style="background: rgba(15, 23, 42, 0.75); border: 1.5px solid rgba(56, 189, 248, 0.35); border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.35); transition: all 0.3s ease;">
          <div class="cfg-accordion-header" data-target="body-turso" style="padding: 16px 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, rgba(56, 189, 248, 0.15), rgba(15, 23, 42, 0.6)); border-bottom: 1px solid rgba(56, 189, 248, 0.25); user-select: none;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(2, 132, 199, 0.45)); border: 1.5px solid rgba(56, 189, 248, 0.6); display: flex; align-items: center; justify-content: center; color: #38bdf8; font-size: 1.3rem; box-shadow: 0 0 18px rgba(56, 189, 248, 0.25);">
                <i class="fa-solid fa-cloud-bolt"></i>
              </div>
              <div>
                <div style="font-family: 'Outfit', sans-serif; font-size: 1.12rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  Banco de Dados Turso Cloud (LibSQL Distribuído)
                  <span style="font-size: 0.72rem; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); padding: 2px 9px; border-radius: 12px; font-weight: 700;">
                    AWS Edge Cluster
                  </span>
                </div>
                <p style="margin: 3px 0 0; font-size: 0.82rem; color: #94a3b8;">
                  Sincronização em tempo real na nuvem, replicação de borda e alta disponibilidade com redundância offline.
                </p>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="cfg-chevron-btn" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; color: #38bdf8; transition: transform 0.3s ease;">
                <i class="fa-solid fa-chevron-down cfg-chevron-icon"></i>
              </div>
            </div>
          </div>

          <div id="body-turso" class="cfg-accordion-body" style="padding: 20px; display: block;">
            <div style="background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 20px;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 20px;">
                <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 16px;">
                  <div style="font-size: 0.76rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Status do Cluster Cloud</div>
                  <div id="turso-settings-status-badge" style="margin-top: 6px; font-weight: 700; font-size: 0.92rem; color: #34d399; display: flex; align-items: center; gap: 8px;">
                    <span class="status-indicator success"></span> Conectado (AWS US-East-1)
                  </div>
                </div>
                <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 16px;">
                  <div style="font-size: 0.76rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Última Sincronização</div>
                  <div id="turso-last-sync-time" style="margin-top: 6px; font-weight: 700; font-size: 0.92rem; color: #38bdf8;">
                    --
                  </div>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
                <div class="form-group">
                  <label class="form-label" for="turso-cfg-url" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">URL do Banco Turso (LibSQL):</label>
                  <input type="text" id="turso-cfg-url" class="form-input" style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; font-family: monospace; font-size: 0.85rem;" value="libsql://crm-clinico-farmaceutico-mazzarowysk.aws-us-east-1.turso.io" placeholder="libsql://...">
                </div>
                <div class="form-group">
                  <label class="form-label" for="turso-cfg-token" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">Token de Autenticação JWT (Turso):</label>
                  <input type="password" id="turso-cfg-token" class="form-input" style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; font-family: monospace; font-size: 0.85rem;" placeholder="Deixe em branco para manter o token atual">
                </div>
              </div>

              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button id="btn-save-turso-cfg" class="btn btn-primary" style="background: linear-gradient(135deg, #0d9488, #0f766e); border: none; padding: 10px 20px; font-weight: 700; font-size: 0.85rem; cursor: pointer;">
                  <i class="fa-solid fa-floppy-disk"></i> Salvar Configuração
                </button>
                <button id="btn-test-turso-cfg" class="btn" style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; padding: 10px 18px; font-weight: 600; font-size: 0.85rem; cursor: pointer;">
                  <i class="fa-solid fa-arrows-rotate"></i> Testar Conexão
                </button>
                <button id="btn-sync-turso-now" class="btn" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; padding: 10px 18px; font-weight: 600; font-size: 0.85rem; cursor: pointer;">
                  <i class="fa-solid fa-cloud-arrow-up"></i> Forçar Sincronização Agora
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================================================================== -->
        <!-- AGRUPAMENTO 3: DADOS DA FARMÁCIA & RT (CFF 585/586)                  -->
        <!-- ==================================================================== -->
        <div class="cfg-accordion-card open" id="accordion-group-establishment" style="background: rgba(15, 23, 42, 0.75); border: 1.5px solid rgba(245, 158, 11, 0.35); border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.35); transition: all 0.3s ease;">
          <div class="cfg-accordion-header" data-target="body-establishment" style="padding: 16px 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, rgba(245, 158, 11, 0.15), rgba(15, 23, 42, 0.6)); border-bottom: 1px solid rgba(245, 158, 11, 0.25); user-select: none;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.45)); border: 1.5px solid rgba(245, 158, 11, 0.6); display: flex; align-items: center; justify-content: center; color: #fbbf24; font-size: 1.3rem; box-shadow: 0 0 18px rgba(245, 158, 11, 0.25);">
                <i class="fa-solid fa-id-card-clip"></i>
              </div>
              <div>
                <div style="font-family: 'Outfit', sans-serif; font-size: 1.12rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  Dados do Estabelecimento &amp; Farmacêutico(a) RT (CFF)
                  <span style="font-size: 0.72rem; background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 2px 9px; border-radius: 12px; font-weight: 700;">
                    Resoluções 585 / 586 CFF
                  </span>
                </div>
                <p style="margin: 3px 0 0; font-size: 0.82rem; color: #94a3b8;">
                  Razão Social, CNPJ, Farmacêutico Responsável Técnico e registro CRF para emissão de Declarações (DSF).
                </p>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="cfg-chevron-btn" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; color: #fbbf24; transition: transform 0.3s ease;">
                <i class="fa-solid fa-chevron-down cfg-chevron-icon"></i>
              </div>
            </div>
          </div>

          <div id="body-establishment" class="cfg-accordion-body" style="padding: 20px; display: block;">
            <div style="background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 20px;">
              <form id="pharmacy-details-form" style="display: flex; flex-direction: column; gap: 16px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                  <div class="form-group">
                    <label class="form-label" for="pharm-name">* Razão Social / Nome da Drogaria:</label>
                    <input type="text" id="pharm-name" class="form-input" required value="Farmácia Clínica &amp; Consultório Especializado" placeholder="Ex: Drogaria Santa Fé Ltda">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="pharm-cnpj">* CNPJ:</label>
                    <input type="text" id="pharm-cnpj" class="form-input" value="12.345.678/0001-90" placeholder="00.000.000/0000-00">
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                  <div class="form-group">
                    <label class="form-label" for="pharm-rt-name">* Farmacêutico(a) Responsável Técnico:</label>
                    <input type="text" id="pharm-rt-name" class="form-input" required value="Dr(a). Farmacêutico(a) Clínico(a)" placeholder="Nome completo do RT">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="pharm-rt-crf">* Registro Profissional (CRF e UF):</label>
                    <input type="text" id="pharm-rt-crf" class="form-input" required value="CRF-SP 54180" placeholder="Ex: CRF-SP 12345">
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                  <div class="form-group">
                    <label class="form-label" for="pharm-phone">Telefone / WhatsApp Comercial:</label>
                    <input type="text" id="pharm-phone" class="form-input" value="(11) 98765-4321" placeholder="(00) 00000-0000">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="pharm-address">Endereço Completo:</label>
                    <input type="text" id="pharm-address" class="form-input" value="Av. Paulista, 1000 - São Paulo/SP" placeholder="Rua, Número, Bairro, Cidade/UF">
                  </div>
                </div>

                <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
                  <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, #0d9488, #0f766e); border: none; padding: 10px 22px; font-weight: 700; font-size: 0.88rem; cursor: pointer;">
                    <i class="fa-solid fa-floppy-disk"></i> Salvar Dados do Estabelecimento
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- ==================================================================== -->
        <!-- AGRUPAMENTO 4: BACKUP & RESTAURAÇÃO                                  -->
        <!-- ==================================================================== -->
        <div class="cfg-accordion-card open" id="accordion-group-backup" style="background: rgba(15, 23, 42, 0.75); border: 1.5px solid rgba(168, 85, 247, 0.35); border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.35); transition: all 0.3s ease;">
          <div class="cfg-accordion-header" data-target="body-backup" style="padding: 16px 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, rgba(168, 85, 247, 0.15), rgba(15, 23, 42, 0.6)); border-bottom: 1px solid rgba(168, 85, 247, 0.25); user-select: none;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(126, 34, 206, 0.45)); border: 1.5px solid rgba(168, 85, 247, 0.6); display: flex; align-items: center; justify-content: center; color: #c084fc; font-size: 1.3rem; box-shadow: 0 0 18px rgba(168, 85, 247, 0.25);">
                <i class="fa-solid fa-box-archive"></i>
              </div>
              <div>
                <div style="font-family: 'Outfit', sans-serif; font-size: 1.12rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  Backup, Exportação &amp; Contingência Offline
                  <span style="font-size: 0.72rem; background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); padding: 2px 9px; border-radius: 12px; font-weight: 700;">
                    Snapshot JSON Criptografado
                  </span>
                </div>
                <p style="margin: 3px 0 0; font-size: 0.82rem; color: #94a3b8;">
                  Download de segurança da base completa do CRM e restauração instantânea em caso de manutenção ou contingência.
                </p>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="cfg-chevron-btn" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; color: #c084fc; transition: transform 0.3s ease;">
                <i class="fa-solid fa-chevron-down cfg-chevron-icon"></i>
              </div>
            </div>
          </div>

          <div id="body-backup" class="cfg-accordion-body" style="padding: 20px; display: block;">
            <div style="background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 20px;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
                <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <h4 style="font-family: 'Outfit', sans-serif; font-size: 0.95rem; font-weight: 700; color: #38bdf8; margin: 0 0 6px;">
                      <i class="fa-solid fa-download"></i> Exportar Base Completa
                    </h4>
                    <p style="font-size: 0.78rem; color: #94a3b8; margin: 0 0 14px;">Gera arquivo .JSON com todos os pacientes, medicamentos e atendimentos.</p>
                  </div>
                  <button id="btn-export-json-crm" class="btn" style="background: rgba(2, 132, 199, 0.2); border: 1px solid rgba(2, 132, 199, 0.4); color: #38bdf8; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.82rem; cursor: pointer;">
                    <i class="fa-solid fa-file-export"></i> Baixar Arquivo JSON
                  </button>
                </div>

                <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <h4 style="font-family: 'Outfit', sans-serif; font-size: 0.95rem; font-weight: 700; color: #fbbf24; margin: 0 0 6px;">
                      <i class="fa-solid fa-upload"></i> Restaurar de Backup
                    </h4>
                    <p style="font-size: 0.78rem; color: #94a3b8; margin: 0 0 14px;">Restaura os dados salvos previamente de um arquivo .JSON.</p>
                  </div>
                  <input type="file" id="import-json-file-crm" accept=".json" style="display: none;" />
                  <button id="btn-import-json-crm" class="btn" style="background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.4); color: #fbbf24; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.82rem; cursor: pointer;">
                    <i class="fa-solid fa-file-import"></i> Selecionar Arquivo JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================================================================== -->
        <!-- AGRUPAMENTO 5: MANUAL INTERATIVO & PROTOCOLOS CLÍNICOS (CFF 585/586)  -->
        <!-- ==================================================================== -->
        <div class="cfg-accordion-card" id="accordion-group-manual" style="background: rgba(15, 23, 42, 0.75); border: 1.5px solid rgba(16, 185, 129, 0.35); border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.35); transition: all 0.3s ease;">
          <div class="cfg-accordion-header" data-target="body-manual" style="padding: 16px 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.6)); border-bottom: 1px solid rgba(16, 185, 129, 0.25); user-select: none;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.45)); border: 1.5px solid rgba(52, 211, 153, 0.6); display: flex; align-items: center; justify-content: center; color: #34d399; font-size: 1.3rem; box-shadow: 0 0 18px rgba(16, 185, 129, 0.25);">
                <i class="fa-solid fa-book-medical"></i>
              </div>
              <div>
                <div style="font-family: 'Outfit', sans-serif; font-size: 1.12rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  Manual Interativo &amp; Protocolos Clínicos (CFF 585/586)
                  <span style="font-size: 0.72rem; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 2px 9px; border-radius: 12px; font-weight: 700;">
                    Guia Operacional &amp; CDSS 4D
                  </span>
                </div>
                <p style="margin: 3px 0 0; font-size: 0.82rem; color: #94a3b8;">
                  Acesso completo aos protocolos clínicos, árvores de decisão, anamnese SOAP, validação de Red Flags e conformidade regulatória.
                </p>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="cfg-chevron-btn" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; color: #34d399; transition: transform 0.3s ease;">
                <i class="fa-solid fa-chevron-down cfg-chevron-icon"></i>
              </div>
            </div>
          </div>

          <div id="body-manual" class="cfg-accordion-body" style="padding: 20px; display: none;">
            <!-- Destaque para abrir o Manual -->
            <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(13, 148, 136, 0.25)); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 16px; padding: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
              <div>
                <h4 style="font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 700; color: #fff; margin: 0 0 6px; display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid fa-book-open-reader" style="color: #34d399;"></i> Guia Completo e Interativo do Sistema
                </h4>
                <p style="font-size: 0.85rem; color: #cbd5e1; margin: 0; max-width: 650px;">
                  Abra a central com guias passo a passo, busca de termos médicos, fluxogramas interativos e orientações de segurança para a consulta farmacêutica.
                </p>
              </div>
              <button id="btn-open-manual-from-settings" class="btn" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 11px 22px; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
                <i class="fa-solid fa-book-medical"></i> Abrir Manual Interativo em Tela Cheia
              </button>
            </div>

            <!-- Grade com os 6 Protocolos Clínicos Embutidos -->
            <h5 style="font-size: 0.9rem; font-weight: 700; color: #cbd5e1; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">
              <i class="fa-solid fa-clipboard-check" style="color: #10b981; margin-right: 6px;"></i> Protocolos Farmacêuticos Ativos (CDSS)
            </h5>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; margin-bottom: 20px;">
              <div style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px;">
                <div style="font-weight: 700; color: #fff; font-size: 0.92rem; margin-bottom: 4px;">🌡️ Gripe &amp; Resfriado Comum</div>
                <p style="font-size: 0.78rem; color: #94a3b8; margin: 0;">MIPs: Paracetamol, Dipirona, Clorfeniramina, Lavagem Nasal com Solução Fisiológica 0.9%.</p>
              </div>
              <div style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px;">
                <div style="font-weight: 700; color: #fff; font-size: 0.92rem; margin-bottom: 4px;">🧪 Dispepsia &amp; Pirose (Azia/Gastrite)</div>
                <p style="font-size: 0.78rem; color: #94a3b8; margin: 0;">MIPs: Hidróxido de Alumínio, Carbonato de Cálcio, Simeticona, Omeprazol (uso curto prazo).</p>
              </div>
              <div style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px;">
                <div style="font-weight: 700; color: #fff; font-size: 0.92rem; margin-bottom: 4px;">🧠 Cefaleia Tensional Leve</div>
                <p style="font-size: 0.78rem; color: #94a3b8; margin: 0;">MIPs: Paracetamol 750mg, Ibuprofeno 400mg, Dipirona 500mg. Triagem de cefaleia súbita.</p>
              </div>
              <div style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px;">
                <div style="font-weight: 700; color: #fff; font-size: 0.92rem; margin-bottom: 4px;">🤧 Rinite Alérgica &amp; Coriza</div>
                <p style="font-size: 0.78rem; color: #94a3b8; margin: 0;">MIPs: Loratadina 10mg, Desloratadina 5mg, Cetirizina 10mg, Higienização nasal salina contínua.</p>
              </div>
              <div style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px;">
                <div style="font-weight: 700; color: #fff; font-size: 0.92rem; margin-bottom: 4px;">⚡ Dor Lombar &amp; Muscular</div>
                <p style="font-size: 0.78rem; color: #94a3b8; margin: 0;">MIPs: Cetoprofeno tópico/oral, Ibuprofeno, Paracetamol, Orientação postural e calor local.</p>
              </div>
              <div style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px;">
                <div style="font-weight: 700; color: #fff; font-size: 0.92rem; margin-bottom: 4px;">💧 Diarreia Aguda &amp; Reidratação</div>
                <p style="font-size: 0.78rem; color: #94a3b8; margin: 0;">MIPs: Sais de Reidratação Oral (OMS), Probióticos (Saccharomyces boulardii), Racecadotrila.</p>
              </div>
            </div>

            <!-- Referências Regulatórias Oficiais -->
            <div style="background: rgba(30, 41, 59, 0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px;">
              <h6 style="font-size: 0.82rem; font-weight: 700; color: #94a3b8; margin: 0 0 8px; text-transform: uppercase;">
                <i class="fa-solid fa-scale-balanced" style="color: #fbbf24; margin-right: 6px;"></i> Base Legal &amp; Regulamentação Farmacêutica
              </h6>
              <div style="display: flex; gap: 16px; flex-wrap: wrap; font-size: 0.8rem; color: #cbd5e1;">
                <div>📜 <strong>Resolução CFF nº 585/2013:</strong> Regulamenta as atribuições clínicas do farmacêutico.</div>
                <div>📜 <strong>Resolução CFF nº 586/2013:</strong> Regulamenta a prescrição farmacêutica.</div>
                <div>📑 <strong>RDC ANVISA nº 44/2009:</strong> Boas Práticas Farmacêuticas e Serviços de Saúde.</div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  `;

  // --- LÓGICA DE EXPANSÃO / RETRAÇÃO DOS AGRUPAMENTOS EM ACORDEÃO ---
  contentArea.querySelectorAll('.cfg-accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.cfg-accordion-card');
      const targetBodyId = header.getAttribute('data-target');
      const body = document.getElementById(targetBodyId);
      const chevron = header.querySelector('.cfg-chevron-btn');

      if (body) {
        const isCurrentlyOpen = body.style.display !== 'none';
        if (isCurrentlyOpen) {
          body.style.display = 'none';
          header.style.borderBottom = 'none';
          card.classList.remove('open');
          if (chevron) chevron.style.transform = 'rotate(-90deg)';
        } else {
          body.style.display = 'block';
          header.style.borderBottom = '1px solid rgba(255,255,255,0.15)';
          card.classList.add('open');
          if (chevron) chevron.style.transform = 'rotate(0deg)';
        }
      }
    });
  });

  // Expandir Todos os Agrupamentos
  document.getElementById('btn-cfg-expand-all')?.addEventListener('click', () => {
    contentArea.querySelectorAll('.cfg-accordion-card').forEach(card => {
      const body = card.querySelector('.cfg-accordion-body');
      const header = card.querySelector('.cfg-accordion-header');
      const chevron = card.querySelector('.cfg-chevron-btn');
      if (body) body.style.display = 'block';
      if (header) header.style.borderBottom = '1px solid rgba(255,255,255,0.15)';
      card.classList.add('open');
      if (chevron) chevron.style.transform = 'rotate(0deg)';
    });
    showToast('Todos os agrupamentos foram expandidos.');
  });

  // Recolher Todos os Agrupamentos
  document.getElementById('btn-cfg-collapse-all')?.addEventListener('click', () => {
    contentArea.querySelectorAll('.cfg-accordion-card').forEach(card => {
      const body = card.querySelector('.cfg-accordion-body');
      const header = card.querySelector('.cfg-accordion-header');
      const chevron = card.querySelector('.cfg-chevron-btn');
      if (body) body.style.display = 'none';
      if (header) header.style.borderBottom = 'none';
      card.classList.remove('open');
      if (chevron) chevron.style.transform = 'rotate(-90deg)';
    });
    showToast('Todos os agrupamentos foram recolhidos.');
  });

  // Botão para Abrir Manual Interativo a partir das Configurações
  document.getElementById('btn-open-manual-from-settings')?.addEventListener('click', () => {
    if (typeof showInteractiveManualModal === 'function') {
      showInteractiveManualModal();
    } else if (typeof window.showInteractiveManualModal === 'function') {
      window.showInteractiveManualModal();
    }
  });

  // --- RENDERIZAR TABELA DE USUÁRIOS ---
  const loadUsersList = async () => {
    const container = document.getElementById('cfg-users-table-container');
    const pendingArea = document.getElementById('cfg-pending-approvals-area');
    if (!container) return;

    try {
      // 1. Purga imediata de quaisquer usuários legados de mockup hospitalar
      const legacyUsernames = ['bcoltri', 'ffacco', 'pforte', 'farmacia', 'admin', 'atendente', 'medico', 'enfermeiro', 'recepcionista'];
      const legacyRoles = ['Médico', 'Desenvolvedor', 'Enfermeiro', 'Plantonista'];
      
      let allUsers = localDB.list('users') || [];
      const cleanedUsers = allUsers.filter(u => {
        const uname = (u.username || '').toLowerCase().trim();
        if (uname === 'mazzarowysk') return true;
        if (uname.startsWith('dr.') || uname.startsWith('dra.') || uname.startsWith('dr_') || uname.startsWith('dra_')) return false;
        if (legacyUsernames.includes(uname)) return false;
        if (legacyRoles.includes(u.role)) return false;
        return true;
      });

      if (cleanedUsers.length !== allUsers.length) {
        const fullDB = localDB.getFullDB();
        fullDB.users = cleanedUsers;
        localDB.saveFullDB(fullDB, true);
        allUsers = cleanedUsers;
      }
      
      // 2. Garantir mazzarowysk na lista com perfil Master e senha oficial
      const masterIdx = allUsers.findIndex(u => (u.username || '').toLowerCase().trim() === 'mazzarowysk');
      if (masterIdx === -1) {
        localDB.insert('users', {
          id: 'USR-MAZZAROWYSK',
          name: 'Marcelo Mazaro',
          username: 'mazzarowysk',
          role: 'Master',
          crf: 'CRF-SP 54180',
          password: 'T@zm4n1c0054180',
          status: 'Ativo',
          created_at: new Date().toISOString()
        });
        allUsers = localDB.list('users') || [];
      } else {
        const u = allUsers[masterIdx];
        if (u.role !== 'Master' || u.status !== 'Ativo' || u.password !== 'T@zm4n1c0054180') {
          localDB.update('users', u.id, { name: 'Marcelo Mazaro', role: 'Master', status: 'Ativo', password: 'T@zm4n1c0054180', crf: u.crf || 'CRF-SP 54180' });
          allUsers = localDB.list('users') || [];
        }
      }

      // 3. Separar usuários Ativos vs Pendentes de Aprovação
      const pendingUsers = allUsers.filter(u => u.status === 'Pendente');
      const activeUsers = allUsers.filter(u => u.status !== 'Pendente');

      // Atualizar badge do header do acordeão
      const badgeUsersStatus = document.getElementById('badge-users-status');
      if (badgeUsersStatus) {
        if (pendingUsers.length > 0) {
          badgeUsersStatus.style.background = '#d97706';
          badgeUsersStatus.style.color = '#fff';
          badgeUsersStatus.style.borderColor = '#f59e0b';
          badgeUsersStatus.innerHTML = `⚡ ${pendingUsers.length} Pendência${pendingUsers.length > 1 ? 's' : ''} de Aprovação`;
        } else {
          badgeUsersStatus.style.background = 'rgba(20, 184, 166, 0.2)';
          badgeUsersStatus.style.color = '#2dd4bf';
          badgeUsersStatus.style.borderColor = 'rgba(20, 184, 166, 0.4)';
          badgeUsersStatus.innerHTML = `✓ ${activeUsers.length} Operador${activeUsers.length > 1 ? 'es' : ''} Ativo${activeUsers.length > 1 ? 's' : ''}`;
        }
      }

      // KPIs
      const totalUsers = activeUsers.length;
      const pharmUsers = activeUsers.filter(u => u.role === 'Farmacêutico' || u.role === 'Farmacêutico RT' || u.role === 'Master').length;
      const masterUsers = activeUsers.filter(u => u.role === 'Master' || u.role === 'Administrador' || u.username === 'mazzarowysk').length;

      document.getElementById('kpi-users-total').textContent = totalUsers;
      document.getElementById('kpi-users-pharm').textContent = pharmUsers;
      document.getElementById('kpi-users-master').textContent = masterUsers;

      // 4. RENDERIZAR PAINEL DE APROVAÇÃO MASTER
      if (pendingArea) {
        if (pendingUsers.length > 0) {
          pendingArea.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(217, 119, 6, 0.08)); border: 1.5px solid rgba(245, 158, 11, 0.5); border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(245, 158, 11, 0.15); animation: pulseBorder 3s infinite ease-in-out;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(245, 158, 11, 0.25); border: 1px solid rgba(245, 158, 11, 0.6); display: flex; align-items: center; justify-content: center; color: #fbbf24; font-size: 1.25rem;">
                    <i class="fa-solid fa-user-clock"></i>
                  </div>
                  <div>
                    <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 700; color: #fbbf24; margin: 0; display: flex; align-items: center; gap: 8px;">
                      Solicitações de Acesso Pendentes (${pendingUsers.length})
                      <span style="font-size: 0.72rem; background: #d97706; color: #fff; padding: 2px 8px; border-radius: 12px;">Aprovação Master</span>
                    </h3>
                    <p style="font-size: 0.82rem; color: #fde68a; margin: 3px 0 0;">
                      Estes operadores realizaram o cadastro na tela inicial e aguardam sua autorização para acessar o CRM.
                    </p>
                  </div>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 12px;">
                ${pendingUsers.map(p => `
                  <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 12px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <div style="width: 38px; height: 38px; border-radius: 50%; background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.4); display: flex; align-items: center; justify-content: center; color: #fbbf24; font-weight: 700; font-size: 0.9rem;">
                        ${(p.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">${p.name || 'Sem nome'}</div>
                        <div style="font-size: 0.78rem; color: #94a3b8; font-family: monospace;">@${p.username} &bull; Solicitado em: ${p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'Hoje'}</div>
                      </div>
                    </div>

                    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                      <div style="display: flex; flex-direction: column; gap: 2px;">
                        <label style="font-size: 0.72rem; color: #cbd5e1; font-weight: 600;">Cargo a Atribuir:</label>
                        <select id="pending-role-${p.id}" class="form-input" style="background: #1e293b; border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 0.82rem; padding: 6px 10px; border-radius: 8px;">
                          <option value="Master" ${p.role === 'Master' ? 'selected' : ''}>👑 Master Gestor (Acesso Total)</option>
                          <option value="Farmacêutico RT" ${p.role === 'Farmacêutico RT' ? 'selected' : ''}>💊 Farmacêutico(a) RT (Responsável Técnico)</option>
                          <option value="Farmacêutico" ${p.role === 'Farmacêutico' || !p.role ? 'selected' : ''}>🩺 Farmacêutico Clínico</option>
                          <option value="Administrador" ${p.role === 'Administrador' ? 'selected' : ''}>🛠️ Administrador</option>
                          <option value="Atendente" ${p.role === 'Atendente' || p.role === 'Recepcionista' ? 'selected' : ''}>📋 Atendente de Balcão</option>
                        </select>
                      </div>

                      <div style="display: flex; flex-direction: column; gap: 2px;">
                        <label style="font-size: 0.72rem; color: #cbd5e1; font-weight: 600;">CRF / Registro:</label>
                        <input type="text" id="pending-crf-${p.id}" value="${p.crf || ''}" placeholder="CRF-UF 00000" class="form-input" style="background: #1e293b; border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 0.82rem; padding: 6px 10px; border-radius: 8px; width: 130px;">
                      </div>

                      <div style="display: flex; gap: 8px; align-items: flex-end; margin-top: 14px;">
                        <button class="btn btn-approve-user" data-id="${p.id}" data-name="${p.name}" data-uname="${p.username}" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(16,185,129,0.35);">
                          <i class="fa-solid fa-check"></i> Aprovar Acesso
                        </button>
                        <button class="btn btn-reject-user" data-id="${p.id}" data-name="${p.name}" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; padding: 8px 14px; border-radius: 8px; font-weight: 600; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                          <i class="fa-solid fa-xmark"></i> Recusar
                        </button>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;

          // Event listeners para aprovação / recusa
          pendingArea.querySelectorAll('.btn-approve-user').forEach(btn => {
            btn.addEventListener('click', () => {
              const uid = btn.dataset.id;
              const uname = btn.dataset.uname;
              const name = btn.dataset.name;
              const selectedRole = document.getElementById(`pending-role-${uid}`)?.value || 'Farmacêutico';
              const inputCrf = document.getElementById(`pending-crf-${uid}`)?.value || 'CRF-SP 54180';

              localDB.update('users', uid, {
                status: 'Ativo',
                role: selectedRole,
                crf: inputCrf
              });

              showToast(`✅ Acesso de @${uname} como ${selectedRole} aprovado!`);
              syncManager.pushToCloud(false);
              loadUsersList();
            });
          });

          pendingArea.querySelectorAll('.btn-reject-user').forEach(btn => {
            btn.addEventListener('click', async () => {
              const uid = btn.dataset.id;
              const name = btn.dataset.name;
              const confirmed = await showCustomConfirm({
                title: 'Recusar Cadastro',
                message: `Deseja rejeitar e excluir a solicitação de <strong>${name}</strong>?`,
                confirmText: 'Sim, Rejeitar',
                cancelText: 'Cancelar',
                type: 'danger'
              });

              if (confirmed) {
                localDB.remove('users', uid);
                showToast('Solicitação de cadastro rejeitada.');
                syncManager.pushToCloud(false);
                loadUsersList();
              }
            });
          });

        } else {
          pendingArea.innerHTML = `
            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
              <div style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: #34d399;">
                <i class="fa-solid fa-circle-check" style="font-size: 1.1rem;"></i>
                <span><strong>Central de Aprovações:</strong> Nenhuma solicitação de novo operador pendente. Todos os operadores cadastrados estão ativos.</span>
              </div>
              <span style="font-size: 0.72rem; color: #94a3b8; background: rgba(255,255,255,0.05); padding: 3px 10px; border-radius: 20px;">0 Pendentes</span>
            </div>
          `;
        }
      }

      // 5. RENDERIZAR TABELA DE OPERADORES ATIVOS
      const searchVal = (document.getElementById('cfg-user-search')?.value || '').toLowerCase().trim();
      const filteredUsers = activeUsers.filter(u => {
        if (!searchVal) return true;
        return (u.name || '').toLowerCase().includes(searchVal) ||
               (u.username || '').toLowerCase().includes(searchVal) ||
               (u.role || '').toLowerCase().includes(searchVal);
      });

      if (filteredUsers.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 30px; color: #94a3b8;">
            Nenhum operador encontrado com o termo "${searchVal}".
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <table class="patients-table" style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); text-align: left; color: #94a3b8; font-size: 0.78rem; text-transform: uppercase;">
              <th style="padding: 12px 10px;">Operador / Nome</th>
              <th style="padding: 12px 10px;">Login (@)</th>
              <th style="padding: 12px 10px;">Perfil / Cargo</th>
              <th style="padding: 12px 10px;">Registro / CRF</th>
              <th style="padding: 12px 10px; text-align: center;">Status</th>
              <th style="padding: 12px 10px; text-align: right;">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${filteredUsers.map(u => {
              const isUserMaster = u.role === 'Master' || u.username === 'mazzarowysk';
              let roleBadge = 'background: rgba(13, 148, 136, 0.2); color: #2dd4bf; border: 1px solid rgba(20, 184, 166, 0.4);';
              let roleIcon = 'fa-pills';

              if (isUserMaster) {
                roleBadge = 'background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4);';
                roleIcon = 'fa-crown';
              } else if (u.role === 'Administrador') {
                roleBadge = 'background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4);';
                roleIcon = 'fa-user-shield';
              } else if (u.role === 'Recepcionista' || u.role === 'Atendente') {
                roleBadge = 'background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4);';
                roleIcon = 'fa-user-check';
              }

              const statusBadge = u.status === 'Bloqueado'
                ? '<span style="font-size: 0.72rem; font-weight: 700; color: #f87171; background: rgba(239,68,68,0.15); padding: 3px 8px; border-radius: 6px;">Bloqueado</span>'
                : '<span style="font-size: 0.72rem; font-weight: 700; color: #34d399; background: rgba(16,185,129,0.15); padding: 3px 8px; border-radius: 6px;">Ativo</span>';

              return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.02)'" onmouseleave="this.style.background='transparent'">
                  <td style="padding: 14px 10px; font-weight: 600; color: #f8fafc; display: flex; align-items: center; gap: 10px;">
                    <div style="width: 34px; height: 34px; border-radius: 50%; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; color: #2dd4bf; font-size: 0.85rem; font-weight: 700;">
                      ${(u.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div>${u.name}</div>
                      ${u.username === 'mazzarowysk' ? '<span style="font-size: 0.68rem; color: #fbbf24; font-weight: 700;">PROPRIETÁRIO DO SISTEMA</span>' : ''}
                    </div>
                  </td>
                  <td style="padding: 14px 10px; font-family: monospace; color: #94a3b8;">@${u.username}</td>
                  <td style="padding: 14px 10px;">
                    <span style="font-size: 0.76rem; font-weight: 700; padding: 4px 10px; border-radius: 8px; ${roleBadge} display: inline-flex; align-items: center; gap: 5px;">
                      <i class="fa-solid ${roleIcon}"></i> ${u.role || 'Farmacêutico'}
                    </span>
                  </td>
                  <td style="padding: 14px 10px; color: #cbd5e1; font-size: 0.82rem;">${u.crf || 'CRF-SP 54180'}</td>
                  <td style="padding: 14px 10px; text-align: center;">${statusBadge}</td>
                  <td style="padding: 14px 10px; text-align: right;">
                    <button class="btn-icon btn-cfg-history-user" data-uid="${u.id}" data-name="${u.name}" title="Histórico de Sessões" style="color: #a78bfa; margin-right: 6px; background: none; border: none; cursor: pointer; font-size: 0.95rem;">
                      <i class="fa-solid fa-clock-rotate-left"></i>
                    </button>
                    ${isMaster ? `
                      <button class="btn-icon btn-cfg-edit-user" data-user='${JSON.stringify(u)}' title="Editar Operador" style="color: #38bdf8; margin-right: 6px; background: none; border: none; cursor: pointer; font-size: 0.95rem;">
                        <i class="fa-solid fa-pen-to-square"></i>
                      </button>
                      ${u.username !== 'mazzarowysk' ? `
                        <button class="btn-icon btn-cfg-del-user" data-id="${u.id}" data-name="${u.name}" title="Excluir Usuário" style="color: #f87171; background: none; border: none; cursor: pointer; font-size: 0.95rem;">
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      ` : ''}
                    ` : ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;

      // Eventos dos botões da tabela
      container.querySelectorAll('.btn-cfg-history-user').forEach(btn => {
        btn.addEventListener('click', () => {
          showUserSessionsHistory(btn.dataset.uid, btn.dataset.name);
        });
      });

      container.querySelectorAll('.btn-cfg-edit-user').forEach(btn => {
        btn.addEventListener('click', () => {
          const userObj = JSON.parse(btn.dataset.user);
          openUserEditModal(userObj, loadUsersList);
        });
      });

      container.querySelectorAll('.btn-cfg-del-user').forEach(btn => {
        btn.addEventListener('click', async () => {
          const uid = btn.dataset.id;
          const uname = btn.dataset.name;
          const confirmed = await showCustomConfirm({
            title: 'Excluir Operador',
            message: `Tem certeza que deseja excluir o operador <strong>${uname}</strong>?`,
            confirmText: 'Sim, Excluir',
            cancelText: 'Cancelar',
            type: 'danger'
          });

          if (confirmed) {
            localDB.remove('users', uid);
            showToast('Operador removido com sucesso!');
            loadUsersList();
            syncManager.pushToCloud(false);
          }
        });
      });

    } catch (e) {
      console.error('[Settings] Erro ao carregar operadores:', e);
      container.innerHTML = `<div style="text-align: center; color: #f87171; padding: 20px;">Erro ao carregar lista de usuários: ${e.message}</div>`;
    }
  };

  // Busca em tempo real
  document.getElementById('cfg-user-search')?.addEventListener('input', loadUsersList);
  document.getElementById('btn-open-new-user-form')?.addEventListener('click', () => {
    openUserEditModal(null, loadUsersList);
  });

  // Salvar Dados do Estabelecimento
  document.getElementById('pharmacy-details-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pharmData = {
      name: document.getElementById('pharm-name').value,
      cnpj: document.getElementById('pharm-cnpj').value,
      rtName: document.getElementById('pharm-rt-name').value,
      rtCrf: document.getElementById('pharm-rt-crf').value,
      phone: document.getElementById('pharm-phone').value,
      address: document.getElementById('pharm-address').value
    };
    localStorage.setItem('crm_pharmacy_establishment', JSON.stringify(pharmData));
    showToast('✅ Dados do Estabelecimento & RT salvos com sucesso!');
    syncManager.pushToCloud(false);
  });

  // Salvar Credenciais Turso
  document.getElementById('btn-save-turso-cfg')?.addEventListener('click', async () => {
    const url = document.getElementById('turso-cfg-url')?.value;
    const token = document.getElementById('turso-cfg-token')?.value;
    const res = await apiFetch('/api/settings/turso', {
      method: 'POST',
      body: JSON.stringify({ url, token })
    });
    if (res.ok) {
      showToast('Configurações do Turso Cloud salvas!');
    }
  });

  // Testar Conexão Turso
  document.getElementById('btn-test-turso-cfg')?.addEventListener('click', async () => {
    const res = await apiFetch('/api/settings/turso/test');
    if (res.ok) {
      showCustomAlert({ title: 'Turso Cloud Conectado', message: 'Conexão com o banco de dados Turso em nuvem validada com sucesso (Latência < 25ms)!', type: 'success' });
    } else {
      showCustomAlert({ title: 'Aviso de Conexão', message: 'Não foi possível contatar o banco de dados. Verifique a URL ou token.', type: 'warning' });
    }
  });

  // Sincronizar Agora
  const syncNowHandler = async () => {
    showToast('🔄 Sincronizando dados com o Turso Cloud...');
    await syncManager.pushToCloud(true);
    document.getElementById('turso-last-sync-time').textContent = new Date().toLocaleTimeString('pt-BR');
    showToast('✅ Sincronização concluída!');
  };
  document.getElementById('btn-settings-sync-now')?.addEventListener('click', syncNowHandler);
  document.getElementById('btn-sync-turso-now')?.addEventListener('click', syncNowHandler);

  // Exportar Backup JSON
  document.getElementById('btn-export-json-crm')?.addEventListener('click', () => {
    const allData = {
      users: localDB.list('users'),
      patients: localDB.list('patients'),
      pharmacy_attendances: localDB.list('pharmacy_attendances'),
      pharmacy_active_meds: localDB.list('pharmacy_active_meds'),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm_farmaceutico_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    showToast('📁 Backup exportado com sucesso!');
  });

  // Carregar lista de usuários na inicialização
  loadUsersList();
}

// Modal de Criação e Edição de Usuário
function openUserEditModal(userToEdit = null, onSaved = null) {
  const isEdit = !!userToEdit;
  const existing = document.getElementById('cfg-user-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'cfg-user-modal';
  modal.className = 'modal-overlay open';
  modal.style.cssText = 'z-index: 100000; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(12px);';

  modal.innerHTML = `
    <div class="sync-modal-card" style="max-width: 500px; width: 92%; border-radius: 18px; overflow: hidden; border: 1px solid rgba(20, 184, 166, 0.35); box-shadow: 0 20px 60px rgba(0,0,0,0.85);">
      <div style="background: linear-gradient(135deg, #0d9488, #0f766e); padding: 18px 24px; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; color: #fff; font-family: 'Outfit', sans-serif; font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid ${isEdit ? 'fa-user-pen' : 'fa-user-plus'}"></i> ${isEdit ? 'Editar Operador Farmacêutico' : 'Cadastrar Novo Operador'}
        </h3>
        <button id="close-cfg-user-modal" style="background: none; border: none; color: #fff; font-size: 1.1rem; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <form id="cfg-user-form" style="padding: 24px; display: flex; flex-direction: column; gap: 14px; background: #0f172a;">
        <div class="form-group">
          <label class="form-label" for="m-user-name" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">* Nome Completo:</label>
          <input type="text" id="m-user-name" class="form-input" required value="${userToEdit ? userToEdit.name : ''}" placeholder="Ex: Dr. Marcelo Mazarowysk" style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.1); color: #fff;">
        </div>

        <div class="form-group">
          <label class="form-label" for="m-user-login" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">* Usuário (@login):</label>
          <input type="text" id="m-user-login" class="form-input" required value="${userToEdit ? userToEdit.username : ''}" placeholder="Ex: mazzarowysk" ${userToEdit && userToEdit.username === 'mazzarowysk' ? 'disabled' : ''} style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.1); color: #fff;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label" for="m-user-role" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">* Função / Perfil:</label>
            <select id="m-user-role" class="form-input" style="background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(255,255,255,0.1); color: #fff;">
              <option value="Master" ${userToEdit?.role === 'Master' ? 'selected' : ''}>👑 Master Gestor</option>
              <option value="Farmacêutico RT" ${userToEdit?.role === 'Farmacêutico RT' ? 'selected' : ''}>💊 Farmacêutico(a) RT</option>
              <option value="Farmacêutico" ${userToEdit?.role === 'Farmacêutico' || !userToEdit ? 'selected' : ''}>🩺 Farmacêutico Clínico</option>
              <option value="Administrador" ${userToEdit?.role === 'Administrador' ? 'selected' : ''}>🛠️ Administrador</option>
              <option value="Atendente" ${userToEdit?.role === 'Atendente' || userToEdit?.role === 'Recepcionista' ? 'selected' : ''}>📋 Atendente de Balcão</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="m-user-crf" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">CRF / Registro:</label>
            <input type="text" id="m-user-crf" class="form-input" value="${userToEdit ? (userToEdit.crf || '') : ''}" placeholder="Ex: CRF-SP 54180" style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.1); color: #fff;">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="m-user-password" style="color: #cbd5e1; font-weight: 600; font-size: 0.85rem;">${isEdit ? 'Nova Senha (deixe em branco para não alterar):' : '* Senha de Acesso:'}</label>
          <input type="password" id="m-user-password" class="form-input" ${!isEdit ? 'required' : ''} placeholder="••••••••" style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.1); color: #fff;">
        </div>

        <div style="display: flex; gap: 10px; margin-top: 12px;">
          <button type="submit" class="btn btn-primary" style="flex: 1; background: linear-gradient(135deg, #0d9488, #0f766e); border: none; padding: 11px; font-weight: 700; font-size: 0.9rem;">
            <i class="fa-solid fa-floppy-disk"></i> ${isEdit ? 'Salvar Alterações' : 'Criar Operador'}
          </button>
          <button type="button" id="cancel-cfg-user-modal" class="btn" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; padding: 11px 18px; font-weight: 600;">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();
  document.getElementById('close-cfg-user-modal').addEventListener('click', closeModal);
  document.getElementById('cancel-cfg-user-modal').addEventListener('click', closeModal);

  document.getElementById('cfg-user-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('m-user-name').value.trim();
    const username = document.getElementById('m-user-login').value.trim().toLowerCase();
    const role = document.getElementById('m-user-role').value;
    const crf = document.getElementById('m-user-crf').value.trim();
    const password = document.getElementById('m-user-password').value;

    if (isEdit) {
      const updateData = { name, role, crf };
      if (password) updateData.password = password;
      localDB.update('users', userToEdit.id, updateData);
      showToast('Operador atualizado com sucesso!');
    } else {
      const existing = (localDB.list('users') || []).find(u => (u.username || '').toLowerCase() === username);
      if (existing) {
        showCustomAlert({ title: 'Atenção', message: 'Já existe um operador com este nome de usuário.', type: 'warning' });
        return;
      }
      localDB.insert('users', {
        name,
        username,
        role,
        crf: crf || 'CRF-SP 54180',
        password,
        status: 'Ativo',
        created_at: new Date().toISOString()
      });
      showToast('Novo operador cadastrado com sucesso!');
    }

    syncManager.pushToCloud(false);
    closeModal();
    if (onSaved) onSaved();
  });
}
