'use server';

import { v2 as cloudinary } from 'cloudinary';
import 'server-only';

const FOLDER_NAME = process.env.CLOUDINARY_FOLDER || 'le-singulier-ai-generated';

// La configuration est implicite si les variables d'environnement sont définies.
// Mais nous devons vérifier qu'elles existent.
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error("La configuration de Cloudinary est incomplète côté serveur.");
}

export interface CloudinaryResource {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
}

export async function getCloudinaryImages(): Promise<{images: CloudinaryResource[], error?: string}> {
    try {
        // Re-vérification au cas où l'erreur de console ci-dessus n'arrête pas le processus
        if (!process.env.CLOUDINARY_API_KEY) {
             throw new Error("La configuration de Cloudinary est incomplète côté serveur.");
        }

        const results = await cloudinary.search
            .expression(`folder:${FOLDER_NAME}`)
            .sort_by('created_at', 'desc')
            .max_results(50)
            .execute();

        const images = results.resources.map((resource: any) => ({
            public_id: resource.public_id,
            secure_url: resource.secure_url,
            width: resource.width,
            height: resource.height,
        }));

        return { images };

    } catch (error) {
        console.error("Could not fetch images from Cloudinary.", error);
        if (error instanceof Error) {
            return { images: [], error: error.message };
        }
        return { images: [], error: "Une erreur inconnue est survenue." };
    }
}
