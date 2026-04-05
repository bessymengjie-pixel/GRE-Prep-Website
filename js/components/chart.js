/* ─── GRE Prep — Canvas Charts ────────────────────────── */

/* ── Helpers ── */
function _chartDpr() { return window.devicePixelRatio || 1; }

function _setupCanvas(canvas, width, height) {
  var dpr = _chartDpr();
  canvas.width  = width  * dpr;
  canvas.height = height * dpr;
  canvas.style.width  = width  + 'px';
  canvas.style.height = height + 'px';
  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return ctx;
}

function _cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function _textColor()    { return _cssVar('--color-text') || '#111827'; }
function _mutedColor()   { return _cssVar('--color-text-faint') || '#9CA3AF'; }
function _borderColor()  { return _cssVar('--color-border') || '#E5E7EB'; }
function _primaryColor() { return _cssVar('--color-primary') || '#4F46E5'; }

var CHART_COLORS = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'
];

/* ── Line Chart ── */
function LineChart(canvasEl, data, options) {
  this.canvas = canvasEl;
  this.data   = data;   // { labels: [...], datasets: [{ label, values, color }] }
  this.options = options || {};
  this.render();
}

LineChart.prototype.render = function() {
  var canvas = this.canvas;
  var rect   = canvas.parentElement.getBoundingClientRect();
  var W = rect.width || 400;
  var H = this.options.height || 180;
  var ctx = _setupCanvas(canvas, W, H);

  var pad = { top: 16, right: 16, bottom: 36, left: 40 };
  var chartW = W - pad.left - pad.right;
  var chartH = H - pad.top  - pad.bottom;

  var data = this.data;
  var labels = data.labels || [];
  var datasets = data.datasets || [];
  var n = labels.length;
  if (n < 2) return;

  // Compute value range
  var allVals = [];
  datasets.forEach(function(ds) { allVals = allVals.concat(ds.values || []); });
  var maxVal = Math.max.apply(null, allVals.concat([1]));
  var minVal = 0;

  // Grid lines
  ctx.strokeStyle = _borderColor();
  ctx.lineWidth = 1;
  var gridLines = 4;
  for (var g = 0; g <= gridLines; g++) {
    var y = pad.top + chartH - (g / gridLines) * chartH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Y label
    ctx.fillStyle = _mutedColor();
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(minVal + (maxVal - minVal) * (g / gridLines)), pad.left - 6, y + 4);
  }

  // X labels (show every other if many)
  ctx.fillStyle = _mutedColor();
  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  var step = n > 10 ? 2 : 1;
  for (var i = 0; i < n; i += step) {
    var x = pad.left + (i / (n - 1)) * chartW;
    ctx.fillText(labels[i], x, H - 8);
  }

  // Draw dataset lines
  datasets.forEach(function(ds, di) {
    var color = ds.color || CHART_COLORS[di % CHART_COLORS.length];
    var values = ds.values || [];
    if (!values.length) return;

    // Fill area
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + chartH);
    for (var i = 0; i < values.length; i++) {
      var px = pad.left + (i / (n - 1)) * chartW;
      var py = pad.top + chartH - ((values[i] - minVal) / (maxVal - minVal)) * chartH;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(pad.left + chartW, pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.08;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Line
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + chartH - ((values[0] - minVal) / (maxVal - minVal)) * chartH);
    for (var i = 1; i < values.length; i++) {
      var px = pad.left + (i / (n - 1)) * chartW;
      var py = pad.top + chartH - ((values[i] - minVal) / (maxVal - minVal)) * chartH;
      ctx.lineTo(px, py);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Dots
    for (var i = 0; i < values.length; i++) {
      var px = pad.left + (i / (n - 1)) * chartW;
      var py = pad.top + chartH - ((values[i] - minVal) / (maxVal - minVal)) * chartH;
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  });
};

/* ── Bar Chart ── */
function BarChart(canvasEl, data, options) {
  this.canvas = canvasEl;
  this.data   = data;   // { labels: [...], values: [...], color }
  this.options = options || {};
  this.render();
}

BarChart.prototype.render = function() {
  var canvas = this.canvas;
  var rect   = canvas.parentElement.getBoundingClientRect();
  var W = rect.width || 400;
  var H = this.options.height || 200;
  var ctx = _setupCanvas(canvas, W, H);

  var labels = this.data.labels || [];
  var values = this.data.values || [];
  var n = labels.length;
  if (!n) return;

  var pad = { top: 12, right: 16, bottom: 40, left: 44 };
  var chartW = W - pad.left - pad.right;
  var chartH = H - pad.top  - pad.bottom;
  var maxVal = Math.max.apply(null, values.concat([1]));
  var barW = (chartW / n) * 0.6;
  var gap  = (chartW / n) * 0.4;

  // Grid
  ctx.strokeStyle = _borderColor();
  ctx.lineWidth = 1;
  for (var g = 0; g <= 4; g++) {
    var y = pad.top + chartH - (g / 4) * chartH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = _mutedColor();
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round((maxVal * g) / 4) + '%', pad.left - 6, y + 4);
  }

  // Bars
  for (var i = 0; i < n; i++) {
    var bH = (values[i] / maxVal) * chartH;
    var bX = pad.left + i * (chartW / n) + gap / 2;
    var bY = pad.top + chartH - bH;

    var color = Array.isArray(this.data.color)
      ? this.data.color[i]
      : (this.data.color || CHART_COLORS[i % CHART_COLORS.length]);

    ctx.fillStyle = color;
    ctx.beginPath();
    var r = Math.min(4, barW / 2);
    ctx.moveTo(bX + r, bY);
    ctx.lineTo(bX + barW - r, bY);
    ctx.quadraticCurveTo(bX + barW, bY, bX + barW, bY + r);
    ctx.lineTo(bX + barW, pad.top + chartH);
    ctx.lineTo(bX, pad.top + chartH);
    ctx.lineTo(bX, bY + r);
    ctx.quadraticCurveTo(bX, bY, bX + r, bY);
    ctx.closePath();
    ctx.fill();

    // Value label above bar
    ctx.fillStyle = _textColor();
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    if (values[i] > 0) ctx.fillText(values[i] + '%', bX + barW / 2, bY - 4);

    // X label
    ctx.fillStyle = _mutedColor();
    ctx.fillText(labels[i], bX + barW / 2, H - 6);
  }
};

/* ── Donut Chart ── */
function DonutChart(canvasEl, data, options) {
  this.canvas = canvasEl;
  this.data   = data;   // { segments: [{ label, value, color }] }
  this.options = options || {};
  this.render();
}

DonutChart.prototype.render = function() {
  var canvas = this.canvas;
  var size = this.options.size || Math.min(canvas.parentElement.getBoundingClientRect().width, 200);
  var ctx = _setupCanvas(canvas, size, size);

  var segments = this.data.segments || [];
  var total = segments.reduce(function(s, seg) { return s + (seg.value || 0); }, 0);
  if (!total) {
    ctx.fillStyle = _borderColor();
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 12, 0, Math.PI*2);
    ctx.fill();
    ctx.clearRect(0, 0, size, size);
    // Empty ring
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 12, 0, Math.PI*2);
    ctx.strokeStyle = _borderColor();
    ctx.lineWidth = 20;
    ctx.stroke();
    return;
  }

  var cx = size / 2, cy = size / 2;
  var outerR = size / 2 - 8;
  var innerR = outerR * 0.62;
  var start = -Math.PI / 2;

  segments.forEach(function(seg) {
    if (!seg.value) return;
    var sweep = (seg.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, start, start + sweep);
    ctx.closePath();
    ctx.fillStyle = seg.color || _primaryColor();
    ctx.fill();
    start += sweep;
  });

  // Inner hole
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-surface').trim() || '#FFFFFF';
  ctx.fill();

  // Center text
  ctx.fillStyle = _textColor();
  ctx.font = 'bold 16px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total, cx, cy - 8);
  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.fillStyle = _mutedColor();
  ctx.fillText('words', cx, cy + 9);
};
