// Home.tsx - Dados carregados dinamicamente do banco de dados via tRPC

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MessageCircle,
  Zap,
  Phone,
  Clock,
  Users,
  Upload,
  FileUp,
  Ticket,
  Copy,
  Check,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
// Types inferred from tRPC router output
type ServiceCard = {
  id: number;
  name: string;
  imageUrl: string | null;
  borderColor: string | null;
  buttonText: string | null;
  guaranteeText: string | null;
  sortOrder: number;
  active: number;
  createdAt: Date;
  updatedAt: Date;
};
type CardModel = {
  id: number;
  cardId: number;
  optionType: string;
  optionLabel: string;
  price: number;
  active: number;
  sortOrder: number;
  showNameForm: number;
  showReferrerForm: number;
  showClientForm: number;
  createdAt: Date;
};
type CardDocument = {
  id: number;
  cardId: number;
  docType: string;
  docLabel: string;
  required: number;
  active: number;
  sortOrder: number;
  createdAt: Date;
};

export default function Home() {
  // === Carregar dados do banco de dados ===
  const { data: siteSettings, isLoading: loadingSettings } =
    trpc.publicData.siteSettings.useQuery();
  const { data: pixSettingsData, isLoading: loadingPix } =
    trpc.publicData.pixSettings.useQuery();
  const { data: dbCards, isLoading: loadingCards } =
    trpc.publicData.cards.useQuery();
  const { data: dbModels, isLoading: loadingModels } =
    trpc.publicData.models.useQuery();
  const { data: dbDocs, isLoading: loadingDocs } =
    trpc.publicData.docs.useQuery();
  const { data: dbQuestions } =
    trpc.publicData.questions.useQuery();

  // === Dados derivados do banco ===
  const PIX_KEY = pixSettingsData?.pix_key || "11915193551";
  const PIX_NAME = pixSettingsData?.pix_holder || "Adiel Cardeal dos Santos";
  const PIX_BANK = pixSettingsData?.pix_bank || "99Pay";
  const WHATSAPP_NUMBER = siteSettings?.whatsapp_number || "5511978307371";
  const WHATSAPP_DISPLAY = siteSettings?.whatsapp_display || "(11) 97830-7371";
  
  // Filtrar apenas cards ativos
  const activeCards = useMemo(() => {
    if (!dbCards) return [];
    return dbCards.filter(card => card.active === 1);
  }, [dbCards]);
  const SITE_TITLE = siteSettings?.site_title || "WALK CONTAS";
  const SITE_SUBTITLE =
    siteSettings?.site_subtitle || "Atendimento Rápido no WhatsApp";
  const HERO_VIDEO_URL =
    siteSettings?.hero_video_url ||
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663543456340/RjBUSWZB6B8QJu724zr2z2/grok-video-773cd6a1-9692-4475-8a8a-d92ce6336761_d82b163c.mp4";
  const HERO_TITLE =
    siteSettings?.hero_title ||
    'Atendimento <span class="text-primary">Rápido</span> no WhatsApp';
  const HERO_SUBTITLE =
    siteSettings?.hero_subtitle ||
    "Suporte direto para motoristas de Uber, 99 e InDrive. Respostas em minutos, não em horas.";
  const FOOTER_HOURS = siteSettings?.footer_hours || "24H";
  const PROMO_ACTIVE = siteSettings?.promo_active === "true";
  const PROMO_TEXT =
    siteSettings?.promo_text ||
    "HOJE TEM DESCONTO DE R$100, AO FINALIZAR O PEDIDO";

  // Hero Features
  const FEATURE1_TITLE = siteSettings?.feature1_title || "Atendimento 24h";
  const FEATURE1_DESC =
    siteSettings?.feature1_desc || "Sempre disponível quando você precisa";
  const FEATURE2_TITLE = siteSettings?.feature2_title || "Resposta Imediata";
  const FEATURE2_DESC =
    siteSettings?.feature2_desc || "Suporte ágil via WhatsApp";
  const FEATURE3_TITLE =
    siteSettings?.feature3_title || "Múltiplas Plataformas";
  const FEATURE3_DESC =
    siteSettings?.feature3_desc || "Suporte para Uber, 99 e InDrive";

  // Seção Faça Seu Pedido
  const SECTION_ORDER_TITLE =
    siteSettings?.section_order_title || "FAÇA SEU PEDIDO";
  const SECTION_ORDER_SUBTITLE =
    siteSettings?.section_order_subtitle ||
    "Soluções completas para motoristas de aplicativos";

  // Rodapé
  const FOOTER_DESCRIPTION =
    siteSettings?.footer_description ||
    "Atendimento rápido e eficiente para motoristas de aplicativos.";
  const FOOTER_SERVICES_TITLE =
    siteSettings?.footer_services_title || "Serviços";
  const FOOTER_CONTACT_TITLE = siteSettings?.footer_contact_title || "Contato";
  const FOOTER_COPYRIGHT =
    siteSettings?.footer_copyright ||
    `2026 ${SITE_TITLE}. Todos os direitos reservados.`;

  // Construir mapa de modelos por cardId
  const modelsByCard = useMemo(() => {
    if (!dbModels) return {} as Record<number, CardModel[]>;
    const map: Record<number, CardModel[]> = {};
    for (const m of dbModels) {
      if (m.active !== 1) continue; // Filtrar modelos inativos
      if (!map[m.cardId]) map[m.cardId] = [];
      map[m.cardId].push(m);
    }
    return map;
  }, [dbModels]);

  // Construir mapa de documentos por cardId
  const docsByCard = useMemo(() => {
    if (!dbDocs) return {} as Record<number, CardDocument[]>;
    const map: Record<number, CardDocument[]> = {};
    for (const d of dbDocs) {
      if (d.active !== 1) continue; // Filtrar documentos inativos
      if (!map[d.cardId]) map[d.cardId] = [];
      map[d.cardId].push(d);
    }
    return map;
  }, [dbDocs]);

  // Construir mapa de perguntas por modelId
  const questionsByModel = useMemo(() => {
    if (!dbQuestions) return {} as Record<number, typeof dbQuestions>;
    const map: Record<number, typeof dbQuestions> = {};
    for (const q of dbQuestions) {
      if (q.active !== 1) continue;
      if (!map[q.modelId]) map[q.modelId] = [];
      map[q.modelId].push(q);
    }
    return map;
  }, [dbQuestions]);

  // === Estados do formulário ===
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedNameOption, setSelectedNameOption] = useState<
    "random" | "first" | null
  >(null);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [userInputName, setUserInputName] = useState("");
  const [showRandomWarning, setShowRandomWarning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [carDocument, setCarDocument] = useState<File | null>(null);
  const [alvaraFile, setAlvaraFile] = useState<File | null>(null);
  const [condutaxiFile, setCondutaxiFile] = useState<File | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [showCadastroForm, setShowCadastroForm] = useState(false);
  const [showPDFUpload, setShowPDFUpload] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [cadastroStep, setCadastroStep] = useState(1);
  const [customAnswers, setCustomAnswers] = useState<Record<number, string>>({});
  const [referrerName, setReferrerName] = useState("");
  const [referrerPhone, setReferrerPhone] = useState("");
  const [finalService, setFinalService] = useState<string | null>(null);
  const [firstNameStep, setFirstNameStep] = useState<"name" | "upload">("name");
  const [showPromoText, setShowPromoText] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<{
    type: string;
    value: number;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(
    null
  );
  const [pixCopied, setPixCopied] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [sendingProof, setSendingProof] = useState(false);
  const [docYear, setDocYear] = useState("");
  // Guardar docs base64 e URLs para envio final com PIX
  const [savedDocsBase64, setSavedDocsBase64] = useState<{
    profilePhoto?: string;
    carDocument?: string;
    alvara?: string;
    condutaxi?: string;
  }>({});
  const [savedDocUrls, setSavedDocUrls] = useState<
    { name: string; url: string }[]
  >([]);
  const [savedNameOption, setSavedNameOption] = useState("");

  const submitMutation = trpc.uploads.submitFiles.useMutation();
  const submitPaymentProofMutation =
    trpc.uploads.submitPaymentProof.useMutation();
  const validateCouponMutation = trpc.coupons.validate.useMutation();

  // Helper: verificar se o card selecionado tem um tipo de documento específico
  const cardHasDocType = (docType: string): boolean => {
    if (!selectedCardId || !docsByCard[selectedCardId]) return false;
    return docsByCard[selectedCardId].some(d => d.docType === docType);
  };

  // Helper: verificar se o card é do tipo PDF-only (ex: Serviços Documento Carro)
  const isCardPDFOnly = (): boolean => {
    if (!selectedCardId || !docsByCard[selectedCardId]) return false;
    const docs = docsByCard[selectedCardId];
    return docs.length === 1 && docs[0].docType === "pdf";
  };

  // Helper: obter modelos do card selecionado
  const getSelectedCardModels = () => {
    if (!selectedCardId || !modelsByCard[selectedCardId]) return [];
    return modelsByCard[selectedCardId];
  };

  // Helper: verificar se o MODELO selecionado mostra o formulário de nome
  const selectedCardShowsNameForm = (): boolean => {
    const model = getSelectedModel();
    if (model) return (model.showNameForm ?? 1) === 1;
    // Fallback para card se nenhum modelo selecionado
    if (!selectedCardId || !dbCards) return true;
    const card = dbCards.find(c => c.id === selectedCardId);
    return (card?.showNameForm ?? 1) === 1;
  };

  // Helper: verificar se o MODELO selecionado mostra o formulário "Quem indicou"
  const selectedCardShowsReferrerForm = (): boolean => {
    const model = getSelectedModel();
    if (model) return (model.showReferrerForm ?? 1) === 1;
    // Fallback para card se nenhum modelo selecionado
    if (!selectedCardId || !dbCards) return true;
    const card = dbCards.find(c => c.id === selectedCardId);
    return (card?.showReferrerForm ?? 1) === 1;
  };

  // Helper: verificar se o MODELO selecionado mostra o formulário "Dados do cliente"
  const selectedCardShowsClientForm = (): boolean => {
    const model = getSelectedModel();
    if (model) return (model.showClientForm ?? 1) === 1;
    // Fallback para card se nenhum modelo selecionado
    if (!selectedCardId || !dbCards) return true;
    const card = dbCards.find(c => c.id === selectedCardId);
    return (card?.showClientForm ?? 1) === 1;
  };

  // Helper: obter perguntas personalizadas do modelo selecionado
  const getSelectedModelQuestions = () => {
    if (!selectedModelId) return [];
    return questionsByModel[selectedModelId] || [];
  };

  // Helper: verificar se o modelo tem perguntas personalizadas
  const selectedModelHasQuestions = (): boolean => {
    return getSelectedModelQuestions().length > 0;
  };

  // Helper: calcular o primeiro passo do cadastro baseado nos toggles
  const getInitialCadastroStep = (): number => {
    if (selectedCardShowsReferrerForm()) return 1;
    if (selectedCardShowsClientForm()) return 2;
    if (selectedModelHasQuestions()) return 3;
    return 0; // nenhum formulário habilitado
  };

  // Helper: formatar preço em centavos para R$
  const formatPrice = (priceInCents: number): string => {
    return `R$ ${(priceInCents / 100).toFixed(2).replace(".", ",")}`;
  };

  // Função para calcular valor com desconto
  const calculateDiscountedValue = (originalValue: string): string => {
    if (!couponDiscount) return originalValue;
    const numericValue = parseFloat(
      originalValue.replace("R$ ", "").replace(".", "").replace(",", ".")
    );
    if (isNaN(numericValue)) return originalValue;
    let discounted = numericValue;
    if (couponDiscount.type === "percentage") {
      discounted = numericValue - (numericValue * couponDiscount.value) / 100;
    } else {
      // fixed: valor armazenado em centavos no banco, converter para reais
      discounted = numericValue - couponDiscount.value / 100;
    }
    if (discounted < 0) discounted = 0;
    return `R$ ${discounted.toFixed(2).replace(".", ",")}`;
  };

  // Obter o preço atual selecionado
  const getModelPrice = () => {
    if (!selectedModelId) return "Consulte";
    const allModels = Object.values(modelsByCard).flat();
    const model = allModels.find(m => m.id === selectedModelId);
    if (!model) return "Consulte";
    return formatPrice(model.price);
  };

  const getSelectedModel = () => {
    if (!selectedModelId) return null;
    const allModels = Object.values(modelsByCard).flat();
    return allModels.find(m => m.id === selectedModelId);
  };

  const handleCopyPix = () => {
    navigator.clipboard
      .writeText(PIX_KEY)
      .then(() => {
        setPixCopied(true);
        toast.success("Chave PIX copiada!");
        setTimeout(() => setPixCopied(false), 3000);
      })
      .catch(() => {
        const textArea = document.createElement("textarea");
        textArea.value = PIX_KEY;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setPixCopied(true);
        toast.success("Chave PIX copiada!");
        setTimeout(() => setPixCopied(false), 3000);
      });
  };

  const handlePaymentProofSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Envie apenas imagens (JPG, PNG)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }
    setPaymentProof(file);
    const reader = new FileReader();
    reader.onload = ev => {
      setPaymentProofPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponValid(null);
      setCouponDiscount(null);
      setCouponMessage("");
      return;
    }
    setIsValidatingCoupon(true);
    try {
      const result = await validateCouponMutation.mutateAsync({
        code: couponCode.trim(),
      });
      if (result.valid) {
        setCouponValid(true);
        setCouponDiscount({
          type: result.discountType!,
          value: result.discountValue!,
        });
        const discountText =
          result.discountType === "percentage"
            ? `${result.discountValue}% de desconto`
            : `R$ ${(result.discountValue! / 100).toFixed(2).replace(".", ",")} de desconto`;
        setCouponMessage(`Cupom válido! ${discountText}`);
        toast.success(`Cupom aplicado: ${discountText}`);
      } else {
        setCouponValid(false);
        setCouponDiscount(null);
        setCouponMessage(result.reason || "Cupom inválido");
        toast.error(result.reason || "Cupom inválido");
      }
    } catch (error) {
      setCouponValid(false);
      setCouponDiscount(null);
      setCouponMessage("Erro ao validar cupom");
      toast.error("Erro ao validar cupom");
    }
    setIsValidatingCoupon(false);
  };

  const handleNameSelection = (modelId: number) => {
    // Get the selected model
    const allModels = Object.values(modelsByCard).flat();
    const model = allModels.find(m => m.id === modelId);
    if (!model) return;
    
    // Set selectedModelId if not already set
    setSelectedModelId(modelId);
    setCustomAnswers({}); // Reset custom answers for new model
    
    // Se o formulário de nome está DESATIVADO para este card,
    // pular direto para o upload de arquivos (tratar como "random")
    if (!selectedCardShowsNameForm()) {
      setSelectedNameOption("random");
      return;
    }
    
    // Determine flow based on optionType
    if (model.optionType === "random") {
      setSelectedNameOption("random");
    } else {
      // For "first", "full", or "custom", treat as "first" (requires name input)
      setSelectedNameOption("first");
    }
  };

  const handleSendWithFile = async (option: "random" | "first") => {
    try {
      // Validar APENAS documentos que estão configurados para este card
      if (cardHasDocType("profilePhoto") && !profilePhoto) {
        toast.error("Por favor, selecione a foto de perfil");
        return;
      }
      if (cardHasDocType("carDocument") && !carDocument) {
        toast.error("Por favor, selecione o documento do carro");
        return;
      }
      if (cardHasDocType("alvara") && !alvaraFile) {
        toast.error("Por favor, selecione o Alvará");
        return;
      }
      if (cardHasDocType("condutaxi") && !condutaxiFile) {
        toast.error("Por favor, selecione o Condutaxi");
        return;
      }
      // Se showClientForm está ativo, exigir dados do cliente
      const needsClientData = selectedCardShowsClientForm();
      const needsReferrerData = selectedCardShowsReferrerForm();
      if (needsClientData && (!clientName || !clientPhone || !clientCity)) {
        const initialStep = getInitialCadastroStep();
        if (initialStep > 0) {
          setCadastroStep(initialStep);
          setShowCadastroForm(true);
        }
        return;
      }
      if (needsReferrerData && (!referrerName || !referrerPhone)) {
        setCadastroStep(1);
        setShowCadastroForm(true);
        return;
      }

      const profilePhotoBase64 = profilePhoto
        ? await new Promise<string>(resolve => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve((reader.result as string).split(",")[1] || "");
            reader.readAsDataURL(profilePhoto);
          })
        : undefined;

      const carDocumentBase64 = carDocument
        ? await new Promise<string>(resolve => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve((reader.result as string).split(",")[1] || "");
            reader.readAsDataURL(carDocument);
          })
        : undefined;

      const alvaraBase64 = alvaraFile
        ? await new Promise<string>(resolve => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve((reader.result as string).split(",")[1] || "");
            reader.readAsDataURL(alvaraFile);
          })
        : undefined;

      const condutaxiBase64 = condutaxiFile
        ? await new Promise<string>(resolve => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve((reader.result as string).split(",")[1] || "");
            reader.readAsDataURL(condutaxiFile);
          })
        : undefined;

      const paymentProofBase64 = paymentProof
        ? await new Promise<string>(resolve => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve((reader.result as string).split(",")[1] || "");
            reader.readAsDataURL(paymentProof);
          })
        : undefined;

      const accessCode = sessionStorage.getItem("walk_access_code") || "";
      if (!accessCode) {
        toast.error(
          "Sessão expirada. Por favor, faça login novamente com sua senha."
        );
        sessionStorage.removeItem("walk_access_granted");
        sessionStorage.removeItem("walk_access_code");
        sessionStorage.removeItem("walk_access_type");
        window.location.reload();
        return;
      }

      // Formatar respostas personalizadas
      const formattedAnswers = getSelectedModelQuestions().length > 0
        ? getSelectedModelQuestions().map((q: any) => ({
            question: q.question,
            answer: customAnswers[q.id] || "",
          })).filter((a: any) => a.answer.trim())
        : undefined;

      const result = await submitMutation.mutateAsync({
        clientName: clientName || userInputName || "Cliente",
        service: selectedService || "Não especificado",
        nameOption: option,
        profilePhoto: profilePhotoBase64,
        carDocument: carDocumentBase64,
        alvara: alvaraBase64,
        condutaxi: condutaxiBase64,
        phone: clientPhone,
        city: clientCity,
        accessCode,
        couponCode: couponValid ? couponCode : undefined,
        paymentProof: paymentProofBase64,
        docYear: docYear || undefined,
        referrerName: referrerName || undefined,
        referrerPhone: referrerPhone || undefined,
        customAnswers: formattedAnswers,
      });

      if (result.success) {
        const accessType = sessionStorage.getItem("walk_access_type");
        if (accessType === "vip") {
          sessionStorage.removeItem("walk_access_granted");
          sessionStorage.removeItem("walk_access_code");
          sessionStorage.removeItem("walk_access_type");
        }
        // Guardar docs base64 e URLs para envio final com PIX
        setSavedDocsBase64({
          profilePhoto: profilePhotoBase64,
          carDocument: carDocumentBase64,
          alvara: alvaraBase64,
          condutaxi: condutaxiBase64,
        });
        setSavedDocUrls(result.uploadedDocs || []);
        setSavedNameOption(option);
        setSuccessMessage("Arquivos salvos! Agora envie o comprovante PIX.");
        setShowSuccessModal(true);
      } else {
        toast.error(result.message || "Erro ao enviar arquivos");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao enviar arquivos");
    }
  };

  const handleSendPDFOnly = async () => {
    try {
      if (!carDocument) {
        toast.error("Por favor, selecione um documento PDF");
        return;
      }
      // Se showClientForm está ativo, exigir dados do cliente
      const needsClientData = selectedCardShowsClientForm();
      const needsReferrerData = selectedCardShowsReferrerForm();
      if (needsClientData && (!clientName || !clientPhone || !clientCity)) {
        const initialStep = getInitialCadastroStep();
        if (initialStep > 0) {
          setCadastroStep(initialStep);
          setShowCadastroForm(true);
        }
        return;
      }
      if (needsReferrerData && (!referrerName || !referrerPhone)) {
        setCadastroStep(1);
        setShowCadastroForm(true);
        return;
      }

      const carDocumentBase64 = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve((reader.result as string).split(",")[1] || "");
        reader.readAsDataURL(carDocument);
      });

      const paymentProofBase64 = paymentProof
        ? await new Promise<string>(resolve => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve((reader.result as string).split(",")[1] || "");
            reader.readAsDataURL(paymentProof);
          })
        : undefined;

      const accessCode = sessionStorage.getItem("walk_access_code") || "";
      if (!accessCode) {
        toast.error(
          "Sessão expirada. Por favor, faça login novamente com sua senha."
        );
        sessionStorage.removeItem("walk_access_granted");
        sessionStorage.removeItem("walk_access_code");
        sessionStorage.removeItem("walk_access_type");
        window.location.reload();
        return;
      }

      // Formatar respostas personalizadas
      const formattedAnswers = getSelectedModelQuestions().length > 0
        ? getSelectedModelQuestions().map((q: any) => ({
            question: q.question,
            answer: customAnswers[q.id] || "",
          })).filter((a: any) => a.answer.trim())
        : undefined;

      const result = await submitMutation.mutateAsync({
        clientName: clientName || "Cliente",
        service: selectedService || "EDIÇÃO DE DOCUMENTO",
        nameOption: "pdf-only" as any,
        carDocument: carDocumentBase64,
        phone: clientPhone,
        city: clientCity,
        accessCode,
        couponCode: couponValid ? couponCode : undefined,
        paymentProof: paymentProofBase64,
        docYear: docYear || undefined,
        referrerName: referrerName || undefined,
        referrerPhone: referrerPhone || undefined,
        customAnswers: formattedAnswers,
      });

      if (result.success) {
        const accessType = sessionStorage.getItem("walk_access_type");
        if (accessType === "vip") {
          sessionStorage.removeItem("walk_access_granted");
          sessionStorage.removeItem("walk_access_code");
          sessionStorage.removeItem("walk_access_type");
        }
        // Guardar docs base64 e URLs para envio final com PIX
        setSavedDocsBase64({
          carDocument: carDocumentBase64,
        });
        setSavedDocUrls(result.uploadedDocs || []);
        setSavedNameOption("pdf-only");
        setSuccessMessage("Documento salvo! Agora envie o comprovante PIX.");
        setShowSuccessModal(true);
      } else {
        toast.error(result.message || "Erro ao enviar documento");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao enviar documento");
    }
  };

  const handleSolicitarSuporteClick = (
    e: React.MouseEvent,
    service: string,
    cardId: number
  ) => {
    e.preventDefault();
    setSelectedService(service);
    setSelectedCardId(cardId);
    setFinalService(service);

    // Se o card tem apenas 1 modelo ativo, pular a tela de seleção e ir direto
    const cardModels = modelsByCard[cardId] || [];
    if (cardModels.length === 1) {
      const singleModel = cardModels[0];
      setSelectedModelId(singleModel.id);
      
      // Verificar se o formulário de nome está ativado para este card
      const card = dbCards?.find(c => c.id === cardId);
      const showNameForm = (card?.showNameForm ?? 1) === 1;
      
      if (!showNameForm) {
        // Pular formulário de nome, ir direto para upload
        setSelectedNameOption("random");
      } else if (singleModel.optionType === "random") {
        setSelectedNameOption("random");
      } else {
        setSelectedNameOption("first");
      }
      setShowNameModal(true);
      return;
    }

    setShowNameModal(true);
  };

  // Reset all states
  const resetAllStates = () => {
    setShowSuccessModal(false);
    setShowNameModal(false);
    setShowCadastroForm(false);
    setShowPDFUpload(false);
    setSelectedService(null);
    setSelectedCardId(null);
    setFinalService(null);
    setSelectedNameOption(null);
    setFirstNameStep("name");
    setSelectedFile(null);
    setProfilePhoto(null);
    setCarDocument(null);
    setAlvaraFile(null);
    setCondutaxiFile(null);
    setClientName("");
    setClientPhone("");
    setClientCity("");
    setUserInputName("");
    setReferrerName("");
    setReferrerPhone("");
    setSuccessMessage("");
    setCadastroStep(1);
    setShowRandomWarning(false);
    setCouponCode("");
    setCouponValid(null);
    setCouponDiscount(null);
    setCouponMessage("");
    setPaymentProof(null);
    setPaymentProofPreview(null);
    setPixCopied(false);
    setSendingProof(false);
    setDocYear("");
    setSavedDocsBase64({});
    setSavedDocUrls([]);
    setSavedNameOption("");
  };

  // Loading state
  const isLoading =
    loadingSettings ||
    loadingPix ||
    loadingCards ||
    loadingModels ||
    loadingDocs;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-white/70 text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  // Renderizar campos de upload baseado nos documentos do card
  const renderUploadFields = (prefix: string) => {
    if (!selectedCardId || !docsByCard[selectedCardId]) return null;
    const docs = docsByCard[selectedCardId];

    return docs.map(doc => {
      if (doc.docType === "profilePhoto") {
        return (
          <div key={`${prefix}-${doc.id}`}>
            <label className="block text-black font-semibold mb-2 bg-white px-2 py-1 rounded">
              {doc.docLabel} (JPG) {doc.required ? "OBRIGATORIO" : ""}
            </label>
            <input
              type="file"
              id={`profile-photo-${prefix}`}
              accept=".jpg,.jpeg"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  if (!["image/jpeg", "image/jpg"].includes(file.type)) {
                    toast.error("Foto de perfil deve ser JPG");
                    return;
                  }
                  setProfilePhoto(file);
                  toast.success(`Foto ${file.name} selecionada`);
                }
              }}
            />
            <button
              onClick={() =>
                document.getElementById(`profile-photo-${prefix}`)?.click()
              }
              className="w-full px-4 py-2 bg-red-600 border border-red-700 hover:bg-red-700 text-green-400 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
            >
              {profilePhoto
                ? `${profilePhoto.name}`
                : `Selecionar ${doc.docLabel}`}
            </button>
          </div>
        );
      }
      if (doc.docType === "carDocument") {
        return (
          <div key={`${prefix}-${doc.id}`}>
            <label className="block text-black font-semibold mb-2 bg-white px-2 py-1 rounded">
              {doc.docLabel} (PDF ou JPG) {doc.required ? "OBRIGATORIO" : ""}
            </label>
            <input
              type="file"
              id={`car-doc-${prefix}`}
              accept=".pdf,.jpg,.jpeg"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  if (
                    !["application/pdf", "image/jpeg", "image/jpg"].includes(
                      file.type
                    )
                  ) {
                    toast.error("Documento deve ser PDF ou JPG");
                    return;
                  }
                  setCarDocument(file);
                  toast.success(`Documento ${file.name} selecionado`);
                }
              }}
            />
            <button
              onClick={() =>
                document.getElementById(`car-doc-${prefix}`)?.click()
              }
              className="w-full px-4 py-2 bg-red-700 border border-red-800 hover:bg-red-800 text-green-400 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
            >
              {carDocument
                ? `${carDocument.name}`
                : `Selecionar ${doc.docLabel}`}
            </button>
          </div>
        );
      }
      if (doc.docType === "alvara") {
        return (
          <div key={`${prefix}-${doc.id}`}>
            <label className="block text-black font-semibold mb-2 bg-white px-2 py-1 rounded">
              {doc.docLabel} (PDF ou JPG) {doc.required ? "OBRIGATORIO" : ""}
            </label>
            <input
              type="file"
              id={`alvara-${prefix}`}
              accept=".pdf,.jpg,.jpeg"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  if (
                    !["application/pdf", "image/jpeg", "image/jpg"].includes(
                      file.type
                    )
                  ) {
                    toast.error("Alvará deve ser PDF ou JPG");
                    return;
                  }
                  setAlvaraFile(file);
                  toast.success(`Alvará ${file.name} selecionado`);
                }
              }}
            />
            <button
              onClick={() =>
                document.getElementById(`alvara-${prefix}`)?.click()
              }
              className="w-full px-4 py-2 bg-red-700 border border-red-800 hover:bg-red-800 text-green-400 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
            >
              {alvaraFile ? `${alvaraFile.name}` : `Selecionar ${doc.docLabel}`}
            </button>
          </div>
        );
      }
      if (doc.docType === "condutaxi") {
        return (
          <div key={`${prefix}-${doc.id}`}>
            <label className="block text-black font-semibold mb-2 bg-white px-2 py-1 rounded">
              {doc.docLabel} (PDF ou JPG) {doc.required ? "OBRIGATORIO" : ""}
            </label>
            <input
              type="file"
              id={`condutaxi-${prefix}`}
              accept=".pdf,.jpg,.jpeg"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  if (
                    !["application/pdf", "image/jpeg", "image/jpg"].includes(
                      file.type
                    )
                  ) {
                    toast.error("Condutaxi deve ser PDF ou JPG");
                    return;
                  }
                  setCondutaxiFile(file);
                  toast.success(`Condutaxi ${file.name} selecionado`);
                }
              }}
            />
            <button
              onClick={() =>
                document.getElementById(`condutaxi-${prefix}`)?.click()
              }
              className="w-full px-4 py-2 bg-red-700 border border-red-800 hover:bg-red-800 text-green-400 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
            >
              {condutaxiFile
                ? `${condutaxiFile.name}`
                : `Selecionar ${doc.docLabel}`}
            </button>
          </div>
        );
      }
      if (doc.docType === "pdf") {
        return (
          <div key={`${prefix}-${doc.id}`}>
            <label className="block text-white font-semibold mb-2">
              {doc.docLabel} (PDF) {doc.required ? "OBRIGATORIO" : ""}
            </label>
            <input
              type="file"
              id={`pdf-doc-${prefix}`}
              accept=".pdf"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.type !== "application/pdf") {
                    toast.error("Arquivo deve ser PDF");
                    return;
                  }
                  setCarDocument(file);
                  toast.success(`Documento ${file.name} selecionado`);
                }
              }}
            />
            <button
              onClick={() =>
                document.getElementById(`pdf-doc-${prefix}`)?.click()
              }
              className="w-full px-4 py-2 bg-black border border-white/20 hover:bg-white/10 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
            >
              {carDocument
                ? `${carDocument.name}`
                : `Selecionar ${doc.docLabel}`}
            </button>
          </div>
        );
      }
      return null;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Modal de Seleção de Nome */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-black/80 backdrop-blur-md border border-primary/30 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            {selectedNameOption === "random" ? (
              <>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Enviar Arquivos
                </h3>
                <p className="text-white/70 mb-2">Selecione seus arquivos</p>
                {/* Mostrar serviço e valor selecionado */}
                <div className="bg-primary/20 border border-primary/40 rounded-lg p-3 mb-4 text-center">
                  <p className="text-white font-bold text-sm">
                    {selectedService}
                  </p>
                  <p className="text-green-400 font-bold text-lg">
                    {getModelPrice()}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Campo Ano do Documento - para cards de edição de documento */}
                  {isCardPDFOnly() && (
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        Qual ano deseja no documento?
                      </label>
                      <Input
                        type="text"
                        placeholder="Ex: 2025, 2026..."
                        value={docYear}
                        onChange={e => setDocYear(e.target.value)}
                        className="border-2 text-center placeholder-black/50 focus:ring-black"
                        style={{
                          backgroundColor: "#ffffff",
                          color: "#000000",
                          fontSize: "18px",
                          borderStyle: "double",
                          borderColor: "#000000",
                        }}
                      />
                    </div>
                  )}
                  {renderUploadFields("random")}

                  <button
                    onClick={() => handleSendWithFile("random")}
                    className="w-full px-4 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-600/80 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 mt-4"
                  >
                    ENVIAR
                  </button>

                  <button
                    onClick={() => {
                      // Se o card tem só 1 modelo, fechar modal inteiro
                      const models = getSelectedCardModels();
                      if (models.length <= 1) {
                        setShowNameModal(false);
                        setSelectedNameOption(null);
                        setSelectedService(null);
                        setSelectedCardId(null);
                      } else {
                        setSelectedNameOption(null);
                      }
                      setProfilePhoto(null);
                      setCarDocument(null);
                      setAlvaraFile(null);
                      setCondutaxiFile(null);
                      setDocYear("");
                    }}
                    className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-300"
                  >
                    Voltar
                  </button>
                </div>
              </>
            ) : selectedNameOption === "first" && firstNameStep === "name" ? (
              <>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Qual nome para aparecer na sua conta
                </h3>
                <p className="text-white font-semibold mb-6 text-center bg-green-600 px-4 py-2 rounded-lg flex items-center justify-center">
                  Digite o nome que deseja usar na conta
                </p>

                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Digite seu nome"
                    value={userInputName}
                    onChange={e => setUserInputName(e.target.value)}
                    className="border-2 text-center placeholder-black/50 focus:ring-black"
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontSize: "18px",
                      borderStyle: "double",
                      borderColor: "#000000",
                    }}
                    autoFocus
                  />

                  <button
                    onClick={() => {
                      if (!userInputName.trim()) {
                        toast.error("Por favor, digite seu nome");
                        return;
                      }
                      setFirstNameStep("upload");
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-secondary to-pink-600 hover:from-secondary/80 hover:to-pink-600/80 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
                  >
                    Próximo
                  </button>

                  <button
                    onClick={() => {
                      setShowNameModal(false);
                      setSelectedNameOption(null);
                      setUserInputName("");
                    }}
                    className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-300"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : selectedNameOption === "first" && firstNameStep === "upload" ? (
              <>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Enviar Arquivos
                </h3>
                <p className="text-white/70 mb-2">Selecione seus arquivos</p>
                {/* Mostrar serviço e valor selecionado */}
                <div className="bg-primary/20 border border-primary/40 rounded-lg p-3 mb-4 text-center">
                  <p className="text-white font-bold text-sm">
                    {selectedService}
                  </p>
                  <p className="text-green-400 font-bold text-lg">
                    {getModelPrice()}
                  </p>
                </div>

                <div className="space-y-4">
                  {renderUploadFields("first")}

                  <button
                    onClick={() => handleSendWithFile("first")}
                    className="w-full px-4 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-600/80 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 mt-4"
                  >
                    ENVIAR
                  </button>

                  <button
                    onClick={() => {
                      setSelectedNameOption(null);
                      setFirstNameStep("name");
                      setProfilePhoto(null);
                      setCarDocument(null);
                      setAlvaraFile(null);
                      setCondutaxiFile(null);
                    }}
                    className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-300"
                  >
                    Voltar
                  </button>
                </div>
              </>
            ) : isCardPDFOnly() ? (
              <>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Selecione uma Opção
                </h3>
                <p className="text-white/70 mb-6">Escolha o serviço desejado</p>

                <div className="space-y-3">
                  {getSelectedCardModels().map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModelId(model.id);
                        setShowPDFUpload(true);
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-600/80 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-between"
                    >
                      <span>{model.optionLabel}</span>
                      <span className="text-white font-bold">
                        {formatPrice(model.price)}
                      </span>
                    </button>
                  ))}

                  <button
                    onClick={() => setShowNameModal(false)}
                    className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-300"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Selecione uma Opção
                </h3>
                <p className="text-white/70 mb-6">
                  Como você gostaria de ser identificado?
                </p>

                <div className="space-y-3">
                  {getSelectedCardModels().map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        handleNameSelection(model.id);
                      }}
                      className="w-full px-4 py-3 bg-black border border-white/20 hover:bg-white/10 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-between"
                    >
                      <span>{model.optionLabel}</span>
                      <span className="text-white font-bold">
                        {formatPrice(model.price)}
                      </span>
                    </button>
                  ))}

                  <button
                    onClick={() => setShowNameModal(false)}
                    className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-300"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Cadastro */}
      {showCadastroForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-black/80 backdrop-blur-md border border-primary/30 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            {cadastroStep === 1 && (
              <>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Quem o indicou?
                </h3>
                <p className="text-white/70 mb-6">
                  Nos diga o nome e telefone de quem te indicou
                </p>

                <div className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">
                      Nome de quem indicou
                    </Label>
                    <Input
                      type="text"
                      placeholder="Nome completo"
                      value={referrerName}
                      onChange={e => setReferrerName(e.target.value)}
                      className="border-2 text-center placeholder-black/50 focus:ring-black"
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#000000",
                        fontSize: "18px",
                        borderStyle: "double",
                        borderColor: "#000000",
                      }}
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">
                      Telefone de quem indicou
                    </Label>
                    <Input
                      type="tel"
                      placeholder="(11) 98765-4321"
                      value={referrerPhone}
                      onChange={e => setReferrerPhone(e.target.value)}
                      className="border-2 text-center placeholder-black/50 focus:ring-black"
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#000000",
                        fontSize: "18px",
                        borderStyle: "double",
                        borderColor: "#000000",
                      }}
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (!referrerName || !referrerPhone) {
                        toast.error("Por favor, preencha todos os campos");
                        return;
                      }
                      if (selectedCardShowsClientForm()) {
                        setCadastroStep(2);
                        return;
                      }
                      if (selectedModelHasQuestions()) {
                        setCadastroStep(3);
                        return;
                      }
                      // Nenhum passo seguinte - enviar direto
                      setShowCadastroForm(false);
                      setCadastroStep(1);
                      if (isCardPDFOnly() || showPDFUpload) {
                        handleSendPDFOnly();
                      } else {
                        handleSendWithFile(selectedNameOption as "random" | "first");
                      }
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-600/80 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
                  >
                    {(selectedCardShowsClientForm() || selectedModelHasQuestions()) ? "Continuar" : "Finalizar"}
                  </button>

                  <button
                    onClick={() => {
                      setShowCadastroForm(false);
                      setCadastroStep(1);
                    }}
                    className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-300"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
            {cadastroStep === 2 && (
              <>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Seus dados
                </h3>
                <p className="text-white/70 mb-6">
                  Agora nos diga seus dados para processar o pedido
                </p>

                <div className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">
                      Nome Completo
                    </Label>
                    <Input
                      type="text"
                      placeholder="Seu nome"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      className="border-2 text-center placeholder-black/50 focus:ring-black"
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#000000",
                        fontSize: "18px",
                        borderStyle: "double",
                        borderColor: "#000000",
                      }}
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Telefone</Label>
                    <Input
                      type="tel"
                      placeholder="(11) 98765-4321"
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      className="border-2 text-center placeholder-black/50 focus:ring-black"
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#000000",
                        fontSize: "18px",
                        borderStyle: "double",
                        borderColor: "#000000",
                      }}
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Cidade</Label>
                    <Input
                      type="text"
                      placeholder="São Paulo"
                      value={clientCity}
                      onChange={e => setClientCity(e.target.value)}
                      className="border-2 text-center placeholder-black/50 focus:ring-black"
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#000000",
                        fontSize: "18px",
                        borderStyle: "double",
                        borderColor: "#000000",
                      }}
                    />
                  </div>

                  {/* Campo de Cupom de Desconto */}
                  <div className="border border-green-500/30 rounded-lg p-3 bg-green-500/5">
                    <Label className="text-green-400 mb-2 block flex items-center gap-1">
                      <Ticket className="w-4 h-4" /> Cupom de Desconto
                      (opcional)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Digite o código"
                        value={couponCode}
                        onChange={e => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponValid(null);
                          setCouponDiscount(null);
                          setCouponMessage("");
                        }}
                        className="border-2 text-center placeholder-black/50 focus:ring-green-500 flex-1"
                        style={{
                          backgroundColor: "#ffffff",
                          color: "#000000",
                          fontSize: "16px",
                          borderStyle: "double",
                          borderColor: "#000000",
                        }}
                      />
                      <button
                        onClick={handleValidateCoupon}
                        disabled={isValidatingCoupon || !couponCode.trim()}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all text-sm whitespace-nowrap"
                      >
                        {isValidatingCoupon ? "..." : "Aplicar"}
                      </button>
                    </div>
                    {couponMessage && (
                      <p
                        className={`text-sm mt-2 font-semibold ${couponValid ? "text-green-400" : "text-red-400"}`}
                      >
                        {couponMessage}
                      </p>
                    )}
                    {couponValid && couponDiscount && (
                      <div className="mt-2 p-2 bg-green-500/10 rounded text-center">
                        <p className="text-green-400 font-bold text-sm">
                          Valor com desconto:{" "}
                          {calculateDiscountedValue(getModelPrice())}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (!clientName || !clientPhone || !clientCity) {
                        toast.error("Por favor, preencha todos os campos");
                        return;
                      }
                      if (selectedModelHasQuestions()) {
                        setCadastroStep(3);
                        return;
                      }
                      setShowCadastroForm(false);
                      setCadastroStep(1);
                      if (isCardPDFOnly() || showPDFUpload) {
                        handleSendPDFOnly();
                      } else {
                        handleSendWithFile(
                          selectedNameOption as "random" | "first"
                        );
                      }
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-600/80 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
                  >
                    {selectedModelHasQuestions() ? "Continuar" : "Finalizar"}
                  </button>

                  <button
                    onClick={() => {
                      if (selectedCardShowsReferrerForm()) {
                        setCadastroStep(1);
                      } else {
                        setShowCadastroForm(false);
                        setCadastroStep(1);
                      }
                    }}
                    className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-300"
                  >
                    {selectedCardShowsReferrerForm() ? "Voltar" : "Cancelar"}
                  </button>
                </div>
              </>
            )}
            {cadastroStep === 3 && (
              <>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Informações Adicionais
                </h3>
                <p className="text-white/70 mb-6">
                  Responda as perguntas abaixo
                </p>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {getSelectedModelQuestions().map((q: any) => (
                    <div key={q.id}>
                      <Label className="text-white mb-2 block">
                        {q.question}{q.required === 1 && <span className="text-red-400 ml-1">*</span>}
                      </Label>
                      {q.fieldType === "textarea" ? (
                        <textarea
                          value={customAnswers[q.id] || ""}
                          onChange={e => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Digite sua resposta..."
                          rows={3}
                          className="w-full border-2 text-center placeholder-black/50 focus:ring-black rounded-md px-3 py-2"
                          style={{
                            backgroundColor: "#ffffff",
                            color: "#000000",
                            fontSize: "16px",
                            borderStyle: "double",
                            borderColor: "#000000",
                          }}
                        />
                      ) : q.fieldType === "select" && q.options ? (
                        <select
                          value={customAnswers[q.id] || ""}
                          onChange={e => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          className="w-full border-2 text-center focus:ring-black rounded-md px-3 py-2"
                          style={{
                            backgroundColor: "#ffffff",
                            color: "#000000",
                            fontSize: "16px",
                            borderStyle: "double",
                            borderColor: "#000000",
                          }}
                        >
                          <option value="">Selecione...</option>
                          {(() => { try { return JSON.parse(q.options); } catch { return []; } })().map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          type="text"
                          value={customAnswers[q.id] || ""}
                          onChange={e => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Digite sua resposta..."
                          className="border-2 text-center placeholder-black/50 focus:ring-black"
                          style={{
                            backgroundColor: "#ffffff",
                            color: "#000000",
                            fontSize: "18px",
                            borderStyle: "double",
                            borderColor: "#000000",
                          }}
                        />
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      // Validar perguntas obrigatórias
                      const questions = getSelectedModelQuestions();
                      const missingRequired = questions.filter((q: any) => q.required === 1 && !(customAnswers[q.id] || "").trim());
                      if (missingRequired.length > 0) {
                        toast.error("Por favor, responda todas as perguntas obrigatórias");
                        return;
                      }
                      setShowCadastroForm(false);
                      setCadastroStep(1);
                      if (isCardPDFOnly() || showPDFUpload) {
                        handleSendPDFOnly();
                      } else {
                        handleSendWithFile(selectedNameOption as "random" | "first");
                      }
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-600/80 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
                  >
                    Finalizar
                  </button>

                  <button
                    onClick={() => {
                      if (selectedCardShowsClientForm()) {
                        setCadastroStep(2);
                      } else if (selectedCardShowsReferrerForm()) {
                        setCadastroStep(1);
                      } else {
                        setShowCadastroForm(false);
                        setCadastroStep(1);
                      }
                    }}
                    className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-300"
                  >
                    {(selectedCardShowsClientForm() || selectedCardShowsReferrerForm()) ? "Voltar" : "Cancelar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Upload PDF-Only */}
      {showPDFUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-black/80 backdrop-blur-md border border-primary/30 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-2">
              Enviar Documento
            </h3>
            <p className="text-white/70 mb-2">Selecione seu documento em PDF</p>
            {/* Mostrar serviço e valor selecionado */}
            <div className="bg-primary/20 border border-primary/40 rounded-lg p-3 mb-4 text-center">
              <p className="text-white font-bold text-sm">{selectedService}</p>
              <p className="text-green-400 font-bold text-lg">
                {getModelPrice()}
              </p>
            </div>

            <div className="space-y-4">
              {/* Campo Ano do Documento - apenas para cards de edição de documento */}
              {isCardPDFOnly() && (
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Qual ano deseja no documento?
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: 2025, 2026..."
                    value={docYear}
                    onChange={e => setDocYear(e.target.value)}
                    className="border-2 text-center placeholder-black/50 focus:ring-black"
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      fontSize: "18px",
                      borderStyle: "double",
                      borderColor: "#000000",
                    }}
                  />
                </div>
              )}

              <div>
                <label className="block text-white font-semibold mb-2">
                  Documento (PDF)
                </label>
                <input
                  type="file"
                  id="pdf-doc-upload"
                  accept=".pdf"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.type !== "application/pdf") {
                        toast.error("Arquivo deve ser PDF");
                        return;
                      }
                      setCarDocument(file);
                      toast.success(`Documento ${file.name} selecionado`);
                    }
                  }}
                />
                <button
                  onClick={() =>
                    document.getElementById("pdf-doc-upload")?.click()
                  }
                  className="w-full px-4 py-2 bg-black border border-white/20 hover:bg-white/10 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                >
                  {carDocument ? `${carDocument.name}` : "Selecionar PDF"}
                </button>
              </div>

              <button
                onClick={() => {
                  if (!carDocument) {
                    toast.error("Por favor, selecione um documento PDF");
                    return;
                  }
                  setShowPDFUpload(false);
                  setShowNameModal(false);
                  const initialStep = getInitialCadastroStep();
                  if (initialStep === 0) {
                    // Ambos formulários desativados, enviar direto
                    handleSendPDFOnly();
                  } else {
                    setCadastroStep(initialStep);
                    setShowCadastroForm(true);
                  }
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-600/80 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                Próximo
              </button>

              <button
                onClick={() => {
                  setShowPDFUpload(false);
                  setShowNameModal(true);
                  setCarDocument(null);
                }}
                className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-md shadow-sm border-b border-primary/30">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">{SITE_TITLE}</h1>
          </div>
          <p className="hidden md:block text-sm text-white/70">
            {SITE_SUBTITLE}
          </p>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Vídeo em mobile */}
            <div className="relative md:hidden order-first -mx-4 px-4 mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl blur-3xl"></div>
              <video
                autoPlay
                muted
                loop
                playsInline
                className="relative rounded-xl shadow-lg w-full h-64 object-contain"
              >
                <source src={HERO_VIDEO_URL} type="video/mp4" />
                Seu navegador não suporta vídeos HTML5.
              </video>
            </div>

            {/* Conteúdo à Esquerda */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h2
                  className="text-4xl md:text-5xl font-bold text-foreground leading-tight"
                  dangerouslySetInnerHTML={{ __html: HERO_TITLE }}
                />
                <p className="text-lg text-muted-foreground">{HERO_SUBTITLE}</p>
              </div>

              {/* Features */}
              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-foreground">
                      {FEATURE1_TITLE}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {FEATURE1_DESC}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-foreground">
                      {FEATURE2_TITLE}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {FEATURE2_DESC}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-foreground">
                      {FEATURE3_TITLE}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {FEATURE3_DESC}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vídeo à Direita (Desktop) */}
            <div className="relative hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl blur-3xl"></div>
              <video
                autoPlay
                muted
                loop
                className="relative rounded-2xl shadow-2xl w-full h-auto object-cover"
              >
                <source src={HERO_VIDEO_URL} type="video/mp4" />
                Seu navegador não suporta vídeos HTML5.
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Serviços - Dinâmica do banco */}
      <section className="py-16 md:py-24 bg-black/10">
        <div className="container">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold mb-3 neon-lightning"
              style={{ color: "#00FFFF" }}
            >
              {SECTION_ORDER_TITLE}
            </h2>
            <p className="text-lg text-white/70">{SECTION_ORDER_SUBTITLE}</p>
            {PROMO_ACTIVE && (
              <p className="mt-3 text-lg font-bold text-yellow-400 animate-pulse">
                {PROMO_TEXT}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCards?.map((card: ServiceCard) => (
              <div
                key={card.id}
                className={`bg-gradient-to-br from-blue-900/60 to-purple-900/60 backdrop-blur-md rounded-xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-${card.borderColor || "primary/30"}`}
              >
                <div className="w-16 h-16 bg-transparent rounded-lg flex items-center justify-center mb-4">
                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-12 h-12 object-contain"
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (
                          e.target as HTMLImageElement
                        ).nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <Zap
                    className={`w-8 h-8 text-primary ${card.imageUrl ? "hidden" : ""}`}
                  />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {card.name.toUpperCase()}
                </h3>
                {card.guaranteeText && (
                  <p className="text-white/70 mb-4 text-sm">
                    <span className="font-bold text-white">Garantia:</span>{" "}
                    {card.guaranteeText}
                  </p>
                )}
                <button
                  onClick={e =>
                    handleSolicitarSuporteClick(e, card.name, card.id)
                  }
                  className="w-full px-4 py-2 border border-primary text-black bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-300 font-semibold"
                >
                  {card.buttonText || `COMPRA > ${card.name.toUpperCase()}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 backdrop-blur-sm text-white py-8 border-t border-primary/30">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-3">{SITE_TITLE}</h4>
              <p className="text-white/70">{FOOTER_DESCRIPTION}</p>
            </div>
            <div>
              <h4 className="font-bold mb-3">{FOOTER_SERVICES_TITLE}</h4>
              <ul className="space-y-2 text-white/70 list-none">
                {activeCards?.map((card: ServiceCard) => (
                  <li
                    key={card.id}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {card.name}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">{FOOTER_CONTACT_TITLE}</h4>
              <p className="text-white/70 mb-2">WhatsApp: {WHATSAPP_DISPLAY}</p>
              <p className="text-white/70">Disponível {FOOTER_HOURS}</p>
            </div>
          </div>
          <div className="border-t border-primary/30 pt-8 text-center text-white/70">
            <p>&copy; {FOOTER_COPYRIGHT}</p>
          </div>
        </div>
      </footer>

      {/* Modal de Sucesso com PIX e WhatsApp */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-4">
          <div className="bg-black/80 backdrop-blur-md border border-green-500/50 rounded-2xl p-6 max-w-md mx-4 shadow-2xl text-center">
            <div className="mb-4">
              <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 bg-red-600 px-4 py-2 rounded-lg">
                FINALIZE SEU PEDIDO ✓
              </h3>
              <p className="text-white font-bold underline text-sm">
                Sistema recebeu os arquivos
              </p>
            </div>

            {/* Valor do Serviço */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-3">
              <p className="text-purple-400 font-bold text-sm mb-1">
                VALOR A PAGAR
              </p>
              <p className="text-white font-bold text-sm">
                {finalService || selectedService || "Serviço"}
              </p>
              <p className="text-green-400 font-bold text-2xl">
                {couponValid && couponDiscount
                  ? calculateDiscountedValue(getModelPrice())
                  : getModelPrice()}
              </p>
              {couponValid && couponDiscount && (
                <p className="text-white/50 text-xs line-through">
                  {getModelPrice()}
                </p>
              )}
            </div>

            {/* Chave PIX */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-3">
              <p className="text-blue-400 font-bold text-sm mb-2">
                DADOS PARA PAGAMENTO PIX
              </p>
              <div className="bg-black/50 rounded-lg p-3 mb-2">
                <p className="text-white/70 text-xs mb-1">
                  Chave PIX (Telefone)
                </p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-white font-bold text-lg tracking-wider">
                    {PIX_KEY}
                  </p>
                  <button
                    onClick={handleCopyPix}
                    className="p-1.5 bg-blue-500/20 hover:bg-blue-500/40 rounded-md transition-all"
                    title="Copiar chave PIX"
                  >
                    {pixCopied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-blue-400" />
                    )}
                  </button>
                </div>
                <p className="text-white/70 text-xs mt-1">{PIX_NAME}</p>
                <p className="text-white/50 text-xs">{PIX_BANK}</p>
              </div>
              <button
                onClick={handleCopyPix}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all text-sm flex items-center justify-center gap-2"
              >
                {pixCopied ? (
                  <>
                    <Check className="w-4 h-4" /> COPIADO!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> COPIAR CHAVE PIX
                  </>
                )}
              </button>
            </div>

            {/* Upload Comprovante */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-3">
              <p className="text-yellow-400 font-bold text-sm mb-2">
                ENVIE O COMPROVANTE DE PAGAMENTO
              </p>
              <p className="text-white/70 text-xs mb-3">
                Faça o PIX e envie a foto/print do comprovante abaixo
              </p>

              {paymentProofPreview ? (
                <div className="relative mb-2">
                  <img
                    src={paymentProofPreview}
                    alt="Comprovante"
                    className="w-full max-h-40 object-contain rounded-lg border border-yellow-500/30"
                  />
                  <button
                    onClick={() => {
                      setPaymentProof(null);
                      setPaymentProofPreview(null);
                    }}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-500"
                  >
                    ✕
                  </button>
                  <p className="text-green-400 text-xs mt-1 font-semibold">
                    Comprovante anexado ✓
                  </p>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <div className="border-2 border-dashed border-yellow-500/40 rounded-lg p-4 hover:border-yellow-500/70 transition-all">
                    <ImageIcon className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-white/80 text-sm font-semibold">
                      Clique para enviar comprovante
                    </p>
                    <p className="text-white/50 text-xs">JPG, PNG - Máx 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePaymentProofSelect}
                  />
                </label>
              )}
            </div>

            {/* Aviso de redirecionamento WhatsApp - OBRIGATORIO */}
            <div className="bg-red-600/30 border-2 border-red-500 rounded-lg p-4 mb-3">
              <div className="flex items-center gap-2 justify-center mb-2">
                <Phone className="w-5 h-5 text-red-400" />
                <p className="text-red-400 font-bold text-sm">
                  ATENCAO - OBRIGATORIO
                </p>
              </div>
              <p className="text-white font-semibold text-sm text-center mb-2">
                Voce PRECISA clicar em{" "}
                <span className="text-yellow-300 font-bold">
                  FINALIZAR PEDIDO
                </span>{" "}
                para completar seu pedido!
              </p>
              <p className="text-white/90 text-xs text-center">
                Isso ira abrir o WhatsApp automaticamente com seus dados. Nao
                feche esta pagina ate completar o processo.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setPaymentProof(null);
                  setPaymentProofPreview(null);
                  setSendingProof(false);
                }}
                className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
              >
                ← VOLTAR
              </button>
              <button
                disabled={!paymentProofPreview || sendingProof}
                onClick={async () => {
                  if (paymentProof) {
                    setSendingProof(true);
                    try {
                      const proofBase64 = await new Promise<string>(resolve => {
                        const reader = new FileReader();
                        reader.onload = () =>
                          resolve(
                            (reader.result as string).split(",")[1] || ""
                          );
                        reader.readAsDataURL(paymentProof);
                      });

                      await submitPaymentProofMutation.mutateAsync({
                        clientName: clientName || userInputName || "Cliente",
                        service:
                          finalService || selectedService || "Não especificado",
                        nameOption: savedNameOption || undefined,
                        phone: clientPhone,
                        city: clientCity,
                        paymentProof: proofBase64,
                        // Enviar TODOS os documentos base64 junto com o comprovante PIX
                        profilePhoto: savedDocsBase64.profilePhoto || undefined,
                        carDocument: savedDocsBase64.carDocument || undefined,
                        alvara: savedDocsBase64.alvara || undefined,
                        condutaxi: savedDocsBase64.condutaxi || undefined,
                        docYear: docYear || undefined,
                        referrerName: referrerName || undefined,
                        referrerPhone: referrerPhone || undefined,
                        uploadedDocUrls:
                          savedDocUrls.length > 0 ? savedDocUrls : undefined,
                        customAnswers: getSelectedModelQuestions().length > 0
                          ? getSelectedModelQuestions().map((q: any) => ({
                              question: q.question,
                              answer: customAnswers[q.id] || "",
                            })).filter((a: any) => a.answer.trim())
                          : undefined,
                      });
                    } catch (err) {
                      console.error("Erro ao enviar comprovante:", err);
                      toast.error(
                        "Erro ao enviar comprovante. Tente novamente."
                      );
                      setSendingProof(false);
                      return;
                    }
                    setSendingProof(false);
                  }

                  // Abrir WhatsApp
                  const couponInfo =
                    couponValid && couponDiscount
                      ? `\nCupom: ${couponCode} (${couponDiscount.type === "percentage" ? couponDiscount.value + "%" : "R$ " + (couponDiscount.value / 100).toFixed(2).replace(".", ",")} de desconto)`
                      : "";

                  // Obter o label do modelo selecionado
                  const allModels = Object.values(modelsByCard).flat();
                  const selectedModel = allModels.find(
                    m => m.id === selectedModelId
                  );
                  const modelLabel =
                    selectedModel?.optionLabel || "Não especificado";

                  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    `\uD83D\uDD14 NOVO PEDIDO - ${SITE_TITLE}\n\nQUEM INDICOU:\nNome: ${referrerName || "Não informado"}\nTelefone: ${referrerPhone || "Não informado"}\n\nCLIENTE:\nNome: ${clientName}\nTelefone: ${clientPhone}\nCidade: ${clientCity}\nServiço Solicitado: ${finalService || selectedService || "Não especificado"}\nTipo de Nome: ${modelLabel}\nNome na Conta: ${userInputName || "Não especificado"}${couponInfo}\nComprovante PIX: Enviado\n\nVerifique seu email para mais detalhes e arquivos.`
                  )}`;
                  window.open(whatsappUrl, "_blank");

                  // Reset e deslogar
                  resetAllStates();
                  sessionStorage.removeItem("walk_access_granted");
                  sessionStorage.removeItem("walk_access_code");
                  sessionStorage.removeItem("walk_access_type");

                  // Aumentar timeout para dar tempo ao cliente de ver o redirecionamento WhatsApp
                  // Mostrar mensagem de sucesso por 5 segundos antes de recarregar
                  setTimeout(() => {
                    window.location.reload();
                  }, 5000);
                }}
                className={`w-full px-4 py-3 font-bold text-lg rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  paymentProofPreview && !sendingProof
                    ? "bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 hover:from-green-600/80 hover:via-green-500/80 hover:to-emerald-600/80 text-white transform hover:scale-110 shadow-lg shadow-green-500/50 animate-pulse"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                {sendingProof
                  ? "ENVIANDO COMPROVANTE..."
                  : paymentProofPreview
                    ? "FINALIZAR PEDIDO"
                    : "ENVIE O COMPROVANTE PARA FINALIZAR"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botão WhatsApp Flutuante */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-secondary to-green-600 hover:from-secondary/80 hover:to-green-600/80 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300 animate-pulse"
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </div>
  );
}
