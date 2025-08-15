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

    // // 玩家坐标重新赋值
    // player.pos = {
    //     x: newPos.x(),
    //     y: newPos.y(),
    //     z: newPos.z()
    // };
    // // 更新map信息
    // players.set(uid,player);
}

function handleMoveSyncs(ws,selfPlayer,players)
{
    const uid = selfPlayer.uid;
    // 同步给其他玩家
    for (const [otherUid,otherPlayer] of players.entries()){
        // if (otherUid === uid) continue;
        // if (otherPlayer.roomId !== selfPlayer.roomId) continue;

        //TODO 后期增加可视范围

        send(otherPlayer.ws,MsgIds.ServerPushId.PlayerMove,{uid:uid,pos:selfPlayer.pos});
    }
}

module.exports = {handle,handleMoveSyncs};
