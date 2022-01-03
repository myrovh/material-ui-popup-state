/* eslint-env browser */
import { useState, useEffect, useMemo } from 'react'

if (!useState) {
  throw new Error(
    `React.useState (added in 16.8.0) must be defined to use the hooks API`
  )
}

import type { Variant, PopupState, CoreState } from './core'
import {
  initCoreState,
  createPopupState,
  anchorRef,
  bindTrigger,
  bindContextMenu,
  bindToggle,
  bindHover,
  bindFocus,
  bindMenu,
  bindPopover,
  bindPopper,
} from './core'
export {
  anchorRef,
  bindTrigger,
  bindContextMenu,
  bindToggle,
  bindHover,
  bindFocus,
  bindMenu,
  bindPopover,
  bindPopper,
}
export type { Variant, PopupState }
export function usePopupState({
  parentPopupState,
  popupId,
  variant,
  disableAutoFocus,
}: {
  parentPopupState?: PopupState | null | undefined
  popupId: string | null | undefined
  variant: Variant
  disableAutoFocus?: boolean | null | undefined
}): PopupState {
  const [state, setState] = useState(initCoreState)
  useEffect(() => {
    if (!disableAutoFocus && popupId && typeof document === 'object') {
      const popup = document.getElementById(popupId)
      if (popup) popup.focus()
    }
  }, [popupId, state.anchorEl])
  return useMemo(
    () =>
      createPopupState({
        state,
        // @ts-expect-error type broken
        setState,
        parentPopupState,
        popupId,
        variant,
        disableAutoFocus,
      }),
    [state, setState, parentPopupState, popupId, variant, disableAutoFocus]
  )
}
