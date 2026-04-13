"use client"

const sections = [
  { id: "overview", label: "Overview" },
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "spacing", label: "Spacing & Size" },
  { id: "radius", label: "Radius" },
  { id: "shadows", label: "Shadows" },
  { id: "animations", label: "Animations" },
  { id: "media", label: "Media Queries" },
  { id: "buttons", label: "Buttons" },
  { id: "inputs", label: "Inputs & Controls" },
  { id: "badges", label: "Badges" },
  { id: "cards", label: "Cards & Surfaces" },
]

export function SidebarNav() {
  return (
    <nav className="sticky top-8 flex flex-col gap-0.5">
      <span className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Sections
      </span>
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {section.label}
        </a>
      ))}
    </nav>
  )
}
