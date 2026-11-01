import { ScrollView, type View } from '@nativescript/core'
import { isEditingAction } from './input-action'

export interface KeyboardDismissal {
  tap: boolean
  drag: boolean
}
interface NativeView {
  superview: NativeView | null
  subviews: { count: number; objectAtIndex(index: number): NativeView }
  isFirstResponder: boolean
  isEqual(other: NativeView): boolean
  endEditing(force: boolean): boolean
  addGestureRecognizer(recognizer: Recognizer): void
  removeGestureRecognizer(recognizer: Recognizer): void
}
interface Recognizer {
  view: NativeView
  delegate: unknown
  cancelsTouchesInView: boolean
  delaysTouchesEnded: boolean
}
interface NativeClass {
  extend(members: object, options: object): { new (): object }
}
declare const NSObject: NativeClass
declare const UITapGestureRecognizer: {
  alloc(): { initWithTargetAction(target: object, action: string): Recognizer }
}
declare const UIGestureRecognizerDelegate: unknown
declare const UITextField: unknown
declare const UITextView: unknown
declare const UIGestureRecognizer: unknown
declare const interop: { types: { void: unknown } }

const editor = (view: NativeView | null) => {
  for (let current = view; current; current = current.superview) {
    if (isEditingAction(current)) return true
    if (current instanceof (UITextField as never) || current instanceof (UITextView as never))
      return true
  }
  return false
}

const firstResponder = (view: NativeView): NativeView | null => {
  if (view.isFirstResponder) return view
  const subviews = view.subviews
  for (let index = 0; index < subviews.count; index++) {
    const found = firstResponder(subviews.objectAtIndex(index))
    if (found) return found
  }
  return null
}

// The recognizer only observes: it never cancels or delays the touches of the controls below
// it, and it recognizes together with the gesture recognizers of Core and Jolt. It takes a
// touch only while an editor is active and the touch is not on an editor. UIKit runs the tap
// action after the control's own action, so a control that focused another editor meanwhile
// keeps that focus.
let editing: NativeView | null = null
let Delegate: { new (): object } | undefined
let Target: { new (): object } | undefined
function classes() {
  Delegate ??= NSObject.extend(
    {
      gestureRecognizerShouldReceiveTouch(recognizer: Recognizer, touch: { view: NativeView }) {
        editing = editor(touch.view) ? null : firstResponder(recognizer.view)
        return editing !== null
      },
      gestureRecognizerShouldRecognizeSimultaneouslyWithGestureRecognizer() {
        return true
      },
    },
    { protocols: [UIGestureRecognizerDelegate] },
  )
  Target ??= NSObject.extend(
    {
      dismiss(recognizer: Recognizer) {
        const current = firstResponder(recognizer.view)
        if (editing && current?.isEqual(editing)) recognizer.view.endEditing(true)
        editing = null
      },
    },
    { exposedMethods: { dismiss: { returns: interop.types.void, params: [UIGestureRecognizer] } } },
  )
  return { Delegate, Target }
}

/** A tap recognizer on the page container; the scroll view follows the drag with the keyboard. */
export function dismissKeyboardOn(container: View, options: KeyboardDismissal): () => void {
  const native = container.ios as NativeView | undefined
  if (!native) return () => {}
  let recognizer: Recognizer | undefined
  // The recognizer keeps neither object alive for the runtime: hold both until release.
  let delegate: object | undefined
  let target: object | undefined
  if (options.tap) {
    const { Delegate, Target } = classes()
    delegate = new Delegate()
    target = new Target()
    recognizer = UITapGestureRecognizer.alloc().initWithTargetAction(target, 'dismiss')
    recognizer.cancelsTouchesInView = false
    recognizer.delaysTouchesEnded = false
    recognizer.delegate = delegate
    native.addGestureRecognizer(recognizer)
  }
  let scroll: ScrollView | undefined
  container.eachChildView((child) => {
    if (child instanceof ScrollView) scroll = child
    return !scroll
  })
  // UIScrollViewKeyboardDismissMode: none (0) or interactive (2).
  if (scroll?.ios) scroll.ios.keyboardDismissMode = options.drag ? 2 : 0
  return () => {
    if (recognizer) {
      native.removeGestureRecognizer(recognizer)
      recognizer.delegate = null
    }
    recognizer = undefined
    delegate = undefined
    target = undefined
    if (scroll?.ios) scroll.ios.keyboardDismissMode = 0
  }
}
