// Layout imbriqué sous /app — voir docs/roadmap.md, tâche #67. Nécessaire
// parce que côté client, `app/` est un vrai segment d'URL (contrairement à
// `(client)`, groupe de routes invisible dans l'URL) : le slot parallèle
// `@drawer` doit donc être branché ici, un niveau sous `(client)/layout.tsx`
// (qui garde le rail de navigation + la barre supérieure), pour intercepter
// `/app/appels/[id]` avec `app/@drawer/(.)appels/[id]`. Toute future route de
// `(client)/app/...` qui aurait besoin d'un panneau latéral devra suivre ce
// même schéma plutôt que d'ajouter un slot au niveau de `(client)/layout.tsx`.
export default function AppLayout({
  children,
  drawer,
}: {
  children: React.ReactNode;
  drawer: React.ReactNode;
}) {
  return (
    <>
      {children}
      {drawer}
    </>
  );
}
