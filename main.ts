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
// const test = cube.geometry; 
// console.log(test);
// const boundingBox = cube.geometry.computeBoundingBox();

camera.position.z = 25;
camera.position.y = -6;
//camera.position.x = 12;
//camera.rotation.x += 1;
camera.lookAt(0, 0, 0);
//console.log(camera.lo)

const keys = new Set();
const arrowKeys = new Set(["w", "a", "s", "d"]);
window.addEventListener("keyup", (e) => {
    const key = e.key;
    console.log(key);
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

const boxGeometry = new THREE.BoxGeometry(20, 2, 5);
const loader = new THREE.TextureLoader();
const boxMesh = new THREE.MeshStandardMaterial({
    map: loader.load('https://threejsfundamentals.org/threejs/lessons/resources/images/compressed-but-large-wood-texture.jpg')
 });
boxMesh.color.convertSRGBToLinear();
const standardBox = new THREE.Mesh(boxGeometry, boxMesh);
standardBox.position.set(0, 11, 2);
scene.add(standardBox);

const light = new THREE.HemisphereLight(0xddeeff, 0x202020, 5);
light.position.set(0, 0, 0);
scene.add(light);

const helper = new THREE.BoxHelper(cube);
const boundingBox = new THREE.Box3().setFromObject(cube);
const boundingBox2 = new THREE.Box3().setFromObject(standardBox);
console.log(boundingBox2.min)
console.log(boundingBox2.max)
//cube.geometry.compu


function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
    boundingBox.setFromObject(cube);
    // helper.update();
    //boxMesh.rotateZ(0.01);
    //standardBox.rotateX(0.01);
    // console.log(cube.position)

	//this.position.add( _v1.multiplyScalar( distance ) );

    //console.log(moving_up)

    
    //test_dir.multiplyScalar(0.05)

    if (keys.has("a")) {
        cube.rotateZ(0.02);
    }

    if (keys.has("w")) {
        console.log(boundingBox.min);
        console.log(boundingBox.max);
        console.log(boundingBox.intersectsBox(boundingBox2));
        // if (cube.position.y < standardBox.position.y - 1) {
        cube.translateY(0.05);
        boundingBox.setFromObject(cube);
        if (boundingBox.intersectsBox(boundingBox2)) {
            cube.translateY(-0.05);
        }
        // }
    }

    if (keys.has("d")) {
        cube.rotateZ(-0.02);
    }

    if (keys.has("s")) {
        // if (cube.position.y < standardBox.position.y) {
        cube.translateY(-0.05);
        boundingBox.setFromObject(cube);
        if (boundingBox.intersectsBox(boundingBox2)) {
            cube.translateY(0.05);
        }
        // }
    }
}
animate();