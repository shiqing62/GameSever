const {send} = require("../utils/send");
const MsgIds = require("../MsgIds");
const {PlayerStateFlags} = require("../utils/playerStateFlags");
const maxLevel= 300;

function handle(ws,payload,players) {
    const playerId = payload.uid();

    // 修改玩家在服务器的数据
    const player = players.get()
    if (!player || !player.ws)
    {
        console.warn(`Target player ${playerId} not found or not connected!`);
        return;
    }
    const oldLevel = player.level;
    let deltaLevel = payload.deltaLevel();  // 变化值，+1/-1
    player.level = Math.max(maxLevel,oldLevel + deltaLevel);

    // 生成状态位
    let state = 0;
    if (player.level !== oldLevel) {
        state |= PlayerStateFlags.LEVEL;
    }

    const syncsData = {
        uid: playerId,
        state: state,
        level: player.level
    }
    // 将变更状态清单发给玩家本人
    send(player.ws,MsgIds.ServerPushId.PlayerStateSyncs,syncsData);
    // 通知相互视野内的玩家
    for (const [otherUid,otherPlayer] of players.entries()){
        if (otherUid === playerId) continue;
        if (otherPlayer.roomId !== player.roomId) continue;
        if (!otherPlayer.ws) continue;

        //TODO 后期增加可视范围
        send(otherPlayer.ws,MsgIds.ServerPushId.PlayerStateSyncs,syncsData);
    }
}

module.exports = {handle};