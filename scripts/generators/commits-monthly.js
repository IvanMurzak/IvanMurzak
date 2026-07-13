const { fmt, MONTH_NAMES, sharedCSS } = require('../theme');

// Bar chart: contributions per month over the last 3 years.
// months: [{ m: 'YYYY-MM', c: number }], last entry is the current month.
function generateCommitsMonthlySVG(theme, months) {
  const t = theme;
  const W = 955, H = 270;
  const X0 = 52, X1 = 931, Y0 = 74, BASE = 226;
  const n = months.length;
  const pitch = (X1 - X0) / n;
  const barW = Math.round(pitch * 0.66);

  const counts = months.map((x) => x.c);
  const total = counts.reduce((a, b) => a + b, 0);
  const avg = Math.round(total / n);
  const peak = Math.max(...counts);
  const peakIdx = counts.indexOf(peak);
  const yMax = Math.ceil((peak * 1.08) / 500) * 500;
  const y = (v) => BASE - (v / yMax) * (BASE - Y0);

  let bars = '', clipBars = '', ticks = '', seps = '';
  months.forEach((mo, i) => {
    const x = X0 + i * pitch + (pitch - barW) / 2;
    const h = Math.max(2, BASE - y(mo.c));
    const isNow = i === n - 1;
    const r = `x="${x.toFixed(1)}" y="${y(mo.c).toFixed(1)}" width="${barW}" height="${(h + 4).toFixed(1)}" rx="3.5"`;
    bars += `<rect class="m-bar" ${r} fill="url(#m-barGrad)" style="animation-delay:${340 + i * 22}ms"/>`;
    clipBars += `<rect ${r}/>`;
    const [yy, mm] = mo.m.split('-');
    if (mm === '01') {
      const sepX = X0 + i * pitch;
      seps += `<line class="m-sep" x1="${sepX.toFixed(1)}" y1="${Y0}" x2="${sepX.toFixed(1)}" y2="${BASE}"/>`;
      ticks += `<text class="m-tick" x="${(x + barW / 2).toFixed(1)}" y="${BASE + 18}" text-anchor="middle">${yy}</text>`;
    }
    if (isNow) {
      ticks += `<text class="m-now" x="${(x + barW / 2).toFixed(1)}" y="${BASE + 18}" text-anchor="middle">NOW</text>`;
    }
  });

  const gridStep = yMax > 2400 ? 1000 : 500;
  let grid = '';
  for (let v = 0; v <= yMax; v += gridStep) {
    grid += `<line class="m-grid" x1="${X0}" y1="${y(v).toFixed(1)}" x2="${X1}" y2="${y(v).toFixed(1)}"/>` +
            `<text class="m-tick" x="${X0 - 8}" y="${(y(v) + 3.5).toFixed(1)}" text-anchor="end">${v === 0 ? '0' : v >= 1000 ? v / 1000 + 'k' : v}</text>`;
  }

  const peakX = X0 + peakIdx * pitch + pitch / 2;
  const nowX = X0 + (n - 1) * pitch + pitch / 2;
  const nowY = y(counts[n - 1]);
  const [py, pm] = months[peakIdx].m.split('-');
  const label = (ym) => {
    const [yy, mm] = ym.split('-');
    return `${MONTH_NAMES[+mm - 1]} ${yy}`;
  };

  const chips = [
    { l: 'TOTAL / 3Y', v: fmt(total) },
    { l: 'AVG / MONTH', v: fmt(avg) },
    { l: `PEAK · ${MONTH_NAMES[+pm - 1].toUpperCase()} ${py}`, v: fmt(peak) },
    { l: 'THIS MONTH', v: fmt(counts[n - 1]) },
  ];
  let chipsSVG = '';
  chips.forEach((c, i) => {
    const cx = 931 - (chips.length - 1 - i) * 122;
    chipsSVG += `<g class="chip" style="animation-delay:${850 + i * 140}ms">
      <text x="${cx}" y="40" text-anchor="end" class="m-cv">${c.v}</text>
      <text x="${cx}" y="56" text-anchor="end" class="m-cl">${c.l}</text>
    </g>`;
  });

  return `<svg width="955" height="270" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Commits per month, last 3 years. Total ${total}, average ${avg} per month, peak ${peak}.">
  <style>
    .m-title { font: 600 18px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.ink}; }
    .m-sub { font: 400 12px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.muted}; }
    .m-tick { font: 400 10px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.muted}; }
    .m-now { font: 600 9px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.accent}; letter-spacing: 1px; }
    .m-grid { stroke: ${t.grid}; stroke-width: 1; }
    .m-sep { stroke: ${t.grid}; stroke-width: 1; stroke-dasharray: 3 3; }
    .m-cv { font: 700 20px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.ink}; }
    .m-cl { font: 600 9px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.muted}; letter-spacing: 1px; }
    .m-peak { font: 600 11px 'Segoe UI', Ubuntu, sans-serif; fill: ${t.ink}; }
    .m-bar { transform-box: fill-box; transform-origin: bottom; transform: scaleY(0);
             animation: grow .6s cubic-bezier(.34,1.35,.44,1) both; }
    #m-nowGlow { opacity: .2; animation: breathe 2.8s ease-in-out infinite alternate; }
    #m-ping { transform-box: fill-box; transform-origin: center; animation: ping 2.6s ease-out infinite; }
    #m-shine { animation: sweep 7s linear 2.8s infinite; }
    ${sharedCSS()}
    @media (prefers-reduced-motion: reduce) {
      .fade, .m-bar, .chip, .late { animation: none; opacity: 1; transform: none; }
      #m-nowGlow { animation: none; opacity: .3; }
      #m-ping, #m-shine { animation: none; display: none; }
    }
  </style>
  <defs>
    <linearGradient id="m-barGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.accent}"/>
      <stop offset="1" stop-color="${t.accent}" stop-opacity="0.6"/>
    </linearGradient>
    <linearGradient id="m-shineGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.shine}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="${t.shine}"/>
      <stop offset="1" stop-color="${t.shine}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="m-plotClip"><rect x="${X0}" y="${Y0 - 6}" width="${X1 - X0}" height="${BASE - Y0 + 6}"/></clipPath>
    <clipPath id="m-barsClip">${clipBars}</clipPath>
    <filter id="m-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>

  <rect x="0.5" y="0.5" rx="6" width="${W - 1}" height="${H - 1}" fill="${t.bg}" stroke="${t.border}"/>
  <text class="m-title fade" x="25" y="38">Commits per month</text>
  <text class="m-sub fade" x="25" y="57" style="animation-delay:.15s">${label(months[0].m)} — ${label(months[n - 1].m)} · last ${n} months · GitHub contributions</text>
  ${chipsSVG}
  <g class="fade" style="animation-delay:.2s">${grid}${seps}</g>
  <g clip-path="url(#m-plotClip)">
    <rect id="m-nowGlow" x="${(nowX - barW / 2 - 4).toFixed(1)}" y="${(nowY - 4).toFixed(1)}" width="${barW + 8}" height="${(BASE - nowY + 8).toFixed(1)}" rx="6" fill="${t.accent}" filter="url(#m-glow)"/>
    ${bars}
    <g clip-path="url(#m-barsClip)">
      <rect id="m-shine" x="-150" y="${Y0 - 6}" width="110" height="${BASE - Y0 + 6}" fill="url(#m-shineGrad)" style="transform: skewX(-14deg)"/>
    </g>
  </g>
  <line x1="${X0}" y1="${BASE + 0.5}" x2="${X1}" y2="${BASE + 0.5}" stroke="${t.border}" stroke-width="1"/>
  <g class="fade" style="animation-delay:.35s">${ticks}</g>
  <text class="m-peak late" x="${peakX.toFixed(1)}" y="${(y(peak) - 8).toFixed(1)}" text-anchor="middle">${fmt(peak)}</text>
  <g class="late">
    <circle id="m-ping" cx="${nowX.toFixed(1)}" cy="${(nowY - 11).toFixed(1)}" r="4" fill="none" stroke="${t.accent}" stroke-width="1.5"/>
    <circle cx="${nowX.toFixed(1)}" cy="${(nowY - 11).toFixed(1)}" r="3" fill="${t.accent}"/>
  </g>
</svg>`;
}

module.exports = { generateCommitsMonthlySVG };
