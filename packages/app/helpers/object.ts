// credits goes to https://stackoverflow.com/a/50375286
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never

export const unionEntries = Object.entries as <T, Union extends UnionToIntersection<T>>(
  obj: T
) => {
  [K in keyof Union]: [K, Union[K]]
}[keyof Union][]

export const entries = Object.entries as <T>(obj: T) => {
  [K in keyof T]: [K, T[K]]
}[keyof T][]
export const keys = Object.keys as <T>(obj: T) => Array<keyof T>
export const values = Object.values as <T>(obj: T) => Array<T[keyof T]>
export const fromEntries = Object.fromEntries as <T>(entries: Array<[keyof T, T[keyof T]]>) => T
