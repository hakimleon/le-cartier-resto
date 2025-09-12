/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use server';

import { appRoute } from '@genkit-ai/next';
import { config } from 'dotenv';
import { chatFlow } from '@/ai/flows/assistant-flow';
import { generateRecipeConceptFlow } from '@/ai/flows/recipe-workshop-flow';

config();

// Registre des flows accessibles par URL.
// La clé (ex: 'assistantChatFlow') doit correspondre exactement au dernier segment de l'URL de l'API.
// ex: POST /api/genkit/assistantChatFlow
const flows: Record<string, any> = {
  assistantChatFlow: chatFlow,
  generateRecipeConceptFlow: generateRecipeConceptFlow,
  // Ajoutez d'autres flows exportés ici si nécessaire
};

// Importe tous les flows pour s'assurer qu'ils sont bien enregistrés auprès de Genkit,
// même s'ils ne sont pas dans le registre ci-dessus.
import '@/ai/flows/assistant-flow';
import '@/ai/flows/recipe-workshop-flow';
import '@/ai/flows/suggestion-flow';
import '@/ai/flows/workshop-flow';


export async function POST(req: Request, { params }: { params: { flow: string[] } }) {
  const flowName = params.flow?.[0]; // Ex: "assistantChatFlow"
  const flow = flowName ? flows[flowName] : null;

  if (!flow) {
    // If no specific flow is matched in our registry, fall back to the default handler
    // which will try to find any registered flow matching the name.
    return appRoute()(req, { params });
  }

  // Délègue la requête au handler de Genkit pour le flow trouvé
  return appRoute({flow})(req, { params });
}
