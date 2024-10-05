import { ColorTokens, ThemeTokens, Themes } from 'tamagui'

type WithoutStarting$<S> = S extends `$${infer R}` ? R : S

type Scale = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

type WithoutUnderscore<S> = S extends `${infer A}_${infer B}` ? A : S

type RemoveSuffix<S> = S extends `${'dark' | 'light'}_${infer A}` ? WithoutUnderscore<A> : S

// this is a hack for now
// until this is fixed: https://discord.com/channels/909986013848412191/1124388532060967063/1124388532060967063
type Colors = RemoveSuffix<keyof Themes>

export type GradientProps = {
  gradient:
    | string
    | ((
        get: (
          colorName: WithoutStarting$<ColorTokens | ThemeTokens | `${Colors}${Scale}`>
        ) => string
      ) => string)
  stretch?: boolean
}
