// Menu Application
class MenuApp {
  constructor() {
    this.products = [];
    this.categories = [];
    this.filteredProducts = [];
    this.selectedAllergens = new Set();
    this.selectedTags = new Set();
    this.searchTerm = '';
    this.translationService = null;
    this.firebaseService = null;
    this.isLoading = true;
    
    this.init();
  }

  async init() {
    console.log('📱 Initializing Menu App...');
    
    // Wait for services
    await this.waitForServices();
    
    // Load data
    await this.loadData();
    
    // Setup UI
    this.setupEventListeners();
    this.renderMenu();
    this.updateLanguageSelector();
    this.hideLoading();
    
    console.log('📱 Menu App initialized');
  }

  async waitForServices() {
    // Wait for translation service
    let attempts = 0;
    while (!window.translationService?.isLoaded && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (window.translationService?.isLoaded) {
      this.translationService = window.translationService;
    }

    // Wait for firebase service
    attempts = 0;
    while (!window.firebaseService?.isInitialized && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (window.firebaseService?.isInitialized) {
      this.firebaseService = window.firebaseService;
    }
  }

  async loadData() {
    try {
      if (this.translationService) {
        this.products = this.translationService.getMergedProducts();
        this.categories = this.translationService.getMergedCategories();
      } else {
        // Fallback data
        this.products = SAMPLE_PRODUCTS.map(product => ({
          ...product,
          name: product.id,
          description: ''
        }));
        this.categories = DEFAULT_CATEGORIES.map(category => ({
          ...category,
          name: category.id
        }));
      }

      // Sort categories by order
      this.categories.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Initial filter
      this.applyFilters();
      
      console.log('📱 Data loaded:', { products: this.products.length, categories: this.categories.length });
    } catch (error) {
      console.error('📱 Error loading data:', error);
      this.showToast('Errore nel caricamento dei dati', 'error');
    }
  }

  setupEventListeners() {
    // Search
    const searchInput = document.getElementById('search-input');
    const clearSearch = document.getElementById('clear-search');
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
        clearSearch.classList.toggle('visible', e.target.value.length > 0);
      });
    }

    if (clearSearch) {
      clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        this.handleSearch('');
        clearSearch.classList.remove('visible');
      });
    }

    // Language selector
    const languageBtn = document.getElementById('language-btn');
    const languageModal = document.getElementById('language-modal');
    const languageCloseBtns = languageModal?.querySelectorAll('.close-btn');

    if (languageBtn) {
      languageBtn.addEventListener('click', () => {
        this.showLanguageModal();
      });
    }

    if (languageCloseBtns) {
      languageCloseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.hideLanguageModal();
        });
      });
    }

    // Filter modal
    const filterBtn = document.getElementById('filter-btn');
    const filterModal = document.getElementById('filter-modal');
    const filterCloseBtns = filterModal?.querySelectorAll('.close-btn');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const applyFiltersBtn = document.getElementById('apply-filters');

    if (filterBtn) {
      filterBtn.addEventListener('click', () => {
        this.showFilterModal();
      });
    }

    if (filterCloseBtns) {
      filterCloseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.hideFilterModal();
        });
      });
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }

    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => {
        this.hideFilterModal();
      });
    }

    // Modal backdrop clicks
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
      }
    });

    // Language change listener
    document.addEventListener('languageChanged', () => {
      this.onLanguageChanged();
    });

    // Legend items (for filtering)
    this.setupLegendFilters();
  }

  setupLegendFilters() {
    // Setup allergen legend
    const allergenLegend = document.getElementById('legend-allergens');
    if (allergenLegend) {
      allergenLegend.innerHTML = '';
      Object.entries(DEFAULT_ALLERGENS).forEach(([key, allergen]) => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.dataset.type = 'allergen';
        item.dataset.value = key;
        item.innerHTML = `
          <span class="icon">${allergen.icon}</span>
          <span>${this.translationService ? this.translationService.getAllergen(key) : allergen.name}</span>
        `;
        item.addEventListener('click', () => {
          this.toggleLegendFilter('allergen', key, item);
        });
        allergenLegend.appendChild(item);
      });
    }

    // Setup characteristic legend
       const characteristicLegend = document.getElementById('legend-characteristics');
    if (characteristicLegend) {
      characteristicLegend.innerHTML = '';
      Object.entries(DEFAULT_CHARACTERISTICS).forEach(([key, characteristic]) => {
        const label = this.translationService
                    ? this.translationService.getCharacteristic(key)
                    : characteristic.name;
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.dataset.type  = 'characteristic';
        item.dataset.value = key;
        item.innerHTML = `
          <span class="icon">${characteristic.icon}</span>
          <span>${label}</span>
        `;
        item.addEventListener('click', () => {
          this.toggleLegendFilter('characteristic', key, item);
        });
        characteristicLegend.appendChild(item);
      });
    }
  
  }

  toggleLegendFilter(type, value, element) {
    if (type === 'allergen') {
      if (this.selectedAllergens.has(value)) {
        this.selectedAllergens.delete(value);
        element.classList.remove('filtered');
      } else {
        this.selectedAllergens.add(value);
        element.classList.add('filtered');
      }
    } else if (type === 'characteristic') {
      if (this.selectedTags.has(value)) {
        this.selectedTags.delete(value);
        element.classList.remove('filtered');
      } else {
        this.selectedTags.add(value);
        element.classList.add('filtered');
      }
    }

    this.applyFilters();
  }

  handleSearch(term) {
    this.searchTerm = term.toLowerCase().trim();
    this.applyFilters();
  }

  applyFilters() {
    this.filteredProducts = this.products.filter(product => {
      // Visibility filter
      if (!product.visible) return false;

      // Search filter
      if (this.searchTerm) {
        const searchableText = `${product.name} ${product.description || ''}`.toLowerCase();
        if (!searchableText.includes(this.searchTerm)) return false;
      }

      // Allergen filter (exclude products with selected allergens)
      if (this.selectedAllergens.size > 0) {
        const hasFilteredAllergen = product.allergens?.some(allergen => 
          this.selectedAllergens.has(allergen)
        );
        if (hasFilteredAllergen) return false;
      }

      // Tag filter (exclude products with selected characteristics)
      if (this.selectedTags.size > 0) {
        const hasFilteredTag = product.tags?.some(tag => 
          this.selectedTags.has(tag)
        );
        if (hasFilteredTag) return false;
      }

      return true;
    });

    this.renderMenu();
  }

  renderMenu() {
    const menuContainer = document.getElementById('menu-container');
    const noResults = document.getElementById('no-results');

    if (!menuContainer) return;

    // Group products by category
    const productsByCategory = {};
    this.filteredProducts.forEach(product => {
      if (!productsByCategory[product.category]) {
        productsByCategory[product.category] = [];
      }
      productsByCategory[product.category].push(product);
    });

    // Check if we have results
    const hasResults = this.filteredProducts.length > 0;
    
    if (noResults) {
      noResults.classList.toggle('hidden', hasResults);
    }

    if (!hasResults) {
      menuContainer.innerHTML = '';
      return;
    }

    // Render categories
    menuContainer.innerHTML = '';
    
    this.categories
      .filter(category => category.visible && productsByCategory[category.id])
      .forEach(category => {
        const categoryProducts = productsByCategory[category.id];
        if (categoryProducts.length === 0) return;

        const categorySection = this.createCategorySection(category, categoryProducts);
        menuContainer.appendChild(categorySection);
      });
  }

  createCategorySection(category, products) {
    const section = document.createElement('div');
    section.className = 'category-section';
    section.dataset.category = category.id;

    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `
      <div class="category-title">
        <i class="${category.icon || 'fas fa-utensils'}"></i>
        <h3>${category.name}</h3>
      </div>
      <i class="category-toggle fas fa-chevron-down"></i>
    `;

    const content = document.createElement('div');
    content.className = 'category-content';

    const productsGrid = document.createElement('div');
    productsGrid.className = 'products-grid';

    products.forEach(product => {
      const productCard = this.createProductCard(product);
      productsGrid.appendChild(productCard);
    });

    content.appendChild(productsGrid);

    // Toggle functionality
    header.addEventListener('click', () => {
      section.classList.toggle('expanded');
    });

    // Auto-expand first category or if search/filter is active
    if (this.searchTerm || this.selectedAllergens.size > 0 || this.selectedTags.size > 0) {
      section.classList.add('expanded');
    } else {
      // Expand first category by default
      const isFirst = document.getElementById('menu-container').children.length === 0;
      if (isFirst) {
        section.classList.add('expanded');
      }
    }

    section.appendChild(header);
    section.appendChild(content);

    return section;
  }

  createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;

    const allergenTags = (product.allergens || []).map(allergen => {
      const allergenInfo = DEFAULT_ALLERGENS[allergen];
      const allergenName = this.translationService ? 
        this.translationService.getAllergen(allergen) : 
        (allergenInfo?.name || allergen);
      
      return `
        <span class="product-tag allergen">
          <span class="icon">${allergenInfo?.icon || '⚠️'}</span>
          ${allergenName}
        </span>
      `;
    }).join('');

  const characteristicTags = (product.tags || []).map(tag => {
    const icon  = DEFAULT_CHARACTERISTICS[tag]?.icon || '🏷️';
    const label = this.translationService
                ? this.translationService.getCharacteristic(tag)
                : (DEFAULT_CHARACTERISTICS[tag]?.name || tag);
    return `
      <span class="product-tag">
        <span class="icon">${icon}</span>
        <span class="label">${label}</span>
      </span>
    `;
  }).join('');

    card.innerHTML = `
      <div class="product-header">
        <h4 class="product-name">${product.name}</h4>
        <span class="product-price">€${product.price.toFixed(2)}</span>
      </div>
      ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
      <div class="product-tags">
        ${allergenTags}
        ${characteristicTags}
      </div>
    `;

    return card;
  }

  showLanguageModal() {
    const modal = document.getElementById('language-modal');
    if (modal) {
      this.updateLanguageSelector();
      modal.classList.add('show');
    }
  }

  hideLanguageModal() {
    const modal = document.getElementById('language-modal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  updateLanguageSelector() {
    const languageGrid = document.getElementById('language-grid');
    if (!languageGrid || !this.translationService) return;

    const availableLanguages = this.translationService.getAvailableLanguagesForUI();
    const currentLanguage = this.translationService.getCurrentLanguage();

    languageGrid.innerHTML = availableLanguages.map(lang => `
      <button class="lang-btn ${lang.code === currentLanguage ? 'active' : ''}" data-lang="${lang.code}">
        ${lang.flag} ${lang.name}
      </button>
    `).join('');

    // Add event listeners
    languageGrid.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const lang = e.target.dataset.lang;
        const success = await this.translationService.changeLanguage(lang);
        if (success) {
          this.hideLanguageModal();
          this.showToast(`Lingua cambiata in ${e.target.textContent}`, 'success');
        } else {
          this.showToast('Errore nel cambio lingua', 'error');
        }
      });
    });
  }

  showFilterModal() {
    const modal = document.getElementById('filter-modal');
    if (modal) {
      this.updateFilterModal();
      modal.classList.add('show');
    }
  }

  hideFilterModal() {
    const modal = document.getElementById('filter-modal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  updateFilterModal() {
    // Update allergen filters
    const allergenFilters = document.getElementById('allergen-filters');
    if (allergenFilters) {
      allergenFilters.innerHTML = '';
      Object.entries(DEFAULT_ALLERGENS).forEach(([key, allergen]) => {
        const item = document.createElement('div');
        item.className = `filter-item ${this.selectedAllergens.has(key) ? 'active' : ''}`;
        item.innerHTML = `
          <input type="checkbox" id="allergen-${key}" ${this.selectedAllergens.has(key) ? 'checked' : ''}>
          <span class="icon">${allergen.icon}</span>
          <span>${this.translationService ? this.translationService.getAllergen(key) : allergen.name}</span>
        `;
        
        item.addEventListener('click', () => {
          const checkbox = item.querySelector('input');
          checkbox.checked = !checkbox.checked;
          this.toggleAllergenSelection(key, checkbox.checked);
          item.classList.toggle('active', checkbox.checked);
        });
        
        allergenFilters.appendChild(item);
      });
    }

    // Update characteristic filters
    const characteristicFilters = document.getElementById('characteristic-filters');
    if (characteristicFilters) {
      characteristicFilters.innerHTML = '';
      Object.entries(DEFAULT_CHARACTERISTICS).forEach(([key, characteristic]) => {
        const item = document.createElement('div');
        item.className = `filter-item ${this.selectedTags.has(key) ? 'active' : ''}`;
        const label = this.translationService
                    ? this.translationService.getCharacteristic(key)
                    : characteristic.name;
        item.innerHTML = `
          <input type="checkbox" id="characteristic-${key}" ${this.selectedTags.has(key) ? 'checked' : ''}>
          <span class="icon">${characteristic.icon}</span>
          <span>${label}</span>
        `;        
        item.addEventListener('click', () => {
          const checkbox = item.querySelector('input');
          checkbox.checked = !checkbox.checked;
          this.toggleTagSelection(key, checkbox.checked);
          item.classList.toggle('active', checkbox.checked);
        });
        
        characteristicFilters.appendChild(item);
      });
    }
  }

  toggleAllergenSelection(allergen, checked) {
    if (checked) {
      this.selectedAllergens.add(allergen);
    } else {
      this.selectedAllergens.delete(allergen);
    }
    this.applyFilters();
  }

  toggleTagSelection(tag, checked) {
    if (checked) {
      this.selectedTags.add(tag);
    } else {
      this.selectedTags.delete(tag);
    }
    this.applyFilters();
  }

  clearAllFilters() {
    this.selectedAllergens.clear();
    this.selectedTags.clear();
    this.searchTerm = '';
    
    // Clear search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = '';
      document.getElementById('clear-search')?.classList.remove('visible');
    }

    // Clear legend filters
    document.querySelectorAll('.legend-item.filtered').forEach(item => {
      item.classList.remove('filtered');
    });

    this.applyFilters();
    this.updateFilterModal();
    this.showToast('Filtri rimossi', 'info');
  }

  onLanguageChanged() {
    // Reload data with new language
    this.loadData();
    
    // Update legend filters
    this.setupLegendFilters();
    
    // Update language selector
    this.updateLanguageSelector();
  }

  hideLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 300);
    }
  }

  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };

    toast.innerHTML = `
      <i class="toast-icon ${icons[type] || icons.info}"></i>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Chiudi">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Add close functionality
    toast.querySelector('.toast-close').addEventListener('click', () => {
      this.removeToast(toast);
    });

    toastContainer.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto remove after 5 seconds
    setTimeout(() => this.removeToast(toast), 5000);
  }

  removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MenuApp();
});