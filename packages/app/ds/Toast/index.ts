import * as Burnt from 'burnt'

const toast = (props: Parameters<typeof Burnt.toast>[0]) => {
  Burnt.toast(props)
}

export default function useToast() {
  return {
    toast,
  }
}
