import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remotion renderer'ı external olarak işaretle (server bundle'a dahil etme)
  serverExternalPackages: [
    '@remotion/renderer',
    '@remotion/bundler',
    'remotion',
  ],

  // API route'ları için body size limitini artır (büyük resimler için)
  experimental: {
    // Büyük request body'lere izin ver
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
