export type SwipeCard = {
  id: string
  title: string
  description: string | undefined
  image: string | undefined
}
export type SwipeDeckEvent = {
  item: SwipeCard
  decision: string
}
