/* ─── GRE Prep — Utility Functions ───────────────────── */
var Utils = (function() {

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function formatTime(seconds) {
    var s = Math.max(0, Math.floor(seconds));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  function dateKey(date) {
    var d = date || new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function daysBetween(d1, d2) {
    var a = new Date(d1);
    var b = new Date(d2);
    a.setHours(0,0,0,0);
    b.setHours(0,0,0,0);
    return Math.round((b - a) / 86400000);
  }

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  function debounce(fn, ms) {
    var timeout;
    return function() {
      var args = arguments;
      var ctx = this;
      clearTimeout(timeout);
      timeout = setTimeout(function() { fn.apply(ctx, args); }, ms);
    };
  }

  function generateId(prefix) {
    return (prefix || 'id') + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  }

  function wordCount(str) {
    if (!str || !str.trim()) return 0;
    return str.trim().split(/\s+/).length;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    var d = new Date(isoStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatDateShort(isoStr) {
    if (!isoStr) return '';
    var d = new Date(isoStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Get ISO date string for a Date offset by N days from today
  function offsetDate(days) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    return dateKey(d);
  }

  // Get start of week (Monday) for a given date
  function weekStart(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    var day = d.getDay(); // 0=Sun
    var diff = (day === 0) ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return dateKey(d);
  }

  // Get array of 7 ISO date strings for the week containing dateStr
  function weekDays(mondayStr) {
    var days = [];
    var d = new Date(mondayStr + 'T00:00:00');
    for (var i = 0; i < 7; i++) {
      days.push(dateKey(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  return {
    shuffle: shuffle,
    formatTime: formatTime,
    dateKey: dateKey,
    daysBetween: daysBetween,
    clamp: clamp,
    debounce: debounce,
    generateId: generateId,
    wordCount: wordCount,
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    formatDateShort: formatDateShort,
    offsetDate: offsetDate,
    weekStart: weekStart,
    weekDays: weekDays,
    deepClone: deepClone
  };
})();
