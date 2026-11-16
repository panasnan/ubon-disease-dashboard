"use client";

import React from "react";
import { FilterState } from "@/types/surveillance";
import { Filter, RotateCcw, ChevronRight, ChevronLeft } from "lucide-react";

interface RightFilterPanelProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onReset: () => void;
  isOpen: boolean;
  onToggle: () => void;
  districts: { code: string; name: string }[];
  diseases: { code: string; nameTh: string }[];
}

export function RightFilterPanel({
  filters,
  onChange,
  onReset,
  isOpen,
  onToggle,
  districts,
  diseases,
}: RightFilterPanelProps) {
  return (
    <aside
      className={`fixed right-0 top-0 z-30 h-screen bg-white border-l border-slate-200 shadow-lg transition-all duration-300 flex flex-col ${
        isOpen ? "w-80" : "w-12"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex items-center justify-between p-3.5 bg-[#10234A] text-white hover:bg-[#174EA6] transition-colors"
      >
        {isOpen ? (
          <>
            <span className="flex items-center gap-2 font-semibold text-sm">
              <Filter className="w-4 h-4" /> ตัวกรองข้อมูล (Filters)
            </span>
            <ChevronRight className="w-5 h-5" />
          </>
        ) : (
          <ChevronLeft className="w-5 h-5 mx-auto" />
        )}
      </button>

      {isOpen && (
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-sm font-body">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              ปีงบประมาณ (พ.ศ.)
            </label>
            <select
              value={filters.fiscalYear}
              onChange={(e) =>
                onChange({ ...filters, fiscalYear: Number(e.target.value) })
              }
              className="w-full rounded-lg border border-slate-300 p-2 bg-slate-50"
            >
              <option value={2570}>ปีงบประมาณ 2570 (ปัจจุบัน)</option>
              <option value={2569}>ปีงบประมาณ 2569</option>
              <option value={2568}>ปีงบประมาณ 2568</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              แหล่งข้อมูลเฝ้าระวัง
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["ALL", "DDS", "D506"] as const).map((src) => (
                <button
                  key={src}
                  onClick={() => onChange({ ...filters, source: src })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition ${
                    filters.source === src
                      ? "bg-[#174EA6] text-white border-[#174EA6]"
                      : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {src === "ALL" ? "ทั้งหมด" : src}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              สังกัดหน่วยบริการ (รพ.สต.)
            </label>
            <select
              value={filters.affiliation}
              onChange={(e) =>
                onChange({
                  ...filters,
                  affiliation: e.target.value as FilterState["affiliation"],
                })
              }
              className="w-full rounded-lg border border-slate-300 p-2 bg-white"
            >
              <option value="ALL">ทั้งหมด (ในสังกัด + อปท.)</option>
              <option value="MOPH">ในสังกัดกระทรวงสาธารณสุข</option>
              <option value="LAO_TRANSFERRED">นอกสังกัด (ถ่ายโอน อปท.)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              อำเภอ (จังหวัดอุบลราชธานี)
            </label>
            <select
              value={filters.districtCode}
              onChange={(e) =>
                onChange({ ...filters, districtCode: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 p-2 bg-white"
            >
              <option value="ALL">ทั้งจังหวัด (25 อำเภอ)</option>
              {districts.map((d) => (
                <option key={d.code} value={d.code}>
                  อ.{d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              โรคที่ต้องเฝ้าระวัง
            </label>
            <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1.5 bg-slate-50">
              {diseases.map((disease) => {
                const checked = filters.diseaseCodes.includes(disease.code);
                return (
                  <label
                    key={disease.code}
                    className="flex items-center gap-2 cursor-pointer text-xs text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const updated = checked
                          ? filters.diseaseCodes.filter((c) => c !== disease.code)
                          : [...filters.diseaseCodes, disease.code];
                        onChange({ ...filters, diseaseCodes: updated });
                      }}
                      className="rounded text-[#174EA6]"
                    />
                    <span>{disease.nameTh}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <button
              onClick={onReset}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition"
            >
              <RotateCcw className="w-4 h-4" /> ล้างตัวกรองทั้งหมด
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
