import { FlexboxLayout } from '@nativescript/core'

declare const com: {
  mavis: { ui: { FlexLayout: new (context: unknown) => object } }
}

export class MavisFlexLayout extends FlexboxLayout {
  createNativeView() {
    return new com.mavis.ui.FlexLayout(this._context)
  }
}
