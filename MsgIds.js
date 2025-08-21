const MsgIds = {
    RequestId:{
        Login: 1001,
        EnterGame: 1002,
        PlayerMove: 2003,
        LevelChange: 4001,
    },

    ResponseId:{
        Login: 1001,
        EnterGame: 1002,
        PlayerMove: 2003,
    },

    ServerPushId:{
        PlayerEnter: 2001,  // 玩家进入时通知给相互视野内的其他玩家
        PlayerExit: 2002,   // 离开
        PlayerMove: 2003,   // 玩家移动
        PlayerAttack: 2004,
        SkillSyncs: 3001,   // 技能同步
        DamageSyncs: 3002,  // 伤害同步
        PlayerStateSyncs: 3003,  // 玩家状态同步,包括Hp,Level......
    }
};

module.exports = MsgIds;