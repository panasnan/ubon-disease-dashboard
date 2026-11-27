import { EPI, loadAll, prepare, yearOf, parseISO, friendly, buildIndex, makeDemo, periodRange, currentFiscalBE, epiWeek, sundayOf, thDate, ymd, fmt, rate, cfr, pctChange, cell, alertLevel, baselineFor, detectClusters, LEVELS } from './data.js';
import { hbars, sparkline, epiCurve, heatmap, COLORS, LEVEL_COLOR, LEVEL_TEXT } from './charts.js';
import { renderMap } from './map.js';
import { drawInfographic, SIZES } from './infographic.js';
import { drawTemplate, TEMPLATES, THEMES } from './info2.js';

const DAY = 86400000;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ICON = { pin: 'M12 21s-7-6.3-7-11a7 7 0 1 1 14 0c0 4.7-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  cluster: 'M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M5 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M19 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M12 20m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M7 7l3 3M17 7l-3 3M12 15v3',
  unit: 'M4 21V8l8-5 8 5v13M9 21v-6h6v6M12 8v4M10 10h4',
  quality: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  image: 'M4 5h16v14H4zM4 15l4-4 5 5 3-3 4 4M15 9h.01',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z', search: 'M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0M21 21l-5-5', close: 'M6 6l12 12M18 6L6 18', menu: 'M4 6h16M4 12h16M4 18h16', link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  down: 'M12 4v12M6 10l6 6 6-6M4 20h16', book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7',  upload: 'M12 16V4M6 10l6-6 6 6M4 20h16', up: 'M12 20V8M6 14l6-6 6 6', alert: 'M12 3l9 16H3zM12 10v4M12 17h.01', refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7'
};
const ico = (n, s = 20) => `<svg class="ico" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;

const PAGES = [
  ['my', 'อำเภอของฉัน', 'pin'], ['overview', 'ภาพรวม 10 โรค', 'home'], ['district', 'รายอำเภอ / แผนที่', 'map'], ['trend', 'รายสัปดาห์รายอำเภอ', 'trend'],
  ['cluster', 'กลุ่มก้อน', 'cluster'], ['units', 'คุณภาพรายงาน DDS', 'unit'], ['quality', 'คุณภาพข้อมูล', 'quality'],
  ['measures', 'มาตรการเฝ้าระวัง', 'shield'], ['contact', 'ติดต่อ & แก้ปัญหา', 'phone'], ['info', 'สร้างภาพ Info', 'image']
];

let DB, REAL_ROWS;
const S = { tpl: 'situation', theme: 'navy', page: 'overview', yt: 'calendar', y: new Date().getFullYear() + 543, wk: '', dc: 'ALL', fac: '', d: 'ALL', demo: false, size: 'ppt', src: '' };

function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  for (const k of ['page', 'dc', 'd', 'size', 'src', 'wk', 'fac', 'tpl', 'theme']) if (p.get(k)) S[k] = p.get(k);
  S.yt = 'calendar'; // รายงาน 10 โรคใช้ปีปฏิทินเท่านั้น (ปีงบใช้เฉพาะผลงานคุณภาพรายงาน DDS ซึ่งมีช่วงข้อมูลกำกับในหน้านั้น)
  if (!PAGES.some(x => x[0] === S.page)) S.page = 'overview';
  if (p.get('y')) S.y = Math.min(+p.get('y'), new Date().getFullYear() + 543);
  S.demo = p.get('demo') === '1';
}
function writeHash() {
  const p = new URLSearchParams({ page: S.page, yt: S.yt, y: S.y, dc: S.dc, d: S.d });
  if (S.wk) p.set('wk', S.wk); if (S.fac) p.set('fac', S.fac);
  if (S.demo) p.set('demo', '1'); if (S.page === 'info') { p.set('size', S.size); p.set('tpl', S.tpl); p.set('theme', S.theme); } if (S.src) p.set('src', S.src);
  try { history.replaceState(null, '', '#' + p); } catch { }
}

const dName = id => DB.config.diseases.find(d => d.id === id)?.name || id;
const distName = dc => dc === 'ALL' ? `จังหวัด${DB.config.province}` : 'อำเภอ' + (DB.districts.find(d => d.code === dc)?.name || dc);
const popOf = dc => dc === 'ALL' ? DB.popTotal : (DB.districts.find(d => d.code === dc)?.pop || 0);
const chip = (lv, extra = '') => `<span class="chip ${lv}">${LEVEL_TEXT[lv] || '–'}${extra}</span>`;

// ---------- core model ----------
function model(dc = S.dc) {
  const [from, to] = periodRange(S.yt, S.y);
  const rows = DB.rows;
  const WK = S.wk ? parseISO(S.wk) : Infinity;
  const inCur = r => yearOf(r, S.yt) === S.y && r.t <= WK;
  const lastT = rows.reduce((m, r) => inCur(r) && r.t > m ? r.t : m, -Infinity);
  const has = isFinite(lastT);
  const asOf = has ? lastT : NaN, asOfEnd = has ? Math.min(lastT + 6 * DAY, to, DB.dataEnd || Infinity) : NaN;
  const inPrev = r => r.t <= asOf - 364 * DAY && yearOf(r, S.yt) === S.y - 1;
  const prevAvail = has && rows.some(inPrev);
  const pop = popOf(dc);
  const per = DB.config.diseases.map(z => {
    let c = 0, x = 0, pc = 0, px = 0;
    for (const r of rows) {
      if (r.d !== z.id || (dc !== 'ALL' && r.dc !== dc)) continue;
      if (inCur(r)) { c += r.c; x += r.x; } else if (prevAvail && inPrev(r)) { pc += r.c; px += r.x; }
    }
    return { id: z.id, name: z.name, en: z.en, cases: c, deaths: x, prev: prevAvail ? pc : null, prevDeaths: prevAvail ? px : null, rate: rate(c, pop), cfr: cfr(x, c), change: prevAvail ? pctChange(c, pc) : null };
  });
  // manual death reports not yet keyed into DDS (ทะเบียนผู้เสียชีวิต) — added to DDS-based counts
  const keyed = v => /^(y|yes|ใช่|คีย์แล้ว)$/i.test(String(v || '').trim());
  const pendRows = S.demo ? [] : DB.deathReg.filter(r => !keyed(r.dds_keyed) && (dc === 'ALL' || r.district_code === dc) && (() => { const t = parseISO(r.death_date || r.report_date); return isFinite(t) && yearOf({ t: sundayOf(t), fy: currentFiscalBE(t), cy: new Date(t).getUTCFullYear() + 543 }, S.yt) === S.y && t <= WK + 6 * DAY; })());
  for (const r of per) { r.pending = pendRows.filter(x => x.disease_id === r.id).length; r.ddsDeaths0 = r.deaths; r.deaths += r.pending; r.cfr = cfr(r.deaths, r.cases); }
  if (dc !== 'ALL' && !S.demo && DB.districtDeaths?.length) for (const r of per) { r.deaths = DB.districtDeaths.filter(x => +x.year_be === S.y && x.disease_id === r.id && x.district_code === dc).reduce((a, x) => a + +x.deaths, 0) + (r.pending || 0); r.cfr = cfr(r.deaths, r.cases); }
  const sumTot = arr => arr.reduce((a, r) => ({ c: a.c + r.cases, x: a.x + r.deaths, p: a.p + (r.prev || 0) }), { c: 0, x: 0, p: 0 });
  const ddsTot = sumTot(per);
  // province level + calendar year: use the official weekly figures (Excel รวบรวมรายงาน → summary_province.csv)
  let source = 'dds', snapT = NaN, prevSnapT = NaN;
  if (dc === 'ALL' && S.yt === 'calendar' && !S.demo && (DB.config.province_source || 'summary') === 'summary') {
    const dates = [...new Set(DB.summary.filter(s => +s.year_be === S.y && parseISO(s.date_to) <= WK + 6 * DAY).map(s => s.date_to))].sort();
    if (dates.length) {
      const last = dates[dates.length - 1], prevD = dates[dates.length - 2];
      source = 'summary'; snapT = parseISO(last); prevSnapT = prevD ? parseISO(prevD) : NaN;
      const P = DB.config.population_total;
      for (const r of per) {
        const s = DB.summary.find(x => +x.year_be === S.y && x.date_to === last && x.disease_id === r.id);
        const ps = prevD ? DB.summary.find(x => +x.year_be === S.y && x.date_to === prevD && x.disease_id === r.id) : null;
        r.ddsCases = r.cases; r.ddsDeaths = r.ddsDeaths0;
        r.cases = s ? +s.cases : 0; r.deaths = s ? +s.deaths : 0; r.rate = rate(r.cases, P); r.cfr = cfr(r.deaths, r.cases);
        r.weekDelta = ps ? r.cases - +ps.cases : null; r.weekDeltaDeaths = ps ? r.deaths - +ps.deaths : null;
      }
    }
  }
  const tot = sumTot(per);
  // ป้ายสัปดาห์ = สัปดาห์ระบาดวิทยาล่าสุดที่ "ครบ" ก่อนวันตัดข้อมูล (เช่น ตัดวันจันทร์ 16 พ.ย. = สัปดาห์ที่ 46: 8–14 พ.ย.)
  // ยอดสะสมยังนับถึงวันตัดข้อมูล ส่วนกราฟรายสัปดาห์/สถานะสี/กลุ่มก้อน ใช้เฉพาะสัปดาห์ที่ครบ
  const cut = source === 'summary' ? snapT : asOfEnd;
  let week = null, partialWeek = null;
  if (isFinite(cut)) {
    const w = epiWeek(cut);
    if (cut >= w.to) week = w;
    else { partialWeek = w; const p = w.from - DAY; week = epiWeek(p, new Date(p).getUTCFullYear()); }
  }
  const alertT = week ? (has ? Math.min(week.start, asOf) : week.start) : NaN;
  for (const r of per) {
    const al = has ? alertLevel(DB, r.id, dc, alertT) : { level: 'none' };
    Object.assign(r, { level: al.level, ratio: al.ratio, recent: al.recent, base: al.base });
    r.spark = has ? Array.from({ length: 12 }, (_, i) => cell(DB, alertT - (11 - i) * 7 * DAY, r.id, dc).c) : [];
    r.weekCases = has ? cell(DB, alertT, r.id, dc).c : null; // ผู้ป่วยตามวันเริ่มป่วยในสัปดาห์รายงาน (DDS)
  }
  return { from, to, asOf, asOfEnd: cut, cut, alertT, week, partialWeek, has: has || source === 'summary', hasDds: has, prevAvail, pop: source === 'summary' ? DB.config.population_total : pop, per, tot, ddsTot, inCur, source, snapT, prevSnapT,
    weekDelta: source === 'summary' && isFinite(prevSnapT) ? tot.c - per.reduce((a, r) => a + (r.cases - (r.weekDelta ?? 0)), 0) : null,
    change: prevAvail && source === 'dds' ? pctChange(tot.c, tot.p) : null, dc };
}

function periodLabel(m) {
  const yl = S.yt === 'fiscal' ? `ปีงบประมาณ ${S.y}` : `พ.ศ. ${S.y}`;
  return m.has ? `${yl} (${thDate(m.from)} – ${thDate(m.asOfEnd)})` : yl;
}

function summaryLines(m) {
  const L = [];
  if (!m.has) return ['ยังไม่มีข้อมูลรายสัปดาห์ในช่วงเวลานี้'];
  if (!m.hasDds) { const L0 = [`${periodLabel(m)} พบผู้ป่วย 10 โรครวม ${fmt(m.tot.c)} ราย เสียชีวิต ${fmt(m.tot.x)} ราย`]; return L0; }
  L.push(`${periodLabel(m)} พบผู้ป่วย 10 โรครวม ${fmt(m.tot.c)} ราย เสียชีวิต ${fmt(m.tot.x)} ราย` + (m.change == null ? '' : ` ${m.change >= 0 ? 'เพิ่มขึ้น' : 'ลดลง'}ร้อยละ ${fmt(Math.abs(m.change), 1)} เมื่อเทียบกับช่วงเดียวกันของปีก่อน`));
  if (m.weekDelta != null) { const up = m.per.filter(r => r.weekDelta > 0).sort((a, b) => b.weekDelta - a.weekDelta).slice(0, 3); L.push(`รายงานสัปดาห์ระบาดวิทยาที่ ${m.week?.week ?? "–"} พบผู้ป่วยเพิ่มขึ้นจากรายงานครั้งก่อน ${fmt(m.weekDelta)} ราย${up.length ? ` มากที่สุดคือ ${up.map(r => `${r.name} +${fmt(r.weekDelta)}`).join(', ')}` : ''}`); }
  const top = [...m.per].filter(r => r.cases).sort((a, b) => b.cases - a.cases).slice(0, 3);
  if (top.length) L.push(`โรคที่พบมากที่สุด: ${top.map(r => `${r.name} ${fmt(r.cases)} ราย${r.rate != null ? ` (${fmt(r.rate, 2)} ต่อแสน ปชก.)` : ''}`).join(', ')}`);
  const hot = m.per.filter(r => capLv(r) === 'red' || capLv(r) === 'orange');
  L.push(hot.length ? `โรคที่สูงกว่าปกติ (4 สัปดาห์ล่าสุด): ${hot.map(r => `${r.name}${r.ratio != null && isFinite(r.ratio) ? ` (มากกว่าปีปกติ ${fmt(r.ratio, 1)} เท่า)` : ''}`).join(', ')}` : `${DB.config.alert.window_weeks} สัปดาห์ล่าสุดไม่มีโรคที่สูงกว่าปกติ`);
  const dead = m.per.filter(r => r.deaths);
  if (dead.length) L.push(`มีผู้เสียชีวิตจาก: ${dead.map(r => `${r.name} ${fmt(r.deaths)} ราย`).join(', ')} — ควรทบทวนการเสียชีวิตทุกราย`);
  if (m.dc === 'ALL') {
    const hotD = DB.districts.map(d => ({ d, a: alertLevel(DB, 'ALL', d.code, m.alertT) })).filter(o => o.a.level === 'red' || o.a.level === 'orange');
    if (hotD.length) L.push(`อำเภอที่ต้องติดตาม (รวม 10 โรค): ${hotD.map(o => o.d.name).join(', ')}`);
  }
  const cl = detectClusters(DB, m.alertT).filter(c => m.dc === 'ALL' || c.dc === m.dc);
  if (cl.length) L.push(`พบกลุ่มก้อนที่เข้าเกณฑ์ ${cl.length} พื้นที่ (${[...new Set(cl.map(c => dName(c.d)))].join(', ')})`);
  return L;
}

function weekOpts() {
  const seen = new Set();
  for (const r of DB.rows) if (yearOf(r, S.yt) === S.y) seen.add(r.t);
  return [...seen].sort((a, b) => b - a).map(t => { const v = ymd(t), e = epiWeek(t), part = isFinite(DB.dataEnd) && e.to > DB.dataEnd; return `<option value="${v}" ${S.wk === v ? 'selected' : ''}>สัปดาห์ที่ ${e.week} (${thDate(e.from)}–${thDate(e.to)})${part ? ' • ยังไม่ครบ' : ''}</option>`; }).join('');
}

// ---------- layout ----------
function shell() {
  const years = new Set([S.y, new Date().getFullYear() + 543]);
  DB.rows.forEach(r => years.add(yearOf(r, S.yt)));
  const yOpts = [...years].sort((a, b) => b - a).map(y => `<option value="${y}" ${y === S.y ? 'selected' : ''}>พ.ศ. ${y}</option>`).join('');
  $('#nav').innerHTML = PAGES.map(([id, t, ic]) => `<a href="#" data-page="${id}" class="${S.page === id ? 'active' : ''}">${ico(ic)}<span>${t}</span></a>`).join('');
  $('#topbar').innerHTML = `
    <div class="tb-group"><span class="tb-lbl" title="ตัวกรองข้อมูล">${ico('filter', 16)}</span>
      <span class="tb-lbl">ปี</span>
      <select id="fy" aria-label="ปี">${yOpts}</select>
      <select id="fwk" aria-label="ถึงสัปดาห์"><option value="">สัปดาห์ล่าสุด</option>${weekOpts()}</select></div>
    <div class="tb-group"><select id="fdc" aria-label="อำเภอ"><option value="ALL">ทั้งจังหวัด (25 อำเภอ)</option>${[...new Set(DB.districts.map(d => d.zone))].map(z => `${z ? `<optgroup label="${esc(z)}">` : ''}${DB.districts.filter(d => d.zone === z).map(d => `<option value="${d.code}" ${S.dc === d.code ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}${z ? '</optgroup>' : ''}`).join('')}</select></div>
    <div class="tb-group"><select id="fd" aria-label="โรค"><option value="ALL">รวม 10 โรค</option>${DB.config.diseases.map(d => `<option value="${d.id}" ${S.d === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div>
    <div class="tb-group grow">${S.fac && facIndex().get(S.fac) ? `<span class="fac-chip"><button data-fac="${esc(S.fac)}" title="ดูรายละเอียด">${ico('unit', 15)} ${esc(S.fac)} ${esc(facIndex().get(S.fac).name || '')}</button><button id="facx" title="ยกเลิกการเลือกสถานพยาบาล" aria-label="ยกเลิก">${ico('close', 14)}</button></span>` : ''}<div class="search">${ico('search', 16)}<input id="q" type="search" autocomplete="off" placeholder="${S.fac ? 'เปลี่ยนสถานพยาบาล…' : 'ค้นหาสถานพยาบาล: รหัส 5 หลัก หรือชื่อ'}" aria-label="ค้นหาสถานพยาบาล"></div></div>
    <div class="tb-group tb-tools">
      <button class="btn ghost sm" id="copylink" title="คัดลอกลิงก์มุมมองนี้">${ico('link', 15)} ลิงก์</button></div>`;
  $('#sidelinks').innerHTML = ''; // หน้าเครื่องมือของผู้ดูแล (tools/update.html) ไม่แสดงลิงก์บนแดชบอร์ด — เปิดจาก bookmark
  $('#fdc').value = S.dc; $('#fd').value = S.d;
}

function header(m) {
  const fresh = m.has ? Math.floor((Date.now() - m.asOfEnd) / DAY) : null;
  const logo = '';
  return `<header class="hero">
    <div><div class="eyebrow">${esc(DB.config.office)}</div><h1>สถานการณ์ 10 โรคที่ต้องเฝ้าระวัง</h1>
    <div class="sub">${esc(distName(S.dc))}${S.fac && facIndex().get(S.fac) ? ' • ' + esc(facIndex().get(S.fac).name) : ''} • ${esc(periodLabel(m))}</div></div>
    <div class="asof">${m.has && m.week ? `<b>สัปดาห์ระบาดวิทยาที่ ${m.week.week}</b><span>${thDate(m.week.from)} – ${thDate(m.week.to)}</span><span>${m.source === 'summary' ? 'ข้อมูล ณ ' + thDate(m.cut, false) + ' • รายงานประจำสัปดาห์' : 'ยอดสะสมถึง ' + thDate(m.cut, false)}</span>${m.hasDds ? `<span class="ddsn" title="ตัวเลขรายอำเภอ/ตำบล/กราฟรายสัปดาห์มาจาก DDS ตามวันเริ่มป่วย อาจน้อยกว่าในระบบ DDS เล็กน้อย เพราะรายงานที่ส่งหลังวันตัดข้อมูลจะเข้ามาในรอบถัดไป">รายอำเภอและกราฟ: DDS ถึงสัปดาห์ที่ ${epiWeek(m.alertT, S.y - 543).week}</span>` : ''}${fresh > 7 ? `<span class="stale">${ico('alert', 14)} ข้อมูลเก่า ${fresh} วัน</span>` : ''}` : '<b>ยังไม่มีข้อมูลรายสัปดาห์</b>'}</div>
  </header>${S.demo ? '<div class="demo-banner">⚠ กำลังแสดง <b>ข้อมูลจำลอง</b> เพื่อทดลองระบบ — ห้ามใช้อ้างอิงหรือเผยแพร่</div>' : ''}`;
}

// ---------- pages ----------
const PLAIN = { red: ['สูงกว่าปกติ', '#D93025'], orange: ['สูงกว่าปกติ', '#D93025'], yellow: ['เฝ้าระวัง', '#D9A21B'], green: ['ปกติ', '#16A477'] };
const capLv = r => (r.level === 'red' || r.level === 'orange') && (r.recent ?? 0) < MY_MIN ? 'yellow' : r.level;
const plainChip = lv => PLAIN[lv] ? `<span class="pchip ${lv === 'orange' ? 'red' : lv}">${PLAIN[lv][0]}</span>` : '<span class="muted">–</span>';
function pageOverview() {
  const m = model();
  if (!m.has && DB.summary.length && !S.demo) return header(m) + summaryFallback();
  const sumSrc = m.source === 'summary';
  const PV = prevYearSummary(m);
  const srcBadge = sumSrc ? `<span class="src">ที่มา: Excel รวบรวมรายงาน (ข้อมูล ณ ${thDate(m.snapT)})</span>` : `<span class="src">ที่มา: DDS รายเคส (ผู้ป่วยที่อาศัยใน${esc(distName(S.dc))})</span>`;
  const k = m.per;
  const topRate = [...k].filter(r => r.rate != null && r.cases).sort((a, b) => b.rate - a.rate)[0];
  const cfrCand = [...k].filter(r => r.cases >= 5 && r.deaths).sort((a, b) => b.cfr - a.cfr)[0];
  const redN = k.filter(r => r.level === 'red' || r.level === 'orange').length;
  const ch = m.change;
  const di = k.findIndex(r => r.id === S.d), dsel = di >= 0 ? k[di] : null;
  const pvTot = PV?.samePeriod ? PV.rows.reduce((a, r) => a + (r?.cases || 0), 0) : null, pvCh = pvTot ? pctChange(m.tot.c, pvTot) : null;
  const allKpis = `  <section class="kpis k4">
    <div class="kpi"><div class="k-t">ผู้ป่วยใหม่ สัปดาห์ที่ ${m.week?.week ?? '–'}</div><div class="k-v orange">${m.weekDelta != null ? '+' + fmt(m.weekDelta) : fmt(k.reduce((a, r) => a + (r.weekCases || 0), 0))}</div><div class="k-s">${m.weekDelta != null ? `ราย จากรายงานสัปดาห์ก่อน${isFinite(m.prevSnapT) ? ` (${thDate(m.prevSnapT)})` : ''}` : 'ราย ตามวันเริ่มป่วย (DDS)'}</div></div>
    <div class="kpi"><div class="k-t">ผู้เสียชีวิตสะสม</div><div class="k-v ${m.tot.x ? 'red' : 'green'}">${fmt(m.tot.x)}</div><div class="k-s">${k.filter(r => r.deaths).map(r => `${r.name} ${r.deaths}`).join(' • ') || 'ไม่มีผู้เสียชีวิต'}</div></div>
    <div class="kpi"><div class="k-t">เทียบช่วงเดียวกันปี ${S.y - 1}</div><div class="k-v ${pvCh == null ? 'navy' : pvCh > 0 ? 'red' : 'green'}">${pvCh == null ? '–' : `${pvCh > 0 ? '▲' : '▼'} ${fmt(Math.abs(pvCh), 1)}%`}</div><div class="k-s">${pvTot ? `ปี ${S.y - 1}: ${fmt(pvTot)} ราย (สัปดาห์ที่ 1–${m.week?.week})` : 'ไม่มีข้อมูลเปรียบเทียบ'}</div></div>
    <div class="kpi"><div class="k-t">โรคที่ต้องติดตาม/รุนแรง</div><div class="k-v ${redN ? 'red' : 'green'}">${redN}</div><div class="k-s">${k.filter(r => r.level === 'red' || r.level === 'orange').map(r => r.name).join(' • ') || 'ไม่มี'} (${DB.config.alert.window_weeks} สัปดาห์ล่าสุด เทียบมัธยฐาน 5 ปี)</div></div>
  </section>
`;
  return header(m) + levelRow(m) + (dsel ? diseaseBlock(m, dsel, di, PV) : "") + `
  <section class="ovmain">
    <div class="card"><div class="card-h"><h2>สถานการณ์ 10 โรค</h2>${srcBadge}</div>
      <div class="tbl-wrap"><table class="tbl ctbl"><thead><tr><th>โรค</th><th class="r">ผู้ป่วยปีนี้</th><th class="r">เสียชีวิต</th><th class="r">สัปดาห์นี้</th><th>12 สัปดาห์ล่าสุด</th><th>สถานะ</th></tr></thead><tbody>
      ${k.map(r => `<tr class="${S.d === r.id ? 'sel' : ''}"><td><a href="#" class="pick-d" data-d="${r.id}">${esc(r.name)}</a></td><td class="r b">${fmt(r.cases)}</td><td class="r ${r.deaths ? 'red b' : 'muted'}">${fmt(r.deaths)}</td><td class="r">${r.weekDelta != null ? (r.weekDelta > 0 ? '+' + fmt(r.weekDelta) : '–') : fmt(r.weekCases)}</td><td>${m.hasDds ? sparkline(r.spark, COLORS.blue) : ''}</td><td>${plainChip(capLv(r))}</td></tr>`).join('')}
      </tbody><tfoot><tr><td>รวม 10 โรค</td><td class="r">${fmt(m.tot.c)}</td><td class="r">${fmt(m.tot.x)}</td><td class="r">${m.weekDelta != null ? '+' + fmt(m.weekDelta) : ''}</td><td></td><td></td></tr></tfoot></table></div>
      <p class="note">สถานะ = 4 สัปดาห์ล่าสุดเทียบกับปีปกติ (ค่ากลาง 5 ปี) • คลิกชื่อโรคเพื่อดูรายละเอียด</p>
      <details class="more"><summary>ดูตารางเต็ม (อัตราป่วย, CFR, เทียบปีก่อน)</summary>    <div><p class="note hint">คลิกชื่อโรคเพื่อดูการ์ดรายโรคด้านบน</p>
      ${(() => { const pv = prevYearSummary(m); return pv ? `<p class="note">เทียบกับ ${esc(pv.label)}${pv.samePeriod ? '' : ' — ช่วงเวลาไม่เท่ากัน จึงไม่คำนวณร้อยละเปลี่ยนแปลง'}</p>` : ''; })()}
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>โรค</th>${prevYearSummary(m) ? `<th class="r prevcol">ป่วย ${PV.year}<small>${PV.ddc ? `สัปดาห์ที่ 1–${m.week?.week}` : ''}</small></th><th class="r prevcol">ตาย ${PV.year}<small>${PV.deathsFull ? 'ทั้งปี (กอง)' : ''}</small></th><th class="r prevcol">เทียบ ${PV.year}</th>` : ''}<th class="r">ป่วย</th><th class="r">ตาย</th><th class="r">ต่อแสน</th><th class="r">CFR%</th><th class="r">${sumSrc ? '+ สัปดาห์นี้' : 'เทียบปีก่อน'}</th><th>12 สัปดาห์</th><th>สถานะ</th></tr></thead><tbody>
      ${k.map((r, i) => `<tr class="${S.d === r.id ? 'sel' : ''}"><td><a href="#" class="pick-d" data-d="${r.id}" title="คลิกเพื่อดูการ์ดรายโรค (คลิกซ้ำเพื่อกลับเป็นรวม 10 โรค)">${i + 1}. ${esc(r.name)}</a><div class="en">${esc(r.en)}</div></td>${PV ? `<td class="r prevcol">${PV.rows[i] ? fmt(PV.rows[i].cases) : '–'}</td><td class="r prevcol">${PV.rows[i] ? fmt(PV.rows[i].deaths) : '–'}</td><td class="r prevcol">${(() => { const c = PV.samePeriod && PV.rows[i]?.cases ? pctChange(r.cases, PV.rows[i].cases) : null; return c == null ? '–' : `<span class="trend ${c > 0 ? 'up' : 'dn'}">${c > 0 ? '▲' : '▼'} ${fmt(Math.abs(c), 0)}%</span>`; })()}</td>` : ''}<td class="r b">${fmt(r.cases)}</td><td class="r ${r.deaths ? 'red b' : ''}">${fmt(r.deaths)}</td><td class="r">${r.rate == null ? '–' : fmt(r.rate, 2)}</td><td class="r">${fmt(r.cfr, 2)}</td>
      <td class="r">${sumSrc ? (r.weekDelta == null ? '–' : `<span class="${r.weekDelta > 0 ? 'b' : 'muted'}">${r.weekDelta > 0 ? '+' : ''}${fmt(r.weekDelta)}</span>${r.weekDeltaDeaths ? ` <small class="red">(ตาย +${r.weekDeltaDeaths})</small>` : ''}`) : r.change == null ? '–' : `<span class="trend ${r.change > 0 ? 'up' : 'dn'}">${r.change > 0 ? '▲' : '▼'} ${fmt(Math.abs(r.change), 1)}%</span>`}</td><td>${sparkline(r.spark, LEVEL_COLOR[r.level] || COLORS.blue)}</td><td>${chip(r.level)}</td></tr>`).join('')}
      </tbody><tfoot><tr><td>รวม 10 โรค</td>${PV ? `<td class="r prevcol">${fmt(PV.rows.reduce((a, r) => a + (r?.cases || 0), 0))}</td><td class="r prevcol">${fmt(PV.rows.reduce((a, r) => a + (r?.deaths || 0), 0))}</td><td class="r prevcol">${(() => { const t = PV.rows.reduce((a, r) => a + (r?.cases || 0), 0), c = PV.samePeriod && t ? pctChange(m.tot.c, t) : null; return c == null ? '–' : `${c > 0 ? '▲' : '▼'} ${fmt(Math.abs(c), 0)}%`; })()}</td>` : ''}<td class="r">${fmt(m.tot.c)}</td><td class="r">${fmt(m.tot.x)}</td><td class="r">${m.pop ? fmt(rate(m.tot.c, m.pop), 2) : '–'}</td><td class="r">${fmt(cfr(m.tot.x, m.tot.c), 2)}</td><td class="r">${sumSrc ? (m.weekDelta == null ? '–' : '+' + fmt(m.weekDelta)) : ch == null ? '–' : fmt(ch, 1) + '%'}</td><td></td><td></td></tr></tfoot></table></div>
      ${sumSrc && m.hasDds ? `<p class="note">ตัวเลขในตารางเป็นตัวเลขรายงานทางการประจำสัปดาห์ • สถานะสี กราฟ 12 สัปดาห์ และรายอำเภอ ใช้ DDS รายเคส (${fmt(m.ddsTot.c)} ราย ต่างจากทางการ ${fmt(Math.abs(m.tot.c - m.ddsTot.c))} ราย = ${fmt(Math.abs(m.tot.c - m.ddsTot.c) / (m.tot.c || 1) * 100, 2)}%) • ดูการตรวจยอดได้ที่หน้า "คุณภาพข้อมูล"</p>` : ''}</div>
</details></div>
      <div class="card"><div class="card-h"><h2>${dsel ? 'มาตรการเฝ้าระวัง: ' + esc(dsel.name) : 'มาตรการเฝ้าระวังสัปดาห์นี้'}</h2><button class="btn ghost sm" id="copysum">คัดลอกข้อความ</button></div><ul class="sum">${measureLines(m, dsel).map(l => `<li>${esc(l)}</li>`).join('')}</ul><p class="note">มาตรการทั้งหมดของแต่ละโรคดูได้ที่เมนู "มาตรการเฝ้าระวัง"</p></div>
  </section>
  ${prelimCard()}
  <details class="card more2"><summary>ดูรายละเอียดเพิ่มเติม: เทียบประเทศ/เขตรายโรค • กลุ่มอายุ • อัตราป่วย • ที่มาของตัวเลข</summary>
  <section class="grid2 even">${levelsCard(m)}${ageCard()}</section>
  <section class="grid2 even">      <div class="card"><div class="card-h"><h2>อัตราป่วยต่อแสนประชากร</h2></div>${hbars([...k].sort((a, b) => (b.rate || 0) - (a.rate || 0)).map(r => ({ label: r.name, value: r.rate, color: LEVEL_COLOR[r.level] })), { unit: 'ต่อแสน' })}</div>
${notesCard()}</section>${legend()}</details>`;
}

// ---------- per-disease view (เมื่อเลือกโรคที่แถบบน หรือคลิกชื่อโรคในตาราง) ----------
function weekSeries(m, id, dc, n = 12) {
  const PW = DB.config.provisional_weeks ?? 2;
  return Array.from({ length: n }, (_, i) => {
    const t = m.alertT - (n - 1 - i) * 7 * DAY, e = epiWeek(t, new Date(t + 6 * DAY).getUTCFullYear());
    return { t, wk: e.week, c: cell(DB, t, id, dc).c, base: baselineFor(DB, id, dc, e.week, e.year), prov: i >= n - PW };
  });
}
function miniBars(ser, color) {
  const W = 560, H = 190, pl = 30, pb = 26, pt = 18, n = ser.length, bw = (W - pl - 8) / n;
  const max = Math.max(1, ...ser.map(s => Math.max(s.c, s.base ?? 0))) * 1.12;
  const y = v => pt + (H - pt - pb) * (1 - v / max);
  const ticks = [0, Math.round(max / 2), Math.round(max / 1.12)];
  const hasBase = ser.some(s => s.base != null);
  const basePts = ser.map((s, i) => s.base == null ? null : `${(pl + i * bw + bw / 2).toFixed(1)},${y(s.base).toFixed(1)}`).filter(Boolean).join(' ');
  return `<svg class="minibars" viewBox="0 0 ${W} ${H}" role="img" aria-label="ผู้ป่วยรายสัปดาห์ ${n} สัปดาห์ล่าสุด">
    ${ticks.map(v => `<line x1="${pl}" x2="${W - 4}" y1="${y(v)}" y2="${y(v)}" stroke="#E3E9F3"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#6B7A90">${fmt(v)}</text>`).join('')}
    ${ser.map((s, i) => { const x = pl + i * bw + bw * 0.16, w = bw * 0.68; return `<rect x="${x.toFixed(1)}" y="${y(s.c).toFixed(1)}" width="${w.toFixed(1)}" height="${(H - pb - y(s.c)).toFixed(1)}" rx="4" fill="${color}" opacity="${s.prov ? 0.45 : 0.9}"><title>สัปดาห์ที่ ${s.wk}: ${fmt(s.c)} ราย${s.base != null ? ` • มัธยฐาน ${fmt(s.base)}` : ''}${s.prov ? ' (ข้อมูลเบื้องต้น)' : ''}</title></rect>
      <text x="${(x + w / 2).toFixed(1)}" y="${(y(s.c) - 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="600" fill="#10234A">${s.c ? fmt(s.c) : ''}</text>
      <text x="${(x + w / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#6B7A90">${s.wk}</text>`; }).join('')}
    ${hasBase ? `<polyline points="${basePts}" fill="none" stroke="#F3A72F" stroke-width="2" stroke-dasharray="5 4"/>` : ''}
  </svg>
  <div class="mini-leg"><span><i style="background:${color}"></i>ผู้ป่วย (ตามวันเริ่มป่วย)</span><span><i style="background:${color};opacity:.45"></i>${DB.config.provisional_weeks ?? 2} สัปดาห์ล่าสุด = ข้อมูลเบื้องต้น</span>${hasBase ? '<span><i class="dash"></i>มัธยฐาน 5 ปี</span>' : '<span class="muted">ยังไม่มีมัธยฐาน 5 ปีของโรคนี้</span>'}<span class="muted">ตัวเลขใต้แท่ง = สัปดาห์ระบาดวิทยา</span></div>`;
}
function districtRates(m, id) {
  return DB.districts.map(x => {
    let c = 0, dd = 0;
    for (const r of DB.rows) if (r.dc === x.code && r.d === id && m.inCur(r)) { c += r.c; dd += r.x; }
    return { x, c, dd, rt: rate(c, x.pop), a: alertLevel(DB, id, x.code, m.alertT) };
  });
}
function newThisWeek(m, r) {
  const sumSrc = m.source === 'summary';
  if (sumSrc && r.weekDelta != null) return { v: r.weekDelta, how: `เพิ่มจากรายงานครั้งก่อน (${thDate(m.prevSnapT)})${m.hasDds ? ` • DDS เริ่มป่วยในสัปดาห์ ${fmt(r.weekCases)} ราย` : ''}` };
  return { v: r.weekCases, how: m.week ? `เริ่มป่วย ${thDate(m.week.from)}–${thDate(m.week.to)} (ข้อมูลเบื้องต้น)` : '' };
}
function diseaseBlock(m, r, i, PV) {
  const z = DB.config.diseases.find(d => d.id === r.id), A = DB.config.alert;
  const pv = PV?.rows[i];
  const pvTxt = pv ? `${PV.samePeriod ? 'ช่วงเดียวกัน' : 'ทั้งปี'} ${PV.year}: ${fmt(pv.cases)} ราย` : null;
  const ch = pv && PV.samePeriod ? pctChange(r.cases, pv.cases) : r.change;
  const nw = newThisWeek(m, r);
  const rank = [...m.per].filter(x => x.rate != null).sort((a, b) => b.rate - a.rate).findIndex(x => x.id === r.id) + 1;
  const prov = m.dc !== 'ALL' ? model('ALL').per.find(x => x.id === r.id) : null;
  const color = LEVEL_COLOR[r.level] && r.level !== 'green' ? LEVEL_COLOR[r.level] : COLORS.blue;
  const ser = m.hasDds ? weekSeries(m, r.id, m.dc) : [];
  const dist = m.dc === 'ALL' && m.hasDds ? districtRates(m, r.id) : [];
  return `<section class="dz-head"><div><span class="eyebrow">การ์ดรายโรค</span><h2>${esc(r.name)} <small>${esc(r.en || '')}${z?.codes506 ? ` • รหัส 506: ${esc([].concat(z.codes506).join(', '))}` : ''}</small></h2></div>
    <div class="dz-act"><a href="#" class="btn ghost sm" data-page="trend">${ico('trend', 15)} ดูแนวโน้มทั้งปี</a><a href="#" class="btn ghost sm" data-page="district">${ico('map', 15)} ดูรายอำเภอ</a><button class="btn sm" id="dall">${ico('close', 14)} กลับเป็นรวม 10 โรค</button></div></section>
  <section class="kpis">
    <div class="kpi"><div class="k-t">ผู้ป่วยสะสม</div><div class="k-v blue">${fmt(r.cases)}</div><div class="k-s">${pvTxt ? `${esc(pvTxt)}${ch != null && (PV?.samePeriod || !pv) ? ` <span class="trend ${ch > 0 ? 'up' : 'dn'}">${ico(ch > 0 ? 'up' : 'down', 14)} ${fmt(Math.abs(ch), 1)}%</span>` : ''}` : ch != null ? `<span class="trend ${ch > 0 ? 'up' : 'dn'}">${ico(ch > 0 ? 'up' : 'down', 14)} ${fmt(Math.abs(ch), 1)}%</span> เทียบช่วงเดียวกันปีก่อน (${fmt(r.prev)})` : '<span class="muted">ไม่มีข้อมูลปีก่อน</span>'}</div></div>
    <div class="kpi"><div class="k-t">ผู้ป่วยใหม่ สัปดาห์ที่ ${m.week?.week ?? '–'}</div><div class="k-v navy">${nw.v == null ? '–' : (nw.v > 0 ? '+' : '') + fmt(nw.v)}</div><div class="k-s">${esc(nw.how)}</div></div>
    <div class="kpi"><div class="k-t">ผู้เสียชีวิต / CFR</div><div class="k-v ${r.deaths ? 'red' : 'green'}">${fmt(r.deaths)} <small>ราย</small></div><div class="k-s">CFR ${fmt(r.cfr, 2)}%${pv && pv.deaths != null ? ` • ${PV.year}: ${fmt(pv.deaths)} ราย (CFR ${fmt(pv.cfr, 2)}%)` : ''}${r.pending ? `<br><span class="chip orange">รอคีย์ใน DDS ${r.pending} ราย</span>` : ''}</div></div>
    <div class="kpi"><div class="k-t">อัตราป่วยต่อแสน ปชก.</div><div class="k-v navy">${r.rate == null ? '–' : fmt(r.rate, 2)}</div><div class="k-s">${prov ? `ทั้งจังหวัด ${prov.rate == null ? '–' : fmt(prov.rate, 2)} ต่อแสน` : rank ? `สูงเป็นอันดับ ${rank} จาก 10 โรค` : ''}</div></div>
    <div class="kpi"><div class="k-t">สถานะ (${A.window_weeks} สัปดาห์ล่าสุด)</div><div class="k-v sm" style="color:${LEVEL_COLOR[r.level] || 'var(--navy)'}">${LEVEL_TEXT[r.level] || '–'}</div><div class="k-s">${fmt(r.recent ?? 0)} ราย${r.base != null ? ` เทียบมัธยฐาน ${fmt(r.base)} ราย${r.ratio != null && isFinite(r.ratio) ? ` = ${fmt(r.ratio, 1)} เท่า` : ''}` : ' • ยังไม่มีค่ามัธยฐาน 5 ปี'}<br><span class="muted">${m.hasDds ? (w => `สัปดาห์ที่ ${Math.max(1, w - A.window_weeks + 1)}–${w} (DDS)`)(epiWeek(m.alertT, S.y - 543).week) : ''}</span></div></div>
  </section>
  ${m.hasDds ? `<section class="grid2 even">
    <div class="card"><div class="card-h"><h2>ผู้ป่วยรายสัปดาห์ 12 สัปดาห์ล่าสุด</h2><span class="muted">ถึงสัปดาห์ที่ ${m.week.week} (สัปดาห์ที่ครบ)</span></div>${miniBars(ser, color)}
      ${m.partialWeek ? `<p class="note">สัปดาห์ที่ ${m.partialWeek.week} ยังไม่ครบ (ถึง ${thDate(m.cut)}) จึงยังไม่แสดงในกราฟ แต่นับรวมในยอดสะสมแล้ว</p>` : ''}</div>
    ${dist.length ? `<div class="card"><div class="card-h"><h2>อัตราป่วยรายอำเภอ (10 อันดับ)</h2><span class="src">DDS รายเคส</span></div>${hbars([...dist].sort((a, b) => (b.rt || 0) - (a.rt || 0)).slice(0, 10).map(o => ({ label: o.x.name, value: o.rt, color: LEVEL_COLOR[o.a.level] && o.a.level !== 'nobase' ? LEVEL_COLOR[o.a.level] : COLORS.blue })), { unit: 'ต่อแสน' })}
      <p class="note">ผู้ป่วยมากที่สุด: ${[...dist].sort((a, b) => b.c - a.c).slice(0, 3).map(o => `${esc(o.x.name)} ${fmt(o.c)} ราย`).join(' • ')}${dist.some(o => o.dd) ? ` • เสียชีวิต: ${dist.filter(o => o.dd).map(o => `${esc(o.x.name)} ${o.dd}`).join(', ')}` : ''}</p></div>`
      : `<div class="card"><div class="card-h"><h2>${esc(distName(m.dc))} เทียบทั้งจังหวัด</h2></div>${prov ? hbars([{ label: distName(m.dc), value: r.rate, color }, { label: 'ทั้งจังหวัด', value: prov.rate, color: COLORS.grey }], { unit: 'ต่อแสน' }) : ''}<p class="note">ผู้ป่วยสะสม ${fmt(r.cases)} ราย จากทั้งจังหวัด ${fmt(prov?.cases)} ราย</p></div>`}
  </section>` : ''}`;
}
function diseaseLines(m, r, i, PV) {
  const A = DB.config.alert, L = [], pv = PV?.rows[i], nw = newThisWeek(m, r);
  L.push(`${r.name} ${periodLabel(m)} พบผู้ป่วยสะสม ${fmt(r.cases)} ราย${r.rate != null ? ` อัตราป่วย ${fmt(r.rate, 2)} ต่อแสนประชากร` : ''} เสียชีวิต ${fmt(r.deaths)} ราย${r.deaths ? ` (CFR ${fmt(r.cfr, 2)}%)` : ''}`);
  if (nw.v != null && m.week) L.push(`สัปดาห์ระบาดวิทยาที่ ${m.week.week} (${thDate(m.week.from)}–${thDate(m.week.to)}) พบผู้ป่วยใหม่ ${fmt(nw.v)} ราย`);
  if (pv) L.push(`${PV.samePeriod ? 'ช่วงเดียวกันของ' : 'ทั้งปี'} พ.ศ. ${PV.year} พบผู้ป่วย ${fmt(pv.cases)} ราย${pv.deaths != null ? ` เสียชีวิต ${fmt(pv.deaths)} ราย` : ''}${PV.samePeriod && pv.cases ? ` — ปีนี้${r.cases >= pv.cases ? 'สูงกว่า' : 'ต่ำกว่า'}ร้อยละ ${fmt(Math.abs(pctChange(r.cases, pv.cases)), 1)}` : ''}`);
  L.push(r.base != null ? `${A.window_weeks} สัปดาห์ล่าสุดพบ ${fmt(r.recent)} ราย เทียบมัธยฐาน 5 ปี ${fmt(r.base)} ราย — สถานะ "${LEVEL_TEXT[r.level]}"` : `${A.window_weeks} สัปดาห์ล่าสุดพบ ${fmt(r.recent ?? 0)} ราย (ยังไม่มีค่ามัธยฐาน 5 ปีของโรคนี้)`);
  if (m.dc !== 'ALL') {
    const pr = model('ALL').per.find(x => x.id === r.id);
    if (pr && r.rate != null && pr.rate != null) L.push(`อัตราป่วย ${fmt(r.rate, 2)} ต่อแสน ${r.rate > pr.rate ? 'สูงกว่า' : 'ต่ำกว่า'}ภาพรวมจังหวัด (${fmt(pr.rate, 2)} ต่อแสน) • คิดเป็นร้อยละ ${fmt(r.cases / (pr.cases || 1) * 100, 1)} ของผู้ป่วยทั้งจังหวัด`);
  }
  if (m.dc === 'ALL' && m.hasDds) {
    const d = districtRates(m, r.id).filter(o => o.c).sort((a, b) => b.rt - a.rt).slice(0, 3);
    if (d.length) L.push(`อำเภอที่อัตราป่วยสูงสุด: ${d.map(o => `${o.x.name} ${fmt(o.rt, 2)} ต่อแสน`).join(', ')}`);
  }
  const cl = m.hasDds ? detectClusters(DB, m.alertT).filter(c => c.d === r.id && (m.dc === 'ALL' || c.dc === m.dc)) : [];
  if (cl.length) L.push(`พบกลุ่มก้อนที่เข้าเกณฑ์ ${cl.length} พื้นที่ ใน ${[...new Set(cl.map(c => DB.districts.find(x => x.code === c.dc)?.name))].map(n => 'อ.' + n).join(', ')}`);
  if (r.deaths) L.push('ควรทบทวนการเสียชีวิต (Death review) ทุกราย');
  return L;
}

function summaryFallback() {
  const periods = [...new Set(DB.summary.map(s => s.period_label))];
  const sel = S.src && periods.includes(S.src) ? S.src : periods[periods.length - 1];
  const rows = DB.summary.filter(s => s.period_label === sel);
  const prev = periods[periods.indexOf(sel) - 1];
  const same = prev && DB.summary.find(s => s.period_label === prev)?.date_to.slice(5) === rows[0].date_to.slice(5);
  const pop = DB.config.population_total;
  const tc = rows.reduce((a, r) => a + +r.cases, 0), tx = rows.reduce((a, r) => a + +r.deaths, 0);
  return `<div class="notice">${ico('alert', 18)}<div><b>ยังไม่มีข้อมูลรายสัปดาห์ในช่วงเวลาที่เลือก</b> — แสดงตารางรวมจังหวัดจากรายงานประจำสัปดาห์ อัตราป่วยใช้ประชากร ${fmt(pop)} คน ${S.dc !== 'ALL' ? '<br>ข้อมูลนี้เป็นระดับจังหวัด ยังแยกรายอำเภอไม่ได้' : ''}<br>เปิด "จำลอง" ที่แถบบนเพื่อดูการทำงานครบทุกส่วน</div></div>
  <section class="kpis">
    <div class="kpi"><div class="k-t">ผู้ป่วย 10 โรค</div><div class="k-v blue">${fmt(tc)}</div><div class="k-s">${esc(sel)}</div></div>
    <div class="kpi"><div class="k-t">ผู้เสียชีวิต</div><div class="k-v red">${fmt(tx)}</div><div class="k-s">CFR รวม ${fmt(cfr(tx, tc), 2)}%</div></div>
    <div class="kpi wide"><div class="k-t">เปรียบเทียบกับปีก่อน</div><div class="k-v navy sm">${same ? '' : 'ไม่เปรียบเทียบ %'}</div><div class="k-s">${same ? '' : 'ช่วงเวลาไม่เท่ากัน (ปีก่อนทั้งปี vs ปีนี้ถึงปัจจุบัน) — ต้องใช้ข้อมูลรายสัปดาห์เพื่อเทียบช่วงเดียวกัน'}</div></div>
  </section>
  <div class="card"><div class="card-h"><h2>ตารางรวมจังหวัด</h2><select id="srcsel">${periods.map(p => `<option ${p === sel ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>โรค</th><th class="r">ป่วย</th><th class="r">ตาย</th><th class="r">ต่อแสน</th><th class="r">CFR%</th><th>หมายเหตุ</th></tr></thead><tbody>
  ${DB.config.diseases.map((z, i) => { const r = rows.find(s => s.disease_id === z.id); if (!r) return ''; return `<tr><td>${i + 1}. ${esc(z.name)}<div class="en">${esc(z.en)}</div></td><td class="r b">${fmt(+r.cases)}</td><td class="r ${+r.deaths ? 'red b' : ''}">${fmt(+r.deaths)}</td><td class="r">${fmt(rate(+r.cases, pop), 2)}</td><td class="r">${fmt(cfr(+r.deaths, +r.cases), 2)}</td><td class="note-cell">${esc(r.note)}</td></tr>`; }).join('')}
  </tbody></table></div></div>`;
}

function legend() {
  const A = DB.config.alert;
  return `<div class="legend-card">${['green', 'yellow', 'orange', 'red'].map(l => `${chip(l)}`).join('')}
  <span class="muted">เกณฑ์: ผู้ป่วย ${A.window_weeks} สัปดาห์ล่าสุด เทียบมัธยฐาน 5 ปี — ≤ ${A.ratio_yellow} เท่า = ปกติ, > ${A.ratio_yellow} = เฝ้าระวัง, > ${A.ratio_orange} = ติดตาม, > ${A.ratio_red} = รุนแรง • มีผู้เสียชีวิตอย่างน้อย "${LEVEL_TEXT[A.death_min_level]}"</span></div>`;
}

// ---------- ประเทศ / เขต / จังหวัด จากไฟล์รายสัปดาห์ 5 ปีของกองระบาดวิทยา ----------
const RATIO_LV = r => r == null ? 'none' : r > 2 ? 'red' : r > 1.5 ? 'orange' : r > 1 ? 'yellow' : 'green';
function ddcWeek(m) { // สัปดาห์ที่ครบล่าสุดของไฟล์กอง (ไฟล์ดาวน์โหลดกลางสัปดาห์ → ใช้สัปดาห์ก่อน)
  const t = parseISO(DB.config.ddc_base_as_of || ''); let W = m.week?.week || 0;
  if (isFinite(t)) { let w = epiWeek(t, S.y - 543); if (t < w.to) w = epiWeek(w.from - DAY, S.y - 543); if (w.year === S.y - 543) W = Math.min(W || 99, w.week); }
  return W;
}
function ddcLevels(m) {
  const B = DB.ddcBase, col = 'y' + S.y; if (!B?.length || !(col in B[0]) || !m.week) return null;
  const W = ddcWeek(m), Wn = DB.config.alert.window_weeks || 4, w0 = Math.max(1, W - Wn + 1);
  const rows = DB.config.diseases.map(z => {
    const o = { id: z.id, name: z.name };
    for (const lvl of ['country', 'region', 'province']) {
      const R = B.filter(b => b.level === lvl && b.disease_id === z.id), win = R.filter(b => +b.epi_week >= w0 && +b.epi_week <= W);
      const rec = win.reduce((a, b) => a + (+b[col] || 0), 0), med = win.reduce((a, b) => a + (+b.median_5y || 0), 0);
      o[lvl] = { cum: R.filter(b => +b.epi_week <= W).reduce((a, b) => a + (+b[col] || 0), 0), rec, med, ratio: med >= 3 ? rec / med : null };
    }
    return o;
  });
  return { W, w0, rows };
}
function levelsCard(m) {
  const L = ddcLevels(m); if (!L) return '';
  const cellR = o => `<td class="r">${fmt(o.cum)}</td><td class="r">${o.ratio == null ? '<span class="muted">ข้อมูลน้อย</span>' : `<span class="chip ${RATIO_LV(o.ratio)}">${fmt(o.ratio, 1)} เท่า</span>`}</td>`;
  const local = L.rows.filter(r => r.province.ratio != null && r.country.ratio != null && r.province.ratio > 1 && r.province.ratio > r.country.ratio * 1.2);
  return `<div class="card"><div class="card-h"><h2>เทียบประเทศ • เขตสุขภาพที่ 10 • จังหวัด</h2><span class="src">ที่มา: แดชบอร์ดกองระบาดวิทยา</span></div>
  <p class="note hint">ยอดสะสมสัปดาห์ที่ 1–${L.W} และ <b>เทียบกับปีปกติ (ค่ากลาง 5 ปี)</b> ของ ${L.W - L.w0 + 1} สัปดาห์ล่าสุด (สัปดาห์ที่ ${L.w0}–${L.W}) — มากกว่า 1 = สูงกว่าปีปกติ</p>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th rowspan="2">โรค</th><th class="r" colspan="2">ประเทศ</th><th class="r" colspan="2">เขต 10</th><th class="r" colspan="2">อุบลราชธานี</th></tr><tr><th class="r">สะสม</th><th class="r">เทียบปีปกติ</th><th class="r">สะสม</th><th class="r">เทียบปีปกติ</th><th class="r">สะสม</th><th class="r">เทียบปีปกติ</th></tr></thead><tbody>
  ${L.rows.map(r => `<tr><td>${esc(r.name)}</td>${cellR(r.country)}${cellR(r.region)}${cellR(r.province)}</tr>`).join('')}</tbody></table></div>
  <p class="note">${local.length ? `<b>สัญญาณเฉพาะพื้นที่:</b> ${local.map(r => `${esc(r.name)} (อุบลฯ ${fmt(r.province.ratio, 1)} เท่า ประเทศ ${fmt(r.country.ratio, 1)} เท่าของปีปกติ)`).join(', ')} — สูงกว่าแนวโน้มประเทศ ควรค้นหาสาเหตุในพื้นที่` : 'ไม่มีโรคที่อุบลฯ สูงกว่าแนวโน้มประเทศอย่างชัดเจน'} • "–" = ผู้ป่วยน้อยเกินกว่าจะคำนวณอัตราส่วน • ยอดของกองนับตามจังหวัดขณะป่วย อาจต่างจากรายงานประจำสัปดาห์เล็กน้อย</p></div>`;
}
function levelRow(m) {
  const L = ddcLevels(m); if (!L) return '';
  const ids = S.d === 'ALL' ? DB.config.diseases.map(z => z.id) : [S.d], R = L.rows.filter(r => ids.includes(r.id));
  const agg = lvl => R.reduce((a, r) => ({ cum: a.cum + r[lvl].cum, rec: a.rec + r[lvl].rec, med: a.med + r[lvl].med }), { cum: 0, rec: 0, med: 0 });
  const mp = m.dc === 'ALL' ? m : model('ALL');
  const P = DB.config, prov = mp.per.filter(r => ids.includes(r.id)), provC = prov.reduce((a, r) => a + r.cases, 0), provX = prov.reduce((a, r) => a + r.deaths, 0);
  const box = (cls, title, sub, cum, pop, o, extra) => { const ratio = o.med >= 3 ? o.rec / o.med : null; return `<div class="lv-card ${cls}"><div class="lv-t">${title}<small>${sub}</small></div>
    <div class="lv-v">${fmt(cum)} <small>ราย</small></div><div class="lv-s">${pop ? `${fmt(rate(cum, pop), 2)} ต่อแสน ปชก.` : ''}${extra || ''}</div>
    <div class="lv-r">${ratio == null ? '<span class="muted">ผู้ป่วยน้อย ยังเทียบไม่ได้</span>' : `${plainChip(ratio > 1.5 ? 'red' : ratio > 1.2 ? 'yellow' : 'green')} <span class="muted" title="4 สัปดาห์ล่าสุด เทียบค่ากลาง 5 ปี (สัปดาห์ที่ ${L.w0}–${L.W})">${ratio > 1.2 ? `มากกว่าปีปกติ ${fmt(ratio, 1)} เท่า` : ratio < 0.8 ? 'น้อยกว่าปีปกติ' : 'ใกล้เคียงปีปกติ'}</span>`}</div></div>`; };
  const name = S.d === 'ALL' ? 'รวม 10 โรค' : dName(S.d);
  return `<section class="levels${m.dc !== 'ALL' ? ' four' : ''}"><div class="lv-head"><b>${esc(name)}</b> <span class="muted">ประเทศ → เขต 10 → จังหวัด • ยอดสะสมปีนี้</span></div>
    <div class="lv-grid">${box('c1', 'ประเทศไทย', `สัปดาห์ที่ 1–${L.W} • กองระบาด`, agg('country').cum, P.population_country, agg('country'))}
    ${box('c2', 'เขตสุขภาพที่ 10', `สัปดาห์ที่ 1–${L.W} • กองระบาด`, agg('region').cum, P.population_region, agg('region'))}
    ${box('c3', 'จังหวัดอุบลราชธานี', `ข้อมูล ณ ${thDate(mp.cut)} • รายงานประจำสัปดาห์`, provC, mp.pop, agg('province'), ` • ตาย ${fmt(provX)} ราย${mp.weekDelta != null && S.d === 'ALL' ? ` • สัปดาห์นี้ +${fmt(mp.weekDelta)}` : ''}`)}
    ${m.dc !== 'ALL' ? (() => { const dr = m.per.filter(r => ids.includes(r.id)), c = dr.reduce((a, r) => a + r.cases, 0), x = dr.reduce((a, r) => a + r.deaths, 0), rt = rate(c, m.pop), prt = rate(provC, mp.pop), q = prt ? rt / prt : null;
      return `<div class="lv-card c4"><div class="lv-t">${esc(distName(m.dc))}<small>DDS ถึง ${thDate(m.cut)}</small></div><div class="lv-v">${fmt(c)} <small>ราย</small></div><div class="lv-s">${fmt(rt, 2)} ต่อแสน ปชก. • ตาย ${fmt(x)} ราย</div><div class="lv-r">${q == null ? '' : `${plainChip(q >= 1.5 && c >= 10 ? 'red' : q >= 1.2 ? 'yellow' : 'green')} <span class="muted">${q >= 1.2 ? `ป่วยมากกว่าค่าเฉลี่ยจังหวัด ${fmt(q, 1)} เท่า` : 'ใกล้เคียงหรือต่ำกว่าค่าเฉลี่ยจังหวัด'}</span>`}</div></div>`; })() : ''}</div></section>`;
}
const AGE_ORDER = ['0-4', '5-14', '15-24', '25-34', '35-44', '45-54', '55-64', '65+'];
function ageCard() {
  const A = (DB.ageProvince || []).filter(r => +r.year_be === S.y && (S.d === 'ALL' || r.disease_id === S.d)); if (!A.length || S.demo) return '';
  const v = AGE_ORDER.map(g => ({ label: g === '65+' ? '65 ปีขึ้นไป' : g + ' ปี', value: A.filter(r => r.age_group === g).reduce((a, r) => a + +r.cases, 0), color: COLORS.blue }));
  const tot = v.reduce((a, o) => a + o.value, 0), top = [...v].sort((a, b) => b.value - a.value)[0];
  return `<div class="card"><div class="card-h"><h2>กลุ่มอายุ: ${esc(S.d === 'ALL' ? 'รวม 10 โรค' : dName(S.d))}</h2><span class="src">DDS สะสม ระดับจังหวัด</span></div>${hbars(v, { unit: 'ราย' })}
  <p class="note">พบมากที่สุดในกลุ่ม ${esc(top.label)} (${fmt(top.value / (tot || 1) * 100, 1)}%) • แสดงเฉพาะระดับจังหวัด ไม่แยกเพศ/ตำบล เพื่อไม่ให้ระบุตัวบุคคลได้ (PDPA)</p></div>`;
}
function prelimCard() {
  const P = (DB.preliminary || []).filter(r => !/คีย์เข้าระบบแล้ว/.test(r.status) && (S.dc === 'ALL' || r.district_code === S.dc) && (S.d === 'ALL' || r.disease_id === S.d));
  if (!P.length || S.demo) return '';
  return `<div class="card prelim"><div class="card-h"><h2>${ico('alert', 18)} รายงานเบื้องต้น (ยังไม่อยู่ในระบบ DDS)</h2><span class="muted">${P.length} รายการ</span></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>วันที่รับแจ้ง</th><th>โรค</th><th>พื้นที่</th><th class="r">ป่วย</th><th class="r">ตาย</th><th>สถานะ</th><th>หมายเหตุ</th></tr></thead><tbody>${P.map(r => `<tr><td>${thDate(parseISO(r.report_date))}</td><td>${esc(dName(r.disease_id))}</td><td>${esc(r.district_code ? distName(r.district_code) : 'จังหวัด')}</td><td class="r">${fmt(+r.cases)}</td><td class="r ${+r.deaths ? 'red b' : ''}">${fmt(+r.deaths)}</td><td>${chip(/ยืนยันแล้ว/.test(r.status) ? 'orange' : 'yellow', '').replace(/>[^<]*</, `>${esc(r.status)}<`)}</td><td>${esc(r.note)}</td></tr>`).join('')}</tbody></table></div>
  <p class="note">ข้อมูลนี้ยังไม่นับรวมในตัวเลขของตาราง จนกว่าจะบันทึกเข้าระบบ</p></div>`;
}
function notesCard() {
  const meta = DB.ddsMeta || {};
  return `<details class="card notes"><summary><b>ที่มาของตัวเลข & ข้อควรรู้</b></summary><ol>
  <li><b>ยอดรวมจังหวัด</b>ปีปัจจุบัน = รายงานประจำสัปดาห์ (Excel รวบรวมรายงาน สสจ.) อัปเดตทุกวันจันทร์ รวมผู้เสียชีวิตที่ยืนยันแล้วแต่ยังไม่คีย์</li>
  <li><b>ปีก่อนหน้า</b> = แดชบอร์ดกองระบาดวิทยา (ยอดตายนับเฉพาะที่บันทึกในระบบ)</li>
  <li><b>รายอำเภอ / ตำบล / กลุ่มอายุ</b> = DDS (D506) ประมวลผลในเครื่องเจ้าหน้าที่ แล้วเผยแพร่เฉพาะยอดรวม${meta.cut_date ? ` • ตัดข้อมูล ${thDate(parseISO(meta.cut_date), false)}` : ''}</li>
  <li><b>มัธยฐาน 5 ปี</b> ประเทศ/เขต/จังหวัด = ไฟล์รายสัปดาห์ 5 ปีย้อนหลังของกองระบาด • ระดับอำเภอยังไม่มีมัธยฐาน (DDS เริ่มปี 2567) จึงใช้ 3 สัญญาณแทน</li>
  <li><b>2 สัปดาห์ล่าสุดเป็นข้อมูลเบื้องต้น</b> อาจเพิ่มขึ้นเมื่อมีรายงานเข้ามาภายหลัง</li>
  <li>ตำบลที่มีผู้ป่วย 1–2 ราย แสดงเป็น "&lt;3" • ไม่แสดงเพศ หมู่บ้าน หรือข้อมูลรายบุคคล (PDPA)</li>
  <li>ตัวเลข 3 แหล่งอาจต่างกันเล็กน้อยจากวันตัดข้อมูลและการนับตามที่อยู่ขณะป่วย ระบบตรวจความสอดคล้องทุกครั้งที่อัปเดต</li></ol></details>`;
}

// ---------- รายอำเภอ: 3 สัญญาณ (แทนมัธยฐานรายอำเภอ) ----------
function share68(id, W) { // สัดส่วนผู้ป่วยสะสมถึงสัปดาห์ W ของปีก่อน (ระดับจังหวัด) ใช้ประมาณช่วงเดียวกันรายอำเภอ
  const col = 'y' + (S.y - 1), R = (DB.ddcBase || []).filter(b => b.level === 'province' && b.disease_id === id);
  if (!R.length || !(col in R[0])) return null; const all = R.reduce((a, b) => a + (+b[col] || 0), 0);
  return all ? R.filter(b => +b.epi_week <= W).reduce((a, b) => a + (+b[col] || 0), 0) / all : null;
}
function districtSignals(m, d) {
  const Wn = DB.config.alert.window_weeks || 4, end = m.alertT, ids = d === 'ALL' ? DB.config.diseases.map(z => z.id) : [d];
  const sumW = (dc, from) => { let c = 0; for (let i = 0; i < Wn; i++) c += cell(DB, from - i * 7 * DAY, d, dc).c; return c; };
  const provRec = sumW('ALL', end), provRate = rate(provRec, DB.popTotal);
  const D = DB.ddcDistrict || [], Wk = ddcWeek(m) || epiWeek(m.alertT, S.y - 543).week;
  const hasCur = D.some(r => +r.year_be === S.y), hasPrev = D.some(r => +r.year_be === S.y - 1);
  const sh = Object.fromEntries(ids.map(id => [id, share68(id, Wk)]));
  const rows = DB.districts.map(x => {
    const rec = sumW(x.code, end), prev = sumW(x.code, end - Wn * 7 * DAY), rt = rate(rec, x.pop), rr = provRate && rt != null ? rt / provRate : null;
    let cum = 0; if (hasCur) cum = D.filter(r => +r.year_be === S.y && r.district_code === x.code && ids.includes(r.disease_id)).reduce((a, r) => a + +r.cases, 0);
    else for (const r of DB.rows) if (r.dc === x.code && ids.includes(r.d) && m.inCur(r)) cum += r.c;
    let est = null; if (hasPrev) { est = 0; for (const id of ids) { const c = D.filter(r => +r.year_be === S.y - 1 && r.district_code === x.code && r.disease_id === id).reduce((a, r) => a + +r.cases, 0); est += c * (sh[id] ?? 1); } }
    const tr = prev >= 3 ? rec / prev : null, vs = est != null && est >= 5 ? cum / est : null;
    const sig = [rr != null && rr >= 1.5 && rec >= 10, tr != null && tr >= 1.5 && rec >= 10, vs != null && vs >= 1.5 && cum >= 10];
    return { x, rec, prev, rt, rr, tr, cum, est, vs, sig, n: sig.filter(Boolean).length };
  });
  return { rows, provRate, provRec, Wn, Wk, hasCur, hasPrev };
}
// สถานะรายอำเภอ (อ่านง่าย 1 ป้าย): สูงกว่าจังหวัด / เพิ่มขึ้น / ทั้งสองอย่าง / ปกติ
const DST = [{ t: 'ปกติ', c: '#D6E4F5', f: '#10234A' }, { t: 'เพิ่มขึ้น', c: '#F6C343', f: '#10234A' }, { t: 'สูงกว่าจังหวัด', c: '#F6C343', f: '#10234A' }, { t: 'สูงกว่าจังหวัด + เพิ่มขึ้น', c: '#D93025', f: '#fff' }];
const dStatus = r => (r.sig[0] ? 2 : 0) + (r.sig[1] ? 1 : 0);
const dChip = n => `<span class="chip" style="background:${DST[n].c};color:${DST[n].f}">${DST[n].t}</span>`;
function weekBars(vals, ref, color, w = 150, h = 34) { // แท่งรายสัปดาห์ขนาดเล็ก + เส้นประระดับจังหวัด
  const n = vals.length, mx = Math.max(1, ...vals, ...(ref || [])), bw = w / n;
  const Y = v => h - 2 - (h - 6) * v / mx;
  const line = ref ? `<polyline points="${ref.map((v, i) => `${(i * bw + bw / 2).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="#6B7A90" stroke-width="1.2" stroke-dasharray="3 3"/>` : '';
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="wbars">${vals.map((v, i) => `<rect x="${(i * bw + 1).toFixed(1)}" y="${Y(v).toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${(h - 2 - Y(v)).toFixed(1)}" rx="1.5" fill="${color}" opacity="${i === n - 1 ? 1 : 0.55}"><title>${fmt(v)} ราย</title></rect>`).join('')}${line}</svg>`;
}
function diseaseChips(page) {
  return `<div class="dchips">${[['ALL', 'รวม 10 โรค'], ...DB.config.diseases.map(z => [z.id, z.name])].map(([id, n]) => `<a href="#" class="dchip pick-d2 ${S.d === id ? 'on' : ''}" data-d="${id}">${esc(n)}</a>`).join('')}</div>`;
}
// ===== หน้าอำเภอของฉัน: สำหรับ สสอ./รพ./รพ.สต. (เปิดในมือถือ, ภาษาง่าย, 3 กล่อง) =====
const MY_MIN = 10; // ผู้ป่วยขั้นต่ำก่อนเตือน "สูงกว่าปกติ" (กันเตือนเกินจริงในโรคที่ผู้ป่วยน้อย)
function myStatus(rec, rr, tr) {
  if (rec >= MY_MIN && ((rr != null && rr >= 1.5) || (tr != null && tr >= 1.5))) return ['red', 'สูงกว่าปกติ'];
  if (rec >= 5 && ((rr != null && rr >= 1.2) || (tr != null && tr >= 1.3))) return ['yellow', 'เฝ้าระวัง'];
  return ['green', 'ปกติ'];
}
function pageMy() {
  const m = model('ALL');
  if (!m.has || !m.hasDds) return emptyNote();
  const wL = epiWeek(m.alertT, S.y - 543), w0 = Math.max(1, wL.week - 3), asOf = thDate(m.cut, false);
  if (S.dc === 'ALL') return `<section class="my">
    <div class="my-head"><div class="my-eyebrow">แดชบอร์ดเฝ้าระวัง 10 โรค • สสจ.อุบลราชธานี</div><h1>เลือกอำเภอของคุณ</h1><p>กดครั้งเดียว แล้วกด "คัดลอกลิงก์" เก็บไว้ ครั้งต่อไปเปิดลิงก์นั้นจะเข้าอำเภอคุณทันที</p></div>
    <div class="my-pick">${[...DB.districts].sort((a, b) => a.name.localeCompare(b.name, 'th')).map(d => `<a href="#" class="pick-dc" data-dc="${d.code}">${esc(d.name)}</a>`).join('')}</div></section>`;
  const x = DB.districts.find(o => o.code === S.dc), Wn = 4, end = m.alertT, N = 8;
  const sumW = (id, dc, from) => { let c = 0; for (let i = 0; i < Wn; i++) c += cell(DB, from - i * 7 * DAY, id, dc).c; return c; };
  const rows = DB.config.diseases.map(z => {
    const rec = sumW(z.id, x.code, end), prev = sumW(z.id, x.code, end - Wn * 7 * DAY), p = sumW(z.id, 'ALL', end);
    const rt = rate(rec, x.pop), prt = rate(p, DB.popTotal), rr = prt ? rt / prt : null, tr = prev >= 3 ? rec / prev : null;
    let [lv, tx] = myStatus(rec, rr, tr); const falling = lv !== 'green' && tr != null && tr <= 0.7; if (falling) tx += ' (กำลังลดลง)';
    const ser = Array.from({ length: N }, (_, i) => cell(DB, end - (N - 1 - i) * 7 * DAY, z.id, x.code).c);
    const why = lv === 'green' ? (rec ? 'ใกล้เคียงหรือต่ำกว่าค่าเฉลี่ยจังหวัด' : 'ไม่พบผู้ป่วย') : [rr != null && rr >= 1.2 ? 'ป่วยมากกว่าค่าเฉลี่ยจังหวัด' : '', tr != null && tr >= 1.3 ? 'เพิ่มขึ้นจากเดือนก่อน' : '', falling ? 'แต่ลดลงจากเดือนก่อน' : ''].filter(Boolean).join(' ');
    return { z, rec, prev, lv, tx, why, ser, rr };
  }).sort((a, b) => ({ red: 0, yellow: 1, green: 2 }[a.lv] - { red: 0, yellow: 1, green: 2 }[b.lv]) || b.rec - a.rec);
  const show = rows.filter(r => r.rec > 0 || r.lv !== 'green'), quiet = rows.filter(r => !show.includes(r));
  const nRed = rows.filter(r => r.lv === 'red').length, nY = rows.filter(r => r.lv === 'yellow').length;
  const cl = detectClusters(DB, m.alertT).filter(c => c.dc === x.code);
  const F = (DB.facilities || []).filter(f => f.district_code === x.code), miss = F.filter(f => !+f.reported), per = F[0]?.period_label || '';
  const head = nRed ? `<b>${nRed} โรค</b> สูงกว่าปกติ ควรติดตาม` : nY ? `<b>${nY} โรค</b> ต้องเฝ้าระวัง` : 'สถานการณ์โดยรวมปกติ';
  return `<section class="my">
  <div class="my-head ${nRed ? 'red' : nY ? 'yellow' : 'green'}"><div class="my-eyebrow">อำเภอของฉัน • สัปดาห์ที่ ${w0}–${wL.week} (ถึง ${thDate(wL.to)})</div>
    <h1>อำเภอ${esc(x.name)}</h1><p class="my-sum">${head}${cl.length ? ` • พบกลุ่มก้อน <b>${cl.length}</b> พื้นที่` : ''}${miss.length ? ` • ยังไม่ส่งรายงาน <b>${miss.length}</b> แห่ง` : ''}</p>
    <p class="my-purpose">ใช้ดูสถานการณ์รายสัปดาห์ (อัปเดตทุกวันจันทร์) — หากพบผู้ป่วยผิดปกติวันนี้ ให้แจ้ง สสอ./สสจ. ทันที ไม่ต้องรอแดชบอร์ด</p>
    <div class="my-act"><button class="btn sm" id="copylink">${ico('link', 15)} คัดลอกลิงก์อำเภอนี้</button><a href="#" class="btn ghost sm pick-dc" data-dc="ALL">เปลี่ยนอำเภอ</a></div></div>

  <div class="my-card"><h2>① โรคที่ต้องระวังสัปดาห์นี้</h2><p class="my-note">ผู้ป่วย 4 สัปดาห์ล่าสุดในอำเภอ • แท่ง = 8 สัปดาห์ (ขวาสุด = ล่าสุด)</p>
    ${show.map(r => `<div class="my-row ${r.lv}"><span class="dot"></span><div class="my-main"><div class="my-t"><b>${esc(r.z.name)}</b><span class="my-st">${r.tx}</span></div><div class="my-why">${fmt(r.rec)} ราย${r.why ? ' • ' + r.why : ''}</div></div>${weekBars(r.ser, null, r.lv === 'red' ? '#D93025' : r.lv === 'yellow' ? '#D9A21B' : '#4F86DB', 92, 30)}</div>`).join('') || '<div class="my-ok">✓ ไม่พบผู้ป่วยใน 4 สัปดาห์ล่าสุด</div>'}
    ${quiet.length ? `<p class="my-note">ไม่พบผู้ป่วย: ${quiet.map(r => esc(r.z.name)).join(', ')}</p>` : ''}</div>

  <div class="my-card"><h2>② กลุ่มก้อนในอำเภอ</h2>
    ${cl.length ? cl.map(c => `<div class="my-row red"><span class="dot"></span><div class="my-main"><div class="my-t"><b>${esc(dName(c.d))}</b><span class="my-st">${c.cases} ราย</span></div><div class="my-why">${c.sd.startsWith('ไม่ระบุ') ? 'ตำบลเดียวกัน (ผู้ป่วยน้อย ไม่แสดงตำบล — ดูรายชื่อใน DDS)' : esc(c.sd)} • ${thDate(c.first)}–${thDate(c.last + 6 * DAY)}</div></div></div>`).join('') + '<p class="my-note">ควรสอบสวนเบื้องต้นและแจ้ง สสจ. ภายใน 24–48 ชม.</p>' : '<div class="my-ok">✓ ไม่พบกลุ่มก้อน</div>'}</div>

  <div class="my-card"><h2>③ หน่วยบริการที่ยังไม่ส่งรายงาน</h2><p class="my-note">${F.length ? `ส่งแล้ว ${F.length - miss.length} จาก ${F.length} แห่ง • ${esc(per)}` : 'ยังไม่มีข้อมูลรายหน่วยบริการ'}</p>
    ${F.length ? (miss.length ? `<ul class="my-miss">${miss.map(f => `<li>${esc(f.unit_name)}</li>`).join('')}</ul>` : '<div class="my-ok">✓ ส่งครบทุกแห่ง</div>') : ''}</div>

  <p class="my-foot">ข้อมูลจาก DDS (รง.506) ตามวันเริ่มป่วย ถึงสัปดาห์ที่ ${wL.week} • อัปเดตทุกวันจันทร์ (ข้อมูล ณ ${asOf}) • ตัวเลขอาจน้อยกว่าในระบบ DDS เล็กน้อยเพราะรายงานที่ส่งหลังวันตัดข้อมูลจะเข้ามาในรอบถัดไป • "สูงกว่าปกติ" ใช้เมื่อมีผู้ป่วยอย่างน้อย ${MY_MIN} ราย<br><a href="#" data-page="district">ดูแผนที่และรายละเอียดเพิ่มเติม →</a></p>
  </section>`;
}
function pageDistrict() {
  const m = model('ALL');
  if (!m.has || !m.hasDds) return header(m) + emptyNote();
  const d = S.d, G = districtSignals(m, d), byCode = Object.fromEntries(G.rows.map(r => [r.x.code, r]));
  const wL = epiWeek(m.alertT, S.y - 543).week, w0 = Math.max(1, wL - G.Wn + 1), dn = d === 'ALL' ? 'รวม 10 โรค' : dName(d);
  const N = 8, wk = Array.from({ length: N }, (_, i) => m.alertT - (N - 1 - i) * 7 * DAY);
  G.rows.forEach(r => { r.st = dStatus(r); r.ser = wk.map(t => cell(DB, t, d, r.x.code).c); r.last = r.ser[N - 1]; });
  const sorted = [...G.rows].sort((p, q) => q.st - p.st || (q.rt ?? 0) - (p.rt ?? 0));
  const hot = sorted.filter(r => r.st >= 2);
  const tam = S.dc !== 'ALL' && d !== 'ALL' ? (DB.tambonYear || []).filter(r => +r.year_be === S.y && r.district_code === S.dc && r.disease_id === d).sort((a, b) => (b.cases === '<3' ? 0 : +b.cases) - (a.cases === '<3' ? 0 : +a.cases)) : [];
  return header(m) + diseaseChips() + `
  <div class="card hl"><b>${esc(dn)} • สัปดาห์ที่ ${w0}–${wL}:</b> ${hot.length ? `อำเภอที่อัตราป่วยสูงกว่าจังหวัดชัดเจน <b>${hot.length}</b> อำเภอ — ${hot.slice(0, 6).map(r => `${esc(r.x.name)} (${fmt(r.rr, 1)} เท่า)`).join(', ')}` : 'ไม่มีอำเภอที่อัตราป่วยสูงกว่าจังหวัดชัดเจน'}${sorted.some(r => r.st === 1) ? ` • กำลังเพิ่มขึ้น: ${sorted.filter(r => r.st === 1).map(r => esc(r.x.name)).join(', ')}` : ''}</div>
  <section class="dgrid">
    <div class="card"><div class="card-h"><h2>แผนที่: ${esc(dn)}</h2><span class="muted">คลิกอำเภอเพื่อดูรายตำบล</span></div>
    ${renderMap(DB, dc => DST[byCode[dc]?.st || 0].c, dc => byCode[dc] ? `${fmt(byCode[dc].rec)} ราย` : '', S.dc)}
    <div class="legend-card">${DST.map((o, i) => dChip(i)).join('')}</div>
    <p class="note">ตัวเลขบนแผนที่ = ผู้ป่วย ${G.Wn} สัปดาห์ล่าสุด • <b>สูงกว่าจังหวัด</b> = อัตราป่วยตั้งแต่ 1.5 เท่าของทั้งจังหวัด • <b>เพิ่มขึ้น</b> = ${G.Wn} สัปดาห์ล่าสุดมากกว่า ${G.Wn} สัปดาห์ก่อนหน้า 1.5 เท่าขึ้นไป</p></div>
    <div class="card"><div class="card-h"><h2>เฝ้าระวังรายอำเภอ รายสัปดาห์</h2><span class="muted">DDS ตามวันเริ่มป่วย</span></div>
    <div class="tbl-wrap"><table class="tbl dtbl"><thead><tr><th>อำเภอ</th><th class="r">สัปดาห์ที่ ${wL}</th><th class="r">${G.Wn} สัปดาห์</th><th class="r">ต่อแสน</th><th>${N} สัปดาห์ล่าสุด</th><th>สถานะ</th></tr></thead><tbody>
    ${sorted.map(r => `<tr class="${S.dc === r.x.code ? 'sel' : ''}"><td><a href="#" class="pick-dc" data-dc="${r.x.code}">${esc(r.x.name)}</a></td><td class="r b">${fmt(r.last)}</td><td class="r">${fmt(r.rec)}</td><td class="r">${r.rt == null ? '–' : fmt(r.rt, 1)}</td><td>${weekBars(r.ser, null, r.st === 0 ? '#4F86DB' : r.st === 1 ? '#D9A21B' : DST[r.st].c)}</td><td>${dChip(r.st)}</td></tr>`).join('')}
    </tbody><tfoot><tr><td>ทั้งจังหวัด</td><td class="r">${fmt(cell(DB, m.alertT, d, 'ALL').c)}</td><td class="r">${fmt(G.provRec)}</td><td class="r">${G.provRate == null ? '–' : fmt(G.provRate, 1)}</td><td></td><td></td></tr></tfoot></table></div>
    <details class="more"><summary>ดูเพิ่ม: ยอดสะสมปี ${S.y} และเทียบช่วงเดียวกันปี ${S.y - 1}</summary>
    <table class="tbl"><thead><tr><th>อำเภอ</th><th class="r">สะสม ${S.y}</th><th class="r">ช่วงเดียวกัน ${S.y - 1} (ประมาณ)</th><th class="r">เท่า</th></tr></thead><tbody>${[...G.rows].sort((a, b) => (b.vs ?? 0) - (a.vs ?? 0)).map(r => `<tr><td>${esc(r.x.name)}</td><td class="r">${fmt(r.cum)}</td><td class="r">${r.est == null ? '–' : fmt(Math.round(r.est))}</td><td class="r ${r.vs >= 1.5 ? 'b red' : ''}">${r.vs == null ? '–' : fmt(r.vs, 2) + '×'}</td></tr>`).join('')}</tbody></table>
    <p class="note">สะสม ${S.y} = ตารางรายอำเภอของกองระบาด • ช่วงเดียวกันปี ${S.y - 1} ประมาณจากยอดทั้งปีรายอำเภอ × สัดส่วนสะสมถึงสัปดาห์ที่ ${G.Wk} ของจังหวัด</p></details></div>
  </section>
  ${S.dc !== 'ALL' ? `<div class="card"><div class="card-h"><h2>รายตำบล: ${esc(distName(S.dc))} • ${esc(dn)}</h2><span class="src">DDS สะสมปี ${S.y}</span></div>
    ${d === 'ALL' ? '<div class="empty">เลือกโรคด้านบนเพื่อดูรายตำบล</div>' : tam.length ? `<div class="tam">${tam.map(r => `<div class="tm"><span>${esc(DB.tambonName?.[r.subdistrict_code] ? 'ต.' + DB.tambonName[r.subdistrict_code] : 'ตำบลรหัส ' + r.subdistrict_code.slice(-2))}</span><b>${esc(r.cases)}</b></div>`).join('')}</div><p class="note">"&lt;3" = ผู้ป่วย 1–2 ราย ปิดตัวเลขเพื่อป้องกันการระบุตัวบุคคล</p>` : '<div class="empty">ไม่พบผู้ป่วยในปีนี้</div>'}</div>` : ''}`;
}

function pageTrend() {
  const m = model();
  if (!m.has || !m.hasDds) return header(m) + emptyNote();
  const PW = DB.config.provisional_weeks ?? 2, d = S.d, dn = d === 'ALL' ? 'รวม 10 โรค' : dName(d);
  const weeks = []; for (let t = sundayOf(m.from); t <= m.to; t += 7 * DAY) weeks.push(t);
  const cur = weeks.map(t => t <= m.alertT ? cell(DB, t, d, S.dc).c : null);
  const base = weeks.map(t => { const e = epiWeek(t); return S.dc === 'ALL' ? baselineFor(DB, d, 'ALL', e.week, e.year) : null; });
  const prev = weeks.map(() => null);
  // small multiples: 25 อำเภอ × 12 สัปดาห์ + เส้นประ = ระดับที่คาดหากป่วยเท่าค่าเฉลี่ยจังหวัด
  const N = 12, wk = Array.from({ length: N }, (_, i) => m.alertT - (N - 1 - i) * 7 * DAY), wn = wk.map(t => epiWeek(t, S.y - 543).week);
  const provSer = wk.map(t => cell(DB, t, d, 'ALL').c), pop = DB.popTotal;
  const G = districtSignals(model('ALL'), d), byC = Object.fromEntries(G.rows.map(r => [r.x.code, r]));
  const tiles = DB.districts.map(x => { const ser = wk.map(t => cell(DB, t, d, x.code).c), ref = provSer.map(v => v * x.pop / pop); const g = byC[x.code]; const st = g ? dStatus(g) : 0;
    return { x, ser, ref, st, rec: ser.slice(-4).reduce((a, v) => a + v, 0), rt: g?.rt }; }).sort((a, b) => b.st - a.st || (b.rt ?? 0) - (a.rt ?? 0));
  return header(m) + diseaseChips() + `
  <div class="card"><div class="card-h"><h2>ผู้ป่วยรายสัปดาห์: ${esc(dn)} — ${esc(distName(S.dc))}</h2><span class="muted">เส้นส้ม = มัธยฐาน 5 ปี</span></div>
  ${epiCurve({ weeks, cur, prev, base, ratioOrange: DB.config.alert.ratio_orange, prov: weeks.map(t => t <= m.alertT && t > m.alertT - PW * 7 * DAY) })}
  <p class="note">แสดงถึงสัปดาห์ที่ ${epiWeek(m.alertT, S.y - 543).week} (สัปดาห์ที่ครบล่าสุดของ DDS) • ${PW} สัปดาห์ล่าสุดเป็นข้อมูลเบื้องต้น อาจเพิ่มขึ้นเมื่อมีรายงานเข้ามาภายหลัง</p></div>
  <div class="card"><div class="card-h"><h2>25 อำเภอ × ${N} สัปดาห์ล่าสุด: ${esc(dn)}</h2><span class="muted">สัปดาห์ที่ ${wn[0]}–${wn[N - 1]} • คลิกอำเภอเพื่อเลือก</span></div>
  <p class="note hint">แต่ละกล่อง = 1 อำเภอ แท่ง = ผู้ป่วยแต่ละสัปดาห์ (แท่งขวาสุด = สัปดาห์ล่าสุด) • <b>เส้นประ</b> = จำนวนที่ควรเป็นถ้าอำเภอป่วยในอัตราเดียวกับทั้งจังหวัด → <b>แท่งสูงกว่าเส้นประ = สูงกว่าค่าเฉลี่ยจังหวัด</b> • เรียงจากอำเภอที่ต้องเฝ้าระวังก่อน</p>
  <div class="smult">${tiles.map(o => `<a href="#" class="sm pick-dc st${o.st}" data-dc="${o.x.code}"><div class="sm-h"><b>${esc(o.x.name)}</b>${o.st ? dChip(o.st) : ''}</div>
    ${weekBars(o.ser, o.ref, o.st >= 2 ? DST[o.st].c : o.st === 1 ? '#D9A21B' : '#4F86DB', 210, 64)}
    <div class="sm-f"><span>สัปดาห์ล่าสุด <b>${fmt(o.ser[N - 1])}</b></span><span>4 สัปดาห์ <b>${fmt(o.rec)}</b></span><span>${o.rt == null ? '' : fmt(o.rt, 1) + '/แสน'}</span></div></a>`).join('')}</div>
  <p class="note">ข้อมูลจาก DDS ตามวันเริ่มป่วย • ความสูงของแท่งปรับตามแต่ละอำเภอ (ดูตัวเลขด้านล่างกล่องเพื่อเทียบจำนวนจริง)</p></div>`;
}

function pageCluster() {
  const m = model('ALL');
  const cl = m.hasDds ? detectClusters(DB, m.alertT).filter(c => (S.dc === 'ALL' || c.dc === S.dc) && (S.d === 'ALL' || c.d === S.d)) : [];
  const meta = DB.ddsMeta || {};
  return header(m) + `
  <section class="kpis">
    <div class="kpi"><div class="k-t">กลุ่มก้อนที่ตรวจพบ</div><div class="k-v ${cl.length ? 'orange' : 'green'}">${cl.length}</div><div class="k-s">พื้นที่ ถึงสัปดาห์ที่ ${meta.last_complete_week || '–'}</div></div>
    <div class="kpi"><div class="k-t">ผู้ป่วยในกลุ่มก้อน</div><div class="k-v blue">${fmt(cl.reduce((a, c) => a + c.cases, 0))}</div><div class="k-s">ราย</div></div>
    <div class="kpi"><div class="k-t">อำเภอที่พบ</div><div class="k-v navy">${new Set(cl.map(c => c.dc)).size}</div><div class="k-s">จาก 25 อำเภอ</div></div>
  </section>
  <div class="card"><div class="card-h"><h2>กลุ่มก้อนที่ตรวจพบอัตโนมัติจาก DDS</h2><span class="muted">ผู้ป่วยโรคเดียวกัน ในตำบลเดียวกัน ภายใน 1 ระยะฟักตัว ตามเกณฑ์ขั้นต่ำของแต่ละโรค</span></div>
  ${cl.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>โรค</th><th>อำเภอ</th><th>ตำบล</th><th class="r">ผู้ป่วย</th><th>ช่วงเวลา</th></tr></thead><tbody>
  ${cl.slice(0, 80).map(c => `<tr><td>${esc(dName(c.d))}</td><td><a href="#" class="pick-dc" data-dc="${c.dc}">${esc(DB.districts.find(x => x.code === c.dc)?.name)}</a></td><td>${esc(c.sd)}</td><td class="r b">${c.cases}</td><td>${thDate(c.first)} – ${thDate(c.last + 6 * DAY)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">ไม่พบกลุ่มก้อนที่เข้าเกณฑ์</div>'}
  <p class="note">เกณฑ์ขั้นต่ำ: ${DB.config.diseases.filter(z => +z.cluster_min > 0).map(z => `${esc(z.name)} ≥ ${z.cluster_min} ราย`).join(' • ')} • ไข้หวัดใหญ่/ปอดอักเสบพบทุกตำบล จึงไม่ตรวจ • ตำบลที่มีผู้ป่วยน้อยกว่า 3 ราย แสดงเฉพาะอำเภอ (PDPA)</p></div>`;
}

// ---------- ตรวจสอบการมีอยู่จริงของสถานพยาบาล (อำเภอยืนยัน) ----------
// กลุ่มสถานพยาบาล: ใช้ประเภทจาก DDS แล้วแยก รพ.รัฐนอกสังกัด สป.สธ. และหน่วยของมหาวิทยาลัย/เทศบาลออกตามชื่อ
const VGROUPS = ['โรงพยาบาลรัฐ (สังกัด สป.สธ.)', 'รพ.สต. สังกัด สธ.', 'สถานบริการสาธารณสุขชุมชน (สสช.)', 'ศูนย์สุขภาพชุมชน (ศสม./PCU)', 'รพ.สต. ถ่ายโอน อปท.', 'โรงพยาบาลรัฐ นอกสังกัด สป.สธ.', 'โรงพยาบาลเอกชน', 'หน่วยงานเฉพาะ/คลินิก/อื่น ๆ'];
const VSHORT = { 'โรงพยาบาลรัฐ (สังกัด สป.สธ.)': 'รพ.รัฐ สป.สธ.', 'รพ.สต. สังกัด สธ.': 'รพ.สต. สธ.', 'สถานบริการสาธารณสุขชุมชน (สสช.)': 'สสช.', 'ศูนย์สุขภาพชุมชน (ศสม./PCU)': 'ศสม./PCU', 'รพ.สต. ถ่ายโอน อปท.': 'รพ.สต. อปท.', 'โรงพยาบาลรัฐ นอกสังกัด สป.สธ.': 'รพ.รัฐ นอก สป.สธ.', 'โรงพยาบาลเอกชน': 'รพ.เอกชน', 'หน่วยงานเฉพาะ/คลินิก/อื่น ๆ': 'เฉพาะ/อื่น ๆ' };
const OUT_MOPH = /พระศรีมหาโพธิ์|มะเร็ง|ศูนย์อนามัย|กองบิน|ค่าย/; // นอก สป.สธ. 3 + นอก สธ. 2 (ตรงกับตารางสรุปประเภทของ DDC)
const vgroup = f => f.dds_type === 'โรงพยาบาลรัฐ' ? (OUT_MOPH.test(f.unit_name) ? 'โรงพยาบาลรัฐ นอกสังกัด สป.สธ.' : 'โรงพยาบาลรัฐ (สังกัด สป.สธ.)')
  : f.dds_type === 'ศูนย์สุขภาพชุมชน (ศสม./PCU)' && /วัดใต้|มหาวิทยาลัย/.test(f.unit_name) ? 'หน่วยงานเฉพาะ/คลินิก/อื่น ๆ' : f.dds_type;
const SCOPES = [
  { id: 'moph', name: 'หน่วยบริการในสังกัด สป.สธ.', sub: 'สสจ./สสอ. กำกับโดยตรง', g: VGROUPS.slice(0, 4) },
  { id: 'lao', name: 'รพ.สต. ถ่ายโอน อปท.', sub: 'ติดตามร่วมกับ อปท./สสอ.', g: VGROUPS.slice(4, 5) },
  { id: 'out', name: 'นอกสังกัด สป.สธ. / เอกชน / อื่น ๆ', sub: 'ประสานขอความร่วมมือ', g: VGROUPS.slice(5) }];
const vExcluded = st => /ไม่ให้บริการ|ไม่มีอยู่|ปิดแล้ว/.test(st || '');
const vMap = () => new Map((DB.facilityVerify || []).filter(v => v.unit_code).map(v => [String(v.unit_code).padStart(5, '0'), v]));
function verifyCard(F) {
  if (!F.length || !F.some(f => f.dds_type)) return '';
  const V = vMap(), hasV = V.size > 0, flag = f => !+f.reported ? 'no' : !+f.reports ? 'zero' : '';
  const ds = DB.districts.filter(d => S.dc === 'ALL' || d.code === S.dc).map(d => {
    const fs = F.filter(f => f.district_code === d.code), g = {};
    VGROUPS.forEach(t => { const x = fs.filter(f => vgroup(f) === t); g[t] = { n: x.length, r: x.filter(f => +f.reported).length }; });
    return { d, g, n: fs.length, r: fs.filter(f => +f.reported).length, no: fs.filter(f => flag(f) === 'no').length, zero: fs.filter(f => flag(f) === 'zero').length };
  }).filter(o => o.n);
  const cell = v => !v.n ? '<td class="r muted">–</td>' : `<td class="r ${v.r < v.n ? 'red b' : ''}">${v.r}/${v.n}</td>`;
  const list = F.filter(flag).sort((a, b) => a.district_name.localeCompare(b.district_name, 'th') || (+a.reported - +b.reported) || VGROUPS.indexOf(vgroup(a)) - VGROUPS.indexOf(vgroup(b)));
  const vchip = v => !v?.status ? '<span class="muted">–</span>' : `<span class="chip ${vExcluded(v.status) ? 'green' : /แม่ข่าย/.test(v.status) ? 'yellow' : 'orange'}">${esc(v.status)}</span>`;
  const one = S.dc !== 'ALL' && ds[0];
  // สรุปตามประเภท (อำเภอที่เลือก หรือทั้งจังหวัด)
  const tot = VGROUPS.map(t => ({ t, ...ds.reduce((a, o) => ({ n: a.n + o.g[t].n, r: a.r + o.g[t].r }), { n: 0, r: 0 }) })).filter(x => x.n);
  return `<div class="card" id="verify"><div class="card-h"><h2>สถานพยาบาลในทะเบียน DDS แยกประเภท ${esc(one ? '— อ.' + one.d.name : '')}</h2><span class="src">ข้อมูลเพื่อทราบ</span></div>
  <p class="note">ความครอบคลุมคิดจากทุกหน่วยที่อยู่ในทะเบียน DDS ของกรมควบคุมโรค (ทั้งจังหวัด ${fmt(DB.facilities.length)} แห่ง) — หากพบหน่วยที่ปิดแล้ว ไม่มีอยู่จริง หรือไม่ได้ตรวจรักษาผู้ป่วย โปรดแจ้งกลุ่มงานควบคุมโรคติดต่อ สสจ.อุบลราชธานี</p>
  <div class="vscopes">${SCOPES.map(sc => { const xs = tot.filter(x => sc.g.includes(x.t)); if (!xs.length) return ''; const n = xs.reduce((a, x) => a + x.n, 0), r = xs.reduce((a, x) => a + x.r, 0), pc = r / n * 100;
    return `<div class="vscope"><div class="vs-h"><div><b>${esc(sc.name)}</b><span>${esc(sc.sub)}</span></div><div class="vs-p ${pc >= 100 ? 'green' : pc >= 80 ? 'orange' : 'red'}">${fmt(pc, 1)}%<small>${r}/${n} แห่ง</small></div></div>
    <div class="vtypes">${xs.map(x => `<button class="vt ${x.r < x.n ? 'warn' : ''}" data-vgroup="${esc(x.t)}" title="คลิกเพื่อดูรายชื่อ"><span>${esc(VSHORT[x.t])}</span><b>${x.r}<small>/${x.n}</small></b><em>${x.r < x.n ? `ยังไม่ส่ง ${x.n - x.r} แห่ง` : 'ส่งครบ'}</em><i>ดูรายชื่อ ›</i></button>`).join('')}</div></div>`; }).join('')}</div>
  <p class="note">คลิกกล่องเพื่อดูรายชื่อสถานพยาบาล • รวม รพ.สต. (สธ. + อปท.) ${(() => { const x = tot.filter(t => /รพ\.สต\./.test(t.t)); const n = x.reduce((a, t) => a + t.n, 0), r = x.reduce((a, t) => a + t.r, 0); return n ? `${r}/${n} แห่ง (${fmt(r / n * 100, 1)}%)` : '–'; })()} • ตัวหารทางการยังเป็น ${fmt(ds.reduce((a, o) => a + o.n, 0))} แห่งตามทะเบียน DDS</p>
  ${!one ? `<details class="more"><summary>ดูรายอำเภอแยกประเภท (25 อำเภอ)</summary><div class="tbl-wrap"><table class="tbl"><thead><tr><th>อำเภอ</th>${VGROUPS.map(t => `<th class="r" title="${esc(t)}">${esc(VSHORT[t])}</th>`).join('')}<th class="r">รวม</th><th class="r">ยังไม่ส่ง</th><th class="r">ไม่มีผู้ป่วยทั้งช่วง</th></tr></thead><tbody>
  ${ds.map(o => `<tr><td><a href="#" class="pick-dc" data-dc="${o.d.code}">${esc(o.d.name)}</a></td>${VGROUPS.map(t => cell(o.g[t])).join('')}<td class="r b">${o.r}/${o.n}</td><td class="r ${o.no ? 'red b' : 'muted'}">${o.no || '–'}</td><td class="r ${o.zero ? '' : 'muted'}">${o.zero || '–'}</td></tr>`).join('')}
  </tbody></table></div><p class="note">ตัวเลข = ส่งรายงานแล้ว / ทั้งหมด (แห่ง) • สีแดง = มีหน่วยที่ยังไม่ส่ง • คลิกชื่ออำเภอเพื่อดูรายชื่อหน่วย</p></details>` : ''}
  ${list.length ? `<details class="more" ${one ? 'open' : ''}><summary>รายชื่อหน่วยที่ยังไม่ส่ง หรือไม่มีผู้ป่วยทั้งช่วง (${list.length} แห่ง)</summary><div class="tbl-wrap"><table class="tbl"><thead><tr>${one ? '' : '<th>อำเภอ</th>'}<th>สถานพยาบาล</th><th>ประเภท</th><th>สถานะในระบบ DDS</th>${hasV ? '<th>ผลตรวจสอบ (สสจ.)</th>' : ''}</tr></thead><tbody>
  ${list.map(f => { const v = V.get(f.unit_code); return `<tr>${one ? '' : `<td>${esc(f.district_name)}</td>`}<td><a href="#" data-fac="${esc(f.unit_code)}">${esc(f.unit_name)}</a><div class="en">${esc(f.unit_code)}</div></td><td>${esc(VSHORT[vgroup(f)] || f.dds_type || f.unit_type)}</td><td>${flag(f) === 'no' ? '<span class="chip red">ยังไม่พบการส่งรายงาน</span>' : '<span class="chip few">ส่งได้ แต่ไม่มีผู้ป่วยทั้งช่วง</span>'}</td>${hasV ? `<td>${vchip(v)}${v?.note ? `<div class="en">${esc(v.note)}</div>` : ''}</td>` : ''}</tr>`; }).join('')}</tbody></table></div>
  <p class="note">"ส่งได้ แต่ไม่มีผู้ป่วยทั้งช่วง" อาจเป็นหน่วยที่ส่งต่อผู้ป่วยให้ รพ. หรือ รพ.บันทึกแทน — ไม่ถือว่าผิด แต่ควรทราบไว้</p></details>` : '<p class="note">ทุกหน่วยส่งรายงานและมีข้อมูลผู้ป่วย ✓</p>'}</div>`;
}

// สถานะรายสถานพยาบาลแบบภาษาง่าย (ใช้ทั้งหน้าเว็บและ Info)
const shortUnit = n => (n || '').replace(/โรงพยาบาลส่งเสริมสุขภาพตำบล/g, 'รพ.สต.').replace(/^โรงพยาบาล/, 'รพ.').replace(/ศูนย์บริการสาธารณสุข/g, 'ศบส.').replace(/\s+ตำบล.*$/, '').trim();
function facState(f) {
  const K = DB.config.dds_kpi || { timely_target: 80 }, rp = +f.reports, tp = rp ? +f.timely / rp * 100 : null;
  if (!+f.reported) return { lv: 'red', t: 'ยังไม่ส่งรายงาน', ok: false };
  if (tp != null && tp < K.timely_target) return { lv: 'red', t: `ส่งช้า (ทันเวลา ${fmt(tp, 0)}%)`, ok: false };
  if (tp != null && tp < 90) return { lv: 'yellow', t: `ทันเวลา ${fmt(tp, 0)}% (ควรถึง 90%)`, ok: false };
  return { lv: 'green', t: rp ? 'ทำแล้ว' : 'ทำแล้ว (ไม่มีผู้ป่วย)', ok: true };
}
function unitPicker() {
  if (S.dc === 'ALL') return `<div class="card upick"><div class="card-h"><h2>เลือกอำเภอเพื่อดูรายชื่อสถานพยาบาล</h2><span class="muted">ดูว่าแห่งไหนทำแล้ว / ต้องติดตาม</span></div>
  <div class="upick-grid">${DB.districts.map(d => { const fs = DB.facilities.filter(f => f.district_code === d.code), bad = fs.filter(f => !facState(f).ok).length; return `<a href="#" class="pick-dc upick-b" data-dc="${d.code}"><b>${esc(d.name)}</b><span class="${bad ? 'red' : 'green'}">${bad ? `ต้องติดตาม ${bad}` : 'ครบทุกแห่ง'}</span></a>`; }).join('')}</div></div>`;
  const fs = DB.facilities.filter(f => f.district_code === S.dc).map(f => ({ f, s: facState(f) })), todo = fs.filter(o => !o.s.ok).sort((a, b) => (a.s.lv === 'red' ? 0 : 1) - (b.s.lv === 'red' ? 0 : 1)), done = fs.filter(o => o.s.ok);
  return `<div class="card ufac"><div class="card-h"><h2>สถานพยาบาลใน ${esc(distName(S.dc))} (${fs.length} แห่ง)</h2><a href="#" class="pick-dc copylink" data-dc="ALL">← เลือกอำเภออื่น</a></div>
  <p class="my-purpose">${todo.length ? `<b class="red">ต้องติดตาม ${todo.length} แห่ง</b> • ทำแล้ว ${done.length} แห่ง` : `<b class="green">ทำแล้วครบทุกแห่ง (${done.length} แห่ง)</b>`}</p>
  ${todo.length ? `<h3 class="uh red">ต้องติดตาม</h3><ul class="ulist">${todo.map(o => `<li class="lv-${o.s.lv}"><span>${esc(shortUnit(o.f.unit_name))} <small class="muted">${esc(o.f.unit_code)}</small></span><span class="pchip ${o.s.lv}">${esc(o.s.t)}</span></li>`).join('')}</ul>` : ''}
  <details${todo.length ? '' : ' open'}><summary>ทำแล้ว ${done.length} แห่ง</summary><ul class="ulist done">${done.map(o => `<li><span>${esc(shortUnit(o.f.unit_name))} <small class="muted">${esc(o.f.unit_code)}</small></span><span class="pchip green">${esc(o.s.t)}</span></li>`).join('')}</ul></details>
  <p class="note">ทำแล้ว = ส่งรายงาน และส่งทันภายใน 7 วันตั้งแต่ 90% ขึ้นไป • ข้อมูล ${esc(DB.facilities[0]?.period_label || '')}</p></div>`;
}
function pageUnits() {
  const K = DB.config.dds_kpi || { coverage_target: 100, timely_target: 80, pending_max: 1, zero_report_target: 60 };
  const F = DB.facilities.filter(f => S.dc === 'ALL' || f.district_code === S.dc).map(f => ({ ...f, reported: +f.reported, total: +f.total, timely: +f.timely, reports: +f.reports }));
  const sum = (a, k) => a.reduce((s, o) => s + o[k], 0);
  const cov = F.length ? sum(F, 'reported') / sum(F, 'total') * 100 : null, tim = sum(F, 'reports') ? sum(F, 'timely') / sum(F, 'reports') * 100 : null;
  const st = DB.ddsStatus; const pend = st ? +st.pending / (+st.approved + +st.pending) * 100 : null;
  const lvCov = v => v == null ? 'none' : v >= K.coverage_target ? 'green' : v >= 80 ? 'orange' : 'red';
  const lvTim = v => v == null ? 'none' : v >= Math.max(90, K.timely_target) ? 'green' : v >= K.timely_target ? 'yellow' : 'red';
  const fStat = f => !f.reported ? ['red', 'ไม่ส่งรายงาน'] : !f.reports ? ['few', 'ส่ง zero report'] : f.timely / f.reports * 100 < K.timely_target ? ['red', 'เร่งรัด'] : f.timely / f.reports * 100 < 90 ? ['orange', 'ติดตาม'] : ['green', 'ผ่าน'];
  const types = {};
  if (S.dc === 'ALL' && DB.facilityTypes.length) DB.facilityTypes.forEach(t => types[t.dds_type] = { n: +t.total, r: +t.reported });
  else F.forEach(f => { const k = f.dds_type || f.unit_type; const t = types[k] = types[k] || { n: 0, r: 0 }; t.n += f.total; t.r += f.reported; });
  const isLao = f => /อปท/.test(f.dds_type || '');
  const laoTagged = DB.facilities.some(isLao);
  const per = F[0]?.period_label || '';
  const byD = DB.districts.filter(d => S.dc === 'ALL' || d.code === S.dc).map(d => { const fs = F.filter(f => f.district_code === d.code); const q = DB.ddsDistrict.find(x => x.district_code === d.code) || {};
    const lf = fs.filter(isLao);
    return { d, n: sum(fs, 'total'), r: sum(fs, 'reported'), t: sum(fs, 'timely'), rp: sum(fs, 'reports'), bad: fs.filter(f => fStat(f)[0] === 'red').length, q,
      laoN: laoTagged ? lf.length : (+q.lao_total || 0), laoR: laoTagged ? sum(lf, 'reported') : (+q.lao_reported || 0), laoT: sum(lf, 'timely'), laoRp: sum(lf, 'reports') }; });
  const laoTot = byD.reduce((a, o) => ({ n: a.n + o.laoN, r: a.r + o.laoR }), { n: 0, r: 0 });
  const laoType = DB.facilityTypes.find(t => /อปท/.test(t.dds_type));
  const sorted = [...F].sort((a, b) => { const o = { red: 0, orange: 1, few: 2, green: 3 }; return o[fStat(a)[0]] - o[fStat(b)[0]] || (a.reports ? a.timely / a.reports : 2) - (b.reports ? b.timely / b.reports : 2); });
  const laoCheck = laoType && S.dc === 'ALL' ? (+laoType.total === laoTot.n && +laoType.reported === laoTot.r ? `<span class="chip green">ตรงกับ DDC Dashboard ${laoType.reported}/${laoType.total} แห่ง</span>` : `<span class="chip orange">DDC Dashboard ${laoType.reported}/${laoType.total} แห่ง ไม่ตรงกับผลรวมรายอำเภอ ${laoTot.r}/${laoTot.n}</span>`) : '';
  const kcard = (n, title, val, sub, lv, target) => `<div class="kpi step lv-${lv}"><div class="step-n">${n}</div><div class="k-t">${title}</div><div class="k-v ${lv === 'green' ? 'green' : lv === 'red' ? 'red' : lv === 'none' ? 'navy sm' : 'orange'}">${val}</div><div class="k-s">${sub}</div><div class="k-s"><b>เกณฑ์:</b> ${target}</div></div>`;
  const selF = S.fac ? DB.facilities.find(f => f.unit_code === S.fac) : null;
  const selStrip = selF ? (() => { const f = { ...selF, reported: +selF.reported, reports: +selF.reports, timely: +selF.timely }; const [lv, tx] = fStat(f); return `<div class="card sel-fac"><div class="card-h"><h2>${esc(f.unit_name)} <span class="muted">${esc(f.unit_code)} • ${esc(f.dds_type || f.unit_type)} • ${esc(f.district_name)}${vMap().get(f.unit_code)?.status ? ' • อำเภอยืนยัน: ' + esc(vMap().get(f.unit_code).status) : ''}</span></h2><span class="chip ${lv}">${tx}</span></div>
    <div class="ev-grid"><div><span class="muted">ส่งรายงาน</span><b>${f.reported ? 'ส่งแล้ว' : 'ยังไม่ส่ง'}</b></div><div><span class="muted">ทันเวลา (7 วัน)</span><b>${f.reports ? fmt(f.timely / f.reports * 100, 1) + '%' : '–'}</b> <small class="muted">${fmt(f.timely)} / ${fmt(f.reports)} รายงาน</small></div></div></div>`; })() : '';
  return `<header class="hero"><div><div class="eyebrow">${esc(DB.config.office)}</div><h1>คุณภาพการรายงานในระบบ DDS</h1><div class="sub">${esc(distName(S.dc))} • ${esc(per || 'ความครอบคลุมและความทันเวลา')}</div></div></header>
  ${!F.length ? `<div class="notice">${ico('alert', 18)}<div><b>ยังไม่มีข้อมูลรายสถานพยาบาล</b> — Export ตารางจาก DDC Dashboard (หน้า 1 ความครอบคลุมและความทันเวลา) แล้วอัปเดตที่ศูนย์อัปเดตข้อมูล</div></div>` : ''}
  ${selStrip}
  ${DB.facilities.length ? unitPicker() : ''}
  <section class="kpis">
    ${(() => { const V = vMap(), ex = F.filter(f => vExcluded(V.get(f.unit_code)?.status)), rN = sum(F, 'reported') - sum(ex, 'reported'), tN = sum(F, 'total') - sum(ex, 'total');
      return kcard(1, 'ความครอบคลุมการส่งรายงาน', cov == null ? '–' : fmt(cov, 2) + '%', `ทางการ (DDC) ${fmt(sum(F, 'reported'))} / ${fmt(sum(F, 'total'))} แห่ง${ex.length ? `<br><b>ปรับตามผลตรวจสอบ ${fmt(rN / tN * 100, 2)}%</b> (${fmt(rN)} / ${fmt(tN)} • ตัดหน่วยที่ไม่มีอยู่จริง/ไม่ให้บริการ ${ex.length} แห่ง)` : ''}`, lvCov(cov), `ครอบคลุมตามที่กำหนด (ตั้งไว้ ${K.coverage_target}%)`); })()}
    ${kcard(1, 'ความทันเวลา (ภายใน 7 วัน)', tim == null ? '–' : fmt(tim, 2) + '%', `${fmt(sum(F, 'timely'))} / ${fmt(sum(F, 'reports'))} รายงาน`, lvTim(tim), `มากกว่าร้อยละ ${K.timely_target}`)}
    ${laoTot.n ? kcard(1, 'ความครอบคลุม อปท. (ศบส. อปท.)', fmt(laoTot.r / laoTot.n * 100, 2) + '%', `${laoTot.r} / ${laoTot.n} แห่ง`, lvCov(laoTot.r / laoTot.n * 100), `ครอบคลุมตามที่กำหนด (ตั้งไว้ ${K.coverage_target}%)`) : ''}
    ${kcard(2, 'ข้อมูลรอแก้ไข/ปรับปรุง', pend == null ? '–' : fmt(pend, 2) + '%', st ? `${fmt(+st.pending)} รายงาน จาก ${fmt(+st.approved + +st.pending)} (${esc(st.period_label)})` : 'ได้จากการแปลงไฟล์ DDS รายเคส', pend == null ? 'none' : pend < K.pending_max ? 'green' : 'red', `น้อยกว่าร้อยละ ${K.pending_max}`)}
    ${kcard(3, 'ส่งรายงานต่อเนื่อง (No case notification)', '–', 'ดูใน DDC Dashboard หน้า 4', 'none', `ติดต่อกันไม่เกิน 4 สัปดาห์ ≥ ร้อยละ ${K.zero_report_target}`)}
    ${kcard(4, 'การใช้งาน DDC Alert', '–', 'ตรวจจับเหตุการณ์ผิดปกติและตอบโต้', 'none', 'หน่วยงานในพื้นที่ใช้งานได้')}
  </section>
  ${Object.keys(types).length ? `<div class="card"><div class="card-h"><h2>ความครอบคลุมแยกประเภทสถานพยาบาล</h2></div>${hbars(Object.entries(types).sort((a, b) => b[1].n - a[1].n).map(([t, v]) => ({ label: `${t} (${v.r}/${v.n})`, value: v.r / v.n * 100, color: LEVEL_COLOR[lvCov(v.r / v.n * 100)] })), { dp: 1, unit: '%', lw: 290 })}</div>` : ''}
  <div class="card"><div class="card-h"><h2>รายอำเภอ</h2><span class="muted">คำนวณจากข้อมูลดิบรายสถานพยาบาล (DDC Dashboard) ${esc(per)}</span></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th rowspan="2">อำเภอ</th><th colspan="3" class="grp">ทุกสถานพยาบาล</th><th class="grp">รพ.สต. (ใน+นอกสังกัด)</th><th colspan="${laoTagged ? 3 : 2}" class="grp">อปท. (ศูนย์บริการสาธารณสุข อปท.)</th></tr>
  <tr><th class="r">ครอบคลุม</th><th class="r">ทันเวลา (7 วัน)</th><th class="r">ไม่ส่ง/เร่งรัด</th><th class="r">ส่งได้ (แห่ง)</th><th class="r">ส่งได้ (แห่ง)</th><th class="r">ครอบคลุม</th>${laoTagged ? '<th class="r">ทันเวลา</th>' : ''}</tr></thead><tbody>
  ${byD.map(o => { const c = o.n ? o.r / o.n * 100 : null, t = o.rp ? o.t / o.rp * 100 : null, lc = o.laoN ? o.laoR / o.laoN * 100 : null, lt = o.laoRp ? o.laoT / o.laoRp * 100 : null;
    return `<tr><td><a href="#" class="pick-dc" data-dc="${o.d.code}">${esc(o.d.name)}</a></td><td class="r"><span class="chip ${lvCov(c)}">${c == null ? '–' : fmt(c, 1) + '%'}</span> <small class="muted">${o.n ? o.r + '/' + o.n : ''}</small></td><td class="r"><span class="chip ${lvTim(t)}">${t == null ? '–' : fmt(t, 1) + '%'}</span></td><td class="r ${o.bad ? 'red b' : ''}">${o.bad || '–'}</td><td class="r">${o.q.sso_total ? `${o.q.sso_reported}/${o.q.sso_total}` : '–'}</td><td class="r">${o.laoN ? `${o.laoR}/${o.laoN}` : '–'}</td><td class="r">${lc == null ? '–' : `<span class="chip ${lvCov(lc)}">${fmt(lc, 1)}%</span>`}</td>${laoTagged ? `<td class="r">${lt == null ? '–' : `<span class="chip ${lvTim(lt)}">${fmt(lt, 1)}%</span>`}</td>` : ''}</tr>`; }).join('')}
  </tbody>${S.dc === 'ALL' ? `<tfoot><tr><td>รวม</td><td class="r">${fmt(sum(F, 'reported') / sum(F, 'total') * 100, 2)}%</td><td class="r">${fmt(sum(F, 'timely') / sum(F, 'reports') * 100, 2)}%</td><td class="r">${byD.reduce((a, o) => a + o.bad, 0)}</td><td class="r">${byD.reduce((a, o) => a + (+o.q.sso_reported || 0), 0)}/${byD.reduce((a, o) => a + (+o.q.sso_total || 0), 0)}</td><td class="r">${laoTot.r}/${laoTot.n}</td><td class="r">${laoTot.n ? fmt(laoTot.r / laoTot.n * 100, 2) + '%' : '–'}</td>${laoTagged ? '<td></td>' : ''}</tr></tfoot>` : ''}</table></div>
  <p class="note">ครอบคลุม = สถานพยาบาลที่ส่งรายงาน ÷ ทั้งหมด • ทันเวลา = รายงานที่ส่งภายใน 7 วัน ÷ รายงานทั้งหมด (เกณฑ์ > ${K.timely_target}%) • อปท.: จำนวนแห่งจากชีต "ผลงาน DDS อปท." ${laoCheck}
  ${laoTagged ? '' : '<br>ความทันเวลาของ อปท. รายอำเภอจะแสดงเมื่อ Export ตารางรายสถานพยาบาลที่กรอง "ศูนย์บริการสาธารณสุข อปท." แล้วอัปเดตที่ศูนย์อัปเดตข้อมูล ข้อ 4'}
  ${DB.ddsDistrict.length && DB.ddsDistrict.every(x => x.lao_pct === '') ? '<br>ร้อยละ "ผลการดำเนินงาน" ในชีต อปท. ไม่นำมาใช้ เพราะค่าถูกคัดลอกมาจากชีตใน/นอกสังกัด — แดชบอร์ดคำนวณใหม่จากจำนวนแห่ง' : ''}</p></div>
  ${verifyCard(F)}
  ${F.length ? `<div class="card"><div class="card-h"><h2>สถานพยาบาลที่ไม่ส่งรายงาน / ต้องเร่งรัด / ติดตาม</h2><span class="muted">เร่งรัด = ทันเวลา < ${K.timely_target}% • ติดตาม = ${K.timely_target}–90% • ผ่าน ≥ 90%</span></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>สถานพยาบาล</th><th>ประเภท</th><th>อำเภอ</th><th class="r">รายงาน</th><th class="r">ทันเวลา</th><th class="r">%</th><th>สถานะ</th></tr></thead><tbody>
  ${sorted.filter(f => ['red', 'orange'].includes(fStat(f)[0])).map(f => { const [lv, tx] = fStat(f); return `<tr class="${f.unit_code === S.fac ? 'sel' : ''}"><td class="b"><a href="#" data-fac="${esc(f.unit_code)}">${esc(f.unit_name)}</a><div class="en">${esc(f.unit_code)}</div></td><td>${esc(VSHORT[vgroup(f)] || f.unit_type)}</td><td>${esc(f.district_name)}</td><td class="r">${fmt(f.reports)}</td><td class="r">${fmt(f.timely)}</td><td class="r">${f.reports ? fmt(f.timely / f.reports * 100, 1) : '–'}</td><td><span class="chip ${lv}">${tx}</span></td></tr>`; }).join('') || '<tr><td colspan="7" class="empty ok">ไม่มีสถานพยาบาลที่ต้องเร่งรัด/ติดตาม ✓</td></tr>'}</tbody></table></div>
  <details class="more"><summary>แสดงสถานพยาบาลที่ผ่านเกณฑ์ / ส่ง zero report (${sorted.filter(f => !['red', 'orange'].includes(fStat(f)[0])).length} แห่ง)</summary><div class="tbl-wrap"><table class="tbl"><tbody>
  ${sorted.filter(f => !['red', 'orange'].includes(fStat(f)[0])).map(f => { const [lv, tx] = fStat(f); return `<tr><td>${esc(f.unit_name)} <span class="en">${esc(f.unit_code)}</span></td><td>${esc(VSHORT[vgroup(f)] || f.unit_type)}</td><td>${esc(f.district_name)}</td><td class="r">${fmt(f.reports)}</td><td class="r">${f.reports ? fmt(f.timely / f.reports * 100, 1) + '%' : '–'}</td><td><span class="chip ${lv}">${tx}</span></td></tr>`; }).join('')}</tbody></table></div></details></div>` : ''}`;
}

function pageQuality() {
  const m = model('ALL');
  const lv = { red: 'ต้องแก้ไข', orange: 'ควรตรวจสอบ', yellow: 'ข้อสังเกต' };
  const iss = [...DB.issues].sort((a, b) => LEVELS[b.level] - LEVELS[a.level]);
  const qa = DB.unitQuality.filter(r => +r.fiscal_year_be === (S.yt === 'fiscal' ? S.y : currentFiscalBE(Date.now())));
  const rep = qa.reduce((s, r) => s + +r.reports, 0), tim = qa.reduce((s, r) => s + +r.timely, 0), com = qa.reduce((s, r) => s + +r.complete, 0);
  return header(m) + `
  <section class="kpis">
    <div class="kpi"><div class="k-t">ความสดใหม่ของข้อมูล</div><div class="k-v ${m.has && (Date.now() - m.asOfEnd) / DAY <= 7 ? 'green' : 'orange'} sm">${m.has ? Math.max(0, Math.floor((Date.now() - m.asOfEnd) / DAY)) + ' วัน' : '–'}</div><div class="k-s">${m.has ? 'สัปดาห์ล่าสุดสิ้นสุด ' + thDate(m.asOfEnd, false) : 'ยังไม่มีข้อมูลรายสัปดาห์'}</div></div>
    <div class="kpi"><div class="k-t">รายงานทันเวลา</div><div class="k-v blue">${rep ? fmt(tim / rep * 100, 1) + '%' : '–'}</div><div class="k-s">${rep ? `${fmt(tim)} / ${fmt(rep)} รายงาน` : 'ยังไม่มีข้อมูล'}</div></div>
    <div class="kpi"><div class="k-t">ข้อมูลครบถ้วน</div><div class="k-v blue">${rep ? fmt(com / rep * 100, 1) + '%' : '–'}</div><div class="k-s">มีวันเริ่มป่วย + ที่อยู่ระดับตำบล</div></div>
    <div class="kpi"><div class="k-t">ปัญหาที่ต้องแก้</div><div class="k-v ${iss.some(i => i.level === 'red') ? 'red' : 'green'}">${iss.filter(i => i.level === 'red').length}</div><div class="k-s">ข้อสังเกตอื่น ${iss.filter(i => i.level !== 'red').length}</div></div>
  </section>
  ${reconcileCard()}
  <section class="grid2">
    <div class="card"><div class="card-h"><h2>ผลตรวจความถูกต้องของข้อมูล (Data integrity)</h2></div>
    ${iss.length ? `<ul class="issues">${iss.map(i => `<li class="${i.level}"><span class="chip ${i.level}">${lv[i.level]}</span> ${esc(i.msg)}</li>`).join('')}</ul>` : '<div class="empty ok">ไม่พบปัญหา ✓</div>'}</div>
    <div class="card"><div class="card-h"><h2>แหล่งข้อมูล</h2></div><table class="tbl"><thead><tr><th>ข้อมูล</th><th class="r">จำนวนรายการ</th></tr></thead><tbody>${DB.loaded.filter(f => !/config|contacts|troubleshoot|template/.test(f.file)).map(f => `<tr><td>${esc(friendly(f.file))}</td><td class="r">${f.missing ? '<span class="muted">ยังไม่มี</span>' : fmt(f.rows)}</td></tr>`).join('')}</tbody></table>
    <p class="note">กฎที่ระบบตรวจทุกครั้ง: วันที่เป็นวันอาทิตย์ (ต้นสัปดาห์ระบาด), รหัสโรค/อำเภอถูกต้อง, ตาย ≤ ป่วย, จำนวนเป็นจำนวนเต็ม, แถวซ้ำ, สัปดาห์ในอนาคต, ประชากรครบ</p></div>
  </section>`;
}

// ---- reconciliation: official weekly report vs DDS line list (+ manual death register) and revision log ----
function reconcileCard() {
  if (S.demo) return '';
  const yBE = S.yt === 'calendar' ? S.y : new Date().getFullYear() + 543;
  const snapD = [...new Set(DB.summary.filter(x => +x.year_be === yBE).map(x => x.date_to))].sort().pop();
  const keyed = v => /^(y|yes|ใช่|คีย์แล้ว)$/i.test(String(v || '').trim());
  const pend = DB.deathReg.filter(r => !keyed(r.dds_keyed));
  const P = DB.config.provisional_weeks ?? 2;
  let html = '';
  if (snapD) {
    const cut = parseISO(snapD);
    const rows = DB.config.diseases.map(d => {
      const o = DB.summary.find(x => +x.year_be === yBE && x.date_to === snapD && x.disease_id === d.id) || { cases: 0, deaths: 0 };
      let c = 0, x = 0; for (const r of DB.rows) if (r.d === d.id && yearOf(r, 'calendar') === yBE && r.t <= cut) { c += r.c; x += r.x; }
      const pe = pend.filter(r => r.disease_id === d.id && new Date(parseISO(r.death_date || r.report_date)).getUTCFullYear() + 543 === yBE).length;
      return { d, oc: +o.cases, ox: +o.deaths, c, x, pe };
    });
    const T = k => rows.reduce((a, r) => a + r[k], 0);
    const chipC = (o, v) => { const df = v - o, pc = o ? Math.abs(df) / o * 100 : (v ? 100 : 0); return `<span class="chip ${df === 0 ? 'green' : pc <= 1 ? 'yellow' : 'red'}">${df === 0 ? 'ตรงกัน' : (df > 0 ? '+' : '') + fmt(df) + (o ? ` (${fmt(pc, 1)}%)` : '')}</span>`; };
    const chipX = r => r.ox === r.x + r.pe ? '<span class="chip green">ตรงกัน</span>' : r.ox > r.x + r.pe ? `<span class="chip orange">ทางการมากกว่า ${r.ox - r.x - r.pe}</span>` : `<span class="chip red">DDS มากกว่า ${r.x + r.pe - r.ox}</span>`;
    const ovlDead = DB.mebs.filter(e => +e.deaths > 0 && e.disease_id && /อุบล/.test(e.province || ''));
    html += `<div class="card"><div class="card-h"><h2>ตรวจยอดกับรายงานทางการ</h2><span class="muted">ทางการ = Excel รวบรวมรายงาน ข้อมูล ณ ${thDate(cut, false)} • DDS = รายเคส "อนุมัติแล้ว" (รวมผู้ป่วยนอกจังหวัด)</span></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>โรค</th><th class="r">ป่วย ทางการ</th><th class="r">ป่วย DDS</th><th>ส่วนต่าง</th><th class="r">ตาย ทางการ</th><th class="r">ตาย DDS</th><th class="r">รอคีย์</th><th>ส่วนต่าง</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td>${esc(r.d.name)}</td><td class="r">${fmt(r.oc)}</td><td class="r">${fmt(r.c)}</td><td>${chipC(r.oc, r.c)}</td><td class="r b">${fmt(r.ox)}</td><td class="r">${fmt(r.x)}</td><td class="r">${r.pe || '–'}</td><td>${chipX(r)}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td>รวม</td><td class="r">${fmt(T('oc'))}</td><td class="r">${fmt(T('c'))}</td><td>${chipC(T('oc'), T('c'))}</td><td class="r">${fmt(T('ox'))}</td><td class="r">${fmt(T('x'))}</td><td class="r">${T('pe') || '–'}</td><td></td></tr></tfoot></table></div>
    <p class="note">ส่วนต่างผู้ป่วยไม่เกิน 1% (สีเหลือง) มักเกิดจากเวลาดึงข้อมูลต่างกัน • ผู้เสียชีวิตทางการรวมรายงานด้วยตนเองก่อนคีย์ DDS — รายที่ยังไม่คีย์ให้บันทึกใน "ทะเบียนผู้เสียชีวิต" ที่ศูนย์อัปเดตข้อมูล เพื่อติดตามจนคีย์ครบ
    ${ovlDead.length ? `<br>ทะเบียนเหตุการณ์มีผู้เสียชีวิต: ${ovlDead.map(e => `${esc(e.disease_name)} ต.${esc(e.subdistrict)} ${e.deaths} ราย`).join(', ')} — ตรวจว่าคีย์ใน DDS แล้วหรือยัง` : ''}</p></div>`;
  }
  if (pend.length) {
    html += `<div class="card"><div class="card-h"><h2>ผู้เสียชีวิตที่รายงานแล้ว แต่ยังไม่ได้คีย์ใน DDS (${pend.length} ราย)</h2><span class="muted">ติดตามให้พื้นที่คีย์เข้าระบบ</span></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>รับรายงาน</th><th>โรค</th><th>พื้นที่</th><th>วันที่เสียชีวิต</th><th>แหล่งข่าว</th><th class="r">รอมาแล้ว</th></tr></thead><tbody>
    ${pend.sort((a, b) => String(a.report_date).localeCompare(String(b.report_date))).map(r => { const dd = Math.floor((Date.now() - parseISO(r.report_date)) / DAY); return `<tr><td>${thDate(parseISO(r.report_date))}</td><td>${esc(dName(r.disease_id))}</td><td>${r.subdistrict ? 'ต.' + esc(r.subdistrict) + ' ' : ''}อ.${esc(DB.districts.find(d => d.code === r.district_code)?.name || '–')}</td><td>${thDate(parseISO(r.death_date))}</td><td>${esc(r.source)}</td><td class="r"><span class="chip ${dd > 7 ? 'red' : 'yellow'}">${isFinite(dd) ? dd + ' วัน' : '–'}</span></td></tr>`; }).join('')}</tbody></table></div></div>`;
  }
  if (DB.revisions.length) {
    const last = [...new Set(DB.revisions.map(r => r.update_date))].sort().pop();
    const rv = DB.revisions.filter(r => r.update_date === last);
    const net = rv.reduce((a, r) => a + (+r.new_cases - +r.old_cases), 0), nd = rv.reduce((a, r) => a + (+r.new_deaths - +r.old_deaths), 0);
    html += `<div class="card"><div class="card-h"><h2>การแก้ไขข้อมูลย้อนหลัง (อัปเดต ${thDate(parseISO(last), false)})</h2><span class="muted">สัปดาห์ที่เก่ากว่า ${P} สัปดาห์ที่ตัวเลขเปลี่ยนจากการอัปเดตครั้งก่อน</span></div>
    <p>เปลี่ยน ${rv.length} จุด • ผู้ป่วยสุทธิ ${net >= 0 ? '+' : ''}${fmt(net)} ราย • ผู้เสียชีวิตสุทธิ ${nd >= 0 ? '+' : ''}${fmt(nd)} ราย</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>สัปดาห์</th><th>โรค</th><th>อำเภอ</th><th class="r">ป่วย</th><th class="r">ตาย</th></tr></thead><tbody>
    ${rv.slice(0, 30).map(r => `<tr><td>W${epiWeek(parseISO(r.week_start)).week} (${thDate(parseISO(r.week_start))})</td><td>${esc(dName(r.disease_id))}</td><td>${r.district_code === (DB.config.out_of_province_code || '9999') ? 'นอกจังหวัด' : esc(DB.districts.find(d => d.code === r.district_code)?.name || r.district_code)}</td><td class="r">${r.old_cases} → <b>${r.new_cases}</b></td><td class="r">${r.old_deaths === r.new_deaths ? r.new_deaths : `${r.old_deaths} → <b class="red">${r.new_deaths}</b>`}</td></tr>`).join('')}</tbody></table></div></div>`;
  } else if (DB.rows.length) html += `<div class="card"><div class="card-h"><h2>การแก้ไขข้อมูลย้อนหลัง</h2></div><div class="empty ok">การอัปเดตล่าสุดไม่มีการแก้ไขข้อมูลย้อนหลัง (เก่ากว่า ${P} สัปดาห์) ✓</div></div>`;
  return html;
}

function pageMeasures() {
  const m = model();
  const lvl = Object.fromEntries(m.per.map(r => [r.id, r.level]));
  const ds = [...DB.config.diseases].sort((a, b) => (LEVELS[lvl[b.id]] ?? -2) - (LEVELS[lvl[a.id]] ?? -2));
  return header(m) + `<p class="lead">โรคที่อยู่ระดับ <b>ติดตาม</b> หรือ <b>รุนแรง</b> ใน${esc(distName(S.dc))} จะขึ้นมาก่อนพร้อมกรอบสี — ใช้เป็นเช็กลิสต์มาตรการ</p>
  <section class="measures">${ds.map(z => `<div class="card m-card lv-${lvl[z.id] || 'none'}"><div class="card-h"><h2>${esc(z.name)}</h2>${chip(lvl[z.id] || 'none')}</div>
  <ul class="check">${z.measures.map(x => `<li>${esc(x)}</li>`).join('')}</ul><div class="en">ระยะฟักตัวที่ใช้ตรวจกลุ่มก้อน: ${z.incubation_days} วัน</div></div>`).join('')}</section>
  <p class="note">อ้างอิงแนวทางกรมควบคุมโรค</p>`;
}

function pageContact() {
  const person = c => `<div class="person">${c.photo ? `<img src="assets/people/${esc(c.photo)}" alt="${esc(c.name)}" loading="lazy">` : `<div class="ph">${esc((c.name || '?').replace(/^(นายแพทย์|แพทย์หญิง|นางสาว|นาย|นาง)/, '').trim()[0] || '?')}</div>`}
    <div class="p-body"><div class="p-role">${esc(c.role)}</div><div class="p-name">${esc(c.name)}</div><div class="muted">${esc(c.scope)}</div>
    <div class="links">${c.phone ? `<span>${ico('phone', 14)} ${esc(c.phone)}</span>` : ''}${c.line_id ? `<span>LINE: ${esc(c.line_id)}</span>` : ''}${c.email ? `<span>${esc(c.email)}</span>` : ''}</div></div></div>`;
  const lead = DB.contacts.filter(c => /ผู้บริหาร|ผู้รับผิดชอบ/.test(c.group || ''));
  const others = DB.contacts.filter(c => !lead.includes(c));
  return `<header class="hero"><div><div class="eyebrow">${esc(DB.config.office)}</div><h1>การติดต่อประสานงาน & แก้ปัญหาระบบ</h1></div></header>
  ${DB.config.emergency_text ? `<div class="notice emer">${ico('alert', 18)}<div><b>เหตุฉุกเฉิน / นอกเวลาราชการ</b><br>${esc(DB.config.emergency_text)}</div></div>` : ''}
  <section class="people">${lead.map(person).join('')}</section>
  <section class="grid2">
  ${others.length ? `<div class="card"><div class="card-h"><h2>ผู้ประสานงาน</h2></div><div class="contacts">${others.map(person).join('')}</div></div>` : ''}
  <div class="card"><div class="card-h"><h2>รอบการอัปเดตข้อมูล</h2></div>
  <ul class="steps"><li>ข้อมูลสถานการณ์ 10 โรค อัปเดต <b>ทุกวันจันทร์</b> โดยกลุ่มงานควบคุมโรคติดต่อ สสจ.อุบลราชธานี</li><li>ป้ายสัปดาห์แสดงสัปดาห์ระบาดวิทยาล่าสุดที่ครบ (อาทิตย์–เสาร์)</li><li>หากพบข้อมูลไม่ตรง โปรดแจ้งผู้รับผิดชอบงานตามรายชื่อด้านบน</li></ul>
  </div>
  </section>
  <div class="card"><div class="card-h"><h2>ระบบมีปัญหา ทำอย่างไร</h2><span class="muted">จากคู่มือ D506APIs Semi-offline และ D506 สำหรับ JHCIS</span></div>
  <div class="faq">${DB.troubles.map(t => `<details><summary><span class="tag">${esc(t.system)}</span> ${esc(t.problem)}</summary><p>${esc(t.solution)}</p><p class="muted">ติดต่อ: ${esc(t.contact_role)}</p></details>`).join('')}</div></div>`;
}

// previous-year figures for comparison (official weekly report; same period if available, otherwise whole year)
function prevYearSummary(m) {
  if (m.dc !== 'ALL' || S.demo) return null;
  const py = S.y - 1, cutMD = isFinite(m.asOfEnd) ? ymd(m.asOfEnd).slice(5) : '12-31';
  const dates = [...new Set(DB.summary.filter(x => +x.year_be === py).map(x => x.date_to))].sort();
  if (!dates.length) return null;
  const same = dates.filter(d => d.slice(5) <= cutMD).pop();
  const pick = same && same.slice(5) === cutMD ? same : dates[dates.length - 1];
  const rows = DB.config.diseases.map(d => { const r = DB.summary.find(x => +x.year_be === py && x.date_to === pick && x.disease_id === d.id); return r ? { cases: +r.cases, deaths: +r.deaths, cfr: cfr(+r.deaths, +r.cases) } : null; });
  const lbl = DB.summary.find(x => x.date_to === pick && +x.year_be === py)?.period_label || `พ.ศ. ${py}`;
  // ช่วงเดียวกันจากข้อมูลรายสัปดาห์ของกองระบาด (ยอดป่วย) — ใช้เมื่อปีก่อนมีแต่ยอดทั้งปี
  const W = m.week?.week, col = 'y' + py;
  if (pick.slice(5) !== cutMD && W && DB.ddcBase?.length && col in DB.ddcBase[0]) {
    // ยอดตายปีก่อน: ยึดแดชบอร์ดกองระบาด (ยอดทั้งปี — ไฟล์รายสัปดาห์ของกองไม่มียอดตาย)
    const full = DB.config.diseases.map(d => DB.summary.find(x => +x.year_be === py && x.date_to === dates[dates.length - 1] && x.disease_id === d.id));
    const same = DB.config.diseases.map((d, i) => { const c = DB.ddcBase.filter(b => b.level === 'province' && b.disease_id === d.id && +b.epi_week <= W).reduce((a, b) => a + (+b[col] || 0), 0); const x = full[i] ? +full[i].deaths : null; return { cases: c, deaths: x, fullCases: full[i] ? +full[i].cases : null, cfr: x != null && full[i] && +full[i].cases ? x / +full[i].cases * 100 : null }; });
    return { year: py, label: `พ.ศ. ${py} ช่วงเดียวกัน (สัปดาห์ที่ 1–${W}, แดชบอร์ดกองระบาด)`, samePeriod: true, full: false, rows: same, ddc: true, deathsFull: true };
  }
  return { year: py, label: lbl, samePeriod: pick.slice(5) === cutMD, full: pick.endsWith('12-31'), rows };
}

// มาตรการเฝ้าระวัง (ใช้ใน Info แทน "สรุปสถานการณ์"): รวม 10 โรค = เน้นโรคที่สูงกว่าปกติ/เฝ้าระวัง, เลือกโรค = มาตรการของโรคนั้น
function tambonLines(dc, d) {
  const T = (DB.tambonYear || []).filter(x => +x.year_be === S.y && x.district_code === dc && x.disease_id === d).sort((a, b) => (b.cases === '<3' ? 0 : +b.cases) - (a.cases === '<3' ? 0 : +a.cases));
  if (!T.length) return ['ยังไม่มีข้อมูลผู้ป่วยรายตำบลของอำเภอนี้'];
  const nm = x => 'ต.' + (DB.tambonName?.[x.subdistrict_code] || ('รหัส ' + x.subdistrict_code.slice(-2)));
  const top = T.slice(0, 8).map(x => `${nm(x)} ${x.cases === '<3' ? 'น้อยกว่า 3' : fmt(+x.cases)} ราย`);
  return T.length > 8 ? [...top, `และอีก ${T.length - 8} ตำบล`] : top;
}
function measureLines(m, r) {
  const Z = id => DB.config.diseases.find(z => z.id === id) || { measures: [] };
  const clean = t => t.replace(/\s*\((Death review|608)\)/g, '');
  if (r) {
    const lv = capLv(r), L = [];
    L.push(`สถานะ: ${PLAIN[lv]?.[0] || 'ยังประเมินไม่ได้'}${r.recent != null ? ` (4 สัปดาห์ล่าสุด ${fmt(r.recent)} ราย)` : ''}`);
    Z(r.id).measures.forEach(x => L.push(clean(x)));
    return L;
  }
  const pri = { red: 3, orange: 3, yellow: 2 };
  const hot = m.per.filter(x => pri[capLv(x)]).sort((a, b) => pri[capLv(b)] - pri[capLv(a)] || (b.ratio || 0) - (a.ratio || 0));
  const L = hot.slice(0, 2).map(x => `${x.name} (${PLAIN[capLv(x)][0]}): ${clean(Z(x.id).measures[0] || '')}`);
  if (!hot.length) L.push('ทุกโรคอยู่ในระดับปกติ — คงการเฝ้าระวังและส่งรายงาน D506 ให้ครบทุกสัปดาห์');
  if (hot.length > 2) L.push(`ติดตามต่อ: ${hot.slice(2).map(x => x.name).join(', ')} (ดูมาตรการรายโรค)`);
  L.push('ทบทวนผู้เสียชีวิตทุกราย');
  L.push('พบกลุ่มก้อนหรือผู้ป่วยผิดปกติ แจ้ง สสอ./สสจ. ทันที');
  return L;
}

function infoModel(dc, d = S.d) {
  const m = model(dc);
  const pv = prevYearSummary(m);
  const di = m.per.findIndex(r => r.id === d), r = di >= 0 ? m.per[di] : null;
  let disease = null;
  if (r) {
    const nw = newThisWeek(m, r), pr = pv?.rows[di];
    const prov = dc !== 'ALL' ? model('ALL').per.find(x => x.id === r.id) : null;
    disease = { name: r.name, en: r.en, cases: r.cases, deaths: r.deaths, cfr: r.cfr, rate: r.rate, level: capLv(r), measures: (DB.config.diseases.find(z => z.id === r.id)?.measures || []).map(x => x.replace(/\s*\((Death review|608)\)/g, '')), ratio: r.ratio, recent: r.recent, base: r.base,
      weekNew: nw.v, weekHow: m.source === 'summary' && r.weekDelta != null ? 'ราย จากรายงานครั้งก่อน' : 'ราย ตามวันเริ่มป่วย (เบื้องต้น)',
      prev: pr ? { ...pr, year: pv.year, samePeriod: pv.samePeriod } : null, provRate: prov ? prov.rate : null,
      rank: [...m.per].filter(x => x.rate != null).sort((a, b) => b.rate - a.rate).findIndex(x => x.id === r.id) + 1,
      series: m.hasDds ? weekSeries(m, r.id, dc) : [],
      districts: dc === 'ALL' && m.hasDds ? districtRates(m, r.id).map(o => ({ code: o.x.code, name: o.x.name, c: o.c, dd: o.dd, rt: o.rt })) : [] };
  }
  return {
    disease, map: DB.mapSvg, windowWeeks: DB.config.alert.window_weeks, weekRange: m.week ? `${thDate(m.week.from)} – ${thDate(m.week.to)}` : '',
    prev: pv, prevChange: pv && pv.samePeriod ? pctChange(m.tot.c, pv.rows.reduce((a, r) => a + (r?.cases || 0), 0)) : null, curLabel: `พ.ศ. ${S.y} (${thDate(m.from)} – ${thDate(m.asOfEnd)})`,
    office: DB.config.office, area: distName(dc), period: periodLabel(m), weekText: m.has ? `สัปดาห์ระบาดวิทยาที่ ${m.week.week}` : '',
    cases: m.tot.c, deaths: m.tot.x, change: m.change ?? (pv && pv.samePeriod ? pctChange(m.tot.c, pv.rows.reduce((a, r) => a + (r?.cases || 0), 0)) : null), weekDelta: m.weekDelta, changeNote: 'ไม่มีข้อมูลปีก่อน', demo: S.demo,
    rows: m.per.map(r => ({ name: r.name, cases: r.cases, deaths: r.deaths, rate: r.rate, cfr: r.cfr, level: r.level })),
    summary: r ? (dc !== 'ALL' ? tambonLines(dc, r.id) : []) : measureLines(m, null), boxTitle: r ? (dc !== 'ALL' ? `ตำบลที่พบผู้ป่วย${r.name} (สะสม พ.ศ. ${S.y})` : '') : 'มาตรการเฝ้าระวังสัปดาห์นี้', source: DB.config.source_text + (m.source === 'summary' ? ' • รายงานประจำสัปดาห์ สสจ.อุบลราชธานี' : ''), asOfText: m.has ? `ข้อมูล ณ ${thDate(m.cut, false)}${m.partialWeek ? ` (รวมวันในสัปดาห์ที่ ${m.partialWeek.week} ที่ยังไม่ครบ)` : ''}` : '', url: DB.config.dashboard_url, has: m.has
  };
}

function pageInfo() {
  const needD = ['levels', 'district', 'weekly', 'situation'].includes(S.tpl), needDc = S.tpl === 'situation' || S.tpl === 'dds';
  return `<header class="hero"><div><div class="eyebrow">${esc(DB.config.office)}</div><h1>สร้างภาพ Info</h1><div class="sub">เลือกรูปแบบ → ตั้งค่า → คัดลอกไปวางใน PowerPoint / LINE ได้ทันที</div></div></header>
  <div class="card info-bar">
    <div class="tpls">${Object.entries(TEMPLATES).map(([k, v]) => `<button class="tpl ${S.tpl === k ? 'on' : ''}" data-tpl="${k}">${esc(v)}</button>`).join('')}</div>
    <div class="info-opts">
      ${needD ? `<label>โรค<select id="fd2"><option value="ALL">รวม 10 โรค</option>${DB.config.diseases.map(d => `<option value="${d.id}" ${S.d === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></label>` : ''}
      ${needDc ? `<label>พื้นที่<select id="fdc2"><option value="ALL">ทั้งจังหวัด</option>${DB.districts.map(d => `<option value="${d.code}" ${S.dc === d.code ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></label>` : ''}
      ${true ? `<label>โทนสี<select id="ithm">${Object.entries(THEMES).map(([k, v]) => `<option value="${k}" ${S.theme === k ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>` : ''}
      <label>ขนาด<select id="isize">${Object.entries(SIZES).filter(([k]) => S.tpl === 'situation' || k !== 'a4').map(([k, v]) => `<option value="${k}" ${S.size === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
      <div class="info-btns"><button class="btn" id="copyimg">${ico('image', 16)} คัดลอกภาพ</button><button class="btn ghost" id="dl">${ico('down', 16)} PNG</button>${needDc ? `<button class="btn ghost" id="dlall">${ico('down', 16)} ครบ 25 อำเภอ</button>` : ''}</div>
    </div><div id="dlmsg" class="muted"></div>
  </div>
  <div class="card info-prev"><canvas id="cv"></canvas></div>
  <p class="note">ภาพใช้ข้อมูลรวมระดับอำเภอ/จังหวัดเท่านั้น ไม่มีข้อมูลระบุตัวบุคคล (PDPA)</p>`;
}
function info2Model() {
  const m = model('ALL'), d = S.d, dn = d === 'ALL' ? 'รวม 10 โรค' : dName(d);
  const base = { office: DB.config.office, theme: S.theme, diseaseName: dn, weekText: m.week ? `สัปดาห์ระบาดวิทยาที่ ${m.week.week}` : '', asOf: m.has ? `ข้อมูล ณ ${thDate(m.cut, false)}` : '', source: 'ที่มา: รง. DDS (D506) • แดชบอร์ดกองระบาดวิทยา • รายงานประจำสัปดาห์ สสจ.อุบลราชธานี', url: DB.config.dashboard_url, map: DB.mapSvg,
    pops: { country: DB.config.population_country, region: DB.config.population_region, province: DB.popTotal } };
  const L = ddcLevels(m);
  if (L) { const ids = d === 'ALL' ? DB.config.diseases.map(z => z.id) : [d], R = L.rows.filter(r => ids.includes(r.id)); const agg = k => R.reduce((a, r) => ({ cum: a.cum + r[k].cum, rec: a.rec + r[k].rec, med: a.med + r[k].med }), { cum: 0, rec: 0, med: 0 });
    base.levels = { ...L, tot: { country: agg('country'), region: agg('region'), province: { ...agg('province'), cum: m.per.filter(r => ids.includes(r.id)).reduce((a, r) => a + r.cases, 0) } },
      local: L.rows.filter(r => r.province.med >= 3 && r.country.med >= 3 && r.province.rec / r.province.med > 1 && r.province.rec / r.province.med > 1.2 * r.country.rec / r.country.med).map(r => `${r.name}: อุบลฯ ${fmt(r.province.rec / r.province.med, 1)} เท่า ประเทศ ${fmt(r.country.rec / r.country.med, 1)} เท่า`) }; }
  if (m.hasDds) {
    const G = districtSignals(m, d), wL = epiWeek(m.alertT, S.y - 543).week;
    base.dist = { name: dn, wL, w0: Math.max(1, wL - G.Wn + 1), Wn: G.Wn, provRec: G.provRec, provRate: G.provRate, rows: G.rows.map(r => ({ code: r.x.code, name: r.x.name, rec: r.rec, rt: r.rt || 0, st: dStatus(r) })) };
    const N = 12, wk = Array.from({ length: N }, (_, i) => m.alertT - (N - 1 - i) * 7 * DAY), prov = wk.map(t => cell(DB, t, d, 'ALL').c);
    base.weekly = { wn: wk.map(t => epiWeek(t, S.y - 543).week), tiles: DB.districts.map(x => { const g = G.rows.find(r => r.x.code === x.code); const ser = wk.map(t => cell(DB, t, d, x.code).c); return { name: x.name, ser, ref: prov.map(v => v * x.pop / DB.popTotal), st: g ? dStatus(g) : 0, rec: ser.slice(-4).reduce((a, v) => a + v, 0), rt: g?.rt || 0 }; }).sort((a, b) => b.st - a.st || b.rt - a.rt) };
  }
  const F = DB.facilities || [];
  if (F.length) { const rows = DB.districts.map(x => { const fs = F.filter(f => f.district_code === x.code); const n = fs.reduce((a, f) => a + +f.total, 0), r = fs.reduce((a, f) => a + +f.reported, 0); return { name: x.name, n, r, p: n ? r / n * 100 : 0 }; }).filter(r => r.n);
    const n = rows.reduce((a, r) => a + r.n, 0), r = rows.reduce((a, o) => a + o.r, 0), rep = F.reduce((a, f) => a + +f.reports, 0), tim = F.reduce((a, f) => a + +f.timely, 0);
    base.dds = { rows, n, r, cov: n ? r / n * 100 : 0, tim: rep ? tim / rep * 100 : null, full: rows.filter(o => o.p >= 100).length, period: F[0]?.period_label || '' };
    if (S.dc !== 'ALL') { const fs = F.filter(f => f.district_code === S.dc).map(f => ({ name: shortUnit(f.unit_name), code: f.unit_code, ...facState(f), rep: +f.reports, tim: +f.timely, reported: +f.reported })); base.dds.dist = { name: distName(S.dc), list: fs }; } }
  return base;
}

function emptyNote() {
  return `<div class="notice">${ico('alert', 18)}<div><b>ยังไม่มีข้อมูลรายสัปดาห์ในช่วงเวลาที่เลือก</b><br>ใส่ไฟล์ข้อมูลรายสัปดาห์ (ดูหน้า "ติดต่อ & แก้ปัญหา" → ขั้นตอนอัปเดต) หรือเปิด "ดูด้วยข้อมูลจำลอง" ที่แถบซ้ายเพื่อทดลองระบบ</div></div>`;
}

// ---------- facility search (รหัส 5 หลัก / ชื่อ) ----------
let FAC = null;
function facIndex() {
  if (FAC) return FAC;
  FAC = new Map();
  const put = (code, o) => { if (!code) return; const c = String(code).trim(); FAC.set(c, { ...(FAC.get(c) || { code: c }), ...Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v != null)) }); };
  for (const u of DB.units) put(u.unit_code, { name: u.unit_name, type: u.unit_type, dc: u.district_code, affiliation: u.affiliation });
  for (const f of DB.facilities) put(f.unit_code, { name: f.unit_name, type: f.unit_type, dc: f.district_code, fac: f });
  for (const q of DB.unitQuality) { const e = FAC.get(String(q.unit_code).trim()); if (e) (e.uq = e.uq || []).push(q); else put(q.unit_code, { uq: [q] }); }
  return FAC;
}
function searchFac(q) {
  q = q.trim().toLowerCase(); if (!q) return [];
  const list = [...facIndex().values()];
  const digits = /^\d+$/.test(q);
  return list.filter(f => digits ? f.code.startsWith(q) || f.code.replace(/^0+/, '').startsWith(q.replace(/^0+/, '')) : (f.name || '').toLowerCase().includes(q))
    .sort((a, b) => (a.code === q ? -1 : 0) - (b.code === q ? -1 : 0) || (a.name || '').length - (b.name || '').length).slice(0, 12);
}
function showResults() {
  const inp = $('#q'), box = $('#qres'); if (!inp) return;
  const r = searchFac(inp.value);
  if (!inp.value.trim()) { box.hidden = true; return; }
  const rc = inp.getBoundingClientRect();
  Object.assign(box.style, { left: rc.left - 30 + 'px', top: rc.bottom + 8 + 'px', width: Math.max(360, rc.width + 40) + 'px' });
  box.innerHTML = r.length ? r.map(f => `<button data-fac="${esc(f.code)}"><code>${esc(f.code)}</code><span>${esc(f.name || '(ไม่พบชื่อ)')}<br><small class="muted">${esc(f.type || '')} • ${esc(DB.districts.find(d => d.code === f.dc)?.name || '')}</small></span></button>`).join('') : '<div class="empty">ไม่พบสถานพยาบาล</div>';
  box.hidden = false;
}
function facStatus(f) {
  const K = DB.config.dds_kpi || { timely_target: 80 };
  if (!f) return ['none', 'ไม่มีข้อมูล'];
  const rep = +f.reported, n = +f.reports, t = +f.timely;
  return !rep ? ['red', 'ไม่ส่งรายงาน'] : !n ? ['few', 'ส่ง zero report'] : t / n * 100 < K.timely_target ? ['red', 'เร่งรัด'] : t / n * 100 < 90 ? ['orange', 'ติดตาม'] : ['green', 'ผ่าน'];
}
function selectFac(code) {
  const f = facIndex().get(code); if (!f) return;
  const changed = S.fac !== code;
  S.fac = code; if (f.dc) S.dc = f.dc;
  if (changed) render().then(() => openFac(code)); else openFac(code);
}
function openFac(code) {
  const f = facIndex().get(code); if (!f) return;
  const fac = f.fac, [lv, tx] = facStatus(fac), K = DB.config.dds_kpi || { timely_target: 80 };
  const dn = DB.districts.find(d => d.code === f.dc)?.name || '';
  const uq = (f.uq || []).sort((a, b) => b.fiscal_year_be - a.fiscal_year_be);
  $('#modal').innerHTML = `<div class="box" tabindex="-1" role="dialog" aria-modal="true" aria-label="${esc(f.name)}"><div class="box-h"><div><div class="eyebrow">${esc(f.type || 'สถานพยาบาล')} • รหัส ${esc(f.code)}${dn ? ' • อำเภอ' + esc(dn) : ''}</div><h2>${esc(f.name || f.code)}</h2></div><button id="mclose" aria-label="ปิด">${ico('close', 18)}</button></div>
  <div class="box-b">
    ${fac ? `<section class="kpis">
      <div class="kpi"><div class="k-t">ส่งรายงานใน DDS</div><div class="k-v ${+fac.reported ? 'green' : 'red'} sm">${+fac.reported ? 'ส่งแล้ว' : 'ยังไม่ส่ง'}</div><div class="k-s">${esc(fac.period_label)}</div></div>
      <div class="kpi"><div class="k-t">ความทันเวลา (7 วัน)</div><div class="k-v ${lv === 'green' ? 'green' : lv === 'red' ? 'red' : 'orange'}">${+fac.reports ? fmt(+fac.timely / +fac.reports * 100, 1) + '%' : '–'}</div><div class="k-s">${fmt(+fac.timely)} / ${fmt(+fac.reports)} รายงาน • เกณฑ์ > ${K.timely_target}%</div></div>
      <div class="kpi"><div class="k-t">สถานะ</div><div class="k-v sm"><span class="chip ${lv}" style="font-size:16px">${tx}</span></div><div class="k-s">${lv === 'red' ? 'ต้องเร่งรัด/ติดตาม' : lv === 'orange' ? 'ใกล้เกณฑ์ ควรติดตาม' : ''}</div></div></section>` : '<div class="notice">ยังไม่มีข้อมูลความครอบคลุม/ทันเวลาของหน่วยนี้</div>'}
    ${uq.length ? `<h3>รายงาน 10 โรคใน DDS รายเคส (อนุมัติแล้ว)</h3><table class="tbl"><thead><tr><th>ปีงบ</th><th class="r">รายงาน</th><th class="r">ส่งภายใน 7 วัน</th><th class="r">ครบถ้วน</th></tr></thead><tbody>${uq.map(q => `<tr><td>${esc(q.fiscal_year_be)}</td><td class="r">${fmt(+q.reports)}</td><td class="r">${fmt(+q.timely / +q.reports * 100, 1)}%</td><td class="r">${fmt(+q.complete / +q.reports * 100, 1)}%</td></tr>`).join('')}</tbody></table>` : ''}
    <p class="note">ตัวกรองถูกตั้งเป็น ${esc(f.name || f.code)}${dn ? ` และอำเภอ${esc(dn)}` : ''} แล้ว — ปิดหน้าต่างนี้เพื่อดูข้อมูลในหน้าเดิม</p>
    <div class="dl" style="margin-top:10px"><button class="btn" id="mclose2">ปิด และดูข้อมูลต่อ</button>${S.page !== 'units' ? '<button class="btn ghost" data-page-go="units">เปิดหน้าคุณภาพรายงาน DDS</button>' : ''}</div>
  </div></div>`;
  $('#modal').hidden = false; $('#qres').hidden = true; setTimeout(() => $('#modal .box')?.focus(), 0);
}
function openGroup(t) {
  const F = (DB.facilities || []).filter(f => vgroup(f) === t && (S.dc === 'ALL' || f.district_code === S.dc))
    .sort((a, b) => { const k = f => !+f.reported ? 0 : !+f.reports ? 1 : 2; return k(a) - k(b) || a.district_name.localeCompare(b.district_name, 'th') || a.unit_name.localeCompare(b.unit_name, 'th'); });
  const r = F.filter(f => +f.reported).length, V = vMap();
  const st = f => !+f.reported ? '<span class="chip red">ยังไม่พบการส่งรายงาน</span>' : !+f.reports ? '<span class="chip few">ส่งได้ แต่ไม่มีผู้ป่วยทั้งช่วง</span>' : `<span class="chip green">ส่งแล้ว ${fmt(+f.reports)} รายงาน</span>`;
  $('#modal').innerHTML = `<div class="box wide" tabindex="-1" role="dialog" aria-modal="true" aria-label="${esc(t)}"><div class="box-h"><div><div class="eyebrow">สถานพยาบาลในทะเบียน DDS • ${esc(S.dc === 'ALL' ? 'ทั้งจังหวัด' : 'อำเภอ' + distName(S.dc))}</div><h2>${esc(t)} <small class="gsub">ส่งแล้ว ${r}/${F.length} แห่ง</small></h2></div><button id="mclose" aria-label="ปิด">${ico('close', 18)}</button></div>
  <div class="box-b"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th>${S.dc === 'ALL' ? '<th>อำเภอ</th>' : ''}<th>สถานพยาบาล</th><th>สถานะในระบบ DDS</th>${V.size ? '<th>ผลตรวจสอบ (สสจ.)</th>' : ''}</tr></thead><tbody>
  ${F.map((f, i) => `<tr><td class="muted">${i + 1}</td>${S.dc === 'ALL' ? `<td>${esc(f.district_name)}</td>` : ''}<td><a href="#" data-fac="${esc(f.unit_code)}">${esc(f.unit_name)}</a><div class="en">${esc(f.unit_code)}</div></td><td>${st(f)}</td>${V.size ? `<td>${esc(V.get(f.unit_code)?.status || '–')}</td>` : ''}</tr>`).join('')}</tbody></table></div>
  <p class="note">คลิกชื่อสถานพยาบาลเพื่อดูผลการรายงานรายหน่วย</p><div class="dl"><button class="btn" id="mclose2">ปิด</button></div></div></div>`;
  $('#modal').hidden = false; setTimeout(() => $('#modal .box')?.focus(), 0);
}
function closeModal() { $('#modal').hidden = true; }

// ---------- render & events ----------
const RENDER = { my: pageMy, overview: pageOverview, district: pageDistrict, trend: pageTrend, cluster: pageCluster, units: pageUnits, quality: pageQuality, measures: pageMeasures, contact: pageContact, info: pageInfo };

function applyData() {
  DB.rows = S.demo ? (DB._demo || (DB._demo = makeDemo(DB))) : REAL_ROWS; DB._demoRows = S.demo;
  buildIndex(DB);
}

async function render(o = {}) {
  const y0 = window.scrollY;
  EPI.year = S.y - 543;
  writeHash(); shell();
  const main = $('#main');
  try { main.innerHTML = (RENDER[S.page] || pageOverview)(); }
  catch (e) { console.error(e); main.innerHTML = `<div class="notice">${ico('alert')}<div><b>เกิดข้อผิดพลาดในการแสดงผล</b><br><code>${esc(e.message)}</code></div></div>`; }
  main.focus({ preventScroll: true }); window.scrollTo({ top: o.keep ? y0 : 0 });
  document.querySelectorAll('#main table.tbl').forEach(t => { const H = [...t.querySelectorAll('thead tr:last-child th')].map(th => th.textContent.trim()); if (!H.length || t.querySelector('thead tr + tr')) return; t.classList.add('cardify'); t.querySelectorAll('tbody tr').forEach(tr => { [...tr.children].forEach((td, i) => { td.setAttribute('data-label', H[i] || ''); if (td.querySelector('svg,canvas,.minibars,.bars')) td.classList.add('c-sp'); if (td.querySelector('.pchip,.chip,.badge') && i === tr.children.length - 1) td.classList.add('c-st'); }); if (tr.children.length > 2) { const b = document.createElement('td'); b.className = 'c-br'; tr.children[0].after(b); } }); const rows = t.tBodies[0]?.rows || []; if (rows.length > 15) { [...rows].slice(15).forEach(r => r.classList.add('m-more')); const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'm-morebtn'; btn.textContent = `แสดงทั้งหมด (${rows.length} รายการ)`; btn.onclick = () => { t.classList.add('m-all'); btn.remove(); }; t.after(btn); } });
  if (S.page === 'info') await drawInfo();
  document.body.classList.remove('nav-open');
}

async function drawInfo() {
  const cv = $('#cv'); if (!cv) return;
  if (!TEMPLATES[S.tpl]) S.tpl = 'situation';
  if (S.tpl !== 'situation') { if (S.size === 'a4') S.size = 'ppt'; await drawTemplate(cv, info2Model(), S.tpl, SIZES[S.size]); return; }
  await drawInfographic(cv, infoModel(S.dc), S.size, THEMES[S.theme]);
}
function downloadCanvas(cv, name) { return new Promise(res => cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); res(); }, 300); }, 'image/png')); }
const TPLN = { levels: 'เทียบ3ระดับ', district: 'รายอำเภอ', weekly: 'แนวโน้ม25อำเภอ', dds: 'คุณภาพDDS' };
const fileName = dc => (S.tpl !== 'situation' ? TPLN[S.tpl] + '_' : '') + `${S.d === 'ALL' ? '10โรค' : dName(S.d).replace(/[\\/:*?"<>|\s]+/g, '')}_${dc === 'ALL' ? 'จังหวัด' : DB.districts.find(d => d.code === dc)?.name}_${S.yt === 'fiscal' ? 'ปีงบ' : 'ปี'}${S.y}_${model(dc).has ? 'W' + model(dc).week.week : ''}${S.demo ? '_จำลอง' : ''}.png`;

function bind() {
  document.addEventListener('input', e => { if (e.target.id === 'q') showResults(); });
  document.addEventListener('focusin', e => { if (e.target.id === 'q' && e.target.value) showResults(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); $('#qres').hidden = true; } if (e.key === 'Enter' && e.target.id === 'q') { e.preventDefault(); const r = searchFac(e.target.value); if (r[0]) selectFac(r[0].code); } });
  document.addEventListener('click', e => {
    const vg = e.target.closest('[data-vgroup]'); if (vg) { e.preventDefault(); return openGroup(vg.dataset.vgroup); }
    const fb = e.target.closest('[data-fac]'); if (fb) { e.preventDefault(); e.stopImmediatePropagation(); selectFac(fb.dataset.fac); return; }
    if (e.target.closest('#facx')) { e.stopImmediatePropagation(); S.fac = ''; render(); return; }
    if (e.target.closest('#mclose2')) { e.stopImmediatePropagation(); closeModal(); return; }
    if (!e.target.closest('#qres') && e.target.id !== 'q') $('#qres').hidden = true;
    if (e.target.id === 'modal' || e.target.closest('#mclose')) { e.stopImmediatePropagation(); closeModal(); return; }
    const g = e.target.closest('[data-dc-go]'); if (g) { e.stopImmediatePropagation(); S.dc = g.dataset.dcGo; closeModal(); render(); return; }
    const pg = e.target.closest('[data-page-go]'); if (pg) { e.stopImmediatePropagation(); S.page = pg.dataset.pageGo; closeModal(); render(); return; }
  });
  document.addEventListener('click', async e => {
    const tb = e.target.closest('[data-tpl]'); if (tb) { e.preventDefault(); S.tpl = tb.dataset.tpl; render({ keep: true }); return; }
    const t = e.target.closest('[data-page],[data-yt],.go-trend,.pick-d,.pick-d2,#dall,.pick-dc,[data-dc],#copylink,#copysum,#copyimg,#dl,#dlall,#menuBtn');
    if (!t) return;
    if (t.id === 'menuBtn') { document.body.classList.toggle('nav-open'); return; }
    e.preventDefault();
    if (t.dataset.page) { S.page = t.dataset.page; return render(); }
    if (t.dataset.yt) { if (S.yt !== t.dataset.yt) { S.yt = t.dataset.yt; S.wk = ''; S.y = S.yt === 'fiscal' ? currentFiscalBE(Date.now()) : new Date().getFullYear() + 543; } return render(); }
    if (t.classList.contains('pick-d2')) { S.d = t.dataset.d; render({ keep: true }); return; }
    if (t.classList.contains('pick-d')) { S.d = S.d === t.dataset.d ? 'ALL' : t.dataset.d; render({ keep: true }); document.querySelector('.dz-head, .kpis')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (t.id === 'dall') { S.d = 'ALL'; return render({ keep: true }); }
    if (t.classList.contains('go-trend')) { S.d = t.dataset.d; S.page = 'trend'; return render(); }
    if (t.dataset.dc !== undefined && t.dataset.dc) { S.dc = S.dc === t.dataset.dc ? 'ALL' : t.dataset.dc; S.fac = ''; return render(); }
    if (t.id === 'copylink') { await navigator.clipboard?.writeText(location.href).catch(() => { }); t.textContent = 'คัดลอกแล้ว ✓'; return; }
    if (t.id === 'copysum') { const mm = model(); await navigator.clipboard?.writeText(measureLines(mm, mm.per.find(r => r.id === S.d) || null).map(l => '• ' + l).join('\n')).catch(() => { }); t.textContent = 'คัดลอกแล้ว ✓'; return; }
    if (t.id === 'copyimg') {
      const msg = $('#dlmsg');
      try { const blob = await new Promise(r => $('#cv').toBlob(r, 'image/png')); await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); msg.textContent = 'คัดลอกภาพแล้ว ✓ ไปที่ PowerPoint แล้วกด Ctrl+V'; }
      catch { msg.textContent = 'เบราว์เซอร์นี้คัดลอกภาพไม่ได้ — ใช้ปุ่มดาวน์โหลด PNG แทน แล้วลากไฟล์ลงสไลด์'; }
      return;
    }
    if (t.id === 'dl') return downloadCanvas($('#cv'), fileName(S.dc));
    if (t.id === 'dlall') {
      const msg = $('#dlmsg'); const cv = document.createElement('canvas'); const list = ['ALL', ...DB.districts.map(d => d.code)];
      for (let i = 0; i < list.length; i++) { msg.textContent = `กำลังสร้าง ${i + 1}/${list.length} …`; await drawInfographic(cv, infoModel(list[i]), S.size, THEMES[S.theme]); await downloadCanvas(cv, fileName(list[i])); }
      msg.textContent = `ดาวน์โหลดครบ ${list.length} ภาพ ✓ (ถ้าเบราว์เซอร์ถาม ให้กด "อนุญาตให้ดาวน์โหลดหลายไฟล์")`;
    }
  });
  document.addEventListener('change', e => {
    const id = e.target.id;
    if (id === 'fy') { S.y = +e.target.value; S.wk = ''; } else if (id === 'fwk') S.wk = e.target.value;
    else if (id === 'fdc') { S.dc = e.target.value; if (S.fac && facIndex().get(S.fac)?.dc !== S.dc) S.fac = ''; } else if (id === 'fd' || id === 'fd2') S.d = e.target.value;
    else if (id === 'fdemo') { S.demo = e.target.checked; applyData(); }
    else if (id === 'isize') S.size = e.target.value; else if (id === 'ithm') S.theme = e.target.value; else if (id === 'fdc2') S.dc = e.target.value; else if (id === 'srcsel') S.src = e.target.value; else return; // #q (search) ignored
    render({ keep: true });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.tile')) e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
}

async function init() {
  readHash();
  try { DB = prepare(await loadAll()); }
  catch (e) { $('#main').innerHTML = `<div class="notice">${ico('alert')}<div><b>โหลดข้อมูลไม่ได้</b><br>${esc(e.message)}<br><span class="muted">ถ้าเปิดไฟล์จากเครื่องโดยตรง (file://) ให้เปิดผ่าน GitHub Pages หรือรัน <code>python -m http.server</code></span></div></div>`; return; }
  REAL_ROWS = DB.rows;
  applyData(); bind(); await render();
  window.addEventListener('hashchange', () => { readHash(); applyData(); render(); });
  window.__DB = DB; window.__S = S; window.__model = model; // for testing
}
init();
