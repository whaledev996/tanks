import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry( 2, 2, 0.5);
const material = new THREE.MeshBasicMaterial( { color: 0x4287f5 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 25;

const keys = new Set();
const arrowKeys = new Set(["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"]);
window.addEventListener("keyup", (e) => {
    const key = e.key;
    if (arrowKeys.has(key)) {
        keys.delete(key);
    }

});
window.addEventListener("keydown", (e) => {
    const key = e.key;
    if(arrowKeys.has(key)) {
        keys.add(key);
    }
});

function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
    if (keys.has("ArrowLeft")) {
        cube.rotateZ(0.02);
    }

    if (keys.has("ArrowUp")) {
        cube.translateY(0.05);
    }

    if (keys.has("ArrowRight")) {
        cube.rotateZ(-0.02);
    }

    if (keys.has("ArrowDown")) {
        cube.translateY(-0.05);
    }
}
animate();