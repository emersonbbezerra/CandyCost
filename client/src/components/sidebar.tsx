import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Calculator,
  Cookie,
  FileText,
  Home,
  LogOut,
  Menu,
  Settings,
  Sprout,
  TrendingUp,
  User,
  Users,
  X
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const menuItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/ingredients", label: "Ingredientes", icon: Sprout },
  { path: "/products", label: "Produtos", icon: Cookie },
  { path: "/fixed-costs", label: "Custos Fixos", icon: Calculator },
  { path: "/costs-history", label: "Histórico", icon: TrendingUp },
  { path: "/reports", label: "Relatórios", icon: FileText },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { user, logout, isLogoutPending } = useAuth();

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
          <div className="flex items-center justify-center">
            <img src="/logo.png" alt="CandyCost" className="h-18 w-auto" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className={`w-full justify-start text-left ${isActive(item.path)
                      ? "bg-pink-600 text-white hover:bg-pink-700"
                      : "text-gray-700 hover:bg-gray-100"
                      }`}
                    onClick={() => {
                      setIsOpen(false);
                      setSettingsOpen(false);
                    }}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              </li>
            ))}
            {/* Configurações com submenu */}
            <li>
              <Button
                variant={isActive("/settings") ? "default" : "ghost"}
                className={`w-full justify-start text-left flex items-center ${isActive("/settings")
                  ? "bg-pink-600 text-white hover:bg-pink-700"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
                onClick={() => {
                  // Navega para a página de configurações e garante submenu aberto
                  if (location !== '/settings') navigate('/settings');
                  setSettingsOpen(true);
                  // Fecha menu mobile após navegação
                  setIsOpen(false);
                }}
              >
                <Settings className="h-4 w-4 mr-3" />
                Configurações
                <span className="ml-auto">{settingsOpen ? "▲" : "▼"}</span>
              </Button>
              {/* Submenu (visível para todos). A proteção acontece dentro das páginas (campos desabilitados para não-admin) */}
              {settingsOpen && (
                <ul className="ml-8 mt-2 space-y-1">
                  <li>
                    <Link href="/user-management">
                      <Button
                        variant={isActive("/user-management") ? "default" : "ghost"}
                        className={`w-full justify-start text-left ${isActive("/user-management")
                          ? "bg-pink-600 text-white hover:bg-pink-700"
                          : "text-gray-700 hover:bg-gray-100"
                          }`}
                        onClick={() => setIsOpen(false)}
                      >
                        <Users className="h-4 w-4 mr-3" />
                        Usuários
                      </Button>
                    </Link>
                  </li>
                  <li>
                    <Link href="/system">
                      <Button
                        variant={isActive("/system") ? "default" : "ghost"}
                        className={`w-full justify-start text-left ${isActive("/system")
                          ? "bg-pink-600 text-white hover:bg-pink-700"
                          : "text-gray-700 hover:bg-gray-100"
                          }`}
                        onClick={() => setIsOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Sistema
                      </Button>
                    </Link>
                  </li>
                </ul>
              )}
            </li>
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