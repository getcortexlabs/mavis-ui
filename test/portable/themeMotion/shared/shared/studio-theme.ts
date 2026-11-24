import { defineTheme, midnight } from '@getcortexlabs/mavis-core'

export const studioLight = defineTheme({
  name: 'studio-light',
  colors: { surface: '#DCE8FA', primary: '#305090', primarySoft: '#30509044' },
  space: { xs: 6, md: 21 },
  radius: { md: 7 },
  typography: { body: { fontSize: 18, lineHeight: 1.5, letterSpacing: 0.02 } },
  control: { md: { height: 58, fontSize: 19, padding: 23 } },
  components: {
    button: { radius: 9, paddingY: 6, elevation: 'sm' },
    card: { padding: 11, radius: 13 },
    input: { radius: 9, paddingX: 15, paddingY: 10, fontSize: 18 },
  },
  elevation: { sm: { x: 0, y: 3, blur: 10, spread: 2, color: '#30509033' } },
  motion: {
    pressScale: 0.92,
    pressDuration: 120,
    releaseDuration: 320,
    releaseBounce: 0.15,
    enterDuration: 140,
    exitDuration: 100,
    enterOffset: 12,
    ease: 'easeInOut',
  },
})
export const studioDark = defineTheme(
  {
    name: 'studio-dark',
    appearance: 'dark',
    colors: { surface: '#203040', primary: '#A0C0F0' },
    space: { xs: 10, md: 29 },
    radius: { md: 19 },
    typography: { body: { fontSize: 22, lineHeight: 1.4 } },
    control: { md: { height: 64, fontSize: 21, padding: 25 } },
    components: {
      button: { radius: 15, paddingY: 8 },
      card: { padding: 19, radius: 23 },
      input: { radius: 17, paddingX: 19, paddingY: 12, fontSize: 22 },
    },
    motion: { pressScale: 0.9, pressDuration: 160, releaseDuration: 420, releaseBounce: 0.25 },
  },
  midnight,
)
