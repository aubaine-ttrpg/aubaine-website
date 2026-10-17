import { type RefObject, useCallback, useEffect, useState } from 'react'

export type FocusTarget = RefObject<HTMLElement | null>

export function useFocusRequest(): (target: FocusTarget) => void {
  const [request, setRequest] = useState<{ target: FocusTarget }>()
  useEffect(() => {
    request?.target.current?.focus()
  }, [request])
  return useCallback((target: FocusTarget) => setRequest({ target }), [])
}
