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

import { nextJSHandler } from '@genkit-ai/next';
import { config } from 'dotenv';
import cors from 'cors';
import express from 'express';

// This is required for Next.js experimental support for Genkit.
config();

// Dynamically import all flows from the flows directory
const flows = require.context('@/ai/flows', true, /\.ts$/);
flows.keys().forEach(flows);

const app = express();
app.use(cors({ origin: '*' }));

export const POST = nextJSHandler();
