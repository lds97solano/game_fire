import { auth, ref, set, database } from './firebase-config.js';

// Selección de elementos del DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');

// Configuración de imágenes
const images = {
    bomb: loadImage("Assets/bomb.png"),
    point: loadImage("Assets/point.png"),
    background: loadImage("Assets/background.png"),
    player: loadImage("Assets/Caracter.png"),
};

// Configuración inicial del canvas y jugador
const canvasConfig = {
    maxWidth: 600,
    maxHeight: 400,
    minWidth: 200,
    minHeight: 300,
};

const player = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    speed: 0,
    collisionBox: {
        get xOffset() { return player.width * 0.2; },
        get yOffset() { return player.height * 0.28; },
        get width() { return player.width * 0.6; },
        get height() { return player.height * 0.4; },
    },
};

const gameData = {
    bombs: [],
    points: [],
    score: 0,
    missedPoints: 0,
    gameInterval: null,
};

const difficulty = {
    bombSpeed: 2, // Velocidad inicial de las bombas
    pointSpeed: 2, // Velocidad inicial de los puntos
    spawnRate: 0.02, // Probabilidad de generación por frame
};

// Función para cargar imágenes
function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

// Ajustar tamaño del canvas
function resizeCanvas() {
    canvas.width = Math.max(
        Math.min(window.innerWidth * 0.8, canvasConfig.maxWidth),
        canvasConfig.minWidth
    );
    canvas.height = Math.max(
        Math.min(window.innerHeight * 0.6, canvasConfig.maxHeight),
        canvasConfig.minHeight
    );

    player.width = canvas.width * 0.2;
    player.height = canvas.height * 0.18;
    player.speed = canvas.width * 0.02;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 10;
}

// Dibujar fondo
function drawBackground() {
    ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
}

// Dibujar jugador
function drawPlayer() {
    ctx.drawImage(images.player, player.x, player.y, player.width, player.height);
}

// Dibujar puntaje
function drawScore() {
    ctx.font = `${canvas.width * 0.05}px Arial`;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(`Puntaje: ${gameData.score}`, canvas.width / 2, canvas.height * 0.1);
}

// Generar un nuevo punto
function spawnPoint() {
    const point = {
        x: Math.random() * (canvas.width - canvas.width * 0.08),
        y: -canvas.height * 0.08,
        width: canvas.width * 0.08,
        height: canvas.height * 0.08,
    };
    gameData.points.push(point);
}

// Generar una nueva bomba
function spawnBomb() {
    const bomb = {
        x: Math.random() * (canvas.width - canvas.width * 0.05),
        y: -canvas.height * 0.08,
        width: canvas.width * 0.08,
        height: canvas.height * 0.1,
    };
    gameData.bombs.push(bomb);
}

// Guardar puntaje a través del servidor
async function saveScore(score) {
    try {
        const user = auth.currentUser;

        if (!user) {
            throw new Error("Usuario no autenticado.");
        }

        // Obtener el token de autenticación
        const idToken = await user.getIdToken();

        // Enviar el puntaje al servidor
        const response = await fetch('http://localhost:3000/update-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ score }),
        });

        const result = await response.json();
        console.log(result.message);
    } catch (error) {
        console.error("Error al guardar el puntaje:", error);
    }
}

// Terminar juego
async function endGame(message) {
    clearInterval(gameData.gameInterval);
    alert(message);

    console.log('Guardando puntaje en el servidor...');
    await saveScore(gameData.score);

    window.location.href = `gameover.html?score=${gameData.score}`;
}

// Actualizar el juego
function updateGame() {
    // Ajustar dificultad gradualmente según el puntaje
    difficulty.bombSpeed = 2 + gameData.score / 100; // Velocidad base 2, aumenta cada 100 puntos
    difficulty.pointSpeed = 2 + gameData.score / 150; // Velocidad de puntos aumenta más lento
    difficulty.spawnRate = Math.min(0.02 + gameData.score / 5000, 0.1); // Incremento gradual hasta 10%

    // Dibujar fondo y jugador
    drawBackground();
    drawPlayer();

    // Actualizar y dibujar bombas
    for (let i = 0; i < gameData.bombs.length; i++) {
        const bomb = gameData.bombs[i];
        bomb.y += difficulty.bombSpeed;

        ctx.drawImage(images.bomb, bomb.x, bomb.y, bomb.width, bomb.height);

        if (
            bomb.y + bomb.height > player.y + player.collisionBox.yOffset &&
            bomb.y < player.y + player.collisionBox.yOffset + player.collisionBox.height &&
            bomb.x + bomb.width > player.x + player.collisionBox.xOffset &&
            bomb.x < player.x + player.collisionBox.xOffset + player.collisionBox.width
        ) {
            endGame('¡Game Over! Has sido alcanzado por una bomba.');
            return;
        }

        if (bomb.y > canvas.height) {
            gameData.bombs.splice(i, 1);
            i--;
        }
    }

    // Actualizar y dibujar puntos
    for (let i = 0; i < gameData.points.length; i++) {
        const point = gameData.points[i];
        point.y += difficulty.pointSpeed;

        ctx.drawImage(images.point, point.x, point.y, point.width, point.height);

        if (
            point.y + point.height > player.y + player.collisionBox.yOffset &&
            point.x + point.width > player.x + player.collisionBox.xOffset &&
            point.x < player.x + player.collisionBox.xOffset + player.collisionBox.width
        ) {
            gameData.score += 5; // Incrementar puntaje en 5
            gameData.points.splice(i, 1);
            i--;
            continue;
        }

        if (point.y > canvas.height) {
            gameData.points.splice(i, 1);
            i--;
            gameData.missedPoints++;
        }
    }

    // Dibujar el puntaje
    drawScore();

    // Generar puntos y bombas aleatoriamente
    if (Math.random() < difficulty.spawnRate) {
        spawnPoint();
    }
    if (Math.random() < difficulty.spawnRate) {
        spawnBomb();
    }
}

// Reiniciar juego
function resetGame() {
    gameData.bombs = [];
    gameData.points = [];
    gameData.score = 0;
    gameData.missedPoints = 0;
}

// Manejo de eventos
canvas.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX - canvas.offsetLeft;
    player.x = Math.max(0, Math.min(mouseX - player.width / 2, canvas.width - player.width));
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touchX = e.touches[0].clientX - canvas.offsetLeft;
    player.x = Math.max(0, Math.min(touchX - player.width / 2, canvas.width - player.width));
});

startButton.addEventListener('click', () => {
    resizeCanvas();
    resetGame();
    gameData.gameInterval = setInterval(updateGame, 20);
});

// Inicializar juego
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);
