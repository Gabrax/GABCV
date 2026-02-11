import "https://cdnjs.cloudflare.com/ajax/libs/three.js/102/three.js";

type Cell = { imageX: number; imageY: number };

type FigureTemplate = { imageX: number; imageY: number; shape: number[][]; };

export class Figure
{
  public x = 0;
  public y = 0;
  public shape: number[][];

  constructor(
    public readonly imageX: number,
    public readonly imageY: number,
    template: number[][]
  ) {
    this.shape = template.map(row => [...row]);
  }

  get width() {
    return this.shape[0].length;
  }

  get height() {
    return this.shape.length;
  }

  rotateRight(): number[][] {
    const h = this.height;
    const w = this.width;
    const rotated = Array.from({ length: w }, () => Array(h).fill(0));

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        rotated[x][h - 1 - y] = this.shape[y][x];
      }
    }

    return rotated;
  }
}

export class Board {
  public grid: Cell[][];

  constructor(
    public readonly width: number,
    public readonly height: number
  ) {
    this.grid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ({ imageX: -1, imageY: -1 }))
    );
  }

  isValid(fig: Figure, offsetX = 0, offsetY = 0, shape = fig.shape): boolean {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;

        const px = fig.x + x + offsetX;
        const py = fig.y + y + offsetY;

        if (
          px < 0 ||
          px >= this.width ||
          py < 0 ||
          py >= this.height ||
          this.grid[py][px].imageX !== -1
        ) {
          return false;
        }
      }
    }
    return true;
  }

  lock(fig: Figure) {
    for (let y = 0; y < fig.shape.length; y++) {
      for (let x = 0; x < fig.shape[y].length; x++) {
        if (!fig.shape[y][x]) continue;
        this.grid[fig.y + y][fig.x + x] = {
          imageX: fig.imageX,
          imageY: fig.imageY
        };
      }
    }
  }

  clearLines(): number {
    let cleared = 0;

    for (let y = this.height - 1; y >= 0; y--) {
      if (this.grid[y].every(c => c.imageX !== -1)) {
        this.grid.splice(y, 1);
        this.grid.unshift(
          Array.from({ length: this.width }, () => ({ imageX: -1, imageY: -1 }))
        );
        cleared++;
        y++;
      }
    }

    return cleared;
  }
}

const FIGURES: FigureTemplate[] =
[
  { imageX: 0, imageY: 120, shape: [[0,1,0],[0,1,0],[1,1,0]] },
  { imageX: 0, imageY: 96,  shape: [[0,0,0],[1,1,1],[0,1,0]] },
  { imageX: 0, imageY: 72,  shape: [[0,1,0],[0,1,0],[0,1,1]] },
  { imageX: 0, imageY: 48,  shape: [[0,0,0],[0,1,1],[1,1,0]] },
  { imageX: 0, imageY: 24,  shape: [[1],[1],[1],[1]] },
  { imageX: 0, imageY: 0,   shape: [[1,1],[1,1]] },
  { imageX: 0, imageY: 48,  shape: [[0,0,0],[1,1,0],[0,1,1]] }
];

export class Tetris
{
  private canvas!: HTMLCanvasElement;
  private image!: HTMLImageElement;
  private ctx!: CanvasRenderingContext2D;

  private board: Board;
  private current!: Figure;
  private next!: Figure;

  private lastUpdate = 0;
  private fallDelay = 400;

  public score = 0;
  public gameOver = false;

  constructor(
    width: number,
    height: number,
    private cellSize: number
  ) {
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.ctx = canvas.getContext("2d")!;
    this.image = document.getElementById("image") as HTMLImageElement;

    this.board = new Board(width, height);
    this.spawn();
    requestAnimationFrame(this.loop);
  }

  private randomFigure(): Figure {
    const t = FIGURES[Math.floor(Math.random() * FIGURES.length)];
    const f = new Figure(t.imageX, t.imageY, t.shape);
    f.x = Math.floor(this.board.width / 2 - f.width / 2);
    f.y = 0;
    return f;
  }

  private spawn() {
    this.current = this.next ?? this.randomFigure();
    this.next = this.randomFigure();

    if (!this.board.isValid(this.current)) {
      this.gameOver = true;
    }
  }

  private update(time: number) {
    if (time - this.lastUpdate < this.fallDelay) return;
    this.lastUpdate = time;

    if (this.board.isValid(this.current, 0, 1)) {
      this.current.y++;
    } else {
      this.board.lock(this.current);
      const cleared = this.board.clearLines();
      this.score += cleared * 1000;
      this.spawn();
    }
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    for (let y = 0; y < this.board.height; y++) {
      for (let x = 0; x < this.board.width; x++) {
        const c = this.board.grid[y][x];
        if (c.imageX !== -1) {
          this.ctx.drawImage(
            this.image,
            c.imageX, c.imageY, 24, 24,
            x * this.cellSize, y * this.cellSize,
            this.cellSize, this.cellSize
          );
        }
      }
    }

    for (let y = 0; y < this.current.shape.length; y++) {
      for (let x = 0; x < this.current.shape[y].length; x++) {
        if (!this.current.shape[y][x]) continue;
        this.ctx.drawImage(
          this.image,
          this.current.imageX, this.current.imageY, 24, 24,
          (this.current.x + x) * this.cellSize,
          (this.current.y + y) * this.cellSize,
          this.cellSize, this.cellSize
        );
      }
    }
  }

  private loop = (time: number) => {
    if (!this.gameOver) {
      this.update(time);
      this.draw();
      requestAnimationFrame(this.loop);
    }
  };

  move(dx: number) {
    if (this.board.isValid(this.current, dx, 0)) {
      this.current.x += dx;
    }
  }

  rotate() {
    const rotated = this.current.rotateRight();
    if (this.board.isValid(this.current, 0, 0, rotated)) {
      this.current.shape = rotated;
    }
  }

  softDrop() {
    if (this.board.isValid(this.current, 0, 1)) {
      this.current.y++;
      this.score += 1;
    }
  }

  hardDrop() {
    while (this.board.isValid(this.current, 0, 1)) {
      this.current.y++;
      this.score += 10;
    }
  }

  reset() {
    this.board = new Board(this.board.width, this.board.height);
    this.score = 0;
    this.gameOver = false;
    this.spawn();
    requestAnimationFrame(this.loop);
  }
}
