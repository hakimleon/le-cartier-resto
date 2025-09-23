
"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Sale, OrderItem } from "@/lib/types";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function SalesClient() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isFirebaseConfigured) {
            setError("La configuration de Firebase est manquante.");
            setIsLoading(false);
            return;
        }

        const q = query(collection(db, "sales"), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const salesData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt, // Keep as is initially
                } as Sale;
            });
            setSales(salesData);
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching sales data: ", err);
            setError("Impossible de charger l'historique des ventes.");
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const formatTimestamp = (timestamp: any) => {
        if (timestamp instanceof Timestamp) {
            return format(timestamp.toDate(), "dd/MM/yyyy 'à' HH:mm", { locale: fr });
        }
        return "Date invalide";
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-80 w-full" />
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
    
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Historique des Ventes</h1>
                <p className="text-muted-foreground">Consultez ici toutes les commandes validées.</p>
            </header>

            <Card>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]"></TableHead>
                                <TableHead>Date & Heure</TableHead>
                                <TableHead>Table</TableHead>
                                <TableHead className="text-right">Montant Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sales.length > 0 ? (
                                sales.map(sale => (
                                   <Accordion type="single" collapsible key={sale.id} asChild>
                                        <TableRow className="w-full">
                                            <TableCell colSpan={4} className="p-0">
                                                <AccordionItem value="item-1" className="border-b-0">
                                                    <AccordionTrigger className="p-4 hover:no-underline">
                                                        <div className="grid grid-cols-4 w-full items-center text-left">
                                                            <div className="flex items-center">
                                                                <Receipt className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                            <div className="font-medium">{formatTimestamp(sale.createdAt)}</div>
                                                            <div><Badge variant="outline">{sale.tableId}</Badge></div>
                                                            <div className="text-right font-semibold">{sale.total.toFixed(2)} DZD</div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="bg-muted/50 p-4">
                                                            <h4 className="font-semibold mb-2">Détails de la commande :</h4>
                                                            <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                                                                {sale.items.map(item => (
                                                                    <li key={item.dishId}>
                                                                        {item.quantity} x {item.name}
                                                                        <span className="text-foreground font-medium ml-2">({(item.quantity * item.price).toFixed(2)} DZD)</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </TableCell>
                                        </TableRow>
                                   </Accordion>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Aucune vente enregistrée pour le moment.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
