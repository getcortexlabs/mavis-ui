export type TimelineItem = {
  key: string
  title: string
  description: string | undefined
  time: string | undefined
  status: string | undefined
  icon: string | undefined
}
export type Stage = {
  key: string
  title: string
  status: string
}
export type TimelineLabels = {
  complete: string
  current: string
  upcoming: string
  error: string
}
