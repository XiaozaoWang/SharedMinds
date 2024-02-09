import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js'
//for more modern version of orbit control user importmap https://stackoverflow.com/questions/75250424/threejs-orbitcontrol-import-version-from-cdn

let camera3D, scene, renderer, cube; // what's new: camera3D
let controls; // what's new: controls


function init3D() {
    // scene
    scene = new THREE.Scene();
    // initialize camera
    camera3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    //renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0xc7c7c7 });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // bgImage
    let bgGeometery = new THREE.SphereGeometry(5, 60, 40);
    // let bgGeometery = new THREE.CylinderGeometry(725, 725, 1000, 10, 10, true)
    bgGeometery.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new THREE.TextureLoader().load("road.jpg");
    // var material = new THREE.MeshBasicMaterial({ map: panotexture, transparent: true,   alphaTest: 0.02,opacity: 0.3});
    let backMaterial = new THREE.MeshBasicMaterial({ map: panotexture });

    let back = new THREE.Mesh(bgGeometery, backMaterial);
    back.position.set(0, 0, 50);
    scene.add(back);



    controls = new OrbitControls(camera3D, renderer.domElement);
    camera3D.position.z = 5;
    animate();
}

function animate() {
    controls.update();  //orbit controls
    renderer.render(scene, camera3D);
    requestAnimationFrame(animate);
}

init3D();