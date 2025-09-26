
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import type { Recipe, Preparation, FullRecipeIngredient, FullRecipePreparation } from '@/lib/types';

// We'll dynamically import the PDF components only when needed.
const RecipePDFDocumentPromise = import('@/components/pdf/RecipePDFDocument').then(module => module.RecipePDFDocument);
const pdfPromise = import('@react-pdf/renderer').then(module => module.pdf);

interface PrintLinkProps {
    recipe: Recipe | Preparation;
    ingredients: FullRecipeIngredient[];
    preparations: FullRecipePreparation[];
    totalCost: number;
    className?: string;
}

export const PrintLink: React.FC<PrintLinkProps> = ({ recipe, ingredients, preparations, totalCost, className }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handlePrint = async () => {
        setIsGenerating(true);
        try {
            const RecipePDFDocument = await RecipePDFDocumentPromise;
            const pdf = await pdfPromise;

            const doc = <RecipePDFDocument recipe={recipe} ingredients={ingredients} preparations={preparations} totalCost={totalCost} />;
            const asPdf = pdf([]); // Create an empty PDF first
            asPdf.updateContainer(doc); // Update it with our document
            const blob = await asPdf.toBlob(); // Get the blob
            
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            setIsGenerating(false);
            
            // Clean up the object URL after a delay
            setTimeout(() => URL.revokeObjectURL(url), 100);

        } catch (error) {
            console.error("Failed to generate PDF", error);
            setIsGenerating(false);
        }
    };

    return (
        <Button variant="outline" className={className} disabled={isGenerating} onClick={handlePrint}>
            {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Printer className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? 'Génération...' : 'Imprimer'}
        </Button>
    );
};
