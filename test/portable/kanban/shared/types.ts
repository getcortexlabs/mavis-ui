export type KanbanColumn = {
  id: string
  title: string
  limit: number | undefined
}
export type KanbanCard = {
  id: string
  column: string
  title: string
  description: string | undefined
  disabled: boolean | undefined
}
export type KanbanMove = {
  id: string
  from: string
  to: string
  before: string | undefined
}
