// ===== Data layer: CSV parsing, epi weeks, loading, aggregation, integrity checks =====

export function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const rows = []; let row = []; let f = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(f); f = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(f); f = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else f += ch;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  if (!rows.length) return { header: [], records: [] };
  const header = rows[0].map(h => h.trim());
  const records = rows.slice(1).map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
  return { header, records };
}

export function toCSV(header, records) {
  const esc = v => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  return [header.join(','), ...records.map(r => header.map(h => esc(r[h])).join(','))].join('\n') + '\n';
}

// ---- dates (all UTC, day precision) ----
const DAY = 86400000;
export const ymd = d => new Date(d).toISOString().slice(0, 10);
export function parseISO(s) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN; }
export function sundayOf(t) { const d = new Date(t).getUTCDay(); return t - d * DAY; }

// Thai epidemiological week (กองระบาดวิทยา): weeks run Sunday–Saturday, week 1 starts on 1 January
// and ends on the first Saturday; the last week is cut at 31 December (e.g. 2569: W1 = 1–3 ม.ค., W53 = 27–31 ธ.ค.).
// A Sunday week that spans New Year therefore belongs to both years: pass the reporting year (ค.ศ.) to choose.
export const EPI = { year: null }; // reporting-year context set by the dashboard (ค.ศ.)
export function epiWeek(t, yearCE = EPI.year) {
  const s = sundayOf(t);
  let y = yearCE ?? new Date(t).getUTCFullYear();
  const w1 = y => sundayOf(Date.UTC(y, 0, 1));
  if (s < w1(y) || s > Date.UTC(y, 11, 31)) y = new Date(s + (s < w1(y) ? 6 : 0) * DAY).getUTCFullYear(); // outside the context year
  return { year: y, week: Math.floor((s - w1(y)) / (7 * DAY)) + 1, start: s, from: Math.max(s, Date.UTC(y, 0, 1)), to: Math.min(s + 6 * DAY, Date.UTC(y, 11, 31)) };
}

const TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export function thDate(t, short = true) {
  if (!isFinite(t)) return '–';
  const d = new Date(t);
  return `${d.getUTCDate()} ${TH_MONTH[d.getUTCMonth()]} ${short ? String(d.getUTCFullYear() + 543).slice(2) : d.getUTCFullYear() + 543}`;
}

// period [from, to] in ms for a given year type and Buddhist year
export function periodRange(type, yearBE) {
  const ce = yearBE - 543;
  if (type === 'fiscal') return [Date.UTC(ce - 1, 9, 1), Date.UTC(ce, 8, 30)];
  return [Date.UTC(ce, 0, 1), Date.UTC(ce, 11, 31)];
}
export function currentFiscalBE(t) { const d = new Date(t); return d.getUTCFullYear() + 543 + (d.getUTCMonth() >= 9 ? 1 : 0); }

// which fiscal / calendar year a row belongs to: explicit column (from onset date) else the week's Wednesday
export function yearOf(r, type) {
  if (type === 'fiscal') return r.fy || currentFiscalBE(r.t + 3 * DAY);
  return r.cy || new Date(r.t + 3 * DAY).getUTCFullYear() + 543;
}

// ---- formatting ----
export const fmt = (n, dp = 0) => (n == null || !isFinite(n)) ? '–' : Number(n).toLocaleString('th-TH', { minimumFractionDigits: dp, maximumFractionDigits: dp });
export const rate = (c, pop) => pop ? c / pop * 100000 : null;
export const cfr = (d, c) => c ? d / c * 100 : 0;
export const pctChange = (a, b) => b ? (a - b) / b * 100 : null;

// friendly (no file extension) names for messages shown on the dashboard
const FRIENDLY = { 'summary_province.csv': 'รายงานประจำสัปดาห์ (Excel)', 'districts.csv': 'ข้อมูลอำเภอ', 'baseline_5y.csv': 'ค่ามัธยฐาน 5 ปี', 'units.csv': 'รายชื่อหน่วยบริการ', 'unit_quality.csv': 'ผลการรายงานรายหน่วย', 'mebs_events.csv': 'ทะเบียนเหตุการณ์', 'contacts.csv': 'ผู้ประสานงาน', 'troubleshoot.csv': 'วิธีแก้ปัญหา', 'dds_district.csv': 'ผลงาน DDS รายอำเภอ', 'facility_dds.csv': 'ความครอบคลุมรายสถานพยาบาล', 'facility_types.csv': 'ความครอบคลุมตามประเภท', 'facility_verify.csv': 'ผลตรวจสอบสถานพยาบาลจากอำเภอ', 'dds_status.csv': 'สถานะรายงาน DDS', 'deaths_register.csv': 'ทะเบียนผู้เสียชีวิต (รายงานด้วยตนเอง)', 'revisions.csv': 'บันทึกการแก้ไขย้อนหลัง', 'map_districts.json': 'แผนที่อำเภอ', 'config.json': 'การตั้งค่าระบบ' };
export const friendly = f => { f = String(f).replace(/^data\//, ''); const m = /^weekly_(\d{4})\.csv$/.exec(f); return m ? `DDS รายเคส ปีงบ ${m[1]}` : FRIENDLY[f] || f.replace(/\.[a-z]+$/, ''); };

// ---- loading ----
async function getText(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.text();
}

export async function loadAll() {
  const issues = [];
  const out = { issues, loaded: [] };
  out.config = JSON.parse(await getText('data/config.json'));
  const csv = async (name, required) => {
    try { const p = parseCSV(await getText('data/' + name)); out.loaded.push({ file: name, rows: p.records.length }); return p.records; }
    catch (e) { if (required) issues.push({ level: 'red', msg: `โหลด${friendly(name)}ไม่ได้ (${e.message})` }); else out.loaded.push({ file: name, rows: 0, missing: true }); return []; }
  };
  out.districts = (await csv('districts.csv', true)).map(r => ({ code: r.district_code, name: r.district_name, pop: +r.population || 0, zone: r.zone || '', gx: +r.grid_x, gy: +r.grid_y }));
  out.summary = await csv('summary_province.csv');
  out.baselineRows = await csv('baseline_5y.csv');
  out.units = await csv('units.csv');
  out.unitQuality = await csv('unit_quality.csv');
  out.mebs = await csv('mebs_events.csv');
  out.contacts = await csv('contacts.csv');
  out.troubles = await csv('troubleshoot.csv');
  out.ddsDistrict = await csv('dds_district.csv');
  out.facilities = await csv('facility_dds.csv');
  out.facilityTypes = await csv('facility_types.csv');
  out.facilityVerify = await csv('facility_verify.csv');
  out.ddsStatus = (await csv('dds_status.csv')).slice(-1)[0] || null;
  out.deathReg = await csv('deaths_register.csv');
  out.revisions = await csv('revisions.csv');
  try { out.mapSvg = JSON.parse(await getText('data/map_districts.json')); out.loaded.push({ file: 'map_districts.json', rows: out.mapSvg.districts.length }); } catch { out.mapSvg = null; }
  out.weeklyRaw = [];
  for (const f of out.config.weekly_files || []) {
    try {
      const p = parseCSV(await getText(f));
      out.loaded.push({ file: f.replace('data/', ''), rows: p.records.length });
      p.records.forEach((r, i) => { r._file = f; r._line = i + 2; out.weeklyRaw.push(r); });
    } catch (e) { issues.push({ level: 'red', msg: `โหลด${friendly(f)}ไม่ได้ (${e.message}) — ตรวจการตั้งค่าระบบ` }); }
  }
  try { out.geo = JSON.parse(await getText('data/ubon_districts.geojson')); out.loaded.push({ file: 'ubon_districts.geojson', rows: out.geo.features?.length || 0 }); }
  catch { out.geo = null; }
  return out;
}

// ---- normalise & validate weekly rows ----
export function prepare(db) {
  const { config, districts, issues } = db;
  const dIds = new Set(config.diseases.map(d => d.id));
  const dCodes = new Set([...districts.map(d => d.code), config.out_of_province_code || '9999']);
  const seen = new Map();
  db.rows = [];
  let bad = 0;
  for (const r of db.weeklyRaw) {
    const where = `${friendly(r._file)} แถวที่ ${r._line}`;
    const t = parseISO(r.week_start);
    const c = Number(r.cases || 0), x = Number(r.deaths || 0);
    let err = null;
    if (!isFinite(t)) err = `วันที่ week_start "${r.week_start}" ไม่ใช่รูปแบบ ปปปป-ดด-วว (ค.ศ.)`;
    else if (new Date(t).getUTCDay() !== 0) err = `week_start ${r.week_start} ไม่ใช่วันอาทิตย์ (สัปดาห์ระบาดวิทยาเริ่มวันอาทิตย์)`;
    else if (!dIds.has(r.disease_id)) err = `รหัสโรค "${r.disease_id}" ไม่มีในการตั้งค่า 10 โรค`;
    else if (!dCodes.has(r.district_code)) err = `รหัสอำเภอ "${r.district_code}" ไม่ตรงกับรายชื่อ 25 อำเภอ`;
    else if (!Number.isInteger(c) || c < 0 || !Number.isInteger(x) || x < 0) err = `จำนวนป่วย/ตายต้องเป็นจำนวนเต็ม ≥ 0`;
    else if (x > c) err = `จำนวนตาย (${x}) มากกว่าจำนวนป่วย (${c})`;
    if (err) { bad++; if (bad <= 30) issues.push({ level: 'red', msg: `${where}: ${err} — ไม่นำมาคำนวณ` }); continue; }
    const fy = +r.fiscal_year_be || 0, cy = +r.year_be || 0;
    if (fy && (fy < currentFiscalBE(t) || fy > currentFiscalBE(t + 6 * DAY))) issues.push({ level: 'orange', msg: `${where}: fiscal_year_be ${fy} ไม่ตรงกับสัปดาห์ ${r.week_start}` });
    const key = [r.week_start, r.disease_id, r.district_code, r.subdistrict, r.age_group, r.sex, fy, cy].join('|');
    if (seen.has(key)) { issues.push({ level: 'orange', msg: `${where}: ซ้ำกับ ${seen.get(key)} (สัปดาห์/โรค/พื้นที่/อายุ/เพศ เดียวกัน) — นับรวมทั้งสองแถว โปรดตรวจ` }); }
    else seen.set(key, where);
    db.rows.push({ t, d: r.disease_id, dc: r.district_code, sd: r.subdistrict || '', ag: r.age_group || '', sx: r.sex || '', c, x, fy, cy });
  }
  if (bad > 30) issues.push({ level: 'red', msg: `…และอีก ${bad - 30} แถวที่ผิดรูปแบบ` });
  const future = db.rows.filter(r => r.t > Date.now() + 7 * DAY).length;
  if (future) issues.push({ level: 'orange', msg: `มี ${future} แถวที่สัปดาห์อยู่ในอนาคต — ตรวจปี พ.ศ./ค.ศ.` });

  // population
  const popSum = districts.reduce((s, d) => s + d.pop, 0);
  db.hasDistrictPop = districts.every(d => d.pop > 0);
  if (!db.hasDistrictPop) issues.push({ level: 'yellow', msg: 'ยังไม่มีประชากรรายอำเภอครบ — อัตราป่วยรายอำเภอจะแสดง "–"' });
  db.popTotal = db.hasDistrictPop ? popSum : config.population_total;
  if (db.hasDistrictPop && config.population_total && Math.abs(popSum - config.population_total) / config.population_total > 0.02)
    issues.push({ level: 'yellow', msg: `ผลรวมประชากรรายอำเภอ (${fmt(popSum)}) ต่างจากประชากรรวมจังหวัด (${fmt(config.population_total)}) เกิน 2% — ใช้ผลรวมรายอำเภอ` });

  // summary integrity (province table from slide)
  for (const s of db.summary) {
    const c = +s.cases, x = +s.deaths;
    if (x > c) issues.push({ level: 'red', msg: `รายงานประจำสัปดาห์ ${s.period_label}: ${s.disease_id} ตาย > ป่วย` });
    if (s.note) issues.push({ level: 'yellow', msg: `รายงานประจำสัปดาห์ ${s.period_label}: ${config.diseases.find(d => d.id === s.disease_id)?.name || s.disease_id} — ${s.note}` });
    const dn = config.diseases.find(d => d.id === s.disease_id)?.name || s.disease_id;
    if (s.reported_rate !== '' && s.reported_rate != null && config.population_total) { const rc = c / config.population_total * 1e5; if (Math.abs(+s.reported_rate - rc) > 0.01) issues.push({ level: 'orange', msg: `Excel รวบรวมรายงาน (${s.date_to}): อัตราป่วย${dn}ในชีต ${(+s.reported_rate).toFixed(2)} แต่คำนวณได้ ${rc.toFixed(2)} — แดชบอร์ดใช้ค่าที่คำนวณใหม่` }); }
    if (s.reported_cfr !== '' && s.reported_cfr != null && c) { const fc = x / c * 100; if (Math.abs(+s.reported_cfr - fc) > 0.01) issues.push({ level: 'orange', msg: `Excel รวบรวมรายงาน (${s.date_to}): CFR ${dn} ในชีต ${(+s.reported_cfr).toFixed(2)}% แต่คำนวณได้ ${fc.toFixed(2)}%` }); }
  }

  // baseline
  db.baseline = new Map();
  for (const b of db.baselineRows) db.baseline.set(`${b.disease_id}|${b.district_code || 'ALL'}|${+b.epi_week}`, +b.median_5y);

  buildIndex(db);
  db.dataEnd = Math.min(Date.now(), isFinite(db.maxT) ? db.maxT + 6 * DAY : Infinity);
  if (db.config.data_as_of) { const t = parseISO(db.config.data_as_of); if (isFinite(t) && t >= db.maxT && t <= db.maxT + 6 * DAY) db.dataEnd = t; }
  return db;
}

// fast index: week|disease|district (with ALL roll-ups)
export function buildIndex(db) {
  const idx = new Map();
  for (const r of db.rows) for (const d of [r.d, 'ALL']) for (const dc of [r.dc, 'ALL']) {
    const k = r.t + '|' + d + '|' + dc; const v = idx.get(k); if (v) { v.c += r.c; v.x += r.x; } else idx.set(k, { c: r.c, x: r.x });
  }
  db.idx = idx; db._hist = null;
  db.maxT = db.rows.length ? db.rows.reduce((m, r) => r.t > m ? r.t : m, -Infinity) : NaN;
}
export function cell(db, t, d, dc) { return db.idx.get(t + '|' + d + '|' + dc) || { c: 0, x: 0 }; }

// sum helper
export function agg(rows, pred) { let c = 0, x = 0; for (const r of rows) if (pred(r)) { c += r.c; x += r.x; } return { c, x }; }

export function median(a) { if (!a.length) return null; const s = [...a].sort((p, q) => p - q); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

// weekly series map: weekStart -> cases for (disease, district|ALL)
export function weeklySeries(rows, disease, district) {
  const m = new Map();
  for (const r of rows) {
    if (disease !== 'ALL' && r.d !== disease) continue;
    if (district !== 'ALL' && r.dc !== district) continue;
    m.set(r.t, (m.get(r.t) || 0) + r.c);
  }
  return m;
}

// 5-year median for an epi week: file first, else computed from history (needs >=3 prior years)
export function baselineFor(db, disease, district, ew, endYear) {
  const ids = disease === 'ALL' ? db.config.diseases.map(d => d.id) : [disease];
  let total = 0, have = 0;
  for (const id of ids) {
    const k = `${id}|${district}|${ew}`;
    if (db.baseline.has(k)) { total += db.baseline.get(k); have++; continue; }
    if (district === 'ALL') { // sum district medians if file has them
      let s = 0, n = 0;
      for (const d of db.districts) { const kk = `${id}|${d.code}|${ew}`; if (db.baseline.has(kk)) { s += db.baseline.get(kk); n++; } }
      if (n === db.districts.length) { total += s; have++; continue; }
    }
    const hist = db._hist || (db._hist = buildHist(db.rows));
    const vals = [];
    for (let y = endYear - 5; y < endYear; y++) { const v = hist.get(`${id}|${district}|${y}|${ew}`); if (v !== undefined || hist.has(`yr|${y}`)) vals.push(v || 0); }
    if (vals.length >= 3) { total += median(vals); have++; }
  }
  return have === ids.length ? total : null;
}
function buildHist(rows) {
  const h = new Map();
  for (const r of rows) {
    const e = epiWeek(r.t, r.cy ? r.cy - 543 : null);
    h.set(`yr|${e.year}`, 1);
    for (const dc of [r.dc, 'ALL']) { const k = `${r.d}|${dc}|${e.year}|${e.week}`; h.set(k, (h.get(k) || 0) + r.c); }
  }
  return h;
}

// alert level from ratio of recent cases to baseline
export const LEVELS = { green: 0, yellow: 1, orange: 2, red: 3, nobase: -1, none: -2 };
export function alertLevel(db, disease, district, asOf) {
  const A = db.config.alert, W = A.window_weeks || 4;
  const end = sundayOf(asOf);
  let recent = 0, deaths = 0, base = 0, baseOk = true;
  for (let i = 0; i < W; i++) {
    const ws = end - i * 7 * DAY;
    const a = cell(db, ws, disease, district);
    recent += a.c; deaths += a.x;
    const e = epiWeek(ws);
    const b = baselineFor(db, disease, district, e.week, e.year);
    if (b == null) baseOk = false; else base += b;
  }
  const dz = db.config.diseases.find(d => d.id === disease);
  let level = 'green', ratio = null;
  if (!baseOk) level = recent ? 'nobase' : 'green';
  else { ratio = recent / Math.max(base, 1); /* baseline < 1: compare with 1 to avoid ∞ */ level = ratio > A.ratio_red ? 'red' : ratio > A.ratio_orange ? 'orange' : ratio > A.ratio_yellow ? 'yellow' : 'green'; }
  const bump = l => { if (LEVELS[l] > LEVELS[level] || level === 'nobase') level = l; };
  if (deaths && A.death_min_level) bump(A.death_min_level);
  if (dz?.any_case_red && recent) bump('red');
  return { level, ratio, recent, base: baseOk ? base : null, deaths };
}

// clusters: >= N cases same disease + subdistrict within incubation window, ending in last W weeks
export function detectClusters(db, asOf) {
  const out = []; const A = db.config.alert; const N = A.cluster_min_cases || 2;
  const end = sundayOf(asOf), W = A.window_weeks || 4;
  const bySd = new Map();
  for (const r of db.rows) { if (!r.sd) continue; const k = `${r.d}|${r.dc}|${r.sd}`; if (!bySd.has(k)) bySd.set(k, new Map()); const m = bySd.get(k); m.set(r.t, (m.get(r.t) || 0) + r.c); }
  for (const [k, m] of bySd) {
    const [d, dc, sd] = k.split('|');
    const dz = db.config.diseases.find(z => z.id === d);
    const need = dz?.cluster_min ?? N; if (!need) continue;
    const win = Math.max(1, Math.ceil((dz?.incubation_days || 7) / 7));
    let best = null;
    for (let i = 0; i < W; i++) {
      const we = end - i * 7 * DAY; let s = 0, first = null, last = null;
      for (let j = 0; j < win; j++) { const t = we - j * 7 * DAY; const v = m.get(t) || 0; if (v) { s += v; last = last ?? t; first = t; } }
      if (s >= need && (!best || s > best.cases)) best = { d, dc, sd, cases: s, first, last, win };
    }
    if (best) {
      // same disease + district, event onset within the cluster window (subdistrict names in MEBS vs codes in DDS can differ)
      const ev = db.mebs.find(e => e.disease_id === d && e.district_code === dc && (() => { const t = parseISO(e.first_onset); return isFinite(t) && t >= best.first - 7 * DAY * best.win && t <= best.last + 7 * DAY * (best.win + 1); })());
      best.mebs = ev || null;
      out.push(best);
    }
  }
  return out.sort((a, b) => b.cases - a.cases);
}

// ---- demo data (clearly labelled) ----
export function makeDemo(db) {
  let seed = 20261116; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const pois = l => { if (l > 30) return Math.max(0, Math.round(l + Math.sqrt(l) * (rnd() + rnd() + rnd() - 1.5) * 1.4)); let L = Math.exp(-l), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
  const annual = { flu: 30000, pneumonia: 17000, foodpoison: 9000, hfmd: 3300, dhf: 1400, mushroom: 900, melioid: 320, lepto: 160, ssuis: 6, rabies: 0.4 };
  const cfrD = { flu: 0.0002, pneumonia: 0.003, foodpoison: 0, hfmd: 0.0002, dhf: 0.001, mushroom: 0.002, melioid: 0.01, lepto: 0.015, ssuis: 0.25, rabies: 1 };
  const peak = { flu: [0, 7, 8], pneumonia: [0, 1, 8, 9], foodpoison: [2, 3, 4], hfmd: [5, 6, 7], dhf: [5, 6, 7, 8], mushroom: [4, 5, 6], melioid: [6, 7, 8, 9], lepto: [7, 8, 9], ssuis: [3, 4], rabies: [] };
  const rows = []; const now = Date.now();
  const start = sundayOf(Date.UTC(2021, 9, 3)), end = sundayOf(now) - 7 * DAY;
  const wD = db.districts.map((d, i) => d.code === '3401' ? 3 : d.code === '3415' ? 1.8 : 0.6 + ((i * 37) % 10) / 10);
  const wSum = wD.reduce((a, b) => a + b, 0);
  for (let t = start; t <= end; t += 7 * DAY) {
    const mo = new Date(t + 3 * DAY).getUTCMonth();
    const recentFY = t >= Date.UTC(2026, 9, 1) - 8 * 7 * DAY;
    for (const [d, ann] of Object.entries(annual)) {
      const seas = peak[d].includes(mo) ? 1.9 : 0.75;
      db.districts.forEach((dist, i) => {
        let lam = ann / 52 * seas * wD[i] / wSum;
        if (recentFY && d === 'dhf' && dist.code === '3415') lam *= 4; // demo outbreak
        if (recentFY && d === 'flu' && dist.code === '3407') lam *= 2.5;
        const c = pois(lam); if (!c) return;
        let x = 0; for (let k = 0; k < c; k++) if (rnd() < cfrD[d]) x++;
        if (recentFY) {
          let rem = c, rx = x;
          for (let s = 1; s <= 3 && rem; s++) { const cc = s === 3 ? rem : Math.round(rem * rnd()); if (!cc) continue; const xx = Math.min(rx, cc); rx -= xx; rem -= cc; rows.push({ t, d, dc: dist.code, sd: `ต.ตัวอย่าง ${s}`, ag: '', sx: '', c: cc, x: xx }); }
        } else rows.push({ t, d, dc: dist.code, sd: '', ag: '', sx: '', c, x });
      });
    }
  }
  return rows;
}
