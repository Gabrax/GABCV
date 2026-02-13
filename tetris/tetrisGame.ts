//import "https://cdnjs.cloudflare.com/ajax/libs/three.js/102/three.js";

import * as THREE from "three";

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

type ShapeTemplate = { imageX: number; imageY: number; shape: number[][] };

const SHAPES: ShapeTemplate[] =
[
  { imageX: 0, imageY: 120, shape: [[0,1,0],[0,1,0],[1,1,0]] },
  { imageX: 0, imageY: 96,  shape: [[0,0,0],[1,1,1],[0,1,0]] },
  { imageX: 0, imageY: 72,  shape: [[0,1,0],[0,1,0],[0,1,1]] },
  { imageX: 0, imageY: 48,  shape: [[0,0,0],[0,1,1],[1,1,0]] },
  { imageX: 0, imageY: 24,  shape: [[1],[1],[1],[1]] },
  { imageX: 0, imageY: 0,   shape: [[1,1],[1,1]] },
  { imageX: 0, imageY: 48,  shape: [[0,0,0],[1,1,0],[0,1,1]] }
];

class Shape
{
  public x = 0;
  public y = 0;
  public shape: number[][];

  constructor(public readonly imageX: number, public readonly imageY: number, template: number[][])
  {
    this.shape = template.map(r => [...r]);
  }

  get width() { return this.shape[0].length; }
  get height() { return this.shape.length; }

  rotateRight(): number[][]
  {
    const h = this.height;
    const w = this.width;
    const out = Array.from({ length: w }, () => Array(h).fill(0));

    for (let y = 0; y < h; y++)
    {
      for (let x = 0; x < w; x++)
      {
        out[x][h - 1 - y] = this.shape[y][x];
      }
    }

    return out;
  }
}

type Cell = { imageX: number; imageY: number };

class Board
{
  public grid: Cell[][];

  constructor(public readonly width: number, public readonly height: number)
  {
    this.grid = Array.from({ length: height }, () => Array.from({ length: width }, () => ({ imageX: -1, imageY: -1 })));
  }

  isValid(fig: Shape, ox = 0, oy = 0, shape = fig.shape): boolean
  {
    for (let y = 0; y < shape.length; y++)
    {
      for (let x = 0; x < shape[y].length; x++)
      {
        if (!shape[y][x]) continue;

        const px = fig.x + x + ox;
        const py = fig.y + y + oy;

        if (px < 0 || px >= this.width ||
           py < 0 || py >= this.height ||
           this.grid[py][px].imageX !== -1) return false;
      }
    }
    return true;
  }

  lock(fig: Shape) 
  {
    for (let y = 0; y < fig.shape.length; y++)
    {
      for (let x = 0; x < fig.shape[y].length; x++)
      {
        if (fig.shape[y][x]) this.grid[fig.y + y][fig.x + x] = { imageX: fig.imageX, imageY: fig.imageY };
      }
    }
  }

  clearLines(): number
  {
    let cleared = 0;
    for (let y = this.height - 1; y >= 0; y--)
    {
      if (this.grid[y].every(c => c.imageX !== -1))
      {
        this.grid.splice(y, 1);
        this.grid.unshift(Array.from({ length: this.width }, () => ({ imageX: -1, imageY: -1 })));
        cleared++;
        y++;
      }
    }
    return cleared;
  }
}

class HUDText
{
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  sprite: THREE.Sprite;

  constructor(
    text: string,
    fontSize = 48,
    width = 512,
    height = 128
  ) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;

    this.ctx = this.canvas.getContext("2d")!;
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;

    const material = new THREE.SpriteMaterial({
      map: this.texture,
      transparent: true
    });

    this.sprite = new THREE.Sprite(material);
    this.sprite.scale.set(10, 2.5, 1);

    this.setText(text);
  }

  setText(text: string)
  {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
    this.texture.needsUpdate = true;
  }

  setVisible(v: boolean)
  {
    this.sprite.visible = v;
  }
}

export class Tetris
{
  private board: Board;
  private current!: Shape;
  private next!: Shape;

  private scene = new THREE.Scene();
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;

  private geometry = new THREE.BoxGeometry(1, 1, 1);
  private boardMesh!: THREE.InstancedMesh;
  private figureMesh!: THREE.InstancedMesh;
  private ghostMesh!: THREE.InstancedMesh;
  private boardFrame = new THREE.Group();

  private maxBoardInstances: number;
  private maxShapeInstances = 16;

  private lastUpdate = 0;
  private fallDelay = 400;

  private tempMatrix = new THREE.Matrix4();

  public score = 0;
  public gameOver = false;

  private visualY = 0;
  private previousY = 0;
  private dropProgress = 0;

  public hardDropLocked = false;

  private scoreText!: HUDText;
  private pressEnterText!: HUDText;
  private blinkTimer = 0;
  public started = false;

  constructor(width: number, height: number)
  {
    this.board = new Board(width, height);
    this.maxBoardInstances = width * height;

    this.scoreText = new HUDText("SCORE: 0", 42);
    this.scoreText.sprite.position.set(
      this.board.width + 4,
      -2,
      0
    );
    this.scene.add(this.scoreText.sprite);

    this.pressEnterText = new HUDText("PRESS ENTER TO PLAY", 48);
    this.pressEnterText.sprite.position.set(
      this.board.width / 2,
      -this.board.height / 2,
      5
    );
    this.scene.add(this.pressEnterText.sprite);

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
    const ghostMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25
    });

    this.boardMesh = new THREE.InstancedMesh(
      this.geometry,
      boardMaterial,
      this.maxBoardInstances
    );

    this.figureMesh = new THREE.InstancedMesh(
      this.geometry,
      figureMaterial,
      this.maxShapeInstances
    );

    this.ghostMesh = new THREE.InstancedMesh(
      this.geometry,
      ghostMaterial,
      this.maxShapeInstances
    );

    this.scene.add(this.boardMesh);
    this.scene.add(this.figureMesh);
    this.scene.add(this.ghostMesh);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(10, 20, 20);
    this.scene.add(light);

    this.createBoardFrame();

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private createBoardFrame()
  {
    const w = this.board.width;
    const h = this.board.height;

    const thickness = 0.15;
    const depth = 0.3;

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff
    });

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(w + thickness * 2, thickness, depth),
      material
    );
    top.position.set(w / 2 - 0.5, 0.5, 0);

    const bottom = new THREE.Mesh(
      new THREE.BoxGeometry(w + thickness * 2, thickness, depth),
      material
    );
    bottom.position.set(w / 2 - 0.5, -h + 0.5, 0);

    const left = new THREE.Mesh(
      new THREE.BoxGeometry(thickness, h, depth),
      material
    );
    left.position.set(-0.6, -h / 2 + 0.5, 0);

    const right = new THREE.Mesh(
      new THREE.BoxGeometry(thickness, h, depth),
      material
    );
    right.position.set(w - 0.4, -h / 2 + 0.5, 0);

    this.boardFrame.add(top, bottom, left, right);
    this.scene.add(this.boardFrame);
  }

  private randomShape(): Shape
  {
    const t = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const f = new Shape(t.imageX, t.imageY, t.shape);
    f.x = Math.floor(this.board.width / 2 - f.width / 2);
    f.y = 0;
    return f;
  }

  private spawn()
  {
    this.current = this.next ?? this.randomShape();
    this.next = this.randomShape();

    this.previousY = this.current.y;
    this.visualY = this.current.y;
    this.dropProgress = 0;

    if (!this.board.isValid(this.current)) this.gameOver = true;
  }

  private update(time: number)
  {
    const dt = time - this.lastUpdate;
    this.lastUpdate = time;

    this.dropProgress += dt / this.fallDelay;

    if (this.dropProgress >= 1)
    {
      this.dropProgress = 0;
      this.previousY = this.current.y;

      if (this.board.isValid(this.current, 0, 1)) this.current.y++;
      else
      {
        this.board.lock(this.current);
        this.board.clearLines();
        this.spawn();
        return;
      }
    }

    this.visualY = this.previousY +
                  (this.current.y - this.previousY) * this.dropProgress;
  }

  private renderGhost()
  {
    let ghostY = this.current.y;

    while (this.board.isValid(this.current, 0, ghostY - this.current.y + 1))
      ghostY++;

    let i = 0;

    for (let y = 0; y < this.current.shape.length; y++)
    {
      for (let x = 0; x < this.current.shape[y].length; x++)
      {
        if (this.current.shape[y][x])
        {
          this.tempMatrix.makeTranslation(
            this.current.x + x,
            -(ghostY + y),
            -0.2 // lekko w głąb
          );
          this.ghostMesh.setMatrixAt(i++, this.tempMatrix);
        }
      }
    }

    this.ghostMesh.count = i;
    this.ghostMesh.instanceMatrix.needsUpdate = true;
  }

  private renderBoard()
  {
    let i = 0;

    for (let y = 0; y < this.board.height; y++)
    {
      for (let x = 0; x < this.board.width; x++)
      {
        if (this.board.grid[y][x].imageX !== -1)
        {
          this.tempMatrix.makeTranslation(x, -y, 0);
          this.boardMesh.setMatrixAt(i++, this.tempMatrix);
        }
      }
    }
    this.boardMesh.count = i;
    this.boardMesh.instanceMatrix.needsUpdate = true;
  }

  private renderShape()
  {
    let i = 0;

    for (let y = 0; y < this.current.shape.length; y++)
    {
      for (let x = 0; x < this.current.shape[y].length; x++)
      {
        if (this.current.shape[y][x])
        {
          this.tempMatrix.makeTranslation(this.current.x + x,-(this.visualY + y),0);
          this.figureMesh.setMatrixAt(i++, this.tempMatrix);
        }
      }
    }
    this.figureMesh.count = i;
    this.figureMesh.instanceMatrix.needsUpdate = true;
  }

  private loop = (time: number) =>
  {
    if (!this.started)
    {
      this.blinkTimer += 0.016;
      this.pressEnterText.setVisible(
        Math.sin(this.blinkTimer * 3) > 0
      );
    }

    if (this.started && !this.gameOver)
    {
      this.update(time);
      this.renderBoard();
      this.renderGhost();
      this.renderShape();
    }
    else
    {
      this.boardMesh.count = 0;
      this.figureMesh.count = 0;
      this.ghostMesh.count = 0;
    }

    this.scoreText.setText(`SCORE: ${this.score}`);

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.loop);
  };

  move(dx: number)
  {
    if (this.board.isValid(this.current, dx, 0)) this.current.x += dx;
  }

  rotate()
  {
    const r = this.current.rotateRight();
    if (this.board.isValid(this.current, 0, 0, r)) this.current.shape = r;
  }

  softDrop()
  {
    if (this.board.isValid(this.current, 0, 1))
    {
      this.previousY = this.current.y;
      this.current.y++;
      this.visualY = this.current.y;
      this.dropProgress = 0;
    }
  }

  hardDrop()
  {
    if (this.hardDropLocked) return;
    this.hardDropLocked = true;

    this.previousY = this.current.y;

    while (this.board.isValid(this.current, 0, 1))
    {
      this.current.y++;
      this.score += 10;
    }

    this.visualY = this.current.y;
    this.dropProgress = 0;
  }

  reset()
  {
    this.board = new Board(this.board.width, this.board.height);
    this.score = 0;
    this.gameOver = false;
    this.spawn();
    requestAnimationFrame(this.loop);
  }
}
