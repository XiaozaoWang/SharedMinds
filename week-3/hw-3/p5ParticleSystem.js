import * as THREE from 'three';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';


let camera, scene, controls, renderer;
// const worldWidth = 256, worldDepth = 256;
// let mesh, texture;
let thingsThatNeedUpdating = [];
let myObjectsByThreeID = {};
let clickableMeshes = [];


let mouseDownX = 0, mouseDownY = 0;
let lon = -90, mouseDownLon = 0;
let lat = 0, mouseDownLat = 0;
let isUserInteracting = false;
let selectedObject = null;


const clock = new THREE.Clock();

initHTML();
init3D();


function init3D() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0,0,10);
    // camera.lookAt( - 100, 810, - 800 );


    scene.background = new THREE.Color( 0x222222 );
    scene.fog = new THREE.FogExp2( 0x666666, 0.005 );

    const light = new THREE.AmbientLight( 0x404040 ); // soft white light
    scene.add( light );

    // terrain
    // const data = generateHeight( worldWidth, worldDepth );
    const planeGeo = new THREE.PlaneGeometry( 400, 400);
    const plainMat = new THREE.MeshBasicMaterial( {color: 'black', side: THREE.DoubleSide} );
    const plane = new THREE.Mesh( planeGeo, plainMat );
    scene.add( plane );
    plane.position.y = -5;
    plane.rotation.x = Math.PI / 2;

    // Add multiple trees to the scene
    const numTrees = 200;
    for (let i = 0; i < numTrees; i++) {
        const tree = createTree();
        scene.add(tree);
    }

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // document.body.appendChild(renderer.domElement);

    //this puts the three.js stuff in a particular div
    document.getElementById('THREEcontainer').appendChild(renderer.domElement)


    controls = new FirstPersonControls( camera, renderer.domElement );
    // controls.movementSpeed = 150;
    // controls.lookSpeed = 0.1;
    controls.lookVertical = false;
    // controls.verticalMax = 0.3;
    // controls.verticalMin = 0.1;
    // controls.constrainVertical = true;
    controls.movementSpeed = 20;
    controls.lookSpeed = 0.1;

    // moveCameraWithMouse();

    camera.position.z = 0;
    animate();

}


function animate() {
    for (let i = 0; i < thingsThatNeedUpdating.length; i++) {
        thingsThatNeedUpdating[i].texture.needsUpdate = true;
    }
    render();
    // renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function render() {
    controls.update( clock.getDelta() );
    renderer.render( scene, camera );
}

function initHTML() {
    const THREEcontainer = document.createElement("div");
    THREEcontainer.setAttribute("id", "THREEcontainer");
    document.body.appendChild(THREEcontainer);
    THREEcontainer.style.position = "absolute";
    THREEcontainer.style.top = "0";
    THREEcontainer.style.left = "0";
    THREEcontainer.style.width = "100%";
    THREEcontainer.style.height = "100%";
    THREEcontainer.style.zIndex = "1";

    // const textInput = document.createElement("input");
    // textInput.setAttribute("type", "text");
    // textInput.setAttribute("id", "textInput");
    // textInput.setAttribute("placeholder", "Enter text here");
    // document.body.appendChild(textInput);
    // textInput.style.position = "absolute";
    // textInput.style.top = "50%";
    // textInput.style.left = "50%";
    // textInput.style.transform = "translate(-50%, -50%)";
    // textInput.style.zIndex = "5";

    const button = document.getElementById("button");
    // button.setAttribute("id", "button");
    // button.innerHTML = "Light a thought";
    document.body.appendChild(button);
    button.style.position = "absolute";
    button.style.top = "50%";
    button.style.left = "50%";
    button.style.transform = "translate(-50%, -50%)";
    button.style.zIndex = "5";

    button.addEventListener("click", function (e) {
            const inputRect = button.getBoundingClientRect();

            // let mouse = { x: inputRect.left, y: inputRect.top };
            let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2};
            console.log("Entered Text", mouse.z);
            addP5To3D(window.innerWidth / 2, window.innerHeight / 2);

            // text version
            // const pos = find3DCoordinatesInFrontOfCamera(100 - camera.fov, mouse);
            // console.log('mouse', mouse);
            // console.log('fov', camera.fov);
            // console.log('camPos', camera.position);
            // console.log('posInWorld', pos);
            // createNewText(textInput.value, pos);
    });
    
    const div3D = document.getElementById('THREEcontainer');
    div3D.addEventListener('mousedown', div3DMouseDown, false);
    div3D.addEventListener('mousemove', div3DMouseMove, false);
    div3D.addEventListener('mouseup', div3DMouseUp, false);

    function div3DMouseDown(event) {
        isUserInteracting = true;
        selectedObject = findObjectUnderMouse(event.clientX, event.clientY);
        console.log('selectedObject', selectedObject);
        mouseDownX = event.clientX;
        mouseDownY = event.clientY;
        mouseDownLon = lon;
        mouseDownLat = lat;
    }
    
    function div3DMouseMove(event) {
        if (isUserInteracting) {
            lon = (mouseDownX - event.clientX) * 0.1 + mouseDownLon;
            lat = (event.clientY - mouseDownY) * 0.1 + mouseDownLat;
            const mouse = { x: event.clientX, y: event.clientY };
            //either move the selected object or the camera 
            if (selectedObject) {
                let pos = find3DCoordinatesInFrontOfCamera(100-camera.fov, mouse);
                selectedObject.mesh.position.x = pos.x;
                selectedObject.mesh.position.y = pos.y;
                selectedObject.mesh.position.z = pos.z;
            } else {
                computeCameraOrientation();
            }
        }
    }
    
    
    function div3DMouseUp(event) {
        isUserInteracting = false;
    
    }

    function computeCameraOrientation() {
        lat = Math.max(- 30, Math.min(30, lat));  //restrict movement
        let phi = THREE.MathUtils.degToRad(90 - lat);  //restrict movement
        let theta = THREE.MathUtils.degToRad(lon);
        //move the target that the camera is looking at
        // camera.target.x = 100 * Math.sin(phi) * Math.cos(theta);
        // camera.target.y = 100 * Math.cos(phi);
        // camera.target.z = 100 * Math.sin(phi) * Math.sin(theta);
        // camera.lookAt(camera.target);
    }



}

// function find3DCoordinatesInFrontOfCamera(distance, mouse) {
//     let vector = new THREE.Vector3();
//     // vector.set(
//     //     (mouse.x / window.innerWidth) * 2 - 1,
//     //     - (mouse.y / window.innerHeight) * 2 + 1,
//     //     0
//     // );
//     vector.set(0, 0, 0); //would be middle of the screen where input box is
//     vector.unproject(camera);
//     console.log("vector after unproject", vector);
//     console.log("distance", distance);
//     vector.multiplyScalar(distance)
//     return vector;
// }

function findObjectUnderMouse(x, y) {
    let raycaster = new THREE.Raycaster(); // create once
    //var mouse = new THREE.Vector2(); // create once
    let mouse = {};
    mouse.x = (x / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (y / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    let intersects = raycaster.intersectObjects(clickableMeshes, false);

    // if there is one (or more) intersections
    let hitObject = null;
    if (intersects.length > 0) {
        let hitMesh = intersects[0].object; //closest objec
        hitObject = myObjectsByThreeID[hitMesh.uuid]; //use look up table assoc array

    }
    return hitObject;
    //console.log("Hit ON", hitMesh);
}

function find3DCoordinatesInFrontOfCamera(distance, mouse) {
    let vector = new THREE.Vector3();
    vector.set(
        (mouse.x / window.innerWidth) * 2 - 1,
        - (mouse.y / window.innerHeight) * 2 + 1,
        0
    );
    
    vector.unproject(camera);
    console.log("vector after unproject", vector);
    console.log("distance", distance);
    let ray = new THREE.Ray(camera.position, vector.sub(camera.position).normalize());
    let position = new THREE.Vector3();
    ray.at(distance, position);

    return position;
}




function createNewText(text_msg, posInWorld) {

    console.log("Created New Text", posInWorld);
    let canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    let context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    let fontSize = Math.max(camera.fov / 2, 72);
    context.font = fontSize + "pt Arial";
    context.textAlign = "center";
    context.fillStyle = "red";
    context.fillText(text_msg, canvas.width / 2, canvas.height / 2);
    let textTexture = new THREE.Texture(canvas);
    textTexture.needsUpdate = true;
    let material = new THREE.MeshBasicMaterial({ map: textTexture, transparent: true });
    let geo = new THREE.PlaneGeometry(1, 1);
    let mesh = new THREE.Mesh(geo, material);

    mesh.position.x = posInWorld.x;
    mesh.position.y = posInWorld.y;
    mesh.position.z = posInWorld.z;

    console.log("posInWorld", posInWorld);
    // mesh.lookAt(0, 0, 0);
    mesh.lookAt(camera.position);
    mesh.scale.set(10, 10, 10);
    scene.add(mesh);
}

function createP5Sketch(w, h) {
    let sketch = function (p) {
        let myCanvas;
        let angle = 0;
        p.getCanvas = function () {
            return myCanvas;
        }
        p.setup = function () {
            myCanvas = p.createCanvas(w, h);
        };
        p.draw = function () {
            p.clear();
            let alpha = p.map(p.sin(angle), -1, 1, 10, 50);
            p.noStroke();
            for (let i = 0; i < 7; i ++) {
                p.fill(255, 255, 0, alpha);
                p.ellipse(p.width / 2, p.height / 2, p.width/10 + i*p.width/10, p.height/10 + i*p.height/10);
            }
            angle += 0.03;
        };
    };
    return new p5(sketch);
}

function addP5To3D(_x, _y) {  //called from double click

    let newP5 = createP5Sketch(100,100);
    //pull the p5 canvas out of sketch 
    //and then regular (elt) js canvas out of special p5 canvas
    let p5Canvas = newP5.getCanvas();
    let canvas = p5Canvas.elt;
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    let material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    let geo = new THREE.PlaneGeometry(canvas.width / canvas.width, canvas.height / canvas.width);
    let mesh = new THREE.Mesh(geo, material);

    mesh.scale.set(10, 10, 10);

    let mouse = { x: _x, y: _y };
    console.log("camera fov", camera.fov);
    const posInWorld = find3DCoordinatesInFrontOfCamera(100-camera.fov, mouse);
    mesh.position.x = posInWorld.x;
    mesh.position.y = posInWorld.y;
    mesh.position.z = posInWorld.z;

    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
    let thisObject = { canvas: canvas, mesh: mesh, texture: texture, p5Canvas: p5Canvas };
    thingsThatNeedUpdating.push(thisObject);
    clickableMeshes.push(mesh);
    myObjectsByThreeID[mesh.uuid] = thisObject;
}




function createTree() {
    // Create trunk geometry and material
    const trunkGeometry = new THREE.CylinderGeometry(1, 1, 10, 8);
    const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x96948f }); // Brown color

    // Create trunk mesh
    const trunkMesh = new THREE.Mesh(trunkGeometry, trunkMaterial);

    // Create canopy geometry and material
    const canopyGeometry = new THREE.OctahedronGeometry(6, 1);
    const canopyMaterial = new THREE.MeshBasicMaterial({ color: 0x435441 }); // Dark green-grayish color

    // Create canopy mesh
    const canopyMesh = new THREE.Mesh(canopyGeometry, canopyMaterial);

    // Position the canopy above the trunk
    canopyMesh.position.y = 10;

    // Group trunk and canopy together
    const treeGroup = new THREE.Group();
    treeGroup.add(trunkMesh);
    treeGroup.add(canopyMesh);

    // Randomize position and scale
    treeGroup.position.set(Math.random() * 400 - 200, -5, Math.random() * 700 - 350); // x,z???
    const scale = Math.random() * 2 + 1; // Random scale between 1 and 3
    treeGroup.scale.set(scale, scale, scale);

    // Return the tree group
    return treeGroup;
}



