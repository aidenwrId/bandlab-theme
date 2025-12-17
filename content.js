// content.js

const THEME_STYLE_ID = 'bandlab-custom-theme-style';
const STORAGE_KEY_USER_THEMES = 'userThemes';
const STORAGE_KEY_SELECTED_THEME_ID = 'selectedThemeId';
let currentThemeCSSFile = null; // Stores the <link> element for predefined themes
let floatingPanel;
let floatingSelect;
let floatingApplyButton;
let userThemes = {};
let isDraggingPanel = false;
let dragOffset = { x: 0, y: 0 };

console.log("BandLab Themer content script loaded. v2"); // Added version for quick check

// Function to remove any existing theme stylesheet (like dark.css)
function clearPredefinedThemeStyles() {
  if (currentThemeCSSFile && currentThemeCSSFile.ownerDocument) { // Check if it's still in the document
    console.log("Removing predefined theme CSS file:", currentThemeCSSFile.id);
    currentThemeCSSFile.remove();
  }
  currentThemeCSSFile = null;
}

// Function to remove the dynamically injected style tag for custom themes
function clearCustomThemeStyles() {
  const existingStyleElement = document.getElementById(THEME_STYLE_ID);
  if (existingStyleElement) {
    console.log("Removing custom theme style element.");
    existingStyleElement.remove();
  }
}

// Function to apply a theme by injecting its CSS file
function applyPredefinedTheme(themeName) {
  console.log(`Attempting to apply predefined theme: ${themeName}`);
  clearCustomThemeStyles();
  clearPredefinedThemeStyles(); // Clear previous predefined theme CSS file

  if (themeName === 'default') {
    console.log("Applying default theme (cleared other injected styles).");
    // If default-theme.css (from manifest) has styles, they will apply.
    // If it's empty, BandLab's native styles will dominate.
    return;
  }

  const themeUrl = chrome.runtime.getURL(`themes/${themeName}.css`);
  currentThemeCSSFile = document.createElement('link');
  currentThemeCSSFile.id = `bandlab-predefined-theme-${themeName}`;
  currentThemeCSSFile.rel = 'stylesheet';
  currentThemeCSSFile.type = 'text/css';
  currentThemeCSSFile.href = themeUrl;
  (document.head || document.documentElement).appendChild(currentThemeCSSFile);
  console.log(`Applied ${themeName}.css`);
}

// Function to apply custom colors by injecting a style tag
function applyCustomTheme(colors, isAnimated) {
  console.log("Applying custom theme with colors:", colors, "Animated:", isAnimated);
  clearPredefinedThemeStyles();
  clearCustomThemeStyles();

  const styleElement = document.createElement('style');
  styleElement.id = THEME_STYLE_ID;

  let animationKeyframes = '';
  if (isAnimated) {
    animationKeyframes = `
      @keyframes rainbowCycleBgSmooth {
        0%, 100% { background-color: rgb(255, 0, 0); } /* Red */
        16.66%   { background-color: rgb(255, 255, 0); } /* Yellow */
        33.33%   { background-color: rgb(0, 255, 0); } /* Green */
        50%      { background-color: rgb(0, 255, 255); } /* Cyan */
        66.66%   { background-color: rgb(0, 0, 255); } /* Blue */
        83.33%   { background-color: rgb(255, 0, 255); } /* Magenta */
      }
      @keyframes rainbowCycleAccentSmooth {
        0%, 100% { color: rgb(255,0,0); border-color: rgb(255,0,0); } 
        16.66%   { color: rgb(255,255,0); border-color: rgb(255,255,0); }
        33.33%   { color: rgb(0,255,0); border-color: rgb(0,255,0); }
        50%      { color: rgb(0,255,255); border-color: rgb(0,255,255); }
        66.66%   { color: rgb(0,0,255); border-color: rgb(0,0,255); }
        83.33%   { color: rgb(255,0,255); border-color: rgb(255,0,255); }
      }
    `;
  }

  // XPath-derived selectors from user
  const userPath1 = "html > body > main > div > div > section:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(5) > div > div > div:nth-of-type(3) > div:nth-of-type(1)";
  const userPath2 = "html > body > main > div > div > div:nth-of-type(2) > div:nth-of-type(5) > div";
  const userPathMainDiv1 = "html > body > main > div:nth-of-type(1)"; // Likely header/toolbar
  const userPathMainDiv2 = "html > body > main > div:nth-of-type(2)"; // Likely main content area
  const userPathBodyDiv7 = "html > body > div:nth-of-type(7)"; // General, could be modal
  const userPathSect2Div = "html > body > main > div > div > section:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(4) > div:nth-of-type(1) > div";
  const userPathTopBarLeft = "html > body > main > div > div > section:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1)";
  const userPathTopBarMain = "html > body > main > div > div > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1)";

  // New XPaths from user
  const audioBarThing = "html > body > main > div > div > section:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(5) > div > div > div:nth-of-type(3) > div:nth-of-type(1)";
  const keyboardShortcutsModal = "html > body > div:nth-of-type(6)"; // Assuming div:nth-of-type(6) is the modal
  const bandlabSoundsPanel = "html > body > main > div > div > div:nth-of-type(2)"; // Also for lyrics/notes
  const profileDropdown = "html > body > div:nth-of-type(1) > site-top-bar > nav > section:nth-of-type(4) > div:nth-of-type(4) > div > div";

  styleElement.textContent = `
    ${animationKeyframes}

    :root {
      --custom-primary-bg: ${colors.primary || '#FFFFFF'} !important;
      --custom-secondary-bg: ${colors.secondary || '#F0F0F0'} !important;
      --custom-accent-color: ${colors.accent || '#007BFF'} !important;
      --custom-text-color: ${colors.text || '#000000'} !important;
      --custom-waveform-color1: ${colors.waveform1 || '#00FF00'} !important;
      --custom-waveform-color2: ${colors.waveform2 || '#FF0000'} !important;
    }

    /* Main Track Area Background (user XPath) */
    html > body > main > div > div > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) {
      background-color: var(--custom-primary-bg) !important;
      ${isAnimated ? 'animation: rainbowCycleBgSmooth 12s infinite linear !important;' : ''}
      color: var(--custom-text-color) !important;
    }
    html > body > main > div > div > section:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) * {
        color: var(--custom-text-color) !important; background-color: transparent !important;
    }

    /* Sidebar (Track List - user XPath) */
    html > body > main > div > div > section:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) {
      background-color: var(--custom-secondary-bg) !important;
      color: var(--custom-text-color) !important;
    }
    html > body > main > div > div > section:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) * {
        color: var(--custom-text-color) !important; background-color: transparent !important;
    }

    /* Additional User XPaths for theming & preventing transparency */
    ${userPathTopBarLeft}, ${userPathTopBarMain}, ${userPathMainDiv1} {
        background-color: var(--custom-secondary-bg) !important; 
        color: var(--custom-text-color) !important;
    }
    ${userPathTopBarLeft} *, ${userPathTopBarMain} *, ${userPathMainDiv1} * {
        color: var(--custom-text-color) !important; background-color: transparent !important;
    }

    ${userPathMainDiv2} { /* Assign primary for this if it's a larger content area */
        background-color: var(--custom-primary-bg) !important; 
        color: var(--custom-text-color) !important;
        ${isAnimated ? 'animation: rainbowCycleBgSmooth 12s infinite linear !important;' : ''} 
    }
     ${userPathMainDiv2} * {
        color: var(--custom-text-color) !important; background-color: transparent !important;
    }
    
    ${userPath1}, ${userPath2}, ${userPathBodyDiv7}, ${userPathSect2Div} {
        background-color: var(--custom-secondary-bg) !important; /* Defaulting to secondary for these specific/panel-like items */
        color: var(--custom-text-color) !important;
        border: 1px solid var(--custom-accent-color); /* Optional: give them an accent border */
    }
    ${userPath1} *, ${userPath2} *, ${userPathBodyDiv7} *, ${userPathSect2Div} * {
        color: var(--custom-text-color) !important; background-color: transparent !important;
    }

    /* Styles for new user-provided XPaths */
    ${audioBarThing} {
        background-color: var(--custom-primary-bg) !important;
        color: var(--custom-text-color) !important;
    }
    ${audioBarThing} * {
        color: var(--custom-text-color) !important; background-color: transparent !important;
    }

    ${keyboardShortcutsModal}, ${profileDropdown} {
        background-color: var(--custom-secondary-bg) !important;
        color: var(--custom-text-color) !important;
        border: 1px solid var(--custom-accent-color) !important; /* Good for popups/dropdowns */
    }
    ${keyboardShortcutsModal} *, ${profileDropdown} * {
        color: var(--custom-text-color) !important; background-color: transparent !important;
    }

    ${bandlabSoundsPanel} { /* This is "bandlabs sounds" and "lyrics/notes" */
        background-color: var(--custom-primary-bg) !important;
        color: var(--custom-text-color) !important;
    }
    ${bandlabSoundsPanel} * {
        color: var(--custom-text-color) !important; background-color: transparent !important;
    }

    /* Do not interfere with BandLab knobs/sliders/meters */
    .mix-editor-knob,
    .mix-editor-knob *,
    .mix-editor-slider,
    .mix-editor-slider *,
    .mix-editor-automation-slider,
    .mix-editor-automation-slider *,
    .mix-editor-volume-automation,
    .mix-editor-volume-automation *,
    .device-knob,
    .device-knob *,
    .device-slider,
    .device-slider *,
    .ui-knob,
    .ui-knob *,
    input[type="range"] {
        all: revert !important;
    }

    /* Mix Editor Track Headers */
    .mix-editor-block-headers {
        background-color: var(--custom-primary-bg) !important;
        color: var(--custom-text-color) !important;
    }
    .mix-editor-track-header {
        background-color: var(--custom-secondary-bg) !important;
        color: var(--custom-text-color) !important;
        border-bottom: 1px solid var(--custom-primary-bg) !important; /* Separator between tracks */
    }
    .mix-editor-track-header * { /* Ensure children don't obscure the header's background */
        background-color: transparent !important;
        color: var(--custom-text-color) !important;
    }
    .mix-editor-track-header input[type="text"],
    .mix-editor-track-header .mix-editor-knob-input { /* Track name, pan/volume inputs */
        background-color: var(--custom-primary-bg) !important; /* Slightly different from other inputs for contrast */
        color: var(--custom-text-color) !important;
        border: 1px solid var(--custom-accent-color) !important;
        padding: 2px 4px !important;
    }
    .mix-editor-track-header button,
    .mix-editor-track-header .mix-editor-track-header-instrument svg,
    .mix-editor-track-header .mix-editor-track-header-solo-mute span,
    .mix-editor-track-header .mix-editor-track-header-preset-icon span {
        background-color: transparent !important; /* Buttons should be transparent on secondary bg */
        color: var(--custom-accent-color) !important; /* Icons/text on buttons use accent */
        border: none !important; /* Remove default button borders if any */
    }
     .mix-editor-track-header button:hover,
     .mix-editor-track-header .mix-editor-track-header-instrument:hover svg {
        filter: brightness(1.2); /* Make buttons slightly brighter on hover */
     }

    .mix-editor-track-header-index { /* Track number */
        color: var(--custom-accent-color) !important;
        opacity: 0.7;
    }
    .mix-editor-slider-tooltip { /* Volume/Pan tooltips */
        background-color: var(--custom-primary-bg) !important;
        color: var(--custom-text-color) !important;
        border: 1px solid var(--custom-accent-color) !important;
    }

    /* General Body Fallback */
    body {
      background-color: var(--custom-primary-bg) !important;
      ${isAnimated ? 'animation: rainbowCycleBgSmooth 12s infinite linear !important;' : ''}
      color: var(--custom-text-color) !important;
    }
    body > * {
        /* color: var(--custom-text-color); */ /* Commenting out, can be too broad with specific XPath targeting */
    }

    /* General Text Elements */
    p, span, div:not([class*="bandlab-specific-ui-widget"]), /* Avoid overly general div styling if possible */
    h1, h2, h3, h4, h5, h6, li, label, th, td,
    .text-class, .label-class {
        background-color: transparent !important; 
        color: var(--custom-text-color) !important;
    }
    
    /* Headers, Generic Panels (Placeholders) */
    .header, .panel, .section-class {
      background-color: var(--custom-secondary-bg) !important;
      color: var(--custom-text-color) !important;
      border: 1px solid var(--custom-accent-color) !important; 
      ${isAnimated ? 'animation: rainbowCycleAccentSmooth 12s infinite linear reverse !important;' : ''}
    }
    .header *, .panel *, .section-class * {
        color: var(--custom-text-color) !important; background-color: transparent !important;
    }
    
    /* Interactive Elements */
    button, .button, .btn, input[type="button"], input[type="submit"] {
      background-color: var(--custom-secondary-bg) !important;
      color: var(--custom-accent-color) !important;
      border: 1px solid var(--custom-accent-color) !important;
      ${isAnimated ? 'animation: rainbowCycleAccentSmooth 12s infinite linear !important;' : ''}
    }
    button:hover, .button:hover, .btn:hover,
    input[type="button"]:hover, input[type="submit"]:hover {
        background-color: var(--custom-accent-color) !important; 
        color: var(--custom-secondary-bg) !important;
        /* No animation on hover to prevent conflict, static colors take over */
    }

    a, .link-class {
      color: var(--custom-accent-color) !important;
      ${isAnimated ? 'animation: rainbowCycleAccentSmooth 12s infinite linear !important;' : ''}
      background-color: transparent !important;
    }
    a:hover {
      filter: brightness(0.85); 
    }

    input[type="text"], input[type="search"], input[type="email"], 
    input[type="password"], input[type="number"], textarea, select {
        background-color: var(--custom-secondary-bg) !important;
        color: var(--custom-text-color) !important;
        border: 1px solid var(--custom-accent-color) !important;
        ${isAnimated ? 'animation: rainbowCycleAccentSmooth 12s infinite linear reverse !important;' : ''} 
    }

    /* Waveform styling placeholders ... */
  `;
  (document.head || document.documentElement).appendChild(styleElement);
  console.log("Applied custom theme style element. Animated:", isAnimated);
}

function injectFloatingPanelStyles() {
  if (document.getElementById('bandlab-floating-theme-styles')) return;
  const style = document.createElement('style');
  style.id = 'bandlab-floating-theme-styles';
  style.textContent = `
    #bandlab-floating-theme-panel {
      position: fixed;
      top: 80px;
      left: 80px;
      width: 320px;
      background: rgba(16, 16, 20, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 18px;
      box-shadow: 0 22px 60px rgba(0,0,0,0.55), 0 0 28px rgba(43, 233, 119, 0.28);
      color: #f6f7fb;
      z-index: 2147483646;
      backdrop-filter: blur(16px);
      font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: none;
      animation: bandlabPanelPop 260ms ease;
    }

    #bandlab-floating-theme-panel.visible {
      display: block;
    }

    #bandlab-floating-theme-panel .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      cursor: grab;
      gap: 10px;
      background: linear-gradient(135deg, rgba(43, 233, 119, 0.15), rgba(84, 92, 255, 0.15));
      border-bottom: 1px solid rgba(255,255,255,0.08);
      border-radius: 18px 18px 0 0;
    }

    #bandlab-floating-theme-panel .panel-header h4 {
      margin: 0;
      font-size: 1rem;
      letter-spacing: 0.3px;
    }

    #bandlab-floating-theme-panel .panel-header .close-btn {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 50%;
      width: 32px;
      height: 32px;
      color: #fff;
      font-weight: 700;
      cursor: pointer;
    }

    #bandlab-floating-theme-panel .panel-body {
      padding: 14px 16px 18px;
      display: grid;
      gap: 12px;
    }

    #bandlab-floating-theme-panel select,
    #bandlab-floating-theme-panel button {
      font-size: 0.95rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 10px 12px;
      color: #f6f7fb;
      background: rgba(255,255,255,0.06);
      width: 100%;
      box-sizing: border-box;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    #bandlab-floating-theme-panel button.primary {
      background: linear-gradient(125deg, #2be977, #1bc861);
      box-shadow: 0 0 22px rgba(43, 233, 119, 0.35);
      border: none;
    }

    #bandlab-floating-theme-panel button:hover,
    #bandlab-floating-theme-panel select:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 28px rgba(0,0,0,0.35);
    }

    #bandlab-floating-theme-panel .hint {
      font-size: 0.82rem;
      color: #a6a9b6;
      margin: 0;
    }

    @keyframes bandlabPanelPop {
      0% { opacity: 0; transform: translateY(8px) scale(0.98); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

function buildFloatingPanel() {
  if (floatingPanel) return;
  injectFloatingPanelStyles();
  floatingPanel = document.createElement('div');
  floatingPanel.id = 'bandlab-floating-theme-panel';
  floatingPanel.innerHTML = `
    <div class="panel-header">
      <h4>Theme Quick Switcher</h4>
      <button class="close-btn" aria-label="Close">×</button>
    </div>
    <div class="panel-body">
      <select id="bandlab-floating-selector"></select>
      <button class="primary" id="bandlab-floating-apply">Apply Theme</button>
      <p class="hint">Right click anywhere (Shift + right click for default menu). Drag the top bar to move.</p>
    </div>
  `;
  document.body.appendChild(floatingPanel);

  floatingSelect = floatingPanel.querySelector('#bandlab-floating-selector');
  floatingApplyButton = floatingPanel.querySelector('#bandlab-floating-apply');

  const closeBtn = floatingPanel.querySelector('.close-btn');
  closeBtn.addEventListener('click', hideFloatingPanel);

  floatingApplyButton.addEventListener('click', () => {
    const selectedId = floatingSelect.value;
    const theme = internalPresetThemes[selectedId] || userThemes[selectedId];
    if (theme) {
      applyTheme(theme);
      chrome.storage.sync.set({ [STORAGE_KEY_SELECTED_THEME_ID]: selectedId });
    }
  });

  enablePanelDrag(floatingPanel.querySelector('.panel-header'));
}

function enablePanelDrag(handle) {
  if (!handle) return;
  handle.addEventListener('mousedown', (event) => {
    isDraggingPanel = true;
    dragOffset.x = event.clientX - floatingPanel.offsetLeft;
    dragOffset.y = event.clientY - floatingPanel.offsetTop;
    handle.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (event) => {
    if (!isDraggingPanel) return;
    const nextLeft = event.clientX - dragOffset.x;
    const nextTop = event.clientY - dragOffset.y;
    floatingPanel.style.left = Math.max(12, Math.min(window.innerWidth - floatingPanel.offsetWidth - 12, nextLeft)) + 'px';
    floatingPanel.style.top = Math.max(12, Math.min(window.innerHeight - floatingPanel.offsetHeight - 12, nextTop)) + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDraggingPanel) {
      isDraggingPanel = false;
      handle.style.cursor = 'grab';
    }
  });
}

function populateFloatingSelect(selectedId) {
  if (!floatingSelect) return;
  floatingSelect.innerHTML = '';

  const presetGroup = document.createElement('optgroup');
  presetGroup.label = 'Presets';
  Object.values(internalPresetThemes).forEach(theme => {
    const opt = document.createElement('option');
    opt.value = theme.id;
    opt.textContent = theme.name;
    presetGroup.appendChild(opt);
  });

  floatingSelect.appendChild(presetGroup);

  if (Object.keys(userThemes).length > 0) {
    const userGroup = document.createElement('optgroup');
    userGroup.label = 'My Themes';
    Object.values(userThemes).forEach(theme => {
      const opt = document.createElement('option');
      opt.value = theme.id;
      opt.textContent = theme.name;
      userGroup.appendChild(opt);
    });
    floatingSelect.appendChild(userGroup);
  }

  floatingSelect.value = selectedId || floatingSelect.options[0]?.value || '_default_internal';
}

function showFloatingPanel(x, y) {
  buildFloatingPanel();
  floatingPanel.classList.add('visible');
  const panelWidth = floatingPanel.offsetWidth || 320;
  const panelHeight = floatingPanel.offsetHeight || 200;
  const left = Math.min(Math.max(12, x), window.innerWidth - panelWidth - 12);
  const top = Math.min(Math.max(12, y), window.innerHeight - panelHeight - 12);
  floatingPanel.style.left = `${left}px`;
  floatingPanel.style.top = `${top}px`;
}

function hideFloatingPanel() {
  if (floatingPanel) {
    floatingPanel.classList.remove('visible');
  }
}

function applyTheme(theme) {
  if (theme.type === 'predefined') {
    if (theme.id === '_default_internal') {
      applyPredefinedTheme('default');
    } else {
      applyPredefinedTheme(theme.contentJsRef || theme.id);
    }
  } else if (theme.type === 'custom') {
    applyCustomTheme(theme.colors, theme.isAnimated || false);
  }
}

function bootstrapFloatingPanel() {
  chrome.storage.sync.get([STORAGE_KEY_USER_THEMES, STORAGE_KEY_SELECTED_THEME_ID], (result) => {
    userThemes = result[STORAGE_KEY_USER_THEMES] || {};
    const selectedId = result[STORAGE_KEY_SELECTED_THEME_ID] || '_default_internal';
    buildFloatingPanel();
    populateFloatingSelect(selectedId);
  });

  document.addEventListener('contextmenu', (event) => {
    if (event.shiftKey) return; // Allow default menu with Shift + right click
    if (floatingPanel && floatingPanel.contains(event.target)) return; // If interacting with panel itself
    event.preventDefault();
    populateFloatingSelect(floatingSelect?.value || '_default_internal');
    showFloatingPanel(event.clientX, event.clientY);
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync') return;
    if (changes[STORAGE_KEY_USER_THEMES]) {
      userThemes = changes[STORAGE_KEY_USER_THEMES].newValue || {};
      populateFloatingSelect(floatingSelect?.value || '_default_internal');
    }
    if (changes[STORAGE_KEY_SELECTED_THEME_ID]) {
      populateFloatingSelect(changes[STORAGE_KEY_SELECTED_THEME_ID].newValue);
    }
  });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content.js:', request);
  let statusMessage = "Request processed.";

  try {
    if (request.type === 'default') {
      applyPredefinedTheme('default');
      statusMessage = "Default theme applied by content script.";
    } else if (request.type === 'dark') {
      applyPredefinedTheme('dark'); // Assumes you have a themes/dark.css
      statusMessage = "Dark theme applied by content script.";
    } else if (request.type === 'custom' && request.colors) {
      applyCustomTheme(request.colors, request.isAnimated || false);
      statusMessage = "Custom theme applied by content script.";
    } else {
      console.warn('Unknown message type received in content.js:', request);
      statusMessage = "Unknown message type received.";
      sendResponse({ status: statusMessage, error: true });
      return true;
    }
    sendResponse({ status: statusMessage });
  } catch (e) {
    console.error("Error processing message in content.js:", e);
    sendResponse({ status: "Error in content script", error: e.toString() });
  }
  return true; // Indicates that the response will be sent asynchronously (or for errors)
});

// Define internalPresetThemes used for initial theme application on page load.
// Note: For preset themes to load correctly with all features (like animation),
// their definitions here should match the source of truth (e.g., in popup.js),
// especially the 'isAnimated' flag for custom-type presets.
const internalPresetThemes = {
    '_default_internal': {
        id: '_default_internal',
        name: "BandLab Default",
        type: "predefined"
        // isInternal: true // Not strictly needed in content.js if only used for lookup
    },
    '_dark_internal': {
        id: '_dark_internal',
        name: "Dark Mode",
        type: "predefined",
        contentJsRef: "dark"
        // isInternal: true
    },
    '_ruby_red_preset': {
        id: '_ruby_red_preset',
        name: "Ruby Red (Preset)",
        type: "custom", // isInternal: true, isPreset: true, // These flags are popup-specific
        colors: { primary: '#4c0000', secondary: '#7a0000', accent: '#ff4d4d', text: '#ffe5e5', waveform1: '#ff8080', waveform2: '#ffb3b3' }
    },
    '_citrus_orange_preset': {
        id: '_citrus_orange_preset',
        name: "Citrus Orange (Preset)",
        type: "custom",
        colors: { primary: '#663000', secondary: '#994800', accent: '#ff9933', text: '#fff0e5', waveform1: '#ffb870', waveform2: '#ffd1a3' }
    },
    '_goldenrod_yellow_preset': {
        id: '_goldenrod_yellow_preset',
        name: "Goldenrod Yellow (Preset)",
        type: "custom",
        colors: { primary: '#665800', secondary: '#998400', accent: '#ffdd33', text: '#fffbe5', waveform1: '#ffe970', waveform2: '#fff2a3' }
    },
    '_emerald_green_preset': {
        id: '_emerald_green_preset',
        name: "Emerald Green (Preset)",
        type: "custom",
        colors: { primary: '#00330e', secondary: '#00661c', accent: '#33cc52', text: '#e5ffe9', waveform1: '#80ff9a', waveform2: '#b3ffc4' }
    },
    '_ocean_blue_preset': {
        id: '_ocean_blue_preset',
        name: "Ocean Blue (Preset)",
        type: "custom",
        colors: {
            primary: '#0d2235', secondary: '#10304a', accent: '#36a1ff', text: '#e0f2ff',
            waveform1: '#45caff', waveform2: '#ff8f45'
        }
    },
    '_sapphire_blue_preset': {
        id: '_sapphire_blue_preset',
        name: "Sapphire Blue (Preset)",
        type: "custom",
        colors: { primary: '#001f4c', secondary: '#003e99', accent: '#3385ff', text: '#e5f0ff', waveform1: '#80b3ff', waveform2: '#b3d1ff' }
    },
    '_amethyst_purple_preset': {
        id: '_amethyst_purple_preset',
        name: "Amethyst Purple (Preset)",
        type: "custom",
        colors: { primary: '#3b004c', secondary: '#62007a', accent: '#b333ff', text: '#f5e5ff', waveform1: '#d180ff', waveform2: '#e0b3ff' }
    },
    '_rose_pink_preset': {
        id: '_rose_pink_preset',
        name: "Rose Pink (Preset)",
        type: "custom",
        colors: { primary: '#660033', secondary: '#99004d', accent: '#ff3399', text: '#ffe5f2', waveform1: '#ff80c4', waveform2: '#ffb3d9' }
    },
    '_monochrome_cool_preset': {
        id: '_monochrome_cool_preset',
        name: "Monochrome Cool (Preset)",
        type: "custom",
        colors: {
            primary: '#222222', secondary: '#333333', accent: '#00aaff', text: '#e5e5e5',
            waveform1: '#cccccc', waveform2: '#999999'
        }
    },
    '_charcoal_gray_preset': {
        id: '_charcoal_gray_preset',
        name: "Charcoal Gray (Preset)",
        type: "custom",
        colors: { primary: '#1a1a1a', secondary: '#2b2b2b', accent: '#707070', text: '#d9d9d9', waveform1: '#a0a0a0', waveform2: '#c0c0c0' }
    },
    '_rainbow_preset': {
        id: '_rainbow_preset',
        name: "Rainbow (Animated)", // Name kept consistent with popup.js for clarity
        type: "custom",
        isAnimated: true,
        colors: {
            primary: '#400000',
            secondary: '#202020',
            accent: '#ff0000',
            text: '#ffffff',
            waveform1: '#00ff00',
            waveform2: '#0000ff'
        }
    }
    // Add other preset theme definitions here if they should be available for initial load.
    // Example:
    // '_another_preset': {
    //   id: '_another_preset',
    //   name: "Another Cool Preset",
    //   type: "custom", // or "predefined"
    //   colors: { primary: '#111', secondary: '#222', accent: '#0F0', text: '#EEE' },
    //   isAnimated: false // or true
    //   // contentJsRef: "another-theme-file" // if predefined and uses a different CSS file name
    // },
};

bootstrapFloatingPanel();

// Initial theme application on page load
(function() {
    chrome.storage.sync.get(['selectedThemeId', 'userThemes'], (initResult) => {
        const activeThemeId = initResult.selectedThemeId;
        const allUserThemes = initResult.userThemes || {};
        let themeForLoad = null;

        if (activeThemeId) {
            // Prioritize user themes if ID matches, then check internal presets
            themeForLoad = allUserThemes[activeThemeId] || internalPresetThemes[activeThemeId];
        }
        
        // Fallback to the internal default theme if no theme was found or no activeThemeId
        if (!themeForLoad) {
            console.log('BandLab Themer: No active theme ID found or theme not in user/presets. Falling back to default internal theme.');
            themeForLoad = internalPresetThemes['_default_internal'];
        }

        console.log('BandLab Themer: Initial theme load. Attempting to apply theme:', themeForLoad);

        if (themeForLoad) {
            if (themeForLoad.type === 'custom') {
                applyCustomTheme(themeForLoad.colors, themeForLoad.isAnimated || false);
            } else if (themeForLoad.type === 'predefined') {
                // For '_default_internal', applyPredefinedTheme will handle it as 'default'
                // For other predefined themes, use contentJsRef if available, otherwise its ID.
                const ref = themeForLoad.id === '_default_internal' ? 'default' : (themeForLoad.contentJsRef || themeForLoad.id);
                applyPredefinedTheme(ref);
            } else {
                console.warn('BandLab Themer: Unknown theme type for initial load for theme ID:', activeThemeId, '. Theme object:', themeForLoad, '. Applying BandLab default styles.');
                applyPredefinedTheme('default'); // Fallback for unknown type
            }
        } else {
            // This case should ideally not be reached if _default_internal is always in internalPresetThemes
            console.error('BandLab Themer: Critical error - themeForLoad is null even after fallback logic. Applying BandLab default styles.');
            applyPredefinedTheme('default');
        }
    });
})(); 