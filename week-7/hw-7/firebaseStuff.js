// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, off, onValue, update, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
import { getAuth, signOut, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js"
import { reactToFirebase } from './main.js';


let db, auth, app, appName;
let googleAuthProvider;

// things that needs to export to interaction.js
let loggedIn = false;
export let isVisible = false;
export let userPhotoURL;


export function getUser() {
    return auth.currentUser;
}

export function initFirebase() {
    // firebase - Shared Minds
    const firebaseConfig = {
        apiKey: "AIzaSyBN5nwXdCVS9hRgrzIlKLg7c1Gv4Nc-sAw",
        authDomain: "shared-minds-a64d0.firebaseapp.com",
        projectId: "shared-minds-a64d0",
        storageBucket: "shared-minds-a64d0.appspot.com",
        messagingSenderId: "779021402524",
        appId: "1:779021402524:web:4b49257c71fa932c700859"
    };
    app = initializeApp(firebaseConfig);
    appName = "hw7Sounds";

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
    const dbRef = ref(db, appName + '/' + folder); // ref(db, reference_path)
    const newKey = push(dbRef, data).key;
    console.log("dbRef: ", dbRef);
    console.log("newKey: ", newKey);
    return newKey; //useful for later updating
}

export function updateJSONFieldInFirebase(folder, key, data) {
    console.log('onupdate, path: ', appName + '/' + folder + '/' + key)
    const dbRef = ref(db, appName + '/' + folder + '/' + key);
    update(dbRef, data);
}

export function deleteFromFirebase(folder, key) {
    console.log('ondelete, path: ', appName + '/' + folder + '/' + key)
    const dbRef = ref(db, appName + '/' + folder + '/' + key);
    set(dbRef, null);
}

export function subscribeToData(folder) {
    // sets up event listeners for when things change in the database
    // triggers the reactToFirebase function (the callback function in the main.js)
    const commentsRef = ref(db, appName + '/' + folder + '/');
    onChildAdded(commentsRef, (data) => {
        reactToFirebase("added", data.val(), data.key);
    });
    onChildChanged(commentsRef, (data) => {
        reactToFirebase("changed", data.val(), data.key)
    });
    onChildRemoved(commentsRef, (data) => {
        reactToFirebase("removed", data.val(), data.key)
    });
}

// the difference from the 3 functions above??
export function setDataInFirebase(folder, key, data) {
    //if it doesn't exist, it adds (pushes) with you providing the key
    //if it does exist, it overwrites
    const dbRef = ref(db, appName + '/' + folder)
    set(dbRef, data);
}


// Auth interface

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
        // define in advance
        userPhotoURL = user.photoURL;
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
    userNameDiv.style.color = "white";
    let logOutButton = document.createElement("button");
    authDiv.appendChild(userNameDiv);
    logOutButton.innerHTML = "Log Out";
    logOutButton.setAttribute("id", "logOut");
    logOutButton.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    logOutButton.style.color = "white";
    authDiv.appendChild(logOutButton);
    document.getElementById("logOut").addEventListener("click", function () {
        signOut(auth).then(() => {
            // Sign-out successful.
            console.log("signed out");
            loggedIn = false;
            isVisible = false;
            console.log("isVisible", isVisible);

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
                console.log("signed in with google", user);
                loggedIn = true;
                isVisible = true;
                console.log("isVisible", true);
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
                loggedIn = true;
                isVisible = true;
                console.log("isVisible", true);
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
                loggedIn = true;
                isVisible = true;
                console.log("isVisible", true);
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




