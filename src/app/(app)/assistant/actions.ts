
'use server';
/**
 * @fileOverview Server Action pour interagir directement avec l'API Gemini.
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, type Content } from "@google/generative-ai";
import type { Message } from 'genkit';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Recipe, Preparation } from '@/lib/types';


const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    throw new Error("La variable d'environnement GEMINI_API_KEY est manquante.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Convertir notre type Message Genkit en type attendu par le SDK @google/genai
const convertToGoogleAIMessages = (history: Message[]): Content[] => {
    return history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: msg.content.map(part => ({ text: part.text || '' }))
    }));
}

/**
 * Fetches data from Firestore and formats it as a string for context.
 */
async function getApplicationContext(): Promise<string> {
    try {
        // Fetch dishes
        const recipesQuery = query(collection(db, "recipes"), where("type", "==", "Plat"));
        const recipesSnapshot = await getDocs(recipesQuery);
        const allDishes = recipesSnapshot.docs.map(doc => doc.data() as Recipe);

        // Fetch preparations
        const preparationsSnapshot = await getDocs(collection(db, "preparations"));
        const allPreparations = preparationsSnapshot.docs.map(doc => doc.data() as Preparation);

        let context = "Voici les données de l'application que tu dois utiliser pour répondre aux questions. Ne te base que sur ces informations.\n\n";

        context += "=== PLATS AU MENU ===\n";
        if (allDishes.length > 0) {
            allDishes.forEach(dish => {
                context += `- ${dish.name} (Catégorie: ${dish.category}, Prix: ${dish.price} DZD, Statut: ${dish.status})\n`;
            });
        } else {
            context += "Aucun plat au menu pour le moment.\n";
        }

        context += "\n=== PRÉPARATIONS DISPONIBLES ===\n";
        if (allPreparations.length > 0) {
            allPreparations.forEach(prep => {
                context += `- ${prep.name}\n`;
            });
        } else {
            context += "Aucune préparation disponible pour le moment.\n";
        }

        return context;
    } catch (error) {
        console.error("Error fetching application context:", error);
        return "Erreur lors de la récupération des données de l'application.";
    }
}


export async function sendMessageToChat(history: Message[], prompt: string): Promise<string> {
    try {
        const applicationContext = await getApplicationContext();

        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          // Correction: L'instruction système est passée ici, au moment de la récupération du modèle.
          systemInstruction: `Tu es un assistant pour le restaurant "Le Singulier". Réponds aux questions en te basant sur le contexte suivant. Sois concis et direct.\n\n${applicationContext}`,
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
          ],
        });
        
        const chat = model.startChat({
            // L'historique ne doit contenir que les messages PRÉCÉDENTS.
            history: convertToGoogleAIMessages(history),
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        
        return response.text();

    } catch (error) {
        console.error("Error in sendMessageToChat:", error);
        if (error instanceof Error) {
            return `Erreur lors de la communication avec l'IA: ${error.message}`;
        }
        return "Erreur inconnue lors de la communication avec l'IA.";
    }
}
