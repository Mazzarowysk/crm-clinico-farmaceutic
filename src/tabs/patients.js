// ─── MÓDULO DA ABA CLIENTES (CRM CLÍNICO FARMACÊUTICO v3.0) ──────────────────────────────
import { state, dataCache } from '../state.js';
import { apiFetch, cachedApiGet, removeAccents } from '../modules/api.js';
import { showToast, showCustomAlert, showCustomConfirm } from '../modules/ui.js';
import { syncManager } from '../modules/sync.js';
import { getRolePermissions } from '../modules/auth.js';
import { openVaccinationModal } from '../modules/vaccination.js';
import { openPatientPortalModal } from '../modules/patientPortal.js';
import { openPatientPurchasesModal } from '../modules/patientPurchasesModal.js';
import { attachMedicationAutocomplete } from '../modules/medicationSearch.js';
import { evaluateSepsisRisk, renderSepsisAlertCard } from '../modules/sepsisScreener.js';
import * as localDB from '../localDB.js';

export function renderPatientsTab(contentArea) {
  contentArea.innerHTML = `
    <div class="tab-section active">
      <!-- Coluna Única: Lista com Busca Inteligente -->
      <div class="patients-list-container" style="width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <h3 style="margin: 0; font-family: 'Outfit'; font-weight: 600; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-users" style="color: #10b981;"></i> Clientes Cadastrados
            </h3>
            <button id="btn-new-patient" class="btn btn-primary" style="padding: 7px 14px; font-size: 0.85rem; font-weight: 700; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-user-plus"></i> Novo Cliente / Queixa
            </button>
            <button id="btn-quick-vaccine-header" type="button" class="btn" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 7px 14px; font-size: 0.85rem; font-weight: 700; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
              <i class="fa-solid fa-syringe"></i> Vacinação
            </button>
            <button id="btn-quick-portal-header" type="button" class="btn" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: none; padding: 7px 14px; font-size: 0.85rem; font-weight: 700; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">
              <i class="fa-solid fa-mobile-screen-button"></i> Portal do Paciente PWA
            </button>
            <button id="btn-quick-purchases-header" type="button" class="btn" style="background: linear-gradient(135deg, #059669, #047857); color: #fff; border: none; padding: 7px 14px; font-size: 0.85rem; font-weight: 700; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
              <i class="fa-solid fa-cart-shopping"></i> Compras &amp; Adesão
            </button>
          </div>
          <button id="patients-trash-btn" class="btn" style="background-color: rgba(239, 68, 68, 0.1); color: var(--danger-color); border: 1px solid rgba(239, 68, 68, 0.3); padding: 6px 12px; font-size: 0.85rem; font-weight: 600; border-radius: 8px; transition: all 0.2s;">
            <i class="fa-solid fa-trash-can" style="margin-right: 6px;"></i> Lixeira
          </button>
        </div>
        
        <div class="search-container">
          <div class="search-wrapper">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input type="text" id="search-input" class="search-input" placeholder="Buscar cliente por nome, CPF, cidade, telefone, PBM ou ID...">
          </div>
        </div>

        <div id="patients-table-wrapper" style="overflow-x: auto;">
          <div style="text-align: center; color: var(--text-secondary); padding: 40px;">Carregando registros de clientes...</div>
        </div>
      </div>
    </div>

    <!-- Modal de Cadastro, Queixas e Indicação Medicamentosa do Cliente -->
    <div id="patient-modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(5, 8, 20, 0.82); z-index: 1000; justify-content: center; align-items: center; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); padding: 16px; box-sizing: border-box;">
      <div class="patients-form-container" style="background: #0f172a; width: 98%; max-width: 1220px; max-height: 94vh; display: flex; flex-direction: column; overflow: hidden; border-radius: 18px; padding: 24px 28px; box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(16, 185, 129, 0.12); border: 1.5px solid rgba(255,255,255,0.1); position: relative; animation: fadeIn 0.3s ease-out;">
        <button type="button" id="btn-close-patient-modal" style="position: absolute; top: 18px; right: 18px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); width: 34px; height: 34px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; color: #94a3b8; display: flex; align-items: center; justify-content: center; transition: 0.2s;"><i class="fa-solid fa-xmark"></i></button>
        
        <div style="margin-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 14px;">
          <h3 id="form-title" style="margin: 0 0 6px 0; font-family: 'Outfit'; font-weight: 700; display: flex; align-items: center; gap: 10px; color: #f8fafc; font-size: 1.25rem;">
            <i class="fa-solid fa-user-plus" style="color: #10b981;"></i> Cadastro do Cliente &amp; Registro da Queixa para Indicação Medicamentosa
          </h3>
          <p style="margin: 0; font-size: 0.82rem; color: #94a3b8; line-height: 1.4;">
            Cadastre os dados do cliente, relate a queixa clínica da visita atual e obtenha imediatamente as opções de receituário farmacêutico com suporte CDSS 4D.
          </p>
        </div>
        
        <form id="patient-form" novalidate style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
          <input type="hidden" id="editId">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(480px, 1fr)); gap: 20px; flex: 1; overflow: hidden; align-items: start;">
            
            <!-- COLUNA 1: DADOS PESSOAIS & ENDEREÇO -->
            <div style="display: flex; flex-direction: column; gap: 16px; overflow-y: auto; padding-right: 10px; max-height: 68vh;" class="custom-scrollbar patient-modal-col-1">
              
              <!-- 1. IDENTIFICAÇÃO DO CLIENTE -->
              <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
                  <div style="font-size: 0.82rem; font-weight: 800; color: #38bdf8; text-transform: uppercase; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-id-card"></i> 1. Identificação do Cliente
                  </div>
                  <button type="button" id="btn-modal-clear-client" style="background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;">
                    <i class="fa-solid fa-eraser"></i> Limpar / Novo Cliente
                  </button>
                </div>

                <!-- BUSCA RÁPIDA DE CLIENTE JÁ CADASTRADO -->
                <div style="position: relative; margin-bottom: 14px;">
                  <div style="position: relative; display: flex; align-items: center;">
                    <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 12px; color: #38bdf8; font-size: 0.85rem;"></i>
                    <input type="text" id="modal-quick-search-client" class="form-input" placeholder="🔍 Cliente já cadastrado? Busque por Nome, CPF ou Telefone para preencher..." autocomplete="off" style="padding: 9px 12px 9px 34px; font-size: 0.82rem; background: rgba(15, 23, 42, 0.85); border-color: rgba(56, 189, 248, 0.4); color: #ffffff; width: 100%; box-sizing: border-box; border-radius: 8px;">
                  </div>
                  <div id="modal-client-search-results" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: #0f172a; border: 1.5px solid #38bdf8; border-radius: 8px; z-index: 1050; max-height: 220px; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.8); margin-top: 4px;"></div>
                </div>

                <div class="form-group" style="margin-bottom: 12px; position: relative;">
                  <label class="form-label" for="fullName" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">* Nome Completo do Cliente:</label>
                  <input type="text" id="fullName" class="form-input" placeholder="Nome completo do cliente" autocomplete="off" style="padding: 10px 14px;">
                  <div id="fullname-client-search-results" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: #0f172a; border: 1.5px solid #38bdf8; border-radius: 8px; z-index: 1050; max-height: 220px; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.8); margin-top: 4px;"></div>
                </div>
                
                <div class="form-row" style="display: grid; grid-template-columns: 1.1fr 1fr; gap: 12px; margin-bottom: 12px;">
                  <div class="form-group">
                    <label class="form-label" for="cpf" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">* CPF:</label>
                    <input type="text" id="cpf" class="form-input" placeholder="000.000.000-00" inputmode="numeric" style="padding: 10px 14px;">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="birthDate" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">* Data de Nascimento:</label>
                    <input type="date" id="birthDate" class="form-input" style="padding: 9px 12px; min-width: 140px;">
                  </div>
                </div>

                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 12px; margin-bottom: 12px;">
                  <div class="form-group">
                    <label class="form-label" for="gender" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">Sexo / Gênero:</label>
                    <select id="gender" class="form-input" style="padding: 10px 12px;">
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Não Informado">Não Informado</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="cellphone" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: flex; align-items: center; gap: 6px;">
                      <i class="fa-brands fa-whatsapp" style="color: #22c55e;"></i> * Celular / WhatsApp:
                    </label>
                    <input type="text" id="cellphone" class="form-input" placeholder="(18) 98888-7777" style="padding: 10px 14px;">
                  </div>
                </div>

                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 12px;">
                  <div class="form-group">
                    <label class="form-label" for="phone" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">Telefone Fixo / Recado:</label>
                    <input type="text" id="phone" class="form-input" placeholder="(11) 3333-4444" style="padding: 10px 14px;">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="email" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">E-mail (DSF Digital):</label>
                    <input type="text" id="email" class="form-input" placeholder="cliente@email.com" style="padding: 10px 14px;">
                  </div>
                </div>
              </div>

              <!-- 2. ENDEREÇO & ENTREGA (DELIVERY) -->
              <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px 20px;">
                <div style="font-size: 0.82rem; font-weight: 800; color: #a78bfa; text-transform: uppercase; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid fa-truck-fast"></i> 2. Endereço &amp; Delivery / Entrega
                </div>

                <div class="form-row" style="display: grid; grid-template-columns: 150px 1fr; gap: 12px; margin-bottom: 12px;">
                  <div class="form-group">
                    <label class="form-label" for="cep" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">CEP (Auto):</label>
                    <div style="position: relative; display: flex; align-items: center;">
                      <input type="text" id="cep" class="form-input" placeholder="00000-000" inputmode="numeric" maxlength="9" style="padding: 10px 34px 10px 12px;">
                      <button type="button" id="btn-search-cep" title="Buscar Endereço pelo CEP" style="position: absolute; right: 8px; background: transparent; border: none; color: #818cf8; cursor: pointer; font-size: 0.95rem; padding: 4px;">
                        <i class="fa-solid fa-magnifying-glass" id="cep-search-icon"></i>
                        <i class="fa-solid fa-spinner fa-spin" id="cep-loading-icon" style="display: none;"></i>
                      </button>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="address" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">Logradouro (Rua / Av):</label>
                    <input type="text" id="address" class="form-input" placeholder="Ex: Av. Paulista" style="padding: 10px 14px;">
                  </div>
                </div>
                
                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                  <div class="form-group">
                    <label class="form-label" for="number" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">Número / Compl.:</label>
                    <input type="text" id="number" class="form-input" placeholder="Ex: 1000 / Ap 42" style="padding: 10px 12px;">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="neighborhood" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">Bairro:</label>
                    <input type="text" id="neighborhood" class="form-input" placeholder="Ex: Bela Vista" style="padding: 10px 12px;">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="city" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">Cidade / UF:</label>
                    <input type="text" id="city" class="form-input" placeholder="Ex: São Paulo - SP" style="padding: 10px 12px;">
                  </div>
                </div>
              </div>

              <!-- 3. RESPONSÁVEL LEGAL / CUIDADOR -->
              <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px 20px;">
                <div style="font-size: 0.82rem; font-weight: 800; color: #f59e0b; text-transform: uppercase; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid fa-users"></i> 3. Responsável Legal / Cuidador
                </div>

                <div id="responsible-alert-badge" style="display: none; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); color: #fbbf24; border-radius: 8px; padding: 8px 12px; font-size: 0.78rem; margin-bottom: 12px;">
                  <i class="fa-solid fa-circle-info"></i> Obrigatório para clientes menores de 18 anos ou dependentes.
                </div>

                <div class="form-row" style="display: grid; grid-template-columns: 1.8fr 1fr; gap: 12px; margin-bottom: 12px;">
                  <div class="form-group">
                    <label class="form-label" for="responsibleName" id="lbl-responsibleName" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">Nome do Responsável / Cuidador:</label>
                    <input type="text" id="responsibleName" class="form-input" placeholder="Nome completo do responsável" style="padding: 10px 14px;">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="responsibleCpf" id="lbl-responsibleCpf" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">CPF:</label>
                    <input type="text" id="responsibleCpf" class="form-input" placeholder="000.000.000-00" inputmode="numeric" style="padding: 10px 14px;">
                  </div>
                </div>

                <div class="form-row" style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 12px;">
                  <div class="form-group">
                    <label class="form-label" for="responsiblePhone" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">Telefone / WhatsApp:</label>
                    <input type="text" id="responsiblePhone" class="form-input" placeholder="(11) 99999-0000" style="padding: 10px 14px;">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="responsibleRelationship" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">Grau de Parentesco:</label>
                    <select id="responsibleRelationship" class="form-input" style="padding: 10px 12px;">
                      <option value="Pai/Mãe">Pai / Mãe</option>
                      <option value="Cônjuge">Cônjuge / Esposo(a)</option>
                      <option value="Filho(a)">Filho(a) / Cuidador(a)</option>
                      <option value="Tutor(a)">Tutor(a) Legal</option>
                      <option value="Outro">Outro Parentesco</option>
                    </select>
                  </div>
                </div>
              </div>

            </div> <!-- Fim Coluna 1 -->
            
            <!-- COLUNA 2: QUEIXA CLÍNICA (NOVA VISITA) & HISTÓRICO FARMACOTERAPÊUTICO -->
            <div style="display: flex; flex-direction: column; gap: 16px; overflow-y: auto; padding-right: 10px; max-height: 68vh;" class="custom-scrollbar">
              
              <!-- 4. QUEIXA RELATADA PELO CLIENTE NA VISITA & SINTOMAS (PARA INDICAÇÃO DE RECEITUÁRIO) -->
              <div style="background: linear-gradient(135deg, rgba(13, 148, 136, 0.22), rgba(15, 23, 42, 0.96)); border: 1.5px solid rgba(20, 184, 166, 0.55); border-radius: 14px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <div style="font-size: 0.84rem; font-weight: 800; color: #2dd4bf; text-transform: uppercase; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
                  <span style="display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-notes-medical"></i> 4. Queixa da Visita &amp; Indicação Medicamentosa
                  </span>
                  <span style="background: rgba(20, 184, 166, 0.2); color: #2dd4bf; border: 1px solid #14b8a6; padding: 3px 10px; border-radius: 10px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.5px;">
                    CRM BALCÃO
                  </span>
                </div>

                <!-- LINHA DA DATA E PROTOCOLO COM ESPAÇO ADEQUADO PARA O SELETOR DE DATA -->
                <div class="form-row" style="display: grid; grid-template-columns: 165px 1fr; gap: 14px; margin-bottom: 14px; align-items: start;">
                  <div class="form-group">
                    <label class="form-label" for="visitDate" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block; white-space: nowrap;">Data da Ida à Farmácia:</label>
                    <input type="date" id="visitDate" class="form-input" value="${new Date().toISOString().split('T')[0]}" style="padding: 9px 12px; width: 100%; box-sizing: border-box; font-size: 0.88rem; font-weight: 600;">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="complaintProtocol" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">* Queixa Principal / Protocolo:</label>
                    <select id="complaintProtocol" class="form-input" style="font-weight: 600; color: #f8fafc; border-color: #14b8a6; padding: 10px 12px; width: 100%;">
                      <option value="auto" selected>✨ Identificar Automaticamente pelo Relato do Cliente</option>
                      <option value="gripe_resfriado">🤧 Gripe, Resfriado &amp; Coriza</option>
                      <option value="tosse">🗣️ Tosse (Seca ou com Catarro / Produtiva)</option>
                      <option value="cefaleia">🤕 Dor de Cabeça / Cefaleia / Enxaqueca</option>
                      <option value="dor_muscular">💪 Dor Muscular / Lombalgia / Pancada</option>
                      <option value="colica">🩸 Cólicas Menstruais / Espasmos Abdominais</option>
                      <option value="azia">🔥 Azia, Queimação &amp; Má Digestão / Refluxo</option>
                      <option value="rinite">🌾 Rinite Alérgica, Espirros &amp; Prurido</option>
                      <option value="garganta">🧣 Dor de Garganta &amp; Inflamação</option>
                      <option value="diarreia">💧 Diarreia &amp; Desidratação Leve</option>
                      <option value="constipacao">🌿 Constipação / Prisão de Ventre</option>
                      <option value="apenas_cadastro">📋 Apenas Cadastro (Sem Queixa no Momento)</option>
                      <option value="outra_queixa">💬 Outro Relato Específico do Cliente</option>
                    </select>
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label" for="customComplaintNotes" style="color: #f8fafc; font-weight: 700; display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                    <span style="display: flex; align-items: center; gap: 6px; font-size: 0.84rem;">
                      <i class="fa-solid fa-comment-dots" style="color: #38bdf8;"></i> Relato do Cliente sobre o que está sentindo:
                    </span>
                    <span style="font-size: 0.74rem; color: #2dd4bf; font-weight: 600;">
                      <i class="fa-solid fa-wand-magic-sparkles"></i> O sistema detecta o sintoma ao digitar
                    </span>
                  </label>
                  <textarea id="customComplaintNotes" class="form-input" rows="3" placeholder="Ex: Cliente relata que está com dor de cabeça forte há 2 dias, piora com claridade..." style="resize: vertical; font-size: 0.86rem; line-height: 1.45; width: 100%; border-color: rgba(56, 189, 248, 0.4); padding: 10px 14px; min-height: 80px;"></textarea>
                  
                  <div id="symptom-detection-badge" style="display: none; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 8px; padding: 8px 14px; margin-top: 8px; font-size: 0.8rem; color: #38bdf8; align-items: center; justify-content: space-between;">
                    <span><i class="fa-solid fa-wand-magic-sparkles"></i> <strong>Sintoma Detectado:</strong> <span id="detected-symptom-label" style="font-weight: 700; color: #fff;"></span></span>
                    <span style="font-size: 0.74rem; color: #34d399; font-weight: 700;">✓ Indicação farmacêutica sincronizada</span>
                  </div>

                  <!-- CAIXA DE PRÉVIA DE MEDICAMENTOS SUGERIDOS PARA A QUEIXA -->
                  <div id="live-med-suggestions-box" style="display: none; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(20, 184, 166, 0.35); border-radius: 10px; padding: 12px 14px; margin-top: 10px; animation: fadeIn 0.2s ease;">
                    <div style="font-size: 0.76rem; font-weight: 800; color: #2dd4bf; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
                      <span><i class="fa-solid fa-capsules"></i> Sugestões Medicamentosas Imediatas (MIPs):</span>
                      <span style="font-size: 0.7rem; color: #94a3b8; font-weight: normal;">CDSS 4D Ativo</span>
                    </div>
                    <div id="live-med-suggestions-list" style="display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.78rem;"></div>
                  </div>
                </div>

                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 0.84rem;">
                  <div class="form-group">
                    <label class="form-label" for="symptomDuration" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">Tempo de Início:</label>
                    <select id="symptomDuration" class="form-input" style="padding: 10px 12px;">
                      <option value="1">Começou hoje (menos de 24h)</option>
                      <option value="2" selected>Há 1 a 2 dias</option>
                      <option value="4">Há 3 a 5 dias</option>
                      <option value="7">Mais de 1 semana</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="symptomSeverity" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">Gravidade:</label>
                    <select id="symptomSeverity" class="form-input" style="padding: 10px 12px;">
                      <option value="Leve">Leve</option>
                      <option value="Leve a Moderado" selected>Moderada</option>
                      <option value="Intensa">Intensa</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- 5. PERFIL FARMACOTERAPÊUTICO & SEGURANÇA (CDSS 4D) -->
              <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px 20px;">
                <div style="font-size: 0.82rem; font-weight: 800; color: #10b981; text-transform: uppercase; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid fa-shield-halved"></i> 5. Histórico Clínico &amp; Convênio PBM (CDSS 4D)
                </div>

                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                  <div class="form-group">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                      <label class="form-label" for="healthPlan" style="margin-bottom: 0; font-size: 0.82rem; font-weight: 600;">Programa / Convênio PBM:</label>
                      <button type="button" id="btn-quick-plus-pbm" title="Adicionar Novo Convênio/PBM" style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-size: 0.74rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="fa-solid fa-plus"></i> Novo
                      </button>
                    </div>
                    <div style="display: flex; gap: 8px;">
                      <select id="healthPlan" class="form-input" style="flex: 1; padding: 10px 12px;">
                        <option value="Particular">Particular (Sem Convênio)</option>
                        <option value="Farmácia Popular">Farmácia Popular do Brasil</option>
                        <option value="Funcional Card">Funcional Card (PBM)</option>
                        <option value="Vidalink">Vidalink (PBM)</option>
                        <option value="Epharma">Epharma (PBM)</option>
                        <option value="Orizon">Orizon (PBM)</option>
                        <option value="Convênio Empresa">Convênio Empresa / Parceiro</option>
                        ${(JSON.parse(localStorage.getItem('crm_custom_pbms') || '[]')).map(p => `<option value="${p}">${p}</option>`).join('')}
                        <option value="Outro PBM">Outro Convênio</option>
                      </select>
                      <button type="button" id="btn-plus-icon-pbm" title="Adicionar Convênio/PBM" style="width: 42px; height: 42px; border-radius: 8px; background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i class="fa-solid fa-plus"></i>
                      </button>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="cardNumber" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 6px; display: block;">Nº Cartão / Matrícula PBM:</label>
                    <input type="text" id="cardNumber" class="form-input" placeholder="0000 0000 0000" style="padding: 10px 14px;">
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label" for="allergies" style="color: #f87171; font-weight: 700; font-size: 0.82rem; margin-bottom: 5px; display: block;">
                    <i class="fa-solid fa-triangle-exclamation"></i> Alergias Medicamentosas Conhecidas:
                  </label>
                  <input type="text" id="allergies" class="form-input" placeholder="Ex: Dipirona, Penicilina, AAS, Anti-inflamatórios (AINEs), Sulfa..." style="border-color: rgba(239, 68, 68, 0.4); padding: 10px 14px;">
                </div>

                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label" for="chronicConditions" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">
                    <i class="fa-solid fa-heart-pulse" style="color: #38bdf8;"></i> Condições Crônicas / Comorbidades:
                  </label>
                  <input type="text" id="chronicConditions" class="form-input" placeholder="Ex: Hipertensão, Diabetes Tipo 2, Gastrite/Úlcera, Asma, Doença Renal, Gestante..." style="padding: 10px 14px;">
                </div>

                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label" for="continuousMedications" style="font-size: 0.82rem; font-weight: 600; margin-bottom: 5px; display: block;">
                    <i class="fa-solid fa-pills" style="color: #a78bfa;"></i> Medicamentos de Uso Contínuo:
                  </label>
                  <input type="text" id="continuousMedications" class="form-input" placeholder="Ex: Losartana 50mg, Metformina 850mg, AAS 100mg..." style="padding: 10px 14px;">
                </div>

                <!-- SEÇÃO EXCLUSIVA DE SINAIS VITAIS & PARÂMETROS CLÍNICOS DA VISITA -->
                <div style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed rgba(255,255,255,0.12);">
                  <div style="font-size: 0.78rem; font-weight: 800; color: #38bdf8; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                    <span><i class="fa-solid fa-heart-pulse"></i> Sinais Vitais &amp; Aferições Clínicas da Visita</span>
                    <span style="font-size: 0.68rem; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); padding: 2px 8px; border-radius: 6px;">CFF Res. 585/586</span>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                    <!-- 1. Pressão Arterial (PA) -->
                    <div class="form-group">
                      <label class="form-label" for="vitalBloodPressure" style="font-size: 0.76rem; font-weight: 700; color: #cbd5e1; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                        <i class="fa-solid fa-heart" style="color: #f87171;"></i> Pressão (PA):
                      </label>
                      <input type="text" id="vitalBloodPressure" class="form-input" placeholder="120/80 mmHg" style="padding: 8px 10px; font-size: 0.84rem; font-family: monospace;">
                      <div id="vital-pa-badge" style="display: none; font-size: 0.68rem; font-weight: 700; margin-top: 4px; border-radius: 4px; padding: 2px 6px; text-align: center;"></div>
                    </div>

                    <!-- 2. Batimento Cardíaco / Frequência Cardíaca (FC) -->
                    <div class="form-group">
                      <label class="form-label" for="vitalHeartRate" style="font-size: 0.76rem; font-weight: 700; color: #cbd5e1; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                        <i class="fa-solid fa-wave-square" style="color: #38bdf8;"></i> Batimentos (FC):
                      </label>
                      <input type="text" id="vitalHeartRate" class="form-input" placeholder="75 bpm" inputmode="numeric" style="padding: 8px 10px; font-size: 0.84rem; font-family: monospace;">
                    </div>

                    <!-- 3. Saturação de Oxigênio (SpO2) -->
                    <div class="form-group">
                      <label class="form-label" for="vitalSpO2" style="font-size: 0.76rem; font-weight: 700; color: #cbd5e1; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                        <i class="fa-solid fa-lungs" style="color: #a78bfa;"></i> Saturação (SpO₂):
                      </label>
                      <input type="text" id="vitalSpO2" class="form-input" placeholder="98 %" inputmode="numeric" style="padding: 8px 10px; font-size: 0.84rem; font-family: monospace;">
                    </div>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                    <!-- 4. Glicemia Capilar -->
                    <div class="form-group">
                      <label class="form-label" for="vitalBloodGlucose" style="font-size: 0.76rem; font-weight: 700; color: #cbd5e1; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                        <i class="fa-solid fa-droplet" style="color: #fbbf24;"></i> Glicemia Capilar:
                      </label>
                      <input type="text" id="vitalBloodGlucose" class="form-input" placeholder="95 mg/dL" inputmode="numeric" style="padding: 8px 10px; font-size: 0.84rem; font-family: monospace;">
                    </div>

                    <!-- 5. Temperatura -->
                    <div class="form-group">
                      <label class="form-label" for="vitalTemperature" style="font-size: 0.76rem; font-weight: 700; color: #cbd5e1; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                        <i class="fa-solid fa-temperature-half" style="color: #f97316;"></i> Temperatura:
                      </label>
                      <input type="text" id="vitalTemperature" class="form-input" placeholder="36.5 °C" style="padding: 8px 10px; font-size: 0.84rem; font-family: monospace;">
                    </div>

                    <!-- 6. Peso / IMC -->
                    <div class="form-group">
                      <label class="form-label" for="vitalWeight" style="font-size: 0.76rem; font-weight: 700; color: #cbd5e1; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                        <i class="fa-solid fa-weight-scale" style="color: #34d399;"></i> Peso / IMC:
                      </label>
                      <input type="text" id="vitalWeight" class="form-input" placeholder="72.5 kg" style="padding: 8px 10px; font-size: 0.84rem; font-family: monospace;">
                    </div>
                  </div>
                </div>
              </div>

            </div> <!-- Fim Coluna 2 -->
          </div> <!-- Fim grid duas colunas -->

          <!-- RODAPÉ DE AÇÕES DO MODAL -->
          <div style="display: flex; gap: 14px; margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap;">
            <button type="button" id="submit-and-start-consultation-btn" onclick="window.savePatientForm && window.savePatientForm(true)" class="btn" style="flex: 1.5; min-width: 260px; background: linear-gradient(135deg, #0d9488, #0f766e); color: #ffffff; border: 1px solid #2dd4bf; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4); border-radius: 10px; padding: 12px 20px; font-size: 0.88rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <i class="fa-solid fa-prescription-bottle-medical"></i> Salvar e Indicar Medicamentos (Receituário)
            </button>
            <button type="button" id="submit-btn" onclick="window.savePatientForm && window.savePatientForm(false)" class="btn btn-primary" style="flex: 1; min-width: 150px; padding: 12px 20px; font-weight: 700; border-radius: 10px; font-size: 0.88rem;">
              <i class="fa-solid fa-floppy-disk"></i> Salvar Apenas Cadastro
            </button>
            <button type="button" id="cancel-edit-btn" class="btn" style="background-color: var(--bg-tertiary); color: var(--text-primary); flex: 0.5; min-width: 100px; border-radius: 10px; padding: 12px 18px; font-size: 0.88rem;">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (typeof window.applyInputMasks === 'function') window.applyInputMasks();

  let allPatients = [];

  const renderTableRows = (patientsToRender) => {
    const wrapper = document.getElementById('patients-table-wrapper');
    if (!wrapper) return;
    
    if (patientsToRender.length === 0) {
      wrapper.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 40px;">Nenhum cliente cadastrado encontrado.</div>`;
      return;
    }

    let tableHtml = `
      <table class="patients-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome do Cliente</th>
            <th>CPF</th>
            <th>Data Nasc.</th>
            <th>Cidade</th>
            <th>WhatsApp / Contato</th>
            <th>PBM / Convênio</th>
            <th style="text-align: right;">Ações Rápidas</th>
          </tr>
        </thead>
        <tbody>
    `;

    patientsToRender.forEach(p => {
      let formattedDate = p.birthDate;
      if (p.birthDate && p.birthDate.includes('-')) {
        const [y, m, d] = p.birthDate.split('-');
        formattedDate = `${d}/${m}/${y}`;
      }
      
      const phones = [p.cellphone, p.phone].filter(Boolean).join(' / ');
      const hasAllergies = Boolean(p.allergies && p.allergies.trim().length > 0);
      
      tableHtml += `
        <tr>
          <td style="font-family: monospace; font-weight: 600; color: #10b981;">${p.id}</td>
          <td style="font-weight: 600; color: #f8fafc;">
            ${p.fullName || p.name}
            ${hasAllergies ? `<span style="display: block; font-size: 0.72rem; color: #f87171; font-weight: 700;"><i class="fa-solid fa-triangle-exclamation"></i> Alergias: ${p.allergies}</span>` : ''}
          </td>
          <td style="font-family: monospace; font-size: 0.88rem;">${p.cpf || '-'}</td>
          <td>${formattedDate || '-'}</td>
          <td>${p.city || '-'}</td>
          <td style="font-size: 0.85rem; color: #38bdf8;"><i class="fa-brands fa-whatsapp" style="color: #22c55e;"></i> ${phones || '-'}</td>
          <td>
            <span style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
              ${p.healthPlan || 'Particular'}
            </span>
          </td>
          <td>
            <div class="actions-cell">
              <button class="btn-icon" onclick="window.startNewPharmacyConsultationForClient('${p.id}', '${(p.fullName||p.name||'').replace(/'/g, "\\'")}')" style="color: #34d399; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3);" title="Atender / Registrar Queixa no Balcão">
                <i class="fa-solid fa-stethoscope"></i>
              </button>
              <button class="btn-icon btn-icon-vaccine" data-vac-id="${p.id}" data-vac-name="${(p.fullName||p.name||'').replace(/'/g, "\\'")}" data-vac-cpf="${p.cpf || ''}" data-vac-phone="${p.cellphone || p.phone || ''}" style="color: #10b981; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3);" title="Aplicar Vacina / Injetável (CFF Res. 654)">
                <i class="fa-solid fa-syringe"></i>
              </button>
              <button class="btn-icon btn-icon-portal" data-portal-id="${p.id}" style="color: #38bdf8; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3);" title="Abrir Portal Minha Saúde (Visão do Paciente PWA)">
                <i class="fa-solid fa-mobile-screen-button"></i>
              </button>
              <button class="btn-icon btn-icon-purchases" onclick="window.openPatientPurchasesModal('${p.id}', '${(p.fullName||p.name||'').replace(/'/g, "\\'")}')" style="color: #34d399; background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.45);" title="Ver Histórico de Compras & Previsão de Recompra (Refill)">
                <i class="fa-solid fa-cart-shopping"></i>
              </button>
              <button class="btn-icon btn-icon-history" onclick="window.openPatientHistoryModal('${p.id}', '${(p.fullName||p.name||'').replace(/'/g, "\\'")}')" title="Ver Prontuário Completo & Histórico Clínico">
                <i class="fa-solid fa-timeline"></i>
              </button>
              <button class="btn-icon btn-icon-pdf" onclick="window.generatePatientPDF('${p.id}', '${(p.fullName||p.name||'').replace(/'/g, "\\'")}')" title="Gerar Ficha & Prontuário do Cliente em PDF">
                <i class="fa-solid fa-file-pdf"></i>
              </button>
              <button class="btn-icon btn-icon-edit" 
                data-edit-id="${p.id}" 
                data-full-name="${p.fullName || p.name || ''}" 
                data-cpf="${p.cpf || ''}" 
                data-birth-date="${p.birthDate || ''}"
                data-gender="${p.gender || 'Não Informado'}"
                data-health-plan="${p.healthPlan || 'Particular'}"
                data-card-number="${p.cardNumber || ''}"
                data-allergies="${p.allergies || ''}"
                data-chronic-conditions="${p.chronicConditions || ''}"
                data-continuous-medications="${p.continuousMedications || ''}"
                data-responsible-name="${p.responsibleName || ''}"
                data-responsible-cpf="${p.responsibleCpf || ''}"
                data-responsible-phone="${p.responsiblePhone || ''}"
                data-responsible-relationship="${p.responsibleRelationship || 'Pai/Mãe'}"
                data-cep="${p.cep || ''}"
                data-address="${p.address || ''}"
                data-number="${p.number || ''}"
                data-neighborhood="${p.neighborhood || ''}"
                data-city="${p.city || ''}"
                data-phone="${p.phone || ''}"
                data-blood-pressure="${p.bloodPressure || (p.vitalSigns && p.vitalSigns.bloodPressure) || ''}"
                data-heart-rate="${p.heartRate || (p.vitalSigns && p.vitalSigns.heartRate) || ''}"
                data-oxygen-saturation="${p.oxygenSaturation || (p.vitalSigns && p.vitalSigns.oxygenSaturation) || ''}"
                data-blood-glucose="${p.bloodGlucose || (p.vitalSigns && p.vitalSigns.bloodGlucose) || ''}"
                data-temperature="${p.temperature || (p.vitalSigns && p.vitalSigns.temperature) || ''}"
                data-weight="${p.weight || (p.vitalSigns && p.vitalSigns.weight) || ''}"
                title="Alterar / Editar Dados do Cliente">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn-icon btn-icon-delete" data-delete-id="${p.id}" title="Excluir Cliente">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tableHtml += `</tbody></table>`;
    wrapper.innerHTML = tableHtml;

    // Vincular botões de edição
    document.querySelectorAll('.btn-icon-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('editId').value = btn.getAttribute('data-edit-id');
        document.getElementById('fullName').value = btn.getAttribute('data-full-name');
        document.getElementById('cpf').value = btn.getAttribute('data-cpf');
        document.getElementById('birthDate').value = btn.getAttribute('data-birth-date');
        
        if (document.getElementById('gender')) document.getElementById('gender').value = btn.getAttribute('data-gender') || 'Não Informado';
        if (document.getElementById('healthPlan')) document.getElementById('healthPlan').value = btn.getAttribute('data-health-plan') || 'Particular';
        if (document.getElementById('cardNumber')) document.getElementById('cardNumber').value = btn.getAttribute('data-card-number') || '';
        if (document.getElementById('allergies')) document.getElementById('allergies').value = btn.getAttribute('data-allergies') || '';
        if (document.getElementById('chronicConditions')) document.getElementById('chronicConditions').value = btn.getAttribute('data-chronic-conditions') || '';
        if (document.getElementById('continuousMedications')) document.getElementById('continuousMedications').value = btn.getAttribute('data-continuous-medications') || '';

        // Sinais Vitais
        if (document.getElementById('vitalBloodPressure')) document.getElementById('vitalBloodPressure').value = btn.getAttribute('data-blood-pressure') || '';
        if (document.getElementById('vitalHeartRate')) document.getElementById('vitalHeartRate').value = btn.getAttribute('data-heart-rate') || '';
        if (document.getElementById('vitalSpO2')) document.getElementById('vitalSpO2').value = btn.getAttribute('data-oxygen-saturation') || '';
        if (document.getElementById('vitalBloodGlucose')) document.getElementById('vitalBloodGlucose').value = btn.getAttribute('data-blood-glucose') || '';
        if (document.getElementById('vitalTemperature')) document.getElementById('vitalTemperature').value = btn.getAttribute('data-temperature') || '';
        if (document.getElementById('vitalWeight')) document.getElementById('vitalWeight').value = btn.getAttribute('data-weight') || '';

        if (document.getElementById('responsibleName')) document.getElementById('responsibleName').value = btn.getAttribute('data-responsible-name') || '';
        if (document.getElementById('responsibleCpf')) document.getElementById('responsibleCpf').value = btn.getAttribute('data-responsible-cpf') || '';
        if (document.getElementById('responsiblePhone')) document.getElementById('responsiblePhone').value = btn.getAttribute('data-responsible-phone') || '';
        if (document.getElementById('responsibleRelationship')) document.getElementById('responsibleRelationship').value = btn.getAttribute('data-responsible-relationship') || 'Pai/Mãe';

        const cepEl = document.getElementById('cep');
        if (cepEl) cepEl.value = btn.getAttribute('data-cep') || '';
        document.getElementById('address').value = btn.getAttribute('data-address') || '';
        const numEl = document.getElementById('number');
        if (numEl) numEl.value = btn.getAttribute('data-number') || '';
        const neighEl = document.getElementById('neighborhood');
        if (neighEl) neighEl.value = btn.getAttribute('data-neighborhood') || '';
        document.getElementById('city').value = btn.getAttribute('data-city') || '';
        document.getElementById('phone').value = btn.getAttribute('data-phone') || '';
        document.getElementById('cellphone').value = btn.getAttribute('data-cellphone') || '';
        if (document.getElementById('email')) document.getElementById('email').value = btn.getAttribute('data-email') || '';

        document.getElementById('form-title').innerHTML = '<i class="fa-solid fa-pen-to-square" style="color: #10b981;"></i> Editar Dados do Cliente';
        document.getElementById('submit-btn').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Alterações';

        checkAgeValidation();

        const modalOverlay = document.getElementById('patient-modal-overlay');
        if (modalOverlay) modalOverlay.style.display = 'flex';
      });
    });

    // Vincular botões de exclusão
    document.querySelectorAll('.btn-icon-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const perms = getRolePermissions(state.user);
        if (!perms.canDeleteRecords) {
          showCustomAlert({
            title: 'Acesso Restrito',
            message: `Seu perfil (<strong>${perms.label}</strong>) não possui permissão para excluir registros de clientes. Apenas Administradores e Master podem realizar esta operação.`,
            type: 'warning'
          });
          return;
        }

        const id = btn.getAttribute('data-delete-id');
        const confirmed = await showCustomConfirm({
          title: 'Excluir Cliente',
          message: 'Tem certeza de que deseja excluir este cliente do sistema?',
          confirmText: 'Sim, Excluir',
          cancelText: 'Cancelar',
          type: 'danger'
        });

        if (confirmed) {
          try {
            const deleteRes = await apiFetch(`/api/patients/${id}`, { method: 'DELETE' });
            if (deleteRes.ok) {
              showToast('✓ Cliente excluído com sucesso.');
              loadAndRenderTable();
              if (document.getElementById('editId').value === id) {
                resetForm();
              }
            } else {
              showCustomAlert({ title: 'Erro', message: 'Erro ao excluir cliente.', type: 'danger' });
            }
          } catch (err) {
            showCustomAlert({ title: 'Erro', message: 'Erro ao conectar-se à API.', type: 'danger' });
          }
        }
      });
    });

    // Vincular botões de vacinação direta do paciente
    document.querySelectorAll('.btn-icon-vaccine').forEach(btn => {
      btn.addEventListener('click', () => {
        const patientData = {
          id: btn.getAttribute('data-vac-id'),
          name: btn.getAttribute('data-vac-name'),
          cpf: btn.getAttribute('data-vac-cpf'),
          phone: btn.getAttribute('data-vac-phone')
        };
        openVaccinationModal(patientData);
      });
    });

    // Vincular botões do Portal do Paciente
    document.querySelectorAll('.btn-icon-portal').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-portal-id');
        const p = (patientsToRender || []).find(pt => pt.id === id);
        openPatientPortalModal(p);
      });
    });
  };

  const vacHeaderBtn = document.getElementById('btn-quick-vaccine-header');
  if (vacHeaderBtn) {
    vacHeaderBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const currentPatients = [
        ...(localDB.list('pharmacy_patients') || []),
        ...(localDB.list('patients') || [])
      ];
      const targetPatient = state.activePatient || (allPatients && allPatients[0]) || currentPatients[0];
      if (targetPatient) {
        openVaccinationModal(targetPatient.id, targetPatient.fullName || targetPatient.name, targetPatient.cpf || '', targetPatient.cellphone || targetPatient.phone || '');
      } else {
        openVaccinationModal();
      }
    };
  }

  const portalHeaderBtn = document.getElementById('btn-quick-portal-header');
  if (portalHeaderBtn) {
    portalHeaderBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const currentPatients = [
        ...(localDB.list('pharmacy_patients') || []),
        ...(localDB.list('patients') || [])
      ];
      const targetPatient = state.activePatient || (allPatients && allPatients[0]) || currentPatients[0];
      openPatientPortalModal(targetPatient);
    };
  }

  const purchasesHeaderBtn = document.getElementById('btn-quick-purchases-header');
  if (purchasesHeaderBtn) {
    purchasesHeaderBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById('btn-new-patient')?.click();
    };
  }

  // Ação de cadastrar novo Programa / Convênio PBM
  const handleAddNewPBM = () => {
    const newPBM = prompt('Digite o nome do novo Programa / Convênio PBM (Ex.: Convênio Unimed, Cartão de Todos, Mediservice):');
    if (!newPBM || !newPBM.trim()) return;
    const cleanPBM = newPBM.trim();
    const currentPBMs = JSON.parse(localStorage.getItem('crm_custom_pbms') || '[]');
    if (!currentPBMs.includes(cleanPBM)) {
      currentPBMs.push(cleanPBM);
      localStorage.setItem('crm_custom_pbms', JSON.stringify(currentPBMs));
    }
    const selectEl = document.getElementById('healthPlan');
    if (selectEl) {
      const opt = document.createElement('option');
      opt.value = cleanPBM;
      opt.textContent = `⭐ ${cleanPBM}`;
      opt.selected = true;
      selectEl.appendChild(opt);
    }
    showToast(`✅ Convênio/PBM "${cleanPBM}" adicionado e selecionado!`);
  };

  document.getElementById('btn-quick-plus-pbm')?.addEventListener('click', handleAddNewPBM);
  document.getElementById('btn-plus-icon-pbm')?.addEventListener('click', handleAddNewPBM);

  const checkAgeValidation = () => {
    const birthVal = document.getElementById('birthDate')?.value;
    if (!birthVal) return;
    const birth = new Date(birthVal + 'T12:00:00');
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    const alertBadge = document.getElementById('responsible-alert-badge');
    const respName = document.getElementById('responsibleName');
    const respCpf = document.getElementById('responsibleCpf');
    const lblName = document.getElementById('lbl-responsibleName');
    const lblCpf = document.getElementById('lbl-responsibleCpf');

    if (age < 18) {
      if (alertBadge) {
        alertBadge.style.display = 'block';
        alertBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <strong>Idade (${age} anos):</strong> Menor de 18 anos. Informe os dados do Responsável Legal / Cuidador.`;
      }
      if (respName) respName.required = true;
      if (respCpf) respCpf.required = true;
      if (lblName) lblName.textContent = '* Nome do Responsável (Obrigatório):';
      if (lblCpf) lblCpf.textContent = '* CPF Responsável (Obrigatório):';
    } else {
      if (alertBadge) alertBadge.style.display = 'none';
      if (respName) respName.required = false;
      if (respCpf) respCpf.required = false;
      if (lblName) lblName.textContent = 'Nome do Responsável / Cuidador:';
      if (lblCpf) lblCpf.textContent = 'CPF:';
    }
  };

  const birthInput = document.getElementById('birthDate');
  if (birthInput) {
    birthInput.addEventListener('change', checkAgeValidation);
    birthInput.addEventListener('input', checkAgeValidation);
  }

  const cepInput = document.getElementById('cep');
  const btnSearchCep = document.getElementById('btn-search-cep');
  let lastSearchedCep = '';

  const executeCepLookup = async () => {
    if (!cepInput) return;
    let rawVal = cepInput.value || '';
    let cleanVal = rawVal.replace(/\D/g, '');
    if (cleanVal.length > 8) cleanVal = cleanVal.substring(0, 8);

    if (cleanVal.length > 5) {
      cepInput.value = cleanVal.substring(0, 5) + '-' + cleanVal.substring(5);
    } else {
      cepInput.value = cleanVal;
    }

    if (cleanVal.length !== 8) return;
    if (cleanVal === lastSearchedCep) return;
    lastSearchedCep = cleanVal;

    const searchIcon = document.getElementById('cep-search-icon');
    const loadingIcon = document.getElementById('cep-loading-icon');
    if (searchIcon) searchIcon.style.display = 'none';
    if (loadingIcon) loadingIcon.style.display = 'inline-block';

    try {
      let foundData = null;

      // 1. ViaCEP
      try {
        const r1 = await fetch(`https://viacep.com.br/ws/${cleanVal}/json/`);
        if (r1.ok) {
          const d1 = await r1.json();
          if (!d1.erro && d1.localidade) {
            foundData = {
              street: d1.logradouro || '',
              neighborhood: d1.bairro || '',
              city: `${d1.localidade} - ${d1.uf}`
            };
          }
        }
      } catch (e) {}

      // 2. BrasilAPI
      if (!foundData) {
        try {
          const r2 = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanVal}`);
          if (r2.ok) {
            const d2 = await r2.json();
            if (d2.city) {
              foundData = {
                street: d2.street || '',
                neighborhood: d2.neighborhood || '',
                city: `${d2.city} - ${d2.state}`
              };
            }
          }
        } catch (e) {}
      }

      if (foundData) {
        const addressInput = document.getElementById('address');
        const neighborhoodInput = document.getElementById('neighborhood');
        const cityInput = document.getElementById('city');
        const numberInput = document.getElementById('number');

        if (addressInput && foundData.street) addressInput.value = foundData.street;
        if (neighborhoodInput && foundData.neighborhood) neighborhoodInput.value = foundData.neighborhood;
        if (cityInput && foundData.city) cityInput.value = foundData.city;

        showToast(`✓ Endereço localizado: ${foundData.city}`);
        if (numberInput) numberInput.focus();
      }
    } catch (err) {
      console.error('Erro na busca de CEP:', err);
    } finally {
      if (searchIcon) searchIcon.style.display = 'inline-block';
      if (loadingIcon) loadingIcon.style.display = 'none';
    }
  };

  if (cepInput) {
    cepInput.addEventListener('input', executeCepLookup);
    cepInput.addEventListener('change', executeCepLookup);
    cepInput.addEventListener('blur', executeCepLookup);
  }
  if (btnSearchCep) {
    btnSearchCep.addEventListener('click', () => {
      lastSearchedCep = '';
      executeCepLookup();
    });
  }

  const loadAndRenderTable = async () => {
    try {
      const result = await cachedApiGet(`/api/patients`, 'patients');
      allPatients = Array.isArray(result) ? result : (result.data || []);
      renderTableRows(allPatients);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      const wrapper = document.getElementById('patients-table-wrapper');
      if (wrapper) wrapper.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 40px;">Erro ao carregar dados de clientes.</div>`;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 🧠 MOTOR DE PLN (PROCESSAMENTO DE LINGUAGEM NATURAL) & CDSS 4D EM TEMPO REAL
  // ─────────────────────────────────────────────────────────────────────────────

  const detectAllSymptomsNLP = (text = '') => {
    if (!text || typeof text !== 'string') return [];
    const clean = removeAccents(text.toLowerCase());
    const detected = [];

    if (/cabeca|cefaleia|enxaqueca|latej|frontal|nuca|têmpora/.test(clean)) {
      detected.push({ key: 'cefaleia', label: 'Dor de Cabeça / Cefaleia', icon: 'fa-brain', badgeColor: '#38bdf8' });
    }
    if (/febre|febril|37s*graus|38s*graus|39s*graus|quente|pirexia|calafrio/.test(clean)) {
      detected.push({ key: 'febre', label: 'Febre / Estado Febril', icon: 'fa-temperature-high', badgeColor: '#f97316' });
    }
    if (/sonolencia|sono|cansaco|letargia|indisposicao|fraqueza|moleza|fadiga/.test(clean)) {
      detected.push({ key: 'fadiga', label: 'Sonolência / Fadiga', icon: 'fa-bed', badgeColor: '#a78bfa' });
    }
    if (/tosse|toss|catarro|expectora|secrecao|peito chiando/.test(clean)) {
      detected.push({ key: 'tosse', label: 'Tosse (Seca ou Produtiva)', icon: 'fa-head-side-cough', badgeColor: '#34d399' });
    }
    if (/gripe|resfriad|coriza|espirr|nariz entupido|congestao/.test(clean)) {
      detected.push({ key: 'gripe_resfriado', label: 'Gripe, Resfriado & Coriza', icon: 'fa-head-side-virus', badgeColor: '#2dd4bf' });
    }
    if (/garganta|engolir|amigdal|rouqu/.test(clean)) {
      detected.push({ key: 'garganta', label: 'Dor de Garganta & Inflamação', icon: 'fa-head-side', badgeColor: '#fb7185' });
    }
    if (/estomago|azia|queima|refluxo|gastrite|pesad|estuf|indigest|digestao/.test(clean)) {
      detected.push({ key: 'azia', label: 'Azia & Queimação Gástrica', icon: 'fa-fire-flame-curved', badgeColor: '#f43f5e' });
    }
    if (/colica|menstru|espasmo|uter/.test(clean)) {
      detected.push({ key: 'colica', label: 'Cólicas & Espasmos', icon: 'fa-heart-pulse', badgeColor: '#ec4899' });
    }
    if (/muscul|costas|lombar|torcicol|trav|dor no corpo|pancada|articulacao/.test(clean)) {
      detected.push({ key: 'dor_muscular', label: 'Dor Muscular / Lombalgia', icon: 'fa-person-falling', badgeColor: '#fbbf24' });
    }
    if (/rinite|alerg|coceira|prurid/.test(clean)) {
      detected.push({ key: 'rinite', label: 'Rinite Alérgica & Prurido', icon: 'fa-wind', badgeColor: '#22d3ee' });
    }
    if (/diarreia|desarranjo|evacuacao|solto/.test(clean)) {
      detected.push({ key: 'diarreia', label: 'Diarreia & Desidratação', icon: 'fa-droplet', badgeColor: '#38bdf8' });
    }
    if (/prisao|constipa|preso|ressec/.test(clean)) {
      detected.push({ key: 'constipacao', label: 'Constipação / Prisão de Ventre', icon: 'fa-seedling', badgeColor: '#4ade80' });
    }

    return detected;
  };

  const COMPLAINT_SUGGESTED_MEDS = {
    cefaleia: [
      { name: 'Dipirona 1g', substance: 'dipirona', class: 'analgesico', lab: 'Medley / EMS / Neo Química', pos: '1 cp 6/6h se dor' },
      { name: 'Paracetamol 750mg + Cafeína 65mg', substance: 'paracetamol', class: 'analgesico', lab: 'Sanofi / Eurofarma', pos: '1 cp 6/6h (máx 4 cp/dia)' },
      { name: 'Ibuprofeno 400mg', substance: 'ibuprofeno', class: 'aine', lab: 'Cimed / Aché', pos: '1 cp 8/8h após refeição' }
    ],
    gripe_resfriado: [
      { name: 'Paracetamol 750mg', substance: 'paracetamol', class: 'analgesico', lab: 'Sanofi / Eurofarma', pos: '1 cp 6/6h se febre/dor' },
      { name: 'Dipirona 500mg', substance: 'dipirona', class: 'analgesico', lab: 'Medley / EMS', pos: '1 cp 6/6h se febre/dor' },
      { name: 'Clorfeniramina + Paracetamol', substance: 'paracetamol', class: 'antigripal', lab: 'Hypera / Neo Química', pos: '1 cp 8/8h' },
      { name: 'Soro Fisiológico 0,9% (Nasal)', substance: 'cloreto_sodio', class: 'topico', lab: 'Biolab / Cimed', pos: '3 a 5x ao dia' }
    ],
    tosse: [
      { name: 'Acetilcisteína 600mg', substance: 'acetilcisteina', class: 'mucolitico', lab: 'Zambon / EMS / Eurofarma', pos: '1 sachê 1x ao dia à noite' },
      { name: 'Dropropizina Xarope 3mg/ml', substance: 'dropropizina', class: 'antitussigeno', lab: 'Aché / Neo Química', pos: '10ml 8/8h se tosse seca' },
      { name: 'Guaifenesina 100mg/5ml', substance: 'guaifenesina', class: 'expectorante', lab: 'Cimed / Medley', pos: '10ml 6/6h' }
    ],
    azia: [
      { name: 'Hidróxido de Alumínio + Magnésio', substance: 'hidroxido_aluminio', class: 'antiacido', lab: 'Sanofi / EMS', pos: '10ml ou 1 mastigável 1h após refeições' },
      { name: 'Simeticona 125mg', substance: 'simeticona', class: 'antiflatulento', lab: 'Medley / Eurofarma', pos: '1 cápsula após refeições' },
      { name: 'Carbonato de Cálcio', substance: 'carbonato_calcio', class: 'antiacido', lab: 'Bayer / Hypera', pos: '1 a 2 comp mastigáveis se queimação' }
    ],
    colica: [
      { name: 'Butilbrometo de Escopolamina + Dipirona', substance: 'dipirona', class: 'antiespasmodico', lab: 'Boehringer Ingelheim / EMS', pos: '1 cp 8/8h se dor espasmódica' },
      { name: 'Hioscina 10mg', substance: 'hioscina', class: 'antiespasmodico', lab: 'Sanofi / Medley', pos: '1 cp 8/8h' }
    ],
    dor_muscular: [
      { name: 'Dipirona 1g', substance: 'dipirona', class: 'analgesico', lab: 'Medley / EMS', pos: '1 cp 6/6h' },
      { name: 'Ciclobenzaprina 5mg', substance: 'ciclobenzaprina', class: 'relaxante_muscular', lab: 'Aché / Eurofarma', pos: '1 cp à noite' },
      { name: 'Diclofenaco Dietilamônio Gel', substance: 'diclofenaco', class: 'aine', lab: 'Novartis / Cimed', pos: 'Aplicar 3x ao dia no local' }
    ],
    rinite: [
      { name: 'Loratadina 10mg', substance: 'loratadina', class: 'anti_histaminico', lab: 'EMS / Medley / Eurofarma', pos: '1 cp 1x ao dia' },
      { name: 'Desloratadina 5mg', substance: 'desloratadina', class: 'anti_histaminico', lab: 'Sanofi / Aché', pos: '1 cp 1x ao dia' },
      { name: 'Soro Fisiológico 0,9% Spray', substance: 'cloreto_sodio', class: 'topico', lab: 'Biolab / Cimed', pos: 'Aplicar nas narinas 3x ao dia' }
    ],
    garganta: [
      { name: 'Benzocaína + Tirotricina Pastilhas', substance: 'benzocaina', class: 'anestesico_topico', lab: 'Sanofi / Hypera', pos: '1 pastilha a cada 2 a 3h (máx 6/dia)' },
      { name: 'Flurbiprofeno 8,75mg Pastilha', substance: 'flurbiprofeno', class: 'aine', lab: 'Reckitt / EMS', pos: '1 pastilha a cada 3 a 6h' },
      { name: 'Dipirona 500mg', substance: 'dipirona', class: 'analgesico', lab: 'Medley / Neo Química', pos: '1 cp 6/6h' }
    ],
    diarreia: [
      { name: 'Sais para Reidratação Oral (SRO)', substance: 'sro', class: 'reidratante', lab: 'Cimed / EMS', pos: 'Dissolver em 1L de água e beber livremente' },
      { name: 'Saccharomyces boulardii (Probiótico)', substance: 'probiotico', class: 'probiotico', lab: 'Biolab / Aché', pos: '1 a 2 cápsulas ao dia' }
    ],
    constipacao: [
      { name: 'Lactulose 667mg/ml', substance: 'lactulose', class: 'laxativo_osmotico', lab: 'Eurofarma / Abbott', pos: '15 a 30ml ao dia' },
      { name: 'Psyllium / Fibras', substance: 'psyllium', class: 'fitoterapico', lab: 'Hypera / Sanofi', pos: '1 envelope diluído em água pela manhã' }
    ]
  };

  // Avaliação de Regras de Segurança CDSS 4D (Alergias + Interações + Comorbidades)
  const evaluateLiveCDSS = (med, allergiesText = '', conditionsText = '', contMedsText = '') => {
    const cleanAllergies = removeAccents(allergiesText.toLowerCase());
    const cleanConditions = removeAccents(conditionsText.toLowerCase());
    const cleanContMeds = removeAccents(contMedsText.toLowerCase());

    const result = {
      isBlocked: false,
      hasWarning: false,
      statusBadge: '',
      alertMessages: []
    };

    // 1. CHECAGEM DE ALERGIA
    if (cleanAllergies) {
      if (med.substance === 'dipirona' && /dipirona|pirazolona|novalgina|doralgina|anamador/.test(cleanAllergies)) {
        result.isBlocked = true;
        result.alertMessages.push('🚨 ALERGIA CRÍTICA: Cliente alérgico a Dipirona/Pirazolonas!');
      }
      if (med.substance === 'paracetamol' && /paracetamol|tylenol/.test(cleanAllergies)) {
        result.isBlocked = true;
        result.alertMessages.push('🚨 ALERGIA CRÍTICA: Cliente alérgico a Paracetamol!');
      }
      if (med.class === 'aine' && /aine|anti-inflamatorio|aspirina|aas|ibuprofeno|diclofenaco|cetoprofeno|nimesulida/.test(cleanAllergies)) {
        result.isBlocked = true;
        result.alertMessages.push('🚨 ALERGIA CRÍTICA: Cliente com alergia cruzada a Anti-inflamatórios (AINEs)!');
      }
    }

    // 2. CHECAGEM DE COMORBIDADES (DOENÇAS CRÔNICAS)
    if (cleanConditions && !result.isBlocked) {
      if (med.class === 'aine' && /hipertensao|pressao alta|cardiopatia|insuficiencia cardiaca/.test(cleanConditions)) {
        result.hasWarning = true;
        result.alertMessages.push('⚠️ ALERTA CDSS: AINE pode atenuar anti-hipertensivos e elevar a pressão arterial.');
      }
      if (med.class === 'aine' && /gastrite|ulcera|refluxo|sangramento digestivo/.test(cleanConditions)) {
        result.hasWarning = true;
        result.alertMessages.push('⚠️ ALERTA CDSS: AINE irrita a mucosa gástrica e agrava gastrite/úlcera.');
      }
      if (med.class === 'aine' && /renal|rim|creatinina|doenca renal|drc/.test(cleanConditions)) {
        result.isBlocked = true;
        result.alertMessages.push('🚨 CONTRAINDICAÇÃO: AINEs contraindicados em insuficiência renal.');
      }
      if (med.class === 'aine' && /asma|bronquite|broncoespasmo/.test(cleanConditions)) {
        result.hasWarning = true;
        result.alertMessages.push('⚠️ ALERTA: Risco de broncoespasmo induzido por AINEs em asmáticos.');
      }
    }

    // 3. CHECAGEM DE INTERAÇÕES MEDICAMENTOSAS
    if (cleanContMeds && !result.isBlocked) {
      if (med.class === 'aine' && /varfarina|marevan|xarelto|eliquis|clopidogrel|plavix|aas|aspirina/.test(cleanContMeds)) {
        result.isBlocked = true;
        result.alertMessages.push('🚨 INTERAÇÃO GRAVE: AINE + Anticoagulante/Antiagregante eleva exponencialmente o risco de hemorragia!');
      }
      if (med.substance === 'ciclobenzaprina' && /fluoxetina|sertralina|escitalopram|venlafaxina|paroxetina/.test(cleanContMeds)) {
        result.hasWarning = true;
        result.alertMessages.push('⚠️ ALERTA CDSS: Risco de Síndrome Serotoninérgica (Ciclobenzaprina + ISRS).');
      }
    }

    return result;
  };

  const recomputeLiveCDSSAndSuggestions = () => {
    const customNotesEl = document.getElementById('customComplaintNotes');
    const complaintSelectEl = document.getElementById('complaintProtocol');
    const detectionBadgeEl = document.getElementById('symptom-detection-badge');
    const detectedLabelEl = document.getElementById('detected-symptom-label');
    const box = document.getElementById('live-med-suggestions-box');
    const list = document.getElementById('live-med-suggestions-list');

    const allergiesVal = document.getElementById('allergies')?.value || '';
    const conditionsVal = document.getElementById('chronicConditions')?.value || '';
    const contMedsVal = document.getElementById('continuousMedications')?.value || '';

    const text = customNotesEl?.value.trim() || '';
    const allDetected = detectAllSymptomsNLP(text);

    // 1. Atualizar Badges de Sintomas Detectados por PLN
    if (allDetected.length > 0) {
      const primary = allDetected[0];
      if (complaintSelectEl && (complaintSelectEl.value === 'auto' || complaintSelectEl.getAttribute('data-user-locked') !== 'true')) {
        complaintSelectEl.value = primary.key;
      }
      if (detectionBadgeEl && detectedLabelEl) {
        detectedLabelEl.innerHTML = allDetected.map(s => `
          <span style="background: rgba(255,255,255,0.12); color: ${s.badgeColor}; border: 1px solid ${s.badgeColor}; padding: 2px 7px; border-radius: 6px; font-size: 0.72rem; margin-right: 4px; display: inline-flex; align-items: center; gap: 4px;">
            <i class="fa-solid ${s.icon}"></i> ${s.label}
          </span>
        `).join('');
        detectionBadgeEl.style.display = 'flex';
      }
    } else if (!text) {
      if (complaintSelectEl && complaintSelectEl.getAttribute('data-user-locked') !== 'true') {
        complaintSelectEl.value = 'auto';
      }
      if (detectionBadgeEl) detectionBadgeEl.style.display = 'none';
    }

    // 2. Resolver chave de protocolo ativa
    let activeKey = complaintSelectEl?.value || 'auto';
    if (activeKey === 'auto') {
      activeKey = allDetected.length > 0 ? allDetected[0].key : null;
    }

    // 3. Renderizar Medicamentos com Alertas CDSS em Tempo Real
    if (box && list) {
      const meds = COMPLAINT_SUGGESTED_MEDS[activeKey];
      if (meds && meds.length > 0) {
        const allAlerts = [];

        list.innerHTML = meds.map(m => {
          const evalRes = evaluateLiveCDSS(m, allergiesVal, conditionsVal, contMedsVal);
          if (evalRes.alertMessages.length > 0) {
            allAlerts.push(...evalRes.alertMessages);
          }

          let borderStyle = 'rgba(20, 184, 166, 0.4)';
          let bgStyle = 'rgba(30, 41, 59, 0.8)';
          let badgeTag = `<span style="color: #34d399; font-size: 0.68rem; font-weight: 700; background: rgba(16, 185, 129, 0.15); padding: 1px 6px; border-radius: 4px;">✓ Compatível</span>`;

          if (evalRes.isBlocked) {
            borderStyle = '#ef4444';
            bgStyle = 'rgba(239, 68, 68, 0.15)';
            badgeTag = `<span style="color: #fca5a5; font-size: 0.68rem; font-weight: 700; background: rgba(239, 68, 68, 0.25); border: 1px solid #ef4444; padding: 1px 6px; border-radius: 4px;"><i class="fa-solid fa-ban"></i> BLOQUEADO</span>`;
          } else if (evalRes.hasWarning) {
            borderStyle = '#f59e0b';
            bgStyle = 'rgba(245, 158, 11, 0.15)';
            badgeTag = `<span style="color: #fbbf24; font-size: 0.68rem; font-weight: 700; background: rgba(245, 158, 11, 0.25); border: 1px solid #f59e0b; padding: 1px 6px; border-radius: 4px;"><i class="fa-solid fa-triangle-exclamation"></i> ALERTA CDSS</span>`;
          }

          return `
            <div style="background: ${bgStyle}; border: 1px solid ${borderStyle}; border-radius: 8px; padding: 6px 10px; color: #f8fafc; display: flex; flex-direction: column; gap: 3px; min-width: 220px; flex: 1;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 700; color: #f8fafc; font-size: 0.82rem;">💊 ${m.name}</span>
                ${badgeTag}
              </div>
              <div style="color: #94a3b8; font-size: 0.7rem;">${m.lab} &bull; ${m.pos}</div>
            </div>
          `;
        }).join('');

        // Se houver alertas gerados pelo CDSS, adicionar o painel de alerta no topo do card
        if (allAlerts.length > 0) {
          const uniqueAlerts = Array.from(new Set(allAlerts));
          const alertsHtml = uniqueAlerts.map(a => `
            <div style="background: rgba(239, 68, 68, 0.15); border-left: 3px solid #ef4444; padding: 5px 10px; border-radius: 4px; font-size: 0.74rem; color: #fca5a5; margin-bottom: 4px; font-weight: 600;">
              ${a}
            </div>
          `).join('');

          list.innerHTML = `<div style="width: 100%; margin-bottom: 6px;">${alertsHtml}</div>` + list.innerHTML;
        }

        box.style.display = 'block';
      } else {
        box.style.display = 'none';
      }
    }
  };

  // Vincular eventos de digitação em tempo real em todas as variáveis clínicas
  ['customComplaintNotes', 'allergies', 'chronicConditions', 'continuousMedications'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', recomputeLiveCDSSAndSuggestions);
      el.addEventListener('change', recomputeLiveCDSSAndSuggestions);
    }
  });

  const paInputEl = document.getElementById('vitalBloodPressure');
  if (paInputEl) {
    const updatePaClassification = () => {
      const val = (paInputEl.value || '').trim();
      const badge = document.getElementById('vital-pa-badge');
      if (!badge) return;
      if (!val || !val.includes('/')) {
        badge.style.display = 'none';
        return;
      }
      const parts = val.replace(/[^0-9/]/g, '').split('/');
      if (parts.length === 2 && parts[0] && parts[1]) {
        const sys = parseInt(parts[0], 10);
        const dia = parseInt(parts[1], 10);
        if (!isNaN(sys) && !isNaN(dia)) {
          badge.style.display = 'block';
          if (sys >= 180 || dia >= 120) {
            badge.style.background = 'rgba(239, 68, 68, 0.25)';
            badge.style.color = '#fca5a5';
            badge.style.border = '1px solid #ef4444';
            badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 🚨 Crise Hipertensiva (Urgência)';
          } else if (sys >= 140 || dia >= 90) {
            badge.style.background = 'rgba(249, 115, 22, 0.25)';
            badge.style.color = '#fdba74';
            badge.style.border = '1px solid #f97316';
            badge.innerHTML = '⚠️ Hipertensão Estágio 2';
          } else if (sys >= 130 || dia >= 80) {
            badge.style.background = 'rgba(234, 179, 8, 0.25)';
            badge.style.color = '#fef08a';
            badge.style.border = '1px solid #eab308';
            badge.innerHTML = '⚠️ Hipertensão Estágio 1';
          } else if (sys >= 120 && dia < 80) {
            badge.style.background = 'rgba(56, 189, 248, 0.2)';
            badge.style.color = '#bae6fd';
            badge.style.border = '1px solid #38bdf8';
            badge.innerHTML = 'ℹ️ Pressão Elevada / Pré-HTA';
          } else if (sys < 90 || dia < 60) {
            badge.style.background = 'rgba(168, 85, 247, 0.2)';
            badge.style.color = '#e9d5ff';
            badge.style.border = '1px solid #a855f7';
            badge.innerHTML = 'ℹ️ Hipotensão Arterial';
          } else {
            badge.style.background = 'rgba(16, 185, 129, 0.2)';
            badge.style.color = '#86efac';
            badge.style.border = '1px solid #10b981';
            badge.innerHTML = '✓ Pressão Ótima / Normal';
          }
        }
      }
    };
    paInputEl.addEventListener('input', updatePaClassification);
    paInputEl.addEventListener('change', updatePaClassification);
  }

  const complaintSelectEl = document.getElementById('complaintProtocol');
  if (complaintSelectEl) {
    complaintSelectEl.addEventListener('change', () => {
      if (complaintSelectEl.value !== 'auto') {
        complaintSelectEl.setAttribute('data-user-locked', 'true');
      } else {
        complaintSelectEl.removeAttribute('data-user-locked');
      }
      recomputeLiveCDSSAndSuggestions();
    });
  }

  const resetForm = () => {
    document.getElementById('patient-form').reset();
    document.getElementById('editId').value = "";
    document.getElementById('form-title').innerHTML = '<i class="fa-solid fa-user-plus" style="color: #10b981;"></i> Cadastro do Cliente &amp; Registro da Queixa para Indicação Medicamentosa';
    document.getElementById('submit-btn').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Apenas Cadastro';
    const alertBadge = document.getElementById('responsible-alert-badge');
    if (alertBadge) alertBadge.style.display = 'none';
    const detectionBadgeEl = document.getElementById('symptom-detection-badge');
    if (detectionBadgeEl) detectionBadgeEl.style.display = 'none';
    const medBox = document.getElementById('live-med-suggestions-box');
    if (medBox) medBox.style.display = 'none';
    if (complaintSelectEl) {
      complaintSelectEl.value = 'auto';
      complaintSelectEl.removeAttribute('data-user-locked');
    }

    // Limpar campos de sinais vitais
    ['vitalBloodPressure', 'vitalHeartRate', 'vitalSpO2', 'vitalBloodGlucose', 'vitalTemperature', 'vitalWeight'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    
    const modalOverlay = document.getElementById('patient-modal-overlay');
    if (modalOverlay) modalOverlay.style.display = 'none';
  };

  // Preenche dados do paciente no formulário mantendo a seção de queixa/indicação limpa para nova visita
  const populatePatientIntoForm = (p) => {
    if (!p) return;
    document.getElementById('editId').value = p.id || '';
    document.getElementById('fullName').value = p.fullName || p.name || '';
    document.getElementById('cpf').value = p.cpf || '';
    document.getElementById('birthDate').value = p.birthDate || '';
    
    if (document.getElementById('gender')) document.getElementById('gender').value = p.gender || 'Não Informado';
    if (document.getElementById('healthPlan')) document.getElementById('healthPlan').value = p.healthPlan || 'Particular';
    if (document.getElementById('cardNumber')) document.getElementById('cardNumber').value = p.cardNumber || '';
    if (document.getElementById('allergies')) document.getElementById('allergies').value = p.allergies || '';
    if (document.getElementById('chronicConditions')) document.getElementById('chronicConditions').value = p.chronicConditions || '';
    if (document.getElementById('continuousMedications')) document.getElementById('continuousMedications').value = p.continuousMedications || '';

    // Sinais Vitais
    if (document.getElementById('vitalBloodPressure')) document.getElementById('vitalBloodPressure').value = p.bloodPressure || (p.vitalSigns && p.vitalSigns.bloodPressure) || '';
    if (document.getElementById('vitalHeartRate')) document.getElementById('vitalHeartRate').value = p.heartRate || (p.vitalSigns && p.vitalSigns.heartRate) || '';
    if (document.getElementById('vitalSpO2')) document.getElementById('vitalSpO2').value = p.oxygenSaturation || (p.vitalSigns && p.vitalSigns.oxygenSaturation) || '';
    if (document.getElementById('vitalBloodGlucose')) document.getElementById('vitalBloodGlucose').value = p.bloodGlucose || (p.vitalSigns && p.vitalSigns.bloodGlucose) || '';
    if (document.getElementById('vitalTemperature')) document.getElementById('vitalTemperature').value = p.temperature || (p.vitalSigns && p.vitalSigns.temperature) || '';
    if (document.getElementById('vitalWeight')) document.getElementById('vitalWeight').value = p.weight || (p.vitalSigns && p.vitalSigns.weight) || '';

    if (document.getElementById('responsibleName')) document.getElementById('responsibleName').value = p.responsibleName || '';
    if (document.getElementById('responsibleCpf')) document.getElementById('responsibleCpf').value = p.responsibleCpf || '';
    if (document.getElementById('responsiblePhone')) document.getElementById('responsiblePhone').value = p.responsiblePhone || '';
    if (document.getElementById('responsibleRelationship')) document.getElementById('responsibleRelationship').value = p.responsibleRelationship || 'Pai/Mãe';

    const cepEl = document.getElementById('cep');
    if (cepEl) cepEl.value = p.cep || '';
    document.getElementById('address').value = p.address || '';
    const numEl = document.getElementById('number');
    if (numEl) numEl.value = p.number || '';
    const neighEl = document.getElementById('neighborhood');
    if (neighEl) neighEl.value = p.neighborhood || '';
    document.getElementById('city').value = p.city || '';
    document.getElementById('phone').value = p.phone || '';
    document.getElementById('cellphone').value = p.cellphone || '';
    if (document.getElementById('email')) document.getElementById('email').value = p.email || '';

    document.getElementById('form-title').innerHTML = `<i class="fa-solid fa-notes-medical" style="color: #10b981;"></i> Atendimento &amp; Queixa — <span style="color: #38bdf8;">${p.fullName || p.name}</span>`;
    document.getElementById('submit-btn').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar / Atualizar Cadastro';

    checkAgeValidation();

    const quickInput = document.getElementById('modal-quick-search-client');
    if (quickInput) quickInput.value = '';
    const resBox = document.getElementById('modal-client-search-results');
    if (resBox) resBox.style.display = 'none';

    showToast(`✓ Cliente "${p.fullName || p.name}" carregado. Preencha a queixa ou indicação.`);
    document.getElementById('customComplaintNotes')?.focus();
  };

  // Obtém todos os registros pesquisáveis do sistema com desduplicação inteligente por Nome e CPF
  const getAllSearchableClients = () => {
    const rawList = [
      ...(allPatients || []),
      ...(localDB.list('pharmacy_patients') || []),
      ...(localDB.list('patients') || [])
    ];

    const uniqueClientsMap = new Map();

    for (const item of rawList) {
      if (!item) continue;
      const rawName = (item.fullName || item.name || '').trim();
      if (!rawName) continue;

      // Normaliza o nome removendo a tag [SIMULADO] e acentos para agrupar duplicatas
      const normName = removeAccents(rawName.replace(/\[simulado\]/gi, '').trim().toLowerCase());
      const cleanCpf = (item.cpf || '').replace(/\D/g, '');

      // Chave primária de desduplicação: CPF quando válido ou Nome normalizado
      const primaryKey = (cleanCpf && cleanCpf.length === 11) ? `cpf:${cleanCpf}` : `name:${normName}`;

      if (!uniqueClientsMap.has(primaryKey)) {
        uniqueClientsMap.set(primaryKey, item);
      } else {
        // Se já existe o mesmo cliente, prioriza o cadastro real (sem [SIMULADO]) ou o com mais informações
        const existing = uniqueClientsMap.get(primaryKey);
        const isCurrentSimulated = (item.fullName || item.name || '').includes('[SIMULADO]');
        const isExistingSimulated = (existing.fullName || existing.name || '').includes('[SIMULADO]');

        if (isExistingSimulated && !isCurrentSimulated) {
          uniqueClientsMap.set(primaryKey, item);
        } else if ((item.cellphone || item.phone) && !(existing.cellphone || existing.phone)) {
          uniqueClientsMap.set(primaryKey, { ...existing, ...item });
        }
      }
    }

    return Array.from(uniqueClientsMap.values());
  };

  // Motor de busca inteligente por palavras, iniciais, CPF ou telefone
  const searchClientsEngine = (rawQuery) => {
    if (!rawQuery || typeof rawQuery !== 'string') return [];
    const q = removeAccents(rawQuery.trim().toLowerCase());
    if (q.length < 2) return [];

    const digitsOnly = q.replace(/\D/g, '');
    const searchWords = q.split(/\s+/).filter(w => w.length > 0);

    const allClients = getAllSearchableClients();

    return allClients.filter(p => {
      const pName = removeAccents((p.fullName || p.name || '').toLowerCase());
      const pCpfDigits = (p.cpf || '').replace(/\D/g, '');
      const pPhoneDigits = (p.cellphone || p.phone || '').replace(/\D/g, '');
      const pCity = removeAccents((p.city || '').toLowerCase());

      // 1. Busca por números (CPF ou Telefone) se o usuário digitou dígitos
      if (digitsOnly.length >= 2) {
        if (pCpfDigits.includes(digitsOnly) || pPhoneDigits.includes(digitsOnly)) {
          return true;
        }
      }

      // 2. Busca textual por palavras (Todas as palavras digitadas devem estar presentes no nome ou cidade)
      if (searchWords.length > 0) {
        const allWordsInName = searchWords.every(w => pName.includes(w));
        if (allWordsInName) return true;

        const allWordsInInfo = searchWords.every(w => pName.includes(w) || pCity.includes(w));
        if (allWordsInInfo) return true;
      }

      return false;
    }).slice(0, 8);
  };

  // Renderiza os resultados da busca no dropdown
  const renderClientSearchResults = (matches, targetContainer, originalQuery) => {
    if (!targetContainer) return;

    if (matches.length === 0) {
      targetContainer.innerHTML = `
        <div style="padding: 12px 14px; font-size: 0.82rem; color: #94a3b8; text-align: center;">
          <i class="fa-solid fa-user-xmark" style="margin-right: 6px; color: #f87171;"></i>
          Nenhum cliente cadastrado encontrado com <strong>"${originalQuery}"</strong>.<br>
          <span style="font-size: 0.75rem; color: #38bdf8;">Preencha os campos abaixo para cadastrar um novo cliente.</span>
        </div>
      `;
      targetContainer.style.display = 'block';
      return;
    }

    targetContainer.innerHTML = matches.map(p => `
      <div class="modal-search-client-item" data-patient-id="${p.id}" style="padding: 11px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.15s;">
        <div>
          <div style="font-weight: 700; color: #f8fafc; font-size: 0.88rem; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-user" style="color: #2dd4bf; font-size: 0.78rem;"></i>
            ${p.fullName || p.name}
            ${p.role ? `<span style="font-size: 0.68rem; background: rgba(56,189,248,0.15); color: #38bdf8; padding: 1px 6px; border-radius: 4px;">${p.role}</span>` : ''}
          </div>
          <div style="font-size: 0.74rem; color: #94a3b8; display: flex; gap: 10px; margin-top: 3px;">
            <span>CPF: <strong>${p.cpf || 'Não inf.'}</strong></span>
            <span>•</span>
            <span>Tel: ${p.cellphone || p.phone || 'Não inf.'}</span>
            ${p.city ? `<span>•</span><span>${p.city}</span>` : ''}
          </div>
        </div>
        <span style="font-size: 0.72rem; background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid rgba(16,185,129,0.4); padding: 4px 10px; border-radius: 6px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
          <i class="fa-solid fa-check"></i> Selecionar
        </span>
      </div>
    `).join('');

    targetContainer.style.display = 'block';

    targetContainer.querySelectorAll('.modal-search-client-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(56, 189, 248, 0.15)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
      });
      item.addEventListener('click', () => {
        const pId = item.getAttribute('data-patient-id');
        const chosen = matches.find(m => String(m.id) === String(pId));
        if (chosen) {
          populatePatientIntoForm(chosen);
          targetContainer.style.display = 'none';
        }
      });
    });
  };

  // Busca rápida de cliente já cadastrado dentro do modal
  const modalSearchInput = document.getElementById('modal-quick-search-client');
  const modalSearchResults = document.getElementById('modal-client-search-results');
  const btnClearModalClient = document.getElementById('btn-modal-clear-client');

  if (btnClearModalClient) {
    btnClearModalClient.addEventListener('click', () => {
      resetForm();
      const modalOverlay = document.getElementById('patient-modal-overlay');
      if (modalOverlay) modalOverlay.style.display = 'flex';
      showToast('Formulário limpo para novo cliente.');
      document.getElementById('fullName')?.focus();
    });
  }

  if (modalSearchInput && modalSearchResults) {
    modalSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (q.length < 2) {
        modalSearchResults.innerHTML = '';
        modalSearchResults.style.display = 'none';
        return;
      }
      const matches = searchClientsEngine(q);
      renderClientSearchResults(matches, modalSearchResults, q);
    });

    document.addEventListener('click', (ev) => {
      if (!modalSearchInput.contains(ev.target) && !modalSearchResults.contains(ev.target)) {
        modalSearchResults.style.display = 'none';
      }
    });
  }

  // Busca e Autocomplete direto no campo de Nome Completo
  const fullNameInputEl = document.getElementById('fullName');
  const fullNameSearchResults = document.getElementById('fullname-client-search-results');

  if (fullNameInputEl && fullNameSearchResults) {
    fullNameInputEl.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      const isAlreadySelected = !!document.getElementById('editId')?.value;
      if (isAlreadySelected || q.length < 2) {
        fullNameSearchResults.innerHTML = '';
        fullNameSearchResults.style.display = 'none';
        return;
      }
      const matches = searchClientsEngine(q);
      renderClientSearchResults(matches, fullNameSearchResults, q);
    });

    document.addEventListener('click', (ev) => {
      if (!fullNameInputEl.contains(ev.target) && !fullNameSearchResults.contains(ev.target)) {
        fullNameSearchResults.style.display = 'none';
      }
    });
  }

  // Preenchimento automático ao digitar CPF completo no campo de CPF
  const cpfInputEl = document.getElementById('cpf');
  if (cpfInputEl) {
    cpfInputEl.addEventListener('blur', () => {
      const cleanCpf = (cpfInputEl.value || '').replace(/\D/g, '');
      if (cleanCpf.length === 11) {
        const editIdVal = document.getElementById('editId')?.value;
        if (!editIdVal) {
          const allRegistered = getAllSearchableClients();
          const found = allRegistered.find(p => (p.cpf || '').replace(/\D/g, '') === cleanCpf);
          if (found) {
            populatePatientIntoForm(found);
          }
        }
      }
    });
  }

  document.getElementById('cancel-edit-btn')?.addEventListener('click', resetForm);
  document.getElementById('btn-close-patient-modal')?.addEventListener('click', resetForm);
  document.getElementById('btn-new-patient')?.addEventListener('click', () => {
    resetForm();
    const modalOverlay = document.getElementById('patient-modal-overlay');
    if (modalOverlay) modalOverlay.style.display = 'flex';
    
    // Ativação das máscaras e motor de busca em tempo real
    if (typeof window.applyInputMasks === 'function') window.applyInputMasks();
    const allergiesInput = document.getElementById('allergies');
    const continuousMedInput = document.getElementById('continuousMedications');
    const chronicInput = document.getElementById('chronicConditions');
    if (allergiesInput) attachMedicationAutocomplete(allergiesInput, { multiValue: true });
    if (continuousMedInput) attachMedicationAutocomplete(continuousMedInput, { multiValue: true });
    if (chronicInput) attachMedicationAutocomplete(chronicInput, { multiValue: true });
    document.getElementById('modal-quick-search-client')?.focus();
  });

  document.getElementById('patients-trash-btn')?.addEventListener('click', () => {
    if (typeof window.showTrashModal === 'function') window.showTrashModal('patients');
  });

  document.getElementById('search-input')?.addEventListener('input', (e) => {
    const query = removeAccents(e.target.value.trim());
    const filtered = allPatients.filter(p => {
      return removeAccents(p.fullName || p.name || '').includes(query) ||
             removeAccents(p.cpf || '').includes(query) ||
             removeAccents(p.city || '').includes(query) ||
             removeAccents(p.healthPlan || '').includes(query) ||
             removeAccents(String(p.id)).includes(query);
    });
    renderTableRows(filtered);
  });

  // 💊 Inicialização de Autocomplete em Tempo Real nos campos clínicos
  setTimeout(() => {
    const allergiesInput = document.getElementById('allergies');
    const continuousMedInput = document.getElementById('continuousMedications');
    const chronicInput = document.getElementById('chronicConditions');
    
    if (allergiesInput) attachMedicationAutocomplete(allergiesInput, { multiValue: true });
    if (continuousMedInput) attachMedicationAutocomplete(continuousMedInput, { multiValue: true });
    if (chronicInput) attachMedicationAutocomplete(chronicInput, { multiValue: true });
  }, 100);

function detectComplaintFromNotes(notes = '') {
  if (!notes || typeof notes !== 'string') return null;
  const n = notes.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  if (/gripe|resfriad|coriz|moleza/.test(n)) return { key: 'gripe_resfriado' };
  if (/toss|catarr|pigarr|expectora/.test(n)) return { key: 'tosse' };
  if (/cabec|enxaquec|cefalei|latej/.test(n)) return { key: 'cefaleia' };
  if (/muscul|lombar|colun|costa|torcicol|pancad|ombro|múscul/.test(n)) return { key: 'dor_muscular' };
  if (/colic|menstrua|espasmo/.test(n)) return { key: 'colica' };
  if (/azi|queimac|reflux|estomag|digest|gastrit/.test(n)) return { key: 'azia' };
  if (/rinit|alerg|coceir|espirr/.test(n)) return { key: 'rinite' };
  if (/gargant|engol|amigdal|rouqu/.test(n)) return { key: 'garganta' };
  if (/diarrei|solto|desarranj|gastroenterit/.test(n)) return { key: 'diarreia' };
  if (/constipa|prisao de ventr|fezes dura|ressecad/.test(n)) return { key: 'constipacao' };
  
  return null;
}

  let shouldStartBalcaoConsultation = false;

  async function savePatientForm(isProceedingToConsultation = false) {
    const editId = document.getElementById('editId')?.value || '';
    const fullName = document.getElementById('fullName')?.value?.trim() || '';
    const cpf = document.getElementById('cpf')?.value?.trim() || '';
    const birthDate = document.getElementById('birthDate')?.value || '';
    const gender = document.getElementById('gender')?.value || 'Não Informado';
    const healthPlan = document.getElementById('healthPlan')?.value || 'Particular';
    const cardNumber = document.getElementById('cardNumber')?.value || '';
    const allergies = document.getElementById('allergies')?.value || '';
    const chronicConditions = document.getElementById('chronicConditions')?.value || '';
    const continuousMedications = document.getElementById('continuousMedications')?.value || '';

    // Sinais Vitais Aferidos na Visita
    const vitalBloodPressure = document.getElementById('vitalBloodPressure')?.value?.trim() || '';
    const vitalHeartRate = document.getElementById('vitalHeartRate')?.value?.trim() || '';
    const vitalSpO2 = document.getElementById('vitalSpO2')?.value?.trim() || '';
    const vitalBloodGlucose = document.getElementById('vitalBloodGlucose')?.value?.trim() || '';
    const vitalTemperature = document.getElementById('vitalTemperature')?.value?.trim() || '';
    const vitalWeight = document.getElementById('vitalWeight')?.value?.trim() || '';

    // Validações essenciais diretas
    if (!fullName) {
      showToast('⚠️ Por favor, informe o Nome Completo do cliente.', 'warning');
      document.getElementById('fullName')?.focus();
      return;
    }

    if (!cpf) {
      showToast('⚠️ Por favor, informe o CPF do cliente.', 'warning');
      document.getElementById('cpf')?.focus();
      return;
    }

    // Dados da Visita & Queixa
    const visitDate = document.getElementById('visitDate')?.value || new Date().toISOString().split('T')[0];
    let complaintProtocol = document.getElementById('complaintProtocol')?.value || 'auto';
    const customComplaintNotes = document.getElementById('customComplaintNotes')?.value || '';
    
    // Se o farmacêutico deixou como auto-identificação, resolve pelo texto digitado
    if (complaintProtocol === 'auto') {
      const detected = detectComplaintFromNotes(customComplaintNotes);
      complaintProtocol = detected ? detected.key : (customComplaintNotes.trim() ? 'outra_queixa' : 'apenas_cadastro');
    }

    const symptomDuration = document.getElementById('symptomDuration')?.value || '2';
    const symptomSeverity = document.getElementById('symptomSeverity')?.value || 'Moderada';

    const responsibleName = document.getElementById('responsibleName')?.value || '';
    const responsibleCpf = document.getElementById('responsibleCpf')?.value || '';
    const responsiblePhone = document.getElementById('responsiblePhone')?.value || '';
    const responsibleRelationship = document.getElementById('responsibleRelationship')?.value || 'Pai/Mãe';

    const cep = document.getElementById('cep')?.value || '';
    const address = document.getElementById('address')?.value || '';
    const number = document.getElementById('number')?.value || '';
    const neighborhood = document.getElementById('neighborhood')?.value || '';
    const city = document.getElementById('city')?.value || '';
    const phone = document.getElementById('phone')?.value || '';
    const cellphone = document.getElementById('cellphone')?.value || '';
    const email = document.getElementById('email')?.value || '';

    const isEdit = !!editId;
    const url = isEdit ? `/api/patients/${editId}` : `/api/patients`;
    const method = isEdit ? 'PUT' : 'POST';

    const submitButton = document.getElementById('submit-btn');
    const startConsultationBtn = document.getElementById('submit-and-start-consultation-btn');

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';
      }
      if (startConsultationBtn) {
        startConsultationBtn.disabled = true;
        startConsultationBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Abrindo Receituário...';
      }

      const payload = {
        fullName,
        name: fullName,
        cpf,
        birthDate: birthDate || '1990-01-01',
        gender,
        healthPlan,
        cardNumber,
        allergies,
        chronicConditions,
        continuousMedications,
        bloodPressure: vitalBloodPressure,
        heartRate: vitalHeartRate,
        oxygenSaturation: vitalSpO2,
        bloodGlucose: vitalBloodGlucose,
        temperature: vitalTemperature,
        weight: vitalWeight,
        vitalSigns: {
          bloodPressure: vitalBloodPressure,
          heartRate: vitalHeartRate,
          oxygenSaturation: vitalSpO2,
          bloodGlucose: vitalBloodGlucose,
          temperature: vitalTemperature,
          weight: vitalWeight,
          updated_at: new Date().toISOString()
        },
        responsibleName,
        responsibleCpf,
        responsiblePhone,
        responsibleRelationship,
        cep,
        address,
        number,
        neighborhood,
        city,
        phone,
        cellphone,
        email,
        lastComplaint: complaintProtocol !== 'apenas_cadastro' ? complaintProtocol : '',
        lastVisitDate: visitDate
      };

      let resOk = false;
      let data = {};
      try {
        const res = await apiFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        resOk = Boolean(res && res.ok);
        if (res && typeof res.json === 'function') {
          data = await res.json().catch(() => ({}));
        }
      } catch (errApi) {
        console.warn('API offline/local, usando armazenamento localDB:', errApi);
        resOk = true; // Permite fluxo offline contínuo
      }

      const savedPatientId = (data.data && data.data.id) || payload.id || editId || (typeof localDB !== 'undefined' ? localDB.generateId('PAT-PHARM') : `PAT-${Date.now()}`);
      payload.id = savedPatientId;

      // Salva/Atualiza paciente no localDB para acesso instantâneo na aba de farmácia
      try {
        if (typeof localDB !== 'undefined') {
          const existing = (localDB.list('pharmacy_patients') || []).find(p => String(p.id) === String(savedPatientId) || (p.cpf && p.cpf === cpf));
          if (existing) {
            localDB.update('pharmacy_patients', existing.id, payload);
          } else {
            localDB.insert('pharmacy_patients', payload);
          }
        }
      } catch (errLocal) {
        console.warn('Erro ao salvar no localDB:', errLocal);
      }

      // Registrar visita na base longitudinal de atendimento farmacêutico se houve queixa relatada
      if (complaintProtocol !== 'apenas_cadastro' || customComplaintNotes.trim()) {
        try {
          if (typeof localDB !== 'undefined' && localDB.insert) {
            localDB.insert('pharmacy_attendances', {
              id: localDB.generateId('ATT-PHARM'),
              patient_id: savedPatientId,
              patientId: savedPatientId,
              patient_name: fullName,
              patientName: fullName,
              data_hora: `${visitDate}T${new Date().toTimeString().slice(0,8)}`,
              tipo_visita: 'Atendimento Clínico & Balcão',
              queixa_triagem: complaintProtocol,
              observacoes: customComplaintNotes,
              symptom_duration: symptomDuration,
              symptom_severity: symptomSeverity,
              pharmacist_name: state.user ? state.user.name : 'Dr. Marcelo Mazaro',
              conduta_final: 'Triagem e Registro de Queixa para Indicação Medicamentosa'
            });
          }
        } catch (errAtt) {
          console.warn('Erro ao salvar attendance:', errAtt);
        }
      }

      // Fechar modal do paciente imediatamente
      const modalOverlay = document.getElementById('patient-modal-overlay');
      if (modalOverlay) modalOverlay.style.display = 'none';
      resetForm();

      try {
        dataCache.delete('patients');
        await loadAndRenderTable();
      } catch (e) {
        console.warn('Erro ao recarregar tabela:', e);
      }

      if (isProceedingToConsultation) {
        showToast(`✓ Cliente ${fullName} salvo com sucesso! Abrindo receituário e indicação...`, 'success');
        if (typeof window.startNewPharmacyConsultationForClient === 'function') {
          window.startNewPharmacyConsultationForClient(savedPatientId, fullName, complaintProtocol, customComplaintNotes, 3);
        } else if (typeof switchTab === 'function') {
          switchTab('farmacia');
        }
      } else {
        showToast(`✓ Cliente ${fullName} ${isEdit ? 'atualizado' : 'cadastrado'} com sucesso!`, 'success');
        if (typeof window.showFlowCompletionNotification === 'function') {
          window.showFlowCompletionNotification({
            flowType: 'completed',
            badgeText: isEdit ? 'CADASTRO DE CLIENTE ATUALIZADO' : 'NOVO CLIENTE CADASTRADO',
            badgeIcon: 'fa-circle-check',
            icon: 'fa-user-check',
            actionTitle: `👤 ${fullName}`,
            message: `Ficha cadastral salva com sucesso. Deseja iniciar o atendimento clínico ou aplicar vacina?`,
            targetTab: 'atendimento',
            targetTabLabel: 'Central de Atendimentos',
            actionButtonText: 'Ir p/ Atendimento >'
          });
        }
      }

      try {
        if (typeof syncManager !== 'undefined' && syncManager && typeof syncManager.pushToCloud === 'function') {
          syncManager.pushToCloud();
        }
      } catch (eSync) {}

    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      showToast('❌ Erro inesperado ao salvar cliente: ' + (error.message || 'Tente novamente.'), 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Apenas Cadastro';
      }
      if (startConsultationBtn) {
        startConsultationBtn.disabled = false;
        startConsultationBtn.innerHTML = '<i class="fa-solid fa-prescription-bottle-medical"></i> Salvar e Indicar Medicamentos (Receituário)';
      }
    }
  }

  window.savePatientForm = savePatientForm;

  document.getElementById('submit-and-start-consultation-btn')?.addEventListener('click', (ev) => {
    ev.preventDefault();
    savePatientForm(true);
  });

  document.getElementById('submit-btn')?.addEventListener('click', (ev) => {
    ev.preventDefault();
    savePatientForm(false);
  });

  document.getElementById('patient-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    savePatientForm(false);
  });

  loadAndRenderTable();
}

window.openFullPatientModal = function(patientData = null) {
  const modalOverlay = document.getElementById('patient-modal-overlay');
  if (!modalOverlay) {
    if (typeof window.switchTab === 'function') {
      window.switchTab('pacientes');
      setTimeout(() => {
        const overlay = document.getElementById('patient-modal-overlay');
        if (overlay) {
          overlay.style.display = 'flex';
          if (typeof window.applyInputMasks === 'function') window.applyInputMasks();
          document.getElementById('modal-quick-search-client')?.focus();
        }
      }, 180);
    }
    return;
  }

  modalOverlay.style.display = 'flex';
  if (typeof window.applyInputMasks === 'function') window.applyInputMasks();
  document.getElementById('modal-quick-search-client')?.focus();
};

window.renderPatientsTab = renderPatientsTab;
