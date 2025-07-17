class Character {
    constructor(name, position, health) {
        this.name = name;
        this.position = position; // { x: number, y: number }
        this.health = health;
    }

    move(direction) {
        switch (direction) {
            case 'left':
                this.position.x -= 1;
                break;
            case 'right':
                this.position.x += 1;
                break;
            case 'up':
                this.position.y -= 1;
                break;
            case 'down':
                this.position.y += 1;
                break;
        }
    }

    jump() {
        // Logic for jumping
        this.position.y -= 2; // Example jump height
    }

    attack() {
        // Logic for attacking
        console.log(`${this.name} attacks!`);
    }
}

export default Character;