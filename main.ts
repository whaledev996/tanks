import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry( 1, 1, 0.5);
const material = new THREE.MeshBasicMaterial( { color: 0x4287f5 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 25;
camera.position.y = -10;
camera.lookAt(0, 0, 0);


var vec = new THREE.Vector3(); // create once and reuse
var pos = new THREE.Vector3(); // create once and reuse
const projectileGeometry = new THREE.CapsuleGeometry( 0.2, 0.3, 4, 8); 
projectileGeometry.applyMatrix4( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );
let projectiles: Array<Object> = []


window.addEventListener("mousedown", (event) => {
    const projectileMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } ); 
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
    const projectileBox = new THREE.Box3().setFromObject(projectile);
    let projectileAdded = false;
    let direction = 1;
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
    // find angle of rotation between tank and mouse pointer vector
    const testVector = new THREE.Vector3();
    testVector.copy(cube.position);
    const xAxis = new THREE.Vector3(0, 0, 1)
    const other = testVector.add(pos);
    const cosine = xAxis.dot(other) / (other.length());
    projectile.lookAt(pos);


    console.log(projectile.rotation);
    scene.add(projectile);
    projectiles.push([projectile, projectileBox, 1]);
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

const boxGeometry = new THREE.BoxGeometry(20, 2, 4);
const loader = new THREE.TextureLoader();
const boxMesh = new THREE.MeshStandardMaterial({
    map: loader.load('compressed-but-large-wood-texture.jpg')
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

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
    boundingBox.setFromObject(cube);

    if (keys.has("a")) {
        cube.rotateZ(0.02);
    }

    if (keys.has("w")) {
        cube.translateY(0.05);
        boundingBox.setFromObject(cube);
        if (boundingBox.intersectsBox(boundingBox2)) {
            cube.translateY(-0.05);
        }
    }

    if (keys.has("d")) {
        cube.rotateZ(-0.02);
    }

    if (keys.has("s")) {
        console.log(cube.position);
        cube.translateY(-0.05);
        boundingBox.setFromObject(cube);
        if (boundingBox.intersectsBox(boundingBox2)) {
            cube.translateY(0.05);
        }
    }
    if (projectiles.length) {
        for (const p of projectiles) {
            const projectile = p[0]; 
            const projectileBox = p[1];
            const direction = p[2];
            projectile.translateZ(direction * 0.03);
            projectileBox.setFromObject(projectile);
            if (projectileBox.intersectsBox(boundingBox2)) {
                p[2] *= -1;
                projectile.rotation.y *= -1;
            }

            
        }
    }
}
animate();
