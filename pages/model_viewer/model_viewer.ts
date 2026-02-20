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
  public camera!: THREE.PerspectiveCamera;
  private hud_scene = new THREE.Scene();
  private hud_camera!: THREE.OrthographicCamera;

  private controls!: OrbitControls;

  private currentModel?: THREE.Object3D;

  private pressEnterText!: HUDText;

  private mixer?: THREE.AnimationMixer;
  private actions: THREE.AnimationAction[] = [];
  private activeAction?: THREE.AnimationAction;
  private clock = new THREE.Clock();

  private animationLineStartY = 0;
  private animationLineHeight = 48;
  private animationNames: string[] = [];

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private infoTextGroup = new THREE.Group();

  private animationSprites: THREE.Sprite[] = [];
  private hoveredSprite?: THREE.Sprite;

  constructor(private renderer: THREE.WebGLRenderer)
  {
    this.initThree();
    this.initHUD();
    this.initDragAndDrop();
  }

  private initThree()
  {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.01,
      10000
    );

    this.camera.position.set(0, 0, 20);
    this.camera.lookAt(0, 0, 0);

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

    this.renderer.domElement.addEventListener("click", (e) =>
    {
      if (!this.animationNames.length) return;

      const rect = this.renderer.domElement.getBoundingClientRect();

      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.hud_camera);

      const intersects = this.raycaster.intersectObjects(
        this.infoTextGroup.children
      );

      if (intersects.length > 0)
      {
        const obj = intersects[0].object;
        const data = obj.userData;

        if (data?.type === "animation")
        {
          this.playAnimation(data.index);
        }
      }
    });
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
    this.infoTextGroup.clear();

    if (this.currentModel)
      this.scene.remove(this.currentModel);

    this.currentModel = object;

    this.mixer = undefined;
    this.actions = [];
    this.activeAction = undefined;

    this.centerModel(object);
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    this.scene.add(object);
    this.pressEnterText.setVisible(false);

    const info = this.getModelInfo(object);

    this.infoTextGroup.position.set(
      -window.innerWidth * 0.25,
       window.innerHeight * 0.25,
      0
    );

    let y = 0;
    const lineHeight = 48;

    const addLine = (text: string, color = "#ffffff") =>
    {
      const sprite = this.createTextSprite(text, color);

      sprite.position.set(0, -y, 0);

      this.infoTextGroup.add(sprite);
      y += lineHeight;
    };

    addLine(`Vertices: ${info.vertices}`);
    addLine(`Indices: ${info.indices}`);
    addLine(`Faces: ${info.faces}`);
    addLine(`Meshes:`);

    info.meshNames.forEach(name =>
    {
      addLine(`• ${name}`);
    });

    if (animations.length > 0)
    {
      addLine("Animations:");

      const animationStartY = y;

      this.mixer = new THREE.AnimationMixer(object);
      this.animationNames = animations.map(a => a.name || "(unnamed)");
      this.actions = [];

      animations.forEach(clip =>
      {
        this.actions.push(this.mixer!.clipAction(clip));
      });

      this.playAnimation(0);

      this.rebuildAnimationList(animationStartY, lineHeight);
    }
    else
    {
      addLine("No animations");
    }

    this.hud_scene.add(this.infoTextGroup);

    this.infoTextGroup.scale.set(0.5, 0.5, 1);
  }

  private rebuildAnimationList(startY: number, lineHeight: number)
  {
    this.animationSprites.forEach(s => this.infoTextGroup.remove(s));
    this.animationSprites = [];

    let y = startY;

    this.animationNames.forEach((name, i) =>
    {
      const isActive = this.actions[i] === this.activeAction;
      const prefix = isActive ? "▶ " : "• ";
      const color  = isActive ? "#ffff00" : "#ffffff";

      const sprite = this.createTextSprite(prefix + name, color);
      sprite.position.set(0, -y, 0);

      sprite.userData = {
        type: "animation",
        index: i
      };

      this.infoTextGroup.add(sprite);
      this.animationSprites.push(sprite);

      y += lineHeight;
    });
  }

  private createTextSprite(text: string,color = "#ffffff",fontSize = 24): THREE.Sprite
  {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    ctx.font = `${fontSize}px Arial`;
    const metrics = ctx.measureText(text);

    canvas.width = metrics.width + 20;
    canvas.height = fontSize + 20;

    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(text, 10, 10);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });

    const sprite = new THREE.Sprite(material);

    sprite.center.set(0, 1);

    sprite.scale.set(
      canvas.width,
      canvas.height,
      1
    );

    return sprite;
  }

  private playAnimation(index: number)
  {
    if (!this.mixer || !this.actions[index]) return;

    if (this.activeAction)
    {
      this.activeAction.fadeOut(0.3);
    }

    this.activeAction = this.actions[index];
    this.activeAction
      .reset()
      .fadeIn(0.3)
      .play();

    this.rebuildAnimationList(-(this.animationSprites[0]?.position.y ?? 0), 48);
  }

  public update(time: number)
  {
    const delta = this.clock.getDelta();

    if (this.mixer) this.mixer.update(delta);

    this.controls.update();

    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);

    this.renderer.clearDepth();
    this.renderer.render(this.hud_scene, this.hud_camera);
  }
}
