// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Responsive canvas sizing
function resizeCanvas() {
    const maxWidth = Math.min(800, window.innerWidth - 40);
    const aspectRatio = 2; // width/height = 2:1
    canvas.width = maxWidth;
    canvas.height = maxWidth / aspectRatio;
    
    // Update game ground position
    game.groundY = canvas.height - 50;
    
    // Reset player position if player has been initialized
    if (player.originalY > 0) {
        player.originalY = game.groundY - player.height;
        if (game.isRunning) {
            player.y = player.originalY;
        }
    }
}

// Initialize canvas size
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Enable pixel-perfect rendering
ctx.imageSmoothingEnabled = false;

// Game state
const game = {
    isRunning: true,
    isFrozen: false,
    score: 0,
    speed: 3,
    gravity: 0.6,
    groundY: canvas.height - 50,
    obstacles: [],
    lastObstacleTime: 0,
    obstacleInterval: 2000,
    freezeTime: 2000, // 2 seconds freeze
    freezeStartTime: 0
};

// Player object (astronaut)
const player = {
    x: 100,
    y: 0, // Will be set in resetGame
    width: 40, // Updated for larger sprite
    height: 64, // 14 sprite rows + 4 leg rows = 16 pixels * 4 = 64
    velocityY: 0,
    isJumping: false,
    jumpPower: -15,
    originalY: 0, // Will be set in resetGame
    pixelSize: 4 // Size of each pixel in the sprite
};

// DIVINAS team appreciation messages
const divinasMessages = [
    "🚀 3 IAC Papers! Thank you!",
    "🌟 Amazing work this year!",
    "💫 Thank you for your dedication!",
    "✨ IAC 2025 Sydney - You rocked it!",
    "🎯 Your research excellence shines!",
    "💪 Thank you for the hard work!",
    "⭐ 3 Papers at IAC - Outstanding!",
    "🎉 Thank you DIVINAS team!",
    "🔥 Your commitment inspires!",
    "💎 Thank you for advancing spaceflight!",
    "🎊 IAC Sydney and more - Fantastic work!",
    "🌟 Thank you for your passion!",
    "💫 3 Papers - You're amazing!",
    "🚀 Thank you for the journey!",
    "✨ Grateful for your excellence!"
];

// Obstacle class (pixel art style)
class Obstacle {
    constructor(isSpecial = false) {
        this.width = 24;
        this.height = Math.random() * 32 + 24;
        this.x = canvas.width;
        this.y = game.groundY - this.height;
        this.color = this.getRandomColor();
        // Space-themed obstacles: rocket, asteroid, capsule
        const types = ['rocket', 'asteroid', 'capsule'];
        this.type = types[Math.floor(Math.random() * types.length)];
        this.pixelSize = 4;
        this.isSpecial = isSpecial; // Special obstacles show DIVINAS messages
    }

    getRandomColor() {
        // DIVINAS color palette
        const colors = ['#1374a8', '#0b4878', '#803a63', '#C0C0C0'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        if (!game.isFrozen) {
            this.x -= game.speed;
        }
    }

    drawPixel(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), this.pixelSize, this.pixelSize);
    }

    draw() {
        const p = this.pixelSize;
        
        // Draw glow effect for special obstacles
        if (this.isSpecial) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#C0C0C0';
        } else {
            ctx.shadowBlur = 0;
        }
        
        const startX = Math.floor(this.x);
        const startY = Math.floor(this.y);
        const centerX = Math.floor(this.x + this.width / 2);
        const bottomY = Math.floor(this.y + this.height);
        
        if (this.type === 'rocket') {
            // Rocket design - clear and recognizable
            const rocketWidth = Math.floor(this.width / p);
            const rocketHeight = Math.floor(this.height / p);
            const tipY = startY;
            const bodyStartY = startY + p * 2;
            
            // Rocket tip (triangle)
            for (let py = 0; py < 2; py++) {
                const widthAtY = 3 - py;
                const offset = Math.floor((rocketWidth - widthAtY) / 2);
                for (let px = 0; px < widthAtY; px++) {
                    this.drawPixel(startX + (offset + px) * p, tipY + py * p, this.isSpecial ? '#803a63' : '#C0C0C0');
                }
            }
            
            // Rocket body (cylinder)
            for (let py = 0; py < rocketHeight - 2; py++) {
                for (let px = 0; px < rocketWidth; px++) {
                    const x = startX + px * p;
                    const y = bodyStartY + py * p;
                    
                    if (px === 0 || px === rocketWidth - 1) {
                        // Side borders
                        this.drawPixel(x, y, '#0b4878');
                    } else {
                        // Body
                        this.drawPixel(x, y, this.isSpecial ? '#803a63' : '#1374a8');
                    }
                }
            }
            
            // Rocket fins
            const finY = bottomY - p * 3;
            // Left fin
            this.drawPixel(startX - p, finY, this.isSpecial ? '#803a63' : '#0b4878');
            this.drawPixel(startX - p, finY + p, this.isSpecial ? '#803a63' : '#0b4878');
            // Right fin
            this.drawPixel(startX + rocketWidth * p, finY, this.isSpecial ? '#803a63' : '#0b4878');
            this.drawPixel(startX + rocketWidth * p, finY + p, this.isSpecial ? '#803a63' : '#0b4878');
            
            // Rocket window
            const windowY = bodyStartY + Math.floor((rocketHeight - 4) / 2) * p;
            this.drawPixel(centerX - p, windowY, '#0b4878');
            this.drawPixel(centerX, windowY, '#1374a8');
            this.drawPixel(centerX + p, windowY, '#0b4878');
            
        } else if (this.type === 'asteroid') {
            // Asteroid - irregular rock shape
            const astWidth = Math.floor(this.width / p);
            const astHeight = Math.floor(this.height / p);
            
            // Draw irregular asteroid shape
            for (let py = 0; py < astHeight; py++) {
                for (let px = 0; px < astWidth; px++) {
                    const x = startX + px * p;
                    const y = startY + py * p;
                    
                    // Create irregular shape using distance from center
                    const centerPX = astWidth / 2;
                    const centerPY = astHeight / 2;
                    const distX = Math.abs(px - centerPX);
                    const distY = Math.abs(py - centerPY);
                    const dist = Math.sqrt(distX * distX + distY * distY);
                    
                    // Irregular radius based on angle
                    const angle = Math.atan2(py - centerPY, px - centerPX);
                    const maxRadius = (astWidth + astHeight) / 4 + Math.sin(angle * 3) * 0.5;
                    
                    if (dist < maxRadius) {
                        if (dist > maxRadius - 1) {
                            // Edge (darker)
                            this.drawPixel(x, y, '#0b4878');
                        } else {
                            // Interior
                            this.drawPixel(x, y, this.isSpecial ? '#803a63' : '#C0C0C0');
                        }
                    }
                }
            }
            
            // Add some crater details
            if (astWidth > 4 && astHeight > 4) {
                this.drawPixel(startX + Math.floor(astWidth * 0.3) * p, startY + Math.floor(astHeight * 0.4) * p, '#0b4878');
                this.drawPixel(startX + Math.floor(astWidth * 0.7) * p, startY + Math.floor(astHeight * 0.6) * p, '#0b4878');
            }
            
        } else {
            // Space capsule (like Apollo capsule)
            const capWidth = Math.floor(this.width / p);
            const capHeight = Math.floor(this.height / p);
            
            // Capsule top (rounded)
            for (let py = 0; py < 2; py++) {
                const widthAtY = capWidth - py * 2;
                const offset = Math.floor((capWidth - widthAtY) / 2);
                for (let px = 0; px < widthAtY; px++) {
                    this.drawPixel(startX + (offset + px) * p, startY + py * p, this.isSpecial ? '#803a63' : '#1374a8');
                    // Border
                    if (px === 0 || px === widthAtY - 1 || py === 0) {
                        this.drawPixel(startX + (offset + px) * p, startY + py * p, '#0b4878');
                    }
                }
            }
            
            // Capsule body (cylinder)
            for (let py = 2; py < capHeight; py++) {
                for (let px = 0; px < capWidth; px++) {
                    const x = startX + px * p;
                    const y = startY + py * p;
                    
                    if (px === 0 || px === capWidth - 1) {
                        // Side borders
                        this.drawPixel(x, y, '#0b4878');
                    } else {
                        // Body
                        this.drawPixel(x, y, this.isSpecial ? '#803a63' : '#C0C0C0');
                    }
                }
            }
            
            // Window
            const windowY = startY + Math.floor(capHeight * 0.4) * p;
            this.drawPixel(centerX - p, windowY, '#0b4878');
            this.drawPixel(centerX, windowY, '#1374a8');
            this.drawPixel(centerX + p, windowY, '#0b4878');
        }
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Add star icon above special obstacles
        if (this.isSpecial) {
            ctx.fillStyle = '#C0C0C0';
            const starX = Math.floor(this.x + this.width / 2);
            const starY = Math.floor(this.y - p * 2);
            // Draw simple star (5 pixels)
            this.drawPixel(starX, starY - p * 2, '#C0C0C0');
            this.drawPixel(starX - p, starY - p, '#C0C0C0');
            this.drawPixel(starX + p, starY - p, '#C0C0C0');
            this.drawPixel(starX - p, starY, '#C0C0C0');
            this.drawPixel(starX + p, starY, '#C0C0C0');
        }
    }
}

// Draw pixel art astronaut (improved design)
function drawPlayer() {
    const p = player.pixelSize;
    const startX = Math.floor(player.x);
    const startY = Math.floor(player.y);
    
    // Improved astronaut sprite (10x14 pixels)
    // 0 = transparent, 1 = silver suit, 2 = dark blue helmet, 3 = light blue visor, 4 = black visor, 5 = burgundy badge, 6 = dark blue details
    const sprite = [
        [0,0,0,2,2,2,2,0,0,0], // Helmet top
        [0,0,2,2,2,2,2,2,0,0],
        [0,2,2,6,6,6,6,2,2,0], // Helmet sides
        [2,2,6,3,3,3,3,6,2,2], // Visor top
        [2,6,3,4,4,4,4,3,6,2], // Visor dark
        [2,6,3,4,4,4,4,3,6,2], // Visor dark
        [2,2,6,3,3,3,3,6,2,2], // Visor bottom
        [0,2,2,6,6,6,6,2,2,0], // Helmet bottom
        [0,0,1,1,1,1,1,1,0,0], // Body top
        [0,1,1,5,5,5,5,1,1,0], // Body with badge
        [0,1,1,5,5,5,5,1,1,0], // Body with badge
        [0,1,1,1,1,1,1,1,1,0], // Body
        [0,1,1,6,6,6,6,1,1,0], // Body details
        [0,0,1,1,1,1,1,1,0,0]  // Body bottom
    ];
    
    // Draw sprite
    for (let row = 0; row < sprite.length; row++) {
        for (let col = 0; col < sprite[row].length; col++) {
            const pixel = sprite[row][col];
            if (pixel !== 0) {
                let color;
                switch(pixel) {
                    case 1: color = '#C0C0C0'; break; // Silver/white suit
                    case 2: color = '#0b4878'; break; // Dark blue helmet
                    case 3: color = '#1374a8'; break; // Light blue visor
                    case 4: color = '#000'; break; // Black visor
                    case 5: color = '#803a63'; break; // Burgundy badge
                    case 6: color = '#0b4878'; break; // Dark blue details
                    default: color = '#C0C0C0';
                }
                ctx.fillStyle = color;
                ctx.fillRect(startX + col * p, startY + row * p, p, p);
            }
        }
    }
    
    // Draw legs with better running animation
    const legOffset = Math.floor((Date.now() / 100) % 2) * p;
    ctx.fillStyle = '#C0C0C0';
    // Left leg
    ctx.fillRect(startX + 2 * p, startY + sprite.length * p, p * 2, p * 3);
    // Right leg (offset for running)
    ctx.fillRect(startX + 6 * p + legOffset, startY + sprite.length * p, p * 2, p * 3);
    
    // Draw boots
    ctx.fillStyle = '#0b4878';
    ctx.fillRect(startX + 2 * p, startY + (sprite.length + 3) * p, p * 2, p);
    ctx.fillRect(startX + 6 * p + legOffset, startY + (sprite.length + 3) * p, p * 2, p);
}

// Draw ground (space station floor/landing pad)
function drawGround() {
    const p = 4; // Pixel size
    const groundTop = game.groundY;
    
    // Base floor (dark blue)
    ctx.fillStyle = '#0b4878';
    ctx.fillRect(0, groundTop, canvas.width, canvas.height - groundTop);
    
    // Floor panels (checkerboard pattern)
    ctx.fillStyle = '#1374a8';
    for (let x = 0; x < canvas.width; x += p * 16) {
        for (let y = groundTop; y < canvas.height; y += p * 16) {
            const offsetX = (Math.floor(y / (p * 16)) % 2) * (p * 8);
            if ((Math.floor((x + offsetX) / (p * 8)) + Math.floor((y - groundTop) / (p * 8))) % 2 === 0) {
                ctx.fillRect(x + offsetX, y, p * 8, p * 8);
            }
        }
    }
    
    // Top border/edge (silver)
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(0, groundTop, canvas.width, p);
    
    // Grating pattern
    ctx.fillStyle = '#0b4878';
    for (let x = 0; x < canvas.width; x += p * 2) {
        ctx.fillRect(x, groundTop + p, p, p);
    }
}

// Draw background decorations (space theme)
function drawBackground() {
    const p = 4;
    
    // Stars in space (silver/white)
    ctx.fillStyle = '#C0C0C0';
    const stars = [
        {x: 100, y: 50, size: 1},
        {x: 300, y: 80, size: 1},
        {x: 500, y: 40, size: 2},
        {x: 700, y: 70, size: 1},
        {x: 200, y: 100, size: 1},
        {x: 600, y: 60, size: 1},
        {x: 150, y: 120, size: 1},
        {x: 450, y: 90, size: 1},
        {x: 750, y: 110, size: 1}
    ];
    
    stars.forEach(star => {
        const x = Math.floor((star.x + Date.now() / 100) % (canvas.width + 20) - 10);
        const y = star.y;
        const size = star.size * p;
        // Draw star
        ctx.fillRect(x, y, size, size);
        if (size > p) {
            ctx.fillRect(x + p, y, size - p, size - p);
            ctx.fillRect(x, y + p, size - p, size - p);
        }
    });
    
    // Distant planets/space stations (dark blue circles)
    ctx.fillStyle = '#0b4878';
    for (let i = 0; i < 2; i++) {
        const planetX = (i * 400 + Date.now() / 200) % (canvas.width + 100) - 50;
        const planetY = 60 + i * 40;
        const radius = 15 + i * 5;
        
        ctx.beginPath();
        ctx.arc(planetX, planetY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Planet details
        ctx.fillStyle = '#1374a8';
        ctx.beginPath();
        ctx.arc(planetX - 5, planetY - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0b4878';
    }
    
    // Space station modules in background
    ctx.fillStyle = '#1374a8';
    for (let i = 0; i < 2; i++) {
        const stationX = Math.floor((i * 350 + Date.now() / 150) % (canvas.width + 80) - 40);
        const stationY = game.groundY - 80 - i * 30;
        const stationWidth = 40;
        const stationHeight = 30;
        
        // Main body
        ctx.fillRect(stationX, stationY, stationWidth, stationHeight);
        
        // Windows
        ctx.fillStyle = '#0b4878';
        ctx.fillRect(stationX + 8, stationY + 8, 6, 6);
        ctx.fillRect(stationX + 18, stationY + 8, 6, 6);
        ctx.fillRect(stationX + 28, stationY + 8, 6, 6);
        ctx.fillStyle = '#1374a8';
    }
}

// Collision detection
function checkCollision(obstacle) {
    return player.x < obstacle.x + obstacle.width &&
           player.x + player.width > obstacle.x &&
           player.y < obstacle.y + obstacle.height &&
           player.y + player.height > obstacle.y;
}

// Check if player jumped over obstacle
function checkJumpOver(obstacle) {
    // Check if obstacle passed the player while player was above it
    return obstacle.x + obstacle.width < player.x && 
           player.y + player.height < obstacle.y + obstacle.height &&
           !game.isFrozen;
}

// Show message overlay
function showMessage() {
    const randomMessage = divinasMessages[Math.floor(Math.random() * divinasMessages.length)];
    document.getElementById('messageText').textContent = randomMessage;
    document.getElementById('messageOverlay').classList.remove('hidden');
}

// Hide message overlay
function hideMessage() {
    document.getElementById('messageOverlay').classList.add('hidden');
}

// Player jump
function jump() {
    if (!player.isJumping && !game.isFrozen) {
        player.velocityY = player.jumpPower;
        player.isJumping = true;
    }
}

// Update player
function updatePlayer() {
    if (!game.isFrozen) {
        player.velocityY += game.gravity;
        player.y += player.velocityY;
        
        if (player.y >= player.originalY) {
            player.y = player.originalY;
            player.velocityY = 0;
            player.isJumping = false;
        }
    }
}

// Update obstacles
function updateObstacles() {
    // Add new obstacles
    const now = Date.now();
    if (now - game.lastObstacleTime > game.obstacleInterval && !game.isFrozen) {
        // Only create special obstacles occasionally (about 1 in 5)
        const isSpecial = Math.random() < 0.2;
        game.obstacles.push(new Obstacle(isSpecial));
        game.lastObstacleTime = now;
        // Gradually decrease interval (increase difficulty)
        game.obstacleInterval = Math.max(1000, game.obstacleInterval - 10);
    }
    
    // Update and check obstacles
    for (let i = game.obstacles.length - 1; i >= 0; i--) {
        const obstacle = game.obstacles[i];
        
        // Check if player jumped over obstacle
        if (checkJumpOver(obstacle)) {
            game.score += 10;
            game.obstacles.splice(i, 1);
            
            // Only freeze and show message for special obstacles
            if (obstacle.isSpecial) {
                game.isFrozen = true;
                game.freezeStartTime = Date.now();
                showMessage();
            }
            continue;
        }
        
        // Check collision
        if (checkCollision(obstacle)) {
            // Game over
            game.isRunning = false;
            alert(`Game Over! Final Score: ${game.score}`);
            resetGame();
            return;
        }
        
        obstacle.update();
        
        // Remove off-screen obstacles
        if (obstacle.x + obstacle.width < 0) {
            game.obstacles.splice(i, 1);
        }
    }
}

// Check freeze timer
function updateFreeze() {
    if (game.isFrozen) {
        const elapsed = Date.now() - game.freezeStartTime;
        if (elapsed >= game.freezeTime) {
            game.isFrozen = false;
            hideMessage();
        }
    }
}

// Update score display
function updateScore() {
    document.getElementById('score').textContent = `SCORE: ${game.score.toString().padStart(6, '0')}`;
}

// Reset game
function resetGame() {
    game.isRunning = true;
    game.isFrozen = false;
    game.score = 0;
    game.speed = 3;
    game.obstacles = [];
    game.lastObstacleTime = Date.now();
    game.obstacleInterval = 2000;
    player.originalY = game.groundY - player.height;
    player.y = player.originalY;
    player.velocityY = 0;
    player.isJumping = false;
    hideMessage();
    updateScore();
}

// Game loop
function gameLoop() {
    // Clear canvas and fill with space background
    ctx.fillStyle = '#0b4878';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (game.isRunning) {
        // Draw background
        drawBackground();
        drawGround();
        
        // Update freeze state
        updateFreeze();
        
        // Update game objects
        updatePlayer();
        updateObstacles();
        
        // Draw game objects
        drawPlayer();
        game.obstacles.forEach(obstacle => obstacle.draw());
        
        // Update score
        updateScore();
    }
    
    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!game.isRunning) return;
        jump();
    }
});

// Touch/mobile support
let touchStartY = 0;
let touchStartTime = 0;

// Prevent default touch behaviors that interfere with gameplay
document.addEventListener('touchstart', (e) => {
    // Allow touch on canvas and game container
    if (e.target === canvas || e.target.closest('.game-container')) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchend', (e) => {
    if (e.target === canvas || e.target.closest('.game-container')) {
        e.preventDefault();
        if (!game.isRunning) return;
        jump();
    }
}, { passive: false });

// Also support click/tap anywhere on canvas for jumping
canvas.addEventListener('click', (e) => {
    if (!game.isRunning) return;
    jump();
});

// Start screen functionality
let gameInitialized = false;

document.getElementById('startButton').addEventListener('click', () => {
    document.getElementById('startScreen').classList.add('hidden');
    document.querySelector('.game-container').classList.remove('hidden');
    
    if (!gameInitialized) {
        resetGame();
        gameLoop();
        gameInitialized = true;
    } else {
        // If game was already initialized, just reset it
        resetGame();
    }
});

