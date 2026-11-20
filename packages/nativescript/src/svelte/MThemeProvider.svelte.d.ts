import { SvelteComponentTyped } from 'svelte'
import type { MavisThemeScope } from '../components/theme.js'
export default class MThemeProvider extends SvelteComponentTyped<
  { theme: MavisThemeScope },
  {},
  { default: {} }
> {}
