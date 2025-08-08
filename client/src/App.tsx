import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Ingredients from "@/pages/ingredients";
import Products from "@/pages/products";
import FixedCosts from "@/pages/fixed-costs";
import CostsHistory from "@/pages/costs-history";
import Reports from "@/pages/reports";
import System from "@/pages/system";
import Settings from "@/pages/settings";
import UserManagement from "@/pages/user-management";
import UserManagementAdmin from "@/pages/user-management-admin";
import Profile from "@/pages/profile-simple";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-main">
        <div className="text-center animate-fadeInUp">
          <div className="spinner-modern mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-pink-primary mb-2">CandyCost</h2>
          <p className="text-muted-foreground">Carregando sua aplicação...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show main app if authenticated
  return (
    <div className="min-h-screen flex bg-gradient-main">
      <Sidebar />
      <main className="flex-1 pt-16 lg:pt-0 bg-transparent">
        <div className="animate-fadeInUp">
        <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/ingredients" component={Ingredients} />
            <Route path="/products" component={Products} />
            <Route path="/recipes" component={Products} />
            <Route path="/fixed-costs" component={FixedCosts} />
            <Route path="/costs-history" component={CostsHistory} />
            <Route path="/reports" component={Reports} />
            <Route path="/system" component={System} />
            <Route path="/system/backup" component={System} />
            <Route path="/settings" component={Settings} />
            <Route path="/profile" component={Profile} />
            {user?.role === 'admin' && <Route path="/user-management" component={UserManagementAdmin} />}
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-main">
        <Toaster />
        <Router />
      </div>
    </QueryClientProvider>
  );
}

export default App;