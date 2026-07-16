// Fallback du slot @drawer pour toute route qui n'intercepte pas /appels/[id]
// (donc la quasi-totalité du dashboard) — rien à afficher. Nécessaire dès
// qu'un slot parallèle nommé existe : sans ce fichier, Next.js ne peut pas
// récupérer l'état du slot lors d'une navigation directe/rechargement et
// affiche une erreur plutôt que la page demandée.
export default function Default() {
  return null;
}
