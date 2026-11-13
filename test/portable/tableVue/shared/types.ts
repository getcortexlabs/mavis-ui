export type Book = {
  id: string
  title: string
  author: string
  pages: number
  note?: string
  lent: boolean
}
export type Heading = { key: string; label: string; width?: number }
