import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ToggleLeft, ToggleRight, Copy, ArrowLeft, Shield, Key, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

const whiteInputStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#000000',
  fontSize: '18px',
  textAlign: 'center' as const,
  border: '3px double #000000',
  borderRadius: '8px',
  padding: '8px 12px',
  width: '100%',
  height: '36px',
  outline: 'none',
  fontWeight: 500,
};

export default function AdminCodes() {
  const { user, loading, isAuthenticated } = useAuth();
  const [newCode, setNewCode] = useState("");
  const [clientName, setClientName] = useState("");
  // maxUses sempre 1 (uso único) - forçado no backend
  const [isCreating, setIsCreating] = useState(false);

  const codesQuery = trpc.access.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const createMutation = trpc.access.create.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Senha VIP criada com sucesso!");
        setNewCode("");
        setClientName("");
        codesQuery.refetch();
      } else {
        toast.error(result.message || "Erro ao criar senha");
      }
      setIsCreating(false);
    },
    onError: () => {
      toast.error("Erro ao criar senha");
      setIsCreating(false);
    },
  });

  const toggleMutation = trpc.access.toggle.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      codesQuery.refetch();
    },
  });

  const deleteMutation = trpc.access.delete.useMutation({
    onSuccess: () => {
      toast.success("Senha excluída!");
      codesQuery.refetch();
    },
  });

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "VIP-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(code);
  };

  const handleCreate = () => {
    if (!newCode.trim()) {
      toast.error("Digite um código");
      return;
    }
    setIsCreating(true);
    createMutation.mutate({ code: newCode, clientName: clientName || undefined });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-primary mx-auto" />
          <h2 className="text-2xl font-bold text-white">Acesso Restrito</h2>
          <p className="text-white/60">Faça login para acessar o painel admin</p>
          <a href={getLoginUrl()} className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/80 transition-all">
            Fazer Login
          </a>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Sem Permissão</h2>
          <p className="text-white/60">Você não tem permissão de administrador</p>
          <a href="/" className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/80 transition-all">
            Voltar ao Início
          </a>
        </div>
      </div>
    );
  }

  const codes = codesQuery.data || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-md shadow-sm border-b border-primary/30">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <a href="/" className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <Key className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-white">Gerenciar Senhas VIP</h1>
          </div>
          <span className="text-sm text-primary font-medium">Admin: {user?.name || "Admin"}</span>
        </div>
      </header>

      <div className="container py-8 space-y-8">
        {/* Criar Nova Senha */}
        <div className="bg-black/40 backdrop-blur-md border border-primary/30 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Criar Nova Senha VIP
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Código</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Ex: VIP-ABC123"
                  style={whiteInputStyle}
                />
                <Button
                  onClick={generateRandomCode}
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap text-black border-primary/30 hover:bg-green-600"
                  style={{ backgroundColor: '#03cc00' }}
                >
                  Gerar
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Nome do Cliente (opcional)</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nome do cliente"
                style={whiteInputStyle}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleCreate}
                disabled={isCreating || !newCode.trim()}
                className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-600/80 text-white font-bold"
              >
                {isCreating ? "Criando..." : "Criar Senha"}
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de Senhas */}
        <div className="bg-black/40 backdrop-blur-md border border-primary/30 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Senhas VIP ({codes.length})
          </h2>

          {codesQuery.isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : codes.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              Nenhuma senha VIP criada ainda
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">Código</th>
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">Cliente</th>
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">Usos</th>
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">Criado em</th>
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">Expira em</th>
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((code) => (
                    <tr key={code.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono font-bold">{code.code}</span>
                          <button
                            onClick={() => copyToClipboard(code.code)}
                            className="text-white/40 hover:text-primary transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white/70">{code.clientName || "-"}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            code.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : code.status === "used"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {code.status === "active" ? "Ativa" : code.status === "used" ? "Usada" : "Desativada"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white/70">
                        {(code.currentUses ?? 0) > 0 ? (
                          <span className="text-yellow-400 font-bold">Usada</span>
                        ) : (
                          <span className="text-green-400">Disponível</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-white/70 text-sm">
                        {code.createdAt ? new Date(code.createdAt).toLocaleDateString("pt-BR") : "-"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {code.expiresAt ? (() => {
                          const now = new Date();
                          const expiresAt = new Date(code.expiresAt);
                          const diffMs = expiresAt.getTime() - now.getTime();
                          const diffMins = Math.floor(diffMs / 60000);
                          
                          if (diffMins <= 0) {
                            return <span className="text-red-400 font-bold">Expirada</span>;
                          } else if (diffMins <= 5) {
                            return <span className="text-yellow-400 font-bold">Expira em {diffMins}min</span>;
                          } else {
                            return <span className="text-green-400">Expira em {diffMins}min</span>;
                          }
                        })() : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              toggleMutation.mutate({
                                id: code.id,
                                status: code.status === "active" ? "disabled" : "active",
                              })
                            }
                            className={`p-1.5 rounded-lg transition-colors ${
                              code.status === "active"
                                ? "text-green-400 hover:bg-green-500/20"
                                : "text-red-400 hover:bg-red-500/20"
                            }`}
                            title={code.status === "active" ? "Desativar" : "Ativar"}
                          >
                            {code.status === "active" ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Tem certeza que deseja excluir esta senha?")) {
                                deleteMutation.mutate({ id: code.id });
                              }
                            }}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Link para Cupons */}
        <a
          href="/admin/coupons"
          className="block bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-6 hover:border-green-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ticket className="w-8 h-8 text-green-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Cupons de Desconto</h3>
                <p className="text-white/60 text-sm">Criar e gerenciar cupons de desconto para clientes</p>
              </div>
            </div>
            <span className="text-green-400 text-2xl group-hover:translate-x-1 transition-transform">&rarr;</span>
          </div>
        </a>

        {/* Info */}
        <div className="bg-black/20 border border-white/10 rounded-xl p-4 text-white/50 text-sm">
          <p><strong className="text-white/70">Senha Geral:</strong> Configurada via variável de ambiente (SITE_GENERAL_PASSWORD). Todos que souberem podem acessar.</p>
          <p className="mt-1"><strong className="text-white/70">Senhas VIP:</strong> Individuais, com controle de uso e status. Ideais para clientes específicos.</p>
        </div>
      </div>
    </div>
  );
}
