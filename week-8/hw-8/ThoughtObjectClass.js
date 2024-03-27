import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';

export class ThoughtObject {
    constructor(key, imageURL, username, prompt, color, embedding) {
        this.position = { x: 0, y: 0, z: 0 };
        this.firebaseKey = key;
        // this.canvas = canvas;
        // this.context = this.canvas.getContext("2d");
        // this.texture = new THREE.Texture(this.canvas);
        this.imageURL = imageURL;
        // this.base64 = base64;
        this.username = username;
        this.prompt = prompt;
        this.color = color;
        this.embedding = embedding;

        // this.texture.needsUpdate = true; // ? why essential?
        this.material = new THREE.MeshPhongMaterial({ color: this.color });
        this.material.emissive.set(this.color);
        this.material.emissiveIntensity = 5;
        this.material.wireframe = true;
        this.geo = new THREE.SphereGeometry( 1, 8, 4 ); 
        this.mesh = new THREE.Mesh(this.geo, this.material);
        // this.mesh.scale.set(10, 10, 10);
        this.redraw();
    }
    redraw() { // only position can be changed
        this.mesh.position.x = this.position.x;
        this.mesh.position.y = this.position.y;
        this.mesh.position.z = this.position.z;
        // this.texture.needsUpdate = true;
        console.log("redraw", this.position, this.firebaseKey, this.imgURL, this.username, this.text, this.color);
    }
    // what is this for?
    // getJSONForFirebase() {
    //     return { type: "text", position: this.position, text: this.text };
    // }
}