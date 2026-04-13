export function TokenTable({
  tokens,
  renderPreview,
}: {
  tokens: { name: string; value: string | number; note?: string }[]
  renderPreview?: (value: string | number, name: string) => React.ReactNode
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted">
            <th className="px-4 py-2.5 text-left font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Token
            </th>
            <th className="px-4 py-2.5 text-left font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Value
            </th>
            {renderPreview && (
              <th className="px-4 py-2.5 text-left font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Preview
              </th>
            )}
            {tokens.some((t) => t.note) && (
              <th className="px-4 py-2.5 text-left font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Note
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {tokens.map((token, i) => (
            <tr
              key={token.name}
              className={i % 2 === 0 ? "bg-card" : "bg-background"}
            >
              <td className="px-4 py-2 font-mono text-xs font-semibold text-foreground">
                {token.name}
              </td>
              <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                {String(token.value)}
              </td>
              {renderPreview && (
                <td className="px-4 py-2">
                  {renderPreview(token.value, token.name)}
                </td>
              )}
              {tokens.some((t) => t.note) && (
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {token.note || ""}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
