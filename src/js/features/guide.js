// Pisa Tourist Guide App - Restructured with Tabs
// Sistema di navigazione a tab e gestione ristoranti

class PisaTouristGuide {
    constructor() {
        this.currentLanguage = 'it';
        this.currentTab = 'home';
        this.currentRestaurant = 0;
        this.data = null;
        this.isLoading = false;
        
        this.init();
    }
    
    async init() {
        // Mostra loading
        this.showLoading();
        
        // Inizializza event listeners
        this.setupEventListeners();
        
        // Carica la lingua di default
        await this.loadLanguage(this.currentLanguage);
        
        // Nasconde loading
        this.hideLoading();
        
        // Mostra tab iniziale
        this.showTab('home');
    }
    
    setupEventListeners() {
        // Language selector
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });
        }
        
        // Tab navigation
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.getAttribute('data-tab');
                this.showTab(tabName);
            });
        });
        
        // Mobile menu toggle
        const hamburger = document.getElementById('hamburger');
        const navTabsContainer = document.getElementById('nav-tabs');
        
        if (hamburger && navTabsContainer) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navTabsContainer.classList.toggle('active');
            });
            
            // Close mobile menu when clicking on a tab
            navTabsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('nav-tab')) {
                    hamburger.classList.remove('active');
                    navTabsContainer.classList.remove('active');
                }
            });
        }
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger?.contains(e.target) && !navTabsContainer?.contains(e.target)) {
                hamburger?.classList.remove('active');
                navTabsContainer?.classList.remove('active');
            }
        });
        
        // Scroll header effect
        window.addEventListener('scroll', this.handleScroll.bind(this));
    }
    
    async loadLanguage(language) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            const langData = await (window.firebaseService || new FirebaseService()).getLanguageData(language);
            if (!langData || !(langData.guide || langData.guida)) {
                throw new Error(`Guide data not found in Firestore for language: ${language}`);
            }

            this.data = langData.guide || langData.guida;

            this.currentLanguage = language;
            
            // Update all content
            this.updateContent();
            
        } catch (error) {
            console.error('Error loading language:', error);
            // Fallback to Italian if error
            if (language !== 'it') {
                await this.loadLanguage('it');
            }
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    async changeLanguage(language) {
        if (language === this.currentLanguage || this.isLoading) return;
        
        await this.loadLanguage(language);
        
        // Update language selector
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = language;
        }
    }
    
    showTab(tabName) {
        // Update current tab
        this.currentTab = tabName;
        
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        // Show selected tab content
        const selectedTab = document.getElementById(`${tabName}-tab`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Update navigation active state
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeNavTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeNavTab) {
            activeNavTab.classList.add('active');
        }
        
        // Initialize restaurant tabs if restaurants tab is selected
    }
    
    updateContent() {
        if (!this.data) return;
        
        // Update meta and title
        this.updateMeta();
        
        // Update navigation
        this.updateNavigation();
        
        // Update all sections
        this.updateHome();
        this.updatePlaces();
        this.updateEvents();
        this.updateTips();
        
        // Update footer
        this.updateFooter();
    }
    
    updateMeta() {
        const { meta } = this.data;
        if (!meta) return;
        
        // Update page title
        document.title = meta.title;
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = meta.title;
        
        // Update nav title
        const navTitle = document.getElementById('nav-title');
        if (navTitle) navTitle.textContent = meta.nav_title || 'Pisa Guide';
    }
    
    updateNavigation() {
        const { menu } = this.data;
        if (!menu) return;
        
        const elements = {
            'nav-home': menu.home,
            'nav-places': menu.places,
            'nav-events': menu.info_events,
            'nav-tips': menu.tips
        };
        
        Object.entries(elements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = text;
        });
    }
    
    updateHome() {
        const { hero, sponsor } = this.data;
        if (!hero || !sponsor) return;
        
        // Update hero content
        const elements = {
            'sponsored-by': this.data.meta?.sponsored_by,
            'hero-headline': hero.headline,
            'hero-subtitle': hero.subtitle,
            'sponsor-name': sponsor.name,
            'sponsor-description': sponsor.description,
            'sponsor-address': sponsor.address,
            'sponsor-email': sponsor.email,
            'sponsor-hours': sponsor.hours,
            'contact-address-label': sponsor.labels?.address,
            'contact-email-label': sponsor.labels?.email,
            'contact-hours-label': sponsor.labels?.hours,
            'menu-button-text': sponsor.menu_button || 'Vieni a trovarci'
        };
        
        Object.entries(elements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element && text) element.textContent = text;
        });
        
        // Update sponsor features
        const featuresContainer = document.getElementById('sponsor-features');
        if (featuresContainer && sponsor.features) {
            featuresContainer.innerHTML = '';
            sponsor.features.forEach(feature => {
                const featureElement = document.createElement('div');
                featureElement.className = 'feature-item';
                featureElement.textContent = feature;
                featuresContainer.appendChild(featureElement);
            });
        }
    }
    
    updatePlaces() {
        const { places } = this.data;
        if (!places) return;
        
        // Update section titles
        const title = document.getElementById('places-title');
        const subtitle = document.getElementById('places-subtitle');
        
        if (title) title.textContent = places.title;
        if (subtitle) subtitle.textContent = places.subtitle;
        
        // Update places grid
        const grid = document.getElementById('places-grid');
        if (!grid || !places.items) return;
        
        grid.innerHTML = '';
        
        places.items.forEach((place, index) => {
            const card = this.createPlaceCard(place, index);
            grid.appendChild(card);
        });
    }
    
    createPlaceCard(place, index) {
        const card = document.createElement('div');
        card.className = 'card';
        
        const imageUrl = place.image || `https://images.pexels.com/photos/${1000000 + index}/pexels-photo-${1000000 + index}.jpeg?auto=compress&cs=tinysrgb&w=400`;
        
        card.innerHTML = `
            <div class="card-image" style="background-image: url('${imageUrl}')"></div>
            <div class="card-content">
                <h3 class="card-title">${place.name}</h3>
                <p class="card-description">${place.description}</p>
                <div class="card-meta">
                    <span class="card-category">${place.category || ''}</span>
                    ${place.map_link ? `<a href="${place.map_link}" class="card-link" target="_blank">📍 ${this.data.common?.view_map || 'Mappa'}</a>` : ''}
                </div>
            </div>
        `;
        
        return card;
    }
    
    updateEvents() {
        const { events } = this.data;
        if (!events) return;
        
        // Update section titles
        const title = document.getElementById('events-title');
        const subtitle = document.getElementById('events-subtitle');
        
        if (title) title.textContent = events.title;
        if (subtitle) subtitle.textContent = events.subtitle;
        
        // Update events grid
        const grid = document.getElementById('events-grid');
        if (!grid || !events.items) return;
        
        grid.innerHTML = '';
        
        events.items.forEach((event, index) => {
            const card = this.createEventCard(event, index);
            grid.appendChild(card);
        });
    }
    
    createEventCard(event, index) {
        const card = document.createElement('div');
        card.className = 'card';
        
        const imageUrl = event.image || `https://images.pexels.com/photos/${2000000 + index}/pexels-photo-${2000000 + index}.jpeg?auto=compress&cs=tinysrgb&w=400`;
        
        card.innerHTML = `
            <div class="card-image" style="background-image: url('${imageUrl}')"></div>
            <div class="card-content">
                <h3 class="card-title">${event.name}</h3>
                <p class="card-description">${event.description}</p>
                <div class="card-meta">
                    <span class="card-date">${event.date || ''}</span>
                    ${event.link ? `<a href="${event.link}" class="card-link" target="_blank">🔗 ${this.data.common?.more_info || 'Info'}</a>` : ''}
                </div>
            </div>
        `;
        
        return card;
    }
    
    updateTips() {
        const { tips } = this.data;
        if (!tips) return;
        
        // Update section titles
        const title = document.getElementById('tips-title');
        const subtitle = document.getElementById('tips-subtitle');
        
        if (title) title.textContent = tips.title;
        if (subtitle) subtitle.textContent = tips.subtitle;
        
        // Update tips grid
        const grid = document.getElementById('tips-grid');
        if (!grid || !tips.categories) return;
        
        grid.innerHTML = '';
        
        tips.categories.forEach((category, index) => {
            const card = this.createTipCard(category, index);
            grid.appendChild(card);
        });
    }
    
    createTipCard(category, index) {
        const card = document.createElement('div');
        card.className = 'tip-card';
        
        const tipsList = category.tips.map(tip => `<li>${tip}</li>`).join('');
        
        card.innerHTML = `
            <span class="tip-icon">${category.icon}</span>
            <h3 class="tip-title">${category.name}</h3>
            <p>${category.description}</p>
            <ul class="tip-list">
                ${tipsList}
            </ul>
        `;
        
        return card;
    }
    
    updateFooter() {
        const { footer } = this.data;
        if (!footer) return;
        
        const sponsorText = document.getElementById('footer-sponsor-text');
        const followText = document.getElementById('footer-follow');
        const copyright = document.getElementById('footer-copyright');
        
        if (sponsorText) sponsorText.textContent = footer.sponsor_description;
        if (followText) followText.textContent = footer.follow_us;
        if (copyright) copyright.textContent = footer.copyright;
    }
    
    handleScroll() {
        const header = document.querySelector('.header');
        if (!header) return;
        
        const scrolled = window.scrollY > 50;
        
        if (scrolled) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    }
    
    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('hidden');
        }
    }
    
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            setTimeout(() => {
                loading.classList.add('hidden');
            }, 300);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize main app
    window.pisaGuide = new PisaTouristGuide();
});

// Handle offline functionality
window.addEventListener('online', () => {
    console.log('Connection restored');
});

window.addEventListener('offline', () => {
    console.log('App working offline');
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PisaTouristGuide };
}