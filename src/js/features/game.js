// GAME_MECHANICS_COMPLETE.js v2.0.0 - Versione Corretta e Bilanciata
// Meccaniche complete del gioco del dinosauro per Il Barrino da Mario
// ============================================================================

// ============================================================================
// CONFIGURAZIONE GIOCO
// ============================================================================
const GAME_CONFIG = {
    // Impostazioni Canvas
    canvas: {
        width: 600,
        height: 180
    },

    // Impostazioni Giocatore (Mario)
    player: {
        x: 50,
        y: 130,
        width: 40,
        height: 40,
        jumpPower: 15,
        gravity: 0.8,
        groundY: 130,
        sprites: {
            running: ['images/camminata1.png', 'images/camminata2.png'],
            jumping: 'images/salto.png',
            animationSpeed: 250 // Migliorato per fluidità
        }
    },

    // Impostazioni Terreno
    ground: {
        x: 0,
        y: 170,
        width: 600,
        height: 10
    },

    // Impostazioni Ostacoli
    obstacles: {
        types: [
            { id: 'tavolo', width: 50, height: 60, y: 110, sprite: 'images/tavolo.png', difficulty: 3 },
            { id: 'cartoni', width: 25, height: 35, y: 135, sprite: 'images/cartoni.png', difficulty: 1 },
            { 
                id: 'italia', 
                width: 35, 
                height: 40, 
                y: [55, 65], 
                sprite: 'images/italia.png',
                canFly: true,
                flySpeed: 0.004, // Aumentato per essere più prevedibile
                flyAmplitude: 6, // Ridotto per evitare movimenti erratici
                difficulty: 2
            },
            { id: 'caffe', width: 35, height: 40, y: 130, sprite: 'images/caffe.png', difficulty: 2 },
            { id: 'vino', width: 40, height: 38, y: 135, sprite: 'images/vino.png', difficulty: 2 },
            { id: 'statua', width: 40, height: 45, y: 127, sprite: 'images/statua.png', difficulty: 3 }
        ],
        minDistance: 250, // Aumentato per dare più tempo di reazione
        maxDistance: 450,
        baseSpawnDelay: 1800,
        minSpawnDelay: 900, // Più bilanciato
        flyingObstacleChance: 0.25, // Ridotto per non frustrare
        powerUpChance: 0.03 // Ridotto da 0.05
    },

    // Impostazioni Power-Up
    powerUps: {
        types: [{
            id: 'pizza',
            width: 20,
            height: 20,
            y: [85, 115, 140],
            sprite: 'images/PizzaPowerUp.png',
            points: 100,
            glowColor: '#FFD700'
        }],
        baseSpawnDelay: 5000, // Aumentato
        minSpawnDelay: 3000
    },

    // Impostazioni Nuvole
    clouds: {
        count: 4,
        minY: 20,
        maxY: 70,
        minWidth: 40,
        maxWidth: 80,
        minHeight: 20,
        maxHeight: 30,
        minSpeed: 0.3,
        maxSpeed: 1.2, // Ridotto per meno distrazione
        sprite: 'images/nuvole.png'
    },

    // Fisica del Gioco
    physics: {
        initialSpeed: 5, // Aumentato da 4
        acceleration: 0.0015, // Aumentato da 0.0008 per progressione migliore
        maxSpeed: 12, // Aumentato da 10
        jumpCooldown: 200, // Ridotto da 250 per più responsività
        mobileSpeedMultiplier: 0.8 // Aumentato da 0.7 per non essere troppo facile
    },

    // Sistema Punteggio
    scoring: {
        pointsPerFrame: 0.03, // Leggermente aumentato
        speedBonus: 0.012, // Aumentato per premiare longevità
        achievementBonus: 100
    },

    // Colori
    colors: {
        background: '#FEFCF8',
        player: '#8B4513',
        ground: '#D2691E',
        groundPattern: '#CD853F',
        obstacles: '#2E8B57',
        clouds: '#F0F8FF',
        text: '#5D2F0F',
        gameOver: 'rgba(93, 47, 15, 0.95)',
        playerAccent: '#FF6B35',
        obstacleAccent: '#228B22'
    },

    // Stati del Gioco
    states: {
        WAITING: 'waiting',
        RUNNING: 'running',
        PAUSED: 'paused', // AGGIUNTO
        CRASHED: 'crashed',
        GAME_OVER: 'game_over'
    },

    // Limiti di sicurezza
    limits: {
        maxParticles: 50,
        maxObstacles: 10,
        maxPowerUps: 5
    }
};

// ============================================================================
// NOMI CASUALI PER GIOCATORI ANONIMI
// ============================================================================
const RANDOM_NAMES = [
    'Marco Lasagna', 'Mario Spaghetti', 'Luca Ravioli', 'Giovanni Carbonara',
    'Alessandro Risotto', 'Francesco Pizza', 'Mattia Parmigiana', 'Andrea Gnocchi',
    'Stefano Bruschetta', 'Davide Focaccia', 'Riccardo Tiramisu', 'Simone Pesto',
    'Federico Panettone', 'Paolo Cannoli', 'Nicola Biscotti', 'Matteo Gelato',
    'Carlo Panini', 'Fabio Espresso', 'Daniele Cappuccino', 'Giorgio Mozzarella',
    'Vincenzo Prosciutto', 'Salvatore Gorgonzola', 'Antonio Ciabatta', 'Lorenzo Cioccolato',
    'Raffaele Panzerotto', 'Emanuele Panzanella', 'Gabriele Farfalle', 'Tommaso Tortellini',
    'Alberto Orecchiette', 'Vittorio Panforte', 'Pietro Stracciatella', 'Danilo Zabaione'
];


// ============================================================================
// CLASSE CARICATORE SPRITE
// ============================================================================
class GameSpriteLoader {
    constructor() {
        this.loadedSprites = new Map();
        this.loadingPromises = new Map();
        this.failedSprites = new Set();
    }

    async loadSprite(key, src) {
        if (this.loadedSprites.has(key)) {
            return this.loadedSprites.get(key);
        }

        if (this.loadingPromises.has(key)) {
            return this.loadingPromises.get(key);
        }

        const loadPromise = new Promise((resolve) => {
            const img = new Image();

            const timeout = setTimeout(() => {
                console.warn(`🎮 [SPRITES] Timeout loading: ${src}`);
                this.failedSprites.add(key);
                this.loadingPromises.delete(key);
                resolve(null);
            }, 5000); // Timeout di 5 secondi

            img.onload = () => {
                clearTimeout(timeout);
                this.loadedSprites.set(key, img);
                this.loadingPromises.delete(key);
                console.log(`🎮 [SPRITES] Loaded: ${key}`);
                resolve(img);
            };

            img.onerror = () => {
                clearTimeout(timeout);
                console.warn(`🎮 [SPRITES] Failed to load: ${src}`);
                this.failedSprites.add(key);
                this.loadingPromises.delete(key);
                resolve(null);
            };

            img.src = src;
        });

        this.loadingPromises.set(key, loadPromise);
        return loadPromise;
    }

    getSprite(key) {
        return this.loadedSprites.get(key) || null;
    }

    hasSprite(key) {
        return this.loadedSprites.has(key) && !this.failedSprites.has(key);
    }

    hasFailed(key) {
        return this.failedSprites.has(key);
    }
}

// ============================================================================
// UTILITÀ DI GIOCO
// ============================================================================
const GameUtils = {
    getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },

    checkCollision(rect1, rect2, tolerance = 4) { // Aumentato da 2 a 4 per essere più fair
        return (
            rect1.x + tolerance < rect2.x + rect2.width - tolerance &&
            rect1.x + rect1.width - tolerance > rect2.x + tolerance &&
            rect1.y + tolerance < rect2.y + rect2.height - tolerance &&
            rect1.y + rect1.height - tolerance > rect2.y + tolerance
        );
    },

    getRandomObstacleType() {
        const types = GAME_CONFIG.obstacles.types;
        const flyingTypes = types.filter(type => type.canFly);
        const groundTypes = types.filter(type => !type.canFly);

        const shouldSpawnFlying = Math.random() < GAME_CONFIG.obstacles.flyingObstacleChance;

        if (shouldSpawnFlying && flyingTypes.length > 0) {
            return flyingTypes[Math.floor(Math.random() * flyingTypes.length)];
        } else {
            return groundTypes[Math.floor(Math.random() * groundTypes.length)];
        }
    },

    getRandomPowerUpType() {
        const types = GAME_CONFIG.powerUps.types;
        return types[Math.floor(Math.random() * types.length)];
    },

    getSpawnDelay(currentSpeed, frameCount) {
        const baseDelay = GAME_CONFIG.obstacles.baseSpawnDelay;
        const minDelay = GAME_CONFIG.obstacles.minSpawnDelay;
        const speedRatio = currentSpeed / GAME_CONFIG.physics.initialSpeed;

        // Progressione più smooth
        const delay = Math.max(minDelay, baseDelay - (speedRatio - 1) * 150);

        // Randomness ridotto per consistenza
        return delay + Math.random() * 200;
    },

    getPowerUpSpawnDelay(currentSpeed) {
        const baseDelay = GAME_CONFIG.powerUps.baseSpawnDelay;
        const minDelay = GAME_CONFIG.powerUps.minSpawnDelay;
        const speedRatio = currentSpeed / GAME_CONFIG.physics.initialSpeed;

        const delay = Math.max(minDelay, baseDelay - (speedRatio - 1) * 100);
        return delay + Math.random() * 400;
    },

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    },

    isPortrait() {
        return window.innerHeight > window.innerWidth;
    },

    getRandomPlayerName() {
        return RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    },

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    // NUOVO: Safe DOM query
    safeQuerySelector(selector) {
        try {
            return document.querySelector(selector);
        } catch (e) {
            console.warn(`🎮 [DOM] Failed to query: ${selector}`);
            return null;
        }
    },

    safeGetElementById(id) {
        try {
            return document.getElementById(id);
        } catch (e) {
            console.warn(`🎮 [DOM] Failed to get element: ${id}`);
            return null;
        }
    }
};

// ============================================================================
// MOTORE DI GIOCO PRINCIPALE
// ============================================================================
class GameEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameState = GAME_CONFIG.states.WAITING;
        this.score = 0;
        this.highScore = 0;
        this.speed = GAME_CONFIG.physics.initialSpeed;
        this.frameCount = 0;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.accumulator = 0; // NUOVO: Per fixed timestep
        this.isMobileDevice = GameUtils.isMobile();

        // Oggetti di gioco
        this.player = {
            x: GAME_CONFIG.player.x,
            y: GAME_CONFIG.player.y,
            width: GAME_CONFIG.player.width,
            height: GAME_CONFIG.player.height,
            velocityY: 0,
            isJumping: false,
            groundY: GAME_CONFIG.player.groundY,
            animationFrame: 0,
            lastAnimationTime: 0
        };

        this.obstacles = [];
        this.powerUps = [];
        this.clouds = [];
        this.particles = [];

        // Timing
        this.lastObstacleTime = 0;
        this.lastPowerUpTime = 0;
        this.lastJumpTime = 0;
        this.lastInputTime = 0;
        this.groundOffset = 0;

        // Mobile e UI
        this.isMobile = GameUtils.isMobile();
        this.orientationAllowed = false;
        this.leaderboard = [];
        this.showSaveScore = false;
        this.newRecord = false;

        // Servizi
        this.translationService = null;
        this.firebaseService = null;
        this.spriteLoader = new GameSpriteLoader();

        // Stato di inizializzazione
        this.isInitialized = false;
        this.isRunning = false;

        this.init();
    }

    async init() {
        console.log('🎮 [GAME] Initializing game engine...');

        try {
            await this.waitForServices();
            this.initCanvas();

            if (!this.canvas || !this.ctx) {
                throw new Error('Canvas initialization failed');
            }

            await this.initializeSprites();
            this.initClouds();
            this.loadHighScore();
            await this.loadLeaderboard();
            this.setupEventListeners();
            this.handleMobileOrientation();
            this.updateUITranslations();
            this.hideLoadingScreen();

            this.isInitialized = true;
            this.startGameLoop();

            console.log('🎮 [GAME] Game engine initialized successfully');
        } catch (error) {
            console.error('🎮 [GAME] Initialization error:', error);
            this.showErrorMessage('Errore di inizializzazione del gioco');
        }
    }

    async waitForServices() {
        const maxWait = 5000; // 5 secondi massimo
        const startTime = Date.now();

        // Attendi servizio traduzioni
        while (!window.translationService?.isLoaded && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (window.translationService?.isLoaded) {
            this.translationService = window.translationService;
            console.log('🎮 [SERVICES] Translation service loaded');
        } else {
            console.warn('🎮 [SERVICES] Translation service not available');
        }

        // Attendi servizio Firebase
        while (!window.firebaseService?.isInitialized && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (window.firebaseService?.isInitialized) {
            this.firebaseService = window.firebaseService;
            console.log('🎮 [SERVICES] Firebase service loaded');
        } else {
            console.warn('🎮 [SERVICES] Firebase service not available');
        }
    }

    async initializeSprites() {
        console.log('🎮 [SPRITES] Loading game sprites...');
        const loadPromises = [];

        // Carica sprite giocatore
        loadPromises.push(
            this.spriteLoader.loadSprite('player_run1', GAME_CONFIG.player.sprites.running[0]),
            this.spriteLoader.loadSprite('player_run2', GAME_CONFIG.player.sprites.running[1]),
            this.spriteLoader.loadSprite('player_jump', GAME_CONFIG.player.sprites.jumping)
        );

        // Carica sprite ostacoli
        GAME_CONFIG.obstacles.types.forEach((obstacleType) => {
            loadPromises.push(
                this.spriteLoader.loadSprite(`obstacle_${obstacleType.id}`, obstacleType.sprite)
            );
        });

        // Carica sprite power-up
        GAME_CONFIG.powerUps.types.forEach((powerUpType) => {
            loadPromises.push(
                this.spriteLoader.loadSprite(`powerup_${powerUpType.id}`, powerUpType.sprite)
            );
        });

        // Carica sprite nuvole
        loadPromises.push(
            this.spriteLoader.loadSprite('cloud', GAME_CONFIG.clouds.sprite)
        );

        await Promise.all(loadPromises);
        console.log('🎮 [SPRITES] Sprites loaded');
    }

    initCanvas() {
        this.canvas = GameUtils.safeGetElementById('gameCanvas');

        if (!this.canvas) {
            console.error('🎮 [GAME] Canvas element not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');

        if (!this.ctx) {
            console.error('🎮 [GAME] Failed to get canvas context');
            return;
        }

        this.canvas.width = GAME_CONFIG.canvas.width;
        this.canvas.height = GAME_CONFIG.canvas.height;

        console.log('🎮 [CANVAS] Canvas initialized');
    }

    initClouds() {
        this.clouds = [];
        for (let i = 0; i < GAME_CONFIG.clouds.count; i++) {
            this.clouds.push({
                x: Math.random() * GAME_CONFIG.canvas.width,
                y: GAME_CONFIG.clouds.minY + Math.random() * (GAME_CONFIG.clouds.maxY - GAME_CONFIG.clouds.minY),
                width: GAME_CONFIG.clouds.minWidth + Math.random() * (GAME_CONFIG.clouds.maxWidth - GAME_CONFIG.clouds.minWidth),
                height: GAME_CONFIG.clouds.minHeight + Math.random() * (GAME_CONFIG.clouds.maxHeight - GAME_CONFIG.clouds.minHeight),
                speed: GAME_CONFIG.clouds.minSpeed + Math.random() * (GAME_CONFIG.clouds.maxSpeed - GAME_CONFIG.clouds.minSpeed)
            });
        }
    }

    setupEventListeners() {
        if (!this.canvas) return;

        // Input canvas
        this.canvas.addEventListener('click', (e) => this.handleInput(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput(e);
        }, { passive: false });

        // Tastiera
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.handleInput(e);
            }

            // NUOVO: Pausa con ESC
            if (e.code === 'Escape' && this.gameState === GAME_CONFIG.states.RUNNING) {
                this.togglePause();
            }
        });

        // Bottoni UI gioco
        const restartBtn = GameUtils.safeGetElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restart());
        }

        const leaderboardBtn = GameUtils.safeGetElementById('leaderboard-btn');
        if (leaderboardBtn) {
            leaderboardBtn.addEventListener('click', () => this.showLeaderboardModal());
        }

        const saveScoreBtn = GameUtils.safeGetElementById('save-score-btn');
        if (saveScoreBtn) {
            saveScoreBtn.addEventListener('click', () => this.saveScore());
        }

        const skipSaveBtn = GameUtils.safeGetElementById('skip-save-btn');
        if (skipSaveBtn) {
            skipSaveBtn.addEventListener('click', () => this.skipSave());
        }

        const useRandomName = GameUtils.safeGetElementById('use-random-name');
        if (useRandomName) {
            useRandomName.addEventListener('click', () => this.useRandomName());
        }

        // Modal classifica
        const playAgainBtn = GameUtils.safeGetElementById('play-again-btn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                this.hideLeaderboardModal();
                this.restart();
            });
        }

        const closeLeaderboard = GameUtils.safeQuerySelector('.close-leaderboard');
        if (closeLeaderboard) {
            closeLeaderboard.addEventListener('click', () => this.hideLeaderboardModal());
        }

        // Selettore lingua
        const languageBtn = GameUtils.safeGetElementById('language-btn-game');
        if (languageBtn) {
            languageBtn.addEventListener('click', () => this.toggleLanguageSelector());
        }

        const closeLanguageSelector = GameUtils.safeQuerySelector('#language-selector-game .close-btn');
        if (closeLanguageSelector) {
            closeLanguageSelector.addEventListener('click', () => this.hideLanguageSelector());
        }

        // Orientamento
        const continuePortrait = GameUtils.safeGetElementById('continue-portrait');
        if (continuePortrait) {
            continuePortrait.addEventListener('click', () => this.allowPortraitMode());
        }

        // Previeni menu contestuale
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Cambio orientamento
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleMobileOrientation(), 100);
        });

        window.addEventListener('resize', () => this.handleMobileOrientation());

        // NUOVO: Visibilità pagina
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.gameState === GAME_CONFIG.states.RUNNING) {
                this.togglePause();
            }
        });

        console.log('🎮 [EVENTS] Event listeners set up');
    }

    // NUOVO: Gestione pausa
    togglePause() {
        if (this.gameState === GAME_CONFIG.states.RUNNING) {
            this.gameState = GAME_CONFIG.states.PAUSED;
            console.log('🎮 [GAME] Paused');
        } else if (this.gameState === GAME_CONFIG.states.PAUSED) {
            this.gameState = GAME_CONFIG.states.RUNNING;
            this.lastTime = performance.now(); // Reset timing
            console.log('🎮 [GAME] Resumed');
        }
    }

    updateUITranslations() {
        if (!this.translationService) return;

        const translations = {
            'game-title': 'game_title',
            'game-subtitle': 'game_subtitle',
            'instructions-title': 'instructions_title',
            'instruction-1': 'instruction_1',
            'instruction-2': 'instruction_2',
            'instruction-3': 'instruction_3',
            'instruction-4': 'instruction_4',
            'score-label': 'score_label',
            'high-score-label': 'high_score_label',
            'speed-label': 'speed_label',
            'game-controls-text': 'game_controls_text',
            'back-to-menu-text': 'back_to_menu_text',
            'game-over-title': 'game_over_title',
            'final-score-text': 'final_score_text',
            'restart-text': 'restart_text',
            'play-again-text': 'play_again',
            'leaderboard-text': 'leaderboard_text',
            'leaderboard-preview-title': 'leaderboard_title',
            'leaderboard-title': 'leaderboard_title',
            'leaderboard-main-title': 'leaderboard_main_title',
            'no-scores-text': 'no_scores_text',
            'save-score-label': 'save_score_label',
            'orientation-title': 'orientation_title',
            'orientation-message': 'orientation_message',
            'orientation-note': 'orientation_note',
            'continue-portrait-text': 'continue_portrait_text',
            'random-name-text': 'random_name_suggestion',
            'no-scores-modal-text': 'no_scores_modal_text'
        };

        Object.entries(translations).forEach(([elementId, translationKey]) => {
            const element = GameUtils.safeGetElementById(elementId);
            if (element) {
                const translation = this.translationService.t(translationKey);
                if (translation && translation !== translationKey) {
                    element.textContent = translation;
                }
            }
        });

        // Aggiorna placeholder
        const playerNameInput = GameUtils.safeGetElementById('player-name');
        if (playerNameInput) {
            const placeholder = this.translationService.t('player_name_placeholder');
            if (placeholder && placeholder !== 'player_name_placeholder') {
                playerNameInput.placeholder = placeholder;
            }
        }

        // Aggiorna testi bottoni con attributo data-translation
        document.querySelectorAll('[data-translation]').forEach(element => {
            const key = element.dataset.translation;
            const translation = this.translationService.t(key);
            if (translation && translation !== key) {
                element.textContent = translation;
            }
        });

        this.updateLanguageSelector();
    }

    hideLoadingScreen() {
        const loadingScreen = GameUtils.safeGetElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
            console.log('🎮 [GAME] Loading screen hidden');
        }
    }

    showErrorMessage(message) {
        const loadingScreen = GameUtils.safeGetElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `<div style="color: red; padding: 20px;">${message}</div>`;
            loadingScreen.style.display = 'flex';
        }
    }

    updateLanguageSelector() {
        if (!this.translationService) return;

        const languageGrid = GameUtils.safeGetElementById('language-grid-game');
        if (!languageGrid) return;

        const availableLanguages = this.translationService.getAvailableLanguagesForUI();
        const currentLang = this.translationService.getCurrentLanguage();

languageGrid.innerHTML = availableLanguages.map(lang => `
    <button class="lang-btn ${lang.code === currentLang ? 'active' : ''}" data-lang="${lang.code}">
        ${lang.flag} ${lang.name}
    </button>
`).join('');


        languageGrid.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const lang = e.target.dataset.lang;
                const success = await this.translationService.changeLanguage(lang);
                if (success) {
                    this.updateUITranslations();
                    this.hideLanguageSelector();
                }
            });
        });
    }

    toggleLanguageSelector() {
        const selector = GameUtils.safeGetElementById('language-selector-game');
        if (selector) {
            selector.classList.toggle('show');
        }
    }

    hideLanguageSelector() {
        const selector = GameUtils.safeGetElementById('language-selector-game');
        if (selector) {
            selector.classList.remove('show');
        }
    }

    handleMobileOrientation() {
        if (!this.isMobile) return;

        const orientationNotice = GameUtils.safeGetElementById('orientation-notice');
        const gameContainer = GameUtils.safeQuerySelector('.game-container');

        if (!orientationNotice || !gameContainer) return;

        this.orientationAllowed = localStorage.getItem('game-portrait-allowed') === 'true';

        if (GameUtils.isPortrait() && !this.orientationAllowed) {
            orientationNotice.classList.remove('hidden');
            gameContainer.classList.remove('portrait-allowed');

            if (this.gameState === GAME_CONFIG.states.RUNNING) {
                this.togglePause();
            }
        } else {
            orientationNotice.classList.add('hidden');
            if (GameUtils.isPortrait()) {
                gameContainer.classList.add('portrait-allowed');
            }
        }
    }

    allowPortraitMode() {
        localStorage.setItem('game-portrait-allowed', 'true');
        this.orientationAllowed = true;
        this.handleMobileOrientation();
    }

    handleInput(e) {
        const now = Date.now();

        // Previeni input multipli rapidi
        if (now - this.lastInputTime < 100) {
            return;
        }
        this.lastInputTime = now;

        if (this.gameState === GAME_CONFIG.states.WAITING) {
            this.start();
        } else if (this.gameState === GAME_CONFIG.states.RUNNING) {
            if (now - this.lastJumpTime > GAME_CONFIG.physics.jumpCooldown) {
                this.jump();
                this.lastJumpTime = now;
            }
        } else if (this.gameState === GAME_CONFIG.states.PAUSED) {
            this.togglePause();
        } else if (this.gameState === GAME_CONFIG.states.GAME_OVER) {
            this.restart();
        }
    }

    start() {
        this.gameState = GAME_CONFIG.states.RUNNING;
        this.score = 0;

        let initialSpeed = GAME_CONFIG.physics.initialSpeed;
        this.speed = this.isMobileDevice ? 
            initialSpeed * GAME_CONFIG.physics.mobileSpeedMultiplier : 
            initialSpeed;

        this.frameCount = 0;
        this.obstacles = [];
        this.powerUps = [];
        this.particles = [];
        this.lastObstacleTime = Date.now();
        this.lastPowerUpTime = Date.now();
        this.lastInputTime = 0;
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.showSaveScore = false;
        this.newRecord = false;

        // Reset giocatore
        this.player.y = this.player.groundY;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.animationFrame = 0;

        console.log('🎮 [GAME] Game started');
    }

    jump() {
        if (!this.player.isJumping) {
            this.player.velocityY = -GAME_CONFIG.player.jumpPower;
            this.player.isJumping = true;
        }
    }

    restart() {
        this.hideGameOver();
        this.hideLeaderboardModal();
        this.gameState = GAME_CONFIG.states.WAITING;
        this.updateUI();
        console.log('🎮 [GAME] Ready to restart');
    }

    startGameLoop() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);

        console.log('🎮 [GAME] Game loop started');
    }

    gameLoop(currentTime) {
        if (!this.isRunning || !this.isInitialized) return;

        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Limita delta time per evitare grandi salti
        this.deltaTime = Math.min(this.deltaTime, 100);

        // Fixed timestep per physics
        this.accumulator += this.deltaTime;
        const fixedDelta = 16.67; // 60 FPS

        while (this.accumulator >= fixedDelta) {
            this.update(fixedDelta);
            this.accumulator -= fixedDelta;
        }

        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        if (this.gameState !== GAME_CONFIG.states.RUNNING) return;

        this.frameCount++;

        // Aggiorna punteggio (protetto da valori negativi)
        const scoreIncrease = GAME_CONFIG.scoring.pointsPerFrame + (this.speed * GAME_CONFIG.scoring.speedBonus);
        this.score = Math.max(0, this.score + scoreIncrease);

        // Aggiorna velocità con progressione più smooth
        let baseSpeed = Math.min(
            GAME_CONFIG.physics.maxSpeed,
            GAME_CONFIG.physics.initialSpeed + (this.frameCount * GAME_CONFIG.physics.acceleration)
        );

        this.speed = this.isMobileDevice ? 
            baseSpeed * GAME_CONFIG.physics.mobileSpeedMultiplier : 
            baseSpeed;

        // Aggiorna oggetti di gioco
        this.updatePlayer(deltaTime);
        this.updateObstacles(deltaTime);
        this.updatePowerUps(deltaTime);
        this.updateClouds(deltaTime);
        this.updateParticles(deltaTime);

        // Genera nuovi oggetti
        this.spawnObstacles();
        this.spawnPowerUps();

        // Controlla collisioni
        this.checkCollisions();

        // Aggiorna animazione terreno (con protezione da precision errors)
        this.groundOffset = (this.groundOffset + this.speed) % 20;

        // Aggiorna UI
        this.updateUI();
    }

    updatePlayer(deltaTime) {
        if (this.player.isJumping) {
            this.player.velocityY += GAME_CONFIG.player.gravity;
            this.player.y += this.player.velocityY;

            if (this.player.y >= this.player.groundY) {
                this.player.y = this.player.groundY;
                this.player.velocityY = 0;
                this.player.isJumping = false;
            }
        }

        // Aggiorna animazione corsa
        if (!this.player.isJumping && Date.now() - this.player.lastAnimationTime > GAME_CONFIG.player.sprites.animationSpeed) {
            this.player.animationFrame = (this.player.animationFrame + 1) % 2;
            this.player.lastAnimationTime = Date.now();
        }
    }

    updateObstacles(deltaTime) {
        this.obstacles = this.obstacles.filter(obstacle => {
            const moveSpeed = this.speed;
            obstacle.x -= moveSpeed;

            // Aggiorna ostacoli volanti con movimento più prevedibile
            if (obstacle.canFly) {
                obstacle.flyOffset = (obstacle.flyOffset || 0) + obstacle.flySpeed * deltaTime;
                obstacle.y = obstacle.baseY + Math.sin(obstacle.flyOffset) * obstacle.flyAmplitude;
            }

            return obstacle.x + obstacle.width > -50; // Buffer per rimozione
        });

        // Limita numero ostacoli
        if (this.obstacles.length > GAME_CONFIG.limits.maxObstacles) {
            this.obstacles = this.obstacles.slice(-GAME_CONFIG.limits.maxObstacles);
        }
    }

    updatePowerUps(deltaTime) {
        this.powerUps = this.powerUps.filter(powerUp => {
            const moveSpeed = this.speed;
            powerUp.x -= moveSpeed;

            // Aggiorna animazione bagliore
            powerUp.glowOffset = (powerUp.glowOffset || 0) + 0.1;
            powerUp.currentGlow = 0.3 + (Math.sin(powerUp.glowOffset) + 1) / 2 * 0.7;

            return powerUp.x + powerUp.width > -50;
        });

        // Limita numero power-ups
        if (this.powerUps.length > GAME_CONFIG.limits.maxPowerUps) {
            this.powerUps = this.powerUps.slice(-GAME_CONFIG.limits.maxPowerUps);
        }
    }

    updateClouds(deltaTime) {
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;

            if (cloud.x + cloud.width < 0) {
                cloud.x = GAME_CONFIG.canvas.width;
                cloud.y = GAME_CONFIG.clouds.minY + Math.random() * (GAME_CONFIG.clouds.maxY - GAME_CONFIG.clouds.minY);
            }
        });
    }

    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.life -= deltaTime;
            particle.alpha = GameUtils.clamp(particle.life / particle.maxLife, 0, 1);

            return particle.life > 0;
        });

        // Limita numero particelle per performance
        if (this.particles.length > GAME_CONFIG.limits.maxParticles) {
            this.particles = this.particles.slice(-GAME_CONFIG.limits.maxParticles);
        }
    }

    spawnObstacles() {
        const now = Date.now();
        let spawnDelay = GameUtils.getSpawnDelay(this.speed, this.frameCount);

        if (this.isMobileDevice) {
            spawnDelay *= 1.2; // Aumentato delay per mobile
        }

        // Assicura distanza minima dall'ultimo ostacolo
        const lastObstacle = this.obstacles[this.obstacles.length - 1];
        const minDistance = GAME_CONFIG.obstacles.minDistance;

        if (lastObstacle && (GAME_CONFIG.canvas.width - lastObstacle.x) < minDistance) {
            return;
        }

        if (now - this.lastObstacleTime > spawnDelay) {
            const obstacleType = GameUtils.getRandomObstacleType();

            const obstacle = {
                ...obstacleType,
                x: GAME_CONFIG.canvas.width,
                baseY: Array.isArray(obstacleType.y) ? 
                    obstacleType.y[Math.floor(Math.random() * obstacleType.y.length)] : 
                    obstacleType.y,
                flyOffset: 0,
                flySpeed: obstacleType.flySpeed || 0,
                flyAmplitude: obstacleType.flyAmplitude || 0
            };

            obstacle.y = obstacle.baseY;
            this.obstacles.push(obstacle);
            this.lastObstacleTime = now;
        }
    }

    spawnPowerUps() {
        const now = Date.now();
        let spawnDelay = GameUtils.getPowerUpSpawnDelay(this.speed);

        if (this.isMobileDevice) {
            spawnDelay *= 1.3;
        }

        if (now - this.lastPowerUpTime > spawnDelay && Math.random() < GAME_CONFIG.obstacles.powerUpChance) {
            const powerUpType = GameUtils.getRandomPowerUpType();

            const powerUp = {
                ...powerUpType,
                x: GAME_CONFIG.canvas.width,
                y: Array.isArray(powerUpType.y) ? 
                    powerUpType.y[Math.floor(Math.random() * powerUpType.y.length)] : 
                    powerUpType.y,
                glowOffset: 0,
                currentGlow: 1
            };

            this.powerUps.push(powerUp);
            this.lastPowerUpTime = now;
        }
    }

    checkCollisions() {
        // Controlla collisioni ostacoli
        for (let obstacle of this.obstacles) {
            if (GameUtils.checkCollision(this.player, obstacle)) {
                this.gameOver();
                return;
            }
        }

        // Controlla collisioni power-up
        this.powerUps = this.powerUps.filter(powerUp => {
            if (GameUtils.checkCollision(this.player, powerUp, 0)) { // No tolerance per power-ups
                this.collectPowerUp(powerUp);
                return false;
            }
            return true;
        });
    }

    collectPowerUp(powerUp) {
        this.score = Math.max(0, this.score + powerUp.points);

        // Crea particelle di raccolta
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: powerUp.x + powerUp.width / 2,
                y: powerUp.y + powerUp.height / 2,
                velocityX: (Math.random() - 0.5) * 4,
                velocityY: (Math.random() - 0.5) * 4,
                life: 1000,
                maxLife: 1000,
                alpha: 1,
                color: powerUp.glowColor
            });
        }
    }

    gameOver() {
        if (this.gameState !== GAME_CONFIG.states.RUNNING) return;

        this.gameState = GAME_CONFIG.states.GAME_OVER;

        // Controlla nuovo record
        const finalScore = Math.floor(this.score);

        if (finalScore > this.highScore) {
            this.highScore = finalScore;
            this.saveHighScore();
            this.newRecord = true;
            this.showSaveScore = true;
        } else if (this.shouldShowSaveScore()) {
            this.showSaveScore = true;
        }

        this.showGameOver();
        console.log(`🎮 [GAME] Game Over - Score: ${finalScore}`);
    }

    shouldShowSaveScore() {
        const currentScore = Math.floor(this.score);
        return this.leaderboard.length < 10 || 
               currentScore > (this.leaderboard[this.leaderboard.length - 1]?.score || 0);
    }

    showGameOver() {
        const gameOver = GameUtils.safeGetElementById('gameOver');
        const finalScore = GameUtils.safeGetElementById('finalScore');
        const saveScoreSection = GameUtils.safeGetElementById('save-score-section');
        const defaultButtons = GameUtils.safeGetElementById('default-buttons');

        if (gameOver) gameOver.classList.add('show');
        if (finalScore) finalScore.textContent = Math.floor(this.score);

        if (this.showSaveScore) {
            if (saveScoreSection) saveScoreSection.style.display = 'block';
            if (defaultButtons) defaultButtons.style.display = 'none';
            this.generateRandomName();
        } else {
            if (saveScoreSection) saveScoreSection.style.display = 'none';
            if (defaultButtons) defaultButtons.style.display = 'flex';
        }
    }

    hideGameOver() {
        const gameOver = GameUtils.safeGetElementById('gameOver');
        if (gameOver) gameOver.classList.remove('show');
    }

    generateRandomName() {
        const randomNameBtn = GameUtils.safeGetElementById('use-random-name');
        if (randomNameBtn) {
            const randomName = GameUtils.getRandomPlayerName();
            randomNameBtn.textContent = randomName;
            randomNameBtn.dataset.name = randomName;
        }
    }

    useRandomName() {
        const randomNameBtn = GameUtils.safeGetElementById('use-random-name');
        const playerNameInput = GameUtils.safeGetElementById('player-name');

        if (randomNameBtn && playerNameInput) {
            playerNameInput.value = randomNameBtn.dataset.name || GameUtils.getRandomPlayerName();
        }
    }

    async saveScore() {
        const playerNameInput = GameUtils.safeGetElementById('player-name');
        const playerName = playerNameInput?.value.trim() || 'Giocatore Anonimo';

        const scoreEntry = {
            name: playerName,
            score: Math.floor(this.score),
            date: new Date().toLocaleDateString('it-IT'),
            timestamp: Date.now()
        };

        this.leaderboard.push(scoreEntry);
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 10);

        await this.saveLeaderboard();
        this.updateLeaderboardDisplay();

        const saveScoreSection = GameUtils.safeGetElementById('save-score-section');
        const defaultButtons = GameUtils.safeGetElementById('default-buttons');

        if (saveScoreSection) saveScoreSection.style.display = 'none';
        if (defaultButtons) defaultButtons.style.display = 'flex';

        console.log(`🎮 [LEADERBOARD] Score saved: ${playerName} - ${scoreEntry.score}`);
    }

    skipSave() {
        const saveScoreSection = GameUtils.safeGetElementById('save-score-section');
        const defaultButtons = GameUtils.safeGetElementById('default-buttons');

        if (saveScoreSection) saveScoreSection.style.display = 'none';
        if (defaultButtons) defaultButtons.style.display = 'flex';
    }

    showLeaderboardModal() {
        const modal = GameUtils.safeGetElementById('leaderboard-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.updateLeaderboardModal();
        }
    }

    hideLeaderboardModal() {
        const modal = GameUtils.safeGetElementById('leaderboard-modal');
        if (modal) modal.style.display = 'none';
    }

    updateLeaderboardModal() {
        const leaderboardList = GameUtils.safeGetElementById('leaderboard-list');
        const noScoresModal = GameUtils.safeGetElementById('no-scores-modal');

        if (!leaderboardList) return;

        if (this.leaderboard.length === 0) {
            leaderboardList.style.display = 'none';
            if (noScoresModal) noScoresModal.style.display = 'block';
            return;
        }

        leaderboardList.style.display = 'block';
        if (noScoresModal) noScoresModal.style.display = 'none';

        leaderboardList.innerHTML = this.leaderboard.map((entry, index) => {
            const rankClass = index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : '';
            return `
                <div class="leaderboard-entry ${rankClass}">
                    <div class="rank">#${index + 1}</div>
                    <div class="name">${entry.name}</div>
                    <div class="score">${entry.score}</div>
                </div>
            `;
        }).join('');
    }

    updateLeaderboardDisplay() {
        const leaderboardDiv = GameUtils.safeGetElementById('leaderboard');
        const noScores = GameUtils.safeGetElementById('no-scores');

        if (!leaderboardDiv) return;

        if (this.leaderboard.length === 0) {
            leaderboardDiv.innerHTML = '';
            if (noScores) noScores.style.display = 'block';
            return;
        }

        if (noScores) noScores.style.display = 'none';

        leaderboardDiv.innerHTML = this.leaderboard.slice(0, 5).map((entry, index) => `
            <div class="leaderboard-entry">
                <span class="rank">#${index + 1}</span>
                <span class="name">${entry.name}</span>
                <span class="score">${entry.score}</span>
            </div>
        `).join('');
    }

    loadHighScore() {
        try {
            const saved = localStorage.getItem('barrino-highscore');
            this.highScore = saved ? parseInt(saved, 10) : 0;
            console.log(`🎮 [STORAGE] High score loaded: ${this.highScore}`);
        } catch (e) {
            console.warn('🎮 [STORAGE] Failed to load high score:', e);
            this.highScore = 0;
        }
    }

    saveHighScore() {
        try {
            localStorage.setItem('barrino-highscore', this.highScore.toString());
            console.log(`🎮 [STORAGE] High score saved: ${this.highScore}`);
        } catch (e) {
            console.warn('🎮 [STORAGE] Failed to save high score:', e);
        }
    }

    async loadLeaderboard() {
        try {
            // Prova a caricare da Firebase prima
            if (this.firebaseService) {
                const firebaseLeaderboard = await this.firebaseService.getGameLeaderboard();
                if (firebaseLeaderboard && firebaseLeaderboard.length > 0) {
                    this.leaderboard = firebaseLeaderboard;
                    console.log(`🎮 [FIREBASE] Leaderboard loaded: ${this.leaderboard.length} entries`);
                    return;
                }
            }

            // Fallback a localStorage
            const saved = localStorage.getItem('barrino-leaderboard');
            this.leaderboard = saved ? JSON.parse(saved) : [];
            console.log(`🎮 [STORAGE] Leaderboard loaded: ${this.leaderboard.length} entries`);
        } catch (e) {
            console.warn('🎮 [STORAGE] Failed to load leaderboard:', e);
            this.leaderboard = [];
        }

        this.updateLeaderboardDisplay();
    }

    async saveLeaderboard() {
        try {
            // Salva su localStorage
            localStorage.setItem('barrino-leaderboard', JSON.stringify(this.leaderboard));
            console.log('🎮 [STORAGE] Leaderboard saved locally');

            // Prova a salvare su Firebase
            if (this.firebaseService) {
                await this.firebaseService.saveLeaderboard(this.leaderboard);
                console.log('🎮 [FIREBASE] Leaderboard synced');
            }
        } catch (e) {
            console.warn('🎮 [STORAGE] Failed to save leaderboard:', e);
        }
    }

    updateUI() {
        const scoreEl = GameUtils.safeGetElementById('score');
        const highScoreEl = GameUtils.safeGetElementById('highScore');
        const speedEl = GameUtils.safeGetElementById('speed');

        if (scoreEl) scoreEl.textContent = Math.floor(this.score);
        if (highScoreEl) highScoreEl.textContent = this.highScore;
        if (speedEl) speedEl.textContent = this.speed.toFixed(1);
    }

    // ============================================================================
    // RENDERING
    // ============================================================================

    render() {
        if (!this.ctx || !this.canvas) return;

        // Sfondo
        this.ctx.fillStyle = GAME_CONFIG.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Nuvole
        this.renderClouds();

        // Terreno
        this.renderGround();

        // Ostacoli
        this.renderObstacles();

        // Power-ups
        this.renderPowerUps();

        // Particelle
        this.renderParticles();

        // Giocatore
        this.renderPlayer();

        // Testo di attesa/pausa
        if (this.gameState === GAME_CONFIG.states.WAITING) {
            this.renderWaitingText();
        } else if (this.gameState === GAME_CONFIG.states.PAUSED) {
            this.renderPausedText();
        }
    }

    renderPlayer() {
        let sprite;

        if (this.player.isJumping) {
            sprite = this.spriteLoader.getSprite('player_jump');
        } else {
            const frameKey = this.player.animationFrame === 0 ? 'player_run1' : 'player_run2';
            sprite = this.spriteLoader.getSprite(frameKey);
        }

        if (sprite && this.spriteLoader.hasSprite(sprite === this.spriteLoader.getSprite('player_jump') ? 'player_jump' : 'player_run1')) {
            this.ctx.drawImage(
                sprite,
                this.player.x,
                this.player.y,
                this.player.width,
                this.player.height
            );
        } else {
            // Fallback rendering
            this.ctx.fillStyle = GAME_CONFIG.colors.player;
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

            this.ctx.fillStyle = GAME_CONFIG.colors.playerAccent;
            this.ctx.fillRect(this.player.x + 5, this.player.y + 5, 10, 10);
        }
    }

    renderObstacles() {
        this.obstacles.forEach(obstacle => {
            const sprite = this.spriteLoader.getSprite(`obstacle_${obstacle.id}`);

            if (sprite && this.spriteLoader.hasSprite(`obstacle_${obstacle.id}`)) {
                this.ctx.drawImage(
                    sprite,
                    obstacle.x,
                    obstacle.y,
                    obstacle.width,
                    obstacle.height
                );
            } else {
                // Fallback rendering
                this.ctx.fillStyle = GAME_CONFIG.colors.obstacles;
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

                this.ctx.fillStyle = GAME_CONFIG.colors.obstacleAccent;
                this.ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, obstacle.height - 10);
            }
        });
    }

    renderPowerUps() {
        this.powerUps.forEach(powerUp => {
            const sprite = this.spriteLoader.getSprite(`powerup_${powerUp.id}`);

            // Bagliore
            this.ctx.save();
            this.ctx.globalAlpha = powerUp.currentGlow * 0.4;
            this.ctx.fillStyle = powerUp.glowColor;
            this.ctx.beginPath();
            this.ctx.arc(
                powerUp.x + powerUp.width / 2,
                powerUp.y + powerUp.height / 2,
                powerUp.width * 0.8,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            this.ctx.restore();

            // Sprite
            if (sprite && this.spriteLoader.hasSprite(`powerup_${powerUp.id}`)) {
                this.ctx.drawImage(
                    sprite,
                    powerUp.x,
                    powerUp.y,
                    powerUp.width,
                    powerUp.height
                );
            } else {
                // Fallback rendering
                this.ctx.fillStyle = powerUp.glowColor;
                this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
            }
        });
    }

    renderClouds() {
        const sprite = this.spriteLoader.getSprite('cloud');

        this.clouds.forEach(cloud => {
            if (sprite && this.spriteLoader.hasSprite('cloud')) {
                this.ctx.globalAlpha = 0.6;
                this.ctx.drawImage(sprite, cloud.x, cloud.y, cloud.width, cloud.height);
                this.ctx.globalAlpha = 1.0;
            } else {
                // Fallback rendering
                this.ctx.fillStyle = GAME_CONFIG.colors.clouds;
                this.ctx.globalAlpha = 0.6;
                this.ctx.fillRect(cloud.x, cloud.y, cloud.width, cloud.height);
                this.ctx.globalAlpha = 1.0;
            }
        });
    }

    renderGround() {
        // Terreno principale
        this.ctx.fillStyle = GAME_CONFIG.colors.ground;
        this.ctx.fillRect(
            GAME_CONFIG.ground.x,
            GAME_CONFIG.ground.y,
            GAME_CONFIG.ground.width,
            GAME_CONFIG.ground.height
        );

        // Pattern terreno
        this.ctx.fillStyle = GAME_CONFIG.colors.groundPattern;
        for (let x = -this.groundOffset; x < GAME_CONFIG.canvas.width; x += 20) {
            this.ctx.fillRect(x, GAME_CONFIG.ground.y, 10, GAME_CONFIG.ground.height);
        }
    }

    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    renderWaitingText() {
        this.ctx.save();
        this.ctx.fillStyle = GAME_CONFIG.colors.text;
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            'Tocca per iniziare',
            this.canvas.width / 2,
            this.canvas.height / 2
        );
        this.ctx.restore();
    }

    renderPausedText() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSA', this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.font = '16px Arial';
        this.ctx.fillText('Tocca per riprendere', this.canvas.width / 2, this.canvas.height / 2 + 40);
        this.ctx.restore();
    }

    // ============================================================================
    // CLEANUP
    // ============================================================================

    destroy() {
        this.isRunning = false;
        this.isInitialized = false;

        // Rimuovi event listeners
        if (this.canvas) {
            this.canvas.removeEventListener('click', this.handleInput);
            this.canvas.removeEventListener('touchstart', this.handleInput);
        }

        console.log('🎮 [GAME] Game engine destroyed');
    }
}

// ============================================================================
// INIZIALIZZAZIONE GLOBALE
// ============================================================================

let gameEngine = null;

// Inizializza quando DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        gameEngine = new GameEngine();
        window.gameEngine = gameEngine;
    });
} else {
    gameEngine = new GameEngine();
    window.gameEngine = gameEngine;
}

// Esporta per uso esterno
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameEngine, GAME_CONFIG, GameUtils };
}

console.log('🎮 [GAME] Game mechanics loaded - v2.0.0');