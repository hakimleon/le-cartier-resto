

"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Recipe } from "@/data/definitions";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export default function RecipeCostListPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const recipesSnapshot = await getDocs(query(collection(db, "recipes"), orderBy("name")));
        setRecipes(recipesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Recipe)));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  
  const filteredRecipes = recipes.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-background">
       <AppHeader title="Fiches Techniques">
        <Button asChild>
            <Link href="/recipe-cost/new">
                <PlusCircle className="mr-2" />
                Créer une fiche vierge
            </Link>
        </Button>
      </AppHeader>
      <main className="flex-1 p-4 lg:p-6">
        <Card>
            <CardHeader>
                <CardTitle>Sélectionner un plat</CardTitle>
                <CardDescription>Choisissez un plat pour consulter ou modifier sa fiche technique d'envoi.</CardDescription>
                <div className="pt-2">
                    <Input 
                        placeholder="Rechercher un plat..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredRecipes.map(recipe => (
                             <Link key={recipe.id} href={`/recipe-cost/${recipe.id}`} className="block">
                                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-4">
                                     <Image src={recipe.image || "https://placehold.co/600x400.png"} alt={recipe.name} width={64} height={64} className="rounded-md object-cover aspect-square" />
                                    <div className="flex-1">
                                        <p className="font-semibold">{recipe.name}</p>
                                        <p className="text-sm text-muted-foreground">{recipe.category}</p>
                                    </div>
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                 {!loading && filteredRecipes.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>Aucun plat trouvé pour "{searchTerm}".</p>
                    </div>
                 )}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
