/**
 * @fileOverview Ce fichier contient les schémas et types Zod partagés par les différents ateliers (plat, préparation, garniture).
 * Il n'exporte aucune fonction et ne doit pas contenir la directive "use server".
 */

import { z } from 'zod';

// Schéma pour les ingrédients générés par l'IA
export const GeneratedIngredientSchema = z.object({
    name: z.string().describe("Nom de l'ingrédient."),
    quantity: z.number().describe("Quantité."),
    unit: z.string().describe("Unité (g, kg, ml, l, pièce).")
});

// Schéma pour les sous-recettes (préparations existantes) générées par l'IA
export const SubRecipeSchema = z.object({
    name: z.string().describe("Nom de la sous-recette EXISTANTE."),
    quantity: z.number().describe("Quantité de sous-recette."),
    unit: z.string().describe("Unité pour la sous-recette."),
});

// Schéma pour les NOUVELLES sous-recettes inventées par l'IA
export const NewSubRecipeSchema = z.object({
    name: z.string().describe("Nom de la NOUVELLE sous-recette INVENTÉE par l'IA."),
    description: z.string().describe("Courte description du rôle de cette nouvelle sous-recette."),
});


// Schéma de base pour les entrées de l'atelier de préparation/garniture
export const PreparationConceptInputSchema = z.object({
    name: z.string().optional().describe("Le nom ou l'idée de base de la préparation. Si non fourni, l'IA doit en générer un."),
    description: z.string().optional().describe("La description de la préparation."),
    mainIngredients: z.string().optional().describe("Les ingrédients principaux à intégrer."),
    excludedIngredients: z.string().optional().describe("Les ingrédients à ne jamais utiliser."),
    recommendations: z.string().optional().describe("Directives sur le style ou la consistance souhaitée."),
    rawRecipe: z.string().optional().describe("Une recette complète en texte brut à reformater. Si ce champ est fourni, l'IA doit l'utiliser comme source principale."),
    refinementHistory: z.array(z.string()).optional().describe("L'historique des instructions d'affinage précédentes."),
    currentRefinement: z.string().optional().describe("La nouvelle instruction d'affinage à appliquer."),
    cacheBuster: z.number().optional().describe("Valeur aléatoire pour éviter la mise en cache."),
});
export type PreparationConceptInput = z.infer<typeof PreparationConceptInputSchema>;

// Schéma de base pour les sorties de l'atelier de préparation/garniture
export const PreparationConceptOutputSchema = z.object({
    name: z.string().describe("Le nom final de la préparation."),
    description: z.string().describe("Une description technique et fonctionnelle."),
    
    ingredients: z.array(GeneratedIngredientSchema).describe("Liste des ingrédients nécessaires."),
    subRecipes: z.array(SubRecipeSchema).describe("Liste des sous-recettes EXISTANTES utilisées."),
    
    procedure_preparation: z.string().describe("Procédure de préparation (Markdown)."),
    procedure_cuisson: z.string().describe("Procédure de cuisson (Markdown)."),
    procedure_service: z.string().describe("Procédure de conservation/stockage (Markdown)."),
    
    duration: z.number().int().describe("Durée totale de production en minutes."),
    difficulty: z.enum(['Facile', 'Moyen', 'Difficile']).describe("Niveau de difficulté."),
    
    portions: z.number().int().optional().describe("Nombre de portions ou de 'parts' que la recette peut produire. Important pour les purées, sauces, etc."),
    productionQuantity: z.number().optional().describe("Quantité totale produite."),
    productionUnit: z.string().optional().describe("Unité de production (kg, l, pièces)."),
    usageUnit: z.string().optional().describe("Unité d'utilisation suggérée (g, ml, pièce)."),
});
export type PreparationConceptOutput = z.infer<typeof PreparationConceptOutputSchema>;


// Schéma pour les entrées de l'atelier de plat
export const RecipeConceptInputSchema = z.object({
    type: z.enum(['Plat', 'Préparation']).describe('Le type de fiche technique à générer.'),
    name: z.string().optional().describe("Le nom ou l'idée de base du plat/préparation. Si non fourni, l'IA doit en générer un."),
    description: z.string().optional().describe("La description du plat/préparation."),
    mainIngredients: z.string().optional().describe("Les ingrédients principaux à intégrer."),
    excludedIngredients: z.string().optional().describe("Les ingrédients à ne jamais utiliser."),
    recommendations: z.string().optional().describe("Directives sur le style, la saisonnalité, ou le type de cuisine souhaité."),
    rawRecipe: z.string().optional().describe("Une recette complète en texte brut à reformater. Si ce champ est fourni, l'IA doit l'utiliser comme source principale."),
    refinementHistory: z.array(z.string()).optional().describe("L'historique des instructions d'affinage précédentes."),
    currentRefinement: z.string().optional().describe("La nouvelle instruction d'affinage à appliquer."),
    cacheBuster: z.number().optional().describe("Valeur aléatoire pour éviter la mise en cache."),
});
export type RecipeConceptInput = z.infer<typeof RecipeConceptInputSchema>;

// Schéma pour les sorties de l'atelier de plat
export const RecipeConceptOutputSchema = z.object({
    name: z.string().describe("Le nom final et marketing de la recette."),
    description: z.string().describe("Une description alléchante et créative."),
    
    ingredients: z.array(GeneratedIngredientSchema).describe("Liste des ingrédients nécessaires."),
    subRecipes: z.array(SubRecipeSchema).describe("Liste des sous-recettes EXISTANTES utilisées."),
    newSubRecipes: z.array(NewSubRecipeSchema).describe("Liste des sous-recettes INVENTÉES par l'IA.").optional(),

    procedure_preparation: z.string().describe("Procédure de préparation (Markdown)."),
    procedure_cuisson: z.string().describe("Procédure de cuisson (Markdown)."),
    procedure_service: z.string().describe("Procédure de service/dressage (Markdown)."),
    
    duration: z.number().int().describe("Durée totale en minutes."),
    difficulty: z.enum(['Facile', 'Moyen', 'Difficile']).describe("Niveau de difficulté."),
    
    category: z.enum(['Entrées froides et chaudes', 'Plats et Grillades', 'Les mets de chez nous', 'Symphonie de pâtes', 'Nos Burgers Bistronomiques', 'Dessert', 'Élixirs & Rafraîchissements']).optional().describe("Catégorie du plat, si applicable."),
    portions: z.number().int().optional().describe("Nombre de portions, si c'est un plat."),
    commercialArgument: z.string().optional().describe("Argumentaire commercial, si c'est un plat."),
    imageUrl: z.string().url().optional().describe("URL de l'image générée, si c'est un plat."),

    productionQuantity: z.number().optional().describe("Quantité totale produite, si c'est une préparation."),
    productionUnit: z.string().optional().describe("Unité de production (kg, l, pièces), si c'est une préparation."),
    usageUnit: z.string().optional().describe("Unité d'utilisation suggérée (g, ml, pièce), si c'est une préparation."),
});
export type RecipeConceptOutput = z.infer<typeof RecipeConceptOutputSchema>;
