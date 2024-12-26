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

// Configuración inicial
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
        get xOffset() { return player.width * 0.3; },
        get yOffset() { return player.height * 0.15; },
        get width() { return player.width * 0.4; },
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
    bombSpeed: 2,
    pointSpeed: 2,
    spawnRate: 0.02,
};

/** Función para cargar imágenes */
function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

/** Ajustar tamaño dinámico del canvas */
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

/** Dibujar elementos básicos del juego */
function drawBackground() {
    ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
    ctx.drawImage(images.player, player.x, player.y, player.width, player.height);
}

function drawScore() {
    ctx.font = `${canvas.width * 0.05}px Arial`;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(`Puntaje: ${gameData.score}`, canvas.width / 2, canvas.height * 0.1);
}

/** Dibujar cajas de colisión para depuración */
function drawCollisionBox(obj, color = 'red') {
    const box = getCollisionBox(obj);
    ctx.strokeStyle = color;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
}

/** Crear objetos que caen */
function createFallingObject(array, type) {
    const size = canvas.width * 0.08;
    const x = Math.random() * (canvas.width - size);
    array.push({
        x,
        y: 0,
        width: size,
        height: size,
        type,
        collisionBox: {
            xOffset: size * 0.28,
            yOffset: size * 0.2,
            width: size * 0.5,
            height: size * 0.5,
        },
    });
}

/** Mover objetos que caen */
function moveFallingObjects(array, speed, isPoint = false) {
    array.forEach((obj, index) => {
        obj.y += speed;
        if (obj.y > canvas.height) {
            if (isPoint) gameData.missedPoints++;
            array.splice(index, 1);
        }
    });
}

/** Dibujar objetos */
function drawFallingObjects(array, type) {
    array.forEach(obj => {
        const image = type === "bomb" ? images.bomb : images.point;
        ctx.drawImage(image, obj.x, obj.y, obj.width, obj.height);
    });
}

/** Obtener la caja de colisión de un objeto */
function getCollisionBox(obj) {
    return {
        x: obj.x + (obj.collisionBox?.xOffset || 0),
        y: obj.y + (obj.collisionBox?.yOffset || 0),
        width: (obj.collisionBox?.width || obj.width),
        height: (obj.collisionBox?.height || obj.height),
    };
}

/** Detectar colisión precisa entre dos objetos */
function detectCollision(obj1, obj2) {
    const box1 = getCollisionBox(obj1);
    const box2 = getCollisionBox(obj2);

    return (
        box1.x < box2.x + box2.width &&
        box1.x + box1.width > box2.x &&
        box1.y < box2.y + box2.height &&
        box1.y + box1.height > box2.y
    );
}

/** Verificar colisiones */
function checkCollisions() {
    gameData.points.forEach((point, index) => {
        if (detectCollision(player, point)) {
            gameData.score += 10;
            gameData.points.splice(index, 1);
        }
    });

    gameData.bombs.forEach((bomb, index) => {
        if (detectCollision(player, bomb)) {
            endGame('¡Perdiste! Fuiste golpeado por una bomba.');
        }
    });
}

/** Ajustar dificultad */
function adjustDifficulty() {
    const score = gameData.score;

    if (score < 100) {
        difficulty.bombSpeed = 2;
        difficulty.pointSpeed = 2;
        difficulty.spawnRate = 0.02;
    } else if (score < 200) {
        difficulty.bombSpeed = 3;
        difficulty.pointSpeed = 3;
        difficulty.spawnRate = 0.03;
    } else if (score < 300) {
        difficulty.bombSpeed = 4;
        difficulty.pointSpeed = 4;
        difficulty.spawnRate = 0.04;
    } else if (score < 500) {
        difficulty.bombSpeed = 5;
        difficulty.pointSpeed = 5;
        difficulty.spawnRate = 0.05;
    } else {
        difficulty.bombSpeed = 6;
        difficulty.pointSpeed = 6;
        difficulty.spawnRate = 0.06;
    }
}

/** Actualizar el juego */
function updateGame() {
    drawBackground();
    drawScore();
    drawPlayer();

    drawFallingObjects(gameData.bombs, "bomb");
    drawFallingObjects(gameData.points, "point");

    moveFallingObjects(gameData.bombs, difficulty.bombSpeed);
    moveFallingObjects(gameData.points, difficulty.pointSpeed, true);

    checkCollisions();

    // Ajustar dificultad según el puntaje
    adjustDifficulty();

    if (Math.random() < difficulty.spawnRate) createFallingObject(gameData.bombs, "bomb");
    if (Math.random() < difficulty.spawnRate) createFallingObject(gameData.points, "point");
}

/** Terminar el juego */
function endGame(message) {
    clearInterval(gameData.gameInterval);
    alert(message);
    window.location.href = `gameover.html?score=${gameData.score}`;
}

/** Reiniciar el juego */
function resetGame() {
    gameData.bombs = [];
    gameData.points = [];
    gameData.score = 0;
    gameData.missedPoints = 0;
}

/** Manejo de eventos */
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

/** Inicializar juego */
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);
