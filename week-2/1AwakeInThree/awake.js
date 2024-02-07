import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';

let camera, scene, renderer;
let cube, light;
let dir = 1;

init3D(); //have to call the setup yourself


function init3D() { //like setup
    // scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#ffffff");
    scene.fog = new THREE.Fog("#ffffff", 0.015, 100);
    // cam (fov, aspect (w/h), near clipping plane, far clipping plane)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // cube (geometry, material, mesh, position, scale, add to scene)
    const geometry = new THREE.BoxGeometry(); // an object that contains all the points (vertices) and fill (faces) of the cube.
    const material = new THREE.MeshBasicMaterial({ color: 0x006600 });
    cube = new THREE.Mesh(geometry, material); // already declared
    cube.position.set(0, 0, -30);
    cube.scale.set(10, 10, 10);
    scene.add(cube);

    // lines
    const lineMat = new THREE.LineBasicMaterial( { color: 0x0000ff } );
    const points = [];
    points.push( new THREE.Vector3( - 10, 0, 0 ) );
    points.push( new THREE.Vector3( 0, 10, 0 ) );
    points.push( new THREE.Vector3( 10, 0, 0 ) );
    const lineGeo = new THREE.BufferGeometry().setFromPoints( points );
    const line = new THREE.Line( lineGeo, lineMat );
    scene.add( line );


    // light
    light = new THREE.PointLight(0xFF00);
    light.position.set(0, 0, 0);
    scene.add(light);

    // camera.position.z = 5;
    camera.position.set( 0, 0, 20 );
    camera.lookAt(cube.position); // ?
    animate();  // have to kickstart the draw-like function
}

function animate() {  //like draw
    // cube.position.setZ(cube.position.z + dir);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    if (cube.position.z < -100 || cube.position.z > -10) {
        dir = -dir;
    }
    renderer.render(scene, camera); // render to make it visible
    requestAnimationFrame(animate);  // call it self, almost recursive
}


