// ==========================================================================
// 🌿 CRM CLÍNICO FARMACÊUTICO — MOTOR DE BUSCA & AUTOCOMPLETE DE MEDICAMENTOS EM TEMPO REAL
// Sincronizado com ANVISA / DCB, OpenFDA, Base Canônica Farmacêutica e Cache Local
// ==========================================================================

import { CANONICAL_MEDICATIONS_DB } from './medicationsDB.js';

let localCatalogCache = null;
const apiSearchCache = new Map();

/**
 * Carrega a base local de medicamentos (/assets/medicamentos.json)
 */
export async function loadLocalMedicationsCatalog() {
  if (localCatalogCache && localCatalogCache.length > 0) {
    return localCatalogCache;
  }
  try {
    const res = await fetch('/assets/medicamentos.json');
    if (res.ok) {
      const data = await res.json();
      localCatalogCache = data || [];
    } else {
      localCatalogCache = [];
    }
  } catch (err) {
    console.warn('[MedicationSearch] Erro ao carregar /assets/medicamentos.json:', err);
    localCatalogCache = [];
  }
  return localCatalogCache;
}

/**
 * Remove acentos e normaliza strings para busca insensível
 */
function normalizeString(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Busca de Medicamentos em Tempo Real
 * @param {string} query Termo digitado pelo usuário (ex: "amoxi", "dipirona", "losartana")
 * @param {object} options { limit: 12, includeRemote: true }
 */
export async function searchMedicationsRealtime(query, options = {}) {
  const q = normalizeString(query);
  if (!q || q.length < 1) return [];

  const limit = options.limit || 12;
  const results = [];
  const seenKeys = new Set();

  // 1. Busca na Base Canônica Farmacêutica (mais rica em detalhes clínicos)
  if (Array.isArray(CANONICAL_MEDICATIONS_DB)) {
    for (const med of CANONICAL_MEDICATIONS_DB) {
      const nameNorm = normalizeString(med.name);
      const subNorm = normalizeString(med.activeSubstance);
      const tradeNorm = (med.tradeNames || []).map(normalizeString).join(' ');
      const classNorm = normalizeString(med.therapeuticClass || med.pharmaceuticalClass);

      if (nameNorm.includes(q) || subNorm.includes(q) || tradeNorm.includes(q) || classNorm.includes(q)) {
        const key = `${med.name}-${med.activeSubstance}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          results.push({
            id: med.id,
            name: med.name,
            activeSubstance: med.activeSubstance,
            tradeNames: med.tradeNames || [],
            category: med.therapeuticClass || med.pharmaceuticalClass || 'Medicamento',
            dose: (med.usualDosages && med.usualDosages[0]) || '',
            via: 'Oral',
            prescriptionType: med.prescriptionType || 'MIP',
            source: 'Base Clínica FarmaLogic'
          });
        }
      }
    }
  }

  // 2. Busca no Catálogo Local de Medicamentos (500+ apresentações)
  const localCatalog = await loadLocalMedicationsCatalog();
  for (const item of localCatalog) {
    const nomeNorm = normalizeString(item.nome);
    if (nomeNorm.includes(q)) {
      const key = `${item.nome}-${item.dose || ''}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        results.push({
          id: `LOC-${seenKeys.size}`,
          name: item.nome,
          activeSubstance: item.nome.split('(')[0].trim(),
          tradeNames: [],
          category: 'Medicamento / DCB',
          dose: item.dose || '',
          via: item.via || 'VO',
          prescriptionType: 'Medicamento',
          source: 'Catálogo ANVISA/DCB'
        });
      }
    }
    if (results.length >= limit) break;
  }

  // 3. Busca Online na API ANVISA / OpenFDA (Backend) se houver poucos resultados
  if (results.length < 5 && options.includeRemote !== false && q.length >= 2) {
    if (apiSearchCache.has(q)) {
      const cached = apiSearchCache.get(q);
      for (const item of cached) {
        const key = `${item.nome}-${item.principioAtivo}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          results.push(item);
        }
      }
    } else {
      try {
        const res = await fetch(`/api/anvisa/buscar?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const apiData = await res.json();
          if (apiData.success && Array.isArray(apiData.resultados)) {
            const formatted = apiData.resultados.map(r => ({
              id: `API-${Math.random()}`,
              name: r.nome,
              activeSubstance: r.principioAtivo || r.nome,
              tradeNames: [],
              category: r.categoria || 'Medicamento',
              dose: r.formaFarmaceutica || '',
              via: r.viaAdministracao || 'VO',
              prescriptionType: 'ANVISA / OpenFDA',
              source: r.fonte || 'ANVISA / OpenFDA'
            }));
            apiSearchCache.set(q, formatted);
            for (const item of formatted) {
              const key = `${item.name}-${item.activeSubstance}`;
              if (!seenKeys.has(key)) {
                seenKeys.add(key);
                results.push(item);
              }
            }
          }
        }
      } catch (e) {
        // Fallback silencioso para busca local
      }
    }
  }

  return results.slice(0, limit);
}

/**
 * Acopla Autocomplete Inteligente em Tempo Real a um elemento <input> ou <textarea>
 * @param {HTMLElement|string} targetInput Elemento ou seletor
 * @param {object} options { multiValue: true, onSelect: fn(item) }
 */
export function attachMedicationAutocomplete(targetInput, options = {}) {
  const input = typeof targetInput === 'string' ? document.querySelector(targetInput) : targetInput;
  if (!input) return null;

  // Evita re-atachar múltiplas vezes
  if (input._medAutocompleteActive) return input._medAutocompleteActive;

  const multiValue = options.multiValue !== false; // Padrão: aceita múltiplos valores separados por vírgula

  // Cria o container do dropdown flutuante
  const dropdown = document.createElement('div');
  dropdown.className = 'med-autocomplete-dropdown';
  dropdown.style.cssText = `
    position: absolute;
    z-index: 10005;
    background: #0f172a;
    border: 1.5px solid rgba(20, 184, 166, 0.5);
    border-radius: 12px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.85), 0 0 20px rgba(13, 148, 136, 0.3);
    max-height: 280px;
    overflow-y: auto;
    display: none;
    width: max-content;
    min-width: 320px;
    max-width: 500px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 6px;
    font-family: 'Inter', sans-serif;
  `;
  document.body.appendChild(dropdown);

  let activeIndex = -1;
  let currentResults = [];
  let debounceTimer = null;

  const positionDropdown = () => {
    const rect = input.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + window.scrollY + 6}px`;
    dropdown.style.left = `${rect.left + window.scrollX}px`;
    dropdown.style.width = `${Math.max(rect.width, 340)}px`;
  };

  const hideDropdown = () => {
    dropdown.style.display = 'none';
    activeIndex = -1;
    currentResults = [];
  };

  const getCurrentToken = () => {
    if (!multiValue) return input.value.trim();
    const cursor = input.selectionStart || input.value.length;
    const textBeforeCursor = input.value.slice(0, cursor);
    const tokens = textBeforeCursor.split(',');
    return tokens[tokens.length - 1].trim();
  };

  const applySelection = (med) => {
    const displayText = med.dose ? `${med.name} ${med.dose}` : med.name;

    if (!multiValue) {
      input.value = displayText;
    } else {
      const cursor = input.selectionStart || input.value.length;
      const textBeforeCursor = input.value.slice(0, cursor);
      const textAfterCursor = input.value.slice(cursor);
      
      const beforeTokens = textBeforeCursor.split(',');
      beforeTokens[beforeTokens.length - 1] = ' ' + displayText;
      
      let newText = beforeTokens.join(',').trim();
      if (newText.startsWith(',')) newText = newText.slice(1).trim();
      
      input.value = newText + (textAfterCursor ? textAfterCursor : ', ');
      input.focus();
      const newPos = input.value.length;
      input.setSelectionRange(newPos, newPos);
    }

    if (typeof options.onSelect === 'function') {
      options.onSelect(med);
    }

    // Disparar evento de input para acionar CDSS em tempo real
    input.dispatchEvent(new Event('input', { bubbles: true }));
    hideDropdown();
  };

  const renderResults = (results, query) => {
    currentResults = results;
    if (!results || results.length === 0) {
      dropdown.innerHTML = `
        <div style="padding: 10px 14px; color: #94a3b8; font-size: 0.82rem; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-magnifying-glass" style="color: #64748b;"></i>
          Nenhum medicamento encontrado para "${query}".
        </div>
      `;
      dropdown.style.display = 'block';
      positionDropdown();
      return;
    }

    dropdown.innerHTML = results.map((med, idx) => {
      const badgeColor = med.prescriptionType === 'MIP' ? '#10b981' : (med.prescriptionType === 'Controlado' ? '#f43f5e' : '#38bdf8');
      const badgeBg = med.prescriptionType === 'MIP' ? 'rgba(16, 185, 129, 0.15)' : (med.prescriptionType === 'Controlado' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)');
      
      return `
        <div class="med-autocomplete-item ${idx === activeIndex ? 'active' : ''}" data-index="${idx}" style="
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          transition: background 0.15s ease;
          background: ${idx === activeIndex ? 'rgba(20, 184, 166, 0.25)' : 'transparent'};
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        ">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-pills" style="color: #2dd4bf; font-size: 0.85rem;"></i>
              <strong style="color: #f8fafc; font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${med.name}</strong>
              ${med.dose ? `<span style="color: #38bdf8; font-size: 0.78rem; font-weight: 600;">${med.dose}</span>` : ''}
            </div>
            <div style="font-size: 0.74rem; color: #94a3b8; margin-top: 2px;">
              ${med.activeSubstance ? `<span>PA: <strong>${med.activeSubstance}</strong></span> &bull; ` : ''}
              <span>${med.via || 'VO'}</span> &bull;
              <span style="color: #64748b;">${med.source || 'FarmaLogic'}</span>
            </div>
          </div>
          <span style="
            font-size: 0.68rem;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 12px;
            color: ${badgeColor};
            background: ${badgeBg};
            border: 1px solid ${badgeColor}40;
            white-space: nowrap;
          ">
            ${med.prescriptionType || 'Medicamento'}
          </span>
        </div>
      `;
    }).join('');

    dropdown.style.display = 'block';
    positionDropdown();

    // Eventos de clique nos itens
    dropdown.querySelectorAll('.med-autocomplete-item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const index = parseInt(el.getAttribute('data-index'), 10);
        if (currentResults[index]) {
          applySelection(currentResults[index]);
        }
      });
      el.addEventListener('mouseenter', () => {
        const index = parseInt(el.getAttribute('data-index'), 10);
        activeIndex = index;
        dropdown.querySelectorAll('.med-autocomplete-item').forEach((item, i) => {
          item.style.background = i === activeIndex ? 'rgba(20, 184, 166, 0.25)' : 'transparent';
        });
      });
    });
  };

  const handleInput = () => {
    clearTimeout(debounceTimer);
    const token = getCurrentToken();

    if (!token || token.length < 1) {
      hideDropdown();
      return;
    }

    debounceTimer = setTimeout(async () => {
      const results = await searchMedicationsRealtime(token, { limit: 10 });
      renderResults(results, token);
    }, 150);
  };

  const handleKeyDown = (e) => {
    if (dropdown.style.display !== 'block' || currentResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % currentResults.length;
      dropdown.querySelectorAll('.med-autocomplete-item').forEach((item, i) => {
        item.style.background = i === activeIndex ? 'rgba(20, 184, 166, 0.25)' : 'transparent';
      });
      const activeEl = dropdown.querySelector(`[data-index="${activeIndex}"]`);
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + currentResults.length) % currentResults.length;
      dropdown.querySelectorAll('.med-autocomplete-item').forEach((item, i) => {
        item.style.background = i === activeIndex ? 'rgba(20, 184, 166, 0.25)' : 'transparent';
      });
      const activeEl = dropdown.querySelector(`[data-index="${activeIndex}"]`);
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (activeIndex >= 0 && currentResults[activeIndex]) {
        e.preventDefault();
        applySelection(currentResults[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      hideDropdown();
    }
  };

  input.addEventListener('input', handleInput);
  input.addEventListener('keydown', handleKeyDown);
  input.addEventListener('focus', handleInput);
  input.addEventListener('blur', () => setTimeout(hideDropdown, 200));

  window.addEventListener('resize', positionDropdown);
  window.addEventListener('scroll', positionDropdown, true);

  const cleanup = () => {
    input.removeEventListener('input', handleInput);
    input.removeEventListener('keydown', handleKeyDown);
    if (dropdown.parentNode) dropdown.parentNode.removeChild(dropdown);
  };

  input._medAutocompleteActive = { cleanup, hideDropdown };
  return input._medAutocompleteActive;
}

/**
 * Inicializa automaticamente todos os inputs de medicamentos e alergias na tela
 */
export function setupAllGlobalMedicationAutocompletes() {
  const inputsToAttach = [
    { selector: '#allergies', multiValue: true },
    { selector: '#continuousMedications', multiValue: true },
    { selector: '#chronicConditions', multiValue: true },
    { selector: '#prescription-med-search', multiValue: false },
    { selector: '#pos-product-search', multiValue: false }
  ];

  inputsToAttach.forEach(({ selector, multiValue }) => {
    const el = document.querySelector(selector);
    if (el) {
      attachMedicationAutocomplete(el, { multiValue });
    }
  });
}

// Carregamento inicial em segundo plano
loadLocalMedicationsCatalog();
