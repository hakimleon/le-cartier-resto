
'use server';

import { chatbotFlow } from '@/ai/flows/chatbot-flow';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const prompt = await req.json();

    if (typeof prompt !== 'string') {
      return NextResponse.json({ error: { message: 'Invalid input, expected a string.' } }, { status: 400 });
    }

    // On exécute directement le flow avec la question
    const result = await chatbotFlow(prompt);

    // On retourne la réponse
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[CHATBOT API ROUTE ERROR]', error);
    // On retourne une erreur claire en cas de problème
    return NextResponse.json(
      { error: { message: error.message || 'An internal server error occurred in the chatbot route.' } },
      { status: 500 }
    );
  }
}
