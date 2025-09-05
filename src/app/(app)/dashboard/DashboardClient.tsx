
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LucideIcon, AlertTriangle, ChefHat, BookCopy, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryChart } from "./CategoryChart";

// Map string identifiers to actual icon components
const iconMap: Record<string, LucideIcon> = {
    'chef-hat': ChefHat,
    'book-copy': BookCopy,
    'package': Package,
    'alert-triangle': AlertTriangle,
};


interface StatCard {
    title: string;
    value: number;
    icon: string; // Now a string identifier
    description: string;
    isCritical?: boolean;
}

interface DashboardClientProps {
    stats: StatCard[];
    categoryDistribution: { name: string; value: number }[];
    error: string | null;
}

export default function DashboardClient({ stats, categoryDistribution, error }: DashboardClientProps) {
  return (
    <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Tableau de Bord</h1>
                <p className="text-muted-foreground">Vue d'ensemble de votre activité.</p>
            </div>
        </header>
        
        {error && (
             <Alert variant="destructive" className="max-w-2xl mx-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erreur de chargement</AlertTitle>
                <AlertDescription>
                    {error}
                </AlertDescription>
            </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
                const Icon = iconMap[stat.icon];
                return (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            {Icon && <Icon className={cn("h-4 w-4 text-muted-foreground", stat.isCritical && stat.value > 0 && "text-destructive")} />}
                        </CardHeader>
                        <CardContent>
                            <div className={cn("text-2xl font-bold", stat.isCritical && stat.value > 0 && "text-destructive")}>
                                {stat.value}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                )
            })}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-12 lg:col-span-4">
                <CardHeader>
                    <CardTitle>Répartition par Catégorie</CardTitle>
                    <CardDescription>Visualisation du nombre de plats dans chaque catégorie du menu.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <CategoryChart data={categoryDistribution} />
                </CardContent>
            </Card>
            <Card className="col-span-12 lg:col-span-3">
                 <CardHeader>
                    <CardTitle>Activité Récente</CardTitle>
                     <CardDescription>Les derniers mouvements et modifications.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex h-[300px] items-center justify-center rounded-lg border-2 border-dashed">
                        <p className="text-muted-foreground text-sm">À venir...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
