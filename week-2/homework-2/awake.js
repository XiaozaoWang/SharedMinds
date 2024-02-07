import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js'
//for more modern version of orbit control user importmap https://stackoverflow.com/questions/75250424/threejs-orbitcontrol-import-version-from-cdn

let camera3D, scene, renderer, light; // what's new: camera3D
let controls; // what's new: controls
let universe; // can rotate
let cubes = [];
let textMeshes = [];

initHTML(); // can't figure out how to do manual control with zoom
init3D();


function init3D() {
    // scene
    scene = new THREE.Scene();
    // initialize camera
    camera3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);
    //renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Earth
    let EarthGeo = new THREE.SphereGeometry(950, 60, 40);
    let EarthTexture = new THREE.TextureLoader().load("earth.jpg");
    let EarthMaterial = new THREE.MeshBasicMaterial({ map: EarthTexture });
    let Earth = new THREE.Mesh(EarthGeo, EarthMaterial);
    Earth.position.set(0, -1100, 0);
    Earth.rotation.set(0, 0, 1);
    scene.add(Earth);

    // universe
    let uniGeo = new THREE.SphereGeometry(5000, 150, 150);
    uniGeo.scale(-1, 1, 1);
    let uniTexture = new THREE.TextureLoader().load("universe.jpg");
    // var material = new THREE.MeshBasicMaterial({ map: panotexture, transparent: true,   alphaTest: 0.02,opacity: 0.3});
    let uniMat = new THREE.MeshBasicMaterial({ map: uniTexture });
    universe = new THREE.Mesh(uniGeo, uniMat);
    // universe.rotation.set(0, 0, 1);
    universe.rotation.z = 1.5;
    scene.add(universe);

    // bgImage
    let bgGeometery = new THREE.CylinderGeometry(725, 725, 1500, 10, 10, true)
    bgGeometery.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new THREE.TextureLoader().load("sky.jpg");
    let backMaterial = new THREE.MeshBasicMaterial({ map: panotexture });
    let back = new THREE.Mesh(bgGeometery, backMaterial);
    // back.rotation.set(Math.PI/2,0,0);
    back.position.set(0, 0, 0);
    scene.add(back);

    // light
    light = new THREE.PointLight(0xFF00);
    light.position.set(0, 0, 0);
    scene.add(light);


    controls = new OrbitControls(camera3D, renderer.domElement);
    camera3D.position.set( 0, 0, 5 ); // why can't be (0,0,0)?
    // camera3D.position.z = 5;

    
    animate();
}

function animate() {
    // rotate the universe
    universe.rotation.x += 0.001;
    // rotate the cubes
    cubes.forEach(cube => {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
    });
    controls.update();  //orbit controls
    renderer.render(scene, camera3D);
    requestAnimationFrame(animate);
}


function initHTML() {
    // const THREEcontainer = document.createElement("div");
    // THREEcontainer.setAttribute("id", "THREEcontainer");
    // document.body.appendChild(THREEcontainer);
    // THREEcontainer.addEventListener("keydown", function (e) {
    //     if (e.key === "Enter") {  //checks whether the pressed key is "Enter"
    //         console.log('hi!')
    //         const pos = find3DCoornatesInFrontOfCamera(150 - camera.fov);
    //         createNewCube(pos);
    //     }
    // });
    const THREEcontainer = document.createElement("div");
    THREEcontainer.setAttribute("id", "THREEcontainer");
    document.body.appendChild(THREEcontainer);
    THREEcontainer.style.position = "absolute";
    THREEcontainer.style.top = "0";
    THREEcontainer.style.left = "0";
    // THREEcontainer.style.width = "100%";
    // THREEcontainer.style.height = "100%";
    THREEcontainer.style.zIndex = "1";

    const textInput = document.createElement("input");
    textInput.setAttribute("type", "text");
    textInput.setAttribute("id", "textInput");
    textInput.setAttribute("placeholder", "Enter text here");
    document.body.appendChild(textInput);
    textInput.style.position = "absolute";
    textInput.style.top = "50%";
    textInput.style.left = "50%";
    textInput.style.transform = "translate(-50%, -50%)";
    textInput.style.zIndex = "5";

    // const btn = document.createElement("button");
    // btn.setAttribute("id", "btn");
    // btn.innerHTML = "Send an idea";


    textInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {  //checks whether the pressed key is "Enter"
            console.log('hi!')
            const pos = find3DCoornatesInFrontOfCamera(150 - camera3D.fov);
            createNewText(textInput.value, pos);
            createNewCube(pos);
        }
    });
}

function find3DCoornatesInFrontOfCamera(distance) {
    let vector = new THREE.Vector3();
    vector.set(0, 0, 0); // middle of the screen where input box is
    vector.unproject(camera3D);
    vector.multiplyScalar(distance)
    // return vector;
    return findSymmetryVector(vector);
}

function findSymmetryVector(vec) {
    let originVector = new THREE.Vector3();
    originVector.set(0, 0, 0);
    originVector.unproject(camera3D);
  
    let diffVector = vec.clone().sub(originVector);
    let symmetryVector = diffVector.clone().negate();
  
    return symmetryVector;
  }


function createNewText(text_msg, posInWorld) {
    console.log("Created New Text", posInWorld);
    var canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    var fontSize = 200;
    context.font = fontSize + "pt Arial";
    context.textAlign = "center";
    context.fillStyle = "blue";
    context.fillText(text_msg, canvas.width / 2, canvas.height / 2);
    var textTexture = new THREE.Texture(canvas);
    textTexture.needsUpdate = true;
    var material = new THREE.MeshBasicMaterial({ map: textTexture, transparent: true });
    var geo = new THREE.PlaneGeometry(1, 1);
    geo.scale(10, 10, 10);
    var mesh = new THREE.Mesh(geo, material);

    mesh.position.x = posInWorld.x;
    mesh.position.y = posInWorld.y + 50;
    mesh.position.z = posInWorld.z;
    console.log('createNewText', mesh.position);
    mesh.lookAt(0, 0, 0);
    mesh.scale.set(10, 10, 10);
    scene.add(mesh);
}


function createNewCube(posInWorld) {
    console.log("Created New Cube", posInWorld)
    var geo = new THREE.BoxGeometry(1, 1, 1);
    let cubeTexture = new THREE.TextureLoader().load("crystal.jpg");
    let cubeMat = new THREE.MeshBasicMaterial({ map: cubeTexture });
    // var mat = new THREE.MeshBasicMaterial({ color: 0xc7c7c7 });
    var cube = new THREE.Mesh(geo, cubeMat);
    cube.scale.set(50,50,50);
    cube.position.x = posInWorld.x;
    cube.position.y = posInWorld.y;
    cube.position.z = posInWorld.z;
    scene.add(cube);
    cubes.push(cube);
    console.log(cubes.length);
}