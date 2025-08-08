import { formatCurrency } from "@/lib/utils";
import { Calculator, Cookie, Sprout, TrendingUp } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface StatsCardsProps {
    totalIngredients: number;
    totalProducts: number;
    avgProfitMargin: string;
    profitType: string;
    selectedCategory: string;
    availableCategories: string[];
    todayChanges: number;
    onProfitTypeChange: (type: string) => void;
    onCategoryChange: (category: string) => void;
}

export function StatsCards({ 
    totalIngredients, 
    totalProducts, 
    avgProfitMargin, 
    profitType, 
    selectedCategory,
    availableCategories,
    todayChanges, 
    onProfitTypeChange,
    onCategoryChange 
}: StatsCardsProps) {
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
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-600">Lucro Médio</p>
                                <div className="flex gap-1">
                                    <Select value={profitType} onValueChange={onProfitTypeChange}>
                                        <SelectTrigger className="w-24 h-6 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px] overflow-y-auto">
                                            <SelectItem value="product">Produto</SelectItem>
                                            <SelectItem value="category">Categoria</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {profitType === 'category' && (
                                        <Select value={selectedCategory} onValueChange={onCategoryChange}>
                                            <SelectTrigger className="w-32 h-6 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[200px] overflow-y-auto">
                                                <SelectItem value="all">Todas</SelectItem>
                                                {availableCategories.map(category => (
                                                    <SelectItem key={category} value={category}>
                                                        {category}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{avgProfitMargin}%</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Calculator className="text-purple-600 w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-gray-500">
                            {profitType === 'product' ? 'média por produto' : 
                             selectedCategory === 'all' ? 'média geral por categoria' : 
                             `média da categoria ${selectedCategory}`}
                        </span>
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
