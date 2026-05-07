import * as THREE from 'three';
import gsap from 'gsap';
import { skillConfig, energyConfig } from './mock';

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

        this.energy = energyConfig.startEnergy;
        this.maxEnergy = energyConfig.maxEnergy;
        this.cooldowns = {
            dashAttack: 0,
            whirlwindKick: 0,
            energyWave: 0
        };
        this.isUsingSkill = false;
        this.skillWaveMesh = null;

        this.init();
    }

    init() {
        const textureLoader = new THREE.TextureLoader();
        const baseTexture = textureLoader.load('/assets/skin_gen.svg',
            undefined,
            undefined,
            () => console.warn('AI generated texture could not be loaded, using fallback.')
        );

        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            map: baseTexture,
            roughness: 0.7,
            metalness: 0.2
        });

        const headGeo = new THREE.SphereGeometry(0.18, 32, 32);
        this.head = new THREE.Mesh(headGeo, material);
        this.head.position.y = 1.65;
        this.group.add(this.head);

        const torsoGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.7);
        this.torso = new THREE.Mesh(torsoGeo, material);
        this.torso.position.y = 1.2;
        this.group.add(this.torso);

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

        for (const skillId in this.cooldowns) {
            if (this.cooldowns[skillId] > 0) {
                this.cooldowns[skillId] = Math.max(0, this.cooldowns[skillId] - dt * 1000);
            }
        }
    }

    gainEnergy(amount) {
        if (this.isDead) return;
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
    }

    canUseSkill(skillId) {
        const config = skillConfig[skillId];
        if (!config) return false;
        if (this.isUsingSkill || this.isAttacking || this.isDead) return false;
        if (this.energy < config.energyCost) return false;
        if (this.cooldowns[skillId] > 0) return false;
        return true;
    }

    useSkill(skillId) {
        if (!this.canUseSkill(skillId)) return null;

        const config = skillConfig[skillId];
        this.isUsingSkill = true;
        this.isAttacking = true;
        this.energy -= config.energyCost;
        this.cooldowns[skillId] = config.cooldown;

        if (skillId === 'dashAttack') {
            return this.performDashAttack(config);
        } else if (skillId === 'whirlwindKick') {
            return this.performWhirlwindKick(config);
        } else if (skillId === 'energyWave') {
            return this.performEnergyWave(config);
        }

        this.isUsingSkill = false;
        this.isAttacking = false;
        return null;
    }

    performDashAttack(config) {
        const dashDir = this.direction;
        const startPos = this.group.position.x;
        const targetX = startPos + dashDir * config.dashDistance;
        const hitPos = this.group.position.clone().add(new THREE.Vector3(dashDir * config.range, 1.2, 0));

        const timeline = gsap.timeline({
            onComplete: () => {
                this.isUsingSkill = false;
                this.isAttacking = false;
            }
        });

        this.flashColor(0x00ffff);

        timeline.to(this.rightArm.rotation, {
            x: -Math.PI / 0.8,
            z: dashDir * 0.5,
            duration: 0.05,
            ease: "power4.out"
        })
        .to(this.group.position, {
            x: targetX,
            duration: 0.15,
            ease: "power4.out"
        }, 0)
        .to(this.rightArm.rotation, {
            x: 0,
            z: 0,
            duration: 0.25,
            ease: "power2.in"
        }, 0.15);

        return {
            type: 'dashAttack',
            damage: config.damage,
            range: config.range,
            pos: hitPos,
            isSkill: true
        };
    }

    performWhirlwindKick(config) {
        const hitPos = this.group.position.clone().add(new THREE.Vector3(0, 0.8, 0));

        const timeline = gsap.timeline({
            onComplete: () => {
                this.isUsingSkill = false;
                this.isAttacking = false;
            }
        });

        this.flashColor(0xff6600);

        timeline.to(this.group.rotation, {
            y: this.group.rotation.y + Math.PI * 4,
            duration: config.spinDuration,
            ease: "power2.inOut"
        })
        .to(this.leftLeg.rotation, {
            x: -Math.PI / 1.2,
            duration: 0.1,
            ease: "back.out(2)"
        }, 0)
        .to(this.rightLeg.rotation, {
            x: -Math.PI / 1.2,
            duration: 0.1,
            ease: "back.out(2)"
        }, 0.05)
        .to(this.leftLeg.rotation, {
            x: 0,
            duration: 0.2,
            ease: "power2.in"
        }, config.spinDuration - 0.1)
        .to(this.rightLeg.rotation, {
            x: 0,
            duration: 0.2,
            ease: "power2.in"
        }, config.spinDuration - 0.05);

        return {
            type: 'whirlwindKick',
            damage: config.damage,
            range: config.range,
            pos: hitPos,
            isSkill: true
        };
    }

    performEnergyWave(config) {
        this.flashColor(0xaa00ff);

        const waveGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const waveMat = new THREE.MeshBasicMaterial({
            color: 0xaa00ff,
            transparent: true,
            opacity: 0.8
        });
        const waveMesh = new THREE.Mesh(waveGeo, waveMat);
        waveMesh.position.copy(this.group.position).add(new THREE.Vector3(0, 1.2, 0));
        this.scene.add(waveMesh);
        this.skillWaveMesh = waveMesh;

        const startPosX = waveMesh.position.x;
        const endPosX = startPosX + this.direction * config.range;
        const startTime = Date.now();

        const animateWave = () => {
            if (this.isDead || !this.skillWaveMesh) return;
            const elapsed = Date.now() - startTime;
            if (elapsed > config.waveDuration) {
                this.scene.remove(this.skillWaveMesh);
                this.skillWaveMesh = null;
                this.isUsingSkill = false;
                this.isAttacking = false;
                return;
            }

            const progress = elapsed / config.waveDuration;
            this.skillWaveMesh.position.x = startPosX + (endPosX - startPosX) * progress;
            this.skillWaveMesh.scale.setScalar(1 + progress * 2);
            this.skillWaveMesh.material.opacity = 0.8 * (1 - progress);

            requestAnimationFrame(animateWave);
        };

        const hitPos = this.group.position.clone().add(new THREE.Vector3(this.direction * config.range * 0.5, 1.2, 0));

        const timeline = gsap.timeline({
            onComplete: () => {}
        });

        timeline.to(this.leftArm.rotation, {
            x: -Math.PI / 2,
            duration: 0.15,
            ease: "back.out(2)"
        })
        .to(this.leftArm.rotation, {
            x: 0,
            duration: 0.3,
            ease: "power2.in"
        }, 0.2);

        requestAnimationFrame(animateWave);

        return {
            type: 'energyWave',
            damage: config.damage,
            range: config.range,
            pos: hitPos,
            isSkill: true,
            isProjectile: true,
            projectileUpdate: (enemy) => {
                if (!this.skillWaveMesh) return false;
                const dist = this.skillWaveMesh.position.distanceTo(enemy.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
                return dist < 0.8;
            }
        };
    }

    jump() {
        if (this.isDead || this.isJumping) return;
        this.isJumping = true;
        this.velocity.y = 0.2;
    }

    attack(type = 'punch') {
        if (this.isAttacking || this.isDead || this.isUsingSkill) return;
        this.isAttacking = true;
        this.gainEnergy(energyConfig.attackGain);

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
        if (this.isDead || this.isUsingSkill) return;

        const newDir = targetPos.x > this.group.position.x ? 1 : -1;

        if (newDir !== this.direction) {
            this.direction = newDir;
            gsap.to(this.group.rotation, {
                y: this.direction === 1 ? 0 : Math.PI,
                duration: 0.2
            });
        }
    }

    takeDamage(amount, attackerPos) {
        if (this.isDead) return;
        this.health -= amount;
        this.gainEnergy(energyConfig.hitGain);

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

    flashColor(colorHex) {
        const targetColor = new THREE.Color(this.color);
        this.group.traverse(child => {
            if (child.isMesh && child.material) {
                const m = child.material;
                m.color.setHex(colorHex);
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
        if (this.skillWaveMesh) {
            this.scene.remove(this.skillWaveMesh);
            this.skillWaveMesh = null;
        }
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
        this.isUsingSkill = false;
        this.velocity.set(0, 0, 0);
        this.energy = energyConfig.startEnergy;
        this.cooldowns = {
            dashAttack: 0,
            whirlwindKick: 0,
            energyWave: 0
        };

        if (this.skillWaveMesh) {
            this.scene.remove(this.skillWaveMesh);
            this.skillWaveMesh = null;
        }

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
