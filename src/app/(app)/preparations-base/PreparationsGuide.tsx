
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";
import { ReactNode, useMemo } from "react";
import { GuideCategory, preparationsGuideData } from "./guide-data";

type PreparationsGuideProps = {
  children: ReactNode;
  existingPreparations: string[];
};

export function PreparationsGuide({ children, existingPreparations }: PreparationsGuideProps) {
  const existingNamesLower = useMemo(() => new Set(existingPreparations.map(p => p.toLowerCase())), [existingPreparations]);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Guide des Préparations de Base</DialogTitle>
          <DialogDescription>
            Votre mémo de travail pour suivre les préparations à réaliser. Les éléments cochés existent déjà.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[70vh] pr-6">
          <div className="space-y-6">
            {preparationsGuideData.map((category) => {
              const categoryProgress = category.preparations.filter(p => existingNamesLower.has(p.name.toLowerCase())).length;
              const totalInCategory = category.preparations.length;

              return (
                <div key={category.title}>
                  <h3 className="text-lg font-semibold tracking-tight">{category.title}</h3>
                  <p className="text-sm text-muted-foreground italic mb-3">{category.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {category.preparations.map((prep) => {
                      const isCreated = existingNamesLower.has(prep.name.toLowerCase());
                      return (
                        <div key={prep.name} className="flex items-center gap-2">
                          {isCreated ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                          )}
                          <span className={cn(isCreated ? "text-foreground" : "text-muted-foreground")}>
                            {prep.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                   {preparationsGuideData.indexOf(category) < preparationsGuideData.length - 1 && <Separator className="mt-6"/>}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
