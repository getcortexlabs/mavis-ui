import { GridLayout } from '@nativescript/core'

declare const com: {
  mavis: { ui: { Screen: new (context: unknown) => object } }
}

/** The page container sees every touch of the page and can put the keyboard away. */
export class MavisScreen extends GridLayout {
  createNativeView() {
    return new com.mavis.ui.Screen(this._context)
  }
}
