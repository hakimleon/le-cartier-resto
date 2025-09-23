
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Recipe, Table, OrderItem } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table as UiTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

import { AlertTriangle, Plus, Minus, X, Check, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { processOrder } from "./actions";

// Données initiales des tables
const initialTables: Table[] = Array.from({ length: 12 }, (_, i) => ({
  id: `T${i + 1}`,
  name: `Table ${i + 1}`,
  status: 'Libre',
  currentOrder: [],
  total: 0,
}));

// Catégories de menu dans l'ordre souhaité
const menuCategories = [
    "Entrées froides et chaudes",
    "Symphonie de pâtes",
    "Plats et Grillades",
    "Les mets de chez nous",
    "Nos Burgers Bistronomiques",
    "Dessert",
    "Élixirs & Rafraîchissements",
];

export default function CashRegisterClient() {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [activeDishes, setActiveDishes] = useState<Recipe[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setError("La configuration de Firebase est manquante.");
      setIsLoading(false);
      return;
    }

    const q = query(collection(db, "recipes"), where("status", "==", "Actif"), where("type", "==", "Plat"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const dishesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Recipe));
        setActiveDishes(dishesData);
        setIsLoading(false);
    }, (err) => {
        console.error("Error fetching active dishes: ", err);
        setError("Impossible de charger les plats du menu.");
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const dishesByCategory = useMemo(() => {
    return menuCategories.map(category => ({
        category,
        dishes: activeDishes.filter(dish => dish.category === category)
    })).filter(group => group.dishes.length > 0);
  }, [activeDishes]);


  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
  };

  const handleAddToOrder = (dish: Recipe) => {
    if (!selectedTable) return;

    setTables(currentTables => currentTables.map(t => {
        if (t.id === selectedTable.id) {
            const existingItem = t.currentOrder.find(item => item.dishId === dish.id);
            let newOrder: OrderItem[];
            if (existingItem) {
                newOrder = t.currentOrder.map(item =>
                    item.dishId === dish.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                newOrder = [...t.currentOrder, { dishId: dish.id!, name: dish.name, quantity: 1, price: dish.price }];
            }
            
            const newTotal = newOrder.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const newStatus = newOrder.length > 0 ? 'Occupée' : 'Libre';

            const updatedTable = { ...t, currentOrder: newOrder, total: newTotal, status: newStatus };
            setSelectedTable(updatedTable); // Update the state of the sheet as well
            return updatedTable;
        }
        return t;
    }));
  };
  
  const handleRemoveFromOrder = (dishId: string) => {
     if (!selectedTable) return;
     setTables(currentTables => currentTables.map(t => {
         if (t.id === selectedTable.id) {
             const newOrder = t.currentOrder.map(item => 
                 item.dishId === dishId ? { ...item, quantity: item.quantity - 1 } : item
             ).filter(item => item.quantity > 0);

             const newTotal = newOrder.reduce((sum, item) => sum + item.price * item.quantity, 0);
             const newStatus = newOrder.length > 0 ? 'Occupée' : 'Libre';
             
             const updatedTable = { ...t, currentOrder: newOrder, total: newTotal, status: newStatus };
             setSelectedTable(updatedTable);
             return updatedTable;
         }
         return t;
     }))
  }

  const handleValidateOrder = async () => {
    if (!selectedTable) return;
    setIsProcessing(true);
    try {
        const result = await processOrder(selectedTable);

        if (result.success) {
            toast({ title: "Succès", description: result.message });
            // Vider la table après la commande
            setTables(currentTables => currentTables.map(t => {
                if (t.id === selectedTable.id) {
                    return { ...t, currentOrder: [], total: 0, status: 'Libre' };
                }
                return t;
            }));
            setSelectedTable(null); // Fermer le panneau
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error("Failed to process order:", error);
        toast({
            title: "Erreur de traitement",
            description: error instanceof Error ? error.message : "Une erreur inconnue est survenue.",
            variant: "destructive"
        });
    } finally {
        setIsProcessing(false);
    }
  }


  if (error) {
    return (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-6">
        <header>
            <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Caisse Enregistreuse</h1>
            <p className="text-muted-foreground">Sélectionnez une table pour prendre une commande.</p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.map(table => (
                <Card 
                    key={table.id}
                    onClick={() => handleTableSelect(table)}
                    className={cn(
                        "flex flex-col items-center justify-center p-4 cursor-pointer transition-all aspect-square",
                        table.status === 'Libre' && "bg-green-100/50 hover:bg-green-100/80 border-green-300",
                        table.status === 'Occupée' && "bg-red-100/50 hover:bg-red-100/80 border-red-300",
                        selectedTable?.id === table.id && "ring-2 ring-primary ring-offset-2"
                    )}
                >
                    <p className="font-bold text-lg">{table.name}</p>
                    <p className="text-sm font-semibold">{table.total.toFixed(2)} DZD</p>
                </Card>
            ))}
        </div>
        
        <Sheet open={!!selectedTable} onOpenChange={(open) => !open && setSelectedTable(null)}>
            <SheetContent className="sm:max-w-4xl w-full flex flex-col p-0">
                {selectedTable && (
                    <>
                        <SheetHeader className="p-6">
                            <SheetTitle>Commande - {selectedTable.name}</SheetTitle>
                            <SheetDescription>Ajoutez ou retirez des plats pour cette table.</SheetDescription>
                        </SheetHeader>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1 overflow-hidden">
                           {/* Menu selection */}
                           <div className="flex flex-col border-r">
                               <h3 className="text-lg font-semibold px-6 pb-4 border-b">Menu</h3>
                               <ScrollArea className="flex-1">
                                   <div className="p-4 space-y-4">
                                       {isLoading ? <p>Chargement du menu...</p> : (
                                            dishesByCategory.map(group => (
                                                <div key={group.category}>
                                                    <h4 className="text-md font-semibold text-muted-foreground mb-2">{group.category}</h4>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {group.dishes.map(dish => (
                                                            <Button key={dish.id} variant="outline" className="h-auto justify-start p-2" onClick={() => handleAddToOrder(dish)}>
                                                                <div className="flex flex-col items-start text-left">
                                                                    <p className="font-semibold text-sm">{dish.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{dish.price.toFixed(2)} DZD</p>
                                                                </div>
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                       )}
                                   </div>
                               </ScrollArea>
                           </div>

                            {/* Current Order */}
                            <div className="flex flex-col">
                                <h3 className="text-lg font-semibold px-6 pb-4 border-b">Ticket de Caisse</h3>
                                <ScrollArea className="flex-1">
                                    <UiTable>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Plat</TableHead>
                                                <TableHead>Qté</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedTable.currentOrder.length > 0 ? selectedTable.currentOrder.map(item => (
                                                <TableRow key={item.dishId}>
                                                    <TableCell>{item.name}</TableCell>
                                                    <TableCell>{item.quantity}</TableCell>
                                                    <TableCell className="text-right">{(item.price * item.quantity).toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleRemoveFromOrder(item.dishId)}><Minus className="h-4 w-4"/></Button>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Aucun plat ajouté.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </UiTable>
                                </ScrollArea>
                                <SheetFooter className="p-6 border-t bg-muted/50">
                                    <div className="w-full flex justify-between items-center">
                                        <p className="text-xl font-bold">Total: {selectedTable.total.toFixed(2)} DZD</p>
                                        <Button 
                                            size="lg" 
                                            onClick={handleValidateOrder} 
                                            disabled={isProcessing || selectedTable.currentOrder.length === 0}
                                        >
                                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4"/>}
                                            {isProcessing ? "Traitement..." : "Valider & Envoyer"}
                                        </Button>
                                    </div>
                                </SheetFooter>
                            </div>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    </div>
  );
}
