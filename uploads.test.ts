import { describe, it, expect, vi, beforeEach } from 'vitest';
import nodemailer from 'nodemailer';
import { appRouter } from './routers';

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

// Mock db functions
vi.mock('./db', () => ({
  validateAccessCode: vi.fn(),
  createAccessCode: vi.fn(),
  listAccessCodes: vi.fn(),
  toggleAccessCode: vi.fn(),
  deleteAccessCode: vi.fn(),
  checkAccessCodeCanSubmit: vi.fn(),
  consumeAccessCode: vi.fn(),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
}));

// Mock storage
vi.mock('./storage', () => ({
  storagePut: vi.fn().mockResolvedValue({ url: 'https://s3.example.com/test-file.jpg', key: 'test-file.jpg' }),
  storageGet: vi.fn(),
}));

import { checkAccessCodeCanSubmit, consumeAccessCode } from './db';

// ============================================================
// ETAPA 1: submitFiles - salva docs no S3, valida/consome senha
// NÃO envia email (email é enviado apenas no submitPaymentProof)
// ============================================================
describe('uploads.submitFiles (Etapa 1 - Salvar docs)', () => {
  let mockSendMail: any;

  beforeEach(() => {
    mockSendMail = vi.fn().mockResolvedValue({ response: '250 Message sent' });
    vi.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail: mockSendMail,
    } as any);
  });

  it('should save docs to S3 and return uploadedDocs URLs (no email)', async () => {
    const mockCheck = checkAccessCodeCanSubmit as ReturnType<typeof vi.fn>;
    mockCheck.mockResolvedValue({ canSubmit: true, type: 'general' });
    const mockConsume = consumeAccessCode as ReturnType<typeof vi.fn>;
    mockConsume.mockResolvedValue(undefined);

    const caller = appRouter.createCaller({} as any);

    const photoBase64 = Buffer.from('photo content').toString('base64');
    const docBase64 = Buffer.from('doc content').toString('base64');

    const result = await caller.uploads.submitFiles({
      clientName: 'Maria Santos',
      service: 'Conta Uber',
      nameOption: 'random',
      profilePhoto: photoBase64,
      carDocument: docBase64,
      phone: '(11) 91234-5678',
      city: 'Rio de Janeiro',
      accessCode: 'Walk@@3095',
    });

    expect(result.success).toBe(true);
    expect(result.uploadedDocs).toBeDefined();
    expect(result.uploadedDocs!.length).toBeGreaterThanOrEqual(2);
    // NÃO deve enviar email na etapa 1
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('should consume VIP access code after successful submission', async () => {
    const mockCheck = checkAccessCodeCanSubmit as ReturnType<typeof vi.fn>;
    mockCheck.mockResolvedValue({ canSubmit: true, type: 'vip' });
    const mockConsume = consumeAccessCode as ReturnType<typeof vi.fn>;
    mockConsume.mockResolvedValue(undefined);

    const caller = appRouter.createCaller({} as any);

    const result = await caller.uploads.submitFiles({
      clientName: 'VIP Client',
      service: 'Conta Uber',
      nameOption: 'random',
      carDocument: Buffer.from('test doc').toString('base64'),
      phone: '(11) 91111-2222',
      city: 'São Paulo',
      accessCode: 'VIP-TEST123',
    });

    expect(result.success).toBe(true);
    expect(mockCheck).toHaveBeenCalledWith('VIP-TEST123');
    expect(mockConsume).toHaveBeenCalledWith('VIP-TEST123');
  });

  it('should reject submission when VIP code is already used', async () => {
    vi.clearAllMocks();
    mockSendMail = vi.fn().mockResolvedValue({ response: '250 Message sent' });
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: mockSendMail } as any);

    const mockCheck = checkAccessCodeCanSubmit as ReturnType<typeof vi.fn>;
    mockCheck.mockResolvedValue({ canSubmit: false, type: 'vip', reason: 'Esta senha VIP já foi utilizada para um envio. Solicite uma nova senha.' });
    const mockConsume = consumeAccessCode as ReturnType<typeof vi.fn>;

    const caller = appRouter.createCaller({} as any);

    const result = await caller.uploads.submitFiles({
      clientName: 'VIP Client 2',
      service: 'Conta 99',
      nameOption: 'first',
      carDocument: Buffer.from('test doc').toString('base64'),
      phone: '(11) 93333-4444',
      city: 'Rio de Janeiro',
      accessCode: 'VIP-USED001',
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('já foi utilizada');
    expect(mockConsume).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('should reject submission without accessCode', async () => {
    const caller = appRouter.createCaller({} as any);

    await expect(
      caller.uploads.submitFiles({
        clientName: 'No Code User',
        service: 'Conta Uber',
        nameOption: 'random',
        carDocument: Buffer.from('test doc').toString('base64'),
        phone: '(11) 97777-8888',
        city: 'Belo Horizonte',
        accessCode: '', // empty string should fail Zod min(1)
      })
    ).rejects.toThrow();
  });

  it('should block second VIP submission after first was consumed', async () => {
    const mockCheck = checkAccessCodeCanSubmit as ReturnType<typeof vi.fn>;
    const mockConsume = consumeAccessCode as ReturnType<typeof vi.fn>;

    // First submission: allowed
    mockCheck.mockResolvedValueOnce({ canSubmit: true, type: 'vip' });
    mockConsume.mockResolvedValueOnce(undefined);

    const caller = appRouter.createCaller({} as any);

    const result1 = await caller.uploads.submitFiles({
      clientName: 'VIP Client',
      service: 'Conta Uber',
      nameOption: 'random',
      carDocument: Buffer.from('test doc').toString('base64'),
      phone: '(11) 91111-2222',
      city: 'São Paulo',
      accessCode: 'VIP-ONCE123',
    });
    expect(result1.success).toBe(true);
    expect(mockConsume).toHaveBeenCalledWith('VIP-ONCE123');

    // Second submission: blocked (password already used)
    mockCheck.mockResolvedValueOnce({ canSubmit: false, type: 'vip', reason: 'Esta senha VIP já foi utilizada para um envio. Solicite uma nova senha.' });

    const result2 = await caller.uploads.submitFiles({
      clientName: 'VIP Client',
      service: 'Conta Uber',
      nameOption: 'random',
      carDocument: Buffer.from('test doc').toString('base64'),
      phone: '(11) 91111-2222',
      city: 'São Paulo',
      accessCode: 'VIP-ONCE123',
    });
    expect(result2.success).toBe(false);
    expect(result2.message).toContain('já foi utilizada');
  });
});

// ============================================================
// ETAPA 2: submitPaymentProof - envia UM ÚNICO email com TUDO
// (comprovante PIX + docs base64 + dados do cliente + indicação)
// ============================================================
describe('uploads.submitPaymentProof (Etapa 2 - Envio final com TUDO)', () => {
  let mockSendMail: any;

  beforeEach(() => {
    mockSendMail = vi.fn().mockResolvedValue({ response: '250 Message sent' });
    vi.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail: mockSendMail,
    } as any);
  });

  it('should send ONE email with ALL data: docs + PIX + client + referrer', async () => {
    const caller = appRouter.createCaller({} as any);

    const photoBase64 = Buffer.from('photo content').toString('base64');
    const docBase64 = Buffer.from('doc content').toString('base64');
    const paymentBase64 = Buffer.from('payment proof').toString('base64');

    const result = await caller.uploads.submitPaymentProof({
      clientName: 'Carlos Teste',
      service: 'Conta Uber',
      nameOption: 'random',
      phone: '(11) 98888-7777',
      city: 'Campinas',
      paymentProof: paymentBase64,
      profilePhoto: photoBase64,
      carDocument: docBase64,
      referrerName: 'Pedro Indicador',
      referrerPhone: '(11) 91234-0000',
      uploadedDocUrls: [
        { name: 'foto-perfil', url: 'https://s3.example.com/foto.jpg' },
        { name: 'documento-carro', url: 'https://s3.example.com/doc.pdf' },
      ],
    });

    expect(result.success).toBe(true);
    expect(mockSendMail).toHaveBeenCalledOnce();

    const callArgs = mockSendMail.mock.calls[0][0];

    // Email should contain referrer data
    expect(callArgs.html).toContain('Pedro Indicador');
    expect(callArgs.html).toContain('(11) 91234-0000');
    expect(callArgs.html).toContain('Indicado por');

    // Email should contain client data
    expect(callArgs.html).toContain('Carlos Teste');
    expect(callArgs.html).toContain('(11) 98888-7777');
    expect(callArgs.html).toContain('Campinas');

    // Email should have ALL attachments together (foto + doc + comprovante)
    expect(callArgs.attachments.length).toBeGreaterThanOrEqual(3);
    const filenames = callArgs.attachments.map((a: any) => a.filename);
    expect(filenames).toContain('foto-perfil.jpg');
    expect(filenames).toContain('documento-carro.pdf');
    expect(filenames).toContain('comprovante-pix.jpg');

    // Email should contain doc links from S3
    expect(callArgs.html).toContain('https://s3.example.com/foto.jpg');
    expect(callArgs.html).toContain('https://s3.example.com/doc.pdf');
  });

  it('should include docYear in email for Edição Doc Carro', async () => {
    const caller = appRouter.createCaller({} as any);

    const docBase64 = Buffer.from('pdf doc').toString('base64');
    const paymentBase64 = Buffer.from('payment proof').toString('base64');

    const result = await caller.uploads.submitPaymentProof({
      clientName: 'Ana Edição',
      service: 'EDIÇÃO DOC CARRO',
      nameOption: 'random',
      phone: '(11) 97777-3333',
      city: 'Santos',
      paymentProof: paymentBase64,
      carDocument: docBase64,
      docYear: '2026',
      referrerName: 'João Ref',
      referrerPhone: '(11) 95555-1111',
    });

    expect(result.success).toBe(true);
    expect(mockSendMail).toHaveBeenCalledOnce();

    const callArgs = mockSendMail.mock.calls[0][0];

    // Email should contain docYear
    expect(callArgs.html).toContain('2026');
    expect(callArgs.html).toContain('Ano do Documento');

    // Email should contain referrer data
    expect(callArgs.html).toContain('João Ref');
    expect(callArgs.html).toContain('(11) 95555-1111');
  });

  it('should send email even without optional docs (PIX-only)', async () => {
    const caller = appRouter.createCaller({} as any);

    const paymentBase64 = Buffer.from('payment proof').toString('base64');

    const result = await caller.uploads.submitPaymentProof({
      clientName: 'Simples Cliente',
      service: 'Consulta Geral',
      phone: '(11) 96666-5555',
      city: 'Guarulhos',
      paymentProof: paymentBase64,
    });

    expect(result.success).toBe(true);
    expect(mockSendMail).toHaveBeenCalledOnce();

    const callArgs = mockSendMail.mock.calls[0][0];
    // Should have at least the PIX comprovante
    expect(callArgs.attachments.length).toBeGreaterThanOrEqual(1);
    const filenames = callArgs.attachments.map((a: any) => a.filename);
    expect(filenames).toContain('comprovante-pix.jpg');
  });

  it('should handle email sending errors gracefully', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP error'));

    const caller = appRouter.createCaller({} as any);

    const result = await caller.uploads.submitPaymentProof({
      clientName: 'Error Client',
      service: 'Conta 99',
      phone: '(11) 99999-9999',
      city: 'Brasília',
      paymentProof: Buffer.from('test').toString('base64'),
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('Erro');
  });
});
