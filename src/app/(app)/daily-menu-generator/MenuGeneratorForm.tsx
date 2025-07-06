"use client";

import { useFormState, useFormStatus } from "react-dom";
import { generateMenu, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wand2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

const initialState: FormState = {
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Création du menu en cours..." : "Générer le Menu du Jour"}
    </Button>
  );
}

export function MenuGeneratorForm() {
  const [state, formAction] = useFormState(generateMenu, initialState);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Paramètres du Menu</CardTitle>
          <CardDescription>Indiquez un thème et des contraintes pour que l'IA compose un menu unique.</CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Thème du Jour</Label>
              <Input
                id="theme"
                name="theme"
                placeholder="Ex: Soirée Italienne, Saveurs d'Automne, Spécial Fruits de Mer..."
              />
              {state.fields?.theme && <p className="text-destructive text-sm">{state.fields.theme}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="constraints">Contraintes et Ingrédients</Label>
              <Textarea
                id="constraints"
                name="constraints"
                placeholder="Ex: Utiliser le saumon et les asperges, plats végétariens uniquement, budget limité..."
                rows={4}
              />
              {state.fields?.constraints && <p className="text-destructive text-sm">{state.fields.constraints}</p>}
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
            <Wand2 className="text-accent" />
            <CardTitle className="font-headline text-2xl">Menu du Jour Suggéré</CardTitle>
          </div>
          <CardDescription>Voici une proposition de menu générée par l'intelligence artificielle.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          {state.data ? (
            <div className="space-y-6 p-4 border rounded-lg bg-secondary/30 h-full">
              <p className="text-center text-muted-foreground italic">"{state.data.presentationText}"</p>
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-lg text-primary tracking-wider font-headline">ENTRÉE</h4>
                  <p className="font-semibold">{state.data.entree.name}</p>
                  <p className="text-sm text-muted-foreground">{state.data.entree.description}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-bold text-lg text-primary tracking-wider font-headline">PLAT</h4>
                  <p className="font-semibold">{state.data.plat.name}</p>
                  <p className="text-sm text-muted-foreground">{state.data.plat.description}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-bold text-lg text-primary tracking-wider font-headline">DESSERT</h4>
                  <p className="font-semibold">{state.data.dessert.name}</p>
                  <p className="text-sm text-muted-foreground">{state.data.dessert.description}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Le menu généré par l'IA apparaîtra ici.</p>
            </div>
          )}
          {state.message && !state.data && <p className="text-destructive text-sm mt-4">{state.message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
