// Translation Service

class TranslationService {
    constructor() {
        this.currentLanguage = 'it';
        this.defaultData = null;
        this.languageData = null;
        this.availableLanguages = [];
        this.isLoaded = false;
        this.firebaseService = null;
        this.init();
    }

    async init() {
        // Wait for Firebase service
        let attempts = 0;
        while (!window.firebaseService?.isInitialized && attempts < 100) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (window.firebaseService?.isInitialized) {
            this.firebaseService = window.firebaseService;
            await this.loadData();
        } else {
            console.warn('🌍 Firebase service not available, using fallback data');
            // Usa i dati globali se disponibili
            this.defaultData = { 
                products: window.SAMPLE_PRODUCTS || [], 
                categories: window.DEFAULT_CATEGORIES || [] 
            };
            this.languageData = window.ITALIAN_DEFAULT_DATA || {};
            this.availableLanguages = [{ 
                code: 'it', 
                name: 'Italiano', 
                flag: '🇮🇹', 
                active: true, 
                isDefault: true 
            }];
            this.isLoaded = true;
        }
    }

    async loadData() {
        try {
            this.defaultData = await this.firebaseService.getDefaultData();
            this.languageData = await this.firebaseService.getLanguageData(this.currentLanguage);
            this.availableLanguages = await this.firebaseService.getAvailableLanguages();
            this.isLoaded = true;
            console.log('🌍 Translation service loaded successfully');
        } catch (error) {
            console.error('🌍 Error loading translation data:', error);
            this.defaultData = { 
                products: window.SAMPLE_PRODUCTS || [], 
                categories: window.DEFAULT_CATEGORIES || [] 
            };
            this.languageData = window.ITALIAN_DEFAULT_DATA || {};
            this.availableLanguages = [{ 
                code: 'it', 
                name: 'Italiano', 
                flag: '🇮🇹', 
                active: true, 
                isDefault: true 
            }];
            this.isLoaded = true;
        }
    }

    // Main translation function
    t(key, fallback = null) {
        if (!this.languageData || !this.languageData.testi) {
            return fallback || key;
        }

        const translation = this.languageData.testi[key];
        if (translation && translation.trim() !== '') {
            return translation;
        }

        if (this.currentLanguage !== 'it' && this.firebaseService) {
            this.getItalianFallback(key).then(italianTranslation => {
                if (italianTranslation && italianTranslation !== key) {
                    this.updateElementsWithKey(key, italianTranslation);
                }
            });
        }

        return fallback || key;
    }

    async getItalianFallback(key) {
        try {
            const italianData = await this.firebaseService.getLanguageData('it');
            return italianData?.testi?.[key] || key;
        } catch (error) {
            return key;
        }
    }

    updateElementsWithKey(key, translation) {
        const elements = document.querySelectorAll(`[data-translate="${key}"]`);
        elements.forEach(element => {
            if (element.textContent === key) {
                element.textContent = translation;
            }
        });
    }

    // Specialized getters
    getAllergen(key) {
        if (!this.languageData || !this.languageData.allergeni) {
            return (window.DEFAULT_ALLERGENS && window.DEFAULT_ALLERGENS[key]?.name) || key;
        }
        return this.languageData.allergeni[key] || 
               (window.DEFAULT_ALLERGENS && window.DEFAULT_ALLERGENS[key]?.name) || key;
    }

    getCharacteristic(key) {
        const charData = this.languageData?.characteristics || 
                        this.languageData?.caratteristiche || {};
        if (charData[key]) {
            return charData[key];
        }
        return (window.DEFAULT_CHARACTERISTICS && window.DEFAULT_CHARACTERISTICS[key]?.name) || key;
    }

    getProduct(productId, field = 'name') {
        const defaultProduct = this.defaultData?.products?.find(p => p.id === productId);
        if (!defaultProduct) {
            return field === 'name' ? productId : '';
        }

        if (defaultProduct.translations && defaultProduct.translations[this.currentLanguage]) {
            const translation = defaultProduct.translations[this.currentLanguage][field];
            if (translation) return translation;
        }

        if (this.languageData?.products?.[productId]?.[field]) {
            return this.languageData.products[productId][field];
        }

        return field === 'name' ? productId : '';
    }

    getCategory(categoryId) {
        if (!this.languageData || !this.languageData.categories) {
            return categoryId;
        }
        return this.languageData.categories[categoryId] || categoryId;
    }

    // Get merged data for UI
    getMergedProducts() {
        if (!this.defaultData || !this.defaultData.products) {
            return [];
        }

        return this.defaultData.products.map(product => ({
            ...product,
            name: this.getProduct(product.id, 'name'),
            description: this.getProduct(product.id, 'description') || ''
        }));
    }

    getMergedCategories() {
        if (!this.defaultData || !this.defaultData.categories) {
            return [];
        }

        return this.defaultData.categories.map(category => ({
            ...category,
            name: this.getCategory(category.id)
        }));
    }

    // Language management
    async changeLanguage(language) {
        if (language === this.currentLanguage) {
            return true;
        }

        try {
            if (this.firebaseService) {
                const newLanguageData = await this.firebaseService.getLanguageData(language);
                if (newLanguageData) {
                    this.currentLanguage = language;
                    this.languageData = newLanguageData;
                    localStorage.setItem('selected-language', language);
                    this.updateUILanguage();
                    return true;
                }
                return false;
            }
            return false;
        } catch (error) {
            console.error(`🌍 Error changing language to ${language}:`, error);
            return false;
        }
    }

    updateUILanguage() {
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.t(key);
            if (translation && translation !== key) {
                element.textContent = translation;
            }
        });

        document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
            const key = element.getAttribute('data-translate-placeholder');
            const translation = this.t(key);
            if (translation && translation !== key) {
                element.placeholder = translation;
            }
        });

        const titleElement = document.querySelector('title[data-translate]');
        if (titleElement) {
            const key = titleElement.getAttribute('data-translate');
            const translation = this.t(key);
            if (translation && translation !== key) {
                titleElement.textContent = translation;
            }
        }

        const currentLangElements = document.querySelectorAll('#current-language, #current-language-game');
        currentLangElements.forEach(element => {
            const currentLang = this.availableLanguages.find(lang => lang.code === this.currentLanguage);
            if (currentLang) {
                element.textContent = currentLang.code.toUpperCase();
            }
        });

        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: this.currentLanguage }
        }));
    }

    getAvailableLanguagesForUI() {
        return this.availableLanguages.filter(lang => lang.active);
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getCurrentLanguageInfo() {
        return this.availableLanguages.find(lang => lang.code === this.currentLanguage) ||
            { code: 'it', name: 'Italiano', flag: '🇮🇹' };
    }

    // Admin functions
    async saveTranslations(language, translations, metaUpdate = null) {
        if (!this.firebaseService) {
            return false;
        }

        try {
            const existingData = await this.firebaseService.getLanguageData(language) || 
                                { ...(window.DEFAULT_LANGUAGE_STRUCTURE || {}) };
            const existingMeta = existingData.__meta || {};
            const incomingMeta = metaUpdate || {};

            const updatedMeta = {
                ...existingMeta,
                ...incomingMeta,
                hashes: {
                    ...(existingMeta.hashes || {}),
                    ...(incomingMeta.hashes || {})
                },
                updatedAt: new Date().toISOString()
            };

            // Merge guide translations (nested) without overwriting the whole object
            let updatedGuide = existingData.guide || existingData.guida || {};
            try {
                updatedGuide = JSON.parse(JSON.stringify(updatedGuide || {}));
            } catch (_) {
                updatedGuide = updatedGuide || {};
            }

            if (translations.guide && typeof translations.guide === 'object') {
                const flat = [];
                const flattener = window.flattenJsonStrings || ((obj, prefix, out) => out);
                const setter = window.setNestedValue || (() => {});
                flattener(translations.guide, '', flat);
                flat.forEach(row => {
                    if (!row || !row.path) return;
                    setter(updatedGuide, row.path, row.text);
                });
            }

            const updatedData = {
                ...existingData,
                __meta: updatedMeta,
                testi: { ...existingData.testi, ...translations.ui },
                allergeni: { ...existingData.allergeni, ...translations.allergens },
                products: { ...existingData.products, ...translations.products },
                categories: { ...existingData.categories, ...translations.categories },
                characteristics: {
                    ...(existingData.characteristics || existingData.caratteristiche || {}),
                    ...(translations.characteristics || translations.Characteristics || {})
                },
                guide: updatedGuide
            };

            await this.firebaseService.saveLanguageData(language, updatedData);

            if (language === this.currentLanguage) {
                await this.loadData();
                this.updateUILanguage();
            }

            return true;
        } catch (error) {
            console.error('🔧 Error saving translations:', error);
            return false;
        }
    }

    // Initialize from localStorage
    initializeFromStorage() {
        const savedLanguage = localStorage.getItem('selected-language');
        if (savedLanguage && this.availableLanguages.some(lang => lang.code === savedLanguage)) {
            this.changeLanguage(savedLanguage);
        }
    }
}

// Initialize translation service
const translationService = new TranslationService();

// Make it globally available
if (typeof window !== 'undefined') {
    window.translationService = translationService;
}

// Auto-initialize from storage when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (translationService.isLoaded) {
        translationService.initializeFromStorage();
    } else {
        const checkLoaded = setInterval(() => {
            if (translationService.isLoaded) {
                translationService.initializeFromStorage();
                clearInterval(checkLoaded);
            }
        }, 100);
    }
});