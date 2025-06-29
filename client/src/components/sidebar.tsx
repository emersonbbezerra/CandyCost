import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Cookie, 
  History, 
  FileText, 
  Sprout, 
  ChefHat,
  Calculator
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Ingredientes", href: "/ingredients", icon: Sprout },
  { name: "Receitas", href: "/products", icon: ChefHat },
  { name: "Histórico de Preços", href: "/history", icon: History },
  { name: "Relatórios", href: "/reports", icon: FileText },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 fixed h-full z-10">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Calculator className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">CandyCost Manager</h1>
            <p className="text-sm text-gray-500">Gestão de Custos</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
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
          })}
        </ul>
      </nav>
    </aside>
  );
}
