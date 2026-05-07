export const characterStats = [
    {
        id: 'player',
        name: '玩家',
        color: 0x00f2ff,
        speed: 0.1,
        damage: 10,
        hp: 100
    },
    {
        id: 'enemy',
        name: '对手',
        color: 0xff007b,
        speed: 0.02,
        damage: 5,
        hp: 100
    }
];

export const skillConfig = {
    dashAttack: {
        id: 'dashAttack',
        name: '冲刺攻击',
        key: 'L + J',
        energyCost: 25,
        cooldown: 3000,
        damage: 30,
        range: 2.0,
        dashDistance: 1.5
    },
    whirlwindKick: {
        id: 'whirlwindKick',
        name: '旋风腿',
        key: 'L + I',
        energyCost: 35,
        cooldown: 5000,
        damage: 40,
        range: 1.5,
        spinDuration: 0.6
    },
    energyWave: {
        id: 'energyWave',
        name: '能量波',
        key: 'L + K',
        energyCost: 50,
        cooldown: 8000,
        damage: 55,
        range: 4.0,
        waveSpeed: 0.15,
        waveDuration: 1200
    }
};

export const energyConfig = {
    maxEnergy: 100,
    attackGain: 8,
    hitGain: 12,
    startEnergy: 0
};

export const gameConfig = {
    gravity: -0.01,
    arenaSize: 20,
    cameraStartPos: { x: 0, y: 2, z: 6 }
};
