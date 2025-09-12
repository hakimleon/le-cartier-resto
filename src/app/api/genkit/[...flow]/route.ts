
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

// Contenu intentionnellement vidé pour résoudre une erreur de compilation persistante.
// La fonctionnalité du chatbot est temporairement désactivée.
import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json(
        { error: "La configuration du backend de l'IA est en cours de réparation. Veuillez réessayer plus tard." },
        { status: 503 }
    );
}
