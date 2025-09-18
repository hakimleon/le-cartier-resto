
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";
import { ReactNode, useMemo } from "react";
import { GuideCategory, preparationsGuideData } from "./guide-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


type PreparationsGuideProps = {
  children: ReactNode;
  existingPreparations: string[];
};

const normalizeString = (str: string): string => {
    if (!str) return "";
    return str
        .normalize('NFD') 
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/’|'/g, "'");
};

const CategoryCard = ({ category, existingNames }: { category: GuideCategory, existingNames: Set<string> }) => {
    const categoryProgress = category.preparations.filter(p => existingNames.has(normalizeString(p.name))).length;
    const totalInCategory = category.preparations.length;
    const progressPercentage = totalInCategory > 0 ? (categoryProgress / totalInCategory) * 100 : 0;

    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-semibold leading-snug">{category.title}</CardTitle>
                    <Badge variant="secondary" className="whitespace-nowrap">{categoryProgress} / {totalInCategory}</Badge>
                </div>
                <p className="text-xs text-muted-foreground pt-1">{category.description}</p>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col pt-0">
                <Progress value={progressPercentage} className="h-2 w-full mb-4" />
                <ScrollArea className="flex-grow h-32 pr-4">
                    <div className="space-y-2">
                        {category.preparations.map((prep) => {
                            const isCreated = existingNames.has(normalizeString(prep.name));
                            return (
                                <div key={prep.name} className="flex items-center gap-2">
                                    {isCreated ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                    ) : (
                                        <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                                    )}
                                    <span className={cn("text-sm", isCreated ? "text-foreground" : "text-muted-foreground")}>
                                        {prep.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};


export function PreparationsGuide({ children, existingPreparations }: PreparationsGuideProps) {
  const existingNamesNormalized = useMemo(() => new Set(existingPreparations.map(normalizeString)), [existingPreparations]);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Guide des Préparations de Base</DialogTitle>
          <DialogDescription>
            Votre mémo de travail pour suivre les préparations à réaliser. Les éléments cochés existent déjà.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[75vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1 pr-6">
                {preparationsGuideData.map((category) => (
                    <CategoryCard 
                        key={category.title}
                        category={category}
                        existingNames={existingNamesNormalized}
                    />
                ))}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
