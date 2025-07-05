import { AppHeader } from "@/components/common/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inventoryItems } from "@/data/mock-data";
import { cn } from "@/lib/utils";

export default function InventoryPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Gestion de l'Inventaire" />
      <main className="flex-1 p-4 lg:p-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Stock Actuel</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead className="text-right">Unité</TableHead>
                  <TableHead className="text-right">Seuil Bas</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryItems.map((item) => {
                  const isLowStock = item.quantity <= item.lowStockThreshold;
                  return (
                    <TableRow key={item.id} className={cn(isLowStock && "bg-destructive/10")}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{item.unit}</TableCell>
                      <TableCell className="text-right">{item.lowStockThreshold}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={isLowStock ? "destructive" : "secondary"} className={cn(!isLowStock && "bg-green-200 text-green-800")}>
                          {isLowStock ? "Stock Bas" : "En Stock"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
