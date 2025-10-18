import { NextResponse } from 'next/server';
import { runMenuAnalysis } from '@/ai/flows/menu-analysis-flow';
import type { SimplifiedAnalysisInput } from '@/ai/flows/menu-analysis-flow';

export async function POST(req: Request) {
  try {
    const body: SimplifiedAnalysisInput = await req.json();
    
    if (!body || !body.production) {
        return NextResponse.json({ error: 'Données d\'analyse invalides ou manquantes.' }, { status: 400 });
    }

    const result = await runMenuAnalysis(body);
    
    return NextResponse.json(result);

  } catch (err: any) {
    console.error('Error in API route /api/menu-analysis:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur inattendue.' }, { status: 500 });
  }
}
