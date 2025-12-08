# Sahibinden Instagram Generator

Generate Instagram Posts and Stories from sahibinden.com listings automatically.

## Project Structure

```
sahibinden-instagram-generator/
├── server/          # Next.js + Remotion backend
└── extension/       # Chrome Extension
```

## Features

- **Instagram Post (Image)**: 1080x1080 JPEG
- **Instagram Story (Video)**: 1080x1920 MP4, 18 seconds with fade transitions
- Automatic image scraping from listing pages
- Agent branding (logo, name, phone)
- Blur-fill background for landscape images
- Chrome extension for one-click generation

## Server Setup

```bash
cd server
npm install
node scripts/bundle-remotion.mjs
npm run dev
```

Server runs at `http://localhost:3000`

### API Endpoints

| Endpoint | Method | Output |
|----------|--------|--------|
| `/api/generate` | POST | JPEG image (1080x1080) |
| `/api/generate-video` | POST | MP4 video (1080x1920) |

### Request Body

```json
{
  "baslik": "Listing title",
  "fiyat": "2.500.000 TL",
  "konum": "Istanbul, Kadikoy",
  "images": ["base64...", "base64..."],
  "agentName": "Agent Name",
  "agentPhone": "0532 123 45 67",
  "agentLogo": "base64..."
}
```

## Chrome Extension Setup

1. Open Chrome: `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Navigate to any sahibinden.com listing
6. Click extension icon and use!

## Tech Stack

- **Server**: Next.js 16, Remotion, Sharp, TypeScript
- **Extension**: Chrome Manifest V3, JavaScript

## Notes

- Video generation takes 30-60 seconds
- Server must be running for extension to work
- Not deployable to Vercel (use Remotion Lambda for production)
