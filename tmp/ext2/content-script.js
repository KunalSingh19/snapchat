// content-script.js (Corrected - Enhanced Video URL Extraction & Logging)

async function fetchNextReel() {
  try {
    console.log('Fetching from backend: http://localhost:3000/get-next-reel');
    const response = await fetch('http://localhost:3000/get-next-reel');
    console.log('Fetch response status:', response.status);
    if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch reel`);
    
    const json = await response.json();
    console.log('Full backend response:', json);  // Log the entire JSON for debugging

    if (!json.success) throw new Error(json.message || 'No reel data');
    
    const data = json.data;
    if (!data) throw new Error('No "data" object in response');

    // Parse the complex structure to extract caption and video URL
    console.log('Raw data object:', data);
    
    let caption = '';
    let videoUrl = '';

    // Extract caption from post_info
    if (data.post_info && typeof data.post_info.caption === 'string') {
      caption = data.post_info.caption.trim();
      console.log('Extracted caption from post_info:', caption);
    } else {
      console.warn('No caption found in post_info (data.post_info:', data.post_info, ')');
    }

    // Extract video URL: Check multiple paths with detailed logging
    console.log('Checking for video URL...');
    
    // Path 1: url_list[0]
    if (data.url_list && Array.isArray(data.url_list) && data.url_list.length > 0) {
      videoUrl = data.url_list[0].trim();
      if (videoUrl.startsWith('http')) {  // Basic validation
        console.log('Extracted video URL from url_list[0]:', videoUrl);
      } else {
        console.warn('url_list[0] is not a valid HTTP URL:', videoUrl);
        videoUrl = '';  // Invalidate
      }
    } else {
      console.warn('No valid url_list (data.url_list:', data.url_list, ')');
    }

    // Path 2: Fallback to media_details[0].url
    if (!videoUrl && data.media_details && Array.isArray(data.media_details) && data.media_details.length > 0) {
      const media = data.media_details[0];
      if (media.url && typeof media.url === 'string') {
        videoUrl = media.url.trim();
        if (videoUrl.startsWith('http')) {
          console.log('Extracted video URL from media_details[0].url:', videoUrl);
        } else {
          console.warn('media_details[0].url is not a valid HTTP URL:', videoUrl);
          videoUrl = '';
        }
      } else {
        console.warn('No valid media_details[0].url (media_details[0]:', media, ')');
      }
    } else {
      console.warn('No valid media_details (data.media_details:', data.media_details, ')');
    }

    // Path 3: Top-level url (but only if it's a direct video, not page URL)
    if (!videoUrl && json.url && typeof json.url === 'string' && json.url.includes('.mp4')) {
      videoUrl = json.url.trim();
      console.log('Fallback: Extracted video URL from top-level url:', videoUrl);
    }

    if (!videoUrl) {
      const errorMsg = 'No valid video URL found. Paths checked: url_list[0], media_details[0].url, top-level url. Response data: ' + JSON.stringify({ url_list: data.url_list, media_details: data.media_details });
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Optional: Truncate caption if too long for Snapchat (e.g., ~100 chars limit)
    if (caption.length > 100) {
      caption = caption.substring(0, 100) + '...';
      console.log('Truncated caption to 100 chars:', caption);
    }

    // Return simplified data for the rest of the code
    const simplifiedData = { caption, videoUrl };
    console.log('Returning simplified data:', simplifiedData);
    return simplifiedData;

  } catch (e) {
    console.error('Error fetching/parsing reel:', e);
    // TEMPORARY MOCK FOR TESTING (uncomment if backend is down; remove later)
    // return { caption: 'Test caption', videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4' };
    chrome.runtime.sendMessage({ type: 'error', message: 'Error fetching reel: ' + e.message });
    return null;
  }
}

async function downloadVideoBlob(videoUrl) {
  try {
    console.log('Downloading video from:', videoUrl);
    const response = await fetch(videoUrl);
    console.log('Download response status:', response.status);
    if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to download video (CORS? Use backend proxy)`);
    const blob = await response.blob();
    console.log('Downloaded video blob size:', blob.size, 'bytes, type:', blob.type);
    return blob;
  } catch (e) {
    console.error('Error downloading video:', e);
    chrome.runtime.sendMessage({ type: 'error', message: 'Error downloading video: ' + e.message + ' (Try backend proxy for Instagram URLs)' });
    return null;
  }
}

function findAndFillInput(type, value, fallbackSelectors = []) {
  const selectors = fallbackSelectors.length > 0 ? fallbackSelectors : [
    type === 'textarea' ? 'textarea[placeholder*="description"], textarea[aria-label*="caption"], textarea[placeholder*="Add a caption"]' : '',
    type === 'input' ? 'input[type="text"][placeholder*="headline"], input[aria-label*="title"], input[placeholder*="Headline"]' : '',
    type === 'textarea' ? 'textarea' : 'input[type="text"]'
  ].filter(Boolean);

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      element.focus();
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.blur();
      console.log(`Filled ${type} with selector: ${selector}, value: ${value.substring(0, 50)}...`);
      return true;
    }
  }
  console.warn(`No ${type} input found with selectors:`, selectors);
  return false;
}

async function uploadFileToInput(fileBlob, fallbackSelectors = []) {
  const selectors = fallbackSelectors.length > 0 ? fallbackSelectors : [
    'input[type="file"][accept*="video"], input[type="file"][accept*="mp4"]',
    'input[name="video"], input[name="snap_video"], input[aria-label*="upload video"]',
    'input[type="file"]'
  ].filter(Boolean);

  for (const selector of selectors) {
    const input = document.querySelector(selector);
    if (!input) continue;

    const file = new File([fileBlob], 'reel-video.mp4', { type: fileBlob.type || 'video/mp4' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    console.log(`Uploaded file via selector: ${selector}, file size: ${file.size} bytes`);
    return true;
  }

  console.warn('No file input found with selectors:', selectors);
  // Fallback: Drag-drop simulation
  const dropZones = document.querySelectorAll('div[role="button"][aria-label*="upload"], div[data-testid*="upload"]');
  for (const zone of dropZones) {
    const file = new File([fileBlob], 'reel-video.mp4', { type: fileBlob.type || 'video/mp4' });
    const dt = new DataTransfer();
    dt.items.add(file);
    const dragEvent = new DragEvent('drop', { dataTransfer: dt, bubbles: true });
    zone.dispatchEvent(dragEvent);
    console.log('Simulated drag-drop upload on:', zone);
    return true;
  }

  return false;
}

function findAndClickButton(fallbackSelectors = []) {
  const selectors = fallbackSelectors.length > 0 ? fallbackSelectors : [
    'button[data-testid="app.profileMgr.snapPoster.postSnap"]',
    'button[aria-label*="post"], button[type="submit"]:not([disabled])',
    'button'
  ].filter(Boolean);

  const allButtons = document.querySelectorAll('button');
  for (const btn of allButtons) {
    if (btn.textContent.toLowerCase().includes('post') && !btn.disabled) {
      btn.click();
      console.log('Clicked Post button (text match):', btn.textContent);
      return true;
    }
  }

  for (const selector of selectors) {
    const btn = document.querySelector(selector);
    if (btn && !btn.disabled) {
      btn.click();
      console.log('Clicked button via selector:', selector);
      return true;
    }
  }

  console.warn('No Post button found with selectors:', selectors);
  return false;
}

async function main() {
  console.log('Starting reel posting automation...');
  const reelData = await fetchNextReel();
  if (!reelData) {
    console.error('fetchNextReel returned null - aborting');
    return;
  }

  const caption = reelData.caption || '';
  const videoUrl = reelData.videoUrl || '';

  console.log('Final extracted - Caption:', caption);
  console.log('Final extracted - Video URL:', videoUrl ? videoUrl.substring(0, 100) + '...' : 'EMPTY!');

  if (!videoUrl) {
    const errorMsg = 'No video URL found in reel data after parsing. See console logs above for details.';
    console.error(errorMsg);
    chrome.runtime.sendMessage({ type: 'error', message: errorMsg });
    return;
  }

  const descFilled = findAndFillInput('textarea', caption);
  const headlineFilled = findAndFillInput('input', caption);

  if (!descFilled && !headlineFilled) {
    chrome.runtime.sendMessage({ type: 'error', message: 'Could not fill form fields. Check selectors.' });
    return;
  }

  const videoBlob = await downloadVideoBlob(videoUrl);
  if (!videoBlob) return;

  const uploaded = await uploadFileToInput(videoBlob);
  if (!uploaded) {
    chrome.runtime.sendMessage({ type: 'error', message: 'Failed to upload video. Check file input selectors.' });
    return;
  }

  console.log('Waiting 7s for upload processing...');
  await new Promise(resolve => setTimeout(resolve, 7000));

  const posted = findAndClickButton();
  if (posted) {
    const successMsg = `Posted reel: ${caption.substring(0, 50)}...`;
    console.log(successMsg);
    chrome.runtime.sendMessage({ type: 'success', message: successMsg });
  } else {
    chrome.runtime.sendMessage({ type: 'error', message: 'Failed to click Post button. Check button selectors.' });
  }
}

// Inject button
function injectButton() {
  if (document.getElementById('my-extension-button')) return;

  const btn = document.createElement('button');
  btn.id = 'my-extension-button';
  btn.textContent = 'Post Next Reel';
  Object.assign(btn.style, {
    position: 'fixed',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '2147483647',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  });

  btn.addEventListener('click', () => {
    main().catch(console.error);
  });

  document.body.appendChild(btn);
  console.log('Button injected');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectButton);
} else {
  injectButton();
}