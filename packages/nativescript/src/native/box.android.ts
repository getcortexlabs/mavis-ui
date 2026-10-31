import { GridLayout } from '@nativescript/core'

declare const com: {
  mavis: { ui: { Box: new (context: unknown) => object } }
}

export class MavisBox extends GridLayout {
  createNativeView() {
    return new com.mavis.ui.Box(this._context)
  }
}
