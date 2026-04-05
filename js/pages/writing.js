/* ─── GRE Prep — Writing Page ────────────────────────── */
function WritingPage(el) {
  this.el = el;
  this._mode = 'setup'; // 'setup' | 'writing' | 'review' | 'essays'
  this._essayType = 'issue';
  this._currentPrompt = null;
  this._timer = null;
  this._wordCountInterval = null;
}

WritingPage.prototype.init = function() {
  this._renderSetup();
};

WritingPage.prototype.destroy = function() {
  if (this._timer) { this._timer.stop(); this._timer = null; }
  if (this._wordCountInterval) { clearInterval(this._wordCountInterval); this._wordCountInterval = null; }
};

/* ── AWA rubric ── */
WritingPage.prototype._RUBRIC = {
  issue: [
    { score: 6, desc: "Presents a cogent, well-articulated critique or analysis with compelling reasons, extensive evidence, and complex reasoning. Ideas are organized clearly; language is precise." },
    { score: 5, desc: "Presents a generally thoughtful, well-developed analysis. Reasons and examples are relevant and clear, with minor lapses in organization or precision." },
    { score: 4, desc: "Presents a competent analysis with adequate reasons and examples. Some clarity and organization, but reasoning may be underdeveloped in places." },
    { score: 3, desc: "Presents limited analysis with some relevant reasons, but development is superficial. Organization is recognizable but flawed." },
    { score: 2, desc: "Presents an incomplete or unfocused response. Reasoning is simplistic; examples are irrelevant or absent. Significant language errors." },
    { score: 1, desc: "Fundamental deficiencies in analytical writing. No logical development; ideas are incoherent or unrelated to the task." }
  ],
  argument: [
    { score: 6, desc: "Identifies and analyzes all major flaws in the argument with penetrating insight. Considers alternative explanations and unexamined assumptions throughout." },
    { score: 5, desc: "Identifies and analyzes most major flaws with clarity. Occasional omissions or minor analytical lapses." },
    { score: 4, desc: "Identifies and analyzes several flaws, but analysis may be incomplete or somewhat superficial in places." },
    { score: 3, desc: "Identifies some flaws but analysis is limited or poorly developed. Does not fully address assumptions." },
    { score: 2, desc: "Identifies only one or two obvious flaws; analysis is superficial. May summarize rather than critique." },
    { score: 1, desc: "Fails to identify meaningful flaws or merely restates the argument. Fundamentally deficient." }
  ]
};

/* ── Setup / Tab selection ── */
WritingPage.prototype._renderSetup = function() {
  var essays = Store.getWritingEssays();
  var self = this;

  var recentHtml = '';
  if (essays.length) {
    var recent = essays.slice(-5).reverse();
    recentHtml = [
      '<div class="card" style="margin-top:var(--space-8)">',
        '<div class="card-header"><span class="card-title">Past Essays (' + essays.length + ')</span>',
          '<button class="btn btn-ghost btn-sm" id="all-essays-btn">View All</button>',
        '</div>',
        recent.map(function(e) {
          return [
            '<div class="wt-essay-item" data-id="' + e.essayId + '">',
              '<div class="wt-essay-meta">',
                '<div class="wt-essay-title">' + Utils.escapeHtml((e.promptText || '').substring(0, 80)) + (e.promptText && e.promptText.length > 80 ? '...' : '') + '</div>',
                '<div class="wt-essay-info">',
                  '<span class="badge ' + (e.type === 'issue' ? 'badge-primary' : 'badge-warning') + '">' + (e.type === 'issue' ? 'Issue' : 'Argument') + '</span> &nbsp;',
                  Utils.formatDate(e.date) + ' · ' + e.wordCount + ' words · ' + Utils.formatTime(e.timeTaken),
                '</div>',
              '</div>',
              '<span style="color:var(--color-text-faint)">›</span>',
            '</div>'
          ].join('');
        }).join(''),
      '</div>'
    ].join('');
  }

  this.el.innerHTML = [
    '<div class="page-header">',
      '<h1 class="page-title">Analytical Writing</h1>',
      '<p class="page-subtitle">Practice timed AWA essays — Issue and Argument tasks</p>',
    '</div>',

    '<div class="tab-bar">',
      '<button class="tab-btn' + (this._essayType === 'issue' ? ' active' : '') + '" data-tab="issue">Issue Task</button>',
      '<button class="tab-btn' + (this._essayType === 'argument' ? ' active' : '') + '" data-tab="argument">Argument Task</button>',
    '</div>',

    '<div id="wt-tab-content">',
      this._renderTypeSetup(this._essayType),
    '</div>',

    recentHtml
  ].join('');

  // Tab switching
  this.el.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      self.el.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      self._essayType = this.dataset.tab;
      self.el.querySelector('#wt-tab-content').innerHTML = self._renderTypeSetup(self._essayType);
      self._bindTypeSetup();
    });
  });

  this._bindTypeSetup();

  // Past essays
  this.el.querySelectorAll('.wt-essay-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var id = this.dataset.id;
      var essay = Store.getWritingEssays().find(function(e) { return e.essayId === id; });
      if (essay) self._reviewEssay(essay);
    });
  });

  var allBtn = this.el.querySelector('#all-essays-btn');
  if (allBtn) allBtn.addEventListener('click', function() { self._showAllEssays(); });
};

WritingPage.prototype._renderTypeSetup = function(type) {
  var prompts = type === 'issue' ? ISSUE_PROMPTS : ARGUMENT_PROMPTS;
  var prompt = prompts[Math.floor(Math.random() * prompts.length)];
  // Store the prompt so we can reference it
  this._currentPrompt = prompt;

  return [
    '<div class="wt-prompt-card" id="wt-prompt-card">',
      '<div class="wt-prompt-type">' + (type === 'issue' ? 'Issue Task' : 'Argument Task') + '</div>',
      '<div class="wt-prompt-text">"' + Utils.escapeHtml(prompt.prompt) + '"</div>',
      '<div class="wt-directions">' + Utils.escapeHtml(prompt.taskDirections) + '</div>',
    '</div>',
    '<div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-5)">',
      '<button class="btn btn-primary btn-lg" id="wt-start-btn">Start Writing (30 min)</button>',
      '<button class="btn btn-ghost" id="wt-new-prompt-btn">New Prompt</button>',
    '</div>'
  ].join('');
};

WritingPage.prototype._bindTypeSetup = function() {
  var self = this;
  var startBtn = this.el.querySelector('#wt-start-btn');
  var newBtn = this.el.querySelector('#wt-new-prompt-btn');

  if (startBtn) {
    startBtn.addEventListener('click', function() {
      self._startWriting();
    });
  }

  if (newBtn) {
    newBtn.addEventListener('click', function() {
      var prompts = self._essayType === 'issue' ? ISSUE_PROMPTS : ARGUMENT_PROMPTS;
      self._currentPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      var card = self.el.querySelector('#wt-prompt-card');
      if (card) {
        card.querySelector('.wt-prompt-text').textContent = '"' + self._currentPrompt.prompt + '"';
        card.querySelector('.wt-directions').textContent = self._currentPrompt.taskDirections;
      }
    });
  }
};

/* ── Writing mode ── */
WritingPage.prototype._startWriting = function() {
  var prompt = this._currentPrompt;
  if (!prompt) return;
  var self = this;

  var rubricScores = this._RUBRIC[this._essayType].map(function(s) {
    return [
      '<div class="wt-score-row">',
        '<div class="wt-score-num wt-score-' + s.score + '">' + s.score + '</div>',
        '<div class="wt-score-desc">' + Utils.escapeHtml(s.desc) + '</div>',
      '</div>'
    ].join('');
  }).join('');

  this.el.innerHTML = [
    '<div class="page-header" style="display:flex;align-items:center;justify-content:space-between">',
      '<div>',
        '<h1 class="page-title">' + (this._essayType === 'issue' ? 'Issue Essay' : 'Argument Essay') + '</h1>',
        '<p class="page-subtitle">' + Utils.escapeHtml((prompt.prompt || '').substring(0, 100)) + '...</p>',
      '</div>',
      '<button class="btn btn-ghost btn-sm" id="wt-quit-btn">Quit</button>',
    '</div>',

    '<div class="wt-layout">',
      '<div>',
        '<div class="wt-timer-bar">',
          '<canvas class="wt-timer-ring" id="wt-timer-ring" width="48" height="48"></canvas>',
          '<div class="wt-timer-value" id="wt-timer-val">30:00</div>',
          '<button class="btn btn-ghost btn-sm" id="wt-pause-btn">Pause</button>',
          '<button class="btn btn-primary btn-sm" id="wt-submit-btn">Submit Essay</button>',
        '</div>',

        '<div class="wt-textarea-wrap">',
          '<textarea class="wt-textarea" id="wt-essay" placeholder="Begin your essay here..."></textarea>',
          '<div class="wt-word-count" id="wt-wc">0 words</div>',
        '</div>',
      '</div>',

      '<div class="wt-sidebar">',
        '<div class="wt-rubric-card">',
          '<button class="wt-rubric-toggle" id="rubric-toggle">',
            'AWA Scoring Rubric <span class="wt-rubric-toggle-arrow">▼</span>',
          '</button>',
          '<div class="wt-rubric-body" id="rubric-body">',
            rubricScores,
          '</div>',
        '</div>',
      '</div>',
    '</div>'
  ].join('');

  // Word count
  var textarea = this.el.querySelector('#wt-essay');
  var wcEl = this.el.querySelector('#wt-wc');
  textarea.addEventListener('input', function() {
    var wc = Utils.wordCount(this.value);
    if (wcEl) wcEl.textContent = wc + ' word' + (wc !== 1 ? 's' : '');
  });

  // Timer
  var canvas = this.el.querySelector('#wt-timer-ring');
  var timerVal = this.el.querySelector('#wt-timer-val');
  var paused = false;

  this._timer = new CountdownTimer({
    duration: 30 * 60,
    canvasEl: canvas,
    onTick: function(remaining) {
      if (timerVal) {
        timerVal.textContent = Utils.formatTime(remaining);
        timerVal.className = 'wt-timer-value' + (remaining < 120 ? ' danger' : remaining < 600 ? ' warning' : '');
      }
    },
    onComplete: function() {
      if (textarea) textarea.readOnly = true;
      Toast.warning('Time is up! Your essay has been saved.');
      self._saveEssay(textarea.value, 30 * 60);
    }
  });
  this._timer.start();

  // Pause/resume
  this.el.querySelector('#wt-pause-btn').addEventListener('click', function() {
    if (paused) {
      self._timer.start();
      this.textContent = 'Pause';
      paused = false;
    } else {
      self._timer.pause();
      this.textContent = 'Resume';
      paused = true;
    }
  });

  // Submit
  this.el.querySelector('#wt-submit-btn').addEventListener('click', function() {
    var elapsed = 30 * 60 - Math.round(self._timer.getRemaining());
    self._timer.stop();
    if (textarea) textarea.readOnly = true;
    self._saveEssay(textarea.value, elapsed);
  });

  // Quit
  this.el.querySelector('#wt-quit-btn').addEventListener('click', function() {
    self._timer.stop();
    self._renderSetup();
  });

  // Rubric toggle
  this.el.querySelector('#rubric-toggle').addEventListener('click', function() {
    this.classList.toggle('open');
    var body = self.el.querySelector('#rubric-body');
    if (body) body.classList.toggle('open');
  });
};

/* ── Save essay ── */
WritingPage.prototype._saveEssay = function(text, timeTaken) {
  var prompt = this._currentPrompt;
  if (!prompt) return;
  var wc = Utils.wordCount(text);

  var essay = {
    essayId: Utils.generateId('essay'),
    date: Utils.dateKey(),
    type: this._essayType,
    promptId: prompt.id,
    promptText: prompt.prompt,
    essayText: text,
    wordCount: wc,
    timeTaken: timeTaken,
    selfScore: null
  };

  Store.update('writing_essays', function(arr) {
    arr = arr || [];
    arr.push(essay);
    return arr;
  }, []);

  Store.update('progress_meta', function(meta) {
    meta = meta || Store.getProgressMeta();
    meta.essayCount = (meta.essayCount || 0) + 1;
    return meta;
  }, Store.getProgressMeta());

  Store.logStudyMinutes(Math.round(timeTaken / 60));
  Store.touchStreak();

  this._reviewEssay(essay, true);
};

/* ── Review essay ── */
WritingPage.prototype._reviewEssay = function(essay, justCompleted) {
  var self = this;
  var rubricScores = this._RUBRIC[essay.type || 'issue'].map(function(s) {
    return [
      '<div class="wt-score-row">',
        '<div class="wt-score-num wt-score-' + s.score + '">' + s.score + '</div>',
        '<div class="wt-score-desc">' + Utils.escapeHtml(s.desc) + '</div>',
      '</div>'
    ].join('');
  }).join('');

  var scoreHtml = [1,2,3,4,5,6].map(function(n) {
    return '<button class="wt-score-btn' + (essay.selfScore === n ? ' selected' : '') + '" data-score="' + n + '">' + n + '</button>';
  }).join('');

  this.el.innerHTML = [
    '<div class="page-header" style="display:flex;align-items:center;gap:var(--space-4)">',
      '<button class="btn btn-ghost btn-sm" id="wt-back-btn">← Back</button>',
      '<div>',
        '<h1 class="page-title">' + (justCompleted ? 'Essay Saved!' : 'Essay Review') + '</h1>',
        '<p class="page-subtitle">' + Utils.formatDate(essay.date) + ' · ' + essay.wordCount + ' words · ' + Utils.formatTime(essay.timeTaken) + '</p>',
      '</div>',
    '</div>',

    '<div class="wt-review">',
      '<div class="wt-prompt-card" style="margin-bottom:var(--space-5)">',
        '<div class="wt-prompt-type">' + (essay.type === 'issue' ? 'Issue Task' : 'Argument Task') + '</div>',
        '<div class="wt-prompt-text">"' + Utils.escapeHtml(essay.promptText || '') + '"</div>',
      '</div>',

      '<div class="card" style="margin-bottom:var(--space-5)">',
        '<div class="card-header"><span class="card-title">Your Essay</span></div>',
        '<div class="wt-review-essay">' + Utils.escapeHtml(essay.essayText || '') + '</div>',
      '</div>',

      '<div class="card" style="margin-bottom:var(--space-5)">',
        '<div class="card-header"><span class="card-title">Self-Score (optional)</span></div>',
        '<p style="font-size:0.875rem;color:var(--color-text-muted);margin-bottom:var(--space-3)">Based on the rubric below, how would you rate this essay?</p>',
        '<div class="wt-self-score">' + scoreHtml + '</div>',
      '</div>',

      '<div class="wt-rubric-card">',
        '<button class="wt-rubric-toggle open" id="rubric-toggle">',
          'AWA Scoring Rubric <span class="wt-rubric-toggle-arrow">▼</span>',
        '</button>',
        '<div class="wt-rubric-body open" id="rubric-body">' + rubricScores + '</div>',
      '</div>',
    '</div>'
  ].join('');

  this.el.querySelector('#wt-back-btn').addEventListener('click', function() {
    self._renderSetup();
  });

  // Self-score buttons
  this.el.querySelectorAll('.wt-score-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      self.el.querySelectorAll('.wt-score-btn').forEach(function(b) { b.classList.remove('selected'); });
      this.classList.add('selected');
      var score = parseInt(this.dataset.score);
      // Update essay in store
      Store.update('writing_essays', function(arr) {
        arr = arr || [];
        var found = arr.find(function(e) { return e.essayId === essay.essayId; });
        if (found) found.selfScore = score;
        return arr;
      }, []);
      Toast.success('Self-score saved: ' + score + '/6');
    });
  });

  // Rubric toggle
  this.el.querySelector('#rubric-toggle').addEventListener('click', function() {
    this.classList.toggle('open');
    self.el.querySelector('#rubric-body').classList.toggle('open');
  });
};

/* ── All essays ── */
WritingPage.prototype._showAllEssays = function() {
  var essays = Store.getWritingEssays().slice().reverse();
  var self = this;

  var listHtml = essays.length ? essays.map(function(e) {
    return [
      '<div class="wt-essay-item" data-id="' + e.essayId + '">',
        '<div class="wt-essay-meta">',
          '<div class="wt-essay-title">' + Utils.escapeHtml((e.promptText || '').substring(0, 100)) + '</div>',
          '<div class="wt-essay-info">',
            '<span class="badge ' + (e.type === 'issue' ? 'badge-primary' : 'badge-warning') + '">' + (e.type === 'issue' ? 'Issue' : 'Argument') + '</span> &nbsp;',
            Utils.formatDate(e.date) + ' · ' + e.wordCount + ' words' + (e.selfScore ? ' · Score: ' + e.selfScore + '/6' : ''),
          '</div>',
        '</div>',
        '<span style="color:var(--color-text-faint)">›</span>',
      '</div>'
    ].join('');
  }).join('') : '<div class="empty-state"><div class="empty-state-icon">✍️</div><p class="empty-state-title">No essays yet</p></div>';

  this.el.innerHTML = [
    '<div class="page-header" style="display:flex;align-items:center;gap:var(--space-4)">',
      '<button class="btn btn-ghost btn-sm" id="wt-back-btn">← Back</button>',
      '<h1 class="page-title">All Essays</h1>',
    '</div>',
    '<div class="wt-essays-list">' + listHtml + '</div>'
  ].join('');

  this.el.querySelector('#wt-back-btn').addEventListener('click', function() {
    self._renderSetup();
  });

  this.el.querySelectorAll('.wt-essay-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var id = this.dataset.id;
      var essay = Store.getWritingEssays().find(function(e) { return e.essayId === id; });
      if (essay) self._reviewEssay(essay);
    });
  });
};
