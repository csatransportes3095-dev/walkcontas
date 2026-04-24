import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRouter } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Painel Admin Completo
 * Gerencia: modelos, opções de nome, documentos, pagamentos, garantias, info geral, cards
 */
export default function Admin() {
  const { user, loading } = useAuth();
  const [, navigate] = useRouter() as any;
  const [activeTab, setActiveTab] = useState("models");

  // Redirecionar se não for admin
  if (!loading && (!user || user.role !== "admin")) {
    navigate("/");
    return null;
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Painel Admin</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="models">Modelos</TabsTrigger>
            <TabsTrigger value="names">Nomes</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            <TabsTrigger value="warranties">Garantias</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
          </TabsList>

          {/* === MODELOS === */}
          <TabsContent value="models">
            <ModelsManager />
          </TabsContent>

          {/* === OPÇÕES DE NOME === */}
          <TabsContent value="names">
            <NamesManager />
          </TabsContent>

          {/* === DOCUMENTOS === */}
          <TabsContent value="documents">
            <DocumentsManager />
          </TabsContent>

          {/* === FORMAS DE PAGAMENTO === */}
          <TabsContent value="payments">
            <PaymentsManager />
          </TabsContent>

          {/* === GARANTIAS === */}
          <TabsContent value="warranties">
            <WarrantiesManager />
          </TabsContent>

          {/* === CONFIGURAÇÕES GERAIS === */}
          <TabsContent value="settings">
            <SettingsManager />
          </TabsContent>

          {/* === CARDS DA PÁGINA === */}
          <TabsContent value="cards">
            <CardsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// === Gerenciador de Modelos ===
function ModelsManager() {
  const { data: models = [], isLoading, refetch } = trpc.admin.accountModels.list.useQuery();
  const createMutation = trpc.admin.accountModels.create.useMutation();
  const updateMutation = trpc.admin.accountModels.update.useMutation();
  const deleteMutation = trpc.admin.accountModels.delete.useMutation();
  const toggleMutation = trpc.admin.accountModels.toggle.useMutation();

  const [newModel, setNewModel] = useState({ name: "", slug: "", description: "", icon: "" });

  const handleCreate = async () => {
    if (!newModel.name || !newModel.slug) {
      toast.error("Nome e slug são obrigatórios");
      return;
    }
    try {
      await createMutation.mutateAsync(newModel);
      setNewModel({ name: "", slug: "", description: "", icon: "" });
      refetch();
      toast.success("Modelo criado com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar modelo");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Modelo deletado!");
    } catch (error) {
      toast.error("Erro ao deletar");
    }
  };

  const handleToggle = async (id: number, active: number) => {
    try {
      await toggleMutation.mutateAsync({ id, active: active === 1 ? 0 : 1 });
      refetch();
      toast.success("Status atualizado!");
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Novo Modelo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={newModel.name}
                onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                placeholder="Ex: Conta Uber"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={newModel.slug}
                onChange={(e) => setNewModel({ ...newModel, slug: e.target.value })}
                placeholder="Ex: uber"
              />
            </div>
            <div className="col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={newModel.description}
                onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                placeholder="Descrição do modelo"
              />
            </div>
            <div className="col-span-2">
              <Label>URL do Ícone</Label>
              <Input
                value={newModel.icon}
                onChange={(e) => setNewModel({ ...newModel, icon: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Criando..." : "Criar Modelo"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Modelos Existentes</h3>
        {isLoading ? (
          <p>Carregando...</p>
        ) : models.length === 0 ? (
          <p className="text-muted-foreground">Nenhum modelo criado</p>
        ) : (
          <div className="grid gap-2">
            {models.map((model) => (
              <Card key={model.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h4 className="font-semibold">{model.name}</h4>
                    <p className="text-sm text-muted-foreground">{model.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(model.id, model.active)}
                    >
                      {model.active === 1 ? "Ativo" : "Inativo"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(model.id)}
                    >
                      Deletar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// === Gerenciador de Opções de Nome ===
function NamesManager() {
  const { data: models = [] } = trpc.admin.accountModels.list.useQuery();
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const { data: names = [], refetch } = trpc.admin.nameOptions.list.useQuery(
    { modelId: selectedModelId as number },
    { enabled: !!selectedModelId }
  );

  const createMutation = trpc.admin.nameOptions.create.useMutation();
  const deleteMutation = trpc.admin.nameOptions.delete.useMutation();
  const [newName, setNewName] = useState({ type: "random" as const, label: "", price: 0 });

  const handleCreate = async () => {
    if (!selectedModelId || !newName.label || newName.price <= 0) {
      toast.error("Preencha todos os campos");
      return;
    }
    try {
      await createMutation.mutateAsync({
        modelId: selectedModelId,
        type: newName.type as "random" | "first" | "full",
        label: newName.label,
        price: newName.price,
      });
      setNewName({ type: "random", label: "", price: 0 });
      refetch();
      toast.success("Opção de nome criada!");
    } catch (error) {
      toast.error("Erro ao criar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deletar?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Deletado!");
    } catch (error) {
      toast.error("Erro");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Selecione um Modelo</Label>
        <select
          value={selectedModelId || ""}
          onChange={(e) => setSelectedModelId(Number(e.target.value))}
          className="w-full p-2 border rounded"
        >
          <option value="">-- Selecione --</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {selectedModelId && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Opção de Nome</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Tipo</Label>
                <select
                  value={newName.type}
                  onChange={(e) => setNewName({ ...newName, type: e.target.value as any })}
                  className="w-full p-2 border rounded"
                >
                  <option value="random">Aleatório</option>
                  <option value="first">Primeiro Nome</option>
                  <option value="full">Nome Completo</option>
                </select>
              </div>
              <div>
                <Label>Label</Label>
                <Input
                  value={newName.label}
                  onChange={(e) => setNewName({ ...newName, label: e.target.value })}
                  placeholder="Ex: Nome Aleatório"
                />
              </div>
              <div>
                <Label>Preço (centavos)</Label>
                <Input
                  type="number"
                  value={newName.price}
                  onChange={(e) => setNewName({ ...newName, price: Number(e.target.value) })}
                  placeholder="35000"
                />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              Criar
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedModelId && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Opções Existentes</h3>
          {names.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma opção</p>
          ) : (
            <div className="grid gap-2">
              {names.map((name) => (
                <Card key={name.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <h4 className="font-semibold">{name.label}</h4>
                      <p className="text-sm text-muted-foreground">
                        R$ {(name.price / 100).toFixed(2)} - {name.type}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(name.id)}
                    >
                      Deletar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// === Gerenciador de Documentos ===
function DocumentsManager() {
  const { data: models = [] } = trpc.admin.accountModels.list.useQuery();
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const { data: docs = [], refetch } = trpc.admin.requiredDocuments.list.useQuery(
    { modelId: selectedModelId as number },
    { enabled: !!selectedModelId }
  );

  const createMutation = trpc.admin.requiredDocuments.create.useMutation();
  const deleteMutation = trpc.admin.requiredDocuments.delete.useMutation();
  const [newDoc, setNewDoc] = useState({
    name: "",
    type: "",
    required: 1,
    acceptedFormats: "jpg,png,pdf",
  });

  const handleCreate = async () => {
    if (!selectedModelId || !newDoc.name || !newDoc.type) {
      toast.error("Preencha todos os campos");
      return;
    }
    try {
      await createMutation.mutateAsync({
        modelId: selectedModelId,
        name: newDoc.name,
        type: newDoc.type,
        required: newDoc.required,
        acceptedFormats: newDoc.acceptedFormats,
      });
      setNewDoc({ name: "", type: "", required: 1, acceptedFormats: "jpg,png,pdf" });
      refetch();
      toast.success("Documento criado!");
    } catch (error) {
      toast.error("Erro ao criar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deletar?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Deletado!");
    } catch (error) {
      toast.error("Erro");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Selecione um Modelo</Label>
        <select
          value={selectedModelId || ""}
          onChange={(e) => setSelectedModelId(Number(e.target.value))}
          className="w-full p-2 border rounded"
        >
          <option value="">-- Selecione --</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {selectedModelId && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={newDoc.name}
                  onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                  placeholder="Ex: Foto de Perfil"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Input
                  value={newDoc.type}
                  onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value })}
                  placeholder="Ex: profile_photo"
                />
              </div>
              <div>
                <Label>Formatos Aceitos</Label>
                <Input
                  value={newDoc.acceptedFormats}
                  onChange={(e) => setNewDoc({ ...newDoc, acceptedFormats: e.target.value })}
                  placeholder="jpg,png,pdf"
                />
              </div>
              <div>
                <Label>Obrigatório?</Label>
                <select
                  value={newDoc.required}
                  onChange={(e) => setNewDoc({ ...newDoc, required: Number(e.target.value) })}
                  className="w-full p-2 border rounded"
                >
                  <option value={1}>Sim</option>
                  <option value={0}>Não</option>
                </select>
              </div>
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              Criar
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedModelId && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Documentos Existentes</h3>
          {docs.length === 0 ? (
            <p className="text-muted-foreground">Nenhum documento</p>
          ) : (
            <div className="grid gap-2">
              {docs.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <h4 className="font-semibold">{doc.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {doc.required === 1 ? "Obrigatório" : "Opcional"} - {doc.acceptedFormats}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                    >
                      Deletar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// === Gerenciador de Pagamentos ===
function PaymentsManager() {
  const { data: payments = [], refetch } = trpc.admin.paymentMethods.list.useQuery();
  const createMutation = trpc.admin.paymentMethods.create.useMutation();
  const updateMutation = trpc.admin.paymentMethods.update.useMutation();
  const deleteMutation = trpc.admin.paymentMethods.delete.useMutation();

  const [newPayment, setNewPayment] = useState({
    name: "",
    type: "",
    description: "",
    pixKey: "",
    pixKeyHolder: "",
    pixBank: "",
  });

  const handleCreate = async () => {
    if (!newPayment.name || !newPayment.type) {
      toast.error("Nome e tipo são obrigatórios");
      return;
    }
    try {
      await createMutation.mutateAsync(newPayment);
      setNewPayment({ name: "", type: "", description: "", pixKey: "", pixKeyHolder: "", pixBank: "" });
      refetch();
      toast.success("Forma de pagamento criada!");
    } catch (error) {
      toast.error("Erro ao criar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deletar?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Deletado!");
    } catch (error) {
      toast.error("Erro");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nova Forma de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={newPayment.name}
                onChange={(e) => setNewPayment({ ...newPayment, name: e.target.value })}
                placeholder="Ex: PIX"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Input
                value={newPayment.type}
                onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value })}
                placeholder="Ex: pix"
              />
            </div>
            <div className="col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={newPayment.description}
                onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                placeholder="Descrição"
              />
            </div>
            <div>
              <Label>Chave PIX</Label>
              <Input
                value={newPayment.pixKey}
                onChange={(e) => setNewPayment({ ...newPayment, pixKey: e.target.value })}
                placeholder="11915193551"
              />
            </div>
            <div>
              <Label>Titular</Label>
              <Input
                value={newPayment.pixKeyHolder}
                onChange={(e) => setNewPayment({ ...newPayment, pixKeyHolder: e.target.value })}
                placeholder="Adiel Cardeal dos Santos"
              />
            </div>
            <div>
              <Label>Banco</Label>
              <Input
                value={newPayment.pixBank}
                onChange={(e) => setNewPayment({ ...newPayment, pixBank: e.target.value })}
                placeholder="99Pay"
              />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            Criar
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Formas Existentes</h3>
        {payments.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma forma de pagamento</p>
        ) : (
          <div className="grid gap-2">
            {payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h4 className="font-semibold">{payment.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {payment.pixKey && `${payment.pixKey} - ${payment.pixBank}`}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(payment.id)}
                  >
                    Deletar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// === Gerenciador de Garantias ===
function WarrantiesManager() {
  const { data: models = [] } = trpc.admin.accountModels.list.useQuery();
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const { data: warranties = [], refetch } = trpc.admin.warranties.list.useQuery(
    { modelId: selectedModelId as number },
    { enabled: !!selectedModelId }
  );

  const createMutation = trpc.admin.warranties.create.useMutation();
  const updateMutation = trpc.admin.warranties.update.useMutation();
  const [newWarranty, setNewWarranty] = useState({ rides: 25, days: 7, description: "" });

  const handleCreate = async () => {
    if (!selectedModelId) {
      toast.error("Selecione um modelo");
      return;
    }
    try {
      await createMutation.mutateAsync({
        modelId: selectedModelId,
        rides: newWarranty.rides,
        days: newWarranty.days,
        description: newWarranty.description,
      });
      refetch();
      toast.success("Garantia criada!");
    } catch (error) {
      toast.error("Erro ao criar");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Selecione um Modelo</Label>
        <select
          value={selectedModelId || ""}
          onChange={(e) => setSelectedModelId(Number(e.target.value))}
          className="w-full p-2 border rounded"
        >
          <option value="">-- Selecione --</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {selectedModelId && (
        <Card>
          <CardHeader>
            <CardTitle>Configurar Garantia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Corridas</Label>
                <Input
                  type="number"
                  value={newWarranty.rides}
                  onChange={(e) => setNewWarranty({ ...newWarranty, rides: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Dias</Label>
                <Input
                  type="number"
                  value={newWarranty.days}
                  onChange={(e) => setNewWarranty({ ...newWarranty, days: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  value={newWarranty.description}
                  onChange={(e) => setNewWarranty({ ...newWarranty, description: e.target.value })}
                  placeholder="Garantia de até X corridas ou Y dias"
                />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              Salvar
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedModelId && warranties.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Garantia Atual</h3>
          <Card>
            <CardContent className="p-4">
              <p>
                <strong>Corridas:</strong> {warranties[0].rides}
              </p>
              <p>
                <strong>Dias:</strong> {warranties[0].days}
              </p>
              <p>
                <strong>Descrição:</strong> {warranties[0].description}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// === Gerenciador de Configurações ===
function SettingsManager() {
  const { data: settings = [], refetch } = trpc.admin.siteSettings.list.useQuery();
  const updateMutation = trpc.admin.siteSettings.update.useMutation();

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const handleUpdate = async (key: string, value: string) => {
    try {
      await updateMutation.mutateAsync({ key, value });
      setEditingKey(null);
      refetch();
      toast.success("Configuração atualizada!");
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  const commonSettings = [
    { key: "site_title", label: "Título do Site" },
    { key: "site_description", label: "Descrição" },
    { key: "whatsapp_number", label: "Número WhatsApp" },
    { key: "pix_key", label: "Chave PIX" },
    { key: "vip_password_expiry_minutes", label: "Expiração Senha VIP (minutos)" },
  ];

  return (
    <div className="space-y-4">
      {commonSettings.map((setting) => {
        const current = settings.find((s) => s.key === setting.key);
        const isEditing = editingKey === setting.key;

        return (
          <Card key={setting.key}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <h4 className="font-semibold">{setting.label}</h4>
                <p className="text-sm text-muted-foreground">{current?.value || "Não definido"}</p>
              </div>
              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="w-48"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleUpdate(setting.key, editingValue)}
                    disabled={updateMutation.isPending}
                  >
                    Salvar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingKey(null)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingKey(setting.key);
                    setEditingValue(current?.value || "");
                  }}
                >
                  Editar
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// === Gerenciador de Cards ===
function CardsManager() {
  const { data: cards = [], refetch } = trpc.admin.pageCards.list.useQuery();
  const createMutation = trpc.admin.pageCards.create.useMutation();
  const updateMutation = trpc.admin.pageCards.update.useMutation();
  const deleteMutation = trpc.admin.pageCards.delete.useMutation();
  const toggleMutation = trpc.admin.pageCards.toggle.useMutation();

  const [newCard, setNewCard] = useState({
    title: "",
    description: "",
    image: "",
    video: "",
    link: "",
  });

  const handleCreate = async () => {
    if (!newCard.title) {
      toast.error("Título é obrigatório");
      return;
    }
    try {
      await createMutation.mutateAsync(newCard);
      setNewCard({ title: "", description: "", image: "", video: "", link: "" });
      refetch();
      toast.success("Card criado!");
    } catch (error) {
      toast.error("Erro ao criar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deletar?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Deletado!");
    } catch (error) {
      toast.error("Erro");
    }
  };

  const handleToggle = async (id: number, active: number) => {
    try {
      await toggleMutation.mutateAsync({ id, active: active === 1 ? 0 : 1 });
      refetch();
      toast.success("Status atualizado!");
    } catch (error) {
      toast.error("Erro");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Novo Card</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input
              value={newCard.title}
              onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
              placeholder="Título do card"
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea
              value={newCard.description}
              onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
              placeholder="Descrição"
            />
          </div>
          <div>
            <Label>URL da Imagem</Label>
            <Input
              value={newCard.image}
              onChange={(e) => setNewCard({ ...newCard, image: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label>URL do Vídeo</Label>
            <Input
              value={newCard.video}
              onChange={(e) => setNewCard({ ...newCard, video: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label>Link</Label>
            <Input
              value={newCard.link}
              onChange={(e) => setNewCard({ ...newCard, link: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            Criar
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Cards Existentes</h3>
        {cards.length === 0 ? (
          <p className="text-muted-foreground">Nenhum card</p>
        ) : (
          <div className="grid gap-2">
            {cards.map((card) => (
              <Card key={card.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h4 className="font-semibold">{card.title}</h4>
                    <p className="text-sm text-muted-foreground">{card.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(card.id, card.active)}
                    >
                      {card.active === 1 ? "Ativo" : "Inativo"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(card.id)}
                    >
                      Deletar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
