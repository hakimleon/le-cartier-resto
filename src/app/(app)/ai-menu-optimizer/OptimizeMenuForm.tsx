"use client";

import { useFormState, useFormStatus } from "react-dom";
import { getMenuSuggestions, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";

const initialState: FormState = {
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Génération en cours..." : "Obtenir des suggestions"}
    </Button>
  );
}

export function OptimizeMenuForm() {
  const [state, formAction] = useFormState(getMenuSuggestions, initialState);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Paramètres d'Optimisation</CardTitle>
          <CardDescription>Fournissez les informations pour que l'IA puisse générer des suggestions de menu.</CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="availableIngredients">Ingrédients Disponibles</Label>
              <Textarea
                id="availableIngredients"
                name="availableIngredients"
                placeholder="Ex: 10kg de boeuf, 5kg de saumon, 20kg de pommes de terre, saison des asperges..."
                rows={4}
              />
              {state.fields?.availableIngredients && <p className="text-destructive text-sm">{state.fields.availableIngredients}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="predictedDemand">Demande Client Prévue</Label>
              <Textarea
                id="predictedDemand"
                name="predictedDemand"
                placeholder="Ex: Forte demande pour les plats de viande, intérêt croissant pour les options végétariennes..."
                rows={4}
              />
              {state.fields?.predictedDemand && <p className="text-destructive text-sm">{state.fields.predictedDemand}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentTrends">Tendances Culinaires</Label>
              <Textarea
                id="currentTrends"
                name="currentTrends"
                placeholder="Ex: Cuisine locale, fermentation, plats à partager, cocktails sans alcool..."
                rows={4}
              />
              {state.fields?.currentTrends && <p className="text-destructive text-sm">{state.fields.currentTrends}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-lg flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="text-accent" />
            <CardTitle className="font-headline text-2xl">Suggestions de l'IA</CardTitle>
          </div>
          <CardDescription>Voici les recommandations générées par l'intelligence artificielle.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          {state.data ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg font-headline">Suggestions de Menu :</h3>
                <p className="whitespace-pre-wrap text-sm">{state.data.menuSuggestions}</p>
              </div>
              <div>
                <h3 className="font-bold text-lg font-headline">Justification :</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{state.data.rationale}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Les suggestions de l'IA apparaîtront ici.</p>
            </div>
          )}
          {state.message && !state.data && <p className="text-destructive text-sm mt-4">{state.message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
