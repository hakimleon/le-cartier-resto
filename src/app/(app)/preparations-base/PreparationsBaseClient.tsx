"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Preparation, preparationCategories } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, PlusCircle, Search, FileText, FlaskConical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deletePreparation } from "../preparations/actions";
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

// This component is a clone of PreparationsClient, adapted for the new "base preparations" flow.
// The main difference is the "New Preparation" button now redirects to the workshop.

export default function PreparationsBaseClient() {
  const [preparations, setPreparations] = useState<Preparation[]>([]);
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
    const prepsCol = collection(db, "preparations");
    const q = query(prepsCol);
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        try {
            const prepsData = querySnapshot.docs.map(
                (doc) => ({ ...doc.data(), id: doc.id } as Preparation)
            );
            setPreparations(prepsData);
            setError(null);
        } catch(e: any) {
            console.error("Error processing preparations snapshot: ", e);
            setError("Impossible de traiter les données des préparations. " + e.message);
        } finally {
            setIsLoading(false);
        }
    }, (e: any) => {
        console.error("Error fetching preparations with onSnapshot: ", e);
        setError("Impossible de charger les préparations en temps réel. " + e.message);
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
        await deletePreparation(id);
        toast({
          title: "Succès",
          description: `La préparation "${name}" a été supprimée.`,
        });
      } catch (error) {
        console.error("Error deleting preparation:", error);
        toast({
          title: "Erreur",
          description: "La suppression de la préparation a échoué.",
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

  const filteredPreparations = useMemo(() => {
    return preparations.filter(p => {
        const searchTermMatch = searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = selectedCategory === 'Tous' || p.category === selectedCategory;
        return searchTermMatch && categoryMatch;
    });
  }, [preparations, searchTerm, selectedCategory]);

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
                  <TableHead>Nom de la préparation</TableHead>
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
                            <Link href={`/preparations-base/${prep.id}`}>
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
                                    Cette action est irréversible. La préparation "{prep.name}" sera supprimée définitivement.
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
                      Aucune préparation dans cette catégorie.
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

  const allPreparationCategories = ["Tous", ...preparationCategories];

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Gestion des Préparations de Base</h1>
            <p className="text-muted-foreground">Nouveau flux de gestion des fiches techniques de préparations.</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Rechercher une préparation..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>
             <Button onClick={() => router.push('/preparations/workshop')}>
                <FlaskConical className="mr-2 h-4 w-4" />
                Aller à l'Atelier
            </Button>
        </div>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="pt-4">
        <TabsList className="h-auto justify-start flex-wrap">
            {allPreparationCategories.map((category) => (
                <TabsTrigger key={category} value={category} className="text-sm whitespace-normal sm:whitespace-nowrap data-[state=active]:shadow-lg">{category}</TabsTrigger>
            ))}
        </TabsList>
        <TabsContent value={selectedCategory}>
             {isLoading ? renderSkeleton() : renderTable(filteredPreparations)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
