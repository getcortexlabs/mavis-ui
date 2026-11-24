export type Book = {
  id: string
  title: string
  author: string
  pages: number
  note: string | undefined
  lent: boolean
}
export type DataColumn = {
  key: string
  label: string
  sortable: boolean | undefined
  width: number | undefined
  align: string | undefined
}
export type Heading = {
  key: string
  label: string
  width: number | undefined
}
export type DataSort = {
  key: string
  direction: string
}
