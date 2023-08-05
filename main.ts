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
camera.position.y = -6;
//camera.position.x = 12;
//camera.rotation.x += 1;
camera.lookAt(0, 0, 0);
//console.log(camera.lo)

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

const boxGeometry = new THREE.BoxGeometry(5, 2, 5);
const loader = new THREE.TextureLoader();
const boxMesh = new THREE.MeshStandardMaterial({
    map: loader.load('https://threejsfundamentals.org/threejs/lessons/resources/images/compressed-but-large-wood-texture.jpg')
 });
boxMesh.color.convertSRGBToLinear();
const standardBox = new THREE.Mesh(boxGeometry, boxMesh);
standardBox.position.set(0, 10, 5);
scene.add(standardBox);

const light = new THREE.HemisphereLight(0xddeeff, 0x202020, 3);
//light.position.set(0, 0, 0);
scene.add(light);


function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
    //boxMesh.rotateZ(0.01);
    //standardBox.rotateX(0.01);
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