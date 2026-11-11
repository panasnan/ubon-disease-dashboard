# ubon-disease-dashboard
<!DOCTYPE html>
<html lang="th"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>สถานการณ์ 10 โรคเฝ้าระวัง จ.อุบลราชธานี</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--bg:#eef3fb;--card:#fff;--tx:#1b2a41;--mut:#66758c;--bd:#d9e2f0;--pri:#2563eb;--hd1:#0f2a7a;--hd2:#2563eb;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0d1526;--card:#15213a;--tx:#e6edf8;--mut:#93a3bd;--bd:#2a3a58;--pri:#6c9cff}}
:root[data-theme="dark"]{--bg:#0d1526;--card:#15213a;--tx:#e6edf8;--mut:#93a3bd;--bd:#2a3a58;--pri:#6c9cff}
*{box-sizing:border-box}html{scroll-padding-top:env(safe-area-inset-top,0px)}
body{margin:0;background:var(--bg);color:var(--tx);font-family:'Sarabun',system-ui,sans-serif}
.top{background:#0b1d52;color:#cfe0ff;font-size:.78rem;padding:6px 20px}
header{background:linear-gradient(135deg,var(--hd1),var(--hd2));color:#fff;padding:20px}
h1{margin:0;font-size:1.6rem;font-weight:800}header p{margin:6px 0 0;opacity:.85;font-size:.9rem}
main{max-width:1180px;margin:auto;padding:16px}
.bar{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin-bottom:16px}
label{font-size:.8rem;color:var(--mut);display:flex;flex-direction:column;gap:3px}
input,select,textarea,button{font:inherit;padding:8px 11px;border:1px solid var(--bd);border-radius:10px;background:var(--card);color:var(--tx)}
button{cursor:pointer;background:var(--pri);color:#fff;border:0}button.g{background:var(--card);color:var(--tx);border:1px solid var(--bd)}
h2.s{font-size:1.25rem;margin:22px 0 10px;padding-left:10px;border-left:5px solid var(--pri)}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}
.k{border-radius:16px;overflow:hidden;background:var(--card);border:1px solid var(--bd);box-shadow:0 6px 18px rgba(30,60,140,.12)}
.k .h{padding:12px 14px;color:#fff;font-weight:700}.k .h small{display:block;font-weight:400;opacity:.9}
.k .b{padding:14px;text-align:center;min-height:150px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:6px}
.big{font-size:3.2rem;font-weight:800;line-height:1}.u{color:var(--mut);font-size:.85rem}
.r{background:linear-gradient(135deg,#b91c1c,#ef4444)}.g1{background:linear-gradient(135deg,#047857,#22c55e)}.p{background:linear-gradient(135deg,#6d28d9,#a855f7)}.y{background:linear-gradient(135deg,#d97706,#facc15);color:#3b2400!important}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}.pair div{border:2px solid var(--bd);border-radius:10px;padding:6px}.pair b{font-size:1.7rem;display:block}
.chips{display:flex;flex-wrap:wrap;gap:5px;justify-content:center}.chip{font-size:.75rem;padding:2px 8px;border:1px solid #a855f7;border-radius:6px;color:#a855f7}
.box{background:var(--card);border:1px solid var(--bd);border-radius:14px;padding:14px;margin-bottom:14px}
.sc{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:680px}
th,td{padding:8px 10px;border-bottom:1px solid var(--bd);text-align:right}th:first-child,td:first-child{text-align:left}th{font-size:.8rem;color:var(--mut)}
.tag{padding:2px 9px;border-radius:99px;font-size:.78rem;color:#fff}.up{background:#dc2626}.ok{background:#16a34a}
details{color:var(--mut);font-size:.85rem}textarea{width:100%;height:150px;margin:8px 0;font-family:monospace}
.lg{font-size:.8rem;color:var(--mut);margin-top:6px}
@media print{.noprint{display:none}}
</style></head><body>
<div class="top">🛡️ กลุ่มงานควบคุมโรคติดต่อ สำนักงานสาธารณสุขจังหวัดอุบลราชธานี · ระบบ M-EBS / รง.506 · ข้อมูลตัวอย่าง</div>
<header><h1>รายงานสถานการณ์ 10 โรคเฝ้าระวัง จังหวัดอุบลราชธานี</h1><p id="sub"></p></header>
<main>
<div class="bar noprint">
<label>ปี พ.ศ.<input id="yr" type="number" value="2569" style="width:90px"></label>
<label>สัปดาห์ที่<input id="wk" type="number" value="45" style="width:80px"></label>
<label>ประชากรกลางปี<input id="pop" type="number" value="1880000" style="width:130px"></label>
<label>โรค (กราฟแนวโน้ม)<select id="sel" onchange="render()"></select></label>
<button onclick="render()">อัปเดต</button><button class="g" onclick="print()">พิมพ์ / PDF</button>
</div>
<h2 class="s">ข้อมูลผู้ป่วย</h2><div class="cards" id="cards"></div>
<h2 class="s">01 แนวโน้มเป็นอย่างไร</h2>
<div class="box"><b id="tt"></b><svg id="ln" width="100%" viewBox="0 0 900 280"></svg>
<div class="lg">━ ปีนี้ (น้ำเงิน) &nbsp; ┅ ค่ามัธยฐานย้อนหลัง 5 ปี (ส้ม) &nbsp; ┅ ปีก่อน (เขียว)</div></div>
<h2 class="s">02 เปรียบเทียบรายโรค</h2>
<div class="box"><div class="sc"><svg id="ch" width="100%" viewBox="0 0 900 300"></svg></div></div>
<div class="box"><div class="sc"><table id="tb"></table></div></div>
<details class="box noprint" open><summary>⚙️ นำเข้าข้อมูลจริง (วางจาก Excel/CSV)</summary>
<p>รูปแบบ: <code>โรค,ผู้ป่วยสะสม,ตาย,มัธยฐาน5ปี,ผู้ป่วยสัปดาห์นี้,ผู้ป่วยเดือนนี้</code></p>
<textarea id="ta"></textarea><button onclick="load()">โหลดข้อมูล</button></details>
</main>
<script>
let D=[["ไข้เลือดออก",500,2,380,4,12],["ไข้หวัดใหญ่",2100,1,1800,60,210],["มือเท้าปาก",310,0,260,5,20],["อุจจาระร่วง",9800,0,10400,190,780],["ปอดบวม",1450,12,1500,25,110],["สุกใส",620,0,540,12,45],["ไข้ฉี่หนู",85,3,70,2,6],["ตาแดง",410,0,450,6,35],["ไข้สมองอักเสบ",9,1,7,0,1],["โควิด-19",760,5,690,18,70]];
const f=n=>n.toLocaleString('th-TH'),r2=(a,b)=>(a/b*1e5).toFixed(2);
const wave=(t,w,ph)=>Math.max(0,Math.round(t/w*(1+.45*Math.sin((x=>x)(0)+ph))));
function series(tot,W,ph,k){return Array.from({length:W},(_,i)=>Math.max(0,Math.round(tot/W*k*(1+.5*Math.sin((i+ph)/6)))))}
function render(){
 const P=+pop.value||1,W=+wk.value||1,T=D.reduce((s,d)=>s+d[1],0),M=D.reduce((s,d)=>s+d[2],0),WK=D.reduce((s,d)=>s+d[4],0),MO=D.reduce((s,d)=>s+d[5],0),up=D.filter(d=>d[1]>d[3]);
 sub.textContent=`ปีระบาดวิทยา พ.ศ. ${yr.value} | สัปดาห์ที่ ${W}`;
 cards.innerHTML=`
 <div class="k"><div class="h r">ผู้ป่วยสัปดาห์นี้<small>สัปดาห์ที่ ${W}</small></div><div class="b"><div class="big" style="color:#dc2626">${f(WK)}</div><div class="u">ราย</div></div></div>
 <div class="k"><div class="h g1">ผู้ป่วยสะสมทั้งปี</div><div class="b"><div class="pair"><div><b style="color:#16a34a">${f(T)}</b><span class="u">ราย</span></div><div><b style="color:#dc2626">${f(M)}</b><span class="u">เสียชีวิต</span></div></div><div class="u">อัตราป่วย ${r2(T,P)} ต่อแสน ปชก.</div></div></div>
 <div class="k"><div class="h p">โรคสูงกว่ามัธยฐาน<small>เทียบ 5 ปีย้อนหลัง</small></div><div class="b"><div class="big" style="color:#a855f7">${up.length}</div><div class="u">จาก ${D.length} โรค</div><div class="chips">${up.slice(0,6).map(d=>`<span class="chip">${d[0]}</span>`).join('')}</div></div></div>
 <div class="k"><div class="h y">ผู้ป่วยเดือนนี้</div><div class="b"><div class="big" style="color:#b45309">${f(MO)}</div><div class="u">ราย</div></div></div>`;
 if(!sel.options.length)sel.innerHTML=D.map((d,i)=>`<option value="${i}">${d[0]}</option>`).join('');
 const i=+sel.value||0,d=D[i],a=series(d[1],W,i,1),m=series(d[3],W,i+2,1),l=series(d[3]*.9,W,i+4,1),mx=Math.max(...a,...m,...l,1);
 tt.textContent=`ผู้ป่วย${d[0]}รายสัปดาห์ เทียบค่ามัธยฐาน 5 ปี (ข้อมูลรายสัปดาห์เป็นตัวอย่างจำลอง)`;
 const pl=(s,c,da)=>`<polyline fill="none" stroke="${c}" stroke-width="2.5" ${da?'stroke-dasharray="6 4"':''} points="${s.map((v,k)=>`${40+k*(840/Math.max(W-1,1))},${250-v/mx*220}`).join(' ')}"/>`;
 ln.innerHTML=[0,.5,1].map(t=>`<line x1="40" x2="880" y1="${250-t*220}" y2="${250-t*220}" stroke="currentColor" opacity=".12"/><text x="4" y="${254-t*220}" font-size="11" fill="currentColor">${Math.round(mx*t)}</text>`).join('')+pl(l,'#16a34a',1)+pl(m,'#f59e0b',1)+pl(a,'#2563eb')+`<text x="40" y="272" font-size="11" fill="currentColor">สัปดาห์ที่ 1</text><text x="880" y="272" font-size="11" text-anchor="end" fill="currentColor">${W}</text>`;
 tb.innerHTML="<tr><th>โรค</th><th>ผู้ป่วย</th><th>ตาย</th><th>อัตราป่วย/แสน</th><th>อัตราตาย/แสน</th><th>มัธยฐาน 5 ปี</th><th>สถานะ</th></tr>"+D.map(d=>`<tr><td>${d[0]}</td><td>${f(d[1])}</td><td>${f(d[2])}</td><td>${r2(d[1],P)}</td><td>${r2(d[2],P)}</td><td>${f(d[3])}</td><td><span class="tag ${d[1]>d[3]?'up':'ok'}">${d[1]>d[3]?'▲ สูงกว่า':'ปกติ'}</span></td></tr>`).join('');
 const mc=Math.max(...D.map(x=>Math.max(x[1],x[3])),1),bw=900/D.length;
 ch.innerHTML=D.map((x,k)=>{const X=k*bw+8,h1=x[1]/mc*220,h2=x[3]/mc*220,w=bw/2-10;
 return `<rect x="${X}" y="${250-h1}" width="${w}" height="${h1}" rx="3" fill="${x[1]>x[3]?'#dc2626':'#2563eb'}"/><rect x="${X+w+2}" y="${250-h2}" width="${w}" height="${h2}" rx="3" fill="#f59e0b"/><text x="${X+w}" y="272" font-size="11" text-anchor="middle" fill="currentColor">${x[0]}</text><text x="${X+w/2}" y="${244-h1}" font-size="10" text-anchor="middle" fill="currentColor">${f(x[1])}</text>`}).join('')+`<text x="8" y="294" font-size="11" fill="currentColor">ปีนี้ (แดง = สูงกว่ามัธยฐาน) / มัธยฐาน 5 ปี (ส้ม)</text>`;
 ta.value=D.map(x=>x.join(',')).join('\n');
}
function load(){const x=ta.value.trim().split('\n').map(l=>l.split(',')).filter(a=>a.length>=4).map(a=>[a[0].trim(),+a[1]||0,+a[2]||0,+a[3]||0,+a[4]||0,+a[5]||0]);if(x.length){D=x;sel.innerHTML='';render()}}
render();
</script></body></html>
