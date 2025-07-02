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
import History from "@/pages/history";
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
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
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="lg:ml-64 flex-1 pt-16 lg:pt-0">
        <div className="p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/ingredients" component={Ingredients} />
            <Route path="/products" component={Products} />
            <Route path="/recipes" component={Products} />
            <Route path="/history" component={History} />
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
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
