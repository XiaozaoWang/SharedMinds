
import * as MAIN from './main.js';
import * as FB from './firebaseStuff.js';
import { MathUtils } from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';
import {isVisible} from './firebaseStuff.js';

/////MOUSE STUFF
let mouseDownX = 0, mouseDownY = 0;
let lon = -90, mouseDownLon = 0;
let lat = 0, mouseDownLat = 0;
let isUserInteracting = false;
let selectedObject = null;
let camera = null;
let renderer = null;
enableDragDrop();


// GUI
let guiDiv = null;
let greetingDiv = null;
let userImg;
let infoDiv = document.createElement("div");


export function initHTML() {

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

    // textInput.addEventListener("keydown", function (e) {
    //     if (e.key === "Enter") {  //checks whether the pressed key is "Enter"
    //         const inputRect = textInput.getBoundingClientRect();

    //         const mouse = { x: inputRect.left, y: inputRect.top };
    //         const pos = MAIN.project2DCoordsInto3D(150 - camera.fov, mouse);
    //         const data = { type: "text", position: { x: pos.x, y: pos.y, z: pos.z }, text: textInput.value };
    //         FB.addNewThingToFirebase("objects", data);//put empty for the key when you are making a new thing.
    //         //don't make it locally until you hear back from firebase
    //         console.log("Entered Text, Send to Firebase", textInput.value);
    //     }
    // });



    // initialize the main GUI
    guiDiv = document.createElement("div");
    guiDiv.style.position = "absolute";
    guiDiv.style.top = "50%";
    guiDiv.style.left = "50%";
    guiDiv.style.width = "350px";
    guiDiv.style.height = "200px";
    guiDiv.style.transform = "translate(-50%, -50%)";
    guiDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    guiDiv.style.border = "2px solid white";
    guiDiv.style.padding = "10px";
    guiDiv.style.zIndex = "1000"; // ?
    guiDiv.style.borderRadius = "10px"; // Add this line to set rounded corners
    guiDiv.style.display = "flex";
    guiDiv.style.flexDirection = "column";
    // guiDiv.style.alignItems = "center";
    document.body.appendChild(guiDiv);


    // user info
    let userDiv = document.createElement("div");
    userDiv.style.display = "flex";
    userDiv.style.alignItems = "center";
    userImg = document.createElement("img");
    userImg.style.width = "50px";
    userImg.style.height = "50px";
    userDiv.appendChild(userImg);
    // userImg.src = user.photoURL;
    guiDiv.appendChild(userDiv);
    greetingDiv = document.createElement("div");
    // try {
    //     greetingDiv.innerHTML = "Hello, " + FB.getUser().displayName + "!";
    // } catch (e) {   //if no user is logged in
    //     greetingDiv.innerHTML = "Not logged in";
    // }
    greetingDiv.innerHTML = "";
    greetingDiv.style.color = "white";
    greetingDiv.style.marginLeft = "10px";
    userDiv.appendChild(greetingDiv);

    // text input
    let textInput = document.createElement("input");
    textInput.setAttribute("type", "text");
    textInput.setAttribute("id", "textInput");
    textInput.setAttribute("placeholder", "Enter your thought!");
    textInput.style.fontSize = "20px";
    textInput.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    textInput.style.borderRadius = "5px";
    textInput.style.color = "white";
    textInput.style.marginTop = "15px";
    guiDiv.appendChild(textInput);

    // color picker
    let colorDiv = document.createElement("div");
    colorDiv.style.display = "flex";
    colorDiv.style.alignItems = "center";
    let colorPicker = document.createElement("input");
    colorPicker.setAttribute("type", "color");
    colorPicker.setAttribute("id", "colorPicker");
    colorPicker.setAttribute("value", "#ff0000");
    colorPicker.style.marginTop = "15px";
    let instructionDiv = document.createElement("div");
    instructionDiv.innerHTML = "Pick a color for your thought: ";
    instructionDiv.style.color = "white";
    instructionDiv.style.marginRight = "10px";
    instructionDiv.style.marginTop = "10px";
    colorDiv.appendChild(instructionDiv);
    colorDiv.appendChild(colorPicker);
    guiDiv.appendChild(colorDiv);

    // send button
    let buttonDiv = document.createElement("div");
    let sendButton = document.createElement("button");
    sendButton.innerHTML = "Send💭";
    sendButton.setAttribute("id", "sendButton");
    sendButton.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    sendButton.style.color = "white";
    sendButton.style.borderRadius = "10px";
    sendButton.style.fontSize = "20px";
    sendButton.style.marginTop = "15px";
    sendButton.style.width = "100px";
    sendButton.style.height = "50px";
    // align elements in the center
    buttonDiv.style.display = "flex";
    buttonDiv.style.justifyContent = "center";
    buttonDiv.appendChild(sendButton);
    guiDiv.appendChild(buttonDiv);
    

}


function checkVisibility() {
    // switch visibility of the GUI
    if (isVisible) {
        guiDiv.style.display = "block";
        // set the inner html of the greeting div
        let user = FB.getUser();
        let userName;
        if (!user) {
            greetingDiv.innerHTML = "Hello, guest!";
        } else {
            userName = user.displayName;
            console.log("userName: ", userName);
            if (!userName) userName = user.email.split("@")[0];
            userName = userName.split(" ")[0];
            greetingDiv.innerHTML = "Hello, " + userName + "!";
        }
        // userName = user.displayName;
        // console.log("userName: ", userName);
        // if (!userName) userName = user.email.split("@")[0];
        // userName = userName.split(" ")[0];
        
        // if (FB.getUser() && FB.getUser().displayName !== null) {
        //     greetingDiv.innerHTML = "Hello, " + FB.getUser().displayName + "!";
        // } else {
        //     greetingDiv.innerHTML = "Hello, guest!";
        // }

        // replace the user image
        if (FB.getUser().photoURL) {
            userImg.src = FB.getUser().photoURL;
        } else {
            userImg.src = "https://www.w3schools.com/howto/img_avatar.png";
        }
    } else {
        guiDiv.style.display = "none";
    };
}

setInterval(checkVisibility, 100);

export function initMoveCameraWithMouse(_camera, _renderer) {
    //set up event handlers
    camera = _camera;
    renderer = _renderer;
    const div3D = document.getElementById('THREEcontainer');
    div3D.addEventListener('mousedown', div3DMouseDown, false);
    div3D.addEventListener('mousemove', div3DMouseMove, false);
    window.addEventListener('mouseup', windowMouseUp, false);  //window in case they wander off the div
    div3D.addEventListener('wheel', div3DMouseWheel, { passive: true });
    window.addEventListener('dblclick', div3DDoubleClick, false); // Add double click event listener
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', div3DKeyDown, false);

    // add event listener for send button
    document.getElementById('sendButton').addEventListener('click', userSubmitted);

}


// function for accessing the input data from GUI and send to Firebase
function userSubmitted(event) {
    console.log("User submitted");
    let user = FB.getUser();
    let userName;
    if (!user) {
        userName = "guest";
    }
    userName = user.displayName;
    console.log("userName: ", userName);
    if (!userName) userName = user.email.split("@")[0];
    userName = userName.split(" ")[0];
    // get the input text
    let thought = document.getElementById("textInput").value;
    // get the color
    let color = document.getElementById("colorPicker").value;
    // calculate the position
    let twoD = { x: event.clientX, y: event.clientY -200 };
    const pos = MAIN.project2DCoordsInto3D(100, twoD);
    console.log("pos: ", pos);
    let imgURL = FB.getUser().photoURL;
    FB.addNewThingToFirebase("objects", { position: { x: pos.x, y: pos.y, z: pos.z }, imgURL: imgURL, username: userName, text: thought, color: color});
}




function div3DKeyDown(event) {

    if (selectedObject) {
        if (event.key === "Backspace" || event.key === "Delete") {

            FB.deleteFromFirebase("objects", selectedObject.firebaseKey);
        }
    }
}

function div3DDoubleClick(event) {
    // let mouse = { x: event.clientX, y: event.clientY };
    // const pos = project2DCoordsInto3D(300 - camera.fov * 3, mouse);
    // FB.addNewThingToFirebase("objects", { type: "p5ParticleSystem", position: { x: pos.x, y: pos.y, z: pos.z } });
}

function div3DMouseDown(event) {
    isUserInteracting = true;
    selectedObject = MAIN.findObjectUnderMouse(event.clientX, event.clientY);
    // if (selectedObject) {
    //     selectedObject.hilite = true;
    // } else {
    //     MAIN.clearAllHilites();
    // }
    mouseDownX = event.clientX;
    mouseDownY = event.clientY;
    mouseDownLon = lon;
    mouseDownLat = lat;
}


function div3DMouseMove(event) {
    if (isUserInteracting) {
        lon = (mouseDownX - event.clientX) * 0.1 + mouseDownLon;
        lat = (event.clientY - mouseDownY) * 0.1 + mouseDownLat;
        //either move the selected object or the camera 
        if (selectedObject) {
            drawInfo(selectedObject, event);
            let pos = MAIN.project2DCoordsInto3D(100, { x: event.clientX, y: event.clientY });
            const updates = { position: pos };
            FB.updateJSONFieldInFirebase("objects", selectedObject.firebaseKey, updates);
        } else {
            computeCameraOrientation();
        }
    }
}


function drawInfo(selectedObject, event) {
    infoDiv.style.position = "absolute";
    console.log(selectedObject.position);
    infoDiv.style.top = event.clientY + "px";
    infoDiv.style.left = event.clientX + "px";
    infoDiv.style.width = "130px";
    infoDiv.style.height = "50px";
    infoDiv.style.transform = "translate(-50%, -120%)";
    infoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    infoDiv.style.border = "2px solid white";
    infoDiv.style.padding = "10px";
    infoDiv.style.zIndex = "1000"; // ?
    infoDiv.style.borderRadius = "10px"; // Add this line to set rounded corners
    infoDiv.style.display = "flex";
    infoDiv.style.flexDirection = "column";
    // infoDiv.style.alignItems = "center";
    document.body.appendChild(infoDiv);

    console.log(MAIN.myObjectsByThreeID)
    let FBobject = MAIN.myObjectsByThreeID[selectedObject.mesh.uuid];
    console.log('------', FBobject);
    let username = FBobject.username;
    infoDiv.innerHTML = username + ": " + FBobject.text;
    infoDiv.style.color = "white";
}


function windowMouseUp(event) {
    isUserInteracting = false;

}

function div3DMouseWheel(event) {
    camera.fov += event.deltaY * 0.05;
    camera.fov = Math.max(5, Math.min(100, camera.fov)); //limit zoom
    camera.updateProjectionMatrix();
}

function computeCameraOrientation() {
    lat = Math.max(- 30, Math.min(30, lat));  //restrict movement
    let phi = MathUtils.degToRad(90 - lat);  //restrict movement
    let theta = MathUtils.degToRad(lon);
    //move the target that the camera is looking at
    camera.target.x = 100 * Math.sin(phi) * Math.cos(theta);
    camera.target.y = 100 * Math.cos(phi);
    camera.target.z = 100 * Math.sin(phi) * Math.sin(theta);
    camera.lookAt(camera.target);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.log('Resized');
}


function enableDragDrop() {
    window.addEventListener("dragover", function (e) {
        e.preventDefault();  //prevents browser from opening the file
    }, false);

    window.addEventListener("drop", (e) => {
        e.preventDefault();

        const files = e.dataTransfer.files;

        for (let i = 0; i < files.length; i++) {
            if (files[i].type.match("image")) {
                // Process the dropped image file here
                console.log("Dropped image file:", files[i]);

                const reader = new FileReader();
                reader.onload = function (event) {
                    const img = new Image();
                    img.onload = function () {
                        let mouse = { x: e.clientX, y: e.clientY };
                        const pos = MAIN.project2DCoordsInto3D(150 - camera.fov, mouse);
                        const quickCanvas = document.createElement("canvas");
                        const quickContext = quickCanvas.getContext("2d");
                        quickCanvas.width = img.width;
                        quickCanvas.height = img.height;
                        quickContext.drawImage(img, 0, 0);
                        const base64 = quickCanvas.toDataURL();
                        FB.addNewThingToFirebase("objects", { type: "image", position: { x: pos.x, y: pos.y, z: pos.z }, filename: files[i], base64: base64 });
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(files[i]);

            }
        }
    }, true);

}

