'use client';

import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [status, setStatus] = useState<string>('');

  // Sample test images (colored squares for testing)
  const testImages = [
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFKSURBVHic7dExDoAgEADB8/9/hhdQWlCssGYmsbPYS8gBAAAAAAAAAAAAAAC4rOv+AHbZ+gNg3dr7A2DdaYQwTmsjhHFaGyGMU3shRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRIhQQogQQoQQIoQIIUIIEUKIECKEECFCCBFCiBBChBAhQggRQoQQIoQQIUIIEUKEECKECCFECBFCiBBChBAihAghQggRQogQQoQQIoQIIUQIEUKIEEKEECGECCFECBFCiBAihBAhRAghQoQQIoQIIUQIEUKIEEKIECKEECFECCFCiBBChBAihAghQggRQoQQIoQIIUQIEUKIECKEECGECCFECBFCiBAihBAhRAghQoQQIoQIIUQIEUKIECKEMIIAAAD+w3YCPwAAAABJRU5ErkJggg==',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFHSURBVHic7dGxDcAgEADB8/+/hQvQIEJKNxNFXOZzAwAAAAAAAAAAAAAAAAC4rNv+AHbZ+gNg3dr7A2DdaYQwTmsjhHFaGyGMU3shRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRIhQQogQQoQQIoQIIUIIEUKIECKEECFCCBFCiBBChBAhQggRQoQQIoQQIUIIEUKEECKECCFECBFCiBBChBAihAghQggRQogQQoQQIoQIIUQIEUKIEEKEECGECCFECBFCiBAihBAhRAghQoQQIoQIIUQIEUKIEEKIECKEECFECCFCiBBChBAihAghQggRQoQQIoQIIUQIEUKIECKEECGECCFECBFCiBAihBAhRAghQoQQIoQIIUQIEUKIECKEMIIAAAC4bNsJ/AAAAABJRU5ErkJggg==',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFISURBVHic7dGxDcMwEADB8/+/hQvIILghpJsOIi5zuQEAAAAAAAAAAAAAAAAA3NZtfwC7bP0BsG7t/QGw7jRCGKe1EcI4rY0Qxqm9ECKEECKEECKEECKEECKEECKEECKEECKEECKEECKEECKEECKEECKEECKEECKEECKEECKEECKEECKEECKEECKECCGECCFCCBFCiBBChBAihAghQggRQogQQoQQIoQIIUQIEUKEECKEECFCCBFCiBBChBAhhAghQggRQogQQoQQIoQIIUQIIUIIEUKIEEKEECKEECGECCFECBFCiBAihAghQggRQogQQoQQIoQIIUQIEUKIEEKEECKEECGECCFCCBFCiBBChBAhhAghQggRQogQQoQQIoQIIUQIIUIIEUKEECKEECGECCFECBFCiBAihBAhRJhAAAAAfGHbCfQAAAAASUVORK5CYII=',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFLSURBVHic7dGxDQAgCABB4P+/xgVoLIzWZyaKuJzXAQAAAAAAAAAAAAAAAADc1m1/ALts/QGwbu39AbDuNEIYp7URwjitjRDGqb0QIoQQIoQQIoQQIoQQIoQQIoQQIoQQIoQQIoQQIoQQIoQQIoQQIoQQIoQQIoQQIoQQIoQQIoQQIoQQIoQQIoQIIUQIIUIIEUKIECKEECGECCFCCBFCiBBChBAhQggRQoQQIoQQIUIIEUKEECKECCFECBFCiBBChBAihAghQggRQogQQoQQIoQIIUQIEUKIEEKEECGECCFECBFCiBAihBAhRAghQoQQIoQIIUQIEUKIEEKIECKEECFECCFCiBBChBAihAghQggRQoQQIoQIIUQIEUKIECKEECGECCFECBFCiBAihBAhRAghQoQQIoQIIUQIEUKIECKEMIIAAAD4w3YCPgAAAABJRU5ErkJggg==',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFMSURBVHic7dExDsAgDARB8/8/QwkNJVhJvJOoHIstwAAAAAAAAAAAAAAAAAAAbuu2PwBetv4A8LH2/gDwcRohjNPaCGGc1kYI49ReCBFCCBFCCBFCCBFCCBFCCBFCCBFCCBFCCBFCCBFCCBFCCBFCCBFCCBFCCBFCCBFCCBFCCBFCCBFCCBFCCBFChBAihAghRAghQogQQoQQIoQIIUQIIUIIEUKIECKEECFCCBFCiBBChBAhhAghQggRQogQQoQQIoQIIUQIIUIIEUKIEEKEECKEECGECCFECBFCiBAihAghQggRQogQQoQQIoQIIUQIEUKIEEKEECKEECGECCFCCBFCiBBChBAhhAghQggRQogQQoQQIoQIIUQIIUIIEUKEECKEECGECCFECBFCiBAihAghQggRQogQQoQQIoQwggAAAD/YdgI8AAAAAElFTkSuQmCC',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFJSURBVHic7dGxDcAgEADB8/+/hQ/QIEJKNxNFXOZzAwAAAAAAAAAAAAAAAAC4rOv+AHbZ+gNg3dr7A2DdaYQwTmsjhHFaGyGMU3shRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRAghRIhQQogQQoQQIoQIIUIIEUKIECKEECFCCBFCiBBChBAhQggRQoQQIoQQIUIIEUKEECKECCFECBFCiBBChBAihAghQggRQogQQoQQIoQIIUQIEUKIEEKEECGECCFECBFCiBAihBAhRAghQoQQIoQIIUQIEUKIEEKIECKEECFECCFCiBBChBAihAghQggRQoQQIoQIIUQIEUKIECKEECGECCFECBFCiBAihBAhRAghQoQQIoQIIUQIEUKIECKEMIIAAAD+w3YCPwAAAABJRU5ErkJggg=='
  ];

  const handleGenerateImage = async () => {
    setLoading(true);
    setMediaUrl(null);
    setMediaType('image');
    setStatus('Generating image...');

    try {
      const testData = {
        baslik: 'Satilik Daire - Merkezi Konumda 3+1',
        fiyat: '2.500.000 TL',
        konum: 'Istanbul, Kadikoy',
        images: [testImages[0]]
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'An error occurred');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setMediaUrl(url);
      setStatus('Image generated successfully!');
    } catch (error) {
      console.error('Error:', error);
      setStatus('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    setLoading(true);
    setMediaUrl(null);
    setMediaType('video');
    setStatus('Generating video... This may take 30-60 seconds.');

    try {
      const testData = {
        baslik: 'Satilik Daire - Merkezi Konumda 3+1',
        fiyat: '2.500.000 TL',
        konum: 'Istanbul, Kadikoy',
        images: testImages,
        agentName: 'Emlak Ofisi',
        agentPhone: '0532 123 45 67',
        agentLogo: testImages[0], // Use first image as logo for testing
      };

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'An error occurred');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setMediaUrl(url);
      setStatus('Video generated successfully!');
    } catch (error) {
      console.error('Error:', error);
      setStatus('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          Sahibinden Instagram Generator
        </h1>
        <p className="text-gray-600 mb-6">
          Test both image (1080x1080) and video (1080x1920) generation.
        </p>

        <div className="flex gap-4 mb-6">
          <button
            onClick={handleGenerateImage}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {loading && mediaType === 'image' ? 'Generating...' : 'Generate Image (Post)'}
          </button>

          <button
            onClick={handleGenerateVideo}
            disabled={loading}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {loading && mediaType === 'video' ? 'Generating...' : 'Generate Video (Story)'}
          </button>
        </div>

        {status && (
          <div className={`p-3 rounded mb-6 ${status.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
            {status}
          </div>
        )}

        {mediaUrl && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Generated {mediaType === 'image' ? 'Image' : 'Video'}:
            </h2>

            {mediaType === 'image' ? (
              <img
                src={mediaUrl}
                alt="Generated Instagram Post"
                className="w-full rounded-lg shadow-md"
              />
            ) : (
              <video
                src={mediaUrl}
                controls
                autoPlay
                className="w-full rounded-lg shadow-md"
                style={{ maxHeight: '600px' }}
              />
            )}

            <a
              href={mediaUrl}
              download={mediaType === 'image' ? 'instagram-post.jpg' : 'instagram-story.mp4'}
              className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Download {mediaType === 'image' ? 'Image' : 'Video'}
            </a>
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold text-yellow-800 mb-2">API Endpoints:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li><code className="bg-yellow-100 px-1 rounded">POST /api/generate</code> - Image (JPEG, 1080x1080)</li>
            <li><code className="bg-yellow-100 px-1 rounded">POST /api/generate-video</code> - Video (MP4, 1080x1920)</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
          <h3 className="font-semibold text-gray-800 mb-2">Notes:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>Video generation takes 30-60 seconds</li>
            <li>Video uses 6 images with fade transitions</li>
            <li>Landscape images get blur-fill background</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
