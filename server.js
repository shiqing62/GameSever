const WebSocket = require('ws');
const flatBuffers = require('flatbuffers');
// 导入生成的模块
const { Message } = require('./schemas/generated/javascript/game/message.js');
const { Payload } = require('./schemas/generated/javascript/game/payload.js');
const PayloadType = Payload;
// 引入 handler
const handleLogin = require('./handlers/loginHandler.js');
const handleEnterGame = require('./handlers/enterGameHandler.js');
// 引入 FBS 生成的请求结构
const { EnterGameRequest } = require('./schemas/generated/javascript/game/login/enter-game-request.js');

const players = new Map();
const wss = new WebSocket.Server({port:8080});

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
                // const loginReq = message.payload(new LoginRequest());
                handleLogin.handle(ws);
                break;
            }
            case PayloadType.Game_Login_EnterGameRequest:  // 进入游戏
                const enterGameReq = message.payload(new EnterGameRequest());
                handleEnterGame.handle(ws,enterGameReq,players)
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


