const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");

const startScreen = document.getElementById("startScreen");
const pauseScreen = document.getElementById("pauseScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const pauseBtn = document.getElementById("pauseBtn");
const continueBtn = document.getElementById("continueBtn");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const levelElement = document.getElementById("level");
const livesElement = document.getElementById("lives");
const finalScoreElement = document.getElementById("finalScore");

const comboElement = document.getElementById("combo");
const levelUpElement = document.getElementById("levelUp");

let score = 0;
let lives = 3;
let level = 1;
let combo = 0;

let playerX = 50;
let isPlaying = false;
let isPaused = false;

let objects = [];
let lastTime = 0;
let spawnTimer = 0;
let coinTimer = 0;
let animationId;

let highScore = Number(localStorage.getItem("neonDodgeHighScore")) || 0;

highScoreElement.textContent = highScore;

const keys = {
    left: false,
    right: false
};

function startGame() {
    score = 0;
    lives = 3;
    level = 1;
    combo = 0;
    playerX = 50;

    isPlaying = true;
    isPaused = false;

    objects.forEach(object => object.element.remove());
    objects = [];

    startScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    scoreElement.textContent = score;
    livesElement.textContent = lives;
    levelElement.textContent = level;

    player.style.left = `${playerX}%`;

    lastTime = performance.now();

    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(gameLoop);
}

function gameLoop(time) {
    if (!isPlaying) {
        return;
    }

    if (isPaused) {
        animationId = requestAnimationFrame(gameLoop);
        return;
    }

    const deltaTime = time - lastTime;
    lastTime = time;

    updatePlayer();
    spawnObjects(deltaTime);
    updateObjects(deltaTime);

    animationId = requestAnimationFrame(gameLoop);
}

function updatePlayer() {
    const speed = 0.65;

    if (keys.left) {
        playerX -= speed * 1.5;
    }

    if (keys.right) {
        playerX += speed * 1.5;
    }

    playerX = Math.max(5, Math.min(95, playerX));

    player.style.left = `${playerX}%`;
}

function spawnObjects(deltaTime) {
    spawnTimer += deltaTime;
    coinTimer += deltaTime;

    const meteorDelay = Math.max(280, 850 - level * 55);

    if (spawnTimer >= meteorDelay) {
        spawnMeteor();
        spawnTimer = 0;
    }

    if (coinTimer >= 1700) {
        spawnCoin();
        coinTimer = 0;
    }
}

function spawnMeteor() {
    const meteor = document.createElement("div");

    const size = Math.floor(Math.random() * 28) + 30;
    const x = Math.random() * 92 + 4;

    meteor.classList.add("meteor");
    meteor.style.width = `${size}px`;
    meteor.style.height = `${size}px`;
    meteor.style.left = `${x}%`;
    meteor.style.top = "-60px";

    gameArea.appendChild(meteor);

    objects.push({
        element: meteor,
        type: "meteor",
        x: x,
        y: -60,
        size: size,
        speed: 150 + level * 25 + Math.random() * 80
    });
}

function spawnCoin() {
    const coin = document.createElement("div");

    const x = Math.random() * 90 + 5;

    coin.classList.add("coin");
    coin.style.left = `${x}%`;
    coin.style.top = "-40px";

    gameArea.appendChild(coin);

    objects.push({
        element: coin,
        type: "coin",
        x: x,
        y: -40,
        size: 28,
        speed: 120 + level * 15
    });
}

function updateObjects(deltaTime) {
    const gameHeight = gameArea.clientHeight;

    objects.forEach((object, index) => {
        object.y += object.speed * deltaTime / 1000;

        object.element.style.top = `${object.y}px`;

        if (checkCollision(object)) {
            if (object.type === "meteor") {
                hitMeteor(object);
            } else {
                collectCoin(object);
            }

            object.element.remove();
            objects.splice(index, 1);
            return;
        }

        if (object.y > gameHeight + 80) {
            object.element.remove();
            objects.splice(index, 1);

            if (object.type === "meteor") {
                score += 2;
                updateScore();
            }
        }
    });
}

function checkCollision(object) {
    const playerRect = player.getBoundingClientRect();
    const objectRect = object.element.getBoundingClientRect();

    const padding = 7;

    return !(
        playerRect.right - padding < objectRect.left ||
        playerRect.left + padding > objectRect.right ||
        playerRect.bottom - padding < objectRect.top ||
        playerRect.top + padding > objectRect.bottom
    );
}

function hitMeteor(object) {
    lives--;
    combo = 0;

    livesElement.textContent = lives;

    createExplosion(
        object.element.getBoundingClientRect().left,
        object.element.getBoundingClientRect().top
    );

    player.style.filter = "brightness(3)";

    setTimeout(() => {
        player.style.filter = "";
    }, 150);

    if (lives <= 0) {
        endGame();
    }
}

function collectCoin(object) {
    combo++;

    const bonus = 15 + combo * 5;

    score += bonus;

    createExplosion(
        object.element.getBoundingClientRect().left,
        object.element.getBoundingClientRect().top
    );

    showCombo(bonus);

    updateScore();
}

function updateScore() {
    scoreElement.textContent = score;

    const newLevel = Math.floor(score / 100) + 1;

    if (newLevel > level) {
        level = newLevel;
        levelElement.textContent = level;
        showLevelUp();
    }
}

function showCombo(points) {
    comboElement.textContent = `+${points} ✦`;

    comboElement.classList.remove("show");

    void comboElement.offsetWidth;

    comboElement.classList.add("show");
}

function showLevelUp() {
    levelUpElement.textContent = `LEVEL ${level} 🚀`;

    levelUpElement.classList.remove("show");

    void levelUpElement.offsetWidth;

    levelUpElement.classList.add("show");
}

function createExplosion(x, y) {
    const rect = gameArea.getBoundingClientRect();

    const centerX = x - rect.left;
    const centerY = y - rect.top;

    for (let i = 0; i < 12; i++) {
        const particle = document.createElement("div");

        particle.classList.add("particle");

        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;

        particle.style.setProperty(
            "--x",
            `${(Math.random() - 0.5) * 100}px`
        );

        particle.style.setProperty(
            "--y",
            `${(Math.random() - 0.5) * 100}px`
        );

        gameArea.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, 500);
    }
}

function endGame() {
    isPlaying = false;

    cancelAnimationFrame(animationId);

    finalScoreElement.textContent = score;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("neonDodgeHighScore", highScore);
        highScoreElement.textContent = highScore;
    }

    gameOverScreen.classList.remove("hidden");
}

function togglePause() {
    if (!isPlaying) {
        return;
    }

    isPaused = !isPaused;

    if (isPaused) {
        pauseScreen.classList.remove("hidden");
        pauseBtn.textContent = "▶";
    } else {
        pauseScreen.classList.add("hidden");
        pauseBtn.textContent = "Ⅱ";
        lastTime = performance.now();
    }
}

function setLeft(value) {
    keys.left = value;
}

function setRight(value) {
    keys.right = value;
}

document.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        keys.left = true;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        keys.right = true;
    }

    if (event.code === "Space") {
        togglePause();
    }
});

document.addEventListener("keyup", event => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        keys.left = false;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        keys.right = false;
    }
});

leftBtn.addEventListener("mousedown", () => setLeft(true));
leftBtn.addEventListener("mouseup", () => setLeft(false));
leftBtn.addEventListener("mouseleave", () => setLeft(false));

rightBtn.addEventListener("mousedown", () => setRight(true));
rightBtn.addEventListener("mouseup", () => setRight(false));
rightBtn.addEventListener("mouseleave", () => setRight(false));

leftBtn.addEventListener("touchstart", event => {
    event.preventDefault();
    setLeft(true);
});

leftBtn.addEventListener("touchend", event => {
    event.preventDefault();
    setLeft(false);
});

rightBtn.addEventListener("touchstart", event => {
    event.preventDefault();
    setRight(true);
});

rightBtn.addEventListener("touchend", event => {
    event.preventDefault();
    setRight(false);
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

pauseBtn.addEventListener("click", togglePause);
continueBtn.addEventListener("click", togglePause);
