import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Calculator,
  ChefHat,
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  History,
  LogOut,
  Menu,
  Package,
  Settings,
  TrendingUp,
  UserCircle,
  Users,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Ingredientes", href: "/ingredients", icon: Package },
  { name: "Receitas", href: "/products", icon: ChefHat },
  { name: "Custos Fixos", href: "/fixed-costs", icon: Calculator },
  { name: "Histórico de Preços", href: "/costs-history", icon: History },
  { name: "Relatórios", href: "/reports", icon: FileText },
  {
    name: "Sistema",
    icon: Settings,
    subMenu: [
      { name: "Backup & Restauração", href: "/system/backup", icon: Database },
      { name: "Configurações", href: "/settings", icon: Settings },
      { name: "Gerenciar Usuários", href: "/user-management", icon: Users, adminOnly: true },
    ]
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, isAdmin } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuName)
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getUserInitials = (firstName?: string, lastName?: string) => {
    if (!firstName) return "U";
    const initials = firstName.charAt(0) + (lastName ? lastName.charAt(0) : "");
    return initials.toUpperCase();
  };

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={toggleMobileMenu}
          className="fixed top-4 left-4 z-50 lg:hidden bg-white p-2 rounded-lg shadow-md border border-gray-200"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-gray-600" />
          ) : (
            <Menu className="w-6 h-6 text-gray-600" />
          )}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white shadow-lg border-r border-gray-200 fixed h-full z-40 flex flex-col transition-transform duration-300 ease-in-out",
          isMobile
            ? `w-80 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`
            : "w-64"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
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

        {/* Navigation with Scroll */}
        <nav className="flex-1 overflow-y-auto">
          <div className="p-4">
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
                          {item.subMenu.filter(subItem => !subItem.adminOnly || isAdmin).map((subItem) => {
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
            </ul>
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs">
                {getUserInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName ? `${user.firstName} ${user?.lastName || ''}`.trim() : user?.email}
              </p>
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  user?.role === 'admin'
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                )}>
                  {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Link href="/profile">
              <div className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                <UserCircle className="w-4 h-4" />
                <span className="text-sm">Meu Perfil</span>
              </div>
            </Link>

            <button
              onClick={() => window.location.href = '/api/logout'}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}