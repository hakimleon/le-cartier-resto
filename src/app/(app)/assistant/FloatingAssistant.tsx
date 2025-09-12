
"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bot, MessageCircle } from "lucide-react";
import AssistantClient from "./AssistantClient";

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button 
                    size="lg" 
                    className="rounded-full h-16 w-16 shadow-lg"
                    aria-label="Ouvrir l'assistant"
                >
                    <MessageCircle className="h-8 w-8" />
                </Button>
            </PopoverTrigger>
            <PopoverContent 
                side="top" 
                align="end" 
                className="w-[440px] h-[70vh] p-0 mr-4 mb-2"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <AssistantClient />
            </PopoverContent>
        </Popover>
    </div>
  );
}
