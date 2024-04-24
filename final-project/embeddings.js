// import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js';
// import { CinematicCamera } from 'https://cdn.jsdelivr.net/npm/three@0.163.0/examples/jsm/cameras/CinematicCamera.js';

import * as THREE from 'three';
// import { CinematicCamera } from 'three/addons/cameras/CinematicCamera.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


// firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, update, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
let app, database;

let itemsList = [];

let distanceFromCenter = 8;

let camera3D, scene, renderer, raycaster;
let controls;
const radius = 100;

// const replicateProxy = "https://replicate-api-proxy.glitch.me"
let spheres = [];
let planes = [];
let hitTestableThings = [];  //things that will be tested for intersection
let in_front_of_you;


const mouse = new THREE.Vector2();
let currentIntersecting = null;
let prevIntersecting = null;
let prevColor = null;
let setDulplicate = false;

let displayImages = false;


initWebInterface();
init3D();

function initWebInterface() {

    var webInterfaceContainer = document.createElement("div");
    webInterfaceContainer.id = "webInterfaceContainer";

    webInterfaceContainer.style.position = "absolute";
    webInterfaceContainer.style.zIndex = "200";
    webInterfaceContainer.style.top = "15%";
    webInterfaceContainer.style.left = "50%";
    webInterfaceContainer.style.transform = "translate(-50%, -50%)";
    webInterfaceContainer.style.position = "absolute";
    webInterfaceContainer.style.height = "20%";
    //webInterfaceContainer.append(input_image_field);
    document.body.append(webInterfaceContainer);

    let ThreeJSContainer = document.createElement("div");
    ThreeJSContainer.style.zIndex = "1";
    ThreeJSContainer.id = "ThreeJSContainer";
    ThreeJSContainer.style.position = "absolute";
    ThreeJSContainer.style.top = "0px";
    ThreeJSContainer.style.left = "0px";
    ThreeJSContainer.style.width = "100%";
    ThreeJSContainer.style.height = "100%";
    document.body.append(ThreeJSContainer);

    let feedback = document.createElement("div");
    feedback.id = "feedback";
    feedback.style.position = "absolute";
    feedback.style.zIndex = "200";
    feedback.innerText = "";
    feedback.style.width = "100%";
    feedback.style.textAlign = "center";
    feedback.style.top = "85%";
    feedback.style.left = "50%";
    feedback.style.transform = "translate(-50%, -50%)";
    feedback.style.fontSize = "28px";
    feedback.style.color = "rgba(255,255,255,0.8)";
    document.body.append(feedback);

    let button = document.createElement("button");
    button.innerHTML = "Load Data";
    button.style.position = "absolute";
    button.style.top = "10%";
    button.style.left = "50%";
    button.style.transform = "translate(-50%, -50%)";
    button.style.fontSize = "20px";
    button.style.color = "white";
    button.style.backgroundColor = "rgba(255,255,255,0.2)";
    button.style.border = "white 2px solid";
    button.style.borderRadius = "5px";
    button.style.zIndex = "200";
    button.classList.add("button");
    // hover effect
    button.addEventListener("mouseover", function() {
        button.style.backgroundColor = "rgba(255,255,255,0.4)";
    });
    button.addEventListener("mouseout", function() {
        button.style.backgroundColor = "rgba(255,255,255,0.2)";
    });
    button.addEventListener("click", getDataFromFirebase);
    document.body.append(button);

    let toggleButton = document.createElement("button");
    toggleButton.innerHTML = "Display images";
    toggleButton.style.position = "absolute";
    toggleButton.style.top = "10%";
    toggleButton.style.left = "65%";
    toggleButton.style.transform = "translate(-50%, -50%)";
    toggleButton.style.fontSize = "14px";
    toggleButton.style.color = "white";
    toggleButton.style.backgroundColor = "rgba(255,255,255,0.2)";
    toggleButton.style.border = "white 2px solid";
    toggleButton.style.borderRadius = "5px";
    toggleButton.style.zIndex = "200";
    // hover effect
    toggleButton.addEventListener("mouseover", function() {
        toggleButton.style.backgroundColor = "rgba(255,255,255,0.4)";
    });
    toggleButton.addEventListener("mouseout", function() {
        toggleButton.style.backgroundColor = "rgba(255,255,255,0.2)";
    });
    toggleButton.addEventListener("click", function() {
        displayImages = !displayImages;
        if (displayImages) {
            for (let obj of spheres) { obj.object.visible = false; }
            for (let obj of planes) { obj.object.visible = true; }
        } else {
            for (let obj of spheres) { obj.object.visible = true; }
            for (let obj of planes) { obj.object.visible = false; }
        }
    });

    document.body.append(toggleButton);


    document.addEventListener( 'mousemove', onDocumentMouseMove );
}


function init3D() {
    scene = new THREE.Scene();
    camera3D = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 500 );
    camera3D.position.set( 15, 0, 0 );


    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("ThreeJSContainer").append(renderer.domElement);

    // controls
    controls = new OrbitControls( camera3D, renderer.domElement );
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    // controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 0;
	controls.maxDistance = 400;


    //just a place holder the follows the camera and marks location to drop incoming  pictures
    //tiny little dot (could be invisible) 
    var geometryFront = new THREE.BoxGeometry(1, 1, 1);
    var materialFront = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    in_front_of_you = new THREE.Mesh(geometryFront, materialFront);
    camera3D.add(in_front_of_you); // then add in front of the camera (not scene) so it follow it
    console.log("in_front_of_you.position", in_front_of_you.position)

    // lattice
    var geometry = new THREE.SphereGeometry(0.02, 32, 32);
    var material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    // create a grid of spheres
    for (let i = 0; i < 100; i+=8) {
        for (let j = 0; j < 100; j+=8) {
            for (let k = 0; k < 100; k+=8) {
                var sphere = new THREE.Mesh(geometry, material);
                scene.add(sphere);
                sphere.position.set(i - 50, j - 50, k - 50); 
            }
        }
    }

    raycaster = new THREE.Raycaster();


    camera3D.position.z = 5;
    animate();
}


function initLocalStorage() {
    if (localStorage.getItem("embeddings")) {
        let embeddings = JSON.parse(localStorage.getItem("embeddings"));
        console.log("Embeddings", embeddings[0]);
        runUMAP(embeddings);
        // startLoadingImages();   //start loading images
    } else {
        console.log("No Embeddings in Local Storage");
    }
}

function getDataFromFirebase() {
    const firebaseConfig = {
        apiKey: "AIzaSyBN5nwXdCVS9hRgrzIlKLg7c1Gv4Nc-sAw",
        authDomain: "shared-minds-a64d0.firebaseapp.com",
        projectId: "shared-minds-a64d0",
        storageBucket: "shared-minds-a64d0.appspot.com",
        messagingSenderId: "779021402524",
        appId: "1:779021402524:web:4b49257c71fa932c700859"
    };

    app = initializeApp(firebaseConfig);
    database = getDatabase(app);

    // Get a reference to the 'final-project' folder
    let folderRef = ref(database, 'final-project/image_data');

    onChildAdded(folderRef, (data) => {
        console.log("Data", data.key, data.val());
        for (let key in data.val()) {
            let item = data.val()[key];
            itemsList.push(item);
        }
        console.log("Items List length:", itemsList.length);
        console.log("Items List", itemsList);
        runUMAP(itemsList);
        
    });
}



// called after reading the prompts data
async function askForEmbeddings(p_prompt) {
    // document.getElementById("feedback").innerHTML = "Getting Embeddings from FireBase";
    
    const raw = fetch(url, options)
        .then(response => response.json())
        .then(data => {
            localStorage.setItem("embeddings", JSON.stringify(data.output));
            runUMAP(data.output);
        });


}


function runUMAP(itemList) {
    // single out the embeddings for UMAP
    let embeddings = [];
    for (let i = 0; i < itemList.length; i++) {
        embeddings.push(itemList[i].embedding);
    }
    var myrng = new Math.seedrandom('hello.');
    let umap = new UMAP({
        nNeighbors: 4,
        minDist: .05,
        nComponents: 3,
        random: myrng,  //special library seeded random so it is the same randome numbers every time
        spread: 1,
        //distanceFn: 'cosine',
    });
    let fittings = umap.fit(embeddings);
    fittings = normalize(fittings);  //normalize to 0-1
    console.log("fittings", fittings);
    for (let i = 0; i < itemList.length; i++) {
        placeMesh(itemList[i].label, fittings[i], itemList[i].base64);
    }
    // document.getElementById("feedback").innerHTML = "UMAP generated";
}

function placeMesh(label, pos, base64) {

    // color by clusters

    let color = getColor(label);

    var sphereMaterial = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
    var sphereGeo = new THREE.SphereGeometry(0.1, 32, 32);
    var sphereMesh = new THREE.Mesh(sphereGeo, sphereMaterial);

    sphereMesh.position.x = pos[0] * distanceFromCenter - distanceFromCenter / 2;
    sphereMesh.position.y = pos[1] * distanceFromCenter - distanceFromCenter / 2;
    sphereMesh.position.z = pos[2] * distanceFromCenter - distanceFromCenter / 2;

    console.log("mesh.position", sphereMesh.position);
    scene.add(sphereMesh);
    hitTestableThings.push(sphereMesh);//make a list for the raycaster to check for intersection
    spheres.push({ "object": sphereMesh, "uuid": sphereMesh.uuid, "label": label, "base64": base64});


    // add a plane with the image
    var planeGeo = new THREE.PlaneGeometry(0.2, 0.2);
    let image = new Image();
    // console.log("base64", base64);
    image.src = 'data:image/png;base64,' + base64;
    let texture = new THREE.Texture();
    texture.image = image;
    image.onload = function () {
        texture.needsUpdate = true;
    };
    let planeMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    let planeMesh = new THREE.Mesh(planeGeo, planeMaterial);
    planeMesh.position.x = pos[0] * distanceFromCenter - distanceFromCenter / 2;
    planeMesh.position.y = pos[1] * distanceFromCenter - distanceFromCenter / 2;
    planeMesh.position.z = pos[2] * distanceFromCenter - distanceFromCenter / 2;
    planeMesh.visible = false;
    planeMesh.lookAt(camera3D.position);
    scene.add(planeMesh);
    planes.push({ "object": planeMesh, "uuid": planeMesh.uuid, "label": label, "base64": base64 });
}

function getColor(label) {
    
    switch (label) {
        case 0:
            return 0xCC2F00; 
        case 1:
            return 0xDB6600; 
        case 2:
            return 0xE39E00; 
        case 3:
            return 0x76B80D; 
        case 4:
            return 0x007668; 
        case 5:
            return 0x006486; 
        case 6:
            return 0x007CB5; 
        case 7:
            return 0x465AB2; 
        case 8:
            return 0x6D47B1; 
        case 9:
            return 0x873B9C; 
        default:
            return 0xFFFFFF; // White
    }
    
}


function normalize(arrayOfNumbers) {
    //find max and min in the array
    let max = [0, 0, 0];
    let min = [0, 0, 0];
    for (let i = 0; i < arrayOfNumbers.length; i++) {
        for (let j = 0; j < 3; j++) {
            if (arrayOfNumbers[i][j] > max[j]) {
                max[j] = arrayOfNumbers[i][j];
            }
            if (arrayOfNumbers[i][j] < min[j]) {
                min[j] = arrayOfNumbers[i][j];
            }
        }
    }
    console.log("max", max, "min", min);
    //normalize
    for (let i = 0; i < arrayOfNumbers.length; i++) {
        for (let j = 0; j < 3; j++) {
            arrayOfNumbers[i][j] = (arrayOfNumbers[i][j] - min[j]) / (max[j] - min[j]);
        }
    }


    return arrayOfNumbers;
}

function onDocumentMouseMove( event ) {

    event.preventDefault();

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}




function getPositionInFrontOfCamera() {
    const posInWorld = new THREE.Vector3();
    in_front_of_you.position.set(0, 0, -distanceFromCenter);  //base the the z position on camera field of view
    in_front_of_you.getWorldPosition(posInWorld);
    return posInWorld;
}





function animate() {
    requestAnimationFrame(animate);

    for (let i = 0; i < planes.length; i++) {
        planes[i].object.lookAt(camera3D.position);
    }

    // theta += 0.01;

    // camera3D.position.x = radius * Math.sin( THREE.MathUtils.degToRad( theta * 0.9 ) );
    // camera3D.position.y = radius * Math.sin( THREE.MathUtils.degToRad( theta * 1.1) );
    // camera3D.position.z = radius * Math.cos( THREE.MathUtils.degToRad( theta) );
    // camera3D.lookAt( scene.position );

    // camera3D.updateMatrixWorld();

    controls.update(); 

    raycaster.setFromCamera( mouse, camera3D ); // first param: 2d coordinate of the mouse

    const intersects = raycaster.intersectObjects( hitTestableThings, false );


    if ( intersects.length > 0 ) {


        let object = intersects[0].object;
        currentIntersecting = object;
        if (currentIntersecting != prevIntersecting) {
            setDulplicate = false;
        }

        spheres.forEach(o => {
            if (o.object.uuid == object.uuid) {
                // console.log("obj:", o.label);
                document.getElementById("feedback").innerText = "Current label: " + o.label;
                // console.log(o.object.material.color);
                // if (!setDulplicate) {
                //     console.log("set");
                //     prevColor = o.object.material.color;
                //     console.log("prevColor", prevColor);
                // }
                
                // object.material.color.set( 0xffffff );
                // setDulplicate = true;
                // prevIntersecting = object;
            } else {
            //     if (prevIntersecting != null) {
            //     if ( o.object.uuid == prevIntersecting.uuid) {
            //         o.object.material.color.set( "#ff0000" );
            //     }
            // }
            }
        });

    } 


    for (let i = 0; i < spheres.length; i++) {
        // spheres[i].texture.needsUpdate = true;
    }
    // sphere.position.z += 0.001;
    renderer.render(scene, camera3D);
}




