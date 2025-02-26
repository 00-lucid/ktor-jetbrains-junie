// Game constants
const GAME_DURATION = 60; // seconds
const DISC_COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00']; // red, green, blue, yellow
const TRAP_COLOR = '#000000'; // black for trap disc
const DISC_RADIUS = 20;
const DISC_SPAWN_INTERVAL = 1000; // spawn new disc every second
const POINTS = {
    '#FF0000': 10,  // red
    '#00FF00': 20,  // green
    '#0000FF': 30,  // blue
    '#FFFF00': 40,  // yellow
    '#000000': -50  // trap (black)
};

// Game variables
let canvas, ctx;
let gameRunning = false;
let timeRemaining = GAME_DURATION;
let score = 0;
let discs = [];
let spawnInterval;
let timerInterval;

// Initialize game
window.onload = function() {
    console.log("window.onload started");
    canvas = document.getElementById('gameCanvas');
    console.log("Canvas element:", canvas);

    if (canvas) {
        console.log("Canvas dimensions:", canvas.width, "x", canvas.height);
        ctx = canvas.getContext('2d');
        console.log("Canvas context:", ctx ? "obtained" : "failed");
    } else {
        console.error("Canvas element not found!");
    }

    // Add event listeners
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');

    if (startButton) {
        console.log("Adding click listener to startButton");
        startButton.addEventListener('click', startGame);
    } else {
        console.error("Start button not found!");
    }

    if (restartButton) {
        console.log("Adding click listener to restartButton");
        restartButton.addEventListener('click', restartGame);
    } else {
        console.error("Restart button not found!");
    }

    if (canvas) {
        console.log("Adding click listener to canvas");
        canvas.addEventListener('click', handleShot);
    }
};

// Disc class
class Disc {
    constructor() {
        this.radius = DISC_RADIUS;
        this.x = Math.random() * (canvas.width - 2 * this.radius) + this.radius;
        this.y = Math.random() * (canvas.height - 2 * this.radius) + this.radius;
        // 10% chance for trap disc
        this.color = Math.random() < 0.1 ? TRAP_COLOR : DISC_COLORS[Math.floor(Math.random() * DISC_COLORS.length)];
        this.speedX = (Math.random() - 0.5) * 4;
        this.speedY = (Math.random() - 0.5) * 4;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce off walls
        if (this.x - this.radius <= 0 || this.x + this.radius >= canvas.width) {
            this.speedX = -this.speedX;
        }
        if (this.y - this.radius <= 0 || this.y + this.radius >= canvas.height) {
            this.speedY = -this.speedY;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    containsPoint(x, y) {
        const hitRadius = this.radius * 1.5; // 50% larger hit detection area
        const distance = Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2);
        return distance <= hitRadius;
    }
}

function startGame() {
    console.log('startGame function called');

    // Initialize game state
    console.log('Initializing game state');
    gameRunning = true;
    timeRemaining = GAME_DURATION;
    score = 0;
    discs = [];
    console.log('Game state initialized:', { gameRunning, timeRemaining, score });

    // Hide UI elements
    console.log('Updating UI elements visibility');
    const startButton = document.getElementById('startButton');
    const finalScore = document.getElementById('finalScore');
    const instructions = document.getElementById('instructions');

    if (startButton && finalScore && instructions) {
        // First fade out
        startButton.style.display = 'none';
        finalScore.style.display = 'none';
        instructions.classList.add('game-started');
        console.log('UI elements fading out');

        // Then hide after transition
        setTimeout(() => {
            startButton.style.display = 'none';
            finalScore.style.display = 'none';
            console.log('UI elements hidden successfully');
        }, 300); // Match the transition duration in CSS
    } else {
        console.error('Some UI elements not found:', {
            startButton: !!startButton,
            finalScore: !!finalScore,
            instructions: !!instructions
        });
    }

    // Update score display
    console.log('Updating initial score display');
    updateScore();

    // Start spawning discs
    console.log('Setting up spawn interval');
    spawnInterval = setInterval(spawnDisc, DISC_SPAWN_INTERVAL);
    console.log('Spawn interval set:', DISC_SPAWN_INTERVAL, 'ms');

    // Start timer
    console.log('Setting up timer interval');
    timerInterval = setInterval(updateTimer, 1000);
    console.log('Timer interval set');

    // Start game loop
    console.log('Initializing game loop');
    requestAnimationFrame(gameLoop);
    console.log('Game loop started');
}

function restartGame() {
    document.getElementById('restartButton').style.display = 'none';
    startGame();
}

function spawnDisc() {
    if (gameRunning) {
        discs.push(new Disc());
    }
}

function updateTimer() {
    timeRemaining--;
    document.getElementById('timer').textContent = `Time: ${timeRemaining}s`;

    if (timeRemaining <= 0) {
        endGame();
    }
}

function updateScore() {
    document.getElementById('score').textContent = `Score: ${score}`;
}

function handleShot(event) {
    if (!gameRunning) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check for hits in reverse order (to handle overlapping discs from newest to oldest)
    for (let i = discs.length - 1; i >= 0; i--) {
        if (discs[i].containsPoint(x, y)) {
            // Add points based on color
            score += POINTS[discs[i].color];
            updateScore();

            // Remove hit disc
            discs.splice(i, 1);
            break;
        }
    }
}

function gameLoop() {
    if (!gameRunning) {
        console.log('Game loop stopped: gameRunning is false');
        return;
    }

    // Clear canvas
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
        console.error('Canvas or context not available in game loop');
        gameRunning = false;
        return;
    }

    // Update and draw discs
    if (discs.length > 0) {
        console.log('Updating and drawing', discs.length, 'discs');
    }
    discs.forEach(disc => {
        disc.update();
        disc.draw();
    });

    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    clearInterval(spawnInterval);
    clearInterval(timerInterval);

    // Show final score, restart button, and instructions
    const finalScoreElement = document.getElementById('finalScore');
    const restartButton = document.getElementById('restartButton');
    const instructions = document.getElementById('instructions');

    // Set content and make elements visible but transparent
    finalScoreElement.textContent = `Game Over!\nFinal Score: ${score}`;
    finalScoreElement.style.display = 'block';
    restartButton.style.display = 'block';

    // Remove game-started class from instructions to show it again
    instructions.classList.remove('game-started');

    // Force a reflow to ensure the display change takes effect
    finalScoreElement.offsetHeight;
    restartButton.offsetHeight;

    // Fade in elements
    setTimeout(() => {
        finalScoreElement.style.opacity = '1';
        restartButton.style.opacity = '1';
    }, 50);

    // Clear all discs
    discs = [];
}
