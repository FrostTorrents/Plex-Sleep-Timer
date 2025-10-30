// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log("[Plex Sleep Timer] Extension installed.");
});

// Optional: keep service worker alive briefly on startup
chrome.runtime.onStartup.addListener(() => {
  console.log("[Plex Sleep Timer] Extension started.");
});

// Handle messages if needed (can forward or log)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "log") {
    console.log("[Plex Sleep Timer]", message.data);
  }
});
