/* ─── GRE Prep — Progress Dashboard ─────────────────── */
function ProgressPage(el) {
  this.el = el;
  this._charts = [];
  this._resizeHandler = null;
}

ProgressPage.prototype.init = function() {
  this._render();
  var self = this;
  this._resizeHandler = Utils.debounce(function() { self._redrawCharts(); }, 200);
  window.addEventListener('resize', this._resizeHandler);
};

ProgressPage.prototype.destroy = function() {
  if (this._resizeHandler) {
    window.removeEventListener('resize', this._resizeHandler);
    this._resizeHandler = null;
  }
};

ProgressPage.prototype._render = function() {
  var meta = Store.getProgressMeta();
  var vp = Store.getVocabProgress();
  var history = Store.getPracticeHistory();
  var essays = Store.getWritingEssays();
  var today = Utils.dateKey();
  var totalWords = VOCAB_LIST.length;

  // Compute stats
  var mastered = Object.values(vp).filter(function(v) { return v.status === 'known'; }).length;
  var learning = Object.values(vp).filter(function(v) { return v.status === 'learning'; }).length;
  var unknown  = Object.values(vp).filter(function(v) { return v.status === 'unknown'; }).length;
  var unseen   = totalWords - mastered - learning - unknown;

  var masteredPct = totalWords ? Math.round((mastered / totalWords) * 100) : 0;
  var streak = meta.currentStreak || 0;

  // Practice accuracy
  var totalCorrect = 0, totalAttempted = 0;
  history.forEach(function(s) {
    totalCorrect  += s.correct || 0;
    totalAttempted += s.questionsAttempted || 0;
  });
  var accuracy = totalAttempted ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  // Daily goal
  var dailyGoal = meta.dailyGoalMinutes || 60;
  var todayMins = (meta.dailyMinutesLog || {})[today] || 0;
  var goalPct = Math.min(100, Math.round((todayMins / dailyGoal) * 100));

  // Activity feed (last 10 events)
  var events = [];
  history.slice(-6).forEach(function(s) {
    events.push({ date: s.date, text: s.type + ' practice — ' + s.correct + '/' + s.questionsAttempted + ' correct', type: 'practice' });
  });
  essays.slice(-4).forEach(function(e) {
    events.push({ date: e.date, text: (e.type === 'issue' ? 'Issue' : 'Argument') + ' essay — ' + e.wordCount + ' words', type: 'writing' });
  });
  events.sort(function(a, b) { return b.date.localeCompare(a.date); });
  events = events.slice(0, 10);

  var activityHtml = events.length ? events.map(function(ev) {
    return [
      '<div class="pg-activity-item">',
        '<div class="pg-activity-dot ' + ev.type + '"></div>',
        '<div class="pg-activity-text">' + Utils.escapeHtml(ev.text) + '</div>',
        '<div class="pg-activity-date">' + Utils.formatDateShort(ev.date) + '</div>',
      '</div>'
    ].join('');
  }).join('') : '<div style="color:var(--color-text-faint);font-size:0.875rem;padding:var(--space-4) 0">No activity yet — start studying!</div>';

  // Study minutes last 14 days
  var logData = meta.dailyMinutesLog || {};
  var lineLabels = [], lineValues = [];
  for (var i = 13; i >= 0; i--) {
    var d = Utils.offsetDate(-i);
    lineLabels.push(Utils.formatDateShort(d).split(' ')[0]); // Just month/day
    lineValues.push(logData[d] || 0);
  }

  // Accuracy by category
  var catStats = {};
  history.forEach(function(s) {
    var key = (s.subtypes && s.subtypes[0]) || s.type || 'other';
    if (!catStats[key]) catStats[key] = { correct: 0, total: 0 };
    catStats[key].correct += s.correct || 0;
    catStats[key].total   += s.questionsAttempted || 0;
  });
  var barLabels = Object.keys(catStats).slice(0, 6);
  var barValues = barLabels.map(function(k) {
    return catStats[k].total ? Math.round((catStats[k].correct / catStats[k].total) * 100) : 0;
  });

  this.el.innerHTML = [
    '<div class="page-header">',
      '<h1 class="page-title">Dashboard</h1>',
      '<p class="page-subtitle">Your GRE preparation at a glance</p>',
    '</div>',

    /* Hero stats */
    '<div class="pg-stats-grid">',
      '<div class="pg-stat-card">',
        '<div class="pg-stat-icon vocab">📚</div>',
        '<div class="pg-stat-value">' + masteredPct + '%</div>',
        '<div class="pg-stat-label">Vocab Mastered</div>',
        '<div class="pg-stat-sub">' + mastered + ' of ' + totalWords + ' words</div>',
      '</div>',
      '<div class="pg-stat-card">',
        '<div class="pg-stat-icon streak">🔥</div>',
        '<div class="pg-stat-value">' + streak + '</div>',
        '<div class="pg-stat-label">Day Streak</div>',
        '<div class="pg-stat-sub">Best: ' + (meta.longestStreak || 0) + ' days</div>',
      '</div>',
      '<div class="pg-stat-card">',
        '<div class="pg-stat-icon accuracy">✓</div>',
        '<div class="pg-stat-value">' + accuracy + '%</div>',
        '<div class="pg-stat-label">Practice Accuracy</div>',
        '<div class="pg-stat-sub">' + totalCorrect + ' of ' + totalAttempted + ' correct</div>',
      '</div>',
      '<div class="pg-stat-card">',
        '<div class="pg-stat-icon writing">✍️</div>',
        '<div class="pg-stat-value">' + essays.length + '</div>',
        '<div class="pg-stat-label">Essays Written</div>',
        '<div class="pg-stat-sub">' + (meta.practiceSessionCount || 0) + ' practice sessions</div>',
      '</div>',
    '</div>',

    /* Charts row */
    '<div class="pg-charts-row">',
      '<div class="pg-chart-card">',
        '<div class="pg-chart-title">Study Time — Last 14 Days (minutes)</div>',
        '<canvas class="pg-chart-canvas" id="line-chart" height="180"></canvas>',
      '</div>',
      '<div class="pg-chart-card">',
        '<div class="pg-chart-title">Vocabulary</div>',
        '<canvas class="pg-chart-canvas" id="donut-chart" height="200"></canvas>',
        '<div style="margin-top:var(--space-3);display:flex;flex-direction:column;gap:var(--space-1)">',
          this._legendItem('Known', '#10B981', mastered),
          this._legendItem('Learning', '#F59E0B', learning),
          this._legendItem('Difficult', '#EF4444', unknown),
          this._legendItem('Unseen', '#9CA3AF', unseen),
        '</div>',
      '</div>',
    '</div>',

    /* Bottom row */
    '<div class="pg-bottom-row">',
      /* Daily goal */
      '<div class="pg-goal-bar">',
        '<div class="pg-goal-header">',
          '<span class="pg-goal-label">Today\'s Goal</span>',
          '<span class="pg-goal-val">' + todayMins + ' / ' + dailyGoal + ' min</span>',
        '</div>',
        '<div class="progress-bar-wrap">',
          '<div class="progress-bar-fill ' + (goalPct >= 100 ? 'success' : goalPct >= 50 ? '' : 'warning') + '" style="width:' + goalPct + '%"></div>',
        '</div>',
        barLabels.length ? [
          '<div style="margin-top:var(--space-5)">',
            '<div class="pg-chart-title">Practice Accuracy by Category</div>',
            '<canvas class="pg-chart-canvas" id="bar-chart" height="160"></canvas>',
          '</div>'
        ].join('') : '',
      '</div>',

      /* Activity feed */
      '<div class="pg-activity-feed">',
        '<div class="pg-activity-title">Recent Activity</div>',
        '<div class="pg-activity-list">' + activityHtml + '</div>',
      '</div>',
    '</div>'
  ].join('');

  // Draw charts
  this._data = { lineLabels, lineValues, barLabels, barValues, mastered, learning, unknown, unseen };
  this._drawCharts();
};

ProgressPage.prototype._legendItem = function(label, color, count) {
  return '<div style="display:flex;align-items:center;gap:var(--space-2);font-size:0.8125rem">' +
    '<span style="width:10px;height:10px;border-radius:50%;background:' + color + ';flex-shrink:0"></span>' +
    '<span style="color:var(--color-text-secondary)">' + label + '</span>' +
    '<span style="margin-left:auto;font-weight:600;color:var(--color-text)">' + count + '</span>' +
  '</div>';
};

ProgressPage.prototype._drawCharts = function() {
  var d = this._data;

  var lineCanvas = this.el.querySelector('#line-chart');
  if (lineCanvas) {
    new LineChart(lineCanvas, {
      labels: d.lineLabels,
      datasets: [{ label: 'Minutes', values: d.lineValues, color: '#4F46E5' }]
    }, { height: 180 });
  }

  var donutCanvas = this.el.querySelector('#donut-chart');
  if (donutCanvas) {
    new DonutChart(donutCanvas, {
      segments: [
        { label: 'Known',    value: d.mastered, color: '#10B981' },
        { label: 'Learning', value: d.learning, color: '#F59E0B' },
        { label: 'Difficult',value: d.unknown,  color: '#EF4444' },
        { label: 'Unseen',   value: d.unseen,   color: '#E5E7EB' }
      ]
    }, { size: 180 });
  }

  var barCanvas = this.el.querySelector('#bar-chart');
  if (barCanvas && d.barLabels.length) {
    new BarChart(barCanvas, {
      labels: d.barLabels,
      values: d.barValues,
      color: ['#4F46E5','#10B981','#F59E0B','#EF4444','#3B82F6','#8B5CF6']
    }, { height: 160 });
  }
};

ProgressPage.prototype._redrawCharts = function() {
  this._drawCharts();
};
