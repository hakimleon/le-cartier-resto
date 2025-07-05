"use server";

import { z } from "zod";
import {
  recommendDynamicPricing,
  type RecommendDynamicPricingOutput,
} from "@/ai/flows/recommend-dynamic-pricing";

const FormSchema = z.object({
  dishName: z.string().min(3, { message: "Le nom du plat est requis." }),
  currentPrice: z.coerce.number().positive({ message: "Le prix actuel doit être positif." }),
  demandEstimate: z.coerce.number().min(1).max(5, { message: "L'estimation de la demande est requise." }),
  competitorPrice: z.coerce.number().positive({ message: "Le prix du concurrent doit être positif." }),
});

export type FormState = {
  message: string;
  fields?: Record<string, string>;
  issues?: string[];
  data?: RecommendDynamicPricingOutput;
};

export async function getPricingRecommendation(
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
        dishName: validatedFields.error.flatten().fieldErrors.dishName?.join(", "),
        currentPrice: validatedFields.error.flatten().fieldErrors.currentPrice?.join(", "),
        demandEstimate: validatedFields.error.flatten().fieldErrors.demandEstimate?.join(", "),
        competitorPrice: validatedFields.error.flatten().fieldErrors.competitorPrice?.join(", "),
      },
      issues: errors.map((issue) => issue.message),
    };
  }

  try {
    const result = await recommendDynamicPricing(validatedFields.data);
    return {
      message: "Recommandation générée avec succès !",
      data: result,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Une erreur est survenue lors de la communication avec l'IA. Veuillez réessayer.",
    };
  }
}
