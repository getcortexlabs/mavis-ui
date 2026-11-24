export type Session = {
  id: string
  title: string
  start: number
  end: number
  note: string
}
export type SchedulerChange = {
  id: string
  start: number
  end: number
  kind: string
}
