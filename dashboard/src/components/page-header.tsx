export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  // Bouton d'action affiché à droite du titre (ex. "+ Nouvelle entreprise")
  // — optionnel pour ne rien changer aux écrans qui n'en ont pas besoin.
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-3">
      <div>
        <div className="text-xl font-extrabold tracking-[-0.015em] text-text">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-[3px] text-[12.5px] font-medium text-text-secondary">
            {subtitle}
          </div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
