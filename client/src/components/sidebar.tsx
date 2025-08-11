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
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout, isLogoutPending } = useAuth();

  const adminItems = user?.role === 'admin' ? [
    { path: "/user-management", label: "Usuários", icon: Users },
    { path: "/system", label: "Sistema", icon: Settings },
  ] : [];

  const allMenuItems = [...menuItems, ...adminItems, ...systemItems];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:z-auto
        w-64 flex flex-col
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ChefHat className="h-8 w-8 text-pink-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">CandyCost</h1>
              <p className="text-sm text-gray-600">Sistema de Custos</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {allMenuItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className={`w-full justify-start text-left ${
                      isActive(item.path)
                        ? "bg-pink-600 text-white hover:bg-pink-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info and Logout */}
        <div className="p-4 border-t border-gray-200">
          <div className="mb-4 bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.firstName || 'Usuário'
                  }
                </p>
                <p className="text-xs text-gray-600 truncate">{user?.email}</p>
              </div>
            </div>
            {user?.role === 'admin' && (
              <div className="flex justify-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                  <Settings className="w-3 h-3 mr-1" />
                  Administrador
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Link href="/profile">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <User className="h-4 w-4 mr-3" />
                Meu Perfil
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              disabled={isLogoutPending}
            >
              <LogOut className="h-4 w-4 mr-3" />
              {isLogoutPending ? "Saindo..." : "Sair da Conta"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}