const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gravity = 0.5;

let gameState = "MENU";
let isCPUGame = false;
let projectielen = [];

const stage = { x: 150, y: 350, width: 500, height: 40 };

// Basis Speler Klasse
class Player {
    constructor(x, y, color, type, controls) {
        this.x = x; this.y = y;
        this.width = 40; this.height = 60;
        this.color = color; this.type = type;
        this.vx = 0; this.vy = 0;
        this.percentage = 0;
        this.isGrounded = false;
        this.controls = controls;
        this.facing = 1; // 1 = rechts, -1 = links
    }

    update() {
        this.vy += gravity;
        this.x += this.vx;
        this.y += this.vy;

        if (this.vx > 0.1) this.facing = 1;
        if (this.vx < -0.1) this.facing = -1;

        this.vx *= this.isGrounded ? 0.8 : 0.95;

        // Platform collision
        if (this.x + this.width > stage.x && this.x < stage.x + stage.width &&
            this.y + this.height <= stage.y + 10 && this.y + this.height + this.vy >= stage.y) {
            this.y = stage.y - this.height; this.vy = 0; this.isGrounded = true;
        } else { this.isGrounded = false; }

        // Respawn (Ring Out)
        if (this.y > canvas.height || this.x < 0 || this.x > canvas.width) {
            this.x = canvas.width / 2; this.y = 100; this.vx = 0; this.vy = 0; this.percentage = 0;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Richtingaanwijzer (wapen)
        ctx.fillStyle = "white";
        ctx.fillRect(this.facing === 1 ? this.x + this.width - 5 : this.x, this.y + 20, 5, 10);
    }

    jump() { if (this.isGrounded) this.vy = -12; }

    attack(opponent) {
        if (this.type === "SwordFighter") {
            if (checkHit(this.x + (this.facing === 1 ? this.width : -40), this.y, 40, this.height, opponent)) {
                applyDamage(opponent, 12, this.facing, 8);
            }
        } 
        else if (this.type === "Brawler") {
            if (checkHit(this.x - 10, this.y, this.width + 20, this.height, opponent)) {
                applyDamage(opponent, 18, this.facing, 12);
            }
        } 
        else if (this.type === "Gunner") {
            projectielen.push({
                x: this.facing === 1 ? this.x + this.width : this.x - 15,
                y: this.y + 25,
                vx: this.facing * 10,
                damage: 8,
                owner: this
            });
        }
    }
}

function checkHit(ax, ay, aw, ah, opponent) {
    return ax < opponent.x + opponent.width && ax + aw > opponent.x &&
           ay < opponent.y + opponent.height && ay + ah > opponent.y;
}

function applyDamage(target, damage, direction, baseKnockback) {
    target.percentage += damage;
    target.vx = direction * (baseKnockback + target.percentage * 0.15);
    target.vy = -4 - (target.percentage * 0.1);
}

// Spelers definiëren (P1 is SwordFighter, P2/CPU is Brawler)
const p1 = new Player(200, 200, "#ff3333", "SwordFighter", { left: "KeyA", right: "KeyD", up: "KeyW", attack: "KeyF" });
const p2 = new Player(560, 200, "#3333ff", "Brawler", { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", attack: "Period" });

// Input regelen via toetsenbord
const keys = {};
window.addEventListener("keydown", (e) => { keys[e.code] = true; });
window.addEventListener("keyup", (e) => { keys[e.code] = false; });

function handleInput() {
    // Speler 1 Besturing (A, D, W, F)
    if (keys[p1.controls.left]) p1.vx = -5;
    if (keys[p1.controls.right]) p1.vx = 5;
    if (keys[p1.controls.up]) p1.jump();
    if (keys[p1.controls.attack]) { p1.attack(p2); keys[p1.controls.attack] = false; }

    // Speler 2 Besturing (Pijltjes + Punt-toets) -> Alleen als het GEEN CPU is
    if (!isCPUGame) {
        if (keys[p2.controls.left]) p2.vx = -5;
        if (keys[p2.controls.right]) p2.vx = 5;
        if (keys[p2.controls.up]) p2.jump();
        if (keys[p2.controls.attack]) { p2.attack(p1); keys[p2.controls.attack] = false; }
    }
}

// Simpele AI voor de CPU
function updateCPU() {
    if (!isCPUGame) return;

    if (p2.x < p1.x - 20) p2.vx = 3;
    else if (p2.x > p1.x + 20) p2.vx = -3;

    if (p1.y < p2.y - 50 && Math.random() < 0.05) p2.jump();

    if (Math.abs(p2.x - p1.x) < 60 && Math.random() < 0.07) {
        p2.attack(p1);
    }
}

// Kogels van de Gunner verwerken
function updateProjectiles() {
    for (let i = projectielen.length - 1; i >= 0; i--) {
        let proj = projectielen[i];
        proj.x += proj.vx;

        ctx.fillStyle = "yellow";
        ctx.fillRect(proj.x, proj.y, 15, 8);

        let target = (proj.owner === p1) ? p2 : p1;
        if (proj.x > target.x && proj.x < target.x + target.width && proj.y > target.y && proj.y < target.y + target.height) {
            applyDamage(target, proj.damage, proj.vx > 0 ? 1 : -1, 5);
            projectielen.splice(i, 1);
            continue;
        }

        if (proj.x < 0 || proj.x > canvas.width) {
            projectielen.splice(i, 1);
        }
    }
}

// Start het spel en activeer de schermen
function startScherm(vsCPU) {
    isCPUGame = vsCPU;
    
    // Verberg menu, toon game elementen
    document.getElementById("menu").style.display = "none";
    canvas.style.display = "block";
    document.getElementById("ui").style.display = "flex";
    
    gameState = "PLAYING";
    gameLoop();
}

// Game Loop
function gameLoop() {
    if (gameState !== "PLAYING") return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    handleInput();
    updateCPU();

    p1.update();
    p2.update();

    // Teken Stage (Platform)
    ctx.fillStyle = "#555";
    ctx.fillRect(stage.x, stage.y, stage.width, stage.height);

    p1.draw();
    p2.draw();
    updateProjectiles();

    // UI percentages updaten
    document.getElementById("p1-ui").innerText = `Speler 1 (${p1.type}): ${p1.percentage}%`;
    document.getElementById("p2-ui").innerText = `${isCPUGame ? 'CPU' : 'Speler 2'} (${p2.type}): ${p2.percentage}%`;

    requestAnimationFrame(gameLoop);
}

// Knoppen activeren via JavaScript Event Listeners (VEILIGER & WERKT ALTIJD)
document.getElementById("btnLocal").addEventListener("click", () => startScherm(false));
document.getElementById("btnCPU").addEventListener("click", () => startScherm(true));
