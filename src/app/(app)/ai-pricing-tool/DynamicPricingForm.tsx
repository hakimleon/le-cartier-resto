"use client";

import { useFormState, useFormStatus } from "react-dom";
import { getPricingRecommendation, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

const initialState: FormState = {
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Analyse en cours..." : "Obtenir une recommandation"}
    </Button>
  );
}

export function DynamicPricingForm() {
  const [state, formAction] = useFormState(getPricingRecommendation, initialState);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Analyse de Prix</CardTitle>
          <CardDescription>Entrez les détails du plat pour obtenir une recommandation de prix de l'IA.</CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dishName">Nom du Plat</Label>
              <Input id="dishName" name="dishName" placeholder="Ex: Filet de Boeuf Rossini" />
              {state.fields?.dishName && <p className="text-destructive text-sm">{state.fields.dishName}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPrice">Prix Actuel (€)</Label>
                <Input id="currentPrice" name="currentPrice" type="number" step="0.01" placeholder="45.00" />
                {state.fields?.currentPrice && <p className="text-destructive text-sm">{state.fields.currentPrice}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="competitorPrice">Prix Concurrent (€)</Label>
                <Input id="competitorPrice" name="competitorPrice" type="number" step="0.01" placeholder="48.00" />
                {state.fields?.competitorPrice && <p className="text-destructive text-sm">{state.fields.competitorPrice}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="demandEstimate">Estimation de la Demande</Label>
              <Select name="demandEstimate">
                <SelectTrigger id="demandEstimate">
                  <SelectValue placeholder="Sélectionner la demande" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Très faible</SelectItem>
                  <SelectItem value="2">Faible</SelectItem>
                  <SelectItem value="3">Moyenne</SelectItem>
                  <SelectItem value="4">Forte</SelectItem>
                  <SelectItem value="5">Très forte</SelectItem>
                </SelectContent>
              </Select>
              {state.fields?.demandEstimate && <p className="text-destructive text-sm">{state.fields.demandEstimate}</p>}
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
            <DollarSign className="text-accent" />
            <CardTitle className="font-headline text-2xl">Recommandation de Prix</CardTitle>
          </div>
          <CardDescription>L'IA analyse les données pour suggérer le prix optimal.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          {state.data ? (
            <div className="space-y-4 text-center p-4 rounded-lg bg-secondary/50">
                {state.data.shouldIncreasePrice ? (
                    <TrendingUp className="mx-auto h-12 w-12 text-green-600" />
                ) : (
                    <TrendingDown className="mx-auto h-12 w-12 text-red-600" />
                )}
                
                {state.data.suggestedPrice && (
                    <div className="text-4xl font-bold text-primary">
                        {state.data.suggestedPrice.toFixed(2)} €
                    </div>
                )}
              
                <p className="font-semibold text-lg">{state.data.shouldIncreasePrice ? "Augmentation de prix recommandée" : "Maintien du prix recommandé"}</p>
                
                <p className="text-sm text-muted-foreground">{state.data.reasoning}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>La recommandation de prix apparaîtra ici.</p>
            </div>
          )}
          {state.message && !state.data && <p className="text-destructive text-sm mt-4">{state.message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
