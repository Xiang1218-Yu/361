import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Stickman } from './Stickman';
import { characterStats, gameConfig, skillConfig } from './mock';
import gsap from 'gsap';
import './style.css';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.uiLayer = document.getElementById('ui-layer');
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });

    this.stats = characterStats;
    this.config = gameConfig;
    this.player = null;
    this.enemy = null;
    this.gameState = 'menu';
    this.lKeyPressed = false;
    this.activeProjectile = null;
    this.lastTime = performance.now();

    this.init();
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0xf5f5f5);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    this.scene.add(directionalLight);

    const p1 = new THREE.PointLight(0xffffff, 0.5);
    p1.position.set(-5, 5, 5);
    this.scene.add(p1);

    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load('/assets/floor_gen.svg');
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 4);

    const grid = new THREE.GridHelper(30, 30, 0xdddddd, 0xeeeeee);
    grid.position.y = -0.01;
    this.scene.add(grid);

    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: floorTexture,
      metalness: 0,
      roughness: 1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    this.scene.add(floor);

    this.camera.position.set(this.config.cameraStartPos.x, this.config.cameraStartPos.y, this.config.cameraStartPos.z);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI / 2;

    this.player = new Stickman(this.scene, 0x2288ff, true);
    this.enemy = new Stickman(this.scene, 0xff3300, false);

    this.setupUI();
    this.setupEvents();
    this.animate();
  }

  setupUI() {
    this.uiLayer.innerHTML = `
            <div id="main-menu" class="menu-overlay">
                <h1 class="menu-title">3D 火柴人格斗</h1>
                <button id="start-btn" class="btn">开始游戏</button>
                <div class="controls-hint">
                    <div class="hint-row">A / D : 移动 | K / Space : 跳跃 | J : 拳 | I : 踢</div>
                    <div class="hint-row skill-hint">L + J : 冲刺攻击 | L + I : 旋风腿 | L + K : 能量波</div>
                </div>
            </div>
            
            <div id="hud" class="hud-container hidden">
                <div class="player-hud">
                    <div class="character-name">玩家 (PLAYER)</div>
                    <div class="health-bar-container">
                        <div id="player-hp" class="health-bar player-health"></div>
                    </div>
                    <div class="energy-bar-container">
                        <div id="player-energy" class="energy-bar player-energy"></div>
                    </div>
                </div>
                <div class="enemy-hud">
                    <div class="character-name" style="text-align: right;">对手 (ENEMY)</div>
                    <div class="health-bar-container">
                        <div id="enemy-hp" class="health-bar enemy-health"></div>
                    </div>
                </div>
            </div>

            <div id="skill-bar" class="skill-bar hidden">
                <div class="skill-item" id="skill-dashAttack">
                    <div class="skill-icon skill-icon-dash">冲</div>
                    <div class="skill-cooldown-overlay" id="cd-dashAttack"></div>
                    <div class="skill-key">L+J</div>
                    <div class="skill-name">冲刺攻击</div>
                </div>
                <div class="skill-item" id="skill-whirlwindKick">
                    <div class="skill-icon skill-icon-whirlwind">旋</div>
                    <div class="skill-cooldown-overlay" id="cd-whirlwindKick"></div>
                    <div class="skill-key">L+I</div>
                    <div class="skill-name">旋风腿</div>
                </div>
                <div class="skill-item" id="skill-energyWave">
                    <div class="skill-icon skill-icon-wave">波</div>
                    <div class="skill-cooldown-overlay" id="cd-energyWave"></div>
                    <div class="skill-key">L+K</div>
                    <div class="skill-name">能量波</div>
                </div>
            </div>

            <div id="mobile-controls" class="hidden">
                <div class="control-btn" id="btn-left">←</div>
                <div class="control-btn" id="btn-right">→</div>
                <div class="control-btn action-btn" id="btn-jump">跳 (K)</div>
                <div class="control-btn action-btn" id="btn-kick">踢 (I)</div>
                <div class="control-btn action-btn" id="btn-attack">拳 (J)</div>
                <div class="control-btn skill-btn" id="btn-dash">冲刺</div>
                <div class="control-btn skill-btn" id="btn-whirlwind">旋风</div>
                <div class="control-btn skill-btn" id="btn-wave">能量波</div>
            </div>

            <div id="gameover-menu" class="menu-overlay hidden">
                <h1 id="result-title" class="menu-title">游戏结束</h1>
                <button id="restart-btn" class="btn">重新开始</button>
            </div>
        `;

    document.getElementById('start-btn').onclick = () => this.startGame();
    document.getElementById('restart-btn').onclick = () => this.startGame();

    const setupMobileBtn = (id, startAction, endAction) => {
      const btn = document.getElementById(id);
      btn.onmousedown = btn.ontouchstart = (e) => { e.preventDefault(); startAction(); };
      if (endAction) {
        btn.onmouseup = btn.ontouchend = (e) => { e.preventDefault(); endAction(); };
      }
    };

    setupMobileBtn('btn-left', () => this.moveLeft = true, () => this.moveLeft = false);
    setupMobileBtn('btn-right', () => this.moveRight = true, () => this.moveRight = false);
    setupMobileBtn('btn-jump', () => this.player.jump());
    setupMobileBtn('btn-kick', () => {
      const hitInfo = this.player.attack('kick');
      if (hitInfo) this.checkCollision(this.player, this.enemy, hitInfo);
    });
    setupMobileBtn('btn-attack', () => {
      const hitInfo = this.player.attack('punch');
      if (hitInfo) this.checkCollision(this.player, this.enemy, hitInfo);
    });
    setupMobileBtn('btn-dash', () => this.tryUseSkill('dashAttack'));
    setupMobileBtn('btn-whirlwind', () => this.tryUseSkill('whirlwindKick'));
    setupMobileBtn('btn-wave', () => this.tryUseSkill('energyWave'));
  }

  setupEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('keydown', (e) => {
      if (this.gameState !== 'playing') return;
      if (e.code === 'KeyA') this.moveLeft = true;
      if (e.code === 'KeyD') this.moveRight = true;
      if (e.code === 'KeyK' || e.code === 'Space') this.player.jump();
      if (e.code === 'KeyL') this.lKeyPressed = true;
      if (e.code === 'KeyJ') {
        if (this.lKeyPressed) {
          this.tryUseSkill('dashAttack');
        } else {
          const hitInfo = this.player.attack('punch');
          if (hitInfo) this.checkCollision(this.player, this.enemy, hitInfo);
        }
      }
      if (e.code === 'KeyI') {
        if (this.lKeyPressed) {
          this.tryUseSkill('whirlwindKick');
        } else {
          const hitInfo = this.player.attack('kick');
          if (hitInfo) this.checkCollision(this.player, this.enemy, hitInfo);
        }
      }
      if (e.code === 'KeyK') {
        if (this.lKeyPressed) {
          e.preventDefault();
          this.tryUseSkill('energyWave');
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyA') this.moveLeft = false;
      if (e.code === 'KeyD') this.moveRight = false;
      if (e.code === 'KeyL') this.lKeyPressed = false;
    });
  }

  tryUseSkill(skillId) {
    if (this.gameState !== 'playing') return;
    if (!this.player.canUseSkill(skillId)) return;

    const hitInfo = this.player.useSkill(skillId);
    if (!hitInfo) return;

    if (hitInfo.isProjectile) {
      this.activeProjectile = {
        attacker: this.player,
        target: this.enemy,
        hitInfo: hitInfo,
        hitConfirmed: false
      };
    } else {
      this.checkCollision(this.player, this.enemy, hitInfo);
    }

    this.createSkillEffect(hitInfo);
    this.screenShake(0.35);
  }

  createSkillEffect(hitInfo) {
    if (hitInfo.type === 'dashAttack') {
      const particleCount = 20;
      const geometry = new THREE.SphereGeometry(0.06, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9 });

      for (let i = 0; i < particleCount; i++) {
        const p = new THREE.Mesh(geometry, material.clone());
        p.position.copy(hitInfo.pos);
        this.scene.add(p);

        const dest = new THREE.Vector3(
          hitInfo.pos.x + (Math.random() - 0.5) * 3,
          hitInfo.pos.y + (Math.random() - 0.5) * 2,
          hitInfo.pos.z + (Math.random() - 0.5) * 2
        );

        gsap.to(p.position, { x: dest.x, y: dest.y, z: dest.z, duration: 0.5, ease: "power2.out" });
        gsap.to(p.material, { opacity: 0, duration: 0.5, onComplete: () => this.scene.remove(p) });
        gsap.to(p.scale, { x: 0, y: 0, z: 0, duration: 0.5 });
      }
    } else if (hitInfo.type === 'whirlwindKick') {
      const ringCount = 3;
      for (let r = 0; r < ringCount; r++) {
        const ringGeo = new THREE.RingGeometry(0.3 + r * 0.3, 0.35 + r * 0.3, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xff6600,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(hitInfo.pos);
        ring.rotation.x = Math.PI / 2;
        this.scene.add(ring);

        gsap.to(ring.scale, { x: 2, y: 2, z: 2, duration: 0.4, ease: "power2.out" });
        gsap.to(ringMat, { opacity: 0, duration: 0.4, onComplete: () => this.scene.remove(ring) });
      }
    } else if (hitInfo.type === 'energyWave') {
      const burstCount = 8;
      const geometry = new THREE.SphereGeometry(0.08, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0xaa00ff, transparent: true, opacity: 0.8 });

      for (let i = 0; i < burstCount; i++) {
        const p = new THREE.Mesh(geometry, material.clone());
        p.position.copy(this.player.group.position).add(new THREE.Vector3(0, 1.2, 0));
        this.scene.add(p);

        const angle = (i / burstCount) * Math.PI * 2;
        const dest = new THREE.Vector3(
          p.position.x + Math.cos(angle) * 1.5,
          p.position.y + Math.sin(angle) * 1.0,
          p.position.z + Math.sin(angle) * 0.5
        );

        gsap.to(p.position, { x: dest.x, y: dest.y, z: dest.z, duration: 0.4, ease: "power2.out" });
        gsap.to(p.material, { opacity: 0, duration: 0.4, onComplete: () => this.scene.remove(p) });
        gsap.to(p.scale, { x: 0, y: 0, z: 0, duration: 0.4 });
      }
    }
  }

  startGame() {
    this.gameState = 'playing';
    this.player.reset();
    this.enemy.reset();
    this.lKeyPressed = false;
    this.activeProjectile = null;
    this.updateHP();
    this.updateEnergyUI();
    this.updateSkillCooldownUI();
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('gameover-menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('skill-bar').classList.remove('hidden');
    document.getElementById('mobile-controls').classList.remove('hidden');
  }

  checkCollision(attacker, target, hitInfo) {
    if (hitInfo.isProjectile) return;

    const dist = attacker.group.position.distanceTo(target.group.position);
    if (dist < hitInfo.range + 0.3) {
      target.takeDamage(hitInfo.damage, attacker.group.position);
      this.updateHP();
      this.updateEnergyUI();
      this.createHitEffect(hitInfo.pos);
      this.screenShake();

      if (target.isDead) {
        this.endGame(attacker === this.player ? 'VICTORY' : 'DEFEAT');
      }
    }
  }

  checkProjectileCollision() {
    if (!this.activeProjectile) return;

    const { attacker, target, hitInfo } = this.activeProjectile;
    if (hitInfo.projectileUpdate && !this.activeProjectile.hitConfirmed) {
      const hit = hitInfo.projectileUpdate(target);
      if (hit && !target.isDead) {
        this.activeProjectile.hitConfirmed = true;
        target.takeDamage(hitInfo.damage, attacker.group.position);
        this.updateHP();
        this.updateEnergyUI();
        this.createHitEffect(target.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
        this.screenShake(0.3);

        if (target.isDead) {
          this.endGame(attacker === this.player ? 'VICTORY' : 'DEFEAT');
        }
      }
    }

    if (!attacker.skillWaveMesh) {
      this.activeProjectile = null;
    }
  }

  createHitEffect(pos) {
    const particleCount = 12;
    const geometry = new THREE.SphereGeometry(0.04, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xfff000 });

    for (let i = 0; i < particleCount; i++) {
      const p = new THREE.Mesh(geometry, material);
      p.position.copy(pos);
      this.scene.add(p);

      const dest = new THREE.Vector3(
        pos.x + (Math.random() - 0.5) * 2,
        pos.y + (Math.random() - 0.5) * 2,
        pos.z + (Math.random() - 0.5) * 2
      );

      gsap.to(p.position, { x: dest.x, y: dest.y, z: dest.z, duration: 0.4, ease: "power2.out" });
      gsap.to(p.scale, { x: 0, y: 0, z: 0, duration: 0.4, onComplete: () => this.scene.remove(p) });
    }
  }

  screenShake(intensity = 0.2) {
    const originalPos = this.camera.position.clone();
    gsap.to(this.camera.position, {
      x: originalPos.x + (Math.random() - 0.5) * intensity,
      y: originalPos.y + (Math.random() - 0.5) * intensity,
      duration: 0.05, repeat: 3, yoyo: true,
      onComplete: () => this.camera.position.copy(originalPos)
    });
  }

  updateHP() {
    document.getElementById('player-hp').style.width = `${this.player.health}%`;
    document.getElementById('enemy-hp').style.width = `${this.enemy.health}%`;
  }

  updateEnergyUI() {
    const energyBar = document.getElementById('player-energy');
    if (energyBar) {
      const pct = (this.player.energy / this.player.maxEnergy) * 100;
      energyBar.style.width = `${pct}%`;

      if (pct >= 50) {
        energyBar.classList.remove('energy-low', 'energy-mid');
        energyBar.classList.add('energy-high');
      } else if (pct >= 25) {
        energyBar.classList.remove('energy-low', 'energy-high');
        energyBar.classList.add('energy-mid');
      } else {
        energyBar.classList.remove('energy-mid', 'energy-high');
        energyBar.classList.add('energy-low');
      }
    }
  }

  updateSkillCooldownUI() {
    const skillIds = ['dashAttack', 'whirlwindKick', 'energyWave'];
    for (const skillId of skillIds) {
      const overlay = document.getElementById(`cd-${skillId}`);
      const skillItem = document.getElementById(`skill-${skillId}`);
      if (!overlay || !skillItem) continue;

      const cooldown = this.player.cooldowns[skillId];
      const maxCooldown = skillConfig[skillId].cooldown;
      const energyCost = skillConfig[skillId].energyCost;
      const hasEnergy = this.player.energy >= energyCost;

      if (cooldown > 0) {
        const pct = (cooldown / maxCooldown) * 100;
        overlay.style.height = `${pct}%`;
        overlay.style.display = 'block';
        skillItem.classList.add('on-cooldown');
      } else {
        overlay.style.display = 'none';
        skillItem.classList.remove('on-cooldown');
      }

      if (!hasEnergy) {
        skillItem.classList.add('no-energy');
      } else {
        skillItem.classList.remove('no-energy');
      }
    }
  }

  endGame(result) {
    this.gameState = 'gameover';
    const title = document.getElementById('result-title');
    title.innerText = result === 'VICTORY' ? '胜利！' : '失败...';
    title.style.color = result === 'VICTORY' ? '#00f2ff' : '#ff007b';
    setTimeout(() => {
      document.getElementById('gameover-menu').classList.remove('hidden');
      document.getElementById('mobile-controls').classList.add('hidden');
      document.getElementById('skill-bar').classList.add('hidden');
    }, 1000);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();

    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (this.gameState === 'playing') {
      const speed = 0.08;
      if (this.moveLeft) this.player.group.position.x -= speed;
      if (this.moveRight) this.player.group.position.x += speed;

      this.player.group.position.x = Math.max(-this.config.arenaSize / 2, Math.min(this.config.arenaSize / 2, this.player.group.position.x));

      const dist = this.enemy.group.position.distanceTo(this.player.group.position);
      if (dist > 0.8) {
        const dir = (this.player.group.position.x - this.enemy.group.position.x) > 0 ? 1 : -1;
        this.enemy.group.position.x += dir * 0.03;
      } else if (!this.enemy.isAttacking && !this.enemy.isUsingSkill) {
        if (Math.random() < 0.05) {
          const hitInfo = this.enemy.attack(Math.random() > 0.5 ? 'punch' : 'kick');
          if (hitInfo) this.checkCollision(this.enemy, this.player, hitInfo);
        }
      }

      this.checkProjectileCollision();
      this.updateEnergyUI();
      this.updateSkillCooldownUI();
    }

    this.player.updateFacing(this.enemy.group.position);
    this.enemy.updateFacing(this.player.group.position);

    this.player.update(dt);
    this.enemy.update(dt);
    this.renderer.render(this.scene, this.camera);
  }
}

new Game();
