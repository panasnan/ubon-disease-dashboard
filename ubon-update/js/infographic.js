// ===== Weekly infographic rendered on <canvas> (exports PNG without external libraries) =====
import { fmt } from './data.js';
import { LEVEL_COLOR, LEVEL_TEXT } from './charts.js';

export const SIZES = { ppt: { w: 1920, h: 1080, label: 'PowerPoint 16:9 (1920×1080)', landscape: true }, social: { w: 1080, h: 1350, label: 'LINE / Facebook 1080×1350' }, a4: { w: 1240, h: 1754, label: 'A4 แนวตั้ง (150 dpi)' } };
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
function kpiList(m) {
  return [
    { t: 'ผู้ป่วยสะสม 10 โรค', v: fmt(m.cases), s: 'ราย', col: '#174EA6' },
    { t: 'ผู้เสียชีวิต', v: fmt(m.deaths), s: m.deaths ? `ราย • CFR ${fmt(m.cases ? m.deaths / m.cases * 100 : 0, 2)}%` : 'ราย', col: m.deaths ? '#E5484D' : '#16A477' },
    m.prev && !m.prev.samePeriod ? { t: m.prev.label, v: fmt(m.prev.rows.reduce((a, r) => a + (r?.cases || 0), 0)), s: `ราย • ตาย ${fmt(m.prev.rows.reduce((a, r) => a + (r?.deaths || 0), 0))}`, col: '#5B6B86' }
    : m.weekDelta != null ? { t: 'ผู้ป่วยรายใหม่สัปดาห์นี้', v: `+${fmt(m.weekDelta)}`, s: 'ราย (เทียบรายงานสัปดาห์ก่อน)', col: '#D08612' }
      : m.change == null ? { t: 'เทียบช่วงเดียวกันปีก่อน', v: '–', s: m.changeNote || 'ไม่มีข้อมูลเปรียบเทียบ', col: '#5B6B86' }
        : { t: 'เทียบช่วงเดียวกันปีก่อน', v: `${m.change > 0 ? '▲' : m.change < 0 ? '▼' : ''} ${fmt(Math.abs(m.change), 1)}%`, s: m.change > 0 ? 'เพิ่มขึ้น' : m.change < 0 ? 'ลดลง' : 'เท่าเดิม', col: m.change > 0 ? '#E5484D' : '#16A477' }
  ];
}

// 16:9 slide layout for PowerPoint (1920×1080)
async function drawLandscape(canvas, m) {
  const W = 1920, H = 1080; canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#F1F5FB'; c.fillRect(0, 0, W, H);
  const g = c.createLinearGradient(0, 0, W, 200); g.addColorStop(0, '#10234A'); g.addColorStop(1, '#174EA6');
  c.fillStyle = g; c.fillRect(0, 0, W, 196);
  c.fillStyle = 'rgba(255,255,255,.06)'; c.beginPath(); c.arc(W - 120, 20, 220, 0, 7); c.fill();
  const logo = await loadLogo(); const tx = logo ? 200 : 60;
  if (logo) { c.fillStyle = '#fff'; c.beginPath(); c.arc(112, 98, 68, 0, 7); c.fill(); c.drawImage(logo, 52, 38, 120, 120); }
  c.fillStyle = '#9CC0FF'; c.font = F('600', 24); c.fillText(m.office, tx, 60);
  c.fillStyle = '#fff'; c.font = F('700', 54); c.fillText('สถานการณ์ 10 โรคที่ต้องเฝ้าระวัง', tx, 122);
  c.fillStyle = '#FFD27A'; c.font = F('700', 34); c.fillText(m.area, tx, 170);
  c.textAlign = 'right'; c.fillStyle = '#fff'; c.font = F('700', 28); c.fillText(m.weekText, W - 60, 122);
  c.fillStyle = '#DCE7FF'; c.font = F('400', 24, 'Sarabun'); c.fillText(m.period, W - 60, 166); c.textAlign = 'left';
  if (m.demo) { c.fillStyle = '#E5484D'; rr(c, W - 360, 26, 300, 46, 23); c.fill(); c.fillStyle = '#fff'; c.font = F('700', 22); c.textAlign = 'center'; c.fillText('ข้อมูลจำลอง ห้ามใช้อ้างอิง', W - 210, 57); c.textAlign = 'left'; }

  // left: KPI cards + summary
  const lx = 60, lw = 640;
  kpiList(m).forEach((k, i) => {
    const y = 222 + i * 166, h = 148; card(c, lx, y, lw, h);
    c.fillStyle = k.col; rr(c, lx, y, 9, h, 4); c.fill();
    c.fillStyle = '#5B6B86'; c.font = F('600', 24); c.fillText(k.t, lx + 32, y + 44);
    c.fillStyle = k.col; c.font = F('700', 62); c.fillText(k.v, lx + 32, y + 112);
    c.fillStyle = '#5B6B86'; c.font = F('400', 22, 'Sarabun'); c.textAlign = 'right'; c.fillText(k.s, lx + lw - 28, y + 112); c.textAlign = 'left';
  });
  const sy = 222 + 3 * 166, sh = 990 - sy; card(c, lx, sy, lw, sh);
  c.fillStyle = '#174EA6'; c.font = F('700', 26); c.fillText('สรุปสถานการณ์', lx + 30, sy + 44);
  c.fillStyle = '#10234A'; c.font = F('400', 21, 'Sarabun');
  let ln = 0; const maxL = Math.floor((sh - 66) / 30);
  for (const p of m.summary) { if (ln >= maxL) break; ln += wrap(c, '• ' + p, lx + 30, sy + 82 + ln * 30, lw - 60, 30, maxL - ln); }

  // right: table
  const rx = 740, rw = 1120, ty = 222, th = 768; card(c, rx, ty, rw, th);
  if (m.prev) return drawCompareTable(c, m, rx, ty, rw, th), footer(c, m, W, H), canvas;
  const rows = m.rows, rh = (th - 84) / rows.length;
  const X = { name: rx + 36, bar: rx + 340, cases: rx + 640, deaths: rx + 740, rate: rx + 880, cfr: rx + 975, st: rx + rw - 76 };
  c.font = F('700', 22); c.fillStyle = '#5B6B86';
  [['โรค', X.name, 'left'], ['ป่วย', X.cases, 'right'], ['ตาย', X.deaths, 'right'], ['ต่อแสน ปชก.', X.rate, 'right'], ['CFR %', X.cfr, 'right'], ['สถานะ', X.st, 'center']].forEach(([t, x, a]) => { c.textAlign = a; c.fillText(t, x, ty + 50); });
  const maxRate = Math.max(...rows.map(r => r.rate || 0), 1e-9);
  rows.forEach((r, i) => {
    const y = ty + 72 + i * rh, mid = y + rh / 2 + 9;
    if (i % 2 === 0) { c.fillStyle = '#F6F9FE'; c.fillRect(rx + 10, y, rw - 20, rh); }
    c.textAlign = 'left'; c.fillStyle = '#10234A'; c.font = F('600', 28); c.fillText(`${i + 1}. ${r.name}`, X.name, mid);
    if (r.rate != null) { c.fillStyle = 'rgba(38,113,242,.35)'; rr(c, X.bar, y + rh / 2 - 4, 170 * (r.rate / maxRate) + 3, 9, 4.5); c.fill(); }
    c.textAlign = 'right'; c.font = F('700', 28); c.fillStyle = '#10234A'; c.fillText(fmt(r.cases), X.cases, mid);
    c.fillStyle = r.deaths ? '#E5484D' : '#10234A'; c.fillText(fmt(r.deaths), X.deaths, mid);
    c.fillStyle = '#10234A'; c.font = F('400', 25, 'Sarabun'); c.fillText(r.rate == null ? '–' : fmt(r.rate, 2), X.rate, mid); c.fillText(fmt(r.cfr, 2), X.cfr, mid);
    c.fillStyle = LEVEL_COLOR[r.level] || '#94A3B8'; rr(c, X.st - 60, y + rh / 2 - 19, 120, 38, 19); c.fill();
    c.fillStyle = r.level === 'yellow' ? '#10234A' : '#fff'; c.textAlign = 'center'; c.font = F('700', 20); c.fillText(LEVEL_TEXT[r.level] || '–', X.st, y + rh / 2 + 7);
  });
  c.textAlign = 'left';
  footer(c, m, W, H);
  return canvas;
}
function footer(c, m, W, H) {
  c.fillStyle = '#10234A'; c.fillRect(0, H - 70, W, 70);
  c.fillStyle = '#fff'; c.font = F('600', 21); c.fillText(m.source, 60, H - 28);
  c.textAlign = 'right'; c.fillStyle = '#9CC0FF'; c.font = F('400', 20, 'Sarabun'); c.fillText(m.asOfText + (m.url ? `  •  ${m.url}` : ''), W - 60, H - 28); c.textAlign = 'left';
}
// comparison table like the weekly PowerPoint report: previous year | current year
function drawCompareTable(c, m, rx, ty, rw, th) {
  const rows = m.rows, P = m.prev, hh = 112, rh = (th - hh - (P.samePeriod ? 12 : 34)) / rows.length;
  const X = { name: rx + 30, pc: rx + 455, pd: rx + 530, pf: rx + 625, cc: rx + 780, cd: rx + 855, cr: rx + 985, cf: rx + 1080 };
  const g1 = [rx + 330, rx + 640], g2 = [rx + 650, rx + rw - 12];
  // group headers
  c.fillStyle = '#E3E9F3'; rr(c, g1[0], ty + 14, g1[1] - g1[0], 44, 10); c.fill();
  c.fillStyle = '#174EA6'; rr(c, g2[0], ty + 14, g2[1] - g2[0], 44, 10); c.fill();
  c.textAlign = 'center'; c.font = F('700', 20);
  c.fillStyle = '#10234A'; c.fillText(P.label.replace(/\s+/g, ' '), (g1[0] + g1[1]) / 2, ty + 43);
  c.fillStyle = '#fff'; c.fillText(m.curLabel, (g2[0] + g2[1]) / 2, ty + 43);
  c.font = F('700', 18); c.fillStyle = '#5B6B86';
  [['ป่วย (ราย)', X.pc], ['ตาย', X.pd], ['CFR %', X.pf], ['ป่วย (ราย)', X.cc], ['ตาย', X.cd], ['ต่อแสน ปชก.', X.cr], ['CFR %', X.cf]].forEach(([t, x]) => { c.textAlign = 'right'; c.fillText(t, x, ty + 92); });
  c.textAlign = 'left'; c.fillText('โรค / ภัยสุขภาพ', X.name, ty + 92);
  rows.forEach((r, i) => {
    const y = ty + hh + i * rh, mid = y + rh / 2 + 9, p = P.rows[i];
    if (i % 2 === 0) { c.fillStyle = '#F6F9FE'; c.fillRect(rx + 10, y, rw - 20, rh); }
    c.fillStyle = 'rgba(227,233,243,.55)'; c.fillRect(g1[0], y, g1[1] - g1[0], rh);
    const lv = LEVEL_COLOR[r.level]; if (lv && r.level !== 'nobase' && r.level !== 'none') { c.fillStyle = lv; rr(c, rx + 12, y + 8, 6, rh - 16, 3); c.fill(); }
    c.textAlign = 'left'; c.fillStyle = '#10234A'; c.font = F('600', 26); c.fillText(`${i + 1}. ${r.name}`, X.name, mid);
    c.textAlign = 'right'; c.font = F('400', 24, 'Sarabun'); c.fillStyle = '#5B6B86';
    c.fillText(p ? fmt(p.cases) : '–', X.pc, mid); c.fillText(p ? (p.deaths ? fmt(p.deaths) : '-') : '–', X.pd, mid); c.fillText(p ? fmt(p.cfr, 2) : '–', X.pf, mid);
    c.font = F('700', 27); c.fillStyle = '#10234A'; c.fillText(fmt(r.cases), X.cc, mid);
    c.fillStyle = r.deaths ? '#E5484D' : '#10234A'; c.fillText(fmt(r.deaths), X.cd, mid);
    c.font = F('400', 24, 'Sarabun'); c.fillStyle = '#10234A'; c.fillText(r.rate == null ? '–' : fmt(r.rate, 2), X.cr, mid);
    c.fillStyle = r.cfr >= 1 ? '#E5484D' : '#10234A'; c.fillText(fmt(r.cfr, 2), X.cf, mid);
  });
  c.textAlign = 'left';
  if (!P.samePeriod) { c.fillStyle = '#5B6B86'; c.font = F('400', 17, 'Sarabun'); c.fillText(`* ${P.label} เป็นข้อมูลทั้งปี ช่วงเวลาไม่เท่ากับปีปัจจุบัน จึงไม่คำนวณร้อยละเปลี่ยนแปลง`, rx + 30, ty + th - 12); }
}

export async function drawInfographic(canvas, m, sizeKey = 'ppt') {
  try { await Promise.all([document.fonts.load('700 40px Anuphan'), document.fonts.load('400 20px Sarabun')]); } catch { }
  if (SIZES[sizeKey]?.landscape) return drawLandscape(canvas, m);
  const S = SIZES[sizeKey] || SIZES.social; const BW = 1080; const BH = Math.round(S.h * BW / S.w);
  canvas.width = S.w; canvas.height = S.h;
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
  const kpis = kpiList(m);
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
