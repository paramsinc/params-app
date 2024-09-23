import { SolitoImage } from 'solito/image'
import logo from './logo.png'
import svg from './params logo.svg'
import dark from './(params).svg'

export function Logo({ size = 200 }: { size?: number }) {
  return <SolitoImage src={dark} alt="logo" width={size} />
}
