

function mainprofileGIT(){
  window.open("https://github.com/Gabrax", "_blank");
}

function mainprofileLI(){
  window.open("https://www.linkedin.com/in/gabriel-ozeg-136481200/", "_blank");
}

document.addEventListener("DOMContentLoaded", function() {
  var homeLink = document.querySelector('.link a[href="#"]');
  
    homeLink.addEventListener("click", function(event) {
        // Prevent the default behavior of the link
        event.preventDefault();
        
        // Remove and reapply the 'home' class to trigger the animation
        homeLink.classList.remove('home');
        setTimeout(function() {
            homeLink.classList.add('home');
        }, 10); // Small delay to allow class removal to take effect
    });
});

import * as THREE from 'three';
//import { Noise } from 'noisejs';
let scene, camera, renderer,controls, sphere;

function init(){
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#292728");
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild(renderer.domElement);
  //controls = new THREE.OrbitControls( camera, renderer.domElement );
  //controls.autoRotate = false;
  
  var light = new THREE.DirectionalLight(0xffffff, 1.2);
  light.position.set(100, 100, 100);
  scene.add(light);
  
  var geometry = new THREE.SphereGeometry( 1, 12, 16 ); 
  var material = new THREE.MeshLambertMaterial( { color: 0xFAF9F6,wireframe: false }); 
  sphere = new THREE.Mesh( geometry, material ); 
  scene.add( sphere );
  
  
  camera.position.z = 5;

}


function onWindowResize(){
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);

//const noise = new Noise(Math.random());

function update(){
  
  var time = performance.now() * 0.001;
  for (var i=0; i < sphere.geometry.vertices.length; i++){
    var p = sphere.geometry.vertices[i];
    p.normalize().multiplyScalar(1 + 0.3 * noise.perlin3(p.x + time, p.y, p.z));
  }
  sphere.geometry.verticesNeedUpdate = true;
  sphere.geometry.computeVertexNormals();
  sphere.geometry.normalsNeedUpdate = true;
}


function animate() {
  requestAnimationFrame( animate );
  //update();
  
  
	//sphere.rotation.x += 0.01;
	//sphere.rotation.y += 0.01;
  //cube.rotation.x += 0.01;
	//cube.rotation.y += 0.01;
  
	renderer.render( scene, camera );
}


init();
animate();







