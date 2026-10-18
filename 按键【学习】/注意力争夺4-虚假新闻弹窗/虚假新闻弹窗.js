// ===== 注意力争夺4-虚假新闻弹窗 =====
// 在答题页(学习页)作用域中运行，通过共享的全局函数控制倒计时与状态。
// 依赖答题页提供的：pauseCountdown() / resumeCountdown() / loadState() / saveState()。
//
// 流程：
//   1. show()：暂停并隐藏时间条，顶部弹出 虚假新闻弹窗.png（模拟手机消息，界面不变暗），2 秒后自动消失并恢复；
//   2. 2 秒内可点题目选项（由答题页 cancel() 处理）或点“虚假新闻弹窗”；
//   3. 点弹窗 → 注意力-1 → 打开全屏“虚假新闻文章页”，滚动到末尾出现选择题；
//   4. 选“相信” → 返回做题继续；选“不相信” → 学习境界直接升一级，再返回做题继续。
var FakeNewsEvent = (function () {
  var POPUP_IMG = '注意力争夺4-虚假新闻弹窗/虚假新闻弹窗.png';
  var NOTICE_IMG = '注意力争夺4-虚假新闻弹窗/重磅通知.png';
  var PRESS_IMG = '注意力争夺4-虚假新闻弹窗/虚假新闻发布会图片.png';
  var HOLD_MS = 2000;   // 顶部弹窗停留 2 秒

  // 学习境界门槛（与主界面 REALMS 一致）
  var REALMS = [0, 50, 150, 300, 500, 800];

  var popupEl = null, pageEl = null;
  var timer2s = null;
  var active = false;   // 本次事件生命周期（弹窗 + 文章页）是否处于激活状态
  var inPage = false;   // 是否已进入文章页（弹窗已被点击）
  var chooseShown = false;

  function setTimerVisible(show) {
    var tw = document.querySelector('.timer-wrap');
    if (tw) tw.style.visibility = show ? 'visible' : 'hidden';
  }

  // ---- 顶部弹窗 ----
  function ensureDom() {
    if (popupEl) return;
    var phone = document.querySelector('.phone');

    popupEl = document.createElement('div');
    popupEl.className = 'fn-popup';
    popupEl.innerHTML = '<img src="' + POPUP_IMG + '" alt="消息弹窗">';
    popupEl.style.display = 'none';
    popupEl.addEventListener('click', onPopupClick);
    phone.appendChild(popupEl);

    pageEl = document.createElement('div');
    pageEl.className = 'fn-page';
    pageEl.style.display = 'none';
    pageEl.innerHTML = buildPageHtml();
    pageEl.querySelector('.fn-btn.believe').addEventListener('click', function () { onChoose(false); });
    pageEl.querySelector('.fn-btn.doubt').addEventListener('click', function () { onChoose(true); });
    // 滚动到末尾时显示选择题
    pageEl.addEventListener('scroll', function () {
      if (inPage && !chooseShown && pageEl.scrollTop + pageEl.clientHeight >= pageEl.scrollHeight - 30) {
        chooseShown = true;
        pageEl.querySelector('.fn-choose').style.display = 'block';
      }
    });
    phone.appendChild(pageEl);
  }

  // ---- 虚假新闻文章页内容（尽量逼真） ----
  function buildPageHtml() {
    return '' +
      '<div class="fn-meta">' +
        '<span class="fn-reporter">👨‍💼 每日教育速报</span>' +
        '<span>2026年10月16日 09:30</span>' +
      '</div>' +
      '<h1 class="fn-title">重磅！多地下发通知，小学生即将迎来秋假？消息已被官方确认为谣言！</h1>' +
      '<div class="fn-sub">多地教育局已发布文件，最快下周开始执行</div>' +

      '<img class="fn-notice" src="' + NOTICE_IMG + '" alt="重磅通知">' +

      '<p class="fn-body">10月16日，一则消息在家长群和短视频平台迅速刷屏：<strong>“多地下发通知，小学生9月起增加秋假，连续放假一周。”</strong>' +
      '不少家长转发时配文——“终于等到这一天，带孩子去赏银杏！”</p>' +

      '<p class="fn-body">据网传的“通知”截图，所谓秋假时间为<strong>10月第3周（10月19日—10月25日）</strong>，共7天，期间不安排任何作业与课后服务，' +
      '仅要求家长妥善安排孩子的出行与安全。</p>' +

      '<div class="fn-section">一、网传“重磅通知”</div>' +
      '<p class="fn-body">该截图以“重磅通知”为题，称经“教育部研究决定”，自2026年起全国小学生统一增设秋假，并附有教委红头文件样式，' +
      '看起来颇为正式，短时间内被大量账号以“官方文件”的口吻转载。</p>' +

      '<div class="fn-section">二、多市召开新闻发布会</div>' +
      '<p class="fn-body">今天上午，多市教育部门就“中小学生秋假安排”召开新闻发布会，新闻发言人就网传消息作出回应。</p>' +
      '<img class="fn-press" src="' + PRESS_IMG + '" alt="新闻发布会现场">' +
      '<p class="fn-caption">▲ 发布会现场座无虚席，多家媒体到场采访。</p>' +

      '<div class="fn-quote">“网传的‘重磅通知’并非出自教育部门。目前各地均无增设秋假的正式安排，请广大师生家长以官方渠道发布的信息为准，' +
      '切勿轻信来路不明的截图与‘内部消息’。”</div>' +

      '<p class="fn-body">发言人同时提醒，类似的“××地区即将放假”“××新规即将施行”等说法常借家长对孩子教育的关心进行传播，' +
      '看到来源不明的红头文件，务必先在政府官网、官方公众号上核对真伪。</p>' +

      '<div class="fn-choose" style="display:none">' +
        '<p class="fn-q">你觉得这篇报道可信吗？</p>' +
        '<div class="fn-btns">' +
          '<button class="fn-btn believe">可信</button>' +
          '<button class="fn-btn doubt">不可信</button>' +
        '</div>' +
      '</div>';
  }

  // 触发事件：暂停并隐藏时间条，顶部弹出“虚假新闻弹窗”
  function show() {
    ensureDom();
    if (active) return;
    active = true;
    inPage = false;
    chooseShown = false;
    pauseCountdown();                 // 时间条暂停
    setTimerVisible(false);           // 隐藏时间进度条
    popupEl.style.display = 'block';
    popupEl.classList.remove('fn-slide');
    void popupEl.offsetWidth;         // 强制重排以重播动画
    popupEl.classList.add('fn-slide');

    // 2 秒后自动消失，时间条继续
    timer2s = setTimeout(function () {
      hidePopup();
      setTimerVisible(true);
      active = false;
      resumeCountdown();
    }, HOLD_MS);
  }

  function hidePopup() {
    clearTimeout(timer2s);
    timer2s = null;
    if (popupEl) popupEl.style.display = 'none';
  }

  // 点了弹窗：隐藏弹窗，打开文章页，注意力-1
  function onPopupClick() {
    if (!active || inPage) return;
    clearTimeout(timer2s);
    timer2s = null;
    hidePopup();
    var s = loadState();
    s.attention = Math.max(0, s.attention - 1);
    saveState(s);

    inPage = true;
    // 文章页回到顶部
    pageEl.scrollTop = 0;
    pageEl.querySelector('.fn-choose').style.display = 'none';
    pageEl.style.display = 'block';
  }

  // 选择“相信/不相信”（doubt = 选“不相信”）
  function onChoose(doubt) {
    if (!inPage) return;
    if (doubt) {
      // 学习境界直接升一级：把经验设到下一境界门槛
      var s = loadState();
      var idx = 0;
      for (var i = 0; i < REALMS.length; i++) {
        if (s.exp >= REALMS[i]) idx = i;
      }
      if (idx < REALMS.length - 1) {
        s.exp = REALMS[idx + 1];
        saveState(s);
      }
    }
    closePage();
  }

  // 关闭文章页，恢复时间条，回到做题
  function closePage() {
    if (pageEl) pageEl.style.display = 'none';
    setTimerVisible(true);
    active = false;
    inPage = false;
    resumeCountdown();
  }

  // 触发期间用户点了题目选项时由答题页调用：结束事件（保留已扣减的注意力）
  function cancel() {
    clearTimeout(timer2s);
    timer2s = null;
    hidePopup();
    if (pageEl) {
      pageEl.style.display = 'none';
      inPage = false;
    }
    setTimerVisible(true);
    active = false;
  }

  function isActive() {
    return active;
  }

  return { show: show, cancel: cancel, isActive: isActive };
})();
