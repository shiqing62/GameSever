const MsgIds = require('../MsgIds.js');
const { send } = require('../utils/send.js');

// 登录相当于是确定一个id,并不加入players,进入游戏才加入
// uid: 采用时间戳+随机数拼接
function handle(ws){
    const timestamp = Date.now() & 0xFFFFF;
    const randomPart = Math.floor(Math.random() * 0xFFF);
    const uid = ((timestamp << 12) | randomPart) >>> 0;
    console.log('---uid: ',uid);
    send(ws,MsgIds.ResponseId.Login,{uid});
}

module.exports = {handle};