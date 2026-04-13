export function ColorSwatch({
  name,
  value,
  textColor = "foreground",
}: {
  name: string
  value: string
  textColor?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-14 w-full rounded-lg border border-border"
        style={{ backgroundColor: value }}
      />
      <span className="font-mono text-xs font-semibold text-foreground">{name}</span>
      <span className="font-mono text-[10px] text-muted-foreground">{value}</span>
    </div>
  )
}

export function ColorRow({
  label,
  colors,
}: {
  label: string
  colors: { name: string; value: string }[]
}) {
  return (
    <div className="flex flex-col gap-3">
      <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </h4>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
        {colors.map((color) => (
          <ColorSwatch key={color.name} name={color.name} value={color.value} />
        ))}
      </div>
    </div>
  )
}
