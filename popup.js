// BandLab Theme Extension Popup Logic
// © aidenwrld — All Rights Reserved

document.addEventListener('DOMContentLoaded', () => {
  // --- Constants ---
  const STORAGE_KEY_SELECTED_THEME_ID = 'selectedThemeId'; // Stores the ID of the active theme
  const STORAGE_KEY_USER_THEMES = 'userThemes'; // Stores an array of user-saved themes
  const CUSTOM_THEME_EDITOR_ID = '_custom_editor_'; // Special ID for when editor is active

  // --- Element References --- 
  const themeSelector = document.getElementById('theme-selector');
  const applySelectedThemeButton = document.getElementById('apply-selected-theme');
  
  const customColorsEditorDiv = document.getElementById('custom-colors-editor');
  const primaryColorInput = document.getElementById('primary-color');
  const secondaryColorInput = document.getElementById('secondary-color');
  const accentColorInput = document.getElementById('accent-color');
  const textColorInput = document.getElementById('text-color');
  const waveformColor1Input = document.getElementById('waveform-color1');
  const waveformColor2Input = document.getElementById('waveform-color2');
  const saveCurrentCustomThemeButton = document.getElementById('save-current-custom-theme');

  const themeManagementDiv = document.getElementById('theme-management');
  const themeNameInput = document.getElementById('theme-name-input');
  const exportActiveThemeButton = document.getElementById('export-active-theme');
  const importFileElement = document.getElementById('import-file');
  const importThemeFileButton = document.getElementById('import-theme-file');
  const deleteSelectedCustomThemeButton = document.getElementById('delete-selected-custom-theme');

  // --- Preset Themes (Hardcoded for now) ---
  const internalPresetThemes = {
    '_default_internal': {
        id: '_default_internal',
        name: "BandLab Default",
        type: "predefined", // Special type, tells content.js to clear styles
        isInternal: true
    },
    '_dark_internal': {
        id: '_dark_internal',
        name: "Dark Mode",
        type: "predefined", // Tells content.js to load themes/dark.css (or similar)
        contentJsRef: "dark", // The value content.js expects for this theme
        isInternal: true
    },
    '_ruby_red_preset': {
        id: '_ruby_red_preset',
        name: "Ruby Red (Preset)",
        type: "custom", isInternal: true, isPreset: true,
        colors: { primary: '#4c0000', secondary: '#7a0000', accent: '#ff4d4d', text: '#ffe5e5', waveform1: '#ff8080', waveform2: '#ffb3b3' }
    },
    '_citrus_orange_preset': {
        id: '_citrus_orange_preset',
        name: "Citrus Orange (Preset)",
        type: "custom", isInternal: true, isPreset: true,
        colors: { primary: '#663000', secondary: '#994800', accent: '#ff9933', text: '#fff0e5', waveform1: '#ffb870', waveform2: '#ffd1a3' }
    },
    '_goldenrod_yellow_preset': {
        id: '_goldenrod_yellow_preset',
        name: "Goldenrod Yellow (Preset)",
        type: "custom", isInternal: true, isPreset: true,
        colors: { primary: '#665800', secondary: '#998400', accent: '#ffdd33', text: '#fffbe5', waveform1: '#ffe970', waveform2: '#fff2a3' }
    },
    '_emerald_green_preset': {
        id: '_emerald_green_preset',
        name: "Emerald Green (Preset)",
        type: "custom", isInternal: true, isPreset: true,
        colors: { primary: '#00330e', secondary: '#00661c', accent: '#33cc52', text: '#e5ffe9', waveform1: '#80ff9a', waveform2: '#b3ffc4' }
    },
    '_ocean_blue_preset': {
        id: '_ocean_blue_preset',
        name: "Ocean Blue (Preset)",
        type: "custom",
        isInternal: true,
        isPreset: true,
        colors: {
            primary: '#0d2235', secondary: '#10304a', accent: '#36a1ff', text: '#e0f2ff',
            waveform1: '#45caff', waveform2: '#ff8f45'
        }
    },
    '_sapphire_blue_preset': {
        id: '_sapphire_blue_preset',
        name: "Sapphire Blue (Preset)",
        type: "custom", isInternal: true, isPreset: true,
        colors: { primary: '#001f4c', secondary: '#003e99', accent: '#3385ff', text: '#e5f0ff', waveform1: '#80b3ff', waveform2: '#b3d1ff' }
    },
    '_amethyst_purple_preset': {
        id: '_amethyst_purple_preset',
        name: "Amethyst Purple (Preset)",
        type: "custom", isInternal: true, isPreset: true,
        colors: { primary: '#3b004c', secondary: '#62007a', accent: '#b333ff', text: '#f5e5ff', waveform1: '#d180ff', waveform2: '#e0b3ff' }
    },
    '_rose_pink_preset': {
        id: '_rose_pink_preset',
        name: "Rose Pink (Preset)",
        type: "custom", isInternal: true, isPreset: true,
        colors: { primary: '#660033', secondary: '#99004d', accent: '#ff3399', text: '#ffe5f2', waveform1: '#ff80c4', waveform2: '#ffb3d9' }
    },
    '_monochrome_cool_preset': {
        id: '_monochrome_cool_preset',
        name: "Monochrome Cool (Preset)",
        type: "custom",
        isInternal: true,
        isPreset: true,
        colors: {
            primary: '#222222', secondary: '#333333', accent: '#00aaff', text: '#e5e5e5',
            waveform1: '#cccccc', waveform2: '#999999'
        }
    },
    '_charcoal_gray_preset': {
        id: '_charcoal_gray_preset',
        name: "Charcoal Gray (Preset)",
        type: "custom", isInternal: true, isPreset: true,
        colors: { primary: '#1a1a1a', secondary: '#2b2b2b', accent: '#707070', text: '#d9d9d9', waveform1: '#a0a0a0', waveform2: '#c0c0c0' }
    },
    '_rainbow_preset': {
        id: '_rainbow_preset',
        name: "Rainbow (Animated)",
        type: "custom", 
        isInternal: true, 
        isPreset: true,
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
  };

  let userThemes = {}; // Will be loaded from storage { id: themeObject }

  // --- Core Functions ---

  function getCustomColorsFromPickers() {
    return {
      primary: primaryColorInput.value,
      secondary: secondaryColorInput.value,
      accent: accentColorInput.value,
      text: textColorInput.value,
      waveform1: waveformColor1Input.value,
      waveform2: waveformColor2Input.value,
    };
  }

  function setCustomColorPickers(colors) {
    if (!colors) return;
    primaryColorInput.value = colors.primary || '#FFFFFF';
    secondaryColorInput.value = colors.secondary || '#F0F0F0';
    accentColorInput.value = colors.accent || '#007BFF';
    textColorInput.value = colors.text || '#000000';
    waveformColor1Input.value = colors.waveform1 || '#00FF00';
    waveformColor2Input.value = colors.waveform2 || '#FF0000';
  }

  function populateThemeSelector(selectedThemeId) {
    themeSelector.innerHTML = ''; // Clear existing options

    // Add internal/preset themes
    const internalGroup = document.createElement('optgroup');
    internalGroup.label = "Preset Themes";
    Object.values(internalPresetThemes).forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.id;
        option.textContent = theme.name;
        internalGroup.appendChild(option);
    });
    themeSelector.appendChild(internalGroup);

    // Add user themes
    if (Object.keys(userThemes).length > 0) {
        const userGroup = document.createElement('optgroup');
        userGroup.label = "My Themes";
        Object.values(userThemes).forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.id;
            option.textContent = theme.name;
            userGroup.appendChild(option);
        });
        themeSelector.appendChild(userGroup);
    }

    if (selectedThemeId) {
        themeSelector.value = selectedThemeId;
    }
    
    // Update UI based on selected theme in dropdown
    handleThemeSelectionChange(); 
  }

  function applyThemeToBandLab(theme) {
    if (!theme) return;
    console.log("Applying theme to BandLab:", theme);
    let message = {};
    if (theme.type === 'predefined') {
        if (theme.id === '_default_internal') {
            message = { type: 'default' };
        } else {
            message = { type: theme.contentJsRef || theme.id }; // Use contentJsRef if available
        }
    } else if (theme.type === 'custom' && theme.colors) {
        message = { type: 'custom', colors: theme.colors };
        if (theme.isAnimated) {
            message.isAnimated = true;
        }
    } else {
        console.warn("Unknown theme type for applying to BandLab:", theme);
        return;
    }
    sendMessageToContentScript(message);
  }
  
  function loadAndSetTheme(themeId, applyToPage = false) {
    console.log("Loading and setting theme:", themeId);
    const theme = internalPresetThemes[themeId] || userThemes[themeId];
    
    if (theme) {
        themeSelector.value = themeId; // Ensure dropdown is synced
        if (theme.type === 'custom') {
            setCustomColorPickers(theme.colors);
            customColorsEditorDiv.style.display = 'block';
            themeNameInput.value = theme.isPreset ? '' : theme.name; // Don't prefill for presets unless user edits
        } else {
            customColorsEditorDiv.style.display = 'none';
            themeNameInput.value = ''; // Clear name for predefined/internal themes
        }
        
        if (applyToPage) {
            applyThemeToBandLab(theme);
        }
        // Save the ID of the last actively selected/applied theme
        chrome.storage.sync.set({ [STORAGE_KEY_SELECTED_THEME_ID]: themeId });
    } else {
        console.warn("Theme not found for ID:", themeId, "Defaulting to BandLab Default.");
        loadAndSetTheme('_default_internal', applyToPage);
    }
  }

  function handleThemeSelectionChange() {
    const selectedId = themeSelector.value;
    loadAndSetTheme(selectedId, false); // Load data into UI, don't auto-apply yet
                                        // User clicks "Apply Selected"
  }

  // --- Event Listeners ---
  themeSelector.addEventListener('change', handleThemeSelectionChange);

  applySelectedThemeButton.addEventListener('click', () => {
    const originalButtonText = applySelectedThemeButton.textContent;
    applySelectedThemeButton.disabled = true;

    const selectedId = themeSelector.value;
    const theme = internalPresetThemes[selectedId] || userThemes[selectedId];

    if (theme) {
        applyThemeToBandLab(theme);
        chrome.storage.sync.set({ [STORAGE_KEY_SELECTED_THEME_ID]: selectedId });
        applySelectedThemeButton.textContent = "Applied!";
        console.log(`Theme "${theme.name}" applied!`);
    } else {
        applySelectedThemeButton.textContent = "Error!";
        console.error("Could not apply selected theme. Theme not found for ID:", selectedId);
    }

    setTimeout(() => {
        applySelectedThemeButton.textContent = originalButtonText;
        applySelectedThemeButton.disabled = false;
    }, 2000); // Revert after 2 seconds
  });

  saveCurrentCustomThemeButton.addEventListener('click', () => {
    let themeName = themeNameInput.value.trim();
    if (!themeName) {
        themeName = prompt("Please enter a name for your new theme:");
        if (!themeName || !themeName.trim()) {
            alert("Theme name cannot be empty. Theme not saved.");
            return;
        }
        themeName = themeName.trim();
        themeNameInput.value = themeName; // Update input field if name came from prompt
    }

    const newThemeId = `_user_${Date.now()}_${themeName.toLowerCase().replace(/\s+/g, '_')}`;
    const newTheme = {
        id: newThemeId,
        name: themeName,
        type: 'custom',
        colors: getCustomColorsFromPickers()
    };

    userThemes[newThemeId] = newTheme;
    chrome.storage.sync.set({ [STORAGE_KEY_USER_THEMES]: userThemes }, () => {
        populateThemeSelector(newThemeId); // Repopulate and select the new theme
        loadAndSetTheme(newThemeId, true); // Also apply it to the page
        alert(`Theme "${themeName}" saved and applied!`);
        themeNameInput.value = themeName; // Keep the name in input for potential export
    });
  });

  // Update theme editor when color pickers change
  [primaryColorInput, secondaryColorInput, accentColorInput, textColorInput, waveformColor1Input, waveformColor2Input].forEach(input => {
    input.addEventListener('input', () => {
        // When a color picker changes, it implies the user is editing/creating a custom theme.
        // We might not want to auto-select a specific "custom" entry in the dropdown yet,
        // but rather let them save it. The current colors are now effectively a new potential custom theme.
        console.log("Color picker changed. Editor is active.");
        customColorsEditorDiv.style.display = 'block'; 
        // Optionally, update the themeNameInput to suggest a name or clear it
        // themeNameInput.value = "My Edited Theme"; 
    });
  });

  // --- Placeholder for Import/Export/Delete ---
  exportActiveThemeButton.addEventListener('click', () => {
    const activeThemeId = themeSelector.value;
    const themeToExport = internalPresetThemes[activeThemeId] || userThemes[activeThemeId];
    let exportName = themeNameInput.value.trim();

    if (!themeToExport) {
        alert("No active theme selected to export.");
        return;
    }

    if (!exportName && themeToExport.type === 'custom') {
        exportName = prompt(`Enter a name for exporting "${themeToExport.name}":`, themeToExport.name);
        if (!exportName || !exportName.trim()) {
            alert("Export cancelled or name empty.");
            return;
        }
    } else if (!exportName && themeToExport.isInternal) {
        exportName = themeToExport.name; // Use preset name if no custom name provided
    }
    exportName = exportName || 'bandlab-theme'; // Fallback name

    const themeJSON = JSON.stringify({ 
        id: themeToExport.id, // Could be internal or user ID
        name: exportName, // User provided or theme name
        type: themeToExport.type,
        colors: themeToExport.colors, // Only if custom
        contentJsRef: themeToExport.contentJsRef // Only if predefined has specific ref
     }, null, 2);
    const blob = new Blob([themeJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportName.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("Theme exported:", exportName);
  });

  importThemeFileButton.addEventListener('click', () => {
    if (!importFileElement.files || importFileElement.files.length === 0) {
      alert('Please select a theme file to import.');
      return;
    }
    const file = importFileElement.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        console.log("Imported theme data:", importedData);

        if (!importedData.name || !importedData.type) {
            alert('Invalid theme file format: Missing name or type.');
            return;
        }

        // If it's a custom theme, it must have colors
        if (importedData.type === 'custom' && !importedData.colors) {
            alert('Invalid custom theme file: Missing colors data.');
            return;
        }
        
        // For now, all imported themes are saved as user themes
        const themeName = importedData.name;
        const newThemeId = `_user_${Date.now()}_${themeName.toLowerCase().replace(/\s+/g, '_')}`;
        const newTheme = {
            id: newThemeId,
            name: themeName,
            type: importedData.type,
            colors: importedData.colors, // Will be undefined if not custom, which is fine
            contentJsRef: importedData.contentJsRef // For imported predefined themes
        };

        userThemes[newThemeId] = newTheme;
        chrome.storage.sync.set({ [STORAGE_KEY_USER_THEMES]: userThemes }, () => {
            populateThemeSelector(newThemeId);
            loadAndSetTheme(newThemeId, true);
            alert(`Theme "${themeName}" imported and applied!`);
        });

      } catch (e) {
        console.error("Error importing theme:", e);
        alert('Error reading or parsing theme file. Ensure it is a valid JSON theme file.');
      }
    };
    reader.onerror = () => { alert('Error reading file.'); console.error("File reading error for theme import"); }
    reader.readAsText(file);
    importFileElement.value = ''; // Reset file input
  });

  deleteSelectedCustomThemeButton.addEventListener('click', () => {
    const selectedThemeId = themeSelector.value;
    if (!selectedThemeId || internalPresetThemes[selectedThemeId] || !userThemes[selectedThemeId]) {
        alert("Please select a saved 'My Theme' from the dropdown to delete.");
        return;
    }

    if (confirm(`Are you sure you want to delete the theme "${userThemes[selectedThemeId].name}"?`)) {
        delete userThemes[selectedThemeId];
        chrome.storage.sync.set({ [STORAGE_KEY_USER_THEMES]: userThemes }, () => {
            chrome.storage.sync.get(STORAGE_KEY_SELECTED_THEME_ID, (result) => {
                let nextSelectedId = '_default_internal';
                if (result[STORAGE_KEY_SELECTED_THEME_ID] === selectedThemeId) {
                    // If we deleted the active theme, revert to default and apply it
                    chrome.storage.sync.set({ [STORAGE_KEY_SELECTED_THEME_ID]: nextSelectedId });
                    loadAndSetTheme(nextSelectedId, true); 
                } else {
                    // Otherwise, just keep the current active theme (if it wasn't the one deleted)
                    nextSelectedId = result[STORAGE_KEY_SELECTED_THEME_ID] || '_default_internal';
                }
                populateThemeSelector(nextSelectedId);
                alert("Theme deleted.");
            });
        });
    }
  });

  // --- Initialization ---
  function initializePopup() {
    chrome.storage.sync.get([STORAGE_KEY_USER_THEMES, STORAGE_KEY_SELECTED_THEME_ID], (result) => {
      userThemes = result[STORAGE_KEY_USER_THEMES] || {};
      let selectedThemeId = result[STORAGE_KEY_SELECTED_THEME_ID] || '_default_internal';
      
      // Validate selectedThemeId - if it's not in presets or user themes, default
      if (!internalPresetThemes[selectedThemeId] && !userThemes[selectedThemeId]) {
          console.warn(`Stored theme ID '${selectedThemeId}' not found. Reverting to default.`);
          selectedThemeId = '_default_internal';
          chrome.storage.sync.set({ [STORAGE_KEY_SELECTED_THEME_ID]: selectedThemeId });
      }

      populateThemeSelector(selectedThemeId);
      loadAndSetTheme(selectedThemeId, true); // Load and apply the last active or default theme
    });
  }

  function sendMessageToContentScript(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id && tabs[0].url && tabs[0].url.includes('bandlab.com')) {
        chrome.tabs.sendMessage(tabs[0].id, message, response => {
          if (chrome.runtime.lastError) {
            console.warn("Message sending failed:", chrome.runtime.lastError.message);
          } else if (response) {
            console.log("Response from content script:", response.status);
          }
        });
      } else {
        if (!(tabs[0] && tabs[0].url && tabs[0].url.includes('bandlab.com'))){
             console.log("Not sending message: Active tab is not a BandLab page.");
        } else {
            console.error("Could not get active tab ID or URL to send message.");
        }
      }
    });
  }

  initializePopup();
}); 