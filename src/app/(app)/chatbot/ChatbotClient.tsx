
"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, CornerDownLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatbotClient() {
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
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const response = await fetch('/api/genkit/chatbotFlow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Envoi UNIQUEMENT de la question actuelle pour simplifier
            body: JSON.stringify(messageContent),
        });
        
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({error: {message: "Réponse invalide du serveur."}}));
            throw new Error(errorBody.error?.message || `Le serveur a répondu avec le statut : ${response.status}`);
        }

        const responseData = await response.json();
        
        if (!responseData?.content) {
             throw new Error("La réponse de l'assistant est vide ou mal formée.");
        }

        const aiMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: responseData.content
        };
        setMessages(prev => [...prev, aiMessage]);

    } catch (error: any) {
        console.error("Error calling chat flow:", error);
        toast({
            title: "Erreur du Chatbot",
            description: error.message || "Je n'ai pas pu traiter votre demande.",
            variant: "destructive"
        });
        setMessages(prev => prev.filter(msg => msg.id !== userMessage.id)); 
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
    <div className="flex flex-col h-[calc(100vh-10rem)] w-full max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-6">
            <div className="bg-muted text-muted-foreground rounded-lg h-12 w-12 flex items-center justify-center shrink-0">
                <Bot className="h-6 w-6" />
            </div>
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">Chatbot</h1>
                <p className="text-muted-foreground">Un nouvel assistant pour répondre à vos questions.</p>
            </div>
        </header>

        <Card className="flex-1 flex flex-col h-full overflow-hidden">
            <ScrollArea className="flex-1" ref={scrollAreaRef as any}>
                <div className="space-y-6 p-4">
                    {messages.length === 0 && !isLoading && (
                        <div className="text-center py-8">
                            <div className="flex justify-center mb-4">
                                <Sparkles className="w-10 h-10 text-primary" />
                            </div>
                            <h2 className="mt-2 text-lg font-semibold text-foreground">Posez-moi une question.</h2>
                        </div>
                    )}
                    {messages.map((m) => (
                        <div key={m.id} className={cn("flex items-start gap-3 w-full", m.role === 'user' ? 'justify-end' : 'justify-start')}>
                            {m.role === 'assistant' && (
                                <Avatar className="w-8 h-8 border shrink-0">
                                    <AvatarFallback><Bot className="w-5 h-5"/></AvatarFallback>
                                </Avatar>
                            )}
                            <div className={cn("max-w-[85%] rounded-lg p-3 text-sm", m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border')}>
                                {m.role === 'assistant' ? <MarkdownRenderer text={m.content} /> : m.content}
                            </div>
                            {m.role === 'user' && (
                                <Avatar className="w-8 h-8 border shrink-0">
                                    <AvatarFallback><User className="w-5 h-5"/></AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <Avatar className="w-8 h-8 border shrink-0">
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
                    className="w-full resize-none pr-12 min-h-[48px] rounded-lg"
                    rows={1}
                    disabled={isLoading}
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex gap-2">
                    <Button type="submit" size="icon" className="h-9 w-9" onClick={() => handleSendMessage()} disabled={!input.trim() || isLoading}>
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
                </div>
            </div>
        </Card>
    </div>
  );
}
