// ===== ภาพ Info เพิ่มเติม (วาดบน canvas) — ใช้ข้อมูลรวมเท่านั้น =====
import { fmt } from './data.js';
import { centroid } from './map.js';

export const TEMPLATES = {
  situation: 'สถานการณ์ 10 โรค / การ์ดรายโรค',
  levels: 'เทียบประเทศ • เขต 10 • จังหวัด',
  district: 'แผนที่ + สถานะรายอำเภอ (รายโรค)',
  weekly: 'แนวโน้ม 25 อำเภอ (รายโรค)',
  dds: 'คุณภาพการรายงาน DDS รายอำเภอ',
};
export const THEMES = {
  navy: { label: 'น้ำเงิน (ค่าเริ่มต้น)', a: '#10234A', b: '#174EA6', acc: '#FFD27A', soft: '#F1F5FB', bar: '#2671F2' },
  teal: { label: 'เขียวน้ำทะเล', a: '#063B3A', b: '#0F7C74', acc: '#FFE08A', soft: '#EEF7F6', bar: '#119A8F' },
  wine: { label: 'แดงเลือดหมู', a: '#3A0F24', b: '#9B1D4A', acc: '#FFD6A0', soft: '#FBF1F4', bar: '#C2185B' },
  slate: { label: 'เทาเข้ม (ทางการ)', a: '#1F2933', b: '#3E4C59', acc: '#F7C948', soft: '#F3F4F6', bar: '#52606D' },
};
const F = (w, s, fam = 'Anuphan') => `${w} ${s}px ${fam}, Sarabun, Tahoma, sans-serif`;
const ST = [{ t: 'ปกติ', c: '#D6E4F5', f: '#10234A' }, { t: 'เพิ่มขึ้น', c: '#F6C343', f: '#10234A' }, { t: 'สูงกว่าจังหวัด', c: '#F6C343', f: '#10234A' }, { t: 'สูงกว่า+เพิ่มขึ้น', c: '#D93025', f: '#fff' }];
const RLV = r => r == null ? '#94A3B8' : r > 1.5 ? '#D93025' : r > 1 ? '#E0A800' : '#16A477';

function rr(c, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function card(c, x, y, w, h) { c.save(); c.shadowColor = 'rgba(16,35,74,.10)'; c.shadowBlur = 16; c.shadowOffsetY = 4; c.fillStyle = '#fff'; rr(c, x, y, w, h, 16); c.fill(); c.restore(); }
function pill(c, x, y, text, bg, fg, fs) { c.font = F('700', fs); const w = c.measureText(text).width + fs * 1.2, h = fs * 1.6; c.fillStyle = bg; rr(c, x, y - h + fs * 0.45, w, h, h / 2); c.fill(); c.fillStyle = fg; c.fillText(text, x + fs * 0.6, y); return w; }
let LOGO = null;
function logo() { if (LOGO) return LOGO; LOGO = new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = 'assets/moph-logo.png'; }); return LOGO; }

async function frame(canvas, m, size, title, sub) {
  const land = size.w > size.h, W = land ? 1920 : 1080, H = land ? 1080 : 1350, T = THEMES[m.theme] || THEMES.navy;
  canvas.width = size.w; canvas.height = size.h; const c = canvas.getContext('2d'); c.setTransform(size.w / W, 0, 0, size.w / W, 0, 0);
  c.fillStyle = T.soft; c.fillRect(0, 0, W, H);
  const hh = land ? 170 : 210, g = c.createLinearGradient(0, 0, W, hh); g.addColorStop(0, T.a); g.addColorStop(1, T.b);
  c.fillStyle = g; c.fillRect(0, 0, W, hh); c.fillStyle = 'rgba(255,255,255,.06)'; c.beginPath(); c.arc(W - 120, 10, 220, 0, 7); c.fill();
  const lg = await logo(), lx = 56, ls = land ? 104 : 110, tx = lg ? lx + ls + 28 : lx;
  if (lg) { c.fillStyle = '#fff'; c.beginPath(); c.arc(lx + ls / 2, hh / 2, ls / 2 + 6, 0, 7); c.fill(); c.drawImage(lg, lx, hh / 2 - ls / 2, ls, ls); }
  c.textAlign = 'left'; c.fillStyle = 'rgba(255,255,255,.75)'; c.font = F('600', land ? 22 : 21); c.fillText(m.office, tx, land ? 52 : 58);
  c.fillStyle = '#fff'; c.font = F('700', land ? 50 : 44); c.fillText(title, tx, land ? 110 : 112);
  c.fillStyle = T.acc; c.font = F('700', land ? 26 : 26); c.fillText(sub, tx, land ? 150 : 156);
  if (!land) { c.fillStyle = 'rgba(255,255,255,.8)'; c.font = F('400', 20, 'Sarabun'); c.fillText(m.weekText + ' • ' + m.asOf, tx, 190); }
  else { c.textAlign = 'right'; c.fillStyle = '#fff'; c.font = F('700', 30); c.fillText(m.weekText, W - 60, 92); c.fillStyle = 'rgba(255,255,255,.8)'; c.font = F('400', 21, 'Sarabun'); c.fillText(m.asOf, W - 60, 128); c.textAlign = 'left'; }
  const fh = land ? 64 : 84; c.fillStyle = T.a; c.fillRect(0, H - fh, W, fh);
  c.fillStyle = '#fff'; c.font = F('600', 19); c.fillText(m.source, 56, H - (land ? 26 : 48));
  if (!land) { c.fillStyle = 'rgba(255,255,255,.7)'; c.font = F('400', 17, 'Sarabun'); c.fillText(m.url || '', 56, H - 20); }
  else if (m.url) { c.textAlign = 'right'; c.fillStyle = 'rgba(255,255,255,.7)'; c.font = F('400', 18, 'Sarabun'); c.fillText(m.url, W - 56, H - 26); c.textAlign = 'left'; }
  return { c, W, H, land, T, top: hh + 28, bottom: H - fh - 28 };
}

// ---------- 1) ประเทศ • เขต • จังหวัด ----------
function drawLevels(f, m) {
  const { c, W, land, T, top, bottom } = f, L = m.levels; if (!L) return note(f, 'ยังไม่มีไฟล์มัธยฐาน 5 ปีของกองระบาด');
  const boxes = [['ประเทศไทย', L.tot.country, m.pops.country], ['เขตสุขภาพที่ 10', L.tot.region, m.pops.region], ['จังหวัดอุบลราชธานี', L.tot.province, m.pops.province]];
  const n = 3, gap = 24, bw = (W - 112 - gap * (n - 1)) / n, bh = land ? 230 : 210;
  boxes.forEach(([t, o, pop], i) => {
    const x = 56 + i * (bw + gap); card(c, x, top, bw, bh); c.fillStyle = [`#8DB2EA`, '#4F86DB', T.b][i]; rr(c, x, top, bw, 10, 5); c.fill();
    const fs = land ? 1 : 0.62;
    c.fillStyle = '#10234A'; c.font = F('700', 28 * fs + (land ? 0 : 6)); c.fillText(t, x + 24, top + 50);
    c.fillStyle = T.b; c.font = F('700', 58 * fs + (land ? 0 : 8)); c.fillText(fmt(o.cum), x + 24, top + (land ? 118 : 108));
    c.fillStyle = '#5B6B86'; c.font = F('400', 21 * fs + (land ? 0 : 5), 'Sarabun'); if (pop) c.fillText(`${fmt(o.cum / pop * 1e5, 1)} ต่อแสน ปชก.`, x + 24, top + (land ? 156 : 142));
    const r = o.med >= 3 ? o.rec / o.med : null; pill(c, x + 24, top + bh - 22, r == null ? 'ผู้ป่วยน้อย' : `${fmt(r, 1)} เท่าของปีปกติ`, RLV(r), '#fff', land ? 20 : 15);
  });
  const ty = top + bh + 28, th = bottom - ty; card(c, 56, ty, W - 112, th);
  if (m.dist && m.diseaseName !== 'รวม 10 โรค') return levelsDistricts(c, m, 56, ty, W - 112, th, land, T);
  // table by disease
  const rows = L.rows, rh = (th - 112) / rows.length, cx = land ? [96, 700, 1060, 1420] : [80, 590, 780, 960];
  c.font = F('700', land ? 22 : 19); c.fillStyle = '#5B6B86'; c.fillText(land ? `โรค — เทียบกับปีปกติ (สัปดาห์ที่ ${L.w0}–${L.W})` : `โรค — เทียบปีปกติ (สัปดาห์ ${L.w0}–${L.W})`, cx[0], ty + 50);
  ['ประเทศ', 'เขต 10', 'อุบลฯ'].forEach((t, i) => { c.textAlign = 'center'; c.fillText(t, cx[i + 1], ty + 50); }); c.textAlign = 'left';
  rows.forEach((r, i) => {
    const y = ty + 76 + i * rh, mid = y + rh / 2 + 8; if (i % 2 === 0) { c.fillStyle = '#F6F9FE'; c.fillRect(66, y, W - 132, rh); }
    c.fillStyle = '#10234A'; c.font = F('600', land ? 25 : 22); c.fillText(r.name, cx[0], mid);
    ['country', 'region', 'province'].forEach((k, j) => { const o = r[k], v = o.med >= 3 ? o.rec / o.med : null, t = v == null ? 'ข้อมูลน้อย' : fmt(v, 1) + ' เท่า';
      c.font = F('700', land ? 22 : 19); const w = c.measureText(t).width + 30, h = Math.min(rh - 8, land ? 36 : 32);
      c.fillStyle = v == null ? 'rgba(0,0,0,0)' : RLV(v); rr(c, cx[j + 1] - w / 2, y + (rh - h) / 2, w, h, h / 2); c.fill();
      c.fillStyle = v == null ? '#94A3B8' : '#fff'; if (v == null) c.font = F('400', land ? 19 : 16, 'Sarabun'); c.textAlign = 'center'; c.fillText(t, cx[j + 1], y + rh / 2 + 7); c.textAlign = 'left'; });
  });
  if (land && L.local.length) { c.fillStyle = '#D93025'; c.font = F('700', 22); c.fillText('สัญญาณเฉพาะพื้นที่:', 1560, ty + 110); c.fillStyle = '#10234A'; c.font = F('400', 22, 'Sarabun'); L.local.slice(0, 4).forEach((t, i) => { const [n, v] = t.split(': '); c.fillStyle = '#10234A'; c.font = F('700', 22); c.fillText(n, 1560, ty + 150 + i * 70); c.fillStyle = '#5B6B86'; c.font = F('400', 19, 'Sarabun'); c.fillText(v || '', 1560, ty + 178 + i * 70); }); c.fillStyle = '#5B6B86'; c.font = F('400', 17, 'Sarabun'); c.fillText('= อุบลฯ สูงกว่าแนวโน้มประเทศ', 1560, ty + 150 + Math.min(4, L.local.length) * 70 + 4); }
  c.fillStyle = '#5B6B86'; c.font = F('400', land ? 17 : 15, 'Sarabun'); c.fillText('แดง = สูงกว่าปกติ (มากกว่า 1.5 เท่า) • เหลือง = เฝ้าระวัง (1–1.5 เท่า) • เขียว = ปกติ • ข้อมูลน้อย = ผู้ป่วยน้อยเกินกว่าจะเทียบ', 80, ty + th - 14);
}

// เลือกโรคเดียว: ต่อจากประเทศ → เขต → จังหวัด ด้วย 25 อำเภอของอุบลฯ (อัตราป่วย 4 สัปดาห์ เทียบจังหวัด)
function levelsDistricts(c, m, x, y, w, h, land, T) {
  const D = m.dist, rows = [...D.rows].sort((a, b) => b.rt - a.rt), pr = D.provRate || 0;
  c.fillStyle = '#10234A'; c.font = F('700', land ? 26 : 22); c.fillText(`อุบลราชธานี รายอำเภอ • อัตราป่วย ${D.Wn} สัปดาห์ล่าสุด (สัปดาห์ที่ ${D.w0}–${D.wL})`, x + 28, y + 46);
  c.fillStyle = '#5B6B86'; c.font = F('400', land ? 18 : 15, 'Sarabun'); c.fillText(`ต่อแสนประชากร • เส้นประ = ทั้งจังหวัด ${fmt(pr, 1)} ต่อแสน • สีเหลือง/แดง = สูงกว่าจังหวัด 1.5 เท่าขึ้นไป`, x + 28, y + 74);
  const cols = land ? 2 : 1, per = Math.ceil(rows.length / cols), rh = (h - 104) / per, cw = (w - 40) / cols, mx = Math.max(1e-9, ...rows.map(r => r.rt), pr);
  rows.forEach((r, i) => { const col = Math.floor(i / per), xx = x + 28 + col * cw, yy = y + 92 + (i % per) * rh, mid = yy + rh / 2 + 6;
    c.fillStyle = '#10234A'; c.font = F('600', land ? 18 : 15); c.fillText(`${i + 1}. ${r.name}`, xx, mid);
    const bx = xx + (land ? 220 : 190), bw = cw - (land ? 400 : 300), bhh = Math.min(16, rh - 6);
    c.fillStyle = r.st >= 2 ? ST[r.st].c : r.st === 1 ? '#E0B030' : T.bar; c.globalAlpha = r.st ? 1 : 0.7; rr(c, bx, yy + rh / 2 - bhh / 2, Math.max(3, bw * r.rt / mx), bhh, bhh / 2); c.fill(); c.globalAlpha = 1;
    const px = bx + bw * pr / mx; c.save(); c.strokeStyle = '#10234A'; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(px, yy + 2); c.lineTo(px, yy + rh - 2); c.stroke(); c.restore();
    c.fillStyle = '#10234A'; c.font = F('700', land ? 17 : 14); c.fillText(fmt(r.rt, 1), bx + bw + 10, mid); c.fillStyle = '#5B6B86'; c.font = F('400', land ? 15 : 13, 'Sarabun'); c.fillText(`${fmt(r.rec)} ราย`, bx + bw + (land ? 70 : 60), mid); });
}

// ---------- 2) แผนที่ + สถานะรายอำเภอ ----------
function drawMapSt(c, mp, rows, x, y, w, h, T, label) {
  if (!mp?.districts?.length) return;
  const [x0, y0, vw, vh] = mp.viewBox, k = Math.min(w / vw, h / vh), ox = x + (w - vw * k) / 2, oy = y + (h - vh * k) / 2, by = Object.fromEntries(rows.map(r => [r.code, r]));
  c.save(); c.translate(ox, oy); c.scale(k, k); c.translate(-x0, -y0); c.lineWidth = 2 / k; c.strokeStyle = '#fff';
  for (const o of mp.districts) { const p = new Path2D(o.d); c.fillStyle = ST[by[o.code]?.st || 0].c; c.fill(p); c.stroke(p); }
  c.restore();
  if (label) for (const o of mp.districts) { const r = by[o.code], ct = centroid(o.d); if (!r || !ct) continue; const px = ox + (ct.x - x0) * k, py = oy + (ct.y - y0) * k; c.textAlign = 'center'; c.fillStyle = r.st >= 2 ? '#fff' : '#10234A'; c.font = F('700', 15); c.fillText(fmt(r.rec), px, py + 5); c.textAlign = 'left'; }
}
function drawDistrict(f, m) {
  const { c, W, land, T, top, bottom } = f, D = m.dist; if (!D) return note(f, 'ยังไม่มีข้อมูลรายอำเภอจาก DDS');
  const lw = land ? 760 : W - 112, lh = land ? bottom - top : 560;
  card(c, 56, top, lw, lh); drawMapSt(c, m.map, D.rows, 76, top + 20, lw - 40, lh - 110, T, true);
  let lx = 80; ST.forEach((s, i) => { lx += pill(c, lx, top + lh - 34, s.t, s.c, s.f, land ? 18 : 16) + 10; });
  // list
  const x = land ? 56 + lw + 24 : 56, y = land ? top : top + lh + 20, w = land ? W - x - 56 : W - 112, h = bottom - y;
  card(c, x, y, w, h);
  c.fillStyle = T.b; c.font = F('700', land ? 28 : 24); c.fillText(`${D.name} • สัปดาห์ที่ ${D.w0}–${D.wL}`, x + 28, y + 50);
  c.fillStyle = '#10234A'; c.font = F('400', land ? 21 : 19, 'Sarabun');
  c.fillText(`ทั้งจังหวัด ${fmt(D.provRec)} ราย • ${fmt(D.provRate, 1)} ต่อแสน ปชก. (${D.Wn} สัปดาห์)`, x + 28, y + 86);
  const list = [...D.rows].sort((a, b) => b.st - a.st || b.rt - a.rt), cols = 2, per = Math.ceil(list.length / cols), cw = (w - 56 - 32) / cols, rh = (h - 175) / per;
  const maxRt = Math.max(1e-9, ...list.map(r => r.rt || 0)), fs = Math.min(land ? 21 : 18, rh * 0.6);
  list.forEach((r, i) => {
    const col = Math.floor(i / per), xx = x + 28 + col * (cw + 32), yy = y + 108 + (i % per) * rh, mid = yy + rh / 2 + fs * 0.35;
    if (i % 2 === 0) { c.fillStyle = '#F6F9FE'; c.fillRect(xx - 10, yy, cw + 20, rh); }
    c.fillStyle = '#10234A'; let z = fs; c.font = F('600', z); const nm = `${i + 1}. ${r.name}`; while (z > 12 && c.measureText(nm).width > cw * 0.43) { z--; c.font = F('600', z); } c.fillText(nm, xx, mid);
    const bx = xx + cw * 0.45, bw = cw * 0.25;
    c.fillStyle = r.st ? ST[r.st].c : '#BFD3F2'; rr(c, bx, yy + rh / 2 - 6, Math.max(4, bw * (r.rt / maxRt)), 12, 6); c.fill();
    c.textAlign = 'right'; c.fillStyle = '#10234A'; c.font = F('700', fs * 0.92); c.fillText(fmt(r.rt, 1), xx + cw * 0.84, mid);
    c.font = F('400', fs * 0.85, 'Sarabun'); c.fillStyle = '#5B6B86'; c.fillText(`${fmt(r.rec)} ราย`, xx + cw, mid); c.textAlign = 'left';
  });
  c.fillStyle = '#5B6B86'; c.font = F('400', land ? 16 : 14, 'Sarabun'); c.fillText('ตัวเลข = ต่อแสนประชากร (4 สัปดาห์ล่าสุด)', x + 28, y + h - 44);
  c.fillStyle = '#5B6B86'; c.font = F('400', land ? 17 : 15, 'Sarabun'); c.fillText('สูงกว่าจังหวัด = อัตราป่วย ≥ 1.5 เท่าของจังหวัด • เพิ่มขึ้น = 4 สัปดาห์ล่าสุด ≥ 1.5 เท่าของ 4 สัปดาห์ก่อนหน้า', x + 28, y + h - 20);
}

// ---------- 3) แนวโน้ม 25 อำเภอ: 4 สัปดาห์ล่าสุด เทียบ 4 สัปดาห์ก่อนหน้า (ตัวเลข+คำ ไม่ใช้กราฟ) ----------
function drawWeekly(f, m) {
  const { c, W, land, T, top, bottom } = f, Wk = m.weekly; if (!Wk) return note(f, 'ยังไม่มีข้อมูลรายอำเภอจาก DDS');
  const N = Wk.wn.length, sum = (a, i0, i1) => a.slice(Math.max(0, i0), i1).reduce((x, y) => x + y, 0);
  const rows = Wk.tiles.map(o => { const a = sum(o.ser, N - 4, N), b = sum(o.ser, N - 8, N - 4); const ch = b > 0 ? (a - b) / b * 100 : null;
    const k = a >= 10 && (b === 0 || ch >= 50) ? 'up' : b >= 10 && ch != null && ch <= -30 ? 'down' : 'flat'; return { ...o, a, b, ch, k }; });
  const ord = { up: 0, flat: 1, down: 2 }; rows.sort((x, y) => ord[x.k] - ord[y.k] || y.a - x.a);
  const W4 = `สัปดาห์ ${Wk.wn[N - 4]}–${Wk.wn[N - 1]}`, P4 = `สัปดาห์ ${Wk.wn[N - 8]}–${Wk.wn[N - 5]}`;
  card(c, 56, top, W - 112, bottom - top);
  const nUp = rows.filter(r => r.k === 'up').length;
  c.fillStyle = nUp ? '#D93025' : '#16A477'; c.font = F('700', land ? 28 : 24);
  c.fillText(nUp ? `ผู้ป่วยเพิ่มขึ้นชัดเจน ${nUp} อำเภอ` : 'ไม่มีอำเภอที่ผู้ป่วยเพิ่มขึ้นชัดเจน', 84, top + 50);
  c.fillStyle = '#5B6B86'; c.font = F('400', land ? 19 : 16, 'Sarabun'); c.fillText(`เทียบผู้ป่วย ${W4} กับ ${P4} (ตามวันเริ่มป่วย)`, 84, top + 82);
  const cols = land ? 2 : 1, per = Math.ceil(rows.length / cols), cw = (W - 168 - (cols - 1) * 40) / cols, y0 = top + 150, rh = (bottom - 48 - y0) / per;
  const fs = Math.min(land ? 22 : 19, rh * 0.55);
  for (let k = 0; k < cols; k++) { const x = 84 + k * (cw + 40); c.fillStyle = '#5B6B86'; c.font = F('700', land ? 17 : 15); c.fillText('อำเภอ', x, y0 - 16); c.textAlign = 'right'; c.fillText('4 สัปดาห์ก่อน', x + cw * 0.56, y0 - 16); c.fillText('4 สัปดาห์ล่าสุด', x + cw * 0.78, y0 - 16); c.fillText('แนวโน้ม', x + cw, y0 - 16); c.textAlign = 'left'; }
  rows.forEach((r, i) => { const col = Math.floor(i / per), x = 84 + col * (cw + 40), yy = y0 + (i % per) * rh, mid = yy + rh / 2 + fs * 0.35;
    if (i % 2 === 0) { c.fillStyle = '#F6F9FE'; c.fillRect(x - 12, yy, cw + 24, rh); }
    c.fillStyle = '#10234A'; c.font = F('600', fs); c.fillText(r.name, x, mid);
    c.textAlign = 'right'; c.fillStyle = '#5B6B86'; c.font = F('400', fs, 'Sarabun'); c.fillText(fmt(r.b), x + cw * 0.56, mid);
    c.fillStyle = '#10234A'; c.font = F('700', fs); c.fillText(fmt(r.a), x + cw * 0.78, mid);
    const t = r.k === 'up' ? `▲ เพิ่มขึ้น${r.ch != null ? ' ' + fmt(r.ch, 0) + '%' : ''}` : r.k === 'down' ? `▼ ลดลง ${fmt(-r.ch, 0)}%` : 'ใกล้เคียงเดิม';
    c.fillStyle = r.k === 'up' ? '#D93025' : r.k === 'down' ? '#16A477' : '#94A3B8'; c.font = F(r.k === 'flat' ? '400' : '700', fs * 0.92, r.k === 'flat' ? 'Sarabun' : undefined); c.fillText(t, x + cw, mid); c.textAlign = 'left'; });
  c.fillStyle = '#5B6B86'; c.font = F('400', land ? 16 : 14, 'Sarabun'); c.fillText('เพิ่มขึ้น = ผู้ป่วย 4 สัปดาห์ล่าสุด ≥ 10 ราย และมากกว่าช่วงก่อน ≥ 50% • ลดลง = น้อยกว่าช่วงก่อน ≥ 30% • 2 สัปดาห์ล่าสุดอาจยังรายงานไม่ครบ', 84, bottom - 20);
}

// ---------- 4) คุณภาพรายงาน DDS ----------
function drawDds(f, m) {
  const { c, W, land, T, top, bottom } = f, Q = m.dds; if (!Q || !Q.rows.length) return note(f, 'ยังไม่มีข้อมูลการรายงานรายสถานพยาบาล');
  if (Q.dist) return drawDdsDist(f, Q);
  const kp = [['สถานพยาบาลที่ส่งรายงาน', `${fmt(Q.cov, 1)}%`, `${fmt(Q.r)} จาก ${fmt(Q.n)} แห่ง`], ['ส่งทันเวลา', Q.tim == null ? '–' : `${fmt(Q.tim, 1)}%`, 'ของรายงานทั้งหมด'], ['อำเภอที่ส่งครบ 100%', fmt(Q.full), 'จาก 25 อำเภอ']];
  const kw = (W - 112 - 48) / 3, kh = 150;
  kp.forEach(([t, v, s], i) => { const x = 56 + i * (kw + 24); card(c, x, top, kw, kh); c.fillStyle = T.b; rr(c, x, top, 8, kh, 4); c.fill();
    c.fillStyle = '#5B6B86'; c.font = F('600', land ? 22 : 18); c.fillText(t, x + 26, top + 42); c.fillStyle = T.b; c.font = F('700', land ? 54 : 40); c.fillText(v, x + 26, top + 100); c.fillStyle = '#5B6B86'; c.font = F('400', land ? 19 : 16, 'Sarabun'); c.fillText(s, x + 26, top + 132); });
  const y = top + kh + 24, h = bottom - y; card(c, 56, y, W - 112, h);
  c.fillStyle = '#10234A'; c.font = F('700', land ? 24 : 21); c.fillText('ร้อยละสถานพยาบาลที่ส่งรายงาน รายอำเภอ', 84, y + 46);
  c.fillStyle = '#5B6B86'; c.font = F('400', land ? 18 : 15, 'Sarabun'); c.fillText(Q.period, 84, y + 74);
  const rows = [...Q.rows].sort((a, b) => a.p - b.p), cols = land ? 2 : 1, per = Math.ceil(rows.length / cols), rh = (h - 100) / per, cw = (W - 112 - 56) / cols;
  rows.forEach((r, i) => { const col = Math.floor(i / per), x = 84 + col * cw, yy = y + 92 + (i % per) * rh, mid = yy + rh / 2 + 7;
    c.fillStyle = '#10234A'; c.font = F('600', land ? 19 : 16); c.fillText(r.name, x, mid);
    const bx = x + (land ? 220 : 200), bw = cw - (land ? 420 : 320); c.fillStyle = '#E3E9F3'; rr(c, bx, yy + rh / 2 - 8, bw, 16, 8); c.fill();
    c.fillStyle = r.p >= 100 ? '#16A477' : r.p >= 80 ? '#E0A800' : '#D93025'; rr(c, bx, yy + rh / 2 - 8, Math.max(6, bw * r.p / 100), 16, 8); c.fill();
    c.fillStyle = '#10234A'; c.font = F('700', land ? 18 : 15); c.fillText(`${fmt(r.p, 1)}%`, bx + bw + 12, mid); c.fillStyle = '#5B6B86'; c.font = F('400', land ? 16 : 13, 'Sarabun'); c.fillText(`${r.r}/${r.n}`, bx + bw + (land ? 86 : 74), mid); });
}
// รายอำเภอ: รายชื่อสถานพยาบาล ต้องติดตาม / ทำแล้ว
function drawDdsDist(f, Q) {
  const { c, W, land, T, top, bottom } = f, L = Q.dist.list, todo = L.filter(o => !o.ok).sort((a, b) => (a.lv === 'red' ? 0 : 1) - (b.lv === 'red' ? 0 : 1)), done = L.filter(o => o.ok);
  const rep = L.reduce((a, o) => a + o.rep, 0), tim = L.reduce((a, o) => a + o.tim, 0), sent = L.filter(o => o.reported).length;
  const kp = [['ส่งรายงานแล้ว', `${sent}/${L.length}`, 'แห่ง', sent === L.length ? '#16A477' : '#D93025'], ['ส่งทันเวลา (7 วัน)', rep ? `${fmt(tim / rep * 100, 1)}%` : '–', 'ของรายงานทั้งหมด', T.b], ['ต้องติดตาม', `${todo.length}`, 'แห่ง', todo.length ? '#D93025' : '#16A477']];
  const kw = (W - 112 - 48) / 3, kh = land ? 140 : 130;
  kp.forEach(([t, v, s2, col], i) => { const x = 56 + i * (kw + 24); card(c, x, top, kw, kh); c.fillStyle = col; rr(c, x, top, 8, kh, 4); c.fill();
    c.fillStyle = '#5B6B86'; c.font = F('600', land ? 22 : 18); c.fillText(t, x + 26, top + 40); c.fillStyle = col; c.font = F('700', land ? 52 : 40); c.fillText(v, x + 26, top + (land ? 98 : 92)); c.fillStyle = '#5B6B86'; c.font = F('400', land ? 19 : 15, 'Sarabun'); c.fillText(s2, x + 26, top + kh - 14); });
  const y = top + kh + 24, h = bottom - y; card(c, 56, y, W - 112, h);
  const items = [...todo.map(o => ({ ...o, g: 'todo' })), ...done.map(o => ({ ...o, g: 'done' }))];
  const cols = land ? (items.length > 30 ? 3 : 2) : (items.length > 24 ? 2 : 1), per = Math.ceil(items.length / cols), cw = (W - 168 - (cols - 1) * 32) / cols, y0 = y + 70, rh = Math.min(52, (h - 110) / per), fs = Math.min(land ? 21 : 18, rh * 0.58);
  c.fillStyle = todo.length ? '#D93025' : '#16A477'; c.font = F('700', land ? 24 : 21); c.fillText(todo.length ? `ต้องติดตาม ${todo.length} แห่ง (แสดงก่อน) • ทำแล้ว ${done.length} แห่ง` : `ทำแล้วครบทุกแห่ง ${done.length} แห่ง`, 84, y + 44);
  items.forEach((o, i) => { const col = Math.floor(i / per), x = 84 + col * (cw + 32), yy = y0 + (i % per) * rh, mid = yy + rh / 2 + fs * 0.35;
    if (o.g === 'todo') { c.fillStyle = o.lv === 'red' ? '#FDECEC' : '#FFF6DB'; c.fillRect(x - 10, yy + 2, cw + 20, rh - 4); }
    c.fillStyle = o.g === 'todo' ? (o.lv === 'red' ? '#D93025' : '#B8860B') : '#16A477'; c.font = F('700', fs); c.fillText(o.g === 'todo' ? '!' : '✓', x, mid);
    const tag = o.g === 'todo' ? o.t : ''; c.font = F('400', fs * 0.82, 'Sarabun'); const tw = tag ? c.measureText(tag).width + 12 : 0;
    let z = fs, nm = o.name; c.font = F('600', z); while (z > fs * 0.8 && c.measureText(nm).width > cw - 36 - tw) { z--; c.font = F('600', z); } while (nm.length > 4 && c.measureText(nm).width > cw - 36 - tw) nm = nm.slice(0, -2).trimEnd() + '…', nm = nm.replace(/…+$/, '…');
    c.fillStyle = '#10234A'; c.fillText(nm, x + 26, mid);
    if (tag) { c.textAlign = 'right'; c.fillStyle = o.lv === 'red' ? '#D93025' : '#8A6500'; c.font = F('400', fs * 0.82, 'Sarabun'); c.fillText(tag, x + cw, mid); c.textAlign = 'left'; } });
  c.fillStyle = '#5B6B86'; c.font = F('400', land ? 16 : 14, 'Sarabun'); c.fillText(`ทำแล้ว = ส่งรายงาน และส่งทันภายใน 7 วันตั้งแต่ 90% ขึ้นไป • ${Q.period}`, 84, y + h - 18);
}
function note(f, t) { const { c, W, top } = f; c.fillStyle = '#5B6B86'; c.font = F('600', 30); c.fillText(t, 56, top + 60); }

export async function drawTemplate(canvas, m, tpl, size) {
  try { await Promise.all([document.fonts.load('700 40px Anuphan'), document.fonts.load('400 20px Sarabun')]); } catch { }
  const titles = { levels: ['สถานการณ์เทียบระดับประเทศ เขต จังหวัด', m.diseaseName], district: ['สถานการณ์รายอำเภอ', `${m.diseaseName} • จังหวัดอุบลราชธานี`], weekly: ['แนวโน้มผู้ป่วย 25 อำเภอ', `${m.diseaseName} • จังหวัดอุบลราชธานี`], dds: ['คุณภาพการรายงานในระบบ DDS (D506)', m.dds?.dist ? m.dds.dist.name + ' • จังหวัดอุบลราชธานี' : 'จังหวัดอุบลราชธานี'] };
  const [t, s] = titles[tpl]; const f = await frame(canvas, m, size, t, s);
  ({ levels: drawLevels, district: drawDistrict, weekly: drawWeekly, dds: drawDds })[tpl](f, m);
  return canvas;
}
