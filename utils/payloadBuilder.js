const MsgIds = require('../MsgIds.js');
const PlayerDataModule = require('../schemas/generated/javascript/game/player/player-data.js');
const PlayerData = PlayerDataModule.PlayerData;
const EnterGameResponseModule = require('../schemas/generated/javascript/game/login/enter-game-response.js');
const EnterGameResponse = EnterGameResponseModule.EnterGameResponse;
const LoginResponseModule = require('../schemas/generated/javascript/game/login/login-response.js');
const LoginResponse = LoginResponseModule.LoginResponse;
const PayloadModule = require('../schemas/generated/javascript/game/payload.js');
const PayloadType = PayloadModule.Payload;
const {Vec3} = require('../schemas/generated/javascript/game/common/vec3.js');
const {PlayerEnterPush} = require("../schemas/generated/javascript/game/syncs/player-enter-push.js");
const {PlayerMovePush} = require("../schemas/generated/javascript/game/syncs/player-move-push.js");
const {DamageSyncs} = require("../schemas/generated/javascript/game/syncs/damage-syncs.js");
const {SkillType} = require("../schemas/generated/javascript/game/syncs/skill-type.js");
const {RandomPointData} = require("../schemas/generated/javascript/game/syncs/random-point-data.js");
const {ProjectileData} = require("../schemas/generated/javascript/game/syncs/projectile-data");
const {PlayerStateSyncs} = require("../schemas/generated/javascript/game/syncs/player-state-syncs");
const {PlayerStateFlags} = require("./playerStateFlags");

const payloadBuilder = {
    // 登录响应
    [MsgIds.ResponseId.Login]:{
        payloadType: PayloadType.Game_Login_LoginResponse,
        build: (builder,payload) => {
            LoginResponse.startLoginResponse(builder);
            LoginResponse.addUid(builder,payload.uid);
            return LoginResponse.endLoginResponse(builder);
        }
    },

    // 进入游戏响应
    [MsgIds.ResponseId.EnterGame]:{
        payloadType: PayloadType.Game_Login_EnterGameResponse,
        build:(builder,payload) =>{
            const {selfPlayerData,visiblePlayers} = payload;

            // 构建self数据
            const selfPlayerDataOffset = buildPlayerData(builder,selfPlayerData);
            // 构建visiblePlayers
            const visibleOffset = visiblePlayers.map(player => buildPlayerData(builder,player));
            const visibleVec = EnterGameResponse.createVisiblePlayersVector(builder,visibleOffset);

            // 构建enterGameResp
            EnterGameResponse.startEnterGameResponse(builder);
            EnterGameResponse.addSelfPlayer(builder,selfPlayerDataOffset);
            EnterGameResponse.addVisiblePlayers(builder,visibleVec);
            return EnterGameResponse.endEnterGameResponse(builder);
        }
    },

    // 其他玩家进入时通知给相互视野内的玩家
    [MsgIds.ServerPushId.PlayerEnter]:{
        payloadType: PayloadType.Game_Syncs_PlayerEnterPush,
        build:(builder,payload) => {
            const {playerData} = payload;
            const playerDataOffset = buildPlayerData(builder,playerData);
            PlayerEnterPush.startPlayerEnterPush(builder);
            PlayerEnterPush.addPlayerData(builder,playerDataOffset);
            return PlayerEnterPush.endPlayerEnterPush(builder);
        }
    },

    // 玩家移动
    [MsgIds.ServerPushId.PlayerMove]:{
        payloadType: PayloadType.Game_Syncs_PlayerMovePush,
        build:(builder,payload) => {
            const {uid,pos} = payload;
            const posOffset = Vec3.createVec3(builder,pos.x,pos.y,pos.z);

            PlayerMovePush.startPlayerMovePush(builder);
            PlayerMovePush.addUid(builder,uid);
            PlayerMovePush.addPos(builder,posOffset);
            return PlayerMovePush.endPlayerMovePush(builder);
        }
    },

    // 技能同步
    [MsgIds.ServerPushId.SkillSyncs]:{
        payloadType: PayloadType.Game_Syncs_SkillSyncs,
        build:(builder,payload) => {
            const {skillData} = payload;
            const skillType = skillData.skillType();
            switch (skillType){
                case SkillType.Projectile:
                    const direction = skillData.direction();
                    const directionOffset = Vec3.createVec3(builder,direction.x,direction.y,direction.z);

                    ProjectileData.startProjectileData(builder);
                    ProjectileData.addDirection(builder,directionOffset);
                    ProjectileData.addSpeed(builder,skillData.speed());
                    ProjectileData.addLifeTime(builder,skillData.lifeTime());

                    return ProjectileData.endProjectileData(builder);
                case SkillType.RandomPoint:
                    const pos = skillData.skillData().pos();
                    const posOffset = Vec3.createVec3(builder,pos.x,pos.y,pos.z);

                    RandomPointData.startRandomPointData(builder);
                    RandomPointData.addPos(builder,posOffset);

                    return RandomPointData.endRandomPointData(builder);
            }
        }
    },

    // 状态同步: 包含玩家的血量，等级......
    [MsgIds.ServerPushId.PlayerStateSyncs]:{
        payloadType: PayloadType.Game_Syncs_PlayerStateSyncs,
        build:(builder,payload) => {
            const {uid,state,hp,level} = payload;

            PlayerStateSyncs.startPlayerStateSyncs(builder);
            PlayerStateSyncs.addUid(builder,uid);
            PlayerStateSyncs.addState(builder,state);

            // 只有对应位标记才序列化
            if (state & PlayerStateFlags.HP){
                PlayerStateSyncs.addHp(builder,hp);
            }
            if (state & PlayerStateFlags.LEVEL){
                PlayerStateSyncs.addLevel(builder,level);
            }

            return PlayerStateSyncs.endPlayerStateSyncs(builder);
        }
    },

    // 伤害同步
    [MsgIds.ServerPushId.DamageSyncs]:{
        payloadType: PayloadType.Game_Syncs_DamageSyncs,
        build:(builder,payload) =>{
            const {damageSyncsData} = payload;
            const pos = damageSyncsData.pos();
            const posOffset = Vec3.createVec3(builder,pos.x,pos.y,pos.z);

            let damage = damageSyncsData.damage();
            if (damage > 1000)
            {
                console.log(`作弊检测，攻击者${damageSyncsData.attackerId()} 对目标 ${damageSyncsData.targetId()} 伤害异常 ${damageSyncsData.damage()}，置为0`)
                damage = 0;
            }

            DamageSyncs.startDamageSyncs(builder);
            DamageSyncs.addAttackerId(builder,damageSyncsData.attackerId());
            DamageSyncs.addTargetId(builder,damageSyncsData.targetId());
            DamageSyncs.addSkillId(builder,damageSyncsData.skillId());
            DamageSyncs.addDamage(builder,damage);
            DamageSyncs.addPos(builder,posOffset);
            return DamageSyncs.endDamageSyncs(builder);
        }
    }
};

// 接口: 构建玩家数据
function buildPlayerData(builder,player)
{
    const nickOffset = builder.createString(player.nickName);
    const posOffset = Vec3.createVec3(builder,player.pos.x,player.pos.y,player.pos.z);

    PlayerData.startPlayerData(builder);
    PlayerData.addUid(builder, player.uid);
    PlayerData.addNickName(builder, nickOffset);
    PlayerData.addCharacterId(builder, player.characterId);
    PlayerData.addRoomId(builder, player.roomId);
    PlayerData.addScore(builder, player.score);
    PlayerData.addRanking(builder, player.ranking);
    PlayerData.addPos(builder, posOffset);
    PlayerData.addLevel(builder, player.level);
    PlayerData.addHp(builder, player.hp);
    PlayerData.addWeapons(builder, player.weapons);
    PlayerData.addPassives(builder, player.passives);
    PlayerData.addPets(builder, player.pets);

    return PlayerData.endPlayerData(builder);
}

module.exports = {payloadBuilder};