// ===== 休闲事件库 =====
// 玩法：每次点“休闲”随机触发其中一条，并应用对应的数值变化。
// 以后想增删事件 / 修改数值，只需改这个文件，无需动页面逻辑。
//
// 字段说明：
//   text      —— 事件叙述文本
//   statText  —— 展示给玩家的数值变化（内部用【】标记，渲染时显示为（…）并加细）
//   effects   —— 实际应用到状态的数值：energy/stress/attention/exp 任意组合
var LEISURE_EVENTS = [
  {
    text: '你夜晚出去散步，感受晚风轻抚脸庞，你心里慢慢静了下来',
    statText: '【精力值-3，压力值-20】',
    effects: { energy: -3, stress: -20 }
  },
  {
    text: '你约上好友去打球，在奔跑挥汗的畅快里，积攒的压力消散大半',
    statText: '【精力值-3，压力值-20】',
    effects: { energy: -3, stress: -20 }
  },
  {
    text: '你去郊外绿道骑行，风掠过耳畔吹走烦忧，眼里满是鲜活的绿意',
    statText: '【精力值-3，压力值-20】',
    effects: { energy: -3, stress: -20 }
  },
  {
    text: '你拿出彩纸折纸手工，指尖翻折间心绪渐渐安宁，时间也慢了下来',
    statText: '【精力值-3，压力值-20】',
    effects: { energy: -3, stress: -20 }
  },
  {
    text: '你坐在灯下弹奏古筝，清透琴音缓缓流淌，心里的郁结被一点点抚平',
    statText: '【精力值-3，压力值-20】',
    effects: { energy: -3, stress: -20 }
  },
  {
    text: '你立于山巅吹笛，悠扬笛声融进晚风里，整个人都慢慢放松下来',
    statText: '【精力值-3，压力值-20】',
    effects: { energy: -3, stress: -20 }
  },
  {
    text: '你躺在草坪上晒晒太阳，闭着眼听周围的鸟叫，整个人都懒洋洋地放松了',
    statText: '【精力值-3，压力值-20】',
    effects: { energy: -3, stress: -20 }
  },
  {
    text: '你树下漫步，踩秋天的落叶，咔嚓咔嚓的脆响里，心情也轻快起来',
    statText: '【精力值-3，压力值-20】',
    effects: { energy: -3, stress: -20 }
  }
];
