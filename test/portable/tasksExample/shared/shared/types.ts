export type Filter = 'all' | 'open' | 'done'
export type PriorityOption = { value: string; label: string }

export type Task = {
  id: string
  title: string
  notes: string
  priority: string
  done: boolean
}
