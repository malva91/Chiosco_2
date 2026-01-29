// Firebase Service

class FirebaseService {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.cache = new Map();
        this.cacheTimestamps = new Map();
        this.init();
    }

    async init() {
        try {
            // Verifica che Firebase SDK sia caricato
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK not loaded. Please include Firebase scripts in your HTML.');
            }

            // Verifica che FIREBASE_CONFIG sia definito
            if (typeof FIREBASE_CONFIG === 'undefined') {
                // The constants.js file must be loaded before this service to expose
                // FIREBASE_CONFIG on the global scope.
                throw new Error('FIREBASE_CONFIG not defined. Please include constants.js before firebaseService.js');
            }

            // Initialize Firebase
            firebase.initializeApp(FIREBASE_CONFIG);
            this.db = firebase.firestore();
            this.isInitialized = true;
            console.log('🔥 Firebase initialized successfully');
        } catch (error) {
            console.error('🔥 Firebase initialization error:', error);
            this.isInitialized = false;
        }
    }

    // Cache management
    isCacheValid(key) {
        const timestamp = this.cacheTimestamps.get(key);
        if (!timestamp) return false;
        return Date.now() - timestamp < (window.CACHE_DURATION || 300000);
    }

    setCache(key, data) {
        this.cache.set(key, data);
        this.cacheTimestamps.set(key, Date.now());
    }

    getCache(key) {
        if (this.isCacheValid(key)) {
            return this.cache.get(key);
        }
        return null;
    }

    clearCache(type = null) {
        if (type) {
            for (const key of this.cache.keys()) {
                if (key.startsWith(type)) {
                    this.cache.delete(key);
                    this.cacheTimestamps.delete(key);
                }
            }
        } else {
            this.cache.clear();
            this.cacheTimestamps.clear();
        }
    }

    // Default data operations
    async getDefaultData() {
        const cacheKey = 'default-data';
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        if (!this.isInitialized) {
            return {
                products: window.SAMPLE_PRODUCTS || [],
                categories: window.DEFAULT_CATEGORIES || []
            };
        }

        try {
            const doc = await this.db.collection('data').doc('default').get();
            if (doc.exists) {
                const data = doc.data();
                this.setCache(cacheKey, data);
                return data;
            } else {
                const defaultData = {
                    products: window.SAMPLE_PRODUCTS || [],
                    categories: window.DEFAULT_CATEGORIES || []
                };
                await this.saveDefaultData(defaultData);
                this.setCache(cacheKey, defaultData);
                return defaultData;
            }
        } catch (error) {
            console.error('🔥 Error loading default data:', error);
            return {
                products: window.SAMPLE_PRODUCTS || [],
                categories: window.DEFAULT_CATEGORIES || []
            };
        }
    }

    async saveDefaultData(data) {
        if (!this.isInitialized) return false;

        try {
            await this.db.collection('data').doc('default').set(data);
            this.clearCache('default');
            console.log('🔥 Default data saved successfully');
            return true;
        } catch (error) {
            console.error('🔥 Error saving default data:', error);
            return false;
        }
    }

    // Language data operations
    async getLanguageData(language) {
        const cacheKey = `language-${language}`;
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        if (!this.isInitialized) {
            return language === 'it' ? window.ITALIAN_DEFAULT_DATA : null;
        }

        try {
            const doc = await this.db.collection('data').doc(language).get();
            if (doc.exists) {
                const data = doc.data();
                this.setCache(cacheKey, data);
                return data;
            } else if (language === 'it') {
                await this.saveLanguageData('it', window.ITALIAN_DEFAULT_DATA);
                this.setCache(cacheKey, window.ITALIAN_DEFAULT_DATA);
                return window.ITALIAN_DEFAULT_DATA;
            } else {
                return null;
            }
        } catch (error) {
            console.error(`🔥 Error loading language data for ${language}:`, error);
            return language === 'it' ? window.ITALIAN_DEFAULT_DATA : null;
        }
    }

    async saveLanguageData(language, data) {
        if (!this.isInitialized) return false;

        try {
            await this.db.collection('data').doc(language).set(data);
            this.clearCache(`language-${language}`);
            console.log(`🔥 Language data saved for ${language}`);
            return true;
        } catch (error) {
            console.error(`🔥 Error saving language data for ${language}:`, error);
            return false;
        }
    }

    // Get available languages
    async getAvailableLanguages() {
        const cacheKey = 'available-languages';
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        if (!this.isInitialized) {
            return [{ code: 'it', name: 'Italiano', flag: '🇮🇹', active: true, isDefault: true }];
        }

        try {
            const snapshot = await this.db.collection('data').get();
            const languages = [];

            snapshot.forEach(doc => {
                if (doc.id !== 'default') {
                    const data = doc.data();
                    if (data.tagLingua && data.tagLingua.active) {
                        languages.push({
                            code: doc.id,
                            ...data.tagLingua
                        });
                    }
                }
            });

            languages.sort((a, b) => {
                if (a.isDefault) return -1;
                if (b.isDefault) return 1;
                return a.name.localeCompare(b.name);
            });

            this.setCache(cacheKey, languages);
            return languages;
        } catch (error) {
            console.error('🔥 Error loading available languages:', error);
            return [{ code: 'it', name: 'Italiano', flag: '🇮🇹', active: true, isDefault: true }];
        }
    }

    // Create new language
    async createLanguage(languageCode, languageInfo) {
        if (!this.isInitialized) return false;

        try {
            const newLanguageData = {
                ...(window.DEFAULT_LANGUAGE_STRUCTURE || {}),
                tagLingua: {
                    ...languageInfo,
                    active: true,
                    isDefault: false
                }
            };

            await this.saveLanguageData(languageCode, newLanguageData);
            this.clearCache('available-languages');
            return true;
        } catch (error) {
            console.error(`🔥 Error creating language ${languageCode}:`, error);
            return false;
        }
    }

    // Delete language
    async deleteLanguage(languageCode) {
        if (!this.isInitialized) return false;

        if (languageCode === 'it') {
            throw new Error('Cannot delete default Italian language');
        }

        try {
            await this.db.collection('data').doc(languageCode).delete();
            this.clearCache(`language-${languageCode}`);
            this.clearCache('available-languages');
            return true;
        } catch (error) {
            console.error(`🔥 Error deleting language ${languageCode}:`, error);
            return false;
        }
    }

    // Product operations
    async addProduct(product) {
        try {
            const defaultData = await this.getDefaultData();
            defaultData.products.push(product);
            await this.saveDefaultData(defaultData);
            return true;
        } catch (error) {
            console.error('🔥 Error adding product:', error);
            return false;
        }
    }

    async updateProduct(productId, updates) {
        try {
            const defaultData = await this.getDefaultData();
            const idx = defaultData.products.findIndex(p => p.id === productId);
            if (idx !== -1) {
                defaultData.products[idx] = { ...defaultData.products[idx], ...updates };
                await this.saveDefaultData(defaultData);
                return true;
            }
            return false;
        } catch (error) {
            console.error('🔥 Error updating product:', error);
            return false;
        }
    }

    async deleteProduct(productId) {
        try {
            const defaultData = await this.getDefaultData();
            defaultData.products = defaultData.products.filter(p => p.id !== productId);
            await this.saveDefaultData(defaultData);
            return true;
        } catch (error) {
            console.error('🔥 Error deleting product:', error);
            return false;
        }
    }

    // Category operations
    async addCategory(category) {
        try {
            const defaultData = await this.getDefaultData();
            defaultData.categories.push(category);
            await this.saveDefaultData(defaultData);
            return true;
        } catch (error) {
            console.error('🔥 Error adding category:', error);
            return false;
        }
    }

    async updateCategory(categoryId, updates) {
        try {
            const defaultData = await this.getDefaultData();
            const idx = defaultData.categories.findIndex(c => c.id === categoryId);
            if (idx !== -1) {
                defaultData.categories[idx] = { ...defaultData.categories[idx], ...updates };
                await this.saveDefaultData(defaultData);
                return true;
            }
            return false;
        } catch (error) {
            console.error('🔥 Error updating category:', error);
            return false;
        }
    }

    async deleteCategory(categoryId) {
        try {
            const defaultData = await this.getDefaultData();
            defaultData.categories = defaultData.categories.filter(c => c.id !== categoryId);
            await this.saveDefaultData(defaultData);
            return true;
        } catch (error) {
            console.error('🔥 Error deleting category:', error);
            return false;
        }
    }

    // Export language for translation
    async exportLanguage(languageCode) {
        try {
            const languageData = await this.getLanguageData(languageCode);
            if (!languageData) {
                throw new Error(`Language ${languageCode} not found`);
            }

            return {
                language: languageCode,
                languageData: languageData.tagLingua,
                translations: {
                    ui: languageData.testi || {},
                    allergens: languageData.allergeni || {},
                    characteristics: languageData.characteristics || {},
                    products: languageData.products || {},
                    categories: languageData.categories || {}
                },
                exportDate: new Date().toISOString(),
                version: '3.0'
            };
        } catch (error) {
            console.error(`🔥 Error exporting language ${languageCode}:`, error);
            throw error;
        }
    }

    // Import language translations
    async importLanguage(importData) {
        try {
            if (!importData.language || !importData.translations) {
                throw new Error('Invalid import data structure');
            }

            const languageCode = importData.language;
            let existing = await this.getLanguageData(languageCode);
            if (!existing) existing = { ...(window.DEFAULT_LANGUAGE_STRUCTURE || {}) };

            const uiTrans = importData.translations.ui || {};
            const allergenTrans = importData.translations.allergens || {};
            const prodTrans = importData.translations.products || {};
            const catTrans = importData.translations.categories || {};
            const charTrans = importData.translations.characteristics || importData.translations.Characteristics || {};

            const existingChar = existing.characteristics || existing.caratteristiche || {};
            const { caratteristiche, ...base } = existing;

            const merged = {
                ...base,
                tagLingua: {
                    ...base.tagLingua,
                    ...importData.languageData
                },
                testi: {
                    ...base.testi,
                    ...uiTrans
                },
                allergeni: {
                    ...base.allergeni,
                    ...allergenTrans
                },
                characteristics: {
                    ...existingChar,
                    ...charTrans
                },
                products: {
                    ...base.products,
                    ...prodTrans
                },
                categories: {
                    ...base.categories,
                    ...catTrans
                }
            };

            await this.saveLanguageData(languageCode, merged);
            this.clearCache('available-languages');
            return true;
        } catch (error) {
            console.error('🔥 Error importing language:', error);
            throw error;
        }
    }

    // Game leaderboard operations
    async getGameLeaderboard() {
        const cacheKey = 'game-leaderboard';
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        if (!this.isInitialized) return [];

        try {
            const doc = await this.db.collection('game').doc('leaderboard').get();
            if (doc.exists) {
                const data = doc.data();
                const leaderboard = data.scores || [];
                this.setCache(cacheKey, leaderboard);
                return leaderboard;
            }
            return [];
        } catch (error) {
            console.error('🔥 Error loading game leaderboard:', error);
            return [];
        }
    }

    async saveGameLeaderboard(leaderboard) {
        if (!this.isInitialized) return false;

        try {
            await this.db.collection('game').doc('leaderboard').set({
                scores: leaderboard,
                lastUpdated: new Date().toISOString()
            });
            this.clearCache('game-leaderboard');
            return true;
        } catch (error) {
            console.error('🔥 Error saving game leaderboard:', error);
            return false;
        }
    }

    /**
     * Alias per compatibilità con il vecchio codice del gioco.
     * Chiama saveGameLeaderboard passando la classifica.
     * @param {Array<Object>} leaderboard
     */
    async saveLeaderboard(leaderboard) {
        return await this.saveGameLeaderboard(leaderboard);
    }
}

// Initialize Firebase service
const firebaseService = new FirebaseService();

// Make it globally available
if (typeof window !== 'undefined') {
    window.firebaseService = firebaseService;
}