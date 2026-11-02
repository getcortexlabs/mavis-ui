export interface AppIconChoice {
  id: string
  label: string
}
export interface AppIconAdapter {
  supported(): boolean
  current(): string | undefined
  select(id: string): Promise<void>
}
export class AppIconError extends Error {
  constructor(
    public readonly code: 'unsupported' | 'configuration' | 'unknown-icon' | 'platform',
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'AppIconError'
  }
}

/** The OS stores selection. Requests are serialized; a rejected request does not block later ones. */
export function createAppIconController(
  choices: readonly AppIconChoice[],
  primary: string,
  adapter: AppIconAdapter,
) {
  const ids = new Set<string>()
  for (const choice of choices) {
    if (!choice.id.trim() || !choice.label.trim() || ids.has(choice.id))
      throw new AppIconError('configuration', 'App icons need unique IDs and visible labels.')
    ids.add(choice.id)
  }
  if (!ids.has(primary))
    throw new AppIconError('configuration', 'The primary icon must be configured.')
  let pending = Promise.resolve()
  const select = (id: string): Promise<void> => {
    if (!ids.has(id))
      return Promise.reject(new AppIconError('unknown-icon', `Unknown app icon: ${id}`))
    const task = pending.then(async () => {
      if (!adapter.supported())
        throw new AppIconError('unsupported', 'This runtime cannot change its launcher icon.')
      if (adapter.current() === id) return
      await adapter.select(id)
    })
    pending = task.catch(() => {})
    return task
  }
  return {
    choices: Object.freeze(choices.map((choice) => Object.freeze({ ...choice }))),
    primary,
    supported: () => adapter.supported(),
    current: () => adapter.current(),
    select,
    reset: () => select(primary),
  }
}
export type AppIconController = ReturnType<typeof createAppIconController>
