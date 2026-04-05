/* ─── GRE Prep — Schedule Page ───────────────────────── */
function SchedulePage(el) {
  this.el = el;
  this._weekStart = Utils.weekStart(Utils.dateKey());
  this._editingTask = null;
}

SchedulePage.prototype.init = function() {
  this._render();
};

SchedulePage.prototype.destroy = function() {};

/* ── Main render ── */
SchedulePage.prototype._render = function() {
  var self = this;
  var schedule = Store.getSchedule();
  var meta = Store.getProgressMeta();
  var dailyGoal = schedule.dailyGoalMinutes || 60;
  var today = Utils.dateKey();

  var days = Utils.weekDays(this._weekStart);
  var dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  // Build week label
  var weekLabelStart = Utils.formatDateShort(days[0]);
  var weekLabelEnd   = Utils.formatDateShort(days[6]);

  var calHtml = days.map(function(date, i) {
    var isToday = date === today;
    var tasks = schedule.tasks.filter(function(t) { return t.date === date; });
    var completedMins = tasks.filter(function(t) { return t.completed; })
                             .reduce(function(s, t) { return s + (t.durationMinutes || 0); }, 0);
    var goalPct = Math.min(100, Math.round((completedMins / dailyGoal) * 100));

    var tasksHtml = tasks.map(function(task) {
      return self._renderTaskCard(task);
    }).join('');

    return [
      '<div class="sc-day-col">',
        '<div class="sc-day-header' + (isToday ? ' today' : '') + '">',
          dayNames[i],
          '<span class="sc-day-date">' + Utils.formatDateShort(date) + '</span>',
        '</div>',
        '<div class="sc-day-progress">',
          '<div class="sc-day-progress-fill" style="width:' + goalPct + '%"></div>',
        '</div>',
        tasksHtml,
        '<button class="sc-add-btn" data-date="' + date + '">+</button>',
      '</div>'
    ].join('');
  }).join('');

  this.el.innerHTML = [
    '<div class="page-header">',
      '<h1 class="page-title">Study Schedule</h1>',
      '<p class="page-subtitle">Plan your weekly GRE preparation</p>',
    '</div>',

    '<div class="sc-header">',
      '<div class="sc-week-nav">',
        '<button class="sc-nav-btn" id="prev-week">‹</button>',
        '<span class="sc-week-label">' + weekLabelStart + ' – ' + weekLabelEnd + '</span>',
        '<button class="sc-nav-btn" id="next-week">›</button>',
      '</div>',
      '<button class="btn btn-ghost btn-sm" id="today-btn">Today</button>',
    '</div>',

    '<div class="sc-goal-row">',
      '<span class="sc-goal-label">Daily Goal:</span>',
      '<input type="number" class="form-input sc-goal-input" id="daily-goal" value="' + dailyGoal + '" min="10" max="480">',
      '<span style="font-size:0.875rem;color:var(--color-text-muted)">minutes/day</span>',
    '</div>',

    '<div class="sc-calendar" id="sc-calendar">' + calHtml + '</div>'
  ].join('');

  // Week navigation
  this.el.querySelector('#prev-week').addEventListener('click', function() {
    var d = new Date(self._weekStart + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    self._weekStart = Utils.dateKey(d);
    self._render();
  });

  this.el.querySelector('#next-week').addEventListener('click', function() {
    var d = new Date(self._weekStart + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    self._weekStart = Utils.dateKey(d);
    self._render();
  });

  this.el.querySelector('#today-btn').addEventListener('click', function() {
    self._weekStart = Utils.weekStart(Utils.dateKey());
    self._render();
  });

  // Daily goal input
  this.el.querySelector('#daily-goal').addEventListener('change', function() {
    var val = parseInt(this.value) || 60;
    Store.update('schedule', function(s) {
      s = s || Store.getSchedule();
      s.dailyGoalMinutes = val;
      return s;
    }, Store.getSchedule());
    Store.update('progress_meta', function(meta) {
      meta = meta || Store.getProgressMeta();
      meta.dailyGoalMinutes = val;
      return meta;
    }, Store.getProgressMeta());
    self._render();
  });

  // Add task buttons
  this.el.querySelectorAll('.sc-add-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      self._openTaskForm(this.dataset.date, null);
    });
  });

  // Task interactions
  this._bindTaskEvents();
};

/* ── Task card HTML ── */
SchedulePage.prototype._renderTaskCard = function(task) {
  var catClass = task.category || 'custom';
  return [
    '<div class="sc-task' + (task.completed ? ' completed' : '') + '" data-id="' + task.taskId + '">',
      '<div class="sc-task-check-row">',
        '<input type="checkbox" class="sc-task-check" ' + (task.completed ? 'checked' : '') + '>',
        '<div class="sc-task-label">',
          '<span class="sc-task-cat ' + catClass + '"></span>',
          Utils.escapeHtml(task.label),
        '</div>',
      '</div>',
      '<div class="sc-task-meta">',
        '<span class="sc-task-duration">' + (task.durationMinutes || 0) + ' min</span>',
        '<div class="sc-task-actions">',
          '<button class="sc-task-btn edit" title="Edit">✎</button>',
          '<button class="sc-task-btn delete" title="Delete">✕</button>',
        '</div>',
      '</div>',
    '</div>'
  ].join('');
};

/* ── Bind task card events ── */
SchedulePage.prototype._bindTaskEvents = function() {
  var self = this;

  // Checkboxes
  this.el.querySelectorAll('.sc-task-check').forEach(function(checkbox) {
    checkbox.addEventListener('change', function() {
      var card = this.closest('.sc-task');
      var taskId = card.dataset.id;
      var checked = this.checked;

      Store.update('schedule', function(s) {
        s = s || Store.getSchedule();
        var task = s.tasks.find(function(t) { return t.taskId === taskId; });
        if (task) {
          task.completed = checked;
          // Log minutes to daily log
          if (checked) {
            Store.logStudyMinutes(task.durationMinutes || 0);
            Store.touchStreak();
          }
        }
        return s;
      }, Store.getSchedule());

      card.classList.toggle('completed', checked);
      self._render(); // re-render to update progress bars
    });
  });

  // Edit buttons
  this.el.querySelectorAll('.sc-task-btn.edit').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var card = this.closest('.sc-task');
      var taskId = card.dataset.id;
      var task = Store.getSchedule().tasks.find(function(t) { return t.taskId === taskId; });
      if (task) self._openTaskForm(task.date, task);
    });
  });

  // Delete buttons
  this.el.querySelectorAll('.sc-task-btn.delete').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var card = this.closest('.sc-task');
      var taskId = card.dataset.id;
      Modal.confirm('Delete this task?', { title: 'Delete Task', okLabel: 'Delete', okClass: 'btn-danger' }).then(function(ok) {
        if (!ok) return;
        Store.update('schedule', function(s) {
          s = s || Store.getSchedule();
          s.tasks = s.tasks.filter(function(t) { return t.taskId !== taskId; });
          return s;
        }, Store.getSchedule());
        self._render();
      });
    });
  });
};

/* ── Task form (in modal) ── */
SchedulePage.prototype._openTaskForm = function(date, existingTask) {
  var self = this;
  var isEdit = !!existingTask;
  var cats = [
    { value: 'vocab',   label: 'Vocabulary' },
    { value: 'verbal',  label: 'Verbal' },
    { value: 'quant',   label: 'Quantitative' },
    { value: 'writing', label: 'Writing' },
    { value: 'custom',  label: 'Custom' }
  ];

  var catOptions = cats.map(function(c) {
    return '<option value="' + c.value + '"' + (existingTask && existingTask.category === c.value ? ' selected' : '') + '>' + c.label + '</option>';
  }).join('');

  var formHtml = [
    '<div class="sc-task-form">',
      '<div class="form-group">',
        '<label class="form-label">Task Name</label>',
        '<input type="text" class="form-input" id="task-label" value="' + Utils.escapeHtml(existingTask ? existingTask.label : '') + '" placeholder="e.g. Review 20 flashcards">',
      '</div>',
      '<div class="form-group">',
        '<label class="form-label">Category</label>',
        '<select class="form-select" id="task-cat">' + catOptions + '</select>',
      '</div>',
      '<div class="form-group">',
        '<label class="form-label">Duration (minutes)</label>',
        '<input type="number" class="form-input" id="task-duration" value="' + (existingTask ? existingTask.durationMinutes : 20) + '" min="1" max="480">',
      '</div>',
      '<div class="modal-footer">',
        '<button class="btn btn-ghost" id="task-cancel">Cancel</button>',
        '<button class="btn btn-primary" id="task-save">' + (isEdit ? 'Save Changes' : 'Add Task') + '</button>',
      '</div>',
    '</div>'
  ].join('');

  var overlay = Modal.openPanel((isEdit ? 'Edit Task' : 'Add Task — ' + Utils.formatDateShort(date)), formHtml);

  overlay.querySelector('#task-cancel').addEventListener('click', function() { Modal.close(); });
  overlay.querySelector('#task-save').addEventListener('click', function() {
    var label    = overlay.querySelector('#task-label').value.trim();
    var category = overlay.querySelector('#task-cat').value;
    var duration = parseInt(overlay.querySelector('#task-duration').value) || 20;

    if (!label) { Toast.warning('Please enter a task name.'); return; }

    Store.update('schedule', function(s) {
      s = s || Store.getSchedule();
      if (isEdit) {
        var task = s.tasks.find(function(t) { return t.taskId === existingTask.taskId; });
        if (task) { task.label = label; task.category = category; task.durationMinutes = duration; }
      } else {
        s.tasks.push({
          taskId: Utils.generateId('task'),
          date: date,
          label: label,
          category: category,
          durationMinutes: duration,
          completed: false
        });
      }
      return s;
    }, Store.getSchedule());

    Modal.close();
    Toast.success(isEdit ? 'Task updated!' : 'Task added!');
    self._render();
  });
};
