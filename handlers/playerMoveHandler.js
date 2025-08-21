// 维护玩家的权威位置
const {send} = require("../utils/send");
const MsgIds = require("../MsgIds");

function handle(ws,payload,players){
    const uid = payload?.uid();
    if (uid == null) return;
    const player = players.get(uid);
    // 如果玩家不存在--->>>return
    if (!player) return;

    // 新的位置坐标
    const newPos = payload.pos();
    // 更新位置
    player.pos.x = newPos.x();
    player.pos.y = newPos.y();
    player.pos.z = newPos.z();

    // 将最新的坐标信息返给玩家
    if (!ws) return;
    const moveData = {
        uid:uid,
        pos:{
            x:player.pos.x,
            y:player.pos.y,
            z:player.pos.z
        }
    }
    send(ws,MsgIds.ResponseId.PlayerMove,{moveData})
}

function handleMoveSyncs(ws,selfPlayer,visiblePlayers)
{
    const playersPos = visiblePlayers.map(p=>({
        uid:p.uid,
        pos:p.pos
    }));

    // 统一推送
    send(ws,MsgIds.ServerPushId.PlayerMove,{playersPos});
}

module.exports = {handle,handleMoveSyncs};
