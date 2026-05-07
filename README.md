# 3D 火柴人巅峰对决 (Stickman Combat 3D)

一个基于 WebGL 技术开发的 3D 动作格斗游戏。采用现代极简设计风格，结合流畅的物理动画和强烈的打击感反馈，为玩家提供沉浸式的 1v1 对战体验。

## 🌟 游戏特色

-   **3D 全景视角**：基于 Three.js 开发的 3D 竞技场，支持自由缩放和视角旋转。
-   **硬核格斗系统**：包含出拳、踢腿、跳跃等多种基础动作，支持连招逻辑。
-   **强烈打击反馈**：支持受击闪红、粒子溅射、屏幕震动以及死亡慢动作特效。
-   **动态对峙逻辑**：角色会自动根据对手位置调整朝向，解决传统 2D 格斗旋转不灵活的问题。
-   **全平台适配**：内置高对比度虚拟摇杆与按键，完美适配桌面端键盘和移动端触摸操作。
-   **智能体生成资产**：本项目深度集成智能体图形生成技术。场景地面 (`floor_gen.svg`) 与角色皮肤纹理 (`skin_gen.svg`) 均由 AI 智能体设计生成，并通过 WebGL 纹理映射技术驱动，彻底告别单一的代码逻辑渲染。
-   **极高 UI 可视化**：针对浅色模式优化的 UI 交互界面，操作指令增加毛玻璃背景与文字阴影，确保在任何背景下都能清晰分辨。

## 🛠️ 技术栈

-   **核心框架**：[Vite](https://vitejs.dev/) (极速前端构建工具)
-   **渲染引擎**：[Three.js](https://threejs.org/) (WebGL 3D 引擎)
-   **动画库**：[GSAP](https://greensock.com/gsap/) (高性能专业补间动画库)
-   **样式方案**：Vanilla CSS (原生 CSS 变量、毛玻璃特效及现代布局)

## 🎮 操作指南

### 键盘控制
| 按键 | 动作 |
| :--- | :--- |
| **A / D** | 左右移动 |
| **K / Space** | 跳跃 |
| **J** | 轻击 (拳) |
| **I** | 重击 (踢) |

### 界面控制
-   游戏下方设有**高对比度虚拟控制台**，点击/长按对应图标即可触发移动、攻击与跳跃。

## 🚀 快速启动

### 环境要求
-   Node.js (建议 v18 及以上版本)
-   npm 或 yarn

### 运行步骤
1.  **进入项目目录**：
    ```bash
    cd 361
    ```
2.  **安装依赖**：
    ```bash
    npm install
    ```
3.  **启动开发服务器**：
    ```bash
    npm run dev
    ```
4.  **访问游戏**：
    打开浏览器访问 `http://localhost:5178/` (具体端口见控制台输出)。

## 📁 项目结构

```text
361/
├── src/
│   ├── main.js        # 游戏主逻辑、场景初始化、AI 及 UI 事件处理
│   ├── Stickman.js    # 火柴人模型构造、动作系统、物理反馈及纹理加载逻辑
│   ├── mock.js        # 游戏配置及角色基础数值
│   └── style.css      # 现代格斗游戏 UI 样式 (含毛玻璃特效)
├── public/
│   └── assets/        # 由智能体生成的图形资产目录 (SVG/PNG)
├── index.html         # 游戏入口、SEO 优化及移动端视口配置
└── package.json       # 项目依赖管理
```

## 📝 开发者备注

-   **比例调整**：可以通过修改 `Stickman.js` 中的几何参数自定义火柴人的壮硕程度（当前已优化为健硕比例）。
-   **资产更新**：更换 `public/assets/` 下的同名 SVG 文件，即可无缝更新游戏内角色和场景的视觉风格。
-   **色彩系统**：全局 CSS 变量定义在 `style.css` 中，支持快速切换至深色模式。

---

## 🚀 可扩展功能模块 (Extensible Features)

以下功能模块可在现有架构基础上独立扩展，各模块之间无依赖关系，均基于可实现的交互功能设计：

### 1. 角色技能系统 (Skill System)
**功能描述**：为火柴人角色添加特殊技能机制，玩家通过积累能量条释放强力技能。
- **交互实现**：新增能量条 UI 组件，技能按键触发（如 L 键）
- **技术方案**：在 `Stickman.js` 中添加技能动画状态机，通过 GSAP 实现技能特效动画
- **核心功能**：
  - 能量积累机制（受击/攻击积累能量）
  - 三种技能类型：冲刺攻击、旋风腿、能量波
  - 技能冷却时间管理

### 2. 道具拾取系统 (Item Pickup System)
**功能描述**：在竞技场中随机生成可拾取的道具，为战斗增加策略性。
- **交互实现**：角色触碰道具自动拾取，UI 显示当前持有的道具
- **技术方案**：创建 `Item.js` 类管理道具生成、碰撞检测和效果应用
- **核心功能**：
  - 生命值恢复包（恢复 30 HP）
  - 攻击力增强道具（10 秒内伤害翻倍）
  - 护盾道具（抵挡一次攻击）
  - 道具生成位置随机算法（避免生成在角色身上）

### 3. 连击评分系统 (Combo Scoring System)
**功能描述**：记录玩家连续命中敌人的次数，根据连击数给予评分和奖励。
- **交互实现**：屏幕上方显示连击计数器和评分等级
- **技术方案**：在 `main.js` 中添加连击状态管理，使用 CSS 动画展示连击效果
- **核心功能**：
  - 连击计时器（2 秒内未命中则中断）
  - 评分等级：Good → Great → Excellent → Perfect
  - 连击奖励机制（高连击增加伤害倍率）

### 4. 防御格挡系统 (Defense Block System)
**功能描述**：添加防御机制，玩家可以格挡敌人的攻击减少伤害。
- **交互实现**：新增防御按键（如 S 键），长按进入防御姿态
- **技术方案**：在 `Stickman.js` 中添加防御状态属性，修改伤害计算逻辑
- **核心功能**：
  - 防御姿态动画（双臂交叉）
  - 格挡伤害减免（减少 70% 伤害）
  - 格挡耐久度（连续格挡会破防）
  - 完美格挡机制（时机正确可反击）

### 5. 场景互动系统 (Scene Interaction System)
**功能描述**：让竞技场环境具有可互动元素，增加战斗的趣味性。
- **交互实现**：角色靠近场景元素触发互动效果
- **技术方案**：创建 `SceneObject.js` 类管理场景元素，添加碰撞检测
- **核心功能**：
  - 可破坏的障碍物（木箱、石柱）
  - 弹簧板（踩踏后高跳）
  - 场景边界限制（防止角色掉出竞技场）
  - 环境陷阱（地面尖刺区域）

### 6. 本地双人对战模式 (Local PvP Mode)
**功能描述**：支持两名玩家在同一设备上进行对战。
- **交互实现**：为第二名玩家分配独立的按键控制（方向键 + 数字键）
- **技术方案**：扩展输入处理系统，区分玩家 1 和玩家 2 的输入事件
- **核心功能**：
  - 双角色独立控制（WASD vs 方向键）
  - 分屏或同屏对战视角
  - 回合制比赛系统（三局两胜）
  - 对战结果统计面板

---

## 🔄 可迭代功能模块 (Iterative Features)

以下功能模块基于现有功能进行迭代优化，与可扩展功能无重复：

### 1. AI 行为树升级 (AI Behavior Tree Upgrade)
**迭代基础**：当前 AI 仅支持简单的距离判断和随机攻击
**优化方向**：
- 添加 AI 状态机（Idle → Chase → Attack → Retreat → Defend）
- 实现攻击预判机制（根据玩家动作预测并闪避）
- 添加难度等级（简单/普通/困难/地狱）
- AI 连招逻辑（非单一攻击，可组合拳+踢）
- 血量低时的逃跑/回血策略

### 2. 动画系统精细化 (Animation System Refinement)
**迭代基础**：当前动画使用简单的 GSAP 补间动画
**优化方向**：
- 添加过渡动画（攻击结束后的收招硬直）
- 实现骨骼动画系统（更自然的肢体运动）
- 添加受击动画（不同攻击类型对应不同受击反应）
- 移动时的步行动画（腿部交替摆动）
- 跳跃的预备和落地缓冲动画

### 3. 音效反馈增强 (Audio Feedback Enhancement)
**迭代基础**：当前游戏无音效系统
**优化方向**：
- 添加攻击音效（拳风声、踢击声、受击声）
- 实现背景音乐系统（战斗音乐、菜单音乐）
- 添加 UI 交互音效（按钮点击、游戏开始/结束）
- 3D 空间音效（根据距离调整音量）
- 连击时的音效升级（音调随连击数升高）

### 4. 视觉特效升级 (Visual Effects Upgrade)
**迭代基础**：当前仅有简单的粒子特效和屏幕震动
**优化方向**：
- 攻击轨迹拖尾效果
- 受击时的血液/火花粒子效果
- 角色轮廓光效（低血量时红色闪烁警告）
- 场景光影动态变化（时间系统：白天→黄昏→夜晚）
- 慢动作特效优化（击杀时的子弹时间）

### 5. 角色自定义系统 (Character Customization System)
**迭代基础**：当前角色颜色固定，无自定义选项
**优化方向**：
- 颜色选择器（玩家可自定义角色主色调）
- 配饰系统（帽子、武器皮肤、特效颜色）
- 角色属性分配（速度型/力量型/平衡型）
- 解锁系统（通过胜利场次解锁新外观）
- 本地存储保存自定义配置

### 6. 战斗数据统计 (Combat Statistics System)
**迭代基础**：当前仅显示血量，无详细数据
**优化方向**：
- 实时伤害数字显示（飘字效果）
- 战斗结束统计面板（总伤害、最高连击、命中率）
- 历史战绩记录（本地存储胜负记录）
- 成就系统（首次胜利、完美胜利、10 连击等）
- 数据可视化图表（伤害曲线、血量变化）

---

## 💡 代码理解与工程化建议

### 一、代码理解建议

#### 1. 模块依赖关系分析
**现状分析**：
当前项目采用简单的 ES Module 结构，`main.js` 作为入口文件直接依赖 `Stickman.js`、`mock.js` 和 `style.css`。这种结构在功能简单时工作良好，但随着功能增加，模块间的耦合会逐渐加深。

**理解要点**：
- `Stickman.js` 是核心模型类，负责角色渲染、动画和状态管理
- `main.js` 承担过多职责：游戏循环、AI 逻辑、UI 管理、碰撞检测
- `mock.js` 仅提供静态配置数据，未实现配置热更新机制

**建议**：
绘制模块依赖图，明确各模块的职责边界。建议将 `main.js` 中的功能拆分为：
- `GameEngine.js` - 游戏主循环和状态管理
- `InputManager.js` - 输入事件统一管理
- `UIManager.js` - UI 渲染和交互处理
- `CollisionManager.js` - 碰撞检测系统

#### 2. 动画系统工作原理
**现状分析**：
项目使用 GSAP 库处理所有动画效果，包括攻击动作、受击反馈、死亡动画等。

**理解要点**：
- GSAP 时间轴 (`timeline`) 用于管理攻击动画的序列
- `onComplete` 回调用于重置攻击状态 (`isAttacking = false`)
- `gsap.killTweensOf()` 用于重置时清理进行中的动画

**潜在问题**：
- 动画状态与游戏逻辑状态可能存在不同步风险
- 多个动画同时作用于同一对象时可能产生冲突

**建议**：
建立动画状态机，明确定义：Idle、Attack、Hit、Dead 等状态，每个状态只允许特定的动画操作。

### 二、代码重构建议

#### 1. 引入组件化架构
**重构目标**：将单体类拆分为可复用的组件系统

**具体方案**：
```javascript
// 建议的组件结构
src/
├── components/
│   ├── HealthComponent.js    # 生命值管理
│   ├── MovementComponent.js  # 移动逻辑
│   ├── CombatComponent.js    # 战斗系统
│   └── AnimationComponent.js # 动画管理
├── entities/
│   └── Stickman.js           # 组合组件的角色实体
├── systems/
│   ├── InputSystem.js        # 输入处理
│   ├── CollisionSystem.js    # 碰撞检测
│   └── RenderSystem.js       # 渲染管理
└── main.js
```

**重构收益**：
- 各组件可独立测试
- 便于添加新功能（如给敌人添加 AI 组件）
- 代码复用性提高（HealthComponent 可用于道具系统）

#### 2. 事件驱动架构改造
**重构目标**：解耦模块间的直接调用，使用事件总线通信

**具体方案**：
```javascript
// 创建事件总线
class EventBus {
    constructor() {
        this.events = {};
    }
    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(cb => cb(data));
        }
    }
}

// 使用示例
// 攻击命中时触发事件，而非直接调用伤害计算
eventBus.emit('attack:hit', { attacker, target, damage });
```

**重构收益**：
- 模块间解耦，便于单元测试
- 支持多个监听者响应同一事件（如伤害计算 + 音效播放 + 特效触发）
- 便于实现回放系统（记录事件序列）

### 三、代码测试建议

#### 1. 单元测试策略
**测试框架选择**：Vitest（与 Vite 生态集成良好）

**测试覆盖重点**：
```javascript
// Stickman.test.js 示例
import { describe, it, expect } from 'vitest';
import { Stickman } from '../src/Stickman';

describe('Stickman', () => {
    it('should take damage correctly', () => {
        const stickman = new Stickman(mockScene, 0xffffff, true);
        stickman.takeDamage(20, { x: 0, y: 0, z: 0 });
        expect(stickman.health).toBe(80);
    });

    it('should die when health reaches zero', () => {
        const stickman = new Stickman(mockScene, 0xffffff, true);
        stickman.takeDamage(100, { x: 0, y: 0, z: 0 });
        expect(stickman.isDead).toBe(true);
        expect(stickman.health).toBe(0);
    });

    it('should not attack when dead', () => {
        const stickman = new Stickman(mockScene, 0xffffff, true);
        stickman.die();
        const result = stickman.attack('punch');
        expect(result).toBeUndefined();
    });
});
```

**Mock 策略**：
- 使用 `vi.fn()` Mock GSAP 动画方法
- 创建 Mock Three.js 场景对象
- 使用 `jsdom` 环境测试 DOM 相关逻辑

#### 2. 集成测试方案
**测试场景设计**：
- 完整对战流程测试（开始游戏 → 攻击 → 扣血 → 结束）
- 输入响应测试（模拟键盘事件验证角色行为）
- 碰撞检测测试（不同距离下的攻击命中判定）

**自动化测试脚本**：
```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### 四、代码工程化建议

#### 1. 代码规范与质量工具
**推荐配置**：
```javascript
// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            'no-unused-vars': 'warn',
            'prefer-const': 'error',
            'eqeqeq': 'error',
        },
    },
];
```

**Git Hooks 配置**：
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.js": ["eslint --fix", "prettier --write"]
  }
}
```

#### 2. 构建优化策略
**代码分割配置**：
```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'three-core': ['three'],
                    'three-addons': ['three/examples/jsm/controls/OrbitControls'],
                    'animation': ['gsap'],
                },
            },
        },
        chunkSizeWarningLimit: 500,
    },
});
```

**性能优化建议**：
- 使用 `THREE.InstancedMesh` 批量渲染相似几何体（如粒子效果）
- 实现对象池模式复用粒子对象，避免频繁创建/销毁
- 添加 LOD (Level of Detail) 系统，远距离角色使用简化模型
- 使用 Web Worker 处理物理计算，避免阻塞主线程

#### 3. 持续集成/部署 (CI/CD)
**GitHub Actions 工作流**：
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

**部署策略**：
- 使用 GitHub Pages 或 Vercel 自动部署
- 配置分支保护规则（必须通过测试才能合并）
- 实现版本号自动管理（使用 `standard-version`）

---

*本文档最后更新于：2026-05-07*
