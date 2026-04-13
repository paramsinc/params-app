import { ComponentShowcase } from "./component-showcase"

const badgeColors = [
  { label: "Default", bg: "bg-secondary", text: "text-foreground" },
  { label: "Red", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  { label: "Green", bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  { label: "Blue", bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  { label: "Orange", bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  { label: "Purple", bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
]

export function ParamsBadges() {
  return (
    <>
      <ComponentShowcase
        title="Badge"
        description="Compound component: Badge.Text (mono font, fontSize $1 = 11px, bold) inside a container with $color3 bg, borderRadius: $10 (34px), paddingX: $2 (5px)."
        code={`<Badge theme="green">
  <Badge.Text>Active</Badge.Text>
</Badge>

<Badge theme="red">
  <Badge.Text>Error</Badge.Text>
</Badge>`}
      >
        <div className="flex flex-wrap items-center gap-3">
          {badgeColors.map((badge) => (
            <span
              key={badge.label}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 ${badge.bg}`}
            >
              {badge.dot && (
                <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
              )}
              <span className={`font-mono text-[11px] font-bold ${badge.text}`}>
                {badge.label}
              </span>
            </span>
          ))}
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        title="Theme Sub-Themes"
        description="Badges use Tamagui's color sub-themes (red, green, blue, etc.) which remap $color1-$color12 to the selected palette. This makes theming automatic."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {["red", "green", "blue", "orange", "purple", "pink", "yellow", "gray"].map((theme) => (
            <div key={theme} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {theme}
              </span>
              <div className="flex gap-1">
                {[3, 5, 7, 9, 11].map((step) => (
                  <div
                    key={step}
                    className={`h-5 w-5 rounded-md bg-${theme}-${step === 3 ? "100" : step === 5 ? "200" : step === 7 ? "300" : step === 9 ? "500" : "700"}`}
                    style={{
                      backgroundColor:
                        theme === "red"
                          ? step === 3 ? "#fee2e2" : step === 5 ? "#fca5a5" : step === 7 ? "#f87171" : step === 9 ? "#ef4444" : "#b91c1c"
                          : theme === "green"
                          ? step === 3 ? "#dcfce7" : step === 5 ? "#86efac" : step === 7 ? "#4ade80" : step === 9 ? "#22c55e" : "#15803d"
                          : theme === "blue"
                          ? step === 3 ? "#dbeafe" : step === 5 ? "#93c5fd" : step === 7 ? "#60a5fa" : step === 9 ? "#3b82f6" : "#1d4ed8"
                          : theme === "orange"
                          ? step === 3 ? "#ffedd5" : step === 5 ? "#fdba74" : step === 7 ? "#fb923c" : step === 9 ? "#f97316" : "#c2410c"
                          : theme === "purple"
                          ? step === 3 ? "#f3e8ff" : step === 5 ? "#d8b4fe" : step === 7 ? "#c084fc" : step === 9 ? "#a855f7" : "#7e22ce"
                          : theme === "pink"
                          ? step === 3 ? "#fce7f3" : step === 5 ? "#f9a8d4" : step === 7 ? "#f472b6" : step === 9 ? "#ec4899" : "#be185d"
                          : theme === "yellow"
                          ? step === 3 ? "#fef9c3" : step === 5 ? "#fde047" : step === 7 ? "#facc15" : step === 9 ? "#eab308" : "#a16207"
                          : step === 3 ? "#f3f4f6" : step === 5 ? "#d1d5db" : step === 7 ? "#9ca3af" : step === 9 ? "#6b7280" : "#374151"
                    }}
                  />
                ))}
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                $color3 - $color11
              </span>
            </div>
          ))}
        </div>
      </ComponentShowcase>
    </>
  )
}
