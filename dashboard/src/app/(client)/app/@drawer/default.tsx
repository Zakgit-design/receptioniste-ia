// Fallback du slot @drawer pour toute route de /app qui n'intercepte pas
// /app/appels/[id] (donc la quasi-totalité du Dashboard Client) — rien à
// afficher. Nécessaire dès qu'un slot parallèle nommé existe : sans ce
// fichier, Next.js ne peut pas récupérer l'état du slot lors d'une navigation
// directe/rechargement et affiche une erreur plutôt que la page demandée
// (voir aussi (dashboard)/@drawer/default.tsx, même mécanisme côté admin).
export default function Default() {
  return null;
}
