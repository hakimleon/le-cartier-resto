
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bot, Send, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Message, MessageData } from 'genkit';
import { sendMessageToChat } from './actions';

export default function AssistantClient() {
  const [history, setHistory] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [history]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentInput = input;
    const userMessage: Message = { role: 'user', content: [{ text: currentInput }] };
    
    const updatedHistory = [...history, userMessage];
    
    setHistory(updatedHistory);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToChat(updatedHistory as MessageData[], currentInput);
      
      const modelMessage: Message = { role: 'model', content: [{ text: responseText }] };
      
      setHistory(prevHistory => [...prevHistory, modelMessage]);

    } catch (error) {
      console.error('Error calling chat action:', error);
      const displayError = 'Désolé, une erreur est survenue. Veuillez réessayer.';

      const errorMessage: Message = {
        role: 'model',
        content: [{ text: displayError }],
      };

      setHistory((prevHistory) => [...prevHistory, errorMessage]);

    } finally {
      setIsLoading(false);
    }
  };


  return (
      <Card className="w-full h-full flex flex-col rounded-lg border-0 md:border">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6" />
            <span>Assistant Le Cartier</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-4 md:p-6 space-y-6">
              {history.length === 0 ? (
                <div className="text-center text-muted-foreground pt-16">
                  <p>Posez-moi une question !</p>
                   <p className="text-xs mt-2">Ex: "Quels sont les ingrédients de la sauce béchamel ?"</p>
                </div>
              ) : (
                history.map((message, index) => {
                  const messageText = message.content[0].text || '';

                  return (
                  <div
                    key={index}
                    className={cn(
                      'flex items-start gap-4',
                      message.role === 'user' ? 'justify-end' : ''
                    )}
                  >
                    {message.role === 'model' && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Bot className="h-5 w-5" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-4 p-3 text-sm',
                        message.role === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-muted'
                      )}
                    >
                      <MarkdownRenderer text={messageText}/>
                    </div>
                     {message.role === 'user' && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                )})
              )}
               {isLoading && (
                 <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div className="max-w-[80%] rounded-lg px-4 py-3 text-sm bg-muted flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Réflexion...</span>
                      </div>
                 </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question ici..."
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Envoyer</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
  );
}
