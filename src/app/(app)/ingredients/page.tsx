

"use client";

import { useState } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ingredientItems as initialIngredientItems, IngredientItem } from "@/data/mock-data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Edit, Package, Plus, Search } from "lucide-react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD" }).format(value).replace("DZD", "").trim() + " DZD";
};

const getStockStatus = (stock: number, lowStockThreshold: number) => {
    if (stock === 0) return { label: 'Rupture', className: 'bg-red-200 text-red-800 border-red-300' };
    if (stock < lowStockThreshold) return { label: 'Stock Bas', className: 'bg-yellow-200 text-yellow-800 border-yellow-300' };
    return { label: 'En Stock', className: 'bg-green-200 text-green-800 border-green-300' };
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<IngredientItem[]>(initialIngredientItems);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIngredients = ingredients.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
       <AppHeader title="Inventaire des Ingrédients">
        <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un ingrédient
        </Button>
      </AppHeader>
      <main className="flex-1 p-4 lg:p-6">
        <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Gérez vos ingrédients et leurs prix d'achat</h2>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Rechercher un ingrédient..." 
                    className="pl-9 max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        
        <Card className="shadow-lg">
           <CardHeader>
            <CardTitle>Liste des Ingrédients ({filteredIngredients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Prix unitaire</TableHead>
                  <TableHead>Unité</TableHead>
                  <TableHead>Stock actuel</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIngredients.map((item) => {
                  const status = getStockStatus(item.stock, item.lowStockThreshold);
                  return (
                    <TableRow key={item.id} className={cn(item.stock === 0 && 'bg-red-50', item.stock > 0 && item.stock < item.lowStockThreshold && 'bg-yellow-50')}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="whitespace-nowrap">{item.category}</Badge>
                      </TableCell>
                       <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                          <span className={cn(
                              "font-medium",
                              item.stock === 0 ? "text-red-600" : item.stock < item.lowStockThreshold ? "text-yellow-600" : ""
                          )}>
                              {item.stock} {item.unit}
                          </span>
                      </TableCell>
                      <TableCell>{item.supplier}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                 {filteredIngredients.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                            Aucun ingrédient trouvé pour votre recherche.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
