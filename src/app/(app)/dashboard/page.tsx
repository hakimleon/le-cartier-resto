
"use client";

import { useState, useEffect, useMemo } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { DollarSign, Users, TrendingUp, Archive, AlertTriangle, Clock, Box, Calendar, Warehouse, Bell, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD" }).format(value).replace('DZD', '').trim() + " DZD";
};

export default function DashboardPage() {
  const [salesData, setSalesData] = useState<any[]>([]);

  useEffect(() => {
    // We generate the data on the client to avoid hydration mismatch
    const data = [
      { name: "Lun", ventes: 2800, couts: 2000 },
      { name: "Mar", ventes: 1900, couts: 1500 },
      { name: "Mer", ventes: 8500, couts: 5500 },
      { name: "Jeu", ventes: 5800, couts: 4000 },
      { name: "Ven", ventes: 9800, couts: 6200 },
      { name: "Sam", ventes: 11200, couts: 7000 },
      { name: "Dim", ventes: 9500, couts: 6500 },
    ];
    setSalesData(data);
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      <AppHeader title="Dashboard">
        <div className="flex-1 max-w-md ml-auto">
            <Input placeholder="Rechercher..." className="bg-card border-border"/>
        </div>
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5"/>
                <Badge className="absolute top-1 right-1 h-4 w-4 justify-center p-0 text-xs" variant="destructive">4</Badge>
            </Button>
            <div className="h-8 w-px bg-border"></div>
            <div className="flex items-center gap-3">
                 <Avatar className="h-9 w-9">
                    <AvatarImage src="https://placehold.co/40x40.png" alt="Propriétaire" data-ai-hint="male portrait" />
                    <AvatarFallback>HA</AvatarFallback>
                </Avatar>
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">hakimleon4@gmail.com</p>
                    <p className="text-xs text-muted-foreground">Propriétaire</p>
                </div>
            </div>
        </div>
      </AppHeader>
      <main className="flex-1 p-4 lg:p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CA Aujourd'hui</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(12450)}</div>
              <p className="text-xs text-muted-foreground text-green-600">+12.5% vs hier</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-muted-foreground text-green-600">+5 vs hier</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Marge Moyenne</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68.2%</div>
              <p className="text-xs text-muted-foreground text-red-600">-2.1% vs hier</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Critique</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">2 nouveaux</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-headline">Évolution des Ventes</CardTitle>
              <CardDescription>Comparaison ventes vs coûts sur 7 jours</CardDescription>
            </CardHeader>
            <CardContent>
              {salesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                        }}
                        labelStyle={{
                            fontWeight: 'bold',
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="ventes" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary), 0.2)" name="Ventes" />
                      <Area type="monotone" dataKey="couts" stackId="1" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary), 0.2)" name="Coûts"/>
                  </AreaChart>
                  </ResponsiveContainer>
              ) : (
                  <Skeleton className="w-full h-[300px]" />
              )}
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center justify-between">
                Alertes du Jour
                <Badge variant="destructive">3</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-red-100/50 border border-red-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-full"><Box className="h-5 w-5 text-red-600" /></div>
                    <div>
                      <p className="font-semibold">Stock Faible</p>
                      <p className="text-sm text-muted-foreground">Agneau: 2kg restants</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">il y a 5 min</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100/50 border border-yellow-200">
                <div className="flex items-start justify-between">
                   <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-full"><Clock className="h-5 w-5 text-yellow-600" /></div>
                    <div>
                      <p className="font-semibold">Commande en Retard</p>
                      <p className="text-sm text-muted-foreground">Fournisseur Légumes - 30min</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">il y a 12 min</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-100/50 border border-blue-200">
                <div className="flex items-start justify-between">
                   <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full"><AlertTriangle className="h-5 w-5 text-blue-600" /></div>
                    <div>
                      <p className="font-semibold">Marge Faible</p>
                      <p className="text-sm text-muted-foreground">Plat #15 - Marge 15%</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">il y a 1h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
            {/* Top Dishes */}
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="font-headline">Top Plats de la Semaine</CardTitle>
                    <CardDescription>Classement par nombre de ventes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="font-bold text-lg text-muted-foreground">#1</div>
                            <div>
                                <p className="font-semibold">Couscous Royal <Badge variant="secondary" className="ml-2">Algérien</Badge></p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{formatCurrency(1250)}</span>
                                    <span className="text-xs">&#8226;</span>
                                    <span>45 ventes</span>
                                </div>
                            </div>
                            <div className="ml-auto text-right">
                                <p className="font-semibold">Marge</p>
                                <p className="text-sm text-green-600">68%</p>
                            </div>
                        </div>
                        <Progress value={68} className="h-2 bg-secondary" />
                    </div>
                    {/* Add more top dishes here if needed */}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Link href="/daily-menu-generator" className="block rounded-xl bg-blue-100/50 hover:bg-blue-100 p-6 transition-colors">
                <div className="flex items-center justify-center text-center flex-col h-full">
                    <div className="p-3 bg-white rounded-full mb-4">
                        <Calendar className="h-8 w-8 text-blue-600"/>
                    </div>
                    <h3 className="font-headline text-xl font-semibold">Planning du Jour</h3>
                    <p className="text-muted-foreground">Gérer les équipes</p>
                </div>
            </Link>
             <Link href="/ingredients" className="block rounded-xl bg-green-100/50 hover:bg-green-100 p-6 transition-colors">
                <div className="flex items-center justify-center text-center flex-col h-full">
                    <div className="p-3 bg-white rounded-full mb-4">
                        <Warehouse className="h-8 w-8 text-green-600"/>
                    </div>
                    <h3 className="font-headline text-xl font-semibold">Inventaire</h3>
                    <p className="text-muted-foreground">Vérifier les stocks</p>
                </div>
            </Link>

        </div>
      </main>
    </div>
  );
}
