let sleepTimer = null;
let sleepEndTime = null;
let showCountdown = false;

function waitForVideoElement(callback) {
  const check = () => {
    const video = document.querySelector('video');
    if (video) {
      callback(video);
    } else {
      setTimeout(check, 500);
    }
  };
  check();
}

function pauseOrMute(options) {
  waitForVideoElement(video => {
    if (options.mute) {
      console.log("[Plex Sleep Timer] Muting video...");
      video.muted = true;
    } else {
      console.log("[Plex Sleep Timer] Pausing video...");
      video.pause();
    }

    if (options.dim) {
      injectOverlay();
    }

    if (!options.showCountdown) {
      removeCountdown();
    }

    showToast("😴 Plex Sleep Timer: Action performed.");
  });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    padding: 10px 15px;
    background: rgba(0,0,0,0.8);
    color: white;
    border-radius: 5px;
    font-size: 14px;
    z-index: 9999;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function injectOverlay() {
  if (document.getElementById("plex-sleep-dim")) return;

  const dim = document.createElement("div");
  dim.id = "plex-sleep-dim";
  dim.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 24px; margin-bottom: 10px;">😴 Sleeping...</div>
      <button id="resumeButton" style="
        background-color: #4caf50;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        color: white;
        font-size: 14px;
        cursor: pointer;
      ">▶️ Resume Playback</button>
    </div>
  `;
  dim.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.85);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
  `;
  document.body.appendChild(dim);

  document.getElementById("resumeButton").addEventListener("click", () => {
    waitForVideoElement(video => {
      video.muted = false;
      video.play();
    });
    clearInterval(sleepTimer);
    removeCountdown();
    chrome.storage.local.remove("plexSleepEndTime");
    chrome.storage.local.remove("plexSleepOptions");
    dim.remove();
    showToast("▶️ Playback resumed. Timer cleared.");
  });
}

function injectCountdown() {
  if (document.getElementById("plex-sleep-countdown")) return;

  const cd = document.createElement("div");
  cd.id = "plex-sleep-countdown";
  cd.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 14px;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  const subtractBtn = document.createElement("button");
  subtractBtn.textContent = "−10";
  subtractBtn.title = "Subtract 10 minutes";
  subtractBtn.style.cssText = `
    background: none;
    border: 1px solid white;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  `;
  subtractBtn.onclick = () => {
    sleepEndTime -= 10 * 60 * 1000;
    if (sleepEndTime <= Date.now()) sleepEndTime = Date.now() + 1000;
    chrome.storage.local.set({ plexSleepEndTime: sleepEndTime });
    updateCountdown();
    showToast("⏰ Subtracted 10 minutes");
  };

  const timeSpan = document.createElement("span");
  timeSpan.id = "plex-sleep-time-text";
  timeSpan.textContent = "⏰ 00:00";

  const addBtn = document.createElement("button");
  addBtn.textContent = "+10";
  addBtn.title = "Add 10 minutes";
  addBtn.style.cssText = subtractBtn.style.cssText;
  addBtn.onclick = () => {
    sleepEndTime += 10 * 60 * 1000;
    chrome.storage.local.set({ plexSleepEndTime: sleepEndTime });
    updateCountdown();
    showToast("⏰ Added 10 minutes");
  };

  cd.appendChild(subtractBtn);
  cd.appendChild(timeSpan);
  cd.appendChild(addBtn);

  document.body.appendChild(cd);
}

function updateCountdown() {
  const span = document.getElementById("plex-sleep-time-text");
  if (!span) return;

  const remaining = sleepEndTime - Date.now();
  if (remaining <= 0) {
    span.textContent = "⏰ 00:00";
    return;
  }

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  span.textContent = `⏰ ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function removeCountdown() {
  const el = document.getElementById("plex-sleep-countdown");
  if (el) el.remove();
}

function startSleepTimer(endTime, options) {
  clearInterval(sleepTimer);
  sleepEndTime = endTime;
  showCountdown = options.showCountdown;

  if (showCountdown) injectCountdown();

  sleepTimer = setInterval(() => {
    const remaining = endTime - Date.now();
    if (showCountdown) updateCountdown();
    if (remaining <= 0) {
      clearInterval(sleepTimer);
      pauseOrMute(options);
      chrome.storage.local.remove("plexSleepEndTime");
    }
  }, 1000);

  showToast(`⏳ Sleep timer started: ${Math.round((endTime - Date.now()) / 60000)} min`);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "start_timer") {
    startSleepTimer(message.endTime, message.options);
    chrome.storage.local.set({ plexSleepOptions: message.options });

    const usedMinutes = Math.round((message.endTime - Date.now()) / 60000);
    chrome.storage.local.get({ usageDurations: [] }, data => {
      const log = data.usageDurations;
      log.push(usedMinutes);
      chrome.storage.local.set({ usageDurations: log.slice(-20) });
    });

  } else if (message.action === "cancel_timer") {
    clearInterval(sleepTimer);
    removeCountdown();
    chrome.storage.local.remove("plexSleepEndTime");
    chrome.storage.local.remove("plexSleepOptions");
    showToast("❌ Sleep timer canceled.");
  }
});

// Restore if extension reloads
chrome.storage.local.get(["plexSleepEndTime", "plexSleepOptions"], data => {
  if (data.plexSleepEndTime && data.plexSleepEndTime > Date.now()) {
    startSleepTimer(data.plexSleepEndTime, data.plexSleepOptions || {});
  }
});
