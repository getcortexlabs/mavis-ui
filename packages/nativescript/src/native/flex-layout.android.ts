import { FlexboxLayout, type View } from '@nativescript/core'
import { applyColumnShrink } from './flex-children'

declare const com: {
  mavis: { ui: { FlexLayout: new (context: unknown) => object } }
}

export class MavisFlexLayout extends FlexboxLayout {
  createNativeView() {
    return new com.mavis.ui.FlexLayout(this._context)
  }

  _registerLayoutChild(child: View) {
    super._registerLayoutChild(child)
    applyColumnShrink(this, child)
  }

  onLoaded() {
    super.onLoaded()
    this.eachLayoutChild((child) => applyColumnShrink(this, child))
  }
}
