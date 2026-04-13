"use client"

import { ComponentShowcase } from "./component-showcase"

export function ParamsButtons() {
  return (
    <>
      <ComponentShowcase
        title="Button"
        description="Height: 32px, borderRadius: 8px, paddingX: $2.5 (32px), bg: $color3, border: 0. Mono font, bold. Scale 1.02 on hover."
        code={`<Button>
  <Button.Text>Label</Button.Text>
</Button>

<Button inverse>
  <Button.Text>Inverse</Button.Text>
</Button>

<Button loading>
  <Button.Text>Loading</Button.Text>
</Button>

<Button square>
  <Button.Icon icon={PlusIcon} />
</Button>`}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Default */}
          <button className="inline-flex h-8 items-center gap-2 rounded-lg bg-secondary px-[32px] font-mono text-sm font-bold text-foreground transition-transform hover:scale-[1.02]">
            Default
          </button>

          {/* Inverse */}
          <button className="inline-flex h-8 items-center gap-2 rounded-lg bg-foreground px-[32px] font-mono text-sm font-bold text-background transition-transform hover:scale-[1.02]">
            Inverse
          </button>

          {/* With icon */}
          <button className="inline-flex h-8 items-center gap-2 rounded-lg bg-secondary px-[32px] font-mono text-sm font-bold text-foreground transition-transform hover:scale-[1.02]">
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            With Icon
          </button>

          {/* Loading */}
          <button className="relative inline-flex h-8 cursor-not-allowed items-center gap-2 rounded-lg bg-secondary px-[32px] font-mono text-sm font-bold text-foreground opacity-50" disabled>
            <span className="opacity-0">Loading</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
          </button>

          {/* Disabled */}
          <button className="inline-flex h-8 cursor-not-allowed items-center gap-2 rounded-lg bg-secondary px-[32px] font-mono text-sm font-bold text-foreground opacity-50" disabled>
            Disabled
          </button>

          {/* Square */}
          <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-secondary font-mono text-sm font-bold text-foreground transition-transform hover:scale-[1.02]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        title="Button Anatomy"
        description="The Button component is a compound component with static properties: Button.Text (mono font, bold, line-height equals frame height) and Button.Icon (centered, 50% of frame height)."
      >
        <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-secondary/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 items-center rounded-lg border-2 border-brand bg-secondary px-[32px]">
              <span className="font-mono text-[10px] font-bold text-brand">Frame</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              height: 32px, borderRadius: 8px, bg: $color3
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-6 items-center rounded border-2 border-blue-500 bg-blue-50 px-2">
              <span className="font-mono text-[10px] font-bold text-blue-600">Button.Text</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              fontFamily: $mono, bold, lineHeight: 32px
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded border-2 border-green-500 bg-green-50">
              <span className="font-mono text-[10px] font-bold text-green-600">IC</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              Button.Icon: size = height * 0.5 (16px)
            </span>
          </div>
        </div>
      </ComponentShowcase>
    </>
  )
}
