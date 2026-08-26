// src/modules/financialParams.js
// Gestão de Parâmetros Financeiros (Categorias de Receitas, Despesas e Formas de Pagamento)
// Integrado bidirecionalmente entre o Modal Financeiro (Botão +) e a Aba Configurações

import * as localDB from '../localDB.js';
import { syncManager } from './sync.js';
import { showToast, showCustomConfirm, showCustomAlert } from './ui.js';

export const DEFAULT_FINANCIAL_CATEGORIES = [
  // Receitas Clínicas & Balcão
  { id: 'cat-rec-1', name: 'Consulta Farmacêutica (Balcão)', type: 'receita', isDefault: true, color: '#10b981' },
  { id: 'cat-rec-2', name: 'Venda de Medicamentos (PDV)', type: 'receita', isDefault: true, color: '#10b981' },
  { id: 'cat-rec-3', name: 'Aplicação de Injetáveis & Vacinas', type: 'receita', isDefault: true, color: '#10b981' },
  { id: 'cat-rec-4', name: 'Testes Rápidos / TLR (RDC 786)', type: 'receita', isDefault: true, color: '#10b981' },
  { id: 'cat-rec-5', name: 'Aferição de Pressão / Glicemia', type: 'receita', isDefault: true, color: '#10b981' },

  // Despesas Operacionais & Compras
  { id: 'cat-desp-1', name: 'Compra de Medicamentos (Distribuidora)', type: 'despesa', isDefault: true, color: '#f43f5e' },
  { id: 'cat-desp-2', name: 'Insumos & Descartáveis (Seringas/EPIs)', type: 'despesa', isDefault: true, color: '#f43f5e' },
  { id: 'cat-desp-3', name: 'Aluguel & Instalações', type: 'despesa', isDefault: true, color: '#f43f5e' },
  { id: 'cat-desp-4', name: 'Energia, Água & Internet', type: 'despesa', isDefault: true, color: '#f43f5e' },
  { id: 'cat-desp-5', name: 'Anuidade CRF / Taxas ANVISA', type: 'despesa', isDefault: true, color: '#f43f5e' },
  { id: 'cat-desp-6', name: 'Folha de Pagamento / Salários', type: 'despesa', isDefault: true, color: '#f43f5e' }
];

export const DEFAULT_PAYMENT_METHODS = [
  { id: 'pay-1', name: 'PIX', isDefault: true, icon: 'fa-qrcode' },
  { id: 'pay-2', name: 'Cartão de Débito', isDefault: true, icon: 'fa-credit-card' },
  { id: 'pay-3', name: 'Cartão de Crédito', isDefault: true, icon: 'fa-credit-card' },
  { id: 'pay-4', name: 'Dinheiro', isDefault: true, icon: 'fa-money-bill-wave' },
  { id: 'pay-5', name: 'Boleto Bancário', isDefault: true, icon: 'fa-barcode' },
  { id: 'pay-6', name: 'Crediário / Convênio Farmácia', isDefault: true, icon: 'fa-handshake' }
];

// Inicializa e garante que os registros existam na base de dados
export function initFinancialParameters() {
  let categories = localDB.list('financial_categories') || [];
  let paymentMethods = localDB.list('financial_payment_methods') || [];

  let modified = false;

  if (categories.length === 0) {
    DEFAULT_FINANCIAL_CATEGORIES.forEach(cat => {
      localDB.insert('financial_categories', { ...cat, created_at: new Date().toISOString() });
    });
    categories = localDB.list('financial_categories') || [];
    modified = true;
  }

  // Migrar categorias legadas salvas em localStorage se houver
  try {
    const legacyCats = JSON.parse(localStorage.getItem('crm_custom_fin_categories') || '[]');
    legacyCats.forEach(name => {
      if (name && !categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        localDB.insert('financial_categories', {
          id: `cat-custom-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          name: name.trim(),
          type: 'receita',
          isDefault: false,
          color: '#38bdf8',
          created_at: new Date().toISOString()
        });
        modified = true;
      }
    });
  } catch(e) {}

  if (paymentMethods.length === 0) {
    DEFAULT_PAYMENT_METHODS.forEach(pay => {
      localDB.insert('financial_payment_methods', { ...pay, created_at: new Date().toISOString() });
    });
    paymentMethods = localDB.list('financial_payment_methods') || [];
    modified = true;
  }

  // Migrar formas de pagamento legadas salvas em localStorage
  try {
    const legacyPays = JSON.parse(localStorage.getItem('crm_custom_fin_payments') || '[]');
    legacyPays.forEach(name => {
      if (name && !paymentMethods.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        localDB.insert('financial_payment_methods', {
          id: `pay-custom-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          name: name.trim(),
          isDefault: false,
          icon: 'fa-wallet',
          created_at: new Date().toISOString()
        });
        modified = true;
      }
    });
  } catch(e) {}

  if (modified) {
    syncManager.pushToCloud(false);
  }
}

// Retorna todas as categorias ou filtradas por tipo ('receita' | 'despesa')
export function getFinancialCategories(type = null) {
  initFinancialParameters();
  const all = localDB.list('financial_categories') || [];
  if (!type) return all;
  return all.filter(c => c.type === type);
}

// Adiciona uma nova categoria financeira
export function addFinancialCategory(name, type = 'receita', isDefault = false) {
  const cleanName = (name || '').trim();
  if (!cleanName) return null;

  initFinancialParameters();
  const all = localDB.list('financial_categories') || [];
  const existing = all.find(c => c.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    return existing;
  }

  const newCat = {
    id: `cat-custom-${Date.now()}-${Math.floor(Math.random()*1000)}`,
    name: cleanName,
    type: type,
    isDefault: isDefault,
    color: type === 'receita' ? '#10b981' : '#f43f5e',
    created_at: new Date().toISOString()
  };

  localDB.insert('financial_categories', newCat);
  syncManager.pushToCloud(false);
  return newCat;
}

// Atualiza uma categoria existente
export function updateFinancialCategory(id, updatedFields = {}) {
  const updated = localDB.update('financial_categories', id, updatedFields);
  syncManager.pushToCloud(false);
  return updated;
}

// Exclui uma categoria
export function deleteFinancialCategory(id) {
  localDB.remove('financial_categories', id);
  syncManager.pushToCloud(false);
}

// Retorna todos os meios de pagamento
export function getPaymentMethods() {
  initFinancialParameters();
  return localDB.list('financial_payment_methods') || [];
}

// Adiciona uma nova forma de pagamento
export function addPaymentMethod(name, isDefault = false) {
  const cleanName = (name || '').trim();
  if (!cleanName) return null;

  initFinancialParameters();
  const all = localDB.list('financial_payment_methods') || [];
  const existing = all.find(p => p.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    return existing;
  }

  const newPay = {
    id: `pay-custom-${Date.now()}-${Math.floor(Math.random()*1000)}`,
    name: cleanName,
    isDefault: isDefault,
    icon: 'fa-credit-card',
    created_at: new Date().toISOString()
  };

  localDB.insert('financial_payment_methods', newPay);
  syncManager.pushToCloud(false);
  return newPay;
}

// Atualiza forma de pagamento
export function updatePaymentMethod(id, updatedFields = {}) {
  const updated = localDB.update('financial_payment_methods', id, updatedFields);
  syncManager.pushToCloud(false);
  return updated;
}

// Exclui forma de pagamento
export function deletePaymentMethod(id) {
  localDB.remove('financial_payment_methods', id);
  syncManager.pushToCloud(false);
}

// ─── RENDERIZADOR DO PAINEL DE GESTÃO NA ABA CONFIGURAÇÕES ────────────────
export function renderFinancialParamsManagement(containerEl) {
  if (!containerEl) return;
  initFinancialParameters();

  let activeFilter = 'todos'; // 'todos' | 'receitas' | 'despesas' | 'pagamentos'
  let searchQuery = '';

  const renderContent = () => {
    const categories = localDB.list('financial_categories') || [];
    const payments = localDB.list('financial_payment_methods') || [];

    const recCount = categories.filter(c => c.type === 'receita').length;
    const despCount = categories.filter(c => c.type === 'despesa').length;
    const payCount = payments.length;
    const totalCount = categories.length + payCount;

    // Filtra itens
    let displayItems = [];
    if (activeFilter === 'todos' || activeFilter === 'receitas' || activeFilter === 'despesas') {
      let filteredCats = categories;
      if (activeFilter === 'receitas') filteredCats = categories.filter(c => c.type === 'receita');
      if (activeFilter === 'despesas') filteredCats = categories.filter(c => c.type === 'despesa');
      
      displayItems = displayItems.concat(filteredCats.map(c => ({
        id: c.id,
        name: c.name,
        categoryType: c.type, // 'receita' | 'despesa'
        kind: 'category',
        isDefault: !!c.isDefault,
        createdAt: c.created_at || 'Sistema'
      })));
    }

    if (activeFilter === 'todos' || activeFilter === 'pagamentos') {
      displayItems = displayItems.concat(payments.map(p => ({
        id: p.id,
        name: p.name,
        categoryType: 'pagamento',
        kind: 'payment',
        isDefault: !!p.isDefault,
        createdAt: p.created_at || 'Sistema'
      })));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      displayItems = displayItems.filter(i => i.name.toLowerCase().includes(q));
    }

    containerEl.innerHTML = `
      <div style="background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 20px;">
        
        <!-- Cards de Indicadores de Parâmetros -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;">
          
          <div class="pharmacy-kpi-card" style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 14px; padding: 14px;">
            <div style="font-size: 0.74rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Categorias de Receita</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #34d399; margin-top: 4px;">${recCount}</div>
            <small style="color: #34d399; font-size: 0.72rem;"><i class="fa-solid fa-arrow-down"></i> Entradas &amp; Vendas</small>
          </div>

          <div class="pharmacy-kpi-card" style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(244, 63, 94, 0.25); border-radius: 14px; padding: 14px;">
            <div style="font-size: 0.74rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Categorias de Despesa</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #fb7185; margin-top: 4px;">${despCount}</div>
            <small style="color: #fb7185; font-size: 0.72rem;"><i class="fa-solid fa-arrow-up"></i> Compras &amp; Custos</small>
          </div>

          <div class="pharmacy-kpi-card" style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 14px; padding: 14px;">
            <div style="font-size: 0.74rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Formas de Pagamento</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #38bdf8; margin-top: 4px;">${payCount}</div>
            <small style="color: #38bdf8; font-size: 0.72rem;"><i class="fa-solid fa-credit-card"></i> Meios de Cobrança</small>
          </div>

          <div class="pharmacy-kpi-card" style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 14px; padding: 14px;">
            <div style="font-size: 0.74rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Total Cadastrado</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #c084fc; margin-top: 4px;">${totalCount}</div>
            <small style="color: #c084fc; font-size: 0.72rem;"><i class="fa-solid fa-tags"></i> Sincronizados com Nuvem</small>
          </div>

        </div>

        <!-- Barra de Ações & Filtros -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;">
          
          <!-- Filtros Rápidos -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button class="btn btn-filter-param ${activeFilter === 'todos' ? 'active' : ''}" data-filter="todos" style="font-size: 0.78rem; padding: 6px 12px; border-radius: 8px; font-weight: 600; cursor: pointer; border: 1px solid ${activeFilter === 'todos' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}; background: ${activeFilter === 'todos' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)'}; color: ${activeFilter === 'todos' ? '#38bdf8' : '#cbd5e1'};">
              Todos (${totalCount})
            </button>
            <button class="btn btn-filter-param ${activeFilter === 'receitas' ? 'active' : ''}" data-filter="receitas" style="font-size: 0.78rem; padding: 6px 12px; border-radius: 8px; font-weight: 600; cursor: pointer; border: 1px solid ${activeFilter === 'receitas' ? '#10b981' : 'rgba(255,255,255,0.1)'}; background: ${activeFilter === 'receitas' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)'}; color: ${activeFilter === 'receitas' ? '#34d399' : '#cbd5e1'};">
              <i class="fa-solid fa-arrow-down"></i> Receitas (${recCount})
            </button>
            <button class="btn btn-filter-param ${activeFilter === 'despesas' ? 'active' : ''}" data-filter="despesas" style="font-size: 0.78rem; padding: 6px 12px; border-radius: 8px; font-weight: 600; cursor: pointer; border: 1px solid ${activeFilter === 'despesas' ? '#f43f5e' : 'rgba(255,255,255,0.1)'}; background: ${activeFilter === 'despesas' ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.04)'}; color: ${activeFilter === 'despesas' ? '#fb7185' : '#cbd5e1'};">
              <i class="fa-solid fa-arrow-up"></i> Despesas (${despCount})
            </button>
            <button class="btn btn-filter-param ${activeFilter === 'pagamentos' ? 'active' : ''}" data-filter="pagamentos" style="font-size: 0.78rem; padding: 6px 12px; border-radius: 8px; font-weight: 600; cursor: pointer; border: 1px solid ${activeFilter === 'pagamentos' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}; background: ${activeFilter === 'pagamentos' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)'}; color: ${activeFilter === 'pagamentos' ? '#38bdf8' : '#cbd5e1'};">
              <i class="fa-solid fa-credit-card"></i> Pagamentos (${payCount})
            </button>
          </div>

          <!-- Botão Novo + Busca -->
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <div style="position: relative;">
              <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 0.8rem;"></i>
              <input type="text" id="cfg-param-search" value="${searchQuery}" placeholder="Filtrar por nome..." class="form-input" style="padding-left: 34px; font-size: 0.82rem; height: 36px; border-radius: 8px; background: rgba(30,41,59,0.5); width: 180px;">
            </div>

            <button id="btn-open-new-param-modal" class="btn" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(16,185,129,0.3);">
              <i class="fa-solid fa-plus"></i> Novo Parâmetro
            </button>
          </div>

        </div>

        <!-- Tabela de Parâmetros -->
        <div style="overflow-x: auto; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;">
          <table class="data-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
            <thead>
              <tr style="background: rgba(30, 41, 59, 0.7); color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <th style="padding: 12px 16px;">Tipo / Classificação</th>
                <th style="padding: 12px 16px;">Nome do Parâmetro</th>
                <th style="padding: 12px 16px;">Origem / Status</th>
                <th style="padding: 12px 16px; text-align: right;">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${displayItems.length === 0 ? `
                <tr>
                  <td colspan="4" style="text-align: center; padding: 30px; color: #94a3b8;">
                    Nenhum parâmetro financeiro encontrado com o filtro atual.
                  </td>
                </tr>
              ` : displayItems.map(item => {
                let badgeHtml = '';
                if (item.categoryType === 'receita') {
                  badgeHtml = `<span style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); padding: 3px 10px; border-radius: 12px; font-size: 0.74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;"><i class="fa-solid fa-arrow-down"></i> Receita</span>`;
                } else if (item.categoryType === 'despesa') {
                  badgeHtml = `<span style="background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.35); padding: 3px 10px; border-radius: 12px; font-size: 0.74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;"><i class="fa-solid fa-arrow-up"></i> Despesa</span>`;
                } else {
                  badgeHtml = `<span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); padding: 3px 10px; border-radius: 12px; font-size: 0.74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;"><i class="fa-solid fa-credit-card"></i> Pagamento</span>`;
                }

                const originHtml = item.isDefault 
                  ? `<span style="color: #94a3b8; font-size: 0.76rem;"><i class="fa-solid fa-cube"></i> Padrão do Sistema</span>` 
                  : `<span style="color: #f59e0b; font-size: 0.76rem; font-weight: 600;"><i class="fa-solid fa-star"></i> Personalizado (via +)</span>`;

                return `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 12px 16px;">${badgeHtml}</td>
                    <td style="padding: 12px 16px; font-weight: 600; color: #f8fafc;">${item.name}</td>
                    <td style="padding: 12px 16px;">${originHtml}</td>
                    <td style="padding: 12px 16px; text-align: right;">
                      <div style="display: inline-flex; gap: 8px;">
                        <button class="btn-icon btn-edit-param" data-id="${item.id}" data-kind="${item.kind}" data-name="${item.name.replace(/"/g, '&quot;')}" data-type="${item.categoryType}" title="Editar Parâmetro" style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">
                          <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-icon btn-delete-param" data-id="${item.id}" data-kind="${item.kind}" data-name="${item.name.replace(/"/g, '&quot;')}" title="Excluir Parâmetro" style="background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.3); color: #fb7185; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

      </div>
    `;

    // Listeners dos Filtros
    containerEl.querySelectorAll('.btn-filter-param').forEach(btn => {
      btn.addEventListener('click', () => {
        activeFilter = btn.getAttribute('data-filter');
        renderContent();
      });
    });

    // Listener de Busca
    const searchInput = containerEl.querySelector('#cfg-param-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderContent();
      });
      if (searchQuery) {
        searchInput.focus();
        searchInput.setSelectionRange(searchQuery.length, searchQuery.length);
      }
    }

    // Listener Botão Novo Parâmetro
    containerEl.querySelector('#btn-open-new-param-modal')?.addEventListener('click', () => {
      openParamFormModal(null, () => renderContent());
    });

    // Listeners de Edição
    containerEl.querySelectorAll('.btn-edit-param').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const kind = btn.getAttribute('data-kind');
        const name = btn.getAttribute('data-name');
        const type = btn.getAttribute('data-type');
        openParamFormModal({ id, kind, name, type }, () => renderContent());
      });
    });

    // Listeners de Exclusão
    containerEl.querySelectorAll('.btn-delete-param').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const kind = btn.getAttribute('data-kind');
        const name = btn.getAttribute('data-name');

        const confirmed = await showCustomConfirm({
          title: 'Excluir Parâmetro Financeiro',
          message: `Tem certeza que deseja excluir <strong>"${name}"</strong>?<br><br>Ele não aparecerá mais nos formulários de novos lançamentos.`,
          confirmText: 'Sim, Excluir',
          cancelText: 'Cancelar',
          type: 'danger'
        });

        if (confirmed) {
          if (kind === 'payment') {
            deletePaymentMethod(id);
          } else {
            deleteFinancialCategory(id);
          }
          showToast(`🗑️ Parâmetro "${name}" excluído com sucesso!`);
          renderContent();
        }
      });
    });
  };

  renderContent();
}

// Modal de Criação / Edição de Parâmetros Financeiros
export function openParamFormModal(paramToEdit = null, onSaved = null) {
  const isEdit = !!paramToEdit;
  const modalHtml = `
    <div id="modal-param-form-overlay" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10060; padding: 20px; animation: fadeIn 0.2s ease;">
      <div style="background: linear-gradient(145deg, #1e293b, #0f172a); border: 1px solid #38bdf8; border-radius: 18px; max-width: 480px; width: 100%; box-shadow: 0 0 35px rgba(56, 189, 248, 0.25); overflow: hidden;">
        
        <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.2);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(56, 189, 248, 0.2); display: flex; align-items: center; justify-content: center; color: #38bdf8; font-size: 1.1rem;">
              <i class="fa-solid ${isEdit ? 'fa-pen' : 'fa-plus'}"></i>
            </div>
            <h3 style="color: #f8fafc; font-family: 'Outfit', sans-serif; font-size: 1.15rem; margin: 0;">
              ${isEdit ? 'Editar Parâmetro Financeiro' : 'Novo Parâmetro Financeiro'}
            </h3>
          </div>
          <button type="button" id="btn-close-param-modal" style="background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer;">✕</button>
        </div>

        <form id="form-param-modal" style="padding: 20px; display: flex; flex-direction: column; gap: 14px;">
          
          <div>
            <label style="display: block; font-size: 0.82rem; color: #cbd5e1; margin-bottom: 6px; font-weight: 600;">Tipo de Parâmetro *</label>
            <select id="param-kind-select" class="form-input" style="width: 100%; height: 42px; background: rgba(30,41,59,0.95); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 8px;" ${isEdit ? 'disabled' : ''}>
              <option value="receita" ${paramToEdit?.type === 'receita' ? 'selected' : ''}>⬇️ Categoria de Receita (Entrada / Venda)</option>
              <option value="despesa" ${paramToEdit?.type === 'despesa' ? 'selected' : ''}>⬆️ Categoria de Despesa (Saída / Compra)</option>
              <option value="pagamento" ${paramToEdit?.type === 'pagamento' ? 'selected' : ''}>💳 Forma de Pagamento (Meio de Cobrança)</option>
            </select>
          </div>

          <div>
            <label style="display: block; font-size: 0.82rem; color: #cbd5e1; margin-bottom: 6px; font-weight: 600;">Nome do Parâmetro *</label>
            <input type="text" id="param-name-input" class="form-input" required placeholder="Ex: Farmácia Popular, Locação de Consultório, Cheque..." value="${paramToEdit ? paramToEdit.name : ''}" style="width: 100%; height: 42px; background: rgba(30,41,59,0.95); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 8px; padding: 0 12px; font-size: 0.9rem;">
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08);">
            <button type="button" id="btn-cancel-param-modal" class="btn btn-secondary" style="padding: 9px 16px;">Cancelar</button>
            <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, #38bdf8, #0284c7); border: none; font-weight: 700; padding: 9px 20px; border-radius: 8px; cursor: pointer; color: #fff;">
              <i class="fa-solid fa-check"></i> ${isEdit ? 'Salvar Alterações' : 'Cadastrar Parâmetro'}
            </button>
          </div>

        </form>
      </div>
    </div>
  `;

  const existing = document.getElementById('modal-param-form-overlay');
  if (existing) existing.remove();

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const overlay = document.getElementById('modal-param-form-overlay');
  const close = () => overlay?.remove();

  document.getElementById('btn-close-param-modal')?.addEventListener('click', close);
  document.getElementById('btn-cancel-param-modal')?.addEventListener('click', close);

  document.getElementById('form-param-modal')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const kind = document.getElementById('param-kind-select').value;
    const name = document.getElementById('param-name-input').value.trim();

    if (!name) {
      showToast('⚠️ Informe o nome do parâmetro.');
      return;
    }

    if (isEdit) {
      if (paramToEdit.kind === 'payment') {
        updatePaymentMethod(paramToEdit.id, { name });
      } else {
        updateFinancialCategory(paramToEdit.id, { name });
      }
      showToast(`✅ Parâmetro "${name}" atualizado com sucesso!`);
    } else {
      if (kind === 'pagamento') {
        addPaymentMethod(name);
      } else {
        addFinancialCategory(name, kind);
      }
      showToast(`✅ Parâmetro "${name}" cadastrado com sucesso!`);
    }

    close();
    if (onSaved) onSaved();
  });
}
