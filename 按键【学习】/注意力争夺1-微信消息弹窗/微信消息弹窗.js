// ===== 注意力争夺1-微信消息弹窗 =====
// 在答题页(学习页)作用域中运行，通过共享的全局函数控制倒计时。
// 依赖答题页提供的：pauseCountdown() / resumeCountdown()，以及指明的图片路径。
var WeixinEvent = (function () {
  var POPUP_IMG = '注意力争夺1-微信消息弹窗/微信红包弹窗.png';
  var COMIC_IMG = '注意力争夺1-微信消息弹窗/漫画.png';
  var HOLD_MS = 2000;   // 弹窗停留 2 秒

  var popupEl = null, comicEl = null;
  var timer2s = null;
  var active = false;

  function ensureDom() {
    if (popupEl) return;
    var phone = document.querySelector('.phone');

    // 顶部弹窗（模拟微信消息弹出，遮住进度条但不挡选项）
    popupEl = document.createElement('div');
    popupEl.className = 'wx-popup';
    popupEl.innerHTML = '<img src="' + POPUP_IMG + '" alt="微信红包弹窗">';
    popupEl.style.display = 'none';
    phone.appendChild(popupEl);

    // 漫画覆盖层（点弹窗后出现，画面变暗）
    comicEl = document.createElement('div');
    comicEl.className = 'wx-comic';
    comicEl.innerHTML = '<img src="' + COMIC_IMG + '" alt="漫画">'
      + '<button class="comic-close" aria-label="关闭">×</button>';
    comicEl.style.display = 'none';
    phone.appendChild(comicEl);

    // 点弹窗 -> 打开漫画
    popupEl.addEventListener('click', function () {
      onPopupClick();
    });
    // 点叉 -> 关闭漫画，继续做题
    comicEl.querySelector('.comic-close').addEventListener('click', function () {
      onComicClose();
    });
  }

  // 隐藏/显示上方的答题时间进度条，事件期间完全隐藏它，
  // 使“进度条暂停”完全不可见（弹窗透明部分也挡不住）
  function setTimerVisible(show) {
    var tw = document.querySelector('.timer-wrap');
    if (tw) tw.style.visibility = show ? 'visible' : 'hidden';
  }

  // 触发事件：暂停时间条，弹出微信消息
  function show() {
    ensureDom();
    if (active) return;
    active = true;
    pauseCountdown();              // 时间条暂停
    setTimerVisible(false);        // 隐藏时间进度条
    popupEl.style.display = 'block';
    popupEl.classList.remove('slide-in');
    void popupEl.offsetWidth;      // 强制重排以重播动画
    popupEl.classList.add('slide-in');

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
    popupEl.style.display = 'none';
  }

  // 点了弹窗：隐藏弹窗，显示漫画（画面变暗，时间条保持暂停），注意力-1
  function onPopupClick() {
    if (!active) return;
    clearTimeout(timer2s);
    hidePopup();
    var s = loadState();
    s.attention = Math.max(0, s.attention - 1);
    saveState(s);
    comicEl.style.display = 'flex';
  }

  // 点了漫画的叉：关闭漫画，时间条继续，回到做题
  function onComicClose() {
    comicEl.style.display = 'none';
    setTimerVisible(true);
    active = false;
    resumeCountdown();
  }

  // 触发期间用户点了题目选项时由答题页调用
  function cancel() {
    clearTimeout(timer2s);
    hidePopup();
    if (comicEl) comicEl.style.display = 'none';
    setTimerVisible(true);
    active = false;
  }

  function isActive() {
    return active;
  }

  return { show: show, cancel: cancel, isActive: isActive };
})();
