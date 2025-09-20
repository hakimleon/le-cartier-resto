
"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Preparation } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, PlusCircle, Search, FileText, FlaskConical, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteGarnish } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2 } from "lucide-react";
import { GarnishesGuide } from "./GarnishesGuide";

const garnishCategories = [
    "Purées & mousselines",
    "Gratins & plats de légumes au four",
    "Légumes glacés, rôtis ou vapeur",
    "Céréales & féculents",
    "Légumineuses & accompagnements végétariens mijotés",
    "Accompagnements modernes & revisités",
];

export default function GarnishesClient() {
  const [garnishes, setGarnishes] = useState<Preparation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setError("La configuration de Firebase est manquante.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const prepsCol = collection(db, "garnishes");
    const q = query(prepsCol);
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        try {
            const prepsData = querySnapshot.docs.map(
                (doc) => ({ ...doc.data(), id: doc.id } as Preparation)
            );
            setGarnishes(prepsData);
            setError(null);
        } catch(e: any) {
            console.error("Error processing garnishes snapshot: ", e);
            setError("Impossible de traiter les données des garnitures. " + e.message);
        } finally {
            setIsLoading(false);
        }
    }, (e: any) => {
        console.error("Error fetching garnishes with onSnapshot: ", e);
        setError("Impossible de charger les garnitures en temps réel. " + e.message);
        setIsLoading(false);
    });

    return () => {
        if(unsubscribe) {
            unsubscribe();
        }
    };
  }, []);

  const handleDelete = async (id: string, name: string) => {
      try {
        await deleteGarnish(id);
        toast({
          title: "Succès",
          description: `La garniture "${name}" a été supprimée.`,
        });
      } catch (error) {
        console.error("Error deleting garnish:", error);
        toast({
          title: "Erreur",
          description: "La suppression de la garniture a échoué.",
          variant: "destructive",
        });
      }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value) {
        setSelectedCategory("Tous");
    }
  };

  const filteredGarnishes = useMemo(() => {
    return garnishes.filter(p => {
        const searchTermMatch = searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = selectedCategory === 'Tous' || p.category === selectedCategory;
        return searchTermMatch && categoryMatch;
    });
  }, [garnishes, searchTerm, selectedCategory]);
  
  const garnishNames = useMemo(() => garnishes.map(p => p.name), [garnishes]);

  const renderSkeleton = () => (
    <Card className="shadow-none border">
        <CardContent className="p-0">
             <Table>
                <TableHeader>
                    <TableRow>
                    {Array.from({length: 4}).map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        {Array.from({length: 4}).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  );

  const renderTable = (prepList: Preparation[]) => (
     <Card className="shadow-none border mt-4">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom de la garniture</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Production</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prepList.length > 0 ? (
                  prepList.map((prep) => (
                    <TableRow key={prep.id}>
                      <TableCell className="font-medium">{prep.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-sm truncate">{prep.description}</TableCell>
                      <TableCell>
                        {prep.productionQuantity} {prep.productionUnit}
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/garnishes/${prep.id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir la fiche technique">
                                    <FileText className="h-4 w-4" />
                                </Button>
                            </Link>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Supprimer">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irréversible. La garniture "{prep.name}" sera supprimée définitivement.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(prep.id!, prep.name)}>Supprimer</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Aucune garniture dans cette catégorie.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
  );

  if (error && !isFirebaseConfigured) {
    return (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur de configuration Firebase</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      );
  }

  const allGarnishCategories = ["Tous", ...garnishCategories];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Garnitures & Recettes standards</h1>
        <p className="text-muted-foreground">Recettes calibrées, portionnées, directement servies en accompagnement ou comme plat végétarien.</p>
      </header>
      
      <div className="flex items-center justify-between gap-4 pt-4">
          <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                  placeholder="Rechercher une garniture..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={handleSearchChange}
              />
          </div>
          <div className="flex items-center gap-2">
               <GarnishesGuide existingGarnishes={garnishNames}>
                  <Button variant="outline">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Guide
                  </Button>
               </GarnishesGuide>
               <Button onClick={() => router.push('/garnishes/workshop')}>
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Atelier
              </Button>
          </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="pt-2">
        <TabsList className="h-auto justify-start flex-wrap">
            {allGarnishCategories.map((category) => (
                <TabsTrigger key={category} value={category} className="text-sm whitespace-normal sm:whitespace-nowrap data-[state=active]:shadow-lg">{category}</TabsTrigger>
            ))}
        </TabsList>
        <TabsContent value={selectedCategory}>
             {isLoading ? renderSkeleton() : renderTable(filteredGarnishes)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
