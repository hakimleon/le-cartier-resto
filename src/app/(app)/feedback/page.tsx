"use client";

import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/common/AppHeader";
import { StarRating } from "@/components/common/StarRating";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function FeedbackPage() {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    form.reset();
    toast({
      title: "Merci pour votre avis !",
      description: "Vos commentaires nous aident à nous améliorer.",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Avis des Clients" />
      <main className="flex-1 p-4 lg:p-6 flex items-center justify-center">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Partagez votre expérience</CardTitle>
            <CardDescription>Votre avis est précieux. Laissez-nous une note et un commentaire.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input id="name" placeholder="Votre nom" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Votre email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Note globale</Label>
                <StarRating onRatingChange={(rating) => console.log(rating)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comments">Commentaires</Label>
                <Textarea id="comments" placeholder="Dites-nous en plus sur votre visite..." rows={5} />
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Envoyer mon avis
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
