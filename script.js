import * as THREE from 'three';
import zombieMatURL from "./assets/zombie-material.png";
import skyMaterialURL from "./assets/sky.png";
import grassMaterialURL from "./assets/grass.png";
import stoneMaterialURL from "./assets/stone.png";

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

let displayStageVar = 0;
let score = 0;
let justDied = true;

// materials
const tLoader = new THREE.TextureLoader();
const zombieTexture = tLoader.load(zombieMatURL);
const skyMaterial = tLoader.load(skyMaterialURL);
const grassTexture = tLoader.load(grassMaterialURL);
const grassMaterial = new THREE.MeshStandardMaterial({ map: grassTexture, roughness: 0.5 });
const stoneTexture = tLoader.load(stoneMaterialURL);
const stoneMaterial = new THREE.MeshStandardMaterial({ map: stoneTexture, roughness: 0.5 });
stoneTexture.wrapS = THREE.RepeatWrapping;
stoneTexture.wrapT = THREE.RepeatWrapping;

stoneTexture.repeat.set(10, 1);
 
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

let zombies = [];
const walls = [];

class Wall {
    constructor (x, y, z, w, h, d) {
        this.geo = new THREE.BoxGeometry(w, h, d);
        this.material = stoneMaterial;
        this.mesh = new THREE.Mesh(this.geo, this.material);
        
        scene.add(this.mesh);
        this.mesh.position.set(x, y, z);

        this.box = new THREE.Box3().setFromObject(this.mesh);
        this.health = 100;
    }

    update() {
        if (this.health <= 0) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            scene.remove(this.mesh);
        }
    }
}

walls.push(new Wall(0, -30, 1.2, 100, 1, 2.4));

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
        this.gun.position.set(0, 1, 0);

        scene.add(this.mesh);
        this.mesh.position.z = 5;
        this.mesh.position.x = 5;
        this.mesh.position.y = -50;

        this.dz = 0;
        this.dx = 0;
        this.dy = 0;
        this.speed = 0.1;

        // keys
        this.forward = false;
        this.backward = false;
        this.right = false;
        this.left = false;

        // direction
        this.facingForward = true;
        this.facingBackward = false;
        this.facingLeft = false;
        this.facingRight = false;

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
            this.gun.position.set(0, 1, 0);
            this.gun.rotation.set(0, 0, 0);

            this.facingForward = true;
            this.facingBackward = false;
            this.facingLeft = false;
            this.facingRight = false;
        }
        if (this.backward) {
            this.dy = -this.speed;
            this.gun.position.set(0, -1, 0);
            this.gun.rotation.set(0, 0, -6.28);

            this.facingForward = false;
            this.facingBackward = true;
            this.facingLeft = false;
            this.facingRight = false;
        }
        if (this.left) {
            this.dx = -this.speed;
            this.gun.position.set(-1.5, 0, 0);
            this.gun.rotation.set(0, 0, 1.5);

            this.facingForward = false;
            this.facingBackward = false;
            this.facingLeft = true;
            this.facingRight = false;
        }
        if (this.right) {
            this.dx = this.speed;
            this.gun.position.set(1.5, 0, 0);
            this.gun.rotation.set(0, 0, -1.5);

            this.facingForward = false;
            this.facingBackward = false;
            this.facingLeft = false;
            this.facingRight = true;
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
        this.mesh.position.y = -50;
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

        this.health = 100;
        this.speed = 0.07;

        this.speed = Math.random() * 0.1 + 0.05;
    }

    update() {

        // movement randomizer
        if (Math.random() < 0.01) {
            this.dx = (Math.random() - 0.5) * 0.1;
            this.dy = (Math.random() - 0.5) * 0.1;
        }
        if (this.dx == 0) {
            this.dx = (Math.random() - 0.5) * 100;
        }
        if (this.dy == 0) {
            this.dy = (Math.random() - 0.5) * 100;
        }

        this.dz += gravity;
        this.mesh.position.z += this.dz;

        // player tracker
        const px = player1.mesh.position.x;
        const py = player1.mesh.position.y;

        if (this.mesh.position.x > px && Math.abs(this.mesh.position.y - py) < 5) {
            this.mesh.position.x -= this.speed;
        }
        if (this.mesh.position.x < px && Math.abs(this.mesh.position.y - py) < 5) {
            this.mesh.position.x += this.speed;
        }

        const randomOffset = (Math.random() - 1) * 2; // Random offset between -1 and 1
        if (this.mesh.position.y < py + randomOffset) {
            this.mesh.position.y += this.speed;
        }
        if (this.mesh.position.y > py + randomOffset) {
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

        // wall collision
        for (let w of walls) {
            if (mybox.intersectsBox(w.box)) {
                this.mesh.position.copy(this.prevPos);
                w.health -= 0.05;
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

let bullets = [];

class Bullet {
    constructor(playerMObj) {
        this.geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        this.material = new THREE.MeshStandardMaterial({ color: 0xFFB81C });
        this.mesh = new THREE.Mesh(this.geo, this.material);

        this.player = playerMObj;
        this.speed = 0.5;

        this.dx = 0;
        this.dy = 0;

        if (this.player.facingForward) {
            this.direction = "forward";
            this.dy = this.speed;
        }
        if (this.player.facingBackward) {
            this.direction = "backward";
            this.dy = -this.speed;
        }
        if (this.player.facingRight) {
            this.direction = "right";
            this.dx = this.speed;
        }
        if (this.player.facingLeft) {
            this.direction = "left";
            this.dx = -this.speed;
        }

        this.mesh.position.set(this.player.mesh.position.x, this.player.mesh.position.y, this.player.mesh.position.z)
        scene.add(this.mesh);
    }

    update() {
        this.mesh.position.x += this.dx;
        this.mesh.position.y += this.dy;
    }

    static handleRemoval() {
        const bulletsLeft = [];

        for (let b of bullets) {

            let removed = false;

            // zombie check
            for (let z of zombies) {
                const zbox = new THREE.Box3().setFromObject(z.mesh);
                const bulletBox = new THREE.Box3().setFromObject(b.mesh);
                if (zbox.intersectsBox(bulletBox)) {
                    b.mesh.geometry.dispose();
                    b.mesh.material.dispose();
                    scene.remove(b.mesh);
                    removed = true;

                    z.health -= 50;
                    score++;
                    break;
                }
            }

            if (removed) continue; // Skip other checks if already removed by a barrier

            // Out of bounds check
            if (b.mesh.position.x > 100 || b.mesh.position.x < -100 || b.mesh.position.y < -100 || b.mesh.position.y > 100) {
                b.mesh.geometry.dispose();
                b.mesh.material.dispose();
                scene.remove(b.mesh);
                continue;
            }

            // If no collisions or out of bounds, keep the bullet alive
            bulletsLeft.push(b);
        }

        bullets = bulletsLeft;
    }

}
let powerups = [];

class Powerup {
    constructor(newSpeed, newJumpPower, healthAddition) {
        this.newSpeed = newSpeed;
        this.newJumpPower = newJumpPower;
        this.healthAddition = healthAddition;

        this.color = 0xffffff;

        if (this.newSpeed != 0) {
            this.color = 0xFFFF00; // yellow for speed
        }
        if (this.newJumpPower != 0) {
            this.color = 0x00FF00; // green for jump
        }
        if (this.healthAddition != 0) {
            this.color = 0xFF0000; // red for health
        }

        this.geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        this.material = new THREE.MeshStandardMaterial({ color: this.color });
        this.mesh = new THREE.Mesh(this.geo, this.material);

        scene.add(this.mesh);
        this.mesh.position.set((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, 1);
    }

    update() {
        const mybox = new THREE.Box3().setFromObject(this.mesh);
        const playerbox = new THREE.Box3().setFromObject(player1.mesh);

        if (mybox.intersectsBox(playerbox)) {
            if (this.newSpeed != 0) {
                player1.speed += this.newSpeed;
            }
            if (this.newJumpPower != 0) {
                player1.jumpPower += this.newJumpPower;
            }
            if (this.healthAddition != 0) {
                player1.health += this.healthAddition;
            }
        }
    }

    static handleRemoval() {
        const powerupsLeft = [];

        for (let p of powerups) {
            const mybox = new THREE.Box3().setFromObject(p.mesh);
            const playerbox = new THREE.Box3().setFromObject(player1.mesh);

            if (mybox.intersectsBox(playerbox)) {
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                scene.remove(p.mesh);
                continue;
            }

            powerupsLeft.push(p);
        }

        powerups = powerupsLeft;
    }
}

for (let i = 0; i < 3; i++) {
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
            break;
        case "Shift":
            bullets.push(new Bullet(player1));
            break;
        case "Enter":
            if (stages.menu || stages.death) {
                if (stages.menu) {
                    displayStageVar = 1;
                }
                stages.menu = false;
                stages.stage1 = true;
                stages.death = false;

                reset();
            }
            break;
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

        // zombie death check
        let zombiesWhoAreGonnaDieInLine453 = zombies.filter(zombie => zombie.health <= 0);
        for (let z of zombiesWhoAreGonnaDieInLine453) {
            z.mesh.geometry.dispose();
            z.mesh.material.dispose();
            scene.remove(z.mesh);
        }
        zombies = zombies.filter(zombie => zombie.health > 0);


        for (let b of bullets) {
            b.update();
        }

        Bullet.handleRemoval();

        // powerup update
        for (let p of powerups) {
            p.update();
        }

        Powerup.handleRemoval();

        // check for next stage
        if (zombies.length === 0) {
            stages.stage1 = true;
            displayStageVar += 1;
            // add more zombies for the next stage

            if (justDied) {
                displayStageVar = 1;
                justDied = false;
            }
            for (let i = 0; i < 3 * displayStageVar; i++) {
                zombies.push(new Zombie(i * 2, 1 * 4));
            }

            // add more powerups
            let amtOfPowerUps = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < amtOfPowerUps; i++) {
                const random = Math.random();
                if (random < 0.33) {
                    powerups.push(new Powerup(Math.random() * 0.1, 0, 0));
                } else if (random < 0.66) {
                    powerups.push(new Powerup(0, Math.random() * 0.5, 0));
                } else {
                    powerups.push(new Powerup(0, 0, Math.random() * 20));
                }
            }

            // reset player powers
            player1.speed = 0.1;
            player1.jumpPower = 0.5;
        }

        for (let w of walls) {
            w.update();
        }
    }

    // menu

    if (stages.menu) {
        title.textContent = "Zombie Apocalypse";
        subtitle.textContent = "Enter to Start";
        ui.style.display = "flex";
    } else if (stages.stage1) {
        ui.style.display = "none";
    } else if (stages.death) {
        ui.style.display = "flex";
        title.textContent = "You Died";
        subtitle.textContent = "Enter to Restart";
    }
}

// getElementById's
const healthDisplay = document.getElementById("health");
const scoreDisplay = document.getElementById("score");
const stageDisplay = document.getElementById("stage");
const wallHealthDisplay = document.getElementById("wallhealth");

function updateUI() {
    healthDisplay.textContent = `Health: ${Math.round(player1.health)}`;
    scoreDisplay.textContent = `Score: ${score}`;
    stageDisplay.textContent = `Stage ${displayStageVar}`;
    wallHealthDisplay.textContent = `Wall Health: ${Math.round(walls[0].health)}`;
}

function reset() {
    player1.health = 100;

    for (let z of zombies) {
        z.mesh.geometry.dispose();
        z.mesh.material.dispose();
        scene.remove(z.mesh);
    }
    zombies = [new Zombie(0, 0)];
    for (let i = 0; i < 3; i++) {
        zombies.push(new Zombie(i * 2, 4));
    }

    for (let b of bullets) {
        b.mesh.geometry.dispose();
        b.mesh.material.dispose();
        scene.remove(b.mesh);
    }
    bullets = [];

    for (let p of powerups) {
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        scene.remove(p.mesh);
    }
    powerups = [];

    player1.respawn();
    player1.speed = 0.1;
    player1.jumpPower = 0.5;
    player1.health = 100;
    displayStageVar = 1;
    score = 0;
    justDied = true;
}