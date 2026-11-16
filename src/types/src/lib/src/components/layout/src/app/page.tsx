"use client";

import React, { useState, useMemo } from "react";
import { RightFilterPanel } from "@/components/layout/RightFilterPanel";
import { FilterState } from "@/types/surveillance";
import { RefreshCw, Download, AlertTriangle, ShieldCheck } from "lucide-react";

const INITIAL_FILTERS: FilterState = {
  fiscalYear: 2570,
  calendarYear: "ALL",
  month: "ALL",
  epiWeek: "ALL",
  districtCode: "ALL",
  subdistrictCode: "ALL",
  diseaseCodes: [],
  ageGroup: "ALL",
  gender: "ALL",
  source: "ALL",
  affiliation: "ALL",
};

const UBON_DISTRICTS = [
  { code: "3401", name: "เมืองอุบลราชธานี" },
  { code: "3402", name: "ศรีเมืองใหม่" },
  { code: "3403", name: "โขงเจียม" },
  { code: "3404", name: "เขื่องใน" },
  { code: "3405", name: "เขมราฐ" },
  { code: "3407", name: "เดชอุดม" },
  { code: "3408", name: "นาจะหลวย" },
  { code: "3409", name: "น้ำยืน" },
  { code: "3410", name: "บุณฑริก" },
  { code: "3411", name: "ตระการพืชผล" },
  { code: "3412", name: "กุดข้าวปุ้น" },
  { code: "3414", name: "ม่วงสามสิบ" },
  { code: "3415", name: "วารินชำราบ" },
  { code: "3419", name: "พิบูลมังสาหาร" },
  { code: "3420", name: "ตาลสุม" },
  { code: "3421", name: "โพธิ์ไทร" },
  { code: "3422", name: "สำโรง" },
  { code: "3424", name: "ดอนมดแดง" },
  { code: "3425", name: "สิรินธร" },
  { code: "3426", name: "ทุ่งศรีอุดม" },
  { code: "3429", name: "นาเยีย" },
  { code: "3430", name: "นาตาล" },
  { code: "3431", name: "เหล่าเสือโก้ก" },
  { code: "3432", name: "สว่างวีระวงศ์" },
  { code: "3433", name: "น้ำขุ่น" },
];

const TEN_DISEASES = [
  { code: "FLU", nameTh: "1. ไข้หวัดใหญ่" },
  { code: "PNEU", nameTh: "2. ปอดอักเสบ" },
  { code: "FP", nameTh: "3. อาหารเป็นพิษ" },
  { code: "HFMD", nameTh: "4. มือเท้าปาก" },
  { code: "DHF", nameTh: "5. ไข้เลือดออก" },
  { code: "MUSH", nameTh: "6. เห็ดพิษ" },
  { code: "MELI", nameTh: "7. เมลิออยด์" },
  { code: "LEPTO", nameTh: "8. ฉี่หนู" },
  { code: "MEAS", nameTh: "9. ไข้หัด" },
  { code: "RABIES", nameTh: "10. พิษสุนัขบ้า" },
];

export default function ExecutiveOverviewPage() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("13 พ.ย. 2569 เวลา 11:45 น.");

  const selectedDistrictName = useMemo(() => {
    if (filters.districtCode === "ALL") return "จังหวัดอุบลราชธานี (25 อำเภอ)";
    const found = UBON_DISTRICTS.find((d) => d.code === filters.districtCode);
    return found ? `อำเภอ${found.name}` : "จังหวัดอุบลราชธานี";
  }, [filters.districtCode]);

  return (
    <div className="min-h-screen bg-[#F1F5FB] flex">
      <main
        className={`flex-1 transition-all duration-300 p-6 ${
          isFilterOpen ? "mr-80" : "mr-12"
        }`}
      >
        <header className="bg-gradient-to-r from-[#10234A] to-[#174EA6] text-white rounded-2xl p-6 shadow-md mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-xs font-medium mb-2">
              ปีงบประมาณ พ.ศ. {filters.fiscalYear} | พื้นที่: {selectedDistrictName}
            </span>
            <h1 className="text-2xl font-bold tracking-tight">
              ระบบสารสนเทศสถานการณ์โรคที่ต้องเฝ้าระวัง 10 โรค จังหวัดอุบลราชธานี
            </h1>
            <p className="text-sm text-blue-100 mt-1 font-body">
              งานระบาดวิทยา กลุ่มงานควบคุมโรคติดต่อ สำนักงานสาธารณสุขจังหวัดอุบลราชธานี
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-xs text-blue-200 font-body">
              อัปเดตข้อมูลล่าสุด: {lastUpdated}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLastUpdated(new Date().toLocaleString("th-TH"))}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> รีเฟรชข้อมูล
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16A477] hover:bg-emerald-600 text-xs font-semibold shadow-sm transition">
                <Download className="w-3.5 h-3.5" /> ดาวน์โหลดภาพ Infographic
              </button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {[
            { label: "ผู้ป่วยสะสม 10 โรค", value: "รอเชื่อมต่อฐานข้อมูล", sub: "เทียบช่วงเดียวกันปีก่อน", color: "border-[#2671F2]" },
            { label: "ผู้ป่วยเสียชีวิต", value: "0 ราย", sub: "อัตราป่วยตาย (CFR): 0.00%", color: "border-[#E5484D]" },
            { label: "อัตราป่วยต่อแสน ปชก.", value: "0.00", sub: "ประชากรฐานทะเบียนราษฎร์", color: "border-[#174EA6]" },
            { label: "เหตุการณ์กลุ่มก้อน (MEBS)", value: "0 เหตุการณ์", sub: "กำลังสอบสวน/ควบคุมโรค", color: "border-[#F3A72F]" },
            { label: "โรคอัตราป่วยสูงสุด", value: "-", sub: "อ้างอิงข้อมูล DDS / D506", color: "border-[#10234A]" },
            { label: "ความครบถ้วนการส่งรายงาน", value: "0.0%", sub: "รพ.สต. ในสังกัด & อปท.", color: "border-[#16A477]" },
          ].map((kpi, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-2xl p-4 shadow-sm border-t-4 ${kpi.color}`}
            >
              <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
              <p className="text-xl font-bold text-[#10234A] my-2">{kpi.value}</p>
              <p className="text-[11px] text-slate-400 font-body">{kpi.sub}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm min-h-[380px] flex flex-col justify-between">
            <h2 className="text-base font-bold text-[#10234A]">
              การจัดอันดับสถานการณ์ 10 โรค และแนวโน้มเทียบค่ามัธยฐาน 5 ปี
            </h2>
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl my-4 text-slate-400 text-sm">
              [พื้นที่เชื่อมต่อ ECharts / Recharts จากฐานข้อมูลจริง]
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm min-h-[380px] flex flex-col justify-between">
            <h2 className="text-base font-bold text-[#10234A]">
              แผนที่ความเสี่ยงรายอำเภอ (25 อำเภอ จ.อุบลราชธานี)
            </h2>
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl my-4 text-slate-400 text-sm">
              [พื้นที่วางไฟล์ GeoJSON แผนที่อุบลฯ]
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-[#F3A72F]">
            <div className="flex items-center gap-2 text-[#10234A] font-bold mb-2">
              <AlertTriangle className="w-5 h-5 text-[#F3A72F]" />
              <h3>แจ้งเตือนพื้นที่/โรคเกินเกณฑ์เฝ้าระวัง</h3>
            </div>
            <p className="text-xs text-slate-500 font-body">
              ระบบจะแสดงรายชื่ออำเภอและมาตรการเฝ้าระวังอัตโนมัติเมื่อนำเข้าไฟล์ข้อมูลจริง
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-[#16A477]">
            <div className="flex items-center gap-2 text-[#10234A] font-bold mb-2">
              <ShieldCheck className="w-5 h-5 text-[#16A477]" />
              <h3>ติดตามการรายงานเหตุการณ์กลุ่มก้อน (MEBS Cluster Tracker)</h3>
            </div>
            <p className="text-xs text-slate-500 font-body">
              แสดงการ์ดสถานะการสอบสวนโรคและควบคุมโรคของทีม SRRT รายอำเภอ
            </p>
          </div>
        </section>
      </main>

      <RightFilterPanel
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(INITIAL_FILTERS)}
        isOpen={isFilterOpen}
        onToggle={() => setIsFilterOpen(!isFilterOpen)}
        districts={UBON_DISTRICTS}
        diseases={TEN_DISEASES}
      />
    </div>
  );
}
