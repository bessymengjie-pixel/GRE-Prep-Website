/* ─── GRE Prep — Countdown Timer ─────────────────────── */
function CountdownTimer(options) {
  options = options || {};
  this.duration = options.duration || 1800; // seconds
  this.onTick = options.onTick || function() {};
  this.onComplete = options.onComplete || function() {};
  this.canvasEl = options.canvasEl || null;

  this._remaining = this.duration;
  this._interval = null;
  this._running = false;
  this._startTime = null;
  this._elapsed = 0;

  if (this.canvasEl) this._drawRing(1);
}

CountdownTimer.prototype.start = function() {
  if (this._running) return;
  this._running = true;
  this._startTime = Date.now() - (this._elapsed * 1000);
  var self = this;
  this._interval = setInterval(function() {
    self._elapsed = (Date.now() - self._startTime) / 1000;
    self._remaining = Math.max(0, self.duration - self._elapsed);
    self.onTick(self._remaining);
    if (self.canvasEl) self._drawRing(self._remaining / self.duration);
    if (self._remaining <= 0) {
      self.stop();
      self.onComplete();
    }
  }, 250);
};

CountdownTimer.prototype.pause = function() {
  if (!this._running) return;
  this._running = false;
  clearInterval(this._interval);
  this._interval = null;
  this._elapsed = (Date.now() - this._startTime) / 1000;
};

CountdownTimer.prototype.stop = function() {
  this._running = false;
  clearInterval(this._interval);
  this._interval = null;
};

CountdownTimer.prototype.reset = function() {
  this.stop();
  this._remaining = this.duration;
  this._elapsed = 0;
  this._startTime = null;
  this.onTick(this._remaining);
  if (this.canvasEl) this._drawRing(1);
};

CountdownTimer.prototype.getRemaining = function() {
  return Math.max(0, this._remaining);
};

CountdownTimer.prototype.isRunning = function() {
  return this._running;
};

CountdownTimer.prototype._drawRing = function(fraction) {
  var canvas = this.canvasEl;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var size = canvas.clientWidth || 48;

  canvas.width = size * dpr;
  canvas.height = size * dpr;
  ctx.scale(dpr, dpr);

  var cx = size / 2;
  var cy = size / 2;
  var r = (size / 2) - 3;
  var lineWidth = 3;

  ctx.clearRect(0, 0, size, size);

  // Track
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-border').trim() || '#E5E7EB';
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  // Arc (clockwise from top)
  if (fraction > 0) {
    var color;
    if (fraction > 0.5) {
      color = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary').trim() || '#4F46E5';
    } else if (fraction > 0.2) {
      color = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-warning').trim() || '#F59E0B';
    } else {
      color = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-danger').trim() || '#EF4444';
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * fraction));
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
};
