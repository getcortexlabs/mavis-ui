import {
  nativeComponents,
  type NativeComponentName,
  type MavisNativeView,
} from '../components/index.js'

/** Angular applies literal attributes to the element before initializing directive inputs.
 * Keep token strings out of NativeScript's numeric style converters during that phase.
 * The directive receives the same literals and the controller resolves them through its theme.
 */
export function angularElement(name: NativeComponentName): new () => MavisNativeView {
  const Base = nativeComponents[name]
  class Element extends Base {}
  for (const key of ['gap', 'padding']) {
    Object.defineProperty(Element.prototype, key, {
      configurable: true,
      get(this: MavisNativeView) {
        return Reflect.get(this.style, key)
      },
      set(_value: unknown) {},
    })
  }
  return Element
}
