
'use server';
/**
 * @fileOverview Server Action pour interagir directement avec l'API Gemini.
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, type Content } from "@google/generative-ai";
import type { Message } from 'genkit';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Recipe, Preparation, Ingredient, RecipeIngredientLink } from '@/lib/types';


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
        const [recipesSnap, prepsSnap, ingredientsSnap, linksSnap] = await Promise.all([
            getDocs(query(collection(db, "recipes"), where("type", "==", "Plat"))),
            getDocs(collection(db, "preparations")),
            getDocs(collection(db, "ingredients")),
            getDocs(collection(db, "recipeIngredients"))
        ]);

        const allDishes = recipesSnap.docs.map(doc => doc.data() as Recipe);
        const allPreparations = prepsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Preparation));
        const allIngredients = ingredientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ingredient));
        const allLinks = linksSnap.docs.map(doc => doc.data() as RecipeIngredientLink);

        const ingredientsMap = new Map(allIngredients.map(ing => [ing.id, ing.name]));

        let context = "Tu es un assistant pour le restaurant 'Le Singulier'. Réponds aux questions en te basant sur le contexte suivant. Sois concis et direct.\n\n";

        context += "=== PLATS AU MENU ===\n";
        if (allDishes.length > 0) {
            allDishes.forEach(dish => {
                context += `- NOM: ${dish.name} (Catégorie: ${dish.category}, Prix: ${dish.price} DZD, Statut: ${dish.status})\n`;
            });
        } else {
            context += "Aucun plat au menu pour le moment.\n";
        }

        context += "\n=== PRÉPARATIONS DISPONIBLES (FICHES TECHNIQUES) ===\n";
        if (allPreparations.length > 0) {
            allPreparations.forEach(prep => {
                context += `- NOM: ${prep.name}\n`;
                const prepIngredients = allLinks
                    .filter(link => link.recipeId === prep.id)
                    .map(link => {
                        const ingredientName = ingredientsMap.get(link.ingredientId);
                        if(ingredientName) {
                            return `${ingredientName} (${link.quantity} ${link.unitUse})`;
                        }
                        return null;
                    })
                    .filter(Boolean);
                
                if (prepIngredients.length > 0) {
                    context += `  - Ingrédients: ${prepIngredients.join(', ')}\n`;
                } else {
                    context += `  - Ingrédients: Non spécifiés.\n`;
                }

                // Ajout des étapes de la procédure
                let procedureText = [prep.procedure_preparation, prep.procedure_cuisson, prep.procedure_service].filter(Boolean).join('\n');
                if (procedureText) {
                    context += `  - Procédure:\n${procedureText.split('\n').map(line => `    ${line}`).join('\n')}\n`;
                } else {
                    context += `  - Procédure: Non spécifiée.\n`;
                }
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
          systemInstruction: applicationContext,
        });
        
        const chat = model.startChat({
            history: convertToGoogleAIMessages(history),
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
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.2
            },
        });

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        
        return response.text();

    } catch (error) {
        console.error("Error in sendMessageToChat:", error);
        if (error instanceof Error) {
            // Provide a more user-friendly error message
            return `Erreur lors de la communication avec l'IA: ${error.message}`;
        }
        return "Erreur inconnue lors de la communication avec l'IA.";
    }
}
