

"use client";

import { useState, useEffect, useMemo, ReactNode } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from "recharts";
import { recipes, menuPerformanceData, Recipe, PerformanceData, historicalPerformanceData, HistoricalPerformanceData } from "@/data/mock-data";
import { Anchor, HelpCircle, Star, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";

type MenuEngineeringCategory = 'Star' | 'Plowhorse' | 'Puzzle' | 'Dog';

type AnalyzedMenuItem = Recipe & {
  performance: PerformanceData;
  profit: number;
  category: MenuEngineeringCategory;
};

const categoryConfig: Record<MenuEngineeringCategory, {
    icon: ReactNode;
    description: string;
    recommendation: string;
    className: string;
}> = {
    Star: {
        icon: <Star className="h-5 w-5 text-yellow-500" />,
        description: "Haute rentabilité, haute popularité.",
        recommendation: "Maintenir la qualité, mettre en avant.",
        className: "bg-yellow-100 text-yellow-800",
    },
    Plowhorse: {
        icon: <Anchor className="h-5 w-5 text-blue-500" />,
        description: "Basse rentabilité, haute popularité.",
        recommendation: "Augmenter le prix ou réduire les coûts.",
        className: "bg-blue-100 text-blue-800",
    },
    Puzzle: {
        icon: <HelpCircle className="h-5 w-5 text-purple-500" />,
        description: "Haute rentabilité, basse popularité.",
        recommendation: "Améliorer la visibilité, renommer, suggérer.",
        className: "bg-purple-100 text-purple-800",
    },
    Dog: {
        icon: <TrendingDown className="h-5 w-5 text-red-500" />,
        description: "Basse rentabilité, basse popularité.",
        recommendation: "Envisager de retirer du menu.",
        className: "bg-red-100 text-red-800",
    },
};

const chartConfig: ChartConfig = {
    'pg-16': { label: 'Filet de Boeuf', color: 'hsl(var(--chart-1))' },
    'des-1': { label: 'Tentation Chocolat', color: 'hsl(var(--chart-2))' },
    'burg-1': { label: 'Burger Gourmet', color: 'hsl(var(--chart-3))' },
    'lmdcn-2': { label: 'Rechta Royale', color: 'hsl(var(--chart-4))' },
};

export default function MenuPerformancePage() {
  const [analyzedData, setAnalyzedData] = useState<AnalyzedMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const data = recipes
      .map(item => {
        const performance = menuPerformanceData.find(p => p.menuItemId === item.id);
        if (!performance) return null;

        const profit = (item.price - item.cost) / 100;
        return { ...item, performance, profit };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const totalSales = data.reduce((acc, item) => acc + item.performance.totalSales, 0);
    const totalProfit = data.reduce((acc, item) => acc + (item.profit * item.performance.totalSales), 0);
    const avgSales = totalSales / data.length;
    const avgProfit = totalProfit / totalSales;

    const categorizedData = data.map(item => {
      const isPopular = item.performance.totalSales > avgSales;
      const isProfitable = item.profit > avgProfit;
      let category: MenuEngineeringCategory;

      if (isPopular && isProfitable) category = 'Star';
      else if (isPopular && !isProfitable) category = 'Plowhorse';
      else if (!isPopular && isProfitable) category = 'Puzzle';
      else category = 'Dog';

      return { ...item, category };
    });

    setAnalyzedData(categorizedData);
    setIsLoading(false);
  }, []);

  const topPerformingItems = useMemo(() => {
    return analyzedData
      .filter(item => item.performance.totalSales > 0)
      .sort((a, b) => b.performance.totalSales - a.performance.totalSales)
      .slice(0, 7);
  }, [analyzedData]);

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Analyse de Performance du Menu" />
      <main className="flex-1 p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card className="shadow-lg h-full">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Matrice d'Ingénierie du Menu</CardTitle>
                        <CardDescription>Analyse de la rentabilité et de la popularité de chaque plat.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Plat</TableHead>
                                    <TableHead className="text-center">Catégorie</TableHead>
                                    <TableHead className="text-right">Ventes</TableHead>
                                    <TableHead className="text-right">Marge (€)</TableHead>
                                    <TableHead>Recommandation</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analyzedData.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={cn("border-none", categoryConfig[item.category].className)}>
                                                <div className="flex items-center gap-2">
                                                    {categoryConfig[item.category].icon}
                                                    <span>{item.category}</span>
                                                </div>
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{item.performance.totalSales}</TableCell>
                                        <TableCell className="text-right">{item.profit.toFixed(2)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{categoryConfig[item.category].recommendation}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <div className="flex flex-col gap-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Légende</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {Object.entries(categoryConfig).map(([key, value]) => (
                            <div key={key} className="flex items-start gap-3">
                                <div className="p-1 rounded-full bg-muted">{value.icon}</div>
                                <div>
                                    <p className="font-semibold">{key}</p>
                                    <p className="text-sm text-muted-foreground">{value.description}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Top 7 des Ventes</CardTitle>
                         <CardDescription>Plats les plus populaires du mois dernier.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={topPerformingItems} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={100} 
                                    tickLine={false} 
                                    axisLine={false}
                                    tick={{ fontSize: 12 }}
                                    interval={0}
                                />
                                <Tooltip
                                    cursor={{fill: 'hsl(var(--muted))'}}
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        return (
                                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="grid grid-cols-2 gap-2">
                                              <div className="flex flex-col">
                                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                  Plat
                                                </span>
                                                <span className="font-bold text-muted-foreground">
                                                  {payload[0].payload.name}
                                                </span>
                                              </div>
                                              <div className="flex flex-col">
                                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                  Ventes
                                                </span>
                                                <span className="font-bold">
                                                  {payload[0].value}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      }

                                      return null
                                    }}
                                />
                                <Bar dataKey="performance.totalSales" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Saisonnalité des Ventes</CardTitle>
                <CardDescription>
                    Évolution des ventes des plats phares sur les 6 derniers mois.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <LineChart
                        accessibilityLayer
                        data={historicalPerformanceData}
                        margin={{
                            top: 20,
                            right: 20,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        {Object.keys(chartConfig).map((key) => (
                            <Line
                                key={key}
                                dataKey={key}
                                type="monotone"
                                stroke={`var(--color-${key})`}
                                strokeWidth={2}
                                dot={false}
                            />
                        ))}
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
