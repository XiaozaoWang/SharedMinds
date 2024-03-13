import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';

export class SoundObject {
    constructor(listener, pos, key, imgURL, name, text, color, url, b64) {
        this.position = pos;
        this.firebaseKey = key;
        this.imgURL = imgURL;
        this.username = name;
        this.text = text;
        this.color = color;
        this.url = url;
        this.b64 = b64;

        // this.texture.needsUpdate = true; // ? why essential?
        this.material = new THREE.MeshPhongMaterial({ color: this.color });
        this.material.emissive.set(this.color);
        this.material.emissiveIntensity = 5;
        this.material.wireframe = true;
        this.geo = new THREE.SphereGeometry( 1, 8, 4 ); 
        this.mesh = new THREE.Mesh(this.geo, this.material);
        // this.mesh.scale.set(10, 10, 10);

        // sound
        this.sound = new THREE.PositionalAudio(listener);
        this.sound.setVolume(1);
        this.sound.setRefDistance(10); //
        this.sound.setRolloffFactor(1);
        this.sound.setDistanceModel('linear');
        this.sound.setMaxDistance(100);
        this.sound.setDirectionalCone(90, 180, 0.1);
        this.sound.setLoop(true);

        // add sound as a child of the mesh
        this.mesh.add(this.sound);

        this.buffer = "data:audio/wav;base64," + this.b64;
        this.audioLoader = new THREE.AudioLoader();



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