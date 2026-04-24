import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import nodemailer from "nodemailer";
import {
  validateAccessCode,
  createAccessCode,
  listAccessCodes,
  toggleAccessCode,
  deleteAccessCode,
  renewAccessCode,
  checkAccessCodeCanSubmit,
  consumeAccessCode,
  logAccessCodeUsage,
  getAccessCodeLogs,
  getRecentAccessCodeLogs,
  createCoupon,
  listCoupons,
  deleteCoupon,
  toggleCoupon,
  validateCoupon,
  consumeCoupon,
  getSiteSetting,
  setSiteSetting,
  getAllSiteSettings,
  getPixSetting,
  setPixSetting,
  getAllPixSettings,
  listServiceCards,
  createServiceCard,
  updateServiceCard,
  deleteServiceCard,
  listCardModels,
  listAllCardModels,
  createCardModel,
  updateCardModel,
  deleteCardModel,
  listCardDocuments,
  listAllCardDocuments,
  createCardDocument,
  updateCardDocument,
  deleteCardDocument,
  createOrder,
  listOrders,
  countOrders,
  updateOrderStatus,
  getRecentOrdersCount,
  listModelQuestions,
  listAllModelQuestions,
  createModelQuestion,
  updateModelQuestion,
  deleteModelQuestion,
} from "./db";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // === Sistema de Senhas ===
  access: router({
    validate: publicProcedure
      .input(z.object({ code: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const result = await validateAccessCode(input.code);
        return result;
      }),

    // Admin: criar senha VIP
    create: adminProcedure
      .input(
        z.object({
          code: z.string().min(3),
          clientName: z.string().optional(),
          expiresInMinutes: z.number().min(1).max(1440).default(30),
          maxUses: z.number().min(1).max(9999).default(1),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const accessCode = await createAccessCode(
            input.code,
            input.clientName,
            input.maxUses,
            input.expiresInMinutes
          );
          return { success: true, accessCode };
        } catch (error) {
          return {
            success: false,
            message: "Erro ao criar senha. Código já existe?",
          };
        }
      }),

    // Admin: listar senhas VIP
    list: adminProcedure.query(async () => {
      const codes = await listAccessCodes();
      return codes;
    }),

    // Admin: ativar/desativar senha
    toggle: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["active", "disabled"]),
        })
      )
      .mutation(async ({ input }) => {
        await toggleAccessCode(input.id, input.status);
        return { success: true };
      }),

    // Admin: excluir senha
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteAccessCode(input.id);
        return { success: true };
      }),

    // Admin: renovar senha (resetar usos e timer)
    renew: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await renewAccessCode(input.id);
        return { success: true };
      }),

    // Admin: logs de uso de uma senha específica
    logs: adminProcedure
      .input(z.object({ accessCodeId: z.number() }))
      .query(async ({ input }) => {
        return await getAccessCodeLogs(input.accessCodeId);
      }),

    // Admin: logs recentes de todas as senhas (para notificações)
    recentLogs: adminProcedure
      .input(
        z.object({ limit: z.number().min(1).max(100).default(50) }).optional()
      )
      .query(async ({ input }) => {
        return await getRecentAccessCodeLogs(input?.limit || 50);
      }),
  }),

  // === Sistema de Cupons ===
  coupons: router({
    // Admin: criar cupom
    create: adminProcedure
      .input(
        z.object({
          code: z.string().min(2),
          discountType: z.enum(["percentage", "fixed"]),
          discountValue: z.number().min(1),
          maxUses: z.number().min(1).default(1),
          expiresAt: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const coupon = await createCoupon({
            code: input.code,
            discountType: input.discountType,
            discountValue: input.discountValue,
            maxUses: input.maxUses,
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          });
          return { success: true, coupon };
        } catch (error) {
          return {
            success: false,
            message: "Erro ao criar cupom. Código já existe?",
          };
        }
      }),

    // Admin: listar cupons
    list: adminProcedure.query(async () => {
      return await listCoupons();
    }),

    // Admin: excluir cupom
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCoupon(input.id);
        return { success: true };
      }),

    // Admin: ativar/desativar cupom
    toggle: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["active", "disabled"]),
        })
      )
      .mutation(async ({ input }) => {
        await toggleCoupon(input.id, input.status);
        return { success: true };
      }),

    // Público: validar cupom (cliente digita o código)
    validate: publicProcedure
      .input(z.object({ code: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const result = await validateCoupon(input.code);
        return result;
      }),
  }),

  uploads: router({
    // ETAPA 1: Apenas faz upload dos docs para S3, valida senha e consome cupom. NÃO envia email.
    submitFiles: publicProcedure
      .input(
        z.object({
          clientName: z.string(),
          service: z.string(),
          nameOption: z.string(),
          profilePhoto: z.string().optional(),
          carDocument: z.string().optional(),
          alvara: z.string().optional(),
          condutaxi: z.string().optional(),
          phone: z.string().optional(),
          city: z.string().optional(),
          accessCode: z.string().min(1, "Código de acesso obrigatório"),
          couponCode: z.string().optional(),
          paymentProof: z.string().optional(),
          docYear: z.string().optional(),
          referrerName: z.string().optional(),
          referrerPhone: z.string().optional(),
          customAnswers: z.array(z.object({
            question: z.string(),
            answer: z.string(),
          })).optional(),
        })
      )
      .mutation(
        async ({
          input,
        }): Promise<{
          success: boolean;
          message: string;
          uploadedDocs?: { name: string; url: string }[];
        }> => {
          try {
            // Verificar se a senha pode ser usada
            const canSubmit = await checkAccessCodeCanSubmit(input.accessCode);
            if (!canSubmit.canSubmit) {
              return {
                success: false,
                message:
                  canSubmit.reason ||
                  "Esta senha já foi utilizada. Solicite uma nova senha VIP.",
                uploadedDocs: [] as { name: string; url: string }[],
              };
            }

            // Upload dos documentos para S3 (guardar URLs para o envio final)
            const uploadedDocs: {
              name: string;
              url: string;
              base64: string;
            }[] = [];

            if (input.profilePhoto) {
              try {
                const rnd = Math.random().toString(36).substring(2, 10);
                const { url } = await storagePut(
                  `docs/${input.clientName.replace(/\s+/g, "-")}-foto-perfil-${rnd}.jpg`,
                  Buffer.from(input.profilePhoto, "base64"),
                  "image/jpeg"
                );
                uploadedDocs.push({
                  name: "foto-perfil",
                  url,
                  base64: input.profilePhoto,
                });
              } catch (e) {
                console.error("[S3] Erro upload foto perfil:", e);
              }
            }
            if (input.carDocument) {
              try {
                const rnd = Math.random().toString(36).substring(2, 10);
                const { url } = await storagePut(
                  `docs/${input.clientName.replace(/\s+/g, "-")}-doc-carro-${rnd}.pdf`,
                  Buffer.from(input.carDocument, "base64"),
                  "application/pdf"
                );
                uploadedDocs.push({
                  name: "documento-carro",
                  url,
                  base64: input.carDocument,
                });
              } catch (e) {
                console.error("[S3] Erro upload doc carro:", e);
              }
            }
            if (input.alvara) {
              try {
                const rnd = Math.random().toString(36).substring(2, 10);
                const { url } = await storagePut(
                  `docs/${input.clientName.replace(/\s+/g, "-")}-alvara-${rnd}.pdf`,
                  Buffer.from(input.alvara, "base64"),
                  "application/pdf"
                );
                uploadedDocs.push({
                  name: "alvara",
                  url,
                  base64: input.alvara,
                });
              } catch (e) {
                console.error("[S3] Erro upload alvara:", e);
              }
            }
            if (input.condutaxi) {
              try {
                const rnd = Math.random().toString(36).substring(2, 10);
                const { url } = await storagePut(
                  `docs/${input.clientName.replace(/\s+/g, "-")}-condutaxi-${rnd}.pdf`,
                  Buffer.from(input.condutaxi, "base64"),
                  "application/pdf"
                );
                uploadedDocs.push({
                  name: "condutaxi",
                  url,
                  base64: input.condutaxi,
                });
              } catch (e) {
                console.error("[S3] Erro upload condutaxi:", e);
              }
            }

            // Consumir a senha após validação bem-sucedida
            try {
              await consumeAccessCode(input.accessCode);
            } catch (consumeError) {
              console.error(
                "[AccessCode] Erro ao consumir senha:",
                consumeError
              );
            }

            // Consumir o cupom se foi usado
            if (input.couponCode) {
              try {
                await consumeCoupon(input.couponCode, input.clientName);
              } catch (couponError) {
                console.error("[Coupon] Erro ao consumir cupom:", couponError);
              }
            }

            // Retornar URLs dos docs para o frontend guardar e enviar junto com o PIX
            return {
              success: true,
              message:
                "Arquivos salvos! Aguardando comprovante PIX para finalizar.",
              uploadedDocs: uploadedDocs.map(d => ({
                name: d.name,
                url: d.url,
              })),
            } as const;
          } catch (error) {
            console.error("Erro ao processar arquivos:", error);
            return {
              success: false,
              message: "Erro ao processar arquivos",
              uploadedDocs: [] as { name: string; url: string }[],
            };
          }
        }
      ),

    // ETAPA 2: Envio FINAL - recebe comprovante PIX + todos os dados + docs base64 → envia UM ÚNICO email com TUDO
    submitPaymentProof: publicProcedure
      .input(
        z.object({
          clientName: z.string(),
          service: z.string(),
          nameOption: z.string().optional(),
          phone: z.string().optional(),
          city: z.string().optional(),
          paymentProof: z.string().min(1, "Comprovante obrigatório"),
          // Documentos base64 para anexar no email
          profilePhoto: z.string().optional(),
          carDocument: z.string().optional(),
          alvara: z.string().optional(),
          condutaxi: z.string().optional(),
          docYear: z.string().optional(),
          referrerName: z.string().optional(),
          referrerPhone: z.string().optional(),
          // URLs dos docs já no S3 (para referência no email)
          uploadedDocUrls: z
            .array(z.object({ name: z.string(), url: z.string() }))
            .optional(),
          customAnswers: z.array(z.object({
            question: z.string(),
            answer: z.string(),
          })).optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_USER || "noreply@manus.im",
              pass: process.env.EMAIL_PASSWORD || "",
            },
          });

          // Upload do comprovante PIX para S3
          let paymentProofUrl = "";
          try {
            const randomSuffix = Math.random().toString(36).substring(2, 10);
            const fileKey = `comprovantes/${input.clientName.replace(/\s+/g, "-")}-${randomSuffix}.jpg`;
            const { url } = await storagePut(
              fileKey,
              Buffer.from(input.paymentProof, "base64"),
              "image/jpeg"
            );
            paymentProofUrl = url;
          } catch (uploadError) {
            console.error(
              "[S3] Erro ao fazer upload do comprovante:",
              uploadError
            );
          }

          // Construir lista de docs com URLs
          const docLinks = (input.uploadedDocUrls || [])
            .map(
              d =>
                `<li>✅ ${d.name}: <a href="${d.url}" style="color: #6C3AED;">Ver arquivo</a></li>`
            )
            .join("");

          const emailContent = `
            <h2 style="color: #6C3AED; border-bottom: 2px solid #6C3AED; padding-bottom: 10px;">NOVO PEDIDO - WALK CONTAS</h2>
            <p><strong>Data:</strong> ${new Date().toLocaleString("pt-BR")}</p>
            
            <h3 style="color: #333; margin-top: 20px;">DADOS DO CLIENTE</h3>
            <table style="border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Nome:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${input.clientName}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Telefone:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${input.phone || "Não informado"}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Cidade:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${input.city || "Não informado"}</td></tr>
            </table>
            
            <h3 style="color: #333; margin-top: 20px;">INDICAÇÃO</h3>
            <table style="border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Indicado por:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${input.referrerName || "Não informado"}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Telefone de quem indicou:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${input.referrerPhone || "Não informado"}</td></tr>
            </table>
            
            <h3 style="color: #333; margin-top: 20px;">SERVIÇO</h3>
            <table style="border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Serviço:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${input.service}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Opção de Nome:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${input.nameOption || "Não especificado"}</td></tr>
              ${input.docYear ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Ano do Documento:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${input.docYear}</td></tr>` : ""}
            </table>
            
            <h3 style="color: #333; margin-top: 20px;">COMPROVANTE PIX</h3>
            ${paymentProofUrl ? `<p>✅ <strong>Comprovante PIX:</strong> <a href="${paymentProofUrl}" style="color: #6C3AED;">Ver comprovante</a></p>` : "<p>❌ Comprovante não enviado</p>"}
            
            <h3 style="color: #333; margin-top: 20px;">DOCUMENTOS ANEXADOS</h3>
            <ul>
              ${input.profilePhoto ? "<li>✅ Foto de Perfil (JPG)</li>" : ""}
              ${input.carDocument ? "<li>✅ Documento do Carro (PDF/JPG)</li>" : ""}
              ${input.alvara ? "<li>✅ Alvará (PDF/JPG)</li>" : ""}
              ${input.condutaxi ? "<li>✅ Condutaxi (PDF/JPG)</li>" : ""}
              <li>✅ Comprovante de Pagamento PIX</li>
            </ul>
            ${input.customAnswers && input.customAnswers.length > 0 ? `
            <h3 style="color: #333; margin-top: 20px;">RESPOSTAS PERSONALIZADAS</h3>
            <table style="border-collapse: collapse; width: 100%;">
              ${input.customAnswers.map(a => `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>${a.question}:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${a.answer}</td></tr>`).join("")}
            </table>` : ""}
            ${docLinks ? `<h3 style="color: #333; margin-top: 20px;">LINKS DOS ARQUIVOS NO S3</h3><ul>${docLinks}</ul>` : ""}
            ${paymentProofUrl ? `<p><strong>Link Comprovante PIX:</strong> <a href="${paymentProofUrl}">${paymentProofUrl}</a></p>` : ""}
          `;

          // Criar registro do pedido no banco de dados
          try {
            await createOrder({
              cardName: input.service,
              clientName: input.clientName,
              clientPhone: input.phone,
              clientCity: input.city,
              referrerName: input.referrerName,
              referrerPhone: input.referrerPhone,
              nameOption: input.nameOption,
            });
          } catch (orderError) {
            console.error("[Order] Erro ao criar pedido:", orderError);
          }

          // Montar todos os anexos em um único email
          const attachments: { filename: string; content: Buffer }[] = [];
          if (input.profilePhoto)
            attachments.push({
              filename: "foto-perfil.jpg",
              content: Buffer.from(input.profilePhoto, "base64"),
            });
          if (input.carDocument)
            attachments.push({
              filename: "documento-carro.pdf",
              content: Buffer.from(input.carDocument, "base64"),
            });
          if (input.alvara)
            attachments.push({
              filename: "alvara.pdf",
              content: Buffer.from(input.alvara, "base64"),
            });
          if (input.condutaxi)
            attachments.push({
              filename: "condutaxi.pdf",
              content: Buffer.from(input.condutaxi, "base64"),
            });
          attachments.push({
            filename: "comprovante-pix.jpg",
            content: Buffer.from(input.paymentProof, "base64"),
          });

          await transporter.sendMail({
            from: process.env.EMAIL_USER || "noreply@manus.im",
            to: "csatransportes3095@gmail.com",
            subject: `NOVO PEDIDO COMPLETO - ${input.service} - ${input.clientName}`,
            html: emailContent,
            attachments,
          });

          // Notificação WhatsApp
          try {
            const customAnswersText = input.customAnswers && input.customAnswers.length > 0
              ? "\n\n--- RESPOSTAS PERSONALIZADAS ---\n" + input.customAnswers.map(a => `${a.question}: ${a.answer}`).join("\n")
              : "";
            const whatsappMessage = `🔔 NOVO PEDIDO - WALK CONTAS\n\n--- DADOS DO CLIENTE ---\nNome: ${input.clientName}\nTelefone: ${input.phone || "Nao informado"}\nCidade: ${input.city || "Nao informado"}\n\n--- INDICAÇÃO ---\nIndicado por: ${input.referrerName || "Nao informado"}\nTel. indicacao: ${input.referrerPhone || "Nao informado"}\n\n--- SERVIÇO ---\nServico: ${input.service}\nOpcao: ${input.nameOption || "Nao especificado"}${input.docYear ? "\nAno do Documento: " + input.docYear : ""}\n\n--- PAGAMENTO ---\nComprovante PIX: Enviado${paymentProofUrl ? "\nLink: " + paymentProofUrl : ""}\n\n--- DOCUMENTOS ---\n${input.profilePhoto ? "✅ Foto de Perfil\n" : ""}${input.carDocument ? "✅ Doc do Carro\n" : ""}${input.alvara ? "✅ Alvara\n" : ""}${input.condutaxi ? "✅ Condutaxi\n" : ""}✅ Comprovante PIX${customAnswersText}\n\nTodos os arquivos foram enviados por email.`;
            const whatsappUrl = `https://wa.me/5511978307371?text=${encodeURIComponent(whatsappMessage)}`;
            console.log("[WhatsApp] Notificacao disponivel em:", whatsappUrl);
          } catch (whatsappError) {
            console.error(
              "[WhatsApp] Erro ao enviar notificacao:",
              whatsappError
            );
          }

          return {
            success: true,
            message: "Pedido completo enviado com sucesso!",
            paymentProofUrl,
          };
        } catch (error) {
          console.error("Erro ao enviar pedido completo:", error);
          return { success: false, message: "Erro ao enviar pedido" };
        }
      }),
  }),

  // === Public Data (read-only, no auth required) ===
  publicData: router({
    siteSettings: publicProcedure.query(async () => {
      return await getAllSiteSettings();
    }),
    pixSettings: publicProcedure.query(async () => {
      return await getAllPixSettings();
    }),
    cards: publicProcedure.query(async () => {
      const cards = await listServiceCards();
      return cards.filter(c => c.active === 1);
    }),
    models: publicProcedure.query(async () => {
      const models = await listAllCardModels();
      return models.filter(m => m.active === 1);
    }),
    docs: publicProcedure.query(async () => {
      const docs = await listAllCardDocuments();
      return docs.filter(d => d.active === 1);
    }),
    questions: publicProcedure.query(async () => {
      const questions = await listAllModelQuestions();
      return questions.filter(q => q.active === 1);
    }),
  }),

  // === Admin Panel ===
  admin: router({
    // Configurações do Site
    site: router({
      getAll: adminProcedure.query(async () => {
        return await getAllSiteSettings();
      }),
      get: adminProcedure
        .input(z.object({ key: z.string() }))
        .query(async ({ input }) => {
          return await getSiteSetting(input.key);
        }),
      set: adminProcedure
        .input(
          z.object({
            key: z.string(),
            value: z.string(),
            type: z.enum(["string", "number", "boolean", "json"]).optional(),
          })
        )
        .mutation(async ({ input }) => {
          await setSiteSetting(
            input.key,
            input.value,
            (input.type || "string") as any
          );
          return { success: true };
        }),
      setAll: adminProcedure
        .input(
          z.object({
            settings: z.array(z.object({ key: z.string(), value: z.string() })),
          })
        )
        .mutation(async ({ input }) => {
          for (const s of input.settings) {
            await setSiteSetting(s.key, s.value, "string");
          }
          return { success: true };
        }),
    }),

    // Configurações PIX
    pix: router({
      getAll: adminProcedure.query(async () => {
        return await getAllPixSettings();
      }),
      get: adminProcedure
        .input(z.object({ key: z.string() }))
        .query(async ({ input }) => {
          return await getPixSetting(input.key);
        }),
      set: adminProcedure
        .input(z.object({ key: z.string(), value: z.string() }))
        .mutation(async ({ input }) => {
          await setPixSetting(input.key, input.value);
          return { success: true };
        }),
    }),

    // Cards de Serviço
    cards: router({
      list: adminProcedure.query(async () => {
        return await listServiceCards();
      }),
      listPublic: publicProcedure.query(async () => {
        const cards = await listServiceCards();
        return cards.filter(c => c.active === 1);
      }),
      create: adminProcedure
        .input(
          z.object({
            name: z.string(),
            imageUrl: z.string().optional(),
            borderColor: z.string().optional(),
            buttonText: z.string().optional(),
            guaranteeText: z.string().optional(),
            sortOrder: z.number().optional(),
            showNameForm: z.number().optional(),
            showReferrerForm: z.number().optional(),
            showClientForm: z.number().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const card = await createServiceCard(input);
          return { success: true, card };
        }),
      update: adminProcedure
        .input(
          z.object({
            id: z.number(),
            name: z.string().optional(),
            imageUrl: z.string().optional(),
            borderColor: z.string().optional(),
            buttonText: z.string().optional(),
            guaranteeText: z.string().optional(),
            sortOrder: z.number().optional(),
            active: z.number().optional(),
            showNameForm: z.number().optional(),
            showReferrerForm: z.number().optional(),
            showClientForm: z.number().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          await updateServiceCard(id, data);
          return { success: true };
        }),
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await deleteServiceCard(input.id);
          return { success: true };
        }),
    }),

    // Modelos por Card
    models: router({
      list: adminProcedure
        .input(z.object({ cardId: z.number() }))
        .query(async ({ input }) => {
          return await listCardModels(input.cardId);
        }),
      listAll: adminProcedure.query(async () => {
        return await listAllCardModels();
      }),
      listAllPublic: publicProcedure.query(async () => {
        const models = await listAllCardModels();
        return models.filter(m => m.active === 1);
      }),
      create: adminProcedure
        .input(
          z.object({
            cardId: z.number(),
            optionType: z.string(),
            optionLabel: z.string(),
            price: z.number(),
            sortOrder: z.number().optional(),
            showNameForm: z.number().optional(),
            showReferrerForm: z.number().optional(),
            showClientForm: z.number().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const model = await createCardModel(input);
          return { success: true, model };
        }),
      update: adminProcedure
        .input(
          z.object({
            id: z.number(),
            optionType: z.string().optional(),
            optionLabel: z.string().optional(),
            price: z.number().optional(),
            active: z.number().optional(),
            sortOrder: z.number().optional(),
            showNameForm: z.number().optional(),
            showReferrerForm: z.number().optional(),
            showClientForm: z.number().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          await updateCardModel(id, data);
          return { success: true };
        }),
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await deleteCardModel(input.id);
          return { success: true };
        }),
    }),

    // Upload de imagem para cards
    uploadImage: adminProcedure
      .input(z.object({ base64: z.string(), filename: z.string() }))
      .mutation(async ({ input }) => {
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const ext = input.filename.split(".").pop() || "jpg";
        const fileKey = `card-images/${randomSuffix}.${ext}`;
        const { url } = await storagePut(
          fileKey,
          Buffer.from(input.base64, "base64"),
          ext === "png" ? "image/png" : "image/jpeg"
        );
        return { success: true, url };
      }),

    // Documentos por Card
    docs: router({
      list: adminProcedure
        .input(z.object({ cardId: z.number() }))
        .query(async ({ input }) => {
          return await listCardDocuments(input.cardId);
        }),
      listAll: adminProcedure.query(async () => {
        return await listAllCardDocuments();
      }),
      listAllPublic: publicProcedure.query(async () => {
        const docs = await listAllCardDocuments();
        return docs.filter(d => d.active === 1);
      }),
      create: adminProcedure
        .input(
          z.object({
            cardId: z.number(),
            docType: z.string(),
            docLabel: z.string(),
            required: z.number().optional(),
            sortOrder: z.number().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const doc = await createCardDocument(input);
          return { success: true, doc };
        }),
      update: adminProcedure
        .input(
          z.object({
            id: z.number(),
            docType: z.string().optional(),
            docLabel: z.string().optional(),
            required: z.number().optional(),
            active: z.number().optional(),
            sortOrder: z.number().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          await updateCardDocument(id, data);
          return { success: true };
        }),
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await deleteCardDocument(input.id);
          return { success: true };
        }),
    }),

    // Perguntas Personalizadas por Modelo
    questions: router({
      list: adminProcedure
        .input(z.object({ modelId: z.number() }))
        .query(async ({ input }) => {
          return await listModelQuestions(input.modelId);
        }),
      listAll: adminProcedure.query(async () => {
        return await listAllModelQuestions();
      }),
      create: adminProcedure
        .input(
          z.object({
            modelId: z.number(),
            question: z.string(),
            fieldType: z.enum(["text", "textarea", "select"]).optional(),
            options: z.string().optional(),
            required: z.number().optional(),
            sortOrder: z.number().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const question = await createModelQuestion(input);
          return { success: true, question };
        }),
      update: adminProcedure
        .input(
          z.object({
            id: z.number(),
            question: z.string().optional(),
            fieldType: z.enum(["text", "textarea", "select"]).optional(),
            options: z.string().nullable().optional(),
            required: z.number().optional(),
            active: z.number().optional(),
            sortOrder: z.number().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          await updateModelQuestion(id, data);
          return { success: true };
        }),
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await deleteModelQuestion(input.id);
          return { success: true };
        }),
    }),

    // Pedidos (Orders Dashboard)
    orders: router({
      list: adminProcedure
        .input(
          z.object({
            limit: z.number().min(1).max(500).optional().default(100),
            offset: z.number().min(0).optional().default(0),
          })
        )
        .query(async ({ input }) => {
          const [ordersList, total] = await Promise.all([
            listOrders(input.limit, input.offset),
            countOrders(),
          ]);
          return { orders: ordersList, total };
        }),
      updateStatus: adminProcedure
        .input(
          z.object({
            id: z.number(),
            status: z.enum(["pending", "processing", "completed", "refunded", "cancelled"]),
            notes: z.string().optional(),
          })
        )
        .mutation(async ({ input }) => {
          await updateOrderStatus(input.id, input.status, input.notes);
          return { success: true };
        }),
      recentCount: adminProcedure
        .input(z.object({ sinceMinutes: z.number().optional().default(5) }))
        .query(async ({ input }) => {
          return { count: await getRecentOrdersCount(input.sinceMinutes) };
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
