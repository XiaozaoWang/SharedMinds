const replicateProxy = "https://replicate-api-proxy.glitch.me"


//////This is all vanilla javascript, no p5.js form making two fields and a listener for when the user hits enter
const model_container = document.getElementById("model_container");
var input_model_field = document.createElement("input");
input_model_field.type = "text";
input_model_field.id = "input_model_prompt";
input_model_field.value = "a shark";
input_model_field.size = 100;
model_container.prepend(input_model_field);
input_model_field.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        askForModel(input_model_field.value);
    }
});



async function askForModel(p_prompt) {
    const modelDiv = document.getElementById("resulting_model");
    modelDiv.innerHTML = "Waiting for reply from Replicate's API...";
    let data = {
        "version": "5957069d5c509126a73c7cb68abcddbb985aeefa4d318e7c63ec1352ce6da68c",
        input: {
            "prompt": p_prompt,
            "save_mesh": false
        },
    };
    console.log("Asking for 3d model data From Replicate via Proxy", data);
    let options = {
        // mode: "no-cors",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            // "Access-Control-Allow-Origin": "http://localhost:5500",
            // 'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify(data),
    };
    const url = replicateProxy + "/create_n_get/"
    console.log("url", url, "options", options);
    const model_info = await fetch(url, options);
    const proxy_said = await model_info.json();

    if (proxy_said.output.length == 0) {
        modelDiv.innerHTML = "Something went wrong, try it again";
    } else {
        modelDiv.innerHTML = "";
        let gif = document.createElement("img");
        gif.src = proxy_said.output[0];
        modelDiv.appendChild(gif);
    }
}
