import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';
import * as FB from './firebaseStuff.js';
import { initMoveCameraWithMouse, initHTML } from './interaction.js';
import { SoundObject } from './SoundObjectClass.js';

// 3D stuff
let camera, scene, renderer;

// sound stuff
let myCanvas;
let in_front_of_you;
let progress = "loading Face ML";
let inputField;
let listener;
let distanceFromCenter = 300;

// dictionaries
// let texturesThatNeedUpdating = [];  //for updating textures
export let myObjectsByThreeID = {}  //for converting from three.js object to my JSON object
export let clickableMeshes = []; //for use with raycasting
export let myObjectsByFirebaseKey = {}; //for converting from firebase key to my JSON object
let lines = [];

// firebase stuff
let folder = "objects";


initHTML();
init3D();
FB.initFirebase();
// listenForChanges();
recall();

// only runs once, connecting (or subscribing) to the Firebase
function recall() {
    console.log("recall");
    FB.subscribeToData(folder); //get notified if anything changes in this folder
}

// this function is called when anything is changed in the firebase
// 1. when added -> create newObject using constructors -> call fileObjectInVariousPlaces
// 2. when changed -> update the object's properties and redraw it
// 3. when removed -> remove it from the scene and our lookup tables
export function reactToFirebase(reaction, data, key) {
    if (reaction === "added") {
        // let newObject = new ThoughtObject(data.position, key, data.imgURL, data.username, data.text, data.color);
        // fileObjectInVariousPlaces(newObject);
        load3DSoundObject(data, key);
    } else if (reaction === "changed") {
        console.log("changed", data);
        let thisObject = myObjectsByFirebaseKey[key];
        if (thisObject) {
            thisObject.position = data.position;
            thisObject.redraw();
            redrawLines();
        }
    } else if (reaction === "removed") {
        console.log("removed", data);
        let thisObject = myObjectsByFirebaseKey[key];
        if (thisObject) {
            scene.remove(thisObject.mesh);
            delete myObjectsByThreeID[thisObject.threeID];
        }
    }
}



// this function is called when sth is added to the firebase
// initialize the object and add it to the scene
// add it to our own lookup tables of updates, clickable, key accessing
function load3DSoundObject(data, key) {
    // create a new wireframe sphere
    let newObject = new SoundObject(listener, data.position, key, data.imgURL, data.username, data.text, data.color, data.url, data.b64);

    scene.add(newObject.mesh);
    // texturesThatNeedUpdating.push(newObject);
    clickableMeshes.push(newObject.mesh);
    myObjectsByThreeID[newObject.mesh.uuid] = newObject;
    myObjectsByFirebaseKey[newObject.firebaseKey] = newObject;

    // load sound
    newObject.audioLoader.load(newObject.buffer, function (buffer) {
        newObject.sound.setBuffer(buffer);
        newObject.sound.play();
        newObject.sound.setLoop(true);
    });

    newObject.mesh.lookAt(0, 0, 0);


    // draw lines
    if (clickableMeshes.length > 1) {
        for (let i = 0; i < clickableMeshes.length - 1; i++) {
            for (let j = i + 1; j < clickableMeshes.length; j++) {
                const object1 = clickableMeshes[i];
                const object2 = clickableMeshes[j];
                // const intermediateColor = new THREE.Color().lerpColors(object1.color, object2.color, 0.5);
                const lineMaterial = new THREE.LineBasicMaterial({ color: '#ffffff' });
                const points = [];
                points.push( object1.position );
                points.push( object2.position );
                const lineGeometry = new THREE.BufferGeometry().setFromPoints( points );
                const line = new THREE.Line( lineGeometry, lineMaterial );
                // console.log("line", line);
                lines.push(line);
                scene.add(line);
            }
        }
    }
}



// real-time redraw of lines
function redrawLines() {
    for (let i = lines.length-1; i >= 0; i--) {
        scene.remove(lines[i]);
    }
    lines = [];
    for (let i = 0; i < clickableMeshes.length - 1; i++) {
        for (let j = i + 1; j < clickableMeshes.length; j++) {
            const object1 = clickableMeshes[i];
            const object2 = clickableMeshes[j];
            // const intermediateColor = new THREE.Color().lerpColors(object1.color, object2.color, 0.5);
            const lineMaterial = new THREE.LineBasicMaterial({ color: '#ffffff' });
            const points = [];
            points.push( object1.position );
            points.push( object2.position );
            const lineGeometry = new THREE.BufferGeometry().setFromPoints( points );
            const line = new THREE.Line( lineGeometry, lineMaterial );
            // console.log("line", line);
            lines.push(line);
            scene.add(line);
        }
    }
}

export function findObjectUnderMouse(x, y) {
    let raycaster = new THREE.Raycaster(); // create once
    //var mouse = new THREE.Vector2(); // create once
    let mouse = {};
    // why this calculation?
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

export function project2DCoordsInto3D(distance, mouse) {
    console.log("project2DCoordsInto3D");
    console.log("mouse", mouse);
    let vector = new THREE.Vector3();
    vector.set(
        (mouse.x / window.innerWidth) * 2 - 1,
        - (mouse.y / window.innerHeight) * 2 + 1,
        0
    );
    //vector.set(0, 0, 0); //would be middle of the screen where input box is
    vector.unproject(camera);
    vector.multiplyScalar(distance)
    console.log("vector", vector);
    return vector;
}

function init3D() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 3000);
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 0; // making sure the camera is at the center
    camera.target = new THREE.Vector3(0, 0, 0);  //mouse controls move this around and camera looks at it 
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    //this puts the three.js stuff in a particular div
    document.getElementById('THREEcontainer').appendChild(renderer.domElement)

    let bgGeometery = new THREE.SphereGeometry(3000, 60, 40);
    bgGeometery.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new THREE.TextureLoader().load("universe.jpg");
    let backMaterial = new THREE.MeshBasicMaterial({ map: panotexture });
    let back = new THREE.Mesh(bgGeometery, backMaterial);
    scene.add(back);
    // create a tiny object in front of the camera
    var geometryFront = new THREE.BoxGeometry(1, 1, 1);
    var materialFront = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    in_front_of_you = new THREE.Mesh(geometryFront, materialFront);
    camera.add(in_front_of_you); // then add in front of the camera (not scene) so it follow it

    listener = new THREE.AudioListener();
    in_front_of_you.add(listener); // add the listener to the tiny object

    const light = new THREE.DirectionalLight( 0xffffff, 3 );
    light.position.set( 1, 1, 1 ).normalize();
    scene.add( light );

    const ambientLight = new THREE.AmbientLight( 0xffffff, 0.1 );
    scene.add( ambientLight );

    initMoveCameraWithMouse(camera, renderer);

    // camera.position.z = 0;
    animate();
}

function animate() {
    // for (let i = 0; i < texturesThatNeedUpdating.length; i++) {
    //     texturesThatNeedUpdating[i].texture.needsUpdate = true;
    // }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}








