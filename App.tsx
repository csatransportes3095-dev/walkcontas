import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdminCodes from "./pages/AdminCodes";
import AdminCoupons from "./pages/AdminCoupons";
import AdminPanel from "./pages/AdminPanel";
import PasswordGate from "./components/PasswordGate";

// WALK ARTES - Design Energético e Moderno
function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/admin"} component={AdminPanel} />
      <Route path={"/admin/codes"} component={AdminCodes} />
      <Route path={"/admin/coupons"} component={AdminCoupons} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <PasswordGate>
            <Router />
          </PasswordGate>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
