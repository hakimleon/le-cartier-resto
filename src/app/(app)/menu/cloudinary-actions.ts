
'use server';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryImage {
    asset_id: string;
    public_id: string;
    secure_url: string;
    created_at: string;
}

export async function getCloudinaryImages(): Promise<CloudinaryImage[]> {
  try {
    const { resources } = await cloudinary.search
      .expression('folder:le-singulier-ai-generated') // Toujours chercher dans ce dossier
      .sort_by('created_at', 'desc')
      .max_results(50)
      .execute();
      
    return resources.map((file: any) => ({
        asset_id: file.asset_id,
        public_id: file.public_id,
        secure_url: file.secure_url,
        created_at: file.created_at,
    }));

  } catch (error) {
    console.error('Error fetching images from Cloudinary:', error);
    return [];
  }
}
