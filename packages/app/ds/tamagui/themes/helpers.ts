type ObjectType = Record<PropertyKey, unknown>

type PickByValue<OBJ_T, VALUE_T> = // From https://stackoverflow.com/a/55153000
  Pick<OBJ_T, { [K in keyof OBJ_T]: OBJ_T[K] extends VALUE_T ? K : never }[keyof OBJ_T]>

type ObjectEntries<OBJ_T> = // From https://stackoverflow.com/a/60142095
  { [K in keyof OBJ_T]: [keyof PickByValue<OBJ_T, OBJ_T[K]>, OBJ_T[K]] }[keyof OBJ_T][]

export function objectEntries<OBJ_T extends ObjectType>(obj: OBJ_T): ObjectEntries<OBJ_T> {
  return Object.entries(obj) as ObjectEntries<OBJ_T>
}

export function objectFromEntries<ARR_T extends EntriesType>(arr: ARR_T): EntriesToObject<ARR_T> {
  return Object.fromEntries(arr) as EntriesToObject<ARR_T>
}

export type EntriesType = [PropertyKey, unknown][] | readonly (readonly [PropertyKey, unknown])[]

export type DeepWritable<OBJ_T> = { -readonly [P in keyof OBJ_T]: DeepWritable<OBJ_T[P]> }
export type UnionToIntersection<UNION_T> = // From https://stackoverflow.com/a/50375286
  (UNION_T extends any ? (k: UNION_T) => void : never) extends (k: infer I) => void ? I : never

export type UnionObjectFromArrayOfPairs<ARR_T extends EntriesType> =
  DeepWritable<ARR_T> extends (infer R)[]
    ? R extends [infer key, infer val]
      ? { [prop in key & PropertyKey]: val }
      : never
    : never
export type MergeIntersectingObjects<ObjT> = { [key in keyof ObjT]: ObjT[key] }
export type EntriesToObject<ARR_T extends EntriesType> = MergeIntersectingObjects<
  UnionToIntersection<UnionObjectFromArrayOfPairs<ARR_T>>
>

export function objectKeys<O extends object>(obj: O) {
  return Object.keys(obj) as (keyof O)[]
}
