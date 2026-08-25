// ============================================================================
// 🌿 SCRIPT DE SINCRONIZAÇÃO E MIGRAÇÃO DO CRM CLÍNICO FARMACÊUTICO NO TURSO
// ============================================================================
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.TURSO_DATABASE_URL || 'libsql://health-nexus-mazzarowysk.aws-us-east-1.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODYxNDU1NTgsImlkIjoiMDE5Zjc1YmYtMTUwMS03YmMyLTlkYTQtZTA1ZGIxMzdiYjEyIiwia2lkIjoiU0RZWEtINkIzZWg1b3JtRDBPRXpUbmhUaGpFMllXRXJxbjhCNVFnSmVLZyIsInJpZCI6Ijg4YTY2NjM0LTM3YWQtNGEyZC04ZmUxLTFmYjM3ZDAxNGE4YiJ9.teLr9MEIIXvjkOJh_nUWWaGwJuF0vnFwaMdUsyQLQba1kLOP30ziYQJkCWDDbADYl74zhYLujOwdr0Gg5EWoAg';

console.log('🌿 Conectando ao Turso Database:', url);
const client = createClient({ url, authToken });

async function initTursoCRM() {
  try {
    // 1. Criar tabela de sincronização de estado
    await client.execute(`
      CREATE TABLE IF NOT EXISTS ocz_sync (
        id TEXT PRIMARY KEY,
        dados_json TEXT,
        config_json TEXT,
        updated_at INTEGER
      );
    `);
    console.log('✅ Tabela ocz_sync verificada/criada com sucesso no Turso Cloud.');

    // 2. Criar tabelas relacionais dedicadas para o CRM Farmacêutico
    await client.execute(`
      CREATE TABLE IF NOT EXISTS pharmacy_patients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        cpf TEXT,
        birthDate TEXT,
        age INTEGER,
        gender TEXT,
        phone TEXT,
        allergies TEXT,
        chronicConditions TEXT,
        isPregnantOrLactating INTEGER DEFAULT 0,
        renalImpairment INTEGER DEFAULT 0,
        hepaticImpairment INTEGER DEFAULT 0,
        observations TEXT,
        created_at TEXT
      );
    `);
    console.log('✅ Tabela pharmacy_patients criada/verificada.');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS pharmacy_active_meds (
        id TEXT PRIMARY KEY,
        patient_id TEXT,
        medication_name TEXT,
        dosage TEXT,
        frequency TEXT,
        indication TEXT,
        prescriber TEXT,
        start_date TEXT,
        estimated_end_date TEXT,
        is_continuous INTEGER DEFAULT 1,
        adherence_rate TEXT,
        FOREIGN KEY(patient_id) REFERENCES pharmacy_patients(id)
      );
    `);
    console.log('✅ Tabela pharmacy_active_meds criada/verificada.');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS pharmacy_attendances (
        id TEXT PRIMARY KEY,
        patient_id TEXT,
        pharmacist_name TEXT,
        pharmacist_crf TEXT,
        data_hora TEXT,
        tipo_visita TEXT,
        queixa_triagem TEXT,
        duracao_dias INTEGER,
        intensidade TEXT,
        red_flags TEXT,
        prescricao_mips TEXT,
        recomendacoes_nao_farmaco TEXT,
        conduta_final TEXT,
        observacoes TEXT,
        FOREIGN KEY(patient_id) REFERENCES pharmacy_patients(id)
      );
    `);
    console.log('✅ Tabela pharmacy_attendances criada/verificada.');

    // 3. Testar leitura no Turso
    const syncRes = await client.execute("SELECT id, updated_at FROM ocz_sync WHERE id = 'main'");
    console.log('📊 Status da Sincronização Principal no Turso:', syncRes.rows);

    console.log('\n🎉 TURSO CLOUD ESTÁ 100% OPERACIONAL E VINCULADO AO CRM CLÍNICO FARMACÊUTICO!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao inicializar tabelas no Turso:', err);
    process.exit(1);
  }
}

initTursoCRM();
