const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gravity = 1.2;
let jumpPower = -16;
let gameOver = false;
let cameraX = 0;

const player = {
  x: 100,
  y: 300,
  width: 40,
  height: 70,
  color: "#1565c0",
  velocityY: 0,
  isJumping: false,
  state: "idle",
  runAnimFrame: 0,
  facing: "right" // dirección que mira el stickman
};

let keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

let platforms = [
  { x: 0, y: 360, width: 300, height: 40, type: "normal" }
];

let crushers = [];
let platformSpacing = 250;
let nextPlatformX = 400;
let nextCrusherX = 1200;

function spawnPlatform() {
  const rand = Math.random();
  let type = "normal";

  if (rand < 0.2) type = "moving";
  else if (rand < 0.35) type = "rotating";

  const width = type === "rotating" ? 180 : 100 + Math.random() * 60;
  const height = 20;
  const y = 260 + Math.random() * 60;

  platforms.push({
    x: nextPlatformX,
    y,
    width,
    height,
    type,
    angle: 0,
    dir: 1
  });

  if (nextPlatformX >= nextCrusherX) {
    crushers.push({
      x: nextPlatformX - 150,
      y: 0,
      width: 20,
      height: 60,
      dir: 1,
      range: 100,
      baseY: y - 60
    });
    nextCrusherX += 1200;
  }

  nextPlatformX += platformSpacing;
}

function update() {
  if (gameOver) return;

  let moved = false;
  if (keys["ArrowRight"]) {
    player.x += 4;
    player.facing = "right";
    moved = true;
  }
  if (keys["ArrowLeft"]) {
    player.x -= 4;
    player.facing = "left";
    moved = true;
  }

  if (keys["Space"] && !player.isJumping) {
    player.velocityY = jumpPower;
    player.isJumping = true;
  }

  player.velocityY += gravity;
  player.y += player.velocityY;

  cameraX = player.x - 100;

  let onPlatform = false;

  platforms.forEach(p => {
    if (p.type === "moving") {
      p.y += p.dir * 1.5;
      if (p.y > 350 || p.y < 220) p.dir *= -1;
    }
    if (p.type === "rotating") {
      p.angle += 0.01;
    }

    const px = p.x;
    const py = p.type === "rotating" ? p.y + Math.sin(p.angle) * 8 : p.y;

    if (
      player.x + player.width > px &&
      player.x < px + p.width &&
      player.y + player.height >= py &&
      player.y + player.height <= py + 15 &&
      player.velocityY >= 0
    ) {
      player.y = py - player.height;
      player.velocityY = 0;
      player.isJumping = false;
      onPlatform = true;
    }
  });

  crushers.forEach(c => {
    c.y += c.dir * 3;
    if (c.y > c.baseY + c.range) c.dir = -1;
    if (c.y < c.baseY) c.dir = 1;

    if (
      player.x + player.width > c.x &&
      player.x < c.x + c.width &&
      player.y < c.y + c.height &&
      player.y + player.height > c.y
    ) {
      triggerGameOver();
    }
  });

  if (!onPlatform && player.y > canvas.height) {
    triggerGameOver();
  }

  while (nextPlatformX < player.x + 800) {
    spawnPlatform();
  }

  platforms = platforms.filter(p => p.x + p.width > cameraX - 200);
  crushers = crushers.filter(c => c.x + c.width > cameraX - 200);

  // Actualizar estado jugador
  if (player.isJumping) {
    player.state = "jump";
  } else if (moved) {
    player.state = "run";
  } else {
    player.state = "idle";
  }

  // Animación correr
  if (player.state === "run") {
    player.runAnimFrame += 0.2;
    if (player.runAnimFrame >= 4) player.runAnimFrame = 0;
  } else {
    player.runAnimFrame = 0;
  }
}

function triggerGameOver() {
  gameOver = true;
  document.getElementById("game-over").style.display = "block";
  document.getElementById("restart-btn").style.display = "block";
}

function drawPlayer() {
  const x = player.x - cameraX;
  const y = player.y;

  ctx.save();

  if (player.facing === "left") {
    // Voltear horizontalmente
    ctx.translate(x + 20, 0);
    ctx.scale(-1, 1);
    ctx.translate(-x - 20, 0);
  }

  // Cabeza
  ctx.beginPath();
  ctx.fillStyle = "#000";
  ctx.arc(x + 20, y + 10, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;

  // Cuerpo
  ctx.beginPath();
  ctx.moveTo(x + 20, y + 20);
  ctx.lineTo(x + 20, y + 50);
  ctx.stroke();

  if (player.state === "idle") {
    // Brazos quietos
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 30);
    ctx.lineTo(x + 5, y + 40);
    ctx.moveTo(x + 20, y + 30);
    ctx.lineTo(x + 35, y + 40);
    ctx.stroke();

    // Piernas quietas
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 50);
    ctx.lineTo(x + 10, y + 70);
    ctx.moveTo(x + 20, y + 50);
    ctx.lineTo(x + 30, y + 70);
    ctx.stroke();
  } else if (player.state === "run") {
    const frame = Math.floor(player.runAnimFrame);

    const armUp = [
      [5,40, 35,40],
      [10,35, 30,45],
      [5,40, 35,40],
      [10,45, 30,35]
    ];

    const legUp = [
      [10,70, 30,70],
      [15,60, 25,80],
      [10,70, 30,70],
      [15,80, 25,60]
    ];

    // Brazos
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 30);
    ctx.lineTo(x + armUp[frame][0], y + armUp[frame][1]);
    ctx.moveTo(x + 20, y + 30);
    ctx.lineTo(x + armUp[frame][2], y + armUp[frame][3]);
    ctx.stroke();

    // Piernas
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 50);
    ctx.lineTo(x + legUp[frame][0], y + legUp[frame][1]);
    ctx.moveTo(x + 20, y + 50);
    ctx.lineTo(x + legUp[frame][2], y + legUp[frame][3]);
    ctx.stroke();
  } else if (player.state === "jump") {
    // Brazos y piernas estirados para salto
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 30);
    ctx.lineTo(x + 0, y + 20);
    ctx.moveTo(x + 20, y + 30);
    ctx.lineTo(x + 40, y + 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 20, y + 50);
    ctx.lineTo(x + 10, y + 70);
    ctx.moveTo(x + 20, y + 50);
    ctx.lineTo(x + 30, y + 70);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPlatforms() {
  platforms.forEach(p => {
    const x = p.x - cameraX;
    const y = p.type === "rotating" ? p.y + Math.sin(p.angle) * 8 : p.y;

    if (p.type === "normal") ctx.fillStyle = "#4caf50";
    if (p.type === "moving") ctx.fillStyle = "#ff9800";
    if (p.type === "rotating") ctx.fillStyle = "#ab47bc";

    if (p.type === "rotating") {
      ctx.save();
      ctx.translate(x + p.width / 2, y + p.height / 2);
      ctx.rotate(p.angle);
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.restore();
    } else {
      ctx.fillRect(x, y, p.width, p.height);
    }
  });
}

function drawCrushers() {
  ctx.fillStyle = "#d32f2f";
  crushers.forEach(c => {
    ctx.fillRect(c.x - cameraX, c.y, c.width, c.height);
  });
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  update();
  drawPlatforms();
  drawCrushers();
  drawPlayer();

  if (!gameOver) requestAnimationFrame(loop);
}

loop();

