export function calculateMorbidityRate(cases: number, population: number): number {
  if (!population || population <= 0) return 0;
  return Number(((cases / population) * 100000).toFixed(2));
}

export function calculateCFR(deaths: number, cases: number): number {
  if (!cases || cases <= 0) return 0;
  return Number(((deaths / cases) * 100).toFixed(2));
}

export function getThaiFiscalYear(dateString: string): number {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const thaiYear = date.getFullYear() + 543;
  return month >= 10 ? thaiYear + 1 : thaiYear;
}
