
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const imageId = params.id;
  if (!imageId) {
    return new NextResponse('Image ID is required', { status: 400 });
  }
  
  // Basic security check to prevent directory traversal
  if (imageId.includes('..')) {
    return new NextResponse('Invalid image ID', { status: 400 });
  }

  const imagePath = path.join(process.cwd(), 'imagedata', imageId);

  try {
    const imageBuffer = await fs.readFile(imagePath);
    // You might want to get the actual mime type if you store different image formats
    const mimeType = 'image/png'; 

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error(`Image not found: ${imagePath}`, error);
    return new NextResponse('Image not found', { status: 404 });
  }
}
