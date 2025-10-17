'use server';

import { NextResponse } from 'next/server';
import { runMenuAnalysis } from '@/ai/flows/menu-analysis-flow';
import type { AnalysisInput } from '@/ai/flows/menu-analysis-flow';

export async function POST(req: Request) {
  try {
    const body: AnalysisInput = await req.json();
    
    if (!body || !body.production || !body.summary) {
        return NextResponse.json({ error: 'Données d\'analyse invalides ou manquantes.' }, { status: 400 });
    }

    const result = await runMenuAnalysis(body);
    
    // runMenuAnalysis ne devrait pas lancer d'erreur mais retourner un objet avec une clé 'error' en cas de problème.
    // Cependant, nous vérifions au cas où.
    if ('error' in result && result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (err: any) {
    console.error('Error in API route /api/menu-analysis:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur inattendue.' }, { status: 500 });
  }
}
