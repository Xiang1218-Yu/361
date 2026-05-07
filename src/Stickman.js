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
        this.energy = 0;
        this.maxEnergy = 100;
        this.isAttacking = false;
        this.isUsingSkill = false;
        this.isDead = false;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.direction = isPlayer ? 1 : -1;

        this.skillCooldowns = {
            dashAttack: 0,
            spinKick: 0,
            energyWave: 0
        };

        this.skillConfig = {
            dashAttack: {
                name: '冲刺攻击',
                cost: 20,
                cooldown: 3000,
                damage: 25,
                range: 2.5
            },
            spinKick: {
                name: '旋风腿',
                cost: 30,
                cooldown: 5000,
                damage: 35,
                range: 1.5
            },
            energyWave: {
                name: '能量波',
                cost: 50,
                cooldown: 8000,
                damage: 45,
                range: 4
            }
        };

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

        this.velocity.y -= 0.01;
        this.group.position.y += this.velocity.y;

        if (this.group.position.y <= 0) {
            this.group.position.y = 0;
            this.velocity.y = 0;
            this.isJumping = false;
        }

        if (!this.isAttacking && !this.isUsingSkill) {
            const time = Date.now() * 0.005;
            this.leftArm.rotation.z = Math.sin(time) * 0.1;
            this.rightArm.rotation.z = -Math.sin(time) * 0.1;

            if (!this.isJumping) {
                this.group.position.y = Math.sin(time * 0.5) * 0.02;
            }
        }

        this.updateSkillCooldowns(dt);
    }

    jump() {
        if (this.isDead || this.isJumping) return;
        this.isJumping = true;
        this.velocity.y = 0.2;
    }

    attack(type = 'punch') {
        if (this.isAttacking || this.isUsingSkill || this.isDead) return;
        this.isAttacking = true;
        this.gainEnergy(5);

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
        this.gainEnergy(10);

        this.flashColor(0xff0000);

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

    gainEnergy(amount) {
        this.energy = Math.min(this.energy + amount, this.maxEnergy);
    }

    canUseSkill(skillType) {
        const config = this.skillConfig[skillType];
        if (!config) return false;
        if (this.energy < config.cost) return false;
        if (this.skillCooldowns[skillType] > Date.now()) return false;
        if (this.isDead || this.isAttacking || this.isUsingSkill) return false;
        return true;
    }

    useSkill(skillType) {
        if (!this.canUseSkill(skillType)) return null;

        const config = this.skillConfig[skillType];
        this.energy -= config.cost;
        this.skillCooldowns[skillType] = Date.now() + config.cooldown;
        this.isUsingSkill = true;

        let hitInfo = null;

        switch (skillType) {
            case 'dashAttack':
                hitInfo = this.performDashAttack(config);
                break;
            case 'spinKick':
                hitInfo = this.performSpinKick(config);
                break;
            case 'energyWave':
                hitInfo = this.performEnergyWave(config);
                break;
        }

        return hitInfo;
    }

    performDashAttack(config) {
        const originalPos = this.group.position.clone();
        const targetPos = originalPos.x + this.direction * config.range;

        const timeline = gsap.timeline({
            onComplete: () => {
                this.isUsingSkill = false;
            }
        });

        timeline.to(this.rightArm.rotation, { x: -Math.PI / 1.5, duration: 0.05, ease: "power2.out" })
            .to(this.group.position, { x: targetPos, duration: 0.2, ease: "power2.in" }, "<")
            .to(this.group.position, { x: originalPos.x + this.direction * 0.5, duration: 0.15, ease: "power2.out" })
            .to(this.rightArm.rotation, { x: 0, duration: 0.1, ease: "power2.in" });

        return {
            type: 'dashAttack',
            damage: config.damage,
            range: config.range,
            pos: originalPos.add(new THREE.Vector3(this.direction * config.range, 1.2, 0))
        };
    }

    performSpinKick(config) {
        const timeline = gsap.timeline({
            onComplete: () => {
                this.isUsingSkill = false;
                this.group.rotation.y = this.direction === 1 ? 0 : Math.PI;
            }
        });

        timeline.to(this.rightLeg.rotation, { x: -Math.PI / 1.2, z: 0.5, duration: 0.1, ease: "back.out(2)" })
            .to(this.leftLeg.rotation, { x: -Math.PI / 1.2, z: -0.5, duration: 0.1, ease: "back.out(2)" }, "<")
            .to(this.group.rotation, { y: this.group.rotation.y + Math.PI * 2, duration: 0.4, ease: "power2.inOut" }, "<")
            .to(this.rightLeg.rotation, { x: 0, z: 0, duration: 0.2, ease: "power2.in" })
            .to(this.leftLeg.rotation, { x: 0, z: 0, duration: 0.2, ease: "power2.in" }, "<");

        return {
            type: 'spinKick',
            damage: config.damage,
            range: config.range,
            pos: this.group.position.clone().add(new THREE.Vector3(0, 1.2, 0))
        };
    }

    performEnergyWave(config) {
        const timeline = gsap.timeline({
            onComplete: () => {
                this.isUsingSkill = false;
            }
        });

        timeline.to(this.leftArm.rotation, { x: -Math.PI / 2, duration: 0.1 })
            .to(this.rightArm.rotation, { x: -Math.PI / 2, duration: 0.1 }, "<")
            .to([this.leftArm.rotation, this.rightArm.rotation], { x: 0, duration: 0.3, ease: "power2.out" }, "+=0.1");

        this.flashColor(0x00ffff);

        return {
            type: 'energyWave',
            damage: config.damage,
            range: config.range,
            pos: this.group.position.clone().add(new THREE.Vector3(this.direction * config.range / 2, 1.2, 0)),
            createWaveEffect: true
        };
    }

    updateSkillCooldowns(dt) {
        Object.keys(this.skillCooldowns).forEach(skillType => {
            if (this.skillCooldowns[skillType] > 0 && this.skillCooldowns[skillType] < Date.now()) {
                this.skillCooldowns[skillType] = 0;
            }
        });
    }

    getSkillCooldownPercent(skillType) {
        const config = this.skillConfig[skillType];
        const remaining = Math.max(0, this.skillCooldowns[skillType] - Date.now());
        return remaining / config.cooldown;
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
        this.energy = 0;
        this.isDead = false;
        this.isAttacking = false;
        this.isUsingSkill = false;
        this.isJumping = false;
        this.velocity.set(0, 0, 0);

        this.skillCooldowns = {
            dashAttack: 0,
            spinKick: 0,
            energyWave: 0
        };

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

        const targetColor = new THREE.Color(this.color);
        this.group.traverse(child => {
            if (child.isMesh && child.material) {
                child.material.color.copy(targetColor);
                gsap.killTweensOf(child.material.color);
            }
        });
    }
}
