'use server';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function getCloudinaryImages() {
  try {
    const { resources } = await cloudinary.search
      .expression('resource_type:image')
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
