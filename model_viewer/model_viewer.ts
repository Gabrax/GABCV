import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class HUDText
{
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  sprite: THREE.Sprite;

  constructor(text: string, fontSize: number = 48, width: number = 512, height: number = 128)
  {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;

    this.ctx = this.canvas.getContext("2d")!;
    this.ctx.font = `bold ${fontSize}px monospace`;
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

export class ModelViewer
{
  private scene = new THREE.Scene();
  private gltf_loader = new GLTFLoader();
  private obj_loader = new OBJLoader();
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;

  private controls!: OrbitControls;

  private currentModel?: THREE.Object3D;

  private tempMatrix = new THREE.Matrix4();

  private pressEnterText!: HUDText;

  constructor(width: number, height: number)
  {
    this.pressEnterText = new HUDText("DROP HERE MODEL FILE", 40);
    this.pressEnterText.sprite.position.set(0, 0, 0);
    this.scene.add(this.pressEnterText.sprite);

    this.initThree();
    this.initDragAndDrop();

    requestAnimationFrame(this.loop);
  }

  private initThree()
  {
    const container = document.getElementById("container")!;

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );

    this.camera.position.set(0, 0, 20);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(10, 20, 20);
    this.scene.add(light);


    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;

    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.enableRotate = true;

    this.controls.target.set(0, 0, 0);
    this.controls.update();

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.renderer.domElement.style.pointerEvents = 'auto';
    this.renderer.domElement.style.touchAction = 'none';
  }

  private initDragAndDrop()
  {
    const dropZone = this.renderer.domElement;

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('hover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('hover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('hover');

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];

      console.log(file);

      if (!file.name.toLowerCase().endsWith('.obj')) {
        alert('Please drop a valid .obj file');
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        const contents = event.target?.result as string;

        const object = this.obj_loader.parse(contents);

        console.log(object);

        if (this.currentModel) {
          this.scene.remove(this.currentModel);
        }

        this.currentModel = object;

        this.centerModel(object);

        this.controls.target.set(0, 0, 0);
        this.controls.update();

        this.scene.add(object);

        this.pressEnterText.setVisible(false);
      };

      reader.readAsText(file);
    });

    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => e.preventDefault());
  }

  private centerModel(object: THREE.Object3D)
  {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    object.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

    cameraZ *= 1.5;

    this.camera.position.set(0, 0, cameraZ);
    this.camera.lookAt(0, 0, 0);
  }

  private loop = (time: number) =>
  {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.loop);
  };
}
