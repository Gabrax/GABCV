

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

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

function animate() {
	requestAnimationFrame( animate );

	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;

	renderer.render( scene, camera );
}

animate();




