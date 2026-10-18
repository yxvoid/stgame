// ===== 滚动叙事日志面板 =====
// 记录 10 天学习过程，存于 localStorage，重开新游戏才清空。
// 动作页调用 LogPanel.append(文本) 追加日志；主界面调用 LogPanel.render(面板, 内容) 渲染。
var LogPanel = (function () {
  var LOG_KEY = 'study_log';

  function loadLog() {
    try {
      var raw = localStorage.getItem(LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveLog(list) {
    localStorage.setItem(LOG_KEY, JSON.stringify(list));
  }

  // 追加一条日志（动作页调用）
  function append(text) {
    var list = loadLog();
    list.push(text);
    saveLog(list);
  }

  // 清空日志（重开新游戏）
  function clearLog() {
    localStorage.removeItem(LOG_KEY);
  }

  // 转义 HTML，避免日志内容被当作标签解析
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // 渲染到纵向滚动面板，并自动滚到底部
  function render(panel, inner) {
    var list = loadLog();
    inner.innerHTML = '';
    if (list.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'log-empty';
      empty.textContent = '（暂无记录）';
      inner.appendChild(empty);
    } else {
      list.forEach(function (text) {
        var p = document.createElement('p');
        p.className = 'log-entry';
        // 数值变化：把日志里的【...】显示为（...）并用更细的字号/字重（.log-stat）
        var safe = esc(text).replace(/【([^】]*)】/g, '<span class="log-stat">（$1）</span>');
        p.innerHTML = safe;
        inner.appendChild(p);
      });
    }
    panel.scrollTop = panel.scrollHeight;
  }

  return { loadLog: loadLog, append: append, clearLog: clearLog, render: render };
})();
