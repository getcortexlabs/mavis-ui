import { Application, ScrollView, View } from '@nativescript/core'

interface Rect {
  origin: { x: number; y: number }
  size: { width: number; height: number }
}
interface Insets {
  top: number
  left: number
  bottom: number
  right: number
}

export class MavisScreenScroll extends ScrollView {
  private observers: { name: string; observer: unknown }[] = []
  private keyboardFrame?: Rect
  private originalInset?: Insets
  private originalIndicators?: Insets
  private pending?: ReturnType<typeof setTimeout>

  onLoaded() {
    super.onLoaded()
    this.originalInset = this.copyInsets(this.ios.contentInset)
    this.originalIndicators = this.copyInsets(this.ios.verticalScrollIndicatorInsets)
    for (const name of [
      'UIKeyboardWillChangeFrameNotification',
      'UIKeyboardDidChangeFrameNotification',
    ]) {
      const observer = Application.ios.addNotificationObserver(name, (event) => {
        this.keyboardFrame = event.userInfo.objectForKey(
          'UIKeyboardFrameEndUserInfoKey',
        ).CGRectValue
        this.updateKeyboard()
      })
      this.observers.push({ name, observer })
    }
    const hidden = 'UIKeyboardDidHideNotification'
    this.observers.push({
      name: hidden,
      observer: Application.ios.addNotificationObserver(hidden, () => this.restoreInsets()),
    })
    for (const name of [
      'UITextFieldTextDidBeginEditingNotification',
      'UITextViewTextDidBeginEditingNotification',
    ]) {
      const observer = Application.ios.addNotificationObserver(name, () => this.scheduleFocus())
      this.observers.push({ name, observer })
    }
    this.on(View.layoutChangedEvent, this.updateKeyboard, this)
  }

  onUnloaded() {
    this.ios.endEditing(true)
    for (const { name, observer } of this.observers)
      Application.ios.removeNotificationObserver(observer, name)
    this.observers = []
    this.off(View.layoutChangedEvent, this.updateKeyboard, this)
    clearTimeout(this.pending)
    this.pending = undefined
    this.restoreInsets()
    super.onUnloaded()
  }

  private restoreInsets() {
    if (this.originalInset) this.ios.contentInset = this.originalInset
    if (this.originalIndicators) this.ios.verticalScrollIndicatorInsets = this.originalIndicators
    this.keyboardFrame = undefined
  }

  private copyInsets(value: Insets): Insets {
    return { top: value.top, left: value.left, bottom: value.bottom, right: value.right }
  }

  private updateKeyboard() {
    const view = this.ios
    const window = view.window
    if (!window || !this.keyboardFrame || !this.originalInset || !this.originalIndicators) return
    const inWindow = window.convertRectFromCoordinateSpace(
      this.keyboardFrame,
      window.screen.coordinateSpace,
    )
    const frame = view.convertRectFromView(inWindow, window)
    const bounds = view.bounds
    // A floating or split keyboard must not reserve a full-width strip of the screen.
    const docked =
      frame.origin.x <= bounds.origin.x + 1 &&
      frame.origin.x + frame.size.width >= bounds.origin.x + bounds.size.width - 1 &&
      frame.origin.y + frame.size.height >= bounds.origin.y + bounds.size.height - 1
    const overlap = docked
      ? Math.max(
          0,
          Math.min(bounds.size.height, bounds.origin.y + bounds.size.height - frame.origin.y),
        )
      : 0
    view.contentInset = { ...this.originalInset, bottom: this.originalInset.bottom + overlap }
    view.verticalScrollIndicatorInsets = {
      ...this.originalIndicators,
      bottom: this.originalIndicators.bottom + overlap,
    }
    this.scheduleFocus()
  }

  private scheduleFocus() {
    clearTimeout(this.pending)
    this.pending = setTimeout(() => {
      this.pending = undefined
      if (!this.isLoaded) return
      let focused: View | undefined
      const visit = (view: View) => {
        if (view.nativeViewProtected?.isFirstResponder) focused = view
        view.eachChild((child) => {
          if (child instanceof View) visit(child)
          return !focused
        })
      }
      visit(this)
      if (!focused) return
      const native = focused.nativeViewProtected
      const rect = native.convertRectToView(native.bounds, this.ios)
      const top = this.verticalOffset + 8
      const bottom =
        this.verticalOffset + this.ios.bounds.size.height - this.ios.contentInset.bottom - 8
      if (rect.origin.y + rect.size.height > bottom)
        this.scrollToVerticalOffset(
          this.verticalOffset + rect.origin.y + rect.size.height - bottom,
          false,
        )
      else if (rect.origin.y < top)
        this.scrollToVerticalOffset(this.verticalOffset + rect.origin.y - top, false)
    }, 0)
  }
}
