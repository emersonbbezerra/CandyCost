import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Calculator,
  ChefHat,
  Cookie,
  DollarSign,
  FileText,
  Home,
  LogOut,
  Menu,
  Settings,
  Sprout,
  TrendingUp,
  Users,
  User,
  X
} from "lucide-react";

const menuItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/ingredients", label: "Ingredientes", icon: Sprout },
  { path: "/products", label: "Produtos", icon: Cookie },
  { path: "/fixed-costs", label: "Custos Fixos", icon: Calculator },
  { path: "/costs-history", label: "Histórico", icon: TrendingUp },
  { path: "/reports", label: "Relatórios", icon: FileText },
];

const systemItems = [
  { path: "/settings", label: "Configurações", icon: Settings },
  { path: "/profile", label: "Perfil", icon: User },
];

export function Sidebar() {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-md shadow-lg"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-6 w-6 text-primary" />
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border z-50 
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-primary to-blue-elegant rounded-lg flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary">CandyCost</h1>
                <p className="text-xs text-muted-foreground">Gestão de Custos</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-accent to-mint-fresh rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.username}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link key={item.path} href={item.path}>
                  <div 
                    className={`sidebar-item flex items-center space-x-3 px-4 py-3 cursor-pointer ${
                      active ? 'active' : 'text-sidebar-foreground'
                    }`}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0 text-primary" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}

            {user?.role === 'admin' && (
              <Link href="/user-management">
                <div 
                  className={`sidebar-item flex items-center space-x-3 px-4 py-3 cursor-pointer ${
                    isActive('/user-management') ? 'active' : 'text-sidebar-foreground'
                  }`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Users className="w-5 h-5 flex-shrink-0 text-primary" />
                  <span className="font-medium">Usuários</span>
                </div>
              </Link>
            )}
          </nav>

          <div className="mt-8 px-4">
            <div className="h-px bg-sidebar-border mb-4"></div>
            <nav className="space-y-2">
              {systemItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link key={item.path} href={item.path}>
                    <div 
                      className={`sidebar-item flex items-center space-x-3 px-4 py-3 cursor-pointer ${
                        active ? 'active' : 'text-sidebar-foreground'
                      }`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0 text-primary" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-300"
          >
            <LogOut className="w-5 h-5 mr-3 text-primary" />
            Sair
          </Button>
        </div>
      </div>
    </>
  );
}