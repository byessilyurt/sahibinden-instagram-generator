import { NextRequest, NextResponse } from 'next/server';
import { renderStill, selectComposition } from '@remotion/renderer';
import { PostProps } from '@/components/PostTemplate';
import fs from 'fs';
import path from 'path';
import { createTempDir, saveBase64ImagesToFiles, cleanupTempFiles } from '@/lib/imageUtils';

// API route config - büyük body'lere izin ver
export const maxDuration = 60; // 60 saniye timeout

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // veya 'https://www.sahibinden.com' (daha güvenli)
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 saat
};

// Preflight (OPTIONS) request handler
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  let tempDir: string | null = null;

  try {
    const body = await req.json();
    const { baslik, fiyat, konum, images } = body;

    console.log('🔥 Backend Tetiklendi! Veri işleniyor...');

    // Server host bilgisini al (Remotion için absolute URL gerekli)
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;
    console.log('🌐 Base URL:', baseUrl);

    // 1. Bundle lokasyonunu oku
    const bundleLocationPath = path.join(process.cwd(), 'public', 'bundle-location.json');

    if (!fs.existsSync(bundleLocationPath)) {
      console.error('❌ Bundle bulunamadı! Lütfen önce: node scripts/bundle-remotion.mjs');
      return NextResponse.json({
        error: 'Remotion bundle bulunamadı. Lütfen bundle scripti çalıştırın.'
      }, { status: 500, headers: corsHeaders });
    }

    const bundleInfo = JSON.parse(fs.readFileSync(bundleLocationPath, 'utf-8'));
    const bundleLocation = bundleInfo.bundleLocation;

    console.log('📦 Bundle lokasyonu:', bundleLocation);

    // 2. Base64 resimleri geçici dosyalara kaydet
    if (!images || images.length === 0) {
      return NextResponse.json({
        error: 'En az bir resim gönderilmelidir'
      }, { status: 400, headers: corsHeaders });
    }

    // Public klasörü altında benzersiz bir temp klasör oluştur
    const publicDir = path.join(process.cwd(), 'public');
    const { tempDir: tempDirPath, publicSubPath } = createTempDir(publicDir);
    tempDir = tempDirPath; // cleanup için sakla
    console.log('📁 Geçici klasör oluşturuldu:', tempDir);
    console.log('🌐 Public URL yolu:', publicSubPath);

    // Base64 stringlerini dosyalara çevir ve absolute HTTP URL'leri al
    console.log(`🖼️  ${images.length} adet Base64 resim dosyaya dönüştürülüyor...`);
    const { filePaths, urls, errors } = saveBase64ImagesToFiles(images, tempDir, publicSubPath, baseUrl);
    console.log('✅ Resimler dosyalara kaydedildi:', filePaths);
    console.log('🔗 Absolute HTTP URL\'leri:', urls);

    if (errors.length > 0) {
      console.warn('⚠️  Bazı resimlerde hatalar oluştu:', errors);
    }

    // 3. Composition'ı seç (HTTP URL'leri ile)
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'InstagramPost',
      inputProps: {
        baslik: baslik || "Başlık Yok",
        fiyat: fiyat || "Fiyat Yok",
        konum: konum || "",
        image1: urls[0] || "" // İlk resmin HTTP URL'i
      } as PostProps,
    });

    console.log('🎨 Composition seçildi:', composition.id);

    // 4. Resmi render et (buffer olarak)
    const { buffer } = await renderStill({
      composition,
      serveUrl: bundleLocation,
      inputProps: {
        baslik: baslik || "Başlık Yok",
        fiyat: fiyat || "Fiyat Yok",
        konum: konum || "",
        image1: urls[0] || "" // İlk resmin HTTP URL'i
      } as PostProps,
      imageFormat: 'jpeg',
      jpegQuality: 90,
    });

    console.log('✅ Render Başarılı! Resim oluşturuldu.');

    if (!buffer) {
      throw new Error('Buffer oluşturulamadı');
    }

    // 5. Geçici dosyaları temizle
    if (tempDir) {
      console.log('🧹 Geçici dosyalar temizleniyor...');
      cleanupTempFiles(tempDir);
      console.log('✅ Temizlik tamamlandı');
    }

    // 6. Resmi tarayıcıya geri gönder (CORS headers ile)
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'attachment; filename="instagram-post.jpg"',
      },
    });

  } catch (error) {
    console.error('❌ Backend Hatası:', error);

    // Hata durumunda da geçici dosyaları temizle
    if (tempDir) {
      try {
        console.log('🧹 Hata sonrası temizlik yapılıyor...');
        cleanupTempFiles(tempDir);
      } catch (cleanupError) {
        console.error('Temizlik sırasında hata:', cleanupError);
      }
    }

    return NextResponse.json({
      error: 'İşlem başarısız',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500, headers: corsHeaders });
  }
}
