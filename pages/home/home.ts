import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export class Home
{
  private torus!: THREE.Mesh;
  private light!: THREE.PointLight;
  public scene!: THREE.Scene;

  constructor(private renderer: THREE.WebGLRenderer, private camera: THREE.PerspectiveCamera)
  {
    this.scene = new THREE.Scene();
    this.renderer = renderer;
    this.camera = camera;

    this.torus = new THREE.Mesh(
      new THREE.TorusKnotGeometry(10.887, 0.8712, 64, 15, 15, 11),
      new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        metalness: 0.9,
        roughness: 0.15,
        wireframe: true
      })
    );
    this.torus.scale.set(0.1, 0.1, 0.1);
    this.scene.add(this.torus);

    this.light = new THREE.PointLight(0xffffff, 1);
    this.light.position.set(5, 5, 5);
    this.scene.add(this.light);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  }

  public update(time: number)
  {
    this.torus.rotation.x += 0.001;
    this.torus.rotation.y += 0.0015;

    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);
  }
}
