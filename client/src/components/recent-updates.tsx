import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import type { PriceHistory } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sprout, ExternalLink, Edit, Package, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useLocation } from "wouter";
import { ProductForm } from "./product-form";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PriceHistoryWithName extends PriceHistory {
    name: string;
    productId?: number; // Added productId to interface
}

interface RecentUpdates {
    ingredientUpdates: PriceHistoryWithName[];
    productUpdates: PriceHistoryWithName[];
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
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data, isLoading, refetch } = useQuery<RecentUpdates>({
        queryKey: ["/api/dashboard/recent-updates"],
        refetchOnMount: "always",
        staleTime: 30 * 60 * 1000, // 30 minutos - dados ficam válidos por mais tempo
        gcTime: 60 * 60 * 1000, // 1 hora de cache
        refetchOnWindowFocus: false, // Não recarregar no foco
        refetchInterval: false, // Remover polling automático
        refetchIntervalInBackground: false,
    });

    const handleEditProduct = async (productId: number) => {
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
            toast({
                title: "Erro",
                description: "Erro ao carregar dados do produto. Tente novamente.",
                variant: "destructive",
            });
        }
    };

    const handleFormClose = () => {
        setIsProductFormOpen(false);
        setEditingProduct(undefined);

        // Invalidar cache relacionado
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
                <div className="space-y-6">
                    {/* Ingredientes */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Ingredientes</h3>
                        {isLoading ? (
                            <p className="text-gray-500">Carregando atualizações de ingredientes...</p>
                        ) : data?.ingredientUpdates && data.ingredientUpdates.length === 0 ? (
                            <p className="text-gray-500">Nenhuma atualização de ingrediente registrada ainda.</p>
                        ) : (
                            data?.ingredientUpdates.slice(0, 3).map((update) => ( // Limit to 3 ingredients
                            <div key={`ingredient-${update.id}`} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg mb-2">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Sprout className="text-green-600 w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-900">
                                        Custo atualizado de {formatCurrency(parseFloat(update.oldPrice || "0"))} para {formatCurrency(parseFloat(update.newPrice || "0"))} - <strong>{update.name}</strong>
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {update.changeReason || "Atualização manual"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {formatRelativeTime(new Date(update.createdAt))}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${parseFloat(update.newPrice || "0") > parseFloat(update.oldPrice || "0")
                                        ? "bg-red-100 text-red-700"
                                        : "bg-green-100 text-green-700"
                                        }`}>
                                        {(() => {
                                            const oldPrice = parseFloat(update.oldPrice || "0");
                                            const newPrice = parseFloat(update.newPrice || "0");

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
                                        onClick={() => setLocation("/ingredients")}
                                        className="px-2 py-1 h-8"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        ))
                        )}
                    </div>

                    {/* Produtos */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Produtos</h3>
                        {isLoading ? (
                            <p className="text-gray-500">Carregando atualizações de produtos...</p>
                        ) : data?.productUpdates && data.productUpdates.length === 0 ? (
                            <p className="text-gray-500">Nenhuma atualização de produto registrada ainda.</p>
                        ) : (
                            data?.productUpdates.slice(0, 3).map((update) => {
                            const oldPrice = parseFloat(update.oldPrice || "0");
                            const newPrice = parseFloat(update.newPrice || "0");

                            // Validar se os preços são válidos
                            const hasValidPrices = oldPrice > 0 && newPrice > 0;
                            const percentChange = hasValidPrices ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;

                            return (
                                <div key={`product-${update.id}`} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg mb-2">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Package className="text-blue-600 w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-gray-900 font-medium truncate">
                                            {update.name}
                                        </p>
                                        <p className="text-gray-600 text-sm">
                                            {hasValidPrices ? (
                                                `Custo atualizado de ${formatCurrency(oldPrice)} para ${formatCurrency(newPrice)}`
                                            ) : (
                                                `Custo atual: ${formatCurrency(newPrice)}`
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Motivo: {update.changeReason || "Alteração automática"}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {formatDate(new Date(update.createdAt))}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            hasValidPrices && newPrice > oldPrice
                                                ? "bg-red-100 text-red-700"
                                                : hasValidPrices && newPrice < oldPrice
                                                ? "bg-green-100 text-green-700"
                                                : "bg-blue-100 text-blue-700"
                                        }`}>
                                            {hasValidPrices ? (
                                                `${percentChange > 0 ? "+" : ""}${percentChange.toFixed(1)}%`
                                            ) : (
                                                "Novo"
                                            )}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => update.productId && handleEditProduct(update.productId)}
                                            className="px-2 py-1 h-8"
                                            title="Editar produto"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                        )}
                    </div>
                </div>
            </CardContent>

            <ProductForm
                open={isProductFormOpen}
                onOpenChange={handleFormClose}
                product={editingProduct}
            />
        </Card>
    );
}