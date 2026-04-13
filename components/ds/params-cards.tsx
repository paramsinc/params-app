import { ComponentShowcase } from "./component-showcase"

export function ParamsCards() {
  return (
    <>
      <ComponentShowcase
        title="Card"
        description="Padding: $3, border: 1px $borderColor, borderRadius: $3, gap: $3. Features a subtle gradient overlay from $color3 to $color1."
        code={`<Card>
  <Card.Title>Title</Card.Title>
  <Card.Label>Label</Card.Label>
  <Card.Description>Description text</Card.Description>
  <Card.Separator />
</Card>`}
      >
        <div className="grid w-full gap-4 sm:grid-cols-2">
          {/* Standard Card */}
          <div className="relative overflow-hidden rounded-[7px] border border-border p-4">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: "linear-gradient(180deg, hsl(209, 13.3%, 95.3%) 0%, hsl(300, 20%, 99%) 100%)",
                opacity: 0.5,
              }}
            />
            <div className="relative flex flex-col gap-3">
              <span className="text-sm font-semibold text-foreground">Card Title</span>
              <span className="text-xs font-semibold text-muted-foreground">Label</span>
              <span className="text-sm text-foreground">
                This is a standard card with the gradient overlay pattern used throughout the Params app.
              </span>
              <div className="h-px bg-border" />
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-muted-foreground">
                  Gradient: linear-gradient(180deg, $color3, $color1)
                </span>
              </div>
            </div>
          </div>

          {/* Empty State Card */}
          <div className="flex flex-col gap-3 rounded-[9px] border-2 border-dashed border-border bg-card p-4">
            <span className="text-sm font-semibold text-foreground">Empty State</span>
            <span className="text-sm text-muted-foreground">
              Uses dashed 2px border, max-width 500px, $color2 background. For when there&apos;s no content to display.
            </span>
            <button className="inline-flex h-8 w-fit items-center gap-2 rounded-lg bg-foreground px-3 font-mono text-sm font-semibold text-background">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create First Item
            </button>
          </div>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        title="Modal / Dialog"
        description="Full-width on mobile, max 700px + rounded on $gtMd. Header: 50px, $backgroundStrong bg. Backdrop: $color12 at 0.2 opacity."
      >
        <div className="flex w-full flex-col items-center gap-4">
          {/* Mini modal preview */}
          <div className="relative w-full max-w-md overflow-hidden rounded-[9px] border border-border bg-card shadow-lg">
            {/* Header */}
            <div className="flex h-[50px] items-center border-b border-border bg-muted px-4">
              <span className="flex-1 text-center text-sm font-semibold text-foreground">
                Modal Title
              </span>
              <button className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Body */}
            <div className="flex flex-col gap-3 p-4">
              <p className="text-sm text-muted-foreground">
                Modal content goes here. Full-screen on mobile, constrained to 700px max-width on desktop.
              </p>
              <div className="flex justify-end gap-2">
                <button className="inline-flex h-8 items-center rounded-lg border border-border bg-secondary px-3 font-mono text-sm font-semibold text-foreground">
                  Cancel
                </button>
                <button className="inline-flex h-8 items-center rounded-lg bg-foreground px-3 font-mono text-sm font-semibold text-background">
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        title="Tooltip"
        description="Quick animation (150ms ease-out). Background: $color2. Padded variant adds $borderColor border. Enter/exit uses y-offset + scale."
      >
        <div className="flex items-center gap-6">
          <div className="group relative">
            <button className="inline-flex h-8 items-center rounded-lg border border-border bg-secondary px-3 font-mono text-sm font-semibold text-foreground">
              Hover me
            </button>
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 scale-95 rounded-[5px] bg-card px-2 py-1.5 text-xs text-foreground opacity-0 shadow-md transition-all group-hover:scale-100 group-hover:opacity-100">
              Tooltip content
              <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-card" />
            </div>
          </div>
          <div className="group relative">
            <button className="inline-flex h-8 items-center rounded-lg border border-border bg-secondary px-3 font-mono text-sm font-semibold text-foreground">
              Padded variant
            </button>
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 scale-95 rounded-[7px] border-2 border-border bg-card p-2 text-xs text-foreground opacity-0 shadow-md transition-all group-hover:scale-100 group-hover:opacity-100">
              With border padding
              <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-card" />
            </div>
          </div>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        title="Breadcrumbs"
        description="Chevron separators (14px, $color11). Title text: $color11, hover $color12."
      >
        <nav className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
            Dashboard
          </span>
          <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
            Profiles
          </span>
          <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-semibold text-foreground" aria-current="page">
            Settings
          </span>
        </nav>
      </ComponentShowcase>
    </>
  )
}
