import * as THREE from 'three';
import gsap from 'gsap';

export class Stickman {
    constructor(scene, color = 0xffffff, isPlayer = true) {
        this.scene = scene;
        this.color = color;
        this.isPlayer = isPlayer;
        this.group = new THREE.Group();
        this.health = 100;
        this.maxHealth = 100;
        this.isAttacking = false;
        this.isDead = false;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.direction = isPlayer ? 1 : -1;

        this.init();
    }

    init() {
        // AI Generated Texture Support
        const textureLoader = new THREE.TextureLoader();
        const baseTexture = textureLoader.load('/assets/skin_gen.svg',
            // Success callback
            undefined,
            // Progress callback
            undefined,
            // Error callback - fallback to solid color
            () => console.warn('AI generated texture could not be loaded, using fallback.')
        );

        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            map: baseTexture,
            roughness: 0.7,
            metalness: 0.2
        });

        // Head
        const headGeo = new THREE.SphereGeometry(0.18, 32, 32);
        this.head = new THREE.Mesh(headGeo, material);
        this.head.position.y = 1.65;
        this.group.add(this.head);

        // Torso
        const torsoGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.7);
        this.torso = new THREE.Mesh(torsoGeo, material);
        this.torso.position.y = 1.2;
        this.group.add(this.torso);

        // Arms & Legs
        this.leftArm = this.createLimb(0.5, material);
        this.rightArm = this.createLimb(0.5, material);
        this.leftArm.position.set(-0.02, 1.45, 0);
        this.rightArm.position.set(0.02, 1.45, 0);
        this.group.add(this.leftArm, this.rightArm);

        this.leftLeg = this.createLimb(0.65, material);
        this.rightLeg = this.createLimb(0.65, material);
        this.leftLeg.position.set(-0.02, 0.85, 0);
        this.rightLeg.position.set(0.02, 0.85, 0);
        this.group.add(this.leftLeg, this.rightLeg);

        this.scene.add(this.group);
        if (!this.isPlayer) {
            this.group.position.x = 2;
        } else {
            this.group.position.x = -2;
        }
    }

    createLimb(length, material) {
        const limb = new THREE.Mesh(
            new THREE.CylinderGeometry(0.045, 0.045, length),
            material
        );
        limb.geometry.translate(0, -length / 2, 0);
        return limb;
    }

    update(dt = 0.016) {
        if (this.isDead) return;

        // Physics
        this.velocity.y -= 0.01; // Gravity
        this.group.position.y += this.velocity.y;

        if (this.group.position.y <= 0) {
            this.group.position.y = 0;
            this.velocity.y = 0;
            this.isJumping = false;
        }

        // Simple idle animation if not attacking
        if (!this.isAttacking) {
            const time = Date.now() * 0.005;
            this.leftArm.rotation.z = Math.sin(time) * 0.1;
            this.rightArm.rotation.z = -Math.sin(time) * 0.1;

            // Subtle breathing/floating
            if (!this.isJumping) {
                this.group.position.y = Math.sin(time * 0.5) * 0.02;
            }
        }
    }

    jump() {
        if (this.isDead || this.isJumping) return;
        this.isJumping = true;
        this.velocity.y = 0.2;
    }

    attack(type = 'punch') {
        if (this.isAttacking || this.isDead) return;
        this.isAttacking = true;

        const timeline = gsap.timeline({
            onComplete: () => {
                this.isAttacking = false;
            }
        });

        let damage = 10;
        let range = 0.8;

        if (type === 'punch') {
            const arm = this.rightArm;
            timeline.to(arm.rotation, { x: -Math.PI / 1.2, duration: 0.1, ease: "back.out(2)" })
                .to(arm.rotation, { x: 0, duration: 0.2, ease: "power2.in" });
            damage = 10;
            range = 0.6;
        } else if (type === 'kick') {
            const leg = this.rightLeg;
            timeline.to(leg.rotation, { x: -Math.PI / 1.5, z: 0.2, duration: 0.15, ease: "back.out(2)" })
                .to(leg.rotation, { x: 0, z: 0, duration: 0.25, ease: "power2.in" });
            damage = 15;
            range = 0.9;
        }

        // Calculate attack position based on CURRENT direction
        return {
            type,
            damage,
            range,
            pos: this.group.position.clone().add(new THREE.Vector3(this.direction * range, 1.2, 0))
        };
    }

    updateFacing(targetPos) {
        if (this.isDead) return;

        // Determine direction based on target position
        const newDir = targetPos.x > this.group.position.x ? 1 : -1;

        if (newDir !== this.direction) {
            this.direction = newDir;
            // Rotate the group to face the correct way
            // If direction is 1 (right), rotation.y should be 0
            // If direction is -1 (left), rotation.y should be PI
            gsap.to(this.group.rotation, {
                y: this.direction === 1 ? 0 : Math.PI,
                duration: 0.2
            });
        }
    }

    takeDamage(amount, attackerPos) {
        if (this.isDead) return;
        this.health -= amount;

        // Visual feedback
        this.flashColor(0xff0000);

        // Knockback physics
        const knockback = (this.group.position.x - attackerPos.x) > 0 ? 0.3 : -0.3;
        gsap.to(this.group.position, {
            x: this.group.position.x + knockback,
            y: this.group.position.y + 0.1,
            duration: 0.2,
            ease: "power2.out"
        });

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    flashColor(colorHex) {
        const targetColor = new THREE.Color(this.color);
        this.group.traverse(child => {
            if (child.isMesh && child.material) {
                const m = child.material;
                // Instant flash to color
                m.color.setHex(colorHex);
                // Transition back to original color
                gsap.to(m.color, {
                    r: targetColor.r,
                    g: targetColor.g,
                    b: targetColor.b,
                    duration: 0.3,
                    ease: "power2.out"
                });
            }
        });
    }

    die() {
        this.isDead = true;
        gsap.to(this.group.rotation, {
            z: Math.PI / 2,
            x: Math.random() * Math.PI,
            duration: 0.6,
            ease: "bounce.out"
        });
        gsap.to(this.group.position, {
            y: 0.1,
            duration: 0.6,
            ease: "bounce.out"
        });
    }

    reset() {
        this.health = 100;
        this.isDead = false;
        this.isAttacking = false;
        this.isJumping = false;
        this.velocity.set(0, 0, 0);

        // Kill any local animations on this group/sub-elements
        gsap.killTweensOf(this.group.position);
        gsap.killTweensOf(this.group.rotation);

        this.group.position.y = 0;
        this.group.rotation.z = 0;
        this.group.rotation.x = 0;

        if (this.isPlayer) {
            this.group.position.x = -2;
            this.group.rotation.y = 0;
            this.direction = 1;
        } else {
            this.group.position.x = 2;
            this.group.rotation.y = Math.PI;
            this.direction = -1;
        }

        // Reset material colors just in case
        const targetColor = new THREE.Color(this.color);
        this.group.traverse(child => {
            if (child.isMesh && child.material) {
                child.material.color.copy(targetColor);
                gsap.killTweensOf(child.material.color);
            }
        });
    }
}
