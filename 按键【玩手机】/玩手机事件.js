// ===== 玩手机事件库 =====
// 玩法：每次点“玩手机”随机触发其中一条，并应用对应的数值变化。
// 以后想增删事件 / 修改数值，只需改这个文件，无需动页面逻辑。
//
// 字段说明：
//   text      —— 事件叙述文本
//   statText  —— 展示给玩家的数值变化（用【】框起来，会原样追加到叙事日志）
//   effects   —— 实际应用到状态的数值：energy/stress/attention/exp 任意组合
//
//   branches  —— 分支事件（按当前注意力匹配第一个满足范围的分支）
//     baseText：分支公共开头
//     min/max ：注意力匹配范围（不写表示不限方向）
var PHONE_EVENTS = [
  {
    text: '你打开手机刷视频，一不小心忘了时间，今天怎么莫名其妙就结束啦啊啊啊！！！',
    statText: '【精力值-4，压力值-25，注意力-1】',
    effects: { energy: -4, stress: -25, attention: -1 },
    endDay: true   // 特殊事件：刷视频忘了时间，强制结束当天 → 跳转到第二天
  },
  {
    text: '你打开手机玩游戏，你遇上了没素质的队友，一直压力你，你心情很不好...呜呜...',
    statText: '【精力值-4，压力值+10】',
    effects: { energy: -4, stress: 10 }
  },
  {
    text: '你打开手机，意外的发现了你爸妈给你小时候拍的照片，你回忆起了温馨的童年...',
    statText: '【精力值-4，压力值-60】',
    effects: { energy: -4, stress: -60 }
  },
  {
    text: '你又又又拿到了手机，你打开手机，用ai猛猛查题目答案，作业完成了，但是你感觉脑子好像空空的',
    statText: '【精力值-4，经验值-60，压力值-10】',
    effects: { energy: -4, exp: -60, stress: -10 }
  },
  {
    text: '你突然灵机一动，这道题也许有更好的解法，你借助ai梳理思路，探索未知，你感觉脑子痒痒的',
    statText: '【精力值-4，经验值+20，压力值-20】',
    effects: { energy: -4, exp: 40, stress: -20 }
  },
  // 注意力大比拼：根据当前注意力进入不同分支
  {
    baseText: '你打开班级群，发现有人发起了注意力大比拼，你当前的注意力是',
    branches: [
      { min: 9,   text: '你拿到了第一名，你简直是专注之王', statText: '【精力值-4，压力值-40】', effects: { energy: -4, stress: -40 } },
      { min: 4, max: 8, text: '你取得了普通的排名', statText: '【精力值-4】', effects: { energy: -4 } },
      { min: 0, max: 3, text: '你比拼了很多人，但你似乎比不过他们', statText: '【精力值-4，压力值+20】', effects: { energy: -4, stress: 20 } },
      { max: -1, text: '什么？注意力还能是个负数？', statText: '【精力值-4，压力值-10】', effects: { energy: -4, stress: -10 } }
    ]
  },
  {
    text: '老师布置了好多作业，你偷懒把作业全部扔给AI，结果AI好几道题出错了，而且不像是人能犯的低级错误，你被老师批评了，呜呜呜',
    statText: '【精力值-4，压力值+15】',
    effects: { energy: -4, stress: 15 }
  },
  {
    text: '你用 AI 听写英语单词，遇到发音存疑的地方会主动翻课本核对，这次单元听写你拿了满分',
    statText: '【精力值-4，经验值+20，压力值-25】',
    effects: { energy: -4, exp: 40, stress: -25 }
  },
  {
    text: '你试着用 AI 生成手抄报的排版参考，再自己手绘图案、写上真实想法，成品被老师贴在教室展示',
    statText: '【精力值-4，经验值+25，压力值-30】',
    effects: { energy: -4, exp: 50, stress: -30 }
  },
  {
    text: '你刷短视频时刷到一条 “喝墨水能变聪明” 的离谱科普，想起老师说过要主动查证信息，你搜了权威科普辟谣，还提醒了班里同学',
    statText: '【精力值-4，经验值+15，压力值-15】',
    effects: { energy: -4, exp: 30, stress: -15 }
  },
  {
    text: '你下载了来路不明的小游戏 APP，结果手机变得特别卡，还弹出好多广告，最后只能让家长帮忙清理',
    statText: '【精力值-4，压力值+10，注意力-1】',
    effects: { energy: -4, stress: 10, attention: -1 }
  },
  {
    text: '你在网上评论区看到有人吵架说脏话，你没有跟着起哄，默默退出了页面，不想被坏情绪影响',
    statText: '【精力值-4，压力值-15，注意力+1】',
    effects: { energy: -4, stress: -15, attention: 1 }
  }
];
