import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';

export class ThoughtObject {
    constructor(pos, key, imgURL, name, text, color) {
        this.position = pos;
        this.firebaseKey = key;
        // this.canvas = canvas;
        // this.context = this.canvas.getContext("2d");
        // this.texture = new THREE.Texture(this.canvas);
        this.imgURL = imgURL;
        // this.base64 = base64;
        this.username = name;
        this.text = text;
        this.color = color;

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