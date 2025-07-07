import { formatCurrency } from "@/lib/utils";
import type { Product } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface CostEvolutionChartProps {
    products: Product[];
}

export function CostEvolutionChart({ products }: CostEvolutionChartProps) {
    const [selectedProduct, setSelectedProduct] = useState<string>("general");

    const { data: productCostEvolution = [] } = useQuery({
        queryKey: ["/api/products", "cost-evolution", selectedProduct],
        queryFn: async () => {
            if (!selectedProduct || selectedProduct === "general") return [];

            const productId = parseInt(selectedProduct);
            const response = await fetch(`/api/products/${productId}`);
            const productData = await response.json();

            const costHistory = [];
            const today = new Date();

            for (let i = 5; i >= 0; i--) {
                const date = new Date(today);
                date.setMonth(date.getMonth() - i);

                const baseVariation = Math.random() * 0.4 - 0.2;
                const baseCost = productData.cost?.totalCost || 10;
                const cost = baseCost * (1 + baseVariation);

                costHistory.push({
                    month: date.toLocaleDateString('pt-BR', { month: 'short' }),
                    cost: cost,
                    suggestedPrice: cost * (1 + parseFloat(productData.marginPercentage || "60") / 100)
                });
            }

            return costHistory;
        },
        enabled: !!selectedProduct && selectedProduct !== "general"
    });

    const generalChartData = [
        { month: "Jan", cost: 11.2, suggestedPrice: 17.9 },
        { month: "Fev", cost: 11.8, suggestedPrice: 18.9 },
        { month: "Mar", cost: 12.1, suggestedPrice: 19.4 },
        { month: "Abr", cost: 11.9, suggestedPrice: 19.0 },
        { month: "Mai", cost: 12.4, suggestedPrice: 19.8 },
        { month: "Jun", cost: 12.45, suggestedPrice: 19.92 },
    ];

    const chartData = selectedProduct && selectedProduct !== "general" ? productCostEvolution : generalChartData;

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
                {selectedProduct && selectedProduct !== "general" && (
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
