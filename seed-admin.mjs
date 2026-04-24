import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Seed Service Cards
const cards = [
  { name: 'Conta Uber', imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663543456340/RjBUSWZB6B8QJu724zr2z2/pasted_file_LHCgM5_3b2a1cae.jpg', borderColor: 'primary/30', buttonText: 'COMPRA > CONTA UBER', guaranteeText: 'Garantia de 7 dias', sortOrder: 1 },
  { name: 'Conta 99', imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663543456340/RjBUSWZB6B8QJu724zr2z2/pasted_file_JrgoAF_f6b2f1c3.jpg', borderColor: 'secondary/30', buttonText: 'COMPRA > CONTA 99', guaranteeText: 'Garantia de 7 dias', sortOrder: 2 },
  { name: 'Conta InDrive', imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663543456340/RjBUSWZB6B8QJu724zr2z2/pasted_file_21g0zm_b4a6c1d7.jpg', borderColor: 'primary/30', buttonText: 'COMPRA > CONTA INDRIVE', guaranteeText: 'Garantia de 7 dias', sortOrder: 3 },
  { name: 'Serviços Documento Carro', imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663543456340/RjBUSWZB6B8QJu724zr2z2/pasted_file_DdeEjL_e8c3a2b5.jpg', borderColor: 'accent/30', buttonText: 'COMPRA > EDIÇÃO DE DOCUMENTO', guaranteeText: 'Garantia de entrega', sortOrder: 4 },
  { name: 'UBER TAXI', imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663543456340/RjBUSWZB6B8QJu724zr2z2/pasted_file_hsKF9V_d7b5e4a9.jpg', borderColor: 'yellow-500/30', buttonText: 'COMPRA > UBER TAXI', guaranteeText: 'Garantia de 7 dias', sortOrder: 5 },
];

for (const card of cards) {
  await conn.execute(
    'INSERT INTO serviceCards (name, imageUrl, borderColor, buttonText, guaranteeText, sortOrder, active) VALUES (?, ?, ?, ?, ?, ?, 1)',
    [card.name, card.imageUrl, card.borderColor, card.buttonText, card.guaranteeText, card.sortOrder]
  );
}
console.log('✅ Cards criados');

// Get card IDs
const [cardRows] = await conn.execute('SELECT id, name FROM serviceCards ORDER BY sortOrder');

const cardMap = {};
for (const row of cardRows) {
  cardMap[row.name] = row.id;
}

// Seed Card Models (preços em centavos)
const models = [
  { cardName: 'Conta Uber', optionType: 'random', optionLabel: 'Nome Aleatório', price: 40000 },
  { cardName: 'Conta Uber', optionType: 'first', optionLabel: 'Primeiro Nome', price: 55000 },
  { cardName: 'Conta 99', optionType: 'random', optionLabel: 'Nome Aleatório', price: 45000 },
  { cardName: 'Conta 99', optionType: 'first', optionLabel: 'Primeiro Nome', price: 65000 },
  { cardName: 'Conta InDrive', optionType: 'random', optionLabel: 'Nome Aleatório', price: 30000 },
  { cardName: 'Conta InDrive', optionType: 'first', optionLabel: 'Primeiro Nome', price: 45000 },
  { cardName: 'Serviços Documento Carro', optionType: 'random', optionLabel: 'Subir Doc de Ano', price: 17500 },
  { cardName: 'UBER TAXI', optionType: 'random', optionLabel: 'Nome Aleatório', price: 65000 },
  { cardName: 'UBER TAXI', optionType: 'first', optionLabel: 'Primeiro Nome', price: 85000 },
];

let sortOrder = 0;
for (const model of models) {
  const cardId = cardMap[model.cardName];
  if (!cardId) { console.log(`⚠️ Card não encontrado: ${model.cardName}`); continue; }
  sortOrder++;
  await conn.execute(
    'INSERT INTO cardModels (cardId, optionType, optionLabel, price, active, sortOrder) VALUES (?, ?, ?, ?, 1, ?)',
    [cardId, model.optionType, model.optionLabel, model.price, sortOrder]
  );
}
console.log('✅ Modelos criados');

// Seed Card Documents
const docs = [
  // Conta Uber
  { cardName: 'Conta Uber', docType: 'profilePhoto', docLabel: 'Foto de Perfil', required: 1 },
  { cardName: 'Conta Uber', docType: 'carDocument', docLabel: 'Documento do Carro', required: 1 },
  // Conta 99
  { cardName: 'Conta 99', docType: 'profilePhoto', docLabel: 'Foto de Perfil', required: 1 },
  { cardName: 'Conta 99', docType: 'carDocument', docLabel: 'Documento do Carro', required: 1 },
  // Conta InDrive
  { cardName: 'Conta InDrive', docType: 'profilePhoto', docLabel: 'Foto de Perfil', required: 1 },
  { cardName: 'Conta InDrive', docType: 'carDocument', docLabel: 'Documento do Carro', required: 1 },
  // Serviços Documento Carro
  { cardName: 'Serviços Documento Carro', docType: 'pdf', docLabel: 'Documento PDF', required: 1 },
  // UBER TAXI
  { cardName: 'UBER TAXI', docType: 'profilePhoto', docLabel: 'Foto de Perfil', required: 1 },
  { cardName: 'UBER TAXI', docType: 'carDocument', docLabel: 'Documento do Carro', required: 1 },
  { cardName: 'UBER TAXI', docType: 'alvara', docLabel: 'Alvará', required: 1 },
  { cardName: 'UBER TAXI', docType: 'condutaxi', docLabel: 'Condutaxi', required: 1 },
];

sortOrder = 0;
for (const doc of docs) {
  const cardId = cardMap[doc.cardName];
  if (!cardId) { console.log(`⚠️ Card não encontrado: ${doc.cardName}`); continue; }
  sortOrder++;
  await conn.execute(
    'INSERT INTO cardDocuments (cardId, docType, docLabel, `required`, active, sortOrder) VALUES (?, ?, ?, ?, 1, ?)',
    [cardId, doc.docType, doc.docLabel, doc.required, sortOrder]
  );
}
console.log('✅ Documentos criados');

// Seed site settings defaults
const settings = [
  { key: 'site_title', value: 'WALK CONTAS' },
  { key: 'site_subtitle', value: 'Atendimento Rápido no WhatsApp' },
  { key: 'hero_title', value: 'Atendimento <span class="text-primary">Rápido</span> no WhatsApp' },
  { key: 'hero_subtitle', value: 'Suporte direto para motoristas de Uber, 99 e InDrive. Respostas em minutos, não em horas.' },
  { key: 'hero_video_url', value: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663543456340/RjBUSWZB6B8QJu724zr2z2/grok-video-773cd6a1-9692-4475-8a8a-d92ce6336761_d82b163c.mp4' },
  { key: 'whatsapp_number', value: '5511978307371' },
  { key: 'whatsapp_display', value: '(11) 97830-7371' },
  { key: 'footer_hours', value: '24H' },
  { key: 'promo_active', value: 'false' },
  { key: 'promo_text', value: 'HOJE TEM DESCONTO DE R$100, AO FINALIZAR O PEDIDO' },
  { key: 'vip_timeout_minutes', value: '20' },
];

for (const s of settings) {
  await conn.execute(
    'INSERT INTO siteSettings (`key`, value, type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?',
    [s.key, s.value, 'string', s.value]
  );
}
console.log('✅ Configurações do site criadas');

// Seed PIX settings
const pixDefaults = [
  { key: 'pix_key', value: '11915193551' },
  { key: 'pix_holder', value: 'Adiel Cardeal dos Santos' },
  { key: 'pix_bank', value: '99Pay' },
];

for (const p of pixDefaults) {
  await conn.execute(
    'INSERT INTO pixSettings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
    [p.key, p.value, p.value]
  );
}
console.log('✅ Configurações PIX criadas');

await conn.end();
console.log('🎉 Seed completo!');
