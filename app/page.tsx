import { Section } from "@/components/ds/section"
import { SidebarNav } from "@/components/ds/sidebar-nav"
import { ColorRow } from "@/components/ds/color-swatch"
import { TokenTable } from "@/components/ds/token-table"
import { ParamsButtons } from "@/components/ds/params-buttons"
import { ParamsInputs } from "@/components/ds/params-inputs"
import { ParamsBadges } from "@/components/ds/params-badges"
import { ParamsCards } from "@/components/ds/params-cards"

export default function DesignSystemPage() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-border p-6 lg:block">
        <SidebarNav />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-10">
          {/* Header */}
          <header className="mb-12 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand">
                <span className="font-heading text-lg font-bold text-white">P</span>
              </div>
              <div>
                <h1 className="font-heading text-3xl font-bold tracking-tight text-balance text-foreground">
                  Params Design System
                </h1>
                <p className="text-sm text-muted-foreground">
                  Reference for <code className="font-mono text-xs">paramsinc/params-app</code>
                </p>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              A cross-platform design system built with Tamagui. Uses a 12-step color palette (mauve/slate base),
              three font families (body, heading, mono), a non-linear size scale, and compound component patterns
              with styled context.
            </p>
          </header>

          <div className="flex flex-col gap-16">
            {/* Overview */}
            <Section
              id="overview"
              title="Architecture Overview"
              subtitle="How the design system is structured across the Tamagui-based codebase."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <OverviewCard
                  title="Theme Builder"
                  description="Uses @tamagui/theme-builder with light/dark base themes, 8 color sub-themes (red, green, blue, orange, purple, pink, yellow, gray), and surface/alt depth layers."
                />
                <OverviewCard
                  title="Compound Components"
                  description="Components use withStaticProperties + createStyledContext for contextual styling. E.g. Button.Text, Badge.Text inherit parent theme state."
                />
                <OverviewCard
                  title="Cross-Platform"
                  description="Tamagui compiles to optimized CSS on web and native StyleSheet on React Native. Font vars (--font-body, --font-heading, --font-mono) bridge both platforms."
                />
                <OverviewCard
                  title="Non-Linear Scales"
                  description="Size tokens are non-linear by design: small values for fine-grained borders/padding, mid values for pressable elements, large values for headings."
                />
              </div>
            </Section>

            {/* Colors */}
            <Section
              id="colors"
              title="Color Tokens"
              subtitle="12-step palette from transparent (0) through background (1-2), surfaces (3-6), borders (7-8), solids (9-10), text (11-12), to contrast transparent (13)."
            >
              <ColorRow
                label="Light Palette (Mauve / Slate Base)"
                colors={[
                  { name: "$color1", value: "#faf9fb" },
                  { name: "$color2", value: "#f2eff3" },
                  { name: "$color3", value: "#edeef1" },
                  { name: "$color4", value: "#e3e5e8" },
                  { name: "$color5", value: "#d8dade" },
                  { name: "$color6", value: "#cdcfd4" },
                  { name: "$color7", value: "#b9bbc1" },
                  { name: "$color8", value: "#8b8d98" },
                  { name: "$color9", value: "#65636d" },
                  { name: "$color10", value: "#514f59" },
                  { name: "$color11", value: "#110f1b" },
                  { name: "$color12", value: "hsl(0,0%,9%)" },
                ]}
              />
              <ColorRow
                label="Dark Palette"
                colors={[
                  { name: "$color1", value: "#050505" },
                  { name: "$color2", value: "#151515" },
                  { name: "$color3", value: "#191919" },
                  { name: "$color4", value: "#232323" },
                  { name: "$color5", value: "#282828" },
                  { name: "$color6", value: "#323232" },
                  { name: "$color7", value: "#424242" },
                  { name: "$color8", value: "#494949" },
                  { name: "$color9", value: "#545454" },
                  { name: "$color10", value: "#626262" },
                  { name: "$color11", value: "#a5a5a5" },
                  { name: "$color12", value: "#ffffff" },
                ]}
              />
              <ColorRow
                label="Brand & Accent"
                colors={[
                  { name: "$brand", value: "hsl(0, 72%, 51%)" },
                  { name: "$borderColor", value: "hsl(0, 0%, 92%)" },
                  { name: "$backgroundStrong", value: "white" },
                  { name: "shadowColor", value: "rgba(0,0,0,0.085)" },
                ]}
              />
            </Section>

            {/* Typography */}
            <Section
              id="typography"
              title="Typography"
              subtitle="Three font families mapped via CSS custom properties: --font-body, --font-heading, --font-mono."
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Font Families
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FontCard
                      family="Body ($body)"
                      fontClass="font-sans"
                      sample="The quick brown fox jumps over the lazy dog"
                      note="Inter / system sans-serif"
                    />
                    <FontCard
                      family="Heading ($heading)"
                      fontClass="font-heading"
                      sample="The quick brown fox jumps over the lazy dog"
                      note="Nunito / rounded sans-serif"
                    />
                    <FontCard
                      family="Mono ($mono)"
                      fontClass="font-mono"
                      sample="const x = fn(42)"
                      note="JetBrains Mono / monospace"
                    />
                  </div>
                </div>

                <TokenTable
                  tokens={[
                    { name: "$1", value: "11px", note: "Smallest labels" },
                    { name: "$2", value: "12px", note: "Badge text" },
                    { name: "$3", value: "13px", note: "Captions" },
                    { name: "$4", value: "14px", note: "Default body (true)" },
                    { name: "$5", value: "16px", note: "Input text" },
                    { name: "$6", value: "18px", note: "Subheadings" },
                    { name: "$7", value: "20px", note: "Section titles" },
                    { name: "$8", value: "23px", note: "Card titles" },
                    { name: "$9", value: "30px", note: "Page headings" },
                    { name: "$10", value: "46px", note: "Hero text" },
                    { name: "$11", value: "55px" },
                    { name: "$12", value: "62px" },
                  ]}
                  renderPreview={(value, name) => (
                    <span
                      className="font-sans text-foreground"
                      style={{ fontSize: typeof value === "string" ? value : `${value}px` }}
                    >
                      Aa
                    </span>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Line heights are computed as <code className="font-mono">fontSize * 1.2</code> across all sizes.
                </p>
              </div>
            </Section>

            {/* Spacing & Size */}
            <Section
              id="spacing"
              title="Spacing & Size Tokens"
              subtitle="Non-linear size scale designed for pressability. Space is derived from size (~1/3 to 2/3 of the size value)."
            >
              <div className="flex flex-col gap-6">
                <TokenTable
                  tokens={[
                    { name: "$0", value: 0 },
                    { name: "$0.25", value: 2, note: "Fine borders" },
                    { name: "$0.5", value: 4, note: "Smallest padding" },
                    { name: "$0.75", value: 8, note: "Small gaps" },
                    { name: "$1", value: 20, note: "Pressable minimum" },
                    { name: "$1.5", value: 24 },
                    { name: "$2", value: 28 },
                    { name: "$2.5", value: 32, note: "Button paddingX" },
                    { name: "$3", value: 36, note: "Card padding" },
                    { name: "$3.5", value: 40 },
                    { name: "$4 / $true", value: 44, note: "Default touch target" },
                    { name: "$5", value: 52 },
                    { name: "$6", value: 64 },
                    { name: "$8", value: 84 },
                    { name: "$10", value: 104 },
                    { name: "$12", value: 144 },
                    { name: "$16", value: 224 },
                    { name: "$20", value: 284 },
                  ]}
                  renderPreview={(value) => (
                    <div className="flex items-center">
                      <div
                        className="h-3 rounded-sm bg-brand/30"
                        style={{ width: `${Math.min(Number(value), 200)}px` }}
                      />
                    </div>
                  )}
                />
              </div>
            </Section>

            {/* Radius */}
            <Section
              id="radius"
              title="Border Radius"
              subtitle="Progressive radius scale from sharp (0) to pill (50px)."
            >
              <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 lg:grid-cols-7">
                {[
                  { name: "$0", value: 0 },
                  { name: "$1", value: 3 },
                  { name: "$2", value: 5 },
                  { name: "$3", value: 7 },
                  { name: "$4 / true", value: 9 },
                  { name: "$5", value: 10 },
                  { name: "$6", value: 16 },
                  { name: "$7", value: 19 },
                  { name: "$8", value: 22 },
                  { name: "$9", value: 26 },
                  { name: "$10", value: 34 },
                  { name: "$11", value: 42 },
                  { name: "$12", value: 50 },
                ].map((r) => (
                  <div key={r.name} className="flex flex-col items-center gap-2">
                    <div
                      className="flex h-12 w-12 items-center justify-center border-2 border-brand bg-brand/10"
                      style={{ borderRadius: `${r.value}px` }}
                    >
                      <span className="font-mono text-[10px] font-bold text-brand">{r.value}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">{r.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Common usage: Buttons use <code className="font-mono">br: 8</code>, Cards use <code className="font-mono">$3 (7px)</code>,
                Badges use <code className="font-mono">$10 (34px)</code> for pill shape.
              </p>
            </Section>

            {/* Shadows */}
            <Section
              id="shadows"
              title="Shadows"
              subtitle="Subtle shadows with different intensities for light and dark modes."
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { name: "shadowColor", value: "rgba(0,0,0,0.085)", desc: "Default" },
                  { name: "shadowColorHover", value: "rgba(0,0,0,0.085)", desc: "Hover" },
                  { name: "shadowColorPress", value: "rgba(0,0,0,0.04)", desc: "Press" },
                  { name: "shadowColorFocus", value: "rgba(0,0,0,0.04)", desc: "Focus" },
                ].map((shadow) => (
                  <div
                    key={shadow.name}
                    className="flex flex-col items-center gap-2 rounded-xl bg-card p-6"
                    style={{ boxShadow: `0 4px 12px ${shadow.value}` }}
                  >
                    <span className="font-mono text-xs font-bold text-foreground">{shadow.desc}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{shadow.value}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Animations */}
            <Section
              id="animations"
              title="Animations"
              subtitle="CSS-based animation presets using ease-out curves. All animations are created via @tamagui/animations-css."
            >
              <TokenTable
                tokens={[
                  { name: "100ms", value: "linear 100ms", note: "Button press feedback" },
                  { name: "200ms", value: "linear 200ms", note: "General transitions" },
                  { name: "bouncy", value: "ease-out 100ms", note: "Micro-interactions" },
                  { name: "quick", value: "ease-out 150ms", note: "Tooltip enter/exit" },
                  { name: "lazy", value: "ease-out 400ms", note: "Lazy reveals" },
                  { name: "medium", value: "ease-out 600ms", note: "Page transitions" },
                  { name: "slow", value: "ease-out 1000ms", note: "Background fades" },
                  { name: "tooltip", value: "ease-out 200ms", note: "Tooltip specific" },
                ]}
              />
            </Section>

            {/* Media Queries */}
            <Section
              id="media"
              title="Media Queries"
              subtitle="Mobile-first breakpoints. The 'gt' variants target min-width for progressive enhancement."
            >
              <TokenTable
                tokens={[
                  { name: "xxs", value: "max-width: 390px", note: "Small phones" },
                  { name: "xs", value: "max-width: 660px", note: "Default mobile" },
                  { name: "sm", value: "max-width: 800px", note: "Large phones / small tablets" },
                  { name: "md", value: "max-width: 1020px", note: "Tablets" },
                  { name: "lg", value: "max-width: 1280px", note: "Small desktops" },
                  { name: "xl", value: "max-width: 1650px", note: "Large desktops" },
                  { name: "gtXs", value: "min-width: 661px", note: "Above mobile" },
                  { name: "gtSm", value: "min-width: 801px", note: "Above small tablets" },
                  { name: "gtMd", value: "min-width: 1021px", note: "Above tablets" },
                  { name: "gtLg", value: "min-width: 1281px", note: "Above small desktops" },
                  { name: "gtXl", value: "min-width: 1651px", note: "Above large desktops" },
                ]}
              />
            </Section>

            {/* Buttons */}
            <Section
              id="buttons"
              title="Buttons"
              subtitle="Compound component with Frame, Text, and Icon sub-components. Uses styled context for loading/inverse state propagation."
            >
              <ParamsButtons />
            </Section>

            {/* Inputs */}
            <Section
              id="inputs"
              title="Inputs & Controls"
              subtitle="Form elements styled with $color3 background, $borderColor border, and 16px font size."
            >
              <ParamsInputs />
            </Section>

            {/* Badges */}
            <Section
              id="badges"
              title="Badges"
              subtitle="Pill-shaped indicators using color sub-themes for automatic palette mapping."
            >
              <ParamsBadges />
            </Section>

            {/* Cards & Surfaces */}
            <Section
              id="cards"
              title="Cards & Surfaces"
              subtitle="Surface layers with gradient overlays. Theme builder generates surface1-4, alt1-2, and active sub-themes for depth."
            >
              <ParamsCards />
            </Section>
          </div>

          {/* Footer */}
          <footer className="mt-16 border-t border-border pt-6 pb-10">
            <p className="text-center text-xs text-muted-foreground">
              Params Design System Reference — extracted from{" "}
              <code className="font-mono">paramsinc/params-app</code>
            </p>
          </footer>
        </div>
      </main>
    </div>
  )
}

function OverviewCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border p-5">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(180deg, hsl(209 13.3% 95.3%) 0%, hsl(300 20% 99%) 100%)",
          opacity: 0.4,
        }}
      />
      <div className="relative flex flex-col gap-2">
        <h4 className="font-heading text-sm font-bold text-foreground">{title}</h4>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function FontCard({
  family,
  fontClass,
  sample,
  note,
}: {
  family: string
  fontClass: string
  sample: string
  note: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {family}
      </span>
      <p className={`text-lg text-foreground ${fontClass}`}>{sample}</p>
      <span className="text-xs text-muted-foreground">{note}</span>
    </div>
  )
}
