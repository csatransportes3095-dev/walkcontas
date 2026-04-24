import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Settings,
  CreditCard,
  FileText,
  Key,
  Tag,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Eye,
  EyeOff,
  ArrowLeft,
  Shield,
  Upload,
  ImageIcon,
  Loader2,
  Clock,
  Timer,
  RotateCcw,
  History,
  Bell,
  MessageCircle,
} from "lucide-react";

type Tab = "cards" | "info" | "pix" | "passwords" | "coupons" | "footer" | "orders";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("cards");
  const [adminPass, setAdminPass] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastSeenLogId, setLastSeenLogId] = useState<number>(() => {
    const saved = sessionStorage.getItem("lastSeenLogId");
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    const saved = sessionStorage.getItem("adminAuth");
    if (saved === "true") setIsAdmin(true);
  }, []);

  const handleAdminLogin = () => {
    if (adminPass === "Walk@@3095") {
      setIsAdmin(true);
      sessionStorage.setItem("adminAuth", "true");
      toast.success("Acesso admin liberado!");
    } else {
      toast.error("Senha incorreta");
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4">
          <div className="text-center mb-6">
            <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-white">Painel Admin</h1>
            <p className="text-white/50 text-sm mt-1">
              Digite a senha de administrador
            </p>
          </div>
          <div className="space-y-4">
            <Input
              type="password"
              value={adminPass}
              onChange={e => setAdminPass(e.target.value)}
              placeholder="Senha admin"
              className="text-center"
              onKeyDown={e => e.key === "Enter" && handleAdminLogin()}
            />
            <Button onClick={handleAdminLogin} className="w-full">
              Entrar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "cards" as Tab, label: "Cards & Serviços", icon: LayoutGrid },
    { id: "orders" as Tab, label: "Pedidos", icon: History },
    { id: "info" as Tab, label: "Configurações", icon: Settings },
    { id: "footer" as Tab, label: "Rodapé", icon: FileText },
    { id: "pix" as Tab, label: "PIX", icon: CreditCard },
    { id: "passwords" as Tab, label: "Senhas VIP", icon: Key },
    { id: "coupons" as Tab, label: "Cupons", icon: Tag },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-primary/30">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </a>
            <h1 className="text-lg font-bold text-white">Painel Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell
              isAdmin={isAdmin}
              showNotifications={showNotifications}
              setShowNotifications={setShowNotifications}
              lastSeenLogId={lastSeenLogId}
              setLastSeenLogId={setLastSeenLogId}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdmin(false);
                sessionStorage.removeItem("adminAuth");
              }}
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="border-b border-white/10 bg-black/50">
        <div className="container flex gap-1 py-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container py-6">
        {activeTab === "cards" && <CardsManager />}
        {activeTab === "orders" && <OrdersManager />}
        {activeTab === "info" && <SiteSettingsManager />}
        {activeTab === "footer" && <FooterManager />}
        {activeTab === "pix" && <PixManager />}
        {activeTab === "passwords" && <PasswordsManager />}
        {activeTab === "coupons" && <CouponsManager />}
      </div>
    </div>
  );
}

// ==================== IMAGE UPLOAD HELPER ====================
function ImageUploadField({
  currentUrl,
  onUrlChange,
  label,
}: {
  currentUrl: string;
  onUrlChange: (url: string) => void;
  label?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const uploadImage = trpc.admin.uploadImage.useMutation();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (max 5MB)");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadImage.mutateAsync({
          base64,
          filename: file.name,
        });
        if (result.url) {
          onUrlChange(result.url);
          toast.success("Imagem enviada!");
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Erro ao enviar imagem");
      setUploading(false);
    }
  };

  return (
    <div>
      <Label className="text-white/70 text-xs">{label || "Imagem"}</Label>
      <div className="flex gap-2 mt-1 items-center">
        {currentUrl && (
          <img
            src={currentUrl}
            alt="preview"
            className="w-10 h-10 rounded-lg object-cover border border-white/20"
          />
        )}
        <Input
          value={currentUrl}
          onChange={e => onUrlChange(e.target.value)}
          placeholder="URL da imagem ou faça upload"
          className="flex-1 text-sm"
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="gap-1"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

// ==================== CARDS MANAGER ====================
function CardsManager() {
  const utils = trpc.useUtils();
  const { data: cards, isLoading } = trpc.admin.cards.list.useQuery();
  const { data: allModels } = trpc.admin.models.listAll.useQuery();
  const { data: allDocs } = trpc.admin.docs.listAll.useQuery();
  const { data: allQuestions } = trpc.admin.questions.listAll.useQuery();

  const invalidateAll = () => {
    utils.admin.cards.list.invalidate();
    utils.admin.models.listAll.invalidate();
    utils.admin.docs.listAll.invalidate();
    utils.admin.questions.listAll.invalidate();
    utils.publicData.cards.invalidate();
    utils.publicData.models.invalidate();
    utils.publicData.docs.invalidate();
    utils.publicData.questions.invalidate();
  };

  const createCard = trpc.admin.cards.create.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Card criado!");
    },
    onError: () => toast.error("Erro ao criar card"),
  });
  const updateCard = trpc.admin.cards.update.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Card atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar card"),
  });
  const deleteCard = trpc.admin.cards.delete.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Card deletado!");
    },
    onError: () => toast.error("Erro ao deletar card"),
  });

  const createModel = trpc.admin.models.create.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Modelo criado!");
    },
    onError: () => toast.error("Erro ao criar modelo"),
  });
  const updateModel = trpc.admin.models.update.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Modelo atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar modelo"),
  });
  const deleteModel = trpc.admin.models.delete.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Modelo deletado!");
    },
    onError: () => toast.error("Erro ao deletar modelo"),
  });

  const createDoc = trpc.admin.docs.create.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Documento criado!");
    },
    onError: () => toast.error("Erro ao criar documento"),
  });
  const updateDoc = trpc.admin.docs.update.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Documento atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar documento"),
  });
  const deleteDoc = trpc.admin.docs.delete.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Documento deletado!");
    },
    onError: () => toast.error("Erro ao deletar documento"),
  });

  const createQuestion = trpc.admin.questions.create.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Pergunta criada!");
    },
    onError: () => toast.error("Erro ao criar pergunta"),
  });
  const updateQuestion = trpc.admin.questions.update.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Pergunta atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar pergunta"),
  });
  const deleteQuestion = trpc.admin.questions.delete.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("Pergunta deletada!");
    },
    onError: () => toast.error("Erro ao deletar pergunta"),
  });

  const [showNewCard, setShowNewCard] = useState(false);
  const [newCard, setNewCard] = useState({
    name: "",
    imageUrl: "",
    borderColor: "primary/30",
    buttonText: "SOLICITAR SUPORTE",
    guaranteeText: "Garantia de 7 dias",
  });
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [editingCard, setEditingCard] = useState<number | null>(null);
  const [editCardData, setEditCardData] = useState<any>({});
  const [showNewModel, setShowNewModel] = useState<number | null>(null);
  const [newModelData, setNewModelData] = useState({
    optionType: "random",
    optionLabel: "",
    price: 0,
    showNameForm: 1,
    showReferrerForm: 1,
    showClientForm: 1,
  });
  const [showNewDoc, setShowNewDoc] = useState<number | null>(null);
  const [newDocData, setNewDocData] = useState({
    docType: "custom",
    docLabel: "",
    required: 1,
  });
  const [showNewQuestion, setShowNewQuestion] = useState<number | null>(null); // modelId
  const [newQuestionData, setNewQuestionData] = useState({
    question: "",
    fieldType: "text" as "text" | "textarea" | "select",
    options: "",
    required: 1,
  });

  if (isLoading)
    return (
      <div className="text-white/60 text-center py-8">Carregando cards...</div>
    );

  const borderColorOptions = [
    { value: "primary/30", label: "Roxo" },
    { value: "secondary/30", label: "Rosa" },
    { value: "accent/30", label: "Destaque" },
    { value: "blue-500/30", label: "Azul" },
    { value: "green-500/30", label: "Verde" },
    { value: "yellow-500/30", label: "Amarelo" },
    { value: "red-500/30", label: "Vermelho" },
    { value: "white/20", label: "Branco" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Cards de Serviço</h2>
          <p className="text-white/50 text-sm mt-1">
            Gerencie os cards exibidos na página principal. Ative/desative,
            edite e reordene.
          </p>
        </div>
        <Button onClick={() => setShowNewCard(!showNewCard)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Card
        </Button>
      </div>

      {/* New Card Form */}
      {showNewCard && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Criar Novo Card</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-white/70">Nome do Serviço *</Label>
                <Input
                  value={newCard.name}
                  onChange={e =>
                    setNewCard({ ...newCard, name: e.target.value })
                  }
                  placeholder="Ex: Conta Uber"
                  className="mt-1"
                />
              </div>
              <ImageUploadField
                currentUrl={newCard.imageUrl}
                onUrlChange={url => setNewCard({ ...newCard, imageUrl: url })}
                label="Imagem do Card"
              />
              <div>
                <Label className="text-white/70">Texto do Botão</Label>
                <Input
                  value={newCard.buttonText}
                  onChange={e =>
                    setNewCard({ ...newCard, buttonText: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-white/70">Texto de Garantia</Label>
                <Input
                  value={newCard.guaranteeText}
                  onChange={e =>
                    setNewCard({ ...newCard, guaranteeText: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-white/70">Cor da Borda</Label>
                <select
                  value={newCard.borderColor}
                  onChange={e =>
                    setNewCard({ ...newCard, borderColor: e.target.value })
                  }
                  className="w-full mt-1 bg-black/50 border border-white/20 rounded-md px-3 py-2 text-white text-sm"
                >
                  {borderColorOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (!newCard.name.trim()) {
                    toast.error("Nome é obrigatório");
                    return;
                  }
                  createCard.mutate({
                    name: newCard.name,
                    imageUrl: newCard.imageUrl || undefined,
                    borderColor: newCard.borderColor,
                    buttonText: newCard.buttonText,
                    guaranteeText: newCard.guaranteeText,
                    sortOrder: (cards?.length || 0) + 1,
                  });
                  setNewCard({
                    name: "",
                    imageUrl: "",
                    borderColor: "primary/30",
                    buttonText: "SOLICITAR SUPORTE",
                    guaranteeText: "Garantia de 7 dias",
                  });
                  setShowNewCard(false);
                }}
                className="gap-2"
              >
                <Save className="w-4 h-4" /> Criar
              </Button>
              <Button variant="outline" onClick={() => setShowNewCard(false)}>
                <X className="w-4 h-4" /> Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards List */}
      <div className="space-y-3">
        {cards?.map((card: any) => {
          const cardModels =
            allModels?.filter((m: any) => m.cardId === card.id) || [];
          const cardDocs =
            allDocs?.filter((d: any) => d.cardId === card.id) || [];
          const isExpanded = expandedCard === card.id;
          const isEditing = editingCard === card.id;

          return (
            <div
              key={card.id}
              className={`border rounded-xl overflow-hidden transition-all ${card.active === 1 ? "border-primary/30 bg-white/5" : "border-white/10 bg-white/[0.02] opacity-60"}`}
            >
              {/* Card Header */}
              <div className="flex items-center gap-3 p-4">
                {card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-white/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <Input
                      value={editCardData.name || ""}
                      onChange={e =>
                        setEditCardData({
                          ...editCardData,
                          name: e.target.value,
                        })
                      }
                      className="text-sm"
                    />
                  ) : (
                    <h3 className="text-white font-semibold truncate">
                      {card.name}
                    </h3>
                  )}
                  <p className="text-white/50 text-xs">
                    {cardModels.length} modelos · {cardDocs.length} documentos ·{" "}
                    {card.guaranteeText || "Sem garantia"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateCard.mutate({
                        id: card.id,
                        active: card.active === 1 ? 0 : 1,
                      })
                    }
                    title={card.active === 1 ? "Desativar" : "Ativar"}
                  >
                    {card.active === 1 ? (
                      <Eye className="w-5 h-5 text-green-400" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-red-400" />
                    )}
                  </button>
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          updateCard.mutate({ id: card.id, ...editCardData });
                          setEditingCard(null);
                        }}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingCard(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCard(card.id);
                        setEditCardData({
                          name: card.name,
                          imageUrl: card.imageUrl || "",
                          buttonText: card.buttonText || "",
                          guaranteeText: card.guaranteeText || "",
                          borderColor: card.borderColor || "primary/30",
                          showNameForm: card.showNameForm ?? 1,
                        });
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                    onClick={() => {
                      if (
                        confirm(
                          `Deletar "${card.name}"? Isso removerá todos os modelos e documentos associados.`
                        )
                      )
                        deleteCard.mutate({ id: card.id });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <button
                    onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-white/60" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/60" />
                    )}
                  </button>
                </div>
              </div>

              {/* Edit Card Fields */}
              {isEditing && (
                <div className="px-4 pb-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ImageUploadField
                      currentUrl={editCardData.imageUrl || ""}
                      onUrlChange={url =>
                        setEditCardData({ ...editCardData, imageUrl: url })
                      }
                      label="Imagem do Card"
                    />
                    <div>
                      <Label className="text-white/70 text-xs">
                        Texto do Botão
                      </Label>
                      <Input
                        value={editCardData.buttonText || ""}
                        onChange={e =>
                          setEditCardData({
                            ...editCardData,
                            buttonText: e.target.value,
                          })
                        }
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70 text-xs">
                        Texto de Garantia
                      </Label>
                      <Input
                        value={editCardData.guaranteeText || ""}
                        onChange={e =>
                          setEditCardData({
                            ...editCardData,
                            guaranteeText: e.target.value,
                          })
                        }
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70 text-xs">
                        Cor da Borda
                      </Label>
                      <select
                        value={editCardData.borderColor || "primary/30"}
                        onChange={e =>
                          setEditCardData({
                            ...editCardData,
                            borderColor: e.target.value,
                          })
                        }
                        className="w-full mt-1 bg-black/50 border border-white/20 rounded-md px-3 py-2 text-white text-sm"
                      >
                        {borderColorOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-white/70 text-xs">
                        Ordem de Exibição
                      </Label>
                      <Input
                        type="number"
                        value={editCardData.sortOrder ?? card.sortOrder ?? 1}
                        onChange={e =>
                          setEditCardData({
                            ...editCardData,
                            sortOrder: parseInt(e.target.value) || 1,
                          })
                        }
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Expanded: Models + Docs + Toggles */}
              {isExpanded && (
                <div className="border-t border-white/10 p-4 space-y-4">
                  {/* TOGGLES DE FORMULÁRIOS */}
                  <div>
                    <h4 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
                      <Settings className="w-4 h-4 text-yellow-400" /> Controle de Formulários
                    </h4>
                    <div className="space-y-2">
                      {/* Toggle Formulário "Qual nome" */}
                      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                        <div>
                          <p className="text-white text-sm font-semibold">Formulário "Qual nome para a conta"</p>
                          <p className="text-white/50 text-xs">Quando ativado, pergunta ao cliente qual nome usar na conta</p>
                        </div>
                        <button
                          onClick={() =>
                            updateCard.mutate({
                              id: card.id,
                              showNameForm: card.showNameForm === 1 ? 0 : 1,
                            })
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            (card.showNameForm ?? 1) === 1
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {(card.showNameForm ?? 1) === 1 ? "ATIVADO" : "DESATIVADO"}
                        </button>
                      </div>

                      {/* Toggle Formulário "Quem indicou" */}
                      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                        <div>
                          <p className="text-white text-sm font-semibold">Formulário "Quem indicou você?"</p>
                          <p className="text-white/50 text-xs">Quando ativado, pergunta ao cliente quem indicou</p>
                        </div>
                        <button
                          onClick={() =>
                            updateCard.mutate({
                              id: card.id,
                              showReferrerForm: card.showReferrerForm === 1 ? 0 : 1,
                            })
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            (card.showReferrerForm ?? 1) === 1
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {(card.showReferrerForm ?? 1) === 1 ? "ATIVADO" : "DESATIVADO"}
                        </button>
                      </div>

                      {/* Toggle Formulário "Dados do cliente" */}
                      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                        <div>
                          <p className="text-white text-sm font-semibold">Formulário "Dados do cliente"</p>
                          <p className="text-white/50 text-xs">Quando ativado, pede nome, telefone e cidade do cliente</p>
                        </div>
                        <button
                          onClick={() =>
                            updateCard.mutate({
                              id: card.id,
                              showClientForm: card.showClientForm === 1 ? 0 : 1,
                            })
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            (card.showClientForm ?? 1) === 1
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {(card.showClientForm ?? 1) === 1 ? "ATIVADO" : "DESATIVADO"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* MODELS */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-primary" /> Modelos
                        / Opções de Nome
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setShowNewModel(
                            showNewModel === card.id ? null : card.id
                          )
                        }
                        className="gap-1 text-xs"
                      >
                        <Plus className="w-3 h-3" /> Modelo
                      </Button>
                    </div>

                    {showNewModel === card.id && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-2 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <Label className="text-white/70 text-xs">
                              Nome do Modelo *
                            </Label>
                            <Input
                              value={newModelData.optionLabel}
                              onChange={e =>
                                setNewModelData({
                                  ...newModelData,
                                  optionLabel: e.target.value,
                                })
                              }
                              placeholder="Ex: Aleatório, Primeiro Nome, Serviço Especial, etc"
                              className="mt-1 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-white/70 text-xs">
                              Preço (R$) *
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newModelData.price}
                              onChange={e =>
                                setNewModelData({
                                  ...newModelData,
                                  price: parseFloat(e.target.value) || 0,
                                })
                              }
                              placeholder="0.00"
                              className="mt-1 text-sm"
                            />
                          </div>
                        </div>
                        {/* Toggles de Formulários do Modelo */}
                        <div className="space-y-1.5 pt-1">
                          <p className="text-white/50 text-xs font-semibold">Formulários do cliente:</p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setNewModelData({ ...newModelData, showNameForm: newModelData.showNameForm === 1 ? 0 : 1 })}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                newModelData.showNameForm === 1
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              Qual nome: {newModelData.showNameForm === 1 ? "ON" : "OFF"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewModelData({ ...newModelData, showReferrerForm: newModelData.showReferrerForm === 1 ? 0 : 1 })}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                newModelData.showReferrerForm === 1
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              Quem indicou: {newModelData.showReferrerForm === 1 ? "ON" : "OFF"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewModelData({ ...newModelData, showClientForm: newModelData.showClientForm === 1 ? 0 : 1 })}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                newModelData.showClientForm === 1
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              Dados cliente: {newModelData.showClientForm === 1 ? "ON" : "OFF"}
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              if (!newModelData.optionLabel.trim()) {
                                toast.error("Nome do modelo é obrigatório");
                                return;
                              }
                              if (newModelData.price <= 0) {
                                toast.error("Preço deve ser maior que 0");
                                return;
                              }
                              createModel.mutate({
                                cardId: card.id,
                                optionType: "custom",
                                optionLabel: newModelData.optionLabel,
                                price: Math.round(newModelData.price * 100),
                                sortOrder: cardModels.length + 1,
                                showNameForm: newModelData.showNameForm,
                                showReferrerForm: newModelData.showReferrerForm,
                                showClientForm: newModelData.showClientForm,
                              });
                              setNewModelData({
                                optionType: "custom",
                                optionLabel: "",
                                price: 0,
                                showNameForm: 1,
                                showReferrerForm: 1,
                                showClientForm: 1,
                              });
                              setShowNewModel(null);
                            }}
                          >
                            Criar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowNewModel(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}

                    {cardModels.length === 0 ? (
                      <p className="text-white/40 text-xs italic">
                        Nenhum modelo cadastrado
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {cardModels.map((model: any) => {
                          const modelQuestions = (allQuestions || []).filter((q: any) => q.modelId === model.id);
                          return (
                            <div key={model.id} className="space-y-1">
                              <ModelRow
                                model={model}
                                onUpdate={(data: any) =>
                                  updateModel.mutate({ id: model.id, ...data })
                                }
                                onDelete={() =>
                                  deleteModel.mutate({ id: model.id })
                                }
                                onToggle={() =>
                                  updateModel.mutate({
                                    id: model.id,
                                    active: model.active === 1 ? 0 : 1,
                                  })
                                }
                              />
                              {/* Perguntas do Modelo */}
                              <div className="ml-6 pl-3 border-l-2 border-white/10">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-white/50 text-[10px] font-semibold flex items-center gap-1">
                                    <MessageCircle className="w-3 h-3" /> Perguntas ({modelQuestions.length})
                                  </span>
                                  <button
                                    onClick={() => setShowNewQuestion(showNewQuestion === model.id ? null : model.id)}
                                    className="text-[10px] text-primary hover:text-primary/80 font-semibold flex items-center gap-0.5"
                                  >
                                    <Plus className="w-3 h-3" /> Pergunta
                                  </button>
                                </div>
                                {showNewQuestion === model.id && (
                                  <div className="bg-white/5 border border-white/10 rounded-lg p-2 mb-1 space-y-1.5">
                                    <Input
                                      value={newQuestionData.question}
                                      onChange={e => setNewQuestionData({ ...newQuestionData, question: e.target.value })}
                                      placeholder="Digite a pergunta..."
                                      className="text-xs"
                                    />
                                    <div className="flex flex-wrap gap-2 items-center">
                                      <select
                                        value={newQuestionData.fieldType}
                                        onChange={e => setNewQuestionData({ ...newQuestionData, fieldType: e.target.value as any })}
                                        className="bg-black/50 border border-white/20 rounded px-2 py-1 text-white text-[10px]"
                                      >
                                        <option value="text">Texto curto</option>
                                        <option value="textarea">Texto longo</option>
                                        <option value="select">Seleção</option>
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => setNewQuestionData({ ...newQuestionData, required: newQuestionData.required === 1 ? 0 : 1 })}
                                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                          newQuestionData.required === 1
                                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                            : "bg-white/10 text-white/50 border border-white/20"
                                        }`}
                                      >
                                        {newQuestionData.required === 1 ? "Obrigatório" : "Opcional"}
                                      </button>
                                    </div>
                                    {newQuestionData.fieldType === "select" && (
                                      <Input
                                        value={newQuestionData.options}
                                        onChange={e => setNewQuestionData({ ...newQuestionData, options: e.target.value })}
                                        placeholder="Opções separadas por vírgula: Sim, Não, Talvez"
                                        className="text-xs"
                                      />
                                    )}
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          if (!newQuestionData.question.trim()) {
                                            toast.error("Digite a pergunta");
                                            return;
                                          }
                                          createQuestion.mutate({
                                            modelId: model.id,
                                            question: newQuestionData.question,
                                            fieldType: newQuestionData.fieldType,
                                            options: newQuestionData.fieldType === "select" ? JSON.stringify(newQuestionData.options.split(",").map((o: string) => o.trim()).filter(Boolean)) : undefined,
                                            required: newQuestionData.required,
                                            sortOrder: modelQuestions.length + 1,
                                          });
                                          setNewQuestionData({ question: "", fieldType: "text", options: "", required: 1 });
                                          setShowNewQuestion(null);
                                        }}
                                        className="text-[10px] h-6"
                                      >
                                        Criar
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => setShowNewQuestion(null)} className="text-[10px] h-6">
                                        Cancelar
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                {modelQuestions.length > 0 && (
                                  <div className="space-y-0.5">
                                    {modelQuestions.map((q: any) => (
                                      <QuestionRow
                                        key={q.id}
                                        question={q}
                                        onUpdate={(data: any) => updateQuestion.mutate({ id: q.id, ...data })}
                                        onDelete={() => deleteQuestion.mutate({ id: q.id })}
                                        onToggle={() => updateQuestion.mutate({ id: q.id, active: q.active === 1 ? 0 : 1 })}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* DOCUMENTS */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />{" "}
                        Documentos Obrigatórios
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setShowNewDoc(showNewDoc === card.id ? null : card.id)
                        }
                        className="gap-1 text-xs"
                      >
                        <Plus className="w-3 h-3" /> Documento
                      </Button>
                    </div>

                    {showNewDoc === card.id && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-2 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <Label className="text-white/70 text-xs">
                              Nome do Documento *
                            </Label>
                            <Input
                              value={newDocData.docLabel}
                              onChange={e =>
                                setNewDocData({
                                  ...newDocData,
                                  docLabel: e.target.value,
                                })
                              }
                              placeholder="Ex: Foto de Perfil, Documento do Carro, Alvará, etc"
                              className="mt-1 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-white/70 text-xs">
                              Obrigatório
                            </Label>
                            <select
                              value={newDocData.required}
                              onChange={e =>
                                setNewDocData({
                                  ...newDocData,
                                  required: parseInt(e.target.value),
                                })
                              }
                              className="w-full mt-1 bg-black/50 border border-white/20 rounded-md px-2 py-1.5 text-white text-sm"
                            >
                              <option value={1}>Sim</option>
                              <option value={0}>Não</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              if (!newDocData.docLabel.trim()) {
                                toast.error("Nome é obrigatório");
                                return;
                              }
                              createDoc.mutate({
                                cardId: card.id,
                                docType: newDocData.docType,
                                docLabel: newDocData.docLabel,
                                required: newDocData.required,
                                sortOrder: cardDocs.length + 1,
                              });
                              setNewDocData({
                                docType: "custom",
                                docLabel: "",
                                required: 1,
                              });
                              setShowNewDoc(null);
                            }}
                          >
                            Criar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowNewDoc(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}

                    {cardDocs.length === 0 ? (
                      <p className="text-white/40 text-xs italic">
                        Nenhum documento cadastrado
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {cardDocs.map((doc: any) => (
                          <DocRow
                            key={doc.id}
                            doc={doc}
                            onUpdate={(data: any) =>
                              updateDoc.mutate({ id: doc.id, ...data })
                            }
                            onDelete={() => deleteDoc.mutate({ id: doc.id })}
                            onToggle={() =>
                              updateDoc.mutate({
                                id: doc.id,
                                active: doc.active === 1 ? 0 : 1,
                              })
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {(!cards || cards.length === 0) && (
          <p className="text-white/40 text-center py-8">
            Nenhum card cadastrado. Clique em "Novo Card" para começar.
          </p>
        )}
      </div>
    </div>
  );
}

// ==================== MODEL ROW ====================
function ModelRow({
  model,
  onUpdate,
  onDelete,
  onToggle,
}: {
  model: any;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState({
    optionLabel: model.optionLabel,
    price: model.price / 100,
    optionType: model.optionType,
    showNameForm: model.showNameForm ?? 1,
    showReferrerForm: model.showReferrerForm ?? 1,
    showClientForm: model.showClientForm ?? 1,
  });
  const typeLabels: Record<string, string> = {
    random: "Aleatório",
    first: "1o Nome",
    full: "Completo",
  };

  if (editing) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex flex-wrap items-center gap-2">
        <select
          value={data.optionType}
          onChange={e => setData({ ...data, optionType: e.target.value })}
          className="bg-black/50 border border-white/20 rounded px-2 py-1 text-white text-xs w-24"
        >
          <option value="random">Aleatório</option>
          <option value="first">1o Nome</option>
          <option value="full">Completo</option>
        </select>
        <Input
          value={data.optionLabel}
          onChange={e => setData({ ...data, optionLabel: e.target.value })}
          className="text-xs flex-1 min-w-[120px]"
        />
        <div className="flex items-center gap-1">
          <span className="text-white/50 text-xs">R$</span>
          <Input
            type="number"
            step="0.01"
            value={data.price}
            onChange={e =>
              setData({ ...data, price: parseFloat(e.target.value) || 0 })
            }
            className="text-xs w-20"
          />
        </div>
        <Button
          size="sm"
          onClick={() => {
            onUpdate({
              optionType: data.optionType,
              optionLabel: data.optionLabel,
              price: Math.round(data.price * 100),
              showNameForm: data.showNameForm,
              showReferrerForm: data.showReferrerForm,
              showClientForm: data.showClientForm,
            });
            setEditing(false);
          }}
        >
          <Save className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
          <X className="w-3 h-3" />
        </Button>
        <div className="w-full flex flex-wrap gap-1.5 mt-1">
          <button
            type="button"
            onClick={() => setData({ ...data, showNameForm: data.showNameForm === 1 ? 0 : 1 })}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
              data.showNameForm === 1
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            Nome: {data.showNameForm === 1 ? "ON" : "OFF"}
          </button>
          <button
            type="button"
            onClick={() => setData({ ...data, showReferrerForm: data.showReferrerForm === 1 ? 0 : 1 })}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
              data.showReferrerForm === 1
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            Indicou: {data.showReferrerForm === 1 ? "ON" : "OFF"}
          </button>
          <button
            type="button"
            onClick={() => setData({ ...data, showClientForm: data.showClientForm === 1 ? 0 : 1 })}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
              data.showClientForm === 1
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            Dados: {data.showClientForm === 1 ? "ON" : "OFF"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg ${model.active === 1 ? "bg-white/5" : "bg-white/[0.02] opacity-50"}`}
    >
      <span className="text-xs text-primary/80 font-mono w-16">
        {typeLabels[model.optionType] || model.optionType}
      </span>
      <span className="text-white text-sm flex-1">{model.optionLabel}</span>
      <span className="text-green-400 font-bold text-sm">
        R$ {(model.price / 100).toFixed(2).replace(".", ",")}
      </span>
      <div className="flex gap-1">
        {(model.showNameForm ?? 1) === 1 && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-green-500/10 text-green-400/70 border border-green-500/20">Nome</span>}
        {(model.showReferrerForm ?? 1) === 1 && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-green-500/10 text-green-400/70 border border-green-500/20">Indicou</span>}
        {(model.showClientForm ?? 1) === 1 && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-green-500/10 text-green-400/70 border border-green-500/20">Dados</span>}
      </div>
      <button
        onClick={onToggle}
        title={model.active === 1 ? "Desativar" : "Ativar"}
      >
        {model.active === 1 ? (
          <Eye className="w-4 h-4 text-green-400" />
        ) : (
          <EyeOff className="w-4 h-4 text-red-400" />
        )}
      </button>
      <button onClick={() => setEditing(true)} title="Editar">
        <Edit2 className="w-4 h-4 text-white/60 hover:text-white" />
      </button>
      <button
        onClick={() => {
          if (confirm("Deletar este modelo?")) onDelete();
        }}
        title="Deletar"
      >
        <Trash2 className="w-4 h-4 text-red-400/60 hover:text-red-400" />
      </button>
    </div>
  );
}

// ==================== DOC ROW ====================
function DocRow({
  doc,
  onUpdate,
  onDelete,
  onToggle,
}: {
  doc: any;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState({
    docLabel: doc.docLabel,
    docType: doc.docType,
    required: doc.required,
  });
  const typeLabels: Record<string, string> = {
    profilePhoto: "Foto",
    carDocument: "Doc Carro",
    alvara: "Alvará",
    condutaxi: "Condutaxi",
    pdf: "PDF",
  };

  if (editing) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex flex-wrap items-center gap-2">
        <select
          value={data.docType}
          onChange={e => setData({ ...data, docType: e.target.value })}
          className="bg-black/50 border border-white/20 rounded px-2 py-1 text-white text-xs w-28"
        >
          <option value="profilePhoto">Foto Perfil</option>
          <option value="carDocument">Doc Carro</option>
          <option value="alvara">Alvará</option>
          <option value="condutaxi">Condutaxi</option>
          <option value="pdf">PDF</option>
        </select>
        <Input
          value={data.docLabel}
          onChange={e => setData({ ...data, docLabel: e.target.value })}
          className="text-xs flex-1 min-w-[120px]"
        />
        <select
          value={data.required}
          onChange={e =>
            setData({ ...data, required: parseInt(e.target.value) })
          }
          className="bg-black/50 border border-white/20 rounded px-2 py-1 text-white text-xs w-20"
        >
          <option value={1}>Obrig.</option>
          <option value={0}>Opcional</option>
        </select>
        <Button
          size="sm"
          onClick={() => {
            onUpdate(data);
            setEditing(false);
          }}
        >
          <Save className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg ${doc.active === 1 ? "bg-white/5" : "bg-white/[0.02] opacity-50"}`}
    >
      <span className="text-xs text-blue-400/80 font-mono w-20">
        {typeLabels[doc.docType] || doc.docType}
      </span>
      <span className="text-white text-sm flex-1">{doc.docLabel}</span>
      <span
        className={`text-xs px-2 py-0.5 rounded ${doc.required === 1 ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/50"}`}
      >
        {doc.required === 1 ? "Obrigatório" : "Opcional"}
      </span>
      <button
        onClick={onToggle}
        title={doc.active === 1 ? "Desativar" : "Ativar"}
      >
        {doc.active === 1 ? (
          <Eye className="w-4 h-4 text-green-400" />
        ) : (
          <EyeOff className="w-4 h-4 text-red-400" />
        )}
      </button>
      <button onClick={() => setEditing(true)} title="Editar">
        <Edit2 className="w-4 h-4 text-white/60 hover:text-white" />
      </button>
      <button
        onClick={() => {
          if (confirm("Deletar este documento?")) onDelete();
        }}
        title="Deletar"
      >
        <Trash2 className="w-4 h-4 text-red-400/60 hover:text-red-400" />
      </button>
    </div>
  );
}

// ==================== QUESTION ROW ====================
function QuestionRow({
  question,
  onUpdate,
  onDelete,
  onToggle,
}: {
  question: any;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState({
    question: question.question,
    fieldType: question.fieldType,
    options: question.options ? (() => { try { return JSON.parse(question.options).join(", "); } catch { return question.options; } })() : "",
    required: question.required,
  });
  const typeLabels: Record<string, string> = {
    text: "Texto",
    textarea: "Longo",
    select: "Seleção",
  };

  if (editing) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-2 space-y-1.5">
        <Input
          value={data.question}
          onChange={e => setData({ ...data, question: e.target.value })}
          placeholder="Texto da pergunta"
          className="text-xs"
        />
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={data.fieldType}
            onChange={e => setData({ ...data, fieldType: e.target.value })}
            className="bg-black/50 border border-white/20 rounded px-2 py-1 text-white text-[10px]"
          >
            <option value="text">Texto curto</option>
            <option value="textarea">Texto longo</option>
            <option value="select">Seleção</option>
          </select>
          <button
            type="button"
            onClick={() => setData({ ...data, required: data.required === 1 ? 0 : 1 })}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
              data.required === 1
                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                : "bg-white/10 text-white/50 border border-white/20"
            }`}
          >
            {data.required === 1 ? "Obrigatório" : "Opcional"}
          </button>
        </div>
        {data.fieldType === "select" && (
          <Input
            value={data.options}
            onChange={e => setData({ ...data, options: e.target.value })}
            placeholder="Opções separadas por vírgula: Sim, Não, Talvez"
            className="text-xs"
          />
        )}
        <div className="flex gap-1">
          <Button
            size="sm"
            onClick={() => {
              onUpdate({
                question: data.question,
                fieldType: data.fieldType,
                options: data.fieldType === "select" ? JSON.stringify(data.options.split(",").map((o: string) => o.trim()).filter(Boolean)) : null,
                required: data.required,
              });
              setEditing(false);
            }}
            className="text-[10px] h-6"
          >
            <Save className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="text-[10px] h-6">
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] ${
        question.active === 1 ? "bg-white/[0.03]" : "bg-white/[0.01] opacity-40"
      }`}
    >
      <span className="text-purple-400/80 font-mono text-[9px] w-12">
        {typeLabels[question.fieldType] || question.fieldType}
      </span>
      <span className="text-white/80 flex-1 truncate">{question.question}</span>
      {question.required === 1 && (
        <span className="text-[9px] px-1 py-0.5 rounded bg-yellow-500/10 text-yellow-400/70 border border-yellow-500/20">
          Obrig.
        </span>
      )}
      {question.fieldType === "select" && question.options && (
        <span className="text-[9px] text-white/30 truncate max-w-[100px]">
          {(() => { try { return JSON.parse(question.options).join(", "); } catch { return question.options; } })()}
        </span>
      )}
      <button onClick={onToggle} title={question.active === 1 ? "Desativar" : "Ativar"}>
        {question.active === 1 ? (
          <Eye className="w-3 h-3 text-green-400" />
        ) : (
          <EyeOff className="w-3 h-3 text-red-400" />
        )}
      </button>
      <button onClick={() => setEditing(true)} title="Editar">
        <Edit2 className="w-3 h-3 text-white/60 hover:text-white" />
      </button>
      <button
        onClick={() => {
          if (confirm("Deletar esta pergunta?")) onDelete();
        }}
        title="Deletar"
      >
        <Trash2 className="w-3 h-3 text-red-400/60 hover:text-red-400" />
      </button>
    </div>
  );
}

// ==================== SITE SETTINGS ====================
function SiteSettingsManager() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.admin.site.getAll.useQuery();
  const setSetting = trpc.admin.site.set.useMutation({
    onSuccess: () => {
      utils.admin.site.getAll.invalidate();
      utils.publicData.siteSettings.invalidate();
    },
    onError: () => toast.error("Erro ao salvar"),
  });
  const setAllSettings = trpc.admin.site.setAll.useMutation({
    onSuccess: () => {
      utils.admin.site.getAll.invalidate();
      utils.publicData.siteSettings.invalidate();
      toast.success("Todas as configurações salvas com sucesso!");
      setSavedValues({ ...localValues });
    },
    onError: () => toast.error("Erro ao salvar configurações"),
  });

  // Defaults que aparecem no site quando o campo está vazio
  const defaults: Record<string, string> = {
    site_title: "WALK CONTAS",
    site_subtitle: "Atendimento Rápido no WhatsApp",
    hero_title:
      'Atendimento <span class="text-primary">Rápido</span> no WhatsApp',
    hero_subtitle:
      "Suporte direto para motoristas de Uber, 99 e InDrive. Respostas em minutos, não em horas.",
    hero_video_url: "",
    whatsapp_number: "5511978307371",
    whatsapp_display: "(11) 97830-7371",
    footer_hours: "24H",
    promo_active: "false",
    promo_text: "",
    vip_timeout_minutes: "30",
    feature1_title: "Atendimento 24h",
    feature1_desc: "Sempre disponível quando você precisa",
    feature2_title: "Resposta Imediata",
    feature2_desc: "Suporte ágil via WhatsApp",
    feature3_title: "Múltiplas Plataformas",
    feature3_desc: "Suporte para Uber, 99 e InDrive",
    section_order_title: "FAÇA SEU PEDIDO",
    section_order_subtitle: "Soluções completas para motoristas de aplicativos",
    footer_description:
      "Atendimento rápido e eficiente para motoristas de aplicativos.",
    footer_services_title: "Serviços",
    footer_services_content:
      "Uber\nUBER TAXI\n99\nInDrive\nEDIÇÃO DOC CARRO\nRECUPERAÇÃO DE FOTO",
    footer_contact_title: "Contato",
    footer_copyright: "2026 WALK CONTAS. Todos os direitos reservados.",
  };

  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [savedValues, setSavedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      const s = settings as Record<string, string>;
      // Merge: use DB value if exists, otherwise use default
      const merged: Record<string, string> = {};
      for (const key of Object.keys(defaults)) {
        merged[key] = s[key] || defaults[key];
      }
      // Also include any DB keys not in defaults
      for (const key of Object.keys(s)) {
        if (!(key in merged)) merged[key] = s[key];
      }
      setLocalValues(merged);
      setSavedValues(merged);
    }
  }, [settings]);

  const isFieldModified = (key: string) =>
    localValues[key] !== savedValues[key];
  const hasAnyModified = Object.keys(localValues).some(k => isFieldModified(k));

  const handleSaveAll = () => {
    const settingsToSave = Object.entries(localValues).map(([key, value]) => ({
      key,
      value,
    }));
    setAllSettings.mutate({ settings: settingsToSave });
  };

  const handleSaveOne = (key: string) => {
    setSetting.mutate(
      { key, value: localValues[key] || "" },
      {
        onSuccess: () => {
          utils.admin.site.getAll.invalidate();
          utils.publicData.siteSettings.invalidate();
          setSavedValues(prev => ({ ...prev, [key]: localValues[key] }));
          toast.success(`"${key}" salvo!`);
        },
      }
    );
  };

  if (isLoading)
    return <div className="text-white/60 text-center py-8">Carregando...</div>;

  const sections = [
    {
      title: "Cabeçalho & Hero",
      desc: "Textos do topo do site e seção principal",
      fields: [
        {
          key: "site_title",
          label: "Título do Site",
          type: "text",
          desc: "Nome exibido no topo do site",
        },
        {
          key: "site_subtitle",
          label: "Subtítulo",
          type: "text",
          desc: "Texto abaixo do título no cabeçalho",
        },
        {
          key: "hero_title",
          label: "Título do Hero (HTML)",
          type: "textarea",
          desc: "Aceita HTML. Ex: Atendimento <span class='text-primary'>Rápido</span>",
        },
        {
          key: "hero_subtitle",
          label: "Subtítulo do Hero",
          type: "textarea",
          desc: "Texto descritivo na seção principal",
        },
        {
          key: "hero_video_url",
          label: "URL do Vídeo Hero",
          type: "text",
          desc: "URL do vídeo de fundo na seção principal",
        },
      ],
    },
    {
      title: "Features (Destaques)",
      desc: "Os 3 destaques abaixo do hero: Atendimento 24h, Resposta Imediata, Múltiplas Plataformas",
      fields: [
        {
          key: "feature1_title",
          label: "Feature 1 - Título",
          type: "text",
          desc: "Ex: Atendimento 24h",
        },
        {
          key: "feature1_desc",
          label: "Feature 1 - Descrição",
          type: "text",
          desc: "Ex: Sempre disponível quando você precisa",
        },
        {
          key: "feature2_title",
          label: "Feature 2 - Título",
          type: "text",
          desc: "Ex: Resposta Imediata",
        },
        {
          key: "feature2_desc",
          label: "Feature 2 - Descrição",
          type: "text",
          desc: "Ex: Suporte ágil via WhatsApp",
        },
        {
          key: "feature3_title",
          label: "Feature 3 - Título",
          type: "text",
          desc: "Ex: Múltiplas Plataformas",
        },
        {
          key: "feature3_desc",
          label: "Feature 3 - Descrição",
          type: "text",
          desc: "Ex: Suporte para Uber, 99 e InDrive",
        },
      ],
    },
    {
      title: "Seção Pedidos",
      desc: "Título e subtítulo da seção 'Faça Seu Pedido'",
      fields: [
        {
          key: "section_order_title",
          label: "Título Seção Pedidos",
          type: "text",
          desc: "Ex: FAÇA SEU PEDIDO",
        },
        {
          key: "section_order_subtitle",
          label: "Subtítulo Seção Pedidos",
          type: "text",
          desc: "Ex: Soluções completas para motoristas de aplicativos",
        },
      ],
    },
    {
      title: "WhatsApp & Promoção",
      desc: "Configurações de contato e promoção",
      fields: [
        {
          key: "whatsapp_number",
          label: "Número WhatsApp (com DDI)",
          type: "text",
          desc: "Ex: 5511978307371",
        },
        {
          key: "whatsapp_display",
          label: "WhatsApp Display",
          type: "text",
          desc: "Ex: (11) 97830-7371",
        },
        {
          key: "footer_hours",
          label: "Horário Atendimento",
          type: "text",
          desc: "Ex: 24H",
        },
        {
          key: "promo_active",
          label: "Promoção Ativa",
          type: "toggle",
          desc: "Ativar/desativar banner de promoção",
        },
        {
          key: "promo_text",
          label: "Texto da Promoção",
          type: "text",
          desc: "Texto do banner de promoção",
        },
        {
          key: "vip_timeout_minutes",
          label: "Tempo Expiração Senha VIP (min)",
          type: "text",
          desc: "Minutos até a senha VIP expirar",
        },
      ],
    },
    {
      title: "Rodapé",
      desc: "Textos exibidos no rodapé do site",
      fields: [
        {
          key: "footer_description",
          label: "Descrição",
          type: "textarea",
          desc: "Texto da coluna Walk Contas App no rodapé",
        },
        {
          key: "footer_services_title",
          label: "Título Coluna Serviços",
          type: "text",
          desc: "Ex: Serviços",
        },
        {
          key: "footer_services_content",
          label: "Conteúdo Coluna Serviços",
          type: "textarea",
          desc: "Liste os serviços (um por linha)",
        },
        {
          key: "footer_contact_title",
          label: "Título Coluna Contato",
          type: "text",
          desc: "Ex: Contato",
        },
        {
          key: "footer_copyright",
          label: "Copyright",
          type: "text",
          desc: "Ex: 2026 WALK CONTAS. Todos os direitos reservados.",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            Configurações do Site
          </h2>
          <p className="text-white/50 text-sm mt-1">
            Configure textos, vídeos, WhatsApp e promoções exibidos na página
            principal.
          </p>
        </div>
        <Button
          onClick={handleSaveAll}
          disabled={setAllSettings.isPending}
          className={`gap-2 px-6 py-3 text-base font-bold ${hasAnyModified ? "bg-green-600 hover:bg-green-700 animate-pulse" : "bg-primary hover:bg-primary/80"}`}
        >
          <Save className="w-5 h-5" />
          {setAllSettings.isPending ? "Salvando..." : "SALVAR TUDO"}
        </Button>
      </div>

      {hasAnyModified && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-yellow-400 text-sm flex items-center gap-2">
          <span className="text-lg">⚠</span>
          Você tem alterações não salvas. Clique em <strong>
            SALVAR TUDO
          </strong>{" "}
          para aplicar as mudanças no site.
        </div>
      )}

      {sections.map(section => (
        <div key={section.title} className="space-y-3">
          <div className="border-b border-white/10 pb-2">
            <h3 className="text-lg font-bold text-primary">{section.title}</h3>
            <p className="text-white/40 text-xs">{section.desc}</p>
          </div>
          {section.fields.map(field => {
            const modified = isFieldModified(field.key);
            return (
              <div
                key={field.key}
                className={`bg-white/5 rounded-xl p-4 transition-all ${modified ? "border-2 border-yellow-500/60 shadow-[0_0_10px_rgba(234,179,8,0.15)]" : "border border-white/10"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-white/70 text-sm">
                    {field.label}
                    {modified && (
                      <span className="ml-2 text-yellow-400 text-xs">
                        (modificado)
                      </span>
                    )}
                  </Label>
                  {field.desc && (
                    <span className="text-white/30 text-xs">{field.desc}</span>
                  )}
                </div>
                <div className="flex gap-2 mt-1">
                  {field.type === "textarea" ? (
                    <Textarea
                      value={localValues[field.key] || ""}
                      onChange={e =>
                        setLocalValues({
                          ...localValues,
                          [field.key]: e.target.value,
                        })
                      }
                      className="flex-1"
                      rows={2}
                    />
                  ) : field.type === "toggle" ? (
                    <div className="flex-1 flex items-center gap-3">
                      <button
                        onClick={() => {
                          const newVal =
                            localValues[field.key] === "true"
                              ? "false"
                              : "true";
                          setLocalValues({
                            ...localValues,
                            [field.key]: newVal,
                          });
                        }}
                        className={`relative w-12 h-6 rounded-full transition-colors ${localValues[field.key] === "true" ? "bg-green-500" : "bg-white/20"}`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${localValues[field.key] === "true" ? "translate-x-6" : ""}`}
                        />
                      </button>
                      <span className="text-white/60 text-sm">
                        {localValues[field.key] === "true"
                          ? "Ativo"
                          : "Inativo"}
                      </span>
                    </div>
                  ) : (
                    <Input
                      value={localValues[field.key] || ""}
                      onChange={e =>
                        setLocalValues({
                          ...localValues,
                          [field.key]: e.target.value,
                        })
                      }
                      className="flex-1"
                    />
                  )}
                  <Button
                    onClick={() => handleSaveOne(field.key)}
                    variant={modified ? "default" : "outline"}
                    className={`gap-1 ${modified ? "bg-yellow-600 hover:bg-yellow-700" : ""}`}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
                {/* Preview for hero video/image */}
                {field.key === "hero_video_url" && localValues[field.key] && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-white/10 max-h-48">
                    {localValues[field.key].match(/\.(mp4|webm|ogg)$/i) ? (
                      <video
                        src={localValues[field.key]}
                        className="w-full max-h-48 object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img
                        src={localValues[field.key]}
                        alt="Hero preview"
                        className="w-full max-h-48 object-cover"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Botão Salvar Tudo no final também */}
      <div className="pt-4 border-t border-white/10">
        <Button
          onClick={handleSaveAll}
          disabled={setAllSettings.isPending}
          className={`w-full gap-2 py-4 text-lg font-bold ${hasAnyModified ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/80"}`}
        >
          <Save className="w-5 h-5" />
          {setAllSettings.isPending
            ? "Salvando..."
            : "SALVAR TODAS AS CONFIGURAÇÕES"}
        </Button>
      </div>
    </div>
  );
}

// ==================== FOOTER ====================
function FooterManager() {
  const { data: cards, isLoading } = trpc.publicData.cards.useQuery();
  const [footerServices, setFooterServices] = useState<
    Array<{ cardId: number; cardName: string; visible: boolean }>
  >([]);

  useEffect(() => {
    if (cards) {
      const services = cards.map((card: any) => ({
        cardId: card.id,
        cardName: card.name,
        visible: true,
      }));
      setFooterServices(services);
    }
  }, [cards]);

  const handleToggleService = (cardId: number) => {
    setFooterServices(prev =>
      prev.map(s => (s.cardId === cardId ? { ...s, visible: !s.visible } : s))
    );
  };

  const handleReorderUp = (index: number) => {
    if (index > 0) {
      const newServices = [...footerServices];
      [newServices[index], newServices[index - 1]] = [
        newServices[index - 1],
        newServices[index],
      ];
      setFooterServices(newServices);
    }
  };

  const handleReorderDown = (index: number) => {
    if (index < footerServices.length - 1) {
      const newServices = [...footerServices];
      [newServices[index], newServices[index + 1]] = [
        newServices[index + 1],
        newServices[index],
      ];
      setFooterServices(newServices);
    }
  };

  if (isLoading)
    return (
      <div className="text-white/60 text-center py-8">
        Carregando servicos...
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">
          Gerenciar Servicos do Rodape
        </h2>
        <p className="text-white/50 text-sm mt-1">
          Ative/desative e reordene os servicos exibidos na coluna Servicos do
          rodape.
        </p>
      </div>

      <div className="space-y-3">
        {footerServices.map((service, index) => (
          <div
            key={service.cardId}
            className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => handleToggleService(service.cardId)}
                className={`relative w-12 h-6 rounded-full transition-colors ${service.visible ? "bg-green-500" : "bg-white/20"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${service.visible ? "translate-x-6" : ""}`}
                />
              </button>
              <span className="text-white font-medium">{service.cardName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleReorderUp(index)}
                disabled={index === 0}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleReorderDown(index)}
                disabled={index === footerServices.length - 1}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-blue-400 text-sm">
        <p>
          Dica: Os servicos marcados como Ativo aparecerao no rodape do site.
          Use os botoes de seta para reordenar a exibicao.
        </p>
      </div>
    </div>
  );
}

// ==================== PIX ====================
function PixManager() {
  const utils = trpc.useUtils();
  const { data: pixData, isLoading } = trpc.admin.pix.getAll.useQuery();
  const setPixSetting = trpc.admin.pix.set.useMutation({
    onSuccess: () => {
      utils.admin.pix.getAll.invalidate();
      utils.publicData.pixSettings.invalidate();
      toast.success("PIX atualizado!");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (pixData) {
      setValues(pixData as Record<string, string>);
    }
  }, [pixData]);

  if (isLoading)
    return <div className="text-white/60 text-center py-8">Carregando...</div>;

  const fields = [
    {
      key: "pix_key",
      label: "Chave PIX",
      desc: "Chave que o cliente vai copiar para pagar",
    },
    {
      key: "pix_holder",
      label: "Titular",
      desc: "Nome do titular da conta PIX",
    },
    { key: "pix_bank", label: "Banco", desc: "Nome do banco da conta PIX" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Configurações PIX</h2>
        <p className="text-white/50 text-sm mt-1">
          Configure os dados de pagamento PIX exibidos para os clientes.
        </p>
      </div>
      {fields.map(field => (
        <div
          key={field.key}
          className="bg-white/5 border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-1">
            <Label className="text-white/70 text-sm">{field.label}</Label>
            <span className="text-white/30 text-xs">{field.desc}</span>
          </div>
          <div className="flex gap-2 mt-1">
            <Input
              value={values[field.key] || ""}
              onChange={e =>
                setValues({ ...values, [field.key]: e.target.value })
              }
              className="flex-1"
            />
            <Button
              onClick={() =>
                setPixSetting.mutate({
                  key: field.key,
                  value: values[field.key] || "",
                })
              }
              className="gap-1"
            >
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== PASSWORDS ====================
function PasswordsManager() {
  const utils = trpc.useUtils();
  const { data: codes, isLoading } = trpc.access.list.useQuery();
  const { data: siteSettings } = trpc.publicData.siteSettings.useQuery();
  const createCode = trpc.access.create.useMutation({
    onSuccess: () => {
      utils.access.list.invalidate();
      toast.success("Senha criada!");
    },
    onError: () => toast.error("Erro ao criar"),
  });
  const deleteCode = trpc.access.delete.useMutation({
    onSuccess: () => {
      utils.access.list.invalidate();
      toast.success("Senha deletada!");
    },
    onError: () => toast.error("Erro ao deletar"),
  });
  const renewCode = trpc.access.renew.useMutation({
    onSuccess: () => {
      utils.access.list.invalidate();
      toast.success("Senha renovada! Timer e usos resetados.");
    },
    onError: () => toast.error("Erro ao renovar"),
  });

  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newTime, setNewTime] = useState(30);
  const [newMaxUses, setNewMaxUses] = useState(1);
  const [, setTick] = useState(0);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  // Atualizar a cada segundo para mostrar o tempo restante
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const getTimeInfo = (code: any) => {
    if (!code.createdAt) return null;
    const codeTimeout = code.expiresInMinutes || 30;
    const created = new Date(code.createdAt).getTime();
    const now = Date.now();
    const expiresAt = created + codeTimeout * 60 * 1000;
    const remaining = expiresAt - now;
    const totalMs = codeTimeout * 60 * 1000;
    const percentage = Math.max(0, Math.min(100, (remaining / totalMs) * 100));
    const expired = remaining <= 0;
    const minutes = Math.floor(Math.max(0, remaining) / 60000);
    const seconds = Math.floor((Math.max(0, remaining) % 60000) / 1000);
    return {
      expired,
      remaining,
      percentage,
      minutes,
      seconds,
      totalMs,
      codeTimeout,
    };
  };

  const getBarColor = (percentage: number) => {
    if (percentage > 60) return "bg-green-500";
    if (percentage > 30) return "bg-yellow-500";
    if (percentage > 10) return "bg-orange-500";
    return "bg-red-500";
  };

  if (isLoading)
    return <div className="text-white/60 text-center py-8">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Senhas VIP</h2>
        <p className="text-white/50 text-sm mt-1">
          Crie senhas de acesso individuais. Defina tempo e quantidade de
          acessos para cada senha.
        </p>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-sm">Nova Senha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <Label className="text-white/70 text-xs">Senha *</Label>
              <Input
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                placeholder="Ex: VIP123"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-white/70 text-xs">Nome do Cliente</Label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ex: João"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-white/70 text-xs">Tempo (min) *</Label>
              <Input
                type="number"
                value={newTime}
                onChange={e =>
                  setNewTime(Math.max(1, parseInt(e.target.value) || 1))
                }
                placeholder="30"
                min={1}
                max={1440}
                className="mt-1"
              />
              <p className="text-white/30 text-[10px] mt-0.5">1 a 1440 min</p>
            </div>
            <div>
              <Label className="text-white/70 text-xs">Qtd. Acessos *</Label>
              <Input
                type="number"
                value={newMaxUses}
                onChange={e =>
                  setNewMaxUses(Math.max(1, parseInt(e.target.value) || 1))
                }
                placeholder="1"
                min={1}
                max={9999}
                className="mt-1"
              />
              <p className="text-white/30 text-[10px] mt-0.5">
                Quantos clientes
              </p>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  if (!newCode.trim()) {
                    toast.error("Senha obrigatória");
                    return;
                  }
                  if (newTime < 1 || newTime > 1440) {
                    toast.error("Tempo deve ser entre 1 e 1440 minutos");
                    return;
                  }
                  if (newMaxUses < 1) {
                    toast.error("Quantidade mínima: 1");
                    return;
                  }
                  createCode.mutate({
                    code: newCode,
                    clientName: newName || undefined,
                    expiresInMinutes: newTime,
                    maxUses: newMaxUses,
                  });
                  setNewCode("");
                  setNewName("");
                  setNewTime(30);
                  setNewMaxUses(1);
                }}
                className="gap-2 w-full"
              >
                <Plus className="w-4 h-4" /> Criar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {codes?.map((code: any) => {
          const isUsed = (code.currentUses || 0) >= (code.maxUses || 1);
          const timeInfo =
            !isUsed && code.status === "active" ? getTimeInfo(code) : null;
          return (
            <div
              key={code.id}
              className={`px-4 py-3 rounded-xl border ${code.status === "active" && !isUsed ? "border-green-500/20 bg-white/5" : "border-white/10 bg-white/[0.02] opacity-60"}`}
            >
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-primary" />
                <span className="text-white font-mono font-bold">
                  {code.code}
                </span>
                <span className="text-white/50 text-sm">
                  {code.clientName || "Sem nome"}
                </span>
                <span className="text-white/30 text-[10px] bg-white/5 px-1.5 py-0.5 rounded">
                  {code.expiresInMinutes || 30} min
                </span>
                <span className="text-white/30 text-[10px] bg-white/5 px-1.5 py-0.5 rounded">
                  {code.currentUses || 0}/{code.maxUses || 1} usos
                </span>
                <span className="flex-1" />
                {timeInfo && !timeInfo.expired && (
                  <span className="flex items-center gap-1 text-xs">
                    <Clock className="w-3 h-3 text-white/50" />
                    <span
                      className={`font-mono font-bold ${
                        timeInfo.percentage > 30
                          ? "text-green-400"
                          : timeInfo.percentage > 10
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {String(timeInfo.minutes).padStart(2, "0")}:
                      {String(timeInfo.seconds).padStart(2, "0")}
                    </span>
                  </span>
                )}
                {timeInfo && timeInfo.expired && (
                  <span className="text-xs text-red-400 font-bold">
                    Expirada
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    isUsed
                      ? "bg-yellow-500/20 text-yellow-400"
                      : code.status === "disabled"
                        ? "bg-red-500/20 text-red-400"
                        : timeInfo?.expired
                          ? "bg-red-500/20 text-red-400"
                          : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {isUsed
                    ? "Usada"
                    : code.status === "disabled"
                      ? "Desativada"
                      : timeInfo?.expired
                        ? "Expirada"
                        : "Disponível"}
                </span>
                <button
                  onClick={() =>
                    setExpandedLogId(expandedLogId === code.id ? null : code.id)
                  }
                  title="Histórico de uso"
                >
                  <History className="w-4 h-4 text-purple-400/60 hover:text-purple-400" />
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        "Renovar esta senha? Usos e timer serão resetados."
                      )
                    )
                      renewCode.mutate({ id: code.id });
                  }}
                  title="Renovar senha"
                >
                  <RotateCcw className="w-4 h-4 text-blue-400/60 hover:text-blue-400" />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Deletar esta senha?"))
                      deleteCode.mutate({ id: code.id });
                  }}
                  title="Deletar senha"
                >
                  <Trash2 className="w-4 h-4 text-red-400/60 hover:text-red-400" />
                </button>
              </div>
              {/* Barra de tempo restante */}
              {timeInfo && !isUsed && code.status === "active" && (
                <div className="mt-2 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${getBarColor(timeInfo.percentage)}`}
                    style={{ width: `${timeInfo.percentage}%` }}
                  />
                </div>
              )}
              {/* Histórico de uso expandível */}
              {expandedLogId === code.id && (
                <AccessCodeLogPanel accessCodeId={code.id} />
              )}
            </div>
          );
        })}
        {(!codes || codes.length === 0) && (
          <p className="text-white/40 text-center py-4">
            Nenhuma senha cadastrada
          </p>
        )}
      </div>
    </div>
  );
}

// ==================== NOTIFICATION BELL ====================
function NotificationBell({
  isAdmin,
  showNotifications,
  setShowNotifications,
  lastSeenLogId,
  setLastSeenLogId,
}: {
  isAdmin: boolean;
  showNotifications: boolean;
  setShowNotifications: (v: boolean) => void;
  lastSeenLogId: number;
  setLastSeenLogId: (v: number) => void;
}) {
  const { data: recentLogs } = trpc.access.recentLogs.useQuery(
    { limit: 20 },
    { enabled: isAdmin, refetchInterval: 5000 } // Polling a cada 5 segundos
  );

  // Polling de novos pedidos
  const { data: recentOrdersData } = trpc.admin.orders.recentCount.useQuery(
    { sinceMinutes: 1 },
    { enabled: isAdmin, refetchInterval: 5000 }
  );
  const [lastOrderCount, setLastOrderCount] = useState<number | null>(null);

  const newLogs =
    recentLogs?.filter(
      (log: any) => log.id > lastSeenLogId && log.action === "login"
    ) || [];
  const unreadCount = newLogs.length + (recentOrdersData?.count && lastOrderCount !== null && recentOrdersData.count > lastOrderCount ? recentOrdersData.count - lastOrderCount : 0);

  // Tocar som e mostrar toast quando novo pedido detectado
  useEffect(() => {
    if (recentOrdersData?.count !== undefined) {
      if (lastOrderCount === null) {
        setLastOrderCount(recentOrdersData.count);
      } else if (recentOrdersData.count > lastOrderCount) {
        const newOrders = recentOrdersData.count - lastOrderCount;
        // Tocar som de notificação
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
          oscillator.type = "sine";
          gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.5);
          // Segundo beep
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.2);
          osc2.type = "sine";
          gain2.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.2);
          gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.7);
          osc2.start(audioCtx.currentTime + 0.2);
          osc2.stop(audioCtx.currentTime + 0.7);
        } catch (e) {
          console.log("[Audio] Erro ao tocar som:", e);
        }

        toast.success(
          `🔔 ${newOrders} novo(s) pedido(s)!`,
          {
            duration: 10000,
            icon: <Bell className="w-4 h-4 text-green-400" />,
            style: {
              background: "linear-gradient(135deg, #059669, #047857)",
              color: "white",
              border: "1px solid #10b981",
              fontWeight: "bold",
            },
          }
        );

        // Browser Notification API
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("WALK CONTAS - Novo Pedido!", {
            body: `${newOrders} novo(s) pedido(s) recebido(s)`,
            icon: "/favicon.ico",
          });
        }

        setLastOrderCount(recentOrdersData.count);
      }
    }
  }, [recentOrdersData?.count]);

  // Solicitar permissão de notificação do navegador
  useEffect(() => {
    if (isAdmin && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [isAdmin]);

  // Tocar som e mostrar toast quando novo login detectado
  useEffect(() => {
    if (newLogs.length > 0 && lastSeenLogId > 0) {
      // Mostrar toast para cada novo login
      newLogs.forEach((log: any) => {
        let details: any = {};
        try {
          details = log.details ? JSON.parse(log.details) : {};
        } catch {}
        toast.info(
          `Novo acesso VIP: ${log.accessCode}${details.clientName ? ` (${details.clientName})` : ""}`,
          {
            duration: 8000,
            icon: <Bell className="w-4 h-4 text-primary" />,
          }
        );
      });
    }
  }, [recentLogs?.length]);

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && recentLogs && recentLogs.length > 0) {
      const maxId = Math.max(...recentLogs.map((l: any) => l.id));
      setLastSeenLogId(maxId);
      sessionStorage.setItem("lastSeenLogId", String(maxId));
    }
  };

  // Inicializar lastSeenLogId na primeira carga
  useEffect(() => {
    if (lastSeenLogId === 0 && recentLogs && recentLogs.length > 0) {
      const maxId = Math.max(...recentLogs.map((l: any) => l.id));
      setLastSeenLogId(maxId);
      sessionStorage.setItem("lastSeenLogId", String(maxId));
    }
  }, [recentLogs]);

  if (!isAdmin) return null;

  return (
    <div className="relative">
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <Bell
          className={`w-5 h-5 ${unreadCount > 0 ? "text-primary animate-pulse" : "text-white/60"}`}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-black/95 border border-white/10 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-white font-bold text-sm">Notificações</span>
            <button
              onClick={() => setShowNotifications(false)}
              className="text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {recentLogs && recentLogs.length > 0 ? (
            <div className="divide-y divide-white/5">
              {recentLogs
                .filter((l: any) => l.action === "login")
                .slice(0, 15)
                .map((log: any) => {
                  let details: any = {};
                  try {
                    details = log.details ? JSON.parse(log.details) : {};
                  } catch {}
                  const isNew = log.id > lastSeenLogId;
                  return (
                    <div
                      key={log.id}
                      className={`px-3 py-2 ${isNew ? "bg-primary/5" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <Key className="w-3 h-3 text-primary" />
                        <span className="text-white text-xs font-bold">
                          {log.accessCode}
                        </span>
                        {details.clientName && (
                          <span className="text-white/40 text-xs">
                            {details.clientName}
                          </span>
                        )}
                        {isNew && (
                          <span className="text-[9px] bg-primary/20 text-primary px-1 rounded">
                            NOVO
                          </span>
                        )}
                      </div>
                      <p className="text-white/30 text-[10px] mt-0.5">
                        {new Date(log.createdAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="p-4 text-center text-white/40 text-xs">
              Nenhuma notificação
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== ACCESS CODE LOG PANEL ====================
function AccessCodeLogPanel({ accessCodeId }: { accessCodeId: number }) {
  const { data: logs, isLoading } = trpc.access.logs.useQuery({ accessCodeId });

  const actionLabels: Record<string, string> = {
    login: "Login",
    submit: "Envio",
    consume: "Consumo",
  };

  const actionColors: Record<string, string> = {
    login: "text-blue-400",
    submit: "text-yellow-400",
    consume: "text-green-400",
  };

  if (isLoading)
    return (
      <div className="mt-2 text-white/40 text-xs py-2">
        Carregando histórico...
      </div>
    );

  if (!logs || logs.length === 0) {
    return (
      <div className="mt-2 text-white/40 text-xs py-2 border-t border-white/5">
        Nenhum registro de uso encontrado.
      </div>
    );
  }

  return (
    <div className="mt-2 border-t border-white/10 pt-2 space-y-1">
      <p className="text-white/50 text-xs font-semibold mb-1">
        Histórico de Uso
      </p>
      {logs.map((log: any) => {
        let details: any = {};
        try {
          details = log.details ? JSON.parse(log.details) : {};
        } catch {}
        return (
          <div
            key={log.id}
            className="flex items-center gap-2 text-xs py-1 px-2 rounded bg-white/[0.03]"
          >
            <span
              className={`font-bold ${actionColors[log.action] || "text-white/60"}`}
            >
              {actionLabels[log.action] || log.action}
            </span>
            <span className="text-white/40">
              {new Date(log.createdAt).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
            {details.clientName && (
              <span className="text-white/30">
                Cliente: {details.clientName}
              </span>
            )}
            {details.newUses && (
              <span className="text-white/30">
                Uso #{details.newUses}/{details.maxUses}
              </span>
            )}
            {log.clientIp && (
              <span className="text-white/20">IP: {log.clientIp}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ==================== COUPONS ====================
function CouponsManager() {
  const utils = trpc.useUtils();
  const { data: coupons, isLoading } = trpc.coupons.list.useQuery();
  const createCoupon = trpc.coupons.create.useMutation({
    onSuccess: () => {
      utils.coupons.list.invalidate();
      toast.success("Cupom criado!");
    },
    onError: () => toast.error("Erro ao criar"),
  });
  const deleteCoupon = trpc.coupons.delete.useMutation({
    onSuccess: () => {
      utils.coupons.list.invalidate();
      toast.success("Cupom deletado!");
    },
    onError: () => toast.error("Erro ao deletar"),
  });

  const [newCode, setNewCode] = useState("");
  const [newDiscountType, setNewDiscountType] = useState<
    "percentage" | "fixed"
  >("percentage");
  const [newDiscount, setNewDiscount] = useState(10);

  if (isLoading)
    return <div className="text-white/60 text-center py-8">Carregando...</div>;

  const formatCouponDisplay = (coupon: any) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}% OFF`;
    } else {
      // fixed: valor em centavos
      return `R$ ${(coupon.discountValue / 100).toFixed(2).replace(".", ",")} OFF`;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Cupons de Desconto</h2>
        <p className="text-white/50 text-sm mt-1">
          Crie cupons de desconto com valor fixo (R$) ou percentual (%).
        </p>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-sm">Novo Cupom</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-white/70 text-xs">Código *</Label>
              <Input
                value={newCode}
                onChange={e => setNewCode(e.target.value.toUpperCase())}
                placeholder="Ex: DESCONTO10"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-white/70 text-xs">Tipo de Desconto</Label>
              <select
                value={newDiscountType}
                onChange={e => {
                  setNewDiscountType(e.target.value as "percentage" | "fixed");
                  setNewDiscount(e.target.value === "percentage" ? 10 : 5000);
                }}
                className="mt-1 w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="percentage" className="bg-gray-900">
                  Percentual (%)
                </option>
                <option value="fixed" className="bg-gray-900">
                  Valor Fixo (R$)
                </option>
              </select>
            </div>
            <div>
              <Label className="text-white/70 text-xs">
                {newDiscountType === "percentage"
                  ? "Desconto (%)"
                  : "Desconto (R$)"}
              </Label>
              {newDiscountType === "percentage" ? (
                <Input
                  type="number"
                  value={newDiscount}
                  onChange={e => setNewDiscount(parseInt(e.target.value) || 0)}
                  min={1}
                  max={100}
                  placeholder="Ex: 10"
                  className="mt-1"
                />
              ) : (
                <Input
                  type="number"
                  value={newDiscount / 100}
                  onChange={e =>
                    setNewDiscount(
                      Math.round((parseFloat(e.target.value) || 0) * 100)
                    )
                  }
                  min={1}
                  step={0.01}
                  placeholder="Ex: 50.00"
                  className="mt-1"
                />
              )}
              {newDiscountType === "fixed" && (
                <p className="text-white/40 text-xs mt-1">
                  Valor em reais (ex: 50 = R$ 50,00)
                </p>
              )}
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  if (!newCode.trim()) {
                    toast.error("Código obrigatório");
                    return;
                  }
                  if (
                    newDiscountType === "percentage" &&
                    (newDiscount < 1 || newDiscount > 100)
                  ) {
                    toast.error("Percentual deve ser entre 1 e 100");
                    return;
                  }
                  if (newDiscountType === "fixed" && newDiscount < 100) {
                    toast.error("Valor mínimo é R$ 1,00");
                    return;
                  }
                  createCoupon.mutate({
                    code: newCode,
                    discountType: newDiscountType,
                    discountValue: newDiscount,
                  });
                  setNewCode("");
                  setNewDiscount(newDiscountType === "percentage" ? 10 : 5000);
                }}
                className="gap-2 w-full"
              >
                <Plus className="w-4 h-4" /> Criar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {coupons?.map((coupon: any) => (
          <div
            key={coupon.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${coupon.status === "active" ? "border-green-500/20 bg-white/5" : "border-white/10 bg-white/[0.02] opacity-50"}`}
          >
            <Tag className="w-4 h-4 text-primary" />
            <span className="text-white font-mono font-bold">
              {coupon.code}
            </span>
            <span className="text-green-400 font-bold">
              {formatCouponDisplay(coupon)}
            </span>
            <span className="text-white/30 text-xs">
              {coupon.discountType === "percentage"
                ? "Percentual"
                : "Valor Fixo"}
            </span>
            <span className="text-white/50 text-sm flex-1">
              Usado: {coupon.usedCount || 0}x
            </span>
            <button
              onClick={() => {
                if (confirm("Deletar este cupom?"))
                  deleteCoupon.mutate({ id: coupon.id });
              }}
            >
              <Trash2 className="w-4 h-4 text-red-400/60 hover:text-red-400" />
            </button>
          </div>
        ))}
        {(!coupons || coupons.length === 0) && (
          <p className="text-white/40 text-center py-4">
            Nenhum cupom cadastrado
          </p>
        )}
      </div>
    </div>
  );
}


// ==================== ORDERS MANAGER ====================
function OrdersManager() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data, isLoading, refetch } = trpc.admin.orders.list.useQuery({
    limit: 200,
    offset: 0,
  });
  const updateStatus = trpc.admin.orders.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Status atualizado!");
    },
  });

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    processing: "Em Andamento",
    completed: "Finalizado",
    refunded: "Devolução",
    cancelled: "Cancelado",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    refunded: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const filteredOrders = useMemo(() => {
    if (!data?.orders) return [];
    if (statusFilter === "all") return data.orders;
    return data.orders.filter(o => o.status === statusFilter);
  }, [data?.orders, statusFilter]);

  const stats = useMemo(() => {
    if (!data?.orders) return { pending: 0, processing: 0, completed: 0, refunded: 0, cancelled: 0, total: 0 };
    return {
      pending: data.orders.filter(o => o.status === "pending").length,
      processing: data.orders.filter(o => o.status === "processing").length,
      completed: data.orders.filter(o => o.status === "completed").length,
      refunded: data.orders.filter(o => o.status === "refunded").length,
      cancelled: data.orders.filter(o => o.status === "cancelled").length,
      total: data.orders.length,
    };
  }, [data?.orders]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Dashboard de Pedidos
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="text-white/70"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <button
          onClick={() => setStatusFilter("all")}
          className={`p-3 rounded-xl border text-center transition-all ${
            statusFilter === "all"
              ? "bg-primary/20 border-primary/50 ring-1 ring-primary/30"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-white/60">Total</p>
        </button>
        <button
          onClick={() => setStatusFilter("pending")}
          className={`p-3 rounded-xl border text-center transition-all ${
            statusFilter === "pending"
              ? "bg-yellow-500/20 border-yellow-500/50 ring-1 ring-yellow-500/30"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
          <p className="text-xs text-white/60">Pendentes</p>
        </button>
        <button
          onClick={() => setStatusFilter("processing")}
          className={`p-3 rounded-xl border text-center transition-all ${
            statusFilter === "processing"
              ? "bg-blue-500/20 border-blue-500/50 ring-1 ring-blue-500/30"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          <p className="text-2xl font-bold text-blue-400">{stats.processing}</p>
          <p className="text-xs text-white/60">Em Andamento</p>
        </button>
        <button
          onClick={() => setStatusFilter("completed")}
          className={`p-3 rounded-xl border text-center transition-all ${
            statusFilter === "completed"
              ? "bg-green-500/20 border-green-500/50 ring-1 ring-green-500/30"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
          <p className="text-xs text-white/60">Finalizados</p>
        </button>
        <button
          onClick={() => setStatusFilter("refunded")}
          className={`p-3 rounded-xl border text-center transition-all ${
            statusFilter === "refunded"
              ? "bg-orange-500/20 border-orange-500/50 ring-1 ring-orange-500/30"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          <p className="text-2xl font-bold text-orange-400">{stats.refunded}</p>
          <p className="text-xs text-white/60">Devoluções</p>
        </button>
        <button
          onClick={() => setStatusFilter("cancelled")}
          className={`p-3 rounded-xl border text-center transition-all ${
            statusFilter === "cancelled"
              ? "bg-red-500/20 border-red-500/50 ring-1 ring-red-500/30"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          <p className="text-2xl font-bold text-red-400">{stats.cancelled}</p>
          <p className="text-xs text-white/60">Cancelados</p>
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
            <History className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">
              {statusFilter === "all"
                ? "Nenhum pedido registrado ainda"
                : `Nenhum pedido com status "${statusLabels[statusFilter]}"`}
            </p>
          </div>
        ) : (
          filteredOrders.map((order: any) => (
            <OrderCard
              key={order.id}
              order={order}
              statusLabels={statusLabels}
              statusColors={statusColors}
              onUpdateStatus={(id, status) =>
                updateStatus.mutate({ id, status: status as any })
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  statusLabels,
  statusColors,
  onUpdateStatus,
}: {
  order: {
    id: number;
    cardName: string | null;
    modelLabel: string | null;
    modelPrice: number | null;
    clientName: string | null;
    clientPhone: string | null;
    clientCity: string | null;
    referrerName: string | null;
    referrerPhone: string | null;
    nameOption: string | null;
    couponCode: string | null;
    couponDiscount: number | null;
    accessCode: string | null;
    status: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
  onUpdateStatus: (id: number, status: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (cents: number) => {
    return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-visible">
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">
                #{order.id}
              </span>
              <span className="text-white/80 text-sm">
                {order.clientName || "Sem nome"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/50 text-xs">
                {order.cardName || "Sem serviço"}
              </span>
              {order.modelPrice && (
                <span className="text-green-400 text-xs font-semibold">
                  {formatPrice(order.modelPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-xs hidden sm:block">
            {formatDate(order.createdAt)}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusColors[order.status] || "bg-white/10 text-white/60 border-white/20"}`}
          >
            {statusLabels[order.status] || order.status}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/40" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cliente */}
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-white/40 text-xs mb-1 uppercase tracking-wider">
                Cliente
              </p>
              <p className="text-white text-sm font-medium">
                {order.clientName || "Não informado"}
              </p>
              {order.clientPhone && (
                <p className="text-white/60 text-xs mt-1">
                  Tel: {order.clientPhone}
                </p>
              )}
              {order.clientCity && (
                <p className="text-white/60 text-xs">
                  Cidade: {order.clientCity}
                </p>
              )}
            </div>

            {/* Serviço */}
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-white/40 text-xs mb-1 uppercase tracking-wider">
                Serviço
              </p>
              <p className="text-white text-sm font-medium">
                {order.cardName || "Não especificado"}
              </p>
              {order.modelLabel && (
                <p className="text-white/60 text-xs mt-1">
                  Modelo: {order.modelLabel}
                </p>
              )}
              {order.nameOption && (
                <p className="text-white/60 text-xs">
                  Opção: {order.nameOption}
                </p>
              )}
            </div>

            {/* Indicação */}
            {(order.referrerName || order.referrerPhone) && (
              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-white/40 text-xs mb-1 uppercase tracking-wider">
                  Indicação
                </p>
                <p className="text-white text-sm font-medium">
                  {order.referrerName || "Não informado"}
                </p>
                {order.referrerPhone && (
                  <p className="text-white/60 text-xs mt-1">
                    Tel: {order.referrerPhone}
                  </p>
                )}
              </div>
            )}

            {/* Detalhes */}
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-white/40 text-xs mb-1 uppercase tracking-wider">
                Detalhes
              </p>
              <p className="text-white/60 text-xs">
                Data: {formatDate(order.createdAt)}
              </p>
              {order.couponCode && (
                <p className="text-white/60 text-xs">
                  Cupom: {order.couponCode}
                </p>
              )}
              {order.accessCode && (
                <p className="text-white/60 text-xs">
                  Senha: {order.accessCode}
                </p>
              )}
              {order.notes && (
                <p className="text-white/60 text-xs mt-1">
                  Notas: {order.notes}
                </p>
              )}
            </div>
          </div>

          {/* Status Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <p className="text-white/40 text-xs mr-2">Alterar status:</p>
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${statusColors[order.status] || "bg-white/10 text-white/60 border-white/20"}`}
              >
                {statusLabels[order.status] || order.status}
                <ChevronDown className="w-3 h-3 inline ml-1" />
              </button>
              {showStatusMenu && (
                <div className="absolute bottom-full left-0 mb-1 bg-black border border-white/20 rounded-lg shadow-2xl z-50 min-w-[160px]">
                  {(["pending", "processing", "completed", "refunded", "cancelled"] as const).map(
                    status => (
                      <button
                        key={status}
                        onClick={() => {
                          onUpdateStatus(order.id, status);
                          setShowStatusMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-colors ${
                          order.status === status
                            ? "text-primary font-semibold"
                            : "text-white/70"
                        }`}
                      >
                        {statusLabels[status]}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
