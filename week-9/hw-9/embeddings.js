// import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js';
// import { CinematicCamera } from 'https://cdn.jsdelivr.net/npm/three@0.163.0/examples/jsm/cameras/CinematicCamera.js';

import * as THREE from 'three';
import { CinematicCamera } from 'three/addons/cameras/CinematicCamera.js';

let distanceFromCenter = 8;

let camera3D, scene, renderer, raycaster;
let theta = 0;
const radius = 100;

const replicateProxy = "https://replicate-api-proxy.glitch.me"
let objects = [];
let hitTestableThings = [];  //things that will be tested for intersection
let in_front_of_you;
let myPrompts = [];
let myClusters = []; // why need to initialize with a value??

const mouse = new THREE.Vector2();
let INTERSECTED;

fetch('prompts.json')
    .then(response => response.json())
    .then(prompts => {
        myPrompts = prompts.allPrompts;
        fetch('prompts_clusters.json')
            .then(response => response.json())
            .then(clusters => {
                myClusters = clusters.clusters;
                console.log("myClusters", myClusters);
                initWebInterface();
                init3D();
                initLocalStorage();
            })
    })



// initWebInterface();
// init3D();
// initLocalStorage();

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
    // feedback.innerHTML = "Ready";
    feedback.style.width = "100%";
    feedback.style.textAlign = "center";
    feedback.style.top = "80%";
    feedback.style.left = "50%";
    feedback.style.transform = "translate(-50%, -50%)";
    feedback.style.fontSize = "14px";
    feedback.style.color = "rgba(255,255,255,0.8)";
    document.body.append(feedback);

    let button = document.createElement("button");
    button.innerHTML = "Load All Prompts";
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
    button.addEventListener("click", function () {
    let dataForReplicate = "";
    for (let i = 0; i < myPrompts.length; i++) {
        console.log("Prompt", myPrompts[i]);
        dataForReplicate += myPrompts[i] + "\n";
    }
    askForEmbeddings(dataForReplicate)
    });
    document.body.append(button);

    document.addEventListener( 'mousemove', onDocumentMouseMove );
}


function init3D() {
    scene = new THREE.Scene();
    camera3D = new CinematicCamera( 60, window.innerWidth / window.innerHeight, 1, 200 );
    camera3D.setLens( 150 );
    camera3D.position.set( 2, 1, 500 );
    // camera3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("ThreeJSContainer").append(renderer.domElement);


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


// called after reading the prompts data
async function askForEmbeddings(p_prompt) {
    document.getElementById("feedback").innerHTML = "Getting Embeddings...";
    let promptInLines = p_prompt.replace(/,/g, "\n");
    let data = {
        version: "75b33f253f7714a281ad3e9b28f63e3232d583716ef6718f2e46641077ea040a",
        input: {
            inputs: promptInLines,
        },
    };
    console.log("Asking for Embedding Similarities From Replicate via Proxy", data);
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    const url = replicateProxy + "/create_n_get/";
    console.log("url", url, "options", options);
    const raw = fetch(url, options)
        .then(response => response.json())
        .then(data => {
            localStorage.setItem("embeddings", JSON.stringify(data.output));
            runUMAP(data.output);
        });


}
function runUMAP(embeddingsAndPrompts) {

    //comes back with a list of embeddings and prompts, single out the embeddings for UMAP
    console.log("embeddingsAndPrompts", embeddingsAndPrompts);
    let embeddings = [];
    for (let i = 0; i < embeddingsAndPrompts.length; i++) {
        embeddings.push(embeddingsAndPrompts[i].embedding);
    }
    //let fittings = runUMAP(embeddings);
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
    for (let i = 0; i < embeddingsAndPrompts.length; i++) {
        placeMesh(embeddingsAndPrompts[i].input, fittings[i]);
    }
    document.getElementById("feedback").innerHTML = "UMAP generated";
}

function placeMesh(text, pos) {

    // color by clusters

    let color = getColor(text);


    var material = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });

    var geo = new THREE.SphereGeometry(0.1, 32, 32);
    var mesh = new THREE.Mesh(geo, material);

    mesh.position.x = pos[0] * distanceFromCenter - distanceFromCenter / 2;
    mesh.position.y = pos[1] * distanceFromCenter - distanceFromCenter / 2;  
    mesh.position.z = pos[2] * distanceFromCenter - distanceFromCenter / 2;

    console.log("mesh.position", mesh.position, 'text', text);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
    hitTestableThings.push(mesh);//make a list for the raycaster to check for intersection
    objects.push({ "object": mesh, "uuid": mesh.uuid, "text": text});
}

function getColor(text) {
    let classNum;
    console.log('myClusters len', myClusters.length)
    console.log('myCluster1', myClusters[0].name)

    for (let i = 0; i < myClusters.length; i++) {
        if (myClusters[i].arr.includes(text)) {
            classNum = i;
            break;
        }
    }

    switch (classNum) {
        case 0:
            return 0xFFC0CB; // Pink
        case 1:
            return 0xFFA07A; // Light Salmon
        case 2:
            return 0xFFD700; // Gold
        case 3:
            return 0x32CD32; // Lime Green
        case 4:
            return 0x00FFFF; // Cyan
        case 5:
            return 0x87CEEB; // Sky Blue
        case 6:
            return 0x9370DB; // Medium Purple
        case 7:
            return 0xFF69B4; // Hot Pink
        case 8:
            return 0xFFFF00; // Yellow
        case 9:
            return 0x00CED1; // Dark Turquoise
        case 10:
            return 0x8A2BE2; // Blue Violet
        case 11:
            return 0xFF8C00; // Dark Orange
        case 12:
            return 0x4B0082; // Indigo
        case 13:
            return 0x40E0D0; // Turquoise
        case 14:
            return 0x800080; // Purple
        default:
            return 0xffffff; // Black (default color)
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

    theta += 0.01;

    camera3D.position.x = radius * Math.sin( THREE.MathUtils.degToRad( theta * 0.9 ) );
    camera3D.position.y = radius * Math.sin( THREE.MathUtils.degToRad( theta * 1.1) );
    camera3D.position.z = radius * Math.cos( THREE.MathUtils.degToRad( theta) );
    camera3D.lookAt( scene.position );

    camera3D.updateMatrixWorld();

    raycaster.setFromCamera( mouse, camera3D );

    const intersects = raycaster.intersectObjects( hitTestableThings, false );


    if ( intersects.length > 0 ) {

        console.log("intersects", intersects[0]);
        let object = intersects[0].object;
        console.log("object", object);
        // object.material.color.set( 0xff0000 );
        objects.forEach(o => {
            if (o.object.uuid == object.uuid) {
                for (let i = 0; i < myClusters.length; i++) {
                    if (myClusters[i].arr.includes(o.text)) {
                        o.text = `[${myClusters[i].name}] ${o.text}`
                        break;
                    }
                }
                document.getElementById("feedback").innerHTML = o.text;

            }
        });

    } 


    for (let i = 0; i < objects.length; i++) {
        // objects[i].texture.needsUpdate = true;
    }
    // sphere.position.z += 0.001;
    renderer.render(scene, camera3D);
}




