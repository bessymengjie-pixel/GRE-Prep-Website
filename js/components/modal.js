/* ─── GRE Prep — Modal Component ─────────────────────── */
var Modal = (function() {

  var activeModal = null;

  function open(contentHtml, options) {
    options = options || {};
    close(); // close any existing

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'active-modal';

    var box = document.createElement('div');
    box.className = 'modal-box';
    if (options.maxWidth) box.style.maxWidth = options.maxWidth;
    if (options.wide) box.style.maxWidth = '720px';

    box.innerHTML = contentHtml;
    overlay.appendChild(box);

    // Close on overlay click (unless prevented)
    if (!options.noOverlayClose) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) close();
      });
    }

    document.getElementById('modal-root').appendChild(overlay);
    activeModal = overlay;

    // Focus first focusable element
    setTimeout(function() {
      var focusable = box.querySelector('input, textarea, select, button, [tabindex]');
      if (focusable) focusable.focus();
    }, 50);

    // Keyboard: Escape to close
    document.addEventListener('keydown', handleEscape);

    return overlay;
  }

  function close() {
    if (activeModal) {
      activeModal.remove();
      activeModal = null;
      document.removeEventListener('keydown', handleEscape);
    }
  }

  function handleEscape(e) {
    if (e.key === 'Escape') close();
  }

  // Returns a Promise<boolean> — true if confirmed, false if cancelled
  function confirm(message, options) {
    options = options || {};
    var title   = options.title || 'Confirm';
    var okLabel = options.okLabel || 'Confirm';
    var okClass = options.okClass || 'btn-primary';

    return new Promise(function(resolve) {
      var html = [
        '<div class="modal-header">',
          '<h2 class="modal-title">' + Utils.escapeHtml(title) + '</h2>',
          '<button class="modal-close btn-icon" id="modal-close-x">&times;</button>',
        '</div>',
        '<p style="color:var(--color-text-secondary);line-height:1.6;font-size:0.9375rem">' + Utils.escapeHtml(message) + '</p>',
        '<div class="modal-footer">',
          '<button class="btn btn-ghost" id="modal-cancel">Cancel</button>',
          '<button class="btn ' + okClass + '" id="modal-ok">' + Utils.escapeHtml(okLabel) + '</button>',
        '</div>'
      ].join('');

      var overlay = open(html, { noOverlayClose: true });

      overlay.querySelector('#modal-ok').addEventListener('click', function() {
        close();
        resolve(true);
      });

      overlay.querySelector('#modal-cancel').addEventListener('click', function() {
        close();
        resolve(false);
      });

      var closeX = overlay.querySelector('#modal-close-x');
      if (closeX) closeX.addEventListener('click', function() {
        close(); resolve(false);
      });
    });
  }

  // Shorthand: open with a standard header + close button
  function openPanel(title, bodyHtml, options) {
    var html = [
      '<div class="modal-header">',
        '<h2 class="modal-title">' + Utils.escapeHtml(title) + '</h2>',
        '<button class="modal-close btn-icon" id="modal-close-x">&times;</button>',
      '</div>',
      bodyHtml
    ].join('');

    var overlay = open(html, options);
    overlay.querySelector('#modal-close-x').addEventListener('click', close);
    return overlay;
  }

  return { open: open, close: close, confirm: confirm, openPanel: openPanel };
})();
