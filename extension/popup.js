// Sahibinden Instagram Generator - Popup Script

const CONFIG = {
  SERVER_URL: 'http://localhost:3000',
  MAX_IMAGES: 6
};

// State
let scrapedData = null;

// DOM Elements
const statusBox = document.getElementById('statusBox');
const statusTitle = document.getElementById('statusTitle');
const statusText = document.getElementById('statusText');
const listingInfo = document.getElementById('listingInfo');
const listingTitle = document.getElementById('listingTitle');
const listingPrice = document.getElementById('listingPrice');
const listingLocation = document.getElementById('listingLocation');
const listingImages = document.getElementById('listingImages');
const scanBtn = document.getElementById('scanBtn');
const scanText = document.getElementById('scanText');
const imageBtn = document.getElementById('imageBtn');
const imageText = document.getElementById('imageText');
const videoBtn = document.getElementById('videoBtn');
const videoText = document.getElementById('videoText');

// Status helpers
function setStatus(type, title, text) {
  statusBox.className = 'status-box ' + type;
  statusTitle.textContent = title;
  statusText.textContent = text;
}

function showListingInfo(data) {
  listingTitle.textContent = data.baslik;
  listingPrice.textContent = data.fiyat;
  listingLocation.textContent = data.konum;
  listingImages.textContent = `${data.images.length} resim hazir`;
  listingInfo.classList.remove('hidden');
}

function hideListingInfo() {
  listingInfo.classList.add('hidden');
}

// Scraping function that runs in the page context
function scrapePageData() {
  const CONFIG = { MAX_IMAGES: 6 };

  // Helper: Get real image URL (handle lazy loading)
  const getRealImageUrl = (imgElement) => {
    const candidates = [
      imgElement.getAttribute('data-src'),
      imgElement.getAttribute('data-source'),
      imgElement.getAttribute('data-original'),
      imgElement.src
    ];
    return candidates.find(url =>
      url &&
      !url.includes('assets/images/blank') &&
      !url.includes('transparent') &&
      url.startsWith('http')
    ) || null;
  };

  // Helper: URL to Base64
  const urlToBase64 = async (url) => {
    if (!url) return null;
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      if (blob.size < 3000) return null;
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      return null;
    }
  };

  // Scrape text data
  const getScrapedData = () => {
    const titleEl = document.querySelector('.classifiedDetailTitle h1') ||
                    document.querySelector('.classifiedInfo h1') ||
                    document.querySelector('h1');
    const priceEl = document.querySelector('.classifiedInfo h3') ||
                    document.querySelector('div.classifiedInfo > h3');
    const locationEl = document.querySelector('.classifiedInfo h2');

    let cleanPrice = "Fiyat Yok";
    if (priceEl) {
      cleanPrice = priceEl.innerText.split('\n')[0].trim();
    }

    return {
      baslik: titleEl ? titleEl.innerText.trim() : "Baslik Yok",
      fiyat: cleanPrice,
      konum: locationEl ? locationEl.innerText.replace(/\s\s+/g, ' ').trim() : ""
    };
  };

  // Scrape agent details
  const scrapeAgentDetails = () => {
    const infoBlock = document.querySelector('.owner-info-container, .classified-owner-info, .seller-info-container');
    if (!infoBlock) return { agentName: "", agentPhone: "", agentLogoUrl: null };

    const nameEl = infoBlock.querySelector('.owner-name') || infoBlock.querySelector('.username');
    const phoneEl = infoBlock.querySelector('.pretty-phone-number') || infoBlock.querySelector('.phone-number');
    const logoImg = infoBlock.querySelector('.logo img') || infoBlock.querySelector('.corporate-logo img');

    return {
      agentName: nameEl ? nameEl.innerText.trim() : "",
      agentPhone: phoneEl ? phoneEl.innerText.trim() : "",
      agentLogoUrl: logoImg ? logoImg.src : null
    };
  };

  // Main async function
  return (async () => {
    const textData = getScrapedData();
    const agentData = scrapeAgentDetails();

    // Get image elements
    const thumbElements = Array.from(document.querySelectorAll(
      '.megaPhotoThumbs img, .classifiedDetailPhotos img, .slide-image'
    ));

    if (thumbElements.length === 0) {
      return { error: 'Sayfada resim bulunamadi' };
    }

    // Get valid URLs
    let validImageUrls = thumbElements
      .map(img => getRealImageUrl(img))
      .filter(url => url !== null);
    validImageUrls = [...new Set(validImageUrls)];

    if (validImageUrls.length === 0) {
      return { error: 'Gecerli resim URL bulunamadi. Sayfayi asagi kaydirin ve tekrar deneyin.' };
    }

    // Download and convert to base64
    const processPromises = validImageUrls.slice(0, CONFIG.MAX_IMAGES).map(async (url) => {
      const variants = [
        url.replace("thmb_", "x16_").replace("x5_", "x16_"),
        url.replace("thmb_", "x5_").replace("x16_", "x5_"),
        url
      ];
      for (const variant of variants) {
        const base64 = await urlToBase64(variant);
        if (base64) return base64;
      }
      return null;
    });

    // Agent logo
    let agentLogoBase64 = null;
    if (agentData.agentLogoUrl) {
      agentLogoBase64 = await urlToBase64(agentData.agentLogoUrl);
    }

    const base64Images = (await Promise.all(processPromises)).filter(x => x);

    if (base64Images.length === 0) {
      return { error: 'Resimler indirilemedi' };
    }

    return {
      success: true,
      baslik: textData.baslik,
      fiyat: textData.fiyat,
      konum: textData.konum,
      agentName: agentData.agentName,
      agentPhone: agentData.agentPhone,
      agentLogo: agentLogoBase64,
      images: base64Images
    };
  })();
}

// Scan button click
scanBtn.addEventListener('click', async () => {
  scanBtn.disabled = true;
  scanText.textContent = 'Taraniyor...';
  setStatus('loading', 'Taraniyor', 'Sayfa verileri aliniyor...');
  hideListingInfo();

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if on sahibinden
    if (!tab.url.includes('sahibinden.com')) {
      setStatus('error', 'Hatali Sayfa', 'Lutfen bir sahibinden.com ilan sayfasina gidin.');
      return;
    }

    // Execute scraping script
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapePageData
    });

    const data = results[0].result;

    if (data.error) {
      setStatus('error', 'Hata', data.error);
      return;
    }

    // Success
    scrapedData = data;
    setStatus('success', 'Hazir', 'Ilan verileri alindi. Simdi olusturabilirsiniz.');
    showListingInfo(data);
    imageBtn.disabled = false;
    videoBtn.disabled = false;

  } catch (error) {
    setStatus('error', 'Hata', error.message);
  } finally {
    scanBtn.disabled = false;
    scanText.textContent = 'Sayfayi Tara';
  }
});

// Generate Image
imageBtn.addEventListener('click', async () => {
  if (!scrapedData) return;

  imageBtn.disabled = true;
  imageText.innerHTML = '<div class="spinner"></div> Olusturuluyor...';
  setStatus('loading', 'Resim Olusturuluyor', 'Lutfen bekleyin...');

  try {
    const response = await fetch(`${CONFIG.SERVER_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baslik: scrapedData.baslik,
        fiyat: scrapedData.fiyat,
        konum: scrapedData.konum,
        images: [scrapedData.images[0]]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Sunucu hatasi');
    }

    const blob = await response.blob();

    // Download in page context
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const reader = new FileReader();
    reader.onload = async () => {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (dataUrl, filename) => {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = filename;
          a.click();
        },
        args: [reader.result, `sahibinden_post_${Date.now()}.jpg`]
      });
    };
    reader.readAsDataURL(blob);

    setStatus('success', 'Basarili', 'Instagram Post indirildi!');

  } catch (error) {
    setStatus('error', 'Hata', error.message);
  } finally {
    imageBtn.disabled = false;
    imageText.textContent = 'Instagram Post Olustur';
  }
});

// Generate Video
videoBtn.addEventListener('click', async () => {
  if (!scrapedData) return;

  videoBtn.disabled = true;
  imageBtn.disabled = true;
  videoText.innerHTML = '<div class="spinner"></div> Olusturuluyor (30-60sn)...';
  setStatus('loading', 'Video Olusturuluyor', 'Bu islem 30-60 saniye surebilir. Lutfen bekleyin...');

  try {
    const response = await fetch(`${CONFIG.SERVER_URL}/api/generate-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baslik: scrapedData.baslik,
        fiyat: scrapedData.fiyat,
        konum: scrapedData.konum,
        images: scrapedData.images,
        agentName: scrapedData.agentName,
        agentPhone: scrapedData.agentPhone,
        agentLogo: scrapedData.agentLogo
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Sunucu hatasi');
    }

    const blob = await response.blob();

    // Download in page context
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const reader = new FileReader();
    reader.onload = async () => {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (dataUrl, filename) => {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = filename;
          a.click();
        },
        args: [reader.result, `sahibinden_story_${Date.now()}.mp4`]
      });
    };
    reader.readAsDataURL(blob);

    setStatus('success', 'Basarili', 'Instagram Story indirildi!');

  } catch (error) {
    setStatus('error', 'Hata', error.message);
  } finally {
    videoBtn.disabled = false;
    imageBtn.disabled = false;
    videoText.textContent = 'Instagram Story Olustur';
  }
});
