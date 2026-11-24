export type Notice = {
  id: string
  title: string
  read: boolean | undefined
  group: string | undefined
  disabled: boolean | undefined
  dismissible: boolean | undefined
  actionLabel: string | undefined
  stamp: number
}
