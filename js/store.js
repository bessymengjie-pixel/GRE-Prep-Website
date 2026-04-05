/* ─── GRE Prep — localStorage Store ──────────────────── */
var Store = (function() {
  var PREFIX = 'gre_';
  var SCHEMA_VERSION = 1;

  function key(name) { return PREFIX + name; }

  function get(name, defaultValue) {
    try {
      var raw = localStorage.getItem(key(name));
      if (raw === null) return defaultValue !== undefined ? defaultValue : null;
      return JSON.parse(raw);
    } catch(e) {
      return defaultValue !== undefined ? defaultValue : null;
    }
  }

  function set(name, value) {
    try {
      localStorage.setItem(key(name), JSON.stringify(value));
    } catch(e) {
      console.warn('Store.set failed for', name, e);
    }
  }

  function update(name, patchFn, defaultValue) {
    var current = get(name, defaultValue);
    var updated = patchFn(current);
    set(name, updated);
    return updated;
  }

  function clear(name) {
    localStorage.removeItem(key(name));
  }

  function clearAll() {
    var keys = Object.keys(localStorage).filter(function(k) {
      return k.indexOf(PREFIX) === 0;
    });
    keys.forEach(function(k) { localStorage.removeItem(k); });
  }

  function exportData() {
    var data = { version: SCHEMA_VERSION, exported: new Date().toISOString(), data: {} };
    var keys = Object.keys(localStorage).filter(function(k) {
      return k.indexOf(PREFIX) === 0;
    });
    keys.forEach(function(k) {
      try { data.data[k] = JSON.parse(localStorage.getItem(k)); } catch(e) {}
    });
    return JSON.stringify(data, null, 2);
  }

  function importData(jsonStr) {
    try {
      var parsed = JSON.parse(jsonStr);
      if (!parsed.data) throw new Error('Invalid backup format');
      Object.keys(parsed.data).forEach(function(k) {
        if (k.indexOf(PREFIX) === 0) {
          localStorage.setItem(k, JSON.stringify(parsed.data[k]));
        }
      });
      return true;
    } catch(e) {
      console.error('Store.import failed:', e);
      return false;
    }
  }

  /* ── Default data initializers ── */
  function getSettings() {
    return get('settings', {
      theme: 'light',
      flashcardDeckSize: 20,
      timerEnabled: true,
      defaultQuizLength: 10
    });
  }

  function getProgressMeta() {
    return get('progress_meta', {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      vocabMastered: 0,
      practiceSessionCount: 0,
      essayCount: 0,
      dailyGoalMinutes: 60,
      dailyMinutesLog: {}
    });
  }

  function getVocabProgress() {
    return get('vocab_progress', {});
  }

  function getPracticeHistory() {
    return get('practice_history', []);
  }

  function getWritingEssays() {
    return get('writing_essays', []);
  }

  function getSchedule() {
    return get('schedule', {
      tasks: [],
      dailyGoalMinutes: 60
    });
  }

  /* ── Log study minutes for today ── */
  function logStudyMinutes(minutes) {
    var today = Utils.dateKey();
    update('progress_meta', function(meta) {
      meta = meta || getProgressMeta();
      if (!meta.dailyMinutesLog) meta.dailyMinutesLog = {};
      meta.dailyMinutesLog[today] = (meta.dailyMinutesLog[today] || 0) + minutes;
      return meta;
    }, getProgressMeta());
  }

  /* ── Update streak on activity ── */
  function touchStreak() {
    var today = Utils.dateKey();
    update('progress_meta', function(meta) {
      meta = meta || getProgressMeta();
      if (meta.lastActiveDate === today) return meta;
      var yesterday = Utils.offsetDate(-1);
      if (meta.lastActiveDate === yesterday) {
        meta.currentStreak = (meta.currentStreak || 0) + 1;
      } else if (meta.lastActiveDate !== today) {
        meta.currentStreak = 1;
      }
      if (meta.currentStreak > (meta.longestStreak || 0)) {
        meta.longestStreak = meta.currentStreak;
      }
      meta.lastActiveDate = today;
      return meta;
    }, getProgressMeta());
  }

  /* ── Count mastered vocab ── */
  function recountMastered() {
    var vp = getVocabProgress();
    var count = Object.values(vp).filter(function(v) { return v.status === 'known'; }).length;
    update('progress_meta', function(meta) {
      meta = meta || getProgressMeta();
      meta.vocabMastered = count;
      return meta;
    }, getProgressMeta());
    return count;
  }

  return {
    get: get,
    set: set,
    update: update,
    clear: clear,
    clearAll: clearAll,
    exportData: exportData,
    importData: importData,
    getSettings: getSettings,
    getProgressMeta: getProgressMeta,
    getVocabProgress: getVocabProgress,
    getPracticeHistory: getPracticeHistory,
    getWritingEssays: getWritingEssays,
    getSchedule: getSchedule,
    logStudyMinutes: logStudyMinutes,
    touchStreak: touchStreak,
    recountMastered: recountMastered
  };
})();
