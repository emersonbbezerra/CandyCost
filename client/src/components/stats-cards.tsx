import { Calculator, Cookie, Sprout } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface StatsCardsProps {
    totalIngredients: number;
    totalProducts: number;
    avgProfitMargin: string;
    profitType: string;
    selectedCategory: string;
    availableCategories: string[];
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
    onProfitTypeChange,
    onCategoryChange
}: StatsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-gray-600">Lucro Médio</p>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Calculator className="text-purple-600 w-6 h-6" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                        <p className="text-3xl font-bold text-gray-900">{avgProfitMargin}%</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <Select value={profitType} onValueChange={onProfitTypeChange}>
                                <SelectTrigger className="flex-1 h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                    <SelectItem value="product">Produto</SelectItem>
                                    <SelectItem value="category">Categoria</SelectItem>
                                </SelectContent>
                            </Select>
                            {profitType === 'category' && (
                                <Select value={selectedCategory} onValueChange={onCategoryChange}>
                                    <SelectTrigger className="flex-1 h-8 text-xs">
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
                        <span className="text-xs text-gray-500">
                            {profitType === 'product' ? 'média por produto' :
                                selectedCategory === 'all' ? 'média geral por categoria' :
                                    `média da categoria ${selectedCategory}`}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
