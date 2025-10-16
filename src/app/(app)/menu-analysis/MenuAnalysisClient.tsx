
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, BarChart3, Beef, Bird, Fish, Leaf, CookingPot } from 'lucide-react';
import { AnalyzedDish } from './page';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface MenuAnalysisClientProps {
    analyzedDishes: AnalyzedDish[];
    initialError: string | null;
}

const proteinCategoryConfig = {
    'Viandes Rouges': { icon: Beef, color: 'text-red-600', bg: 'bg-red-50' },
    'Volailles': { icon: Bird, color: 'text-amber-600', bg: 'bg-amber-50' },
    'Poissons & Fruits de Mer': { icon: Fish, color: 'text-sky-600', bg: 'bg-sky-50' },
    'Végétarien': { icon: Leaf, color: 'text-green-600', bg: 'bg-green-50' },
};

export default function MenuAnalysisClient({ analyzedDishes, initialError }: MenuAnalysisClientProps) {

    const dishesByCategory = useMemo(() => {
        const grouped: Record<string, AnalyzedDish[]> = {
            'Viandes Rouges': [],
            'Volailles': [],
            'Poissons & Fruits de Mer': [],
            'Végétarien': [],
        };
        analyzedDishes.forEach(dish => {
            grouped[dish.proteinCategory].push(dish);
        });
        return grouped;
    }, [analyzedDishes]);

    const accompanimentFrequency = useMemo(() => {
        const freq = new Map<string, { name: string; count: number; type: 'Garniture' | 'Préparation', id: string }>();
        analyzedDishes.forEach(dish => {
            dish.accompaniments.forEach(acc => {
                if (freq.has(acc.name)) {
                    freq.get(acc.name)!.count++;
                } else {
                    freq.set(acc.name, { name: acc.name, count: 1, type: acc.type, id: acc.id });
                }
            });
        });
        return Array.from(freq.values()).sort((a, b) => b.count - a.count);
    }, [analyzedDishes]);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Analyse du Menu</h1>
                <p className="text-muted-foreground">Vue d'ensemble des plats, protéines et accompagnements pour optimiser votre production.</p>
            </header>

            {initialError && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur de chargement</AlertTitle>
                    <AlertDescription>{initialError}</AlertDescription>
                </Alert>
            )}
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5"/>Top des Accompagnements</CardTitle>
                    <CardDescription>Classement des accompagnements les plus utilisés sur votre menu actif.</CardDescription>
                </CardHeader>
                 <CardContent>
                    {accompanimentFrequency.length > 0 ? (
                        <div className="flex flex-wrap gap-4">
                            {accompanimentFrequency.map((acc, index) => (
                                <div key={acc.name} className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                                    <div className="text-lg font-bold text-primary">#{index + 1}</div>
                                    <div>
                                        <p className="font-semibold">{acc.name}</p>
                                        <p className="text-sm text-muted-foreground">Utilisé dans <span className="font-bold text-foreground">{acc.count}</span> plat{acc.count > 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="text-sm text-muted-foreground text-center py-8">Aucun accompagnement commun trouvé.</p>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(dishesByCategory).map(([category, dishes]) => {
                    const config = proteinCategoryConfig[category as keyof typeof proteinCategoryConfig];
                    if (!dishes || dishes.length === 0) return null;

                    const categoryAccompaniments = new Map<string, { count: number, type: 'Garniture' | 'Préparation', id: string }>();
                     dishes.forEach(dish => {
                        dish.accompaniments.forEach(acc => {
                            if (categoryAccompaniments.has(acc.name)) {
                                categoryAccompaniments.get(acc.name)!.count++;
                            } else {
                                categoryAccompaniments.set(acc.name, { count: 1, type: acc.type, id: acc.id });
                            }
                        });
                    });
                     const sortedCategoryAccompaniments = Array.from(categoryAccompaniments.entries()).sort((a, b) => b[1].count - a[1].count);

                    return (
                        <Card key={category} className={`overflow-hidden ${config.bg}`}>
                            <CardHeader className="border-b" style={{ borderColor: config.color.replace('text-', 'border-').replace('-600', '-200') }}>
                                <CardTitle className={`flex items-center gap-2 ${config.color}`}>
                                    <config.icon className="h-5 w-5"/>
                                    <span>{category}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Plats</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-sm">
                                       {dishes.map(dish => (
                                           <li key={dish.id}><Link href={`/menu/${dish.id}`} className="hover:underline">{dish.name}</Link></li>
                                       ))}
                                    </ul>
                                </div>
                                <div className="border-t pt-4">
                                     <h4 className="font-semibold text-sm mb-2">Accompagnements pour cette catégorie</h4>
                                     <div className="flex flex-wrap gap-2">
                                         {sortedCategoryAccompaniments.map(([name, { count, type, id }]) => (
                                             <Badge key={name} variant="secondary" className="text-xs">
                                                 {name} (x{count})
                                             </Badge>
                                         ))}
                                     </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
