"use client"

import { useState } from "react"
import { ComponentShowcase } from "./component-showcase"

export function ParamsInputs() {
  const [switchOn, setSwitchOn] = useState(false)
  const [textValue, setTextValue] = useState("")

  return (
    <>
      <ComponentShowcase
        title="Input"
        description="fontSize: 16px, bg: $color3, border: 1px $borderColor, borderRadius: $3 (7px). Uses $body font."
        code={`<Input
  fontSize={16} px="$2" py="$1"
  borderWidth={1} borderColor="$borderColor"
  fontFamily="$body" bg="$color3"
  color="$color12" borderRadius="$3"
/>`}
      >
        <div className="flex w-full flex-col gap-4">
          <input
            type="text"
            placeholder="Default input..."
            className="h-10 w-full max-w-sm rounded-[7px] border border-border bg-secondary px-3 py-1 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="text"
            placeholder="Disabled input"
            disabled
            className="h-10 w-full max-w-sm cursor-not-allowed rounded-[7px] border border-border bg-secondary px-3 py-1 text-base text-foreground opacity-50 placeholder:text-muted-foreground"
          />
          <div className="flex max-w-sm flex-col gap-1">
            <label className="font-mono text-xs font-semibold text-muted-foreground">
              TextArea (auto-growing)
            </label>
            <textarea
              placeholder="Write something..."
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              className="min-h-[80px] w-full resize-none rounded-[7px] border border-border bg-secondary px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
            />
          </div>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        title="Switch"
        description="Custom animated switch. Thumb: 20px, track width: 44px. Checked uses $brand color. Built with Moti for spring animations."
        code={`<Switch
  checked={checked}
  onCheckedChange={(val) => setChecked(val)}
/>`}
      >
        <div className="flex items-center gap-4">
          <button
            role="switch"
            aria-checked={switchOn}
            onClick={() => setSwitchOn(!switchOn)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              switchOn ? "bg-destructive" : "bg-input"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                switchOn ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className="font-mono text-sm text-foreground">
            {switchOn ? "On" : "Off"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Brand color is red, matching <code className="font-mono">$brand</code> token
        </p>
      </ComponentShowcase>
    </>
  )
}
