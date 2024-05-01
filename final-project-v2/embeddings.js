// import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js';
// import { CinematicCamera } from 'https://cdn.jsdelivr.net/npm/three@0.163.0/examples/jsm/cameras/CinematicCamera.js';

import * as THREE from 'three';
// import { CinematicCamera } from 'three/addons/cameras/CinematicCamera.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


// firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, update, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
let app, database;

let itemsList = [];

// let distanceFromCenter = 10;

let camera3D, scene, renderer, raycaster;
let controls;
const radius = 100;

let spheres = [];
let planes = [];
let flowerInstances = [];
let hitTestableThings = [];  //things that will be tested for intersection
let in_front_of_you;

let flower;
let flower_scale = 0.01;

const mouse = new THREE.Vector2();
let currentIntersecting = null;
let prevIntersecting = null;
let prevColor = null;
let setDulplicate = false;

let displayImages = false;

// when DOM is ready, run the following functions
document.addEventListener("DOMContentLoaded", function() {
    initWebInterface();
    init3D();
});

function initWebInterface() {

    let webInterfaceContainer = document.getElementById("webInterfaceContainer");
    console.log("webInterfaceContainer", webInterfaceContainer);
    

    let ThreeJSContainer = document.getElementById("ThreeJSContainer");


    let feedback = document.getElementById("feedback");
    

    let loadDataButton = document.getElementById("loadDataButton");
    loadDataButton.addEventListener("click", getDataFromFirebase);


    let toggleButton = document.getElementById("toggleButton");

    console.log("toggleButton", toggleButton);
    toggleButton.addEventListener("change", function(event) {
        event.preventDefault();
        console.log("toggleButton.checked", toggleButton.checked);
        if (toggleButton.checked) {
            for (let obj of spheres) { obj.object.visible = false; }
            for (let obj of planes) { obj.object.visible = true; }
        } else {
            for (let obj of spheres) { obj.object.visible = true; }
            for (let obj of planes) { obj.object.visible = false; }
        }
    });


    listenForSliders();

    document.addEventListener( 'mousemove', onDocumentMouseMove );
}


function listenForSliders() {
    let nNeighborsSlider = document.getElementById("nNeighborsSlider");
    nNeighborsSlider.addEventListener("input", updateUMAPParameters);

    let minDistSlider = document.getElementById("minDistSlider");
    minDistSlider.addEventListener("input", updateUMAPParameters);

    let distributionSlider = document.getElementById("distributionSlider");
    distributionSlider.addEventListener("input", updateUMAPParameters);
}


function updateUMAPParameters() {
    let nNeighbors = parseInt(nNeighborsSlider.value);
    let minDist = parseFloat(minDistSlider.value);
    let distanceFromCenter = parseInt(distributionSlider.value);
    let nNeiSpan = document.getElementById("nNei");
    let mDisSpan = document.getElementById("mDis");
    let disSpan = document.getElementById("Dis");
    nNeiSpan.innerText = nNeighbors;
    mDisSpan.innerText = minDist;
    disSpan.innerText = distanceFromCenter;
    runUMAP(itemsList, nNeighbors, minDist, distanceFromCenter);
}


function init3D() {
    scene = new THREE.Scene();
    camera3D = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 1, 500 );
    camera3D.position.set( 0, 0, 15 );


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

    // draw the x, y, z axis
    var axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );

    // draw a translucent xz plane
    var planeGeometry = new THREE.PlaneGeometry(10, 10);
    var planeMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.5});
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = Math.PI / 2;
    scene.add(plane);


    // gltf
    const loader = new GLTFLoader();
    loader.load( 'flower.glb', function ( gltf ) {
        scene.add( gltf.scene );
        // change scale
        gltf.scene.scale.set(0.01, 0.01, 0.01);
        // change position
        gltf.scene.position.set(0, 0, 0);
        flower = gltf.scene;
    });

    // light
    var light = new THREE.AmbientLight( 0x404040 ); // soft white light
    light.intensity = 80;
    scene.add( light );
    


    //just a place holder the follows the camera and marks location to drop incoming  pictures
    //tiny little dot (could be invisible) 
    var geometryFront = new THREE.BoxGeometry(0, 0, 1);
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

    // renderer.domElement.addEventListener('mousemove', function(event) {
    //     event.stopPropagation();
    // });

    animate();
}


function getDataFromFirebase() {
    // disable the button
    document.getElementsByClassName("button")[0].style.display = "none";
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
        runUMAP(itemsList, 18, 0.40, 10);
        
    });
}


function runUMAP(itemList, nNeighbors, minDist, distanceFromCenter) {

    // clear all the data points in the scene
    for (let i = spheres.length - 1; i >= 0; i--) {
        scene.remove(spheres[i].object);
        spheres.pop();
    }
    for (let i = planes.length - 1; i >= 0; i--) {
        scene.remove(planes[i].object);
        planes.pop();
    }
    for (let i = flowerInstances.length - 1; i >= 0; i--) {
        scene.remove(flowerInstances[i]);
        flowerInstances.pop();
    }
    // clear out the hitTestableThings
    hitTestableThings = [];


    // single out the embeddings for UMAP
    let embeddings = [];
    for (let i = 0; i < itemList.length; i++) {
        embeddings.push(itemList[i].embedding);
    }
    var myrng = new Math.seedrandom('hello.');
    let umap = new UMAP({
        nNeighbors: nNeighbors,
        minDist: minDist,
        nComponents: 2,
        random: myrng,  //special library seeded random so it is the same randome numbers every time
        spread: 1,
        //distanceFn: 'cosine',
    });
    let fittings = umap.fit(embeddings);
    fittings = normalize(fittings);  //normalize to 0-1
    console.log("fittings", fittings);
    let averageDistances = calculateAverageDistances(fittings);


    render3D(itemList, fittings, distanceFromCenter, averageDistances);
    

    
    // document.getElementById("feedback").innerHTML = "UMAP generated";
}

function render3D(itemList, fittings, distanceFromCenter, averageDistances) {
    for (let i = 0; i < itemList.length; i++) {
        placeMesh(itemList[i].label, itemList[i].classname, fittings[i], itemList[i].base64, distanceFromCenter, averageDistances[i]);
    }

    // create a mesh plane that connects all the spheres
    // to hard

}


function calculateAverageDistances(fittings) {
    let averageDistances = [];
    for (let i = 0; i < fittings.length; i++) {
        let totalDistance = 0;
        for (let j = 0; j < fittings.length; j++) {
            if (i !== j) { // Exclude the point itself
                // Calculate Euclidean distance between points
                let distance = Math.sqrt(Math.pow(fittings[i][0] - fittings[j][0], 2) + Math.pow(fittings[i][1] - fittings[j][1], 2));
                totalDistance += distance;
            }
        }
        // Calculate average distance
        let averageDistance = totalDistance / (fittings.length - 1);
        averageDistances.push(averageDistance);
    }
    return averageDistances;
}


function placeMesh(label, classname, pos, base64, distanceFromCenter, averageDistance) {

    // color by clusters

    let color = getColor(label);

    var sphereMaterial = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
    var sphereGeo = new THREE.SphereGeometry(0.1, 32, 32);
    var sphereMesh = new THREE.Mesh(sphereGeo, sphereMaterial);

    sphereMesh.position.x = pos[0] * distanceFromCenter - distanceFromCenter / 2;
    sphereMesh.position.z = pos[1] * distanceFromCenter - distanceFromCenter / 2;
    sphereMesh.position.y = averageDistance * distanceFromCenter - distanceFromCenter / 4;

    
    const flowerInstance = flower.clone();
    flowerInstances.push(flowerInstance);
    let flower_scale = 0;
    // Set the initial scale of the flower instance (adjust as needed)
    flowerInstance.scale.set(flower_scale, flower_scale, flower_scale);

    // Position the flower instance at the same position as the sphere
    flowerInstance.position.copy(sphereMesh.position);

    // Add the flower instance to the scene
    scene.add(flowerInstance);


    // console.log("mesh.position", sphereMesh.position);
    scene.add(sphereMesh);
    hitTestableThings.push(sphereMesh);//make a list for the raycaster to check for intersection
    let sphereData = {
        "object": sphereMesh,
        "color": color,
        "uuid": sphereMesh.uuid,
        "label": label,
        "classname": classname,
        "base64": base64,
        "flower": flowerInstance, // Store flower object as a property
        "flowerScale": flower_scale, 
    };
    spheres.push(sphereData);



    // add a plane with the image
    var planeGeo = new THREE.PlaneGeometry(0.3, 0.3);
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
    planeMesh.position.z = pos[1] * distanceFromCenter - distanceFromCenter / 2;
    planeMesh.position.y = averageDistance * distanceFromCenter - distanceFromCenter / 4 + 0.1;

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

    let cursorCircle = document.getElementById("cursor-circle");
    cursorCircle.style.left = event.clientX + "px";
    cursorCircle.style.top = event.clientY + "px";

}




function getPositionInFrontOfCamera() {
    const posInWorld = new THREE.Vector3();
    in_front_of_you.position.set(0, 0, -distanceFromCenter);  //base the the z position on camera field of view
    in_front_of_you.getWorldPosition(posInWorld);
    return posInWorld;
}





function animate() {
    requestAnimationFrame(animate);

    // change the flower scale based on a sine wave
    // flower_scale = 0.01 + 0.005 * Math.sin(Date.now() * 0.001);
    // flower.scale.set(flower_scale, flower_scale, flower_scale);

    for (let i = 0; i < planes.length; i++) {
        planes[i].object.lookAt(camera3D.position);
    }


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
                document.getElementById("feedback").innerText = "Current class: " + o.classname;
                document.addEventListener("click", function() {
                    let placeholder = document.getElementById("placeholder-text");
                    placeholder.style.display = "none";
                    let imgDisplay = document.getElementById("full-img");
                    // console.log("found and clicked", o);
                    imgDisplay.src = 'data:image/png;base64,' + o.base64;
        
                });
            }
        });

        
    

        // Show flower on the intersected sphere
        const needToScaleUp = [];
        const intersectedSphere = spheres.find(sphere => sphere.object.uuid === object.uuid);
        // console.log("intersectedSphere", intersectedSphere);
        scaleUpFlower(intersectedSphere);
        needToScaleUp.push(intersectedSphere);
        for (let i = 0; i < spheres.length; i++) {
            const otherSphere = spheres[i];
            if (otherSphere !== intersectedSphere && isCloseEnough(intersectedSphere, otherSphere)) {
                // If the other sphere is close enough, scale up its flower
                scaleUpFlower(otherSphere);
                needToScaleUp.push(spheres[i]);
            } else {
                // Otherwise, scale down its flower
                scaleDownFlower(spheres[i]);
            }
        }


    } else {
        document.getElementById("feedback").innerText = "No object intersected";
        // If no intersection, hide all flowers
        spheres.forEach(sphere => {
            // sphere.flower.visible = false;
            scaleDownFlower(sphere);
        });
    }


    for (let i = 0; i < spheres.length; i++) {
        // spheres[i].texture.needsUpdate = true;
    }
    // sphere.position.z += 0.001;
    renderer.render(scene, camera3D);
}


// Function to smoothly scale the flower up
function scaleUpFlower(sphere) {
    
    // Increase the flower scale gradually
    sphere.flowerScale += 0.0002; // Adjust the step size as needed
    // Limit the maximum scale
    sphere.flowerScale = Math.min(sphere.flowerScale, 0.01);
    // Apply the scale to the flower mesh
    sphere.flower.scale.set(sphere.flowerScale, sphere.flowerScale, sphere.flowerScale);
}

// Function to smoothly scale the flower down
function scaleDownFlower(sphere) {
        
    // Decrease the flower scale gradually
    sphere.flowerScale -= 0.00001; // Adjust the step size as needed
    // Limit the minimum scale
    sphere.flowerScale = Math.max(sphere.flowerScale, 0);
    // Apply the scale to the flower mesh
    sphere.flower.scale.set(sphere.flowerScale, sphere.flowerScale, sphere.flowerScale);
}



function isCloseEnough(intersectedSphere, otherSphere) {
    // Calculate the distance between the intersected sphere and other sphere
    const distance = intersectedSphere.object.position.distanceTo(otherSphere.object.position);
    // Adjust the threshold as needed
    const threshold = 0.5; // Set your desired threshold here
    // Return true if the distance is below the threshold, false otherwise
    return distance < threshold;
}