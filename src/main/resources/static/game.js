// Game constants
const GAME_DURATION = 60; // seconds
const DISC_COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00']; // red, green, blue, yellow
const TRAP_COLOR = '#000000'; // black for trap disc
const BASE_DISC_RADIUS = 20;
const DISC_SPAWN_INTERVAL = 1000; // spawn new disc every second

// Function to calculate scaled disc radius based on screen size
function getScaledDiscRadius() {
    const minDimension = Math.min(canvas.width, canvas.height);
    return Math.max(10, Math.min(BASE_DISC_RADIUS, minDimension / 20));
}
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
let fragments = [];
let spawnInterval;
let timerInterval;

// Physics constants
const GRAVITY = 0.3;
const FRAGMENT_FADE_SPEED = 0.015;
const FRAGMENT_MIN_SPEED = 4;
const FRAGMENT_MAX_SPEED = 7;

class Fragment {
    constructor(x, y, color, angle, speed, parentRadius) {
        this.x = x;
        this.y = y;
        this.color = color;
        // Scale fragment size with parent disc
        this.size = Math.max(3, parentRadius / 4);
        this.opacity = 1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.4;
        // Scale velocity with screen size
        const velocityScale = Math.min(canvas.width, canvas.height) / 800;
        this.velocityX = Math.cos(angle) * speed * velocityScale;
        this.velocityY = Math.sin(angle) * speed * velocityScale;
    }

    update() {
        // Apply physics
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += GRAVITY;
        this.rotation += this.rotationSpeed;
        this.opacity -= FRAGMENT_FADE_SPEED;
        return this.opacity > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;

        // Draw a square instead of a circle for better rotation visibility
        const halfSize = this.size / 2;
        ctx.fillRect(-halfSize, -halfSize, this.size, this.size);

        ctx.restore();
    }
}

// Bonus variables
let bonusColor = null;
let bonusActive = false;
let bonusTimeRemaining = 15;
let bonusTimer = null;

// Function to start a new bonus round
function startBonusRound() {
    if (!gameRunning) return;

    // Select new random color (different from previous)
    let newColor;
    do {
        newColor = DISC_COLORS[Math.floor(Math.random() * DISC_COLORS.length)];
    } while (newColor === bonusColor);

    bonusColor = newColor;
    bonusActive = true;
    bonusTimeRemaining = 15;
    console.log('New bonus round activated:', bonusColor);

    // Create or update bonus display
    let bonusDisplay = document.getElementById('bonusDisplay');
    if (!bonusDisplay) {
        bonusDisplay = document.createElement('div');
        bonusDisplay.id = 'bonusDisplay';
        bonusDisplay.style.position = 'absolute';
        bonusDisplay.style.top = '50px';
        bonusDisplay.style.left = '50%';
        bonusDisplay.style.transform = 'translateX(-50%)';
        bonusDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        bonusDisplay.style.color = 'white';
        bonusDisplay.style.padding = '10px 20px';
        bonusDisplay.style.borderRadius = '5px';
        bonusDisplay.style.zIndex = '100';
        bonusDisplay.style.transition = 'all 0.3s ease';
        bonusDisplay.style.display = 'flex';
        bonusDisplay.style.alignItems = 'center';
        bonusDisplay.style.gap = '10px';
        bonusDisplay.style.pointerEvents = 'none';

        // Create color square
        const colorSquare = document.createElement('div');
        colorSquare.style.width = '30px';
        colorSquare.style.height = '30px';
        colorSquare.style.borderRadius = '6px';
        colorSquare.style.border = '2px solid white';
        colorSquare.style.transition = 'all 0.3s ease';
        colorSquare.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.3)';
        colorSquare.style.transform = 'scale(1)';
        // Add pulsing animation style
        if (!document.getElementById('pulseAnimation')) {
            const style = document.createElement('style');
            style.id = 'pulseAnimation';
            style.textContent = `
                @keyframes pulse {
                    0% { transform: scale(1); box-shadow: 0 0 10px rgba(255, 255, 255, 0.3); }
                    50% { transform: scale(1.05); box-shadow: 0 0 15px rgba(255, 255, 255, 0.5); }
                    100% { transform: scale(1); box-shadow: 0 0 10px rgba(255, 255, 255, 0.3); }
                }
                @keyframes hover-pulse {
                    0% { transform: scale(1.1); }
                    50% { transform: scale(1.15); }
                    100% { transform: scale(1.1); }
                }
            `;
            document.head.appendChild(style);
        }

        colorSquare.style.animation = 'pulse 1.5s ease-in-out infinite';

        // Add hover effect with combined animation
        colorSquare.addEventListener('mouseover', () => {
            colorSquare.style.animation = 'hover-pulse 1.5s ease-in-out infinite';
            colorSquare.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.5)';
        });
        colorSquare.addEventListener('mouseout', () => {
            colorSquare.style.animation = 'pulse 1.5s ease-in-out infinite';
            colorSquare.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.3)';
        });

        // Create text container
        const textContainer = document.createElement('div');

        // Add elements to bonus display
        bonusDisplay.appendChild(colorSquare);
        bonusDisplay.appendChild(textContainer);
        document.getElementById('gameContainer').appendChild(bonusDisplay);
    }

    // Add transition effect for color change
    bonusDisplay.style.opacity = '0';
    setTimeout(() => {
        const colorSquare = bonusDisplay.children[0];
        const textContainer = bonusDisplay.children[1];

        colorSquare.style.backgroundColor = bonusColor;
        textContainer.textContent = `Double points for this color: ${bonusTimeRemaining}s`;
        bonusDisplay.style.opacity = '1';
    }, 150);

    // Update countdown
    if (bonusTimer) clearInterval(bonusTimer);
    bonusTimer = setInterval(() => {
        if (bonusTimeRemaining > 0) {
            bonusTimeRemaining--;
            const textContainer = bonusDisplay.children[1];
            textContainer.textContent = `Double points for this color: ${bonusTimeRemaining}s`;
        } else {
            // Start new bonus round when current one ends
            startBonusRound();
        }
    }, 1000);
}

// Initialize game
window.onload = function() {
    console.log("window.onload started");
    canvas = document.getElementById('gameCanvas');
    console.log("Canvas element:", canvas);

    if (canvas) {
        // Set canvas size based on container
        function resizeCanvas() {
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            console.log("Canvas resized to:", canvas.width, "x", canvas.height);
        }

        // Initial resize and setup
        resizeCanvas();
        ctx = canvas.getContext('2d');
        console.log("Canvas context:", ctx ? "obtained" : "failed");

        // Handle window resize
        window.addEventListener('resize', resizeCanvas);

        // Handle touch events
        canvas.addEventListener('touchstart', handleTouch);
        canvas.addEventListener('touchmove', function(e) {
            e.preventDefault(); // Prevent scrolling
        }, { passive: false });
    } else {
        console.error("Canvas element not found!");
    }

    function handleTouch(e) {
        e.preventDefault();
        if (!gameRunning) return;

        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        // Check for hits in reverse order (to handle overlapping discs)
        for (let i = discs.length - 1; i >= 0; i--) {
            if (discs[i].containsPoint(x, y)) {
                handleDiscHit(i);
                break;
            }
        }
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
        // Calculate scaling factors based on remaining time (60 to 0 seconds)
        const timeScale = 1 - (timeRemaining / GAME_DURATION); // 0 to 1

        // Get base radius scaled to screen size
        const baseRadius = getScaledDiscRadius();

        // Disc size decreases (100% to 50% of original size)
        this.radius = baseRadius * (1 - timeScale * 0.5);

        // Speed increases (1x to 2.5x)
        const speedMultiplier = 1 + (timeScale * 1.5);
        // Scale base speed with screen size
        const baseSpeed = Math.min(canvas.width, canvas.height) / 100;

        // Ensure discs spawn fully on screen
        const margin = this.radius * 2;
        this.x = margin + Math.random() * (canvas.width - margin * 2);
        this.y = margin + Math.random() * (canvas.height - margin * 2);

        // 10% chance for trap disc
        this.color = Math.random() < 0.1 ? TRAP_COLOR : DISC_COLORS[Math.floor(Math.random() * DISC_COLORS.length)];
        this.speedX = (Math.random() - 0.5) * baseSpeed * speedMultiplier;
        this.speedY = (Math.random() - 0.5) * baseSpeed * speedMultiplier;
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
        // Larger hit area for touch devices
        const isTouchDevice = 'ontouchstart' in window;
        const hitRadius = this.radius * (isTouchDevice ? 2.0 : 1.5); // 100% larger for touch, 50% for mouse
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
    bonusColor = null;
    bonusActive = false;
    bonusTimeRemaining = 15;
    if (bonusTimer) clearTimeout(bonusTimer);
    console.log('Game state initialized:', { gameRunning, timeRemaining, score });

    // Set up initial bonus activation after 15 seconds
    setTimeout(startBonusRound, 15000);

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
    if (spawnInterval) clearInterval(spawnInterval);
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

        // Adjust spawn interval based on remaining time
        const timeScale = 1 - (timeRemaining / GAME_DURATION); // 0 to 1
        const newInterval = DISC_SPAWN_INTERVAL * (1 - timeScale * 0.7); // Decrease to 30% of original time

        // Clear and set new interval
        clearInterval(spawnInterval);
        spawnInterval = setInterval(spawnDisc, Math.max(200, newInterval)); // Minimum 200ms interval
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

function showPoints(x, y, points) {
    const pointsText = document.createElement('div');
    pointsText.className = 'floating-score';
    pointsText.textContent = (points >= 0 ? '+' : '') + points;
    pointsText.style.left = x + 'px';
    pointsText.style.top = y + 'px';
    pointsText.style.color = points >= 0 ? '#4CAF50' : '#FF5252';
    document.getElementById('gameContainer').appendChild(pointsText);

    // Remove element after animation
    setTimeout(() => pointsText.remove(), 1000);
}

function handleDiscHit(index) {
    // Add points based on color
    let points = POINTS[discs[index].color];

    // Double points if bonus is active and color matches
    if (bonusActive && discs[index].color === bonusColor) {
        points *= 2;
        console.log('Bonus points awarded!');
    }

    // Show floating points at disc position
    showPoints(discs[index].x, discs[index].y, points);

    score += points;
    updateScore();

    // Create fragments for shatter effect
    const numFragments = Math.max(8, Math.min(15, Math.floor(discs[index].radius))); // Scale fragments with disc size
    for (let j = 0; j < numFragments; j++) {
        const angle = (j / numFragments) * Math.PI * 2 + Math.random() * 0.5 - 0.25;
        const speed = FRAGMENT_MIN_SPEED + Math.random() * (FRAGMENT_MAX_SPEED - FRAGMENT_MIN_SPEED);
        fragments.push(new Fragment(discs[index].x, discs[index].y, discs[index].color, angle, speed, discs[index].radius));
    }

    // Remove hit disc
    discs.splice(index, 1);
}

function handleShot(event) {
    if (!gameRunning) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check for hits in reverse order (to handle overlapping discs from newest to oldest)
    for (let i = discs.length - 1; i >= 0; i--) {
        if (discs[i].containsPoint(x, y)) {
            handleDiscHit(i);
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

    // Update and draw fragments
    fragments = fragments.filter(fragment => {
        const isActive = fragment.update();
        if (isActive) {
            fragment.draw(ctx);
        }
        return isActive;
    });

    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    clearInterval(spawnInterval);
    clearInterval(timerInterval);

    // Clean up bonus with fade-out effect
    if (bonusTimer) {
        clearInterval(bonusTimer);
        bonusTimer = null;
    }
    bonusActive = false;
    bonusColor = null;

    // Clean up bonus display and animations
    const bonusDisplay = document.getElementById('bonusDisplay');
    if (bonusDisplay) {
        // Stop animations
        const colorSquare = bonusDisplay.children[0];
        if (colorSquare) {
            colorSquare.style.animation = 'none';
            colorSquare.style.transform = 'scale(1)';
            colorSquare.style.boxShadow = 'none';
        }

        // Fade out and remove
        bonusDisplay.style.opacity = '0';
        setTimeout(() => {
            bonusDisplay.remove();
            // Remove animation style
            const pulseStyle = document.getElementById('pulseAnimation');
            if (pulseStyle) {
                pulseStyle.remove();
            }
        }, 300); // Match transition duration
    }

    // Clear any pending bonus activation
    const allTimeouts = setTimeout(() => {}, 0);
    for (let i = 0; i < allTimeouts; i++) {
        clearTimeout(i);
    }

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

    // Clear all discs and fragments
    discs = [];
    fragments = [];
}
