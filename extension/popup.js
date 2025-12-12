// Sahibinden Instagram Generator - Popup Script (UI Only)
// All heavy lifting is done by background.js service worker

const CONFIG = {
  MAX_IMAGES: 6
};

// DOM Elements
const statusBox = document.getElementById('statusBox');
const statusTitle = document.getElementById('statusTitle');
const statusText = document.getElementById('statusText');
const listingInfo = document.getElementById('listingInfo');
const listingTitle = document.getElementById('listingTitle');
const listingPrice = document.getElementById('listingPrice');
const listingLocation = document.getElementById('listingLocation');
const listingImages = document.getElementById('listingImages');
const imageBtn = document.getElementById('imageBtn');
const imageText = document.getElementById('imageText');
const videoBtn = document.getElementById('videoBtn');
const videoText = document.getElementById('videoText');

let currentTabId = null;
let statusPollInterval = null;

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

// Send message to background script
function sendMessage(type, data = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, ...data }, resolve);
  });
}

// Scraping function that runs in the page context
function scrapePageData() {
  const CONFIG = { MAX_IMAGES: 6 };

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

  return (async () => {
    const textData = getScrapedData();
    const agentData = scrapeAgentDetails();

    const thumbElements = Array.from(document.querySelectorAll(
      '.megaPhotoThumbs img, .classifiedDetailPhotos img, .slide-image'
    ));

    if (thumbElements.length === 0) {
      return { error: 'Sayfada resim bulunamadi' };
    }

    let validImageUrls = thumbElements
      .map(img => getRealImageUrl(img))
      .filter(url => url !== null);
    validImageUrls = [...new Set(validImageUrls)];

    if (validImageUrls.length === 0) {
      return { error: 'Gecerli resim URL bulunamadi. Sayfayi asagi kaydirin ve tekrar deneyin.' };
    }

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

// Check for active jobs and update UI
async function checkActiveJobs() {
  if (!currentTabId) return;

  const response = await sendMessage('GET_STATUS', { tabId: currentTabId });
  const generatingJobs = (response.jobs || []).filter(j => j.status === 'generating');

  if (generatingJobs.length > 0) {
    const job = generatingJobs[0];
    if (job.type === 'image') {
      imageBtn.disabled = true;
      imageText.innerHTML = '<div class="spinner"></div> Olusturuluyor...';
    } else if (job.type === 'video') {
      videoBtn.disabled = true;
      imageBtn.disabled = true;
      videoText.innerHTML = '<div class="spinner"></div> Olusturuluyor...';
    }
    setStatus('loading', 'Olusturuluyor', 'Arka planda calisiyor. Pencereyi kapatabilirsiniz.');
  }
}

// Start polling for job status
function startStatusPolling() {
  if (statusPollInterval) return;
  statusPollInterval = setInterval(checkActiveJobs, 2000);
}

// Initialize popup
async function init() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTabId = tab.id;

    // Check if on sahibinden
    if (!tab.url.includes('sahibinden.com')) {
      setStatus('error', 'Hatali Sayfa', 'Lutfen bir sahibinden.com ilan sayfasina gidin.');
      return;
    }

    // Check for active jobs first
    await checkActiveJobs();
    startStatusPolling();

    // Check for cached data
    const cached = await sendMessage('GET_DATA', { tabId: currentTabId });

    if (cached.data) {
      // Use cached data
      setStatus('success', 'Hazir', 'Ilan verileri hazir. Simdi olusturabilirsiniz.');
      showListingInfo(cached.data);
      imageBtn.disabled = false;
      videoBtn.disabled = false;
    } else {
      // Auto-scrape
      setStatus('loading', 'Taraniyor', 'Sayfa verileri aliniyor...');

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrapePageData
      });

      const data = results[0].result;

      if (data.error) {
        setStatus('error', 'Hata', data.error);
        return;
      }

      // Store in background
      await sendMessage('STORE_DATA', { tabId: currentTabId, data });

      setStatus('success', 'Hazir', 'Ilan verileri alindi. Simdi olusturabilirsiniz.');
      showListingInfo(data);
      imageBtn.disabled = false;
      videoBtn.disabled = false;
    }

  } catch (error) {
    setStatus('error', 'Hata', error.message);
  }
}

// Generate Image button
imageBtn.addEventListener('click', async () => {
  if (!currentTabId) return;

  const cached = await sendMessage('GET_DATA', { tabId: currentTabId });
  if (!cached.data) {
    setStatus('error', 'Hata', 'Veri bulunamadi. Sayfayi yenileyin.');
    return;
  }

  imageBtn.disabled = true;
  imageText.innerHTML = '<div class="spinner"></div> Olusturuluyor...';
  setStatus('loading', 'Resim Olusturuluyor', 'Arka planda calisiyor. Pencereyi kapatabilirsiniz.');

  const response = await sendMessage('GENERATE_IMAGE', {
    tabId: currentTabId,
    data: cached.data
  });

  if (response.error) {
    setStatus('error', 'Hata', response.error);
    imageBtn.disabled = false;
    imageText.textContent = 'Instagram Post Olustur';
  }
  // Job started - polling will handle status updates
});

// Generate Video button
videoBtn.addEventListener('click', async () => {
  if (!currentTabId) return;

  const cached = await sendMessage('GET_DATA', { tabId: currentTabId });
  if (!cached.data) {
    setStatus('error', 'Hata', 'Veri bulunamadi. Sayfayi yenileyin.');
    return;
  }

  videoBtn.disabled = true;
  imageBtn.disabled = true;
  videoText.innerHTML = '<div class="spinner"></div> Olusturuluyor (30-60sn)...';
  setStatus('loading', 'Video Olusturuluyor', 'Arka planda calisiyor. Pencereyi kapatabilirsiniz.');

  const response = await sendMessage('GENERATE_VIDEO', {
    tabId: currentTabId,
    data: cached.data
  });

  if (response.error) {
    setStatus('error', 'Hata', response.error);
    videoBtn.disabled = false;
    imageBtn.disabled = false;
    videoText.textContent = 'Instagram Story Olustur';
  }
  // Job started - polling will handle status updates
});

// Cleanup on popup close
window.addEventListener('unload', () => {
  if (statusPollInterval) {
    clearInterval(statusPollInterval);
  }
});

// Start
init();
