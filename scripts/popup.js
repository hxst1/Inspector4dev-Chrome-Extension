/**
 * Inspector 4 dev - Popup Script v2.2
 */

class PopupController {
  constructor() {
    this.isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);

    this.elements = {
      container: document.getElementById("popup-container"),
      mainView: document.getElementById("main-view"),
      settingsView: document.getElementById("settings-view"),
      settingsBtn: document.getElementById("settings-btn"),
      backBtn: document.getElementById("back-btn"),
      toggle: document.getElementById("inspector-toggle"),
      statusText: document.getElementById("status-text"),
      toggleSection: document.getElementById("toggle-section"),
      statsSection: document.getElementById("stats-section"),
      fontsCount: document.getElementById("fonts-count"),
      colorsCount: document.getElementById("colors-count"),
      imagesCount: document.getElementById("images-count"),
      shortcutToggle: document.getElementById("shortcut-toggle"),
      darkMode: document.getElementById("dark-mode"),
      extendedTooltip: document.getElementById("extended-tooltip"),
      showDimensions: document.getElementById("show-dimensions"),
      collapseSvgs: document.getElementById("collapse-svgs"),
    };

    this.init();
  }

  async init() {
    this.setupShortcutDisplay();
    await this.loadState();
    this.bindEvents();
    this.requestPageStats();
  }

  setupShortcutDisplay() {
    const modKey = this.isMac ? "⌥ Option" : "Alt";
    this.elements.shortcutToggle.innerHTML = `<kbd>${modKey}</kbd><span style="margin: 0 4px; color: var(--text-tertiary)">+</span><kbd>I</kbd>`;
  }

  async loadState() {
    const result = await chrome.storage.local.get([
      "inspectorEnabled",
      "darkMode",
      "extendedTooltip",
      "showDimensions",
      "collapseSvgs",
    ]);

    this.elements.toggle.checked = result.inspectorEnabled || false;
    this.updateToggleUI(result.inspectorEnabled || false);

    const isDark = result.darkMode !== false;
    this.elements.darkMode.checked = isDark;
    this.elements.extendedTooltip.checked = result.extendedTooltip || false;
    this.elements.showDimensions.checked = result.showDimensions !== false;
    this.elements.collapseSvgs.checked = result.collapseSvgs !== false;

    this.applyTheme(isDark);
  }

  bindEvents() {
    this.elements.settingsBtn.addEventListener("click", () =>
      this.showSettings(),
    );
    this.elements.backBtn.addEventListener("click", () => this.showMain());

    this.elements.toggle.addEventListener("change", (e) => {
      this.toggleInspector(e.target.checked);
    });

    this.elements.toggleSection.addEventListener("click", (e) => {
      if (e.target.closest(".switch")) return;
      this.elements.toggle.checked = !this.elements.toggle.checked;
      this.toggleInspector(this.elements.toggle.checked);
    });

    this.elements.darkMode.addEventListener("change", (e) => {
      this.saveSetting("darkMode", e.target.checked);
      this.applyTheme(e.target.checked);
    });

    this.elements.extendedTooltip.addEventListener("change", (e) => {
      this.saveSetting("extendedTooltip", e.target.checked);
    });

    this.elements.showDimensions.addEventListener("change", (e) => {
      this.saveSetting("showDimensions", e.target.checked);
    });

    this.elements.collapseSvgs.addEventListener("change", (e) => {
      this.saveSetting("collapseSvgs", e.target.checked);
    });
  }

  showSettings() {
    this.elements.mainView.classList.add("hidden");
    this.elements.settingsView.classList.remove("hidden");
  }

  showMain() {
    this.elements.settingsView.classList.add("hidden");
    this.elements.mainView.classList.remove("hidden");
  }

  applyTheme(isDark) {
    this.elements.container.classList.toggle("light", !isDark);
  }

  async toggleInspector(enabled) {
    await chrome.storage.local.set({ inspectorEnabled: enabled });
    this.updateToggleUI(enabled);

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: "toggleInspector",
          enabled: enabled,
        });
        if (enabled) {
          setTimeout(() => this.requestPageStats(), 100);
        }
      } catch (error) {
        console.log(
          "Content script not ready, will activate on page interaction",
        );
      }
    }
  }

  updateToggleUI(enabled) {
    if (enabled) {
      this.elements.statusText.textContent = "Activado";
      this.elements.statusText.classList.add("active");
      this.elements.toggleSection.classList.add("active");
      this.elements.statsSection.classList.add("active");
    } else {
      this.elements.statusText.textContent = "Desactivado";
      this.elements.statusText.classList.remove("active");
      this.elements.toggleSection.classList.remove("active");
      this.elements.statsSection.classList.remove("active");
    }
  }

  async saveSetting(key, value) {
    await chrome.storage.local.set({ [key]: value });

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: "updateSettings",
          settings: { [key]: value },
        });
      } catch (error) {
        console.log("Could not update settings:", error);
      }
    }
  }

  async requestPageStats() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.id) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: "getPageStats",
        });
        if (response) this.updateStats(response);
      } catch (error) {
        console.log("Could not get page stats");
      }
    }
  }

  updateStats(stats) {
    this.elements.fontsCount.textContent = stats.fonts || "-";
    this.elements.colorsCount.textContent = stats.colors || "-";
    this.elements.imagesCount.textContent = stats.images || "-";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new PopupController();
});
