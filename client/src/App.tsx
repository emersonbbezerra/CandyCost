import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/sidebar";
import Dashboard from "@/pages/dashboard";
import Ingredients from "@/pages/ingredients";
import Products from "@/pages/products";
import History from "@/pages/history";
import CostsHistory from "@/pages/costs-history";
import Reports from "@/pages/reports";
import System from "@/pages/system";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="ml-64 flex-1">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/ingredients" component={Ingredients} />
          <Route path="/products" component={Products} />
          <Route path="/recipes" component={Products} />
          <Route path="/history" component={History} />
          <Route path="/costs-history" component={CostsHistory} />
          <Route path="/reports" component={Reports} />
          <Route path="/system" component={System} />
          <Route component={NotFound} />
        </Switch>
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
