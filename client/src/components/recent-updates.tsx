import { errorToast, useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
// A API /api/dashboard/recent-updates retorna objetos simplificados (não todo PriceHistory)
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, ExternalLink, Package, RefreshCw, Sprout } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { ProductForm } from "./product-form";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface SimplifiedUpdate {
    id: string;
    type: 'ingredient' | 'product' | 'product_indirect' | 'fixed_cost';
    name: string;
    itemId: string | null; // id do ingrediente ou produto
    oldPrice: number;
    newPrice: number;
    unit?: string;
    changeType: string;
    createdAt: string;
}

interface RecentUpdates {
    ingredientUpdates: SimplifiedUpdate[];
    productUpdates: SimplifiedUpdate[];
    productIndirectUpdates: SimplifiedUpdate[]; // Nova categoria para produtos afetados por custos fixos
    fixedCostUpdates?: SimplifiedUpdate[];
}

// Helper function to format date, assuming it's available or can be defined
// If formatDate is not defined elsewhere, you might need to import or define it.
// For this example, assuming a simple date formatting function exists.
const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Helper function to get product name, assuming it's available or can be defined
// This is a placeholder and should be implemented based on how product names are managed.
const getProductName = (productId?: number): string => {
    if (!productId) return "Produto Desconhecido";
    // In a real application, you would fetch or look up the product name here.
    // For this example, we'll return a placeholder.
    return `Produto ID: ${productId}`;
};

export function RecentUpdatesCard() {
    const [, setLocation] = useLocation();
    const [isProductFormOpen, setIsProductFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>();
    const [activeTab, setActiveTab] = useState<string>("ingredients"); // Nova aba ativa
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data, isLoading, refetch } = useQuery<RecentUpdates>({
        queryKey: ["/api/dashboard/recent-updates"],
        refetchOnMount: "always",
        staleTime: 0, // Dados sempre frescos para atualizações recentes
        gcTime: 5 * 60 * 1000, // 5 minutos de cache
        refetchInterval: false, // Remover polling automático
        refetchIntervalInBackground: false,
    });

    // Debug: Log dos dados recebidos
    console.log('🔄 Recent updates data received:', {
        fixedCostUpdates: data?.fixedCostUpdates?.length || 0,
        productUpdates: data?.productUpdates?.length || 0,
        productIndirectUpdates: data?.productIndirectUpdates?.length || 0,
        ingredientUpdates: data?.ingredientUpdates?.length || 0,
    });

    const handleEditProduct = async (productId: string) => {
        try {
            const response = await apiRequest("GET", `/api/products/${productId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const productWithRecipes = await response.json();

            // Ensure the product has the required structure
            const sanitizedProduct = {
                ...productWithRecipes,
                marginPercentage: productWithRecipes.marginPercentage || "60",
                preparationTimeMinutes: productWithRecipes.preparationTimeMinutes || 60,
                recipes: productWithRecipes.recipes || []
            };

            setEditingProduct(sanitizedProduct);
            setIsProductFormOpen(true);
        } catch (error) {
            console.error("Erro ao carregar produto:", error);
            errorToast("Erro", "Erro ao carregar dados do produto. Tente novamente.");
        }
    };

    const handleFormClose = () => {
        setIsProductFormOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-updates"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });

        // Marcar que há atualizações para refresh futuro
        sessionStorage.setItem('hasRecentUpdates', 'true');
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Atualizações Recentes</CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="ingredients" className="flex items-center space-x-2">
                            <Sprout className="h-4 w-4" />
                            <span>Ingredientes</span>
                        </TabsTrigger>
                        <TabsTrigger value="products" className="flex items-center space-x-2">
                            <Package className="h-4 w-4" />
                            <span>Produtos</span>
                        </TabsTrigger>
                        <TabsTrigger value="fixed-costs" className="flex items-center space-x-2">
                            <Calculator className="h-4 w-4" />
                            <span>Custos Fixos</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="ingredients">
                        <div className="space-y-3">
                            {isLoading ? (
                                <p className="text-gray-500">Carregando atualizações de ingredientes...</p>
                            ) : data?.ingredientUpdates && data.ingredientUpdates.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Sprout className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-lg font-medium mb-2">Nenhuma atualização de ingrediente registrada</p>
                                    <p className="text-sm">As atualizações aparecerão aqui quando você modificar ingredientes.</p>
                                </div>
                            ) : (
                                data?.ingredientUpdates.slice(0, 5).map((update) => (
                                    <div key={`ingredient-${update.id}`} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Sprout className="text-green-600 w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-900">
                                                Custo atualizado de {formatCurrency(update.oldPrice ?? 0)} para {formatCurrency(update.newPrice ?? 0)}{update.unit ? ` / ${update.unit}` : ''} - <strong>{update.name}</strong>
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {(() => {
                                                    switch (update.changeType) {
                                                        case 'manual': return 'Atualização manual do preço/quantidade';
                                                        case 'auto': return 'Atualização automática';
                                                        case 'unit_conversion': return 'Conversão de unidade de medida';
                                                        default: return update.changeType === 'auto' ? 'Atualização automática' : 'Atualização manual';
                                                    }
                                                })()}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatRelativeTime(new Date(update.createdAt))}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${update.newPrice > update.oldPrice
                                                ? "bg-red-100 text-red-700"
                                                : "bg-green-100 text-green-700"
                                                }`}>
                                                {(() => {
                                                    const oldPrice = update.oldPrice ?? 0;
                                                    const newPrice = update.newPrice ?? 0;

                                                    if (oldPrice === 0) {
                                                        return newPrice > 0 ? "Novo" : "0%";
                                                    }

                                                    const percentChange = ((newPrice - oldPrice) / oldPrice) * 100;
                                                    return `${percentChange > 0 ? "+" : ""}${percentChange.toFixed(1)}%`;
                                                })()}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    if (update.itemId) {
                                                        setLocation(`/ingredients?edit=${update.itemId}`);
                                                    } else {
                                                        setLocation("/ingredients");
                                                    }
                                                }}
                                                className="px-2 py-1 h-8"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="products">
                        <div className="space-y-3">
                            {isLoading ? (
                                <p className="text-gray-500">Carregando atualizações de produtos...</p>
                            ) : (() => {
                                // Combinar produtos diretos e indiretos com deduplicação por produto
                                const productMap = new Map<string, any>();

                                // Adicionar produtos diretos
                                data?.productUpdates?.forEach(update => {
                                    const key = `${update.name}-${update.itemId}`;
                                    if (!productMap.has(key) || new Date(update.createdAt) > new Date(productMap.get(key).createdAt)) {
                                        productMap.set(key, update);
                                    }
                                });

                                // Adicionar produtos indiretos (afetados por custos fixos)
                                data?.productIndirectUpdates?.forEach(update => {
                                    const key = `${update.name}-${update.itemId}`;
                                    if (!productMap.has(key) || new Date(update.createdAt) > new Date(productMap.get(key).createdAt)) {
                                        productMap.set(key, update);
                                    }
                                });

                                const allProductUpdates = Array.from(productMap.values())
                                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                                return allProductUpdates.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-lg font-medium mb-2">Nenhuma atualização de produto registrada</p>
                                        <p className="text-sm">As atualizações aparecerão aqui quando custos de produtos forem alterados.</p>
                                    </div>
                                ) : (
                                    allProductUpdates.slice(0, 5).map((update) => (
                                        <div key={`product-${update.id}`} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Package className="text-blue-600 w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-gray-900">
                                                    Custo atualizado de {formatCurrency(update.oldPrice ?? 0)} para {formatCurrency(update.newPrice ?? 0)}{update.unit ? ` / ${update.unit}` : ''} - <strong>{update.name}</strong>
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {(() => {
                                                        switch (update.changeType) {
                                                            case 'ingredient_update': return 'Recálculo automático por alteração de ingrediente';
                                                            case 'recipe_update': return 'Atualização de receita/fórmula';
                                                            case 'product_update': return 'Atualização direta do produto';
                                                            case 'fixed_cost_create': return 'Recálculo por criação de custo fixo';
                                                            case 'fixed_cost_update': return 'Recálculo por alteração de custo fixo';
                                                            case 'fixed_cost_toggle': return 'Recálculo por ativação/desativação de custo fixo';
                                                            case 'fixed_cost_delete': return 'Recálculo por exclusão de custo fixo';
                                                            case 'work_config_impact': return 'Recálculo por mudança na configuração de trabalho';
                                                            case 'unit_conversion_impact': return 'Recálculo por conversão de unidade de ingrediente';
                                                            case 'auto': return 'Atualização automática';
                                                            default: return 'Atualização de produto';
                                                        }
                                                    })()}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatRelativeTime(new Date(update.createdAt))}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${update.newPrice > update.oldPrice
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-green-100 text-green-700"
                                                    }`}>
                                                    {(() => {
                                                        const oldPrice = update.oldPrice ?? 0;
                                                        const newPrice = update.newPrice ?? 0;

                                                        if (oldPrice === 0) {
                                                            return newPrice > 0 ? "Novo" : "0%";
                                                        }

                                                        const percentChange = ((newPrice - oldPrice) / oldPrice) * 100;
                                                        return `${percentChange > 0 ? "+" : ""}${percentChange.toFixed(1)}%`;
                                                    })()}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => update.itemId && handleEditProduct(update.itemId)}
                                                    className="px-2 py-1 h-8"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                );
                            })()}
                        </div>
                    </TabsContent>

                    <TabsContent value="fixed-costs">
                        <div className="space-y-3">
                            {isLoading ? (
                                <p className="text-gray-500">Carregando atualizações de custos fixos...</p>
                            ) : data?.fixedCostUpdates && data.fixedCostUpdates.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-lg font-medium mb-2">Nenhuma atualização de custo fixo registrada</p>
                                    <p className="text-sm">As atualizações aparecerão aqui quando você modificar custos fixos.</p>
                                </div>
                            ) : (
                                data?.fixedCostUpdates?.slice(0, 5).map((update) => (
                                    <div key={`fixed-${update.id}`} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Calculator className="text-purple-600 w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-900">
                                                {update.changeType.includes('toggle') ? (
                                                    <>
                                                        Status alterado de {update.oldPrice === 1 ? 'Ativado' : 'Desativado'} para {update.newPrice === 1 ? 'Ativado' : 'Desativado'} - <strong>{update.name}</strong>
                                                    </>
                                                ) : (
                                                    <>
                                                        Valor alterado de {formatCurrency(update.oldPrice ?? 0)} para {formatCurrency(update.newPrice ?? 0)} - <strong>{update.name}</strong>
                                                    </>
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {(() => {
                                                    switch (update.changeType) {
                                                        case 'fixed_cost_create': return 'Criação de custo fixo';
                                                        case 'fixed_cost_update': return 'Alteração de custo fixo';
                                                        case 'fixed_cost_toggle': return 'Ativação/Desativação de custo fixo';
                                                        case 'fixed_cost_delete': return 'Exclusão de custo fixo';
                                                        default: return 'Atualização';
                                                    }
                                                })()}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatRelativeTime(new Date(update.createdAt))}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>

            <ProductForm
                open={isProductFormOpen}
                onOpenChange={handleFormClose}
                product={editingProduct}
            />
        </Card>
    );
}