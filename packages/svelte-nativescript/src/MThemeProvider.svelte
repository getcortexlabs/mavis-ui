<script lang="ts">
  import { setContext, onDestroy } from 'svelte'
  import { themeContext } from './register.js'
  import { createMavisTheme, type MavisThemeScope } from '@getcortexlabs/mavis/native'
  export let theme: MavisThemeScope
  const scope = createMavisTheme(theme.theme)
  let unsubscribe: (() => void) | undefined
  $: {
    unsubscribe?.()
    scope.setTheme(theme.theme)
    unsubscribe = theme.subscribe(() => scope.setTheme(theme.theme))
  }
  setContext(themeContext, { scope })
  onDestroy(() => unsubscribe?.())
</script>

<slot />
