// background.js (Corrected - Fixed addListener Typo)

chrome.action.onClicked.addListener((tab) => {  // FIXED: addListener, not addEventListener
  if (!tab.id) return;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content-script.js']
  });
});

// Listen for messages from content script (for notifications)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'error') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',  // Requires icon.png in extension folder
      title: 'Reel Poster Error',
      message: message.message
    });
  } else if (message.type === 'success') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Reel Posted Successfully!',
      message: message.message
    });
  }
  // No sendResponse needed unless async
});