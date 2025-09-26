
'use server';

import { v2 as cloudinary } from 'cloudinary';

// La bibliothèque Cloudinary utilise automatiquement les variables d'environnement
// CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, et CLOUDINARY_API_SECRET si elles sont définies.
// Pas besoin d'appeler cloudinary.config() manuellement ici.

export async function getCloudinaryImages() {
  // Vérification que les variables d'environnement sont bien présentes
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET || !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    console.error("Les variables d'environnement Cloudinary sont manquantes.");
    throw new Error('La configuration de Cloudinary est incomplète côté serveur.');
  }

  try {
    const { resources } = await cloudinary.search
      .expression('resource_type:image') // Recherche toutes les images
      .sort_by('created_at', 'desc')
      .max_results(50)
      .execute();
      
    return resources.map((file: { public_id: string; secure_url: string; }) => ({
      public_id: file.public_id,
      secure_url: file.secure_url,
    }));

  } catch (error) {
    console.error('Error fetching images from Cloudinary:', error);
    throw new Error('Could not fetch images from Cloudinary.');
  }
}
