class Arcade {
    constructor() {
        this.container = document.querySelector('.arcade-container');
        this.machines = document.querySelector('.machines');
        this.iframe = document.createElement('iframe');

        this.container.appendChild(this.iframe);

        this.init();
    }

    init() {
        this.createMachines();
    }

    loadMachine(name) {
        // Read all the html files in the ${name} directory
        const gameUrl = `./${name.toLowerCase()}/`;
        const iframe = document.querySelector('iframe');
        iframe.src = `${gameUrl}`;
        this.container.classList.add('machine');
    }

    createMachines() {
        const names = [
            "Adamo", "Felix", "Gabe", "Hudson",
            "Lex", "Luca", "Miles", "Milo", "Oliver",
            "Chris"
        ];

        names.forEach(name => {
            const machine = document.createElement('div');
            machine.className = 'arcade-machine';
            machine.innerHTML = `<h2>${name}</h2>`;
            this.machines.appendChild(machine);

            machine.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.arcade-machine').forEach(m => m.classList.remove('active'));
                machine.classList.add('active');
                this.loadMachine(name);
            });
        });
    }
};

const arcade = new Arcade();