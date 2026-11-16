import { EPI, loadAll, prepare, yearOf, parseISO, friendly, buildIndex, makeDemo, periodRange, currentFiscalBE, epiWeek, sundayOf, thDate, ymd, fmt, rate, cfr, pctChange, cell, alertLevel, baselineFor, detectClusters, LEVELS } from './data.js';
import { hbars, sparkline, epiCurve, heatmap, COLORS, LEVEL_COLOR, LEVEL_TEXT } from './charts.js';
import { renderMap } from './map.js';
import { drawInfographic, SIZES } from './infographic.js';

const DAY = 86400000;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ICON = {
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
  ['overview', 'ภาพรวม 10 โรค', 'home'], ['district', 'รายอำเภอ / แผนที่', 'map'], ['trend', 'แนวโน้มรายสัปดาห์', 'trend'],
  ['cluster', 'กลุ่มก้อน & MEBS', 'cluster'], ['units', 'คุณภาพรายงาน DDS', 'unit'], ['quality', 'คุณภาพข้อมูล', 'quality'],
  ['measures', 'มาตรการเฝ้าระวัง', 'shield'], ['contact', 'ติดต่อ & แก้ปัญหา', 'phone'], ['info', 'สร้างภาพ Info', 'image']
];

let DB, REAL_ROWS;
const S = { page: 'overview', yt: 'calendar', y: new Date().getFullYear() + 543, wk: '', dc: 'ALL', fac: '', d: 'ALL', demo: false, size: 'ppt', src: '' };

function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  for (const k of ['page', 'dc', 'd', 'size', 'src', 'wk', 'fac']) if (p.get(k)) S[k] = p.get(k);
  S.yt = 'calendar'; // รายงาน 10 โรคใช้ปีปฏิทินเท่านั้น (ปีงบใช้เฉพาะผลงานคุณภาพรายงาน DDS ซึ่งมีช่วงข้อมูลกำกับในหน้านั้น)
  if (!PAGES.some(x => x[0] === S.page)) S.page = 'overview';
  if (p.get('y')) S.y = Math.min(+p.get('y'), new Date().getFullYear() + 543);
  S.demo = p.get('demo') === '1';
}
function writeHash() {
  const p = new URLSearchParams({ page: S.page, yt: S.yt, y: S.y, dc: S.dc, d: S.d });
  if (S.wk) p.set('wk', S.wk); if (S.fac) p.set('fac', S.fac);
  if (S.demo) p.set('demo', '1'); if (S.page === 'info') p.set('size', S.size); if (S.src) p.set('src', S.src);
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
    const al = has ? alertLevel(DB, z.id, dc, asOf) : { level: 'none' };
    const spark = has ? Array.from({ length: 12 }, (_, i) => cell(DB, asOf - (11 - i) * 7 * DAY, z.id, dc).c) : [];
    return { id: z.id, name: z.name, en: z.en, cases: c, deaths: x, prev: prevAvail ? pc : null, prevDeaths: prevAvail ? px : null, rate: rate(c, pop), cfr: cfr(x, c), change: prevAvail ? pctChange(c, pc) : null, level: al.level, ratio: al.ratio, recent: al.recent, spark };
  });
  // manual death reports not yet keyed into DDS (ทะเบียนผู้เสียชีวิต) — added to DDS-based counts
  const keyed = v => /^(y|yes|ใช่|คีย์แล้ว)$/i.test(String(v || '').trim());
  const pendRows = S.demo ? [] : DB.deathReg.filter(r => !keyed(r.dds_keyed) && (dc === 'ALL' || r.district_code === dc) && (() => { const t = parseISO(r.death_date || r.report_date); return isFinite(t) && yearOf({ t: sundayOf(t), fy: currentFiscalBE(t), cy: new Date(t).getUTCFullYear() + 543 }, S.yt) === S.y && t <= WK + 6 * DAY; })());
  for (const r of per) { r.pending = pendRows.filter(x => x.disease_id === r.id).length; r.ddsDeaths0 = r.deaths; r.deaths += r.pending; r.cfr = cfr(r.deaths, r.cases); }
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
  const label = s => DB.summary.find(x => x.date_to === s)?.period_label;
  return { from, to, asOf, asOfEnd: source === 'summary' ? snapT : asOfEnd, has: has || source === 'summary', hasDds: has, prevAvail, pop: source === 'summary' ? DB.config.population_total : pop, per, tot, ddsTot, inCur, source, snapT, prevSnapT,
    weekDelta: source === 'summary' && isFinite(prevSnapT) ? tot.c - per.reduce((a, r) => a + (r.cases - (r.weekDelta ?? 0)), 0) : null,
    change: prevAvail && source === 'dds' ? pctChange(tot.c, tot.p) : null, dc, week: has ? epiWeek(asOf) : (source === 'summary' ? epiWeek(snapT) : null) };
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
  if (m.weekDelta != null) { const up = m.per.filter(r => r.weekDelta > 0).sort((a, b) => b.weekDelta - a.weekDelta).slice(0, 3); L.push(`สัปดาห์นี้พบผู้ป่วยรายใหม่ ${fmt(m.weekDelta)} ราย${up.length ? ` มากที่สุดคือ ${up.map(r => `${r.name} +${fmt(r.weekDelta)}`).join(', ')}` : ''}`); }
  const top = [...m.per].filter(r => r.cases).sort((a, b) => b.cases - a.cases).slice(0, 3);
  if (top.length) L.push(`โรคที่พบมากที่สุด: ${top.map(r => `${r.name} ${fmt(r.cases)} ราย${r.rate != null ? ` (${fmt(r.rate, 2)} ต่อแสน ปชก.)` : ''}`).join(', ')}`);
  const hot = m.per.filter(r => r.level === 'red' || r.level === 'orange');
  L.push(hot.length ? `${DB.config.alert.window_weeks} สัปดาห์ล่าสุดสูงกว่าเกณฑ์: ${hot.map(r => `${r.name} (${LEVEL_TEXT[r.level]}${r.ratio != null && isFinite(r.ratio) ? ` ${fmt(r.ratio, 1)} เท่าของมัธยฐาน` : ''})`).join(', ')}` : `${DB.config.alert.window_weeks} สัปดาห์ล่าสุดไม่มีโรคที่อยู่ระดับติดตามหรือรุนแรง`);
  const dead = m.per.filter(r => r.deaths);
  if (dead.length) L.push(`มีผู้เสียชีวิตจาก: ${dead.map(r => `${r.name} ${fmt(r.deaths)} ราย`).join(', ')} — ควรทบทวนการเสียชีวิต (Death review) ทุกราย`);
  if (m.dc === 'ALL') {
    const hotD = DB.districts.map(d => ({ d, a: alertLevel(DB, 'ALL', d.code, m.asOf) })).filter(o => o.a.level === 'red' || o.a.level === 'orange');
    if (hotD.length) L.push(`อำเภอที่ต้องติดตาม (รวม 10 โรค): ${hotD.map(o => o.d.name).join(', ')}`);
  }
  const cl = detectClusters(DB, m.asOf).filter(c => m.dc === 'ALL' || c.dc === m.dc);
  if (cl.length) L.push(`พบกลุ่มก้อนที่เข้าเกณฑ์ ${cl.length} พื้นที่ ในจำนวนนี้ยังไม่พบใน MEBS ${cl.filter(c => !c.mebs).length} พื้นที่`);
  return L;
}

function weekOpts() {
  const seen = new Set();
  for (const r of DB.rows) if (yearOf(r, S.yt) === S.y) seen.add(r.t);
  return [...seen].sort((a, b) => b - a).map(t => { const v = ymd(t); return `<option value="${v}" ${S.wk === v ? 'selected' : ''}>ถึงสัปดาห์ ${epiWeek(t).week} (${thDate(epiWeek(t).to)})</option>`; }).join('');
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
    <div class="tb-group tb-tools"><label class="switch" title="ดูด้วยข้อมูลจำลอง"><input type="checkbox" id="fdemo" ${S.demo ? 'checked' : ''}><span></span> จำลอง</label>
      <button class="btn ghost sm" id="copylink" title="คัดลอกลิงก์มุมมองนี้">${ico('link', 15)} ลิงก์</button></div>`;
  $('#sidelinks').innerHTML = `<a class="btn ghost w" href="tools/update.html">${ico('upload', 16)} ศูนย์อัปเดตข้อมูล</a>`;
  $('#fdc').value = S.dc; $('#fd').value = S.d;
}

function header(m) {
  const fresh = m.has ? Math.floor((Date.now() - m.asOfEnd) / DAY) : null;
  const logo = '';
  return `<header class="hero">
    <div><div class="eyebrow">${esc(DB.config.office)}</div><h1>สถานการณ์ 10 โรคที่ต้องเฝ้าระวัง</h1>
    <div class="sub">${esc(distName(S.dc))}${S.fac && facIndex().get(S.fac) ? ' • ' + esc(facIndex().get(S.fac).name) : ''} • ${esc(periodLabel(m))}</div></div>
    <div class="asof">${m.has ? `<b>${m.source === 'summary' ? 'ข้อมูล ณ ' + thDate(m.snapT, false) : 'ข้อมูลถึงสัปดาห์ที่ ' + m.week.week}</b><span>${m.source === "summary" ? "สัปดาห์ระบาดวิทยาที่ " + m.week.week + " • รายงานประจำสัปดาห์" : thDate(m.week.from) + " – " + thDate(m.asOfEnd)}</span>${fresh > 7 ? `<span class="stale">${ico('alert', 14)} ข้อมูลเก่า ${fresh} วัน</span>` : ''}` : '<b>ยังไม่มีข้อมูลรายสัปดาห์</b>'}</div>
  </header>${S.demo ? '<div class="demo-banner">⚠ กำลังแสดง <b>ข้อมูลจำลอง</b> เพื่อทดลองระบบ — ห้ามใช้อ้างอิงหรือเผยแพร่</div>' : ''}`;
}

// ---------- pages ----------
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
  return header(m) + `
  <section class="kpis">
    <div class="kpi"><div class="k-t">ผู้ป่วยสะสม 10 โรค</div><div class="k-v blue">${fmt(m.tot.c)}</div><div class="k-s">${m.weekDelta != null ? `<span class="trend up">${ico('up', 14)} +${fmt(m.weekDelta)}</span> ราย จากรายงานสัปดาห์ก่อน (${thDate(m.prevSnapT)})` : ch == null ? '<span class="muted">ไม่มีข้อมูลปีก่อนช่วงเดียวกัน</span>' : `<span class="trend ${ch > 0 ? 'up' : 'dn'}">${ico(ch > 0 ? 'up' : 'down', 14)} ${fmt(Math.abs(ch), 1)}%</span> เทียบช่วงเดียวกันปีก่อน (${fmt(m.tot.p)})`}</div></div>
    <div class="kpi"><div class="k-t">ผู้เสียชีวิต</div><div class="k-v ${m.tot.x ? 'red' : 'green'}">${fmt(m.tot.x)}</div><div class="k-s">${k.filter(r => r.deaths).map(r => `${r.name} ${r.deaths}`).join(' • ') || 'ไม่มีผู้เสียชีวิต'}${!sumSrc && k.some(r => r.pending) ? `<br><span class="chip orange">รวมรายงานด้วยตนเองที่รอคีย์ใน DDS ${k.reduce((a, r) => a + r.pending, 0)} ราย</span>` : ''}</div></div>
    <div class="kpi"><div class="k-t">อัตราป่วยสูงสุด</div><div class="k-v navy sm">${topRate ? esc(topRate.name) : '–'}</div><div class="k-s">${topRate ? `${fmt(topRate.rate, 2)} ต่อแสน ปชก.` : (m.pop ? '' : 'ยังไม่มีประชากร')}</div></div>
    <div class="kpi"><div class="k-t">CFR สูงสุด <small>(ผู้ป่วย ≥ 5 ราย)</small></div><div class="k-v orange sm">${cfrCand ? esc(cfrCand.name) : '–'}</div><div class="k-s">${cfrCand ? `CFR ${fmt(cfrCand.cfr, 2)}% (${cfrCand.deaths}/${fmt(cfrCand.cases)})` : 'ไม่มี'}</div></div>
    <div class="kpi"><div class="k-t">โรคที่ต้องติดตาม/รุนแรง</div><div class="k-v ${redN ? 'red' : 'green'}">${redN}</div><div class="k-s">จาก 10 โรค (${DB.config.alert.window_weeks} สัปดาห์ล่าสุด เทียบมัธยฐาน 5 ปี)</div></div>
  </section>
  <section class="grid2">
    <div class="card"><div class="card-h"><h2>ตาราง 10 โรค</h2>${srcBadge}</div>
      ${(() => { const pv = prevYearSummary(m); return pv ? `<p class="note">เทียบกับ ${esc(pv.label)}${pv.samePeriod ? '' : ' — ช่วงเวลาไม่เท่ากัน จึงไม่คำนวณร้อยละเปลี่ยนแปลง'}</p>` : ''; })()}
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>โรค</th>${prevYearSummary(m) ? `<th class="r prevcol">ป่วย ${prevYearSummary(m).year}</th><th class="r prevcol">ตาย ${prevYearSummary(m).year}</th>` : ''}<th class="r">ป่วย</th><th class="r">ตาย</th><th class="r">ต่อแสน</th><th class="r">CFR%</th><th class="r">${sumSrc ? 'เพิ่มจากสัปดาห์ก่อน' : 'เทียบปีก่อน'}</th><th>12 สัปดาห์</th><th>สถานะ</th></tr></thead><tbody>
      ${k.map((r, i) => `<tr><td><a href="#" class="go-trend" data-d="${r.id}">${i + 1}. ${esc(r.name)}</a><div class="en">${esc(r.en)}</div></td>${PV ? `<td class="r prevcol">${PV.rows[i] ? fmt(PV.rows[i].cases) : '–'}</td><td class="r prevcol">${PV.rows[i] ? fmt(PV.rows[i].deaths) : '–'}</td>` : ''}<td class="r b">${fmt(r.cases)}</td><td class="r ${r.deaths ? 'red b' : ''}">${fmt(r.deaths)}</td><td class="r">${r.rate == null ? '–' : fmt(r.rate, 2)}</td><td class="r">${fmt(r.cfr, 2)}</td>
      <td class="r">${sumSrc ? (r.weekDelta == null ? '–' : `<span class="${r.weekDelta > 0 ? 'b' : 'muted'}">${r.weekDelta > 0 ? '+' : ''}${fmt(r.weekDelta)}</span>${r.weekDeltaDeaths ? ` <small class="red">(ตาย +${r.weekDeltaDeaths})</small>` : ''}`) : r.change == null ? '–' : `<span class="trend ${r.change > 0 ? 'up' : 'dn'}">${r.change > 0 ? '▲' : '▼'} ${fmt(Math.abs(r.change), 1)}%</span>`}</td><td>${sparkline(r.spark, LEVEL_COLOR[r.level] || COLORS.blue)}</td><td>${chip(r.level)}</td></tr>`).join('')}
      </tbody><tfoot><tr><td>รวม 10 โรค</td>${PV ? `<td class="r prevcol">${fmt(PV.rows.reduce((a, r) => a + (r?.cases || 0), 0))}</td><td class="r prevcol">${fmt(PV.rows.reduce((a, r) => a + (r?.deaths || 0), 0))}</td>` : ''}<td class="r">${fmt(m.tot.c)}</td><td class="r">${fmt(m.tot.x)}</td><td class="r">${m.pop ? fmt(rate(m.tot.c, m.pop), 2) : '–'}</td><td class="r">${fmt(cfr(m.tot.x, m.tot.c), 2)}</td><td class="r">${sumSrc ? (m.weekDelta == null ? '–' : '+' + fmt(m.weekDelta)) : ch == null ? '–' : fmt(ch, 1) + '%'}</td><td></td><td></td></tr></tfoot></table></div>
      ${sumSrc && m.hasDds ? `<p class="note">ตัวเลขในตารางเป็นตัวเลขรายงานทางการประจำสัปดาห์ • สถานะสี กราฟ 12 สัปดาห์ และรายอำเภอ ใช้ DDS รายเคส (${fmt(m.ddsTot.c)} ราย ต่างจากทางการ ${fmt(Math.abs(m.tot.c - m.ddsTot.c))} ราย = ${fmt(Math.abs(m.tot.c - m.ddsTot.c) / (m.tot.c || 1) * 100, 2)}%) • ดูการตรวจยอดได้ที่หน้า "คุณภาพข้อมูล"</p>` : ''}</div>
    <div class="col">
      <div class="card"><div class="card-h"><h2>อัตราป่วยต่อแสนประชากร</h2></div>${hbars([...k].sort((a, b) => (b.rate || 0) - (a.rate || 0)).map(r => ({ label: r.name, value: r.rate, color: LEVEL_COLOR[r.level] })), { unit: 'ต่อแสน' })}</div>
      <div class="card"><div class="card-h"><h2>สรุปสถานการณ์ (อัตโนมัติ)</h2><button class="btn ghost sm" id="copysum">คัดลอกข้อความ</button></div><ul class="sum">${summaryLines(m).map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>
    </div>
  </section>
  ${legend()}`;
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

function pageDistrict() {
  const m = model('ALL');
  if (!m.has) return header(m) + emptyNote();
  const d = S.d;
  const rows = DB.districts.map(x => {
    let c = 0, dd = 0;
    for (const r of DB.rows) if (r.dc === x.code && (d === 'ALL' || r.d === d) && m.inCur(r)) { c += r.c; dd += r.x; }
    const a = alertLevel(DB, d, x.code, m.asOf);
    return { x, c, dd, rt: rate(c, x.pop), a };
  });
  const byCode = Object.fromEntries(rows.map(r => [r.x.code, r]));
  const sorted = [...rows].sort((p, q) => (LEVELS[q.a.level] - LEVELS[p.a.level]) || ((q.rt ?? q.c) - (p.rt ?? p.c)));
  return header(m) + `
  <section class="grid2 even">
    <div class="card"><div class="card-h"><h2>แผนที่สถานะ: ${esc(d === 'ALL' ? 'รวม 10 โรค' : dName(d))}</h2><span class="muted">คลิกอำเภอเพื่อเลือก</span></div>
    ${(() => {
      const noBase = rows.every(r => r.a.level === 'nobase' || r.a.level === 'green' && r.a.base == null);
      const maxC = Math.max(1, ...rows.map(r => r.c));
      const shade = c => `rgba(23,78,166,${(0.18 + 0.82 * Math.sqrt(c / maxC)).toFixed(2)})`;
      return renderMap(DB, dc => noBase ? shade(byCode[dc]?.c || 0) : (LEVEL_COLOR[byCode[dc]?.a.level] || COLORS.grey), dc => byCode[dc] ? `${fmt(byCode[dc].c)} ราย` : '', S.dc)
        + (noBase ? '<p class="note warn">ยังไม่มีค่ามัธยฐาน 5 ปี จึงยังจัดสถานะสีไม่ได้ — แผนที่แสดงจำนวนผู้ป่วยสะสม (สีเข้ม = ผู้ป่วยมาก) แทน</p>' : legend());
    })()}</div>
    <div class="card"><div class="card-h"><h2>จัดอันดับอำเภอ</h2><span class="muted">${S.yt === 'fiscal' ? 'ปีงบ' : 'พ.ศ.'} ${S.y} สะสม</span></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>อำเภอ</th><th>โซน</th><th class="r">ป่วย</th><th class="r">ตาย</th><th class="r">ต่อแสน</th><th class="r">${DB.config.alert.window_weeks} สัปดาห์</th><th>สถานะ</th></tr></thead><tbody>
    ${sorted.map((r, i) => `<tr class="${S.dc === r.x.code ? 'sel' : ''}"><td>${i + 1}</td><td><a href="#" class="pick-dc" data-dc="${r.x.code}">${esc(r.x.name)}</a></td><td class="muted">${esc(r.x.zone)}</td><td class="r b">${fmt(r.c)}</td><td class="r ${r.dd ? 'red b' : ''}">${fmt(r.dd)}</td><td class="r">${r.rt == null ? '–' : fmt(r.rt, 2)}</td><td class="r">${fmt(r.a.recent)}${r.a.ratio != null && isFinite(r.a.ratio) ? `<small class="muted"> (${fmt(r.a.ratio, 1)}×)</small>` : ''}</td><td>${chip(r.a.level)}</td></tr>`).join('')}
    </tbody></table></div></div>
  </section>`;
}

function pageTrend() {
  const m = model();
  if (!m.has) return header(m) + emptyNote();
  const weeks = []; for (let t = sundayOf(m.from); t <= m.to; t += 7 * DAY) weeks.push(t); // Thai epi weeks: W1 starts 1 Jan, last week ends 31 Dec
  const cur = weeks.map(t => t <= m.asOf ? cell(DB, t, S.d, S.dc).c : null);
  const prevHas = m.prevAvail;
  const prev = weeks.map(t => prevHas ? cell(DB, t - 364 * DAY, S.d, S.dc).c : null);
  const base = weeks.map(t => { const e = epiWeek(t); return baselineFor(DB, S.d, S.dc, e.week, e.year); });
  const hw = Array.from({ length: 16 }, (_, i) => m.asOf - (15 - i) * 7 * DAY);
  const PW = DB.config.provisional_weeks ?? 2;
  const hm = DB.districts.map(x => hw.map(t => cell(DB, t, S.d, x.code).c));
  const order = DB.districts.map((x, i) => i).sort((a, b) => hm[b].reduce((s, v) => s + v, 0) - hm[a].reduce((s, v) => s + v, 0));
  return header(m) + `
  <div class="card"><div class="card-h"><h2>ผู้ป่วยรายสัปดาห์ (Endemic channel): ${esc(S.d === 'ALL' ? 'รวม 10 โรค' : dName(S.d))} — ${esc(distName(S.dc))}</h2></div>
  ${epiCurve({ weeks, cur, prev, base, ratioOrange: DB.config.alert.ratio_orange, prov: weeks.map(t => t <= m.asOf && t > m.asOf - PW * 7 * DAY) })}
  <p class="note">สัปดาห์ล่าสุด ${PW} สัปดาห์เป็นข้อมูลเบื้องต้น: จากข้อมูลจริงปี 2569 รายงานเข้ามา 90.5% ภายในสัปดาห์ที่เริ่มป่วย และ 98.3% ภายใน 1 สัปดาห์ ตัวเลขจึงอาจเพิ่มขึ้นในการอัปเดตครั้งถัดไป</p></div>
  <div class="card"><div class="card-h"><h2>Heatmap อำเภอ × สัปดาห์ (16 สัปดาห์ล่าสุด)</h2><span class="muted">เรียงจากอำเภอที่ป่วยมากสุด • เลือกโรคที่แถบด้านบน</span></div>
  ${heatmap(order.map(i => DB.districts[i].name), hw, order.map(i => hm[i]), PW)}<p class="note">* ข้อมูลเบื้องต้น</p></div>`;
}

function pageCluster() {
  const m = model('ALL');
  const cl = m.hasDds ? detectClusters(DB, m.asOf).filter(c => (S.dc === 'ALL' || c.dc === S.dc) && (S.d === 'ALL' || c.d === S.d)) : [];
  const ev = DB.mebs.filter(e => (S.dc === 'ALL' || e.district_code === S.dc) && (S.d === 'ALL' || e.disease_id === S.d));
  const closed = e => /ปิด/.test(e.status || '');
  const open = ev.filter(e => !closed(e));
  const area = e => [e.subdistrict && 'ต.' + e.subdistrict, e.district_code ? 'อ.' + (DB.districts.find(x => x.code === e.district_code)?.name || '') : '', e.province && !/อุบล/.test(e.province) ? 'จ.' + e.province : ''].filter(Boolean).join(' ');
  return header(m) + `
  <section class="kpis">
    <div class="kpi"><div class="k-t">เหตุการณ์ที่ยังติดตาม</div><div class="k-v orange">${open.length}</div><div class="k-s">จากทะเบียนเหตุการณ์ทั้งหมด ${ev.length} เหตุการณ์</div></div>
    <div class="kpi"><div class="k-t">ผู้ป่วย / เสียชีวิตในเหตุการณ์</div><div class="k-v red">${fmt(ev.reduce((a, e) => a + (+e.cases || 0), 0))} / ${fmt(ev.reduce((a, e) => a + (+e.deaths || 0), 0))}</div><div class="k-s">กลุ่มก้อน ${ev.filter(e => e.event_type === 'กลุ่มก้อน').length} • เฉพาะราย ${ev.filter(e => e.event_type === 'เฉพาะราย').length}</div></div>
    <div class="kpi"><div class="k-t">กลุ่มก้อนที่ระบบตรวจพบจาก DDS</div><div class="k-v blue">${cl.length}</div><div class="k-s">ยังไม่มีในทะเบียนเหตุการณ์ ${cl.filter(c => !c.mebs).length} พื้นที่ (${DB.config.alert.window_weeks} สัปดาห์ล่าสุด)</div></div>
  </section>
  <div class="card"><div class="card-h"><h2>ทะเบียนเหตุการณ์ (Outbreak Verification / MEBS)</h2><span class="muted">จาก Outbreak Verification List</span></div>
  ${ev.length ? `<div class="events">${[...ev].sort((a, b) => closed(a) - closed(b) || String(b.first_onset).localeCompare(String(a.first_onset))).map(e => {
    const last = Date.parse(e.last_onset || e.first_onset); const days = isFinite(last) ? Math.floor((Date.now() - last) / DAY) : null;
    const lim = DB.config.diseases.find(z => z.id === e.disease_id)?.incubation_days || 28;
    const lv = closed(e) ? 'green' : +e.deaths ? 'red' : e.event_type === 'กลุ่มก้อน' ? 'orange' : 'yellow';
    return `<div class="event lv-${lv}"><div class="ev-top"><span class="chip ${lv}">${esc(e.event_type || 'เหตุการณ์')}</span> <b>${esc(e.disease_name || dName(e.disease_id))}</b> <span class="muted">${esc(e.event_id)}</span></div>
    <div class="ev-grid"><div><span class="muted">พื้นที่</span>${esc(area(e)) || '–'}</div><div><span class="muted">ผู้ป่วย / ตาย</span><span><b>${esc(e.cases || 0)}</b> / <b class="${+e.deaths ? 'red' : ''}">${esc(e.deaths || 0)}</b> ราย</span></div>
    <div><span class="muted">เริ่มป่วย</span>${thDate(parseISO(e.first_onset))}</div><div><span class="muted">รับแจ้ง</span>${thDate(parseISO(e.received))} • ${esc(e.source)}</div></div>
    ${e.action ? `<div class="ev-act"><span class="muted">การดำเนินการ:</span> ${esc(e.action)}</div>` : ''}
    <div class="ev-foot"><span class="chip ${lv}">${esc(e.status || 'ไม่ระบุสถานะ')}</span>${days != null && !closed(e) ? ` • ผ่านไป ${days} วัน${days >= lim ? ` <small class="muted">(เกิน ${lim} วัน พิจารณาปิดเหตุการณ์)</small>` : ''}` : ''}</div></div>`; }).join('')}</div>` : '<div class="empty">ยังไม่มีเหตุการณ์ในทะเบียน</div>'}
  <p class="note">แสดงเฉพาะข้อมูลระดับเหตุการณ์ ไม่แสดงอายุ เพศ โรคประจำตัว หรือรายละเอียดผู้ป่วยรายบุคคล (PDPA) • ขั้นตอน: รับแจ้ง → สอบสวน → ควบคุม → ติดตาม → ปิดเหตุการณ์</p></div>
  <div class="card"><div class="card-h"><h2>กลุ่มก้อนที่ตรวจพบอัตโนมัติจาก DDS รายเคส</h2><span class="muted">ตามเกณฑ์จำนวนขั้นต่ำของแต่ละโรค ในตำบลเดียวกัน ภายใน 1 ระยะฟักตัว</span></div>
  ${cl.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>โรค</th><th>อำเภอ</th><th>รหัสตำบล</th><th class="r">ผู้ป่วย</th><th>ช่วงสัปดาห์</th><th>ในทะเบียนเหตุการณ์</th></tr></thead><tbody>
  ${cl.slice(0, 60).map(c => `<tr><td>${esc(dName(c.d))}</td><td>${esc(DB.districts.find(x => x.code === c.dc)?.name)}</td><td>${esc(c.sd)}</td><td class="r b">${c.cases}</td><td>${thDate(c.first)} – ${thDate(c.last + 6 * DAY)}</td><td>${c.mebs ? `<span class="chip green">${esc(c.mebs.event_id)}</span>` : '<span class="chip red">ยังไม่พบ — ควรตรวจสอบ</span>'}</td></tr>`).join('')}</tbody></table></div>${cl.length > 60 ? `<p class="note">แสดง 60 จาก ${cl.length} พื้นที่</p>` : ''}` : '<div class="empty">ไม่พบกลุ่มก้อนที่เข้าเกณฑ์</div>'}</div>`;
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
  const selStrip = selF ? (() => { const f = { ...selF, reported: +selF.reported, reports: +selF.reports, timely: +selF.timely }; const [lv, tx] = fStat(f); return `<div class="card sel-fac"><div class="card-h"><h2>${esc(f.unit_name)} <span class="muted">${esc(f.unit_code)} • ${esc(f.dds_type || f.unit_type)} • ${esc(f.district_name)}</span></h2><span class="chip ${lv}">${tx}</span></div>
    <div class="ev-grid"><div><span class="muted">ส่งรายงาน</span><b>${f.reported ? 'ส่งแล้ว' : 'ยังไม่ส่ง'}</b></div><div><span class="muted">ทันเวลา (7 วัน)</span><b>${f.reports ? fmt(f.timely / f.reports * 100, 1) + '%' : '–'}</b> <small class="muted">${fmt(f.timely)} / ${fmt(f.reports)} รายงาน</small></div></div></div>`; })() : '';
  return `<header class="hero"><div><div class="eyebrow">${esc(DB.config.office)}</div><h1>คุณภาพการรายงานในระบบ DDS</h1><div class="sub">${esc(distName(S.dc))} • ${esc(per || 'ความครอบคลุมและความทันเวลา')}</div></div></header>
  ${!F.length ? `<div class="notice">${ico('alert', 18)}<div><b>ยังไม่มีข้อมูลรายสถานพยาบาล</b> — Export ตารางจาก DDC Dashboard (หน้า 1 ความครอบคลุมและความทันเวลา) แล้วอัปเดตที่ศูนย์อัปเดตข้อมูล</div></div>` : ''}
  ${selStrip}
  <section class="kpis">
    ${kcard(1, 'ความครอบคลุมการส่งรายงาน', cov == null ? '–' : fmt(cov, 2) + '%', `${fmt(sum(F, 'reported'))} / ${fmt(sum(F, 'total'))} แห่ง`, lvCov(cov), `ครอบคลุมตามที่กำหนด (ตั้งไว้ ${K.coverage_target}%)`)}
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
  ${F.length ? `<div class="card"><div class="card-h"><h2>สถานพยาบาลที่ไม่ส่งรายงาน / ต้องเร่งรัด / ติดตาม</h2><span class="muted">เร่งรัด = ทันเวลา < ${K.timely_target}% • ติดตาม = ${K.timely_target}–90% • ผ่าน ≥ 90%</span></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>สถานพยาบาล</th><th>ประเภท</th><th>อำเภอ</th><th class="r">รายงาน</th><th class="r">ทันเวลา</th><th class="r">%</th><th>สถานะ</th></tr></thead><tbody>
  ${sorted.filter(f => ['red', 'orange'].includes(fStat(f)[0])).map(f => { const [lv, tx] = fStat(f); return `<tr class="${f.unit_code === S.fac ? 'sel' : ''}"><td class="b"><a href="#" data-fac="${esc(f.unit_code)}">${esc(f.unit_name)}</a><div class="en">${esc(f.unit_code)}</div></td><td>${esc(f.unit_type)}</td><td>${esc(f.district_name)}</td><td class="r">${fmt(f.reports)}</td><td class="r">${fmt(f.timely)}</td><td class="r">${f.reports ? fmt(f.timely / f.reports * 100, 1) : '–'}</td><td><span class="chip ${lv}">${tx}</span></td></tr>`; }).join('') || '<tr><td colspan="7" class="empty ok">ไม่มีสถานพยาบาลที่ต้องเร่งรัด/ติดตาม ✓</td></tr>'}</tbody></table></div>
  <details class="more"><summary>แสดงสถานพยาบาลที่ผ่านเกณฑ์ / ส่ง zero report (${sorted.filter(f => !['red', 'orange'].includes(fStat(f)[0])).length} แห่ง)</summary><div class="tbl-wrap"><table class="tbl"><tbody>
  ${sorted.filter(f => !['red', 'orange'].includes(fStat(f)[0])).map(f => { const [lv, tx] = fStat(f); return `<tr><td>${esc(f.unit_name)} <span class="en">${esc(f.unit_code)}</span></td><td>${esc(f.unit_type)}</td><td>${esc(f.district_name)}</td><td class="r">${fmt(f.reports)}</td><td class="r">${f.reports ? fmt(f.timely / f.reports * 100, 1) + '%' : '–'}</td><td><span class="chip ${lv}">${tx}</span></td></tr>`; }).join('')}</tbody></table></div></details></div>` : ''}`;
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
  <section class="people">${lead.map(person).join('')}</section>
  <section class="grid2">
  <div class="card"><div class="card-h"><h2>ผู้ประสานงาน</h2></div><div class="contacts">${others.map(person).join('') || '<div class="empty">–</div>'}</div></div>
  <div class="card"><div class="card-h"><h2>อัปเดตข้อมูลประจำสัปดาห์ (ทุกวันจันทร์)</h2></div>
  <ol class="steps"><li>อัปเดตชีต "สถานการณ์ 10 โรค" ใน Excel รวบรวมรายงาน</li><li>Export DDS รายเคส (ได้หลายไฟล์)</li><li>เปิด <a href="tools/update.html">ศูนย์อัปเดตข้อมูล</a> → แปลงไฟล์ → ดาวน์โหลด CSV</li><li>อัปโหลด CSV ทับในโฟลเดอร์ <code>data/</code> บน GitHub → Commit</li><li>ตรวจหน้า "คุณภาพข้อมูล" แล้วดาวน์โหลดภาพ Info</li></ol>
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
  return { year: py, label: lbl, samePeriod: pick.slice(5) === cutMD, full: pick.endsWith('12-31'), rows };
}

function infoModel(dc) {
  const m = model(dc);
  const pv = prevYearSummary(m);
  return {
    prev: pv, prevChange: pv && pv.samePeriod ? pctChange(m.tot.c, pv.rows.reduce((a, r) => a + (r?.cases || 0), 0)) : null, curLabel: `พ.ศ. ${S.y} (${thDate(m.from)} – ${thDate(m.asOfEnd)})`,
    office: DB.config.office, area: distName(dc), period: periodLabel(m), weekText: m.has ? `สัปดาห์ระบาดวิทยาที่ ${m.week.week}` : '',
    cases: m.tot.c, deaths: m.tot.x, change: m.change ?? (pv && pv.samePeriod ? pctChange(m.tot.c, pv.rows.reduce((a, r) => a + (r?.cases || 0), 0)) : null), weekDelta: m.weekDelta, changeNote: 'ไม่มีข้อมูลปีก่อน', demo: S.demo,
    rows: m.per.map(r => ({ name: r.name, cases: r.cases, deaths: r.deaths, rate: r.rate, cfr: r.cfr, level: r.level })),
    summary: summaryLines(m).slice(1), source: DB.config.source_text + (m.source === 'summary' ? ' • รายงานประจำสัปดาห์ สสจ.อุบลราชธานี' : ''), asOfText: m.has ? `ข้อมูล ณ ${thDate(m.asOfEnd, false)}` : '', url: DB.config.dashboard_url, has: m.has
  };
}

function pageInfo() {
  return `<header class="hero"><div><div class="eyebrow">${esc(DB.config.office)}</div><h1>สร้างภาพ Info รายงานประจำสัปดาห์</h1><div class="sub">เลือกปี สัปดาห์ และอำเภอที่แถบด้านบน แล้วคัดลอกภาพไปวางใน PowerPoint ได้ทันที</div></div></header>
  <section class="info-wrap"><div class="card info-ctl">
    <label>ขนาดภาพ</label><select id="isize">${Object.entries(SIZES).map(([k, v]) => `<option value="${k}" ${S.size === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select>
    <button class="btn" id="copyimg">${ico('image', 16)} คัดลอกภาพ (วางใน PowerPoint ด้วย Ctrl+V)</button>
    <button class="btn ghost" id="dl">${ico('down', 16)} ดาวน์โหลด PNG (${esc(distName(S.dc))})</button>
    <button class="btn ghost" id="dlall">${ico('down', 16)} ดาวน์โหลดครบ 25 อำเภอ + จังหวัด</button>
    <div id="dlmsg" class="muted"></div>
    <p class="note">ขนาด PowerPoint 16:9 วางเต็มสไลด์พอดี • ภาพใช้ข้อมูลรวมระดับอำเภอเท่านั้น ไม่มีข้อมูลระบุตัวบุคคล (PDPA)</p>
  </div><div class="card info-prev"><canvas id="cv"></canvas></div></section>`;
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
function closeModal() { $('#modal').hidden = true; }

// ---------- render & events ----------
const RENDER = { overview: pageOverview, district: pageDistrict, trend: pageTrend, cluster: pageCluster, units: pageUnits, quality: pageQuality, measures: pageMeasures, contact: pageContact, info: pageInfo };

function applyData() {
  DB.rows = S.demo ? (DB._demo || (DB._demo = makeDemo(DB))) : REAL_ROWS;
  buildIndex(DB);
}

async function render() {
  EPI.year = S.y - 543;
  writeHash(); shell();
  const main = $('#main');
  try { main.innerHTML = (RENDER[S.page] || pageOverview)(); }
  catch (e) { console.error(e); main.innerHTML = `<div class="notice">${ico('alert')}<div><b>เกิดข้อผิดพลาดในการแสดงผล</b><br><code>${esc(e.message)}</code></div></div>`; }
  main.focus({ preventScroll: true }); window.scrollTo({ top: 0 });
  if (S.page === 'info') await drawInfo();
  document.body.classList.remove('nav-open');
}

async function drawInfo() {
  const cv = $('#cv'); if (!cv) return;
  await drawInfographic(cv, infoModel(S.dc), S.size);
}
function downloadCanvas(cv, name) { return new Promise(res => cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); res(); }, 300); }, 'image/png')); }
const fileName = dc => `10โรค_${dc === 'ALL' ? 'จังหวัด' : DB.districts.find(d => d.code === dc)?.name}_${S.yt === 'fiscal' ? 'ปีงบ' : 'ปี'}${S.y}_${model(dc).has ? 'W' + model(dc).week.week : ''}${S.demo ? '_จำลอง' : ''}.png`;

function bind() {
  document.addEventListener('input', e => { if (e.target.id === 'q') showResults(); });
  document.addEventListener('focusin', e => { if (e.target.id === 'q' && e.target.value) showResults(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); $('#qres').hidden = true; } if (e.key === 'Enter' && e.target.id === 'q') { e.preventDefault(); const r = searchFac(e.target.value); if (r[0]) selectFac(r[0].code); } });
  document.addEventListener('click', e => {
    const fb = e.target.closest('[data-fac]'); if (fb) { e.preventDefault(); e.stopImmediatePropagation(); selectFac(fb.dataset.fac); return; }
    if (e.target.closest('#facx')) { e.stopImmediatePropagation(); S.fac = ''; render(); return; }
    if (e.target.closest('#mclose2')) { e.stopImmediatePropagation(); closeModal(); return; }
    if (!e.target.closest('#qres') && e.target.id !== 'q') $('#qres').hidden = true;
    if (e.target.id === 'modal' || e.target.closest('#mclose')) { e.stopImmediatePropagation(); closeModal(); return; }
    const g = e.target.closest('[data-dc-go]'); if (g) { e.stopImmediatePropagation(); S.dc = g.dataset.dcGo; closeModal(); render(); return; }
    const pg = e.target.closest('[data-page-go]'); if (pg) { e.stopImmediatePropagation(); S.page = pg.dataset.pageGo; closeModal(); render(); return; }
  });
  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-page],[data-yt],.go-trend,.pick-dc,[data-dc],#copylink,#copysum,#copyimg,#dl,#dlall,#menuBtn');
    if (!t) return;
    if (t.id === 'menuBtn') { document.body.classList.toggle('nav-open'); return; }
    e.preventDefault();
    if (t.dataset.page) { S.page = t.dataset.page; return render(); }
    if (t.dataset.yt) { if (S.yt !== t.dataset.yt) { S.yt = t.dataset.yt; S.wk = ''; S.y = S.yt === 'fiscal' ? currentFiscalBE(Date.now()) : new Date().getFullYear() + 543; } return render(); }
    if (t.classList.contains('go-trend')) { S.d = t.dataset.d; S.page = 'trend'; return render(); }
    if (t.dataset.dc !== undefined && t.dataset.dc) { S.dc = S.dc === t.dataset.dc ? 'ALL' : t.dataset.dc; S.fac = ''; return render(); }
    if (t.id === 'copylink') { await navigator.clipboard?.writeText(location.href).catch(() => { }); t.textContent = 'คัดลอกแล้ว ✓'; return; }
    if (t.id === 'copysum') { await navigator.clipboard?.writeText(summaryLines(model()).join('\n')).catch(() => { }); t.textContent = 'คัดลอกแล้ว ✓'; return; }
    if (t.id === 'copyimg') {
      const msg = $('#dlmsg');
      try { const blob = await new Promise(r => $('#cv').toBlob(r, 'image/png')); await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); msg.textContent = 'คัดลอกภาพแล้ว ✓ ไปที่ PowerPoint แล้วกด Ctrl+V'; }
      catch { msg.textContent = 'เบราว์เซอร์นี้คัดลอกภาพไม่ได้ — ใช้ปุ่มดาวน์โหลด PNG แทน แล้วลากไฟล์ลงสไลด์'; }
      return;
    }
    if (t.id === 'dl') return downloadCanvas($('#cv'), fileName(S.dc));
    if (t.id === 'dlall') {
      const msg = $('#dlmsg'); const cv = document.createElement('canvas'); const list = ['ALL', ...DB.districts.map(d => d.code)];
      for (let i = 0; i < list.length; i++) { msg.textContent = `กำลังสร้าง ${i + 1}/${list.length} …`; await drawInfographic(cv, infoModel(list[i]), S.size); await downloadCanvas(cv, fileName(list[i])); }
      msg.textContent = `ดาวน์โหลดครบ ${list.length} ภาพ ✓ (ถ้าเบราว์เซอร์ถาม ให้กด "อนุญาตให้ดาวน์โหลดหลายไฟล์")`;
    }
  });
  document.addEventListener('change', e => {
    const id = e.target.id;
    if (id === 'fy') { S.y = +e.target.value; S.wk = ''; } else if (id === 'fwk') S.wk = e.target.value;
    else if (id === 'fdc') { S.dc = e.target.value; if (S.fac && facIndex().get(S.fac)?.dc !== S.dc) S.fac = ''; } else if (id === 'fd') S.d = e.target.value;
    else if (id === 'fdemo') { S.demo = e.target.checked; applyData(); }
    else if (id === 'isize') S.size = e.target.value; else if (id === 'srcsel') S.src = e.target.value; else return; // #q (search) ignored
    render();
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
