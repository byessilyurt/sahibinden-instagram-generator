import { bundle } from '@remotion/bundler';
import { webpackOverride } from './webpack-override.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bundleRemotionVideo = async () => {
  console.log('🎬 Bundling Remotion composition...');

  const bundleLocation = await bundle({
    entryPoint: path.join(__dirname, '..', 'remotion', 'index.ts'),
    webpackOverride,
  });

  console.log('✅ Bundle created at:', bundleLocation);

  // Bundle lokasyonunu bir dosyaya kaydet (API route okuyabilsin)
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const bundleInfoPath = path.join(publicDir, 'bundle-location.json');
  fs.writeFileSync(
    bundleInfoPath,
    JSON.stringify({ bundleLocation }, null, 2)
  );

  console.log('📦 Bundle location saved to:', bundleInfoPath);
  console.log('📦 You can now use this bundle in your API routes');

  return bundleLocation;
};

bundleRemotionVideo()
  .then(() => {
    console.log('✅ Bundling complete!');
  })
  .catch((err) => {
    console.error('❌ Bundling failed:', err);
    process.exit(1);
  });
