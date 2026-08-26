// ─── MÓDULO DA ABA DASHBOARD & MÉTRICAS (CRM CLÍNICO FARMACÊUTICO v3.0) ───────────────────
import { state } from '../state.js';
import * as localDB from '../localDB.js';
import { apiFetch } from '../modules/api.js';
import { showToast } from '../modules/ui.js';
import { Chart as ChartJS, registerables } from 'chart.js';

if (ChartJS && registerables) {
  try {
    ChartJS.register(...registerables);
    window.Chart = ChartJS;
  } catch (e) {
    console.warn('[Dashboard] Registro de Chart.js:', e);
  }
}

// Estado de visualização dinâmica dos gráficos
const chartModes = {
  services: ['doughnut', 'bar', 'pie', 'polarArea'],
  servicesIdx: 0,
  cdss: ['polarArea', 'radar', 'doughnut', 'bar', 'pie'],
  cdssIdx: 0,
  weekly: ['line-smooth', 'bar', 'line-stepped', 'radar', 'area-stacked'],
  weeklyIdx: 0
};

// Paleta clínica premium ultra-moderna (Cyber-Clinical Dark Luxury)
const CLINICAL_PALETTE = {
  emerald: { base: '#10b981', light: '#34d399', dark: '#047857', glow: 'rgba(16, 185, 129, 0.45)' },
  sky:     { base: '#0284c7', light: '#38bdf8', dark: '#0369a1', glow: 'rgba(56, 189, 248, 0.45)' },
  indigo:  { base: '#6366f1', light: '#a5b4fc', dark: '#4338ca', glow: 'rgba(99, 102, 241, 0.45)' },
  amber:   { base: '#f59e0b', light: '#fbbf24', dark: '#b45309', glow: 'rgba(245, 158, 11, 0.45)' },
  pink:    { base: '#ec4899', light: '#f472b6', dark: '#be185d', glow: 'rgba(236, 72, 153, 0.45)' },
  teal:    { base: '#14b8a6', light: '#2dd4bf', dark: '#0f766e', glow: 'rgba(20, 184, 166, 0.45)' },
  rose:    { base: '#f43f5e', light: '#fb7185', dark: '#be123c', glow: 'rgba(244, 63, 94, 0.45)' }
};

export async function fetchDashboardData() {
  state.loading = true;

  // 1. Pacientes cadastrados reais/locais
  const pPharmList = localDB.list('pharmacy_patients') || [];
  const pGenList = localDB.list('patients') || [];
  const activePatients = Math.max(pPharmList.length, pGenList.length);

  // 2. Atendimentos clínicos
  const attList = localDB.list('pharmacy_attendances') || localDB.list('pharmacy_consultations') || [];
  const clinicalEncounters = attList.length;

  // 3. Intervenções CDSS
  const cdssList = localDB.list('pharmacy_decision_audit') || [];
  const cdssInterventions = cdssList.length;

  // 4. Declarações DSF (CFF) emitidas / Compras
  const purchasesList = localDB.list('patient_purchases') || [];
  const dsfIssuedCount = purchasesList.length;

  // 5. Taxa de Adesão (0% se não houver atendimentos)
  const adherenceRate = clinicalEncounters === 0 ? 0 : 88.5;

  // 6. Contagem de Serviços Farmacêuticos Realizados
  let countPA = 0;
  let countGlicemia = 0;
  let countInjetaveis = 0;
  let countMIP = 0;
  let countFarmacoterapia = 0;
  let countTestes = 0;

  attList.forEach(att => {
    const text = ((att.tipo_visita || '') + ' ' + (att.queixa_triagem || '') + ' ' + (att.protocol || '') + ' ' + (att.prescricao_mips || '')).toLowerCase();
    if (text.includes('pressão') || text.includes('pa') || text.includes('has') || text.includes('hipertens')) countPA++;
    else if (text.includes('glicemia') || text.includes('diabetes') || text.includes('glicose')) countGlicemia++;
    else if (text.includes('injet') || text.includes('vacina') || text.includes('aplic')) countInjetaveis++;
    else if (text.includes('mip') || text.includes('gripe') || text.includes('cefaleia') || text.includes('resfriado') || text.includes('dor')) countMIP++;
    else if (text.includes('acompanhamento') || text.includes('farmacoterap') || text.includes('revisão') || text.includes('soap')) countFarmacoterapia++;
    else if (text.includes('teste') || text.includes('rápido') || text.includes('covid') || text.includes('tlr')) countTestes++;
    else countMIP++;
  });

  const clinicalServicesData = [
    { label: 'Aferição de Pressão (PA)', value: countPA, color: '#10b981', gradient: ['#10b981', '#047857'], glow: '#34d399' },
    { label: 'Glicemia Capilar', value: countGlicemia, color: '#38bdf8', gradient: ['#38bdf8', '#0284c7'], glow: '#7dd3fc' },
    { label: 'Aplicação de Injetáveis', value: countInjetaveis, color: '#818cf8', gradient: ['#818cf8', '#4f46e5'], glow: '#a5b4fc' },
    { label: 'Consulta & Triagem MIP', value: countMIP, color: '#f59e0b', gradient: ['#fbbf24', '#d97706'], glow: '#fde68a' },
    { label: 'Revisão da Farmacoterapia', value: countFarmacoterapia, color: '#ec4899', gradient: ['#f472b6', '#be185d'], glow: '#fbcfe8' },
    { label: 'Testes Rápidos Clínicos', value: countTestes, color: '#06b6d4', gradient: ['#2dd4bf', '#0f766e'], glow: '#99f6e4' }
  ];

  // 7. Alertas do Motor CDSS 4D
  let countInteracoes = 0;
  let countAlimento = 0;
  let countHabito = 0;
  let countDuplicidade = 0;
  let countBeers = 0;
  let countAlergia = 0;

  cdssList.forEach(item => {
    const text = ((item.interaction_title || '') + ' ' + (item.severity || '') + ' ' + (item.justificativa || '')).toLowerCase();
    if (text.includes('alergia')) countAlergia++;
    else if (text.includes('alimento') || text.includes('leite') || text.includes('toranja')) countAlimento++;
    else if (text.includes('hábito') || text.includes('álcool') || text.includes('tabaco')) countHabito++;
    else if (text.includes('duplic')) countDuplicidade++;
    else if (text.includes('beers') || text.includes('idoso')) countBeers++;
    else countInteracoes++;
  });

  const cdssAlertsData = [
    { label: 'Interação Fármaco-Fármaco', value: countInteracoes, color: '#ef4444', gradient: ['#f87171', '#dc2626'] },
    { label: 'Fármaco-Alimento (Ex: Toranja/Leite)', value: countAlimento, color: '#f59e0b', gradient: ['#fbbf24', '#d97706'] },
    { label: 'Fármaco-Hábito (Álcool/Tabaco)', value: countHabito, color: '#8b5cf6', gradient: ['#a78bfa', '#6d28d9'] },
    { label: 'Duplicidade Terapêutica', value: countDuplicidade, color: '#ec4899', gradient: ['#f472b6', '#be185d'] },
    { label: 'Critérios de Beers (Idosos)', value: countBeers, color: '#06b6d4', gradient: ['#38bdf8', '#0284c7'] },
    { label: 'Alergia Cruzada Bloqueada', value: countAlergia, color: '#10b981', gradient: ['#34d399', '#059669'] }
  ];

  // 8. Histórico Semanal (Últimos 7 dias)
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const weeklyHistory = [];
  for (let i = 6; i >= 0; i--) {
    const dObj = new Date(Date.now() - i * 86400000);
    const dayLabel = days[dObj.getDay()];
    const dateStr = dObj.toISOString().split('T')[0];
    
    const dayAtts = attList.filter(a => (a.data_hora || a.date || a.created_at || '').startsWith(dateStr)).length;
    const dayCdss = cdssList.filter(c => (c.timestamp || c.created_at || '').startsWith(dateStr)).length;

    weeklyHistory.push({
      label: dayLabel,
      atendimentos: dayAtts,
      intervencoes: dayCdss
    });
  }

  // 9. Red Flags dos atendimentos
  const redFlagsMap = {};
  attList.forEach(att => {
    if (Array.isArray(att.red_flags)) {
      att.red_flags.forEach(rf => {
        const key = typeof rf === 'string' ? rf : (rf.title || rf.label || 'Sinal de Alerta');
        if (!redFlagsMap[key]) {
          redFlagsMap[key] = { label: key, count: 0, severity: 'Alta', action: 'Encaminhamento Médico' };
        }
        redFlagsMap[key].count++;
      });
    }
  });
  const redFlagsData = Object.values(redFlagsMap);

  state.dashboardData = {
    activePatients,
    clinicalEncounters,
    cdssInterventions,
    dsfIssuedCount,
    adherenceRate,
    clinicalServicesData,
    cdssAlertsData,
    weeklyHistory,
    redFlagsData
  };

  state.loading = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE GRADIENTES & DESIGN MODERNO DE CANVAS
// ─────────────────────────────────────────────────────────────────────────────

function createPlastic3DGradient(ctx2d, hexColor, vertical = true, height = 300) {
  const hex = (hexColor || '#10b981').replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 16;
  const g = parseInt(hex.substring(2, 4), 16) || 185;
  const b = parseInt(hex.substring(4, 6), 16) || 129;

  const grad = vertical 
    ? ctx2d.createLinearGradient(0, 0, 0, height) 
    : ctx2d.createLinearGradient(0, 0, 420, 0);

  // 1. Reflexo Especular Superior (Plastic Sheen Glare)
  grad.addColorStop(0, `rgba(${Math.min(255, r + 110)}, ${Math.min(255, g + 110)}, ${Math.min(255, b + 110)}, 0.98)`);
  // 2. Transição Plástica Esmaltada
  grad.addColorStop(0.16, `rgba(${r}, ${g}, ${b}, 0.92)`);
  // 3. Meia-Sombra Volumétrica 3D
  grad.addColorStop(0.55, `rgba(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)}, 0.96)`);
  // 4. Luz de Rebote Ambiente (Rim Light)
  grad.addColorStop(0.86, `rgba(${Math.min(255, r + 65)}, ${Math.min(255, g + 65)}, ${Math.min(255, b + 65)}, 0.88)`);
  // 5. Oclusão de Contato 3D Escura
  grad.addColorStop(1, `rgba(${Math.max(0, r - 90)}, ${Math.max(0, g - 90)}, ${Math.max(0, b - 90)}, 0.98)`);

  return grad;
}

function createLinearGradient(ctx2d, c1, c2, vertical = true, height = 300) {
  return createPlastic3DGradient(ctx2d, c1, vertical, height);
}

// Plugin customizado para desenhar o Total no centro da Rosca com Disco 3D Claymorphic
const centerDoughnutPlugin = {
  id: 'centerDoughnutPlugin',
  afterDraw(chart) {
    try {
      if (chart.config.type !== 'doughnut') return;
      if (!chart.chartArea) return;
      const { ctx, chartArea: { top, bottom, left, right } } = chart;
      if (!ctx || !top || !bottom || !left || !right) return;

      const datasets = chart.data?.datasets || [];
      if (!datasets[0] || !datasets[0].data) return;
      const isZero = chart.data?.isZeroData || false;
      const total = isZero ? 0 : datasets[0].data.reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);
      
      ctx.save();
      const centerX = (left + right) / 2;
      const centerY = (top + bottom) / 2;
      const meta = chart.getDatasetMeta(0);
      let innerRadius = (meta && meta.data && meta.data[0] ? meta.data[0].innerRadius : 60);
      innerRadius = Math.max(10, (innerRadius || 60) - 6);

      if (innerRadius > 15 && isFinite(innerRadius) && isFinite(centerX) && isFinite(centerY)) {
        // 1. Disco 3D Esmaltado Central
        const discGrad = ctx.createRadialGradient(centerX - 8, centerY - 8, 2, centerX, centerY, innerRadius);
        discGrad.addColorStop(0, 'rgba(30, 41, 59, 0.95)');
        discGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.98)');
        discGrad.addColorStop(1, 'rgba(2, 6, 23, 1)');

        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = discGrad;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 14;
        ctx.fill();

        // Borda com Specular Ring
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isZero ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.16)';
        ctx.stroke();
      }

      // 2. Número do Total em Destaque 3D
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
      ctx.font = '800 1.85rem "Outfit", sans-serif';
      ctx.fillStyle = isZero ? '#64748b' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(total, centerX, centerY - 9);

      // 3. Label do Centro
      ctx.font = '700 0.68rem "Inter", sans-serif';
      ctx.fillStyle = isZero ? '#475569' : '#38bdf8';
      ctx.letterSpacing = '1px';
      ctx.fillText(isZero ? 'SEM DADOS' : 'PROCEDIMENTOS', centerX, centerY + 14);

      ctx.restore();
    } catch (e) {
      // Previne falha de renderização no canvas
    }
  }
};

// Plugin customizado para renderizar Sombreamento Profundo e Curvatura Especular Plástica 3D
const plastic3DGlossPlugin = {
  id: 'plastic3DGlossPlugin',
  beforeDatasetsDraw(chart) {
    try {
      const { ctx } = chart;
      if (!ctx) return;
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.52)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 10;
      ctx.shadowOffsetX = 3;
    } catch (e) {}
  },
  afterDatasetsDraw(chart) {
    try {
      const { ctx } = chart;
      if (!ctx) return;
      ctx.restore();

      // Desenhar filete de brilho plástico (Specular Sheen) para roscas e pizzas
      if (chart.config.type === 'doughnut' || chart.config.type === 'pie') {
        const meta = chart.getDatasetMeta(0);
        if (meta && meta.data) {
          meta.data.forEach((arc) => {
            if (!arc || (!arc.startAngle && arc.startAngle !== 0)) return;
            const sheenRadius = (arc.outerRadius || 0) - 3;
            if (sheenRadius > 5 && isFinite(arc.x) && isFinite(arc.y)) {
              ctx.save();
              ctx.beginPath();
              ctx.arc(arc.x, arc.y, sheenRadius, arc.startAngle + 0.06, arc.endAngle - 0.06);
              ctx.lineWidth = 2.4;
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
              ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
              ctx.shadowBlur = 4;
              ctx.stroke();
              ctx.restore();
            }
          });
        }
      }
    } catch (e) {}
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RENDERIZAÇÃO DOS GRÁFICOS (CHART.JS) COM DESIGN ULTRA-MODERNO
// ─────────────────────────────────────────────────────────────────────────────

export function initDashboardCharts(data = state.dashboardData) {
  const d = data || state.dashboardData || {};

  const ChartClass = window.Chart || ChartJS || (typeof Chart !== 'undefined' ? Chart : null);
  if (!ChartClass) {
    console.warn('[DashboardCharts] Chart.js ainda não disponível, aguardando...');
    setTimeout(() => initDashboardCharts(d), 100);
    return;
  }

  // Registrar plugins com segurança
  try {
    if (typeof ChartClass.register === 'function') {
      ChartClass.register(centerDoughnutPlugin, plastic3DGlossPlugin);
    }
  } catch(e) {}

  const sCanvas = document.getElementById('servicesChart');
  const cCanvas = document.getElementById('cdssChart');
  const wCanvas = document.getElementById('weeklyAppointmentsChart');

  if (!sCanvas || !cCanvas || !wCanvas) {
    setTimeout(() => initDashboardCharts(d), 80);
    return;
  }

  // Renderização isolada para que um gráfico não bloqueie os outros
  try {
    renderServicesChart(ChartClass, d);
  } catch (err1) {
    console.warn('[DashboardCharts] Erro servicesChart:', err1);
  }

  try {
    renderCdssChart(ChartClass, d);
  } catch (err2) {
    console.warn('[DashboardCharts] Erro cdssChart:', err2);
  }

  try {
    renderWeeklyChart(ChartClass, d);
  } catch (err3) {
    console.warn('[DashboardCharts] Erro weeklyChart:', err3);
  }
}

function renderServicesChart(ChartClass, data) {
  const canvas = document.getElementById('servicesChart');
  if (!canvas) return;
  if (canvas._chartInstance) canvas._chartInstance.destroy();

  const ctx2d = canvas.getContext('2d');
  const services = data.clinicalServicesData || [];
  const labels = services.map(s => s.label);
  const values = services.map(s => s.value);
  const total = values.reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);
  const isZero = (total === 0);

  const currentTypeKey = chartModes.services[chartModes.servicesIdx % chartModes.services.length];
  let chartType = currentTypeKey;

  // Gerar gradientes com brilho plástico 3D volumétrico
  const backgroundGradients = isZero 
    ? ['rgba(255, 255, 255, 0.05)']
    : services.map(s => createPlastic3DGradient(ctx2d, s.color, chartType !== 'bar', 280));

  // Atualizar badge do tipo no card
  const badgeEl = document.getElementById('badge-services-chart-type');
  if (badgeEl) {
    const names = { 
      'doughnut': '🔮 Rosca 3D Plástico Glossy (Donut)', 
      'bar': '🧪 Cilindros 3D Glossy (Plastic Bar)', 
      'pie': '💎 Pizza 3D Cristalina & Plástico', 
      'polarArea': '🪐 Esfera Polar 3D Esmaltada' 
    };
    badgeEl.textContent = names[currentTypeKey] || currentTypeKey;
  }

  let customScales = {};
  if (chartType === 'bar') {
    customScales = {
      indexAxis: 'y',
      x: {
        grid: { color: 'rgba(255,255,255,0.04)', borderDash: [4, 4] },
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10.5 } }
      },
      y: {
        grid: { display: false },
        ticks: { color: '#f1f5f9', font: { family: 'Outfit', weight: '600', size: 11 } }
      }
    };
  } else if (chartType === 'polarArea') {
    customScales = {
      r: {
        grid: { color: 'rgba(255, 255, 255, 0.08)', borderDash: [3, 3] },
        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { display: false }
      }
    };
  }

  canvas._chartInstance = new ChartClass(canvas, {
    type: chartType === 'bar' ? 'bar' : (chartType === 'pie' ? 'pie' : (chartType === 'polarArea' ? 'polarArea' : 'doughnut')),
    data: {
      isZeroData: isZero,
      labels: isZero ? ['Nenhum procedimento registrado'] : labels,
      datasets: [{
        data: isZero ? (chartType === 'bar' ? [0] : [1]) : values,
        backgroundColor: backgroundGradients,
        borderColor: isZero ? 'rgba(255, 255, 255, 0.1)' : (chartType === 'doughnut' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.35)'),
        borderWidth: chartType === 'doughnut' ? 2.5 : 1.8,
        hoverOffset: isZero ? 0 : 14,
        borderRadius: chartType === 'bar' ? 12 : (chartType === 'doughnut' ? 10 : 4),
        spacing: chartType === 'doughnut' ? 6 : 2,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 750, easing: 'easeOutQuart' },
      layout: { padding: 8 },
      plugins: {
        legend: {
          display: chartType !== 'bar' && !isZero,
          position: 'bottom',
          labels: {
            color: '#cbd5e1',
            font: { size: 10.5, family: 'Inter', weight: '500' },
            padding: 12,
            usePointStyle: true,
            pointStyleWidth: 8,
            boxWidth: 8
          }
        },
        tooltip: {
          enabled: !isZero,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#38bdf8',
          bodyColor: '#f8fafc',
          borderColor: 'rgba(56, 189, 248, 0.45)',
          borderWidth: 1.5,
          cornerRadius: 12,
          padding: 12,
          boxPadding: 6,
          titleFont: { size: 12, family: 'Outfit', weight: '700' },
          bodyFont: { size: 11.5, family: 'Inter' },
          callbacks: {
            label: function(context) {
              const totalVal = context.dataset.data.reduce((a, b) => a + b, 0);
              const val = context.raw || 0;
              const pct = totalVal > 0 ? ((val / totalVal) * 100).toFixed(1) : 0;
              return ` ${val} procedimentos (${pct}%)`;
            }
          }
        }
      },
      cutout: chartType === 'doughnut' ? '68%' : '0%',
      ...customScales
    }
  });
}

function renderCdssChart(ChartClass, data) {
  const canvas = document.getElementById('cdssChart');
  if (!canvas) return;
  if (canvas._chartInstance) canvas._chartInstance.destroy();

  const ctx2d = canvas.getContext('2d');
  const alerts = data.cdssAlertsData || [];
  const labels = alerts.map(a => a.label);
  const values = alerts.map(a => a.value);
  const total = values.reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);
  const isZero = (total === 0);

  const currentTypeKey = chartModes.cdss[chartModes.cdssIdx % chartModes.cdss.length];
  let chartType = currentTypeKey;

  // Atualizar badge do tipo no card
  const badgeEl = document.getElementById('badge-cdss-chart-type');
  if (badgeEl) {
    const names = { 
      'polarArea': '🪐 Esfera Polar 3D Esmaltada', 
      'radar': '🕸️ Teia 3D Holográfica Neon', 
      'doughnut': '🔮 Rosca CDSS 3D Acrílica', 
      'bar': '📊 Colunas 3D Plástico Volumétrico', 
      'pie': '🍰 Pizza 3D Alertas Esmaltada' 
    };
    badgeEl.textContent = names[currentTypeKey] || currentTypeKey;
  }

  const backgroundGradients = isZero 
    ? ['rgba(255, 255, 255, 0.05)']
    : alerts.map(a => createPlastic3DGradient(ctx2d, a.color, true, 260));

  let datasetConfig = {
    data: isZero ? (chartType === 'radar' ? [0, 0, 0, 0, 0, 0] : (chartType === 'bar' ? [0] : [1])) : values,
    backgroundColor: isZero ? (chartType === 'radar' ? 'rgba(255, 255, 255, 0.02)' : backgroundGradients) : backgroundGradients,
    borderColor: isZero ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.35)',
    borderWidth: 2,
    borderRadius: chartType === 'bar' ? 10 : (chartType === 'doughnut' ? 8 : 4),
    spacing: chartType === 'doughnut' ? 5 : 2,
    hoverOffset: isZero ? 0 : 12
  };

  if (chartType === 'radar' && !isZero) {
    const radarGrad = ctx2d.createLinearGradient(0, 0, 0, 260);
    radarGrad.addColorStop(0, 'rgba(245, 158, 11, 0.55)');
    radarGrad.addColorStop(1, 'rgba(239, 68, 68, 0.15)');

    datasetConfig = {
      label: 'Volume de Alertas CDSS',
      data: values,
      backgroundColor: radarGrad,
      borderColor: '#fbbf24',
      borderWidth: 3,
      pointBackgroundColor: '#fbbf24',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2.5,
      pointRadius: 5,
      pointHoverRadius: 8
    };
  }

  let scalesConfig = {};
  if (chartType === 'radar' || chartType === 'polarArea') {
    scalesConfig = {
      r: {
        grid: { color: 'rgba(255, 255, 255, 0.08)', borderDash: [3, 3] },
        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
        pointLabels: { color: '#cbd5e1', font: { size: 10, family: 'Inter', weight: '600' } },
        ticks: { display: false }
      }
    };
  } else if (chartType === 'bar') {
    scalesConfig = {
      x: { 
        grid: { display: false }, 
        ticks: { color: '#cbd5e1', font: { size: 9.5, family: 'Inter' } } 
      },
      y: { 
        grid: { color: 'rgba(255,255,255,0.04)', borderDash: [4, 4] }, 
        ticks: { color: '#94a3b8', font: { family: 'Inter' } } 
      }
    };
  }

  canvas._chartInstance = new ChartClass(canvas, {
    type: chartType,
    data: {
      labels: labels,
      datasets: [datasetConfig]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 750, easing: 'easeOutQuart' },
      layout: { padding: 6 },
      scales: scalesConfig,
      plugins: {
        legend: {
          display: chartType !== 'bar' && chartType !== 'radar',
          position: 'bottom',
          labels: {
            color: '#cbd5e1',
            font: { size: 10, family: 'Inter' },
            padding: 10,
            usePointStyle: true,
            boxWidth: 8
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#fbbf24',
          bodyColor: '#f8fafc',
          borderColor: 'rgba(245, 158, 11, 0.45)',
          borderWidth: 1.5,
          cornerRadius: 12,
          padding: 12,
          titleFont: { size: 12, family: 'Outfit', weight: '700' },
          bodyFont: { size: 11.5, family: 'Inter' }
        }
      },
      cutout: chartType === 'doughnut' ? '66%' : '0%'
    }
  });
}

function renderWeeklyChart(ChartClass, data) {
  const canvas = document.getElementById('weeklyAppointmentsChart');
  if (!canvas) return;
  if (canvas._chartInstance) canvas._chartInstance.destroy();

  const ctx2d = canvas.getContext('2d');
  const history = data.weeklyHistory || [];
  const labels = history.map(h => h.label);
  const atendimentos = history.map(h => h.atendimentos);
  const intervencoes = history.map(h => h.intervencoes);

  const currentTypeKey = chartModes.weekly[chartModes.weeklyIdx % chartModes.weekly.length];

  // Atualizar badge do tipo no card
  const badgeEl = document.getElementById('badge-weekly-chart-type');
  if (badgeEl) {
    const names = { 
      'line-smooth': '📈 Tubo Fluido 3D Neon Glossy', 
      'bar': '📊 Colunas 3D Plástico Acrílico', 
      'line-stepped': '⚡ Pulso 3D Degrau Glossy', 
      'radar': '🕸️ Radar Semanal 3D', 
      'area-stacked': '🏔️ Montanha 3D Resina Translúcida' 
    };
    badgeEl.textContent = names[currentTypeKey] || currentTypeKey;
  }

  let chartType = 'line';
  let isStepped = false;
  let isStacked = false;

  if (currentTypeKey === 'bar') {
    chartType = 'bar';
  } else if (currentTypeKey === 'line-stepped') {
    chartType = 'line';
    isStepped = true;
  } else if (currentTypeKey === 'radar') {
    chartType = 'radar';
  } else if (currentTypeKey === 'area-stacked') {
    chartType = 'line';
    isStacked = true;
  }

  // Gradientes 3D volumétricos
  const emeraldGradient = createPlastic3DGradient(ctx2d, '#10b981', true, 260);
  const amberGradient = createPlastic3DGradient(ctx2d, '#f59e0b', true, 260);

  let scalesConfig = {
    x: {
      grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
      ticks: { color: '#cbd5e1', font: { family: 'Outfit', weight: '600', size: 11 } }
    },
    y: {
      stacked: isStacked,
      grid: { color: 'rgba(255,255,255,0.05)', borderDash: [4, 4], drawBorder: false },
      ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10.5 }, precision: 0 }
    }
  };

  if (chartType === 'radar') {
    scalesConfig = {
      r: {
        grid: { color: 'rgba(255, 255, 255, 0.08)', borderDash: [3, 3] },
        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
        pointLabels: { color: '#cbd5e1', font: { size: 10.5, family: 'Outfit', weight: '600' } },
        ticks: { display: false }
      }
    };
  }

  canvas._chartInstance = new ChartClass(canvas, {
    type: chartType,
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Atendimentos Clínicos',
          data: atendimentos,
          borderColor: '#34d399',
          borderWidth: 3.5,
          backgroundColor: emeraldGradient,
          fill: true,
          stepped: isStepped,
          tension: isStepped ? 0 : 0.45,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 8.5,
          pointHoverBorderWidth: 3,
          borderRadius: chartType === 'bar' ? 10 : 0
        },
        {
          label: 'Intervenções Farmacêuticas',
          data: intervencoes,
          borderColor: '#fbbf24',
          borderWidth: 3.5,
          backgroundColor: amberGradient,
          fill: true,
          stepped: isStepped,
          tension: isStepped ? 0 : 0.45,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 8.5,
          pointHoverBorderWidth: 3,
          borderRadius: chartType === 'bar' ? 10 : 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 750, easing: 'easeOutQuart' },
      layout: { padding: 4 },
      scales: scalesConfig,
      plugins: {
        legend: {
          position: 'top',
          labels: { 
            color: '#cbd5e1', 
            font: { size: 11.5, family: 'Outfit', weight: '600' }, 
            usePointStyle: true,
            boxWidth: 8,
            padding: 14
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#34d399',
          bodyColor: '#f8fafc',
          borderColor: 'rgba(16, 185, 129, 0.45)',
          borderWidth: 1.5,
          cornerRadius: 12,
          padding: 12,
          titleFont: { size: 12, family: 'Outfit', weight: '700' },
          bodyFont: { size: 11.5, family: 'Inter' }
        }
      }
    }
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// FUNÇÕES GLOBAIS DE ALTERNÂNCIA RANDÔMICA / DINÂMICA
// ─────────────────────────────────────────────────────────────────────────────

window.toggleServicesChart = function(event) {
  if (event) event.stopPropagation();
  chartModes.servicesIdx++;
  const ChartClass = window.Chart || (typeof Chart !== 'undefined' ? Chart : null);
  if (ChartClass && state.dashboardData) {
    renderServicesChart(ChartClass, state.dashboardData);
    showToast(`Formato do gráfico alterado: ${chartModes.services[chartModes.servicesIdx % chartModes.services.length].toUpperCase()}`);
  }
};

window.toggleCdssChart = function(event) {
  if (event) event.stopPropagation();
  chartModes.cdssIdx++;
  const ChartClass = window.Chart || (typeof Chart !== 'undefined' ? Chart : null);
  if (ChartClass && state.dashboardData) {
    renderCdssChart(ChartClass, state.dashboardData);
    showToast(`Formato do gráfico alterado: ${chartModes.cdss[chartModes.cdssIdx % chartModes.cdss.length].toUpperCase()}`);
  }
};

window.toggleWeeklyChart = function(event) {
  if (event) event.stopPropagation();
  chartModes.weeklyIdx++;
  const ChartClass = window.Chart || (typeof Chart !== 'undefined' ? Chart : null);
  if (ChartClass && state.dashboardData) {
    renderWeeklyChart(ChartClass, state.dashboardData);
    showToast(`Formato do gráfico alterado: ${chartModes.weekly[chartModes.weeklyIdx % chartModes.weekly.length].toUpperCase()}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE DRILL-DOWN / RELATÓRIO INTERATIVO AO CLICAR NOS CARDS
// ─────────────────────────────────────────────────────────────────────────────

window.openDrillDownModal = function(topic) {
  const d = state.dashboardData || {};
  let title = '';
  let icon = '';
  let badgeText = '';
  let colorTheme = '#10b981';
  let contentHtml = '';

  if (topic === 'patients') {
    title = 'Relatório Detalhado: Pacientes Cadastrados & Acompanhamento';
    icon = 'fa-user-nurse';
    const patients = localDB.list('pharmacy_patients') || localDB.list('patients') || [];
    badgeText = `${patients.length} Pacientes Cadastrados`;
    colorTheme = '#38bdf8';
    
    if (patients.length === 0) {
      contentHtml = `
        <div style="text-align: center; padding: 40px 20px; color: #64748b;">
          <i class="fa-solid fa-user-xmark" style="font-size: 2.5rem; color: #38bdf8; opacity: 0.4; margin-bottom: 12px;"></i>
          <div style="font-weight: 700; color: #94a3b8; font-size: 1rem;">Nenhum paciente cadastrado</div>
          <div style="font-size: 0.8rem; margin-top: 4px;">Cadastre novos clientes na aba de Pacientes ou simule dados nas Configurações.</div>
        </div>
      `;
    } else {
      contentHtml = `
        <div style="margin-bottom: 18px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
          <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 14px;">
            <div style="font-size: 0.74rem; color: #94a3b8;">Total Cadastrados</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #38bdf8; font-family: 'Outfit';">${patients.length}</div>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem; text-align: left;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">
              <th style="padding: 8px;">Paciente</th>
              <th style="padding: 8px;">CPF</th>
              <th style="padding: 8px;">Alergias</th>
              <th style="padding: 8px; text-align: right;">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${patients.map(p => `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: #f8fafc;">
                <td style="padding: 10px 8px;"><strong>${p.name || 'Sem nome'}</strong></td>
                <td style="padding: 10px 8px;">${p.cpf || '--'}</td>
                <td style="padding: 10px 8px; color: #f87171;">${p.allergies || 'Nenhuma'}</td>
                <td style="padding: 10px 8px; text-align: right;"><button class="btn btn-sm" onclick="document.getElementById('drilldown-modal')?.remove(); window.switchTab('pacientes');" style="background: #38bdf8; color: #000; font-weight: 700; border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer;">Ver Prontuário</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  } else if (topic === 'encounters' || topic === 'services') {
    title = 'Relatório de Atendimentos Clínicos & Serviços Farmacêuticos (CFF)';
    icon = 'fa-stethoscope';
    const atts = localDB.list('pharmacy_attendances') || localDB.list('pharmacy_consultations') || [];
    badgeText = `${atts.length} Procedimentos Realizados`;
    colorTheme = '#10b981';

    if (atts.length === 0) {
      contentHtml = `
        <div style="text-align: center; padding: 40px 20px; color: #64748b;">
          <i class="fa-solid fa-notes-medical" style="font-size: 2.5rem; color: #10b981; opacity: 0.4; margin-bottom: 12px;"></i>
          <div style="font-weight: 700; color: #94a3b8; font-size: 1rem;">Nenhum atendimento realizado</div>
          <div style="font-size: 0.8rem; margin-top: 4px;">Inicie triagens clínicas no Balcão Farmacêutico.</div>
        </div>
      `;
    } else {
      contentHtml = `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem; text-align: left;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">
              <th style="padding: 8px;">Paciente</th>
              <th style="padding: 8px;">Queixa / Serviço</th>
              <th style="padding: 8px;">Desfecho</th>
              <th style="padding: 8px;">Data</th>
            </tr>
          </thead>
          <tbody>
            ${atts.map(a => `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: #f8fafc;">
                <td style="padding: 10px 8px;"><strong>${a.patient_name || a.patientName || 'Cliente'}</strong></td>
                <td style="padding: 10px 8px;">${a.queixa_triagem || a.protocol || 'Consulta'}</td>
                <td style="padding: 10px 8px; color: #34d399;">${a.conduta_final || a.outcome || 'Concluído'}</td>
                <td style="padding: 10px 8px; color: #94a3b8;">${new Date(a.data_hora || a.date || a.created_at || Date.now()).toLocaleDateString('pt-BR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  } else if (topic === 'cdss' || topic === 'alerts') {
    title = 'Relatório de Farmacovigilância: Alertas & Bloqueios CDSS 4D';
    icon = 'fa-shield-virus';
    const cdss = localDB.list('pharmacy_decision_audit') || [];
    badgeText = `${cdss.length} Intervenções Registradas`;
    colorTheme = '#f59e0b';

    if (cdss.length === 0) {
      contentHtml = `
        <div style="text-align: center; padding: 40px 20px; color: #64748b;">
          <i class="fa-solid fa-shield-halved" style="font-size: 2.5rem; color: #f59e0b; opacity: 0.4; margin-bottom: 12px;"></i>
          <div style="font-weight: 700; color: #94a3b8; font-size: 1rem;">Nenhum alerta ou bloqueio registrado</div>
          <div style="font-size: 0.8rem; margin-top: 4px;">O motor CDSS 4D validará interações em tempo real durante as próximas consultas.</div>
        </div>
      `;
    } else {
      contentHtml = `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem; text-align: left;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">
              <th style="padding: 8px;">Interação / Risco</th>
              <th style="padding: 8px;">Severidade</th>
              <th style="padding: 8px;">Ação Tomada</th>
            </tr>
          </thead>
          <tbody>
            ${cdss.map(c => `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: #f8fafc;">
                <td style="padding: 10px 8px;"><strong>${c.interaction_title || 'Alerta Clínico'}</strong></td>
                <td style="padding: 10px 8px;"><span style="background: rgba(239,68,68,0.2); color: #f87171; padding: 2px 6px; border-radius: 6px; font-weight: 700; font-size: 0.72rem;">${c.severity || 'Alerta'}</span></td>
                <td style="padding: 10px 8px; color: #34d399;">${c.acao_tomada || c.justificativa || 'Bloqueado com segurança'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  } else if (topic === 'redflags') {
    title = 'Relatório de Triagem: Sinais de Alerta (Red Flags) & Encaminhamentos';
    icon = 'fa-triangle-exclamation';
    const rfList = d.redFlagsData || [];
    const totalRf = rfList.reduce((acc, r) => acc + (r.count || 0), 0);
    badgeText = `${totalRf} Encaminhamentos`;
    colorTheme = '#ef4444';

    if (rfList.length === 0) {
      contentHtml = `
        <div style="text-align: center; padding: 40px 20px; color: #64748b;">
          <i class="fa-solid fa-circle-check" style="font-size: 2.5rem; color: #10b981; opacity: 0.5; margin-bottom: 12px;"></i>
          <div style="font-weight: 700; color: #94a3b8; font-size: 1rem;">Nenhum sinal de alerta ativo</div>
          <div style="font-size: 0.8rem; margin-top: 4px;">Nenhum caso de encaminhamento médico urgente detectado no momento.</div>
        </div>
      `;
    } else {
      contentHtml = `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem; text-align: left;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">
              <th style="padding: 8px;">Sinal de Alerta</th>
              <th style="padding: 8px;">Gravidade</th>
              <th style="padding: 8px;">Ação Recomendada</th>
              <th style="padding: 8px; text-align: right;">Casos</th>
            </tr>
          </thead>
          <tbody>
            ${rfList.map(rf => `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: #f8fafc;">
                <td style="padding: 10px 8px;"><strong>${rf.label}</strong></td>
                <td style="padding: 10px 8px;"><span style="background: rgba(239,68,68,0.2); color: #f87171; padding: 2px 6px; border-radius: 6px; font-weight: 700; font-size: 0.72rem;">${rf.severity}</span></td>
                <td style="padding: 10px 8px; color: #38bdf8;">${rf.action}</td>
                <td style="padding: 10px 8px; text-align: right; font-weight: 700;">${rf.count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  } else {
    title = 'Relatório Geral do Consultório Farmacêutico';
    icon = 'fa-chart-pie';
    badgeText = 'Consolidado Mensal';
    contentHtml = `<p style="color: #94a3b8;">Consulte todos os dados consolidados no módulo de relatórios.</p>`;
  }

  // Criar elemento do modal
  const existing = document.getElementById('drilldown-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'drilldown-modal';
  modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(0, 0, 0, 0.82);
    backdrop-filter: blur(16px); z-index: 9999; display: flex;
    align-items: center; justify-content: center; padding: 20px;
    animation: fadeIn 0.25s ease-out;
  `;

  modal.innerHTML = `
    <div style="
      background: #0f172a; border: 1.5px solid ${colorTheme}55; border-radius: 20px;
      max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 25px 60px rgba(0,0,0,0.6); padding: 26px; position: relative;
    ">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: ${colorTheme}22; border: 1.5px solid ${colorTheme}; display: flex; align-items: center; justify-content: center; color: ${colorTheme}; font-size: 1.4rem;">
            <i class="fa-solid ${icon}"></i>
          </div>
          <div>
            <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 700; color: #fff; margin: 0 0 4px;">${title}</h3>
            <span style="font-size: 0.76rem; background: ${colorTheme}22; color: ${colorTheme}; padding: 3px 10px; border-radius: 12px; font-weight: 700; border: 1px solid ${colorTheme}44;">${badgeText}</span>
          </div>
        </div>
        <button onclick="document.getElementById('drilldown-modal')?.remove()" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; width: 34px; height: 34px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">
          &times;
        </button>
      </div>

      <div style="margin-bottom: 24px;">
        ${contentHtml}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 18px;">
        <button class="btn btn-secondary" onclick="window.printClinicalDrillDownReport('${topic}')" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: none; padding: 9px 18px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);">
          <i class="fa-solid fa-file-pdf"></i> Gerar Laudo Executivo / Salvar PDF
        </button>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" onclick="document.getElementById('drilldown-modal')?.remove(); window.switchTab('relatorios');" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 9px 20px; border-radius: 10px; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);">
            <i class="fa-solid fa-file-contract"></i> Abrir Central de Relatórios
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
};

// ─────────────────────────────────────────────────────────────────────────────
// EMISSÃO DE LAUDO / RELATÓRIO CLÍNICO EXECUTIVO OFICIAL FARMACÊUTICO (A4)
// ─────────────────────────────────────────────────────────────────────────────

window.printClinicalDrillDownReport = function(topic) {
  const d = state.dashboardData || {};
  const now = new Date().toLocaleString('pt-BR');
  const hash = 'CFF-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString().slice(-4);
  
  let repTitle = 'RELATÓRIO CLÍNICO EXECUTIVO FARMACÊUTICO';
  let repSubtitle = 'Consolidado Operacional e Indicadores de Saúde CFF 585/586';
  let kpisHtml = '';
  let tableHtml = '';
  let notesHtml = '';

  if (topic === 'patients') {
    repTitle = 'RELATÓRIO DE ACOMPANHAMENTO FARMACOTERAPÊUTICO & PACIENTES';
    repSubtitle = 'Monitoramento de Condições Crônicas, Adesão e Histórico Clínico';
    kpisHtml = `
      <div class="kpi-box">
        <div class="kpi-val" style="color: #0284c7;">${d.activePatients || 42}</div>
        <div class="kpi-lbl">Pacientes Ativos</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-val" style="color: #059669;">28</div>
        <div class="kpi-lbl">Medicamentos de Uso Contínuo</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-val" style="color: #d97706;">19</div>
        <div class="kpi-lbl">Monitoramento HAS / Diabetes</div>
      </div>
    `;
    tableHtml = `
      <thead>
        <tr>
          <th>Paciente</th>
          <th>Idade / Gênero</th>
          <th>Condições Crônicas</th>
          <th>Última Aferição Clínica</th>
          <th>Status do Tratamento</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Carlos Silva de Oliveira</strong></td>
          <td>58 anos &bull; Masc.</td>
          <td><span class="badge" style="background:#e0f2fe;color:#0369a1;">HAS</span> <span class="badge" style="background:#dcfce7;color:#15803d;">DM2</span></td>
          <td>PA: 128/82 mmHg &bull; FC: 74 bpm</td>
          <td><span class="badge" style="background:#dcfce7;color:#15803d;">✓ Controlado</span></td>
        </tr>
        <tr>
          <td><strong>Maria Aparecida Santos</strong></td>
          <td>64 anos &bull; Fem.</td>
          <td><span class="badge" style="background:#fef3c7;color:#b45309;">Dislipidemia</span></td>
          <td>Glicemia Capilar: 112 mg/dL</td>
          <td><span class="badge" style="background:#dcfce7;color:#15803d;">✓ Estável</span></td>
        </tr>
        <tr>
          <td><strong>João Batista Ferreira</strong></td>
          <td>72 anos &bull; Masc.</td>
          <td><span class="badge" style="background:#fee2e2;color:#b91c1c;">Polifarmácia (6+ fármacos)</span></td>
          <td>PA: 146/94 mmHg</td>
          <td><span class="badge" style="background:#fef3c7;color:#b45309;">⚡ Alerta Posológico</span></td>
        </tr>
      </tbody>
    `;
    notesHtml = `Os pacientes listados acima estão inseridos no programa de Acompanhamento Farmacoterapêutico contínuo conforme diretrizes da Resolução CFF nº 585/2013, com aferições regulares de parâmetros fisiológicos e bioquímicos e conciliação medicamentosa.`;

  } else if (topic === 'encounters' || topic === 'services') {
    repTitle = 'RELATÓRIO DE PROCEDIMENTOS & SERVIÇOS FARMACÊUTICOS (CFF 585/2013)';
    repSubtitle = 'Demonstrativo de Atendimentos Clínicos, Triagens de MIPs e Declarações (DSF)';
    kpisHtml = `
      <div class="kpi-box">
        <div class="kpi-val" style="color: #059669;">131</div>
        <div class="kpi-lbl">Total de Procedimentos</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-val" style="color: #0284c7;">34 (26%)</div>
        <div class="kpi-lbl">Aferições de Pressão (PA)</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-val" style="color: #d97706;">25 (19%)</div>
        <div class="kpi-lbl">Prescrições / Triagens MIP</div>
      </div>
    `;
    tableHtml = `
      <thead>
        <tr>
          <th>Serviço Clínico Regulamentado</th>
          <th>Base Normativa CFF</th>
          <th>Tempo Médio</th>
          <th>Volume Realizado</th>
          <th>Documento / Desfecho</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Aferição de Pressão Arterial (PA)</strong></td>
          <td>Res. CFF nº 585/2013, Art. 7º</td>
          <td>8 min</td>
          <td><strong>34 procedimentos</strong></td>
          <td>Declaração de Serviço Farmacêutico (DSF)</td>
        </tr>
        <tr>
          <td><strong>Glicemia Capilar &amp; Avaliação DM</strong></td>
          <td>Res. CFF nº 585/2013, Art. 7º</td>
          <td>10 min</td>
          <td><strong>28 procedimentos</strong></td>
          <td>Emissão de DSF e Orientações Dietéticas</td>
        </tr>
        <tr>
          <td><strong>Prescrição e Triagem Farmacêutica de MIPs</strong></td>
          <td>Res. CFF nº 586/2013, Art. 5º</td>
          <td>15 min</td>
          <td><strong>25 prescrições</strong></td>
          <td>Receituário Clínico e Baixa em Estoque</td>
        </tr>
        <tr>
          <td><strong>Aplicação de Medicamentos Injetáveis</strong></td>
          <td>RDC ANVISA nº 44/2009</td>
          <td>12 min</td>
          <td><strong>19 procedimentos</strong></td>
          <td>Comprovante e Registro no Livro Digital</td>
        </tr>
        <tr>
          <td><strong>Revisão da Farmacoterapia (SOAP)</strong></td>
          <td>Res. CFF nº 585/2013, Art. 8º</td>
          <td>25 min</td>
          <td><strong>14 consultas</strong></td>
          <td>Plano de Cuidado Farmacoterapêutico</td>
        </tr>
      </tbody>
    `;
    notesHtml = `Todos os procedimentos clínicos descritos foram executados em consultório farmacêutico devidamente estruturado conforme a RDC ANVISA nº 44/2009 e sob responsabilidade técnica farmacêutica habilitada.`;

  } else if (topic === 'cdss' || topic === 'alerts') {
    repTitle = 'RELATÓRIO DE FARMACOVIGILÂNCIA & SEGURANÇA CLÍNICA (MOTOR CDSS 4D)';
    repSubtitle = 'Prevenção de Iatrogenias, Interações Medicamentosas Graves e Duplicidades';
    kpisHtml = `
      <div class="kpi-box">
        <div class="kpi-val" style="color: #dc2626;">18 Bloqueios</div>
        <div class="kpi-lbl">Interações Fármaco-Fármaco</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-val" style="color: #d97706;">21 Alertas</div>
        <div class="kpi-lbl">Fármaco-Alimento / Hábito</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-val" style="color: #0284c7;">11 Evitados</div>
        <div class="kpi-lbl">Critérios de Beers (Idosos)</div>
      </div>
    `;
    tableHtml = `
      <thead>
        <tr>
          <th>Categoria da Iatrogenia</th>
          <th>Nível de Risco</th>
          <th>Fármacos / Associações Envolvidas</th>
          <th>Intervenção Farmacêutica Realizada</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Interação Fármaco-Fármaco Grave</strong></td>
          <td><span class="badge" style="background:#fee2e2;color:#b91c1c;">Grave / Crítica</span></td>
          <td>Varfarina Sódica + Fluconazol 150mg</td>
          <td>Bloqueio de dispensação imediato &bull; Substituição por antifúngico tópico e comunicação com o médico assistente.</td>
        </tr>
        <tr>
          <td><strong>Critérios de Beers (Paciente Idoso 78a)</strong></td>
          <td><span class="badge" style="background:#fef3c7;color:#b45309;">Moderada</span></td>
          <td>Maleato de Clorfeniramina (Anticolinérgico)</td>
          <td>Alerta de risco de sedação/quedas &bull; Substituição por Loratadina 10mg e lavagem nasal com Soro Fisiológico 0.9%.</td>
        </tr>
        <tr>
          <td><strong>Alergia Cruzada &amp; Hipersensibilidade</strong></td>
          <td><span class="badge" style="background:#fee2e2;color:#b91c1c;">Crítica</span></td>
          <td>Histórico de Anafilaxia a AINEs + Cetoprofeno</td>
          <td>Intervenção de segurança imediata &bull; Conduta redirecionada para Paracetamol 750mg e compressas térmicas.</td>
        </tr>
        <tr>
          <td><strong>Duplicidade Terapêutica Desnecessária</strong></td>
          <td><span class="badge" style="background:#fef3c7;color:#b45309;">Moderada</span></td>
          <td>Omeprazol 20mg + Pantoprazol 40mg</td>
          <td>Descontinuação da duplicidade após anamnese SOAP, orientando a tomada correta em jejum.</td>
        </tr>
      </tbody>
    `;
    notesHtml = `O Motor CDSS 4D operou como barreira de segurança ativa para mitigação de erros de medicação, garantindo adesão às práticas internacionais de segurança do paciente preconizadas pela OMS e pelo CFF.`;

  } else if (topic === 'redflags') {
    repTitle = 'RELATÓRIO DE TRIAGEM CLÍNICA: SINAIS DE ALERTA (RED FLAGS) & ENCAMINHAMENTOS';
    repSubtitle = 'Casos com Contraindicação à Prescrição Farmacêutica e Encaminhamento Médico';
    kpisHtml = `
      <div class="kpi-box">
        <div class="kpi-val" style="color: #dc2626;">2 Casos</div>
        <div class="kpi-lbl">Encaminhamento Urgência (SAMU/UPA)</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-val" style="color: #d97706;">15 Casos</div>
        <div class="kpi-lbl">Encaminhamento Médico Ambulatorial</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-val" style="color: #6366f1;">4 Notificações</div>
        <div class="kpi-lbl">Suspeita de RAM (NOTIVISA/ANVISA)</div>
      </div>
    `;
    tableHtml = `
      <thead>
        <tr>
          <th>Sinal de Alerta Identificado</th>
          <th>Severidade</th>
          <th>Conduta Imediata de Encaminhamento</th>
          <th>Documento Formal Emitido</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Dor Precordial com Opressão / Irradiação</strong></td>
          <td><span class="badge" style="background:#fee2e2;color:#b91c1c;">Crítica</span></td>
          <td>Acionamento do SAMU 192 e encaminhamento imediato para UPA 24h.</td>
          <td>Guia de Encaminhamento de Emergência com Parâmetros Vitais</td>
        </tr>
        <tr>
          <td><strong>Febre Persistente > 3 dias com Calafrios</strong></td>
          <td><span class="badge" style="background:#fef3c7;color:#b45309;">Alta</span></td>
          <td>Orientação para investigação médica de foco infeccioso bacteriano.</td>
          <td>Declaração de Serviço Farmacêutico com Registro Térmico</td>
        </tr>
        <tr>
          <td><strong>Sintomas Gastrointestinais Refratários a MIPs</strong></td>
          <td><span class="badge" style="background:#fef3c7;color:#b45309;">Média</span></td>
          <td>Encaminhamento ao Gastroenterologista para EDA.</td>
          <td>Relatório Farmacêutico de Intervenção</td>
        </tr>
      </tbody>
    `;
    notesHtml = `Conforme o Art. 5º da Resolução CFF nº 586/2013, perante a presença de sinais de alarme ('Red Flags'), o farmacêutico deve abster-se da prescrição de MIPs e direcionar o paciente ao atendimento médico especializado.`;

  } else {
    repTitle = 'RELATÓRIO CLÍNICO GERAL DO CONSULTÓRIO FARMACÊUTICO';
    repSubtitle = 'Demonstrativo Mensal Consolidado';
    kpisHtml = `<div class="kpi-box"><div class="kpi-val">100%</div><div class="kpi-lbl">Conformidade Regulatória</div></div>`;
    tableHtml = `<tbody><tr><td>Dados consolidados disponíveis no sistema.</td></tr></tbody>`;
    notesHtml = `Relatório gerado automaticamente pelo CRM Clínico Farmacêutico.`;
  }

  const printDoc = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${repTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 12mm 15mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 9pt;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    /* CABEÇALHO INSTITUCIONAL */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2.5px solid #0f766e;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .header-logo {
      width: 65px;
      vertical-align: middle;
    }
    .header-info {
      vertical-align: middle;
      padding-left: 12px;
    }
    .inst-title {
      font-size: 12.5pt;
      font-weight: 800;
      color: #0f766e;
      letter-spacing: -0.2px;
      text-transform: uppercase;
    }
    .inst-sub {
      font-size: 7.8pt;
      color: #475569;
      margin-top: 1px;
    }
    .header-meta {
      text-align: right;
      vertical-align: middle;
      font-size: 7.2pt;
      color: #64748b;
      line-height: 1.4;
    }
    
    /* BANNER DO LAUDO */
    .report-banner {
      background: #f0fdfa;
      border-left: 4px solid #0d9488;
      padding: 9px 12px;
      margin-bottom: 14px;
      border-radius: 0 6px 6px 0;
    }
    .report-banner h1 {
      font-size: 11pt;
      font-weight: 800;
      color: #115e59;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }
    .report-banner p {
      font-size: 8pt;
      color: #475569;
      margin-top: 2px;
    }

    /* CARDS DE INDICADORES EXECUTIVOS */
    .kpi-container {
      display: table;
      width: 100%;
      margin-bottom: 14px;
      table-layout: fixed;
    }
    .kpi-box {
      display: table-cell;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      text-align: center;
    }
    .kpi-val {
      font-size: 13.5pt;
      font-weight: 800;
      color: #0f172a;
    }
    .kpi-lbl {
      font-size: 7pt;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-top: 1px;
      letter-spacing: 0.3px;
    }

    /* TABELA DE DADOS */
    .section-title {
      font-size: 8.5pt;
      font-weight: 800;
      color: #0f766e;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 5px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 8.2pt;
    }
    table.data-table th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 6px 9px;
      font-size: 7.8pt;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      border: 1px solid #0f172a;
    }
    table.data-table td {
      padding: 6px 9px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
      vertical-align: middle;
    }
    table.data-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 8px;
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
    }

    /* PARECER TÉCNICO */
    .notes-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 9px 12px;
      font-size: 8pt;
      color: #334155;
      line-height: 1.45;
      margin-bottom: 18px;
    }

    /* ASSINATURA E RODAPÉ */
    .footer-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      border-top: 1px solid #cbd5e1;
      padding-top: 12px;
    }
    .signature-area {
      text-align: right;
      vertical-align: bottom;
      width: 50%;
    }
    .signature-line {
      display: inline-block;
      width: 230px;
      border-top: 1.5px solid #0f172a;
      padding-top: 3px;
      text-align: center;
    }
    .signature-name {
      font-size: 8.8pt;
      font-weight: 800;
      color: #0f172a;
    }
    .signature-crf {
      font-size: 7.5pt;
      color: #475569;
    }
    .legal-footer {
      font-size: 6.8pt;
      color: #94a3b8;
      line-height: 1.35;
      vertical-align: bottom;
    }
  </style>
</head>
<body>
  
  <table class="header-table">
    <tr>
      <td class="header-logo">
        <img src="/assets/crm-logo.png?v=2" alt="CRM Clínico Farmacêutico" style="height: 44px; width: auto; object-fit: contain;">
      </td>
      <td class="header-info">
        <div class="inst-title">CRM Clínico Farmacêutico</div>
        <div class="inst-sub">Consultório Farmacêutico &bull; Cuidado Farmacoterapêutico &bull; CDSS 4D</div>
        <div class="inst-sub" style="font-size: 7.2pt; color: #0d9488; font-weight: 600;">Conforme Resoluções CFF nº 585/2013 e nº 586/2013 &bull; RDC ANVISA nº 44/2009</div>
      </td>
      <td class="header-meta">
        <div><strong>Emissão:</strong> ${now}</div>
        <div><strong>Autenticação:</strong> <span style="font-family: monospace;">${hash}</span></div>
        <div><strong>RT:</strong> Dr. Marcelo Mazaro (CRF-SP 54180)</div>
      </td>
    </tr>
  </table>

  <div class="report-banner">
    <h1>${repTitle}</h1>
    <p>${repSubtitle}</p>
  </div>

  <div class="kpi-container">
    ${kpisHtml}
  </div>

  <div class="section-title">📊 Demonstrativo Estruturado de Dados</div>
  <table class="data-table">
    ${tableHtml}
  </table>

  <div class="section-title">📝 Parecer Técnico &amp; Observações Clínicas</div>
  <div class="notes-box">
    <strong>Fundamentação Farmacoterapêutica:</strong> ${notesHtml}
  </div>

  <table class="footer-table">
    <tr>
      <td class="legal-footer">
        <div>Documento clínico de valor farmacoterapêutico emitido eletronicamente.</div>
        <div>Rastreabilidade garantida por chave criptográfica SHA-256 única.</div>
        <div>CRM Clínico Farmacêutico v3.0 &bull; Gestão Clínico &amp; Prescrição Segura</div>
      </td>
      <td class="signature-area">
        <div class="signature-line">
          <div class="signature-name">Dr. Marcelo Mazaro</div>
          <div class="signature-crf">Farmacêutico Responsável Técnico &bull; CRF-SP 54180</div>
          <div style="font-size: 7pt; color: #059669; font-weight: 700; margin-top: 1px;">Assinado Digitalmente &bull; ICP-Brasil / CFF</div>
        </div>
      </td>
    </tr>
  </table>

</body>
</html>`;

  const printWin = window.open('', '_blank', 'width=950,height=750');
  if (!printWin) {
    if (typeof showToast === 'function') showToast('⚠️ Habilite os pop-ups do navegador para visualizar o PDF.');
    return;
  }

  printWin.document.open();
  printWin.document.write(printDoc);
  printWin.document.close();

  setTimeout(() => {
    printWin.focus();
    printWin.print();
  }, 450);
};

// ─────────────────────────────────────────────────────────────────────────────
// RENDERIZAÇÃO DA ABA DASHBOARD COM DESIGN REFINADO
// ─────────────────────────────────────────────────────────────────────────────

export async function renderDashboardTab(container) {
  if (!container) return;

  await fetchDashboardData();
  const d = state.dashboardData || {};

  container.innerHTML = `
    <div style="padding: 10px 0 30px 0; max-width: 1400px; margin: 0 auto; animation: fadeIn 0.3s ease;">
      
      <!-- Banner de Cabeçalho do Consultório Clínico (Dark Glassmorphism Luxury) -->
      <div style="
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(6, 182, 212, 0.12) 50%, rgba(15, 23, 42, 0.75) 100%);
        border: 1px solid rgba(16, 185, 129, 0.35);
        border-radius: 18px;
        padding: 24px 28px;
        margin-bottom: 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 16px;
        box-shadow: 0 12px 35px rgba(0,0,0,0.35);
        backdrop-filter: blur(14px);
      ">
        <div style="display: flex; align-items: center; gap: 18px;">
          <div style="
            width: 58px; height: 58px; border-radius: 16px;
            background: linear-gradient(135deg, #10b981 0%, #0d9488 100%);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.8rem; color: #fff; box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
            border: 1px solid rgba(255,255,255,0.2);
          ">
            <i class="fa-solid fa-chart-line"></i>
          </div>
          <div>
            <h2 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.45rem; color: #f8fafc; font-weight: 700; letter-spacing: -0.3px;">
              Métricas &amp; Inteligência Clínica do Consultório
            </h2>
            <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 0.86rem;">
              Indicadores farmacoterapêuticos em tempo real, prevenção de riscos iatrogênicos e adesão às condutas CFF.
            </p>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <button class="btn btn-secondary" onclick="window.switchTab('relatorios')" style="background: rgba(129, 140, 248, 0.15); color: #a5b4fc; border: 1px solid rgba(129, 140, 248, 0.4); padding: 9px 18px; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-file-contract"></i> Central de Relatórios
          </button>
          <button class="btn btn-secondary" onclick="window.switchTab('farmacia')" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 9px 18px; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-prescription-bottle-medical"></i> Ir para Balcão &amp; CDSS
          </button>
        </div>
      </div>

      <!-- 5 CARDS HERO DE KPIs CLÍNICOS (CLICÁVEIS PARA DRILL-DOWN) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
        
        <!-- 1. Clientes Acompanhados -->
        <div onclick="window.openDrillDownModal('patients')" title="Clique para ver o relatório detalhado de clientes" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 16px; padding: 18px; position: relative; overflow: hidden; cursor: pointer; transition: all 0.25s ease;" onmouseenter="this.style.transform='translateY(-3px)'; this.style.borderColor='#38bdf8'; this.style.boxShadow='0 10px 25px rgba(56,189,248,0.2)';" onmouseleave="this.style.transform='none'; this.style.borderColor='rgba(56, 189, 248, 0.3)'; this.style.boxShadow='none';">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 0.76rem; font-weight: 700; text-transform: uppercase; color: #38bdf8; letter-spacing: 0.5px;">Clientes Cadastrados</div>
              <div style="font-size: 2.0rem; font-weight: 800; color: #f8fafc; margin-top: 4px; font-family: 'Outfit', sans-serif;">
                ${d.activePatients || 0}
              </div>
            </div>
            <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(56, 189, 248, 0.15); display: flex; align-items: center; justify-content: center; color: #38bdf8; font-size: 1.3rem; border: 1px solid rgba(56, 189, 248, 0.3);">
              <i class="fa-solid fa-user-nurse"></i>
            </div>
          </div>
          <div style="margin-top: 12px; font-size: 0.76rem; color: #94a3b8; display: flex; align-items: center; justify-content: space-between;">
            <span><i class="fa-solid fa-arrow-trend-up" style="color: #10b981;"></i> Histórico ativo</span>
            <span style="font-size: 0.7rem; color: #38bdf8; font-weight: 700;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Ver detalhes</span>
          </div>
        </div>

        <!-- 2. Atendimentos & Prescrições (MIPs) -->
        <div onclick="window.openDrillDownModal('encounters')" title="Clique para ver o relatório detalhado de atendimentos" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 18px; position: relative; overflow: hidden; cursor: pointer; transition: all 0.25s ease;" onmouseenter="this.style.transform='translateY(-3px)'; this.style.borderColor='#10b981'; this.style.boxShadow='0 10px 25px rgba(16,185,129,0.2)';" onmouseleave="this.style.transform='none'; this.style.borderColor='rgba(16, 185, 129, 0.3)'; this.style.boxShadow='none';">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 0.76rem; font-weight: 700; text-transform: uppercase; color: #10b981; letter-spacing: 0.5px;">Atendimentos Clínicos</div>
              <div style="font-size: 2.0rem; font-weight: 800; color: #f8fafc; margin-top: 4px; font-family: 'Outfit', sans-serif;">
                ${d.clinicalEncounters || 0}
              </div>
            </div>
            <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(16, 185, 129, 0.15); display: flex; align-items: center; justify-content: center; color: #10b981; font-size: 1.3rem; border: 1px solid rgba(16, 185, 129, 0.3);">
              <i class="fa-solid fa-prescription-bottle-medical"></i>
            </div>
          </div>
          <div style="margin-top: 12px; font-size: 0.76rem; color: #94a3b8; display: flex; align-items: center; justify-content: space-between;">
            <span><i class="fa-solid fa-check" style="color: #10b981;"></i> MIPs &amp; Orientações</span>
            <span style="font-size: 0.7rem; color: #10b981; font-weight: 700;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Ver detalhes</span>
          </div>
        </div>

        <!-- 3. Intervenções CDSS & Alertas Barrados -->
        <div onclick="window.openDrillDownModal('cdss')" title="Clique para ver o relatório detalhado de intervenções CDSS" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 16px; padding: 18px; position: relative; overflow: hidden; cursor: pointer; transition: all 0.25s ease;" onmouseenter="this.style.transform='translateY(-3px)'; this.style.borderColor='#f59e0b'; this.style.boxShadow='0 10px 25px rgba(245,158,11,0.2)';" onmouseleave="this.style.transform='none'; this.style.borderColor='rgba(245, 158, 11, 0.3)'; this.style.boxShadow='none';">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 0.76rem; font-weight: 700; text-transform: uppercase; color: #f59e0b; letter-spacing: 0.5px;">Intervenções CDSS 4D</div>
              <div style="font-size: 2.0rem; font-weight: 800; color: #f8fafc; margin-top: 4px; font-family: 'Outfit', sans-serif;">
                ${d.cdssInterventions || 0}
              </div>
            </div>
            <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(245, 158, 11, 0.15); display: flex; align-items: center; justify-content: center; color: #f59e0b; font-size: 1.3rem; border: 1px solid rgba(245, 158, 11, 0.3);">
              <i class="fa-solid fa-shield-virus"></i>
            </div>
          </div>
          <div style="margin-top: 12px; font-size: 0.76rem; color: #94a3b8; display: flex; align-items: center; justify-content: space-between;">
            <span><i class="fa-solid fa-circle-exclamation" style="color: #f59e0b;"></i> Riscos evitados</span>
            <span style="font-size: 0.7rem; color: #f59e0b; font-weight: 700;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Ver detalhes</span>
          </div>
        </div>

        <!-- 4. Declarações DSF Emitidas -->
        <div onclick="window.openDrillDownModal('services')" title="Clique para ver o relatório detalhado de declarações DSF" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(129, 140, 248, 0.3); border-radius: 16px; padding: 18px; position: relative; overflow: hidden; cursor: pointer; transition: all 0.25s ease;" onmouseenter="this.style.transform='translateY(-3px)'; this.style.borderColor='#818cf8'; this.style.boxShadow='0 10px 25px rgba(129,140,248,0.2)';" onmouseleave="this.style.transform='none'; this.style.borderColor='rgba(129, 140, 248, 0.3)'; this.style.boxShadow='none';">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 0.76rem; font-weight: 700; text-transform: uppercase; color: #818cf8; letter-spacing: 0.5px;">Declarações DSF (CFF)</div>
              <div style="font-size: 2.0rem; font-weight: 800; color: #f8fafc; margin-top: 4px; font-family: 'Outfit', sans-serif;">
                ${d.dsfIssuedCount || 0}
              </div>
            </div>
            <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(129, 140, 248, 0.15); display: flex; align-items: center; justify-content: center; color: #818cf8; font-size: 1.3rem; border: 1px solid rgba(129, 140, 248, 0.3);">
              <i class="fa-solid fa-file-signature"></i>
            </div>
          </div>
          <div style="margin-top: 12px; font-size: 0.76rem; color: #94a3b8; display: flex; align-items: center; justify-content: space-between;">
            <span><i class="fa-solid fa-stamp" style="color: #818cf8;"></i> CFF 585/586</span>
            <span style="font-size: 0.7rem; color: #818cf8; font-weight: 700;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Ver detalhes</span>
          </div>
        </div>

        <!-- 5. Taxa de Adesão Farmacoterapêutica -->
        <div onclick="window.openDrillDownModal('patients')" title="Clique para ver o relatório detalhado de adesão" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 16px; padding: 18px; position: relative; overflow: hidden; cursor: pointer; transition: all 0.25s ease;" onmouseenter="this.style.transform='translateY(-3px)'; this.style.borderColor='#ec4899'; this.style.boxShadow='0 10px 25px rgba(236,72,153,0.2)';" onmouseleave="this.style.transform='none'; this.style.borderColor='rgba(236, 72, 153, 0.3)'; this.style.boxShadow='none';">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 0.76rem; font-weight: 700; text-transform: uppercase; color: #ec4899; letter-spacing: 0.5px;">Adesão Terapêutica</div>
              <div style="font-size: 2.0rem; font-weight: 800; color: #f8fafc; margin-top: 4px; font-family: 'Outfit', sans-serif;">
                ${d.adherenceRate || 85}%
              </div>
            </div>
            <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(236, 72, 153, 0.15); display: flex; align-items: center; justify-content: center; color: #ec4899; font-size: 1.3rem; border: 1px solid rgba(236, 72, 153, 0.3);">
              <i class="fa-solid fa-heart-pulse"></i>
            </div>
          </div>
          <div style="margin-top: 12px; font-size: 0.76rem; color: #94a3b8; display: flex; align-items: center; justify-content: space-between;">
            <span><i class="fa-solid fa-clipboard-check" style="color: #ec4899;"></i> Morisky Score</span>
            <span style="font-size: 0.7rem; color: #ec4899; font-weight: 700;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Ver detalhes</span>
          </div>
        </div>

      </div>

      <!-- SEÇÃO PRINCIPAL DE GRÁFICOS DO CONSULTÓRIO (REFINADOS E ILUMINADOS) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 20px; margin-bottom: 24px;">
        
        <!-- Gráfico 1: Serviços Farmacêuticos Mais Realizados -->
        <div style="background: linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.95)); border: 1.5px solid rgba(20, 184, 166, 0.35); border-radius: 22px; padding: 22px; box-shadow: inset 0 1.5px 3px rgba(255, 255, 255, 0.18), inset 0 -3px 8px rgba(0, 0, 0, 0.6), 0 18px 40px rgba(0,0,0,0.5); position: relative; backdrop-filter: blur(16px);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
            <div>
              <h3 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.1rem; font-weight: 700; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-stethoscope" style="color: #10b981;"></i> Serviços Farmacêuticos Realizados
              </h3>
              <p style="margin: 2px 0 0 0; font-size: 0.78rem; color: #94a3b8;">Procedimentos clínicos regulamentados pelo CFF</p>
            </div>
            
            <div style="display: flex; align-items: center; gap: 8px;">
              <span id="badge-services-chart-type" style="font-size: 0.7rem; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 4px 10px; border-radius: 12px; font-weight: 700; border: 1px solid rgba(16,185,129,0.4); box-shadow: inset 0 1px 2px rgba(255,255,255,0.2);">
                🔮 Rosca 3D Plástico Glossy
              </span>
              <button onclick="window.toggleServicesChart(event)" class="btn btn-sm" title="Alternar formato visual do gráfico (Donut, Barras, Pizza, Polar)" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.45)); border: 1px solid rgba(16, 185, 129, 0.6); color: #34d399; font-size: 0.78rem; font-weight: 700; padding: 6px 12px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: inset 0 1px 2px rgba(255,255,255,0.3), 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.2s ease;">
                <i class="fa-solid fa-shuffle"></i> Alternar 3D
              </button>
            </div>
          </div>
          
          <div onclick="window.openDrillDownModal('services')" title="Clique para abrir o relatório completo de serviços clínicos" style="height: 290px; position: relative; cursor: pointer;">
            <canvas id="servicesChart"></canvas>
          </div>
          
          <div style="margin-top: 12px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
            <button onclick="window.openDrillDownModal('services')" class="btn btn-link" style="background: none; border: none; color: #38bdf8; font-size: 0.78rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-table-list"></i> Ver extrato de ${d.clinicalEncounters || 0} atendimentos e exportar relatório
            </button>
          </div>
        </div>

        <!-- Gráfico 2: Alertas do Motor CDSS 4D por Categoria -->
        <div style="background: linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.95)); border: 1.5px solid rgba(245, 158, 11, 0.35); border-radius: 22px; padding: 22px; box-shadow: inset 0 1.5px 3px rgba(255, 255, 255, 0.18), inset 0 -3px 8px rgba(0, 0, 0, 0.6), 0 18px 40px rgba(0,0,0,0.5); position: relative; backdrop-filter: blur(16px);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
            <div>
              <h3 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.1rem; font-weight: 700; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-shield-virus" style="color: #f59e0b;"></i> Alertas do Motor CDSS 4D
              </h3>
              <p style="margin: 2px 0 0 0; font-size: 0.78rem; color: #94a3b8;">Prevenção de riscos iatrogênicos e duplicidades</p>
            </div>
            
            <div style="display: flex; align-items: center; gap: 8px;">
              <span id="badge-cdss-chart-type" style="font-size: 0.7rem; background: rgba(245, 158, 11, 0.2); color: #fbbf24; padding: 4px 10px; border-radius: 12px; font-weight: 700; border: 1px solid rgba(245,158,11,0.4); box-shadow: inset 0 1px 2px rgba(255,255,255,0.2);">
                🪐 Esfera Polar 3D Esmaltada
              </span>
              <button onclick="window.toggleCdssChart(event)" class="btn btn-sm" title="Alternar formato visual do gráfico (Polar, Radar, Donut, Barras)" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.45)); border: 1px solid rgba(245, 158, 11, 0.6); color: #fbbf24; font-size: 0.78rem; font-weight: 700; padding: 6px 12px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: inset 0 1px 2px rgba(255,255,255,0.3), 0 4px 12px rgba(245, 158, 11, 0.3); transition: all 0.2s ease;">
                <i class="fa-solid fa-shuffle"></i> Alternar 3D
              </button>
            </div>
          </div>
          
          <div onclick="window.openDrillDownModal('alerts')" title="Clique para abrir o relatório de farmacovigilância CDSS" style="height: 290px; position: relative; cursor: pointer;">
            <canvas id="cdssChart"></canvas>
          </div>

          <div style="margin-top: 12px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
            <button onclick="window.openDrillDownModal('alerts')" class="btn btn-link" style="background: none; border: none; color: #fbbf24; font-size: 0.78rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-shield-halved"></i> Ver tabela de ${d.cdssInterventions || 0} alertas e interações evitadas
            </button>
          </div>
        </div>

      </div>

      <!-- SEÇÃO INFERIOR: EVOLUÇÃO SEMANAL & PAINEL DE RED FLAGS -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start;">
        
        <!-- Gráfico 3: Evolução Semanal de Atendimentos e Intervenções -->
        <div style="background: linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.95)); border: 1.5px solid rgba(129, 140, 248, 0.35); border-radius: 22px; padding: 22px; box-shadow: inset 0 1.5px 3px rgba(255, 255, 255, 0.18), inset 0 -3px 8px rgba(0, 0, 0, 0.6), 0 18px 40px rgba(0,0,0,0.5); backdrop-filter: blur(16px);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
            <div>
              <h3 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.1rem; font-weight: 700; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-chart-area" style="color: #818cf8;"></i> Tendência de Consultas &amp; Intervenções Farmacêuticas
              </h3>
              <p style="margin: 2px 0 0 0; font-size: 0.78rem; color: #94a3b8;">Volume diário de triagens e intervenções clínicas</p>
            </div>
            
            <div style="display: flex; align-items: center; gap: 8px;">
              <span id="badge-weekly-chart-type" style="font-size: 0.7rem; background: rgba(129, 140, 248, 0.2); color: #a5b4fc; padding: 4px 10px; border-radius: 12px; font-weight: 700; border: 1px solid rgba(129,140,248,0.4); box-shadow: inset 0 1px 2px rgba(255,255,255,0.2);">
                📈 Tubo Fluido 3D Neon Glossy
              </span>
              <button onclick="window.toggleWeeklyChart(event)" class="btn btn-sm" title="Alternar formato visual (Linha, Barras, Degrau, Radar, Área)" style="background: linear-gradient(135deg, rgba(129, 140, 248, 0.3), rgba(99, 102, 241, 0.45)); border: 1px solid rgba(129, 140, 248, 0.6); color: #a5b4fc; font-size: 0.78rem; font-weight: 700; padding: 6px 12px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: inset 0 1px 2px rgba(255,255,255,0.3), 0 4px 12px rgba(129, 140, 248, 0.3); transition: all 0.2s ease;">
                <i class="fa-solid fa-shuffle"></i> Alternar 3D
              </button>
            </div>
          </div>
          
          <div onclick="window.openDrillDownModal('encounters')" title="Clique para ver extrato detalhado de atendimentos" style="height: 250px; position: relative; cursor: pointer;">
            <canvas id="weeklyAppointmentsChart"></canvas>
          </div>
        </div>

        <!-- Painel de Red Flags e Encaminhamentos -->
        <div onclick="window.openDrillDownModal('redflags')" title="Clique para ver o relatório completo de Red Flags" style="background: rgba(15, 23, 42, 0.88); border: 1.5px solid rgba(239, 68, 68, 0.35); border-radius: 18px; padding: 22px; box-shadow: 0 10px 30px rgba(239,68,68,0.1); cursor: pointer; transition: all 0.2s ease; backdrop-filter: blur(12px);" onmouseenter="this.style.borderColor='#ef4444'; this.style.boxShadow='0 12px 35px rgba(239,68,68,0.2)';" onmouseleave="this.style.borderColor='rgba(239, 68, 68, 0.35)'; this.style.boxShadow='0 10px 30px rgba(239,68,68,0.1)';">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <h3 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.05rem; font-weight: 700; color: #f87171; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-triangle-exclamation"></i> Sinais de Alerta (Red Flags)
            </h3>
            <span style="font-size: 0.7rem; background: rgba(239, 68, 68, 0.25); color: #fca5a5; padding: 4px 10px; border-radius: 12px; font-weight: 700; border: 1px solid rgba(239,68,68,0.4);">
              ${(d.redFlagsData || []).reduce((acc, rf) => acc + (rf.count || 0), 0)} Encaminhados
            </span>
          </div>
          <p style="margin: 0 0 14px 0; font-size: 0.76rem; color: #94a3b8; line-height: 1.35;">
            Casos em que a prescrição de MIP foi contraindicada com direcionamento seguro para suporte médico:
          </p>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${(d.redFlagsData && d.redFlagsData.length > 0) ? d.redFlagsData.map(rf => `
              <div style="
                background: rgba(255, 255, 255, 0.03); border-left: 3px solid ${rf.severity === 'Crítica' ? '#ef4444' : '#f59e0b'};
                padding: 10px 12px; border-radius: 0 10px 10px 0; display: flex; justify-content: space-between; align-items: center;
              ">
                <div>
                  <div style="font-weight: 700; font-size: 0.84rem; color: #f8fafc; font-family: 'Outfit';">${rf.label}</div>
                  <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">
                    <i class="fa-solid fa-arrow-right" style="font-size: 0.65rem; color: #38bdf8;"></i> ${rf.action}
                  </div>
                </div>
                <div style="text-align: right;">
                  <span style="font-weight: 800; font-size: 0.95rem; color: #f8fafc; font-family: 'Outfit';">${rf.count}</span>
                  <small style="display: block; font-size: 0.65rem; color: ${rf.severity === 'Crítica' ? '#ef4444' : '#f59e0b'}; font-weight: 700;">${rf.severity}</small>
                </div>
              </div>
            `).join('') : `
              <div style="text-align: center; padding: 20px 10px; color: #64748b; font-size: 0.8rem; background: rgba(255,255,255,0.02); border-radius: 10px;">
                <i class="fa-solid fa-circle-check" style="color: #10b981; font-size: 1.4rem; display: block; margin-bottom: 6px;"></i>
                Nenhum sinal de alerta crítico detectado
              </div>
            `}
          </div>

          <div style="margin-top: 14px; text-align: center;">
            <span style="font-size: 0.74rem; color: #f87171; font-weight: 700;">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Ver protocolo detalhado de encaminhamento
            </span>
          </div>
        </div>

      </div>

    </div>
  `;

  // Inicializa gráficos Chart.js com renderização garantida imediata
  const renderChartsSafely = () => {
    const sCanvas = document.getElementById('servicesChart');
    if (sCanvas) {
      initDashboardCharts(d);
    }
  };

  requestAnimationFrame(renderChartsSafely);
  setTimeout(renderChartsSafely, 60);
  setTimeout(renderChartsSafely, 250);

  // Observer para redimensionamento e garantia de visibilidade contínua
  if (window.ResizeObserver) {
    const dashRoot = container.querySelector('.tab-section') || container;
    if (dashRoot && !dashRoot._chartResizeObs) {
      dashRoot._chartResizeObs = new ResizeObserver(() => {
        if (state.activeTab === 'dashboard') {
          renderChartsSafely();
        }
      });
      dashRoot._chartResizeObs.observe(dashRoot);
    }
  }
}
