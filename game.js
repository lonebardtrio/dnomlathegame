let gameOver = false;
let playerZ = 0;
let enemies = [];
let bullets = [];
let speed = 5;
let enemySpacing = 300;
let playerX = 0;
let playerY = 0;
let size = 20;
let crosshairX = 0;
let crosshairY = 0;
let laserActive = false;
let shakeAmount = 0; // Amount of shake applied to the player
let shakeDecay = 0.1; // How quickly the shake effect decreases
let font;

// Add bobbing motion
let bobbingAmplitude = 20; // Amplitude of the bobbing motion
let bobbingFrequency = 0.05; // Frequency of the bobbing motion


function preload() {
    playerModel = loadModel("assets/_cat.obj", true); // Ensure the path is correct
    font = loadFont("assets/Roboto-Bold.ttf");
    // Ensure the path is correct
}

function setup() {
    createCanvas(800, 800, WEBGL);
    textFont(font);
    for (let i = 0; i < 10; i++) {
        enemies.push(generateEnemy(playerZ - i * enemySpacing));
    }
}

function draw() {
    background(0);

    if (gameOver) {
        displayGameOver();
        return;
    }

    // Apply camera shake
    let shakeX = random(-shakeAmount, shakeAmount);
    let shakeY = random(-shakeAmount, shakeAmount);

    // Camera setup
    camera(shakeX, shakeY, playerZ + 800, 0, 0, playerZ, 0, 1, 0);

    let bobbingOffsetX = sin(frameCount * bobbingFrequency) * bobbingAmplitude; // Sideways bobbing
    let bobbingOffsetY = cos(frameCount * bobbingFrequency) * bobbingAmplitude; // Up and down bobbing

    // Draw the player (cat model)
    push();
    translate(playerX + shakeX + bobbingOffsetX, playerY + shakeY + bobbingOffsetY, playerZ); // Apply shake and bobbing offsets
    rotateX(PI); // Flip model upright
    rotateY(PI / 2); // Adjust orientation
    normalMaterial(); // Apply a default material
    model(playerModel); // Render the OBJ model
    pop();

    // Reduce shake over time
    shakeAmount = max(0, shakeAmount - shakeDecay);

    // Draw and fire laser beam if active
    if (laserActive) {
        fireLaser();
    }

    // Update and draw enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        enemy.z += speed;

        // Enemy fires bullets periodically
        if (frameCount % 60 === 0) {
            fireEnemyBullet(enemy);
        }

        push();
        translate(enemy.x, enemy.y, enemy.z);
        fill(enemy.color);
        box(enemy.size);
        pop();

        if (enemy.z > playerZ + 500) {
            enemies.splice(i, 1);
            enemies.push(generateEnemy(playerZ - enemySpacing * (enemies.length + 1)));
        }

        // Collision detection with player
        if (
            abs(playerX - enemy.x) < enemy.size / 2 + size / 2 &&
            abs(playerY - enemy.y) < enemy.size / 2 + size / 2 &&
            abs(playerZ - enemy.z) < enemy.size / 2 + size / 2
        ) {
            gameOver = true;
            console.log("Game Over - Collided with Enemy");
        }
    }

    // Reset enemies if the array is empty
    if (enemies.length === 0) {
        for (let i = 0; i < 10; i++) {
            enemies.push(generateEnemy(playerZ - i * enemySpacing));
        }
    }

    // Update and draw bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];
        bullet.x += bullet.dirX;
        bullet.y += bullet.dirY;
        bullet.z += bullet.dirZ;

        push();
        translate(bullet.x, bullet.y, bullet.z);
        noStroke();
        fill(255, 0, 0); // Red bullets
        sphere(5); // Small spherical bullets
        pop();

        // Check for collision with player
        if (
            abs(playerX - bullet.x) < size / 2 &&
            abs(playerY - bullet.y) < size / 2 &&
            abs(playerZ - bullet.z) < size / 2
        ) {
            bullets.splice(i, 1); // Remove the bullet
            shakeAmount = 10; // Trigger shake effect
        }

        // Remove bullets that are out of range
        if (bullet.z > playerZ + 1000 || bullet.z < playerZ - 1000) {
            bullets.splice(i, 1);
        }
    }

    // Player movement
    let moveSpeed = 10;
    if (keyIsDown(87)) playerY -= moveSpeed; // W key
    if (keyIsDown(83)) playerY += moveSpeed; // S key
    if (keyIsDown(65)) playerX -= moveSpeed; // A key
    if (keyIsDown(68)) playerX += moveSpeed; // D key

    // Constrain player position
    playerX = constrain(playerX, -width / 2, width / 2);
    playerY = constrain(playerY, -height / 2, height / 2);

    // Crosshair movement
    if (keyIsDown(UP_ARROW)) crosshairY -= moveSpeed * 1.5;
    if (keyIsDown(DOWN_ARROW)) crosshairY += moveSpeed * 1.5;
    if (keyIsDown(LEFT_ARROW)) crosshairX -= moveSpeed * 1.5;
    if (keyIsDown(RIGHT_ARROW)) crosshairX += moveSpeed * 1.5;

    // Constrain crosshair position
    crosshairX = constrain(crosshairX, -width, width);
    crosshairY = constrain(crosshairY, -height, height);

    // Move forward
    playerZ -= speed;

    // Draw crosshair
    push();
    translate(crosshairX, crosshairY, playerZ);
    noFill();
    stroke(255);
    line(-10, 0, 10, 0);
    line(0, -10, 0, 10);
    pop();
}

// Handle key press for laser firing
function keyPressed() {
    if (key === ' ') {
        laserActive = true;
    }
}

// Handle key release to stop laser
function keyReleased() {
    if (key === ' ') {
        laserActive = false;
    }
}

// Laser logic
function fireLaser() {
    push();
    stroke(255, 0, 0); // Red color for the laser beam
    strokeWeight(8); // Thickness of the beam
    line(playerX, playerY, playerZ, crosshairX, crosshairY, playerZ); // Beam from player to crosshair
    pop();

    // Check for collisions with enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];

        // Check if the enemy is in front of the crosshair along the Z-axis
        if (enemy.z >= playerZ - 800 && enemy.z <= playerZ) {
            // Additional X/Y constraints for accuracy (optional)
            if (
                abs(crosshairX - enemy.x) < enemy.size * 1.5 &&
                abs(crosshairY - enemy.y) < enemy.size * 1.5
            ) {
                enemies.splice(i, 1); // Destroy the enemy
                break; // Stop checking after hitting the first enemy
            }
        }
    }
}


// Fire a bullet from an enemy
function fireEnemyBullet(enemy) {
    let bulletSpeed = 20;
    let dx = playerX - enemy.x;
    let dy = playerY - enemy.y;
    let dz = (playerZ - enemy.z) - 80;
    let mag = sqrt(dx * dx + dy * dy + dz * dz);

    bullets.push({
        x: enemy.x,
        y: enemy.y,
        z: enemy.z,
        dirX: (dx / mag) * bulletSpeed,
        dirY: (dy / mag) * bulletSpeed,
        dirZ: (dz / mag) * bulletSpeed
    });
}

function displayGameOver() {
    push();
    translate(0, 0, playerZ - 100);
    fill(255, 0, 0);
    textAlign(CENTER, CENTER);
    textSize(64);
    text('HAPPY DNOMLA', 0, 0);
    pop();
}

function generateEnemy(z) {
    return {
        x: random(-400, 400),
        y: random(-400, 400),
        z: z,
        size: random(40, 100),
        color: color(random(255), random(255), random(255))
    };
}
