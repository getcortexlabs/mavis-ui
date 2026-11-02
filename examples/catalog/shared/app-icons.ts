import { inject, type InjectionKey } from 'vue'
import { createAppIconController, type AppIconController } from '@getcortexlabs/mavis-core'

export const appIconChoices = [
  {
    id: 'mavis',
    label: 'Mavis',
    color: '#B83670',
    iosName: null,
    androidAlias: 'com.getcortexlabs.mavis.catalog.MavisPrimary',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    color: '#251E32',
    iosName: 'MavisMidnight',
    androidAlias: 'com.getcortexlabs.mavis.catalog.MavisMidnight',
  },
  {
    id: 'azure',
    label: 'Azure',
    color: '#4262C4',
    iosName: 'MavisAzure',
    androidAlias: 'com.getcortexlabs.mavis.catalog.MavisAzure',
  },
] as const
export const appIconsKey: InjectionKey<AppIconController> = Symbol('catalog.app-icons')
export function useAppIcons() {
  return inject(
    appIconsKey,
    () =>
      createAppIconController(appIconChoices, 'mavis', {
        supported: () => false,
        current: () => undefined,
        select: async () => {
          throw new Error('Launcher icons are only available in the native catalog.')
        },
      }),
    true,
  )
}
