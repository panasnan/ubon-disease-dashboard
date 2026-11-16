// ===== Minimal .xlsx reader (first worksheet) — no external library, runs offline in the browser =====
// Supports shared strings, inline strings, numbers (dates stay as Excel serial numbers).

async function inflateRaw(bytes) {
  const ds = new DecompressionStream('deflate-raw');
  const buf = await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer();
  return new Uint8Array(buf);
}

export async function unzip(buffer, wanted) {
  const u8 = new Uint8Array(buffer), dv = new DataView(buffer);
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('ไม่ใช่ไฟล์ .xlsx ที่ถูกต้อง');
  const count = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true);
  const out = {}; const dec = new TextDecoder();
  for (let k = 0; k < count; k++) {
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
    const nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), loff = dv.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
    p += 46 + nlen + elen + clen;
    if (!wanted(name)) continue;
    const start = loff + 30 + dv.getUint16(loff + 26, true) + dv.getUint16(loff + 28, true);
    const data = u8.subarray(start, start + csize);
    out[name] = method === 0 ? data : await inflateRaw(data);
  }
  return out;
}

export const unesc = s => s.replace(/&(lt|gt|amp|quot|apos|#\d+|#x[0-9a-f]+);/gi, (m, e) => ({ lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" }[e] ?? (e[1] === 'x' || e[1] === 'X' ? String.fromCodePoint(parseInt(e.slice(2), 16)) : String.fromCodePoint(+e.slice(1)))));
const colIdx = ref => { let n = 0; for (const ch of ref) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };

export async function readXlsx(file) {
  const files = await unzip(await file.arrayBuffer(), n => n === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d+\.xml$/.test(n));
  const dec = new TextDecoder();
  const shared = [];
  if (files['xl/sharedStrings.xml']) {
    const xml = dec.decode(files['xl/sharedStrings.xml']);
    for (const m of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) shared.push(unesc(Array.from(m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g), t => t[1]).join('')));
  }
  const sheetName = Object.keys(files).filter(n => n.startsWith('xl/worksheets/')).sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)))[0];
  if (!sheetName) throw new Error('ไม่พบแผ่นงานในไฟล์');
  const xml = dec.decode(files[sheetName]);
  const rows = [];
  for (const rm of xml.matchAll(/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const row = [];
    if (rm[1]) for (const cm of rm[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[1], body = cm[2] || '';
      const ref = /\br="([A-Z]+)\d+"/.exec(attrs); const t = /\bt="(\w+)"/.exec(attrs)?.[1];
      let v = '';
      if (t === 'inlineStr') v = unesc(Array.from(body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g), x => x[1]).join(''));
      else { const vm = /<v>([\s\S]*?)<\/v>/.exec(body); v = vm ? unesc(vm[1]) : ''; if (t === 's') v = shared[+v] ?? ''; }
      row[ref ? colIdx(ref[1]) : row.length] = v;
    }
    rows.push(Array.from(row, x => x ?? ''));
  }
  while (rows.length && rows[rows.length - 1].every(v => v === '')) rows.pop();
  const header = (rows[0] || []).map(h => String(h).trim());
  const records = rows.slice(1).filter(r => r.some(v => v !== '')).map(r => Object.fromEntries(header.map((h, i) => [h, String(r[i] ?? '').trim()])));
  return { header, records };
}

function parseSheetRows(xml, shared) {
  const rows = [];
  for (const rm of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const rIdx = +(/\br="(\d+)"/.exec(rm[1])?.[1] || rows.length + 1) - 1;
    const row = [];
    if (rm[2]) for (const cm of rm[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[1], body = cm[2] || '';
      const ref = /\br="([A-Z]+)\d+"/.exec(attrs); const t = /\bt="(\w+)"/.exec(attrs)?.[1];
      let v = '';
      if (t === 'inlineStr') v = unesc(Array.from(body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g), x => x[1]).join(''));
      else { const vm = /<v>([\s\S]*?)<\/v>/.exec(body); v = vm ? unesc(vm[1]) : ''; if (t === 's') v = shared[+v] ?? ''; }
      row[ref ? colIdx(ref[1]) : row.length] = v;
    }
    rows[rIdx] = Array.from(row, x => x ?? '');
  }
  return Array.from(rows, r => r || []);
}

// all sheets with their names: [{ name, rows: [[...], ...] }] (row/column positions kept)
export async function readWorkbook(file) {
  const files = await unzip(await file.arrayBuffer(), n => n === 'xl/sharedStrings.xml' || n === 'xl/workbook.xml' || n === 'xl/_rels/workbook.xml.rels' || /^xl\/worksheets\/sheet\d+\.xml$/.test(n));
  const dec = new TextDecoder();
  const shared = [];
  if (files['xl/sharedStrings.xml']) for (const m of dec.decode(files['xl/sharedStrings.xml']).matchAll(/<si>([\s\S]*?)<\/si>/g)) shared.push(unesc(Array.from(m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g), t => t[1]).join('')));
  const rels = {}; for (const m of dec.decode(files['xl/_rels/workbook.xml.rels'] || new Uint8Array()).matchAll(/<Relationship\b[^>]*?Id="([^"]+)"[^>]*?Target="([^"]+)"/g)) rels[m[1]] = m[2].replace(/^\/?(xl\/)?/, 'xl/');
  const out = [];
  for (const m of dec.decode(files['xl/workbook.xml'] || new Uint8Array()).matchAll(/<sheet\b[^>]*?name="([^"]+)"[^>]*?r:id="([^"]+)"/g)) {
    const path = rels[m[2]]; if (!files[path]) continue;
    out.push({ name: unesc(m[1]), rows: parseSheetRows(dec.decode(files[path]), shared) });
  }
  return out;
}

// tables of a .docx: [[ [cellText, ...], ... ], ...]
export async function readDocxTables(file) {
  const files = await unzip(await file.arrayBuffer(), n => n === 'word/document.xml');
  const xml = new TextDecoder().decode(files['word/document.xml'] || new Uint8Array());
  const txt = s => unesc(s.replace(/<w:tab\/>/g, ' ').replace(/<\/w:p>/g, '\n').replace(/<w:br\/>/g, '\n').replace(/<[^>]+>/g, '')).replace(/[ \t]+/g, ' ').trim();
  return Array.from(xml.matchAll(/<w:tbl>([\s\S]*?)<\/w:tbl>/g), t => Array.from(t[1].matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/g), r => Array.from(r[0].matchAll(/<w:tc>([\s\S]*?)<\/w:tc>/g), c => txt(c[1]))));
}
