// ===== Weekly infographic rendered on <canvas> (exports PNG without external libraries) =====
import { fmt } from './data.js';
import { LEVEL_COLOR, LEVEL_TEXT } from './charts.js';

export const SIZES = { social: { w: 1080, h: 1350, label: 'LINE / Facebook 1080×1350' }, a4: { w: 1240, h: 1754, label: 'A4 แนวตั้ง (150 dpi)' } };
const F = (w, s, fam = 'Anuphan') => `${w} ${s}px ${fam}, Sarabun, Tahoma, sans-serif`;

function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function card(c, x, y, w, h) { c.save(); c.shadowColor = 'rgba(16,35,74,.10)'; c.shadowBlur = 18; c.shadowOffsetY = 4; c.fillStyle = '#fff'; rr(c, x, y, w, h, 18); c.fill(); c.restore(); }
function wrap(c, text, x, y, maxW, lh, maxLines = 9) {
  // Thai has no spaces between words: use the browser's Thai word segmenter, else break by characters keeping marks attached
  const units = typeof Intl !== 'undefined' && Intl.Segmenter ? Array.from(new Intl.Segmenter('th', { granularity: 'word' }).segment(text), x => x.segment) : Array.from(text.matchAll(/[฀-๿][ัิ-ฺ็-๎]*|\s+|[^\s฀-๿]+/g), m => m[0]);
  let line = '', n = 0;
  for (const u of units) {
    if (c.measureText(line + u).width > maxW && line) { c.fillText(line.trim(), x, y + n * lh); n++; line = u.trimStart(); if (n >= maxLines) return n; }
    else line += u;
  }
  if (line.trim()) { c.fillText(line.trim(), x, y + n * lh); n++; }
  return n;
}

let LOGO = null;
function loadLogo() { if (LOGO) return LOGO; LOGO = new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = 'assets/moph-logo.png'; }); return LOGO; }
export async function drawInfographic(canvas, m, sizeKey = 'social') {
  const S = SIZES[sizeKey]; const BW = 1080; const BH = Math.round(S.h * BW / S.w);
  canvas.width = S.w; canvas.height = S.h;
  try { await Promise.all([document.fonts.load('700 40px Anuphan'), document.fonts.load('400 20px Sarabun')]); } catch { }
  const c = canvas.getContext('2d'); c.setTransform(S.w / BW, 0, 0, S.w / BW, 0, 0);
  c.fillStyle = '#F1F5FB'; c.fillRect(0, 0, BW, BH);

  // header
  const g = c.createLinearGradient(0, 0, BW, 240); g.addColorStop(0, '#10234A'); g.addColorStop(1, '#174EA6');
  c.fillStyle = g; c.fillRect(0, 0, BW, 236);
  c.fillStyle = 'rgba(255,255,255,.06)'; c.beginPath(); c.arc(BW - 80, 40, 180, 0, 7); c.fill();
  const logo = await loadLogo(); const tx = logo ? 196 : 56;
  if (logo) { c.save(); c.fillStyle = '#fff'; c.beginPath(); c.arc(118, 118, 66, 0, 7); c.fill(); c.drawImage(logo, 58, 58, 120, 120); c.restore(); }
  c.fillStyle = '#9CC0FF'; c.font = F('600', 21); c.fillText(m.office, tx, 62);
  c.fillStyle = '#fff'; c.font = F('700', 46); c.fillText('สถานการณ์ 10 โรคที่ต้องเฝ้าระวัง', tx, 120);
  c.font = F('700', 32); c.fillStyle = '#FFD27A'; c.fillText(m.area, tx, 168);
  c.font = F('400', 21, 'Sarabun'); c.fillStyle = '#DCE7FF'; c.fillText(`${m.period}  •  ${m.weekText}`, tx, 206);
  if (m.demo) { c.save(); c.fillStyle = '#E5484D'; rr(c, BW - 316, 140, 260, 44, 22); c.fill(); c.fillStyle = '#fff'; c.font = F('700', 22); c.textAlign = 'center'; c.fillText('ข้อมูลจำลอง ห้ามใช้อ้างอิง', BW - 186, 170); c.restore(); }

  // KPI cards
  const ky = 262, kw = (BW - 56 * 2 - 24 * 2) / 3, kh = 132;
  const kpis = [
    { t: 'ผู้ป่วยสะสม 10 โรค', v: fmt(m.cases), s: 'ราย', col: '#174EA6' },
    { t: 'ผู้เสียชีวิต', v: fmt(m.deaths), s: m.deaths ? `CFR ${fmt(m.cases ? m.deaths / m.cases * 100 : 0, 2)}%` : 'ราย', col: m.deaths ? '#E5484D' : '#16A477' },
    m.weekDelta != null ? { t: 'ผู้ป่วยรายใหม่สัปดาห์นี้', v: `+${fmt(m.weekDelta)}`, s: 'ราย (เทียบรายงานสัปดาห์ก่อน)', col: '#D08612' }
    : m.change == null ? { t: 'เทียบช่วงเดียวกันปีก่อน', v: '–', s: m.changeNote || 'ไม่มีข้อมูลเปรียบเทียบ', col: '#5B6B86' }
      : { t: 'เทียบช่วงเดียวกันปีก่อน', v: `${m.change > 0 ? '▲' : m.change < 0 ? '▼' : ''} ${fmt(Math.abs(m.change), 1)}%`, s: m.change > 0 ? 'เพิ่มขึ้น' : m.change < 0 ? 'ลดลง' : 'เท่าเดิม', col: m.change > 0 ? '#E5484D' : '#16A477' }
  ];
  kpis.forEach((k, i) => {
    const x = 56 + i * (kw + 24); card(c, x, ky, kw, kh);
    c.fillStyle = k.col; rr(c, x, ky, 8, kh, 4); c.fill();
    c.fillStyle = '#5B6B86'; c.font = F('600', 22); c.fillText(k.t, x + 28, ky + 42);
    c.fillStyle = k.col; c.font = F('700', 56); c.fillText(k.v, x + 28, ky + 94);
    c.fillStyle = '#5B6B86'; c.font = F('400', 20, 'Sarabun'); c.fillText(k.s, x + 28, ky + 120);
  });

  // table
  const ty = ky + kh + 28, rows = m.rows, extra = BH - 1350; const rh = 46 + Math.max(0, extra) / 14;
  const th = 70 + rows.length * rh + 16;
  card(c, 56, ty, BW - 112, th);
  const cols = [{ x: 84, t: 'โรค', a: 'left' }, { x: 520, t: 'ป่วย', a: 'right' }, { x: 610, t: 'ตาย', a: 'right' }, { x: 745, t: 'ต่อแสน ปชก.', a: 'right' }, { x: 850, t: 'CFR %', a: 'right' }, { x: 942, t: 'สถานะ', a: 'center' }];
  c.font = F('700', 20); c.fillStyle = '#5B6B86';
  cols.forEach(k => { c.textAlign = k.a; c.fillText(k.t, k.x, ty + 46); });
  const maxRate = Math.max(...rows.map(r => r.rate || 0), 1e-9);
  rows.forEach((r, i) => {
    const y = ty + 70 + i * rh;
    if (i % 2 === 0) { c.fillStyle = '#F6F9FE'; c.fillRect(64, y, BW - 128, rh); }
    const mid = y + rh / 2 + 8;
    c.textAlign = 'left'; c.fillStyle = '#10234A'; c.font = F('600', 24); c.fillText(`${i + 1}. ${r.name}`, 84, mid);
    c.textAlign = 'right'; c.font = F('700', 24); c.fillText(fmt(r.cases), 520, mid);
    c.fillStyle = r.deaths ? '#E5484D' : '#10234A'; c.fillText(fmt(r.deaths), 610, mid);
    c.fillStyle = '#10234A'; c.font = F('400', 22, 'Sarabun'); c.fillText(r.rate == null ? '–' : fmt(r.rate, 2), 745, mid); c.fillText(fmt(r.cfr, 2), 850, mid);
    if (r.rate != null) { c.fillStyle = 'rgba(38,113,242,.35)'; rr(c, 300, y + rh / 2 - 3, 140 * (r.rate / maxRate) + 3, 7, 3.5); c.fill(); }
    const col = LEVEL_COLOR[r.level] || '#94A3B8'; c.fillStyle = col; rr(c, 892, y + rh / 2 - 17, 100, 34, 17); c.fill();
    c.fillStyle = r.level === 'yellow' ? '#10234A' : '#fff'; c.textAlign = 'center'; c.font = F('700', 18); c.fillText(LEVEL_TEXT[r.level] || '–', 942, y + rh / 2 + 6);
  });
  c.textAlign = 'left';

  // summary
  const sy = ty + th + 24, sh = BH - sy - 130;
  if (sh > 80) {
    card(c, 56, sy, BW - 112, sh);
    c.fillStyle = '#174EA6'; c.font = F('700', 26); c.fillText('สรุปสถานการณ์', 84, sy + 46);
    c.fillStyle = '#10234A'; c.font = F('400', 22, 'Sarabun');
    let ln = 0; const maxL = Math.floor((sh - 70) / 32);
    for (const p of m.summary) { if (ln >= maxL) break; ln += wrap(c, '• ' + p, 84, sy + 86 + ln * 32, BW - 112 - 56, 32, maxL - ln); }
  }

  // footer
  c.fillStyle = '#10234A'; c.fillRect(0, BH - 96, BW, 96);
  c.fillStyle = '#fff'; c.font = F('600', 20); c.fillText(m.source, 56, BH - 56);
  c.fillStyle = '#9CC0FF'; c.font = F('400', 18, 'Sarabun'); c.fillText(m.asOfText + (m.url ? `  •  ${m.url}` : ''), 56, BH - 28);
  c.textAlign = 'right'; c.fillStyle = '#FFD27A'; c.font = F('700', 20); c.fillText('เฝ้าระวัง • ป้องกัน • ควบคุม', BW - 56, BH - 42); c.textAlign = 'left';
  return canvas;
}
