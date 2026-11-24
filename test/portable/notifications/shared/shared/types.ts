export type Notice = {
  id: string
  title: string
  read?: boolean
  group?: string
  disabled?: boolean
  dismissible?: boolean
  actionLabel?: string
  stamp: number
}
