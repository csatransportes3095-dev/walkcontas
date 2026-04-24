import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db functions
const mockCreateOrder = vi.fn();
const mockListOrders = vi.fn();
const mockCountOrders = vi.fn();
const mockUpdateOrderStatus = vi.fn();
const mockGetRecentOrdersCount = vi.fn();

vi.mock("./db", () => ({
  createOrder: (...args: any[]) => mockCreateOrder(...args),
  listOrders: (...args: any[]) => mockListOrders(...args),
  countOrders: (...args: any[]) => mockCountOrders(...args),
  updateOrderStatus: (...args: any[]) => mockUpdateOrderStatus(...args),
  getRecentOrdersCount: (...args: any[]) => mockGetRecentOrdersCount(...args),
  validateAccessCode: vi.fn().mockResolvedValue({ valid: true }),
  checkAccessCodeCanSubmit: vi.fn().mockResolvedValue({ canSubmit: true }),
  consumeAccessCode: vi.fn(),
  logAccessCodeUsage: vi.fn(),
  consumeCoupon: vi.fn(),
  createAccessCode: vi.fn(),
  listAccessCodes: vi.fn().mockResolvedValue([]),
  toggleAccessCode: vi.fn(),
  deleteAccessCode: vi.fn(),
  renewAccessCode: vi.fn(),
  getAccessCodeLogs: vi.fn().mockResolvedValue([]),
  getRecentAccessCodeLogs: vi.fn().mockResolvedValue([]),
  createCoupon: vi.fn(),
  listCoupons: vi.fn().mockResolvedValue([]),
  deleteCoupon: vi.fn(),
  toggleCoupon: vi.fn(),
  validateCoupon: vi.fn(),
  getSiteSetting: vi.fn(),
  setSiteSetting: vi.fn(),
  getAllSiteSettings: vi.fn().mockResolvedValue([]),
  getPixSetting: vi.fn(),
  setPixSetting: vi.fn(),
  getAllPixSettings: vi.fn().mockResolvedValue([]),
  listServiceCards: vi.fn().mockResolvedValue([]),
  createServiceCard: vi.fn(),
  updateServiceCard: vi.fn(),
  deleteServiceCard: vi.fn(),
  listCardModels: vi.fn().mockResolvedValue([]),
  listAllCardModels: vi.fn().mockResolvedValue([]),
  createCardModel: vi.fn(),
  updateCardModel: vi.fn(),
  deleteCardModel: vi.fn(),
  listCardDocuments: vi.fn().mockResolvedValue([]),
  listAllCardDocuments: vi.fn().mockResolvedValue([]),
  createCardDocument: vi.fn(),
  updateCardDocument: vi.fn(),
  deleteCardDocument: vi.fn(),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://example.com/file.jpg", key: "file.jpg" }),
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: "test" }),
    }),
  },
}));

vi.mock("./_core/trpc", () => {
  const { initTRPC } = require("@trpc/server");
  const t = initTRPC.context<any>().create();
  return {
    router: t.router,
    publicProcedure: t.procedure,
    adminProcedure: t.procedure,
  };
});

vi.mock("./_core/systemRouter", () => ({
  systemRouter: (() => {
    const { initTRPC } = require("@trpc/server");
    const t = initTRPC.context<any>().create();
    return t.router({});
  })(),
}));

vi.mock("./_core/cookies", () => ({
  getSessionCookieOptions: vi.fn().mockReturnValue({}),
  COOKIE_NAME: "session",
}));

import { appRouter } from "./routers";

describe("Orders Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list orders with total count", async () => {
    const mockOrders = [
      {
        id: 1,
        cardName: "Conta Uber",
        clientName: "João",
        clientPhone: "11999999999",
        clientCity: "São Paulo",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        cardName: "Conta 99",
        clientName: "Maria",
        clientPhone: "11888888888",
        clientCity: "Rio de Janeiro",
        status: "completed",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mockListOrders.mockResolvedValue(mockOrders);
    mockCountOrders.mockResolvedValue(2);

    const caller = appRouter.createCaller({
      user: { id: 1, role: "admin", openId: "test", name: "Admin" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.admin.orders.list({ limit: 100, offset: 0 });
    expect(result.orders).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.orders[0].clientName).toBe("João");
    expect(result.orders[1].clientName).toBe("Maria");
  });

  it("should update order status", async () => {
    mockUpdateOrderStatus.mockResolvedValue(undefined);

    const caller = appRouter.createCaller({
      user: { id: 1, role: "admin", openId: "test", name: "Admin" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.admin.orders.updateStatus({
      id: 1,
      status: "completed",
    });
    expect(result.success).toBe(true);
    expect(mockUpdateOrderStatus).toHaveBeenCalledWith(1, "completed", undefined);
  });

  it("should update order status with notes", async () => {
    mockUpdateOrderStatus.mockResolvedValue(undefined);

    const caller = appRouter.createCaller({
      user: { id: 1, role: "admin", openId: "test", name: "Admin" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.admin.orders.updateStatus({
      id: 1,
      status: "processing",
      notes: "Em andamento - aguardando documentos",
    });
    expect(result.success).toBe(true);
    expect(mockUpdateOrderStatus).toHaveBeenCalledWith(
      1,
      "processing",
      "Em andamento - aguardando documentos"
    );
  });

  it("should get recent orders count", async () => {
    mockGetRecentOrdersCount.mockResolvedValue(3);

    const caller = appRouter.createCaller({
      user: { id: 1, role: "admin", openId: "test", name: "Admin" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.admin.orders.recentCount({ sinceMinutes: 5 });
    expect(result.count).toBe(3);
    expect(mockGetRecentOrdersCount).toHaveBeenCalledWith(5);
  });

  it("should handle empty orders list", async () => {
    mockListOrders.mockResolvedValue([]);
    mockCountOrders.mockResolvedValue(0);

    const caller = appRouter.createCaller({
      user: { id: 1, role: "admin", openId: "test", name: "Admin" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.admin.orders.list({ limit: 100, offset: 0 });
    expect(result.orders).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
