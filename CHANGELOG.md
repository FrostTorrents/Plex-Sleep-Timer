# 📦 Plex Sleep Timer Extension – Changelog

All notable changes to this project will be documented in this file.

---

## [v1.2.0] – 2025-10-31

### ✨ Added
- **Skipper Automation** tab in the popup UI
- Auto-click for:
  - 🎬 Skip Intro
  - 🎞 Skip Credits
  - ⏭ Play Next Episode
- MutationObserver integration for real-time DOM updates
- Simulated mouse events for robust button clicking
- Playback progress awareness to distinguish intro vs credits
- Configurable delay (ms) between skip checks
- Persistent enable/disable state and delay via `chrome.storage`

---

## [v1.1.0] – 2025-10-25

### ✨ Added
- Option to **lower volume** instead of pausing or muting
- Volume level selector input (%)
- Option persists across sessions

---

## [v1.0.0] – 2025-10-20

### 🎉 Initial Release
- Sleep timer with custom time input
- Preset buttons: 15m, 30m, 60m
- Mute instead of pause toggle
- Dim screen when timer ends
- Countdown display toggle
- Timer history logging
