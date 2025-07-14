const names = [
    "Adamo", "Felix", "Gabe", "Hudson",
    "Lex", "Luca", "Miles", "Milo", "Oliver"
];

const container = document.querySelector('.arcade-container');

names.forEach(name => {
    const machine = document.createElement('div');
    machine.className = 'arcade-machine';
    machine.innerHTML = `<h2>${name}</h2>`;
    container.appendChild(machine);
});