/*
 * Admin Panel (Menu)
 * - CRUD prodotti/categorie (struttura dati)
 * - Gestione traduzioni (data/<lang>)
 * - Auto-traduzione via OpenAI (server-side: api/translate.php)
 */

class AdminPanel {
  constructor() {
    this.isLoggedIn = false;
    this.currentView = 'dashboard';
    this.currentLanguage = 'it';

    this.defaultData = null;        // prodotti/categorie
    this.availableLanguages = [];  // lista lingue
    this.itData = null;            // sorgente italiana (data/it)
    this.languageData = null;      // lingua selezionata per traduzione

    this.translationService = null;
    this.firebaseService = null;

    this.importData = null;

    this.init();
  }

  async init() {
    await this.waitForServices();
    this.setupEventListeners();
    this.checkLoginStatus();
  }

  async waitForServices() {
    // Translation service
    let attempts = 0;
    while (!window.translationService?.isLoaded && attempts < 120) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
    if (window.translationService?.isLoaded) {
      this.translationService = window.translationService;
    }

    // Firebase service
    attempts = 0;
    while (!window.firebaseService?.isInitialized && attempts < 120) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
    if (window.firebaseService?.isInitialized) {
      this.firebaseService = window.firebaseService;
    }
  }

  setupEventListeners() {
    // Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const realBtn = e.target.closest('.nav-btn');
        if (!realBtn) return;
        this.showView(realBtn.dataset.view);
      });
    });

    // Products
    document.getElementById('add-product-btn')?.addEventListener('click', () => this.showAddProductModal());
    document.getElementById('product-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleProductSubmit();
    });

    // Categories
    document.getElementById('add-category-btn')?.addEventListener('click', () => this.showAddCategoryModal());
    document.getElementById('category-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCategorySubmit();
    });

    // Translations
    document.getElementById('translation-language')?.addEventListener('change', (e) => {
      this.currentLanguage = e.target.value;
      this.loadLanguageForTranslation();
    });

    document.getElementById('save-translations-btn')?.addEventListener('click', () => this.saveTranslations());

    // AI translate
    document.getElementById('ai-translate-btn')?.addEventListener('click', () => this.autoTranslateMissing());

    // Importa il seed della guida italiana nel database
    document.getElementById('ai-import-guide-btn')?.addEventListener('click', () => this.importGuideSeed());

    // Export/Import
    document.getElementById('export-btn')?.addEventListener('click', () => this.exportLanguage());

    document.getElementById('import-file')?.addEventListener('change', (e) => {
      this.handleImportFile(e.target.files?.[0] || null);
    });

    document.getElementById('import-btn')?.addEventListener('click', () => this.confirmImport());
    document.getElementById('cancel-import-btn')?.addEventListener('click', () => this.cancelImport());

    // Modal close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) modal.classList.remove('show');
      });
    });

    // Modal backdrop
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
      }
    });
  }

  checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('admin-logged-in') === 'true';
    if (isLoggedIn) {
      this.isLoggedIn = true;
      this.showDashboard();
      this.loadData();
    } else {
      this.showLogin();
    }
  }

  async handleLogin() {
    const passwordInput = document.getElementById('admin-password');
    const password = (passwordInput?.value || '').trim();

    if (password === ADMIN_PASSWORD) {
      this.isLoggedIn = true;
      sessionStorage.setItem('admin-logged-in', 'true');
      this.showDashboard();
      await this.loadData();
      this.showToast('Login effettuato', 'success');
    } else {
      this.showToast('Password non corretta', 'error');
      if (passwordInput) {
        passwordInput.value = '';
        passwordInput.focus();
      }
    }
  }

  logout() {
    this.isLoggedIn = false;
    sessionStorage.removeItem('admin-logged-in');
    this.showLogin();
    this.showToast('Logout effettuato', 'info');
  }

  showLogin() {
    document.getElementById('login-screen')?.classList.remove('hidden');
    document.getElementById('admin-dashboard')?.classList.add('hidden');
  }

  showDashboard() {
    document.getElementById('login-screen')?.classList.add('hidden');
    document.getElementById('admin-dashboard')?.classList.remove('hidden');
  }

  async loadData() {
    try {
      if (!this.firebaseService) {
        // Fallback (dev)
        this.defaultData = { products: SAMPLE_PRODUCTS, categories: DEFAULT_CATEGORIES };
        this.availableLanguages = [{ code: 'it', name: 'Italiano', flag: '🇮🇹', active: true, isDefault: true }];
        this.itData = ITALIAN_DEFAULT_DATA;
        this.languageData = ITALIAN_DEFAULT_DATA;
      } else {
        this.defaultData = await this.firebaseService.getDefaultData();
        this.availableLanguages = await this.firebaseService.getAvailableLanguages();
        this.itData = await this.firebaseService.getLanguageData('it');
        this.languageData = await this.firebaseService.getLanguageData(this.currentLanguage);
      }

      this.updateStats();
      this.renderProductsTable();
      this.renderCategoriesTable();
      this.updateLanguageSelectors();

      // If currently viewing translations, render them
      if (this.currentView === 'translations') {
        await this.loadLanguageForTranslation();
      }
    } catch (err) {
      this.setAIProgress(false);

      console.error('🔧 Admin loadData error:', err);
      this.showToast('Errore nel caricamento dei dati', 'error');
    }
  }

  showView(viewName) {
    // Update nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Update views
    document.querySelectorAll('.admin-view').forEach(view => {
      view.classList.toggle('active', view.id === `${viewName}-view`);
    });

    this.currentView = viewName;

    if (viewName === 'translations') {
      this.loadLanguageForTranslation();
    }
  }

  updateStats() {
    const totalProducts = this.defaultData?.products?.length || 0;
    const visibleProducts = this.defaultData?.products?.filter(p => p.visible).length || 0;
    const totalCategories = this.defaultData?.categories?.length || 0;
    const totalLanguages = this.availableLanguages?.length || 0;

    document.getElementById('total-products').textContent = totalProducts;
    document.getElementById('visible-products').textContent = visibleProducts;
    document.getElementById('total-categories').textContent = totalCategories;
    document.getElementById('total-languages').textContent = totalLanguages;
  }

  // ---------- Tables ----------
  renderProductsTable() {
    const tbody = document.querySelector('#products-table tbody');
    if (!tbody || !this.defaultData?.products) return;

    tbody.innerHTML = '';

    for (const product of this.defaultData.products) {
      const row = document.createElement('tr');

      const productName = this.itData?.products?.[product.id]?.name || product.id;
      const categoryName = this.itData?.categories?.[product.category] || product.category;
      const allergensList = product.allergens?.map(a => DEFAULT_ALLERGENS[a]?.icon || a).join(' ') || '-';

      row.innerHTML = `
        <td>${this.escapeHtml(productName)}</td>
        <td>${this.escapeHtml(categoryName)}</td>
        <td>€${Number(product.price || 0).toFixed(2)}</td>
        <td>${allergensList}</td>
        <td>
          <span class="status-indicator ${product.visible ? 'visible' : 'hidden'}">
            <span class="status-dot"></span>
            ${product.visible ? 'Visibile' : 'Nascosto'}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <button class="action-btn" onclick="adminPanel.editProduct('${product.id}')" title="Modifica">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn ${product.visible ? 'danger' : 'success'}" 
                    onclick="adminPanel.toggleProductVisibility('${product.id}', ${!product.visible})" 
                    title="${product.visible ? 'Nascondi' : 'Mostra'}">
              <i class="fas fa-eye${product.visible ? '-slash' : ''}"></i>
            </button>
            <button class="action-btn danger" onclick="adminPanel.deleteProduct('${product.id}')" title="Elimina">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;

      tbody.appendChild(row);
    }
  }

  renderCategoriesTable() {
    const tbody = document.querySelector('#categories-table tbody');
    if (!tbody || !this.defaultData?.categories) return;

    tbody.innerHTML = '';

    [...this.defaultData.categories]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach(category => {
        const row = document.createElement('tr');
        const categoryName = this.itData?.categories?.[category.id] || category.id;

        row.innerHTML = `
          <td>${this.escapeHtml(categoryName)}</td>
          <td><i class="${category.icon || 'fas fa-utensils'}"></i></td>
          <td>${category.order || 0}</td>
          <td>
            <span class="status-indicator ${category.visible ? 'visible' : 'hidden'}">
              <span class="status-dot"></span>
              ${category.visible ? 'Visibile' : 'Nascosta'}
            </span>
          </td>
          <td>
            <div class="table-actions">
              <button class="action-btn" onclick="adminPanel.editCategory('${category.id}')" title="Modifica">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-btn ${category.visible ? 'danger' : 'success'}" 
                      onclick="adminPanel.toggleCategoryVisibility('${category.id}', ${!category.visible})" 
                      title="${category.visible ? 'Nascondi' : 'Mostra'}">
                <i class="fas fa-eye${category.visible ? '-slash' : ''}"></i>
              </button>
              <button class="action-btn danger" onclick="adminPanel.deleteCategory('${category.id}')" title="Elimina">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        `;

        tbody.appendChild(row);
      });
  }

  updateLanguageSelectors() {
    const selectors = ['translation-language', 'export-language'];
    selectors.forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      sel.innerHTML = '';
      (this.availableLanguages || []).forEach(lang => {
        const opt = document.createElement('option');
        opt.value = lang.code;
        opt.textContent = `${lang.flag || ''} ${lang.name || lang.code}`.trim();
        if (lang.code === this.currentLanguage) opt.selected = true;
        sel.appendChild(opt);
      });
    });
  }

  // ---------- Products CRUD ----------
  showAddProductModal() {
    this.populateProductModal();
    document.getElementById('product-form')?.reset();
    const idEl = document.getElementById('product-id');
    if (idEl) idEl.disabled = false;

    document.getElementById('product-modal-title').textContent = 'Aggiungi Prodotto';
    this.showModal('product-modal');
  }

  editProduct(productId) {
    const product = this.defaultData?.products?.find(p => p.id === productId);
    if (!product) return;

    this.populateProductModal();

    document.getElementById('product-modal-title').textContent = 'Modifica Prodotto';
    this.showModal('product-modal');

    const idEl = document.getElementById('product-id');
    if (idEl) {
      idEl.value = product.id;
      idEl.disabled = true;
    }

    document.getElementById('product-category').value = product.category;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-visible').value = String(!!product.visible);

    // Italian fields
    document.getElementById('product-name-it').value = this.itData?.products?.[product.id]?.name || '';
    document.getElementById('product-description-it').value = this.itData?.products?.[product.id]?.description || '';

    // Allergens
    (product.allergens || []).forEach(a => {
      const cb = document.querySelector(`#product-allergens input[value="${a}"]`);
      if (cb) cb.checked = true;
    });

    // Tags
    (product.tags || []).forEach(t => {
      const cb = document.querySelector(`#product-tags input[value="${t}"]`);
      if (cb) cb.checked = true;
    });
  }

  populateProductModal() {
    // Categories
    const categorySelect = document.getElementById('product-category');
    if (categorySelect) {
      categorySelect.innerHTML = '';
      (this.defaultData?.categories || []).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = this.itData?.categories?.[c.id] || c.id;
        categorySelect.appendChild(opt);
      });
    }

    // Allergens
    const allergensContainer = document.getElementById('product-allergens');
    if (allergensContainer) {
      allergensContainer.innerHTML = '';
      for (const [key, allergen] of Object.entries(DEFAULT_ALLERGENS)) {
        const item = document.createElement('div');
        item.className = 'checkbox-item';
        const label = this.itData?.allergeni?.[key] || allergen.name;
        item.innerHTML = `
          <input type="checkbox" id="allergen-${key}" value="${key}">
          <label for="allergen-${key}">${allergen.icon} ${this.escapeHtml(label)}</label>
        `;
        allergensContainer.appendChild(item);
      }
    }

    // Tags
    const tagsContainer = document.getElementById('product-tags');
    if (tagsContainer) {
      tagsContainer.innerHTML = '';
      for (const [key, characteristic] of Object.entries(DEFAULT_CHARACTERISTICS)) {
        const item = document.createElement('div');
        item.className = 'checkbox-item';
        const label = (this.itData?.characteristics?.[key] || this.itData?.caratteristiche?.[key]) || characteristic.name || key;
        item.innerHTML = `
          <input type="checkbox" id="tag-${key}" value="${key}">
          <label for="tag-${key}">${characteristic.icon} ${this.escapeHtml(label)}</label>
        `;
        tagsContainer.appendChild(item);
      }
    }

    // Clear checkboxes
    document.querySelectorAll('#product-allergens input, #product-tags input').forEach(cb => cb.checked = false);
  }

  async handleProductSubmit() {
    if (!this.firebaseService) {
      this.showToast('Firebase non disponibile', 'error');
      return;
    }

    const idEl = document.getElementById('product-id');
    const isEdit = !!idEl?.disabled;

    const productId = (idEl?.value || '').trim();
    const category = (document.getElementById('product-category')?.value || '').trim();
    const price = parseFloat(document.getElementById('product-price')?.value || '0');
    const visible = (document.getElementById('product-visible')?.value || 'true') === 'true';

    const nameIt = (document.getElementById('product-name-it')?.value || '').trim();
    const descIt = (document.getElementById('product-description-it')?.value || '').trim();

    if (!productId || !category || !nameIt || Number.isNaN(price)) {
      this.showToast('Compila i campi obbligatori', 'warning');
      return;
    }

    const allergens = Array.from(document.querySelectorAll('#product-allergens input:checked')).map(cb => cb.value);
    const tags = Array.from(document.querySelectorAll('#product-tags input:checked')).map(cb => cb.value);

    const product = { id: productId, category, price, visible, allergens, tags };

    try {
      if (isEdit) {
        await this.firebaseService.updateProduct(productId, product);
      } else {
        await this.firebaseService.addProduct(product);
      }

      // Update Italian translations (source)
      const metaHashes = {};
      // Use global hashString helper to compute stable hashes
      metaHashes[`products.${productId}.name`] = hashString(nameIt);
      metaHashes[`products.${productId}.description`] = hashString(descIt || '');

      this.setAIProgress(true, 'Salvataggio su Firebase…');
      await this.translationService.saveTranslations('it', {
        ui: {},
        allergens: {},
        categories: {},
        characteristics: {},
        products: {
          [productId]: {
            name: nameIt,
            description: descIt || ''
          }
        }
      }, { hashes: metaHashes });

      this.showToast(isEdit ? 'Prodotto aggiornato' : 'Prodotto aggiunto', 'success');
      this.hideModal('product-modal');
      await this.loadData();
    } catch (err) {
      console.error('🔧 Product submit error:', err);
      this.showToast('Errore nel salvare il prodotto', 'error');
    }
  }

  async toggleProductVisibility(productId, visible) {
    try {
      await this.firebaseService.updateProduct(productId, { visible });
      await this.loadData();
      this.showToast(`Prodotto ${visible ? 'mostrato' : 'nascosto'}`, 'success');
    } catch (err) {
      console.error('🔧 toggleProductVisibility error:', err);
      this.showToast('Errore nell\'aggiornare la visibilità', 'error');
    }
  }

  async deleteProduct(productId) {
    if (!confirm('Sei sicuro di voler eliminare questo prodotto?')) return;

    try {
      await this.firebaseService.deleteProduct(productId);
      await this.loadData();
      this.showToast('Prodotto eliminato', 'success');
    } catch (err) {
      console.error('🔧 deleteProduct error:', err);
      this.showToast('Errore nell\'eliminare il prodotto', 'error');
    }
  }

  // ---------- Categories CRUD ----------
  showAddCategoryModal() {
    document.getElementById('category-form')?.reset();
    const idEl = document.getElementById('category-id');
    if (idEl) idEl.disabled = false;

    document.getElementById('category-modal-title').textContent = 'Aggiungi Categoria';
    this.showModal('category-modal');
  }

  editCategory(categoryId) {
    const category = this.defaultData?.categories?.find(c => c.id === categoryId);
    if (!category) return;

    document.getElementById('category-modal-title').textContent = 'Modifica Categoria';
    this.showModal('category-modal');

    const idEl = document.getElementById('category-id');
    if (idEl) {
      idEl.value = category.id;
      idEl.disabled = true;
    }

    document.getElementById('category-name-it').value = this.itData?.categories?.[category.id] || '';
    document.getElementById('category-icon').value = category.icon || '';
    document.getElementById('category-order').value = category.order || 1;
    document.getElementById('category-visible').value = String(!!category.visible);
  }

  async handleCategorySubmit() {
    if (!this.firebaseService) {
      this.showToast('Firebase non disponibile', 'error');
      return;
    }

    const idEl = document.getElementById('category-id');
    const isEdit = !!idEl?.disabled;

    const categoryId = (idEl?.value || '').trim();
    const nameIt = (document.getElementById('category-name-it')?.value || '').trim();
    const icon = (document.getElementById('category-icon')?.value || '').trim();
    const order = parseInt(document.getElementById('category-order')?.value || '1', 10);
    const visible = (document.getElementById('category-visible')?.value || 'true') === 'true';

    if (!categoryId || !nameIt || Number.isNaN(order)) {
      this.showToast('Compila i campi obbligatori', 'warning');
      return;
    }

    const category = { id: categoryId, icon, order, visible };

    try {
      if (isEdit) {
        await this.firebaseService.updateCategory(categoryId, category);
      } else {
        await this.firebaseService.addCategory(category);
      }

      const metaHashes = {};
      metaHashes[`categories.${categoryId}`] = hashString(nameIt);

      await this.translationService.saveTranslations('it', {
        ui: {},
        allergens: {},
        products: {},
        characteristics: {},
        categories: { [categoryId]: nameIt }
      }, { hashes: metaHashes });

      this.showToast(isEdit ? 'Categoria aggiornata' : 'Categoria aggiunta', 'success');
      this.hideModal('category-modal');
      await this.loadData();
    } catch (err) {
      console.error('🔧 Category submit error:', err);
      this.showToast('Errore nel salvare la categoria', 'error');
    }
  }

  async toggleCategoryVisibility(categoryId, visible) {
    try {
      await this.firebaseService.updateCategory(categoryId, { visible });
      await this.loadData();
      this.showToast(`Categoria ${visible ? 'mostrata' : 'nascosta'}`, 'success');
    } catch (err) {
      console.error('🔧 toggleCategoryVisibility error:', err);
      this.showToast('Errore nell\'aggiornare la visibilità', 'error');
    }
  }

  async deleteCategory(categoryId) {
    if (!confirm('Sei sicuro di voler eliminare questa categoria?')) return;

    try {
      await this.firebaseService.deleteCategory(categoryId);
      await this.loadData();
      this.showToast('Categoria eliminata', 'success');
    } catch (err) {
      console.error('🔧 deleteCategory error:', err);
      this.showToast('Errore nell\'eliminare la categoria', 'error');
    }
  }

  // ---------- Translation management ----------
  async loadLanguageForTranslation() {
    if (!this.firebaseService) return;

    try {
      this.itData = this.itData || await this.firebaseService.getLanguageData('it');
      this.languageData = await this.firebaseService.getLanguageData(this.currentLanguage) || { ...DEFAULT_LANGUAGE_STRUCTURE };
      this.renderTranslationsInterface();
    } catch (err) {
      console.error('🔧 loadLanguageForTranslation error:', err);
      this.showToast('Errore nel caricare le traduzioni', 'error');
    }
  }

  renderTranslationsInterface() {
    const container = document.getElementById('translations-container');
    if (!container) return;

    const it = this.itData || ITALIAN_DEFAULT_DATA;
    const lang = this.languageData || { ...DEFAULT_LANGUAGE_STRUCTURE };

    const sections = this.buildTranslationSections(it, lang);

    container.innerHTML = sections.map(section => {
      const entries = section.entries;
      const filledCount = entries.filter(e => (e.value || '').trim() !== '').length;
      const totalCount = entries.length;
      const progressPercent = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

      return `
      <div class="translation-section">
        <div class="translation-section-header">
          <div>
            <h4>${section.title}</h4>
            <p>${section.description}</p>
          </div>
          <div class="translation-section-stats">
            <div class="translation-progress">
              <span>${filledCount}/${totalCount}</span>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
              </div>
              <span>${progressPercent}%</span>
            </div>
          </div>
        </div>
        <div class="translation-section-body">
          <div class="translation-grid">
            ${entries.map(e => {
        const isEmpty = !(e.value && e.value.trim() !== '');
        const inputClass = isEmpty ? 'translation-input empty' : 'translation-input filled';
        const sourceLine = e.source != null ? `<div class="translation-source">IT: ${this.escapeHtml(e.source)}</div>` : '';

        return `
                <div class="translation-item">
                  <div class="translation-key">${this.escapeHtml(e.label)}</div>
                  ${sourceLine}
                  <input type="text" class="${inputClass}"
                         data-type="${section.type}"
                         data-key="${this.escapeHtml(e.key)}"
                         data-itemid="${this.escapeHtml(e.itemId)}"
                         value="${this.escapeAttr(e.value || '')}"
                         placeholder="Inserisci traduzione...">
                </div>
              `;
      }).join('')}
          </div>
        </div>
      </div>
      `;
    }).join('');

    // Live progress + styling
    container.querySelectorAll('.translation-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const val = e.target.value || '';
        e.target.className = (val.trim() === '') ? 'translation-input empty' : 'translation-input filled';
        this.updateSectionProgress(e.target.closest('.translation-section'));
      });
    });
  }

  buildTranslationSections(it, lang) {
    const sections = [];

    // UI keys from Italian data
    const uiKeys = Object.keys(it?.testi || ITALIAN_DEFAULT_DATA.testi || {});
    sections.push({
      title: 'Testi Interfaccia',
      description: 'Traduzioni per i testi dell\'interfaccia',
      type: 'ui',
      entries: uiKeys.map(k => ({
        key: k,
        label: k,
        source: it?.testi?.[k] || '',
        value: lang?.testi?.[k] || '',
        itemId: `ui.${k}`,
      }))
    });

    // Allergens
    const allergenKeys = Object.keys(DEFAULT_ALLERGENS);
    sections.push({
      title: 'Allergeni',
      description: 'Traduzioni nomi allergeni',
      type: 'allergens',
      entries: allergenKeys.map(k => ({
        key: k,
        label: k,
        source: it?.allergeni?.[k] || DEFAULT_ALLERGENS[k]?.name || '',
        value: lang?.allergeni?.[k] || '',
        itemId: `allergens.${k}`,
      }))
    });

    // Characteristics
    const charKeys = Object.keys(DEFAULT_CHARACTERISTICS);
    sections.push({
      title: 'Caratteristiche',
      description: 'Traduzioni caratteristiche prodotti',
      type: 'characteristics',
      entries: charKeys.map(k => ({
        key: k,
        label: k,
        source: (it?.characteristics?.[k] || it?.caratteristiche?.[k]) || DEFAULT_CHARACTERISTICS[k]?.name || '',
        value: (lang?.characteristics?.[k] || lang?.caratteristiche?.[k]) || '',
        itemId: `characteristics.${k}`,
      }))
    });

    // Categories
    const categoryIds = (this.defaultData?.categories || []).map(c => c.id);
    sections.push({
      title: 'Categorie',
      description: 'Traduzioni nomi categorie',
      type: 'categories',
      entries: categoryIds.map(id => ({
        key: id,
        label: id,
        source: it?.categories?.[id] || id,
        value: lang?.categories?.[id] || '',
        itemId: `categories.${id}`,
      }))
    });

    // Products (2 fields)
    const productIds = (this.defaultData?.products || []).map(p => p.id);
    const prodEntries = [];
    for (const id of productIds) {
      prodEntries.push({
        key: `${id}.name`,
        label: `${id}_name`,
        source: it?.products?.[id]?.name || id,
        value: lang?.products?.[id]?.name || '',
        itemId: `products.${id}.name`,
      });
      prodEntries.push({
        key: `${id}.description`,
        label: `${id}_description`,
        source: it?.products?.[id]?.description || '',
        value: lang?.products?.[id]?.description || '',
        itemId: `products.${id}.description`,
      });
    }
    sections.push({
      title: 'Prodotti',
      description: 'Traduzioni nomi e descrizioni prodotti',
      type: 'products',
      entries: prodEntries
    });

    // Guida (stesso trattamento delle altre voci: key/value con progress)
    const itGuide = it?.guide || it?.guida || null;
    const langGuide = (lang?.guide || lang?.guida) || null;
    const guideEntries = [];

    if (itGuide && typeof itGuide === 'object') {
      const flat = [];
      flattenJsonStrings(itGuide, '', flat);
      for (const row of flat) {
        const path = row.path;
        const text = String(row.text ?? '');
        // evita di tradurre URL/email (immagini, map link, ecc.)
        if (!this.isGuideTranslatable(path, text)) continue;
        const existing = getNestedValue(langGuide, path);
        guideEntries.push({
          key: path,
          label: `guide.${path}`,
          source: text,
          value: (typeof existing === 'string') ? existing : '',
          itemId: `guide.${path}`,
        });
      }
    }

    sections.push({
      title: 'Guida',
      description: 'Traduzioni contenuti della guida (Luoghi, Eventi, Consigli, ecc.)',
      type: 'guide',
      entries: guideEntries
    });

    return sections;
  }

  isGuideTranslatable(path, text) {
    const t = String(text || '').trim();
    if (!t) return false;
    // skip URLs, emails
    if (/^https?:\/\//i.test(t)) return false;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return false;
    // skip obvious non-translatable keys
    if (/\b(image|img|map_link|link|url)\b/i.test(path)) return false;
    return true;
  }

  updateSectionProgress(section) {
    if (!section) return;
    const inputs = section.querySelectorAll('.translation-input');
    const filled = Array.from(inputs).filter(i => (i.value || '').trim() !== '').length;
    const total = inputs.length;
    const percent = total > 0 ? Math.round((filled / total) * 100) : 0;

    section.querySelector('.progress-fill')?.style && (section.querySelector('.progress-fill').style.width = `${percent}%`);
    const countEl = section.querySelector('.translation-progress span:first-child');
    const pctEl = section.querySelector('.translation-progress span:last-child');
    if (countEl) countEl.textContent = `${filled}/${total}`;
    if (pctEl) pctEl.textContent = `${percent}%`;
  }

  collectTranslationInputs() {
    const inputs = Array.from(document.querySelectorAll('.translation-input'));

    const translations = {
      ui: {},
      allergens: {},
      characteristics: {},
      categories: {},
      products: {},
      guide: {},
    };

    const metaHashes = {};

    const it = this.itData || ITALIAN_DEFAULT_DATA;

    for (const input of inputs) {
      const type = input.dataset.type;
      const key = input.dataset.key;
      const itemId = input.dataset.itemid;
      const value = (input.value || '').trim();

      if (!type || !key || !itemId) continue;
      if (value === '') continue;

      // Store translation
      if (type === 'products') {
        const [productId, field] = key.split('.');
        if (!translations.products[productId]) translations.products[productId] = {};
        translations.products[productId][field] = value;

        // Base hash
        const base = field === 'name'
          ? (it?.products?.[productId]?.name || '')
          : (it?.products?.[productId]?.description || '');
        metaHashes[itemId] = hashString(base || '');
      } else if (type === 'categories') {
        translations.categories[key] = value;
        const base = it?.categories?.[key] || '';
        metaHashes[itemId] = hashString(base || '');
      } else if (type === 'ui') {
        translations.ui[key] = value;
        const base = it?.testi?.[key] || '';
        metaHashes[itemId] = hashString(base || '');
      } else if (type === 'allergens') {
        translations.allergens[key] = value;
        const base = it?.allergeni?.[key] || DEFAULT_ALLERGENS[key]?.name || '';
        metaHashes[itemId] = hashString(base || '');
      } else if (type === 'characteristics') {
        translations.characteristics[key] = value;
        const base = (it?.characteristics?.[key] || it?.caratteristiche?.[key]) || DEFAULT_CHARACTERISTICS[key]?.name || '';
        metaHashes[itemId] = hashString(base || '');
      } else if (type === 'guide') {
        // key is a dot/bracket path relative to langData.guide
        setNestedValue(translations.guide, key, value);
        const itGuide = (it?.guide || it?.guida) || {};
        const base = getNestedValue(itGuide, key) || '';
        metaHashes[itemId] = hashString(String(base || ''));
      }
    }

    return { translations, metaHashes };
  }

  async saveTranslations() {
    if (!this.translationService || !this.firebaseService) return;

    try {
      const { translations, metaHashes } = this.collectTranslationInputs();

      await this.translationService.saveTranslations(
        this.currentLanguage,
        translations,
        { hashes: metaHashes }
      );

      this.showToast('Traduzioni salvate', 'success');
      await this.loadData();
      if (this.currentView === 'translations') {
        await this.loadLanguageForTranslation();
      }
    } catch (err) {
      console.error('🔧 saveTranslations error:', err);
      this.showToast('Errore nel salvare le traduzioni', 'error');
    }
  }

  // ---------- AI translate ----------
  async autoTranslateMissing() {
    if (!this.translationService || !this.firebaseService) return;

    const token = (document.getElementById('ai-admin-token')?.value || '').trim();
    const force = !!document.getElementById('ai-force')?.checked;

    if (!token) {
      this.showToast('Inserisci il Token API (admin)', 'warning');
      return;
    }

    if (this.currentLanguage === 'it') {
      this.showToast('La lingua italiana è la sorgente (non si auto-traduce)', 'info');
      return;
    }

    try {
      this.setAIProgress(true, 'Preparazione traduzioni…');
      // Refresh
      this.itData = await this.firebaseService.getLanguageData('it');
      this.languageData = await this.firebaseService.getLanguageData(this.currentLanguage) || { ...DEFAULT_LANGUAGE_STRUCTURE };

      const it = this.itData || ITALIAN_DEFAULT_DATA;
      const target = this.languageData || { ...DEFAULT_LANGUAGE_STRUCTURE };

      const existingHashes = target.__meta?.hashes || {};

      const allItems = this.buildItemsToTranslate(it, target, existingHashes, force);
      if (allItems.length === 0) {
        this.showToast('Nessuna traduzione da generare', 'info');
        return;
      }

      // Chunk requests
      const chunks = this.chunkItems(allItems, 60, 9000);

      const translated = {};
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        this.setAIProgress(true, `Traduzione in corso… (${i + 1}/${chunks.length})`);
        const res = await this.callTranslateApi(token, this.currentLanguage, chunk);
        Object.assign(translated, res);
      }

      // Apply translations into structures
      const update = {
        ui: {},
        allergens: {},
        characteristics: {},
        categories: {},
        products: {},
        guide: {},
      };

      const metaHashes = {};

      for (const item of allItems) {
        const out = translated[item.id];
        if (!out || typeof out !== 'string') continue;
        this.applyItemTranslation(update, item, out);
        metaHashes[item.id] = item.baseHash;
      }

      await this.translationService.saveTranslations(this.currentLanguage, update, { hashes: metaHashes });
      this.setAIProgress(false);
      this.showToast(`Auto-traduzione completata (${Object.keys(metaHashes).length} voci)`, 'success');
      await this.loadData();
      await this.loadLanguageForTranslation();
    } catch (err) {
      console.error('🔧 autoTranslateMissing error:', err);
      this.showToast('Errore durante l\'auto-traduzione', 'error');
    }
  }

  buildItemsToTranslate(it, target, existingHashes, force) {
    const items = [];

    const pushItem = (id, text, context, existingValue) => {
      const baseHash = hashString(text || '');
      const hashOk = existingHashes?.[id] === baseHash;
      const hasValue = !!(existingValue && String(existingValue).trim() !== '');

      // Translate if missing OR force OR base changed (hash differs)
      if (force || !hasValue || !hashOk) {
        items.push({ id, text, context, baseHash });
      }
    };

    // UI
    for (const [k, v] of Object.entries(it?.testi || {})) {
      const id = `ui.${k}`;
      const existingValue = target?.testi?.[k] || '';
      pushItem(id, v || '', 'UI', existingValue);
    }

    // Allergens
    for (const k of Object.keys(DEFAULT_ALLERGENS)) {
      const source = it?.allergeni?.[k] || DEFAULT_ALLERGENS[k]?.name || '';
      const existingValue = target?.allergeni?.[k] || '';
      pushItem(`allergens.${k}`, source, 'Allergens', existingValue);
    }

    // Characteristics
    for (const k of Object.keys(DEFAULT_CHARACTERISTICS)) {
      const source = (it?.characteristics?.[k] || it?.caratteristiche?.[k]) || DEFAULT_CHARACTERISTICS[k]?.name || '';
      const existingValue = (target?.characteristics?.[k] || target?.caratteristiche?.[k]) || '';
      pushItem(`characteristics.${k}`, source, 'Characteristics', existingValue);
    }

    // Categories
    for (const c of (this.defaultData?.categories || [])) {
      const source = it?.categories?.[c.id] || c.id;
      const existingValue = target?.categories?.[c.id] || '';
      pushItem(`categories.${c.id}`, source, 'Categories', existingValue);
    }

    // Products
    for (const p of (this.defaultData?.products || [])) {
      const nameSrc = it?.products?.[p.id]?.name || p.id;
      const descSrc = it?.products?.[p.id]?.description || '';

      const nameVal = target?.products?.[p.id]?.name || '';
      const descVal = target?.products?.[p.id]?.description || '';

      pushItem(`products.${p.id}.name`, nameSrc, 'Products (name)', nameVal);
      // Translate description only if non-empty in Italian
      if ((descSrc || '').trim() !== '') {
        pushItem(`products.${p.id}.description`, descSrc, 'Products (description)', descVal);
      }
    }

    // Guida (trattata come tutte le altre voci): flatten dei testi e confronto hash
    const itGuide = (it?.guide || it?.guida) || null;
    const tgtGuide = (target?.guide || target?.guida) || null;
    if (itGuide && typeof itGuide === 'object') {
      const flat = [];
      flattenJsonStrings(itGuide, '', flat);
      for (const row of flat) {
        const path = row.path;
        const srcText = String(row.text ?? '');
        if (!this.isGuideTranslatable(path, srcText)) continue;
        const existingValue = getNestedValue(tgtGuide, path);
        pushItem(`guide.${path}`, srcText, 'Guida', (typeof existingValue === 'string') ? existingValue : '');
      }
    }

    return items;
  }

  applyItemTranslation(update, item, translatedText) {
    const id = item.id;
    const text = translatedText.trim();

    if (id.startsWith('ui.')) {
      const key = id.slice(3);
      update.ui[key] = text;
      return;
    }
    if (id.startsWith('allergens.')) {
      const key = id.slice('allergens.'.length);
      update.allergens[key] = text;
      return;
    }
    if (id.startsWith('characteristics.')) {
      const key = id.slice('characteristics.'.length);
      update.characteristics[key] = text;
      return;
    }
    if (id.startsWith('categories.')) {
      const key = id.slice('categories.'.length);
      update.categories[key] = text;
      return;
    }
    if (id.startsWith('products.')) {
      // products.<id>.(name|description)
      const rest = id.slice('products.'.length);
      const parts = rest.split('.');
      const productId = parts[0];
      const field = parts[1];
      if (!update.products[productId]) update.products[productId] = {};
      update.products[productId][field] = text;
      return;
    }

    if (id.startsWith('guide.')) {
      const path = id.slice('guide.'.length);
      setNestedValue(update.guide, path, text);
      return;
    }
  }

  chunkItems(items, maxItems, maxChars) {
    const chunks = [];
    let cur = [];
    let curChars = 0;

    for (const it of items) {
      const len = (it.text || '').length;
      const wouldExceedCount = cur.length >= maxItems;
      const wouldExceedChars = (curChars + len) > maxChars;

      if (cur.length > 0 && (wouldExceedCount || wouldExceedChars)) {
        chunks.push(cur);
        cur = [];
        curChars = 0;
      }

      cur.push({ id: it.id, text: it.text, context: it.context });
      curChars += len;
    }

    if (cur.length > 0) chunks.push(cur);
    return chunks;
  }

  async callTranslateApi(adminToken, targetLang, items) {
    // Use a relative path so the app works even when hosted in a subfolder.
    const res = await fetch('api/translate.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': adminToken,
      },
      body: JSON.stringify({
        source: 'it',
        target: targetLang,
        mode: 'menu',
        items,
      })
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      const details = json?.error || json?.details || 'Errore API';
      throw new Error(details);
    }

    return json.translations || {};
  }

  // (Removed duplicate helper methods `flattenJsonStrings`, `getNestedValue`,
  // `setNestedValue`, and `hashString`). Use the global utility functions
  // defined in `src/js/core/utils.js` (attached to `window`) instead.

  /**
   * Importa il seed della guida italiana nel documento data/it.
   * Carica il file data/guide-it.json dal progetto, calcola gli hash per ogni stringa,
   * lo salva su Firestore e aggiorna la dashboard. Richiede i servizi Firebase già inizializzati.
   */
  async importGuideSeed() {
    if (!this.firebaseService) {
      this.showToast('Servizio Firebase non disponibile', 'error');
      return;
    }
    try {
      this.setAIProgress(true, 'Importazione guida…');
      // Carica il seed della guida italiana dal file statico
      const res = await fetch('data/guide-it.json', { cache: 'no-cache' });
      const guideSeed = await res.json().catch(() => null);
      if (!guideSeed || typeof guideSeed !== 'object') {
        throw new Error('Seed guida non valido');
      }
      // Ottieni o crea la lingua italiana nel DB
      const langData = await this.firebaseService.getLanguageData('it') || {};
      // Assegna la guida
      langData.guide = guideSeed;
      // Calcola gli hash delle stringhe guida per il tracking delle modifiche (stesso schema di UI/Menu: __meta.hashes con prefisso guide.)
      const flat = [];
      flattenJsonStrings(guideSeed, '', flat);
      const hashes = {};
      for (const row of flat) {
        const text = String(row.text ?? '');
        if (!this.isGuideTranslatable(row.path, text)) continue;
        hashes[`guide.${row.path}`] = hashString(text);
      }
      if (!langData.__meta || typeof langData.__meta !== 'object') {
        langData.__meta = {};
      }
      langData.__meta.hashes = {
        ...(langData.__meta.hashes || {}),
        ...hashes
      };
      langData.__meta.updated_at = new Date().toISOString();
      // Salva su Firestore
      await this.firebaseService.saveLanguageData('it', langData);
      this.showToast('Guida IT importata nel DB', 'success');
      await this.loadData();
      // Se l'utente sta visualizzando le traduzioni, ricarica la lingua
      if (this.currentView === 'translations') {
        await this.loadLanguageForTranslation();
      }
    } catch (err) {
      console.error('Errore import guida:', err);
      this.showToast('Errore durante l\'import della guida', 'error');
    } finally {
      this.setAIProgress(false);
    }
  }

  // ---------- Export/Import ----------
  async exportLanguage() {
    const languageCode = document.getElementById('export-language')?.value || 'it';

    try {
      const exportData = await this.firebaseService.exportLanguage(languageCode);

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translations-${languageCode}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showToast(`Lingua ${languageCode} esportata`, 'success');
    } catch (err) {
      console.error('🔧 exportLanguage error:', err);
      this.showToast('Errore nell\'esportare la lingua', 'error');
    }
  }

  async handleImportFile(file) {
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      if (!importData.language || !importData.translations) throw new Error('Formato file non valido');
      this.showImportPreview(importData);
      document.getElementById('import-btn').disabled = false;
    } catch (err) {
      console.error('🔧 handleImportFile error:', err);
      this.showToast('Errore nel leggere il file', 'error');
      const f = document.getElementById('import-file');
      if (f) f.value = '';
    }
  }

  showImportPreview(importData) {
    const preview = document.getElementById('import-preview');
    const details = document.getElementById('import-details');
    if (!preview || !details) return;

    const charTrans = importData.translations.characteristics || importData.translations.Characteristics || {};

    details.innerHTML = `
      <strong>Lingua:</strong> ${this.escapeHtml(importData.language)}<br>
      <strong>Nome:</strong> ${this.escapeHtml(importData.languageData?.name || 'N/A')}<br>
      <strong>Data Export:</strong> ${this.escapeHtml(importData.exportDate || 'N/A')}<br>
      <strong>Versione:</strong> ${this.escapeHtml(importData.version || 'N/A')}<br>
      <strong>UI:</strong> ${Object.keys(importData.translations.ui || {}).length}<br>
      <strong>Allergeni:</strong> ${Object.keys(importData.translations.allergens || {}).length}<br>
      <strong>Prodotti:</strong> ${Object.keys(importData.translations.products || {}).length}<br>
      <strong>Categorie:</strong> ${Object.keys(importData.translations.categories || {}).length}<br>
      <strong>Caratteristiche:</strong> ${Object.keys(charTrans).length}
    `;

    preview.classList.remove('hidden');
    this.importData = importData;
  }

  async confirmImport() {
    if (!this.importData) return;

    try {
      await this.firebaseService.importLanguage(this.importData);
      await this.loadData();
      this.cancelImport();
      this.showToast('Traduzioni importate', 'success');
    } catch (err) {
      console.error('🔧 confirmImport error:', err);
      this.showToast('Errore nell\'importare le traduzioni', 'error');
    }
  }

  cancelImport() {
    document.getElementById('import-preview')?.classList.add('hidden');
    const f = document.getElementById('import-file');
    if (f) f.value = '';
    const b = document.getElementById('import-btn');
    if (b) b.disabled = true;
    this.importData = null;
  }

  // ---------- UI utils ----------
  showModal(modalId) {
    document.getElementById(modalId)?.classList.add('show');
  }

  hideModal(modalId) {
    document.getElementById(modalId)?.classList.remove('show');
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
      <div class="toast-content"><div class="toast-message">${this.escapeHtml(message)}</div></div>
      <button class="toast-close" aria-label="Chiudi"><i class="fas fa-times"></i></button>
    `;

    toast.querySelector('.toast-close')?.addEventListener('click', () => this.removeToast(toast));

    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => this.removeToast(toast), 5000);
  }

  removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => toast.parentNode && toast.parentNode.removeChild(toast), 300);
  }

  escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  escapeAttr(str) {
    return this.escapeHtml(str).replace(/\n/g, ' ');
  }

  // (Removed duplicate `hashString` method; use global `hashString` from utils instead.)
  // AI progress UI
  setAIProgress(visible, text = '') {
    const box = document.getElementById('ai-progress');
    const label = document.getElementById('ai-progress-text');
    if (!box) return;
    if (visible) {
      box.classList.remove('hidden');
      if (label) label.textContent = text || '';
    } else {
      box.classList.add('hidden');
    }
  }

}




// Global functions for inline onclick handlers
window.showView = function (viewName) {
  window.adminPanel?.showView(viewName);
};

window.closeModal = function (modalId) {
  document.getElementById(modalId)?.classList.remove('show');
};


// Global functions for inline onclick handlers
window.showView = function (viewName) {
  window.adminPanel?.showView(viewName);
};

window.closeModal = function (modalId) {
  document.getElementById(modalId)?.classList.remove('show');
};

document.addEventListener('DOMContentLoaded', () => {
  window.adminPanel = new AdminPanel();
});