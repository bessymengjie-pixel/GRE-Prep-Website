/* ─── GRE Prep — Practice Page ───────────────────────── */
function PracticePage(el) {
  this.el = el;
  this._session = null;
  this._timer = null;
  this._sessionStart = null;
}

PracticePage.prototype.init = function() {
  this._renderSetup();
};

PracticePage.prototype.destroy = function() {
  if (this._timer) { this._timer.stop(); this._timer = null; }
};

/* ── Setup screen ── */
PracticePage.prototype._renderSetup = function() {
  var settings = Store.getSettings();
  var qLen = settings.defaultQuizLength || 10;

  this.el.innerHTML = [
    '<div class="page-header">',
      '<h1 class="page-title">Practice Questions</h1>',
      '<p class="page-subtitle">Sharpen your Verbal and Quantitative skills</p>',
    '</div>',

    '<div class="pq-setup">',
      '<h3 style="font-size:1rem;font-weight:600;margin-bottom:var(--space-4)">Choose Section</h3>',
      '<div class="pq-type-grid">',
        '<div class="pq-type-card active" data-type="verbal" id="type-verbal">',
          '<div class="pq-type-icon">📖</div>',
          '<div class="pq-type-name">Verbal Reasoning</div>',
          '<div class="pq-type-desc">Reading Comprehension, Text Completion, Sentence Equivalence</div>',
        '</div>',
        '<div class="pq-type-card" data-type="quant" id="type-quant">',
          '<div class="pq-type-icon">🔢</div>',
          '<div class="pq-type-name">Quantitative Reasoning</div>',
          '<div class="pq-type-desc">Arithmetic, Algebra, Geometry, Data Interpretation</div>',
        '</div>',
      '</div>',

      '<div id="pq-subtype-area">',
        this._renderSubtypes('verbal'),
      '</div>',

      '<div class="card card-sm" style="margin-bottom:var(--space-5)">',
        '<div class="card-header"><span class="card-title">Options</span></div>',
        '<div class="pq-options-row">',
          '<span style="font-size:0.875rem;color:var(--color-text-muted)">Questions:</span>',
          '<button class="fc-filter-btn active" data-count="5" id="cnt-5">5</button>',
          '<button class="fc-filter-btn" data-count="10" id="cnt-10">10</button>',
          '<button class="fc-filter-btn" data-count="20" id="cnt-20">20</button>',
          '<span style="margin-left:auto;font-size:0.875rem;color:var(--color-text-muted)">Timer:</span>',
          '<label class="checkbox-wrap"><input type="checkbox" id="timer-toggle" ' + (settings.timerEnabled ? 'checked' : '') + '><span style="font-size:0.875rem">Enable</span></label>',
        '</div>',
      '</div>',

      '<button class="btn btn-primary btn-lg" id="pq-start-btn">Begin Practice</button>',
    '</div>'
  ].join('');

  var self = this;
  var selectedType = 'verbal';
  var selectedCount = 5;

  // Type selection
  this.el.querySelectorAll('.pq-type-card').forEach(function(card) {
    card.addEventListener('click', function() {
      self.el.querySelectorAll('.pq-type-card').forEach(function(c) { c.classList.remove('active'); });
      this.classList.add('active');
      selectedType = this.dataset.type;
      self.el.querySelector('#pq-subtype-area').innerHTML = self._renderSubtypes(selectedType);
    });
  });

  // Count selection
  this.el.querySelectorAll('[data-count]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      self.el.querySelectorAll('[data-count]').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      selectedCount = parseInt(this.dataset.count);
    });
  });

  this.el.querySelector('#pq-start-btn').addEventListener('click', function() {
    var subtypes = [];
    self.el.querySelectorAll('.pq-subtype-btn.active').forEach(function(b) {
      subtypes.push(b.dataset.subtype);
    });
    if (!subtypes.length) {
      Toast.warning('Please select at least one question type.');
      return;
    }
    var timerEnabled = self.el.querySelector('#timer-toggle').checked;
    self._startSession(selectedType, subtypes, selectedCount, timerEnabled);
  });
};

PracticePage.prototype._renderSubtypes = function(type) {
  var subtypes = type === 'verbal'
    ? [{ id:'rc', label:'Reading Comprehension' }, { id:'tc', label:'Text Completion' }, { id:'se', label:'Sentence Equivalence' }]
    : [{ id:'arithmetic', label:'Arithmetic' }, { id:'algebra', label:'Algebra' }, { id:'geometry', label:'Geometry' }, { id:'data', label:'Data' }];

  var html = '<h3 style="font-size:0.9375rem;font-weight:600;margin-bottom:var(--space-3)">Question Types</h3><div class="pq-subtype-list">';
  subtypes.forEach(function(s) {
    html += '<button class="pq-subtype-btn active" data-subtype="' + s.id + '">' + s.label + '</button>';
  });
  html += '</div>';

  // Add click binding after render
  setTimeout(function() {
    document.querySelectorAll('.pq-subtype-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        this.classList.toggle('active');
      });
    });
  }, 0);

  return html;
};

/* ── Start session ── */
PracticePage.prototype._startSession = function(type, subtypes, count, timerEnabled) {
  var pool = type === 'verbal' ? VERBAL_QUESTIONS : QUANT_QUESTIONS;
  var filtered = pool.filter(function(q) {
    return subtypes.indexOf(q.type || q.category) !== -1;
  });

  if (filtered.length < 1) {
    Toast.warning('No questions found for selected types.');
    return;
  }

  var questions = Utils.shuffle(filtered).slice(0, count);

  // Group RC questions by passage so we show passage once
  var passageCache = {};
  questions.forEach(function(q) {
    if (q.type === 'rc' && q.passage) {
      passageCache[q.passageId] = q.passage;
    }
  });

  this._session = {
    type: type,
    subtypes: subtypes,
    questions: questions,
    passageCache: passageCache,
    index: 0,
    answers: [], // { qId, selected, correct, timeSpent }
    timerEnabled: timerEnabled,
    qStart: Date.now(),
    sessionStart: Date.now(),
    submitted: false,
    reviewMode: false
  };

  this._sessionStart = Date.now();
  this._renderQuestion();
};

/* ── Render question ── */
PracticePage.prototype._renderQuestion = function() {
  var s = this._session;
  if (!s || s.index >= s.questions.length) {
    this._renderResults();
    return;
  }

  var q = s.questions[s.index];
  s.qStart = Date.now();
  var self = this;

  var timerHtml = s.timerEnabled
    ? '<div class="pq-timer-display" id="pq-timer">0:00</div>'
    : '';

  var questionHtml;
  if (q.type === 'rc') {
    var passage = s.passageCache[q.passageId] || q.passage || '';
    questionHtml = this._renderRC(q, passage);
  } else if (q.type === 'tc') {
    questionHtml = this._renderTC(q);
  } else if (q.type === 'se') {
    questionHtml = this._renderSE(q);
  } else {
    questionHtml = this._renderQuant(q);
  }

  this.el.innerHTML = [
    '<div class="pq-session">',
      '<div class="pq-header-bar">',
        '<span class="pq-counter">Question ' + (s.index + 1) + ' of ' + s.questions.length + '</span>',
        '<div style="display:flex;align-items:center;gap:var(--space-3)">',
          timerHtml,
          '<button class="btn btn-ghost btn-sm" id="pq-quit-btn">✕ Quit</button>',
        '</div>',
      '</div>',
      questionHtml,
      '<div style="display:flex;justify-content:flex-end;gap:var(--space-3);margin-top:var(--space-4)">',
        '<button class="btn btn-primary" id="pq-submit-btn">Submit Answer</button>',
      '</div>',
    '</div>'
  ].join('');

  // Start per-question timer display
  if (s.timerEnabled) {
    var timerEl = this.el.querySelector('#pq-timer');
    var start = Date.now();
    this._qTimerInterval = setInterval(function() {
      var elapsed = Math.round((Date.now() - start) / 1000);
      if (timerEl) timerEl.textContent = Utils.formatTime(elapsed);
    }, 1000);
  }

  // Quit
  this.el.querySelector('#pq-quit-btn').addEventListener('click', function() {
    if (self._qTimerInterval) clearInterval(self._qTimerInterval);
    self._renderSetup();
  });

  // Submit
  this.el.querySelector('#pq-submit-btn').addEventListener('click', function() {
    self._submitAnswer(q);
  });
};

PracticePage.prototype._renderRC = function(q, passage) {
  var optHtml = (q.options || []).map(function(opt, i) {
    var letter = opt.charAt(0);
    return '<div class="pq-option" data-letter="' + letter + '" data-idx="' + i + '">' +
      '<div class="pq-option-letter">' + letter + '</div>' +
      '<div class="pq-option-text">' + Utils.escapeHtml(opt.substring(3)) + '</div>' +
    '</div>';
  }).join('');

  var passageHtml = passage
    ? '<div class="pq-passage">' + Utils.escapeHtml(passage) + '</div>'
    : '';

  var inner = [
    '<div class="pq-question-text">' + Utils.escapeHtml(q.question) + '</div>',
    '<div class="pq-options" id="pq-options">' + optHtml + '</div>',
    '<div class="pq-explanation" id="pq-explanation">',
      '<div class="pq-explanation-title">Explanation</div>',
      '<div class="pq-explanation-text">' + Utils.escapeHtml(q.explanation || '') + '</div>',
    '</div>'
  ].join('');

  var html;
  if (passageHtml) {
    html = '<div class="pq-rc-layout"><div>' + passageHtml + '</div><div><div class="pq-card">' + inner + '</div></div></div>';
  } else {
    html = '<div class="pq-card">' + inner + '</div>';
  }

  setTimeout(function() {
    document.querySelectorAll('.pq-option').forEach(function(opt) {
      opt.addEventListener('click', function() {
        document.querySelectorAll('.pq-option').forEach(function(o) { o.classList.remove('selected'); });
        this.classList.add('selected');
      });
    });
  }, 0);

  return html;
};

PracticePage.prototype._renderTC = function(q) {
  var blanksHtml = '';
  for (var b = 0; b < q.blanks; b++) {
    var opts = (q.blankOptions || [])[b] || [];
    blanksHtml += '<div class="pq-tc-blank-group"><div class="pq-blank-label">Blank ' + ['I','II','III'][b] + '</div><div class="pq-options" id="pq-blank-' + b + '">';
    opts.forEach(function(opt) {
      var letter = opt.charAt(0);
      blanksHtml += '<div class="pq-option" data-letter="' + letter + '" data-blank="' + b + '">' +
        '<div class="pq-option-letter">' + letter + '</div>' +
        '<div class="pq-option-text">' + Utils.escapeHtml(opt.substring(3)) + '</div>' +
      '</div>';
    });
    blanksHtml += '</div></div>';
  }

  var html = [
    '<div class="pq-card">',
      '<div class="pq-question-text">' + Utils.escapeHtml(q.question) + '</div>',
      blanksHtml,
      '<div class="pq-explanation" id="pq-explanation">',
        '<div class="pq-explanation-title">Explanation</div>',
        '<div class="pq-explanation-text">' + Utils.escapeHtml(q.explanation || '') + '</div>',
      '</div>',
    '</div>'
  ].join('');

  setTimeout(function() {
    document.querySelectorAll('.pq-option[data-blank]').forEach(function(opt) {
      opt.addEventListener('click', function() {
        var blank = this.dataset.blank;
        document.querySelectorAll('.pq-option[data-blank="' + blank + '"]').forEach(function(o) { o.classList.remove('selected'); });
        this.classList.add('selected');
      });
    });
  }, 0);

  return html;
};

PracticePage.prototype._renderSE = function(q) {
  var optHtml = (q.options || []).map(function(opt) {
    var letter = opt.charAt(0);
    return '<div class="pq-option" data-letter="' + letter + '">' +
      '<div class="pq-option-letter">' + letter + '</div>' +
      '<div class="pq-option-text">' + Utils.escapeHtml(opt.substring(3)) + '</div>' +
    '</div>';
  }).join('');

  var html = [
    '<div class="pq-card">',
      '<div class="pq-se-hint">Select exactly TWO answer choices that best complete the sentence and produce sentences alike in meaning.</div>',
      '<div class="pq-question-text">' + Utils.escapeHtml(q.question) + '</div>',
      '<div class="pq-options" id="pq-options">' + optHtml + '</div>',
      '<div class="pq-explanation" id="pq-explanation">',
        '<div class="pq-explanation-title">Explanation</div>',
        '<div class="pq-explanation-text">' + Utils.escapeHtml(q.explanation || '') + '</div>',
      '</div>',
    '</div>'
  ].join('');

  setTimeout(function() {
    document.querySelectorAll('#pq-options .pq-option').forEach(function(opt) {
      opt.addEventListener('click', function() {
        var selected = document.querySelectorAll('#pq-options .pq-option.selected');
        if (this.classList.contains('selected')) {
          this.classList.remove('selected');
        } else if (selected.length < 2) {
          this.classList.add('selected');
        }
      });
    });
  }, 0);

  return html;
};

PracticePage.prototype._renderQuant = function(q) {
  var optHtml = (q.options || []).map(function(opt) {
    var letter = opt.charAt(0);
    return '<div class="pq-option" data-letter="' + letter + '">' +
      '<div class="pq-option-letter">' + letter + '</div>' +
      '<div class="pq-option-text">' + Utils.escapeHtml(opt.substring(3)) + '</div>' +
    '</div>';
  }).join('');

  var categoryBadge = '<span class="badge badge-primary" style="text-transform:capitalize">' + (q.category || q.type) + '</span>';

  var html = [
    '<div class="pq-card">',
      '<div style="margin-bottom:var(--space-3)">' + categoryBadge + '</div>',
      '<div class="pq-question-text" style="white-space:pre-line">' + Utils.escapeHtml(q.question) + '</div>',
      '<div class="pq-options" id="pq-options">' + optHtml + '</div>',
      '<div class="pq-explanation" id="pq-explanation">',
        '<div class="pq-explanation-title">Explanation</div>',
        '<div class="pq-explanation-text">' + Utils.escapeHtml(q.explanation || '') + '</div>',
      '</div>',
    '</div>'
  ].join('');

  setTimeout(function() {
    document.querySelectorAll('.pq-option').forEach(function(opt) {
      opt.addEventListener('click', function() {
        document.querySelectorAll('.pq-option').forEach(function(o) { o.classList.remove('selected'); });
        this.classList.add('selected');
      });
    });
  }, 0);

  return html;
};

/* ── Submit answer ── */
PracticePage.prototype._submitAnswer = function(q) {
  var s = this._session;
  if (s.submitted) return;
  if (this._qTimerInterval) { clearInterval(this._qTimerInterval); this._qTimerInterval = null; }

  var timeSpent = Math.round((Date.now() - s.qStart) / 1000);
  var selected, correct, isCorrect;

  if (q.type === 'tc') {
    selected = [];
    for (var b = 0; b < q.blanks; b++) {
      var sel = this.el.querySelector('.pq-option[data-blank="' + b + '"].selected');
      selected.push(sel ? sel.dataset.letter : null);
    }
    correct = Array.isArray(q.correct) ? q.correct : [q.correct];
    isCorrect = selected.every(function(l, i) { return l === correct[i]; });
  } else if (q.type === 'se') {
    selected = [];
    this.el.querySelectorAll('#pq-options .pq-option.selected').forEach(function(o) {
      selected.push(o.dataset.letter);
    });
    correct = Array.isArray(q.correct) ? q.correct.slice().sort() : [q.correct];
    isCorrect = selected.length === correct.length && selected.slice().sort().join('') === correct.join('');
    if (selected.length !== 2) {
      Toast.warning('Please select exactly two answers.');
      return;
    }
  } else {
    var selEl = this.el.querySelector('.pq-option.selected');
    if (!selEl) { Toast.warning('Please select an answer.'); return; }
    selected = selEl.dataset.letter;
    correct = q.correct;
    isCorrect = selected === correct;
  }

  s.submitted = true;

  // Visual feedback
  var self = this;
  if (q.type === 'tc') {
    for (var b = 0; b < q.blanks; b++) {
      var cLetter = (Array.isArray(q.correct) ? q.correct[b] : q.correct);
      this.el.querySelectorAll('.pq-option[data-blank="' + b + '"]').forEach(function(opt) {
        if (opt.dataset.letter === cLetter) opt.classList.add('show-correct');
        if (opt.classList.contains('selected') && opt.dataset.letter !== cLetter) opt.classList.add('incorrect');
      });
    }
  } else if (q.type === 'se') {
    var corrArr = Array.isArray(q.correct) ? q.correct : [q.correct];
    this.el.querySelectorAll('#pq-options .pq-option').forEach(function(opt) {
      var l = opt.dataset.letter;
      if (corrArr.indexOf(l) !== -1) opt.classList.add('show-correct');
      if (opt.classList.contains('selected') && corrArr.indexOf(l) === -1) opt.classList.add('incorrect');
    });
  } else {
    this.el.querySelectorAll('.pq-option').forEach(function(opt) {
      if (opt.dataset.letter === correct) opt.classList.add('show-correct');
      if (opt.classList.contains('selected') && opt.dataset.letter !== correct) opt.classList.add('incorrect');
    });
  }

  // Show explanation
  var exp = this.el.querySelector('#pq-explanation');
  if (exp) exp.classList.add('visible');

  // Record answer
  s.answers.push({ qId: q.id, correct: isCorrect, timeSpent: timeSpent });

  // Replace submit button with Next
  var footer = this.el.querySelector('.pq-session > div:last-child');
  if (footer) {
    var nextLabel = s.index + 1 >= s.questions.length ? 'See Results' : 'Next Question →';
    footer.innerHTML = [
      '<span style="font-size:0.875rem;font-weight:600;color:' + (isCorrect ? 'var(--color-success)' : 'var(--color-danger)') + '">',
        isCorrect ? '✓ Correct!' : '✗ Incorrect',
      '</span>',
      '<button class="btn btn-primary" id="pq-next-btn">' + nextLabel + '</button>'
    ].join('');
    footer.querySelector('#pq-next-btn').addEventListener('click', function() {
      s.index++;
      s.submitted = false;
      self._renderQuestion();
    });
  }
};

/* ── Results screen ── */
PracticePage.prototype._renderResults = function() {
  var s = this._session;
  var elapsed = Math.round((Date.now() - s.sessionStart) / 1000);
  var correct = s.answers.filter(function(a) { return a.correct; }).length;
  var total = s.answers.length;
  var pct = total ? Math.round((correct / total) * 100) : 0;

  // Save to store
  var history = Store.getPracticeHistory();
  history.push({
    sessionId: Utils.generateId('sess'),
    date: Utils.dateKey(),
    type: s.type,
    subtypes: s.subtypes,
    questionsAttempted: total,
    correct: correct,
    timeTaken: elapsed,
    questionLog: s.answers
  });
  Store.set('practice_history', history);
  Store.update('progress_meta', function(meta) {
    meta = meta || Store.getProgressMeta();
    meta.practiceSessionCount = (meta.practiceSessionCount || 0) + 1;
    return meta;
  }, Store.getProgressMeta());
  Store.logStudyMinutes(Math.round(elapsed / 60));
  Store.touchStreak();

  var self = this;
  this.el.innerHTML = [
    '<div class="page-header">',
      '<h1 class="page-title">Session Complete</h1>',
    '</div>',
    '<div class="pq-results">',
      '<div class="pq-score-circle">',
        '<div class="pq-score-pct">' + pct + '%</div>',
        '<div class="pq-score-lbl">Score</div>',
      '</div>',

      '<div class="pq-results-grid">',
        '<div class="stat-card"><div class="stat-card-label">Correct</div><div class="stat-card-value" style="color:var(--color-success)">' + correct + '</div></div>',
        '<div class="stat-card"><div class="stat-card-label">Incorrect</div><div class="stat-card-value" style="color:var(--color-danger)">' + (total - correct) + '</div></div>',
        '<div class="stat-card"><div class="stat-card-label">Time</div><div class="stat-card-value">' + Utils.formatTime(elapsed) + '</div></div>',
      '</div>',

      '<div style="display:flex;justify-content:center;gap:var(--space-3)">',
        '<button class="btn btn-primary" id="pq-new-btn">New Session</button>',
        '<button class="btn btn-ghost" id="pq-review-btn">Review Answers</button>',
      '</div>',
    '</div>'
  ].join('');

  this.el.querySelector('#pq-new-btn').addEventListener('click', function() {
    self._renderSetup();
  });

  this.el.querySelector('#pq-review-btn').addEventListener('click', function() {
    self._renderReview();
  });
};

/* ── Review answers ── */
PracticePage.prototype._renderReview = function() {
  var s = this._session;
  var self = this;

  var itemsHtml = s.questions.map(function(q, i) {
    var ans = s.answers[i] || {};
    var icon = ans.correct ? '✓' : '✗';
    var color = ans.correct ? 'var(--color-success)' : 'var(--color-danger)';
    return [
      '<div class="card card-sm" style="margin-bottom:var(--space-3)">',
        '<div style="display:flex;align-items:flex-start;gap:var(--space-3)">',
          '<span style="font-size:1.25rem;color:' + color + ';flex-shrink:0">' + icon + '</span>',
          '<div style="flex:1">',
            '<div style="font-size:0.875rem;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:var(--space-1)">' + (q.type || q.category).toUpperCase() + '</div>',
            '<div style="font-size:0.9375rem;margin-bottom:var(--space-2)">' + Utils.escapeHtml((q.question || '').substring(0, 120)) + (q.question && q.question.length > 120 ? '...' : '') + '</div>',
            '<div style="font-size:0.875rem;color:var(--color-text-muted)"><strong>Correct:</strong> ' + Utils.escapeHtml(Array.isArray(q.correct) ? q.correct.join(', ') : q.correct) + '</div>',
            '<div style="font-size:0.875rem;color:var(--color-text-secondary);margin-top:var(--space-2)">' + Utils.escapeHtml(q.explanation || '') + '</div>',
          '</div>',
        '</div>',
      '</div>'
    ].join('');
  }).join('');

  this.el.innerHTML = [
    '<div class="page-header" style="display:flex;align-items:center;gap:var(--space-4)">',
      '<button class="btn btn-ghost btn-sm" id="pq-back-btn">← Back to Results</button>',
      '<h1 class="page-title">Review Answers</h1>',
    '</div>',
    itemsHtml
  ].join('');

  this.el.querySelector('#pq-back-btn').addEventListener('click', function() {
    self._renderResults();
  });
};
