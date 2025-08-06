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