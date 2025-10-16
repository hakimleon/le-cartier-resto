
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import type { AnalyzedDish } from './page';

interface MenuAnalysisClientProps {
    analyzedDishes: AnalyzedDish[];
    initialError: string | null;
}

export default function MenuAnalysisClient({ analyzedDishes, initialError }: MenuAnalysisClientProps) {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Analyse du Menu</h1>
                <p className="text-muted-foreground">En attente d'une nouvelle implémentation...</p>
            </header>

            {initialError && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Information</AlertTitle>
                    <AlertDescription>{initialError}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}

// Le type AnalyzedDish sera défini dans page.tsx
export type { AnalyzedDish } from './page';
