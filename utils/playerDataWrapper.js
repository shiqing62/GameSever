const {PlayerData} = require('../schemas/generated/javascript/game/player/player-data');
const {Vec3} = require('../schemas/generated/javascript/game/common/vec3');

class PlayerDataWrapper{
    constructor(fbPlayer,ws,initData = {}) {
        this.fb = fbPlayer;
        this.ws = ws;
        this.data = fbPlayer?{
            uid: fbPlayer.uid(),
            nickName: fbPlayer.nickName() || '',
            characterId: fbPlayer.characterId(),
            roomId: fbPlayer.roomId(),
            level: fbPlayer.level(),
            hp: fbPlayer.hp(),
            pos: {
                x: fbPlayer.pos()?.x() || 0,
                y: fbPlayer.pos()?.y() || 0,
                z: fbPlayer.pos()?.z() || 0,
            },
            score: fbPlayer.score(),
            ranking: fbPlayer.ranking(),
            weapons: Array.from({length: fbPlayer.weaponsLength()},(_,i) => fbPlayer.weapons(i)),
            passives: Array.from({length: fbPlayer.passivesLength()},(_,i) => fbPlayer.passives(i)),
            pets: Array.from({length: fbPlayer.petsLength()},(_,i) => fbPlayer.pets(i))
        }:{
            uid: initData.uid ?? 0,
            nickName: initData.nickName ?? '',
            characterId: initData.characterId ?? 0,
            roomId: initData.roomId ?? 1,
            level: initData.level ?? 1,
            hp: initData.hp ?? 100,
            score: initData.score ?? 0,
            ranking: initData.ranking ?? 0,
            pos: initData.pos ?? { x: 0, y: 0, z: 0 },
            weapons: initData.weapons ?? [],
            passives: initData.passives ?? [],
            pets: initData.pets ?? [],
        };
    }

    get roomId() {return this.data.roomId;}

    get hp() {return this.data.hp;}
    set hp(value) {this.data.hp = value};

    get pos() {return this.data.pos;}
    set pos(value) {this.data.pos = value;}

    buildFB(builder){
        const nickNameOffset = builder.createString(this.data.nickName);
        const posOffset = Vec3.createVec3(builder,this.data.pos.x,this.data.pos.y,this.data.pos.z);

        PlayerData.startPlayerData(builder);
        PlayerData.addUid(builder,this.data.uid);
        PlayerData.addNickName(builder,nickNameOffset);
        PlayerData.addCharacterId(builder,this.data.characterId);
        PlayerData.addRoomId(builder,this.data.roomId);
        PlayerData.addLevel(builder,this.data.level);
        PlayerData.addHp(builder,this.data.hp);
        PlayerData.addScore(builder,this.data.score);
        PlayerData.addRanking(builder,this.data.ranking);
        PlayerData.addPos(builder,posOffset);
        PlayerData.addWeapons(builder,PlayerData.createWeaponsVector(builder,this.data.weapons));
        PlayerData.addPassives(builder,PlayerData.createPassivesVector(builder,this.data.passives));
        PlayerData.addPets(builder,PlayerData.createPetsVector(builder,this.data.pets));

        return PlayerData.endPlayerData(builder);
    }
}

module.exports = {PlayerDataWrapper};