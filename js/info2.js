// ===== ภาพ Info เพิ่มเติม (วาดบน canvas) — ใช้ข้อมูลรวมเท่านั้น =====
import { fmt } from './data.js';
import { centroid } from './map.js';

export const TEMPLATES = {
  situation: '① สรุปสถานการณ์ (ทางการ/ประชุม/ผู้บริหาร)',
  public: '② สื่อสารความเสี่ยงสำหรับประชาชน',
  alert: '③ สรุปแจ้งเตือนพื้นที่/อำเภอ',
  levels: 'เทียบประเทศ • เขต 10 • จังหวัด',
  district: 'แผนที่ + สถานะรายอำเภอ (รายโรค)',
  weekly: '25 อำเภอ × 12 สัปดาห์ (รายโรค)',
  dds: 'คุณภาพการรายงาน DDS รายอำเภอ',
};
export const THEMES = {
  navy: { label: 'น้ำเงิน (ค่าเริ่มต้น)', a: '#10234A', b: '#174EA6', acc: '#FFD27A', soft: '#F1F5FB', bar: '#2671F2' },
  teal: { label: 'เขียวน้ำทะเล', a: '#063B3A', b: '#0F7C74', acc: '#FFE08A', soft: '#EEF7F6', bar: '#119A8F' },
  wine: { label: 'แดงเลือดหมู', a: '#3A0F24', b: '#9B1D4A', acc: '#FFD6A0', soft: '#FBF1F4', bar: '#C2185B' },
  slate: { label: 'เทาเข้ม (ทางการ)', a: '#1F2933', b: '#3E4C59', acc: '#F7C948', soft: '#F3F4F6', bar: '#52606D' },
};
const F = (w, s, fam = 'Anuphan') => `${w} ${s}px ${fam}, Sarabun, Tahoma, sans-serif`;
const ST = [{ t: 'ปกติ', c: '#D6E4F5', f: '#10234A' }, { t: 'เพิ่มขึ้น', c: '#F6C343', f: '#10234A' }, { t: 'สูงกว่าจังหวัด', c: '#F08A24', f: '#fff' }, { t: 'สูงกว่า+เพิ่มขึ้น', c: '#D93025', f: '#fff' }];
const RLV = r => r == null ? '#94A3B8' : r > 2 ? '#D93025' : r > 1.5 ? '#F08A24' : r > 1 ? '#E0A800' : '#16A477';

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
  const fh = land ? 70 : 84; c.fillStyle = T.a; c.fillRect(0, H - fh, W, fh);
  c.fillStyle = '#fff'; c.font = F('600', land ? 18 : 16); c.fillText(m.source, 56, H - (land ? 36 : 54));
  c.fillStyle = 'rgba(255,255,255,.72)'; c.font = F('400', land ? 15 : 14, 'Sarabun'); c.fillText(`${m.weekText} • ${m.asOf} • ข้อมูลรวม ไม่ระบุตัวบุคคล (PDPA)`, 56, H - (land ? 14 : 32));
  if (land && m.url) { c.textAlign = 'right'; c.fillStyle = 'rgba(255,255,255,.7)'; c.font = F('400', 18, 'Sarabun'); c.fillText(m.url, W - 56, H - 26); c.textAlign = 'left'; }
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
    const r = o.med >= 3 ? o.rec / o.med : null; pill(c, x + 24, top + bh - 22, r == null ? 'ผู้ป่วยน้อย' : `${fmt(r, 2)} เท่าของมัธยฐาน`, RLV(r), '#fff', land ? 20 : 15);
  });
  const ty = top + bh + 28, th = bottom - ty; card(c, 56, ty, W - 112, th);
  if (m.dist && m.diseaseName !== 'รวม 10 โรค') return levelsDistricts(c, m, 56, ty, W - 112, th, land, T);
  // table by disease
  const rows = L.rows, rh = (th - 90) / rows.length, cx = land ? [96, 700, 1060, 1420] : [80, 590, 780, 960];
  c.font = F('700', land ? 22 : 19); c.fillStyle = '#5B6B86'; c.fillText(land ? `โรค — อัตราส่วนต่อมัธยฐาน 5 ปี (สัปดาห์ที่ ${L.w0}–${L.W})` : `โรค (× มัธยฐาน, สัปดาห์ที่ ${L.w0}–${L.W})`, cx[0], ty + 50);
  ['ประเทศ', 'เขต 10', 'อุบลฯ'].forEach((t, i) => { c.textAlign = 'center'; c.fillText(t, cx[i + 1], ty + 50); }); c.textAlign = 'left';
  rows.forEach((r, i) => {
    const y = ty + 76 + i * rh, mid = y + rh / 2 + 8; if (i % 2 === 0) { c.fillStyle = '#F6F9FE'; c.fillRect(66, y, W - 132, rh); }
    c.fillStyle = '#10234A'; c.font = F('600', land ? 25 : 22); c.fillText(r.name, cx[0], mid);
    ['country', 'region', 'province'].forEach((k, j) => { const o = r[k], v = o.med >= 3 ? o.rec / o.med : null, t = v == null ? '–' : fmt(v, 2) + '×';
      c.font = F('700', land ? 22 : 19); const w = c.measureText(t).width + 30, h = Math.min(rh - 8, land ? 36 : 32);
      c.fillStyle = v == null ? '#E3E9F3' : RLV(v); rr(c, cx[j + 1] - w / 2, y + (rh - h) / 2, w, h, h / 2); c.fill();
      c.fillStyle = v == null ? '#5B6B86' : '#fff'; c.textAlign = 'center'; c.fillText(t, cx[j + 1], y + rh / 2 + 7); c.textAlign = 'left'; });
  });
  if (land && L.local.length) { c.fillStyle = '#D93025'; c.font = F('700', 22); c.fillText('สัญญาณเฉพาะพื้นที่:', 1560, ty + 110); c.fillStyle = '#10234A'; c.font = F('400', 22, 'Sarabun'); L.local.slice(0, 6).forEach((t, i) => c.fillText('• ' + t, 1560, ty + 150 + i * 36)); c.fillStyle = '#5B6B86'; c.font = F('400', 17, 'Sarabun'); c.fillText('อุบลฯ สูงกว่าแนวโน้มประเทศ', 1560, ty + 150 + Math.min(6, L.local.length) * 36 + 8); }
}

// เลือกโรคเดียว: ต่อจากประเทศ → เขต → จังหวัด ด้วย 25 อำเภอของอุบลฯ (อัตราป่วย 4 สัปดาห์ เทียบจังหวัด)
function levelsDistricts(c, m, x, y, w, h, land, T) {
  const D = m.dist, rows = [...D.rows].sort((a, b) => b.rt - a.rt), pr = D.provRate || 0;
  c.fillStyle = '#10234A'; c.font = F('700', land ? 26 : 22); c.fillText(`อุบลราชธานี รายอำเภอ • อัตราป่วย ${D.Wn} สัปดาห์ล่าสุด (สัปดาห์ที่ ${D.w0}–${D.wL})`, x + 28, y + 46);
  c.fillStyle = '#5B6B86'; c.font = F('400', land ? 18 : 15, 'Sarabun'); c.fillText(`ต่อแสนประชากร • เส้นประ = ทั้งจังหวัด ${fmt(pr, 1)} ต่อแสน • สีส้ม/แดง = สูงกว่าจังหวัด 1.5 เท่าขึ้นไป`, x + 28, y + 74);
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
  const list = D.rows.filter(r => r.rec > 0).sort((a, b) => b.st - a.st || b.rt - a.rt).slice(0, land ? 14 : 8), rh = Math.min(54, (h - 170) / Math.max(1, list.length));
  const maxRt = Math.max(1e-9, ...list.map(r => r.rt || 0));
  list.forEach((r, i) => {
    const yy = y + 116 + i * rh, mid = yy + rh / 2 + 8; if (i % 2 === 0) { c.fillStyle = '#F6F9FE'; c.fillRect(x + 12, yy, w - 24, rh); }
    c.fillStyle = '#10234A'; c.font = F('600', land ? 23 : 20); c.fillText(`${i + 1}. ${r.name}`, x + 28, mid);
    const bx = x + (land ? 300 : 260), bw = w - (land ? 640 : 560);
    c.fillStyle = r.st ? ST[r.st].c : '#BFD3F2'; rr(c, bx, yy + rh / 2 - 9, Math.max(4, bw * (r.rt / maxRt)), 18, 9); c.fill();
    c.textAlign = 'right'; c.fillStyle = '#10234A'; c.font = F('700', land ? 22 : 19); c.fillText(`${fmt(r.rt, 1)}/แสน`, bx + bw + (land ? 130 : 120), mid);
    c.font = F('400', land ? 20 : 17, 'Sarabun'); c.fillStyle = '#5B6B86'; c.fillText(`${fmt(r.rec)} ราย`, x + w - 28, mid); c.textAlign = 'left';
  });
  c.fillStyle = '#5B6B86'; c.font = F('400', land ? 17 : 15, 'Sarabun'); c.fillText('สูงกว่าจังหวัด = อัตราป่วย ≥ 1.5 เท่าของจังหวัด • เพิ่มขึ้น = 4 สัปดาห์ล่าสุด ≥ 1.5 เท่าของ 4 สัปดาห์ก่อนหน้า', x + 28, y + h - 20);
}

// ---------- 3) small multiples ----------
function drawWeekly(f, m) {
  const { c, W, land, T, top, bottom } = f, Wk = m.weekly; if (!Wk) return note(f, 'ยังไม่มีข้อมูลรายอำเภอจาก DDS');
  const cols = land ? 7 : 5, n = Wk.tiles.length, rows = Math.ceil(n / cols), gap = 14, tw = (W - 112 - gap * (cols - 1)) / cols, th = (bottom - top - 40 - gap * (rows - 1)) / rows;
  c.fillStyle = '#5B6B86'; c.font = F('400', land ? 19 : 17, 'Sarabun'); c.fillText(`แท่ง = ผู้ป่วยรายสัปดาห์ สัปดาห์ที่ ${Wk.wn[0]}–${Wk.wn[Wk.wn.length - 1]} (แท่งขวาสุด = ล่าสุด) • เส้นประ = ระดับเฉลี่ยของจังหวัด`, 56, top + 4);
  Wk.tiles.forEach((o, i) => {
    const x = 56 + (i % cols) * (tw + gap), y = top + 24 + Math.floor(i / cols) * (th + gap);
    c.save(); c.fillStyle = o.st >= 2 ? '#FFF5EC' : '#fff'; c.shadowColor = 'rgba(16,35,74,.08)'; c.shadowBlur = 8; rr(c, x, y, tw, th, 12); c.fill(); c.restore();
    if (o.st >= 2) { c.strokeStyle = ST[o.st].c; c.lineWidth = 2; rr(c, x, y, tw, th, 12); c.stroke(); }
    c.fillStyle = '#10234A'; c.font = F('700', land ? 19 : 17); c.fillText(o.name, x + 12, y + 28);
    c.textAlign = 'right'; c.fillStyle = o.st ? ST[o.st].c === '#F6C343' ? '#B8860B' : ST[o.st].c : '#5B6B86'; c.font = F('700', land ? 17 : 15); c.fillText(fmt(o.rec), x + tw - 12, y + 28); c.textAlign = 'left';
    const bx = x + 10, by = y + 40, bw = tw - 20, bh = th - 56, N = o.ser.length, mx = Math.max(1, ...o.ser, ...o.ref), sw = bw / N;
    o.ser.forEach((v, j) => { const hh = bh * v / mx; c.fillStyle = o.st >= 2 ? ST[o.st].c : o.st === 1 ? '#D9A21B' : T.bar; c.globalAlpha = j === N - 1 ? 1 : 0.55; rr(c, bx + j * sw + 1, by + bh - hh, sw - 2, hh, 2); c.fill(); c.globalAlpha = 1; });
    c.save(); c.strokeStyle = '#5B6B86'; c.setLineDash([4, 4]); c.lineWidth = 1.5; c.beginPath(); o.ref.forEach((v, j) => { const px = bx + j * sw + sw / 2, py = by + bh - bh * v / mx; j ? c.lineTo(px, py) : c.moveTo(px, py); }); c.stroke(); c.restore();
  });
}

// ---------- 4) คุณภาพรายงาน DDS ----------
function drawDds(f, m) {
  const { c, W, land, T, top, bottom } = f, Q = m.dds; if (!Q || !Q.rows.length) return note(f, 'ยังไม่มีข้อมูลการรายงานรายสถานพยาบาล');
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
// ---------- ② สื่อสารความเสี่ยงสำหรับประชาชน ----------
function wrap(c, text, x, y, maxW, lh) { let line = '', yy = y; const out = [];
  for (const w of text.split(/(?<=\s)/)) { const t = line + w; if (c.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    while (c.measureText(line).width > maxW) { let k = line.length; while (k > 1 && c.measureText(line.slice(0, k)).width > maxW) k--; out.push(line.slice(0, k)); line = line.slice(k); } }
  if (line) out.push(line);
  out.forEach((l, i) => c.fillText(l.trim(), x, yy + i * lh)); return out.length * lh; }
function drawPublic(f, m) {
  const { c, W, H, land, T, top, bottom } = f, P = m.pub; if (!P) return note(f, 'เลือกโรคหนึ่งโรคเพื่อสร้างภาพสื่อสารประชาชน');
  // status band
  const bh = land ? 120 : 150; c.fillStyle = P.color; rr(c, 56, top, W - 112, bh, 18); c.fill();
  c.fillStyle = '#fff'; c.font = F('700', land ? 44 : 38); c.fillText(P.headline, 92, top + (land ? 58 : 62));
  c.font = F('400', land ? 26 : 24, 'Sarabun'); wrap(c, P.detail, 92, top + (land ? 98 : 106), W - 220, land ? 30 : 30);
  const y0 = top + bh + 26, cols = [['อาการสำคัญ', P.sym, '#174EA6', '🩺'], ['ป้องกันอย่างไร', P.pre, '#0F7C74', '🛡️'], ['รีบไปพบแพทย์เมื่อ', P.doc, '#D93025', '🚑']];
  const n = 3, gap = 22, cw = land ? (W - 112 - gap * 2) / 3 : W - 112, ch = land ? bottom - y0 - 70 : (bottom - y0 - 90 - gap * 2) / 3;
  cols.forEach(([t, items, col, ic], i) => { const x = land ? 56 + i * (cw + gap) : 56, y = land ? y0 : y0 + i * (ch + gap);
    card(c, x, y, cw, ch); c.fillStyle = col; rr(c, x, y, cw, land ? 70 : 58, 16); c.fill(); c.fillRect(x, y + 40, cw, (land ? 30 : 18));
    c.fillStyle = '#fff'; c.font = F('700', land ? 32 : 28); c.fillText(`${ic}  ${t}`, x + 24, y + (land ? 47 : 40));
    let yy = y + (land ? 124 : 88); const fs = land ? 31 : 24, lh = fs * (land ? 1.4 : 1.3);
    for (const it of items) { if (yy > y + ch - 8) break; c.fillStyle = col; c.beginPath(); c.arc(x + 34, yy - fs * 0.35, land ? 8 : 6, 0, 7); c.fill(); c.fillStyle = '#10234A'; c.font = F('500', fs, 'Sarabun'); yy += wrap(c, it, x + 54, yy, cw - 80, lh) + (land ? 22 : 5); } });
  // hotline strip
  const hy = bottom - (land ? 52 : 70); c.fillStyle = '#FFF3D6'; rr(c, 56, hy, W - 112, land ? 52 : 62, 14); c.fill();
  c.fillStyle = '#8A5A00'; c.font = F('700', land ? 26 : 22); c.textAlign = 'center'; c.fillText(`📞 ${P.hotline} • สอบถาม/ปรึกษาได้ที่ รพ.สต. และโรงพยาบาลใกล้บ้าน`, W / 2, hy + (land ? 35 : 40)); c.textAlign = 'left';
}

// ---------- ③ สรุปแจ้งเตือนพื้นที่/อำเภอ ----------
function drawAlert(f, m) {
  const { c, W, land, T, top, bottom } = f, A = m.alert; if (!A) return note(f, 'ยังไม่มีข้อมูลรายอำเภอจาก DDS');
  const lw = land ? (W - 112) * 0.62 : W - 112, h1 = land ? bottom - top : (bottom - top) * 0.62;
  card(c, 56, top, lw, h1);
  c.fillStyle = T.b; c.font = F('700', land ? 28 : 24); c.fillText(`อำเภอที่ต้องเฝ้าระวัง • สัปดาห์ที่ ${A.w0}–${A.wL}`, 84, top + 48);
  c.fillStyle = '#5B6B86'; c.font = F('400', land ? 18 : 16, 'Sarabun'); c.fillText('อัตราป่วย 4 สัปดาห์ล่าสุด ≥ 1.5 เท่าของจังหวัด และมีผู้ป่วยตั้งแต่ 5 รายขึ้นไป (รายโรค)', 84, top + 78);
  const cx = land ? [84, 330, 600, 760, 880] : [84, 300, 560, 700, 820];
  c.font = F('700', land ? 18 : 16); c.fillStyle = '#5B6B86'; ['อำเภอ', 'โรค', 'ผู้ป่วย', 'เทียบจังหวัด', 'สิ่งที่ควรทำ'].forEach((t, i) => c.fillText(t, cx[i], top + 116));
  const L = A.items.slice(0, land ? 12 : 9), rh = Math.min(56, (h1 - 140) / Math.max(1, L.length));
  if (!L.length) { c.fillStyle = '#0E7A50'; c.font = F('700', 26); c.fillText('✓ ไม่มีอำเภอที่เข้าเกณฑ์เฝ้าระวังในสัปดาห์นี้', 84, top + 170); }
  L.forEach((o, i) => { const y = top + 132 + i * rh, mid = y + rh / 2 + 7; if (i % 2 === 0) { c.fillStyle = '#F6F9FE'; c.fillRect(66, y, lw - 20, rh); }
    c.fillStyle = '#10234A'; c.font = F('700', land ? 21 : 18); c.fillText(o.district, cx[0], mid); c.font = F('500', land ? 20 : 17, 'Sarabun'); c.fillText(o.disease, cx[1], mid);
    c.font = F('700', land ? 20 : 17); c.fillText(`${o.cases} ราย`, cx[2], mid); pill(c, cx[3], mid, `${o.rr.toFixed(1)}×`, o.rr >= 2 ? '#D93025' : '#F08A24', '#fff', land ? 17 : 15);
    c.fillStyle = '#5B6B86'; c.font = F('400', land ? 17 : 14, 'Sarabun'); c.fillText(o.todo, cx[4], mid); });
  // clusters box
  const x2 = land ? 56 + lw + 22 : 56, y2 = land ? top : top + h1 + 20, w2 = land ? W - x2 - 56 : W - 112, h2 = bottom - y2;
  card(c, x2, y2, w2, h2); c.fillStyle = '#D93025'; c.font = F('700', land ? 26 : 22); c.fillText(`กลุ่มก้อนที่เข้าเกณฑ์ (${A.clusters.length})`, x2 + 24, y2 + 46);
  c.fillStyle = '#5B6B86'; c.font = F('400', land ? 16 : 14, 'Sarabun'); c.fillText('ผู้ป่วยโรคเดียวกัน ตำบลเดียวกัน ภายใน 1 ระยะฟักตัว', x2 + 24, y2 + 72);
  const C = A.clusters.slice(0, land ? 10 : 4), ch2 = Math.min(64, (h2 - 160) / Math.max(1, C.length));
  C.forEach((o, i) => { const y = y2 + 92 + i * ch2; c.fillStyle = '#FFF4EC'; rr(c, x2 + 16, y, w2 - 32, ch2 - 8, 10); c.fill();
    c.fillStyle = '#10234A'; c.font = F('700', land ? 19 : 17); c.fillText(`${o.disease} • ${o.district}`, x2 + 30, y + (ch2 - 8) / 2 - 2);
    c.fillStyle = '#5B6B86'; c.font = F('400', land ? 16 : 14, 'Sarabun'); c.fillText(`${o.where} • ${o.cases} ราย • ${o.period}`, x2 + 30, y + (ch2 - 8) / 2 + 20); });
  if (!C.length) { c.fillStyle = '#0E7A50'; c.font = F('600', 20); c.fillText('ไม่พบกลุ่มก้อน', x2 + 24, y2 + 120); }
  c.fillStyle = '#10234A'; c.font = F('700', land ? 18 : 16); c.fillText('สิ่งที่ขอให้พื้นที่ดำเนินการ', x2 + 24, y2 + h2 - (land ? 92 : 70));
  c.font = F('400', land ? 16 : 14, 'Sarabun'); ['• ทบทวนรายชื่อผู้ป่วยใน DDS ค้นหาผู้ป่วยเพิ่มเติม', '• กลุ่มก้อน: สอบสวนเบื้องต้นและส่งรายงานภายใน 24–48 ชม.', '• สื่อสารความเสี่ยงในชุมชนตามภาพ ② ของแดชบอร์ด'].forEach((t, i) => c.fillText(t, x2 + 24, y2 + h2 - (land ? 64 : 46) + i * (land ? 22 : 18)));
}
function note(f, t) { const { c, W, top } = f; c.fillStyle = '#5B6B86'; c.font = F('600', 30); c.fillText(t, 56, top + 60); }

export async function drawTemplate(canvas, m, tpl, size) {
  try { await Promise.all([document.fonts.load('700 40px Anuphan'), document.fonts.load('400 20px Sarabun')]); } catch { }
  const titles = { public: [m.pub ? m.pub.name : 'สื่อสารความเสี่ยง', m.pub ? m.pub.area : ''], alert: ['สรุปแจ้งเตือนพื้นที่', 'อำเภอที่ต้องเฝ้าระวังและกลุ่มก้อน • จังหวัดอุบลราชธานี'], levels: ['สถานการณ์เทียบระดับประเทศ เขต จังหวัด', m.diseaseName], district: ['สถานการณ์รายอำเภอ', `${m.diseaseName} • จังหวัดอุบลราชธานี`], weekly: ['ผู้ป่วยรายสัปดาห์ 25 อำเภอ', `${m.diseaseName} • จังหวัดอุบลราชธานี`], dds: ['คุณภาพการรายงานในระบบ DDS (D506)', 'จังหวัดอุบลราชธานี'] };
  const [t, s] = titles[tpl]; const f = await frame(canvas, m, size, t, s);
  ({ public: drawPublic, alert: drawAlert, levels: drawLevels, district: drawDistrict, weekly: drawWeekly, dds: drawDds })[tpl](f, m);
  return canvas;
}
