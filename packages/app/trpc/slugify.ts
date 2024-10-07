// only numbers, letters, dashes, all lowercase
const regex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const blacklist = new Set(['book'])

export const isValidSlug = (slug: string) => !blacklist.has(slug) && regex.test(slug)

export const slugify = (str: string) =>
  str
    .toLowerCase()
    .replaceAll(' ', '-')
    .replace(/[^a-z0-9-]/g, '-')
// .replace(/-+/g, '-')
// .replace(/^-|-$/g, '')
