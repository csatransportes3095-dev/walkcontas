import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Edit2, Plus, Eye, EyeOff } from "lucide-react";

export default function AdminProducts() {
  const utils = trpc.useUtils();
  const { data: products = [], isLoading } = trpc.products.listAll.useQuery();
  const createMutation = trpc.products.create.useMutation();
  const updateMutation = trpc.products.update.useMutation();
  const deleteMutation = trpc.products.delete.useMutation();
  const toggleMutation = trpc.products.toggle.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    iconUrl: "",
    valueRandom: "Consulte",
    valueFirst: "Consulte",
    valueFull: "Consulte",
    enableRandom: true,
    enableFirst: true,
    enableFull: false,
    requireProfilePhoto: true,
    requireCarDocument: true,
    requireAlvara: false,
    requireCondutaxi: false,
    requireVehicle2016: false,
    isPdfOnly: false,
    showYearField: false,
    sortOrder: 0,
  });

  const handleReset = () => {
    setFormData({
      name: "",
      description: "",
      iconUrl: "",
      valueRandom: "Consulte",
      valueFirst: "Consulte",
      valueFull: "Consulte",
      enableRandom: true,
      enableFirst: true,
      enableFull: false,
      requireProfilePhoto: true,
      requireCarDocument: true,
      requireAlvara: false,
      requireCondutaxi: false,
      requireVehicle2016: false,
      isPdfOnly: false,
      showYearField: false,
      sortOrder: 0,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (product: typeof products[0]) => {
    setFormData({
      name: product.name,
      description: product.description || "",
      iconUrl: product.iconUrl || "",
      valueRandom: product.valueRandom,
      valueFirst: product.valueFirst,
      valueFull: product.valueFull,
      enableRandom: product.enableRandom === 1,
      enableFirst: product.enableFirst === 1,
      enableFull: product.enableFull === 1,
      requireProfilePhoto: product.requireProfilePhoto === 1,
      requireCarDocument: product.requireCarDocument === 1,
      requireAlvara: product.requireAlvara === 1,
      requireCondutaxi: product.requireCondutaxi === 1,
      requireVehicle2016: product.requireVehicle2016 === 1,
      isPdfOnly: product.isPdfOnly === 1,
      showYearField: product.showYearField === 1,
      sortOrder: product.sortOrder,
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...formData,
          enableRandom: formData.enableRandom ? 1 : 0,
          enableFirst: formData.enableFirst ? 1 : 0,
          enableFull: formData.enableFull ? 1 : 0,
          requireProfilePhoto: formData.requireProfilePhoto ? 1 : 0,
          requireCarDocument: formData.requireCarDocument ? 1 : 0,
          requireAlvara: formData.requireAlvara ? 1 : 0,
          requireCondutaxi: formData.requireCondutaxi ? 1 : 0,
          requireVehicle2016: formData.requireVehicle2016 ? 1 : 0,
          isPdfOnly: formData.isPdfOnly ? 1 : 0,
          showYearField: formData.showYearField ? 1 : 0,
        });
        toast.success("Produto atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Produto criado com sucesso!");
      }
      utils.products.listAll.invalidate();
      handleReset();
    } catch (error) {
      toast.error("Erro ao salvar produto");
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este produto?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Produto deletado com sucesso!");
      utils.products.listAll.invalidate();
    } catch (error) {
      toast.error("Erro ao deletar produto");
      console.error(error);
    }
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    try {
      await toggleMutation.mutateAsync({ id, isActive: !isActive });
      utils.products.listAll.invalidate();
    } catch (error) {
      toast.error("Erro ao atualizar status");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-foreground">Gerenciar Produtos</h1>
          <Button
            onClick={() => {
              if (showForm) handleReset();
              else setShowForm(true);
            }}
            className="bg-primary text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? "Cancelar" : "Novo Produto"}
          </Button>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-card-foreground mb-6">
              {editingId ? "Editar Produto" : "Novo Produto"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Nome do Produto *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Conta Uber"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Ordem de Exibição
                  </label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Descrição
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do produto"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Valor - Nome Aleatório
                  </label>
                  <Input
                    type="text"
                    value={formData.valueRandom}
                    onChange={(e) => setFormData({ ...formData, valueRandom: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Valor - Primeiro Nome
                  </label>
                  <Input
                    type="text"
                    value={formData.valueFirst}
                    onChange={(e) => setFormData({ ...formData, valueFirst: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Valor - Nome Completo
                  </label>
                  <Input
                    type="text"
                    value={formData.valueFull}
                    onChange={(e) => setFormData({ ...formData, valueFull: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Opções de Nome</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableRandom}
                      onChange={(e) => setFormData({ ...formData, enableRandom: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-card-foreground">Ativar Nome Aleatório</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableFirst}
                      onChange={(e) => setFormData({ ...formData, enableFirst: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-card-foreground">Ativar Primeiro Nome</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableFull}
                      onChange={(e) => setFormData({ ...formData, enableFull: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-card-foreground">Ativar Nome Completo</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Arquivos Obrigatórios</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requireProfilePhoto}
                      onChange={(e) => setFormData({ ...formData, requireProfilePhoto: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-card-foreground">Foto de Perfil</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requireCarDocument}
                      onChange={(e) => setFormData({ ...formData, requireCarDocument: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-card-foreground">Documento do Carro</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requireAlvara}
                      onChange={(e) => setFormData({ ...formData, requireAlvara: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-card-foreground">Alvará</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requireCondutaxi}
                      onChange={(e) => setFormData({ ...formData, requireCondutaxi: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-card-foreground">Condutaxi</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Configurações Especiais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requireVehicle2016}
                      onChange={(e) => setFormData({ ...formData, requireVehicle2016: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-card-foreground">Exigir Veículo 2016+</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPdfOnly}
                      onChange={(e) => setFormData({ ...formData, isPdfOnly: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-card-foreground">Apenas PDF (Edição)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showYearField}
                      onChange={(e) => setFormData({ ...formData, showYearField: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-card-foreground">Mostrar Campo de Ano</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-6 border-t border-border">
                <Button type="button" variant="outline" onClick={handleReset}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary text-white">
                  {editingId ? "Atualizar" : "Criar"} Produto
                </Button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="text-center text-muted-foreground">Carregando produtos...</div>
        ) : products.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            Nenhum produto cadastrado. Clique em "Novo Produto" para começar.
          </div>
        ) : (
          <div className="grid gap-4">
            {products.map((product) => (
              <div key={product.id} className="bg-card border border-border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-card-foreground">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggle(product.id, product.isActive === 1)}
                    >
                      {product.isActive === 1 ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Nome Aleatório</p>
                    <p className="font-semibold text-card-foreground">
                      {product.valueRandom} {product.enableRandom === 0 && "(Desativado)"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Primeiro Nome</p>
                    <p className="font-semibold text-card-foreground">
                      {product.valueFirst} {product.enableFirst === 0 && "(Desativado)"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nome Completo</p>
                    <p className="font-semibold text-card-foreground">
                      {product.valueFull} {product.enableFull === 0 && "(Desativado)"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {product.requireProfilePhoto === 1 && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded">Foto Perfil</span>
                  )}
                  {product.requireCarDocument === 1 && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded">Doc Carro</span>
                  )}
                  {product.requireAlvara === 1 && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded">Alvará</span>
                  )}
                  {product.requireCondutaxi === 1 && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded">Condutaxi</span>
                  )}
                  {product.requireVehicle2016 === 1 && (
                    <span className="bg-accent/10 text-accent px-2 py-1 rounded">Veículo 2016+</span>
                  )}
                  {product.isPdfOnly === 1 && (
                    <span className="bg-secondary/10 text-secondary px-2 py-1 rounded">PDF Only</span>
                  )}
                  {product.showYearField === 1 && (
                    <span className="bg-secondary/10 text-secondary px-2 py-1 rounded">Campo Ano</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
