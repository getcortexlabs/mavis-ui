export interface NavigationTransition {
  name?: 'fade' | 'slide' | 'none'
  duration?: number
}
/** Shared policy; routers retain guard, history, cancellation and native-back ownership. */
export function defineNavigationTransition(options: NavigationTransition = {}) {
  const name = options.name ?? 'fade',
    duration = options.duration ?? 220
  if (!['fade', 'slide', 'none'].includes(name))
    throw new TypeError('Navigation transition must be fade, slide or none.')
  if (!Number.isFinite(duration) || duration < 0 || duration > 10000)
    throw new RangeError('Navigation duration must be between 0 and 10000ms.')
  return Object.freeze({ name, duration })
}
