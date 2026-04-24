import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";

// Mock db functions
vi.mock("./db", () => ({
  validateAccessCode: vi.fn(),
  createAccessCode: vi.fn(),
  listAccessCodes: vi.fn(),
  toggleAccessCode: vi.fn(),
  deleteAccessCode: vi.fn(),
  renewAccessCode: vi.fn(),
  checkAccessCodeCanSubmit: vi.fn(),
  consumeAccessCode: vi.fn(),
  logAccessCodeUsage: vi.fn(),
  getAccessCodeLogs: vi.fn(),
  getRecentAccessCodeLogs: vi.fn(),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
}));

import { validateAccessCode, createAccessCode, listAccessCodes, toggleAccessCode, deleteAccessCode, renewAccessCode, checkAccessCodeCanSubmit, consumeAccessCode, logAccessCodeUsage, getAccessCodeLogs, getRecentAccessCodeLogs } from "./db";

const createCaller = (user?: { id: number; openId: string; name: string; role: string }) => {
  return appRouter.createCaller({
    user: user as any,
    req: {} as any,
    res: { clearCookie: vi.fn() } as any,
  });
};

describe("Access Code System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("access.validate", () => {
    it("should validate general password successfully", async () => {
      const mockValidate = validateAccessCode as ReturnType<typeof vi.fn>;
      mockValidate.mockResolvedValue({ valid: true, type: "general" });

      const caller = createCaller();
      const result = await caller.access.validate({ code: "Walk@@3095" });

      expect(result.valid).toBe(true);
      expect(result.type).toBe("general");
      expect(mockValidate).toHaveBeenCalledWith("Walk@@3095");
    });

    it("should validate VIP code successfully", async () => {
      const mockValidate = validateAccessCode as ReturnType<typeof vi.fn>;
      mockValidate.mockResolvedValue({ valid: true, type: "vip", clientName: "João", expiresInMinutes: 30 });

      const caller = createCaller();
      const result = await caller.access.validate({ code: "VIP-ABC123" });

      expect(result.valid).toBe(true);
      expect(result.type).toBe("vip");
      expect(result.clientName).toBe("João");
      expect(result.expiresInMinutes).toBe(30);
    });

    it("should validate multi-use VIP code with custom time", async () => {
      const mockValidate = validateAccessCode as ReturnType<typeof vi.fn>;
      mockValidate.mockResolvedValue({ valid: true, type: "vip", clientName: "Grupo A", expiresInMinutes: 60 });

      const caller = createCaller();
      const result = await caller.access.validate({ code: "MULTI-USE" });

      expect(result.valid).toBe(true);
      expect(result.type).toBe("vip");
      expect(result.expiresInMinutes).toBe(60);
    });

    it("should reject VIP code that reached maxUses limit", async () => {
      const mockValidate = validateAccessCode as ReturnType<typeof vi.fn>;
      mockValidate.mockResolvedValue({ valid: false, type: "none" });

      const caller = createCaller();
      const result = await caller.access.validate({ code: "USED-UP" });

      expect(result.valid).toBe(false);
    });

    it("should reject invalid code", async () => {
      const mockValidate = validateAccessCode as ReturnType<typeof vi.fn>;
      mockValidate.mockResolvedValue({ valid: false, type: "none" });

      const caller = createCaller();
      const result = await caller.access.validate({ code: "wrong-password" });

      expect(result.valid).toBe(false);
    });

    it("should reject empty code", async () => {
      const caller = createCaller();
      await expect(caller.access.validate({ code: "" })).rejects.toThrow();
    });
  });

  describe("access.create (admin only)", () => {
    it("should create VIP code as admin", async () => {
      const mockCreate = createAccessCode as ReturnType<typeof vi.fn>;
      mockCreate.mockResolvedValue({
        id: 1,
        code: "VIP-TEST01",
        type: "vip",
        status: "active",
        clientName: "Cliente Teste",
        maxUses: 1,
        currentUses: 0,
        createdAt: new Date(),
      });

      const caller = createCaller({ id: 1, openId: "admin1", name: "Admin", role: "admin" });
      const result = await caller.access.create({
        code: "VIP-TEST01",
        clientName: "Cliente Teste",
      });

      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith("VIP-TEST01", "Cliente Teste", 1, 30);
    });

    it("should create VIP code with custom maxUses and time", async () => {
      const mockCreate = createAccessCode as ReturnType<typeof vi.fn>;
      mockCreate.mockResolvedValue({
        id: 2,
        code: "VIP-MULTI",
        type: "vip",
        status: "active",
        clientName: "Grupo A",
        maxUses: 5,
        currentUses: 0,
        expiresInMinutes: 60,
        createdAt: new Date(),
      });

      const caller = createCaller({ id: 1, openId: "admin1", name: "Admin", role: "admin" });
      const result = await caller.access.create({
        code: "VIP-MULTI",
        clientName: "Grupo A",
        maxUses: 5,
        expiresInMinutes: 60,
      });

      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith("VIP-MULTI", "Grupo A", 5, 60);
    });

    it("should reject non-admin users", async () => {
      const caller = createCaller({ id: 2, openId: "user1", name: "User", role: "user" });
      await expect(
        caller.access.create({ code: "VIP-TEST02" })
      ).rejects.toThrow();
    });
  });

  describe("access.list (admin only)", () => {
    it("should list codes as admin", async () => {
      const mockList = listAccessCodes as ReturnType<typeof vi.fn>;
      mockList.mockResolvedValue([
        { id: 1, code: "VIP-001", status: "active", clientName: "João", maxUses: 1, currentUses: 0 },
        { id: 2, code: "VIP-002", status: "used", clientName: "Maria", maxUses: 1, currentUses: 1 },
      ]);

      const caller = createCaller({ id: 1, openId: "admin1", name: "Admin", role: "admin" });
      const result = await caller.access.list();

      expect(result).toHaveLength(2);
      expect(result[0].code).toBe("VIP-001");
    });

    it("should reject non-admin users", async () => {
      const caller = createCaller({ id: 2, openId: "user1", name: "User", role: "user" });
      await expect(caller.access.list()).rejects.toThrow();
    });
  });

  describe("access.toggle (admin only)", () => {
    it("should toggle code status as admin", async () => {
      const mockToggle = toggleAccessCode as ReturnType<typeof vi.fn>;
      mockToggle.mockResolvedValue(undefined);

      const caller = createCaller({ id: 1, openId: "admin1", name: "Admin", role: "admin" });
      const result = await caller.access.toggle({ id: 1, status: "disabled" });

      expect(result.success).toBe(true);
      expect(mockToggle).toHaveBeenCalledWith(1, "disabled");
    });

    it("should reject non-admin users", async () => {
      const caller = createCaller({ id: 2, openId: "user1", name: "User", role: "user" });
      await expect(caller.access.toggle({ id: 1, status: "disabled" })).rejects.toThrow();
    });
  });

  describe("access.delete (admin only)", () => {
    it("should delete code as admin", async () => {
      const mockDelete = deleteAccessCode as ReturnType<typeof vi.fn>;
      mockDelete.mockResolvedValue(undefined);

      const caller = createCaller({ id: 1, openId: "admin1", name: "Admin", role: "admin" });
      const result = await caller.access.delete({ id: 1 });

      expect(result.success).toBe(true);
      expect(mockDelete).toHaveBeenCalledWith(1);
    });

    it("should reject non-admin users", async () => {
      const caller = createCaller({ id: 2, openId: "user1", name: "User", role: "user" });
      await expect(caller.access.delete({ id: 1 })).rejects.toThrow();
    });
  });

  describe("access.renew (admin only)", () => {
    it("should renew VIP code as admin", async () => {
      const mockRenew = renewAccessCode as ReturnType<typeof vi.fn>;
      mockRenew.mockResolvedValue(undefined);

      const caller = createCaller({ id: 1, openId: "admin1", name: "Admin", role: "admin" });
      const result = await caller.access.renew({ id: 1 });

      expect(result.success).toBe(true);
      expect(mockRenew).toHaveBeenCalledWith(1);
    });

    it("should reject non-admin users", async () => {
      const caller = createCaller({ id: 2, openId: "user1", name: "User", role: "user" });
      await expect(caller.access.renew({ id: 1 })).rejects.toThrow();
    });
  });

  describe("access.logs (admin only)", () => {
    it("should return logs for a specific access code", async () => {
      const mockLogs = getAccessCodeLogs as ReturnType<typeof vi.fn>;
      mockLogs.mockResolvedValue([
        { id: 1, accessCodeId: 5, accessCode: "VIP-001", action: "login", createdAt: new Date(), details: '{"clientName":"Jo\u00e3o"}' },
        { id: 2, accessCodeId: 5, accessCode: "VIP-001", action: "consume", createdAt: new Date(), details: '{"newUses":1,"maxUses":3}' },
      ]);

      const caller = createCaller({ id: 1, openId: "admin1", name: "Admin", role: "admin" });
      const result = await caller.access.logs({ accessCodeId: 5 });

      expect(result).toHaveLength(2);
      expect(result[0].action).toBe("login");
      expect(result[1].action).toBe("consume");
      expect(mockLogs).toHaveBeenCalledWith(5);
    });

    it("should reject non-admin users", async () => {
      const caller = createCaller({ id: 2, openId: "user1", name: "User", role: "user" });
      await expect(caller.access.logs({ accessCodeId: 1 })).rejects.toThrow();
    });
  });

  describe("access.recentLogs (admin only)", () => {
    it("should return recent logs for notifications", async () => {
      const mockRecentLogs = getRecentAccessCodeLogs as ReturnType<typeof vi.fn>;
      mockRecentLogs.mockResolvedValue([
        { id: 10, accessCodeId: 5, accessCode: "VIP-001", action: "login", createdAt: new Date(), details: '{"clientName":"Jo\u00e3o"}' },
        { id: 9, accessCodeId: 3, accessCode: "VIP-002", action: "login", createdAt: new Date(), details: '{"clientName":"Maria"}' },
      ]);

      const caller = createCaller({ id: 1, openId: "admin1", name: "Admin", role: "admin" });
      const result = await caller.access.recentLogs({ limit: 20 });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(10);
      expect(mockRecentLogs).toHaveBeenCalledWith(20);
    });

    it("should use default limit of 50", async () => {
      const mockRecentLogs = getRecentAccessCodeLogs as ReturnType<typeof vi.fn>;
      mockRecentLogs.mockResolvedValue([]);

      const caller = createCaller({ id: 1, openId: "admin1", name: "Admin", role: "admin" });
      await caller.access.recentLogs();

      expect(mockRecentLogs).toHaveBeenCalledWith(50);
    });

    it("should reject non-admin users", async () => {
      const caller = createCaller({ id: 2, openId: "user1", name: "User", role: "user" });
      await expect(caller.access.recentLogs({ limit: 10 })).rejects.toThrow();
    });
  });
});
