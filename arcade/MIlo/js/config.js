// Game constants
const GAME_CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 400,
    PLAYER_WIDTH: 40,
    PLAYER_HEIGHT: 80,
    GROUND_Y: 300,
    SPEED: 4,
    JUMP_POWER: 12,
    GRAVITY: 0.7,
    ATTACK_COOLDOWN: 500,
    MAX_HEALTH: 15
};

// Player starting positions and properties
const PLAYER_CONFIG = {
    P1: {
        x: 100,
        y: 300, // GAME_CONFIG.GROUND_Y
        color: "#4af",
        outfitColor: "#2196f3"
    },
    P2: {
        x: 660,
        y: 300, // GAME_CONFIG.GROUND_Y
        color: "#fa4",
        outfitColor: "#888"
    }
};

// Controls mapping
const CONTROLS = {
    P1: {
        LEFT: 'a',
        RIGHT: 'd',
        JUMP: 'w',
        ATTACK: 'f',
        BLOCK: 'q',
        SPECIAL: 'z'
    },
    P2: {
        LEFT: 'arrowleft',
        RIGHT: 'arrowright',
        JUMP: 'arrowup',
        ATTACK: '/',
        BLOCK: 'arrowdown',
        SPECIAL: 'k'
    }
}; 