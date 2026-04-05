/* ─── GRE Prep — Flashcard Page ──────────────────────── */
function FlashcardPage(el) {
  this.el = el;
  this._deck = [];
  this._index = 0;
  this._sessionStats = { easy: 0, hard: 0, again: 0 };
  this._flipped = false;
  this._keyHandler = null;
  this._sessionStart = null;
  this._filter = 'due'; // 'due' | 'all' | 'unknown'
}

FlashcardPage.prototype.init = function() {
  this._renderSetup();
};

FlashcardPage.prototype.destroy = function() {
  if (this._keyHandler) {
    document.removeEventListener('keydown', this._keyHandler);
    this._keyHandler = null;
  }
};

/* ── SM-2 Algorithm ── */
FlashcardPage.prototype._sm2Update = function(card, quality) {
  var ef = card.easeFactor || 2.5;
  var reps = card.repetitions || 0;
  var interval = card.interval || 1;

  var newEF = Math.max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  var newReps, newInterval;
  if (quality < 3) {
    newReps = 0;
    newInterval = 1;
  } else {
    newReps = reps + 1;
    if (newReps === 1) newInterval = 1;
    else if (newReps === 2) newInterval = 6;
    else newInterval = Math.round(interval * newEF);
  }

  var nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  return {
    status: quality >= 4 ? 'known' : quality >= 3 ? 'learning' : 'unknown',
    interval: newInterval,
    easeFactor: newEF,
    repetitions: newReps,
    nextReview: Utils.dateKey(nextDate),
    lastSeen: Utils.dateKey()
  };
};

/* ── Build session deck ── */
FlashcardPage.prototype._buildDeck = function() {
  var settings = Store.getSettings();
  var deckSize = settings.flashcardDeckSize || 20;
  var vp = Store.getVocabProgress();
  var today = Utils.dateKey();
  var filter = this._filter;

  var due = [], unseen = [], all = [];

  VOCAB_LIST.forEach(function(word) {
    var prog = vp[word.id];
    if (!prog) {
      unseen.push(word);
      all.push(word);
    } else if (filter === 'unknown' && prog.status === 'unknown') {
      due.push(word);
      all.push(word);
    } else if (filter === 'all') {
      all.push(word);
    } else {
      // 'due': words where nextReview <= today
      if (!prog.nextReview || prog.nextReview <= today) {
        due.push(word);
      }
      all.push(word);
    }
  });

  var deck;
  if (filter === 'all') {
    deck = Utils.shuffle(all).slice(0, deckSize);
  } else if (filter === 'unknown') {
    deck = Utils.shuffle(due).slice(0, deckSize);
  } else {
    // 'due': first use due words, then fill with unseen
    due = Utils.shuffle(due);
    unseen = Utils.shuffle(unseen);
    deck = due.slice(0, deckSize);
    if (deck.length < deckSize) {
      deck = deck.concat(unseen.slice(0, deckSize - deck.length));
    }
  }

  return deck;
};

/* ── Setup screen ── */
FlashcardPage.prototype._renderSetup = function() {
  var vp = Store.getVocabProgress();
  var totalWords = VOCAB_LIST.length;
  var mastered = Object.values(vp).filter(function(v) { return v.status === 'known'; }).length;
  var learning = Object.values(vp).filter(function(v) { return v.status === 'learning'; }).length;
  var today = Utils.dateKey();
  var dueCount = VOCAB_LIST.filter(function(w) {
    var p = vp[w.id];
    return !p || !p.nextReview || p.nextReview <= today;
  }).length;
  var filter = this._filter;

  this.el.innerHTML = [
    '<div class="page-header">',
      '<h1 class="page-title">Vocabulary</h1>',
      '<p class="page-subtitle">Build your GRE word bank with spaced repetition</p>',
    '</div>',

    '<div class="fc-setup">',
      '<div class="grid-3" style="margin-bottom:var(--space-8)">',
        '<div class="stat-card"><div class="stat-card-label">Total Words</div><div class="stat-card-value">' + totalWords + '</div></div>',
        '<div class="stat-card"><div class="stat-card-label">Mastered</div><div class="stat-card-value" style="color:var(--color-success)">' + mastered + '</div></div>',
        '<div class="stat-card"><div class="stat-card-label">Due Today</div><div class="stat-card-value" style="color:var(--color-warning)">' + dueCount + '</div></div>',
      '</div>',

      '<h3 style="font-size:1rem;font-weight:600;margin-bottom:var(--space-3)">Study Mode</h3>',
      '<div class="fc-setup-options">',
        '<button class="fc-filter-btn' + (filter === 'due' ? ' active' : '') + '" data-filter="due">Due Today (' + dueCount + ')</button>',
        '<button class="fc-filter-btn' + (filter === 'unknown' ? ' active' : '') + '" data-filter="unknown">Difficult Words</button>',
        '<button class="fc-filter-btn' + (filter === 'all' ? ' active' : '') + '" data-filter="all">All Words</button>',
      '</div>',

      '<button class="btn btn-primary btn-lg" id="fc-start-btn" style="margin-top:var(--space-6)">Start Session</button>',
    '</div>'
  ].join('');

  var self = this;
  this.el.querySelectorAll('.fc-filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      self._filter = this.dataset.filter;
      self._renderSetup();
    });
  });

  this.el.querySelector('#fc-start-btn').addEventListener('click', function() {
    self._startSession();
  });
};

/* ── Start session ── */
FlashcardPage.prototype._startSession = function() {
  this._deck = this._buildDeck();
  if (!this._deck.length) {
    Toast.info('No words available for this filter. Try "All Words".');
    return;
  }
  this._index = 0;
  this._flipped = false;
  this._sessionStats = { easy: 0, hard: 0, again: 0 };
  this._sessionStart = Date.now();
  this._renderCard();
  this._bindKeys();
};

/* ── Bind keyboard shortcuts ── */
FlashcardPage.prototype._bindKeys = function() {
  var self = this;
  this._keyHandler = function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === ' ' || e.key === 'Space') {
      e.preventDefault();
      self._toggleFlip();
    } else if (e.key === '1') { self._answer(1); }
    else if (e.key === '2') { self._answer(3); }
    else if (e.key === '3') { self._answer(5); }
  };
  document.addEventListener('keydown', this._keyHandler);
};

/* ── Render card ── */
FlashcardPage.prototype._renderCard = function() {
  if (this._index >= this._deck.length) {
    this._renderComplete();
    return;
  }
  var word = this._deck[this._index];
  this._flipped = false;

  // Build progress dots
  var vp = Store.getVocabProgress();
  var self = this;
  var dots = this._deck.map(function(w, i) {
    var p = vp[w.id];
    var cls = 'fc-dot';
    if (i < self._index) {
      cls += ' ' + (p && p.status === 'known' ? 'easy' : p && p.status === 'learning' ? 'hard' : 'again');
    } else if (i === self._index) {
      cls += ' current';
    }
    return '<span class="' + cls + '"></span>';
  });

  var synonymHtml = (word.synonyms || []).map(function(s) {
    return '<span class="badge badge-primary">' + Utils.escapeHtml(s) + '</span>';
  }).join(' ');

  this.el.innerHTML = [
    '<div class="fc-layout">',
      '<div style="display:flex;align-items:center;justify-content:space-between">',
        '<button class="btn btn-ghost btn-sm" id="fc-back-btn">← Back</button>',
        '<span class="fc-progress-label">' + (this._index + 1) + ' / ' + this._deck.length + '</span>',
      '</div>',

      '<div class="fc-progress-strip">',
        dots.join(''),
      '</div>',

      '<div class="fc-card-wrap" id="fc-card">',
        '<div class="fc-card-inner">',
          '<div class="fc-card-face fc-card-front">',
            '<div class="fc-pos">' + Utils.escapeHtml(word.pos) + '</div>',
            '<div class="fc-word">' + Utils.escapeHtml(word.word) + '</div>',
            '<div class="fc-pronunciation">' + Utils.escapeHtml(word.pronunciation || '') + '</div>',
            '<div class="fc-flip-hint">Click to reveal · Space</div>',
          '</div>',
          '<div class="fc-card-face fc-card-back">',
            '<div class="fc-section-label">Definition</div>',
            '<div class="fc-definition">' + Utils.escapeHtml(word.definition) + '</div>',
            '<div class="fc-section-label">Example</div>',
            '<div class="fc-example">' + Utils.escapeHtml(word.example) + '</div>',
            '<div class="fc-section-label">Memory Tip</div>',
            '<div class="fc-mnemonic">' + Utils.escapeHtml(word.mnemonic || '') + '</div>',
            '<div class="fc-section-label">Synonyms</div>',
            '<div class="fc-synonyms">' + synonymHtml + '</div>',
          '</div>',
        '</div>',
      '</div>',

      '<div id="fc-actions-area">',
        '<p style="text-align:center;color:var(--color-text-faint);font-size:0.875rem;padding:var(--space-4)">Click the card to reveal the definition</p>',
      '</div>',
    '</div>'
  ].join('');

  this.el.querySelector('#fc-card').addEventListener('click', function() {
    self._toggleFlip();
  });

  this.el.querySelector('#fc-back-btn').addEventListener('click', function() {
    self.destroy();
    self._renderSetup();
  });
};

FlashcardPage.prototype._toggleFlip = function() {
  this._flipped = !this._flipped;
  var card = this.el.querySelector('#fc-card');
  if (!card) return;
  card.classList.toggle('flipped', this._flipped);

  if (this._flipped) {
    this._showAnswerButtons();
  } else {
    var area = this.el.querySelector('#fc-actions-area');
    if (area) area.innerHTML = '<p style="text-align:center;color:var(--color-text-faint);font-size:0.875rem;padding:var(--space-4)">Click the card to reveal the definition</p>';
  }
};

FlashcardPage.prototype._showAnswerButtons = function() {
  var area = this.el.querySelector('#fc-actions-area');
  if (!area) return;
  var self = this;
  area.innerHTML = [
    '<div class="fc-actions">',
      '<button class="fc-btn fc-btn-again" id="fc-again">',
        '<span>Again</span>',
        '<span class="fc-btn-key">Key: 1</span>',
      '</button>',
      '<button class="fc-btn fc-btn-hard" id="fc-hard">',
        '<span>Hard</span>',
        '<span class="fc-btn-key">Key: 2</span>',
      '</button>',
      '<button class="fc-btn fc-btn-easy" id="fc-easy">',
        '<span>Easy</span>',
        '<span class="fc-btn-key">Key: 3</span>',
      '</button>',
    '</div>'
  ].join('');

  area.querySelector('#fc-again').addEventListener('click', function() { self._answer(1); });
  area.querySelector('#fc-hard').addEventListener('click',  function() { self._answer(3); });
  area.querySelector('#fc-easy').addEventListener('click',  function() { self._answer(5); });
};

FlashcardPage.prototype._answer = function(quality) {
  if (!this._flipped) {
    this._toggleFlip();
    return;
  }
  var word = this._deck[this._index];
  if (!word) return;

  // Update SM-2
  var vp = Store.getVocabProgress();
  var current = vp[word.id] || { easeFactor: 2.5, repetitions: 0, interval: 1 };
  var updated = this._sm2Update(current, quality);
  vp[word.id] = updated;
  Store.set('vocab_progress', vp);

  // Update session stats
  if (quality >= 4) this._sessionStats.easy++;
  else if (quality >= 3) this._sessionStats.hard++;
  else this._sessionStats.again++;

  this._index++;
  this._flipped = false;
  this._renderCard();
};

/* ── Session complete ── */
FlashcardPage.prototype._renderComplete = function() {
  var elapsed = Math.round((Date.now() - this._sessionStart) / 1000);
  var stats = this._sessionStats;
  var total = stats.easy + stats.hard + stats.again;

  Store.recountMastered();
  Store.logStudyMinutes(Math.round(elapsed / 60));
  Store.touchStreak();

  var self = this;
  this.el.innerHTML = [
    '<div class="fc-complete">',
      '<div class="fc-complete-icon">🎉</div>',
      '<h2 style="font-size:1.5rem;font-weight:700;margin-bottom:var(--space-2)">Session Complete!</h2>',
      '<p style="color:var(--color-text-muted);margin-bottom:var(--space-6)">You reviewed ' + total + ' words in ' + Utils.formatTime(elapsed) + '</p>',

      '<div class="fc-stats-row">',
        '<div class="fc-stat"><div class="fc-stat-val" style="color:var(--color-success)">' + stats.easy + '</div><div class="fc-stat-lbl">Easy</div></div>',
        '<div class="fc-stat"><div class="fc-stat-val" style="color:var(--color-warning)">' + stats.hard + '</div><div class="fc-stat-lbl">Hard</div></div>',
        '<div class="fc-stat"><div class="fc-stat-val" style="color:var(--color-danger)">' + stats.again + '</div><div class="fc-stat-lbl">Again</div></div>',
      '</div>',

      '<div style="display:flex;gap:var(--space-3);justify-content:center;margin-top:var(--space-6)">',
        '<button class="btn btn-primary" id="fc-again-btn">Study Again</button>',
        '<button class="btn btn-ghost" id="fc-done-btn">Done</button>',
      '</div>',
    '</div>'
  ].join('');

  this.el.querySelector('#fc-again-btn').addEventListener('click', function() {
    self._startSession();
  });

  this.el.querySelector('#fc-done-btn').addEventListener('click', function() {
    self.destroy();
    self._renderSetup();
  });
};
