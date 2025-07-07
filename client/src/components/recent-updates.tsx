import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import type { PriceHistory } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Cookie, Sprout } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface PriceHistoryWithName extends PriceHistory {
    name: string;
}

interface RecentUpdates {
    ingredientUpdates: PriceHistoryWithName[];
    productUpdates: PriceHistoryWithName[];
}

export function RecentUpdatesCard() {
    const { data, isLoading } = useQuery<RecentUpdates>({
        queryKey: ["/api/dashboard/recent-updates"],
        refetchOnMount: "always",
        staleTime: 0,
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Atualizações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Ingredientes */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Ingredientes</h3>
                        {isLoading && <p>Carregando atualizações de ingredientes...</p>}
                        {!isLoading && data?.ingredientUpdates.length === 0 && (
                            <p className="text-gray-500">Nenhuma atualização de ingrediente registrada ainda.</p>
                        )}
                        {!isLoading && data?.ingredientUpdates.map((update) => (
                            <div key={update.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Sprout className="text-green-600 w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-900">
                                        Preço atualizado de {formatCurrency(parseFloat(update.oldPrice))} para {formatCurrency(parseFloat(update.newPrice))} - <strong>{update.name}</strong>
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {update.changeReason || "Atualização manual"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {formatRelativeTime(new Date(update.createdAt))}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${parseFloat(update.newPrice) > parseFloat(update.oldPrice)
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                    }`}>
                                    {parseFloat(update.newPrice) > parseFloat(update.oldPrice) ? "+" : ""}
                                    {(((parseFloat(update.newPrice) - parseFloat(update.oldPrice)) / parseFloat(update.oldPrice)) * 100).toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Produtos */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Produtos</h3>
                        {isLoading && <p>Carregando atualizações de produtos...</p>}
                        {!isLoading && data?.productUpdates.length === 0 && (
                            <p className="text-gray-500">Nenhuma atualização de produto registrada ainda.</p>
                        )}
                        {!isLoading && data?.productUpdates.map((update) => (
                            <div key={update.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Cookie className="text-blue-600 w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-900">
                                        Preço atualizado de {formatCurrency(parseFloat(update.oldPrice))} para {formatCurrency(parseFloat(update.newPrice))} - <strong>{update.name}</strong>
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {update.changeReason || "Atualização manual"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {formatRelativeTime(new Date(update.createdAt))}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${parseFloat(update.newPrice) > parseFloat(update.oldPrice)
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                    }`}>
                                    {parseFloat(update.newPrice) > parseFloat(update.oldPrice) ? "+" : ""}
                                    {(((parseFloat(update.newPrice) - parseFloat(update.oldPrice)) / parseFloat(update.oldPrice)) * 100).toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
