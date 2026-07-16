export function PlaceholderPanel({
  title = "Écran à construire — tâche suivante",
  description,
}: {
  title?: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-5 py-[46px] text-center shadow-[var(--shadow-panel)]">
      <div className="mb-1 text-[13px] font-bold text-text-secondary">
        {title}
      </div>
      <div className="mx-auto max-w-[360px] text-xs leading-relaxed text-text-muted">
        {description}
      </div>
    </div>
  );
}
