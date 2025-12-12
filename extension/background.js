// Sahibinden Instagram Generator - Background Service Worker

const CONFIG = {
  SERVER_URL: 'https://sahibinden-instagram-generator-production.up.railway.app',
  MAX_IMAGES: 6
};

// Storage: scraped data per tab (cleared when tab closes or navigates away)
const tabData = new Map();

// Active generation jobs (independent of tab navigation)
const activeJobs = new Map();

let jobIdCounter = 0;

// Generate unique job ID
function generateJobId() {
  return `job_${Date.now()}_${++jobIdCounter}`;
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = messageHandlers[message.type];
  if (handler) {
    // Handle async responses
    const result = handler(message, sender);
    if (result instanceof Promise) {
      result.then(sendResponse).catch(err => sendResponse({ error: err.message }));
      return true; // Keep channel open for async response
    }
    sendResponse(result);
  }
  return false;
});

const messageHandlers = {
  // Store scraped data for a tab
  STORE_DATA: (message) => {
    const { tabId, data } = message;
    tabData.set(tabId, data);
    return { success: true };
  },

  // Get cached data for a tab
  GET_DATA: (message) => {
    const { tabId } = message;
    const data = tabData.get(tabId);
    return { data: data || null };
  },

  // Get active job status for a tab
  GET_STATUS: (message) => {
    const { tabId } = message;
    const jobs = [];
    for (const [jobId, job] of activeJobs) {
      if (job.tabId === tabId || job.status === 'generating') {
        jobs.push({ jobId, ...job });
      }
    }
    return { jobs };
  },

  // Generate image (runs in background)
  GENERATE_IMAGE: async (message) => {
    const { tabId, data } = message;
    const jobId = generateJobId();

    const job = {
      tabId,
      type: 'image',
      data: { ...data }, // Copy data so it's independent of tabData
      status: 'generating',
      startedAt: Date.now()
    };
    activeJobs.set(jobId, job);

    // Run generation in background
    generateImage(jobId, job).catch(err => {
      console.error('Image generation error:', err);
    });

    return { jobId, status: 'started' };
  },

  // Generate video (runs in background)
  GENERATE_VIDEO: async (message) => {
    const { tabId, data } = message;
    const jobId = generateJobId();

    const job = {
      tabId,
      type: 'video',
      data: { ...data }, // Copy data so it's independent of tabData
      status: 'generating',
      startedAt: Date.now()
    };
    activeJobs.set(jobId, job);

    // Run generation in background
    generateVideo(jobId, job).catch(err => {
      console.error('Video generation error:', err);
    });

    return { jobId, status: 'started' };
  }
};

// Image generation
async function generateImage(jobId, job) {
  try {
    const response = await fetch(`${CONFIG.SERVER_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baslik: job.data.baslik,
        fiyat: job.data.fiyat,
        konum: job.data.konum,
        images: [job.data.images[0]]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Sunucu hatasi');
    }

    const blob = await response.blob();
    await downloadBlob(blob, `sahibinden_post_${Date.now()}.jpg`, 'image/jpeg');

    job.status = 'completed';
    activeJobs.set(jobId, job);

    // Notify user
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Resim Hazir!',
      message: 'Instagram Post indirildi.'
    });

  } catch (error) {
    job.status = 'error';
    job.error = error.message;
    activeJobs.set(jobId, job);

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Hata',
      message: `Resim olusturulamadi: ${error.message}`
    });
  }
}

// Video generation
async function generateVideo(jobId, job) {
  try {
    const response = await fetch(`${CONFIG.SERVER_URL}/api/generate-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baslik: job.data.baslik,
        fiyat: job.data.fiyat,
        konum: job.data.konum,
        images: job.data.images,
        agentName: job.data.agentName,
        agentPhone: job.data.agentPhone,
        agentLogo: job.data.agentLogo
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Sunucu hatasi');
    }

    const blob = await response.blob();
    await downloadBlob(blob, `sahibinden_story_${Date.now()}.mp4`, 'video/mp4');

    job.status = 'completed';
    activeJobs.set(jobId, job);

    // Notify user
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Video Hazir!',
      message: 'Instagram Story indirildi.'
    });

  } catch (error) {
    job.status = 'error';
    job.error = error.message;
    activeJobs.set(jobId, job);

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Hata',
      message: `Video olusturulamadi: ${error.message}`
    });
  }
}

// Download blob using chrome.downloads API
async function downloadBlob(blob, filename, mimeType) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(downloadId);
        }
      });
    };
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

// Clean up tab data when tab closes
chrome.tabs.onRemoved.addListener((tabId) => {
  tabData.delete(tabId);
});

// Clean up tab data when URL changes away from sahibinden
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    if (!changeInfo.url.includes('sahibinden.com')) {
      // Navigated away from sahibinden - clear data
      tabData.delete(tabId);
    } else if (tabData.has(tabId)) {
      // URL changed but still on sahibinden - might be different listing
      // Clear old data so popup will re-scrape
      tabData.delete(tabId);
    }
  }
});

// Clean up old completed/errored jobs periodically (keep for 5 minutes)
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [jobId, job] of activeJobs) {
    if ((job.status === 'completed' || job.status === 'error') && job.startedAt < fiveMinutesAgo) {
      activeJobs.delete(jobId);
    }
  }
}, 60 * 1000);

console.log('Sahibinden Instagram Generator background service worker started');
