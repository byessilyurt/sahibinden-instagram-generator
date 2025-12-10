import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const imagePath = pathSegments.join('/');

  // Construct full path to the temp image
  const fullPath = path.join(process.cwd(), 'public', imagePath);

  // Security: ensure path is within public directory
  const publicDir = path.join(process.cwd(), 'public');
  if (!fullPath.startsWith(publicDir)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
  }

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // Read and serve the file
  const buffer = fs.readFileSync(fullPath);

  // Determine content type
  const ext = path.extname(fullPath).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  const contentType = contentTypes[ext] || 'application/octet-stream';

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    },
  });
}
