// ===== 随机事件 =====
// 每天点击 学习/玩手机/休闲 完成对应内容返回主界面后，有 40% 概率触发一条随机事件。
// 事件与选项都显示在滚动叙事日志面板中，玩家点选选项后结算数值、追加日志。
// 规则：
//   · 10 天内已出现过的非挑战事件不再重复出现（累计到 10 天游戏始终不重置）。
//   · 唯一例外：《同班的小王向你发起了学习挑战》可多次出现。
//   · 挑战事件在 10 天内必定至少出现一次（最晚于第 10 天强制触发）。
// 主界面调用：
//   RandomEvent.init(panel, inner)   传入日志面板 DOM 元素
//   RandomEvent.maybeTrigger()       在 学习/玩手机/休闲 结算后调用（内部 40% 判定）
//   RandomEvent.renderPending()      页面加载时调用，恢复未选择的待处理事件
(function (global) {
  var STATE_KEY = 'study_game_state';
  var TRIGGER_CHANCE = 0.3;    // 30% 概率触发
  var CHALLENGE_CHANCE = 0.3;  // 平时挑战事件被额外选中的概率（可多次出现）
  var LAST_DAY = 10;           // 最晚一天：第 10 天时保证挑战事件至少出现一次

  // 学习境界分档（与主界面 index.html 一致）
  var REALMS = [
    { name: '学渣境', min: 0 },
    { name: '学子境', min: 50 },
    { name: '学友境', min: 150 },
    { name: '学者境', min: 300 },
    { name: '学霸境', min: 500 },
    { name: '学神境', min: 800 }
  ];

  // ===== 状态读写（与主界面共用同一个 STATE_KEY）=====
  function loadState() {
    var s = null;
    try {
      var raw = localStorage.getItem(STATE_KEY);
      if (raw) s = JSON.parse(raw);
    } catch (e) { /* ignore */ }
    if (!s || typeof s !== 'object') s = {};
    // 补齐默认字段（兼容旧存档）
    if (!Array.isArray(s.seenRandomEvents)) s.seenRandomEvents = [];
    if (!s.randomChallengeShown) s.randomChallengeShown = false;
    if (!s.pendingRandomEvent) s.pendingRandomEvent = null;
    return s;
  }
  function saveState(s) {
    localStorage.setItem(STATE_KEY, JSON.stringify(s));
  }

  function realmName(exp) {
    var name = REALMS[0].name;
    for (var i = 0; i < REALMS.length; i++) {
      if (exp >= REALMS[i].min) name = REALMS[i].name;
    }
    return name;
  }

  // 由 effects 生成统计文案，与现有日志【…】风格一致
  function statText(effects) {
    if (!effects) return '';
    var parts = [];
    if (effects.energy) parts.push('精力值' + (effects.energy > 0 ? '+' : '') + effects.energy);
    if (effects.stress) parts.push('压力值' + (effects.stress > 0 ? '+' : '') + effects.stress);
    if (effects.attention) parts.push('注意力' + (effects.attention > 0 ? '+' : '') + effects.attention);
    if (effects.exp) parts.push('经验值' + (effects.exp > 0 ? '+' : '') + effects.exp);
    return parts.length ? '【' + parts.join('，') + '】' : '';
  }

  // ===== 非挑战随机事件（10 天内每个只出现一次）=====
  var EVENTS = [
    { id: 'group_link',
      scenario: '你被拉进了一个陌生的群聊，群主非常热情的分享学习资料，并分享了一个链接，说点击后能获取更多资源',
      options: [
        { label: '点击', result: '你点了链接，结果弹出满屏广告，还偷偷下载了垃圾软件，手机半天反应不过来', effects: { stress: 15, attention: -1 } },
        { label: '不点击', result: '你觉得陌生链接不安全，直接退出了群聊，还把这件事告诉了家长', effects: { exp: 30, stress: -5 } }
      ] },
    { id: 'account_risk',
      scenario: '你收到一条消息：你的账号存在风险，点击下方链接输入密码即可验证解冻',
      options: [
        { label: '点击验证', result: '你输了账号密码，结果号被盗了，游戏皮肤都被清空了', effects: { stress: 5, exp: -25 } },
        { label: '不点验证', result: '你觉得官方不会私发要密码，直接找家长确认是诈骗', effects: { exp: 35, stress: -10 } }
      ] },
    { id: 'classmate_fight',
      scenario: '同学私发你消息，说和别人吵架了，让你帮忙去评论区骂对方，还说事后请你吃辣条',
      options: [
        { label: '答应', result: '你跟着去骂了人，结果被对方举报，账号被禁言了三天', effects: { stress: 15, exp: -20 } },
        { label: '拒绝', result: '你拒绝了，还劝同学好好沟通，骂人解决不了问题', effects: { exp: 25, stress: -10 } }
      ] },
    { id: 'qq_qr',
      scenario: '班级的qq群里老师的头像发了个二维码要求扫码交学费，你注意到老师的头像旁没有群主头衔',
      options: [
        { label: '扫码', result: '你被骗了，这个人把头像换成老师的来骗钱', effects: { stress: 20 } },
        { label: '不扫码', result: '你意识到不对劲，打电话找老师核实，成功揭穿骗子', effects: { exp: 40 } }
      ] },
    { id: 'solar_eclipse',
      scenario: '你用手机查“日食形成原因”作业资料，搜索结果页下方推荐了一条 “宇宙十大罕见奇观” 的科普短视频，和作业主题沾边',
      options: [
        { label: '点击', result: '你看完科普视频后，没忍住继续往下翻，再一看时间已经很晚了，作业还没写完', effects: { stress: 15, attention: -1 } },
        { label: '不点击', result: '你目标明确，雷厉风行，查完资料后很快完成作业，晚上有时间跟朋友出去玩了', effects: { stress: -20, exp: 30, attention: 1 } }
      ] },
    { id: 'word_app',
      scenario: '你用背单词 APP 学习，背完今日任务后，APP 弹出 “趣味单词闯关，赢专属勋章” 的活动入口，但原本你打算去练琴',
      options: [
        { label: '点击', result: '你闯了一关后，发现继续闯关能拿更多勋章，时间流逝，你发现弹琴的时间不够了，拿的勋章似乎也没什么意思，你有点沮丧', effects: { stress: 10, attention: -1 } },
        { label: '不点击', result: '你前去练琴，陶醉于美妙的音乐中...', effects: { stress: -20, attention: 1 } }
      ] },
    { id: 'mom_article',
      scenario: '妈妈转发给你一篇朋友圈文章，标题是 “医生提醒：秋天多吃这三种水果，孩子少生病”，文中有食物图和笼统的“专家建议”',
      options: [
        { label: '转发', result: '你觉得有道理转发给同学，后来有同学查到正规科普说文章夸大功效，你有点不好意思', effects: { exp: -10, stress: 5 } },
        { label: '不转发', result: '你不直接当真，去正规科普平台核实，发现文章说法片面，还学到了正确的饮食知识', effects: { exp: 30, stress: -5 } }
      ] },
    { id: 'patent_news',
      scenario: '你在网上看到 “小学生发明新型专利，轰动全网”的文章，只有人物化名和故事，没有专利号和官方报道',
      options: [
        { label: '当成故事分享', result: '你当成励志故事分享给朋友，后来发现是编造的鸡汤文，你有点失望', effects: { exp: -10, stress: 5 } },
        { label: '先核实真实性', result: '你不急于传播，搜索专利平台和正规新闻，确认是不实内容，还学会了怎么查专利信息', effects: { exp: 30, stress: -5 } }
      ] },
    { id: 'essay_ai',
      scenario: '写命题作文《我的周末》，你让 AI 写了草稿，文笔很好，但内容和你真实经历不一样',
      options: [
        { label: '提交', result: '你直接改个名字交上去，老师发现内容不真实，打了低分', effects: { exp: -20, stress: 15 } },
        { label: '不提交', result: '你参考 AI 的行文结构，用自己的真实经历重写，作文得到了老师的表扬', effects: { exp: 40, stress: -15 } }
      ] },
    { id: 'math_ai',
      scenario: '你让 AI 出数学练习题，做完后发现有两道题的答案好像不对',
      options: [
        { label: '按AI答案改', result: '你觉得是自己算错了，按 AI 的答案改，后来作业批改里这两道题都错了', effects: { exp: -15, stress: 15 } },
        { label: '自己再核对', result: '你自己再算一遍，翻课本核对知识点，发现是 AI 算错了，还巩固了公式', effects: { exp: 35, stress: -10 } }
      ] },
    { id: 'anime_ai',
      scenario: '你最近很喜欢和 AI 聊动漫话题，它总能接得上你的梗，同学约你放学一起去书店',
      options: [
        { label: '不去赴约', result: '你说自己有事，回家和 AI 聊天，慢慢和同学的共同话题变少了', effects: { stress: 20, exp: -15 } },
        { label: '和同学去书店', result: '你和同学去书店，面对面聊动漫，还发现了新的共同爱好', effects: { exp: 30, stress: -10 } }
      ] },
    { id: 'fight_ai',
      scenario: '每次和同学吵架，你都去找 AI 评理，AI 总是站在你这边',
      options: [
        { label: '相信AI', result: '你觉得 AI 最懂自己，更不想和同学和解，人际关系越来越僵', effects: { stress: 25, exp: -15 } },
        { label: '主动沟通', result: '你还是主动和同学沟通，听听对方的想法，最后和好了', effects: { exp: 35, stress: -10 } }
      ] }
  ];

  // ===== 挑战事件（小王）：可多次出现，结果按当前学习境界分档 =====
  var CHALLENGE = {
    id: 'challenge',
    scenario: '同班的小王向你发起了学习挑战',
    options: [
      { label: '接受', isAccept: true },
      { label: '逃跑', result: '小王不屑地看了你一眼', effects: null }
    ]
  };

  // 按境界返回挑战「接受」的结果
  function challengeResult(exp) {
    var name = realmName(exp);
    if (name === '学渣境' || name === '学子境') {
      return {
        line: '你当前的学习境界是' + name + '，对方出了一道题，轻而易举把你难住了，对方不屑的看了你一眼',
        effects: { stress: 10 }
      };
    }
    if (name === '学友境' || name === '学者境') {
      return {
        line: '你当前的学习境界是' + name + '，双方互相出题，你们都快速完成，旗鼓相当',
        effects: { stress: -15, exp: 30 }
      };
    }
    return {
      line: '你当前的学习境界是' + name + '，你轻而易举完成他的所有题目，而他还在抓耳挠腮思考，你感到十分得意',
      effects: { stress: -20, exp: 60 }
    };
  }

  // ===== DOM 引用 =====
  var panelEl = null, innerEl = null;

  // ===== 调度：是否触发 + 挑选事件 =====
  function shouldTrigger(state) {
    // 第 10 天还没出现过挑战事件 → 必定触发（保证 10 天内至少一次）
    if (state.day >= LAST_DAY && !state.randomChallengeShown) return true;
    return Math.random() < TRIGGER_CHANCE;
  }

  function pickEvent(state) {
    // 第 10 天且挑战未出现过 → 强制挑战
    if (state.day >= LAST_DAY && !state.randomChallengeShown) return CHALLENGE;

    // 未出现过的非挑战事件
    var unused = EVENTS.filter(function (ev) {
      return state.seenRandomEvents.indexOf(ev.id) === -1;
    });
    var pool = unused.slice();
    // 挑战可多次出现：按概率加入候选池
    if (Math.random() < CHALLENGE_CHANCE) pool.push(CHALLENGE);
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ===== 把待处理事件卡片渲染到日志面板 =====
  function renderCard() {
    if (!innerEl) return;
    var state = loadState();
    var pending = state.pendingRandomEvent;
    // 清除旧卡片（避免多次触发时残留）
    var oldCards = innerEl.querySelectorAll('.random-card');
    for (var o = 0; o < oldCards.length; o++) oldCards[o].parentNode.removeChild(oldCards[o]);

    if (!pending) return;

    var ev = null;
    if (pending.isChallenge) ev = CHALLENGE;
    else {
      for (var i = 0; i < EVENTS.length; i++) {
        if (EVENTS[i].id === pending.id) { ev = EVENTS[i]; break; }
      }
    }
    if (!ev) return;

    var card = document.createElement('div');
    card.className = 'random-card';

    var tag = document.createElement('span');
    tag.className = 'random-tag';
    tag.textContent = '（随机事件）';
    card.appendChild(tag);

    var txt = document.createTextNode(ev.scenario);
    card.appendChild(txt);

    var optRow = document.createElement('div');
    optRow.className = 'random-options';
    ev.options.forEach(function (opt, idx) {
      var b = document.createElement('button');
      b.className = 'random-btn ' + (idx === 0 ? 'warm' : 'cool');
      b.textContent = opt.label;
      b.addEventListener('click', function () { resolve(opt); });
      optRow.appendChild(b);
    });
    card.appendChild(optRow);

    innerEl.appendChild(card);
    if (panelEl) panelEl.scrollTop = panelEl.scrollHeight;
  }

  // ===== 应用数值变化（与主界面相同的下限规则；压力值上限 100）=====
  function applyEffects(state, effects) {
    if (!effects) return state;
    state.energy = Math.max(0, state.energy + (effects.energy || 0));
    state.stress = Math.min(100, Math.max(0, state.stress + (effects.stress || 0)));
    state.attention += (effects.attention || 0);
    state.exp = Math.max(0, state.exp + (effects.exp || 0));
    return state;
  }

  // ===== 玩家点选一个选项后结算 =====
  function resolve(option) {
    var state = loadState();
    var pending = state.pendingRandomEvent;
    if (!pending) return;
    state.pendingRandomEvent = null;

    var line;
    var evEffects;

    if (pending.isChallenge) {
      // 挑战：接受结果按当前学习境界分档
      if (option.isAccept) {
        var r = challengeResult(state.exp);
        line = '（随机事件）同班的小王向你发起了学习挑战，你选择了接受，' + r.line + statText(r.effects);
        evEffects = r.effects;
      } else {
        line = '（随机事件）同班的小王向你发起了学习挑战，你选择了逃跑，' + option.result;
        evEffects = null;
      }
    } else {
      line = '（随机事件）' + pending.scenario + '，你选择了：' + option.label + '，' + option.result + statText(option.effects);
      evEffects = option.effects;
    }

    state = applyEffects(state, evEffects);
    saveState(state);

    // 压力值达到 100 → 游戏失败，跳转结算界面（失败文案）
    if (state.stress >= 100) {
      localStorage.setItem('study_failed', '1');
      window.location.replace('../结算界面/index.html');
      return;
    }

    // 追加日志并重新渲染面板 + 主界面
    if (typeof LogPanel !== 'undefined' && LogPanel.append) LogPanel.append(line);
    if (typeof LogPanel !== 'undefined' && LogPanel.render && innerEl && panelEl) {
      LogPanel.render(panelEl, innerEl);
    }
    // 刷新主界面的状态显示
    if (typeof refreshMain === 'function') refreshMain(loadState());
  }

  // ===== 公开接口 =====
  global.RandomEvent = {
    // 传入主界面的日志面板元素
    init: function (panel, inner) {
      panelEl = panel;
      innerEl = inner;
    },
    // 每次 学习/玩手机/休闲 结算后调用：40% 判定 → 挑选 → 渲染卡片
    maybeTrigger: function () {
      var state = loadState();
      if (!shouldTrigger(state)) return;
      var ev = pickEvent(state);
      if (!ev) return;

      // 记录已出现，避免 10 天内重复（挑战除外，但它要记下已出现过以便第 10 天强制）
      if (ev.id === 'challenge') {
        state.randomChallengeShown = true;
      } else {
        if (state.seenRandomEvents.indexOf(ev.id) === -1) state.seenRandomEvents.push(ev.id);
      }
      state.pendingRandomEvent = {
        id: ev.id,
        scenario: ev.scenario,
        isChallenge: ev.id === 'challenge'
      };
      saveState(state);
      // 延迟 0.5 秒再出现随机事件卡片
      setTimeout(function () { renderCard(); }, 1000);
    },
    // 页面加载时恢复未选择的待处理事件
    renderPending: function () {
      renderCard();
    }
  };
})(window);


