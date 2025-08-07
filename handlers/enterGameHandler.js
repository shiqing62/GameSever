const MsgIds = require('../MsgIds.js');
const { send } = require('../utils/send.js');

function handle(ws,payload,players){

    // 初始化一个playerData
    const uid = payload.uid();
    // roomId 服务器自动分房间
    // pos 服务器随机一个位置
    console.log("---uid: ",uid);
    const charId = Math.random() < 0.5 ? 101 : 102;
    const posX = Math.floor(Math.random() * 7) - 3;
    console.log("--->>>posX: ",posX);
    // 初始化selfPlayerData
    const selfPlayerData = {
        uid,
        nickName: "hahaha!!",
        characterId: charId,
        roomId: 1,
        level: 1,
        hp: 100,
        score: 0,
        ranking: 0,
        pos: { x: posX, y: 0, z: 0 },
        weapons: [],
        passives: [],
        pets: [],
        ws
    };

    players.set(uid,selfPlayerData);
    console.log("--->>>players.size: ",players.size);

    // 重新封装视野内敌人的数据
    const visiblePlayers = Array.from(players).filter(([key,_]) => key !== uid).map(([_,value]) => value);
    send(ws,MsgIds.ResponseId.EnterGame,{selfPlayerData,visiblePlayers});

    // 通知给相互视野内的其他玩家
    for (const [otherUid,player] of players.entries()){
        if (otherUid === uid) continue;
        if (player.roomId !== selfPlayerData.roomId) continue;

        //TODO 后期增加可视范围

        send(player.ws,MsgIds.ServerPushId.PlayerEnter,{playerData:selfPlayerData});
    }
}

module.exports = {handle};