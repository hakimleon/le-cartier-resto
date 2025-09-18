
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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

type PreparationsGuideProps = {
  children: ReactNode;
  existingPreparations: string[];
};

/**
 * Normalizes a string for comparison by converting to lowercase, removing accents, and standardizing apostrophes.
 * @param str The string to normalize.
 * @returns The normalized string.
 */
const normalizeString = (str: string): string => {
    if (!str) return "";
    return str
        .normalize('NFD') // Decompose accents from characters
        .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
        .toLowerCase() // Convert to lowercase
        .replace(/’|'/g, "'"); // Standardize apostrophes
};


export function PreparationsGuide({ children, existingPreparations }: PreparationsGuideProps) {
  const existingNamesNormalized = useMemo(() => new Set(existingPreparations.map(normalizeString)), [existingPreparations]);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Guide des Préparations de Base</DialogTitle>
          <DialogDescription>
            Votre mémo de travail pour suivre les préparations à réaliser. Les éléments cochés existent déjà.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[70vh] pr-6">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {preparationsGuideData.map((category) => {
              const categoryProgress = category.preparations.filter(p => existingNamesNormalized.has(normalizeString(p.name))).length;
              const totalInCategory = category.preparations.length;
              const progressPercentage = totalInCategory > 0 ? (categoryProgress / totalInCategory) * 100 : 0;

              return (
                <AccordionItem value={category.title} key={category.title} className="border-b-0 rounded-lg bg-muted/50 px-4">
                    <AccordionTrigger className="py-3 hover:no-underline">
                        <div className="w-full pr-4">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="text-base font-semibold tracking-tight text-foreground">{category.title}</h3>
                                <span className="text-sm font-medium text-muted-foreground">{categoryProgress} / {totalInCategory}</span>
                            </div>
                            <p className="text-xs text-muted-foreground italic text-left">{category.description}</p>
                            <Progress value={progressPercentage} className="mt-2 h-1.5" />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm pl-2 border-l-2 ml-1">
                            {category.preparations.map((prep) => {
                            const isCreated = existingNamesNormalized.has(normalizeString(prep.name));
                            return (
                                <div key={prep.name} className="flex items-center gap-2 py-1">
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
                    </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
