/**
 * Módulo de Geração de PIX Dinâmico / Estático (Padrão Banco Central do Brasil - BR Code / EMV QRCPS-MPM)
 * Responsável por gerar a Linha Pix "Copia e Cola" e o Payload com cálculo de CRC16.
 */

function formatEMV(id, value) {
  const len = String(value.length).padStart(2, '0');
  return `${id}${len}${value}`;
}

function calculateCRC16(payload) {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= (payload.charCodeAt(i) << 8);
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Gera o payload oficial do PIX (EMV BR Code)
 * @param {Object} params
 * @param {string} params.key - Chave PIX (CPF, CNPJ, E-mail, Telefone ou Aleatória)
 * @param {string} params.name - Nome do recebedor (Max 25 caracteres)
 * @param {string} params.city - Cidade do recebedor (Max 15 caracteres)
 * @param {number} params.amount - Valor da transação (Ex: 120.50)
 * @param {string} params.txid - Identificador único da transação (Ex: CRM12345)
 * @param {string} params.description - Descrição opcional da transação
 */
export function generatePixPayload({
  key = 'contato@farmaciaclinica.com.br',
  name = 'CRM CLINICO FARMACEUTICO',
  city = 'SAO PAULO',
  amount = 0,
  txid = '***',
  description = ''
}) {
  // Limpeza e normalização
  const cleanKey = String(key).trim();
  const cleanName = String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().substring(0, 25);
  const cleanCity = String(city).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().substring(0, 15);
  const cleanTxid = String(txid).replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) || '***';
  
  // 00 - Payload Format Indicator
  let payload = formatEMV('00', '01');

  // 26 - Merchant Account Information (GUI + Chave + Info Adicional)
  let merchantAccount = formatEMV('00', 'br.gov.bcb.pix');
  merchantAccount += formatEMV('01', cleanKey);
  if (description) {
    merchantAccount += formatEMV('02', String(description).substring(0, 40));
  }
  payload += formatEMV('26', merchantAccount);

  // 52 - Merchant Category Code (0000 padrão)
  payload += formatEMV('52', '0000');

  // 53 - Transaction Currency (986 = BRL Real)
  payload += formatEMV('53', '986');

  // 54 - Transaction Amount (Se > 0)
  if (amount && Number(amount) > 0) {
    const formattedAmount = Number(amount).toFixed(2);
    payload += formatEMV('54', formattedAmount);
  }

  // 58 - Country Code (BR)
  payload += formatEMV('58', 'BR');

  // 59 - Merchant Name
  payload += formatEMV('59', cleanName || 'CRM CLINICO');

  // 60 - Merchant City
  payload += formatEMV('60', cleanCity || 'SAO PAULO');

  // 62 - Additional Data Field Template (TXID)
  const additionalData = formatEMV('05', cleanTxid);
  payload += formatEMV('62', additionalData);

  // 63 - CRC16 (Calculado sobre o payload + '6304')
  payload += '6304';
  const crc = calculateCRC16(payload);
  payload += crc;

  return payload;
}

/**
 * Gera URL de QR Code usando serviço rápido de QR ou Canvas
 * @param {string} payload - Payload do PIX Copia e Cola
 */
export function getPixQRCodeUrl(payload, size = 250) {
  const encoded = encodeURIComponent(payload);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=8`;
}
