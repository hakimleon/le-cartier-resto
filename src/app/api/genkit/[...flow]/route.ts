
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
import '@/ai/flows/recipe-workshop-flow';
import '@/ai/flows/preparation-workshop-flow';
import '@/ai/flows/garnish-workshop-flow';
import '@/ai/flows/suggestion-flow';
import '@/ai/flows/assistant-flow';
import '@/ai/flows/menu-analysis-flow';
import '@/ai/flows/temporal-analysis-flow';

// We don't import workshop-flow directly as it only contains types/schemas
// and they are imported by the flows that use them.

config();

export const POST = appRoute();
