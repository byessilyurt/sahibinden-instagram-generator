import { NextRequest, NextResponse } from 'next/server';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { StoryProps } from '@/components/StoryTemplate';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';
import { createTempDir, saveBase64ImagesToFiles, cleanupTempFiles } from '@/lib/imageUtils';

// API route config - video rendering takes longer
export const maxDuration = 120; // 2 minutes timeout

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Preflight (OPTIONS) request handler
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// Detect image orientation from buffer
async function getImageOrientation(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata();
    return (metadata.width || 0) > (metadata.height || 0); // true = landscape
  } catch {
    return false; // Default to portrait on error
  }
}

// Save base64 and detect orientation
async function processImages(
  images: string[],
  tempDir: string,
  publicSubPath: string,
  baseUrl: string
): Promise<{
  urls: string[];
  orientations: boolean[];
  errors: string[];
}> {
  const urls: string[] = [];
  const orientations: boolean[] = [];
  const errors: string[] = [];

  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  for (let i = 0; i < images.length; i++) {
    try {
      const base64String = images[i];
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');

      if (!base64Data || base64Data.length < 100) {
        throw new Error(`Image ${i + 1}: Too small or invalid`);
      }

      // Detect file extension
      let extension = 'jpg';
      const matches = base64String.match(/^data:image\/(\w+);base64,/);
      if (matches && matches[1]) {
        extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      }

      // Decode to buffer
      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length < 1000) {
        throw new Error(`Image ${i + 1}: Decoded buffer too small`);
      }

      // Detect orientation
      const isLandscape = await getImageOrientation(buffer);
      orientations.push(isLandscape);

      // Save to file
      const uniqueId = crypto.randomBytes(8).toString('hex');
      const fileName = `img-${i + 1}-${uniqueId}.${extension}`;
      const filePath = path.join(tempDir, fileName);
      fs.writeFileSync(filePath, buffer);

      // Generate URL
      const url = `${baseUrl}/${publicSubPath}/${fileName}`;
      urls.push(url);

      console.log(`  ✓ Image ${i + 1}: ${(buffer.length / 1024).toFixed(2)} KB, ${isLandscape ? 'landscape' : 'portrait'}`);
    } catch (err) {
      const errorMsg = `Image ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`;
      console.error(`  ✗ ${errorMsg}`);
      errors.push(errorMsg);
      // Push empty values to maintain array indices
      urls.push('');
      orientations.push(false);
    }
  }

  return { urls, orientations, errors };
}

export async function POST(req: NextRequest) {
  let tempDir: string | null = null;
  let videoOutputPath: string | null = null;

  try {
    const body = await req.json();
    const {
      baslik,
      fiyat,
      konum,
      images,
      agentName,
      agentPhone,
      agentLogo,
    } = body;

    console.log('🎬 Video Generation Started!');

    // Server host info for absolute URLs
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;
    console.log('🌐 Base URL:', baseUrl);

    // Check bundle exists
    const bundleLocationPath = path.join(process.cwd(), 'public', 'bundle-location.json');
    if (!fs.existsSync(bundleLocationPath)) {
      console.error('❌ Bundle not found! Run: node scripts/bundle-remotion.mjs');
      return NextResponse.json({
        error: 'Remotion bundle not found. Please run the bundle script.'
      }, { status: 500, headers: corsHeaders });
    }

    const bundleInfo = JSON.parse(fs.readFileSync(bundleLocationPath, 'utf-8'));
    const bundleLocation = bundleInfo.bundleLocation;
    console.log('📦 Bundle location:', bundleLocation);

    // Validate images
    if (!images || images.length === 0) {
      return NextResponse.json({
        error: 'At least one image is required'
      }, { status: 400, headers: corsHeaders });
    }

    // Create temp directory in public folder
    const publicDir = path.join(process.cwd(), 'public');
    const { tempDir: tempDirPath, publicSubPath } = createTempDir(publicDir);
    tempDir = tempDirPath;
    console.log('📁 Temp directory created:', tempDir);

    // Process images (save to files and detect orientations)
    console.log(`🖼️  Processing ${images.length} images...`);
    const { urls, orientations, errors } = await processImages(
      images.slice(0, 6), // Max 6 images
      tempDir,
      publicSubPath,
      baseUrl
    );

    const validUrls = urls.filter(Boolean);
    if (validUrls.length === 0) {
      throw new Error('No valid images could be processed');
    }

    console.log(`✅ ${validUrls.length} images processed successfully`);
    if (errors.length > 0) {
      console.warn(`⚠️  ${errors.length} images had errors (skipped)`);
    }

    // Process agent logo if provided
    let agentLogoUrl = '';
    if (agentLogo) {
      try {
        const logoBase64Data = agentLogo.replace(/^data:image\/\w+;base64,/, '');
        const logoBuffer = Buffer.from(logoBase64Data, 'base64');
        const logoFileName = `agent-logo-${crypto.randomBytes(4).toString('hex')}.png`;
        const logoPath = path.join(tempDir, logoFileName);
        fs.writeFileSync(logoPath, logoBuffer);
        agentLogoUrl = `${baseUrl}/${publicSubPath}/${logoFileName}`;
        console.log('✅ Agent logo processed');
      } catch (err) {
        console.warn('⚠️  Could not process agent logo:', err);
      }
    }

    // Pad arrays to 6 elements
    while (urls.length < 6) {
      urls.push(urls[urls.length - 1] || '');
      orientations.push(false);
    }

    // Build input props
    const inputProps: StoryProps = {
      baslik: baslik || 'Başlık Yok',
      fiyat: fiyat || 'Fiyat Yok',
      konum: konum || '',
      image1: urls[0] || '',
      image2: urls[1] || '',
      image3: urls[2] || '',
      image4: urls[3] || '',
      image5: urls[4] || '',
      image6: urls[5] || '',
      agentName: agentName || '',
      agentPhone: agentPhone || '',
      agentLogo: agentLogoUrl,
      imageOrientations: orientations,
    };

    console.log('🎨 Selecting composition: InstagramStory');

    // Select composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'InstagramStory',
      inputProps,
    });

    console.log('🎬 Starting video render...');
    console.log('   Duration:', composition.durationInFrames, 'frames');
    console.log('   Size:', composition.width, 'x', composition.height);

    // Create video output path
    videoOutputPath = path.join(tempDir, `video-${crypto.randomBytes(8).toString('hex')}.mp4`);

    // Render video
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: videoOutputPath,
      inputProps,
    });

    console.log('✅ Video rendered successfully!');

    // Read video file
    const videoBuffer = fs.readFileSync(videoOutputPath);
    console.log(`📹 Video size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Cleanup temp files
    console.log('🧹 Cleaning up temp files...');
    cleanupTempFiles(tempDir);
    console.log('✅ Cleanup complete');

    // Return video
    return new NextResponse(new Uint8Array(videoBuffer), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="instagram-story.mp4"',
        'Content-Length': videoBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Video generation error:', error);

    // Cleanup on error
    if (tempDir) {
      try {
        console.log('🧹 Cleaning up after error...');
        cleanupTempFiles(tempDir);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }

    return NextResponse.json({
      error: 'Video generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500, headers: corsHeaders });
  }
}
