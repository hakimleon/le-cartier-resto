
"use client";

import React, { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { RecipePDFDocument } from './RecipePDFDocument';
import type { Recipe, Preparation, FullRecipeIngredient, FullRecipePreparation } from '@/lib/types';

interface PrintLinkProps {
    recipe: Recipe | Preparation;
    ingredients: FullRecipeIngredient[];
    preparations: FullRecipePreparation[];
    totalCost: number;
    className?: string;
}

export const PrintLink: React.FC<PrintLinkProps> = ({ recipe, ingredients, preparations, totalCost, className }) => {
    const [isClient, setIsClient] = useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    const doc = <RecipePDFDocument recipe={recipe} ingredients={ingredients} preparations={preparations} totalCost={totalCost} />;
    const fileName = `${recipe.name.replace(/ /g, '_')}.pdf`;

    if (!isClient) {
        return (
            <Button variant="outline" className={className} disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Chargement...
            </Button>
        );
    }
    
    return (
         <PDFDownloadLink document={doc} fileName={fileName}>
            {({ blob, url, loading, error }) => (
                <Button variant="outline" className={className} disabled={loading}>
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Printer className="mr-2 h-4 w-4" />
                    )}
                    {loading ? 'Génération...' : 'Imprimer'}
                </Button>
            )}
        </PDFDownloadLink>
    );
};
