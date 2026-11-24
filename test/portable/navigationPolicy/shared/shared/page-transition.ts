import { defineNavigationTransition, type NavigationTransition } from '@getcortexlabs/mavis-core'

export const pageTransition = defineNavigationTransition({
  name: 'slide',
  duration: 220,
} satisfies NavigationTransition)
