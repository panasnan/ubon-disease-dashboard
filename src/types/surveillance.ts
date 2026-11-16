export type DataSourceType = "DDS" | "D506" | "ALL";
export type FacilityAffiliation = "MOPH" | "LAO_TRANSFERRED" | "ALL";

export interface FilterState {
  fiscalYear: number;
  calendarYear: number | "ALL";
  month: number | "ALL";
  epiWeek: number | "ALL";
  districtCode: string | "ALL";
  subdistrictCode: string | "ALL";
  diseaseCodes: string[];
  ageGroup: string | "ALL";
  gender: "ALL" | "M" | "F";
  source: DataSourceType;
  affiliation: FacilityAffiliation;
}
