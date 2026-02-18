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

  constructor(text: string, fontSize: number = 48, scale: number = 1, width: number = 512, height: number = 128)
  {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;

    this.ctx = this.canvas.getContext("2d")!;
    this.ctx.font = `bold ${fontSize}px monospace`;
    this.ctx.fillStyle = "white";
    //this.ctx.textAlign = "center";
    //this.ctx.textBaseline = "middle";
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "top";

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;

    const material = new THREE.SpriteMaterial({
      map: this.texture,
      transparent: true
    });

    this.sprite = new THREE.Sprite(material);
    const aspect = width / height;
    this.sprite.scale.set(scale * aspect, scale, 1);

    this.setText(text);
  }

  setText(text: string)
  {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const lines = text.split("\n");
    const lineHeight = 48;
    const startY = this.canvas.height / 2 - (lines.length - 1) * lineHeight / 2;

    const paddingX = 20;
    const paddingY = 20;


    lines.forEach((line, i) => {
      this.ctx.fillText(
        line,
        paddingX,
        paddingY + i * lineHeight
      );
    });

    this.texture.needsUpdate = true;
  }

  setVisible(v: boolean)
  {
    this.sprite.visible = v;
  }
}

export class ModelViewer
{
  private gltf_loader = new GLTFLoader();
  private obj_loader = new OBJLoader();
  private mtl_loader = new MTLLoader();
  private scene = new THREE.Scene();
  private camera!: THREE.PerspectiveCamera;
  private hud_scene = new THREE.Scene();
  private hud_camera!: THREE.OrthographicCamera;
  private renderer!: THREE.WebGLRenderer;

  private modelInfoText!: HUDText;

  private controls!: OrbitControls;

  private currentModel?: THREE.Object3D;

  private tempMatrix = new THREE.Matrix4();

  private pressEnterText!: HUDText;

  constructor(width: number, height: number)
  {
    this.initThree();
    this.initHUD();
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
    this.renderer.autoClear = false;
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
      const w = window.innerWidth;
      const h = window.innerHeight;

      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);

      this.hud_camera.left = -w / 2;
      this.hud_camera.right = w / 2;
      this.hud_camera.top = h / 2;
      this.hud_camera.bottom = -h / 2;
      this.hud_camera.updateProjectionMatrix();

      this.modelInfoText.sprite.position.set(
        -w / 2 + 320,
        h / 2 - 500,
        0
      );
    });

    this.renderer.domElement.style.pointerEvents = 'auto';
    this.renderer.domElement.style.touchAction = 'none';
  }

  private initHUD()
  {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.hud_camera = new THREE.OrthographicCamera(
      -w / 2,
      w / 2,
      h / 2,
      -h / 2,
      -10,
      10
    );

    this.hud_camera.position.z = 1;

    this.pressEnterText = new HUDText("DROP MODEL FILE", 48, 60, 800, 150);
    this.pressEnterText.sprite.position.set(80, 0, 0);
    this.hud_scene.add(this.pressEnterText.sprite);

    this.modelInfoText = new HUDText("", 28, 700, 600, 2000);

    this.modelInfoText.sprite.position.set(
      -w / 2 + 320,
      h / 2 - 500,
      0
    );

    this.modelInfoText.setVisible(false);
    this.hud_scene.add(this.modelInfoText.sprite);
  }

  private initDragAndDrop()
  {
    const dropZone = this.renderer.domElement;

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    dropZone.addEventListener('drop', (e) =>
    {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length === 0) return;

      const objFile  = files.find(f => f.name.toLowerCase().endsWith('.obj'));
      const mtlFile  = files.find(f => f.name.toLowerCase().endsWith('.mtl'));
      const gltfFile = files.find(f =>
        f.name.toLowerCase().endsWith('.gltf') ||
        f.name.toLowerCase().endsWith('.glb')
      );

      if (gltfFile)
      {
        const manager = new THREE.LoadingManager();

        manager.setURLModifier((url) =>
        {
          const filename = url.split('/').pop();
          const file = files.find(f => f.name === filename);
          return file ? URL.createObjectURL(file) : url;
        });

        const loader = new GLTFLoader(manager);

        loader.load(
          URL.createObjectURL(gltfFile),
          (gltf) =>
          {
            this.onModelLoaded(gltf.scene, gltf.animations);
          }
        );

        return;
      }

      if (objFile)
      {
        const manager = new THREE.LoadingManager();

        manager.setURLModifier((url) =>
        {
          const filename = url.split('/').pop();
          const file = files.find(f => f.name === filename);
          return file ? URL.createObjectURL(file) : url;
        });

        const objLoader = new OBJLoader(manager);
        const mtlLoader = new MTLLoader(manager);

        if (mtlFile)
        {
          const mtlURL = URL.createObjectURL(mtlFile);

          mtlLoader.load(mtlURL, (materials) =>
          {
            materials.preload();
            objLoader.setMaterials(materials);

            objLoader.load(
              URL.createObjectURL(objFile),
              (object) =>
              {
                this.onModelLoaded(object, []);
              }
            );
          });
        }
        else
        {
          objLoader.load(
            URL.createObjectURL(objFile),
            (object) =>
            {
              this.onModelLoaded(object, []);
            }
          );
        }

        return;
      }

      alert("Drop OBJ+MTL or GLTF/GLB");
    });

    window.addEventListener('dragover', e => e.preventDefault());
    window.addEventListener('drop', e => e.preventDefault());
  }

  private getModelInfo(object: THREE.Object3D)
  {
    let vertices = 0;
    let indices = 0;
    let faces = 0;
    const meshNames: string[] = [];

    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const geo = mesh.geometry;

        meshNames.push(mesh.name || "(unnamed)");

        if (geo.attributes.position) {
          vertices += geo.attributes.position.count;
        }

        if (geo.index) {
          indices += geo.index.count;
          faces += geo.index.count / 3;
        } else {
          faces += geo.attributes.position.count / 3;
        }
      }
    });

    return {
      vertices,
      indices,
      faces,
      meshNames
    };
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

  private onModelLoaded(object: THREE.Object3D,animations: THREE.AnimationClip[] = [])
  {
    if (this.currentModel)
      this.scene.remove(this.currentModel);

    this.currentModel = object;

    this.centerModel(object);
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    this.scene.add(object);
    this.pressEnterText.setVisible(false);

    const info = this.getModelInfo(object);

    const hasAnimations = animations && animations.length > 0;

    let animationText = "No animations";

    if (hasAnimations)
    {
      animationText =
        `Animations:\n` +
        animations.map(a => "• " + (a.name || "(unnamed)")).join("\n");
    }

    const text =`Vertices: ${info.vertices}\n` + 
                `Indices: ${info.indices}\n` + 
                `Faces: ${info.faces}\n` +
                `Meshes:\n${info.meshNames.map(n => "• " + n).join("\n")}\n` +
               `${animationText}`;

    this.modelInfoText.setText(text);
    this.modelInfoText.setVisible(true);
  }

  private loop = (time: number) =>
  {
    this.controls.update();

    this.renderer.clear();

    this.renderer.render(this.scene, this.camera);

    this.renderer.clearDepth();
    this.renderer.render(this.hud_scene, this.hud_camera);

    requestAnimationFrame(this.loop);
  };
}
