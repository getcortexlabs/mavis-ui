import {
  inject,
  provide,
  shallowReactive,
  type Component,
  type InjectionKey,
  type Ref,
} from 'nativescript-vue'

export interface Layer {
  component: Component
  props: Record<string, unknown>
  /** True while the layer covers the screen content. */
  presented: Ref<boolean>
  /** Non-modal notices leave the screen content reachable. */
  modal?: boolean
}
export interface LayerEntry extends Layer {
  key: number
}
export interface LayerHost {
  add(layer: Layer): () => void
}

const layerHost: InjectionKey<LayerHost> = Symbol('mavis.layers')

/** A Screen renders registered layers above its content, inside one native cell. */
export function provideLayerHost(): LayerEntry[] {
  const layers = shallowReactive<LayerEntry[]>([])
  let next = 0
  provide(layerHost, {
    add(layer) {
      const entry = { ...layer, key: next++ }
      layers.push(entry)
      return () => {
        const index = layers.indexOf(entry)
        if (index >= 0) layers.splice(index, 1)
      }
    },
  })
  return layers
}

export function useLayerHost(name: string): LayerHost {
  const host = inject(layerHost, undefined)
  if (!host) throw new Error(`${name} needs an MScreen ancestor on NativeScript`)
  return host
}
