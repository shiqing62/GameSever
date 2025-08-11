const WebSocket = require('ws');
const flatBuffers = require('flatbuffers');
// 导入生成的模块
const { Message } = require('./schemas/generated/javascript/game/message.js');
const { Payload } = require('./schemas/generated/javascript/game/payload.js');
const PayloadType = Payload;
// 引入 handler
const loginHandler = require('./handlers/loginHandler.js');
const enterGameHandler = require('./handlers/enterGameHandler.js');
const playerMoveHandler = require('./handlers/playerMoveHandler');
// 引入 FBS 生成的请求结构
const { EnterGameRequest } = require('./schemas/generated/javascript/game/login/enter-game-request.js');
const {PlayerMoveRequest} = require("./schemas/generated/javascript/game/syncs/player-move-request");

const players = new Map();
const wss = new WebSocket.Server({port:8080});

// 其他玩家信息同步间隔
const SYNCS_INTERVAL = 100;  // 单位:毫秒



wss.on('connection',function connection (ws){
    console.log("--->>>client connection!!!!")
    ws.on('message',function incoming (data){

        const buf =  new flatBuffers.ByteBuffer(new Uint8Array(data));
        const message = Message.getRootAsMessage(buf);

        const msgId = message.msgId();
        const payloadType = message.payloadType();

        console.log(`Received msgId: ${msgId}, payloadType: ${payloadType}`);

        switch (payloadType) {
            case PayloadType.Game_Login_LoginRequest: {
                loginHandler.handle(ws);
                break;
            }
            case PayloadType.Game_Login_EnterGameRequest:  // 进入游戏
                const enterGameReq = message.payload(new EnterGameRequest());
                enterGameHandler.handle(ws,enterGameReq,players)
                break;
            case PayloadType.Game_Syncs_PlayerMoveRequest:  // 玩家移动
                const moveReq = message.payload(new PlayerMoveRequest());
                playerMoveHandler.handle(ws,moveReq,players);
                break;
            default:
                console.log('Unknown payload type:', payloadType);
        }
    });

    //TODO 玩家退出
    ws.on('close',()=>{
        // 清理断开的玩家
        for (const [uid,player] of players.entries()){
            if (player.ws === ws)
            {
                players.delete(uid);
                break;
            }
        }
    });
});

setInterval(()=>{
    for (const [uid, player] of players.entries()) {
        if (!player.ws || player.ws.readyState !== WebSocket.OPEN) continue;

        // 筛选视野范围内的玩家（这里简单按同房间）
        const visiblePlayers = Array.from(players.values()).filter(p => p.uid !== uid && p.roomId === player.roomId);

        if (visiblePlayers.length > 0) {
            // 发送同步消息
            playerMoveHandler.handleMoveSyncs(player.ws,player,visiblePlayers);
        }
    }
},SYNCS_INTERVAL);


