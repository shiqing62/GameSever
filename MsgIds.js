const MsgIds = {
    RequestId:{
        Login: 1001,
        EnterGame: 1002,
        PlayerMove: 2003,
    },

    ResponseId:{
        Login: 1001,
        EnterGame: 1002
    },

    ServerPushId:{
        PlayerEnter: 2001,  // 玩家进入时通知给相互视野内的其他玩家
        PlayerExit: 2002,   // 离开
        PlayerMove: 2003,   // 玩家移动
        PlayerAttack:2004,
    }
};

module.exports = MsgIds;