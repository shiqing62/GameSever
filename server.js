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
const skillSyncsHandler = require('./handlers/skillSyncsHandler.js');
const damageSyncsHandler = require('./handlers/damageSyncsHandler.js');
const levelChangeHandler = require('./handlers/playerLevelChangeHandler.js');

// 引入 FBS 生成的请求结构
const { EnterGameRequest } = require('./schemas/generated/javascript/game/login/enter-game-request.js');
const {PlayerMoveRequest} = require("./schemas/generated/javascript/game/syncs/player-move-request.js");
const {DamageSyncs} = require("./schemas/generated/javascript/game/syncs/damage-syncs.js");
const {SkillSyncs} = require("./schemas/generated/javascript/game/syncs/skill-syncs");
const {PlayerLevelChangeRequest} = require("./schemas/generated/javascript/game/syncs/player-level-change-request");

const players = new Map();
// const wss = new WebSocket.Server({port:8080});
const wss = new WebSocket.Server({ host: "0.0.0.0", port: 8080 });
// 其他玩家信息同步间隔
const SYNCS_INTERVAL = 100;  // 单位:毫秒
const viewRangeWidth = 160;  // 可视范围宽
const viewRangeHeight = 90;  // 可视范围高

wss.on('connection',function connection (ws){
    console.log("--->>>client connection!!!!")
    ws.on('message',function incoming (data){

        const buf =  new flatBuffers.ByteBuffer(new Uint8Array(data));
        const message = Message.getRootAsMessage(buf);

        const msgId = message.msgId();
        const payloadType = message.payloadType();

        console.log(`Received msgId: ${msgId}, payloadType: ${payloadType}`);

        switch (payloadType) {
            case PayloadType.Game_Login_LoginRequest:
                loginHandler.handle(ws);
                break;
            case PayloadType.Game_Login_EnterGameRequest:  // 进入游戏
                const enterGameReq = message.payload(new EnterGameRequest());
                enterGameHandler.handle(ws,enterGameReq,players)
                break;
            case PayloadType.Game_Syncs_PlayerMoveRequest:  // 玩家移动
                const moveReq = message.payload(new PlayerMoveRequest());
                playerMoveHandler.handle(ws,moveReq,players);
                break;
            case PayloadType.Game_Syncs_SkillSyncs:  // 客户端发起同步技能的请求
                const skillData = message.payload(new SkillSyncs());
                skillSyncsHandler.handle(ws,skillData,players);
                break;
            case PayloadType.Game_Syncs_DamageSyncs:  // 同步伤害
                const damageData = message.payload(new DamageSyncs());
                damageSyncsHandler.handle(ws,damageData,players);
                break;
            case Payload.Game_Syncs_PlayerLevelChangeRequest:  // 等级变更请求
                const levelChangeReq = message.payload(new PlayerLevelChangeRequest());
                levelChangeHandler.handle(ws,levelChangeReq,players);
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


//TODO 根据玩家位置变化幅度改为动态频率
setInterval(()=>{
    for (const [uid, player] of players.entries()) {
        if (!player.ws || player.ws.readyState !== WebSocket.OPEN) continue;

        const halfWidth = viewRangeWidth / 2; // 宽的一半
        const halfHeight = viewRangeHeight / 2; // 高的一半

        // 当前玩家坐标
        const { x: px, y: pz } = player.pos;

        // 筛选视野范围内的玩家
        const visiblePlayers = Array.from(player.values()).filter(p => {
            // 排除自己
            if (p.uid === uid) return false;
            // 必须同房间
            if (p.roomId !== player.roomId) return false;
            // 判断是否在可视范围内
            const dx = Math.abs(p.pos.x - px);
            const dz = Math.abs(p.pos.z - pz);
            return dx <= halfWidth && dz <= halfHeight;
        });

        if (visiblePlayers.length > 0) {
            // 发送同步消息
            playerMoveHandler.handleMoveSyncs(player.ws,player,visiblePlayers);
        }
    }
},SYNCS_INTERVAL);

// 投掷类，随机落点类，环绕跟随类，近战类


