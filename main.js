const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game Instellingen
const gravity = 0.5;

// Arena (Platform)
const stage = {
    x: 150,
    y: 350,
    width: 500,
    height: 40,
};

// Speler Klasse
class Player {
    constructor(x, y, color, controls) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.percentage = 0;
        this.isGrounded = false;
        this.controls = controls;
    }

    update() {
        // Zwaartekracht
        this.vy += gravity;
        this.x += this.vx;
        this.y += this.vy;

        // Wrijving op de grond
        if (this.isGrounded) {
            this.vx *= 0.8;
        } else {
            this.vx *= 0.95; // Luchtweerstand
        }

        // Bodem/Platform Collision
        if (
            this.x + this.width > stage.x &&
            this.x < stage.x + stage.width &&
            this.y + this.height <= stage.y + 10 &&
            this.y + this.height + this.vy >= stage.y
        ) {
            this.y = stage.y - this.height;
            this.vy = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }

        // Ring Out (Doodgaan en respawn)
        if (this.y > canvas.height || this.x < 0 || this.x > canvas.width) {
            this.x = canvas.width / 2;
            this.y = 100;
            this.vx = 0;
            this.vy = 0;
            this.percentage = 0;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    jump() {
        if (this.isGrounded) {
            this.vy = -12;
        }
    }

    attack(opponent) {
        // Simpele hitbox check (vlak voor de speler)
        let hitzone = 50;
        if (Math.abs(this.x - opponent.x) < hitzone && Math.abs(this.y - opponent.y) < hitzone) {
            opponent.percentage += 15;
            // Kockback berekening op basis van percentage
            let direction = this.x < opponent.x ? 1 : -1;
            opponent.vx = direction * (5 + opponent.percentage * 0.15);
            opponent.vy = -3 - (opponent.percentage * 0.1);
        }
    }
}

// Spelers Aanmaken
const p1 = new Player(200, 200, "red", { left: "KeyA", right: "KeyD", up: "KeyW", attack: "KeyF" });
const p2 = new Player(560, 200, "blue", { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", attack: "Period" });

// Input Handling
const keys = {};
window.addEventListener("keydown", (e) => { keys[e.code] = true; });
window.addEventListener("keyup", (e) => { keys[e.code] = false; });

function handleInput(player, opponent) {
    if (keys[player.controls.left]) player.vx = -5;
    if (keys[player.controls.right]) player.vx = 5;
    if (keys[player.controls.up]) player.jump();
    if (keys[player.controls.attack]) {
        player.attack(opponent);
        keys[player.controls.attack] = false; // Voorkom spammen
    }
}

// UI Updaten
function updateUI() {
    document.getElementById("p1-ui").innerText = `Speler 1: ${p1.percentage}%`;
    document.getElementById("p2-ui").innerText = `Speler 2: ${p2.percentage}%`;
}

// Game Loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Inputs verwerken
    handleInput(p1, p2);
    handleInput(p2, p1);

    // Updaten
    p1.update();
    p2.update();

    // Tekenen
    // Stage
    ctx.fillStyle = "#555";
    ctx.fillRect(stage.x, stage.y, stage.width, stage.height);

    // Spelers
    p1.draw();
    p2.draw();

    updateUI();

    requestAnimationFrame(gameLoop);
}

gameLoop();
