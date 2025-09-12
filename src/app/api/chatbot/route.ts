
'use server';

import { chatbotFlow } from '@/ai/flows/assistant-flow';
import { NextRequest, NextResponse } from 'next/server';

// Importer les outils pour s'assurer qu'ils sont enregistrés
import '@/ai/tools/recipe-tools';
import '@/ai/tools/menu-tools';

export async function POST(req: NextRequest) {
  try {
    const { history, prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Le 'prompt' est manquant dans la requête." },
        { status: 400 }
      );
    }
    
    // Le streaming n'est pas nécessaire pour ce chatbot simple, on attend la réponse complète.
    const result = await chatbotFlow({ history: history || [], prompt });

    return NextResponse.json({ message: result.response });

  } catch (e: any) {
    console.error('Erreur dans la route du chatbot:', e);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du traitement de votre demande.", details: e.message },
      { status: 500 }
    );
  }
}
