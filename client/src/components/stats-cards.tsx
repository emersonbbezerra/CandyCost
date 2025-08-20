import { Calculator, Cookie, Sprout } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface StatsCardsProps {
    totalIngredients: number;
    totalProducts: number;
    avgProfitMargin: string;
    selectedCategory: string;
    availableCategories: string[];
    onCategoryChange: (category: string) => void;
    // Novos filtros para ingredientes
    ingredientsByCategory: { [key: string]: number };
    availableIngredientCategories: string[];
    selectedIngredientCategory: string;
    onIngredientCategoryChange: (category: string) => void;
    // Novos filtros para produtos
    productsByCategory: { [key: string]: number };
    availableProductCategories: string[];
    selectedProductCategory: string;
    onProductCategoryChange: (category: string) => void;
}

export function StatsCards({
    totalIngredients,
    totalProducts,
    avgProfitMargin,
    selectedCategory,
    availableCategories,
    onCategoryChange,
    ingredientsByCategory,
    availableIngredientCategories,
    selectedIngredientCategory,
    onIngredientCategoryChange,
    productsByCategory,
    availableProductCategories,
    selectedProductCategory,
    onProductCategoryChange
}: StatsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Card Ingredientes */}
            <Card className="border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Ingredientes</p>
                            <p className="text-3xl font-bold text-gray-900">
                                {selectedIngredientCategory === 'all'
                                    ? totalIngredients || 0
                                    : ingredientsByCategory[selectedIngredientCategory] || 0
                                }
                            </p>
                        </div>
                        <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center">
                            <Sprout className="w-7 h-7 text-green-600" />
                        </div>
                    </div>

                    {/* Controles de Categoria para Ingredientes */}
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                        <div className="flex gap-2">
                            <Select value={selectedIngredientCategory} onValueChange={onIngredientCategoryChange}>
                                <SelectTrigger className="flex-1 h-9 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                    <SelectItem value="all">Todas</SelectItem>
                                    {availableIngredientCategories.map(category => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="text-xs text-gray-500 leading-relaxed">
                            {selectedIngredientCategory === 'all'
                                ? 'Todos os ingredientes cadastrados'
                                : `Ingredientes da categoria "${selectedIngredientCategory}"`
                            }
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card Produtos */}
            <Card className="border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Produtos</p>
                            <p className="text-3xl font-bold text-gray-900">
                                {selectedProductCategory === 'all'
                                    ? totalProducts || 0
                                    : productsByCategory[selectedProductCategory] || 0
                                }
                            </p>
                        </div>
                        <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Cookie className="w-7 h-7 text-blue-600" />
                        </div>
                    </div>

                    {/* Controles de Categoria para Produtos */}
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                        <div className="flex gap-2">
                            <Select value={selectedProductCategory} onValueChange={onProductCategoryChange}>
                                <SelectTrigger className="flex-1 h-9 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                    <SelectItem value="all">Todas</SelectItem>
                                    {availableProductCategories.map(category => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="text-xs text-gray-500 leading-relaxed">
                            {selectedProductCategory === 'all'
                                ? 'Todos os produtos em produção'
                                : `Produtos da categoria "${selectedProductCategory}"`
                            }
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card Lucro com Controles Integrados */}
            <Card className="border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Lucro Médio</p>
                            <p className="text-3xl font-bold text-gray-900">{avgProfitMargin}%</p>
                        </div>
                        <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center">
                            <Calculator className="w-7 h-7 text-purple-600" />
                        </div>
                    </div>

                    {/* Controles de Categoria para Lucro */}
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                        <div className="flex gap-2">
                            <Select value={selectedCategory} onValueChange={onCategoryChange}>
                                <SelectTrigger className="flex-1 h-9 text-sm">
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
                        </div>

                        <div className="text-xs text-gray-500 leading-relaxed">
                            {selectedCategory === 'all'
                                ? 'Lucro médio de todas as categorias'
                                : `Lucro médio da categoria "${selectedCategory}"`
                            }
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
