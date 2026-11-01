const MOTS_IGNORES = new Set(['de', 'des', 'du', 'la', 'le', 'les', 'et', "d'"]);
const COULEURS_AVATAR = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

// "Faculte des Sciences de Tunis" -> "FS", "ENIT" -> "EN"
export function initiales(nom: string): string {
  const mots = nom.trim().split(/\s+/).filter(m => m && !MOTS_IGNORES.has(m.toLowerCase()));
  const lettres = mots.length >= 2 ? mots[0][0] + mots[1][0] : (mots[0] ?? '?').slice(0, 2);
  return lettres.toUpperCase();
}

// Same name -> same color, on every visit
export function couleurAvatar(nom: string): string {
  let hash = 0;
  for (const caractere of nom) {
    hash = (hash * 31 + caractere.charCodeAt(0)) >>> 0;
  }
  return COULEURS_AVATAR[hash % COULEURS_AVATAR.length];
}
