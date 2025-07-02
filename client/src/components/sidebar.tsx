import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Cookie, 
  History, 
  FileText, 
  Sprout, 
  ChefHat,
  Calculator,
  TrendingUp,
  Settings,
  LogOut,
  User,
  UserCircle,
  Shield,
  Users,
  ChevronDown,
  ChevronRight,
  Database,
  Cog
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Ingredientes", href: "/ingredients", icon: Sprout },
  { name: "Receitas", href: "/products", icon: ChefHat },
  { name: "Histórico de Preços", href: "/history", icon: History },
  { name: "Histórico de Custos", href: "/costs-history", icon: TrendingUp },
  { name: "Relatórios", href: "/reports", icon: FileText },
  { 
    name: "Sistema", 
    icon: Settings,
    subMenu: [
      { name: "Backup & Restauração", href: "/system/backup", icon: Database },
      { name: "Configurações", href: "/settings", icon: Cog },
    ]
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const getUserInitials = (firstName: string, lastName?: string) => {
    if (!firstName) return "U";
    const initials = firstName.charAt(0) + (lastName ? lastName.charAt(0) : "");
    return initials.toUpperCase();
  };

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 fixed h-full z-10 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Calculator className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">CandyCost</h1>
            <p className="text-sm text-gray-500">Gestão de Custos</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          {navigation.map((item) => {
            if (item.subMenu) {
              // Menu with submenu
              const isExpanded = expandedMenus.includes(item.name);
              const isSubMenuActive = item.subMenu.some(subItem => location === subItem.href);
              
              return (
                <li key={item.name}>
                  <div
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium cursor-pointer justify-between",
                      isSubMenuActive
                        ? "text-primary bg-primary/10"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                    {isExpanded ? 
                      <ChevronDown className="w-4 h-4" /> : 
                      <ChevronRight className="w-4 h-4" />
                    }
                  </div>
                  {isExpanded && (
                    <ul className="ml-4 mt-2 space-y-1">
                      {item.subMenu.map((subItem) => {
                        const isSubActive = location === subItem.href;
                        return (
                          <li key={subItem.name}>
                            <Link href={subItem.href}>
                              <div
                                className={cn(
                                  "flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors font-medium cursor-pointer",
                                  isSubActive
                                    ? "text-primary bg-primary/10"
                                    : "text-gray-600 hover:bg-gray-50"
                                )}
                              >
                                <subItem.icon className="w-4 h-4" />
                                <span className="text-sm">{subItem.name}</span>
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            } else {
              // Regular menu item
              const isActive = location === item.href;
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium cursor-pointer",
                        isActive
                          ? "text-primary bg-primary/10"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                </li>
              );
            }
          })}
          
          {/* Admin-only menu items */}
          {isAdmin && (
            <li>
              <Link href="/user-management">
                <div
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium cursor-pointer",
                    location === "/user-management"
                      ? "text-primary bg-primary/10"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Users className="w-5 h-5" />
                  <span>Usuários</span>
                </div>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* User section at bottom */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-white">
              {user ? getUserInitials(user.firstName, user.lastName) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName || "Usuário"} {user?.lastName || ""}
            </p>
            <div className="flex items-center space-x-1">
              {isAdmin && <Shield className="h-3 w-3 text-amber-500" />}
              <p className="text-xs text-gray-500">
                {isAdmin ? "Administrador" : "Usuário"}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Link href="/profile">
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center space-x-2"
            >
              <UserCircle className="h-4 w-4" />
              <span>Meu Perfil</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center space-x-2"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
