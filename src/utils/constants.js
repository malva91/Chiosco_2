// Firebase Configuration
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBYHTG6eir-gtl5m_AGEx6vavxiWhhf_2I",
  authDomain: "orechiosco.firebaseapp.com",
  projectId: "orechiosco",
  storageBucket: "orechiosco.firebasestorage.app",
  messagingSenderId: "606103127337",
  appId: "1:606103127337:web:968c59504d5eb2fca6e338",
  measurementId: "G-0K1GRHFN03"
};

// Admin Configuration
const ADMIN_PASSWORD = 'barrino2025';

// Cache Configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Default Allergens
const DEFAULT_ALLERGENS = {
  glutine:    { icon: '🌾', name: 'Glutine' },
  crostacei:  { icon: '🦞', name: 'Crostacei' },
  uova:       { icon: '🥚', name: 'Uova' },
  pesce:      { icon: '🐟', name: 'Pesce' },
  arachidi:   { icon: '🥜', name: 'Arachidi' },
  soia:       { icon: '🌿', name: 'Soia' },
  latte:      { icon: '🥛', name: 'Latte' },
  frutta_guscio: { icon: '🌰', name: 'Frutta a guscio' },
  sedano:     { icon: '🥬', name: 'Sedano' },
  senape:     { icon: '🟡', name: 'Senape' },
  sesamo:     { icon: '⚪', name: 'Semi di sesamo' },
  solfiti:    { icon: '🧪', name: 'Solfiti' },
  lupini:     { icon: '🌕', name: 'Lupini' },
  molluschi:  { icon: '🦑', name: 'Molluschi' },
  alcol:      { icon: '🍷', name: 'Alcol' }
};

// Default Characteristics/Tags
const DEFAULT_CHARACTERISTICS = {
  vegetariano: { icon: '🥦', name: 'Vegetariano' },
  pollo:       { icon: '🐔', name: 'Pollo' },
  maiale:      { icon: '🐷', name: 'Maiale' },
  congelato:   { icon: '❄️', name: 'Congelato' }
};

// Default Categories
const DEFAULT_CATEGORIES = [
  { id: 'caffetteria',      icon: 'fas fa-coffee',        order: 1, visible: true },
  { id: 'bevande_fredde',   icon: 'fas fa-glass-water',   order: 2, visible: true },
  { id: 'birre',            icon: 'fas fa-beer',          order: 3, visible: true },
  { id: 'vini',             icon: 'fas fa-wine-glass',    order: 4, visible: true },
  { id: 'aperitivi',        icon: 'fas fa-cocktail',      order: 5, visible: true },
  { id: 'salato',           icon: 'fas fa-bread-slice',   order: 6, visible: true },
  { id: 'dolci',            icon: 'fas fa-cake-candles',  order: 7, visible: true }
];

// Sample Products
const SAMPLE_PRODUCTS = [
  {
    id: 'caffe_espresso',
    category: 'caffetteria',
    price: 1.20,
    visible: true,
    allergens: [],
    tags: []
  },
  {
    id: 'cappuccino',
    category: 'caffetteria',
    price: 1.50,
    visible: true,
    allergens: ['latte'],
    tags: []
  },
  {
    id: 'brioches',
    category: 'dolci',
    price: 1.80,
    visible: true,
    allergens: ['glutine', 'uova', 'latte'],
    tags: []
  },
  {
    id: 'toast',
    category: 'salato',
    price: 4.50,
    visible: true,
    allergens: ['glutine', 'latte'],
    tags: []
  },
  {
    id: 'acqua_naturale_500ml',
    category: 'bevande_fredde',
    price: 1.00,
    visible: true,
    allergens: [],
    tags: []
  },
  {
    id: 'tortina',
    category: 'dolci',
    price: 3.50,
    visible: true,
    allergens: ['glutine', 'uova', 'latte'],
    tags: []
  }
];

// Default Language Data Structure
const DEFAULT_LANGUAGE_STRUCTURE = {
  tagLingua: {
    name: '',
    flag: '',
    direction: 'ltr',
    active: true,
    isDefault: false
  },
  allergeni: {},
  characteristics: {},
  guide: {},
  testi: {
    // UI Base
    site_title: '',
    header_subtitle: '',
    search_placeholder: '',
    loading: '',
    no_results: '',
    no_results_desc: '',
    // Legend
    legend_title: '',
    legend_explanation: '',
    legend_allergens_title: '',
    legend_characteristics_title: '',
    filter_title: '',
    filter_allergens: '',
    filter_characteristics: '',
    clear_filters: '',
    apply_filters: '',
    // Disclaimers
    disclaimer_shared: '',
    disclaimer_service: '',
    // Reviews
    review_title: '',
    review_subtitle: '',
    review_button: '',
    // Language
    language_selector_title: '',
    // Game Base
    game_title: '',
    game_subtitle: '',
    game_invitation_title: '',
    game_invitation_subtitle: '',
    game_button_text: '',
    // Game Instructions
    instructions_title: '',
    instruction_1: '',
    instruction_2: '',
    instruction_3: '',
    instruction_4: '',
    // Game UI
    score_label: '',
    high_score_label: '',
    speed_label: '',
    game_controls_text: '',
    back_to_menu_text: '',
    // Game Over
    game_over_title: '',
    final_score_text: '',
    restart_text: '',
    play_again: '',
    // Leaderboard
    leaderboard_text: '',
    leaderboard_title: '',
    leaderboard_main_title: '',
    no_scores_text: '',
    no_scores_modal_text: '',
    // Score Saving
    save_score_label: '',
    player_name_placeholder: '',
    save_score: '',
    skip_save: '',
    // Mobile Orientation
    orientation_title: '',
    orientation_message: '',
    orientation_note: '',
    continue_portrait_text: '',
    // Random Names
    random_name_suggestion: '',
    use_suggestion: ''
  },
  products: {},
  categories: {}
};

// Italian Default Data
const ITALIAN_DEFAULT_DATA = {
  tagLingua: {
    name: 'Italiano',
    flag: '🇮🇹',
    direction: 'ltr',
    active: true,
    isDefault: true
  },
  allergeni: {
    glutine: 'Glutine',
    crostacei: 'Crostacei',
    uova: 'Uova',
    pesce: 'Pesce',
    arachidi: 'Arachidi',
    soia: 'Soia',
    latte: 'Latte',
    frutta_guscio: 'Frutta a guscio',
    sedano: 'Sedano',
    senape: 'Senape',
    sesamo: 'Semi di sesamo',
    solfiti: 'Solfiti',
    lupini: 'Lupini',
    molluschi: 'Molluschi',
    alcol: 'Alcol'
  },
  characteristics: {
    vegetariano: 'Vegetariano',
    pollo: 'Pollo',
    maiale: 'Maiale',
    congelato: 'Congelato'
  },
  guide: {},
  testi: {
    // UI Base
    site_title: 'Il Barrino da Mario - Menu Digitale',
    header_subtitle: 'Menu Digitale',
    search_placeholder: 'Cerca nel menu...',
    loading: 'Caricamento...',
    no_results: 'Nessun risultato',
    no_results_desc: 'Non sono stati trovati prodotti che corrispondono ai tuoi criteri di ricerca.',
    // Legend
    legend_title: 'Legenda',
    legend_explanation: 'Clicca su un elemento per escludere i prodotti che lo contengono',
    legend_allergens_title: 'Allergeni',
    legend_characteristics_title: 'Caratteristiche',
    filter_title: 'Filtri',
    filter_allergens: 'Filtra allergeni da evitare',
    filter_characteristics: 'Caratteristiche',
    clear_filters: 'Pulisci Filtri',
    apply_filters: 'Applica',
    // Disclaimers
    disclaimer_shared: 'Tutti i piatti sono preparati in un ambiente condiviso, di conseguenza non possiamo garantire che non ci siano contaminazioni',
    disclaimer_service: 'Non si effettua servizio al tavolo. Ordinare al banco.',
    // Reviews
    review_title: 'Ti è piaciuta la tua esperienza?',
    review_subtitle: 'Lascia una recensione e aiuta altri clienti!',
    review_button: 'Lascia Recensione',
    // Language
    language_selector_title: 'Seleziona Lingua / Select Language',
    // Game Base
    game_title: 'Gioco del Dinosauro',
    game_subtitle: 'Divertiti mentre aspetti il tuo ordine!',
    game_invitation_title: 'Tempo di attesa?',
    game_invitation_subtitle: 'Divertiti con il nostro gioco del dinosauro mentre aspetti!',
    game_button_text: 'Gioca Ora',
    // Game Instructions
    instructions_title: 'Come Giocare',
    instruction_1: 'Tocca lo schermo per saltare (o premi SPAZIO su desktop)',
    instruction_2: 'Evita tavoli, pizze e mestoli per continuare a correre',
    instruction_3: 'Più a lungo resisti, più alto sarà il tuo punteggio',
    instruction_4: 'Tocca per ricominciare dopo il game over',
    // Game UI
    score_label: 'Punteggio',
    high_score_label: 'Record',
    speed_label: 'Velocità',
    game_controls_text: 'Tocca lo schermo per iniziare o saltare',
    back_to_menu_text: 'Torna al Menu',
    // Game Over
    game_over_title: 'Game Over!',
    final_score_text: 'Punteggio finale:',
    restart_text: 'Gioca Ancora',
    play_again: 'Gioca Ancora',
    // Leaderboard
    leaderboard_text: 'Classifica',
    leaderboard_title: '🏆 Classifica',
    leaderboard_main_title: '🏆 Classifica Migliori Punteggi',
    no_scores_text: 'Nessun punteggio salvato. Gioca per essere il primo!',
    no_scores_modal_text: 'Nessun punteggio salvato',
    // Score Saving
    save_score_label: 'Inserisci il tuo nome per la classifica:',
    player_name_placeholder: 'Il tuo nome',
    save_score: 'Salva Punteggio',
    skip_save: 'Salta',
    // Mobile Orientation
    orientation_title: 'Ruota il dispositivo',
    orientation_message: 'Per una migliore esperienza di gioco, ruota il tuo dispositivo in orizzontale',
    orientation_note: 'Il gioco è ottimizzato per la modalità landscape',
    continue_portrait_text: 'Continua in verticale',
    // Random Names
    random_name_suggestion: 'Suggerimento:',
    use_suggestion: 'Usa questo'
  },
  products: {
    caffe_espresso: {
      name: 'Caffè Espresso',
      description: 'Caffè espresso italiano'
    },
    cappuccino: {
      name: 'Cappuccino',
      description: 'Disponibile con latte 🥛, senza lattosio, soia 🌿, riso'
    },
    brioches: {
      name: 'Brioches',
      description: 'Brioche classica'
    },
    toast: {
      name: 'Toast',
      description: 'Con prosciutto cotto e formaggio'
    },
    acqua_naturale_500ml: {
      name: 'Acqua Naturale 500ml',
      description: 'Bottiglia 500ml'
    },
    tortina: {
      name: 'Tortina',
      description: 'Piccola torta dolce'
    }
  },
  categories: {
    caffetteria: 'Caffetteria',
    bevande_fredde: 'Bevande Analcoliche',
    birre: 'Birre',
    vini: 'Vino',
    aperitivi: 'Aperitivi',
    salato: 'Panini',
    dolci: 'Dolci'
  }
};

// Make constants globally available
if (typeof window !== 'undefined') {
  window.FIREBASE_CONFIG = FIREBASE_CONFIG;
  window.ADMIN_PASSWORD = ADMIN_PASSWORD;
  window.CACHE_DURATION = CACHE_DURATION;
  window.DEFAULT_ALLERGENS = DEFAULT_ALLERGENS;
  window.DEFAULT_CHARACTERISTICS = DEFAULT_CHARACTERISTICS;
  window.DEFAULT_CATEGORIES = DEFAULT_CATEGORIES;
  window.SAMPLE_PRODUCTS = SAMPLE_PRODUCTS;
  window.DEFAULT_LANGUAGE_STRUCTURE = DEFAULT_LANGUAGE_STRUCTURE;
  window.ITALIAN_DEFAULT_DATA = ITALIAN_DEFAULT_DATA;
}
