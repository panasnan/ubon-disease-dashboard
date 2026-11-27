// ===== Lightweight SVG/HTML charts (no external libraries) =====
import { fmt, thDate, epiWeek } from './data.js';

export const COLORS = { navy: '#10234A', royal: '#174EA6', blue: '#2671F2', green: '#16A477', yellow: '#E9C23B', orange: '#F3A72F', red: '#E5484D', grey: '#94A3B8', line: '#E3E9F3', muted: '#5B6B86' };
export const LEVEL_COLOR = { green: COLORS.green, yellow: COLORS.yellow, orange: COLORS.orange, red: COLORS.red, nobase: COLORS.grey, none: COLORS.grey };
export const LEVEL_TEXT = { green: 'ปกติ', yellow: 'เฝ้าระวัง', orange: 'ติดตาม', red: 'รุนแรง', nobase: 'รอค่าฐาน', none: '–' };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function hbars(items, { dp = 2, unit = '', lw = 0 } = {}) {
  const max = Math.max(...items.map(i => i.value || 0), 1e-9);
  return `<div class="hbars">${items.map((i, k) => `
    <div class="hbar-row"${lw ? ` style="grid-template-columns:${lw}px 1fr 72px"` : ''} title=""${esc(i.label)}: ${fmt(i.value, dp)} ${esc(unit)}">
      <span class="hbar-label">${esc(i.label)}</span>
      <span class="hbar-track"><span class="hbar-fill" style="--w:${i.value == null ? 0 : Math.max(0.6, i.value / max * 100)}%;--c:${i.color || COLORS.blue};--d:${k * 40}ms"></span></span>
      <span class="hbar-val">${i.value == null ? '–' : fmt(i.value, dp)}</span>
    </div>`).join('')}</div>`;
}

export function sparkline(vals, color = COLORS.blue, w = 96, h = 26) {
  if (!vals.length) return '';
  const max = Math.max(...vals, 1);
  const P = vals.map((v, i) => [(i / Math.max(1, vals.length - 1) * (w - 8) + 4), (h - 4 - v / max * (h - 10))]);
  const im = vals.indexOf(Math.max(...vals)), il = vals.length - 1;
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline points="${P.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${im !== il ? `<circle cx="${P[im][0]}" cy="${P[im][1]}" r="2.6" fill="#fff" stroke="${color}" stroke-width="1.6"><title>สูงสุด ${vals[im]}</title></circle>` : ''}<circle cx="${P[il][0]}" cy="${P[il][1]}" r="3.4" fill="${color}"><title>ล่าสุด ${vals[il]}</title></circle></svg>`;
}

// epi curve: bars = this period, dashed line = previous year, band = 5-yr median (+ orange line at ratio)
export function epiCurve({ weeks, cur, prev, base, ratioOrange = 1.5, prov = [], ref = null }) {
  const W = 860, H = 280, L = 48, R = 12, T = 14, B = 40;
  const n = weeks.length;
  if (!n) return '<div class="empty">ยังไม่มีข้อมูลรายสัปดาห์</div>';
  const all = [...cur.filter(v => v != null), ...prev.filter(v => v != null), ...base.filter(v => v != null).map(v => v * ratioOrange), ...(ref || [])];
  const max = niceMax(Math.max(...all, 1));
  const x = i => L + (i + 0.5) * (W - L - R) / n, bw = Math.max(2, (W - L - R) / n * 0.62);
  const y = v => T + (H - T - B) * (1 - v / max);
  let g = '';
  for (let k = 0; k <= 4; k++) { const v = max * k / 4; g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" class="ax" text-anchor="end">${fmt(v)}</text>`; }
  const hasBase = base.some(v => v != null);
  let band = '';
  if (hasBase) {
    const seg = base.map((v, i) => v == null ? null : [x(i), y(v)]);
    const pathOf = arr => arr.filter(Boolean).map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
    const top = seg.filter(Boolean);
    if (top.length) {
      band = `<path d="${pathOf(top)}L${top[top.length - 1][0]},${y(0)}L${top[0][0]},${y(0)}Z" class="band"/>
      <path d="${pathOf(top)}" class="median"/>
      <path d="${pathOf(base.map((v, i) => v == null ? null : [x(i), y(v * ratioOrange)]))}" class="warnline"/>`;
    }
  }
  const bars = cur.map((v, i) => { if (v == null) return ''; const c = hasBase && base[i] != null ? (v > base[i] * ratioOrange ? COLORS.orange : v > base[i] ? COLORS.yellow : COLORS.blue) : COLORS.blue; return `<rect x="${x(i) - bw / 2}" y="${y(v)}" width="${bw}" height="${y(0) - y(v)}" rx="2" fill="${c}" class="bar${prov[i] ? ' prov' : ''}" style="--d:${i * 12}ms"><title>${prov[i] ? '[ข้อมูลเบื้องต้น] ' : ''}สัปดาห์ที่ ${epiWeek(weeks[i]).week} (${thDate(weeks[i])}): ${fmt(v)} ราย${base[i] != null ? ' | มัธยฐาน 5 ปี ' + fmt(base[i], 1) : ''}${prev[i] != null ? ' | ปีก่อน ' + fmt(prev[i]) : ''}</title></rect>`; }).join('');
  const pl = prev.some(v => v != null) ? `<polyline points="${prev.map((v, i) => `${x(i)},${y(v || 0)}`).join(' ')}" class="prevline"/>` : '';
  const step = Math.ceil(n / 13);
  const xl = weeks.map((t, i) => i % step ? '' : `<text x="${x(i)}" y="${H - B + 16}" class="ax" text-anchor="middle">W${epiWeek(t).week}</text><text x="${x(i)}" y="${H - B + 30}" class="ax sm" text-anchor="middle">${thDate(epiWeek(t).from)}</text>`).join('');
  const pi = prov.map((p, i) => p && cur[i] != null ? i : -1).filter(i => i >= 0);
  const provLbl = pi.length ? `<g class="provlbl"><rect x="${x(pi[0]) - bw / 2 - 4}" y="${T}" width="${x(pi[pi.length - 1]) - x(pi[0]) + bw + 8}" height="${H - T - B}" rx="6"/><text x="${(x(pi[0]) + x(pi[pi.length - 1])) / 2}" y="${T + 14}" text-anchor="middle">ข้อมูลยังไม่ครบ</text></g>` : '';
  const rl = ref ? `<polyline points="${ref.map((v, i) => `${x(i)},${y(v || 0)}`).join(' ')}" class="refline"/>` : '';
  const uid = 'ec' + Math.random().toString(36).slice(2, 8);
  return `<div class="ecwrap" id="${uid}"><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="กราฟผู้ป่วยรายสัปดาห์">${g}${provLbl}<g class="s-med">${band}</g><g class="s-bars">${bars}</g><g class="s-prev">${pl}</g>${rl}${xl}</svg>
  <div class="legend tog" data-ec="${uid}"><span><button data-ser="s-bars" title="คลิกเพื่อซ่อน/แสดง"><i style="background:${COLORS.blue}"></i>ผู้ป่วยรายสัปดาห์</button></span>${prov.some(Boolean) ? `<span><i class="provi"></i>ข้อมูลเบื้องต้น (รายงานยังทยอยเข้า)</span>` : ''}${pl ? `<span><button data-ser="s-prev"><i class="ln dash"></i>ปีก่อนช่วงเดียวกัน</button></span>` : ''}${hasBase ? `<span><button data-ser="s-med"><i class="ln med"></i>มัธยฐาน 5 ปี • <i class="ln org"></i>${ratioOrange}× มัธยฐาน</button></span>` : ref ? '<span><i class="ln ref"></i>ระดับเฉลี่ยจังหวัด</span>' : '<span class="muted">ยังไม่มีค่ามัธยฐาน 5 ปี</span>'}<span class="muted sm">คลิกที่คำอธิบายเพื่อซ่อน/แสดง</span></div></div>`;
}

export function heatmap(rowsLbl, weeks, matrix, provN = 0) {
  const max = Math.max(1, ...matrix.flat());
  const col = v => { if (!v) return '#F1F5FB'; const a = 0.15 + 0.85 * Math.sqrt(v / max); return `rgba(229,72,77,${a.toFixed(2)})`; };
  return `<div class="heat-wrap"><table class="heat"><thead><tr><th></th>${weeks.map((t, j) => `<th title="${thDate(t)}${j >= weeks.length - provN ? ' (ข้อมูลเบื้องต้น)' : ''}">${epiWeek(t).week}${j >= weeks.length - provN ? '*' : ''}</th>`).join('')}</tr></thead><tbody>
  ${rowsLbl.map((l, i) => `<tr><th>${esc(l)}</th>${matrix[i].map((v, j) => `<td class="${j >= weeks.length - provN ? 'prov' : ''}" style="background:${col(v)}" title="${esc(l)} สัปดาห์ ${epiWeek(weeks[j]).week}: ${fmt(v)} ราย">${v ? fmt(v) : ''}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div>`;
}

function niceMax(v) { const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
