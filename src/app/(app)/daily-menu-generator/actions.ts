"use server";

import { z } from "zod";
import {
  generateDailyMenu,
  type GenerateDailyMenuOutput,
} from "@/ai/flows/generate-daily-menu";

const FormSchema = z.object({
  theme: z.string().min(3, { message: "Veuillez préciser le thème." }),
  constraints: z.string().min(5, { message: "Veuillez donner quelques contraintes." }),
});

export type FormState = {
  message: string;
  fields?: Record<string, string>;
  issues?: string[];
  data?: GenerateDailyMenuOutput;
};

export async function generateMenu(
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
        theme: validatedFields.error.flatten().fieldErrors.theme?.join(", "),
        constraints: validatedFields.error.flatten().fieldErrors.constraints?.join(", "),
      },
      issues: errors.map((issue) => issue.message),
    };
  }

  try {
    const result = await generateDailyMenu(validatedFields.data);
    return {
      message: "Menu généré avec succès !",
      data: result,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Une erreur est survenue lors de la communication avec l'IA. Veuillez réessayer.",
    };
  }
}
