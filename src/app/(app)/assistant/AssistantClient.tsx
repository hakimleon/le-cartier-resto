
"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, CornerDownLeft, Mic, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { chat } from '@/ai/flows/assistant-flow';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const examplePrompts = [
    "Quel est le plat le plus rentable de ma carte ?",
    "Suggère-moi un plat végétarien pour l'automne.",
    "Liste-moi tous les ingrédients en stock critique.",
    "Donne-moi une idée de plat à base de saumon et d'avocat."
]

export default function AssistantClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleSendMessage = async (prompt?: string) => {
    const messageContent = prompt || input;
    if (!messageContent.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
    };
    
    // Create a new array with the user's message.
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
        const chatHistoryForApi = newMessages.map(({ id, ...rest }) => rest);
        const response = await chat({ history: chatHistoryForApi });

        const aiMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: response.content
        };
        setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
        console.error("Error calling chat flow:", error);
        toast({
            title: "Erreur de l'assistant",
            description: "Je n'ai pas pu traiter votre demande. Veuillez réessayer.",
            variant: "destructive"
        });
        // Remove the user message if the call failed
        setMessages(prev => prev.slice(0, -1));
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)] bg-muted/40">
        <ScrollArea className="flex-1" ref={scrollAreaRef as any}>
             <div className="space-y-6 md:p-6 max-w-6xl mx-auto">
                {messages.length === 0 && !isLoading && (
                    <div className="text-center pt-16 mx-auto">
                        <div className="inline-block p-4 bg-primary/10 rounded-full">
                           <Bot className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-foreground">Assistant Le Singulier</h2>
                        <p className="mt-2 text-muted-foreground">Comment puis-je vous aider aujourd'hui ?</p>
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                            {examplePrompts.map(prompt => (
                                <Card key={prompt} className="p-4 text-left hover:bg-card transition-colors cursor-pointer" onClick={() => handleSendMessage(prompt)}>
                                    <p className="text-sm font-medium">{prompt}</p>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
                 {messages.map((m) => (
                    <div key={m.id} className={cn("flex items-start gap-4", m.role === 'user' ? 'justify-end' : '')}>
                        {m.role === 'assistant' && (
                            <Avatar className="w-8 h-8 border">
                                <AvatarFallback><Bot className="w-5 h-5"/></AvatarFallback>
                            </Avatar>
                        )}
                         <div className={cn("max-w-[85%] rounded-lg p-3 text-sm", m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border')}>
                            {m.role === 'assistant' ? <MarkdownRenderer text={m.content} /> : m.content}
                        </div>
                         {m.role === 'user' && (
                            <Avatar className="w-8 h-8 border">
                                <AvatarFallback><User className="w-5 h-5"/></AvatarFallback>
                            </Avatar>
                         )}
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-4">
                        <Avatar className="w-8 h-8 border">
                            <AvatarFallback><Bot className="w-5 h-5"/></AvatarFallback>
                        </Avatar>
                        <div className="max-w-[85%] rounded-lg p-3 text-sm bg-card border w-full">
                           <div className="space-y-2">
                               <Skeleton className="h-4 w-4/5" />
                               <Skeleton className="h-4 w-full" />
                               <Skeleton className="h-4 w-2/3" />
                           </div>
                        </div>
                    </div>
                 )}
            </div>
        </ScrollArea>
      <div className="border-t bg-card">
        <div className="relative p-4 max-w-6xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez une question sur vos recettes, vos coûts, ou demandez un conseil..."
            className="w-full resize-none pr-20 min-h-[48px]"
            rows={1}
            disabled={isLoading}
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-2">
            <Button type="submit" size="icon" onClick={() => handleSendMessage()} disabled={!input.trim() || isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
