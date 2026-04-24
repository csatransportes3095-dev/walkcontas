import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabela de senhas VIP para acesso ao site
export const accessCodes = mysqlTable("accessCodes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  type: mysqlEnum("type", ["general", "vip"]).notNull().default("vip"),
  status: mysqlEnum("status", ["active", "used", "disabled"])
    .notNull()
    .default("active"),
  clientName: text("clientName"),
  usedAt: timestamp("usedAt"),
  usedBy: text("usedBy"),
  maxUses: int("maxUses").default(1),
  currentUses: int("currentUses").default(0),
  expiresInMinutes: int("expiresInMinutes").default(30),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AccessCode = typeof accessCodes.$inferSelect;
export type InsertAccessCode = typeof accessCodes.$inferInsert;

// Tabela de log de uso de senhas VIP
export const accessCodeLogs = mysqlTable("accessCodeLogs", {
  id: int("id").autoincrement().primaryKey(),
  accessCodeId: int("accessCodeId").notNull(), // FK para accessCodes
  accessCode: varchar("accessCode", { length: 64 }).notNull(), // código usado
  action: mysqlEnum("action", ["login", "submit", "consume"]).notNull(),
  clientIp: varchar("clientIp", { length: 64 }),
  details: text("details"), // JSON com info extra
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AccessCodeLog = typeof accessCodeLogs.$inferSelect;
export type InsertAccessCodeLog = typeof accessCodeLogs.$inferInsert;

// Tabela de cupons de desconto
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  discountType: mysqlEnum("discountType", ["percentage", "fixed"])
    .notNull()
    .default("fixed"),
  discountValue: int("discountValue").notNull(), // Em centavos para fixed, ou porcentagem (1-100)
  status: mysqlEnum("status", ["active", "used", "disabled"])
    .notNull()
    .default("active"),
  maxUses: int("maxUses").default(1),
  currentUses: int("currentUses").default(0),
  expiresAt: timestamp("expiresAt"),
  usedBy: text("usedBy"),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

// Tabela de configurações gerais do site
export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(), // Ex: "site_title", "site_description", "whatsapp_number"
  value: text("value").notNull(),
  type: mysqlEnum("type", ["string", "number", "boolean", "json"])
    .notNull()
    .default("string"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

// Tabela de configurações de PIX
export const pixSettings = mysqlTable("pixSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(), // Ex: "pix_key", "pix_holder", "pix_bank", "pix_qrcode"
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PixSetting = typeof pixSettings.$inferSelect;
export type InsertPixSetting = typeof pixSettings.$inferInsert;

// Tabela de cards de serviço (cada card na página inicial)
export const serviceCards = mysqlTable("serviceCards", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Ex: "Conta Uber"
  imageUrl: text("imageUrl"), // URL da imagem do card
  borderColor: varchar("borderColor", { length: 64 }).default("primary/30"), // cor da borda
  buttonText: varchar("buttonText", { length: 128 }).default(
    "SOLICITAR SUPORTE"
  ),
  guaranteeText: text("guaranteeText"), // texto de garantia
  sortOrder: int("sortOrder").default(0).notNull(),
  active: int("active").default(1).notNull(), // 1 = ativo, 0 = inativo
  showNameForm: int("showNameForm").default(1).notNull(), // 1 = mostra formulário "Qual nome", 0 = pula
  showReferrerForm: int("showReferrerForm").default(1).notNull(), // 1 = mostra formulário "Quem indicou", 0 = pula
  showClientForm: int("showClientForm").default(1).notNull(), // 1 = mostra formulário "Dados do cliente", 0 = pula
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServiceCard = typeof serviceCards.$inferSelect;
export type InsertServiceCard = typeof serviceCards.$inferInsert;

// Tabela de modelos/opções de nome por card
export const cardModels = mysqlTable("cardModels", {
  id: int("id").autoincrement().primaryKey(),
  cardId: int("cardId").notNull(), // FK para serviceCards
  optionType: varchar("optionType", { length: 64 }).notNull(), // "random", "first", "full"
  optionLabel: varchar("optionLabel", { length: 128 }).notNull(), // Ex: "Nome Aleatório"
  price: int("price").notNull(), // Preço em centavos (ex: 35000 = R$350)
  active: int("active").default(1).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  showNameForm: int("showNameForm").default(1).notNull(),
  showReferrerForm: int("showReferrerForm").default(1).notNull(),
  showClientForm: int("showClientForm").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CardModel = typeof cardModels.$inferSelect;
export type InsertCardModel = typeof cardModels.$inferInsert;

// Tabela de documentos obrigatórios por card
export const cardDocuments = mysqlTable("cardDocuments", {
  id: int("id").autoincrement().primaryKey(),
  cardId: int("cardId").notNull(), // FK para serviceCards
  docType: varchar("docType", { length: 64 }).notNull(), // "profilePhoto", "carDocument", "alvara", "condutaxi", "pdf"
  docLabel: varchar("docLabel", { length: 128 }).notNull(), // Ex: "Foto de Perfil"
  required: int("required").default(1).notNull(), // 1 = obrigatório, 0 = opcional
  active: int("active").default(1).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CardDocument = typeof cardDocuments.$inferSelect;
export type InsertCardDocument = typeof cardDocuments.$inferInsert;

// Tabela de pedidos/submissions
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  cardId: int("cardId"), // FK para serviceCards
  cardName: varchar("cardName", { length: 255 }), // Nome do card no momento do pedido
  modelId: int("modelId"), // FK para cardModels
  modelLabel: varchar("modelLabel", { length: 128 }), // Label do modelo no momento do pedido
  modelPrice: int("modelPrice"), // Preço em centavos no momento do pedido
  clientName: varchar("clientName", { length: 255 }),
  clientPhone: varchar("clientPhone", { length: 64 }),
  clientCity: varchar("clientCity", { length: 128 }),
  referrerName: varchar("referrerName", { length: 255 }),
  referrerPhone: varchar("referrerPhone", { length: 64 }),
  nameOption: varchar("nameOption", { length: 64 }), // "random", "first", "pdf-only", etc.
  couponCode: varchar("couponCode", { length: 64 }),
  couponDiscount: int("couponDiscount"), // Desconto aplicado em centavos
  accessCode: varchar("accessCode", { length: 64 }),
  status: mysqlEnum("status", ["pending", "processing", "completed", "refunded", "cancelled"])
    .notNull()
    .default("pending"),
  notes: text("notes"), // Notas do admin
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// Tabela de perguntas personalizadas por modelo
export const modelQuestions = mysqlTable("modelQuestions", {
  id: int("id").autoincrement().primaryKey(),
  modelId: int("modelId").notNull(), // FK para cardModels
  question: varchar("question", { length: 255 }).notNull(), // Texto da pergunta
  fieldType: mysqlEnum("fieldType", ["text", "textarea", "select"])
    .notNull()
    .default("text"), // Tipo de campo
  options: text("options"), // Opções para select (JSON array), ex: '["Sim","Não"]'
  required: int("required").default(1).notNull(), // 1 = obrigatório, 0 = opcional
  active: int("active").default(1).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ModelQuestion = typeof modelQuestions.$inferSelect;
export type InsertModelQuestion = typeof modelQuestions.$inferInsert;
