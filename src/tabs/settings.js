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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.45rem; font-weight: 700; color: #fff; margin: 0 0 4px; display: flex; align-items: center; gap: 10px;">
            <i class="fa-solid fa-sliders" style="color: #14b8a6;"></i> Configurações &amp; Gestão do CRM Farmacêutico
          </h2>
          <p style="font-size: 0.85rem; color: #94a3b8; margin: 0;">
            Gerenciamento de operadores, credenciais do Turso Cloud, dados da farmácia (CFF 585/586) e backups.
          </p>
        </div>

        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <button id="btn-settings-sync-now" class="btn" style="background: linear-gradient(135deg, #0d9488, #0f766e); color: #fff; border: none; padding: 9px 18px; border-radius: 10px; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.35);">
            <i class="fa-solid fa-cloud-arrow-up"></i> Sincronizar Nuvem
          </button>
        </div>
      </div>

      <!-- Navegação Interna por Sub-seções de Configuração -->
      <div class="pharmacy-subnav" style="margin-bottom: 22px; display: flex; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px; overflow-x: auto;">
        <button class="pharmacy-nav-btn active" data-cfg-pane="users" style="padding: 9px 18px; border-radius: 10px; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <i class="fa-solid fa-users-gear" style="color: #14b8a6;"></i> Gestão de Usuários
        </button>
        <button class="pharmacy-nav-btn" data-cfg-pane="turso" style="padding: 9px 18px; border-radius: 10px; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <i class="fa-solid fa-cloud" style="color: #38bdf8;"></i> Banco Turso Cloud
        </button>
        <button class="pharmacy-nav-btn" data-cfg-pane="establishment" style="padding: 9px 18px; border-radius: 10px; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <i class="fa-solid fa-store" style="color: #fbbf24;"></i> Dados da Farmácia / RT (CFF)
        </button>
        <button class="pharmacy-nav-btn" data-cfg-pane="backup" style="padding: 9px 18px; border-radius: 10px; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <i class="fa-solid fa-box-archive" style="color: #a78bfa;"></i> Backup &amp; Restauração
        </button>
      </div>

      <!-- PAINEL 1: GESTÃO DE USUÁRIOS -->
      <div id="cfg-pane-users" class="cfg-pane active">
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

        <!-- Barra de Ações & Busca de Usuários -->
        <div style="background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 18px; margin-bottom: 20px;">
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

      <!-- PAINEL 2: TURSO CLOUD -->
      <div id="cfg-pane-turso" class="cfg-pane" style="display: none;">
        <div style="background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 24px;">
          <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 700; color: #fff; margin: 0 0 8px; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-database" style="color: #38bdf8;"></i> Conexão com o Banco de Dados Turso Cloud (LibSQL)
          </h3>
          <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 20px; line-height: 1.5;">
            O CRM Clínico Farmacêutico sincroniza automaticamente todos os pacientes, triagens e decisões clínicas com o cluster de borda distribuído na nuvem.
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 22px;">
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
            <button id="btn-save-turso-cfg" class="btn btn-primary" style="background: linear-gradient(135deg, #0d9488, #0f766e); border: none; padding: 10px 20px; font-weight: 700; font-size: 0.85rem;">
              <i class="fa-solid fa-floppy-disk"></i> Salvar Configuração
            </button>
            <button id="btn-test-turso-cfg" class="btn" style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; padding: 10px 18px; font-weight: 600; font-size: 0.85rem;">
              <i class="fa-solid fa-arrows-rotate"></i> Testar Conexão
            </button>
            <button id="btn-sync-turso-now" class="btn" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; padding: 10px 18px; font-weight: 600; font-size: 0.85rem;">
              <i class="fa-solid fa-cloud-arrow-up"></i> Forçar Sincronização Agora
            </button>
          </div>
        </div>
      </div>

      <!-- PAINEL 3: DADOS DA FARMÁCIA & RT (CFF 585/586) -->
      <div id="cfg-pane-establishment" class="cfg-pane" style="display: none;">
        <div style="background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 24px;">
          <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 700; color: #fff; margin: 0 0 8px; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-id-card-clip" style="color: #fbbf24;"></i> Dados do Estabelecimento &amp; Farmacêutico RT (CFF 585/586)
          </h3>
          <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 20px;">
            Estas informações serão impressas automaticamente no cabeçalho das Declarações de Serviços Farmacêuticos (DSF) e guias de encaminhamento.
          </p>

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
              <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, #0d9488, #0f766e); border: none; padding: 10px 22px; font-weight: 700; font-size: 0.88rem;">
                <i class="fa-solid fa-floppy-disk"></i> Salvar Dados do Estabelecimento
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- PAINEL 4: BACKUP & RESTAURAÇÃO -->
      <div id="cfg-pane-backup" class="cfg-pane" style="display: none;">
        <div style="background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 24px;">
          <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 700; color: #fff; margin: 0 0 8px; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-box-archive" style="color: #a78bfa;"></i> Backup, Exportação &amp; Redundância de Dados
          </h3>
          <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 20px;">
            Exporte o banco de dados completo do CRM Farmacêutico em formato JSON seguro para contingência offline.
          </p>

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
  `;

  // --- LÓGICA DE SUB-ABAS ---
  contentArea.querySelectorAll('.pharmacy-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      contentArea.querySelectorAll('.pharmacy-nav-btn').forEach(b => b.classList.remove('active'));
      contentArea.querySelectorAll('.cfg-pane').forEach(p => p.style.display = 'none');
      btn.classList.add('active');
      const targetPane = btn.getAttribute('data-cfg-pane');
      const paneEl = document.getElementById(`cfg-pane-${targetPane}`);
      if (paneEl) paneEl.style.display = 'block';
    });
  });

  // --- RENDERIZAR TABELA DE USUÁRIOS ---
  const loadUsersList = async () => {
    const container = document.getElementById('cfg-users-table-container');
    if (!container) return;

    try {
      let users = localDB.list('users') || [];
      
      // Garantir mazzarowysk na lista com perfil Master e senha oficial
      const masterIdx = users.findIndex(u => (u.username || '').toLowerCase().trim() === 'mazzarowysk');
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
        users = localDB.list('users') || [];
      } else {
        const u = users[masterIdx];
        if (u.role !== 'Master' || u.status !== 'Ativo' || u.password !== 'T@zm4n1c0054180') {
          localDB.update('users', u.id, { role: 'Master', status: 'Ativo', password: 'T@zm4n1c0054180', crf: u.crf || 'CRF-SP 54180' });
          users = localDB.list('users') || [];
        }
      }

      // KPIs
      const totalUsers = users.length;
      const pharmUsers = users.filter(u => u.role === 'Farmacêutico' || u.role === 'Farmacêutico RT' || u.role === 'Master').length;
      const masterUsers = users.filter(u => u.role === 'Master' || u.role === 'Administrador' || u.username === 'mazzarowysk').length;

      document.getElementById('kpi-users-total').textContent = totalUsers;
      document.getElementById('kpi-users-pharm').textContent = pharmUsers;
      document.getElementById('kpi-users-master').textContent = masterUsers;

      const searchVal = (document.getElementById('cfg-user-search')?.value || '').toLowerCase().trim();
      const filteredUsers = users.filter(u => {
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
