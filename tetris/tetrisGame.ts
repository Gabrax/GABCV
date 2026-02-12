//import "https://cdnjs.cloudflare.com/ajax/libs/three.js/102/three.js";

const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    varying vec2 vUv;
    uniform vec3 colorStart;
    uniform vec3 colorEnd;
    void main() {
        gl_FragColor = vec4(mix(colorStart, colorEnd, vUv.y), 1.0);
    }
`;

import * as THREE from "three";

type Cell = { imageX: number; imageY: number };
type FigureTemplate = { imageX: number; imageY: number; shape: number[][] };

const FIGURES: FigureTemplate[] = [
  { imageX: 0, imageY: 120, shape: [[0,1,0],[0,1,0],[1,1,0]] },
  { imageX: 0, imageY: 96,  shape: [[0,0,0],[1,1,1],[0,1,0]] },
  { imageX: 0, imageY: 72,  shape: [[0,1,0],[0,1,0],[0,1,1]] },
  { imageX: 0, imageY: 48,  shape: [[0,0,0],[0,1,1],[1,1,0]] },
  { imageX: 0, imageY: 24,  shape: [[1],[1],[1],[1]] },
  { imageX: 0, imageY: 0,   shape: [[1,1],[1,1]] },
  { imageX: 0, imageY: 48,  shape: [[0,0,0],[1,1,0],[0,1,1]] }
];

class Figure {
  public x = 0;
  public y = 0;
  public shape: number[][];

  constructor(
    public readonly imageX: number,
    public readonly imageY: number,
    template: number[][]
  ) {
    this.shape = template.map(r => [...r]);
  }

  get width() { return this.shape[0].length; }
  get height() { return this.shape.length; }

  rotateRight(): number[][] {
    const h = this.height;
    const w = this.width;
    const out = Array.from({ length: w }, () => Array(h).fill(0));

    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        out[x][h - 1 - y] = this.shape[y][x];

    return out;
  }
}

class Board {
  public grid: Cell[][];

  constructor(
    public readonly width: number,
    public readonly height: number
  ) {
    this.grid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ({ imageX: -1, imageY: -1 }))
    );
  }

  isValid(fig: Figure, ox = 0, oy = 0, shape = fig.shape): boolean {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;

        const px = fig.x + x + ox;
        const py = fig.y + y + oy;

        if (
          px < 0 || px >= this.width ||
          py < 0 || py >= this.height ||
          this.grid[py][px].imageX !== -1
        ) return false;
      }
    }
    return true;
  }

  lock(fig: Figure) {
    for (let y = 0; y < fig.shape.length; y++)
      for (let x = 0; x < fig.shape[y].length; x++)
        if (fig.shape[y][x])
          this.grid[fig.y + y][fig.x + x] = {
            imageX: fig.imageX,
            imageY: fig.imageY
          };
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

export class Tetris
{
  private board: Board;
  private current!: Figure;
  private next!: Figure;

  private scene = new THREE.Scene();
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;

  private geometry = new THREE.BoxGeometry(1, 1, 1);
  private boardMesh!: THREE.InstancedMesh;
  private figureMesh!: THREE.InstancedMesh;

  private maxBoardInstances: number;
  private maxFigureInstances = 16;

  private lastUpdate = 0;
  private fallDelay = 400;

  private tempMatrix = new THREE.Matrix4();

  public score = 0;
  public gameOver = false;

  constructor(width: number, height: number) {
    this.board = new Board(width, height);
    this.maxBoardInstances = width * height;

    this.spawn();
    this.initThree();
    requestAnimationFrame(this.loop);
  }

  private initThree()
  {
    const container = document.getElementById("container")!;

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(
      this.board.width / 2,
      -this.board.height / 2,
      40
    );
    this.camera.lookAt(this.board.width / 2, -this.board.height / 2, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);

    const boardMaterial = new THREE.MeshStandardMaterial({ color: "cyan" });
    const figureMaterial = new THREE.MeshStandardMaterial({ color: "orange" });

    this.boardMesh = new THREE.InstancedMesh(
      this.geometry,
      boardMaterial,
      this.maxBoardInstances
    );

    this.figureMesh = new THREE.InstancedMesh(
      this.geometry,
      figureMaterial,
      this.maxFigureInstances
    );

    this.scene.add(this.boardMesh);
    this.scene.add(this.figureMesh);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(10, 20, 20);
    this.scene.add(light);

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private randomFigure(): Figure
  {
    const t = FIGURES[Math.floor(Math.random() * FIGURES.length)];
    const f = new Figure(t.imageX, t.imageY, t.shape);
    f.x = Math.floor(this.board.width / 2 - f.width / 2);
    f.y = 0;
    return f;
  }

  private spawn()
  {
    this.current = this.next ?? this.randomFigure();
    this.next = this.randomFigure();

    if (!this.board.isValid(this.current)) {
      this.gameOver = true;
    }
  }

  private update(time: number)
  {
    if (time - this.lastUpdate < this.fallDelay) return;
    this.lastUpdate = time;

    if (this.board.isValid(this.current, 0, 1)) {
      this.current.y++;
    } else {
      this.board.lock(this.current);
      this.board.clearLines();
      this.spawn();
    }
  }

  private renderBoard()
  {
    let i = 0;

    for (let y = 0; y < this.board.height; y++)
      for (let x = 0; x < this.board.width; x++)
        if (this.board.grid[y][x].imageX !== -1) {
          this.tempMatrix.makeTranslation(x, -y, 0);
          this.boardMesh.setMatrixAt(i++, this.tempMatrix);
        }

    this.boardMesh.count = i;
    this.boardMesh.instanceMatrix.needsUpdate = true;
  }

  private renderFigure()
  {
    let i = 0;

    for (let y = 0; y < this.current.shape.length; y++)
      for (let x = 0; x < this.current.shape[y].length; x++)
        if (this.current.shape[y][x]) {
          this.tempMatrix.makeTranslation(
            this.current.x + x,
            -(this.current.y + y),
            0
          );
          this.figureMesh.setMatrixAt(i++, this.tempMatrix);
        }

    this.figureMesh.count = i;
    this.figureMesh.instanceMatrix.needsUpdate = true;
  }

  private loop = (time: number) =>
  {
    if (!this.gameOver) {
      this.update(time);
      this.renderBoard();
      this.renderFigure();
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(this.loop);
    }
  };

  move(dx: number)
  {
    if (this.board.isValid(this.current, dx, 0))
      this.current.x += dx;
  }

  rotate()
  {
    const r = this.current.rotateRight();
    if (this.board.isValid(this.current, 0, 0, r))
      this.current.shape = r;
  }

  softDrop()
  {
    if (this.board.isValid(this.current, 0, 1))
      this.current.y++;
  }

  hardDrop()
  {
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
