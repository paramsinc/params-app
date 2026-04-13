"use client"

import { useState } from "react"

export function ComponentShowcase({
  title,
  description,
  code,
  children,
}: {
  title: string
  description?: string
  code?: string
  children: React.ReactNode
}) {
  const [showCode, setShowCode] = useState(false)

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h4 className="font-heading text-base font-bold text-foreground">{title}</h4>
          {description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        {code && (
          <button
            onClick={() => setShowCode(!showCode)}
            className="shrink-0 rounded-lg border border-border bg-secondary px-2.5 py-1 font-mono text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            {showCode ? "Preview" : "Code"}
          </button>
        )}
      </div>

      {showCode && code ? (
        <pre className="overflow-x-auto rounded-lg bg-foreground p-4 text-xs leading-relaxed text-background">
          <code>{code}</code>
        </pre>
      ) : (
        <div className="flex flex-col gap-3">{children}</div>
      )}
    </div>
  )
}
