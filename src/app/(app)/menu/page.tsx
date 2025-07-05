import Image from "next/image";
import { AppHeader } from "@/components/common/AppHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { menuItems, MenuItem } from "@/data/mock-data";

const categories = ["Entrées", "Plats Principaux", "Desserts", "Boissons"];

const MenuCategory = ({ items }: { items: MenuItem[] }) => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {items.map((item) => (
      <Card key={item.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
        <div className="relative w-full h-48">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            data-ai-hint={item.imageHint}
          />
        </div>
        <CardHeader>
          <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <CardDescription>{item.description}</CardDescription>
        </CardContent>
        <CardFooter>
          <p className="text-lg font-semibold text-primary">{item.price.toFixed(2)} €</p>
        </CardFooter>
      </Card>
    ))}
  </div>
);

export default function MenuPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Menu Digital" />
      <main className="flex-1 p-4 lg:p-6">
        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
            ))}
          </TabsList>
          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <MenuCategory items={menuItems.filter(item => item.category === category)} />
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
