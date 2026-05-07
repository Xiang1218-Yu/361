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

export const gameConfig = {
    gravity: -0.01,
    arenaSize: 20,
    cameraStartPos: { x: 0, y: 2, z: 6 }
};
