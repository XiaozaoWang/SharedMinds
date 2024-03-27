import * as FB from "./firebaseStuff.js";

export async function askForPicture(replicateProxy, prompt, color) {
    const data = {
        "version": "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        input: {
            prompt: prompt,
            seed: 42
        },
    };
    let url = replicateProxy + "/create_n_get/";
    document.getElementById("textInput").value = 'loading...';
    document.body.style.cursor = "progress";
    console.log("Making a Fetch Request", data);
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };
    const raw_response = await fetch(url, options);
    //turn it into json
    const replicateJSON = await raw_response.json();
    document.body.style.cursor = "auto";

    console.log("replicateJSON", replicateJSON);
    if (replicateJSON.output.length == 0) {
        console.log("error in picture generation");
    } else {
        document.getElementById("textInput").value = "";
        let imageURL = replicateJSON.output[0];
        // quickly generating a base64
        // const img = new Image();
        // img.src = imageURL;
        // img.crossOrigin = "Anonymous";
        // img.onload = function () {
        //     console.log("image loaded", img);
        //     let quickCanvas = document.createElement("canvas");
        //     let quickContext = quickCanvas.getContext("2d");
        //     quickCanvas.width = img.width;
        //     quickCanvas.height = img.height;
        //     quickContext.drawImage(img, 0, 0);
        //     let base64 = quickCanvas.toDataURL();
        //     askForEmbedding(replicateProxy, prompt, base64, color);
        // };
        askForEmbedding(replicateProxy, prompt, imageURL, color);
    }
}



export async function askForEmbedding(replicateProxy, prompt, imageURL, color) {

    const data = {
        "version": "0383f62e173dc821ec52663ed22a076d9c970549c209666ac3db181618b7a304",
        "input": {
            "text_input": prompt,
            "modality": "text"
        },
    };

    let url = replicateProxy + "/create_n_get/";
    document.getElementById("textInput").value = 'loading...';
    document.body.style.cursor = "progress";
    console.log("Making a Fetch Request", data);
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };
    const raw_response = await fetch(url, options);
    //turn it into json
    const replicateJSON = await raw_response.json();
    document.body.style.cursor = "auto";

    console.log("replicateJSON", replicateJSON);
    if (replicateJSON.output.length == 0) {
        console.log("error in embedding generation");
    } else {
        document.getElementById("textInput").value = "";
        console.log("embedding", replicateJSON.output);
        let user = FB.getUser();
        console.log("user", user);
        let userName = user.displayName ? user.displayName : user.email.split("@")[0];
        // FB.setDataInFirebase(exampleName + "/" + user.uid, { userName: userName, prompt: prompt, base64: base64, embedding: replicateJSON.output });
        FB.addNewThingToFirebase(user.uid, { userName: userName, prompt: prompt, imageURL: imageURL, embedding: replicateJSON.output, color: color});
    }
}


