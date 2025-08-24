
"use client";

import { useState, useEffect } from "react";
import { 
  AlertCircle, 
  BarChart, 
  Bell, 
  BookOpen, 
  Box, 
  Calendar, 
  CircleDollarSign, 
  PlusCircle, 
  TrendingUp,
  Lightbulb
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  type ChartConfig 
} from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

const salesData = [
  { category: "Entrées", value: 87 },
  { category: "Plats", value: 135 },
  { category: "Desserts", value: 58 },
];

const reservationsData = [
  { day: "Lun", value: 7 },
  { day: "Mar", value: 6 },
  { day: "Mer", value: 8 },
  { day: "Jeu", value: 7 },
  { day: "Ven", value: 9 },
  { day: "Sam", value: 8 },
  { day: "Dim", value: 7 },
];

const salesChartConfig = {
  value: { label: "Ventes" },
  'Entrées': { label: 'Entrées', color: 'hsl(var(--chart-1))' },
  'Plats': { label: 'Plats', color: 'hsl(var(--chart-1))' },
  'Desserts': { label: 'Desserts', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

const reservationsChartConfig = {
  value: { label: 'Réservations', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

const lastOrders = [
  { name: "Risotto aux champignons", time: "18:10", status: "Servi" },
  { name: "Tartare de saumon", time: "17:32", status: "Servi" },
  { name: "Cheeseburger", time: "17:15", status: "Servi" },
  { name: "Poulet rôti", time: "16:10", status: "Annulé" },
  { name: "Tiramisu", time: "12:05", status: "Annulé" },
];

const notifications = [
  {
    type: "warning",
    icon: <AlertCircle className="h-5 w-5 text-orange-500" />,
    text: "Plus d'ingrédients pour la salade César",
  },
  {
    type: "warning",
    icon: <AlertCircle className="h-5 w-5 text-orange-500" />,
    text: "Annulation de réservation",
  },
  {
    type: "info",
    icon: <Lightbulb className="h-5 w-5 text-green-500" />,
    text: "Le plat X se vend bien, augmentez son prix de 5%",
  },
];

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState<string | null>(null);

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
      setCurrentDate(new Intl.DateTimeFormat('fr-FR', options).format(now));
    };
    updateDate();
    const timer = setInterval(updateDate, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col h-full bg-background p-6 lg:p-8">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 2.69l4.95 1.65-1.65 4.95L12 7.64 8.7 9.29l-1.65-4.95L12 2.69zM3 14.31l1.65-4.95 4.95 1.65L7.95 16 3 14.31zM16.05 16l-1.65-4.95 4.95-1.65L21 14.31l-4.95 1.69zM12 21.31l-4.95-1.65 1.65-4.95L12 16.36l3.3-1.65 1.65 4.95L12 21.31z"/></svg>
          <h1 className="text-2xl font-bold font-headline">Le Singulier</h1>
        </div>
        <p className="text-muted-foreground">{currentDate ?? ''}</p>
      </header>

      <main className="flex-1 space-y-8">
        <div>
          <h2 className="text-3xl font-bold mb-6">Bonjour Chef, voici le résumé du jour !</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Commandes</CardTitle>
                <Box className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">35</p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenu</CardTitle>
                <CircleDollarSign className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">1 560 €</p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Réservations</CardTitle>
                <Calendar className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">12</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Ventes par catégorie de plats</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={salesChartConfig} className="h-64 w-full">
                <RechartsBarChart data={salesData} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="category" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="value" fill="var(--color-Entrées)" radius={4} />
                </RechartsBarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Réservations de la semaine</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={reservationsChartConfig} className="h-64 w-full">
                <LineChart data={reservationsData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} domain={[4, 10]}/>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={2} dot={{r: 4, fill: "var(--color-value)"}} activeDot={{r: 6}} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Dernières commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {lastOrders.map((order, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <p>{order.name}</p>
                    <div className="flex items-center gap-4">
                      <p className="text-muted-foreground">{order.time}</p>
                      <Badge variant={order.status === 'Servi' ? 'secondary' : 'destructive'} className={cn(
                        order.status === 'Servi' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                      )}>
                        {order.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {notifications.map((notif, index) => (
                  <li key={index} className="flex items-center gap-4">
                    {notif.icon}
                    <p>{notif.text}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="mt-8 pt-6 border-t border-border/20">
        <div className="flex flex-wrap gap-4">
          <Button variant="outline"><PlusCircle className="mr-2"/> Ajouter un plat</Button>
          <Button variant="outline"><Box className="mr-2"/> Nouvelle commande</Button>
          <Button variant="outline"><Calendar className="mr-2"/> Nouvelle réservation</Button>
          <Button variant="outline"><TrendingUp className="mr-2"/> Analyse des ventes</Button>
        </div>
      </footer>
    </div>
  );
}
