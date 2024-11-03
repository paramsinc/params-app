export {
  useState,
  useEffect,
  useRef,
  useMemo,
  cloneElement,
  Fragment,
  useContext,
  useLayoutEffect,
} from 'react'

import { useEffect, useLayoutEffect } from 'react'
export const useServerEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect
