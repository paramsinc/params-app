import { View } from 'app/ds/View'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <View grow bg="$color1">
      {children}
    </View>
  )
}
