import * as THREE from 'three';
import zombieMatURL from "./assets/zombie-material.png";
import skyMaterialURL from "./assets/sky.png";
import grassMaterialURL from "./assets/grass.png";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

// global vars
const ground = 0;
const gravity = -0.05;
const title = document.getElementById("title");
const subtitle = document.getElementById("subtitle");
const ui = document.getElementById("ui");

const stages = {
    menu: true,
    stage1: false,
    death: false,
}
// materials
const tLoader = new THREE.TextureLoader();
const zombieTexture = tLoader.load(zombieMatURL);
const skyMaterial = tLoader.load(skyMaterialURL);
const grassTexture = tLoader.load(grassMaterialURL);
const grassMaterial = new THREE.MeshStandardMaterial({ map: grassTexture, roughness: 0.5 });

grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;

grassTexture.repeat.set(10, 10);

// ocean
const oceanGeo = new THREE.BoxGeometry(1000, 1000, 0.2);
const oceanMaterial = new THREE.MeshStandardMaterial({ color: 0x009DC4 })
const oceanMesh = new THREE.Mesh(oceanGeo, oceanMaterial);

scene.add(oceanMesh);
oceanMesh.position.y = 0;
oceanMesh.position.z = 0;

scene.background = skyMaterial;

// add light
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);
// add ground
const groundGeo = new THREE.BoxGeometry(100, 100, 0.5);
const groundMesh = new THREE.Mesh(groundGeo, grassMaterial);

scene.add(groundMesh);
camera.position.z = 15;
camera.position.y = -15;
camera.lookAt(0, 0, 0);

const zombies = [];

// class definitions
class Player {
    constructor() {
        this.w = 1;
        this.h = 1;
        this.d = 3;

        this.geo = new THREE.BoxGeometry(this.w, this.h, this.d);
        this.material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        this.mesh = new THREE.Mesh(this.geo, this.material);
        this.arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 1), this.material);
        this.arm1.position.x = 0.7;
        this.mesh.add(this.arm1);

        this.arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 1), this.material);
        this.arm2.position.x = -0.7;
        this.mesh.add(this.arm2);
        this.mesh.add(camera);

        // gun
        this.blackMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        this.gun = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.5), this.blackMaterial);
        this.gunHandle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.6), this.blackMaterial);
        this.gun.add(this.gunHandle);
        this.gunHandle.position.set(0, -0.5, -0.3);

        this.mesh.add(this.gun);
        this.gun.position.set(0, 1,0);

        scene.add(this.mesh);
        this.mesh.position.z = 5;
        this.mesh.position.x = 5;

        this.dz = 0;
        this.dx = 0;
        this.dy = 0;
        this.speed = 0.1;

        // keys
        this.forward = false;
        this.backward = false;
        this.right = false;
        this.left = false;

        this.isJumping = false;
        this.jumpPower = 0.5;

        this.prevPos = this.mesh.position.clone();

        this.health = 100;
    }

    update() {
        this.dz += gravity;
        this.mesh.position.z += this.dz;
        this.mesh.position.x += this.dx;
        this.mesh.position.y += this.dy;

        // key inputs
        if (this.forward) {
            this.dy = this.speed;
            this.gun.position.set(0, 1,0);
            this.gun.rotation.set(0, 0, 0);
        }
        if (this.backward) {
            this.dy = -this.speed;
            this.gun.position.set(0, -1,0);
            this.gun.rotation.set(0, 0, -6.28);
        }
        if (this.left) {
            this.dx = -this.speed;
            this.gun.position.set(-1.5, 0 ,0);
            this.gun.rotation.set(0, 0, 1.5);
        }
        if (this.right) {
            this.dx = this.speed;
            this.gun.position.set(1.5, 0 ,0);
            this.gun.rotation.set(0, 0, -1.5);
        }

        if (!this.left && !this.right) {
            this.dx = 0;
        }
        if (!this.forward && !this.backward) {
            this.dy = 0;
        }

        // ground check
        if (this.mesh.position.z - this.d / 2 < ground) {
            this.mesh.position.z = ground + this.d / 2;
            this.isJumping = false;
        }

        // outside of bounds check
        if (this.mesh.position.y > 50 || this.mesh.position.y < -50 || this.mesh.position.x > 50 || this.mesh.position.x < -50) {
            this.health -= 2;
        }

        // check for death
        if (this.health <= 0) {
            stages.death = true;
            stages.menu = false;
            stages.stage1 = false;

            // turn on death screen
            ui.style.display = "flex";
            subtitle.textContent = "Enter to Restart";
            title.textContent = "You Died";
        }

        // last line
        this.prevPos = this.mesh.position.clone();
    }

    respawn() {
        this.mesh.position.x = 5;
        this.mesh.position.z = 5;
    }
}

const player1 = new Player();

class Zombie {
    constructor(x, y) {
        this.w = 1;
        this.h = 1;
        this.d = 3;
        this.geo = new THREE.BoxGeometry(this.w, this.h, this.d);
        const zombieMaterial = new THREE.MeshStandardMaterial({ map: zombieTexture, roughness: 0.5 })
        this.mesh = new THREE.Mesh(this.geo, zombieMaterial);

        scene.add(this.mesh);

        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.z = 10;

        this.prevPos = this.mesh.position.clone();

        this.ogX = x;
        this.ogY = y;
        this.ogZ = 10;

        this.dx = 0;
        this.dy = 0;
        this.dz = 0;
        this.isJumping = false;

        this.speed = 0.04;
    }

    update() {
        this.dz += gravity;
        this.mesh.position.z += this.dz;

        // player tracker
        const px = player1.mesh.position.x;
        const py = player1.mesh.position.y;

        if (this.mesh.position.x > px) {
            this.mesh.position.x -= this.speed;
        }
        if (this.mesh.position.x < px) {
            this.mesh.position.x += this.speed;
        }
        if (this.mesh.position.y < py) {
            this.mesh.position.y += this.speed;
        }
        if (this.mesh.position.y > py) {
            this.mesh.position.y -= this.speed;
        }
        // ground check
        if (this.mesh.position.z - this.d / 2 < ground) {
            this.mesh.position.z = ground + this.d / 2;
        }

        //// collisions
        // player collision
        const mybox = new THREE.Box3().setFromObject(this.mesh);
        const playerbox = new THREE.Box3().setFromObject(player1.mesh);

        if (mybox.intersectsBox(playerbox)) {
            this.mesh.position.copy(this.prevPos);
            player1.mesh.position.copy(player1.prevPos);

            player1.health -= 0.2;
        }

        for (let z of zombies) {
            const zbox = new THREE.Box3().setFromObject(z.mesh);
            if (mybox.intersectsBox(zbox) && z != this) {
                this.mesh.position.copy(this.prevPos);
                z.mesh.position.copy(z.prevPos);
            }
        }

        this.prevPos = this.mesh.position.clone();
    }

    respawn() {
        this.mesh.position.set(this.ogX, this.ogY, this.ogZ);
    }
}

const zombie1 = new Zombie(0, 0);
zombies.push(zombie1);

for (let i = 0; i < 10; i++) {
    zombies.push(new Zombie(i * 2, 1 * 4))
}

// key input handling
document.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "w":
            player1.forward = true;
            break;
        case "s":
            player1.backward = true;
            break;
        case "a":
            player1.left = true;
            break;
        case "d":
            player1.right = true;
            break;
        case " ":
            if (!player1.isJumping) {
                player1.isJumping = true;
                player1.dz = player1.jumpPower;
            }
        case "Enter":
            if (stages.menu || stages.death) {
                stages.menu = false;
                stages.stage1 = true;
                stages.death = false;

                reset();
            }
    }
});

document.addEventListener("keyup", (event) => {
    switch (event.key) {
        case "w":
            player1.forward = false;
            break;
        case "s":
            player1.backward = false;
            break;
        case "a":
            player1.left = false;
            break;
        case "d":
            player1.right = false;
            break;
    }
});
function animate(time) {
    update();
    renderer.render(scene, camera);
}

function update() {
    if (stages.stage1) {
        player1.update();
        updateUI();

        for (let z of zombies) {
            z.update();
        }
    }

    // menu
    if (stages.menu) {

        title.textContent = "Zombie Apocolypse";
        subtitle.textContent = "Enter to Start";

        ui.hidden = false;
    } else if (!stages.death && !stages.menu) {
        title.textContent = "";
        subtitle.textContent = "";

        ui.style.background = "none";
    }
}

// getElementById's
const healthDisplay = document.getElementById("health");

function updateUI() {
    healthDisplay.textContent = `Health: ${Math.round(player1.health)}`;
}

function reset() {
    player1.health = 100;
    for (let z of zombies) {
        z.respawn();
    }

    player1.respawn();
}