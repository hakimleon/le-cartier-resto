
'use server';

import { chatbotFlow } from '@/ai/flows/chatbot-flow';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // L'entrée est maintenant un tableau de messages
    const messages = await req.json();

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: { message: 'Invalid input, expected an array of messages.' } }, { status: 400 });
    }

    const result = await chatbotFlow(messages);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[CHATBOT API ROUTE ERROR]', error);
    return NextResponse.json(
      { error: { message: error.message || 'An internal server error occurred in the chatbot route.' } },
      { status: 500 }
    );
  }
}
