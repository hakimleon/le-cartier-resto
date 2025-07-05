"use client"

import { useState } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableMap } from "./TableMap";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';

export default function ReservationsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "Réservation confirmée!",
      description: "Votre table a été réservée avec succès. Nous vous attendons.",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Réservations" />
      <main className="flex-1 p-4 lg:p-6 grid md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Réserver une table</CardTitle>
            <CardDescription>Sélectionnez une date, une heure et le nombre de convives.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Heure</Label>
                <Select>
                  <SelectTrigger id="time">
                    <SelectValue placeholder="Choisir une heure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="19:00">19:00</SelectItem>
                    <SelectItem value="19:30">19:30</SelectItem>
                    <SelectItem value="20:00">20:00</SelectItem>
                    <SelectItem value="20:30">20:30</SelectItem>
                    <SelectItem value="21:00">21:00</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guests">Nombre de convives</Label>
                <Input id="guests" type="number" placeholder="2" min="1" max="10" />
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Confirmer la réservation
              </Button>
            </form>
          </CardContent>
        </Card>
        <TableMap />
      </main>
    </div>
  );
}
