import { formatCurrency } from "@/lib/utils";
import { Calculator, Cookie, Sprout, TrendingUp } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface StatsCardsProps {
    totalIngredients: number;
    totalProducts: number;
    avgCost: string;
    todayChanges: number;
}

export function StatsCards({ totalIngredients, totalProducts, avgCost, todayChanges }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Ingredientes</p>
                            <p className="text-3xl font-bold text-gray-900">{totalIngredients || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Sprout className="text-green-600 w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-green-600 font-medium">Ativo</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Produtos Cadastrados</p>
                            <p className="text-3xl font-bold text-gray-900">{totalProducts || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Cookie className="text-blue-600 w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-blue-600 font-medium">Ativo</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Custo Médio/Produto</p>
                            <p className="text-3xl font-bold text-gray-900">{formatCurrency(parseFloat(avgCost || "0"))}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Calculator className="text-purple-600 w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-gray-500">média calculada</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Alterações Hoje</p>
                            <p className="text-3xl font-bold text-gray-900">{todayChanges || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="text-orange-600 w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-gray-500">preços atualizados</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
