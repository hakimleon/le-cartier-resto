
'use server';

import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Configure Cloudinary only if all credentials are provided
if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    });
} else {
    console.error("Certaines variables d'environnement Cloudinary sont manquantes. Assurez-vous que NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, et CLOUDINARY_API_SECRET sont définies dans votre fichier .env");
}


export async function getCloudinaryImages() {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('La configuration de Cloudinary est incomplète côté serveur. Veuillez vérifier vos variables d\'environnement.');
  }

  try {
    const { resources } = await cloudinary.search
      .expression('')
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
