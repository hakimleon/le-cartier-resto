
'use server';

import { v2 as cloudinary } from 'cloudinary';
import 'server-only';

// La configuration est implicite si les variables d'environnement sont définies.
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
