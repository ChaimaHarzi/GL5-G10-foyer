// "yyyy-MM-dd" read as a local day: new Date("2004-03-15") would be UTC midnight and can shift by one day
function lireDate(date: string): { annee: number; mois: number; jour: number } {
  const [annee, mois, jour] = date.split('-').map(Number);
  return { annee, mois, jour };
}

// Age in full years on the given day: "2004-03-15" -> 22 on 2026-11-01, 21 on 2026-03-14
export function age(dateNaissance: string, aujourdhui = new Date()): number {
  const naissance = lireDate(dateNaissance);
  const mois = aujourdhui.getMonth() + 1;
  const anniversairePasse = mois > naissance.mois || (mois === naissance.mois && aujourdhui.getDate() >= naissance.jour);
  return aujourdhui.getFullYear() - naissance.annee - (anniversairePasse ? 0 : 1);
}

// "2004-03-15" -> "15/03/2004"
export function dateFr(date: string): string {
  const { annee, mois, jour } = lireDate(date);
  return `${String(jour).padStart(2, '0')}/${String(mois).padStart(2, '0')}/${annee}`;
}

// Today as "yyyy-MM-dd", the format of <input type="date">
export function aujourdhuiIso(aujourdhui = new Date()): string {
  const mois = String(aujourdhui.getMonth() + 1).padStart(2, '0');
  const jour = String(aujourdhui.getDate()).padStart(2, '0');
  return `${aujourdhui.getFullYear()}-${mois}-${jour}`;
}
