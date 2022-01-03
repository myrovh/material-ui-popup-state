/* eslint-env browser */
import * as React from 'react'
const printedWarnings: Record<string, boolean> = {}

function warn(key: string, message: string) {
  if (printedWarnings[key]) return
  printedWarnings[key] = true
  console.error('[material-ui-popup-state] WARNING', message) // eslint-disable-line no-console
}

export type Variant = 'popover' | 'popper'
export type PopupState = {
  open: (eventOrAnchorEl?: React.SyntheticEvent<any> | HTMLElement) => void
  close: () => void
  toggle: (eventOrAnchorEl?: React.SyntheticEvent<any> | HTMLElement) => void
  onMouseLeave: (event: React.SyntheticEvent<any>) => void
  setOpen: (
    open: boolean,
    eventOrAnchorEl?: React.SyntheticEvent<any> | HTMLElement
  ) => void
  isOpen: boolean
  anchorEl: HTMLElement | null | undefined
  setAnchorEl: (arg0: HTMLElement | null | undefined) => any
  setAnchorElUsed: boolean
  popupId: string | null | undefined
  variant: Variant
  disableAutoFocus: boolean
  _childPopupState: PopupState | null | undefined
  _setChildPopupState: (arg0: PopupState | null | undefined) => void
}
export type CoreState = {
  isOpen: boolean
  setAnchorElUsed: boolean
  anchorEl: HTMLElement | null | undefined
  hovered: boolean
  focused: boolean
  _childPopupState: PopupState | null | undefined
  _deferNextOpen: boolean
  _deferNextClose: boolean
}
export const initCoreState: CoreState = {
  isOpen: false,
  setAnchorElUsed: false,
  anchorEl: null,
  hovered: false,
  focused: false,
  _childPopupState: null,
  _deferNextOpen: false,
  _deferNextClose: false,
}
export function createPopupState({
  state,
  setState: _setState,
  parentPopupState,
  popupId,
  variant,
  disableAutoFocus,
}: {
  state: CoreState
  setState: (arg0: Partial<CoreState>) => any
  popupId: string | null | undefined
  variant: Variant
  parentPopupState?: PopupState | null | undefined
  disableAutoFocus?: boolean | null | undefined
}): PopupState {
  const {
    isOpen,
    setAnchorElUsed,
    anchorEl,
    hovered,
    focused,
    _childPopupState,
    _deferNextOpen,
    _deferNextClose,
  } = state
  // use lastState to workaround cases where setState is called multiple times
  // in a single render (e.g. because of refs being called multiple times)
  let lastState = state

  const setState = (nextState: Partial<CoreState>) => {
    if (hasChanges(lastState, nextState)) {
      _setState((lastState = { ...lastState, ...nextState }))
    }
  }

  const setAnchorEl = (_anchorEl: HTMLElement | null | undefined) => {
    setState({
      setAnchorElUsed: true,
      anchorEl: _anchorEl,
    })
  }

  const toggle = (
    eventOrAnchorEl?: React.SyntheticEvent<any> | HTMLElement
  ) => {
    if (isOpen) close(eventOrAnchorEl)
    else open(eventOrAnchorEl)
  }

  const open = (eventOrAnchorEl?: React.SyntheticEvent<any> | HTMLElement) => {
    const eventType = eventOrAnchorEl && (eventOrAnchorEl as any).type
    const currentTarget =
      eventOrAnchorEl && (eventOrAnchorEl as any).currentTarget

    if (eventType === 'touchstart') {
      setState({
        _deferNextOpen: true,
      })
      return
    }

    const doOpen = () => {
      if (!eventOrAnchorEl && !setAnchorElUsed) {
        warn(
          'missingEventOrAnchorEl',
          'eventOrAnchorEl should be defined if setAnchorEl is not used'
        )
      }

      if (parentPopupState) {
        if (!parentPopupState.isOpen) return

        parentPopupState._setChildPopupState(popupState)
      }

      const newState: Partial<CoreState> = {
        isOpen: true,
        hovered: eventType === 'mouseover',
        focused: eventType === 'focus',
      }

      if (currentTarget) {
        if (!setAnchorElUsed) {
          newState.anchorEl = currentTarget as any
        }
      } else if (eventOrAnchorEl) {
        newState.anchorEl = eventOrAnchorEl as any
      }

      setState(newState)
    }

    if (_deferNextOpen) {
      setState({
        _deferNextOpen: false,
      })
      setTimeout(doOpen, 0)
    } else {
      doOpen()
    }
  }

  const close = (arg?: React.SyntheticEvent<any> | HTMLElement) => {
    const eventType = arg && (arg as any).type

    switch (eventType) {
      case 'touchstart':
        setState({
          _deferNextClose: true,
        })
        return

      case 'blur':
        if (isElementInPopup((arg as any)?.relatedTarget, popupState)) return
        break
    }

    const doClose = () => {
      if (_childPopupState) _childPopupState.close()
      if (parentPopupState) parentPopupState._setChildPopupState(null)
      setState({
        isOpen: false,
        hovered: false,
        focused: false,
      })
    }

    if (_deferNextClose) {
      setState({
        _deferNextClose: false,
      })
      setTimeout(doClose, 0)
    } else {
      doClose()
    }
  }

  const setOpen = (
    nextOpen: boolean,
    eventOrAnchorEl?: React.SyntheticEvent<any> | HTMLElement
  ) => {
    if (nextOpen) {
      open(eventOrAnchorEl)
    } else close(eventOrAnchorEl)
  }

  const onMouseLeave = (event: React.SyntheticEvent<any>) => {
    const relatedTarget: any = (event as any).relatedTarget

    if (hovered && !isElementInPopup(relatedTarget, popupState)) {
      close(event)
    }
  }

  const _setChildPopupState = (_childPopupState: any) =>
    setState({
      _childPopupState,
    })

  const popupState = {
    anchorEl,
    setAnchorEl,
    setAnchorElUsed,
    popupId,
    variant,
    isOpen,
    open,
    close,
    toggle,
    setOpen,
    onMouseLeave,
    disableAutoFocus: disableAutoFocus ?? Boolean(hovered || focused),
    _childPopupState,
    _setChildPopupState,
  }
  return popupState
}

/**
 * Creates a ref that sets the anchorEl for the popup.
 *
 * @param {object} popupState the argument passed to the child function of
 * `PopupState`
 */
export function anchorRef({
  setAnchorEl,
}: PopupState): (arg0: HTMLElement | null | undefined) => any {
  return (el: HTMLElement | null | undefined) => {
    if (el) setAnchorEl(el)
  }
}

/**
 * Creates props for a component that opens the popup when clicked.
 *
 * @param {object} popupState the argument passed to the child function of
 * `PopupState`
 */
export function bindTrigger({ isOpen, open, popupId, variant }: PopupState): {
  'aria-controls'?: string | null | undefined
  'aria-describedby'?: string | null | undefined
  'aria-haspopup': true | null | undefined
  onClick: (event: React.SyntheticEvent<any>) => void
  onTouchStart: (event: React.SyntheticEvent<any>) => void
} {
  return {
    // $FlowFixMe
    [variant === 'popover' ? 'aria-controls' : 'aria-describedby']: isOpen
      ? popupId
      : null,
    'aria-haspopup': variant === 'popover' ? true : undefined,
    onClick: open,
    onTouchStart: open,
  }
}

/**
 * Creates props for a component that opens the popup on its contextmenu event (right click).
 *
 * @param {object} popupState the argument passed to the child function of
 * `PopupState`
 */
export function bindContextMenu({
  isOpen,
  open,
  popupId,
  variant,
}: PopupState): {
  'aria-controls'?: string | null | undefined
  'aria-describedby'?: string | null | undefined
  'aria-haspopup': true | null | undefined
  onContextMenu: (event: React.SyntheticEvent<any>) => void
} {
  return {
    // $FlowFixMe
    [variant === 'popover' ? 'aria-controls' : 'aria-describedby']: isOpen
      ? popupId
      : null,
    'aria-haspopup': variant === 'popover' ? true : undefined,
    onContextMenu: (e: React.SyntheticEvent<any>) => {
      e.preventDefault()
      open(e)
    },
  }
}

/**
 * Creates props for a component that toggles the popup when clicked.
 *
 * @param {object} popupState the argument passed to the child function of
 * `PopupState`
 */
export function bindToggle({ isOpen, toggle, popupId, variant }: PopupState): {
  'aria-controls'?: string | null | undefined
  'aria-describedby'?: string | null | undefined
  'aria-haspopup': true | null | undefined
  onClick: (event: React.SyntheticEvent<any>) => void
  onTouchStart: (event: React.SyntheticEvent<any>) => void
} {
  return {
    // $FlowFixMe
    [variant === 'popover' ? 'aria-controls' : 'aria-describedby']: isOpen
      ? popupId
      : null,
    'aria-haspopup': variant === 'popover' ? true : undefined,
    onClick: toggle,
    onTouchStart: toggle,
  }
}

/**
 * Creates props for a component that opens the popup while hovered.
 *
 * @param {object} popupState the argument passed to the child function of
 * `PopupState`
 */
export function bindHover({
  isOpen,
  open,
  onMouseLeave,
  popupId,
  variant,
}: PopupState): {
  'aria-controls'?: string | null | undefined
  'aria-describedby'?: string | null | undefined
  'aria-haspopup': true | null | undefined
  onTouchStart: (event: React.MouseEvent<any>) => any
  onMouseOver: (event: React.MouseEvent<any>) => any
  onMouseLeave: (event: React.MouseEvent<any>) => any
} {
  return {
    // $FlowFixMe
    [variant === 'popover' ? 'aria-controls' : 'aria-describedby']: isOpen
      ? popupId
      : null,
    'aria-haspopup': variant === 'popover' ? true : undefined,
    onTouchStart: open,
    onMouseOver: open,
    onMouseLeave,
  }
}

/**
 * Creates props for a component that opens the popup while focused.
 *
 * @param {object} popupState the argument passed to the child function of
 * `PopupState`
 */
export function bindFocus({
  isOpen,
  open,
  close,
  popupId,
  variant,
}: PopupState): {
  'aria-controls'?: string | null | undefined
  'aria-describedby'?: string | null | undefined
  'aria-haspopup': true | null | undefined
  onFocus: (event: React.SyntheticEvent<any>) => any
  onBlur: (event: React.SyntheticEvent<any>) => any
} {
  return {
    // $FlowFixMe
    [variant === 'popover' ? 'aria-controls' : 'aria-describedby']: isOpen
      ? popupId
      : null,
    'aria-haspopup': variant === 'popover' ? true : undefined,
    onFocus: open,
    onBlur: close,
  }
}

/**
 * Creates props for a `Popover` component.
 *
 * @param {object} popupState the argument passed to the child function of
 * `PopupState`
 */
export function bindPopover({
  isOpen,
  anchorEl,
  close,
  popupId,
  onMouseLeave,
  disableAutoFocus,
}: PopupState): {
  id: string | null | undefined
  anchorEl: HTMLElement | null | undefined
  open: boolean
  onClose: () => void
  onMouseLeave: (event: React.SyntheticEvent<any>) => void
  disableAutoFocus?: boolean
  disableEnforceFocus?: boolean
  disableRestoreFocus?: boolean
} {
  return {
    id: popupId,
    anchorEl,
    open: isOpen,
    onClose: close,
    onMouseLeave,
    ...(disableAutoFocus && {
      disableAutoFocus: true,
      disableEnforceFocus: true,
      disableRestoreFocus: true,
    }),
  }
}

/**
 * Creates props for a `Menu` component.
 *
 * @param {object} popupState the argument passed to the child function of
 * `PopupState`
 */

/**
 * Creates props for a `Popover` component.
 *
 * @param {object} popupState the argument passed to the child function of
 * `PopupState`
 */
export function bindMenu({
  isOpen,
  anchorEl,
  close,
  popupId,
  onMouseLeave,
  disableAutoFocus,
}: PopupState): {
  id: string | null | undefined
  anchorEl: HTMLElement | null | undefined
  open: boolean
  onClose: () => void
  onMouseLeave: (event: React.SyntheticEvent<any>) => void
  autoFocus?: boolean
  disableAutoFocusItem?: boolean
  disableAutoFocus?: boolean
  disableEnforceFocus?: boolean
  disableRestoreFocus?: boolean
} {
  return {
    id: popupId,
    anchorEl,
    open: isOpen,
    onClose: close,
    onMouseLeave,
    ...(disableAutoFocus && {
      autoFocus: false,
      disableAutoFocusItem: true,
      disableAutoFocus: true,
      disableEnforceFocus: true,
      disableRestoreFocus: true,
    }),
  }
}

/**
 * Creates props for a `Popper` component.
 *
 * @param {object} popupState the argument passed to the child function of
 * `PopupState`
 */
export function bindPopper({
  isOpen,
  anchorEl,
  popupId,
  onMouseLeave,
}: PopupState): {
  id: string | null | undefined
  anchorEl: HTMLElement | null | undefined
  open: boolean
  onMouseLeave: (event: React.SyntheticEvent<any>) => void
} {
  return {
    id: popupId,
    anchorEl,
    open: isOpen,
    onMouseLeave,
  }
}

function getPopup({ popupId }: PopupState): HTMLElement | null | undefined {
  return popupId && typeof document !== 'undefined'
    ? document.getElementById(popupId) // eslint-disable-line no-undef
    : null
}

function isElementInPopup(
  element: HTMLElement,
  popupState: PopupState
): boolean {
  const { anchorEl, _childPopupState } = popupState
  return (
    isAncestor(anchorEl, element) ||
    isAncestor(getPopup(popupState), element) ||
    (_childPopupState != null && isElementInPopup(element, _childPopupState))
  )
}

function isAncestor(
  parent: Element | null | undefined,
  child: Element | null | undefined
): boolean {
  if (!parent) return false

  while (child) {
    if (child === parent) return true
    child = child.parentElement
  }

  return false
}

function hasChanges(state: CoreState, nextState: Partial<CoreState>): boolean {
  for (let key in nextState) {
    if (
      Object.prototype.hasOwnProperty.call(state, key) &&
      // @ts-expect-error TODO find better way to compare object keys and typescript will allow
      state[key] !== nextState[key]
    ) {
      return true
    }
  }

  return false
}
