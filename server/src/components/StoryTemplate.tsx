import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, interpolate } from 'remotion';

// Story props type - 6 images + agent branding + listing info
export type StoryProps = {
  baslik: string;
  fiyat: string;
  konum: string;
  image1: string;
  image2: string;
  image3: string;
  image4: string;
  image5: string;
  image6: string;
  // Agent branding
  agentName: string;
  agentPhone: string;
  agentLogo: string;
  // Image orientations (true = landscape, false = portrait)
  imageOrientations?: boolean[];
};

// Configuration
const FPS = 30;
const FRAMES_PER_IMAGE = 90; // 3 seconds per image
const TRANSITION_FRAMES = 15; // 0.5 seconds transition
const ENDING_FRAMES = 60; // 2 seconds for ending screen
const ENDING_FADE_FRAMES = 15; // 0.5 seconds fade-in

export const StoryTemplate: React.FC<StoryProps> = ({
  baslik,
  fiyat,
  konum,
  image1,
  image2,
  image3,
  image4,
  image5,
  image6,
  agentName,
  agentPhone,
  agentLogo,
  imageOrientations = [],
}) => {
  const frame = useCurrentFrame();
  const images = [image1, image2, image3, image4, image5, image6].filter(Boolean);

  // Calculate which image to show
  const totalFramesPerImage = FRAMES_PER_IMAGE;
  const currentImageIndex = Math.min(
    Math.floor(frame / totalFramesPerImage),
    images.length - 1
  );
  const nextImageIndex = Math.min(currentImageIndex + 1, images.length - 1);

  // Calculate transition progress
  const frameInCurrentImage = frame % totalFramesPerImage;
  const isInTransition = frameInCurrentImage >= (totalFramesPerImage - TRANSITION_FRAMES);

  // Fade opacity for transitions
  const transitionProgress = isInTransition
    ? (frameInCurrentImage - (totalFramesPerImage - TRANSITION_FRAMES)) / TRANSITION_FRAMES
    : 0;

  const currentOpacity = interpolate(transitionProgress, [0, 1], [1, 0], {
    extrapolateRight: 'clamp',
  });
  const nextOpacity = interpolate(transitionProgress, [0, 1], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Check if current image is landscape
  const isCurrentLandscape = imageOrientations[currentImageIndex] ?? false;
  const isNextLandscape = imageOrientations[nextImageIndex] ?? false;

  // Calculate ending screen state
  const totalImageFrames = images.length * FRAMES_PER_IMAGE;
  const isInEndingScreen = frame >= totalImageFrames;
  const endingScreenFrame = frame - totalImageFrames;
  const endingFadeOpacity = isInEndingScreen
    ? interpolate(endingScreenFrame, [0, ENDING_FADE_FRAMES], [0, 1], { extrapolateRight: 'clamp' })
    : 0;

  // Image layer component with blur-fill for landscape images
  const ImageLayer: React.FC<{
    src: string;
    opacity: number;
    isLandscape: boolean;
    zIndex: number;
  }> = ({ src, opacity, isLandscape, zIndex }) => {
    if (!src) return null;

    // For landscape images, use blur-fill technique
    if (isLandscape) {
      return (
        <AbsoluteFill style={{ opacity, zIndex }}>
          {/* Blurred background - same image scaled to cover */}
          <AbsoluteFill style={{ overflow: 'hidden' }}>
            <Img
              src={src}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'blur(20px)',
                transform: 'scale(1.1)',
              }}
            />
          </AbsoluteFill>
          {/* Dark overlay to make content readable */}
          <AbsoluteFill
            style={{
              background: 'rgba(0,0,0,0.3)',
            }}
          />
          {/* Clear foreground image - centered, preserving aspect ratio */}
          <AbsoluteFill
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 100, // Space for top branding
              paddingBottom: 350, // Space for bottom info
            }}
          >
            <Img
              src={src}
              style={{
                maxWidth: '95%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 8,
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              }}
            />
          </AbsoluteFill>
        </AbsoluteFill>
      );
    }

    // For portrait images, use cover mode
    return (
      <AbsoluteFill style={{ opacity, zIndex }}>
        <Img
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </AbsoluteFill>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }}>
      {/* Current Image */}
      <ImageLayer
        src={images[currentImageIndex]}
        opacity={currentOpacity}
        isLandscape={isCurrentLandscape}
        zIndex={1}
      />

      {/* Next Image (for transition) */}
      {isInTransition && currentImageIndex !== nextImageIndex && (
        <ImageLayer
          src={images[nextImageIndex]}
          opacity={nextOpacity}
          isLandscape={isNextLandscape}
          zIndex={2}
        />
      )}

      {/* Gradient overlay for text readability - hide during ending */}
      {!isInEndingScreen && (
        <AbsoluteFill
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 25%, transparent 50%)',
            zIndex: 10,
          }}
        />
      )}

      {/* Top branding bar - hide during ending */}
      {!isInEndingScreen && <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '40px 40px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
          zIndex: 20,
        }}
      >
        {/* Agent Logo */}
        {agentLogo && (
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              backgroundColor: 'white',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <Img
              src={agentLogo}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        )}
        {/* Agent Name */}
        <div
          style={{
            color: 'white',
            fontSize: 32,
            fontWeight: 600,
            fontFamily: 'sans-serif',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          {agentName || 'Emlak Ofisi'}
        </div>
      </div>}

      {/* Bottom info overlay - hide during ending */}
      {!isInEndingScreen && <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          padding: 50,
          paddingBottom: 80,
          zIndex: 20,
        }}
      >
        {/* Price Badge */}
        <div
          style={{
            backgroundColor: '#eab308',
            color: 'black',
            padding: '14px 36px',
            borderRadius: 12,
            fontSize: 52,
            fontWeight: 'bold',
            fontFamily: 'sans-serif',
            width: 'fit-content',
            marginBottom: 24,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {fiyat}
        </div>

        {/* Title */}
        <div
          style={{
            color: 'white',
            fontSize: 42,
            fontFamily: 'sans-serif',
            fontWeight: 800,
            lineHeight: 1.3,
            marginBottom: 16,
            textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
            maxWidth: '100%',
          }}
        >
          {baslik.toUpperCase()}
        </div>

        {/* Location */}
        <div
          style={{
            color: '#e5e5e5',
            fontSize: 32,
            fontFamily: 'sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <span>📍</span> {konum}
        </div>

        {/* Agent Phone */}
        {agentPhone && (
          <div
            style={{
              color: 'white',
              fontSize: 36,
              fontFamily: 'sans-serif',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              backgroundColor: 'rgba(255,255,255,0.15)',
              padding: '12px 24px',
              borderRadius: 8,
              width: 'fit-content',
            }}
          >
            <span>📞</span> {agentPhone}
          </div>
        )}
      </AbsoluteFill>}

      {/* Progress indicator (dots) - hide during ending screen */}
      {!isInEndingScreen && (
        <div
          style={{
            position: 'absolute',
            top: 130,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            zIndex: 25,
          }}
        >
          {images.map((_, index) => (
            <div
              key={index}
              style={{
                width: index === currentImageIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: index === currentImageIndex ? '#eab308' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}

      {/* Ending Screen - Agent Branding */}
      {isInEndingScreen && (
        <AbsoluteFill
          style={{
            opacity: endingFadeOpacity,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          {/* Agent Logo */}
          {agentLogo && (
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: 90,
                backgroundColor: 'white',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                border: '4px solid rgba(255,255,255,0.9)',
                marginBottom: 40,
              }}
            >
              <Img
                src={agentLogo}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          )}

          {/* Agent Name */}
          <div
            style={{
              color: 'white',
              fontSize: 56,
              fontWeight: 700,
              fontFamily: 'sans-serif',
              textAlign: 'center',
              marginBottom: 24,
              textShadow: '0 4px 12px rgba(0,0,0,0.5)',
              padding: '0 40px',
            }}
          >
            {agentName || 'Emlak Ofisi'}
          </div>

          {/* Agent Phone */}
          {agentPhone && (
            <div
              style={{
                color: 'white',
                fontSize: 42,
                fontFamily: 'sans-serif',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                backgroundColor: 'rgba(255,255,255,0.15)',
                padding: '16px 36px',
                borderRadius: 16,
              }}
            >
              <span>📞</span> {agentPhone}
            </div>
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
