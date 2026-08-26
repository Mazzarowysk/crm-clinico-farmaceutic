// ============================================================================
// 🌿 SCRIPT DE SINCRONIZAÇÃO E MIGRAÇÃO DO CRM CLÍNICO FARMACÊUTICO NO TURSO
// ============================================================================
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.TURSO_DATABASE_URL || 'libsql://crm-clinico-farmaceutico-mazzarowysk.aws-us-east-1.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc3MDE4ODUsImlkIjoiMDFhMDNiNTUtZGIwMS03NzhkLTg3MzctNDBmNTljY2RjNzEwIiwia2lkIjoiU0RZWEtINkIzZWg1b3JtRDBPRXpUbmhUaGpFMllXRXJxbjhCNVFnSmVLZyIsInJpZCI6ImJhOGY5NjVjLWVkMTUtNGQzOC1hZGJkLTlkYWFhMmRkMjg1YiJ9._XnhBxBbCgxX6tJV115CnNRzE0fHx49TMvv6igv1EIjMOEeVuIGB9EP1QgTxO_famkEZrk2-vRPBuoHGz5KxAA';

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
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        crf TEXT,
        password TEXT NOT NULL,
        status TEXT DEFAULT 'Ativo',
        created_at TEXT
      );
    `);
    console.log('✅ Tabela users criada/verificada no Turso Cloud.');

    // Seed do usuário Master mazzarowysk
    await client.execute({
      sql: `INSERT OR REPLACE INTO users (id, name, username, role, crf, password, status, created_at)
            VALUES ('USR-MAZZAROWYSK', 'Marcelo Mazaro (Master Gestor)', 'mazzarowysk', 'Master', 'CRF-SP 54180', 'T@zm4n1c0054180', 'Ativo', datetime('now'))`,
      args: []
    });
    console.log('👑 Usuário Master mazzarowysk gravado com sucesso no Turso Cloud.');

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
