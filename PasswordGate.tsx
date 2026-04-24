import { useState, useEffect, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Zap, Lock, Eye, EyeOff, Timer } from "lucide-react";
import { toast } from "sonner";

const SESSION_KEY = "walk_access_granted";
const SESSION_CODE_KEY = "walk_access_code";
const SESSION_TYPE_KEY = "walk_access_type";
const SESSION_LOGIN_TIME_KEY = "walk_access_login_time";
const SESSION_TIMEOUT_KEY = "walk_access_timeout_minutes";

interface PasswordGateProps {
  children: React.ReactNode;
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const [accessGranted, setAccessGranted] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [accessType, setAccessType] = useState<string | null>(null);

  // Timer state
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const validateMutation = trpc.access.validate.useMutation();

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_CODE_KEY);
    sessionStorage.removeItem(SESSION_TYPE_KEY);
    sessionStorage.removeItem(SESSION_LOGIN_TIME_KEY);
    sessionStorage.removeItem(SESSION_TIMEOUT_KEY);
    setAccessGranted(false);
    setAccessType(null);
    setRemainingSeconds(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback((loginTimeMs: number, timeoutMinutes: number) => {
    const totalMs = timeoutMinutes * 60 * 1000;
    const total = timeoutMinutes * 60;
    setTotalSeconds(total);

    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const updateRemaining = () => {
      const elapsed = Date.now() - loginTimeMs;
      const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearSession();
        toast.error("Tempo de acesso expirado! Faça login novamente.", { duration: 5000 });
      }
    };

    updateRemaining();
    timerRef.current = setInterval(updateRemaining, 1000);
  }, [clearSession]);

  useEffect(() => {
    // Check existing session
    const sessionAccess = sessionStorage.getItem(SESSION_KEY);
    if (sessionAccess === "true") {
      const savedType = sessionStorage.getItem(SESSION_TYPE_KEY);
      const loginTime = sessionStorage.getItem(SESSION_LOGIN_TIME_KEY);
      const savedTimeout = sessionStorage.getItem(SESSION_TIMEOUT_KEY);

      if (savedType === "vip" && loginTime) {
        const loginTimeMs = parseInt(loginTime, 10);
        const timeoutMinutes = savedTimeout ? parseInt(savedTimeout, 10) : 30;
        const elapsed = Date.now() - loginTimeMs;
        const totalMs = timeoutMinutes * 60 * 1000;

        if (elapsed >= totalMs) {
          // Already expired
          clearSession();
          toast.error("Tempo de acesso expirado! Faça login novamente.");
          return;
        }

        setAccessGranted(true);
        setAccessType("vip");
        startTimer(loginTimeMs, timeoutMinutes);
      } else {
        // General password - no timer
        setAccessGranted(true);
        if (savedType) setAccessType(savedType);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [clearSession, startTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error("Digite a senha de acesso");
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateMutation.mutateAsync({ code: password });
      if (result.valid) {
        const now = Date.now();
        setAccessGranted(true);
        setAccessType(result.type);
        sessionStorage.setItem(SESSION_KEY, "true");
        sessionStorage.setItem(SESSION_CODE_KEY, password);
        sessionStorage.setItem(SESSION_TYPE_KEY, result.type);

        if (result.type === "vip") {
          // Use the individual timeout from the server response
          const timeoutMinutes = (result as any).expiresInMinutes || 30;
          sessionStorage.setItem(SESSION_LOGIN_TIME_KEY, now.toString());
          sessionStorage.setItem(SESSION_TIMEOUT_KEY, timeoutMinutes.toString());
          startTimer(now, timeoutMinutes);
          toast.success(`Acesso VIP concedido${result.clientName ? ` - ${result.clientName}` : ""}! Tempo: ${timeoutMinutes} minutos`);
        } else {
          toast.success("Acesso concedido!");
        }
      } else {
        toast.error("Senha incorreta. Tente novamente.");
        setPassword("");
      }
    } catch (error) {
      toast.error("Erro ao validar senha. Tente novamente.");
    } finally {
      setIsValidating(false);
    }
  };

  if (accessGranted) {
    // Show timer bar for VIP users
    const showTimer = accessType === "vip" && remainingSeconds !== null && totalSeconds > 0;
    const percentage = showTimer ? (remainingSeconds! / totalSeconds) * 100 : 100;
    const minutes = showTimer ? Math.floor(remainingSeconds! / 60) : 0;
    const seconds = showTimer ? remainingSeconds! % 60 : 0;

    const getBarColor = () => {
      if (percentage > 60) return 'bg-green-500';
      if (percentage > 30) return 'bg-yellow-500';
      if (percentage > 10) return 'bg-orange-500';
      return 'bg-red-500';
    };

    const getTextColor = () => {
      if (percentage > 60) return 'text-green-400';
      if (percentage > 30) return 'text-yellow-400';
      if (percentage > 10) return 'text-orange-400';
      return 'text-red-400';
    };

    const isUrgent = percentage <= 20;

    return (
      <>
        {/* Timer bar fixo no topo para VIP */}
        {showTimer && (
          <div className="fixed top-0 left-0 right-0 z-[100]">
            {/* Barra de progresso */}
            <div className="w-full h-1.5 bg-black/50">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${getBarColor()}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            {/* Timer display */}
            <div className={`flex items-center justify-center gap-2 py-1.5 px-4 ${
              isUrgent ? 'bg-red-900/90 animate-pulse' : 'bg-black/70'
            } backdrop-blur-sm`}>
              <Timer className={`w-4 h-4 ${getTextColor()}`} />
              <span className={`font-mono font-bold text-sm ${getTextColor()}`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-white/50 text-xs">restante</span>
              {isUrgent && (
                <span className="text-red-400 text-xs font-bold ml-2 animate-pulse">
                  Tempo acabando!
                </span>
              )}
            </div>
          </div>
        )}
        {/* Adicionar padding-top para compensar a barra fixa */}
        <div className={showTimer ? 'pt-[52px]' : ''}>
          {children}
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-black/60 backdrop-blur-xl border border-primary/30 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">WALK CONTAS</h1>
            <p className="text-white/60 text-sm mt-1">Acesso Restrito</p>
          </div>

          {/* Lock icon */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Digite a senha de acesso
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha de acesso"
                  className="w-full px-4 py-3 bg-white text-black text-lg text-center font-medium rounded-lg border-2 border-black focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                  autoFocus
                  disabled={isValidating}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isValidating || !password.trim()}
              className="w-full px-4 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-primary/30"
            >
              {isValidating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Validando...
                </span>
              ) : (
                "ENTRAR"
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-white/40 text-xs mt-6">
            Solicite sua senha de acesso via WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
}
