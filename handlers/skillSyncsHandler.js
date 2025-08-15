const {send} = require("../utils/send");
const MsgIds = require("../MsgIds");

function handle(ws,payload,players)
{
    const targetId = payload.targetId();
    const targetPlayer = players.get(targetId);

    if(!targetPlayer || !targetPlayer.ws){
        console.warn(`Target player ${targetId} not found or not connected!`);
        return;
    }

    send(targetPlayer.ws,MsgIds.ServerPushId.SkillSyncs,{skillData:payload});

}

module.exports = {handle};