import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Stickman } from './Stickman';
import { characterStats, gameConfig } from './mock';
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
    this.gameState = 'menu'; // menu, playing, gameover

    this.init();
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0xf5f5f5); // Clean light gray

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    this.scene.add(directionalLight);

    // Add back point lights for depth
    const p1 = new THREE.PointLight(0xffffff, 0.5);
    p1.position.set(-5, 5, 5);
    this.scene.add(p1);

    // Floor with AI Generated Texture
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

    // Camera
    this.camera.position.set(this.config.cameraStartPos.x, this.config.cameraStartPos.y, this.config.cameraStartPos.z);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI / 2;

    // Characters
    this.player = new Stickman(this.scene, 0x2288ff, true); // Cool Blue Player
    this.enemy = new Stickman(this.scene, 0xff3300, false); // Hot Red Enemy

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
                    A / D : 移动 | K / Space : 跳跃 | J : 拳 | I : 踢<br/>
                    L : 冲刺攻击 | U : 旋风腿 | O : 能量波
                </div>
            </div>
            
            <div id="hud" class="hud-container hidden">
                <div class="player-hud">
                    <div class="character-name">玩家 (PLAYER)</div>
                    <div class="health-bar-container">
                        <div id="player-hp" class="health-bar player-health"></div>
                    </div>
                    <div class="energy-bar-container">
                        <div class="energy-bar-label">能量</div>
                        <div id="player-energy" class="energy-bar"></div>
                    </div>
                </div>
                <div class="enemy-hud">
                    <div class="character-name" style="text-align: right;">对手 (ENEMY)</div>
                    <div class="health-bar-container">
                        <div id="enemy-hp" class="health-bar enemy-health"></div>
                    </div>
                </div>
            </div>

            <div id="keyboard-hint" class="keyboard-hint hidden">
                <div class="hint-item">
                    <span class="hint-key">L</span>
                    <span class="hint-text">冲刺攻击</span>
                </div>
                <div class="hint-item">
                    <span class="hint-key">U</span>
                    <span class="hint-text">旋风腿</span>
                </div>
                <div class="hint-item">
                    <span class="hint-key">O</span>
                    <span class="hint-text">能量波</span>
                </div>
            </div>

            <div id="skills-container" class="skills-container hidden">
                <div class="skill-slot" id="skill-dash">
                    <div class="skill-key">L</div>
                    <div class="skill-name">冲刺</div>
                    <div class="skill-cost">20</div>
                    <div class="skill-cooldown" id="skill-dash-cooldown"></div>
                </div>
                <div class="skill-slot" id="skill-spin">
                    <div class="skill-key">U</div>
                    <div class="skill-name">旋风</div>
                    <div class="skill-cost">30</div>
                    <div class="skill-cooldown" id="skill-spin-cooldown"></div>
                </div>
                <div class="skill-slot" id="skill-wave">
                    <div class="skill-key">O</div>
                    <div class="skill-name">能量波</div>
                    <div class="skill-cost">50</div>
                    <div class="skill-cooldown" id="skill-wave-cooldown"></div>
                </div>
            </div>

            <div id="mobile-controls" class="hidden">
                <div class="control-btn" id="btn-left">←</div>
                <div class="control-btn" id="btn-right">→</div>
                <div class="control-btn action-btn" id="btn-jump">跳 (K)</div>
                <div class="control-btn action-btn" id="btn-kick">踢 (I)</div>
                <div class="control-btn action-btn" id="btn-attack">拳 (J)</div>
                <div class="control-btn action-btn" id="btn-dash">冲 (L)</div>
                <div class="control-btn action-btn" id="btn-spin">旋 (U)</div>
                <div class="control-btn action-btn" id="btn-wave">波 (O)</div>
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
    setupMobileBtn('btn-dash', () => {
      const hitInfo = this.player.useSkill('dashAttack');
      if (hitInfo) this.checkCollision(this.player, this.enemy, hitInfo);
    });
    setupMobileBtn('btn-spin', () => {
      const hitInfo = this.player.useSkill('spinKick');
      if (hitInfo) this.checkCollision(this.player, this.enemy, hitInfo);
    });
    setupMobileBtn('btn-wave', () => {
      const hitInfo = this.player.useSkill('energyWave');
      if (hitInfo) this.checkCollision(this.player, this.enemy, hitInfo);
    });
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
      if (e.code === 'KeyJ') {
        const hitInfo = this.player.attack('punch');
        if (hitInfo) this.checkCollision(this.player, this.enemy, hitInfo);
      }
      if (e.code === 'KeyI') {
        const hitInfo = this.player.attack('kick');
        if (hitInfo) this.checkCollision(this.player, this.enemy, hitInfo);
      }
      if (e.code === 'KeyL') {
        const hitInfo = this.player.useSkill('dashAttack');
        if (hitInfo) this.checkCollision(this.player, this.enemy, hitInfo);
      }
      if (e.code === 'KeyU') {
        const hitInfo = this.player.useSkill('spinKick');
        if (hitInfo) this.checkCollision(this.player, this.enemy, hitInfo);
      }
      if (e.code === 'KeyO') {
        const hitInfo = this.player.useSkill('energyWave');
        if (hitInfo) this.checkCollision(this.player, this.enemy, hitInfo);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyA') this.moveLeft = false;
      if (e.code === 'KeyD') this.moveRight = false;
    });
  }

  startGame() {
    this.gameState = 'playing';
    this.player.reset();
    this.enemy.reset();
    this.updateHP();
    this.updateEnergy();
    this.updateSkillUI();
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('gameover-menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('mobile-controls').classList.remove('hidden');
    document.getElementById('skills-container').classList.remove('hidden');
    document.getElementById('keyboard-hint').classList.remove('hidden');
  }

  checkCollision(attacker, target, hitInfo) {
    const dist = attacker.group.position.distanceTo(target.group.position);
    if (dist < hitInfo.range + 0.3) {
      target.takeDamage(hitInfo.damage, attacker.group.position);
      this.updateHP();
      this.createHitEffect(hitInfo.pos);
      this.screenShake();

      if (target.isDead) {
        this.endGame(attacker === this.player ? 'VICTORY' : 'DEFEAT');
      }
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

      import('gsap').then(({ default: gsap }) => {
        gsap.to(p.position, { x: dest.x, y: dest.y, z: dest.z, duration: 0.4, ease: "power2.out" });
        gsap.to(p.scale, { x: 0, y: 0, z: 0, duration: 0.4, onComplete: () => this.scene.remove(p) });
      });
    }
  }

  screenShake() {
    const intensity = 0.2;
    const originalPos = this.camera.position.clone();
    import('gsap').then(({ default: gsap }) => {
      gsap.to(this.camera.position, {
        x: originalPos.x + (Math.random() - 0.5) * intensity,
        y: originalPos.y + (Math.random() - 0.5) * intensity,
        duration: 0.05, repeat: 3, yoyo: true,
        onComplete: () => this.camera.position.copy(originalPos)
      });
    });
  }

  updateHP() {
    document.getElementById('player-hp').style.width = `${this.player.health}%`;
    document.getElementById('enemy-hp').style.width = `${this.enemy.health}%`;
  }

  updateEnergy() {
    const energyPercent = (this.player.energy / this.player.maxEnergy) * 100;
    document.getElementById('player-energy').style.width = `${energyPercent}%`;
  }

  updateSkillUI() {
    this.updateSkillSlot('dashAttack', 'skill-dash', 'skill-dash-cooldown');
    this.updateSkillSlot('spinKick', 'skill-spin', 'skill-spin-cooldown');
    this.updateSkillSlot('energyWave', 'skill-wave', 'skill-wave-cooldown');
  }

  updateSkillSlot(skillType, slotId, cooldownId) {
    const slotElement = document.getElementById(slotId);
    const cooldownElement = document.getElementById(cooldownId);

    if (!slotElement || !cooldownElement) return;

    const canUse = this.player.canUseSkill(skillType);
    const cooldownPercent = this.player.getSkillCooldownPercent(skillType) * 100;

    if (canUse) {
      slotElement.classList.remove('disabled');
      slotElement.classList.add('active');
    } else {
      slotElement.classList.add('disabled');
      slotElement.classList.remove('active');
    }

    cooldownElement.style.height = `${cooldownPercent}%`;
  }

  endGame(result) {
    this.gameState = 'gameover';
    const title = document.getElementById('result-title');
    title.innerText = result === 'VICTORY' ? '胜利！' : '失败...';
    title.style.color = result === 'VICTORY' ? '#00f2ff' : '#ff007b';
    setTimeout(() => {
      document.getElementById('gameover-menu').classList.remove('hidden');
      document.getElementById('mobile-controls').classList.add('hidden');
      document.getElementById('skills-container').classList.add('hidden');
      document.getElementById('keyboard-hint').classList.add('hidden');
    }, 1000);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();

    if (this.gameState === 'playing') {
      const speed = 0.08;
      if (this.moveLeft) this.player.group.position.x -= speed;
      if (this.moveRight) this.player.group.position.x += speed;

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

      this.updateEnergy();
      this.updateSkillUI();
    }

    this.player.updateFacing(this.enemy.group.position);
    this.enemy.updateFacing(this.player.group.position);

    this.player.update();
    this.enemy.update();
    this.renderer.render(this.scene, this.camera);
  }
}

new Game();
