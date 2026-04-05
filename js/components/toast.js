/* ─── GRE Prep — Toast Notifications ─────────────────── */
var Toast = (function() {

  function show(message, type, duration) {
    type = type || 'info';
    duration = duration !== undefined ? duration : 3000;

    var root = document.getElementById('toast-root');
    if (!root) return;

    var toast = document.createElement('div');
    toast.className = 'toast ' + (type === 'error' ? 'danger' : type);

    var icon = {
      success: '✓',
      warning: '!',
      error:   '✕',
      danger:  '✕',
      info:    'i'
    }[type] || 'i';

    toast.innerHTML =
      '<span style="font-weight:700;font-size:1rem;flex-shrink:0">' + icon + '</span>' +
      '<span>' + Utils.escapeHtml(message) + '</span>';

    root.appendChild(toast);

    if (duration > 0) {
      setTimeout(function() {
        dismiss(toast);
      }, duration);
    }

    return toast;
  }

  function dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('fade-out');
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 320);
  }

  function success(msg, duration) { return show(msg, 'success', duration); }
  function warning(msg, duration) { return show(msg, 'warning', duration); }
  function error(msg, duration)   { return show(msg, 'danger',  duration); }
  function info(msg, duration)    { return show(msg, 'info',    duration); }

  return { show: show, dismiss: dismiss, success: success, warning: warning, error: error, info: info };
})();
