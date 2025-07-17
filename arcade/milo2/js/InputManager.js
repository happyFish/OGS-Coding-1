class InputManager {
    constructor() {
        this.keys = {};
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', e => this.keys[e.key.toLowerCase()] = true);
        document.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);
    }

    isKeyPressed(key) {
        return !!this.keys[key];
    }

    getKeys() {
        return this.keys;
    }
} 