"use server";

import { z } from "zod";
import {
  optimizeMenuSuggestions,
  type OptimizeMenuSuggestionsOutput,
} from "@/ai/flows/optimize-menu-suggestions";

const FormSchema = z.object({
  availableIngredients: z.string().min(10, { message: "Veuillez fournir plus de détails sur les ingrédients." }),
  predictedDemand: z.string().min(10, { message: "Veuillez fournir plus de détails sur la demande." }),
  currentTrends: z.string().min(10, { message: "Veuillez fournir plus de détails sur les tendances." }),
});

export type FormState = {
  message: string;
  fields?: Record<string, string>;
  issues?: string[];
  data?: OptimizeMenuSuggestionsOutput;
};

export async function getMenuSuggestions(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = FormSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    const { errors } = validatedFields.error;

    return {
      message: "Le formulaire contient des erreurs.",
      fields: {
        availableIngredients: validatedFields.error.flatten().fieldErrors.availableIngredients?.join(", "),
        predictedDemand: validatedFields.error.flatten().fieldErrors.predictedDemand?.join(", "),
        currentTrends: validatedFields.error.flatten().fieldErrors.currentTrends?.join(", "),
      },
      issues: errors.map((issue) => issue.message),
    };
  }

  try {
    const result = await optimizeMenuSuggestions(validatedFields.data);
    return {
      message: "Suggestions générées avec succès !",
      data: result,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Une erreur est survenue lors de la communication avec l'IA. Veuillez réessayer.",
    };
  }
}
