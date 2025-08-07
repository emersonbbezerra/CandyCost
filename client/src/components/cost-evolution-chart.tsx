
import { formatCurrency } from "@/lib/utils";
import type { Product, PriceHistory } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface CostEvolutionChartProps {
    products: Product[];
}

interface CostEvolutionData {
    month: string;
    cost: number;
    suggestedPrice?: number;
}

export function CostEvolutionChart({ products }: CostEvolutionChartProps) {
    const [selectedProduct, setSelectedProduct] = useState<string>("general");

    // Buscar dados de evolução de custos usando o novo endpoint
    const { data: chartData = [] } = useQuery<CostEvolutionData[]>({
        queryKey: ["/api/dashboard/cost-evolution", selectedProduct],
        queryFn: async () => {
            const params = new URLSearchParams({
                months: "6"
            });
            
            if (selectedProduct !== "general") {
                params.set("productId", selectedProduct);
            }
            
            const response = await fetch(`/api/dashboard/cost-evolution?${params}`);
            const data = await response.json();
            
            // Para produtos específicos, adicionar preços sugeridos
            if (selectedProduct !== "general") {
                const selectedProductData = products.find(p => p.id.toString() === selectedProduct);
                return data.map((item: any) => ({
                    ...item,
                    suggestedPrice: selectedProductData ? 
                        item.cost * (1 + parseFloat(selectedProductData.marginPercentage || "60") / 100) 
                        : item.cost * 1.6
                }));
            }
            
            return data;
        }
    });

    // Fallback para quando não há dados
    const hasData = chartData.length > 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Evolução de Custos</span>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Custos gerais" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="general">Custos gerais</SelectItem>
                            {products.map((product) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {hasData ? (
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis
                                    dataKey="month"
                                    fontSize={12}
                                    tick={{ fill: '#6b7280' }}
                                />
                                <YAxis
                                    tickFormatter={(value) => formatCurrency(value)}
                                    fontSize={12}
                                    tick={{ fill: '#6b7280' }}
                                    label={{ value: 'Valor (R$)', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    formatter={(value, name) => [
                                        formatCurrency(Number(value)),
                                        name === 'cost' ? 'Custo de Produção' : 'Preço Sugerido'
                                    ]}
                                    labelFormatter={(label) => `Mês: ${label}`}
                                    contentStyle={{
                                        backgroundColor: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="cost"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
                                    activeDot={{ r: 8, stroke: "#3b82f6", strokeWidth: 2 }}
                                    name="cost"
                                />
                                {selectedProduct && selectedProduct !== "general" && (
                                    <Line
                                        type="monotone"
                                        dataKey="suggestedPrice"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        dot={{ fill: "#10b981", strokeWidth: 2, r: 5 }}
                                        activeDot={{ r: 8, stroke: "#10b981", strokeWidth: 2 }}
                                        name="suggestedPrice"
                                        strokeDasharray="5 5"
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-80 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <div className="mb-4">
                                <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium mb-2">Sem dados de evolução</p>
                            <p className="text-sm">
                                {selectedProduct === "general" 
                                    ? "Faça algumas alterações nos custos dos produtos para ver a evolução aqui."
                                    : "Este produto ainda não possui histórico de mudanças de custo."
                                }
                            </p>
                        </div>
                    </div>
                )}
                
                {selectedProduct && selectedProduct !== "general" && hasData && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center text-sm text-green-700">
                            <div className="flex items-center mr-6">
                                <div className="w-4 h-0.5 bg-blue-500 mr-2"></div>
                                <span>Custo de Produção</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-0.5 bg-green-500 border-t-2 border-dashed border-green-500 mr-2"></div>
                                <span>Preço Sugerido</span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
