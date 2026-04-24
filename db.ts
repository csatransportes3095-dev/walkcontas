import { eq, asc, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  accessCodes,
  AccessCode,
  accessCodeLogs,
  AccessCodeLog,
  coupons,
  Coupon,
  siteSettings,
  SiteSetting,
  InsertSiteSetting,
  pixSettings,
  PixSetting,
  InsertPixSetting,
  serviceCards,
  ServiceCard,
  InsertServiceCard,
  cardModels,
  CardModel,
  InsertCardModel,
  cardDocuments,
  CardDocument,
  InsertCardDocument,
  orders,
  Order,
  InsertOrder,
  modelQuestions,
  ModelQuestion,
  InsertModelQuestion,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// === Access Codes (Senhas) ===

export async function validateAccessCode(
  code: string
): Promise<{
  valid: boolean;
  type: string;
  clientName?: string | null;
  expiresInMinutes?: number;
}> {
  // Verificar senha geral
  const generalPassword = ENV.siteGeneralPassword;
  if (code === generalPassword) {
    return { valid: true, type: "general" };
  }

  // Verificar senha VIP no banco
  const db = await getDb();
  if (!db) return { valid: false, type: "none" };

  const results = await db
    .select()
    .from(accessCodes)
    .where(eq(accessCodes.code, code))
    .limit(1);

  if (results.length === 0) return { valid: false, type: "none" };

  const accessCode = results[0];

  // Senha desativada não pode entrar
  if (accessCode.status === "disabled") return { valid: false, type: "none" };

  // Verificar se atingiu o limite de usos
  const maxUses = accessCode.maxUses || 1;
  const currentUses = accessCode.currentUses || 0;
  if (accessCode.status === "used" || currentUses >= maxUses) {
    return { valid: false, type: "none" };
  }

  // Verificar se expirou pelo tempo individual
  if (accessCode.createdAt && accessCode.expiresInMinutes) {
    const created = new Date(accessCode.createdAt).getTime();
    const now = Date.now();
    const expiresAt = created + accessCode.expiresInMinutes * 60 * 1000;
    if (now >= expiresAt) {
      return { valid: false, type: "none" };
    }
  }

  // Senha ativa - permite login sem consumir (consumo acontece no envio de arquivos)
  // Registrar log de login
  await logAccessCodeUsage(
    accessCode.id,
    code,
    "login",
    undefined,
    JSON.stringify({ clientName: accessCode.clientName })
  );

  return {
    valid: true,
    type: "vip",
    clientName: accessCode.clientName,
    expiresInMinutes: accessCode.expiresInMinutes || 30,
  };
}

export async function createAccessCode(
  code: string,
  clientName?: string,
  maxUses: number = 1,
  expiresInMinutes: number = 30
): Promise<AccessCode> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(accessCodes).values({
    code,
    type: "vip",
    status: "active",
    clientName: clientName || null,
    maxUses,
    currentUses: 0,
    expiresInMinutes,
  });

  const result = await db
    .select()
    .from(accessCodes)
    .where(eq(accessCodes.code, code))
    .limit(1);

  return result[0];
}

export async function listAccessCodes(): Promise<AccessCode[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(accessCodes);
}

export async function toggleAccessCode(
  id: number,
  status: "active" | "disabled"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(accessCodes).set({ status }).where(eq(accessCodes.id, id));
}

export async function deleteAccessCode(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(accessCodes).where(eq(accessCodes.id, id));
}

// === Access Code Logs ===

export async function logAccessCodeUsage(
  accessCodeId: number,
  code: string,
  action: "login" | "submit" | "consume",
  clientIp?: string,
  details?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(accessCodeLogs).values({
      accessCodeId,
      accessCode: code,
      action,
      clientIp: clientIp || null,
      details: details || null,
    });
  } catch (error) {
    console.error("[AccessCodeLogs] Erro ao registrar log:", error);
  }
}

export async function getAccessCodeLogs(
  accessCodeId?: number
): Promise<AccessCodeLog[]> {
  const db = await getDb();
  if (!db) return [];

  if (accessCodeId) {
    return await db
      .select()
      .from(accessCodeLogs)
      .where(eq(accessCodeLogs.accessCodeId, accessCodeId))
      .orderBy(asc(accessCodeLogs.createdAt));
  }
  return await db
    .select()
    .from(accessCodeLogs)
    .orderBy(asc(accessCodeLogs.createdAt));
}

export async function getRecentAccessCodeLogs(
  limit: number = 50
): Promise<AccessCodeLog[]> {
  const db = await getDb();
  if (!db) return [];

  // Get recent logs ordered by newest first
  const { desc } = await import("drizzle-orm");
  return await db
    .select()
    .from(accessCodeLogs)
    .orderBy(desc(accessCodeLogs.createdAt))
    .limit(limit);
}

// Renovar senha VIP: resetar usos e timer
export async function renewAccessCode(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(accessCodes)
    .set({
      currentUses: 0,
      status: "active" as const,
      usedAt: null,
      usedBy: null,
      createdAt: new Date(),
    })
    .where(eq(accessCodes.id, id));
}

// Verificar se a senha VIP pode ser usada para envio de arquivos (sem consumir)
export async function checkAccessCodeCanSubmit(
  code: string
): Promise<{ canSubmit: boolean; type: string; reason?: string }> {
  const generalPassword = ENV.siteGeneralPassword;
  if (code === generalPassword) {
    return { canSubmit: true, type: "general" };
  }

  const db = await getDb();
  if (!db)
    return {
      canSubmit: false,
      type: "none",
      reason: "Banco de dados indisponível",
    };

  const results = await db
    .select()
    .from(accessCodes)
    .where(eq(accessCodes.code, code))
    .limit(1);

  if (results.length === 0)
    return { canSubmit: false, type: "none", reason: "Senha não encontrada" };

  const accessCode = results[0];

  if (accessCode.status === "disabled") {
    return {
      canSubmit: false,
      type: "vip",
      reason: "Esta senha está desativada.",
    };
  }

  // Verificar se atingiu o limite de usos
  const maxUses = accessCode.maxUses || 1;
  const currentUses = accessCode.currentUses || 0;
  if (accessCode.status === "used" || currentUses >= maxUses) {
    return {
      canSubmit: false,
      type: "vip",
      reason: `Esta senha VIP já atingiu o limite de ${maxUses} uso(s). Solicite uma nova senha.`,
    };
  }

  return { canSubmit: true, type: "vip" };
}

// Consumir a senha VIP após envio bem-sucedido
export async function consumeAccessCode(code: string): Promise<void> {
  const generalPassword = ENV.siteGeneralPassword;
  if (code === generalPassword) return; // Senha geral não é consumida

  const db = await getDb();
  if (!db) return;

  const results = await db
    .select()
    .from(accessCodes)
    .where(eq(accessCodes.code, code))
    .limit(1);

  if (results.length === 0) return;

  const accessCode = results[0];

  const newUses = (accessCode.currentUses || 0) + 1;
  const maxUses = accessCode.maxUses || 1;
  const newStatus =
    newUses >= maxUses ? ("used" as const) : ("active" as const);

  await db
    .update(accessCodes)
    .set({
      currentUses: newUses,
      usedAt: new Date(),
      status: newStatus,
    })
    .where(eq(accessCodes.id, accessCode.id));

  // Registrar log de consumo
  await logAccessCodeUsage(
    accessCode.id,
    code,
    "consume",
    undefined,
    JSON.stringify({ newUses, maxUses, newStatus })
  );
}

// === Cupons de Desconto ===

export async function createCoupon(data: {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxUses?: number;
  expiresAt?: Date | null;
}): Promise<Coupon> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(coupons).values({
    code: data.code.toUpperCase(),
    discountType: data.discountType,
    discountValue: data.discountValue,
    maxUses: data.maxUses || 1,
    currentUses: 0,
    expiresAt: data.expiresAt || null,
    status: "active",
  });

  const result = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, data.code.toUpperCase()))
    .limit(1);

  return result[0];
}

export async function listCoupons(): Promise<Coupon[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(coupons);
}

export async function deleteCoupon(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(coupons).where(eq(coupons.id, id));
}

export async function toggleCoupon(
  id: number,
  status: "active" | "disabled"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(coupons).set({ status }).where(eq(coupons.id, id));
}

export async function validateCoupon(code: string): Promise<{
  valid: boolean;
  coupon?: Coupon;
  reason?: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
}> {
  const db = await getDb();
  if (!db) return { valid: false, reason: "Banco de dados indisponível" };

  const results = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.toUpperCase()))
    .limit(1);

  if (results.length === 0)
    return { valid: false, reason: "Cupom não encontrado" };

  const coupon = results[0];

  if (coupon.status === "disabled")
    return { valid: false, reason: "Este cupom está desativado" };
  if (coupon.status === "used")
    return { valid: false, reason: "Este cupom já foi utilizado" };

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return { valid: false, reason: "Este cupom expirou" };
  }

  if (
    coupon.maxUses &&
    coupon.currentUses &&
    coupon.currentUses >= coupon.maxUses
  ) {
    return { valid: false, reason: "Este cupom atingiu o limite de uso" };
  }

  return {
    valid: true,
    coupon,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  };
}

export async function consumeCoupon(
  code: string,
  usedBy?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const results = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.toUpperCase()))
    .limit(1);

  if (results.length === 0) return;

  const coupon = results[0];
  const newUses = (coupon.currentUses || 0) + 1;
  const newStatus =
    coupon.maxUses && newUses >= coupon.maxUses
      ? ("used" as const)
      : ("active" as const);

  await db
    .update(coupons)
    .set({
      currentUses: newUses,
      usedAt: new Date(),
      usedBy: usedBy || null,
      status: newStatus,
    })
    .where(eq(coupons.id, coupon.id));
}

// === Configurações do Site ===

export async function getSiteSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);

  return result.length > 0 ? result[0].value : null;
}

export async function setSiteSetting(
  key: string,
  value: string,
  type: "string" | "number" | "boolean" | "json" = "string"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(siteSettings)
      .set({ value, type })
      .where(eq(siteSettings.key, key));
  } else {
    await db.insert(siteSettings).values({ key, value, type });
  }
}

export async function getAllSiteSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};

  const results = await db.select().from(siteSettings);
  const settings: Record<string, string> = {};
  results.forEach(s => {
    settings[s.key] = s.value;
  });
  return settings;
}

// === Configurações PIX ===

export async function getPixSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(pixSettings)
    .where(eq(pixSettings.key, key))
    .limit(1);

  return result.length > 0 ? result[0].value : null;
}

export async function setPixSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select()
    .from(pixSettings)
    .where(eq(pixSettings.key, key))
    .limit(1);

  if (existing.length > 0) {
    await db.update(pixSettings).set({ value }).where(eq(pixSettings.key, key));
  } else {
    await db.insert(pixSettings).values({ key, value });
  }
}

export async function getAllPixSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};

  const results = await db.select().from(pixSettings);
  const settings: Record<string, string> = {};
  results.forEach(s => {
    settings[s.key] = s.value;
  });
  return settings;
}

// === Service Cards (Cards da página inicial) ===

export async function listServiceCards(): Promise<ServiceCard[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(serviceCards)
    .orderBy(asc(serviceCards.sortOrder));
}

export async function createServiceCard(data: {
  name: string;
  imageUrl?: string;
  borderColor?: string;
  buttonText?: string;
  guaranteeText?: string;
  sortOrder?: number;
  active?: number;
}): Promise<ServiceCard> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(serviceCards).values({
    name: data.name,
    imageUrl: data.imageUrl || null,
    borderColor: data.borderColor || "primary/30",
    buttonText: data.buttonText || "SOLICITAR SUPORTE",
    guaranteeText: data.guaranteeText || null,
    sortOrder: data.sortOrder || 0,
    active: data.active ?? 1,
  });
  const result = await db
    .select()
    .from(serviceCards)
    .orderBy(desc(serviceCards.id))
    .limit(1);
  return result[0];
}

export async function updateServiceCard(
  id: number,
  data: Partial<{
    name: string;
    imageUrl: string;
    borderColor: string;
    buttonText: string;
    guaranteeText: string;
    sortOrder: number;
    active: number;
    showNameForm: number;
    showReferrerForm: number;
    showClientForm: number;
  }>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(serviceCards).set(data).where(eq(serviceCards.id, id));
}

export async function deleteServiceCard(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(cardModels).where(eq(cardModels.cardId, id));
  await db.delete(cardDocuments).where(eq(cardDocuments.cardId, id));
  await db.delete(serviceCards).where(eq(serviceCards.id, id));
}

// === Card Models (Opções de nome por card) ===

export async function listCardModels(cardId: number): Promise<CardModel[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(cardModels)
    .where(eq(cardModels.cardId, cardId))
    .orderBy(asc(cardModels.sortOrder));
}

export async function listAllCardModels(): Promise<CardModel[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(cardModels).orderBy(asc(cardModels.sortOrder));
}

export async function createCardModel(data: {
  cardId: number;
  optionType: string;
  optionLabel: string;
  price: number;
  sortOrder?: number;
  showNameForm?: number;
  showReferrerForm?: number;
  showClientForm?: number;
}): Promise<CardModel> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertResult = await db.insert(cardModels).values({
    cardId: data.cardId,
    optionType: data.optionType,
    optionLabel: data.optionLabel,
    price: data.price,
    sortOrder: data.sortOrder || 0,
    active: 1,
    showNameForm: data.showNameForm ?? 1,
    showReferrerForm: data.showReferrerForm ?? 1,
    showClientForm: data.showClientForm ?? 1,
  });
  // Get the inserted model by its ID from the insert result
  // Drizzle with MySQL returns [ResultSetHeader, ...]
  let insertedId: number | null = null;
  
  // Try different ways to get the inserted ID
  if (Array.isArray(insertResult)) {
    // For MySQL/Drizzle, result is [ResultSetHeader, ...]
    const header = insertResult[0] as any;
    if (header && header.insertId) {
      insertedId = Number(header.insertId);
    }
    // Also try direct insertId on the array
    if (!insertedId && (insertResult as any).insertId) {
      insertedId = Number((insertResult as any).insertId);
    }
  }
  
  // If we have an ID, fetch by ID
  if (insertedId) {
    const result = await db
      .select()
      .from(cardModels)
      .where(eq(cardModels.id, insertedId));
    if (result.length > 0) {
      return result[0];
    }
  }
  
  // Fallback: query for the model we just inserted by matching fields
  const result = await db
    .select()
    .from(cardModels)
    .where(
      and(
        eq(cardModels.cardId, data.cardId),
        eq(cardModels.optionType, data.optionType),
        eq(cardModels.optionLabel, data.optionLabel),
        eq(cardModels.price, data.price)
      )
    )
    .orderBy(desc(cardModels.id))
    .limit(1);
  return result[0];
}

export async function updateCardModel(
  id: number,
  data: Partial<{
    optionType: string;
    optionLabel: string;
    price: number;
    active: number;
    sortOrder: number;
    showNameForm: number;
    showReferrerForm: number;
    showClientForm: number;
  }>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(cardModels).set(data).where(eq(cardModels.id, id));
}

export async function deleteCardModel(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(cardModels).where(eq(cardModels.id, id));
}

// === Card Documents (Documentos por card) ===

export async function listCardDocuments(
  cardId: number
): Promise<CardDocument[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(cardDocuments)
    .where(eq(cardDocuments.cardId, cardId))
    .orderBy(asc(cardDocuments.sortOrder));
}

export async function listAllCardDocuments(): Promise<CardDocument[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(cardDocuments)
    .orderBy(asc(cardDocuments.sortOrder));
}

export async function createCardDocument(data: {
  cardId: number;
  docType: string;
  docLabel: string;
  required?: number;
  sortOrder?: number;
}): Promise<CardDocument> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertResult = await db.insert(cardDocuments).values({
    cardId: data.cardId,
    docType: data.docType,
    docLabel: data.docLabel,
    required: data.required ?? 1,
    sortOrder: data.sortOrder || 0,
    active: 1,
  });
  
  // Get the inserted document by its ID from the insert result
  let insertedId: number | null = null;
  
  // Try different ways to get the inserted ID
  if (Array.isArray(insertResult)) {
    // For MySQL, the result might have insertId property
    insertedId = (insertResult as any).insertId;
  }
  
  if (!insertedId) {
    // If we still don't have an ID, query for the document we just inserted
    // by matching all the fields we just inserted
    const result = await db
      .select()
      .from(cardDocuments)
      .where(
        and(
          eq(cardDocuments.cardId, data.cardId),
          eq(cardDocuments.docType, data.docType),
          eq(cardDocuments.docLabel, data.docLabel)
        )
      )
      .orderBy(desc(cardDocuments.id))
      .limit(1);
    if (result.length > 0) {
      return result[0];
    }
  }
  
  // If we have an ID, fetch by ID
  if (insertedId) {
    const result = await db
      .select()
      .from(cardDocuments)
      .where(eq(cardDocuments.id, insertedId));
    if (result.length > 0) {
      return result[0];
    }
  }
  
  // Last resort: return the latest document for this card
  const result = await db
    .select()
    .from(cardDocuments)
    .where(eq(cardDocuments.cardId, data.cardId))
    .orderBy(desc(cardDocuments.id))
    .limit(1);
  return result[0];
}

export async function updateCardDocument(
  id: number,
  data: Partial<{
    docType: string;
    docLabel: string;
    required: number;
    active: number;
    sortOrder: number;
  }>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(cardDocuments).set(data).where(eq(cardDocuments.id, id));
}

export async function deleteCardDocument(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(cardDocuments).where(eq(cardDocuments.id, id));
}


// === Orders (Pedidos) ===

export async function createOrder(data: {
  cardId?: number;
  cardName?: string;
  modelId?: number;
  modelLabel?: string;
  modelPrice?: number;
  clientName?: string;
  clientPhone?: string;
  clientCity?: string;
  referrerName?: string;
  referrerPhone?: string;
  nameOption?: string;
  couponCode?: string;
  couponDiscount?: number;
  accessCode?: string;
}): Promise<Order> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values({
    cardId: data.cardId ?? null,
    cardName: data.cardName ?? null,
    modelId: data.modelId ?? null,
    modelLabel: data.modelLabel ?? null,
    modelPrice: data.modelPrice ?? null,
    clientName: data.clientName ?? null,
    clientPhone: data.clientPhone ?? null,
    clientCity: data.clientCity ?? null,
    referrerName: data.referrerName ?? null,
    referrerPhone: data.referrerPhone ?? null,
    nameOption: data.nameOption ?? null,
    couponCode: data.couponCode ?? null,
    couponDiscount: data.couponDiscount ?? null,
    accessCode: data.accessCode ?? null,
  });
  const insertId = Number(result[0].insertId);
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, insertId));
  return order;
}

export async function listOrders(limit = 100, offset = 0): Promise<Order[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function countOrders(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(orders);
  return Number(result[0]?.count ?? 0);
}

export async function updateOrderStatus(
  id: number,
  status: "pending" | "processing" | "completed" | "refunded" | "cancelled",
  notes?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, any> = { status };
  if (notes !== undefined) updateData.notes = notes;
  await db.update(orders).set(updateData).where(eq(orders.id, id));
}

export async function getRecentOrdersCount(sinceMinutes = 5): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000);
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(sql`${orders.createdAt} >= ${since}`);
  return Number(result[0]?.count ?? 0);
}

// === Model Questions (Perguntas Personalizadas por Modelo) ===

export async function listModelQuestions(modelId: number): Promise<ModelQuestion[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(modelQuestions)
    .where(eq(modelQuestions.modelId, modelId))
    .orderBy(asc(modelQuestions.sortOrder));
}

export async function listAllModelQuestions(): Promise<ModelQuestion[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(modelQuestions)
    .orderBy(asc(modelQuestions.sortOrder));
}

export async function createModelQuestion(data: {
  modelId: number;
  question: string;
  fieldType?: "text" | "textarea" | "select";
  options?: string;
  required?: number;
  sortOrder?: number;
}): Promise<ModelQuestion> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(modelQuestions).values({
    modelId: data.modelId,
    question: data.question,
    fieldType: data.fieldType || "text",
    options: data.options || null,
    required: data.required ?? 1,
    sortOrder: data.sortOrder ?? 0,
  });
  const insertId = Number(result[0].insertId);
  const [question] = await db
    .select()
    .from(modelQuestions)
    .where(eq(modelQuestions.id, insertId));
  return question;
}

export async function updateModelQuestion(
  id: number,
  data: Partial<{
    question: string;
    fieldType: "text" | "textarea" | "select";
    options: string | null;
    required: number;
    active: number;
    sortOrder: number;
  }>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(modelQuestions).set(data).where(eq(modelQuestions.id, id));
}

export async function deleteModelQuestion(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(modelQuestions).where(eq(modelQuestions.id, id));
}
