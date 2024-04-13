class Tetris {
    constructor(imageX, imageY, template) {
      this.imageY = imageY;
      this.imageX = imageX;
      this.template = template;
      this.x = squareCountX / 2;
      this.y = 0;
    }
  
    checkBottom() {
      for (let i = 0; i < this.template.length; i++) {
        for (let j = 0; j < this.template.length; j++) {
          if (this.template[i][j] == 0) continue;
          let realX = i + this.getTruncedPosition().x;
          let realY = j + this.getTruncedPosition().y;
          if (realY + 1 >= squareCountY) {
            return false;
          }
          if (gameMap[realY + 1][realX].imageX != -1) {
            return false;
          }
        }
      }
      return true;
    }
  
    getTruncedPosition() {
      return { x: Math.trunc(this.x), y: Math.trunc(this.y) };
    }
    checkLeft() {
      for (let i = 0; i < this.template.length; i++) {
        for (let j = 0; j < this.template.length; j++) {
          if (this.template[i][j] == 0) continue;
          let realX = i + this.getTruncedPosition().x;
          let realY = j + this.getTruncedPosition().y;
          if (realX - 1 < 0) {
            return false;
          }
  
          if (gameMap[realY][realX - 1].imageX != -1) return false;
        }
      }
      return true;
    }
  
    checkRight() {
      for (let i = 0; i < this.template.length; i++) {
        for (let j = 0; j < this.template.length; j++) {
          if (this.template[i][j] == 0) continue;
          let realX = i + this.getTruncedPosition().x;
          let realY = j + this.getTruncedPosition().y;
          if (realX + 1 >= squareCountX) {
            return false;
          }
  
          if (gameMap[realY][realX + 1].imageX != -1) return false;
        }
      }
      return true;
    }
  
    moveRight() {
      if (this.checkRight()) {
        this.x += 1;
      }
    }
  
    moveLeft() {
      if (this.checkLeft()) {
        this.x -= 1;
      }
    }
  
    moveBottom() {
      if (this.checkBottom()) {
        this.y += 1;
        score += 1;
      }
    }
    changeRotation() {
      let tempTemplate = [];
      for (let i = 0; i < this.template.length; i++)
        tempTemplate[i] = this.template[i].slice();
      let n = this.template.length;
      for (let layer = 0; layer < n / 2; layer++) {
        let first = layer;
        let last = n - 1 - layer;
        for (let i = first; i < last; i++) {
          let offset = i - first;
          let top = this.template[first][i];
          this.template[first][i] = this.template[i][last]; // top = right
          this.template[i][last] = this.template[last][last - offset]; //right = bottom
          this.template[last][last - offset] =
            this.template[last - offset][first];
          //bottom = left
          this.template[last - offset][first] = top; // left = top
        }
      }
  
      for (let i = 0; i < this.template.length; i++) {
        for (let j = 0; j < this.template.length; j++) {
          if (this.template[i][j] == 0) continue;
          let realX = i + this.getTruncedPosition().x;
          let realY = j + this.getTruncedPosition().y;
          if (
            realX < 0 ||
            realX >= squareCountX ||
            realY < 0 ||
            realY >= squareCountY
          ) {
            this.template = tempTemplate;
            return false;
          }
        }
      }
    }
  }
  
  const imageSquareSize = 24;
  const size = 40;
  const framePerSecond = 24;
  const gameSpeed = 3;
  
  const Startcanvas = document.getElementById("GTcanvas");
  const StartEntercanvas = document.getElementById("GEcanvas")
  const canvas = document.getElementById("canvas");
  const GameOverCanvas = document.getElementById("GOcanvas");
  const GameOverEnter = document.getElementById("RTcanvas");
  const nextShapeCanvas = document.getElementById("nextShapeCanvas");
  const scoreCanvas = document.getElementById("scoreCanvas");

  const image = document.getElementById("image");

  const GTcontext = Startcanvas.getContext("2d");
  const GEcontext = StartEntercanvas.getContext("2d");  
  const GOcontext = GameOverCanvas.getContext("2d");
  const RTcontext = GameOverEnter.getContext("2d");
  const ctx = canvas.getContext("2d");
  const nctx = nextShapeCanvas.getContext("2d");
  const sctx = scoreCanvas.getContext("2d");

  const squareCountX = canvas.width / size;
  const squareCountY = canvas.height / size;
  
  const shapes = [
    new Tetris(0, 120, [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ]),
    new Tetris(0, 96, [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ]),
    new Tetris(0, 72, [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ]),
    new Tetris(0, 48, [
      [0, 0, 0],
      [0, 1, 1],
      [1, 1, 0],
    ]),
    new Tetris(0, 24, [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ]),
    new Tetris(0, 0, [
      [1, 1],
      [1, 1],
    ]),
  
    new Tetris(0, 48, [
      [0, 0, 0],
      [1, 1, 0],
      [0, 1, 1],
    ]),
  ];
  let gameStart = true;
  let gameMap;
  let gameOver;
  let currentShape;
  let nextShape;
  let score;
  let initialTwoDArr;
  let whiteLineThickness = 4;
  
  let gameLoop = () => {
    setInterval(update, 1000 / gameSpeed);
    setInterval(draw, 1000 / framePerSecond);
  };
  
  let deleteCompleteRows = () => {
    for (let i = 0; i < gameMap.length; i++) {
      let t = gameMap[i];
      let isComplete = true;
      for (let j = 0; j < t.length; j++) {
        if (t[j].imageX == -1) isComplete = false;
      }
      if (isComplete) {
        console.log("complete row");
        score += 1000;
        for (let k = i; k > 0; k--) {
          gameMap[k] = gameMap[k - 1];
        }
        let temp = [];
        for (let j = 0; j < squareCountX; j++) {
          temp.push({ imageX: -1, imageY: -1 });
        }
        gameMap[0] = temp;
      }
    }
  };
  
  let update = () => {
    if (gameOver) return;
    if (currentShape.checkBottom()) {
      currentShape.y += 1;
    } else {
      for (let k = 0; k < currentShape.template.length; k++) {
        for (let l = 0; l < currentShape.template.length; l++) {
          if (currentShape.template[k][l] == 0) continue;
          gameMap[currentShape.getTruncedPosition().y + l][
            currentShape.getTruncedPosition().x + k
          ] = { imageX: currentShape.imageX, imageY: currentShape.imageY };
        }
      }
  
      deleteCompleteRows();
      currentShape = nextShape;
      nextShape = getRandomShape();
      if (!currentShape.checkBottom()) {
        gameOver = true;
      }
      score += 100;
    }
  };
  
  let drawRect = (x, y, width, height, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  };
  
  let drawBackground = () => {
    drawRect(0, 0, canvas.width, canvas.height, "#00000");
    for (let i = 0; i < squareCountX + 1; i++) {
      drawRect(
        size * i - whiteLineThickness,
        0,
        whiteLineThickness,
        canvas.height,
        "black"
      );
    }
  
    for (let i = 0; i < squareCountY + 1; i++) {
      drawRect(
        0,
        size * i - whiteLineThickness,
        canvas.width,
        whiteLineThickness,
        "black"
      );
    }
  };
  
  let drawCurrentTetris = () => {
    for (let i = 0; i < currentShape.template.length; i++) {
      for (let j = 0; j < currentShape.template.length; j++) {
        if (currentShape.template[i][j] == 0) continue;
        ctx.drawImage(
          image,
          currentShape.imageX,
          currentShape.imageY,
          imageSquareSize,
          imageSquareSize,
          Math.trunc(currentShape.x) * size + size * i,
          Math.trunc(currentShape.y) * size + size * j,
          size,
          size
        );
      }
    }
  };
  
  let drawSquares = () => {
    for (let i = 0; i < gameMap.length; i++) {
      let t = gameMap[i];
      for (let j = 0; j < t.length; j++) {
        if (t[j].imageX == -1) continue;
        ctx.drawImage(
          image,
          t[j].imageX,
          t[j].imageY,
          imageSquareSize,
          imageSquareSize,
          j * size,
          i * size,
          size,
          size
        );
      }
    }
  };
  
  let drawNextShape = () => {
    nctx.fillStyle = "#fffffff";
    nctx.fillRect(0, 0, nextShapeCanvas.width, nextShapeCanvas.height);
    for (let i = 0; i < nextShape.template.length; i++) {
      for (let j = 0; j < nextShape.template.length; j++) {
        if (nextShape.template[i][j] == 0) continue;
        nctx.drawImage(
          image,
          nextShape.imageX,
          nextShape.imageY,
          imageSquareSize,
          imageSquareSize,
          size * i,
          size * j + size,
          size,
          size
        );
      }
    }
  };
  
  let drawScore = () => {
    sctx.clearRect(0, 0, scoreCanvas.width, scoreCanvas.height);
    sctx.font = "64px Pixelify Sans";
    sctx.fillStyle = "white";
    sctx.fillText(score, 10, 50);
  };

  let drawStart = () => {
    GTcontext.font = "64px Pixelify Sans";
    GTcontext.fillStyle = "white";
    GTcontext.fillText("TETRIS", 10, canvas.height / 2);
    GEcontext.font = "30px Pixelify Sans";
    GEcontext.fillStyle = "white";
    GEcontext.fillText("Press 'Enter' to start", 10, canvas.height / 2);
  };
  let clearStartcanvas = () => {
    GTcontext.clearRect(0, 0, canvas.width, canvas.height);
    GEcontext.clearRect(0, 0, canvas.width, canvas.height);
  };

  let drawGameOver = () => {
    GOcontext.font = "64px Pixelify Sans";
    GOcontext.fillStyle = "white";
    GOcontext.fillText("Game Over!", 10, canvas.height / 2);
    RTcontext.font = "30px Pixelify Sans";
    RTcontext.fillStyle = "white";
    RTcontext.fillText("Press 'Enter' to restart", 10, canvas.height / 2);
  };
  let clearGameOver = () => {
    GOcontext.clearRect(0, 0, canvas.width, canvas.height);
    RTcontext.clearRect(0, 0, canvas.width, canvas.height);
  };

  
  let draw = () => {
    if(gameStart){
      drawStart();
    }
        if(!gameStart){
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawBackground();
          drawSquares();
          drawCurrentTetris();
          drawNextShape();
          drawScore();
            if (gameOver) {
              drawGameOver();
              canvas.style.display = "none";
            }else{
              canvas.style.display = "flex";
            }
        }
  };
  
  let getRandomShape = () => {
    return Object.create(shapes[Math.floor(Math.random() * shapes.length)]);
  };
  let resetVars = () => {
    initialTwoDArr = [];
    for (let i = 0; i < squareCountY; i++) {
      let temp = [];
      for (let j = 0; j < squareCountX; j++) {
        temp.push({ imageX: -1, imageY: -1 });
      }
      initialTwoDArr.push(temp);
    }
    score = 0;
    gameOver = false;
    currentShape = getRandomShape();
    nextShape = getRandomShape();
    gameMap = initialTwoDArr;
  };
  
  window.addEventListener("keydown", (event) => {
    const key = event.key;

    if(gameStart){
      if (key === "Enter") {
        clearStartcanvas();
        gameStart = false;
      }
    }

    if(gameOver){
      if (key === "Enter") {
        resetVars();
        clearGameOver();
        gameStart = false;
      }

    }
    if (key === "ArrowLeft") currentShape.moveLeft();
    else if (key === "ArrowUp") currentShape.changeRotation();
    else if (key === "ArrowRight") currentShape.moveRight();
    else if (key === "ArrowDown") currentShape.moveBottom();
  });


  
  resetVars();
  gameLoop();
