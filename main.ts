import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );

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
camera.position.y = -10;
//camera.position.x = 12;
//camera.rotation.x += 1;
camera.lookAt(0, 0, 0);
//console.log(camera.lo)
//


var vec = new THREE.Vector3(); // create once and reuse
var pos = new THREE.Vector3(); // create once and reuse
const projectileGeometry = new THREE.CapsuleGeometry( 0.3, 0.5, 4, 8); 
projectileGeometry.applyMatrix4( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );

const projectileMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } ); 
const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
const projectileBox = new THREE.Box3().setFromObject(projectile);
let projectileAdded = false;
let direction = 1;

window.addEventListener("mousedown", (event) => {
    // shoot projectile
    vec.set(
        ( event.clientX / window.innerWidth ) * 2 - 1,
        - ( event.clientY / window.innerHeight ) * 2 + 1,
        0.5 );

    vec.unproject( camera );

    vec.sub( camera.position ).normalize();

    var distance = - camera.position.z / vec.z;

    pos.copy( camera.position ).add( vec.multiplyScalar( distance ) );
    console.log(pos);
    projectile.position.x = cube.position.x;
    projectile.position.y = cube.position.y;
    projectile.position.z = cube.position.z;
    //console.log(projectile.rotation.z);
    //projectile.setRotationFromAxisAngle
    //projectile.rotateZ
    //pos.
    // find angle of rotation between tank and mouse pointer vector
    const testVector = new THREE.Vector3();
    testVector.copy(cube.position);
    const xAxis = new THREE.Vector3(0, 0, 1)
    //const other = pos.sub(cube.position);
    //THREE.vec
    const other = testVector.add(pos);
    const cosine = xAxis.dot(other) / (other.length());
    // const ajngle = Math.acos(cosine);
    //projectile.quaternion.setFromUnitVectors(xAxis, pos.clone().normalize());
    //projectile.setRotationFromAxisAngle
    //console.log(pos);
    //console.log(pos.applyAxisAngle(xAxis, Math.PI/2))
    projectile.lookAt(pos);
    //projectile.rotateZ(Math.PI/2)


    console.log(projectile.rotation);
    //console.log(projectile.rotation.x)
    //projectile.rotateZ(angle);
    //projectile.rotation.z = angle;
    //projectile.rotation.z = angle;
    //console.log(projectile.rotation.z);
    scene.add(projectile);
    projectileAdded = true;
})

const keys = new Set();
const arrowKeys = new Set(["w", "a", "s", "d", "y"]);
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

//document.addEventListener("click", (e) => {
    //console.log((e.clientX / window.innerWidth) * 2 - 1);
    //console.log(-(e.clientY / window.innerHeight) * 2 + 1);
//})

const boxGeometry = new THREE.BoxGeometry(20, 2, 5);
const loader = new THREE.TextureLoader();
const boxMesh = new THREE.MeshStandardMaterial({
    map: loader.load('https://threejsfundamentals.org/threejs/lessons/resources/images/compressed-but-large-wood-texture.jpg')
 });
boxMesh.color.convertSRGBToLinear();
const standardBox = new THREE.Mesh(boxGeometry, boxMesh);
standardBox.position.set(0, 8, 2);
scene.add(standardBox);

const light = new THREE.HemisphereLight(0xddeeff, 0x202020, 5);
light.position.set(0, 0, 0);
scene.add(light);

const helper = new THREE.BoxHelper(cube);
const boundingBox = new THREE.Box3().setFromObject(cube);
const boundingBox2 = new THREE.Box3().setFromObject(standardBox);
//console.log(boundingBox2.min)
//console.log(boundingBox2.max)
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
    //
    if (keys.has("y")) {
        projectile.translateZ(0.05);
    }

    if (keys.has("a")) {
        cube.rotateZ(0.02);
    }

    if (keys.has("w")) {
        console.log(cube.position);
        // console.log(boundingBox.min);
        // console.log(boundingBox.max);
        // console.log(boundingBox.intersectsBox(boundingBox2));
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
        console.log(cube.position);
        cube.translateY(-0.05);
        boundingBox.setFromObject(cube);
        if (boundingBox.intersectsBox(boundingBox2)) {
            cube.translateY(0.05);
        }
        // }
    }
    if (projectileAdded) {
        projectile.translateZ(direction * 0.05);
        // projectile.rotateX(-0.01);
        projectileBox.setFromObject(projectile);
        if (projectileBox.intersectsBox(boundingBox2)) {
            direction = -1;
            ///rojectile.rotateX(Math.PI/2);
            //projectile.translateZ(direction * 0.05);
            //projectile.
            projectile.rotation.y *= -1;
        }
    }
}
animate();
