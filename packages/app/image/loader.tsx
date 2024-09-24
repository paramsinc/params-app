export const imageLoader = {
  raw: ({ src }) => src,
} satisfies Record<'raw', (input: { src: string; width: number; quality?: number }) => string>
