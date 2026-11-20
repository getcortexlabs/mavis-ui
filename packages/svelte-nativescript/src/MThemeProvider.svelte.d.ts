import { SvelteComponentTyped } from 'svelte'
import type { MavisThemeScope } from '@getcortexlabs/mavis/native'
export default class MThemeProvider extends SvelteComponentTyped<
  { theme: MavisThemeScope },
  {},
  { default: {} }
> {}
