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

// Import all flows to ensure they are registered with Genkit
import { chatFlow } from '@/ai/flows/assistant-flow';
import { generateRecipeConceptFlow } from '@/ai/flows/recipe-workshop-flow';
import '@/ai/flows/suggestion-flow';
import '@/ai/flows/workshop-flow';
import { chatbotFlow } from '@/ai/flows/chatbot-flow';


config();

// Registry of flows accessible via URL
// Note: The key here must match the `name` property of the flow defined with `ai.defineFlow`.
const flowRegistry: Record<string, any> = {
  assistantChatFlow: chatFlow,
  generateRecipeConceptFlow: generateRecipeConceptFlow,
  chatbotFlow: chatbotFlow,
};


export async function POST(req: Request, { params }: { params: { flow: string[] } }) {
  const flowName = params.flow?.[0];
  
  // First, check our explicit registry for a match.
  // This is useful if the URL slug is different from the flow's defined name.
  const registeredFlow = flowName ? flowRegistry[flowName] : null;

  if (registeredFlow) {
    return appRoute({ flow: registeredFlow })(req, { params });
  }

  // If not in the registry, fall back to the default Genkit behavior
  // which finds any flow by its defined `name`. This should handle all flows
  // as long as their name is consistent with the URL.
  return appRoute()(req, { params });
}
