import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";

// Mock all db functions used by admin routes
vi.mock("./db", () => ({
  // Site settings
  getAllSiteSettings: vi.fn(),
  getSiteSetting: vi.fn(),
  setSiteSetting: vi.fn(),
  // PIX settings
  getAllPixSettings: vi.fn(),
  getPixSetting: vi.fn(),
  setPixSetting: vi.fn(),
  // Service cards
  listServiceCards: vi.fn(),
  createServiceCard: vi.fn(),
  updateServiceCard: vi.fn(),
  deleteServiceCard: vi.fn(),
  // Card models
  listCardModels: vi.fn(),
  listAllCardModels: vi.fn(),
  createCardModel: vi.fn(),
  updateCardModel: vi.fn(),
  deleteCardModel: vi.fn(),
  // Card documents
  listCardDocuments: vi.fn(),
  listAllCardDocuments: vi.fn(),
  createCardDocument: vi.fn(),
  updateCardDocument: vi.fn(),
  deleteCardDocument: vi.fn(),
  // Other required mocks
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
  validateAccessCode: vi.fn(),
  createAccessCode: vi.fn(),
  listAccessCodes: vi.fn(),
  toggleAccessCode: vi.fn(),
  deleteAccessCode: vi.fn(),
  checkAccessCodeCanSubmit: vi.fn(),
  consumeAccessCode: vi.fn(),
  createCoupon: vi.fn(),
  listCoupons: vi.fn(),
  deleteCoupon: vi.fn(),
  toggleCoupon: vi.fn(),
  validateCoupon: vi.fn(),
  consumeCoupon: vi.fn(),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/test.jpg", key: "test.jpg" }),
}));

// Mock nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: "test" }),
    }),
  },
}));

import {
  getAllSiteSettings, setSiteSetting,
  getAllPixSettings, setPixSetting,
  listServiceCards, createServiceCard, updateServiceCard, deleteServiceCard,
  listAllCardModels, createCardModel, updateCardModel, deleteCardModel,
  listAllCardDocuments, createCardDocument, updateCardDocument, deleteCardDocument,
} from "./db";

const adminUser = {
  id: 1,
  openId: "admin-user",
  name: "Admin",
  email: "admin@test.com",
  role: "admin",
  loginMethod: "manus",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const regularUser = {
  id: 2,
  openId: "regular-user",
  name: "User",
  email: "user@test.com",
  role: "user",
  loginMethod: "manus",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const createCaller = (user?: any) => {
  return appRouter.createCaller({
    user: user || null,
    req: { headers: { origin: "http://localhost:3000" } } as any,
    res: { clearCookie: vi.fn() } as any,
  });
};

describe("Admin Panel Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== SITE SETTINGS ====================
  describe("admin.site", () => {
    it("should get all site settings as admin", async () => {
      const mockSettings = { site_title: "WALK CONTAS", whatsapp_number: "5511978307371" };
      (getAllSiteSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);

      const caller = createCaller(adminUser);
      const result = await caller.admin.site.getAll();

      expect(result).toEqual(mockSettings);
      expect(getAllSiteSettings).toHaveBeenCalled();
    });

    it("should reject non-admin from site settings", async () => {
      const caller = createCaller(regularUser);
      await expect(caller.admin.site.getAll()).rejects.toThrow();
    });

    it("should set a site setting as admin", async () => {
      (setSiteSetting as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const caller = createCaller(adminUser);
      const result = await caller.admin.site.set({ key: "site_title", value: "WALK ARTES" });

      expect(result).toEqual({ success: true });
      expect(setSiteSetting).toHaveBeenCalledWith("site_title", "WALK ARTES", "string");
    });

    it("should batch save multiple settings with setAll", async () => {
      (setSiteSetting as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const caller = createCaller(adminUser);
      const result = await caller.admin.site.setAll({
        settings: [
          { key: "feature1_title", value: "Atendimento 24 Horas" },
          { key: "feature1_desc", value: "Sempre disponível" },
          { key: "footer_description", value: "Suporte completo" },
          { key: "orders_title", value: "FAÇA SEU PEDIDO" },
        ],
      });

      expect(result).toEqual({ success: true });
      expect(setSiteSetting).toHaveBeenCalledTimes(4);
      expect(setSiteSetting).toHaveBeenCalledWith("feature1_title", "Atendimento 24 Horas", "string");
      expect(setSiteSetting).toHaveBeenCalledWith("feature1_desc", "Sempre disponível", "string");
      expect(setSiteSetting).toHaveBeenCalledWith("footer_description", "Suporte completo", "string");
      expect(setSiteSetting).toHaveBeenCalledWith("orders_title", "FAÇA SEU PEDIDO", "string");
    });

    it("should handle empty settings array in setAll", async () => {
      const caller = createCaller(adminUser);
      const result = await caller.admin.site.setAll({ settings: [] });

      expect(result).toEqual({ success: true });
      expect(setSiteSetting).not.toHaveBeenCalled();
    });

    it("should reject non-admin from setAll", async () => {
      const caller = createCaller(regularUser);
      await expect(caller.admin.site.setAll({ settings: [{ key: "test", value: "val" }] })).rejects.toThrow();
    });
  });

  // ==================== PIX SETTINGS ====================
  describe("admin.pix", () => {
    it("should get all PIX settings as admin", async () => {
      const mockPix = { pix_key: "11915193551", pix_holder: "Adiel" };
      (getAllPixSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockPix);

      const caller = createCaller(adminUser);
      const result = await caller.admin.pix.getAll();

      expect(result).toEqual(mockPix);
    });

    it("should set PIX setting as admin", async () => {
      (setPixSetting as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const caller = createCaller(adminUser);
      const result = await caller.admin.pix.set({ key: "pix_key", value: "new-pix-key" });

      expect(result).toEqual({ success: true });
      expect(setPixSetting).toHaveBeenCalledWith("pix_key", "new-pix-key");
    });

    it("should reject non-admin from PIX settings", async () => {
      const caller = createCaller(regularUser);
      await expect(caller.admin.pix.getAll()).rejects.toThrow();
    });
  });

  // ==================== SERVICE CARDS ====================
  describe("admin.cards", () => {
    const mockCards = [
      { id: 1, name: "Conta Uber", imageUrl: "https://img.com/uber.jpg", borderColor: "primary/30", buttonText: "COMPRA > CONTA UBER", guaranteeText: "Garantia de 7 dias", sortOrder: 1, active: 1 },
      { id: 2, name: "Conta 99", imageUrl: "https://img.com/99.jpg", borderColor: "secondary/30", buttonText: "COMPRA > CONTA 99", guaranteeText: "Garantia de 7 dias", sortOrder: 2, active: 1 },
    ];

    it("should list all cards as admin", async () => {
      (listServiceCards as ReturnType<typeof vi.fn>).mockResolvedValue(mockCards);

      const caller = createCaller(adminUser);
      const result = await caller.admin.cards.list();

      expect(result).toEqual(mockCards);
      expect(listServiceCards).toHaveBeenCalled();
    });

    it("should create a card as admin", async () => {
      const newCard = { id: 3, name: "Conta InDrive", sortOrder: 3, active: 1 };
      (createServiceCard as ReturnType<typeof vi.fn>).mockResolvedValue(newCard);

      const caller = createCaller(adminUser);
      const result = await caller.admin.cards.create({ name: "Conta InDrive", sortOrder: 3 });

      expect(result.success).toBe(true);
      expect(result.card).toEqual(newCard);
    });

    it("should update a card as admin", async () => {
      (updateServiceCard as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const caller = createCaller(adminUser);
      const result = await caller.admin.cards.update({ id: 1, name: "Conta Uber Premium", active: 0 });

      expect(result.success).toBe(true);
      expect(updateServiceCard).toHaveBeenCalledWith(1, { name: "Conta Uber Premium", active: 0 });
    });

    it("should delete a card as admin", async () => {
      (deleteServiceCard as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const caller = createCaller(adminUser);
      const result = await caller.admin.cards.delete({ id: 1 });

      expect(result.success).toBe(true);
      expect(deleteServiceCard).toHaveBeenCalledWith(1);
    });

    it("should reject non-admin from card operations", async () => {
      const caller = createCaller(regularUser);
      await expect(caller.admin.cards.list()).rejects.toThrow();
      await expect(caller.admin.cards.create({ name: "Test" })).rejects.toThrow();
    });
  });

  // ==================== CARD MODELS ====================
  describe("admin.models", () => {
    const mockModels = [
      { id: 1, cardId: 1, optionType: "random", optionLabel: "Nome Aleatório", price: 40000, sortOrder: 1, active: 1 },
      { id: 2, cardId: 1, optionType: "first", optionLabel: "Primeiro Nome", price: 55000, sortOrder: 2, active: 1 },
    ];

    it("should list all models as admin", async () => {
      (listAllCardModels as ReturnType<typeof vi.fn>).mockResolvedValue(mockModels);

      const caller = createCaller(adminUser);
      const result = await caller.admin.models.listAll();

      expect(result).toEqual(mockModels);
    });

    it("should create a model as admin", async () => {
      const newModel = { id: 3, cardId: 1, optionType: "full", optionLabel: "Nome Completo", price: 60000 };
      (createCardModel as ReturnType<typeof vi.fn>).mockResolvedValue(newModel);

      const caller = createCaller(adminUser);
      const result = await caller.admin.models.create({
        cardId: 1, optionType: "full", optionLabel: "Nome Completo", price: 60000
      });

      expect(result.success).toBe(true);
      expect(result.model).toEqual(newModel);
    });

    it("should update a model as admin", async () => {
      (updateCardModel as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const caller = createCaller(adminUser);
      const result = await caller.admin.models.update({ id: 1, price: 45000, active: 0 });

      expect(result.success).toBe(true);
      expect(updateCardModel).toHaveBeenCalledWith(1, { price: 45000, active: 0 });
    });

    it("should delete a model as admin", async () => {
      (deleteCardModel as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const caller = createCaller(adminUser);
      const result = await caller.admin.models.delete({ id: 1 });

      expect(result.success).toBe(true);
    });

    it("should reject non-admin from model operations", async () => {
      const caller = createCaller(regularUser);
      await expect(caller.admin.models.listAll()).rejects.toThrow();
    });
  });

  // ==================== CARD DOCUMENTS ====================
  describe("admin.docs", () => {
    const mockDocs = [
      { id: 1, cardId: 1, docType: "profilePhoto", docLabel: "Foto de Perfil", required: 1, sortOrder: 1, active: 1 },
      { id: 2, cardId: 1, docType: "carDocument", docLabel: "Documento do Carro", required: 1, sortOrder: 2, active: 1 },
    ];

    it("should list all documents as admin", async () => {
      (listAllCardDocuments as ReturnType<typeof vi.fn>).mockResolvedValue(mockDocs);

      const caller = createCaller(adminUser);
      const result = await caller.admin.docs.listAll();

      expect(result).toEqual(mockDocs);
    });

    it("should create a document as admin", async () => {
      const newDoc = { id: 3, cardId: 1, docType: "alvara", docLabel: "Alvará", required: 1 };
      (createCardDocument as ReturnType<typeof vi.fn>).mockResolvedValue(newDoc);

      const caller = createCaller(adminUser);
      const result = await caller.admin.docs.create({
        cardId: 1, docType: "alvara", docLabel: "Alvará", required: 1
      });

      expect(result.success).toBe(true);
      expect(result.doc).toEqual(newDoc);
    });

    it("should update a document as admin", async () => {
      (updateCardDocument as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const caller = createCaller(adminUser);
      const result = await caller.admin.docs.update({ id: 1, required: 0, active: 0 });

      expect(result.success).toBe(true);
      expect(updateCardDocument).toHaveBeenCalledWith(1, { required: 0, active: 0 });
    });

    it("should delete a document as admin", async () => {
      (deleteCardDocument as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const caller = createCaller(adminUser);
      const result = await caller.admin.docs.delete({ id: 1 });

      expect(result.success).toBe(true);
    });

    it("should reject non-admin from document operations", async () => {
      const caller = createCaller(regularUser);
      await expect(caller.admin.docs.listAll()).rejects.toThrow();
    });
  });

  // ==================== IMAGE UPLOAD ====================
  describe("admin.uploadImage", () => {
    it("should upload an image as admin", async () => {
      const caller = createCaller(adminUser);
      const result = await caller.admin.uploadImage({
        base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        filename: "test.png",
      });

      expect(result.success).toBe(true);
      expect(result.url).toBe("https://s3.example.com/test.jpg");
    });

    it("should reject non-admin from uploading images", async () => {
      const caller = createCaller(regularUser);
      await expect(caller.admin.uploadImage({ base64: "abc", filename: "test.png" })).rejects.toThrow();
    });
  });
});

// ==================== PUBLIC DATA ROUTES ====================
describe("Public Data Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return site settings publicly", async () => {
    const mockSettings = { site_title: "WALK CONTAS", whatsapp_number: "5511978307371" };
    (getAllSiteSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);

    const caller = createCaller(); // No user - public access
    const result = await caller.publicData.siteSettings();

    expect(result).toEqual(mockSettings);
  });

  it("should return PIX settings publicly", async () => {
    const mockPix = { pix_key: "11915193551", pix_holder: "Adiel" };
    (getAllPixSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockPix);

    const caller = createCaller();
    const result = await caller.publicData.pixSettings();

    expect(result).toEqual(mockPix);
  });

  it("should return only active cards publicly", async () => {
    const allCards = [
      { id: 1, name: "Conta Uber", active: 1 },
      { id: 2, name: "Conta 99", active: 0 },
      { id: 3, name: "Conta InDrive", active: 1 },
    ];
    (listServiceCards as ReturnType<typeof vi.fn>).mockResolvedValue(allCards);

    const caller = createCaller();
    const result = await caller.publicData.cards();

    expect(result).toHaveLength(2);
    expect(result.map((c: any) => c.name)).toEqual(["Conta Uber", "Conta InDrive"]);
  });

  it("should return only active models publicly", async () => {
    const allModels = [
      { id: 1, cardId: 1, optionLabel: "Nome Aleatório", active: 1 },
      { id: 2, cardId: 1, optionLabel: "Primeiro Nome", active: 0 },
    ];
    (listAllCardModels as ReturnType<typeof vi.fn>).mockResolvedValue(allModels);

    const caller = createCaller();
    const result = await caller.publicData.models();

    expect(result).toHaveLength(1);
    expect(result[0].optionLabel).toBe("Nome Aleatório");
  });

  it("should return only active documents publicly", async () => {
    const allDocs = [
      { id: 1, cardId: 1, docLabel: "Foto de Perfil", active: 1 },
      { id: 2, cardId: 1, docLabel: "Alvará", active: 0 },
    ];
    (listAllCardDocuments as ReturnType<typeof vi.fn>).mockResolvedValue(allDocs);

    const caller = createCaller();
    const result = await caller.publicData.docs();

    expect(result).toHaveLength(1);
    expect(result[0].docLabel).toBe("Foto de Perfil");
  });
});
