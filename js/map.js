// ===== District map: real GeoJSON if data/ubon_districts.geojson exists, otherwise tile-grid =====
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// match a GeoJSON feature to a district by code (e.g. "3401", "TH3401") or Thai name anywhere in properties
export function matchFeature(f, districts) {
  const vals = Object.values(f.properties || {}).map(v => String(v));
  for (const d of districts) if (vals.some(v => v === d.code || v.endsWith(d.code) || v === d.code + '00')) return d;
  const clean = s => s.replace(/^อำเภอ|^อ\./, '').replace(/\s/g, '');
  for (const d of districts) if (vals.some(v => clean(v) === clean(d.name))) return d;
  return null;
}

export function renderMap(db, colorOf, labelOf, selected, opts = {}) {
  if (db.geo?.features?.length) return geoMap(db, colorOf, labelOf, selected);
  if (db.mapSvg?.districts?.length) return svgMap(db, colorOf, labelOf, selected, opts);
  const cell = 74, gap = 6;
  const W = 7 * (cell + gap), H = 6 * (cell + gap);
  const tiles = db.districts.map(d => {
    const x = d.gx * (cell + gap), y = d.gy * (cell + gap);
    const short = d.name.replace('อุบลราชธานี', '').replace('ชำราบ', '').replace('มังสาหาร', '').replace('พืชผล', '');
    return `<g class="tile${selected === d.code ? ' sel' : ''}" data-dc="${d.code}" tabindex="0" role="button" aria-label="${esc(d.name)}">
      <rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="12" fill="${colorOf(d.code)}"/>
      <text x="${x + cell / 2}" y="${y + 30}" text-anchor="middle" class="t1">${esc(short)}</text>
      <text x="${x + cell / 2}" y="${y + 52}" text-anchor="middle" class="t2">${esc(labelOf(d.code))}</text>
      <title>${esc(d.name)}: ${esc(labelOf(d.code))}</title></g>`;
  }).join('');
  return `<svg class="map" viewBox="-4 -4 ${W + 8} ${H + 8}">${tiles}</svg><p class="note">แผนผังอำเภอโดยประมาณ — วางไฟล์ <code>data/ubon_districts.geojson</code> เพื่อแสดงแผนที่จริงอัตโนมัติ</p>`;
}

function geoMap(db, colorOf, labelOf, selected) {
  const feats = db.geo.features;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const each = (g, fn) => { const walk = c => typeof c[0] === 'number' ? fn(c) : c.forEach(walk); walk(g.coordinates); };
  feats.forEach(f => f.geometry && each(f.geometry, ([x, y]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }));
  const k = Math.cos((minY + maxY) / 2 * Math.PI / 180);
  const W = 560, s = W / ((maxX - minX) * k), H = (maxY - minY) * s;
  const P = ([x, y]) => [((x - minX) * k * s).toFixed(1), ((maxY - y) * s).toFixed(1)];
  const ring = r => 'M' + r.map(P).join('L') + 'Z';
  const path = g => g.type === 'Polygon' ? g.coordinates.map(ring).join('') : g.type === 'MultiPolygon' ? g.coordinates.map(p => p.map(ring).join('')).join('') : '';
  let unmatched = 0;
  const shapes = feats.map(f => {
    const d = matchFeature(f, db.districts); if (!d) unmatched++;
    const code = d?.code || '';
    return `<path d="${path(f.geometry || {})}" fill="${d ? colorOf(code) : '#E3E9F3'}" class="geo${selected === code ? ' sel' : ''}" data-dc="${code}"><title>${esc(d?.name || 'ไม่พบชื่ออำเภอที่ตรงกัน')}${d ? ': ' + esc(labelOf(code)) : ''}</title></path>`;
  }).join('');
  return `<svg class="map" viewBox="-4 -4 ${W + 8} ${H + 8}">${shapes}</svg>${unmatched ? `<p class="note warn">มี ${unmatched} รูปในแผนที่ที่จับคู่กับอำเภอไม่ได้ — ตรวจรหัส/ชื่ออำเภอใน properties ของ GeoJSON</p>` : ''}`;
}

// map converted from UBON_Shape_MAP (pptx) → data/map_districts.json
const centroidCache = new Map();
export function centroid(d) {
  if (centroidCache.has(d)) return centroidCache.get(d);
  let best = null;
  for (const ring of d.split('Z')) {
    const pts = Array.from(ring.matchAll(/(-?[\d.]+),(-?[\d.]+)/g), m => [+m[1], +m[2]]); if (pts.length < 3) continue;
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; const f = x0 * y1 - x1 * y0; a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f; }
    if (Math.abs(a) > (best?.a || 0)) best = { a: Math.abs(a), x: cx / (3 * a), y: cy / (3 * a) };
  }
  centroidCache.set(d, best); return best;
}
const LABEL_NUDGE = { '3424': [0, 8], '3431': [0, -6], '3432': [0, 4] };
function svgMap(db, colorOf, labelOf, selected, { light, tipOf } = {}) {
  const [x0, y0, w, h] = db.mapSvg.viewBox;
  const shapes = db.mapSvg.districts.map(o => `<path d="${o.d}" fill="${colorOf(o.code)}" class="geo${selected === o.code ? ' sel' : ''}" data-dc="${o.code}" tabindex="0" role="button" aria-label="${esc(o.name)}"${tipOf ? ` data-tip="${esc(tipOf(o.code))}"` : ''}>${tipOf ? '' : `<title>${esc(o.name)}: ${esc(labelOf(o.code))}</title>`}</path>`).join('');
  const labels = db.mapSvg.districts.map(o => { const c = centroid(o.d); if (!c) return ''; const [dx, dy] = LABEL_NUDGE[o.code] || [0, 0];
    return `<g class="lbl" transform="translate(${(c.x + dx).toFixed(1)},${(c.y + dy).toFixed(1)})"><text y="-2" text-anchor="middle" class="m1">${esc(o.name.replace('อุบลราชธานี', ''))}</text><text y="14" text-anchor="middle" class="m2">${esc(labelOf(o.code))}</text></g>`; }).join('');
  return `<svg class="map real" viewBox="${x0 - 6} ${y0 - 6} ${w + 12} ${h + 12}">${shapes}${labels}</svg>`;
}
