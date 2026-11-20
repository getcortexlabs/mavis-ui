import {
  initializeDom,
  registerElement,
  NativeViewElementNode,
} from '@nativescript-community/svelte-native/dom'
import { nativeComponents, type MavisNativeView } from '../components/index.js'

initializeDom()
for (const [name, View] of Object.entries(nativeComponents)) {
  const tag = `mavis${name.slice(1).toLowerCase()}`
  class Element extends NativeViewElementNode<MavisNativeView> {
    constructor() {
      super(tag, View)
    }
    override setText(text: string) {
      if (name === 'MText' || name === 'MButton') this.nativeView.mavisContentText = text
      else if (text.trim()) throw new TypeError(`${name} does not accept bare text`)
    }
  }
  registerElement(tag, () => new Element())
}

export const themeContext = Symbol('Mavis theme')
