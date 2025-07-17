const character = document.querySelector('.character');
const container = document.getElementById('game-container');

let x = 100;
let y = 0;
const speed = 10;

function updatePosition() {
    character.style.left = x + 'px';
    character.style.bottom = y + 'px';
}

// Ensure the character starts at the right position
updatePosition();

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        x = Math.max(0, x - speed);
    } else if (e.key === 'ArrowRight') {
        x = Math.min(container.offsetWidth - character.offsetWidth, x + speed);
    } else if (e.key === 'ArrowUp') {
        y = Math.min(container.offsetHeight - character.offsetHeight, y + speed);
    } else if (e.key === 'ArrowDown') {
        y = Math.max(0, y - speed);
    }
    updatePosition();
});