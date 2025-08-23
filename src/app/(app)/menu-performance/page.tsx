

"use client";

import { useState, useEffect, useMemo, ReactNode } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from "recharts";
import { Recipe } from "@/data/definitions";
import { Anchor, HelpCircle, Star, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type MenuEngineeringCategory = 'Star' | 'Plowhorse' | 'Puzzle' | 'Dog';

// This would also come from Firestore in a real app
type PerformanceData = {
  menuItemId: string;
  totalSales: number;
  averageRating: number;
};

// This would also come from Firestore in a real app
export const menuPerformanceData: PerformanceData[] = [
  { menuItemId: "ef-2", totalSales: 150, averageRating: 4.8 },
  { menuItemId: "ef-3", totalSales: 120, averageRating: 4.5 },
  { menuItemId: "pg-16", totalSales: 200, averageRating: 4.9 },
  { menuItemId: "des-1", totalSales: 180, averageRating: 4.7 },
  { menuItemId: "burg-1", totalSales: 250, averageRating: 4.6 },
  { menuItemId: 'lmdcn-2', totalSales: 90, averageRating: 4.9 },
  { menuItemId: 'ec-2', totalSales: 70, averageRating: 4.2 },
  { menuItemId: 'sp-7', totalSales: 110, averageRating: 4.5 },
  { menuItemId: 'pg-14', totalSales: 130, averageRating: 4.8 },
  { menuItemId: 'ef-9', totalSales: 60, averageRating: 3.9 },
];

export type HistoricalPerformanceData = {
    month: string;
    'pg-16': number;
    'des-1': number;
    'burg-1': number;
    'lmdcn-2': number;
}

// This would also come from Firestore in a real app
export const historicalPerformanceData: HistoricalPerformanceData[] = [
  { month: "Janvier", "pg-16": 186, "des-1": 80, "burg-1": 210, "lmdcn-2": 70 },
  { month: "Février", "pg-16": 305, "des-1": 200, "burg-1": 250, "lmdcn-2": 120 },
  { month: "Mars", "pg-16": 237, "des-1": 120, "burg-1": 300, "lmdcn-2": 150 },
  { month: "Avril", "pg-16": 73, "des-1": 190, "burg-1": 280, "lmdcn-2": 110 },
  { month: "Mai", "pg-16": 209, "des-1": 130, "burg-1": 320, "lmdcn-2": 160 },
  { month: "Juin", "pg-16": 214, "des-1": 140, "burg-1": 350, "lmdcn-2": 180 },
];


type AnalyzedMenuItem = Recipe & {
  performance: PerformanceData;
  profit: number;
  categoryAnalysis: MenuEngineeringCategory;
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
    async function fetchData() {
        setIsLoading(true);
        const recipesSnapshot = await getDocs(collection(db, 'recipes'));
        const recipes = recipesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe));

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
        let categoryAnalysis: MenuEngineeringCategory;

        const isPopular = item.performance.totalSales > avgSales;
        const isProfitable = item.profit > avgProfit;

        if (isPopular && isProfitable) categoryAnalysis = 'Star';
        else if (isPopular && !isProfitable) categoryAnalysis = 'Plowhorse';
        else if (!isPopular && isProfitable) categoryAnalysis = 'Puzzle';
        else categoryAnalysis = 'Dog';

        return { ...item, categoryAnalysis };
        });

        setAnalyzedData(categorizedData);
        setIsLoading(false);
    }
    fetchData();
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
                                            <Badge variant="outline" className={cn("border-none", categoryConfig[item.categoryAnalysis].className)}>
                                                <div className="flex items-center gap-2">
                                                    {categoryConfig[item.categoryAnalysis].icon}
                                                    <span>{item.categoryAnalysis}</span>
                                                </div>
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{item.performance.totalSales}</TableCell>
                                        <TableCell className="text-right">{item.profit.toFixed(2)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{categoryConfig[item.categoryAnalysis].recommendation}</TableCell>
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
