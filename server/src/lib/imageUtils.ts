import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Base64 string'i geçici bir dosyaya kaydeder ve HTTP URL'ini döndürür
 * @param base64String - Base64 formatındaki resim (data:image/jpeg;base64,... veya sadece base64 string)
 * @param tempDir - Geçici dosyaların kaydedileceği klasör (public klasörü altında)
 * @param publicSubPath - Public klasörü içindeki alt yol (örn: "temp/remotion_xxx")
 * @param baseUrl - Server base URL (örn: "http://localhost:3000")
 * @returns { filePath: string, url: string } - Dosya yolu ve absolute HTTP URL
 */
export function saveBase64ToFile(
  base64String: string,
  tempDir: string,
  publicSubPath: string,
  baseUrl: string
): { filePath: string; url: string } {
  // Base64 string'den data URL prefix'ini kaldır (varsa)
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');

  // Validation: Base64 string'in geçerli olduğunu kontrol et
  if (!base64Data || base64Data.length < 100) {
    throw new Error(`Geçersiz Base64 string (çok kısa: ${base64Data.length} bytes)`);
  }

  // Dosya formatını tespit et (data URL'den)
  let extension = 'jpg';
  const matches = base64String.match(/^data:image\/(\w+);base64,/);
  if (matches && matches[1]) {
    extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
  }

  // Benzersiz dosya adı oluştur
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const fileName = `img-${uniqueId}.${extension}`;
  const filePath = path.join(tempDir, fileName);

  // Base64'ü buffer'a çevir ve dosyaya yaz
  try {
    const buffer = Buffer.from(base64Data, 'base64');

    // Validation: Buffer'ın resim gibi göründüğünü kontrol et
    if (buffer.length < 1000) {
      throw new Error(`Decode edilen buffer çok küçük: ${buffer.length} bytes`);
    }

    console.log(`  ✓ ${fileName}: ${(buffer.length / 1024).toFixed(2)} KB`);
    fs.writeFileSync(filePath, buffer);
  } catch (err) {
    throw new Error(`Base64 decode hatası: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // Absolute HTTP URL oluştur (Remotion browser context için)
  const url = `${baseUrl}/${publicSubPath}/${fileName}`;

  return { filePath, url };
}

/**
 * Birden fazla base64 string'i dosyalara çevirir ve HTTP URL'lerini döndürür
 * @param base64Images - Base64 formatındaki resimler dizisi
 * @param tempDir - Geçici dosyaların kaydedileceği klasör (public klasörü altında)
 * @param publicSubPath - Public klasörü içindeki alt yol
 * @param baseUrl - Server base URL (örn: "http://localhost:3000")
 * @returns { filePaths: string[], urls: string[] } - Dosya yolları ve absolute HTTP URL'leri
 */
export function saveBase64ImagesToFiles(
  base64Images: string[],
  tempDir: string,
  publicSubPath: string,
  baseUrl: string
): { filePaths: string[]; urls: string[]; errors: string[] } {
  // Temp klasörü yoksa oluştur
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const results: Array<{ filePath: string; url: string } | null> = [];
  const errors: string[] = [];

  // Her bir base64 string'i dosyaya çevir (hatalı olanları skip et)
  base64Images.forEach((base64, index) => {
    try {
      const result = saveBase64ToFile(base64, tempDir, publicSubPath, baseUrl);
      results.push(result);
    } catch (err) {
      const errorMsg = `Resim ${index + 1}: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`;
      console.error(`  ✗ ${errorMsg}`);
      errors.push(errorMsg);
      results.push(null);
    }
  });

  // Null olmayan sonuçları filtrele
  const validResults = results.filter((r): r is { filePath: string; url: string } => r !== null);

  if (validResults.length === 0) {
    throw new Error('Hiçbir resim başarıyla işlenemedi! Tüm resimler corrupt olabilir.');
  }

  console.log(`✅ ${validResults.length}/${base64Images.length} resim başarıyla işlendi`);
  if (errors.length > 0) {
    console.warn(`⚠️  ${errors.length} resim hatalı (atlandı)`);
  }

  return {
    filePaths: validResults.map(r => r.filePath),
    urls: validResults.map(r => r.url),
    errors,
  };
}

/**
 * Belirtilen klasördeki tüm dosyaları siler
 * @param dirPath - Silinecek klasör yolu
 */
export function cleanupTempFiles(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  try {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        fs.unlinkSync(filePath);
      }
    }

    // Klasörü de sil (boşsa)
    try {
      fs.rmdirSync(dirPath);
    } catch (err) {
      // Klasör boş değilse veya silinememişse sessizce devam et
    }
  } catch (error) {
    console.error('Temp dosyalar silinirken hata:', error);
  }
}

/**
 * Belirli dosya yollarını siler
 * @param filePaths - Silinecek dosya yolları dizisi
 */
export function cleanupFiles(filePaths: string[]): void {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Dosya silinemedi (${filePath}):`, error);
    }
  }
}

/**
 * Public klasörü altında geçici bir klasör oluşturur
 * @param publicDir - Public klasörünün tam yolu
 * @returns { tempDir: string, publicSubPath: string } - Fiziksel klasör yolu ve URL için alt yol
 */
export function createTempDir(publicDir: string): { tempDir: string; publicSubPath: string } {
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const folderName = `remotion_temp_${uniqueId}`;

  // Public klasörü altında temp klasör oluştur
  const tempDir = path.join(publicDir, folderName);

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // HTTP URL için kullanılacak yol (public klasörüne göre relative)
  const publicSubPath = folderName;

  return { tempDir, publicSubPath };
}
