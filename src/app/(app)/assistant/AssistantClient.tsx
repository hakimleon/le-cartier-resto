
"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, CornerDownLeft, Mic, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { chat } from '@/ai/flows/assistant-flow';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const allExamplePrompts = [
    "Quel est le plat le plus rentable de ma carte ?",
    "Suggère-moi un plat végétarien pour l'automne.",
    "Liste-moi tous les ingrédients en stock critique.",
    "Donne-moi une idée de plat à base de saumon et d'avocat.",
    "Quel est le plat le moins cher à produire ?",
    "Quels sont les allergènes présents dans le Tiramisu ?",
    "Propose une entrée de saison avec des champignons.",
    "Combien de préparations utilisent de la crème ?"
];

const shuffleArray = (array: string[]) => {
  let currentIndex = array.length,  randomIndex;
  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

export default function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [displayedPrompts, setDisplayedPrompts] = useState<string[]>([]);
   
  useEffect(() => {
    // This will only run on the client, preventing hydration mismatches.
    setDisplayedPrompts(shuffleArray([...allExamplePrompts]).slice(0, 4));
  }, []);

  const handleSendMessage = async (prompt?: string) => {
    const messageContent = prompt || input;
    if (!messageContent.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
    };
    
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
        const chatHistoryForApi = newMessages.map(({ id, ...rest }) => rest);
        const response = await chat({ history: chatHistoryForApi });
        
        if (!response?.content) {
             throw new Error("La réponse de l'assistant est vide.");
        }

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
    <div className="fixed bottom-6 right-6 z-50">
        {isOpen && (
             <Card className="flex flex-col h-[600px] w-[400px] shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                           <Bot className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Assistant Le Singulier</CardTitle>
                    </div>
                     <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </CardHeader>
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <ScrollArea className="flex-1" ref={scrollAreaRef as any}>
                        <div className="space-y-6 p-4">
                            {messages.length === 0 && !isLoading && (
                                <div className="text-center pt-8">
                                    <h2 className="mt-2 text-lg font-semibold text-foreground">Comment puis-je vous aider ?</h2>
                                    <div className="mt-4 grid grid-cols-1 gap-2">
                                        {displayedPrompts.map(prompt => (
                                            <Card key={prompt} className="p-3 text-left hover:bg-muted transition-colors cursor-pointer" onClick={() => handleSendMessage(prompt)}>
                                                <p className="text-sm font-medium">{prompt}</p>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {messages.map((m) => (
                                <div key={m.id} className={cn("flex items-start gap-3", m.role === 'user' ? 'justify-end' : '')}>
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
                                <div className="flex items-start gap-3">
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
                    <div className="border-t">
                        <div className="relative p-3">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Posez une question..."
                            className="w-full resize-none pr-12 min-h-[40px]"
                            rows={1}
                            disabled={isLoading}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                            <Button type="submit" size="icon" className="h-8 w-8" onClick={() => handleSendMessage()} disabled={!input.trim() || isLoading}>
                            <Send className="w-4 h-4" />
                            </Button>
                        </div>
                        </div>
                    </div>
                </div>
            </Card>
        )}
       
        <Button 
            size="lg"
            className="rounded-full w-16 h-16 shadow-lg"
            onClick={() => setIsOpen(!isOpen)}
        >
            {isOpen ? <X className="h-7 w-7" /> : <Bot className="h-7 w-7" />}
        </Button>
    </div>
  );
}
