import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';

// Tasarımın alacağı verilerin tipi
export type PostProps = {
  baslik: string;
  fiyat: string;
  konum: string;
  image1: string; // HTTP URL (public klasöründen serve edilen resim)
};

export const PostTemplate: React.FC<PostProps> = ({ baslik, fiyat, konum, image1 }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'white' }}>

      {/* 1. Arka Plan Resmi (Full Screen) */}
      <AbsoluteFill>
        <Img src={image1} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>

      {/* 2. Karartma (Gradient) - Yazılar okunsun diye */}
      <AbsoluteFill style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 50%)'
      }} />

      {/* 3. Yazı Katmanı */}
      <AbsoluteFill style={{
        justifyContent: 'flex-end',
        padding: 60,
        paddingBottom: 100
      }}>
        {/* Fiyat Kutusu */}
        <div style={{
          backgroundColor: '#eab308', // Altın sarısı
          color: 'black',
          padding: '10px 30px',
          borderRadius: 15,
          fontSize: 60,
          fontWeight: 'bold',
          width: 'fit-content',
          marginBottom: 20,
          boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
        }}>
          {fiyat}
        </div>

        {/* Başlık */}
        <div style={{
          color: 'white',
          fontSize: 40,
          fontFamily: 'sans-serif',
          fontWeight: 800,
          lineHeight: 1.2,
          marginBottom: 10,
          textShadow: '2px 2px 4px black'
        }}>
          {baslik.toUpperCase()}
        </div>

        {/* Konum */}
        <div style={{
          color: '#d1d5db',
          fontSize: 30,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          📍 {konum}
        </div>

      </AbsoluteFill>

      {/* 4. Sağ Üst Logo (Sizin Markanız) */}
      <div style={{
        position: 'absolute',
        top: 40,
        right: 40,
        background: 'white',
        padding: '10px 20px',
        borderRadius: 8,
        fontWeight: 'bold'
      }}>
        YOUR BRAND
      </div>

    </AbsoluteFill>
  );
};
