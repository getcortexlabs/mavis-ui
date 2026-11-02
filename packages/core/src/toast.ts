export type ToastTone = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  message: string
  title?: string
  tone?: ToastTone
  /** Milliseconds after entry. Zero keeps the notification until dismissed. */
  duration?: number
}
export interface ToastMessage {
  readonly id: number
  readonly title?: string
  readonly message: string
  readonly tone: ToastTone
  readonly duration: number
}
export interface ToastController {
  /** Returns undefined after disposal, or after a local host has left. */
  show(options: ToastOptions): number | undefined
  dismiss(id?: number): void
  clear(): void
}
export interface ToastSnapshot {
  readonly message?: ToastMessage
  readonly visible: boolean
}
export interface ToastConnection {
  activate(): void
  deactivate(): void
  pause(reason: string, paused: boolean): void
  begin(id: number): void
  entered(id: number): void
  left(id: number): void
  dispose(): void
}

const queues = new WeakMap<ToastController, ToastQueue>()
let nextId = 0

function notification(options: ToastOptions): ToastMessage {
  if (!options || typeof options.message !== 'string' || !options.message.trim())
    throw new TypeError('Toast message must be a non-empty string')
  if (options.title !== undefined && (typeof options.title !== 'string' || !options.title.trim()))
    throw new TypeError('Toast title must be a non-empty string when supplied')
  const tone = options.tone ?? 'info'
  if (!['success', 'error', 'warning', 'info'].includes(tone))
    throw new RangeError(`Unknown Toast tone: ${String(tone)}`)
  const duration = options.duration ?? 5000
  if (!Number.isFinite(duration) || duration < 0 || duration > 2_147_483_647)
    throw new RangeError('Toast duration must be between 0 and 2147483647 milliseconds')
  return Object.freeze({
    id: ++nextId,
    title: options.title,
    message: options.message,
    tone,
    duration,
  })
}

class ToastQueue {
  items: ToastMessage[] = []
  listener?: (snapshot: ToastSnapshot) => void
  bound = 0
  owner?: object

  constructor(readonly persistent = false) {}
  active = false
  accepting = true
  disposed = false
  presenting = false
  entered = false
  closing = false
  remaining = 0
  started = 0
  timer?: ReturnType<typeof setTimeout>
  pauses = new Set<string>()

  publish() {
    this.listener?.({ message: this.items[0], visible: this.active && !this.closing })
  }
  stop() {
    if (this.timer === undefined) return
    clearTimeout(this.timer)
    this.timer = undefined
    this.remaining = Math.max(0, this.remaining - Math.max(0, Date.now() - this.started))
  }
  run() {
    const item = this.items[0]
    if (
      !item ||
      !item.duration ||
      !this.active ||
      !this.entered ||
      this.closing ||
      this.pauses.size
    )
      return
    if (this.timer !== undefined) return
    this.started = Date.now()
    this.timer = setTimeout(() => {
      this.timer = undefined
      if (this.items[0]?.id === item.id) this.dismiss(item.id)
    }, this.remaining)
  }
  advance() {
    this.stop()
    this.presenting = this.entered = this.closing = false
    this.remaining = this.items[0]?.duration ?? 0
    this.publish()
  }
  show(options: ToastOptions) {
    const item = notification(options)
    if (!this.accepting || this.disposed) return undefined
    this.items.push(item)
    if (this.items.length === 1) this.advance()
    return item.id
  }
  dismiss(id = this.items[0]?.id) {
    const index = this.items.findIndex((item) => item.id === id)
    if (index < 0) return
    if (index > 0) {
      this.items.splice(index, 1)
      return
    }
    if (this.closing) return
    this.stop()
    if (!this.presenting || !this.active) {
      this.items.shift()
      this.advance()
    } else {
      this.closing = true
      this.publish()
    }
  }
  clear() {
    this.items.splice(1)
    this.dismiss()
  }
  deactivate() {
    this.stop()
    this.active = false
    this.pauses.clear()
    if (this.persistent && !this.disposed) {
      if (this.closing) {
        this.items.shift()
        this.remaining = this.items[0]?.duration ?? 0
      }
      this.presenting = this.entered = this.closing = false
      this.publish()
    } else {
      this.accepting = false
      this.items = []
      this.advance()
    }
  }
}

/** Hosts own presentation; a persistent queue survives host replacement until disposed. */
export function createToastController(options: { persistent?: boolean } = {}): ToastController {
  const queue = new ToastQueue(options.persistent)
  const controller: ToastController = Object.freeze({
    show: (options: ToastOptions) => queue.show(options),
    dismiss: (id?: number) => queue.dismiss(id),
    clear: () => queue.clear(),
  })
  queues.set(controller, queue)
  return controller
}

/** @internal Local queues have one host; persistent queues hand off to the latest active host. */
export function connectToast(
  controller: ToastController,
  listener: (snapshot: ToastSnapshot) => void,
): ToastConnection {
  const queue = queues.get(controller)
  if (!queue || queue.disposed) throw new Error('MToast needs an active Mavis Toast controller')
  if (queue.bound && !queue.persistent)
    throw new Error('A Toast controller can only have one MToast host')
  queue.bound++
  const owner = {}
  const pauses = new Set<string>()
  let released = false
  const owns = () => !released && !queue.disposed && queue.owner === owner
  const current = (id: number) => owns() && queue.items[0]?.id === id
  const detach = () => {
    if (queue.owner !== owner) return
    queue.deactivate()
    listener({ visible: false })
    queue.owner = queue.listener = undefined
  }
  listener({ visible: false })
  return {
    activate() {
      if (released || queue.disposed || owns()) return
      if (queue.owner) {
        queue.deactivate()
        queue.listener?.({ visible: false })
      }
      queue.owner = owner
      queue.listener = listener
      queue.pauses = new Set(pauses)
      queue.active = queue.accepting = true
      queue.publish()
      queue.run()
    },
    deactivate() {
      if (released) return
      detach()
      pauses.clear()
    },
    pause(reason, paused) {
      if (released) return
      if (paused) pauses.add(reason)
      else pauses.delete(reason)
      if (!owns()) return
      if (paused) queue.stop()
      queue.pauses = new Set(pauses)
      queue.run()
    },
    begin(id) {
      if (current(id)) queue.presenting = true
    },
    entered(id) {
      if (!current(id) || queue.closing) return
      queue.entered = true
      queue.run()
    },
    left(id) {
      if (!current(id) || !queue.closing) return
      queue.items.shift()
      queue.advance()
    },
    dispose() {
      if (released) return
      detach()
      released = true
      queue.bound--
      pauses.clear()
    },
  }
}

/** @internal Vue scope cleanup also rejects late asynchronous notifications. */
export function disposeToast(controller: ToastController) {
  const queue = queues.get(controller)
  if (!queue) return
  queue.disposed = true
  queue.deactivate()
}
