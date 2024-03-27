import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';
import * as FB from './firebaseStuff.js';
import { initMoveCameraWithMouse, initHTML } from './interaction.js';
import { ThoughtObject } from './ThoughtObjectClass.js';

let camera, scene, renderer;
let texturesThatNeedUpdating = [];  //for updating textures
export let myObjectsByThreeID = {}  //for converting from three.js object to my JSON object
export let clickableMeshes = []; //for use with raycasting
// export let myObjectsByFirebaseKey = {}; //for converting from firebase key to my JSON object
// let lines = [];



let others = {};
let me;


initHTML();
init3D();
FB.initFirebase(function (user) {
    if (user) {
        // document.getElementById("localUser").style.display = "block";
        FB.subscribeToData("hw8-TheGeocentricTheory", reactToFirebase);
    } else {
        // document.getElementById("localUser").style.display = "none";
    }
});
// listenForChanges();
// recall();

// only runs once, connecting (or subscribing) to the Firebase
// function recall() {
//     console.log("recall");
//     FB.subscribeToData("hw8-TheGeocentricTheory"); //get notified if anything changes in this folder
// }

// this function is called when anything is changed in the firebase
// 1. when added -> create newObject using constructors -> call fileObjectInVariousPlaces
// 2. when changed -> update the object's properties and redraw it
// 3. when removed -> remove it from the scene and our lookup tables
export function reactToFirebase(reaction, data, key) {
    console.log("reactToFirebase", reaction, data, key);
    if (reaction === "added") {
        console.log("added data", data.imageURL);
        let newObject = new ThoughtObject(key, data.imageURL, data.username, data.prompt, data.color, data.embedding);
        console.log("newObject", newObject);
        if (key == FB.getUser().uid) {
            me = newObject;
        } else {
            others[key] = newObject;
        }
        renderOthersLoc();
        fileObjectInVariousPlaces(newObject);
    } else if (reaction === "changed") {
        if (key !== FB.getUser().uid) {
            object = others[key];
            object.position = data.position;
            object.redraw();
        }
    } 
}


function renderOthersLoc() {

    if (!me) return;
    console.log("renderOthersLoc", others);
    getNormalized2DDistance(me, others);
    // let angle = 0;
    // let angleStep = 2 * Math.PI / (Object.keys(others).length + 1);
    for (let key in others) {
        let other = others[key];
        let distance = 200 + (1 - other.normalizedDistance) * 200;
        let randomDir3D = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        randomDir3D.normalize();
        randomDir3D.multiplyScalar(distance);
        let x = randomDir3D.x;
        let y = randomDir3D.y;
        let z = randomDir3D.z;
        other.position = { x: x, y: y, z: z };
    }
    console.log("others", others);
    console.log("me", me);


}

function getNormalized2DDistance(me, others) {

    let maxDistance = 0;
    let minDistance = 10000000;
    console.log("me, others", me, others)
    for (let key in others) {
        let other = others[key];
        console.log("me", me, other);
        other.distance = cosineSimilarity(me.embedding, other.embedding);
        console.log("distance", other.distance);
        if (other.distance > maxDistance) maxDistance = other.distance;
        if (other.distance < minDistance) minDistance = other.distance;
    }
    for (let key in others) {
        let other = others[key];
        other.normalizedDistance = (other.distance - minDistance) / (maxDistance - minDistance);
        console.log("normalizedDistance", other.normalizedDistance);
    }
}

function cosineSimilarity(a, b) {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += (a[i] * b[i]);
        magnitudeA += (a[i] * a[i]);
        magnitudeB += (b[i] * b[i]);
    }
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    return dotProduct / (magnitudeA * magnitudeB);
}



// let inputField = document.getElementById("inputText");
// inputField.addEventListener("keyup", function (event) {
//     if (event.key === "Enter") {
//         askForPicture(inputField.value);
//     }
// });



// wat is newObject?
// the thing returned by SharedMindsText, SharedMindsImage, SharedMindsP5Sketch
// these constructors:
// 1. extends Anyobject class, so they have mesh, texture, firebaseKey (that every object share the same (mesh is always a plane))
// 2. has individual properties like text, img, position, base64
// 3. allow property accessing and updating


// this function is called when sth is added to the firebase
// initialize the object and add it to the scene
// add it to our own lookup tables of updates, clickable, key accessing
function fileObjectInVariousPlaces(newObject) {
    scene.add(newObject.mesh);
    // texturesThatNeedUpdating.push(newObject);
    clickableMeshes.push(newObject.mesh);
    myObjectsByThreeID[newObject.mesh.uuid] = newObject;
    myObjectsByFirebaseKey[newObject.firebaseKey] = newObject;

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
    camera.target = new THREE.Vector3(0, 0, 0);  //mouse controls move this around and camera looks at it 
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    ///document.body.appendChild(renderer.domElement);

    //this puts the three.js stuff in a particular div
    document.getElementById('THREEcontainer').appendChild(renderer.domElement)

    let bgGeometery = new THREE.SphereGeometry(3000, 60, 40);
    // let bgGeometery = new THREE.CylinderGeometry(725, 725, 1000, 10, 10, true)
    bgGeometery.scale(-1, 1, 1);
    // has to be power of 2 like (4096 x 2048) or(8192x4096).  i think it goes upside down because texture is not right size
    let panotexture = new THREE.TextureLoader().load("universe.jpg");
    // let material = new THREE.MeshBasicMaterial({ map: panotexture, transparent: true,   alphaTest: 0.02,opacity: 0.3});
    let backMaterial = new THREE.MeshBasicMaterial({ map: panotexture });
    let back = new THREE.Mesh(bgGeometery, backMaterial);
    scene.add(back);

    const light = new THREE.DirectionalLight( 0xffffff, 3 );
    light.position.set( 1, 1, 1 ).normalize();
    scene.add( light );

    const ambientLight = new THREE.AmbientLight( 0xffffff, 0.1 );
    scene.add( ambientLight );

    initMoveCameraWithMouse(camera, renderer);

    camera.position.z = 0;
    animate();
}

function animate() {
    // for (let i = 0; i < texturesThatNeedUpdating.length; i++) {
    //     texturesThatNeedUpdating[i].texture.needsUpdate = true;
    // }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}








