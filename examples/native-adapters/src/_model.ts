import { createMavisTheme } from '@getcortexlabs/mavis/native'
import { mavis, midnight } from '@getcortexlabs/mavis-core'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'

export type State = {
  value: string
  count: number
  disabled: boolean
  loading: boolean
  visible: boolean
}
export const initial: State = {
  value: 'Ada',
  count: 0,
  disabled: false,
  loading: false,
  visible: true,
}
export const theme = createMavisTheme(mavis)
export const isolatedTheme = createMavisTheme(midnight)
export const surface = createMotionSurface()
export const lifecycle = { active: 0, attached: 0, animations: 0 }
surface.use((motion) => {
  lifecycle.active++
  lifecycle.attached++
  const animation = motion.animate({ opacity: [0.7, 1] }, { duration: 60 })
  void animation.finished.then(() => {
    lifecycle.animations++
  })
  return () => {
    lifecycle.active--
    animation.stop()
  }
})
export const bridge: {
  bootstrapped?: boolean
  read?: () => State
  update?: (patch: Partial<State>) => void
  dispose?: () => void
  focus?: () => void
} = {}
