export type ChartCategory = {
  key: string
  label: string
}
export type ChartSeries = {
  key: string
  label: string
  values: (number | undefined)[]
  color: string | undefined
}
export type ChartSelection = {
  category: string
  series: string
}
