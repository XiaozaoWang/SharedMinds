// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, off, onValue, update, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
import { getAuth, signOut, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js"


let db, auth, app;
let googleAuthProvider;



export function getUser() {
    return auth.currentUser;
}

export function initFirebase() {
    const firebaseConfig = {
        apiKey: "AIzaSyDHOrU4Lrtlmk-Af2svvlP8RiGsGvBLb_Q",
        authDomain: "sharedmindss24.firebaseapp.com",
        databaseURL: "https://sharedmindss24-default-rtdb.firebaseio.com",
        projectId: "sharedmindss24",
        storageBucket: "sharedmindss24.appspot.com",
        messagingSenderId: "1039430447930",
        appId: "1:1039430447930:web:edf98d7d993c21017ad603"
    };
    app = initializeApp(firebaseConfig);
    //make a folder in your firebase for this example


    db = getDatabase();
    auth = getAuth();
    googleAuthProvider = new GoogleAuthProvider();
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/auth.user
            const uid = user.uid;
            console.log("userino is signed in", user);
            showLogOutButton(user);
            // ...
        } else {
            console.log("userino is signed out");
            showLoginButtons();
            // User is signed out
            // ...
        }
    });
    return auth.currentUser;
}


export function addNewThingToFirebase(folder, data) {
    //firebase will supply the key,  this will trigger "onChildAdded" below
    const dbRef = ref(db, folder);
    const newKey = push(dbRef, data).key;
    return newKey; //useful for later updating
}

export function updateJSONFieldInFirebase(folder, key, data) {
    console.log(folder + '/' + key)
    const dbRef = ref(db, folder + '/' + key);
    update(dbRef, data);
}

export function deleteFromFirebase(folder, key) {
    console.log("deleting", folder + '/' + key);
    const dbRef = ref(db, folder + '/' + key);
    set(dbRef, null);
}

export function subscribeToData(folder, callback) {
    //get callbacks when there are changes either by you locally or others remotely
    const commentsRef = ref(db, folder + '/');
    onChildAdded(commentsRef, (data) => {
        callback("added", data.val(), data.key);
        //reactToFirebase("added", data.val(), data.key);
    });
    onChildChanged(commentsRef, (data) => {
        callback("changed", data.val(), data.key);
        //reactToFirebase("changed", data.val(), data.key)
    });
    onChildRemoved(commentsRef, (data) => {
        callback("removed", data.val(), data.key);
        //reactToFirebase("removed", data.val(), data.key)
    });
}

// export function unSubscribeToData(folder) {
//     const oldRef = ref(db, folder + '/');
//     console.log("unsubscribing from", folder, oldRef);
//     off(oldRef);
// }


export function setDataInFirebase(dbPath, data) {
    //if it doesn't exist, it adds (pushes) with you providing the key
    //if it does exist, it overwrites
    const dbRef = ref(db, dbPath)
    set(dbRef, data);
}


// ================== TEST GUI ================== start

let guiDiv = document.createElement("div");
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
let userImg = document.createElement("img");
userImg.style.width = "50px";
userImg.style.height = "50px";
userDiv.appendChild(userImg);
// userImg.src = user.photoURL;
guiDiv.appendChild(userDiv);
let greetingDiv = document.createElement("div");
greetingDiv.innerHTML = "Hello, " + "user";
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


// ================== TEST GUI ================== end


let authDiv = document.createElement("div");
authDiv.style.position = "absolute";
authDiv.style.top = "10%";
authDiv.style.left = "85%";
authDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
authDiv.style.border = "2px solid white";
authDiv.style.padding = "10px";
authDiv.style.zIndex = "1000";
authDiv.style.borderRadius = "10px"; // Add this line to set rounded corners
//align elements in the center
authDiv.style.display = "flex";
authDiv.style.flexDirection = "column";
authDiv.style.alignItems = "center";
document.body.appendChild(authDiv);




function showLogOutButton(user) {
    authDiv.innerHTML = ""; //clear the div?
    let userNameDiv = document.createElement("div");
    if (user.photoURL) {
        console.log("photo url", user.photoURL);
        let userPic = document.createElement("img");
        userPic.style.width = "50px";
        userPic.style.height = "50px";

        userPic.onload = function (img) {
            console.log("loaded", img);
            authDiv.appendChild(userPic);
        }
        userPic.src = user.photoURL;
    }

    if (user.displayName) {
        userNameDiv.innerHTML = user.displayName;
    } else {
        userNameDiv.innerHTML = user.email;
    }
    let logOutButton = document.createElement("button");
    authDiv.appendChild(userNameDiv);
    logOutButton.innerHTML = "Log Out";
    logOutButton.setAttribute("id", "logOut");
    authDiv.appendChild(logOutButton);
    document.getElementById("logOut").addEventListener("click", function () {
        signOut(auth).then(() => {
            // Sign-out successful.
            console.log("signed out");
        }).catch((error) => {
            // An error happened.
            console.log("error signing out");
        });
    });
}

function showLoginButtons() {
    authDiv.innerHTML = "";

    let signUpWithGoogleButton = document.createElement("button");
    signUpWithGoogleButton.innerHTML = "Google Login";
    signUpWithGoogleButton.setAttribute("id", "signInWithGoogle");
    signUpWithGoogleButton.setAttribute("class", "authButton");
    signUpWithGoogleButton.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    signUpWithGoogleButton.style.color = "white";
    authDiv.appendChild(signUpWithGoogleButton);

    authDiv.appendChild(document.createElement("br"));

    // example of a unit html element of this GUI
    let emailDiv = document.createElement("div");
    emailDiv.innerHTML = "Email";
    emailDiv.style.color = "white";
    authDiv.appendChild(emailDiv);

    //let form = document.createElement("form");
    //authDiv.appendChild(form);

    let emailInput = document.createElement("input");
    emailInput.setAttribute("id", "email");
    emailInput.setAttribute("class", "authInput");
    emailInput.setAttribute("type", "text");
    emailInput.setAttribute("placeholder", "email@email.com");
    emailInput.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    emailInput.style.color = "white";
    authDiv.appendChild(emailInput);

    let passwordInput = document.createElement("input");
    passwordInput.setAttribute("id", "password");
    passwordInput.setAttribute("class", "authInput");
    passwordInput.setAttribute("type", "password");
    passwordInput.setAttribute("suggest", "current-password");
    passwordInput.setAttribute("autocomplete", "on");
    passwordInput.setAttribute("placeholder", "password");
    passwordInput.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    passwordInput.style.color = "white";

    authDiv.appendChild(passwordInput);
    let buttonSpan = document.createElement("span");
    buttonSpan.style.display = "flex";
    buttonSpan.style.justifyContent = "space-around";
    buttonSpan.style.width = "100%";
    authDiv.appendChild(buttonSpan);

    let signUpWithEmailButton = document.createElement("button");
    signUpWithEmailButton.innerHTML = "SignUp";
    signUpWithEmailButton.setAttribute("id", "signUpWithEmail");
    signUpWithEmailButton.setAttribute("class", "authButton");
    signUpWithEmailButton.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    signUpWithEmailButton.style.color = "white";
    signUpWithEmailButton.style.margin = "3px";
    buttonSpan.appendChild(signUpWithEmailButton);

    let signInWithEmailButton = document.createElement("button");
    signInWithEmailButton.innerHTML = "SignIn";
    signInWithEmailButton.setAttribute("id", "signInWithEmail");
    signInWithEmailButton.setAttribute("class", "authButton");
    signInWithEmailButton.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    signInWithEmailButton.style.color = "white";
    signInWithEmailButton.style.margin = "3px";
    buttonSpan.appendChild(signInWithEmailButton);


    document.getElementById("signInWithGoogle").addEventListener("click", function () {
        signInWithPopup(auth, googleAuthProvider)
            .then((result) => {
                // This gives you a Google Access Token. You can use it to access the Google API.
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;
                // The signed-in user info.
                const user = result.user;
                // IdP data available using getAdditionalUserInfo(result)
                // ...
            }).catch((error) => {
                // Handle Errors here.
                const errorCode = error.code;
                const errorMessage = error.message;
                // The email of the user's account used.
                const email = error.customData.email;
                // The AuthCredential type that was used.
                const credential = GoogleAuthProvider.credentialFromError(error);
                // ...
            });
    });


    document.getElementById("signInWithEmail").addEventListener("click", function (event) {

        console.log("signing in with email");
        event.stopPropagation();
        let email = document.getElementById("email").value;
        let password = document.getElementById("password").value;
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in 
                console.log("signed in");
                const user = userCredential.user;
                // ...
            })
            .catch((error) => {
                console.log("error signing in");
                const errorCode = error.code;
                const errorMessage = error.message;
            });
    });


    document.getElementById("signUpWithEmail").addEventListener("click", function () {
        let email = document.getElementById("email").value;
        let password = document.getElementById("password").value;
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed up 
                const user = userCredential.user;
                console.log(user);
                // ...
            })
            .catch((error) => {
                console.log("error signing up");
                const errorCode = error.code;
                const errorMessage = error.message;
                // ..
            });
    });
}




