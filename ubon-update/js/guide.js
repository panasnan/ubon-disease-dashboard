// ===== คู่มือผู้ดูแลระบบ — แสดงที่ tools/guide.html (ไม่แสดงในแดชบอร์ด) • แก้ข้อความได้ในไฟล์นี้ =====
export function guideHTML(DB, root = '') {
  const files = DB.loaded.map(f => f.file);
  return `<header class="hero"><div><div class="eyebrow">${DB.config.office}</div><h1>คู่มือผู้ดูแลแดชบอร์ด</h1><div class="sub">โครงสร้างไฟล์ • จุดที่แก้ไขได้ • ขั้นตอนอัปเดตทุกวันจันทร์ • การขึ้น GitHub</div></div><a class="btn ghost" href="${root}tools/update.html">ไปที่ศูนย์อัปเดตข้อมูล →</a></header>

  <div class="card guide"><h2>1. หลักการ: แยกไฟล์ตามหน้าที่ (นามสกุลไฟล์บอกว่าไฟล์นั้นทำอะไร)</h2>
  <table class="tbl"><thead><tr><th>นามสกุล</th><th>คืออะไร</th><th>ไฟล์ในระบบนี้</th><th>ต้องแก้บ่อยแค่ไหน</th></tr></thead><tbody>
  <tr><td><code>.csv</code></td><td><b>ข้อมูล</b> — ตารางที่เปิดด้วย Excel ได้ แถวแรกเป็นชื่อคอลัมน์ (ห้ามเปลี่ยนชื่อคอลัมน์)</td><td><code>data/*.csv</code></td><td><span class="chip red">ทุกสัปดาห์</span> (ได้จากศูนย์อัปเดตข้อมูล)</td></tr>
  <tr><td><code>.json</code></td><td><b>การตั้งค่า</b> — ข้อความในรูป <code>"ชื่อ": ค่า</code> คั่นด้วยจุลภาค</td><td><code>data/config.json</code> (ตั้งค่าหลัก), <code>data/map_districts.json</code> (รูปแผนที่)</td><td><span class="chip orange">เมื่อเปลี่ยนเกณฑ์/ประชากร</span></td></tr>
  <tr><td><code>.png .jpg</code></td><td><b>รูปภาพ</b></td><td><code>assets/moph-logo.png</code>, <code>assets/people/*.jpg</code></td><td><span class="chip yellow">เมื่อเปลี่ยนบุคลากร</span></td></tr>
  <tr><td><code>.html</code></td><td><b>โครงหน้าเว็บ</b> — เปิดในเบราว์เซอร์</td><td><code>index.html</code> (แดชบอร์ด), <code>tools/update.html</code> (ศูนย์อัปเดต), <code>tools/convert.html</code> (รวมไฟล์ DDS)</td><td><span class="chip green">แทบไม่ต้องแก้</span></td></tr>
  <tr><td><code>.css</code></td><td><b>หน้าตา</b> — สี ฟอนต์ ขนาด ระยะห่าง</td><td><code>css/style.css</code></td><td><span class="chip green">เมื่ออยากเปลี่ยนสี</span></td></tr>
  <tr><td><code>.js</code></td><td><b>การทำงาน/สูตรคำนวณ</b> (JavaScript)</td><td><code>js/app.js</code> หน้าต่างๆ • <code>js/data.js</code> อ่านไฟล์ สูตร ตรวจข้อมูล • <code>js/charts.js</code> กราฟ • <code>js/map.js</code> แผนที่ • <code>js/infographic.js</code> ภาพ Info • <code>js/xlsx-lite.js</code> อ่าน Excel/Word • <code>js/guide.js</code> หน้านี้</td><td><span class="chip green">ไม่ต้องแก้ในการอัปเดตปกติ</span></td></tr>
  <tr><td><code>.md</code></td><td>คำอธิบายบนหน้า GitHub</td><td><code>README.md</code></td><td>—</td></tr>
  <tr><td><code>.nojekyll</code></td><td>ไฟล์ว่าง บอก GitHub Pages ไม่ให้แปลงไฟล์ (ห้ามลบ)</td><td><code>.nojekyll</code></td><td>—</td></tr>
  </tbody></table>
  <pre class="tree">ubon-ddc-dashboard/
├── index.html              ← หน้าแดชบอร์ด
├── README.md
├── .nojekyll
├── css/style.css           ← สี/ฟอนต์
├── js/                     ← การทำงาน (ไม่ต้องแก้)
├── assets/                 ← โลโก้ + รูปบุคลากร
├── tools/
│   ├── update.html         ← ศูนย์อัปเดตข้อมูล (ใช้ทุกวันจันทร์)
│   ├── convert.html        ← รวม & แปลงไฟล์ DDS รายเคส
│   └── guide.html          ← คู่มือนี้ (ไม่แสดงในแดชบอร์ด)
└── data/                   ← ข้อมูลทั้งหมด (แก้/อัปโหลดทับที่นี่)</pre></div>

  <div class="card guide"><h2>2. ไฟล์ข้อมูลแต่ละไฟล์ มาจากไหน อัปเดตเมื่อไร</h2>
  <table class="tbl"><thead><tr><th>ไฟล์ใน data/</th><th>เนื้อหา</th><th>ได้มาจาก</th><th>ความถี่</th><th>สถานะ</th></tr></thead><tbody>
  ${[
    ['summary_province.csv', 'ตัวเลขรายงานประจำสัปดาห์ 10 โรค (ป่วย/ตาย) ระดับจังหวัด — เก็บทุกสัปดาห์ต่อกันเพื่อดูยอดเพิ่ม', 'ศูนย์อัปเดต ข้อ 1 ← Excel "รวบรวมรายงาน" ชีตสถานการณ์ 10 โรค', 'ทุกวันจันทร์'],
    ['weekly_2569.csv, weekly_2570.csv', 'ผู้ป่วย/ตาย รายสัปดาห์ × โรค × อำเภอ × ตำบล (ไม่มีข้อมูลรายบุคคล)', 'ศูนย์อัปเดต ข้อ 2 ← ไฟล์ DDS รายเคส .xlsx (เลือกทุกไฟล์พร้อมกัน)', 'ทุกวันจันทร์'],
    ['dds_status.csv, unit_quality.csv, units.csv', 'สถานะรายงาน (อนุมัติ/รอแก้ไข/ยกเลิก) และผลการรายงานรายหน่วย', 'ได้พร้อมกับ weekly_25xx.csv', 'ทุกวันจันทร์'],
    ['mebs_events.csv', 'ทะเบียนเหตุการณ์ (ระดับเหตุการณ์ ไม่มีรายละเอียดผู้ป่วย)', 'ศูนย์อัปเดต ข้อ 3 ← OutbreakVerificationList.docx', 'เมื่อมีเหตุการณ์'],
    ['dds_district.csv', 'ผลงาน DDS รายอำเภอ (รพ. / สสอ. / อปท.)', 'ศูนย์อัปเดต ข้อ 1 ← ชีต ผลงาน DDS ในและนอกสังกัด / อปท.', 'เดือนละครั้ง'],
    ['facility_dds.csv', 'ความครอบคลุม/ทันเวลา รายสถานพยาบาล (393 แห่ง) — คอลัมน์ dds_type ติดป้าย อปท.', 'ศูนย์อัปเดต ข้อ 4 ← Export ตารางรายสถานพยาบาลจาก DDC Dashboard (และไฟล์ที่กรองประเภท อปท.)', 'เดือนละครั้ง'],
    ['facility_types.csv', 'ความครอบคลุมแยกประเภทสถานพยาบาล (ใช้ตรวจไขว้ยอด อปท.)', 'ศูนย์อัปเดต ข้อ 4 ← Export ตารางสรุปประเภทจาก DDC Dashboard', 'เดือนละครั้ง'],
    ['contacts.csv, troubleshoot.csv', 'ผู้ประสานงาน (คอลัมน์ photo = ชื่อไฟล์รูปใน assets/people/) และวิธีแก้ปัญหา', 'แก้เองใน Excel หรือบน GitHub', 'เมื่อมีการเปลี่ยนแปลง'],
    ['districts.csv', '25 อำเภอ รหัส และ<b>ประชากรรายอำเภอ</b> (คอลัมน์ population)', 'แก้เอง', 'ปีละครั้ง'],
    ['baseline_5y.csv', 'ค่ามัธยฐาน 5 ปี (ถ้าไม่มี ระบบคำนวณเองจาก weekly ย้อนหลัง 5 ปี)', 'แก้เอง / แปลงข้อมูลย้อนหลัง', 'ปีละครั้ง'],
  ].map(r => `<tr><td><code>${r[0]}</code></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[0].split(', ').every(f => files.includes(f)) ? '<span class="chip green">มีแล้ว</span>' : '<span class="chip yellow">ยังไม่มี/บางไฟล์</span>'}</td></tr>`).join('')}
  </tbody></table></div>

  <div class="card guide"><h2>3. อัปเดตทุกวันจันทร์ (ประมาณ 10 นาที)</h2>
  <ol class="steps">
    <li>อัปเดตชีต <b>สถานการณ์ 10 โรค</b> ในไฟล์ Excel "รวบรวมรายงาน" ตามปกติ (ใส่วันที่ไว้ข้างคำว่า <b>อัพเดต</b>)</li>
    <li>Export ข้อมูล DDS รายเคส ตั้งแต่ 1 ม.ค. ถึงวันปัจจุบัน (ได้หลายไฟล์ ไฟล์ละ 10,000 แถว)</li>
    <li>เปิด <a href="${root}tools/update.html">ศูนย์อัปเดตข้อมูล</a> → ข้อ 1 เลือกไฟล์ Excel → ตรวจผล → ดาวน์โหลด <code>summary_province.csv</code></li>
    <li>ข้อ 2 → <a href="${root}tools/convert.html">รวม & แปลงไฟล์ DDS</a> → เลือก<b>ทุกไฟล์พร้อมกัน</b> → ตรวจยอดรายโรค → ดาวน์โหลด <code>weekly_25xx.csv</code>, <code>dds_status.csv</code>, <code>unit_quality.csv</code></li>
    <li>(ถ้ามีเหตุการณ์ใหม่) ข้อ 3 → เลือก OutbreakVerificationList.docx → ดาวน์โหลด <code>mebs_events.csv</code></li>
    <li>GitHub → เปิดโฟลเดอร์ <code>data</code> → <b>Add file → Upload files</b> → ลากไฟล์ที่ดาวน์โหลดทั้งหมด → <b>Commit changes</b> (ไฟล์ชื่อเดิมจะถูกแทนที่)</li>
    <li>รอ 1–3 นาที เปิดแดชบอร์ด กด Ctrl+F5 → หน้า <b>คุณภาพข้อมูล</b> ต้องไม่มีรายการสีแดง</li>
    <li>หน้า <b>สร้างภาพ Info</b> → ดาวน์โหลดภาพจังหวัดและ 25 อำเภอ ส่งให้พื้นที่</li>
  </ol>
  <p class="note">ห้ามอัปโหลดไฟล์ DDS ต้นฉบับ (มีชื่อ/เลขบัตร) หรือไฟล์ Excel/Word ต้นฉบับขึ้น GitHub — อัปโหลดเฉพาะ .csv ที่ได้จากเครื่องมือ</p></div>

  <div class="card guide"><h2>4. จุดที่แก้ไขได้เอง (ไม่ต้องเขียนโค้ด)</h2>
  <table class="tbl"><thead><tr><th>อยากเปลี่ยน</th><th>แก้ที่ไฟล์</th><th>ตำแหน่ง/ตัวอย่าง</th></tr></thead><tbody>
  <tr><td>ประชากรจังหวัด</td><td><code>data/config.json</code></td><td><code>"population_total": 1856713</code></td></tr>
  <tr><td>ประชากรรายอำเภอ</td><td><code>data/districts.csv</code></td><td>คอลัมน์ <code>population</code> ใส่ให้ครบ 25 อำเภอ</td></tr>
  <tr><td>เกณฑ์สีเตือนภัย</td><td><code>data/config.json</code></td><td><code>"alert": { "ratio_yellow": 1.0, "ratio_orange": 1.5, "ratio_red": 2.0 }</code></td></tr>
  <tr><td>เกณฑ์คุณภาพ DDS</td><td><code>data/config.json</code></td><td><code>"dds_kpi": { "timely_target": 80, "pending_max": 1, "zero_report_target": 60 }</code></td></tr>
  <tr><td>มาตรการของแต่ละโรค</td><td><code>data/config.json</code></td><td>ใน <code>"diseases"</code> → <code>"measures": [ "ข้อ 1", "ข้อ 2" ]</code></td></tr>
  <tr><td>รหัสโรค 506 / คำค้นชื่อโรค</td><td><code>data/config.json</code></td><td><code>"codes506": ["26","27","66"]</code>, <code>"keywords": [...]</code></td></tr>
  <tr><td>ปีงบใหม่</td><td><code>data/config.json</code></td><td>เพิ่มชื่อไฟล์ใน <code>"weekly_files": ["data/weekly_2569.csv", "data/weekly_2570.csv", "data/weekly_2571.csv"]</code></td></tr>
  <tr><td>ใส่ลิงก์แดชบอร์ดบนภาพ Info</td><td><code>data/config.json</code></td><td><code>"dashboard_url": "https://ชื่อผู้ใช้.github.io/ubon-10-diseases/"</code></td></tr>
  <tr><td>รูปบุคลากร</td><td><code>assets/people/</code> + <code>data/contacts.csv</code></td><td>อัปโหลดรูป เช่น <code>person-1.jpg</code> แล้วใส่ <code>person-1.jpg</code> ในคอลัมน์ <code>photo</code> ของแถวบุคคลนั้น</td></tr>
  <tr><td>สีหลักของระบบ</td><td><code>css/style.css</code></td><td>บรรทัดบนสุด <code>:root { --navy: #10234A; --blue: #2671F2; ... }</code></td></tr>
  </tbody></table>
  <p class="note">แก้ .json บน GitHub: เปิดไฟล์ → ปุ่มดินสอ ✏️ → แก้ → Commit • ระวังเครื่องหมาย <code>,</code> และ <code>"</code> ให้ครบ ถ้าไฟล์ผิดรูปแบบ แดชบอร์ดจะแจ้ง "โหลดข้อมูลไม่ได้"</p></div>

  <div class="card guide"><h2>5. ขึ้น GitHub ครั้งแรก</h2>
  <ol class="steps"><li>github.com → <b>New repository</b> → ตั้งชื่อ เช่น <code>ubon-10-diseases</code> → <b>Public</b> → Create</li>
  <li><b>uploading an existing file</b> → ลาก<b>ทุกไฟล์และโฟลเดอร์ในโฟลเดอร์ ubon-ddc-dashboard</b> (ต้องเห็น index.html ชั้นบนสุด) → Commit changes</li>
  <li><b>Settings → Pages</b> → Source: Deploy from a branch → Branch <code>main</code> / <code>(root)</code> → Save</li>
  <li>รอ 1–3 นาที จะได้ลิงก์ <code>https://ชื่อผู้ใช้.github.io/ubon-10-diseases/</code> → ใส่ลิงก์นี้ใน <code>dashboard_url</code></li></ol></div>`;
}
