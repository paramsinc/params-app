export function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="flex scroll-mt-8 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  )
}
