type Coordinate = {
  x: number;
  y: number;
};

type Food = {
  x: number;
  y: number;
  type: string;
};

const svgWidth = 800;
const svgHeight = 500;
const blockSize = 20;

let snake: Coordinate[] = [
  { x: 3, y: 1 },
  { x: 2, y: 1 },
  { x: 1, y: 1 },
];
const food: Food = { x: 10, y: 10, type: 'cherry' };

let direction: Coordinate = { x: 1, y: 0 };
let isMushroomActive: boolean = false;
let tookDamage: boolean = false;
let gameEnded: boolean = false;
let gameInterval: string | number | NodeJS.Timeout | null | undefined;
let points: number = 0;
let bestRun: number | string = localStorage.getItem('bestRun') || 0;
let speed: number = 1;

const myAudio = new Audio('music/pineapple.mp3');
myAudio.volume = 0.4;

const eatItemSound = new Audio('music/eat.mp3');
const tookDamageSound = new Audio('music/dmg.mp3');

// Create SVG canvas using D3.js
// @ts-expect-error - imported from another file
const svg = d3
  .select('#container')
  .append('svg')
  .attr('width', svgWidth)
  .attr('height', svgHeight)
  .attr('id', 'svgCanvas');

// helper function to draw the snake's body parts
function drawSVG(className: string, positions: Coordinate[], fill: string) {
  let size = blockSize;
  if (className === 'snake-eye' || className === 'snake-tongue') {
    size = size / 5;
  }
  svg
    .selectAll('.' + className)
    .data(positions)
    .enter()
    .append('rect')
    .attr('class', className)
    .attr('x', (d: { x: number }) => d.x * blockSize)
    .attr('y', (d: { y: number }) => d.y * blockSize)
    .attr('width', size)
    .attr('height', size)
    .attr('fill', fill);

  if (className === 'snake-segment') {
    svg.selectAll('.snake-segment').attr('stroke', 'black');
  }
}

function drawSnake(): void {
  // Clear previous snake segments / eyes / tongue
  svg.selectAll('rect').remove();

  const snakeColor = isMushroomActive ? '#ab0acf' : tookDamage ? 'red' : 'lime';
  drawSVG('snake-segment', snake, snakeColor);

  if (snake === undefined) {
    gameEnded = true;
    return;
  }
  const head = snake[0];
  drawSnakeFeatures(head, direction);
}

function drawSnakeFeatures(head: Coordinate, direction: Coordinate) {
  // eye positions
  const eyePositions = [
    { x: head.x + 0.1, y: head.y + 0.2 },
    { x: head.x + 0.7, y: head.y + 0.2 },
  ];

  // tongue positions based on direction
  let tonguePositions: Coordinate[] = [];
  switch (true) {
    // right
    case direction.x === 1 && direction.y === 0:
      tonguePositions = [
        { x: head.x + 1.2, y: head.y + 0.5 },
        { x: head.x + 1.4, y: head.y + 0.5 },
        { x: head.x + 1.5, y: head.y + 0.6 },
        { x: head.x + 1.6, y: head.y + 0.7 },
        { x: head.x + 1.8, y: head.y + 0.7 },
      ];
      break;
    // left
    case direction.x === -1 && direction.y === 0:
      tonguePositions = [
        { x: head.x - 0.3, y: head.y + 0.5 },
        { x: head.x - 0.5, y: head.y + 0.5 },
        { x: head.x - 0.6, y: head.y + 0.6 },
        { x: head.x - 0.7, y: head.y + 0.7 },
        { x: head.x - 0.9, y: head.y + 0.7 },
      ];
      break;
    // up
    case direction.x === 0 && direction.y === -1:
      tonguePositions = [
        { x: head.x + 0.6, y: head.y - 0.2 },
        { x: head.x + 0.6, y: head.y - 0.4 },
        { x: head.x + 0.6, y: head.y - 0.5 },
        { x: head.x + 0.7, y: head.y - 0.6 },
      ];
      break;
    // down
    case direction.x === 0 && direction.y === 1:
      tonguePositions = [
        { x: head.x + 0.5, y: head.y + 1.1 },
        { x: head.x + 0.6, y: head.y + 1.2 },
        { x: head.x + 0.6, y: head.y + 1.4 },
        { x: head.x + 0.6, y: head.y + 1.5 },
        { x: head.x + 0.7, y: head.y + 1.6 },
        { x: head.x + 0.7, y: head.y + 1.6 },
      ];
      break;
    default:
      break;
  }

  const bodyColor = isMushroomActive || tookDamage ? 'white' : 'black';

  // Draw eyes and tongue
  drawSVG('snake-eye', eyePositions, bodyColor);
  drawSVG('snake-tongue', tonguePositions, 'red');
}

// Function to draw the food on the canvas
function drawFood(): void {
  svg
    .selectAll('.food')
    .data([food])
    .enter()
    .append('svg:image')
    .attr('class', 'food')
    .attr('x', (d: { x: number }) => d.x * blockSize)
    .attr('y', (d: { y: number }) => d.y * blockSize)
    .attr('width', blockSize)
    .attr('height', blockSize)
    .attr(
      'xlink:href',
      `
        ${
          food.type === 'cherry'
            ? 'images/cherry-svgrepo-com.svg'
            : food.type === 'pizza'
              ? 'images/pizza-svgrepo-com.svg'
              : food.type === 'mushroom'
                ? 'images/mushroom-svgrepo-com.svg'
                : 'images/cactus-svgrepo-com.svg'
        }`,
    );
}

function generateFood() {
  food.x = Math.floor(Math.random() * (svgWidth / blockSize));
  food.y = Math.floor(Math.random() * (svgHeight / blockSize));

  //if food is generated on the snake, generate new food
  if (snake.some((segment) => segment.x === food.x && segment.y === food.y)) {
    generateFood();
  }
  // randomize food type based on probability distribution
  // Cherry: 50%, Pizza: 25%, Cactus: 15%, Mushroom: 10%
  const randomNum = Math.random();

  if (randomNum <= 0.5) {
    food.type = 'cherry';
  } else if (randomNum > 0.5 && randomNum <= 0.75) {
    food.type = 'pizza';
  } else if (randomNum > 0.75 && randomNum <= 0.9) {
    food.type = 'cactus';
  } else {
    food.type = 'mushroom';
  }

  if (speed <= 1 && food.type === 'cactus') {
    generateFood();
  }
  if (isMushroomActive && food.type === 'mushroom') {
    generateFood();
  }
}

function activateMushroom(): void {
  isMushroomActive = true;

  setTimeout(() => {
    isMushroomActive = false;
    //todo change to 30s
  }, 30000);
}

function moveSnake(): void {
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  // Check if snake hit the wall or itself
  const isOutOfBounds =
    head.x < 0 ||
    head.x >= svgWidth / blockSize ||
    head.y < 0 ||
    head.y >= svgHeight / blockSize;
  const hasCollidedWithSelf = snake.some(
    (segment) => segment.x === head.x && segment.y === head.y,
  );

  if (isOutOfBounds || hasCollidedWithSelf) {
    const gameOverAudio: HTMLAudioElement = new Audio('music/death.mp3');
    gameOverAudio.play();
    clearInterval(gameInterval);
    gameInterval = null;
    gameEnded = true;
    stopAudio();
    return;
  }

  // Move snake
  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    let soundPlayed: boolean = false;
    switch (food.type) {
      case 'cherry':
        points += 100;
        break;
      case 'pizza':
        points += 400;
        speed += 0.1;
        break;
      case 'mushroom':
        points += 350;
        activateMushroom();
        break;
      default:
        if (snake.length > 3) {
          snake.pop();
        }
        points -= 200;
        speed - 0.2 < 1 ? (speed = 1) : (speed -= 0.2);
        tookDamageSound.play();
        soundPlayed = true;
        tookDamage = true;
        setTimeout(() => {
          tookDamage = false;
        }, 250);
    }
    if (!soundPlayed) {
      eatItemSound.play();
    }
    generateFood();
  } else {
    // remove tail if no food eaten
    snake.pop();
  }
}

function changeDirection(newDirection: Coordinate): void {
  // if snake has mushroom active, invert the direction
  if (isMushroomActive) {
    newDirection = { x: -newDirection.x, y: -newDirection.y };
  }

  //if snake is trying to move to the opposite direction it's going, ignore the input
  const next = snake[1];
  if (
    next &&
    next.x === snake[0].x + newDirection.x &&
    next.y === snake[0].y + newDirection.y
  ) {
    return;
  }
  direction = newDirection;
}

function updateScoreboard(): void {
  const scoreElement = document.getElementById('score');
  const highScoreElement = document.getElementById('high-score');
  const scoreInGameElement = document.getElementById('score-ingame');
  const highScoreInGameElement = document.getElementById('high-score-ingame');

  if (points > Number(bestRun)) {
    bestRun = points;
    localStorage.setItem('bestRun', bestRun.toString());
  }

  scoreElement ? (scoreElement.innerText = points.toString()) : null;
  highScoreElement ? (highScoreElement.innerText = bestRun.toString()) : null;
  scoreInGameElement
    ? (scoreInGameElement.innerHTML = points.toString())
    : null;
  highScoreInGameElement
    ? (highScoreInGameElement.innerHTML = bestRun.toString())
    : null;
}

function intervalTime(): number {
  let intervalTime = 100 / speed;
  if (intervalTime < 10) {
    intervalTime = 10;
  }
  return intervalTime;
}

function startGame(): void {
  if (firstTime) {
    firstTime = false;
    closeModal();
  }
  if (!gameInterval) {
    closeModal();
    setTimeout(() => {
      startAudio();
      gameInterval = setInterval(gameLoop, intervalTime());
    }, 500);
  }
}

let firstTime: boolean = true;

function pauseGame(): void {
  if (firstTime) {
    showModal();
    startGame();
    return;
  }
  if (gameInterval) {
    showModal();
    clearInterval(gameInterval);
    gameInterval = null;
    stopAudio();
  }
}

function restartGame(): void {
  // Show the modal
  showModal();

  uncheckedButton?.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      closeModal();
    }
  });

  // Set a delay before resetting the game state for the animation to finish
  setTimeout(() => {
    // Reset the snake's position
    snake = [
      { x: 3, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 1 },
    ];

    // Reset the snake's direction
    direction = { x: 1, y: 0 };

    // Reset the game flags
    isMushroomActive = false;
    tookDamage = false;
    gameEnded = false;

    // Reset the points and speed
    points = 0;
    speed = 1;

    // restart the game to init state
    generateFood();
    drawSnake();
    drawFood();
    updateScoreboard();
  }, 200);
}

function startAudio(): void {
  myAudio.play();
}
function stopAudio(): void {
  myAudio.pause();
}
const scoreAbove: HTMLDivElement | null =
  document.querySelector('.score-ingame');

const uncheckedButton: HTMLInputElement | null =
  document.querySelector('#button');

function showModal() {
  const checkedButton = document.getElementById('button');
  if (scoreAbove && checkedButton) {
    scoreAbove.style.cssText =
      'display: flex; transition: all 0.5s ease-in-out; transform: translateY(-150%)';
    checkedButton.click();
  }
}

function closeModal() {
  if (scoreAbove && uncheckedButton) {
    scoreAbove.setAttribute('style', 'display: flex');
    scoreAbove.style.transition = 'all 0.5s ease-in-out';
    scoreAbove.style.transform = 'translateY(0%)';
    uncheckedButton.click();
  }
}

// Initialize game
generateFood();
drawSnake();
drawFood();
closeModal();

// Main game loop
function gameLoop(): void {
  if (!gameEnded) {
    moveSnake();
    if (gameEnded) {
      restartGame();
      return;
    }
    svg.selectAll('.snake-segment').remove(); // Clear previous snake segments
    drawSnake();
    if (gameEnded) {
      restartGame();
      return;
    }
    svg.selectAll('.food').remove(); // Clear previous food
    drawFood();
    updateScoreboard();

    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, intervalTime());
  } else {
    showModal();
  }
}

window.addEventListener('keydown', (event) => {
  switch (event.code) {
    //up
    case 'KeyW':
      changeDirection({ x: 0, y: -1 });
      break;
    //down
    case 'KeyS':
      changeDirection({ x: 0, y: 1 });
      break;
    //left
    case 'KeyA':
      changeDirection({ x: -1, y: 0 });
      break;
    //right
    case 'KeyD':
      changeDirection({ x: 1, y: 0 });
      break;
    case 'Space':
      if (firstTime) {
        pauseGame();
      } else if (gameInterval) {
        pauseGame();
      } else {
        startGame();
      }
      break;
  }
});

myAudio.addEventListener('ended', () => {
  myAudio.play();
});
