let skipperObserver = null;
let skipperDelay = 1000;

function simulateClick(element) {
  ["mousedown", "mouseup", "click"].forEach(type => {
    element.dispatchEvent(new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      buttons: 1
    }));
  });
}

function findSkipButton() {
  return Array.from(document.querySelectorAll("button")).find(btn => {
    const text = btn.textContent?.trim();
    return (
      btn.className.includes("AudioVideoFullPlayer-overlayButton") &&
      ["Skip Intro", "Skip Credits"].some(label => text?.includes(label))
    );
  });
}

function findNextEpisodeButton() {
  return Array.from(document.querySelectorAll("button")).find(btn =>
    btn.className.includes("AudioVideoUpNext-playButton")
  );
}

function determineSection() {
  const slider = document.querySelector("[class*=Slider-thumb-]:not([aria-labelledby])");
  if (!slider) return "unknown";

  const now = parseInt(slider.getAttribute("aria-valuenow") || "0", 10);
  const max = parseInt(slider.getAttribute("aria-valuemax") || "1", 10);
  const progress = (now / max) * 100;

  return progress < 50 ? "intro" : "credits";
}

function tryClickSkip() {
  const button = findSkipButton();
  if (!button || button.disabled) return;

  const section = determineSection();
  console.log(`[Skipper] Detected section: ${section}`);

  setTimeout(() => {
    simulateClick(button);
    console.log(`[Skipper] Clicked skip button: ${button.textContent?.trim()}`);
  }, skipperDelay);
}

function tryClickNext() {
  const nextButton = findNextEpisodeButton();
  if (nextButton && !nextButton.disabled) {
    simulateClick(nextButton);
    console.log(`[Skipper] Clicked next episode button.`);
  }
}

function observeSkippableElements() {
  if (skipperObserver) skipperObserver.disconnect();

  skipperObserver = new MutationObserver(() => {
    tryClickSkip();
    tryClickNext();
  });

  skipperObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log("[Skipper] MutationObserver started");
}

function startSkipper(delay = 1000) {
  skipperDelay = delay;
  observeSkippableElements();
}

function stopSkipper() {
  if (skipperObserver) skipperObserver.disconnect();
  console.log("[Skipper] MutationObserver stopped");
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "start_skipper") {
    startSkipper(msg.delay);
  } else if (msg.action === "stop_skipper") {
    stopSkipper();
  }
});

chrome.storage.local.get(["skipperEnabled", "skipperDelay"], data => {
  if (data.skipperEnabled) {
    startSkipper(data.skipperDelay || 1000);
  }
});
