// only numbers, letters, dashes, all lowercase

export const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
