/**
 * Inspector 4 dev - Content Script v2.1
 * Features: Extended tooltip, color picker mode, collapsible SVGs, OS-aware shortcuts
 */

(function () {
  "use strict";

  if (window.__elementInspectorPro) return;
  window.__elementInspectorPro = true;

  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  let state = {
    enabled: false,
    currentElement: null,
    panel: null,
    badge: null,
    tooltip: null,
    assetsPanel: null,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    panelPosition: { x: null, y: null },
    settings: {
      darkMode: true,
      extendedTooltip: false,
      showDimensions: true,
      colorPickerMode: false,
      collapseSvgs: true,
    },
  };

  const icons = {
    logo: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    close: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    copy: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`,
    typography: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>`,
    layout: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/></svg>`,
    box: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
    download: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    image: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>`,
    assets: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    drag: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>`,
    export: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>`,
    chevron: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6,9 12,15 18,9"/></svg>`,
  };

  async function init() {
    const stored = await chrome.storage.local.get([
      "inspectorEnabled",
      "darkMode",
      "extendedTooltip",
      "showDimensions",
      "colorPickerMode",
      "collapseSvgs",
    ]);
    state.settings.darkMode = stored.darkMode !== false;
    state.settings.extendedTooltip = stored.extendedTooltip || false;
    state.settings.showDimensions = stored.showDimensions !== false;
    state.settings.colorPickerMode = stored.colorPickerMode || false;
    state.settings.collapseSvgs = stored.collapseSvgs !== false;
    if (stored.inspectorEnabled) enableInspector();
    chrome.runtime.onMessage.addListener(handleMessage);
    document.addEventListener("keydown", handleKeyboard);
  }

  function handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case "toggleInspector":
        message.enabled ? enableInspector() : disableInspector();
        break;
      case "updateSettings":
        Object.assign(state.settings, message.settings);
        if (state.panel) updatePanelTheme();
        if (state.assetsPanel) updatePanelTheme();
        break;
      case "getPageStats":
        sendResponse(getPageStats());
        break;
    }
    return true;
  }

  function handleKeyboard(e) {
    const modKey = isMac ? e.altKey : e.altKey;
    if (modKey && e.key.toLowerCase() === "i") {
      e.preventDefault();
      state.enabled ? disableInspector() : enableInspector();
      chrome.storage.local.set({ inspectorEnabled: state.enabled });
    }
    if (e.key === "Escape") {
      if (state.assetsPanel) closeAssetsPanel();
      else if (state.panel) closePanel();
    }
    if (
      e.key.toLowerCase() === "c" &&
      state.enabled &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      const active = document.activeElement;
      if (active.tagName !== "INPUT" && active.tagName !== "TEXTAREA") {
        e.preventDefault();
        if (state.settings.colorPickerMode && state.currentElement) {
          copyColorUnderCursor();
        } else if (state.panel && state.currentElement) {
          copyElementColor();
        }
      }
    }
    if (
      e.key.toLowerCase() === "a" &&
      state.enabled &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      const active = document.activeElement;
      if (active.tagName !== "INPUT" && active.tagName !== "TEXTAREA") {
        e.preventDefault();
        state.assetsPanel ? closeAssetsPanel() : showAssetsPanel();
      }
    }
  }

  function enableInspector() {
    state.enabled = true;
    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("mouseout", handleMouseOut, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("mousemove", handleMouseMove, true);
    showBadge();
  }

  function disableInspector() {
    state.enabled = false;
    document.removeEventListener("mouseover", handleMouseOver, true);
    document.removeEventListener("mouseout", handleMouseOut, true);
    document.removeEventListener("click", handleClick, true);
    document.removeEventListener("mousemove", handleMouseMove, true);
    if (state.currentElement)
      state.currentElement.classList.remove("eip-highlight");
    closePanel();
    closeAssetsPanel();
    hideBadge();
    hideTooltip();
  }

  function handleMouseOver(e) {
    if (!state.enabled || isInspectorElement(e.target)) return;
    if (state.currentElement && state.currentElement !== e.target) {
      state.currentElement.classList.remove("eip-highlight");
    }
    state.currentElement = e.target;
    e.target.classList.add("eip-highlight");
    showTooltip(e.target, e.clientX, e.clientY);
  }

  function handleMouseMove(e) {
    if (!state.enabled) return;
    if (isInspectorElement(e.target)) {
      hideTooltip();
      return;
    }
    if (state.tooltip && state.currentElement)
      updateTooltipPosition(e.clientX, e.clientY);
  }

  function handleMouseOut(e) {
    if (!state.enabled || isInspectorElement(e.target)) return;
    e.target.classList.remove("eip-highlight");
    hideTooltip();
  }

  function handleClick(e) {
    if (!state.enabled || isInspectorElement(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    state.currentElement = e.target;
    hideTooltip();
    showPanel(e.target, e.clientX, e.clientY);
  }

  function isInspectorElement(el) {
    return (
      el.closest(".eip-panel") ||
      el.closest(".eip-badge") ||
      el.closest(".eip-toast") ||
      el.closest(".eip-tooltip") ||
      el.closest(".eip-assets-panel")
    );
  }

  function showTooltip(element, x, y) {
    if (!state.tooltip) {
      state.tooltip = document.createElement("div");
      state.tooltip.className = "eip-tooltip";
      document.body.appendChild(state.tooltip);
    }
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : "";
    const classes = Array.from(element.classList)
      .filter((c) => !c.startsWith("eip-"))
      .slice(0, 2)
      .map((c) => `.${c}`)
      .join("");
    const rect = element.getBoundingClientRect();
    const size = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;

    let extendedInfo = "";
    if (state.settings.extendedTooltip) {
      const styles = window.getComputedStyle(element);
      const textColor = rgbToHex(styles.color);
      const bgColor = rgbToHex(styles.backgroundColor);
      const fontSize = styles.fontSize;
      extendedInfo = `
        <div class="eip-tooltip-extended">
          <span class="eip-tooltip-color" style="--color: ${styles.color}"></span>
          <span class="eip-tooltip-color-value">${textColor}</span>
          <span class="eip-tooltip-color" style="--color: ${styles.backgroundColor}"></span>
          <span class="eip-tooltip-color-value">${bgColor}</span>
          <span class="eip-tooltip-font">${fontSize}</span>
        </div>
      `;
    }

    state.tooltip.innerHTML = `
      <div class="eip-tooltip-main">
        <span class="eip-tooltip-tag">&lt;${tagName}&gt;</span>
        ${id ? `<span class="eip-tooltip-id">${id}</span>` : ""}
        ${classes ? `<span class="eip-tooltip-class">${classes}</span>` : ""}
        <span class="eip-tooltip-size">${size}</span>
      </div>
      ${extendedInfo}
    `;
    updateTooltipPosition(x, y);
    state.tooltip.classList.add("visible");
  }

  function updateTooltipPosition(x, y) {
    if (!state.tooltip) return;
    const offset = 15;
    const tooltipRect = state.tooltip.getBoundingClientRect();
    let left = x + offset;
    let top = y + offset;
    if (left + tooltipRect.width > window.innerWidth - 10)
      left = x - tooltipRect.width - offset;
    if (top + tooltipRect.height > window.innerHeight - 10)
      top = y - tooltipRect.height - offset;
    state.tooltip.style.left = `${left}px`;
    state.tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    if (state.tooltip) state.tooltip.classList.remove("visible");
  }

  function showBadge() {
    if (state.badge) return;
    state.badge = document.createElement("div");
    state.badge.className = "eip-badge";
    state.badge.innerHTML = `${icons.logo}<span class="eip-badge-text">Inspector ON</span>`;
    state.badge.title = `Inspector 4 dev - Activo (${isMac ? "⌥" : "Alt"}+I para desactivar)`;
    state.badge.addEventListener("click", () =>
      state.assetsPanel ? closeAssetsPanel() : showAssetsPanel(),
    );
    document.body.appendChild(state.badge);
  }

  function hideBadge() {
    if (state.badge) {
      state.badge.remove();
      state.badge = null;
    }
  }

  function showPanel(element, clickX, clickY) {
    if (state.panel) state.panel.remove();
    const styles = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    state.panel = document.createElement("div");
    state.panel.className = `eip-panel ${state.settings.darkMode ? "" : "eip-light"}`;
    state.panel.innerHTML = generatePanelHTML(element, styles, rect);
    document.body.appendChild(state.panel);

    const panelWidth = 360;
    const panelHeight = state.panel.offsetHeight;
    const padding = 20;
    let posX, posY;

    if (clickX > window.innerWidth / 2) {
      posX = Math.max(padding, clickX - panelWidth - 30);
    } else {
      posX = Math.min(window.innerWidth - panelWidth - padding, clickX + 30);
    }
    posY = Math.max(
      padding,
      Math.min(clickY - 100, window.innerHeight - panelHeight - padding),
    );

    if (state.panelPosition.x === null) {
      state.panel.style.left = `${posX}px`;
      state.panel.style.top = `${posY}px`;
      state.panel.style.right = "auto";
    } else {
      state.panel.style.left = `${state.panelPosition.x}px`;
      state.panel.style.top = `${state.panelPosition.y}px`;
      state.panel.style.right = "auto";
    }
    bindPanelEvents();
  }

  function closePanel() {
    if (state.panel) {
      state.panel.remove();
      state.panel = null;
    }
  }

  function generatePanelHTML(element, styles, rect) {
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : "";
    const classes = Array.from(element.classList)
      .filter((c) => c && !c.startsWith("eip-"))
      .map((c) => `.${c}`)
      .join("");
    const textColor = rgbToHex(styles.color);
    const bgColor = rgbToHex(styles.backgroundColor);
    const modKey = isMac ? "⌥" : "Alt";

    return `
      <div class="eip-panel-header">
        <div class="eip-drag-handle" title="Arrastra para mover">${icons.drag}</div>
        <h3 class="eip-panel-title"><span class="eip-panel-icon">${icons.logo}</span>Inspector</h3>
        <div class="eip-panel-actions">
          <button class="eip-btn eip-btn-assets" title="Ver assets (A)">${icons.assets}</button>
          <button class="eip-btn eip-btn-export" title="Exportar CSS">${icons.export}</button>
          <button class="eip-btn eip-btn-close" title="Cerrar (Esc)">${icons.close}</button>
        </div>
      </div>
      <div class="eip-panel-content">
        <div class="eip-section">
          <div class="eip-element-tag">
            <span class="eip-tag-name">&lt;${tagName}&gt;</span>
            ${id ? `<span class="eip-element-id">${id}</span>` : ""}
            ${classes ? `<span class="eip-element-class">${classes}</span>` : ""}
          </div>
          <div class="eip-element-size">${Math.round(rect.width)} × ${Math.round(rect.height)} px</div>
        </div>

        <div class="eip-section eip-color-quick">
          <div class="eip-color-card" data-color="${textColor}" data-type="text" title="Click para copiar color de texto">
            <div class="eip-color-swatch-lg" style="background: ${styles.color}"></div>
            <div class="eip-color-info">
              <span class="eip-color-label">Color</span>
              <span class="eip-color-hex">${textColor}</span>
            </div>
            <span class="eip-copy-indicator">${icons.copy}</span>
          </div>
          <div class="eip-color-card" data-color="${bgColor}" data-type="bg" title="Click para copiar background">
            <div class="eip-color-swatch-lg" style="background: ${styles.backgroundColor}"></div>
            <div class="eip-color-info">
              <span class="eip-color-label">Background</span>
              <span class="eip-color-hex">${bgColor}</span>
            </div>
            <span class="eip-copy-indicator">${icons.copy}</span>
          </div>
        </div>

        <div class="eip-section eip-collapsible" data-section="typography">
          <h4 class="eip-section-title">
            <span class="eip-section-icon">${icons.typography}</span>Tipografía<span class="eip-collapse-icon">▼</span>
          </h4>
          <div class="eip-section-content">
            <div class="eip-prop-grid">
              <div class="eip-prop-item"><span class="eip-prop-label">Font</span><span class="eip-prop-value">${cleanFontFamily(styles.fontFamily)}</span></div>
              <div class="eip-prop-item"><span class="eip-prop-label">Size</span><span class="eip-prop-value">${styles.fontSize}</span></div>
              <div class="eip-prop-item"><span class="eip-prop-label">Weight</span><span class="eip-prop-value">${styles.fontWeight}</span></div>
              <div class="eip-prop-item"><span class="eip-prop-label">Line Height</span><span class="eip-prop-value">${styles.lineHeight}</span></div>
              <div class="eip-prop-item"><span class="eip-prop-label">Letter Spacing</span><span class="eip-prop-value">${styles.letterSpacing}</span></div>
              <div class="eip-prop-item"><span class="eip-prop-label">Text Align</span><span class="eip-prop-value">${styles.textAlign}</span></div>
            </div>
          </div>
        </div>

        <div class="eip-section eip-collapsible" data-section="layout">
          <h4 class="eip-section-title">
            <span class="eip-section-icon">${icons.layout}</span>Layout<span class="eip-collapse-icon">▼</span>
          </h4>
          <div class="eip-section-content">
            <div class="eip-prop-grid">
              <div class="eip-prop-item"><span class="eip-prop-label">Display</span><span class="eip-prop-value eip-highlight-value">${styles.display}</span></div>
              <div class="eip-prop-item"><span class="eip-prop-label">Position</span><span class="eip-prop-value">${styles.position}</span></div>
              ${
                styles.display === "flex" || styles.display === "inline-flex"
                  ? `
              <div class="eip-prop-item"><span class="eip-prop-label">Direction</span><span class="eip-prop-value">${styles.flexDirection}</span></div>
              <div class="eip-prop-item"><span class="eip-prop-label">Justify</span><span class="eip-prop-value">${styles.justifyContent}</span></div>
              <div class="eip-prop-item"><span class="eip-prop-label">Align</span><span class="eip-prop-value">${styles.alignItems}</span></div>
              <div class="eip-prop-item"><span class="eip-prop-label">Gap</span><span class="eip-prop-value">${styles.gap}</span></div>
              `
                  : ""
              }
              ${
                styles.display === "grid"
                  ? `
              <div class="eip-prop-item eip-prop-full"><span class="eip-prop-label">Grid Template</span><span class="eip-prop-value">${styles.gridTemplateColumns}</span></div>
              <div class="eip-prop-item"><span class="eip-prop-label">Gap</span><span class="eip-prop-value">${styles.gap}</span></div>
              `
                  : ""
              }
              <div class="eip-prop-item"><span class="eip-prop-label">Z-Index</span><span class="eip-prop-value">${styles.zIndex}</span></div>
              <div class="eip-prop-item"><span class="eip-prop-label">Overflow</span><span class="eip-prop-value">${styles.overflow}</span></div>
            </div>
          </div>
        </div>

        ${
          state.settings.showDimensions
            ? `
        <div class="eip-section eip-collapsible" data-section="boxmodel">
          <h4 class="eip-section-title">
            <span class="eip-section-icon">${icons.box}</span>Box Model<span class="eip-collapse-icon">▼</span>
          </h4>
          <div class="eip-section-content">
            <div class="eip-box-model">
              <div class="eip-box-layer eip-box-margin">
                <span class="eip-box-label">margin</span>
                <div class="eip-box-values"><span>${parseInt(styles.marginTop)}</span></div>
                <div class="eip-box-horizontal">
                  <span>${parseInt(styles.marginLeft)}</span>
                  <div class="eip-box-layer eip-box-border">
                    <span class="eip-box-label">border</span>
                    <div class="eip-box-values"><span>${parseInt(styles.borderTopWidth)}</span></div>
                    <div class="eip-box-horizontal">
                      <span>${parseInt(styles.borderLeftWidth)}</span>
                      <div class="eip-box-layer eip-box-padding">
                        <span class="eip-box-label">padding</span>
                        <div class="eip-box-values"><span>${parseInt(styles.paddingTop)}</span></div>
                        <div class="eip-box-horizontal">
                          <span>${parseInt(styles.paddingLeft)}</span>
                          <div class="eip-box-layer eip-box-content">
                            <div class="eip-box-size">${Math.round(rect.width)} × ${Math.round(rect.height)}</div>
                          </div>
                          <span>${parseInt(styles.paddingRight)}</span>
                        </div>
                        <div class="eip-box-values"><span>${parseInt(styles.paddingBottom)}</span></div>
                      </div>
                      <span>${parseInt(styles.borderRightWidth)}</span>
                    </div>
                    <div class="eip-box-values"><span>${parseInt(styles.borderBottomWidth)}</span></div>
                  </div>
                  <span>${parseInt(styles.marginRight)}</span>
                </div>
                <div class="eip-box-values"><span>${parseInt(styles.marginBottom)}</span></div>
              </div>
            </div>
          </div>
        </div>
        `
            : ""
        }

        <div class="eip-section eip-collapsible collapsed" data-section="effects">
          <h4 class="eip-section-title">
            <span class="eip-section-icon">${icons.layout}</span>Efectos & Más<span class="eip-collapse-icon">▼</span>
          </h4>
          <div class="eip-section-content">
            <div class="eip-prop-grid">
              <div class="eip-prop-item"><span class="eip-prop-label">Border Radius</span><span class="eip-prop-value">${styles.borderRadius}</span></div>
              <div class="eip-prop-item"><span class="eip-prop-label">Opacity</span><span class="eip-prop-value">${styles.opacity}</span></div>
              <div class="eip-prop-item"><span class="eip-prop-label">Cursor</span><span class="eip-prop-value">${styles.cursor}</span></div>
              <div class="eip-prop-item"><span class="eip-prop-label">Transition</span><span class="eip-prop-value">${styles.transition === "all 0s ease 0s" ? "none" : "custom"}</span></div>
              <div class="eip-prop-item eip-prop-full"><span class="eip-prop-label">Box Shadow</span><span class="eip-prop-value">${styles.boxShadow === "none" ? "none" : "custom"}</span></div>
            </div>
          </div>
        </div>

        <div class="eip-section eip-actions-section">
          <button class="eip-copy-btn eip-copy-css">${icons.copy} Copiar CSS</button>
          <div class="eip-shortcut-hint"><kbd>C</kbd> copiar color • <kbd>A</kbd> ver assets</div>
        </div>
      </div>
    `;
  }

  function bindPanelEvents() {
    if (!state.panel) return;
    state.panel
      .querySelector(".eip-btn-close")
      ?.addEventListener("click", closePanel);
    state.panel
      .querySelector(".eip-btn-export")
      ?.addEventListener("click", exportFullCSS);
    state.panel
      .querySelector(".eip-btn-assets")
      ?.addEventListener("click", showAssetsPanel);
    state.panel
      .querySelector(".eip-copy-css")
      ?.addEventListener("click", copyElementCSS);

    state.panel.querySelectorAll(".eip-color-card").forEach((card) => {
      card.addEventListener("click", () => {
        const color = card.dataset.color;
        const type = card.dataset.type;
        copyToClipboard(color);
        showToast(
          `${type === "bg" ? "Background" : "Color"} copiado: ${color}`,
        );
        card.classList.add("copied");
        setTimeout(() => card.classList.remove("copied"), 1500);
      });
    });

    state.panel
      .querySelectorAll(".eip-collapsible .eip-section-title")
      .forEach((title) => {
        title.addEventListener("click", () =>
          title.closest(".eip-collapsible").classList.toggle("collapsed"),
        );
      });

    const dragHandle = state.panel.querySelector(".eip-drag-handle");
    const header = state.panel.querySelector(".eip-panel-header");
    dragHandle?.addEventListener("mousedown", startDrag);
    header?.addEventListener("mousedown", (e) => {
      if (
        !e.target.closest(".eip-btn") &&
        !e.target.closest(".eip-drag-handle")
      )
        startDrag(e);
    });
  }

  function startDrag(e) {
    e.preventDefault();
    state.isDragging = true;
    const rect = state.panel.getBoundingClientRect();
    state.dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    state.panel.classList.add("dragging");
    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  }

  function doDrag(e) {
    if (!state.isDragging || !state.panel) return;
    let x = e.clientX - state.dragOffset.x;
    let y = e.clientY - state.dragOffset.y;
    const panelRect = state.panel.getBoundingClientRect();
    x = Math.max(0, Math.min(x, window.innerWidth - panelRect.width));
    y = Math.max(0, Math.min(y, window.innerHeight - panelRect.height));
    state.panel.style.left = `${x}px`;
    state.panel.style.top = `${y}px`;
    state.panel.style.right = "auto";
    state.panelPosition = { x, y };
  }

  function stopDrag() {
    state.isDragging = false;
    if (state.panel) state.panel.classList.remove("dragging");
    document.removeEventListener("mousemove", doDrag);
    document.removeEventListener("mouseup", stopDrag);
  }

  function copyColorUnderCursor() {
    if (!state.currentElement) return;
    const styles = window.getComputedStyle(state.currentElement);
    const bgColor = rgbToHex(styles.backgroundColor);
    const textColor = rgbToHex(styles.color);
    const colorToCopy = bgColor !== "transparent" ? bgColor : textColor;
    copyToClipboard(colorToCopy);
    showToast(`Color copiado: ${colorToCopy}`);
  }

  function copyElementColor() {
    if (!state.currentElement) return;
    const styles = window.getComputedStyle(state.currentElement);
    const color = rgbToHex(styles.color);
    copyToClipboard(color);
    showToast(`Color copiado: ${color}`);
    const colorCard = state.panel?.querySelector(
      '.eip-color-card[data-type="text"]',
    );
    if (colorCard) {
      colorCard.classList.add("copied");
      setTimeout(() => colorCard.classList.remove("copied"), 1500);
    }
  }

  function copyElementCSS() {
    if (!state.currentElement) return;
    const styles = window.getComputedStyle(state.currentElement);
    const cssProperties = [
      "font-family",
      "font-size",
      "font-weight",
      "line-height",
      "letter-spacing",
      "color",
      "background-color",
      "display",
      "position",
      "width",
      "height",
      "padding",
      "margin",
      "border",
      "border-radius",
      "box-shadow",
      "opacity",
    ];
    let css = "/* Inspector 4 dev - CSS Export */\n.element {\n";
    cssProperties.forEach((prop) => {
      const value = styles.getPropertyValue(prop);
      if (value && value !== "none" && value !== "normal")
        css += `  ${prop}: ${value};\n`;
    });
    css += "}\n";
    copyToClipboard(css);
    const copyBtn = state.panel?.querySelector(".eip-copy-css");
    if (copyBtn) {
      copyBtn.classList.add("copied");
      copyBtn.innerHTML = `${icons.check} ¡Copiado!`;
      setTimeout(() => {
        copyBtn.classList.remove("copied");
        copyBtn.innerHTML = `${icons.copy} Copiar CSS`;
      }, 2000);
    }
    showToast("CSS copiado al portapapeles");
  }

  function exportFullCSS() {
    if (!state.currentElement) return;
    const styles = window.getComputedStyle(state.currentElement);
    const tagName = state.currentElement.tagName.toLowerCase();
    const id = state.currentElement.id ? `#${state.currentElement.id}` : "";
    const className = Array.from(state.currentElement.classList)
      .filter((c) => c && !c.startsWith("eip-"))
      .map((c) => `.${c}`)
      .join("");
    const selector = id || className || tagName;
    let css = `/* Inspector 4 dev - Full CSS Export */\n/* Selector: ${selector} */\n\n${selector} {\n`;
    const props = [
      "font-family",
      "font-size",
      "font-weight",
      "font-style",
      "line-height",
      "letter-spacing",
      "text-align",
      "text-decoration",
      "text-transform",
      "color",
      "background-color",
      "background-image",
      "background-size",
      "background-position",
      "background-repeat",
      "display",
      "position",
      "top",
      "right",
      "bottom",
      "left",
      "width",
      "height",
      "min-width",
      "max-width",
      "min-height",
      "max-height",
      "flex-direction",
      "flex-wrap",
      "justify-content",
      "align-items",
      "align-content",
      "gap",
      "flex-grow",
      "flex-shrink",
      "grid-template-columns",
      "grid-template-rows",
      "grid-gap",
      "margin",
      "padding",
      "border",
      "border-radius",
      "box-shadow",
      "opacity",
      "overflow",
      "z-index",
      "transform",
      "transition",
      "cursor",
    ];
    props.forEach((prop) => {
      const value = styles.getPropertyValue(prop);
      if (
        value &&
        value !== "none" &&
        value !== "normal" &&
        value !== "auto" &&
        value !== "0px"
      )
        css += `  ${prop}: ${value};\n`;
    });
    css += "}\n";
    copyToClipboard(css);
    showToast("CSS completo exportado");
  }

  function showAssetsPanel() {
    if (state.assetsPanel) {
      closeAssetsPanel();
      return;
    }
    const assets = collectPageAssets();
    state.assetsPanel = document.createElement("div");
    state.assetsPanel.className = `eip-assets-panel ${state.settings.darkMode ? "" : "eip-light"}`;
    state.assetsPanel.innerHTML = generateAssetsPanelHTML(assets);
    document.body.appendChild(state.assetsPanel);
    bindAssetsPanelEvents(assets);
  }

  function closeAssetsPanel() {
    if (state.assetsPanel) {
      state.assetsPanel.remove();
      state.assetsPanel = null;
    }
  }

  function collectPageAssets() {
    const assets = { images: [], backgrounds: [], svgs: [] };
    document.querySelectorAll("img").forEach((img) => {
      if (
        img.src &&
        !img.src.startsWith("data:") &&
        !assets.images.find((a) => a.src === img.src)
      ) {
        assets.images.push({
          src: img.src,
          alt: img.alt || "Image",
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      }
    });
    document.querySelectorAll("*").forEach((el) => {
      const bg = window.getComputedStyle(el).backgroundImage;
      if (bg && bg !== "none") {
        const urlMatch = bg.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (
          urlMatch &&
          !urlMatch[1].startsWith("data:") &&
          !assets.backgrounds.find((a) => a.src === urlMatch[1])
        ) {
          assets.backgrounds.push({
            src: urlMatch[1],
            element: el.tagName.toLowerCase(),
          });
        }
      }
    });
    document.querySelectorAll("svg").forEach((svg, index) => {
      const svgString = new XMLSerializer().serializeToString(svg);
      assets.svgs.push({
        content: svgString,
        width: svg.getAttribute("width") || svg.getBoundingClientRect().width,
        height:
          svg.getAttribute("height") || svg.getBoundingClientRect().height,
        index,
      });
    });
    return assets;
  }

  function generateAssetsPanelHTML(assets) {
    const totalAssets =
      assets.images.length + assets.backgrounds.length + assets.svgs.length;
    const svgsCollapsed = state.settings.collapseSvgs;

    return `
      <div class="eip-assets-header">
        <h3>${icons.assets} Assets de la página <span class="eip-assets-count">${totalAssets}</span></h3>
        <button class="eip-btn eip-btn-close">${icons.close}</button>
      </div>
      <div class="eip-assets-content">
        ${
          assets.images.length > 0
            ? `
          <div class="eip-assets-section">
            <h4>${icons.image} Imágenes (${assets.images.length})</h4>
            <div class="eip-assets-grid">
              ${assets.images
                .map(
                  (img) => `
                <div class="eip-asset-card" data-src="${img.src}">
                  <div class="eip-asset-preview"><img src="${img.src}" alt="${img.alt}" loading="lazy"></div>
                  <div class="eip-asset-info">
                    <span class="eip-asset-name" title="${img.src}">${getFileName(img.src)}</span>
                    <span class="eip-asset-size">${img.width}×${img.height}</span>
                  </div>
                  <button class="eip-asset-download" data-src="${img.src}" data-name="${getFileName(img.src)}" title="Descargar">${icons.download}</button>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
        ${
          assets.backgrounds.length > 0
            ? `
          <div class="eip-assets-section">
            <h4>${icons.image} Fondos (${assets.backgrounds.length})</h4>
            <div class="eip-assets-grid">
              ${assets.backgrounds
                .map(
                  (bg) => `
                <div class="eip-asset-card" data-src="${bg.src}">
                  <div class="eip-asset-preview"><img src="${bg.src}" alt="Background" loading="lazy"></div>
                  <div class="eip-asset-info">
                    <span class="eip-asset-name" title="${bg.src}">${getFileName(bg.src)}</span>
                    <span class="eip-asset-size">&lt;${bg.element}&gt;</span>
                  </div>
                  <button class="eip-asset-download" data-src="${bg.src}" data-name="${getFileName(bg.src)}" title="Descargar">${icons.download}</button>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
        ${
          assets.svgs.length > 0
            ? `
          <div class="eip-assets-section eip-svgs-section ${svgsCollapsed ? "collapsed" : ""}">
            <h4 class="eip-svgs-header">
              ${icons.image} SVGs (${assets.svgs.length})
              <span class="eip-svgs-toggle">${icons.chevron}</span>
            </h4>
            <div class="eip-assets-grid eip-svgs-grid" ${svgsCollapsed ? 'style="display:none"' : ""}>
            </div>
          </div>
        `
            : ""
        }
        ${totalAssets === 0 ? `<div class="eip-assets-empty"><span>No se encontraron assets en esta página</span></div>` : ""}
      </div>
      <div class="eip-assets-footer">
        <button class="eip-download-all-btn" ${totalAssets === 0 ? "disabled" : ""}>${icons.download} Descargar todo (${totalAssets})</button>
      </div>
    `;
  }

  function bindAssetsPanelEvents(assets) {
    if (!state.assetsPanel) return;
    state.assetsPanel
      .querySelector(".eip-btn-close")
      ?.addEventListener("click", closeAssetsPanel);

    state.assetsPanel.querySelectorAll(".eip-asset-download").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        downloadAsset(btn.dataset.src, btn.dataset.name);
      });
    });

    const svgsHeader = state.assetsPanel.querySelector(".eip-svgs-header");
    const svgsGrid = state.assetsPanel.querySelector(".eip-svgs-grid");
    const svgsSection = state.assetsPanel.querySelector(".eip-svgs-section");

    if (svgsHeader && svgsGrid) {
      svgsHeader.addEventListener("click", () => {
        const isCollapsed = svgsSection.classList.contains("collapsed");
        if (isCollapsed) {
          svgsSection.classList.remove("collapsed");
          svgsGrid.style.display = "grid";
          if (svgsGrid.children.length === 0) {
            loadSvgs(assets.svgs, svgsGrid);
          }
        } else {
          svgsSection.classList.add("collapsed");
          svgsGrid.style.display = "none";
        }
      });
    }

    state.assetsPanel
      .querySelector(".eip-download-all-btn")
      ?.addEventListener("click", () => downloadAllAssets(assets));
  }

  function loadSvgs(svgs, container) {
    svgs.forEach((svg) => {
      const blob = new Blob([svg.content], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const card = document.createElement("div");
      card.className = "eip-asset-card eip-svg-card";
      card.innerHTML = `
        <div class="eip-asset-preview eip-svg-preview"><img src="${url}" alt="SVG"></div>
        <div class="eip-asset-info">
          <span class="eip-asset-name">SVG #${svg.index + 1}</span>
          <span class="eip-asset-size">${Math.round(svg.width)}×${Math.round(svg.height)}</span>
        </div>
        <button class="eip-asset-download-svg" title="Descargar">${icons.download}</button>
      `;
      card
        .querySelector(".eip-asset-download-svg")
        .addEventListener("click", (e) => {
          e.stopPropagation();
          downloadSVG(svg.content, `svg-${svg.index + 1}.svg`);
        });
      container.appendChild(card);
    });
  }

  async function downloadAsset(src, filename) {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "asset";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Descargando: ${filename}`);
    } catch (error) {
      showToast("Error al descargar", "error");
    }
  }

  function downloadSVG(svgContent, filename) {
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Descargando: ${filename}`);
  }

  async function downloadAllAssets(assets) {
    let count = 0;
    for (const img of assets.images) {
      await downloadAsset(img.src, getFileName(img.src));
      count++;
      await sleep(300);
    }
    for (const bg of assets.backgrounds) {
      await downloadAsset(bg.src, getFileName(bg.src));
      count++;
      await sleep(300);
    }
    for (const svg of assets.svgs) {
      downloadSVG(svg.content, `svg-${svg.index + 1}.svg`);
      count++;
      await sleep(300);
    }
    showToast(`${count} assets descargados`);
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement("textarea");
      t.value = text;
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      document.body.removeChild(t);
    }
  }

  function showToast(message, type = "success") {
    const existing = document.querySelector(".eip-toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = `eip-toast eip-toast-${type}`;
    toast.innerHTML = `${type === "success" ? icons.check : icons.close}<span>${message}</span>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  function updatePanelTheme() {
    if (state.panel)
      state.panel.classList.toggle("eip-light", !state.settings.darkMode);
    if (state.assetsPanel)
      state.assetsPanel.classList.toggle("eip-light", !state.settings.darkMode);
  }

  function getPageStats() {
    const fonts = new Set();
    const colors = new Set();
    document.querySelectorAll("*").forEach((el) => {
      const style = window.getComputedStyle(el);
      const font = style.fontFamily.split(",")[0].trim().replace(/['"]/g, "");
      if (font) fonts.add(font);
      const color = rgbToHex(style.color);
      const bgColor = rgbToHex(style.backgroundColor);
      if (color && color !== "transparent") colors.add(color);
      if (bgColor && bgColor !== "transparent") colors.add(bgColor);
    });
    return {
      fonts: fonts.size,
      colors: colors.size,
      images: document.querySelectorAll("img").length,
    };
  }

  function rgbToHex(rgb) {
    if (!rgb || rgb === "transparent" || rgb === "rgba(0, 0, 0, 0)")
      return "transparent";
    const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return rgb;
    return `#${parseInt(match[1]).toString(16).padStart(2, "0")}${parseInt(match[2]).toString(16).padStart(2, "0")}${parseInt(match[3]).toString(16).padStart(2, "0")}`.toUpperCase();
  }

  function cleanFontFamily(fontFamily) {
    return fontFamily.split(",")[0].trim().replace(/['"]/g, "");
  }
  function getFileName(url) {
    try {
      return new URL(url).pathname.split("/").pop() || "asset";
    } catch {
      return "asset";
    }
  }
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
