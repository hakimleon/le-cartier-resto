
"use client";

import { useState, useEffect, useMemo } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Warehouse, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD" }).format(value).replace('DZD', '').trim() + " DZD";
};

const topDishes = [
    {
        rank: 1,
        name: "Couscous Royal",
        category: "Algérien",
        price: 1250,
        sales: 45,
        margin: 68
    },
    {
        rank: 2,
        name: "Tagine Agneau",
        category: "Maghrébin",
        price: 980,
        sales: 38,
        margin: 72
    },
    {
        rank: 3,
        name: "Paella Fruits de Mer",
        category: "International",
        price: 1120,
        sales: 32,
        margin: 65
    },
    {
        rank: 4,
        name: "Côte de Bœuf",
        category: "Français",
        price: 1450,
        sales: 28,
        margin: 58
    },
    {
        rank: 5,
        name: "Bourek Épinards",
        category: "Algérien",
        price: 650,
        sales: 25,
        margin: 78
    }
];

const quickAccessItems = [
    {
        title: "Planning du Jour",
        description: "Gérer les équipes",
        icon: Calendar,
        color: "bg-blue-100/50 hover:bg-blue-100 text-blue-600",
        href: "/planning"
    },
    {
        title: "Inventaire",
        description: "Vérifier les stocks",
        icon: Warehouse,
        color: "bg-green-100/50 hover:bg-green-100 text-green-600",
        href: "/ingredients"
    },
    {
        title: "Analytics",
        description: "Voir les rapports",
        icon: TrendingUp,
        color: "bg-purple-100/50 hover:bg-purple-100 text-purple-600",
        href: "/menu-performance"
    },
    {
        title: "Service",
        description: "Temps réel",
        icon: Clock,
        color: "bg-orange-100/50 hover:bg-orange-100 text-orange-600",
        href: "/service"
    }
]


export default function DashboardPage() {
  
  return (
    <div className="flex flex-col h-full bg-background">
      <AppHeader title="Dashboard"/>
      <main className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Dishes */}
        <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Top Plats de la Semaine</CardTitle>
                <CardDescription>Classement par nombre de ventes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {topDishes.map((dish) => (
                    <div key={dish.rank} className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted font-bold text-muted-foreground text-lg">
                            #{dish.rank}
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold">{dish.name} <Badge variant="secondary" className="ml-2">{dish.category}</Badge></div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground">Marge:</span>
                                <Progress value={dish.margin} className="h-2 w-full bg-secondary" />
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold">{formatCurrency(dish.price)}</p>
                            <p className="text-sm text-muted-foreground">{dish.sales} ventes</p>
                            <p className="text-sm font-semibold mt-1">{dish.margin}%</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
            {quickAccessItems.map((item) => (
                 <Link key={item.title} href={item.href} className={cn("block rounded-xl p-6 transition-colors", item.color)}>
                    <div className="flex flex-col h-full">
                        <item.icon className="h-8 w-8 mb-4"/>
                        <h3 className="font-headline text-xl font-semibold">{item.title}</h3>
                        <p className="text-muted-foreground/80">{item.description}</p>
                    </div>
                </Link>
            ))}
        </div>
      </main>
    </div>
  );
}
