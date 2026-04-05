/* ─── GRE Prep — Hash Router ──────────────────────────── */
var Router = (function() {

  var ROUTES = {
    'progress':   { pageId: 'page-progress',   PageClass: function() { return ProgressPage; } },
    'flashcards': { pageId: 'page-flashcards',  PageClass: function() { return FlashcardPage; } },
    'practice':   { pageId: 'page-practice',    PageClass: function() { return PracticePage; } },
    'writing':    { pageId: 'page-writing',     PageClass: function() { return WritingPage; } },
    'schedule':   { pageId: 'page-schedule',    PageClass: function() { return SchedulePage; } }
  };

  var DEFAULT_ROUTE = 'progress';
  var currentPage = null;
  var currentRoute = null;

  function getHash() {
    return (window.location.hash || '').replace('#', '') || DEFAULT_ROUTE;
  }

  function navigate(hash) {
    window.location.hash = '#' + hash;
  }

  function render() {
    var routeName = getHash();

    // Support subroutes like #practice/review — just use base
    routeName = routeName.split('/')[0];

    if (!ROUTES[routeName]) {
      navigate(DEFAULT_ROUTE);
      return;
    }

    // Destroy previous page
    if (currentPage && typeof currentPage.destroy === 'function') {
      currentPage.destroy();
      currentPage = null;
    }

    // Hide all pages
    Object.keys(ROUTES).forEach(function(name) {
      var el = document.getElementById(ROUTES[name].pageId);
      if (el) el.style.display = 'none';
    });

    // Update nav active state
    document.querySelectorAll('.nav-link[data-page]').forEach(function(link) {
      link.classList.toggle('active', link.dataset.page === routeName);
    });

    // Show and init the target page
    var route = ROUTES[routeName];
    var el = document.getElementById(route.pageId);
    if (el) {
      el.style.display = '';
      var PageClass = route.PageClass();
      try {
        currentPage = new PageClass(el);
        if (typeof currentPage.init === 'function') currentPage.init();
      } catch(e) {
        console.error('Page init failed for', routeName, e);
        el.innerHTML = '<div class="page-header"><h1 class="page-title">Error</h1><p class="page-subtitle">Could not load this page. Check the console for details.</p></div>';
      }
    }

    currentRoute = routeName;
    window.scrollTo(0, 0);
  }

  function init() {
    window.addEventListener('hashchange', render);
    render();
  }

  return {
    init: init,
    navigate: navigate,
    getHash: getHash,
    getCurrentRoute: function() { return currentRoute; }
  };
})();
