/**
 * CRM Clínico Farmacêutico & CDSS 4D v3.0
 * Definições de Tipos TypeScript para Entidades de Negócio e Suporte à Decisão Clínica
 */

export type RoleType = 'Master' | 'Farmacêutico RT' | 'Farmacêutico Clínico' | 'Administrador' | 'Atendente';

export type ManchesterRiskLevel = 'Vermelho' | 'Laranja' | 'Amarelo' | 'Verde' | 'Azul';

export type EncounterStatus = 'Aguardando' | 'Triagem' | 'Em Atendimento' | 'Observação' | 'Concluído' | 'Cancelado';

export interface User {
  id: string;
  username: string;
  name: string;
  role: RoleType;
  crf?: string;
  status: 'Ativo' | 'Pendente' | 'Inativo';
  createdAt: string;
}

export interface Patient {
  id: string;
  fullName: string;
  cpf: string;
  birthDate: string;
  gender: 'M' | 'F' | 'Outro';
  phone?: string;
  cellphone?: string;
  email?: string;
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };
  chronicConditions?: string[];
  allergies?: string[];
  continuousMedications?: string[];
  bloodType?: string;
  healthInsurance?: string;
  insuranceNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ClinicalVitals {
  bloodPressure?: string; // ex: "120/80"
  heartRateBpm?: number; // FC
  temperatureCelsius?: number; // Temp
  respiratoryRateRpm?: number; // FR
  oxygenSaturation?: number; // SpO2 (%)
  bloodGlucoseMgDl?: number; // Glicemia (mg/dL)
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  painScale?: number; // 0 a 10
  glasgowScale?: number; // 3 a 15
}

export interface MEWSResult {
  score: number;
  riskCategory: 'Baixo' | 'Moderado' | 'Alto' | 'Crítico';
  colorCode: string;
  reasons: string[];
  recommendedAction: string;
}

export interface Medication {
  id: string;
  name: string;
  activeIngredient: string; // DCB / DCI
  therapeuticClass: string;
  presentation: string; // ex: "50mg Caixa com 30 comprimidos"
  eanBarcode?: string;
  isPrescriptionFree: boolean; // MIP (Medicamento Isento de Prescrição)
  controlType?: 'Livre' | 'Portaria 344/A1' | 'Portaria 344/B1' | 'Portaria 344/C1' | 'Antimicrobiano';
  beersCriteriaWarning?: boolean; // Alerta para idosos
  renalAdjustmentWarning?: boolean;
  pregnancyCategory?: 'A' | 'B' | 'C' | 'D' | 'X';
  currentStock: number;
  minimumStock: number;
  costPrice: number;
  salePrice: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface DrugInteraction {
  drugA: string;
  drugB: string;
  severity: 'Grave' | 'Moderada' | 'Leve' | 'Contraindicado';
  mechanism: string;
  clinicalEffect: string;
  recommendation: string;
}

export interface CDSS4DAlert {
  dimension: 'Drug-Drug' | 'Drug-Allergy' | 'Drug-Disease' | 'Drug-Food-Habit';
  severity: 'Contraindicação Absoluta' | 'Risco Alto' | 'Alerta Moderado' | 'Orientação';
  title: string;
  description: string;
  actionRequired: 'Bloquear Prescrição' | 'Ajustar Dose' | 'Monitorar' | 'Informar Paciente';
}

export interface PrescriptionItem {
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: 'Oral' | 'Tópica' | 'Inalatória' | 'Intramuscular' | 'Subcutânea' | 'Oftálmica' | 'Nasal';
  quantity: number;
  specialInstructions?: string;
}

export interface ClinicalEncounter {
  id: string;
  patientId: string;
  patientName: string;
  patientCpf: string;
  pharmacistId: string;
  pharmacistName: string;
  pharmacistCrf: string;
  status: EncounterStatus;
  startedAt: string;
  finishedAt?: string;
  vitals: ClinicalVitals;
  soapNotes: {
    subjective: string; // Relato do paciente
    objective: string;   // Achados e exames
    assessment: string;  // Hipótese diagnóstica / CID-10
    plan: string;        // Prescrição e conduta
  };
  cid10Code?: string;
  cid10Description?: string;
  prescriptions: PrescriptionItem[];
  mewsScore?: MEWSResult;
  cdssAlerts?: CDSS4DAlert[];
  redFlagsDetected?: string[];
  isMedicalReferral: boolean;
  medicalReferralReason?: string;
  digitalSignatureHash?: string;
}

export interface VaccineRecord {
  id: string;
  patientId: string;
  vaccineName: string;
  dose: '1ª Dose' | '2ª Dose' | '3ª Dose' | 'Reforço' | 'Dose Única';
  batchNumber: string;
  manufacturer: string;
  applicationSite: 'Deltoide Direito' | 'Deltoide Esquerdo' | 'Vasto Lateral Direito' | 'Vasto Lateral Esquerdo';
  applicationRoute: 'Intramuscular' | 'Subcutânea' | 'Intradérmica' | 'Oral';
  appliedByCrf: string;
  appliedAt: string;
}

export interface SngpcRecord {
  id: string;
  movementType: 'Entrada (NF)' | 'Saída (Dispensação)' | 'Perda/Avaria' | 'Transferência';
  medicationName: string;
  activeIngredient: string;
  batchNumber: string;
  quantity: number;
  doctorName?: string;
  doctorCrm?: string;
  doctorCrmUf?: string;
  prescriptionDate?: string;
  prescriptionNotificationNumber?: string;
  buyerName?: string;
  buyerCpf?: string;
  registeredAt: string;
}

export interface FinancialInstallment {
  id: string;
  type: 'Receita' | 'Despesa';
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'Dinheiro' | 'PIX' | 'Cartão de Débito' | 'Cartão de Crédito' | 'Boleto' | 'Convênio';
  status: 'Pago' | 'Pendente' | 'Cancelado';
  encounterId?: string;
  patientId?: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

export interface CashRegister {
  id: string;
  operatorId: string;
  openedAt: string;
  closedAt?: string;
  initialCashFloat: number;
  expectedCashTotal?: number;
  declaredCashTotal?: number;
  cashDifference?: number;
  status: 'Aberto' | 'Fechado';
}
