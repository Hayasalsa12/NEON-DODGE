const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");

// Mengambil screen yang digunakan dalam game
const startScreen = document.getElementById("startScreen");
const pauseScreen = document.getElementById("pauseScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

// Mengambil tombol-tombol game
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const pauseBtn = document.getElementById("pauseBtn");
const continueBtn = document.getElementById("continueBtn");

// Mengambil tombol kontrol kiri dan kanan
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

// Mengambil bagian statistik game
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const levelElement = document.getElementById("level");
const livesElement = document.getElementById("lives");
const finalScoreElement = document.getElementById("finalScore");

// Mengambil elemen combo dan level up
const comboElement = document.getElementById("combo");
const levelUpElement = document.getElementById("levelUp");

// SISTEM SUARA
// Membuat suara langsung dari JavaScript tanpa file audio
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContextClass();

function playSound(type) {
    // Mengaktifkan audio jika browser masih menahannya
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    // Menentukan karakter suara berdasarkan kejadian
    if (type === "coin") {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(700, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            1200,
            audioContext.currentTime + 0.1
        );
    } else if (type === "hit") {
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(180, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            60,
            audioContext.currentTime + 0.25
        );
    } else if (type === "level") {
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            1000,
            audioContext.currentTime + 0.2
        );
    } else if (type === "gameover") {
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            80,
            audioContext.currentTime + 0.5
        );
    }

    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.4
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.4);
}

// Nilai awal permainan
let score = 0;
let lives = 3;
let level = 1;
let combo = 0;

// Posisi awal pesawat dan status game
let playerX = 50;
let isPlaying = false;
let isPaused = false;

// Menyimpan objek meteor dan koin
let objects = [];

let lastTime = 0;
let spawnTimer = 0;
let coinTimer = 0;
let animationId;

// Mengambil high score yang tersimpan di browser
let highScore = Number(localStorage.getItem("neonDodgeHighScore")) || 0;

// Menampilkan high score
highScoreElement.textContent = highScore;

// Menyimpan status tombol kiri dan kanan
const keys = {
    left: false,
    right: false
};

// FUNGSI MEMULAI GAME
function startGame() {
    // Mengaktifkan audio setelah tombol Start/Restart ditekan
    audioContext.resume();

    // Mengembalikan nilai game ke kondisi awal
    score = 0;
    lives = 3;
    level = 1;
    combo = 0;
    playerX = 50;

    // Mengubah status game menjadi berjalan
    isPlaying = true;
    isPaused = false;

    // Menghapus meteor dan koin dari game sebelumnya
    objects.forEach(object => object.element.remove());
    objects = [];

    // Menyembunyikan semua screen
    startScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    // Mengatur tampilan statistik kembali ke awal
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    levelElement.textContent = level;

    // Mengembalikan posisi pesawat ke tengah
    player.style.left = `${playerX}%`;

    // Menentukan waktu awal game
    lastTime = performance.now();

    // Menjalankan game loop
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(gameLoop);
}

// GAME LOOP
// Fungsi yang terus menjalankan proses game
function gameLoop(time) {
    // Jika game tidak sedang berjalan, hentikan
    if (!isPlaying) {
        return;
    }

    // Jika game sedang pause, jangan memperbarui objek
    if (isPaused) {
        animationId = requestAnimationFrame(gameLoop);
        return;
    }

    // Menghitung waktu antar frame
    const deltaTime = time - lastTime;
    lastTime = time;

    // Memperbarui pesawat
    updatePlayer();

    // Membuat meteor dan koin
    spawnObjects(deltaTime);

    // Menggerakkan objek dan mengecek tabrakan
    updateObjects(deltaTime);

    // Menjalankan game loop kembali
    animationId = requestAnimationFrame(gameLoop);
}

// MENGATUR PERGERAKAN PESAWAT
function updatePlayer() {
    const speed = 0.65;

    // Bergerak ke kiri
    if (keys.left) {
        playerX -= speed * 1.5;
    }

    // Bergerak ke kanan
    if (keys.right) {
        playerX += speed * 1.5;
    }

    // Membatasi pesawat agar tidak keluar area game
    playerX = Math.max(5, Math.min(95, playerX));

    // Mengubah posisi pesawat
    player.style.left = `${playerX}%`;
}

// MENGATUR KEMUNCULAN METEOR DAN KOIN
function spawnObjects(deltaTime) {
    spawnTimer += deltaTime;
    coinTimer += deltaTime;

    // Semakin tinggi level, jeda meteor semakin pendek
    const meteorDelay = Math.max(280, 850 - level * 55);

    // Membuat meteor jika waktunya sudah mencapai delay
    if (spawnTimer >= meteorDelay) {
        spawnMeteor();
        spawnTimer = 0;
    }

    // Membuat koin setiap 1700 milidetik
    if (coinTimer >= 1700) {
        spawnCoin();
        coinTimer = 0;
    }
}

// MEMBUAT METEOR
function spawnMeteor() {
    // Membuat elemen div baru untuk meteor
    const meteor = document.createElement("div");

    // Menentukan ukuran dan posisi meteor secara acak
    const size = Math.floor(Math.random() * 28) + 30;
    const x = Math.random() * 92 + 4;

    // Memberikan class dan posisi kepada meteor
    meteor.classList.add("meteor");
    meteor.style.width = `${size}px`;
    meteor.style.height = `${size}px`;
    meteor.style.left = `${x}%`;
    meteor.style.top = "-60px";

    // Memasukkan meteor ke area game
    gameArea.appendChild(meteor);

    // Menyimpan data meteor ke dalam array objects
    objects.push({
        element: meteor,
        type: "meteor",
        x: x,
        y: -60,
        size: size,

        // Kecepatan meteor dipengaruhi oleh level
        speed: 150 + level * 25 + Math.random() * 80
    });
}

// MEMBUAT KOIN
function spawnCoin() {
    const coin = document.createElement("div");

    // Menentukan posisi koin secara acak
    const x = Math.random() * 90 + 5;

    coin.classList.add("coin");
    coin.style.left = `${x}%`;
    coin.style.top = "-40px";

    // Memasukkan koin ke area game
    gameArea.appendChild(coin);

    // Menyimpan data koin
    objects.push({
        element: coin,
        type: "coin",
        x: x,
        y: -40,
        size: 28,

        // Kecepatan koin
        speed: 120 + level * 15
    });
}

// MENGGERAKKAN METEOR DAN KOIN
function updateObjects(deltaTime) {
    const gameHeight = gameArea.clientHeight;

    objects.forEach((object, index) => {
        // Mengubah posisi objek ke bawah
        object.y += object.speed * deltaTime / 1000;

        // Memperbarui posisi objek di layar
        object.element.style.top = `${object.y}px`;

        // Mengecek apakah objek bertabrakan dengan pesawat
        if (checkCollision(object)) {
            // Jika meteor mengenai pesawat
            if (object.type === "meteor") {
                hitMeteor(object);

            // Jika objek adalah koin
            } else {
                collectCoin(object);
            }

            // Menghapus objek setelah terkena
            object.element.remove();
            objects.splice(index, 1);
            return;
        }

        // Jika objek sudah melewati bagian bawah game
        if (object.y > gameHeight + 80) {
            object.element.remove();
            objects.splice(index, 1);

            // Jika meteor berhasil dihindari
            if (object.type === "meteor") {
                score += 2;
                updateScore();
            }
        }
    });
}

// MENGECEK TABRAKAN
function checkCollision(object) {
    // Mengambil ukuran dan posisi pesawat
    const playerRect = player.getBoundingClientRect();

    // Mengambil ukuran dan posisi objek
    const objectRect = object.element.getBoundingClientRect();

    const padding = 7;

    // Mengembalikan true jika terjadi tabrakan
    return !(
        playerRect.right - padding < objectRect.left ||
        playerRect.left + padding > objectRect.right ||
        playerRect.bottom - padding < objectRect.top ||
        playerRect.top + padding > objectRect.bottom
    );
}

// KETIKA PESAWAT TERKENA METEOR
function hitMeteor(object) {
    // Mengurangi nyawa
    lives--;

    // Memainkan suara saat terkena meteor
    playSound("hit");

    // Combo kembali menjadi 0
    combo = 0;

    // Memperbarui tampilan nyawa
    livesElement.textContent = lives;

    // Membuat efek ledakan
    createExplosion(
        object.element.getBoundingClientRect().left,
        object.element.getBoundingClientRect().top
    );

    // Membuat pesawat terlihat berkedip
    player.style.filter = "brightness(3)";

    setTimeout(() => {
        player.style.filter = "";
    }, 150);

    // Jika nyawa habis, game berakhir
    if (lives <= 0) {
        endGame();
    }
}

// KETIKA PESAWAT MENGAMBIL KOIN
function collectCoin(object) {
    // Menambah combo
    combo++;

    // Memainkan suara saat mengambil coin
    playSound("coin");

    // Menghitung bonus berdasarkan combo
    const bonus = 15 + combo * 5;

    // Menambahkan bonus ke skor
    score += bonus;

    // Membuat efek ketika koin diambil
    createExplosion(
        object.element.getBoundingClientRect().left,
        object.element.getBoundingClientRect().top
    );

    // Menampilkan jumlah bonus
    showCombo(bonus);

    // Memperbarui skor
    updateScore();
}

// MEMPERBARUI SCORE DAN LEVEL
function updateScore() {
    scoreElement.textContent = score;

    // Setiap 100 poin, level bertambah
    const newLevel = Math.floor(score / 100) + 1;

    // Jika level baru lebih tinggi
    if (newLevel > level) {
        level = newLevel;
        levelElement.textContent = level;

        // Memainkan suara saat naik level
        playSound("level");

        // Menampilkan animasi level naik
        showLevelUp();
    }
}

// MENAMPILKAN BONUS COMBO
function showCombo(points) {
    comboElement.textContent = `+${points} ✦`;

    // Menghapus animasi sebelumnya
    comboElement.classList.remove("show");

    // Memaksa browser membaca perubahan
    void comboElement.offsetWidth;

    // Menjalankan animasi combo
    comboElement.classList.add("show");
}

// MENAMPILKAN LEVEL UP
function showLevelUp() {
    levelUpElement.textContent = `LEVEL ${level} 🚀`;

    // Menghapus animasi sebelumnya
    levelUpElement.classList.remove("show");

    // Memaksa browser membaca perubahan
    void levelUpElement.offsetWidth;

    // Menjalankan animasi level up
    levelUpElement.classList.add("show");
}

// MEMBUAT EFEK LEDAKAN / PARTIKEL
function createExplosion(x, y) {
    const rect = gameArea.getBoundingClientRect();

    // Menentukan posisi ledakan di dalam game area
    const centerX = x - rect.left;
    const centerY = y - rect.top;

    // Membuat 12 partikel
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement("div");

        particle.classList.add("particle");

        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;

        // Menentukan arah gerak partikel secara acak
        particle.style.setProperty(
            "--x",
            `${(Math.random() - 0.5) * 100}px`
        );

        particle.style.setProperty(
            "--y",
            `${(Math.random() - 0.5) * 100}px`
        );

        // Memasukkan partikel ke game
        gameArea.appendChild(particle);

        // Menghapus partikel setelah 500ms
        setTimeout(() => {
            particle.remove();
        }, 500);
    }
}

// MENGAKHIRI GAME
function endGame() {
    // Menghentikan status permainan
    isPlaying = false;

    // Memainkan suara Game Over
    playSound("gameover");

    // Menghentikan game loop
    cancelAnimationFrame(animationId);

    // Menampilkan skor akhir
    finalScoreElement.textContent = score;

    // Mengecek apakah skor menjadi high score baru
    if (score > highScore) {
        highScore = score;

        // Menyimpan high score di browser
        localStorage.setItem("neonDodgeHighScore", highScore);

        // Menampilkan high score baru
        highScoreElement.textContent = highScore;
    }

    // Menampilkan layar Game Over
    gameOverScreen.classList.remove("hidden");
}

// MENGATUR PAUSE / LANJUT GAME
function togglePause() {
    // Tidak bisa pause jika game belum dimulai
    if (!isPlaying) {
        return;
    }

    // Mengubah status pause
    isPaused = !isPaused;

    if (isPaused) {
        // Menampilkan layar pause
        pauseScreen.classList.remove("hidden");

        // Mengubah tombol menjadi Play
        pauseBtn.textContent = "▶";
    } else {
        // Menyembunyikan layar pause
        pauseScreen.classList.add("hidden");

        // Mengubah tombol kembali menjadi Pause
        pauseBtn.textContent = "Ⅱ";

        // Mengatur ulang waktu agar game berjalan normal
        lastTime = performance.now();
    }
}

// Mengatur tombol kiri
function setLeft(value) {
    keys.left = value;
}

// Mengatur tombol kanan
function setRight(value) {
    keys.right = value;
}

// KONTROL KEYBOARD
document.addEventListener("keydown", event => {
    // Arrow Left atau A untuk bergerak ke kiri
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        keys.left = true;
    }

    // Arrow Right atau D untuk bergerak ke kanan
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        keys.right = true;
    }

    // Space untuk pause
    if (event.code === "Space") {
        togglePause();
    }
});

// Ketika tombol keyboard dilepas
document.addEventListener("keyup", event => {
    // Menghentikan gerakan ke kiri
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        keys.left = false;
    }

    // Menghentikan gerakan ke kanan
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        keys.right = false;
    }
});

// KONTROL MOUSE
leftBtn.addEventListener("mousedown", () => setLeft(true));
leftBtn.addEventListener("mouseup", () => setLeft(false));
leftBtn.addEventListener("mouseleave", () => setLeft(false));

rightBtn.addEventListener("mousedown", () => setRight(true));
rightBtn.addEventListener("mouseup", () => setRight(false));
rightBtn.addEventListener("mouseleave", () => setRight(false));

// KONTROL TOUCHSCREEN
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

// TOMBOL START DAN RESTART
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

// TOMBOL PAUSE DAN CONTINUE
pauseBtn.addEventListener("click", togglePause);
continueBtn.addEventListener("click", togglePause);