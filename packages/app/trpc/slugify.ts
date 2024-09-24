// only numbers, letters, dashes, all lowercase
const regex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const isValidSlug = (slug: string) => regex.test(slug)

export const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
