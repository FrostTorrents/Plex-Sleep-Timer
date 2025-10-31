document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-button");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(btn => btn.classList.remove("active"));
      contents.forEach(el => el.style.display = "none");

      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).style.display = "block";
    });
  });

  const startBtn = document.getElementById("startBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const timerInput = document.getElementById("timerInput");
  const muteCheckbox = document.getElementById("muteInsteadOfPause");
  const dimCheckbox = document.getElementById("dimScreen");
  const countdownCheckbox = document.getElementById("countdownToggle");
  const lowerVolumeCheckbox = document.getElementById("lowerVolumeCheckbox");
  const volumeLevelInput = document.getElementById("volumeLevelInput");
  const volumeLevelContainer = document.getElementById("volumeLevelContainer");
  const logContainer = document.getElementById("logContainer");
  const suggestionContainer = document.getElementById("suggestion");
  const statusEl = document.getElementById("statusMessage");

  lowerVolumeCheckbox.addEventListener("change", () => {
    volumeLevelContainer.style.display = lowerVolumeCheckbox.checked ? "block" : "none";
  });

  document.querySelectorAll(".preset").forEach(button => {
    button.addEventListener("click", () => {
      const mins = parseInt(button.dataset.minutes);
      timerInput.value = mins;
      startTimer(mins);
    });
  });

  startBtn.addEventListener("click", () => {
    const minutes = parseInt(timerInput.value);
    if (isNaN(minutes) || minutes < 1) return;
    startTimer(minutes);
  });

  cancelBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "cancel_timer" });
    });
    logActivity("❌ Timer canceled");
    statusEl.textContent = "⏹️ Timer canceled.";
    setTimeout(() => statusEl.textContent = "", 4000);
  });

  function startTimer(minutes) {
    const endTime = Date.now() + minutes * 60000;
    const options = {
      mute: muteCheckbox.checked,
      dim: dimCheckbox.checked,
      showCountdown: countdownCheckbox.checked,
      lowerVolume: lowerVolumeCheckbox.checked,
      volumeLevel: parseInt(volumeLevelInput.value) || 10
    };

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "start_timer",
        endTime,
        options
      });
    });

    chrome.storage.local.set({
      plexSleepEndTime: endTime,
      plexSleepOptions: options
    });

    chrome.storage.local.get({ timerLog: [] }, data => {
      const log = data.timerLog;
      log.unshift(`✅ Set for ${minutes} min at ${new Date().toLocaleTimeString()}`);
      chrome.storage.local.set({ timerLog: log.slice(0, 10) });
    });

    statusEl.textContent = `⏳ Timer started for ${minutes} minute${minutes !== 1 ? "s" : ""}.`;
    setTimeout(() => statusEl.textContent = "", 4000);
  }

  function logActivity(entry) {
    chrome.storage.local.get({ timerLog: [] }, data => {
      const log = data.timerLog;
      log.unshift(`${entry} at ${new Date().toLocaleTimeString()}`);
      chrome.storage.local.set({ timerLog: log.slice(0, 10) });
    });
  }

  chrome.storage.local.get(["plexSleepEndTime", "timerLog", "plexSleepOptions"], data => {
    if (data.timerLog) {
      logContainer.innerHTML = data.timerLog.map(entry => `<div class="log">${entry}</div>`).join("");
    }
    if (data.plexSleepOptions) {
      muteCheckbox.checked = !!data.plexSleepOptions.mute;
      dimCheckbox.checked = !!data.plexSleepOptions.dim;
      countdownCheckbox.checked = !!data.plexSleepOptions.showCountdown;
      lowerVolumeCheckbox.checked = !!data.plexSleepOptions.lowerVolume;
      volumeLevelInput.value = data.plexSleepOptions.volumeLevel || 10;
      volumeLevelContainer.style.display = lowerVolumeCheckbox.checked ? "block" : "none";
    }
  });

  chrome.storage.local.get(["usageDurations"], data => {
    const usage = data.usageDurations || [];
    if (usage.length > 0) {
      const mostCommon = usage.sort((a, b) =>
        usage.filter(v => v === a).length - usage.filter(v => v === b).length
      ).pop();

      suggestionContainer.innerHTML = `💡 You often use ${mostCommon} min. <button id="useSuggestion">Use it</button>`;

      document.getElementById("useSuggestion").addEventListener("click", () => {
        timerInput.value = mostCommon;
        startTimer(parseInt(mostCommon));
      });
    }
  });

  const enableSkipper = document.getElementById("enableSkipper");
  const skipperDelayInput = document.getElementById("skipperDelay");
  const saveSkipperBtn = document.getElementById("saveSkipperSettings");

  if (enableSkipper && skipperDelayInput && saveSkipperBtn) {
    chrome.storage.local.get(["skipperEnabled", "skipperDelay"], data => {
      enableSkipper.checked = !!data.skipperEnabled;
      skipperDelayInput.value = data.skipperDelay || 1000;
    });

    saveSkipperBtn.addEventListener("click", () => {
      const enabled = enableSkipper.checked;
      const delay = parseInt(skipperDelayInput.value) || 1000;

      chrome.storage.local.set({
        skipperEnabled: enabled,
        skipperDelay: delay
      });

      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: enabled ? "start_skipper" : "stop_skipper",
          delay
        });
      });
    });
  }
});
