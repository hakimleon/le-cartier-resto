
'use server';

import { assistantChatFlow } from '@/ai/flows/assistant-flow';
import { NextRequest, NextResponse } from 'next/server';

// Importer les outils pour s'assurer qu'ils sont enregistrés
import '@/ai/tools/assistant-tools';

export async function POST(req: NextRequest) {
  try {
    const messages = await req.json();

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: { message: 'Invalid input, expected an array of messages.' } }, { status: 400 });
    }

    const result = await assistantChatFlow(messages);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[CHATBOT API ROUTE ERROR]', error);
    return NextResponse.json(
      { error: { message: error.message || 'An internal server error occurred in the chatbot route.' } },
      { status: 500 }
    );
  }
}
