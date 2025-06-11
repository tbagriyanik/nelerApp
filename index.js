/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

const API_KEY_ERROR_MESSAGE_KEY = "apiKeyErrorMessage";
const UI_INIT_ERROR_MESSAGE_KEY = "uiInitErrorMessage";
const HISTORY_STORAGE_KEY = 'ideaSearchHistory'; 
const SETTINGS_STORAGE_KEY = 'appSettings';
const MAX_SUGGESTIONS = 7; // Max number of autocomplete suggestions

let ai;

// DOM Elements
let mainTextInput, generateIdeasButton, loadingIndicator, errorMessageDiv, suggestionsContainer, historyList,
    settingsButton, settingsModal, closeSettingsModalButton, apiKeyStatusText, languageSelect, themeSelect,
    saveSettingsButton, cancelSettingsButton, appTitleH1, mainInputLabel, generateIdeasBtnText,
    loadingIndicatorTextEl, suggestionsHeadingSr, historyHeadingVisible, settingsModalTitle, apiKeyStatusLabel,
    languageSelectLabel, themeSelectLabel, themeLightOption, themeDarkOption, cancelButtonText, saveButtonText,
    appContainer, customSuggestionsContainer; 

// Autocomplete state
let activeSuggestionIndex = -1;
let currentSuggestions = [];
let suggestionSelectionInProgress = false; 


const uiStrings = {
    en: {
        appTitle: "Neler Yapp - Idea Spark",
        settingsButtonLabel: "Open settings",
        settingsButtonText: "Settings",
        mainInputLabel: "Enter your text, topic, or keywords:",
        mainInputPlaceholder: "e.g., sustainable living, history of jazz, quick project ideas",
        generateIdeasButton: "Get Ideas",
        loadingIndicatorText: "Loading ideas...",
        apiKeyErrorMessage: "Configuration error: API Key is missing. The app may not function correctly.",
        uiInitErrorMessage: "Initialization failed: Essential UI elements are missing.",
        fetchIdeasError: "Failed to fetch ideas: ",
        noIdeasFound: "No ideas found for this input. Try something else!",
        ideasFetchErrorFallback: "Sorry, we couldn't fetch ideas at this time. Please try again later.",
        imageGenInProgress: "Generating image...",
        imageGenError: "Could not generate image. Displaying search link instead.",
        searchImagesLinkText: "Search Google Images for: \"{query}\"",
        noVisualAvailable: "No visual available for this item.",
        historyHeading: "Search History",
        noHistory: "No search history yet.",
        deleteButton: "Delete",
        deleteSearchLabel: "Delete search:",
        searchAgainTitle: "Search for \"{query}\" again",
        settingsModalTitle: "Settings",
        closeSettingsButtonLabel: "Close settings modal",
        apiKeyStatusLabel: "API Key Status:",
        apiKeyConfigured: "Configured",
        apiKeyNotConfigured: "Not Found (App may not function)",
        languageSelectLabel: "Language:",
        themeSelectLabel: "Theme:",
        themeLight: "Light",
        themeDark: "Dark",
        cancelButton: "Cancel",
        saveButton: "Save Settings",
        enterTextPrompt: "Please enter some text or keywords.",
        unavailableButton: "Unavailable",
        videoPlayerTitle: "YouTube video player for: {itemName}",
        generatedImageAlt: "Generated image for {itemName}",
        suggestionsHeading: "Suggested Ideas",
        readMoreLinkText: "Learn More"
    },
    tr: {
        appTitle: "Neler Yapp - Fikir Kıvılcımı",
        settingsButtonLabel: "Ayarları aç",
        settingsButtonText: "Ayarlar",
        mainInputLabel: "Metninizi, konunuzu veya anahtar kelimelerinizi girin:",
        mainInputPlaceholder: "örn: sürdürülebilir yaşam, caz tarihi, hızlı proje fikirleri",
        generateIdeasButton: "Fikir Üret",
        loadingIndicatorText: "Fikirler yükleniyor...",
        apiKeyErrorMessage: "Yapılandırma hatası: API Anahtarı eksik. Uygulama düzgün çalışmayabilir.",
        uiInitErrorMessage: "Başlatma başarısız: Temel UI öğeleri eksik.",
        fetchIdeasError: "Fikirler alınamadı: ",
        noIdeasFound: "Bu girdi için fikir bulunamadı. Farklı bir şey deneyin!",
        ideasFetchErrorFallback: "Üzgünüz, şu anda fikirleri getiremedik. Lütfen daha sonra tekrar deneyin.",
        imageGenInProgress: "Resim oluşturuluyor...",
        imageGenError: "Resim oluşturulamadı. Arama bağlantısı gösteriliyor.",
        searchImagesLinkText: "\"{query}\" için Google Görseller'de ara",
        noVisualAvailable: "Bu öğe için görsel mevcut değil.",
        historyHeading: "Arama Geçmişi",
        noHistory: "Henüz arama geçmişi yok.",
        deleteButton: "Sil",
        deleteSearchLabel: "Aramayı sil:",
        searchAgainTitle: "\"{query}\" için tekrar ara",
        settingsModalTitle: "Ayarlar",
        closeSettingsButtonLabel: "Ayarlar penceresini kapat",
        apiKeyStatusLabel: "API Anahtarı Durumu:",
        apiKeyConfigured: "Yapılandırılmış",
        apiKeyNotConfigured: "Bulunamadı (Uygulama çalışmayabilir)",
        languageSelectLabel: "Dil:",
        themeSelectLabel: "Tema:",
        themeLight: "Açık",
        themeDark: "Koyu",
        cancelButton: "İptal",
        saveButton: "Ayarları Kaydet",
        enterTextPrompt: "Lütfen bir metin veya anahtar kelime girin.",
        unavailableButton: "Kullanılamıyor",
        videoPlayerTitle: "Şunun için YouTube video oynatıcı: {itemName}",
        generatedImageAlt: "{itemName} için oluşturulmuş resim",
        suggestionsHeading: "Önerilen Fikirler",
        readMoreLinkText: "Daha Fazla Bilgi"
    }
};

let currentSettings = {
    language: 'en',
    theme: 'light'
};


function t(key, replacements = {}) {
    let text = uiStrings[currentSettings.language]?.[key] || uiStrings.en[key] || `Missing translation: ${key}`;
    for (const placeholder in replacements) {
        text = text.replace(`{${placeholder}}`, replacements[placeholder]);
    }
    return text;
}

function initializeAppDOM() {
    appContainer = document.getElementById('app-container');
    mainTextInput = document.getElementById('main-text-input'); 
    generateIdeasButton = document.getElementById('generate-ideas-button'); 
    loadingIndicator = document.getElementById('loading-indicator');
    errorMessageDiv = document.getElementById('error-message');
    suggestionsContainer = document.getElementById('suggestions-container'); 
    historyList = document.getElementById('history-list');
    customSuggestionsContainer = document.getElementById('custom-suggestions-container'); 

    settingsButton = document.getElementById('settings-button');
    settingsModal = document.getElementById('settings-modal');
    closeSettingsModalButton = document.getElementById('close-settings-modal-button');
    apiKeyStatusText = document.getElementById('api-key-status-text');
    languageSelect = document.getElementById('language-select');
    themeSelect = document.getElementById('theme-select');
    saveSettingsButton = document.getElementById('save-settings-button');
    cancelSettingsButton = document.getElementById('cancel-settings-button');
    
    appTitleH1 = document.querySelector('h1');
    loadingIndicatorTextEl = loadingIndicator; 
    suggestionsHeadingSr = document.getElementById('suggestions-heading'); 
    historyHeadingVisible = document.getElementById('history-heading-visible');
    settingsModalTitle = document.getElementById('settings-modal-title');
    apiKeyStatusLabel = document.querySelector('label[for="api-key-status"]'); 
    languageSelectLabel = document.querySelector('label[for="language-select"]');
    themeSelectLabel = document.querySelector('label[for="theme-select"]');
    themeLightOption = document.querySelector('#theme-select option[value="light"]');
    themeDarkOption = document.querySelector('#theme-select option[value="dark"]');

    return !(!appContainer || !mainTextInput || !generateIdeasButton || !loadingIndicator || !errorMessageDiv || !suggestionsContainer || !historyList ||
             !settingsButton || !settingsModal || !closeSettingsModalButton || !apiKeyStatusText || !languageSelect || !themeSelect || !saveSettingsButton || !cancelSettingsButton || !customSuggestionsContainer);
}

function displayError(messageKey, isCritical = false, errorDetail = "") {
    const message = t(messageKey) + (errorDetail ? ` ${errorDetail}` : "");
    if (errorMessageDiv) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    }
    if (isCritical && generateIdeasButton) {
        generateIdeasButton.disabled = true;
        generateIdeasButton.textContent = t('unavailableButton');
    }
}

function clearError() {
    if (errorMessageDiv) {
        errorMessageDiv.style.display = 'none';
        errorMessageDiv.textContent = '';
    }
}

function setLoadingState(isLoading) {
    if (loadingIndicator) loadingIndicator.style.display = isLoading ? 'block' : 'none';
    if (generateIdeasButton) generateIdeasButton.disabled = isLoading;
    if (mainTextInput) mainTextInput.disabled = isLoading;
}


function applyLanguage(lang) {
    currentSettings.language = lang;
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-translate-key]').forEach(el => {
        const key = el.dataset.translateKey;
        let translation = t(key);
        if (el.tagName === 'INPUT' && el.placeholder && key.endsWith('Placeholder')) {
            el.placeholder = translation;
        } else if (el.tagName === 'BUTTON' && el.getAttribute('aria-label') && key.endsWith('Label')) {
             el.setAttribute('aria-label', translation);
             const srSpan = el.querySelector('.sr-only');
             if (srSpan && srSpan.dataset.translateKey === key.replace('Label', 'Text')) {
                 srSpan.textContent = t(srSpan.dataset.translateKey);
             } else if(el.id === 'settings-button' && key === 'settingsButtonLabel'){ 
                const srTextSpan = el.querySelector('.sr-only[data-translate-key="settingsButtonText"]');
                if(srTextSpan) srTextSpan.textContent = t('settingsButtonText');
             }
        } else if (el.tagName === 'LABEL' && el.classList.contains('sr-only') && key.endsWith('Label')) {
            el.textContent = translation; 
        }
         else {
            el.textContent = translation;
        }
    });

    if (appTitleH1) appTitleH1.textContent = t('appTitle');
    if (mainTextInput) mainTextInput.placeholder = t('mainInputPlaceholder');
    if (generateIdeasButton) generateIdeasButton.textContent = t('generateIdeasButton');
    if (loadingIndicatorTextEl) loadingIndicatorTextEl.textContent = t('loadingIndicatorText');
    if (suggestionsHeadingSr) suggestionsHeadingSr.textContent = t('suggestionsHeading');
    if (historyHeadingVisible) historyHeadingVisible.textContent = t('historyHeading');
    if (settingsModalTitle) settingsModalTitle.textContent = t('settingsModalTitle');
    
    const apiKeyStatusLabelElement = document.querySelector('label[for="api-key-status"]');
    if (apiKeyStatusLabelElement) apiKeyStatusLabelElement.textContent = t('apiKeyStatusLabel');
    
    const languageSelectLabelElement = document.querySelector('label[for="language-select"]');
    if (languageSelectLabelElement) languageSelectLabelElement.textContent = t('languageSelectLabel');

    const themeSelectLabelElement = document.querySelector('label[for="theme-select"]');
    if (themeSelectLabelElement) themeSelectLabelElement.textContent = t('themeSelectLabel');

    if (themeLightOption) themeLightOption.textContent = t('themeLight');
    if (themeDarkOption) themeDarkOption.textContent = t('themeDark');
    if (cancelSettingsButton) cancelSettingsButton.textContent = t('cancelButton');
    if (saveSettingsButton) saveSettingsButton.textContent = t('saveButton');
    if(document.title) document.title = t('appTitle');

    renderHistory(); 
    updateApiKeyStatusDisplay(); 
}

function applyTheme(theme) {
    currentSettings.theme = theme;
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(theme + '-theme'); 
}

function loadSettings() {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            currentSettings = { ...currentSettings, ...parsedSettings };
        } catch (e) {
            console.error("Failed to parse saved settings:", e);
        }
    }
    applyLanguage(currentSettings.language); 
    applyTheme(currentSettings.theme);       
}

function saveSettings() {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings));
}

function updateApiKeyStatusDisplay() {
    if (apiKeyStatusText) {
        if (typeof process === 'object' && process.env && process.env.API_KEY) {
            apiKeyStatusText.textContent = t('apiKeyConfigured');
            apiKeyStatusText.className = 'api-key-status-display configured';
        } else {
            apiKeyStatusText.textContent = t('apiKeyNotConfigured');
            apiKeyStatusText.className = 'api-key-status-display not-configured';
        }
    }
}

function openSettingsModal() {
    if (!settingsModal || !languageSelect || !themeSelect) return;
    languageSelect.value = currentSettings.language;
    themeSelect.value = currentSettings.theme;
    updateApiKeyStatusDisplay();
    settingsModal.style.display = 'flex';
    languageSelect.focus();
}

function closeSettingsModal() {
    if (settingsModal) settingsModal.style.display = 'none';
    if (settingsButton) settingsButton.focus();
}

function handleSaveSettings() {
    const selectedLanguage = languageSelect.value;
    const selectedTheme = themeSelect.value;

    applyLanguage(selectedLanguage);
    applyTheme(selectedTheme);
    saveSettings();
    closeSettingsModal();
}

// --- Custom Autocomplete Functions ---
function handleMainTextInput() {
    const value = mainTextInput.value.toLowerCase();
    if (value.length < 1) { 
        hideCustomSuggestions();
        return;
    }

    const history = getSearchHistory();
    const filteredSuggestions = history
        .map(item => item.query) 
        .filter(query => query.toLowerCase().startsWith(value)) 
        .filter((query, index, self) => self.indexOf(query) === index) 
        .slice(0, MAX_SUGGESTIONS); 

    currentSuggestions = filteredSuggestions;
    renderCustomSuggestions(currentSuggestions);
}

function renderCustomSuggestions(suggestions) {
    customSuggestionsContainer.innerHTML = '';
    if (suggestions.length === 0) {
        hideCustomSuggestions();
        return;
    }

    suggestions.forEach((suggestionText, index) => {
        const item = document.createElement('div');
        item.classList.add('suggestion-item');
        item.textContent = suggestionText;
        item.setAttribute('role', 'option');
        item.setAttribute('id', `suggestion-${index}`);
        item.addEventListener('mousedown', (e) => { 
            e.preventDefault(); 
            suggestionSelectionInProgress = true;
            selectCustomSuggestion(suggestionText);
            setTimeout(() => { suggestionSelectionInProgress = false; }, 100); 
        });
        customSuggestionsContainer.appendChild(item);
    });

    customSuggestionsContainer.style.display = 'block';
    mainTextInput.setAttribute('aria-expanded', 'true');
    activeSuggestionIndex = -1; 
}

function selectCustomSuggestion(suggestionText) {
    mainTextInput.value = suggestionText;
    hideCustomSuggestions();
    mainTextInput.focus(); 
}

function hideCustomSuggestions() {
    if (customSuggestionsContainer) {
        customSuggestionsContainer.style.display = 'none';
        customSuggestionsContainer.innerHTML = '';
    }
    if(mainTextInput) mainTextInput.setAttribute('aria-expanded', 'false');
    currentSuggestions = [];
    activeSuggestionIndex = -1;
}

function updateSuggestionHighlight() {
    const items = customSuggestionsContainer.querySelectorAll('.suggestion-item');
    items.forEach((item, index) => {
        if (index === activeSuggestionIndex) {
            item.classList.add('active');
            mainTextInput.setAttribute('aria-activedescendant', item.id);
        } else {
            item.classList.remove('active');
        }
    });
}

function handleMainTextKeydown(event) {
    if (customSuggestionsContainer.style.display === 'block' && currentSuggestions.length > 0) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            activeSuggestionIndex = (activeSuggestionIndex + 1) % currentSuggestions.length;
            updateSuggestionHighlight();
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            activeSuggestionIndex = (activeSuggestionIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
            updateSuggestionHighlight();
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (activeSuggestionIndex > -1) {
                selectCustomSuggestion(currentSuggestions[activeSuggestionIndex]);
            } else {
                hideCustomSuggestions(); 
                handleGenerateIdeas(); 
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            hideCustomSuggestions();
        }
    } else if (event.key === 'Enter') { 
         event.preventDefault();
         handleGenerateIdeas();
    }
}
// --- End Custom Autocomplete ---


function getYouTubeVideoId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function createYouTubeEmbed(youtubeUrl, itemName) { 
    const videoId = getYouTubeVideoId(youtubeUrl);
    if (!videoId) return null;

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('allowfullscreen', '');
    iframe.title = t('videoPlayerTitle', {itemName: itemName}); 
    return iframe;
}

async function generateAndDisplayItemImage(item, containerElement) { 
    if (!ai || !(typeof process === 'object' && process.env && process.env.API_KEY)) {
        createGoogleImagesLink(item.imageSuggestionText, containerElement, item.itemName); 
        return;
    }

    containerElement.innerHTML = ''; 
    containerElement.textContent = t('imageGenInProgress');
    containerElement.setAttribute('aria-label', t('imageGenInProgress'));

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: item.imageSuggestionText,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
        });

        containerElement.innerHTML = ''; 
        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            const img = document.createElement('img');
            img.src = `data:image/jpeg;base64,${base64ImageBytes}`;
            img.alt = t('generatedImageAlt', { itemName: item.itemName }); 
            containerElement.appendChild(img);
            containerElement.setAttribute('aria-label', t('generatedImageAlt', { itemName: item.itemName }));
        } else {
            throw new Error("No image generated by API.");
        }
    } catch (error) {
        console.error('Error generating image:', error);
        containerElement.innerHTML = ''; 
        createGoogleImagesLink(item.imageSuggestionText, containerElement, item.itemName, true); 
    }
}

function createGoogleImagesLink(imageSuggestionText, containerElement, itemName, isFallback = false) { 
    containerElement.innerHTML = ''; 
    if (imageSuggestionText) {
        if(isFallback) {
             const errorMsgSpan = document.createElement('span');
             errorMsgSpan.textContent = t('imageGenError') + " ";
             containerElement.appendChild(errorMsgSpan);
        }
        const imageSearchLink = document.createElement('a');
        imageSearchLink.href = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(imageSuggestionText)}`;
        imageSearchLink.target = '_blank';
        imageSearchLink.rel = 'noopener noreferrer';
        imageSearchLink.textContent = t('searchImagesLinkText', { query: imageSuggestionText });
        containerElement.appendChild(imageSearchLink);
        containerElement.setAttribute('aria-label', t('searchImagesLinkText', { query: imageSuggestionText }));
    } else {
        containerElement.textContent = t('noVisualAvailable');
        containerElement.setAttribute('aria-label', t('noVisualAvailable'));
    }
}


async function handleGenerateIdeas() { 
    const userInput = mainTextInput.value.trim(); 
    if (!userInput) {
        displayError("enterTextPrompt"); 
        return;
    }
    hideCustomSuggestions(); 
    clearError();
    setLoadingState(true);
    suggestionsContainer.innerHTML = ''; 

    const prompt = `Based on the user's input: "${userInput}", generate 3-5 creative ideas, suggestions, or pieces of information.
For each generated item, provide:
1. "itemName": A concise title or name for the idea/item.
2. "description": A short, appealing description (1-3 sentences).
3. "imageSuggestionText": A specific and concise English text prompt suitable for an AI image generation model (like DALL-E or Imagen) to create a visually appealing image related to the item. This prompt should be descriptive and specific.
4. "externalLinks": An array of objects, each with "type" (e.g., "Website", "Video", "YouTube") and "url".
   - For "YouTube" type links: It is CRITICAL that the video is publicly viewable, embeddable on external websites without restrictions (regional, age, members-only, 'Made for Kids' with embedding off), and directly playable. If you have ANY doubt about these criteria, or if you cannot verify its embeddability, do NOT provide a YouTube link for that item. It is much better to provide no YouTube link than one that results in an error for the user.
   - For "Website" type links: Ensure these URLs are HTTPS, lead to reputable and publicly accessible content. Avoid links that are primarily advertisements, require login for core content, or are known to be unsafe.

Return ONLY a valid JSON array of item objects. Do not include any other text or explanations.
Example:
[
  {
    "itemName": "Urban Gardening Basics",
    "description": "Discover how to start your own small garden in an urban environment, focusing on container gardening and suitable plants for balconies or rooftops.",
    "imageSuggestionText": "Vibrant rooftop garden with various plants in containers, city skyline in the background, sunny day, detailed shot",
    "externalLinks": [
      {"type": "Website", "url": "https://example.com/urban-gardening"},
      {"type": "YouTube", "url": "https://www.youtube.com/watch?v=urbangarden-intro"}
    ]
  }
]`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        
        const items = JSON.parse(jsonStr); 

        if (items && items.length > 0) {
            await displaySuggestions(items); 
            saveSearchToHistory(userInput);
        } else {
            suggestionsContainer.innerHTML = `<p>${t('noIdeasFound')}</p>`; 
        }

    } catch (error) {
        console.error('Error fetching ideas:', error); 
        displayError("fetchIdeasError", false, error.message || 'Unknown error'); 
        suggestionsContainer.innerHTML = `<p>${t('ideasFetchErrorFallback')}</p>`; 
    } finally {
        setLoadingState(false);
    }
}

async function displaySuggestions(items) { 
    suggestionsContainer.innerHTML = ''; 
    for (const item of items) { 
        const ideaItemElement = document.createElement('div'); 
        ideaItemElement.className = 'idea-item'; 
        ideaItemElement.setAttribute('role', 'article');
        const uniqueItemId = item.itemName.replace(/\s+/g, '-') + '-' + Date.now(); 
        ideaItemElement.setAttribute('aria-labelledby', `item-title-${uniqueItemId}`); 

        const title = document.createElement('h3');
        title.id = `item-title-${uniqueItemId}`;
        title.textContent = item.itemName; 

        const visualContainer = document.createElement('div');
        visualContainer.className = 'image-placeholder'; 
        visualContainer.innerHTML = ''; 

        let youtubeEmbed = null;
        if (item.externalLinks && item.externalLinks.length > 0) {
            const youtubeLink = item.externalLinks.find(link => link.type && link.type.toLowerCase() === 'youtube' && link.url);
            if (youtubeLink) {
                youtubeEmbed = createYouTubeEmbed(youtubeLink.url, item.itemName); 
            }
        }

        if (youtubeEmbed) {
            visualContainer.appendChild(youtubeEmbed);
            visualContainer.setAttribute('aria-label', t('videoPlayerTitle', {itemName: item.itemName})); 
        } else if (item.imageSuggestionText) {
            await generateAndDisplayItemImage(item, visualContainer); 
        } else {
            visualContainer.textContent = t('noVisualAvailable');
            visualContainer.setAttribute('aria-label', t('noVisualAvailable'));
        }
        
        const description = document.createElement('p');
        description.textContent = item.description;
        
        ideaItemElement.appendChild(title);
        ideaItemElement.appendChild(visualContainer);
        ideaItemElement.appendChild(description);

        // "Learn More" link
        let primaryExternalLink = null;
        if (item.externalLinks && item.externalLinks.length > 0) {
            primaryExternalLink = item.externalLinks.find(link => link.url && (!link.type || link.type.toLowerCase() !== 'youtube'));
        }

        if (primaryExternalLink) {
            const readMoreLink = document.createElement('a');
            readMoreLink.href = primaryExternalLink.url;
            readMoreLink.className = 'read-more-link';
            readMoreLink.textContent = t('readMoreLinkText');
            readMoreLink.target = '_blank';
            readMoreLink.rel = 'noopener noreferrer'; // Already good practice
            ideaItemElement.appendChild(readMoreLink);
        }
        
        suggestionsContainer.appendChild(ideaItemElement);
    }
}

function getSearchHistory() {
    const historyJson = localStorage.getItem(HISTORY_STORAGE_KEY);
    try {
        return historyJson ? JSON.parse(historyJson) : [];
    } catch (e) {
        console.error("Error parsing search history:", e);
        return []; 
    }
}

function saveSearchToHistory(queryText) { 
    let history = getSearchHistory();
    const newEntry = { 
        query: queryText, 
        date: new Date().toISOString().split('T')[0] 
    };
    history = history.filter(item => item.query.toLowerCase() !== queryText.toLowerCase()); 
    history.unshift(newEntry); 
    
    if (history.length > 20) { 
        history = history.slice(0, 20);
    }
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const history = getSearchHistory();
    if (!historyList) return;
    historyList.innerHTML = ''; 
    if (history.length === 0) {
        const li = document.createElement('li');
        li.textContent = t('noHistory');
        li.style.textAlign = 'center';
        li.style.color = 'var(--subtle-text-color)';
        historyList.appendChild(li);
        return;
    }

    history.forEach((item, index) => {
        const listItem = document.createElement('li');
        
        const textSpan = document.createElement('span');
        textSpan.className = 'history-item-text';
        textSpan.textContent = item.query;
        textSpan.title = t('searchAgainTitle', {query: item.query});
        textSpan.setAttribute('role', 'button');
        textSpan.tabIndex = 0; 
        textSpan.addEventListener('click', () => {
            mainTextInput.value = item.query; 
            handleGenerateIdeas(); 
        });
        textSpan.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); 
                mainTextInput.value = item.query; 
                handleGenerateIdeas(); 
            }
        });

        const dateSpan = document.createElement('span');
        dateSpan.className = 'history-item-date';
        dateSpan.textContent = item.date;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-history-button';
        deleteButton.textContent = t('deleteButton');
        deleteButton.setAttribute('aria-label', `${t('deleteSearchLabel')} ${item.query} (${item.date})`);
        deleteButton.addEventListener('click', () => deleteHistoryItem(index));

        listItem.appendChild(textSpan);
        listItem.appendChild(dateSpan);
        listItem.appendChild(deleteButton);
        historyList.appendChild(listItem);
    });
}

function deleteHistoryItem(indexToDelete) {
    let history = getSearchHistory();
    history.splice(indexToDelete, 1);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    renderHistory();
}

document.addEventListener('DOMContentLoaded', () => {
    if (!initializeAppDOM()) {
        const initErrorMsg = uiStrings.en[UI_INIT_ERROR_MESSAGE_KEY]; 
        console.error(initErrorMsg);
        if (!document.getElementById('error-message')) alert(initErrorMsg); 
        else displayError(UI_INIT_ERROR_MESSAGE_KEY, true);
        return;
    }
    
    loadSettings(); 

    if (typeof process !== 'object' || !process.env || !process.env.API_KEY) {
        console.error(t(API_KEY_ERROR_MESSAGE_KEY));
        displayError(API_KEY_ERROR_MESSAGE_KEY, true);
    } else {
      try {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      } catch (e) {
        console.error("Failed to initialize GoogleGenAI:", e);
        displayError("fetchIdeasError", true, "AI Service Init Failed"); 
        return; 
      }
    }
    
    updateApiKeyStatusDisplay(); 

    settingsButton.addEventListener('click', openSettingsModal);
    closeSettingsModalButton.addEventListener('click', closeSettingsModal);
    settingsModal.addEventListener('click', (event) => { 
        if (event.target === settingsModal) { 
            closeSettingsModal();
        }
    });
    saveSettingsButton.addEventListener('click', handleSaveSettings);
    cancelSettingsButton.addEventListener('click', closeSettingsModal);

    generateIdeasButton.addEventListener('click', handleGenerateIdeas); 
    
    mainTextInput.addEventListener('input', handleMainTextInput);
    mainTextInput.addEventListener('keydown', handleMainTextKeydown);
    mainTextInput.addEventListener('blur', () => {
        if (!suggestionSelectionInProgress) {
            setTimeout(hideCustomSuggestions, 150);
        }
    });
    
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && settingsModal.style.display === 'flex') {
            closeSettingsModal();
        }
    });

    renderHistory(); 
});
